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
    return <main className="studio-boot"><img className="studio-smoke-logo" src="/branding/ebgplus-smoke.svg" alt="EBG+" /><p>Opening Studio…</p></main>
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
          <img className="studio-smoke-logo" src="/branding/ebgplus-smoke.svg" alt="EBG+" />
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
        <img className="studio-smoke-logo" src="/branding/ebgplus-smoke.svg" alt="EBG+" />
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
  const theme = 'dark'
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
    document.documentElement.dataset.theme = 'dark'
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
    return <main className="studio-boot"><img className="studio-smoke-logo" src="/branding/ebgplus-smoke.svg" alt="EBG+" /><p>Loading production data…</p></main>
  }

  if (!busy && !projectId) {
    return (
      <main className="studio-project-onboarding">
        <section className="studio-project-onboarding-card">
          <img className="studio-smoke-logo" src="/branding/ebgplus-smoke.svg" alt="EBG+" />
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
            <img className="studio-smoke-logo" src="/branding/ebgplus-smoke.svg" alt="EBG+" /><strong>Studio</strong>
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

        <main className="workspace">
          <StudioTools />
          {tab === 'notifications' && <Suspense fallback={<p>Opening newsroom…</p>}><StudioNewsroom projectId={projectId} /></Suspense>}
          {tab === 'settings' && <section className="panel connected-studio-settings"><h2>Studio settings</h2><p>Manage this workspace and your signed-in account.</p><label>Active production<select value={projectId} onChange={event=>setProjectId(event.target.value)}>{projects.map(project=><option key={project.id} value={project.id}>{project.title}</option>)}</select></label><p>Switching production updates project uploads, music, Lumi, and publishing. Series, casting, forms, inbox, and analytics use the shared EBG+ network.</p><div><strong>{authState.account.email}</strong><p>Role: {authState.account.role}</p></div><a className="button secondary" href="https://ebgplus.app/app/settings" target="_blank" rel="noreferrer">Profile & playback settings ↗</a><a className="button secondary" href="https://ebgplus.app/auth/forgot-password" target="_blank" rel="noreferrer">Reset password ↗</a><button className="button secondary" onClick={()=>window.location.reload()}>Reload Studio data</button><button className="button secondary" onClick={()=>void signOutNow()}>Sign out of Studio</button></section>}
          {tab === 'inbox'  && <Suspense fallback={<p>Opening inbox…</p>}><StudioInbox /></Suspense>}
          {tab === 'analytics' && <Suspense fallback={<p>Opening analytics…</p>}><StudioAnalytics /></Suspense>}
          {tab === 'forms' && <Suspense fallback={<p>Opening forms…</p>}><FormsNetworkWorkspace /></Suspense>}
          {tab === 'publishing' && <Suspense fallback={<p>Opening publishing center…</p>}><StudioPublishingCenter key={projectId} projectId={projectId} /></Suspense>}
          {tab === 'overview' && (
            <>
              <section className="hero-panel"><div><p className="eyebrow">STUDIO HQ</p><h2>Everything EBG+.<br />One control room.</h2><p>Chat with Lumi, upload music, publish episodes, and send news or notifications from one Studio.</p><div className="hero-actions"><button className="button" onClick={() => setTab('lumi')}>Open Lumi</button><button className="button secondary" onClick={() => setTab('music')}>Upload music</button><button className="button secondary" onClick={() => setTab('episodes')}>Post episode</button></div></div><div className="hero-stat"><strong>{projects.length}</strong><span>Studio project{projects.length === 1 ? '' : 's'}</span></div></section>
              <details className="panel studio-project-switcher"><summary>Switch production</summary><div className="form-grid">
            <label className="studio-v3-project">
              <span>Project</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
            </label>

            {overviewCms.shows.length > 0 && <label className="studio-v3-production"><span>Title</span><select value={selectedShow?.id ?? ''} onChange={(event) => setShowId(event.target.value)}>{overviewCms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>}
              </div></details>
              <section className="stats-grid">
                <Stat label="Series" value={overviewCms.shows.length} detail={`${overviewCms.shows.filter((show) => show.status === 'Now Streaming' || show.status === 'Current').length} active`} />
                <Stat label="Episodes" value={overviewCms.episodes.length} detail={`${overviewCms.episodes.filter(episode => episode.publishStatus === 'live').length} live`} />
                <Stat label="Casting" value={openCasting} detail={`${casting.length} total`} />
                <Stat label="Live polls" value={openPolls} detail={`${polls.length} total`} />
              </section>

              <section className="two-column">
                <div className="panel"><PanelHeading eyebrow="RECENT RELEASES" title="Episodes" /><div className="compact-list">{[...overviewCms.episodes].sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate)).slice(0, 5).map((episode) => <article key={episode.id}><img src={episode.thumbnail || overviewCms.shows.find((show) => show.id === episode.showId)?.artwork} alt="" /><div><strong>{episode.title}</strong><span>{overviewCms.shows.find((show) => show.id === episode.showId)?.title} · S{episode.season}E{episode.number}</span></div><em>{episode.publishStatus ?? 'scheduled'}</em></article>)}</div></div>
                <div className="panel"><PanelHeading eyebrow="CURRENT SLATE" title="Series" /><div className="poster-grid">{overviewCms.shows.slice(0, 6).map((show) => <button key={show.id} type="button" onClick={() => { setShowId(show.id); setTab('series') }}><div className="poster-image">{show.artwork ? <img src={show.artwork} alt="" /> : <span>{show.title.slice(0, 1)}</span>}</div><strong>{show.title}</strong><span>{show.status}</span></button>)}</div></div>
              </section>
            </>
          )}







          {tab === 'casting' && (
            <section className="panel"><PanelHeading eyebrow="CASTING PIPELINE" title="Applications" /><div className="table-wrap"><table><thead><tr><th>Name</th><th>Series</th><th>Location</th><th>Email</th><th>Status</th></tr></thead><tbody>{casting.map((application) => <tr key={application.id}><td><strong>{application.legal_name}</strong><span>{application.age} years old</span></td><td>{cms.shows.find((show) => show.id === application.show_id)?.title ?? application.show_id ?? 'General'}</td><td>{application.city_state}</td><td>{application.email}</td><td><select value={application.status} onChange={(event) => void changeCastingStatus(application, event.target.value as CastingApplication['status'])}>{CASTING_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div></section>
          )}

          {tab === 'polls' && selectedShow && (
            <>
              <section className="panel"><PanelHeading eyebrow="AUDIENCE" title="Polls & Voting" /><div className="poll-list">{polls.filter((poll) => poll.show_id === selectedShow.id).map((poll) => <article key={poll.id}><div><span className="eyebrow">{poll.status}</span><h3>{poll.question}</h3><p>{poll.description}</p></div><div className="poll-actions"><select value={poll.status} onChange={async (event) => { await updatePoll(poll.id, { status: event.target.value as Poll['status'] }); setPolls(await loadPolls(undefined, true)); setMessage('Poll updated.') }}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select><button className="button secondary" type="button" onClick={() => void showPollResults(poll)}>Results</button><button className="button danger" type="button" onClick={async () => { if (!window.confirm('Delete this poll?')) return; await deletePoll(poll.id); setPolls(await loadPolls(undefined, true)); setMessage('Poll deleted.') }}>Delete</button></div>{pollResults[poll.id] && <div className="results">{pollResults[poll.id].map((result) => <div key={result.option_id}><span>{result.label}</span><strong>{result.votes} · {result.percentage}%</strong></div>)}</div>}</article>)}</div></section>
              <section className="panel"><PanelHeading eyebrow="CREATE" title="New poll" /><form className="form-grid" onSubmit={createStudioPoll}><label className="full">Question<input name="question" required /></label><label className="full">Description<textarea name="description" /></label><label className="full">Options<textarea name="options" placeholder={'Option one\nOption two'} required /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select></label><label>Results<select name="resultsVisibility" defaultValue="live"><option value="live">Live</option><option value="after_close">After close</option><option value="hidden">Hidden</option></select></label><label>Opens<input name="opensAt" type="datetime-local" /></label><label>Closes<input name="closesAt" type="datetime-local" /></label><div className="full"><button className="button">Create poll</button></div></form></section>
            </>
          )}

          {tab === 'media' && <Suspense fallback={<p>Opening media…</p>}><StudioMedia projectId={projectId} /></Suspense>}
        </main>
      </div>
    </div>
  )
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function PanelHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div></div>
}

function MediaCard({ label, src, fallback, onFile, wide = false }: { label: string; src?: string; fallback?: string; onFile: (file: File) => void; wide?: boolean }) {
  return <article className={`media-card ${wide ? 'wide' : ''}`}><span className="eyebrow">{label}</span><div className="media-preview">{src ? <img src={src} alt="" /> : <strong>{fallback || 'No asset'}</strong>}</div><label className="button secondary">Replace<input type="file" accept="image/*" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onFile(file); event.currentTarget.value = '' }} /></label></article>
}

export default App
