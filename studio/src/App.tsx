import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { restoreAuth, signIn, signOut, type AuthState } from '../../src/lib/auth'
import { db } from '../../src/lib/supabase'
import {
  loadCmsData,
  saveCmsData,
  updateCastingApplicationStatus,
  uploadStudioMedia,
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

type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'polls' | 'media' | 'notifications' | 'team'

const STAFF_ROLES = new Set<StaffRole>(['editor', 'producer', 'administrator', 'founder'])
const CASTING_STATUSES: CastingApplication['status'][] = ['New', 'Reviewing', 'Callback', 'Interview', 'Finalist', 'Cast', 'Declined', 'Removed']
const TABS: Array<{ id: StudioTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: '⌂' },
  { id: 'series', label: 'Series', icon: '▣' },
  { id: 'episodes', label: 'Episodes', icon: '▶' },
  { id: 'talent', label: 'Cast & Talent', icon: '◎' },
  { id: 'casting', label: 'Casting', icon: '◇' },
  { id: 'polls', label: 'Polls & Voting', icon: '◉' },
  { id: 'media', label: 'Media', icon: '▧' },
  { id: 'notifications', label: 'Notifications', icon: '◌' },
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

  if (!STAFF_ROLES.has(authState.account.role as StaffRole)) {
    return (
      <main className="studio-auth-page">
        <section className="auth-card denied">
          <span className="studio-mark">EBG</span>
          <p className="eyebrow">STAFF ACCESS ONLY</p>
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
  const [cms, setCms] = useState<CmsData>(emptyCms)
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
  }

  useEffect(() => {
    const sync = () => setTabState(parseTab())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

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
    void Promise.all([loadCmsData<CmsData>(), refreshAuxiliary()])
      .then(([nextCms]) => {
        const value = nextCms ?? emptyCms
        setCms(value)
        setShowId(value.shows[0]?.id ?? '')
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Studio data could not be loaded.'))
      .finally(() => setBusy(false))
  }, [])

  const selectedShow = useMemo(() => cms.shows.find((show) => show.id === showId) ?? cms.shows[0] ?? null, [cms.shows, showId])
  const selectedEpisodes = useMemo(() => selectedShow ? cms.episodes.filter((episode) => episode.showId === selectedShow.id) : [], [cms.episodes, selectedShow])

  const commitCms = async (next: CmsData, success?: string) => {
    setCms(next)
    try {
      await saveCmsData(next)
      if (success) setMessage(success)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Changes could not be saved.')
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
      const artwork = artFile instanceof File && artFile.size ? await uploadStudioMedia(artFile, 'shows/posters') : ''
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
      const videoUrl = await uploadStudioMedia(video, `episodes/${selectedShow.id}`)
      const thumbnail = thumbnailFile instanceof File && thumbnailFile.size
        ? await uploadStudioMedia(thumbnailFile, `episodes/${selectedShow.id}/thumbnails`)
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
      const image = imageFile instanceof File && imageFile.size ? await uploadStudioMedia(imageFile, `series/${selectedShow.id}/cast`) : undefined
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
      const url = await uploadStudioMedia(file, folder)
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

  const activeEpisodes = cms.episodes.filter((episode) => episode.publishStatus === 'live').length
  const openPolls = polls.filter((poll) => poll.status === 'open').length
  const openCasting = casting.filter((app) => !['Cast', 'Declined', 'Removed'].includes(app.status)).length

  return (
    <div className="studio-shell">
      <aside className="sidebar">
        <button className="brand-button" type="button" onClick={() => setTab('overview')}><span className="studio-mark">EBG</span><strong>STUDIO</strong></button>
        <nav>
          {TABS.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <small>Signed in as</small><strong>{authState.account.email}</strong><span>{authState.account.role}</span>
          <button type="button" onClick={() => void signOutNow()}>Sign out</button>
        </div>
      </aside>

      <div className="studio-main">
        <header className="topbar">
          <div><p className="eyebrow">EBG STUDIO / {TABS.find((item) => item.id === tab)?.label}</p><h1>{TABS.find((item) => item.id === tab)?.label}</h1></div>
          <div className="top-actions">
            {cms.shows.length > 0 && <select value={selectedShow?.id ?? ''} onChange={(event) => setShowId(event.target.value)}>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select>}
            <a className="button secondary" href="https://ebgplus.app" target="_blank" rel="noreferrer">View EBG+ ↗</a>
          </div>
        </header>

        {message && <div className="message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        <main className="workspace">
          {tab === 'overview' && (
            <>
              <section className="hero-panel"><div><p className="eyebrow">PRODUCTION HQ</p><h2>Everything EBG+.<br />One control room.</h2><p>Publish releases, manage talent, review casting, and shape what viewers see.</p><div className="hero-actions"><button className="button" onClick={() => setTab('episodes')}>Upload episode</button><button className="button secondary" onClick={() => setTab('series')}>Manage series</button></div></div><div className="hero-stat"><strong>{cms.shows.length}</strong><span>series in slate</span></div></section>
              <section className="stats-grid">
                <Stat label="Series" value={cms.shows.length} detail={`${cms.shows.filter((show) => show.status === 'Now Streaming' || show.status === 'Current').length} active`} />
                <Stat label="Episodes" value={cms.episodes.length} detail={`${activeEpisodes} live`} />
                <Stat label="Casting" value={openCasting} detail={`${casting.length} total`} />
                <Stat label="Live polls" value={openPolls} detail={`${polls.length} total`} />
              </section>
              <section className="panel"><PanelHeading eyebrow="WORKSPACES" title="Where do you want to work?" /><div className="launch-grid">{TABS.filter((item) => item.id !== 'overview').map((item, index) => <button type="button" key={item.id} onClick={() => setTab(item.id)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><b>→</b></button>)}</div></section>
              <section className="two-column">
                <div className="panel"><PanelHeading eyebrow="RECENT RELEASES" title="Episodes" /><div className="compact-list">{[...cms.episodes].sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate)).slice(0, 5).map((episode) => <article key={episode.id}><img src={episode.thumbnail || cms.shows.find((show) => show.id === episode.showId)?.artwork} alt="" /><div><strong>{episode.title}</strong><span>{cms.shows.find((show) => show.id === episode.showId)?.title} · S{episode.season}E{episode.number}</span></div><em>{episode.publishStatus ?? 'scheduled'}</em></article>)}</div></div>
                <div className="panel"><PanelHeading eyebrow="CURRENT SLATE" title="Series" /><div className="poster-grid">{cms.shows.slice(0, 6).map((show) => <button key={show.id} type="button" onClick={() => { setShowId(show.id); setTab('series') }}><div className="poster-image">{show.artwork ? <img src={show.artwork} alt="" /> : <span>{show.title.slice(0, 1)}</span>}</div><strong>{show.title}</strong><span>{show.status}</span></button>)}</div></div>
              </section>
            </>
          )}

          {tab === 'series' && (
            <>
              <section className="panel"><PanelHeading eyebrow="SERIES LIBRARY" title="Your shows" /><div className="series-grid">{cms.shows.map((show) => <button className={selectedShow?.id === show.id ? 'selected' : ''} key={show.id} type="button" onClick={() => setShowId(show.id)}><div className="poster-image">{show.artwork ? <img src={show.artwork} alt="" /> : <span>{show.title.slice(0, 1)}</span>}</div><strong>{show.title}</strong><span>{show.genre} · {show.status}</span></button>)}</div></section>
              {selectedShow && <section className="panel"><PanelHeading eyebrow="EDIT SERIES" title={selectedShow.title} /><div className="action-row"><button className="button secondary" type="button" onClick={() => void commitCms({ ...cms, heroShowId: selectedShow.id }, `${selectedShow.title} is now featured.`)}>Set featured</button><button className="button secondary" type="button" onClick={() => void updateShow(selectedShow.id, { homeVisible: selectedShow.homeVisible === false }, selectedShow.homeVisible === false ? 'Series shown on Home.' : 'Series hidden from Home.')}>{selectedShow.homeVisible === false ? 'Show on Home' : 'Hide from Home'}</button><button className="button secondary" type="button" onClick={() => duplicateSeries(selectedShow)}>Duplicate</button><button className="button danger" type="button" onClick={() => deleteSeries(selectedShow)}>Delete</button></div><div className="form-grid"><label>Title<input value={selectedShow.title} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selectedShow.id ? { ...show, title: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label><label>Status<input value={selectedShow.status} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selectedShow.id ? { ...show, status: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label><label>Genre<input value={selectedShow.genre} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selectedShow.id ? { ...show, genre: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label><label>Category<input value={selectedShow.category} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selectedShow.id ? { ...show, category: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label><label className="full">Description<textarea value={selectedShow.description} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selectedShow.id ? { ...show, description: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label></div></section>}
              <section className="panel"><PanelHeading eyebrow="CREATE" title="New series" /><form className="form-grid" onSubmit={createSeries}><label>Title<input name="title" required /></label><label>Category<input name="category" defaultValue="EBG+ Original" /></label><label>Genre<input name="genre" /></label><label>Year<input name="year" type="number" defaultValue={new Date().getFullYear()} /></label><label>Maturity<select name="maturity" defaultValue="TV-14"><option>TV-PG</option><option>TV-14</option><option>TV-MA</option></select></label><label>Status<select name="status" defaultValue="Coming Soon"><option>Coming Soon</option><option>Now Streaming</option><option>Current</option><option>On Hiatus</option><option>Completed</option></select></label><label>Poster<input name="artwork" type="file" accept="image/*" /></label><label className="full">Description<textarea name="description" /></label><div className="full"><button className="button" disabled={busy}>Create series</button></div></form></section>
            </>
          )}

          {tab === 'episodes' && selectedShow && (
            <>
              <section className="panel"><PanelHeading eyebrow="EPISODE LIBRARY" title={selectedShow.title} /><div className="episode-list">{selectedEpisodes.map((episode) => <article key={episode.id}><div className="episode-thumb">{episode.thumbnail ? <img src={episode.thumbnail} alt="" /> : <span>▶</span>}</div><div><span className="eyebrow">S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleString()}</p></div><div className="episode-actions"><select value={episode.publishStatus ?? 'scheduled'} onChange={(event) => void updateEpisode(episode.id, { publishStatus: event.target.value as PublishStatus, releaseDate: event.target.value === 'live' ? nowIso() : episode.releaseDate }, 'Episode status updated.')}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select>{episode.videoUrl && <a className="button secondary" href={episode.videoUrl} target="_blank" rel="noreferrer">Preview</a>}<button className="button secondary" type="button" onClick={() => duplicateEpisode(episode)}>Duplicate</button><button className="button danger" type="button" onClick={() => { if (window.confirm(`Delete “${episode.title}”?`)) void commitCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) }, 'Episode deleted.') }}>Delete</button></div></article>)}</div></section>
              <section className="panel"><PanelHeading eyebrow="UPLOAD" title="New episode" /><form className="form-grid" onSubmit={createEpisode}><label>Title<input name="title" required /></label><label>Runtime<input name="runtime" placeholder="48m" /></label><label>Season<input name="season" type="number" min="1" defaultValue="1" /></label><label>Episode<input name="number" type="number" min="1" defaultValue={selectedEpisodes.length + 1} /></label><label>Publishing<select name="publishStatus" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Publish now</option></select></label><label>Release date<input name="releaseDate" type="datetime-local" /></label><label>Video<input name="video" type="file" accept="video/*" required /></label><label>Thumbnail<input name="thumbnail" type="file" accept="image/*" /></label><label className="full">Synopsis<textarea name="synopsis" /></label><div className="full"><button className="button" disabled={busy}>{busy ? 'Uploading…' : 'Save episode'}</button></div></form></section>
            </>
          )}

          {tab === 'talent' && selectedShow && (
            <>
              <section className="panel"><PanelHeading eyebrow="CAST & TALENT" title={selectedShow.title} /><div className="talent-grid">{selectedShow.cast.map((person, index) => <article key={`${person.name}-${index}`}>{person.image ? <img src={person.image} alt="" /> : <div className="avatar-fallback">{person.name.slice(0, 1)}</div>}<div><span className="eyebrow">{person.status ?? 'Active'}</span><h3>{person.name}</h3><p>{person.role} · {person.city}</p><small>{person.bio}</small><button className="text-danger" type="button" onClick={() => void updateShow(selectedShow.id, { cast: selectedShow.cast.filter((_, itemIndex) => itemIndex !== index) }, `${person.name} removed.`)}>Remove</button></div></article>)}</div></section>
              <section className="panel"><PanelHeading eyebrow="ADD TALENT" title="New profile" /><form className="form-grid" onSubmit={addTalent}><label>Name<input name="name" required /></label><label>Role<input name="role" defaultValue="Cast" /></label><label>City / State<input name="city" /></label><label>Status<input name="status" defaultValue="Active" /></label><label>Social<input name="social" placeholder="@handle" /></label><label>Photo<input name="image" type="file" accept="image/*" /></label><label className="full">Bio<textarea name="bio" /></label><div className="full"><button className="button" disabled={busy}>Add talent</button></div></form></section>
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

          {tab === 'media' && selectedShow && (
            <section className="panel"><PanelHeading eyebrow="BRAND ASSETS" title={selectedShow.title} /><div className="media-grid"><MediaCard label="Poster" src={selectedShow.artwork} onFile={(file) => void replaceShowMedia('artwork', file)} /><MediaCard label="Banner" src={selectedShow.banner || selectedShow.artwork} onFile={(file) => void replaceShowMedia('banner', file)} wide /><MediaCard label="Logo" src={selectedShow.logoImage} fallback={selectedShow.logo} onFile={(file) => void replaceShowMedia('logoImage', file)} /></div></section>
          )}

          {tab === 'notifications' && (
            <>
              <section className="panel"><PanelHeading eyebrow="AUDIENCE UPDATES" title="Notifications" /><div className="notification-list">{(cms.notifications ?? []).map((item) => <article key={item.id}><div><span className="eyebrow">{item.status ?? 'sent'} · {item.audience ?? 'all'}</span><h3>{item.title || 'EBG+ Update'}</h3><p>{item.text}</p></div><time>{new Date(item.date).toLocaleString()}</time></article>)}</div></section>
              <section className="panel"><PanelHeading eyebrow="PUBLISH" title="New notification" /><form className="form-grid" onSubmit={createNotification}><label>Title<input name="title" required /></label><label>Audience<select name="audience"><option value="all">Everyone</option><option value="subscribers">Subscribers</option><option value="staff">Staff</option></select></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="sent">Send now</option></select></label><label>Publish at<input name="publishAt" type="datetime-local" /></label><label className="full">Message<textarea name="text" required /></label><label className="full">Link<input name="link" placeholder="/app/shows/..." /></label><div className="full"><button className="button">Save notification</button></div></form></section>
            </>
          )}

          {tab === 'team' && (
            <section className="panel"><PanelHeading eyebrow="ACCESS" title="EBG Studio team" /><p className="muted-copy">Roles are currently read from the shared EBG+ accounts table. Granular role permissions are the next backend migration.</p><div className="team-grid">{team.filter((account) => STAFF_ROLES.has(account.role as StaffRole)).map((account) => <article key={account.id}><div className="avatar-fallback">{account.email?.slice(0, 1).toUpperCase() ?? 'E'}</div><div><strong>{account.email ?? account.id}</strong><span>{account.role}</span></div></article>)}</div></section>
          )}
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
