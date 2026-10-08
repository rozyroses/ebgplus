import StudioTools from './StudioTools'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { restoreAuth, signIn, signOut, type AuthState } from '../../src/lib/auth'
import { db } from '../../src/lib/supabase'
import {
  createStudioProject,
  loadMyStudioProjects,
  loadProjectCms,
  loadCmsData,
  saveProjectCms,
  updateCastingApplicationStatus,
  uploadStudioProjectMedia,
  type StudioProject,
} from '../../src/lib/studioData'
import {
  createPoll,
  deletePoll,
  loadPollResults,
  loadPolls,
  updatePoll,
  type Poll,
  type PollResult,
} from '../../src/lib/pollData'

const StudioPublishingCenter = lazy(() => import('./StudioPublishingCenter'))
const StudioMedia = lazy(() => import('./StudioMedia'))
const StudioInbox = lazy(() => import('./StudioInbox'))
const StudioAnalytics = lazy(() => import('./StudioAnalytics'))
const StudioNewsroom = lazy(() => import('./StudioNewsroom'))
const FormsNetworkWorkspace = lazy(() => import('./FormsNetworkWorkspace'))

type StaffRole = 'editor' | 'producer' | 'administrator' | 'founder'
type PublishStatus = 'draft' | 'scheduled' | 'live' | 'archived'

type CastMember = {
  name: string
  role: string
  city: string
  bio: string
  image?: string
  social?: string
  status?: string
}

type Show = {
  id: string
  title: string
  category: string
  description: string
  genre: string
  year: number
  maturity: string
  status: string
  artwork: string
  banner?: string
  logo: string
  logoImage?: string
  homeVisible?: boolean
  cast: CastMember[]
}

type Episode = {
  id: string
  showId: string
  season: number
  number: number
  title: string
  synopsis: string
  runtime: string
  releaseDate: string
  thumbnail: string
  videoUrl: string
  publishStatus?: PublishStatus
}

type NotificationItem = {
  id: string
  title?: string
  text: string
  date: string
  read: boolean
  audience?: 'all' | 'subscribers' | 'staff'
  status?: 'draft' | 'scheduled' | 'sent'
  link?: string
}

type CmsData = {
  slogan: string
  heroShowId: string
  shows: Show[]
  episodes: Episode[]
  rails: Array<{ id: string; title: string; showIds: string[] }>
  comingSoon: string[]
  notifications?: NotificationItem[]
}

type CastingApplication = {
  id: string
  show_id?: string
  legal_name: string
  age: number
  city_state: string
  email: string
  relationship_goals: string
  camera_comfort: string
  status: 'New' | 'Reviewing' | 'Callback' | 'Interview' | 'Finalist' | 'Cast' | 'Declined' | 'Removed'
  source?: string
  created_at?: string
}

type TeamAccount = {
  id: string
  email: string | null
  role: string
  created_at?: string
}

// EBG_STUDIO_V4_GLOBAL_WORKSPACES
// V4_BUILD_COMPAT_2_V2
type StudioTab = 'settings' | 'inbox' | 'analytics' | 'forms' | 'publishing' | 'overview' | 'lumi' | 'music' | 'series' | 'episodes' | 'talent' | 'casting' | 'polls' | 'media' | 'notifications' | 'team'

const STAFF_ROLES = new Set<StaffRole>(['editor', 'producer', 'administrator', 'founder'])
const CASTING_STATUSES: CastingApplication['status'][] = ['New', 'Reviewing', 'Callback', 'Interview', 'Finalist', 'Cast', 'Declined', 'Removed']
const TABS: Array<{ id: StudioTab; label: string; icon: string }> = [
  { id: 'analytics', label: 'Analytics', icon: '▥' },
  { id: 'overview', label: 'Overview', icon: '⌂' },
  { id: 'lumi', label: 'Chat', icon: '✦' },
  { id: 'music', label: 'Music', icon: '♫' },
  { id: 'publishing', label: 'Review & Publish', icon: '✓' },
  { id: 'episodes', label: 'Episodes', icon: '▶' },
  { id: 'notifications', label: 'News & Notifications', icon: '◌' },
  { id: 'series', label: 'Series', icon: '▣' },
  { id: 'talent', label: 'Cast & Talent', icon: '◎' },
  { id: 'casting', label: 'Casting', icon: '◇' },
  { id: 'inbox', label: 'Inbox', icon: '✉' },
  { id: 'forms', label: 'Forms', icon: '▤' },
  { id: 'polls', label: 'Polls & Voting', icon: '◉' },
  { id: 'media', label: 'Media', icon: '▧' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'team', label: 'Team', icon: '♙' },
]

const emptyCms: CmsData = {
  slogan: 'Stories live here.',
  heroShowId: '',
  shows: [],
  episodes: [],
  rails: [],
  comingSoon: [],
  notifications: [],
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const nowIso = () => new Date().toISOString()
const parseTab = (): StudioTab => {
  const value = window.location.hash.replace(/^#\/?/, '') as StudioTab
  return TABS.some((tab) => tab.id === value) ? value : 'overview'
}

// EBG_STUDIO_V3_SHELL
type StudioWorkspaceId = 'overview' | 'content' | 'audience' | 'tools'
type StudioTool = StudioTab | 'forms' | 'inbox' | 'music' | 'news' | 'lumi'

const TOOL_LABELS: Record<string, string> = {
  overview: 'Overview',
  series: 'Series',
  episodes: 'Episodes',
  media: 'Media',
  music: 'Music',
  publishing: 'Review & Publish',
  analytics: 'Analytics',
  talent: 'Cast & Talent',
  casting: 'Casting',
  forms: 'Forms',
  inbox: 'Inbox',
  polls: 'Polls & Voting',
  notifications: 'Notifications',
  news: 'News',
  team: 'Team',
  settings: 'Settings',
  lumi: 'Lumi',
}

const STUDIO_WORKSPACES: Array<{ id: StudioWorkspaceId; label: string; icon: string; copy: string; tools: StudioTool[] }> = [
  { id: 'overview', label: 'Overview', icon: '✦', copy: 'What needs your attention right now.', tools: ['overview'] },
  { id: 'content', label: 'Content', icon: '▤', copy: 'Shows, episodes, media, and music.', tools: ['series', 'episodes', 'media', 'music', 'publishing'] },
  { id: 'audience', label: 'Audience', icon: '◎', copy: 'Talent, casting, forms, messages, polls, and updates.', tools: ['analytics', 'talent', 'casting', 'forms', 'inbox', 'polls', 'notifications'] },
  { id: 'tools', label: 'Tools', icon: '⌘', copy: 'Newsroom, team access, and Lumi.', tools: ['team', 'settings', 'lumi'] },
]

const readStudioTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('ebg.studio.theme.v1')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function StudioThemeToggle({ theme, onChange }: { theme: 'light' | 'dark'; onChange: (next: 'light' | 'dark') => void }) {
  const next = theme === 'light' ? 'dark' : 'light'
  return <button className="studio-theme-toggle" type="button" onClick={() => onChange(next)} aria-label={`Switch to ${next} mode`}>
    <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span><strong>{theme === 'light' ? 'Dark' : 'Light'}</strong>
  </button>
}

function App() {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [booting, setBooting] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    void restoreAuth()
      .then(setAuthState)
      .finally(() => setBooting(false))
  }, [])

  if (booting) {
    return <main className="studio-boot"><span className="studio-mark">EBG</span><p>Opening Studio…</p></main>
  }

  if (!authState) {
    return <StudioSignIn onSignedIn={setAuthState} error={authError} setError={setAuthError} />
  }

  const accountType = authState.account.account_type ?? (authState.account.role === 'founder' ? 'founder' : authState.account.role === 'producer' ? 'producer' : 'viewer')
  const canUseStudio = STAFF_ROLES.has(authState.account.role as StaffRole) || ['creator', 'producer', 'founder'].includes(accountType)

  if (!canUseStudio) {
    return (
      <main className="studio-auth-page">
        <section className="auth-card denied">
          <span className="studio-mark">EBG</span>
          <p className="eyebrow">CREATOR ACCESS</p>
          <h1>This account doesn’t have Studio access.</h1>
          <p>{authState.account.email}</p>
          <button className="button" type="button" onClick={() => void signOut().then(() => setAuthState(null))}>Sign out</button>
        </section>
      </main>
    )
  }

  return <StudioWorkspace authState={authState} onSignedOut={() => setAuthState(null)} />
}

function StudioSignIn({
  onSignedIn,
  error,
  setError,
}: {
  onSignedIn: (state: AuthState) => void
  error: string
  setError: (value: string) => void
}) {
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const state = await signIn(String(form.get('email') ?? ''), String(form.get('password') ?? ''))
      onSignedIn(state)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in to EBG Studio.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="studio-auth-page">
      <section className="auth-card">
        <span className="studio-mark">EBG</span>
        <p className="eyebrow">CREATOR · PRODUCER · STAFF</p>
        <h1>Studio</h1>
        <p>Manage the EBG+ slate, releases, talent, audience tools, and production media.</p>
        <form onSubmit={submit}>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Enter Studio'}</button>
        </form>
        <a className="text-link" href="https://ebgplus.app">← Back to EBG+</a>
      </section>
    </main>
  )
}

function StudioWorkspace({ authState, onSignedOut }: { authState: AuthState; onSignedOut: () => void }) {
  const [tab, setTabState] = useState<StudioTab>(parseTab)
  const [activeTool, setActiveTool] = useState<StudioTool>(() => (window.location.hash.replace(/^#\/?/, '') || 'overview') as StudioTool)
  const [theme, setTheme] = useState<'light' | 'dark'>(readStudioTheme)
  const [cms, setCms] = useState<CmsData>(emptyCms)
  const [projects, setProjects] = useState<Array<StudioProject & { cms: CmsData }>>([])
  const [projectId, setProjectId] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [casting, setCasting] = useState<CastingApplication[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [pollResults, setPollResults] = useState<Record<string, PollResult[]>>({})
  const [team, setTeam] = useState<TeamAccount[]>([])
  const [showId, setShowId] = useState('')
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')

  const setTab = (next: StudioTab) => {
    window.location.hash = next
    setTabState(next)
    setActiveTool(next)
  }

  const goToTool = (next: StudioTool) => {
    window.location.hash = next
    setActiveTool(next)
    if (TABS.some((item) => item.id === next)) setTabState(next as StudioTab)
    else setTabState('overview')
  }

  useEffect(() => {
    const sync = () => {
      const raw = (window.location.hash.replace(/^#\/?/, '') || 'overview') as StudioTool
      setActiveTool(raw)
      setTabState(parseTab())
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.studioTheme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('ebg.studio.theme.v1', theme)
  }, [theme])

  useEffect(() => {
    const reload = (event: Event) => {
      if ((event as CustomEvent<{ projectId: string }>).detail?.projectId !== projectId) return
      void loadProjectCms<CmsData>(projectId).then((next) => { if (next) setCms(next) })
        .catch(() => setMessage('Project saved. Reopen Studio to refresh the overview.'))
    }
    window.addEventListener('ebg-studio-cms-saved', reload)
    return () => window.removeEventListener('ebg-studio-cms-saved', reload)
  }, [projectId])

  const refreshAuxiliary = async () => {
    const token = authState.session.access_token
    const [nextCasting, nextPolls, nextTeam] = await Promise.all([
      db.select<CastingApplication>('casting_applications', 'order=created_at.desc', token).catch(() => []),
      loadPolls(undefined, true).catch(() => []),
      db.select<TeamAccount>('accounts', 'order=created_at.asc', token).catch(() => []),
    ])
    setCasting(nextCasting)
    setPolls(nextPolls)
    setTeam(nextTeam)
  }

  useEffect(() => {
    setBusy(true)
    void loadMyStudioProjects<CmsData>()
      .then((items) => {
        setProjects(items)
        const preferredId = localStorage.getItem('ebg.studio.project.v1')
        const first = items.find((item) => item.id === preferredId) ?? items[0]
        if (first) {
          setProjectId(first.id)
          const value = first.cms && Object.keys(first.cms).length ? first.cms : emptyCms
          setCms(value)
          setShowId(value.shows?.[0]?.id ?? '')
        } else {
          setCms(emptyCms)
          setShowId('')
        }
        setBusy(false)
        const staff = STAFF_ROLES.has(authState.account.role as StaffRole)
        if (staff) void refreshAuxiliary().catch((err) => setMessage(err instanceof Error ? err.message : 'Some Studio data is still loading.'))
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Studio projects could not be loaded.')
        setBusy(false)
      })
  }, [])

  useEffect(() => {
    if (!projectId) return
    localStorage.setItem('ebg.studio.project.v1', projectId)
    window.dispatchEvent(new CustomEvent('ebg-studio-project-change', { detail: { projectId } }))
    setBusy(true)
    void loadProjectCms<CmsData>(projectId)
      .then((nextCms) => {
        const value = nextCms && Object.keys(nextCms).length ? nextCms : emptyCms
        setCms(value)
        setShowId(value.shows?.[0]?.id ?? '')
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : 'This project could not be loaded.'))
      .finally(() => setBusy(false))
  }, [projectId])

  const [networkCms, setNetworkCms] = useState<CmsData | null>(null)
  useEffect(() => {
    let active = true
    const refresh = () => void loadCmsData<CmsData>().then(value => { if (active) setNetworkCms(value) }).catch(() => { if (active) setNetworkCms(null) })
    refresh()
    window.addEventListener('ebg-studio-catalog-saved', refresh)
    return () => { active = false; window.removeEventListener('ebg-studio-catalog-saved', refresh) }
  }, [tab])
  const overviewCms = networkCms ?? emptyCms

  const selectedShow = useMemo(() => cms.shows.find((show) => show.id === showId) ?? cms.shows[0] ?? null, [cms.shows, showId])
  const selectedEpisodes = useMemo(() => selectedShow ? cms.episodes.filter((episode) => episode.showId === selectedShow.id) : [], [cms.episodes, selectedShow])

  const commitCms = async (next: CmsData, success?: string) => {
    if (!projectId) {
      setMessage('Create or select a Studio project first.')
      return
    }
    setCms(next)
    try {
      await saveProjectCms(projectId, next)
      setProjects((items) => items.map((project) => project.id === projectId ? { ...project, cms: next, updated_at: new Date().toISOString() } : project))
      if (success) setMessage(success)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Changes could not be saved.')
    }
  }

  const createProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    setCreatingProject(true)
    setMessage('')
    try {
      const project = await createStudioProject<CmsData>({
        title,
        projectKind: String(form.get('projectKind') ?? 'show') as StudioProject['project_kind'],
        cms: emptyCms,
      })
      setProjects((items) => [project, ...items])
      setProjectId(project.id)
      setCms(emptyCms)
      setShowId('')
      formElement.reset()
      setMessage(`${project.title} created.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Project could not be created.')
    } finally {
      setCreatingProject(false)
    }
  }

  const updateShow = (showIdToUpdate: string, patch: Partial<Show>, success?: string) =>
    commitCms({ ...cms, shows: cms.shows.map((show) => show.id === showIdToUpdate ? { ...show, ...patch } : show) }, success)

  const createSeries = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    setBusy(true)
    try {
      const artFile = form.get('artwork')
      const artwork = artFile instanceof File && artFile.size ? await uploadStudioProjectMedia(artFile, projectId, 'shows/posters') : ''
      const base = slugify(title) || `series-${Date.now()}`
      const id = cms.shows.some((show) => show.id === base) ? `${base}-${Date.now()}` : base
      const nextShow: Show = {
        id,
        title,
        category: String(form.get('category') ?? 'EBG+ Original'),
        description: String(form.get('description') ?? ''),
        genre: String(form.get('genre') ?? ''),
        year: Number(form.get('year') ?? new Date().getFullYear()),
        maturity: String(form.get('maturity') ?? 'TV-14'),
        status: String(form.get('status') ?? 'Coming Soon'),
        artwork,
        logo: title,
        homeVisible: true,
        cast: [],
      }
      await commitCms({ ...cms, shows: [...cms.shows, nextShow] }, `${title} created.`)
      setShowId(id)
      formElement.reset()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Series could not be created.')
    } finally {
      setBusy(false)
    }
  }

  const duplicateSeries = (show: Show) => {
    const id = `${slugify(show.title)}-copy-${Date.now()}`
    const copy: Show = { ...show, id, title: `${show.title} Copy`, status: 'Coming Soon', homeVisible: false, cast: show.cast.map((person) => ({ ...person })) }
    void commitCms({ ...cms, shows: [...cms.shows, copy] }, `${copy.title} created.`)
    setShowId(id)
  }

  const deleteSeries = (show: Show) => {
    if (!window.confirm(`Delete “${show.title}” and its episodes?`)) return
    const remaining = cms.shows.filter((item) => item.id !== show.id)
    const next: CmsData = {
      ...cms,
      heroShowId: cms.heroShowId === show.id ? (remaining[0]?.id ?? '') : cms.heroShowId,
      shows: remaining,
      episodes: cms.episodes.filter((episode) => episode.showId !== show.id),
      rails: cms.rails.map((rail) => ({ ...rail, showIds: rail.showIds.filter((id) => id !== show.id) })),
      comingSoon: cms.comingSoon.filter((id) => id !== show.id),
    }
    void commitCms(next, 'Series deleted.')
    setShowId(remaining[0]?.id ?? '')
  }

  const createEpisode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedShow) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const video = form.get('video')
    if (!(video instanceof File) || !video.size) return setMessage('Choose an episode video first.')
    setBusy(true)
    try {
      const thumbnailFile = form.get('thumbnail')
      const videoUrl = await uploadStudioProjectMedia(video, projectId, `episodes/${selectedShow.id}`)
      const thumbnail = thumbnailFile instanceof File && thumbnailFile.size
        ? await uploadStudioProjectMedia(thumbnailFile, projectId, `episodes/${selectedShow.id}/thumbnails`)
        : selectedShow.artwork
      const releaseInput = String(form.get('releaseDate') ?? '')
      const status = String(form.get('publishStatus') ?? 'draft') as PublishStatus
      if (status === 'scheduled' && !releaseInput) throw new Error('Choose a release date before scheduling.')
      const season = Number(form.get('season') ?? 1)
      const number = Number(form.get('number') ?? 1)
      const episode: Episode = {
        id: `${selectedShow.id}-s${season}e${number}-${Date.now()}`,
        showId: selectedShow.id,
        season,
        number,
        title: String(form.get('title') ?? '').trim(),
        synopsis: String(form.get('synopsis') ?? ''),
        runtime: String(form.get('runtime') ?? ''),
        releaseDate: status === 'live' ? nowIso() : releaseInput ? new Date(releaseInput).toISOString() : nowIso(),
        thumbnail,
        videoUrl,
        publishStatus: status,
      }
      await commitCms({ ...cms, episodes: [...cms.episodes, episode] }, `${episode.title} saved.`)
      formElement.reset()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Episode could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  const updateEpisode = (episodeId: string, patch: Partial<Episode>, success?: string) =>
    commitCms({ ...cms, episodes: cms.episodes.map((episode) => episode.id === episodeId ? { ...episode, ...patch } : episode) }, success)

  const duplicateEpisode = (episode: Episode) => {
    const copy: Episode = { ...episode, id: `${episode.id}-copy-${Date.now()}`, title: `${episode.title} Copy`, publishStatus: 'draft', releaseDate: nowIso() }
    void commitCms({ ...cms, episodes: [...cms.episodes, copy] }, `${copy.title} created as draft.`)
  }

  const addTalent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedShow) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setBusy(true)
    try {
      const imageFile = form.get('image')
      const image = imageFile instanceof File && imageFile.size ? await uploadStudioProjectMedia(imageFile, projectId, `series/${selectedShow.id}/cast`) : undefined
      const person: CastMember = {
        name: String(form.get('name') ?? ''),
        role: String(form.get('role') ?? 'Cast'),
        city: String(form.get('city') ?? ''),
        bio: String(form.get('bio') ?? ''),
        social: String(form.get('social') ?? '') || undefined,
        status: String(form.get('status') ?? 'Active'),
        image,
      }
      await updateShow(selectedShow.id, { cast: [...selectedShow.cast, person] }, `${person.name} added.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const changeCastingStatus = async (application: CastingApplication, status: CastingApplication['status']) => {
    try {
      await updateCastingApplicationStatus(application.id, status)
      setCasting((items) => items.map((item) => item.id === application.id ? { ...item, status } : item))
      setMessage(`${application.legal_name} moved to ${status}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Casting status could not be updated.')
    }
  }

  const createStudioPoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedShow) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const options = String(form.get('options') ?? '').split('\n').map((value) => value.trim()).filter(Boolean)
    if (options.length < 2) return setMessage('Add at least two poll options.')
    try {
      await createPoll({
        showId: selectedShow.id,
        question: String(form.get('question') ?? ''),
        description: String(form.get('description') ?? ''),
        options,
        status: String(form.get('status') ?? 'draft') as Poll['status'],
        opensAt: String(form.get('opensAt') ?? '') || null,
        closesAt: String(form.get('closesAt') ?? '') || null,
        resultsVisibility: String(form.get('resultsVisibility') ?? 'live') as Poll['results_visibility'],
      })
      setPolls(await loadPolls(undefined, true))
      formElement.reset()
      setMessage('Poll created.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Poll could not be created.')
    }
  }

  const showPollResults = async (poll: Poll) => {
    try {
      const results = await loadPollResults(poll.id)
      setPollResults((current) => ({ ...current, [poll.id]: results }))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Poll results could not be loaded.')
    }
  }

  const replaceShowMedia = async (field: 'artwork' | 'banner' | 'logoImage', file?: File) => {
    if (!selectedShow || !file?.size) return
    setBusy(true)
    try {
      const folder = field === 'artwork' ? 'shows/posters' : field === 'banner' ? 'shows/banners' : 'shows/logos'
      const url = await uploadStudioProjectMedia(file, projectId, folder)
      await updateShow(selectedShow.id, { [field]: url } as Partial<Show>, 'Media updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Media upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const createNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const status = String(form.get('status') ?? 'draft') as NotificationItem['status']
    const publishAt = String(form.get('publishAt') ?? '')
    if (status === 'scheduled' && !publishAt) return setMessage('Choose a date before scheduling.')
    const item: NotificationItem = {
      id: `studio-notice-${Date.now()}`,
      title: String(form.get('title') ?? ''),
      text: String(form.get('text') ?? ''),
      date: status === 'sent' ? nowIso() : publishAt ? new Date(publishAt).toISOString() : nowIso(),
      read: false,
      audience: String(form.get('audience') ?? 'all') as NotificationItem['audience'],
      status,
      link: String(form.get('link') ?? '') || undefined,
    }
    await commitCms({ ...cms, notifications: [item, ...(cms.notifications ?? [])] }, status === 'sent' ? 'Notification sent.' : 'Notification saved.')
    formElement.reset()
  }

  const signOutNow = async () => {
    await signOut()
    onSignedOut()
  }

  if (busy && !cms.shows.length) {
    return <main className="studio-boot"><span className="studio-mark">EBG</span><p>Loading production data…</p></main>
  }

  if (!busy && !projectId) {
    return (
      <main className="studio-project-onboarding">
        <section className="studio-project-onboarding-card">
          <span className="studio-mark">EBG</span>
          <p className="eyebrow">YOUR PRIVATE STUDIO</p>
          <h1>Create your first Studio project.</h1>
          <p>Projects can be shows, music, or mixed worlds — each with its own private uploads, catalog, chats, and publishing workspace.</p>
          <form onSubmit={createProject}>
            <label>Project name<input name="title" required maxLength={120} placeholder="e.g. Heartspell House, Bijou Nicole, or Channel 3" /></label>
            <label>Project type
              <select name="projectKind" defaultValue="show">
                <option value="show">Show / Series</option>
                <option value="music">Music</option>
                <option value="mixed">Mixed / Universe</option>
              </select>
            </label>
            {message && <p className="form-error">{message}</p>}
            <button className="button" type="submit" disabled={creatingProject}>{creatingProject ? 'Creating…' : 'Create Project'}</button>
          </form>
          <button className="text-link project-signout" type="button" onClick={() => void signOutNow()}>Sign out</button>
        </section>
      </main>
    )
  }

  const activeEpisodes = cms.episodes.filter((episode) => episode.publishStatus === 'live').length
  const openPolls = polls.filter((poll) => poll.status === 'open').length
  const openCasting = casting.filter((app) => !['Cast', 'Declined', 'Removed'].includes(app.status)).length
  const activeWorkspace = STUDIO_WORKSPACES.find((workspace) => workspace.tools.includes(activeTool)) ?? STUDIO_WORKSPACES[0]

  return (
    <div className="studio-shell studio-v3-shell">
      <aside className="sidebar studio-compat-nav" aria-hidden="true">
        <nav>
          {TABS.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)}>{item.label}</button>)}
        </nav>
      </aside>

      <div className="studio-main">
        <header className="studio-v3-topbar">
          <button className="studio-v3-brand" type="button" onClick={() => goToTool('overview')}>
            <span>EBG+</span><strong>Studio</strong><em>3</em>
          </button>

          <nav className="studio-v3-workspaces" aria-label="Studio workspaces">
            {STUDIO_WORKSPACES.map((workspace) => (
              <button key={workspace.id} type="button" className={activeWorkspace.id === workspace.id ? 'active' : ''} onClick={() => goToTool(workspace.tools[0])}>
                <span>{workspace.icon}</span><strong>{workspace.label}</strong>
              </button>
            ))}
          </nav>

          <div className="studio-v3-actions">
            <details className="studio-v3-new-project">
              <summary>＋ New</summary>
              <form onSubmit={createProject}>
                <strong>New production</strong>
                <label>Name<input name="title" required maxLength={120} placeholder="Production name" /></label>
                <label>Type<select name="projectKind" defaultValue="show"><option value="show">Show / Series</option><option value="music">Music</option><option value="mixed">Mixed / Universe</option></select></label>
                <button type="submit" disabled={creatingProject}>{creatingProject ? 'Creating…' : 'Create'}</button>
              </form>
            </details>

            <StudioThemeToggle theme={theme} onChange={setTheme} />
            <a className="studio-v3-view" href="https://ebgplus.app" target="_blank" rel="noreferrer">View EBG+ ↗</a>
          </div>
        </header>

        <section className="studio-v3-context">
          <div>
            <p>EBG Studio / {activeWorkspace.label}</p>
            <h1>{TOOL_LABELS[activeTool] ?? activeWorkspace.label}</h1>
            <span>{activeWorkspace.copy}</span>
          </div>
          <nav className="studio-v3-tools" aria-label={activeWorkspace.label + " tools"}>
            {activeWorkspace.tools.map((tool) => <button key={tool} type="button" className={activeTool === tool ? 'active' : ''} onClick={() => goToTool(tool)}>{TOOL_LABELS[tool]}</button>)}
          </nav>
          <div className="studio-v3-account"><span>{authState.account.role}</span><strong>{authState.account.email}</strong><button type="button" onClick={() => void signOutNow()}>Sign out</button></div>
        </section>

        {message && <div className="message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        <main className="workspace…20381 tokens truncated…msData(cms)} /></label>
                    <label>Maturity<input value={selected.maturity} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, maturity: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Year<input type="number" value={selected.year} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, year: Number(event.target.value) } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Homepage<select value={selected.homeVisible === false ? 'hidden' : 'visible'} onChange={(event) => void patchSelected({ homeVisible: event.target.value === 'visible' }, 'Homepage visibility updated.')}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label>
                    <label className="full">Description<textarea value={selected.description} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, description: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                  </div>
                  <div className="series-v2-actions">
                    <button className="button" type="button" onClick={() => void save({ ...cms, heroShowId: selected.id }, `${selected.title} is now featured.`)}>Set as featured</button>
                    <button className="button secondary" type="button" onClick={() => { window.location.hash = 'episodes' }}>Manage {type === 'movie' ? 'video' : 'episodes'} →</button>
                    <button className="button secondary" type="button" onClick={() => { window.location.hash = 'talent' }}>Cast & talent →</button>
                  </div>
                </section>

                <section className="series-v2-card">
                  <div className="series-v2-card-head"><div><span>BRAND ASSETS</span><h3>Artwork</h3></div><small>Poster · Banner · Logo</small></div>
                  <div className="series-v2-media-grid">
                    <div className="series-v2-asset"><span>Poster</span><div className="series-v2-poster-preview">{selected.artwork ? <img src={selected.artwork} alt="" /> : <b>No poster</b>}</div><ArtworkControls label="Poster" value={selected.artwork} busy={busy} onReplace={(file) => updateAsset('artwork', file)} onDelete={() => updateAsset('artwork')} /></div>
                    <div className="series-v2-asset"><span>Banner</span><div className="series-v2-banner-preview">{selected.banner ? <img src={selected.banner} alt="" /> : <b>No banner</b>}</div><ArtworkControls label="Banner" value={selected.banner} busy={busy} onReplace={(file) => updateAsset('banner', file)} onDelete={() => updateAsset('banner')} /></div>
                    <div className="series-v2-asset"><span>Logo</span><div className="series-v2-logo-preview">{selected.logoImage ? <img src={selected.logoImage} alt="" /> : <b>{selected.logo || selected.title}</b>}</div><ArtworkControls label="Logo" value={selected.logoImage} busy={busy} onReplace={(file) => updateAsset('logoImage', file)} onDelete={() => updateAsset('logoImage')} /></div>
                  </div>
                </section>
              </>
            )}

            <section className="series-v2-card series-v2-create">
              <div className="series-v2-card-head"><div><span>NEW TITLE</span><h3>Add to the slate</h3></div><small>Create a series or movie</small></div>
              <form className="series-v2-form-grid" onSubmit={createTitle}>
                <label>Title<input name="title" required /></label>
                <label>Content type<select name="contentType" defaultValue="series"><option value="series">Series</option><option value="movie">Movie</option></select></label>
                <label>Category<input name="category" defaultValue="EBG+ Original" /></label>
                <label>Genre<input name="genre" /></label>
                <label>Year<input name="year" type="number" defaultValue={new Date().getFullYear()} /></label>
                <label>Maturity<select name="maturity" defaultValue="TV-14"><option>TV-PG</option><option>TV-14</option><option>TV-MA</option><option>PG</option><option>PG-13</option><option>R</option></select></label>
                <label>Status<select name="status" defaultValue="Coming Soon"><option>Coming Soon</option><option>Now Streaming</option><option>Current</option><option>Completed</option></select></label>
                <label>Poster<input name="artwork" type="file" accept="image/*" /></label>
                <label className="full">Description<textarea name="description" /></label>
                <div className="full"><button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create title'}</button></div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
