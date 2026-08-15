import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE136_STUDIO_COMPLETE')) process.exit(0)

const importNeedle = "import './phase135-studio-render-fix.css'"
if (!source.includes(importNeedle)) throw new Error('Phase 1.36 requires Phase 1.35 styles')
source = source.replace(importNeedle, `${importNeedle}\nimport './phase136-studio-complete.css'\n\n// EBG_PHASE136_STUDIO_COMPLETE`)

// Restore poll mutation helpers: the completed Studio owns poll creation/edit/delete again.
source = source.replace(
  "import { loadPollOptions, loadPollResults, loadPolls, voteInPoll, type Poll, type PollOption, type PollResult } from './lib/pollData'",
  "import { createPoll, deletePoll, loadPollOptions, loadPollResults, loadPolls, updatePoll, voteInPoll, type Poll, type PollOption, type PollResult } from './lib/pollData'",
)

const hubStart = source.indexOf('function EbgStudioHub(')
const hubEnd = source.indexOf('\nfunction ManagementPage(', hubStart)
if (hubStart < 0 || hubEnd < 0) throw new Error('Phase 1.36 could not locate EbgStudioHub')

const hub = `function EbgStudioHub({
  cms,
  castingApps,
  onUpdateCms,
  onUpdateCastingStatus: _onUpdateCastingStatus,
}: {
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>
}) {
  const { studioSection } = useParams()
  const studioNav = useNavigate()
  const [showId, setShowId] = useState(cms.shows[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [polls, setPolls] = useState<Poll[]>([])
  const [pollResults, setPollResults] = useState<Record<string, PollResult[]>>({})

  const sections = [
    ['overview', 'Overview', '⌂'],
    ['production', 'Production', '◆'],
    ['series', 'Series', '▣'],
    ['episodes', 'Episodes', '▶'],
    ['cast', 'Cast & Talent', '◎'],
    ['polls', 'Polls & Voting', '◉'],
    ['media', 'Media', '▧'],
    ['notifications', 'Notifications', '◌'],
  ] as const
  const allowed = sections.map(([id]) => id)
  const tab = allowed.includes((studioSection ?? 'overview') as typeof allowed[number])
    ? (studioSection as typeof allowed[number])
    : 'overview'
  const show = cms.shows.find((item) => item.id === showId) ?? cms.shows[0]

  useEffect(() => {
    if (!cms.shows.some((item) => item.id === showId)) setShowId(cms.shows[0]?.id ?? '')
  }, [cms.shows, showId])

  const refreshPolls = async () => {
    try {
      const next = await loadPolls(undefined, true)
      setPolls(next)
      const pairs = await Promise.all(next.map(async (poll) => {
        try { return [poll.id, await loadPollResults(poll.id)] as const } catch { return [poll.id, []] as const }
      }))
      setPollResults(Object.fromEntries(pairs))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load polls.')
    }
  }

  useEffect(() => { void refreshPolls() }, [])

  if (!show) return null

  const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const selectedEpisodes = cms.episodes.filter((episode) => episode.showId === show.id)
  const liveEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'live')
  const scheduledEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'scheduled')
  const activePolls = polls.filter((poll) => poll.status === 'open')
  const title = sections.find(([id]) => id === tab)?.[1] ?? 'Overview'

  const updateShow = (showId: string, patch: Partial<Show>) => {
    onUpdateCms({ ...cms, shows: cms.shows.map((item) => item.id === showId ? { ...item, ...patch } : item) })
  }

  const addShow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const showTitle = String(form.get('title') ?? '').trim()
    if (!showTitle) return
    setBusy(true); setMessage('Creating series…')
    try {
      const posterFile = form.get('artworkFile')
      const artwork = posterFile instanceof File && posterFile.size > 0
        ? await uploadStudioMedia(posterFile, 'shows/posters')
        : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80'
      const baseId = slugify(showTitle) || \`show-\${Date.now()}\`
      const id = cms.shows.some((item) => item.id === baseId) ? \`\${baseId}-\${Date.now()}\` : baseId
      const nextShow: Show = {
        id,
        title: showTitle,
        category: String(form.get('category') ?? 'EBG+ Original'),
        description: String(form.get('description') ?? ''),
        genre: String(form.get('genre') ?? ''),
        year: Number(form.get('year') ?? new Date().getFullYear()),
        maturity: String(form.get('maturity') ?? 'TV-14') as Show['maturity'],
        status: String(form.get('status') ?? 'Coming Soon') as Show['status'],
        artwork,
        logo: showTitle,
        cast: [],
      }
      onUpdateCms({ ...cms, shows: [...cms.shows, nextShow] })
      setShowId(id); formEl.reset(); setMessage(\`\${showTitle} created.\`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Series could not be created.') }
    finally { setBusy(false) }
  }

  const deleteShow = (showId: string) => {
    if (!window.confirm('Delete this series and all of its episodes?')) return
    const remaining = cms.shows.filter((item) => item.id !== showId)
    onUpdateCms({
      ...cms,
      heroShowId: cms.heroShowId === showId ? (remaining[0]?.id ?? '') : cms.heroShowId,
      shows: remaining,
      episodes: cms.episodes.filter((episode) => episode.showId !== showId),
      rails: cms.rails.map((rail) => ({ ...rail, showIds: rail.showIds.filter((id) => id !== showId) })),
    })
    setShowId(remaining[0]?.id ?? '')
  }

  const replaceShowMedia = async (field: 'artwork' | 'banner' | 'logoImage', file?: File) => {
    if (!file?.size) return
    setBusy(true); setMessage('Uploading media…')
    try {
      const folder = field === 'artwork' ? 'shows/posters' : field === 'banner' ? 'shows/banners' : 'shows/logos'
      const url = await uploadStudioMedia(file, folder)
      updateShow(show.id, { [field]: url } as Partial<Show>)
      setMessage('Media updated.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Media upload failed.') }
    finally { setBusy(false) }
  }

  const addEpisode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action = (submitter?.value || 'scheduled') as 'draft' | 'scheduled' | 'live'
    setBusy(true); setMessage('Uploading episode…')
    try {
      const episodeTitle = String(form.get('title') ?? '').trim()
      const videoFile = form.get('videoFile')
      const thumbnailFile = form.get('thumbnailFile')
      if (!(videoFile instanceof File) || !videoFile.size) throw new Error('Choose an episode video file.')
      const videoUrl = await uploadStudioMedia(videoFile, 'episodes')
      const thumbnail = thumbnailFile instanceof File && thumbnailFile.size > 0
        ? await uploadStudioMedia(thumbnailFile, 'thumbnails')
        : show.artwork
      const releaseInput = String(form.get('releaseAt') ?? '')
      if (action === 'scheduled' && !releaseInput) throw new Error('Choose a release date and time before scheduling.')
      const releaseDate = action === 'live' ? new Date().toISOString() : releaseInput ? new Date(releaseInput).toISOString() : new Date().toISOString()
      const season = Number(form.get('season') ?? 1)
      const number = Number(form.get('number') ?? 1)
      const episode: Episode = {
        id: \`\${show.id}-s\${season}e\${number}-\${Date.now()}\`,
        showId: show.id,
        season,
        number,
        title: episodeTitle,
        synopsis: String(form.get('synopsis') ?? ''),
        runtime: String(form.get('runtime') ?? ''),
        releaseDate,
        thumbnail,
        videoUrl,
        publishStatus: action,
      }
      onUpdateCms({ ...cms, episodes: [...cms.episodes, episode] })
      formEl.reset(); setMessage(action === 'live' ? 'Episode published.' : action === 'scheduled' ? 'Episode scheduled.' : 'Episode saved as draft.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Episode upload failed.') }
    finally { setBusy(false) }
  }

  const updateEpisode = (episodeId: string, patch: Partial<Episode>) => {
    onUpdateCms({ ...cms, episodes: cms.episodes.map((episode) => episode.id === episodeId ? { ...episode, ...patch } : episode) })
  }

  const replaceEpisodeMedia = async (episodeId: string, field: 'thumbnail' | 'videoUrl', file?: File) => {
    if (!file?.size) return
    setBusy(true); setMessage('Uploading replacement…')
    try {
      const url = await uploadStudioMedia(file, field === 'thumbnail' ? 'thumbnails' : 'episodes')
      updateEpisode(episodeId, { [field]: url } as Partial<Episode>)
      setMessage('Episode media updated.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Replacement failed.') }
    finally { setBusy(false) }
  }

  const addCast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    setBusy(true); setMessage('Adding talent…')
    try {
      const file = form.get('imageFile')
      const image = file instanceof File && file.size > 0 ? await uploadStudioMedia(file, \`series/\${show.id}/cast\`) : undefined
      const person = {
        name: String(form.get('name') ?? ''),
        role: String(form.get('role') ?? 'Cast'),
        city: String(form.get('city') ?? ''),
        bio: String(form.get('bio') ?? ''),
        social: String(form.get('social') ?? '') || undefined,
        status: String(form.get('status') ?? '') || undefined,
        image,
      }
      updateShow(show.id, { cast: [...show.cast, person] })
      formEl.reset(); setMessage('Talent added.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Talent could not be added.') }
    finally { setBusy(false) }
  }

  const createNewPoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const options = String(form.get('options') ?? '').split('\\n').map((item) => item.trim()).filter(Boolean)
    if (options.length < 2) return setMessage('Add at least two poll options.')
    try {
      await createPoll({
        showId: show.id,
        question: String(form.get('question') ?? ''),
        description: String(form.get('description') ?? ''),
        options,
        status: String(form.get('status') ?? 'draft') as any,
        opensAt: String(form.get('opensAt') ?? '') || null,
        closesAt: String(form.get('closesAt') ?? '') || null,
        resultsVisibility: String(form.get('resultsVisibility') ?? 'live') as any,
      })
      formEl.reset(); setMessage('Poll created.'); await refreshPolls()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Poll could not be created.') }
  }

  const publishNotification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action = (submitter?.value || 'draft') as 'draft' | 'scheduled' | 'sent'
    const publishInput = String(form.get('publishAt') ?? '')
    if (action === 'scheduled' && !publishInput) return setMessage('Choose a date and time before scheduling.')
    const notification: NotificationItem = {
      id: \`notice-\${Date.now()}\`,
      title: String(form.get('title') ?? '').trim(),
      text: String(form.get('text') ?? '').trim(),
      date: action === 'sent' ? new Date().toISOString() : publishInput ? new Date(publishInput).toISOString() : new Date().toISOString(),
      read: false,
      audience: String(form.get('audience') ?? 'all') as NotificationItem['audience'],
      status: action,
      link: String(form.get('link') ?? '').trim() || undefined,
    }
    if (!notification.title || !notification.text) return setMessage('Add a title and message first.')
    onUpdateCms({ ...cms, notifications: [notification, ...(cms.notifications ?? [])] })
    formEl.reset(); setMessage(action === 'sent' ? 'Notification sent.' : action === 'scheduled' ? 'Notification scheduled.' : 'Draft saved.')
  }

  return (
    <section className={\`studio36 studio36-\${tab}\`}>
      <aside className="studio36-sidebar">
        <Link className="studio36-brand" to="/app/studio/overview"><span>EBG</span><strong>STUDIO</strong></Link>
        <nav aria-label="EBG Studio navigation">
          {sections.map(([id, label, icon]) => (
            <Link key={id} to={\`/app/studio/\${id}\`} className={tab === id ? 'active' : ''}>
              <span className="studio36-nav-icon">{icon}</span><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="studio36-side-foot"><span>LIVE CMS</span><strong>{cms.shows.length} series</strong><small>{cms.episodes.length} episodes</small></div>
      </aside>

      <div className="studio36-main">
        <header className="studio36-topbar">
          <div><p>EBG Studio / {title}</p><h1>{title}</h1><span>{tab === 'overview' ? 'Your production headquarters.' : tab === 'production' ? 'Everything active across the selected production.' : \`Manage \${title.toLowerCase()} without leaving Studio.\`}</span></div>
          <div className="studio36-top-actions"><select value={show.id} onChange={(event) => setShowId(event.target.value)}>{cms.shows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Link className="btn muted" to="/app/home">View EBG+</Link></div>
        </header>
        {message && <div className="studio36-message">{message}<button type="button" onClick={() => setMessage('')}>×</button></div>}

        {tab === 'overview' && <div className="studio36-dashboard">
          <section className="studio36-hero"><div><span>PUBLISHING HQ</span><h2>Run EBG+ from one place.</h2><p>Create series, upload episodes, manage talent, publish media, run polls, and notify viewers.</p><div className="actions"><Link className="btn" to="/app/studio/episodes">Upload Episode</Link><Link className="btn muted" to="/app/studio/series">Create Series</Link></div></div><div className="studio36-orb"><strong>{cms.shows.length}</strong><span>SERIES</span></div></section>
          <section className="studio36-stats"><article><span>Episodes</span><strong>{cms.episodes.length}</strong></article><article><span>Live</span><strong>{cms.episodes.filter((e) => e.publishStatus === 'live').length}</strong></article><article><span>Scheduled</span><strong>{cms.episodes.filter((e) => e.publishStatus === 'scheduled').length}</strong></article><article><span>Open Polls</span><strong>{activePolls.length}</strong></article></section>
          <section className="studio36-launch">{sections.filter(([id]) => !['overview'].includes(id)).map(([id, label, icon]) => <Link key={id} to={\`/app/studio/\${id}\`}><span>{icon}</span><strong>{label}</strong><b>→</b></Link>)}</section>
        </div>}

        {tab === 'production' && <div className="studio36-content"><section className="studio36-production-hero" style={{ backgroundImage: \`linear-gradient(90deg,rgba(5,5,6,.96),rgba(5,5,6,.28)),url(\${show.banner || show.artwork})\` }}><span>{show.category}</span><h2>{show.title}</h2><p>{show.genre} · {show.year} · {show.maturity}</p><div className="actions"><Link className="btn" to="/app/studio/episodes">Upload Episode</Link><Link className="btn muted" to="/app/studio/media">Media</Link></div></section><section className="studio36-stats"><article><span>Episodes</span><strong>{selectedEpisodes.length}</strong></article><article><span>Live</span><strong>{liveEpisodes.length}</strong></article><article><span>Scheduled</span><strong>{scheduledEpisodes.length}</strong></article><article><span>Cast</span><strong>{show.cast.length}</strong></article></section></div>}

        {tab === 'series' && <div className="studio36-content studio36-split">
          <section className="studio36-card"><div className="studio36-card-head"><div><span>SERIES LIBRARY</span><h2>Your shows</h2></div></div><div className="studio36-show-list">{cms.shows.map((item) => <button type="button" key={item.id} className={item.id === show.id ? 'active' : ''} onClick={() => setShowId(item.id)}><img src={item.artwork} alt=""/><span><strong>{item.title}</strong><small>{item.status}</small></span></button>)}</div></section>
          <section className="studio36-card"><div className="studio36-card-head"><div><span>EDIT SERIES</span><h2>{show.title}</h2></div><button className="studio36-danger" type="button" onClick={() => deleteShow(show.id)}>Delete</button></div><div className="studio36-form-grid"><label>Title<input value={show.title} onChange={(event) => updateShow(show.id, { title: event.target.value })}/></label><label>Status<select value={show.status} onChange={(event) => updateShow(show.id, { status: event.target.value as Show['status'] })}><option>Coming Soon</option><option>Now Streaming</option><option>Current</option></select></label><label>Genre<input value={show.genre} onChange={(event) => updateShow(show.id, { genre: event.target.value })}/></label><label>Year<input type="number" value={show.year} onChange={(event) => updateShow(show.id, { year: Number(event.target.value) })}/></label><label>Rating<input value={show.maturity} onChange={(event) => updateShow(show.id, { maturity: event.target.value as Show['maturity'] })}/></label><label>Category<input value={show.category} onChange={(event) => updateShow(show.id, { category: event.target.value })}/></label><label className="full">Description<textarea value={show.description} onChange={(event) => updateShow(show.id, { description: event.target.value })}/></label></div></section>
          <section className="studio36-card studio36-full"><div className="studio36-card-head"><div><span>NEW SERIES</span><h2>Create a show</h2></div></div><form className="studio36-form-grid" onSubmit={addShow}><label>Title<input name="title" required/></label><label>Category<input name="category" defaultValue="EBG+ Original"/></label><label>Genre<input name="genre" required/></label><label>Year<input name="year" type="number" defaultValue={new Date().getFullYear()}/></label><label>Rating<input name="maturity" defaultValue="TV-14"/></label><label>Status<select name="status" defaultValue="Coming Soon"><option>Coming Soon</option><option>Now Streaming</option></select></label><label>Poster<input name="artworkFile" type="file" accept="image/*"/></label><label className="full">Description<textarea name="description" required/></label><div className="full actions"><button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create Series'}</button></div></form></section>
        </div>}

        {tab === 'episodes' && <div className="studio36-content">
          <section className="studio36-card"><div className="studio36-card-head"><div><span>EPISODE LIBRARY</span><h2>{show.title}</h2></div><strong>{selectedEpisodes.length} episodes</strong></div><div className="studio36-episode-list">{selectedEpisodes.map((episode) => <article key={episode.id}><img src={episode.thumbnail} alt=""/><div className="studio36-episode-copy"><span>S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleString()}</p><select value={episode.publishStatus ?? 'scheduled'} onChange={(event) => updateEpisode(episode.id, { publishStatus: event.target.value as Episode['publishStatus'], releaseDate: event.target.value === 'live' ? new Date().toISOString() : episode.releaseDate })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></div><div className="studio36-media-buttons"><label>Thumbnail<input type="file" accept="image/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void replaceEpisodeMedia(episode.id,'thumbnail',file); event.currentTarget.value='' }}/></label><label>Video<input type="file" accept="video/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void replaceEpisodeMedia(episode.id,'videoUrl',file); event.currentTarget.value='' }}/></label><button className="studio36-danger" type="button" onClick={() => { if(window.confirm('Delete this episode?')) onUpdateCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) }) }}>Delete</button></div></article>)}</div></section>
          <section className="studio36-card"><div className="studio36-card-head"><div><span>UPLOAD EPISODE</span><h2>New release</h2></div></div><form className="studio36-form-grid" onSubmit={addEpisode}><label>Season<input name="season" type="number" min="1" defaultValue="1" required/></label><label>Episode<input name="number" type="number" min="1" defaultValue={selectedEpisodes.length + 1} required/></label><label className="full">Title<input name="title" required/></label><label>Runtime<input name="runtime" placeholder="42 min" required/></label><label>Release date & time<input name="releaseAt" type="datetime-local"/></label><label>Thumbnail<input name="thumbnailFile" type="file" accept="image/*"/></label><label>Video<input name="videoFile" type="file" accept="video/*" required/></label><label className="full">Synopsis<textarea name="synopsis" required/></label><div className="full studio36-publish-actions"><button className="btn muted" type="submit" value="draft" disabled={busy}>Save Draft</button><button className="btn muted" type="submit" value="scheduled" disabled={busy}>Schedule</button><button className="btn" type="submit" value="live" disabled={busy}>{busy ? 'Uploading…' : 'Publish Now'}</button></div></form></section>
        </div>}

        {tab === 'cast' && <div className="studio36-content"><section className="studio36-card"><div className="studio36-card-head"><div><span>CAST & TALENT</span><h2>{show.title}</h2></div><strong>{show.cast.length} people</strong></div><div className="studio36-cast-grid">{show.cast.map((person,index) => <article key={person.name+index}>{person.image ? <img src={person.image} alt=""/> : <div className="studio36-avatar">{person.name.slice(0,1)}</div>}<div><h3>{person.name}</h3><p>{person.role} · {person.city}</p><small>{person.bio}</small><button className="studio36-danger" type="button" onClick={() => updateShow(show.id, { cast: show.cast.filter((_,i) => i !== index) })}>Remove</button></div></article>)}</div></section><section className="studio36-card"><div className="studio36-card-head"><div><span>ADD TALENT</span><h2>New profile</h2></div></div><form className="studio36-form-grid" onSubmit={addCast}><label>Name<input name="name" required/></label><label>Role<input name="role" defaultValue="Cast"/></label><label>City / State<input name="city" required/></label><label>Status<input name="status" placeholder="Active"/></label><label>Social<input name="social" placeholder="@handle"/></label><label>Photo<input name="imageFile" type="file" accept="image/*"/></label><label className="full">Bio<textarea name="bio" required/></label><div className="full actions"><button className="btn" disabled={busy}>Add Talent</button></div></form></section></div>}

        {tab === 'polls' && <div className="studio36-content studio36-split"><section className="studio36-card"><div className="studio36-card-head"><div><span>CREATE POLL</span><h2>{show.title}</h2></div></div><form className="studio36-form-grid" onSubmit={createNewPoll}><label className="full">Question<input name="question" required/></label><label className="full">Description<textarea name="description"/></label><label className="full">Options — one per line<textarea name="options" required placeholder={'Option A\\nOption B'}/></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="open">Open now</option><option value="closed">Closed</option></select></label><label>Results<select name="resultsVisibility" defaultValue="live"><option value="live">Live</option><option value="after_close">After close</option><option value="hidden">Staff only</option></select></label><label>Opens<input name="opensAt" type="datetime-local"/></label><label>Closes<input name="closesAt" type="datetime-local"/></label><div className="full actions"><button className="btn">Create Poll</button></div></form></section><section className="studio36-card"><div className="studio36-card-head"><div><span>ACTIVE POLLS</span><h2>Audience voting</h2></div></div><div className="studio36-poll-list">{polls.filter((poll) => poll.show_id === show.id).map((poll) => <article key={poll.id}><div><span className={\`studio36-status \${poll.status}\`}>{poll.status}</span><h3>{poll.question}</h3>{(pollResults[poll.id] ?? []).map((r) => <p key={r.option_id}>{r.label} <strong>{r.percentage}%</strong></p>)}</div><div><button className="btn muted" type="button" onClick={() => void updatePoll(poll.id,{status:poll.status==='open'?'closed':'open'}).then(refreshPolls)}>{poll.status==='open'?'Close':'Open'}</button><button className="studio36-danger" type="button" onClick={() => { if(window.confirm('Delete this poll?')) void deletePoll(poll.id).then(refreshPolls) }}>Delete</button></div></article>)}</div></section></div>}

        {tab === 'media' && <div className="studio36-content"><section className="studio36-card"><div className="studio36-card-head"><div><span>MEDIA LIBRARY</span><h2>{show.title}</h2></div></div><div className="studio36-assets"><article><span>POSTER</span><img src={show.artwork} alt=""/><label>Replace<input type="file" accept="image/*" onChange={(event)=>{const file=event.target.files?.[0];if(file)void replaceShowMedia('artwork',file);event.currentTarget.value='' }}/></label></article><article className="wide"><span>BANNER</span><img src={show.banner || show.artwork} alt=""/><label>{show.banner?'Replace':'Upload'}<input type="file" accept="image/*" onChange={(event)=>{const file=event.target.files?.[0];if(file)void replaceShowMedia('banner',file);event.currentTarget.value='' }}/></label></article><article><span>SHOW LOGO</span>{show.logoImage?<img src={show.logoImage} alt=""/>:<div className="studio36-logo-placeholder">{show.logo}</div>}<label>{show.logoImage?'Replace':'Upload'}<input type="file" accept="image/png,image/webp,image/svg+xml" onChange={(event)=>{const file=event.target.files?.[0];if(file)void replaceShowMedia('logoImage',file);event.currentTarget.value='' }}/></label></article></div></section></div>}

        {tab === 'notifications' && <div className="studio36-content studio36-split"><section className="studio36-card"><div className="studio36-card-head"><div><span>PUBLISH UPDATE</span><h2>Notifications</h2></div></div><form className="studio36-form-grid" onSubmit={publishNotification}><label>Title<input name="title" required/></label><label>Audience<select name="audience" defaultValue="all"><option value="all">Everyone</option><option value="members">Members</option><option value="casting">Casting applicants</option></select></label><label className="full">Message<textarea name="text" required/></label><label>Schedule<input name="publishAt" type="datetime-local"/></label><label>Optional link<input name="link" placeholder="/app/shows/..."/></label><div className="full studio36-publish-actions"><button className="btn muted" type="submit" value="draft">Save Draft</button><button className="btn muted" type="submit" value="scheduled">Schedule</button><button className="btn" type="submit" value="sent">Send Now</button></div></form></section><section className="studio36-card"><div className="studio36-card-head"><div><span>HISTORY</span><h2>Published updates</h2></div></div><div className="studio36-notice-list">{(cms.notifications ?? []).map((notice) => <article key={notice.id}><div><span className={\`studio36-status \${notice.status ?? 'sent'}\`}>{notice.status ?? 'sent'}</span><h3>{notice.title || 'EBG+ Update'}</h3><p>{notice.text}</p><small>{new Date(notice.date).toLocaleString()}</small></div><button className="studio36-danger" type="button" onClick={() => onUpdateCms({ ...cms, notifications:(cms.notifications ?? []).filter((item)=>item.id!==notice.id) })}>Delete</button></article>)}</div></section></div>}
      </div>
    </section>
  )
}

`

source = source.slice(0, hubStart) + hub + source.slice(hubEnd)
fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.36 complete Studio migration.')
