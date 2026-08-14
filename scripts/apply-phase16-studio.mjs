import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_PHASE16_STUDIO_INTEGRATED')) process.exit(0)

const mustReplace = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Could not apply ${label} Phase 1.6 patch.`)
  source = next
}

mustReplace(
  "import { useEffect, useMemo, useState } from 'react'",
  "import { useEffect, useMemo, useRef, useState } from 'react'",
  'React ref import',
)

mustReplace(
  '// EBG_SUPABASE_USERDATA_INTEGRATED',
  `// EBG_SUPABASE_USERDATA_INTEGRATED\nimport { loadCmsData, saveCmsData, updateCastingApplicationStatus, uploadStudioMedia } from './lib/studioData'\n\n// EBG_PHASE16_STUDIO_INTEGRATED`,
  'Studio data imports',
)

mustReplace(
  `type CmsData = {\n  slogan: string\n  heroShowId: string\n  shows: Show[]\n  episodes: Episode[]\n  rails: ContentRail[]\n  comingSoon: string[]\n}`,
  `type CmsData = {\n  slogan: string\n  heroShowId: string\n  shows: Show[]\n  episodes: Episode[]\n  rails: ContentRail[]\n  comingSoon: string[]\n  notifications?: NotificationItem[]\n}`,
  'CMS notification wall type',
)

mustReplace(
  "  useEffect(() => saveJson(STORAGE.cms, cms), [cms])",
  `  useEffect(() => saveJson(STORAGE.cms, cms), [cms])\n  useEffect(() => {\n    void loadCmsData<CmsData>()\n      .then((remoteCms) => {\n        if (remoteCms) setCms(remoteCms)\n      })\n      .catch((error) => console.error('Could not load EBG+ Studio CMS.', error))\n  }, [])`,
  'CMS hydration',
)

mustReplace(
  "              onUpdateCms={setCms}",
  `              onUpdateCms={(nextCms) => {\n                setCms(nextCms)\n                void saveCmsData(nextCms).catch((error) => console.error('Could not save EBG+ Studio CMS.', error))\n              }}\n              onUpdateCastingStatus={async (applicationId, status) => {\n                await updateCastingApplicationStatus(applicationId, status)\n                setCastingApps((previous) => previous.map((app) => app.id === applicationId ? { ...app, status } : app))\n              }}`,
  'Studio persistence callbacks',
)

mustReplace(
  `  onCreateCastingApplication,\n}: {\n  account: Account\n  profile: Profile\n  cms: CmsData\n  castingApps: CastingApplication[]\n  onUpdateCms: (cms: CmsData) => void\n  onUpdateAccount: (account: Account) => void\n  onSignOut: () => void\n  onCreateCastingApplication: (app: CastingApplication) => Promise<void>\n}) {`,
  `  onCreateCastingApplication,\n  onUpdateCastingStatus,\n}: {\n  account: Account\n  profile: Profile\n  cms: CmsData\n  castingApps: CastingApplication[]\n  onUpdateCms: (cms: CmsData) => void\n  onUpdateAccount: (account: Account) => void\n  onSignOut: () => void\n  onCreateCastingApplication: (app: CastingApplication) => Promise<void>\n  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>\n}) {`,
  'AppLayout Studio callback',
)

mustReplace(
  `            <StudioPage\n              account={account}\n              cms={cms}\n              castingApps={castingApps}\n              onUpdateCms={onUpdateCms}\n            />`,
  `            <StudioPage\n              account={account}\n              cms={cms}\n              castingApps={castingApps}\n              onUpdateCms={onUpdateCms}\n              onUpdateCastingStatus={onUpdateCastingStatus}\n            />`,
  'Studio route callback',
)

mustReplace(
  'element={<WatchPage episodes={cms.episodes} profile={profile} savePlayback={savePlayback} />}',
  'element={<WatchPage episodes={cms.episodes.filter(isEpisodeReleased)} profile={profile} savePlayback={savePlayback} />}',
  'scheduled episode route guard',
)

mustReplace(
  "  const episodes = cms.episodes.filter((episode) => episode.showId === show.id)",
  "  const episodes = cms.episodes.filter((episode) => episode.showId === show.id && isEpisodeReleased(episode))",
  'scheduled show episode filter',
)

mustReplace(
  '<Route path="notifications" element={<NotificationsPage account={account} />} />',
  '<Route path="notifications" element={<NotificationsPage cms={cms} />} />',
  'notification wall route',
)

const notificationsPage = `function NotificationsPage({ cms }: { cms: CmsData }) {
  const notifications = [...(cms.notifications ?? [])]
    .filter((notification) => {
      const publishAt = Date.parse(notification.date)
      return Number.isNaN(publishAt) || publishAt <= Date.now()
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

  return (
    <main className="page">
      <h1>Notification Wall</h1>
      {notifications.length === 0 ? (
        <p className="panel">No announcements yet. Check back soon.</p>
      ) : (
        <ul className="list">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <p>{notification.text}</p>
              <small>{new Date(notification.date).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}`

mustReplace(
  /function NotificationsPage\([\s\S]*?\n\}\n\nfunction SettingsPage/,
  `${notificationsPage}\n\nfunction SettingsPage`,
  'notification wall page',
)

mustReplace(
  "function WatchPage({",
  `const isEpisodeReleased = (episode: Episode) => {\n  const releaseAt = Date.parse(episode.releaseDate)\n  return Number.isNaN(releaseAt) || releaseAt <= Date.now()\n}\n\nfunction WatchPage({`,
  'episode release helper',
)

const watchPage = `function WatchPage({
  episodes,
  profile,
  savePlayback,
}: {
  episodes: Episode[]
  profile: Profile
  savePlayback: (episodeId: string, seconds: number) => void
}) {
  const { episodeId } = useParams()
  const nav = useNavigate()
  const episode = episodes.find((item) => item.id === episodeId)
  const currentIndex = episodes.findIndex((item) => item.id === episodeId)
  const nextEpisode = currentIndex >= 0 ? episodes[currentIndex + 1] : undefined
  const [ended, setEnded] = useState(false)
  const lastSavedSeconds = useRef(0)

  useEffect(() => {
    if (episode) lastSavedSeconds.current = profile.playback[episode.id] ?? 0
  }, [episode?.id])

  if (!episode) return <NotFoundPage />

  const persistProgress = (seconds: number, force = false) => {
    const safeSeconds = Math.max(0, Math.floor(seconds))
    if (!force && Math.abs(safeSeconds - lastSavedSeconds.current) < 10) return
    lastSavedSeconds.current = safeSeconds
    savePlayback(episode.id, safeSeconds)
  }

  return (
    <main className="player-page">
      <button className="btn muted" onClick={() => nav(-1)}>
        Back
      </button>
      <h1>
        {episode.title} · S{episode.season}:E{episode.number}
      </h1>
      <video
        controls
        autoPlay
        src={episode.videoUrl}
        onLoadedMetadata={(event) => {
          const saved = profile.playback[episode.id] ?? 0
          lastSavedSeconds.current = saved
          if (saved > 0) event.currentTarget.currentTime = saved
        }}
        onTimeUpdate={(event) => persistProgress(event.currentTarget.currentTime)}
        onPause={(event) => persistProgress(event.currentTarget.currentTime, true)}
        onEnded={() => {
          persistProgress(0, true)
          setEnded(true)
        }}
      />
      {ended && nextEpisode && (
        <section className="panel">
          <h2>Next Episode</h2>
          <p>{nextEpisode.title}</p>
          <div className="actions">
            <Link className="btn" to={\`/app/watch/\${nextEpisode.id}\`}>
              Play Next
            </Link>
            <button className="btn muted" onClick={() => setEnded(false)}>
              Cancel Autoplay
            </button>
          </div>
        </section>
      )}
    </main>
  )
}`

mustReplace(/function WatchPage\([\s\S]*?\n\}\n\nfunction MyListPage/, `${watchPage}\n\nfunction MyListPage`, 'playback throttling')

const studioPage = `function StudioPage({
  account,
  cms,
  castingApps,
  onUpdateCms,
  onUpdateCastingStatus,
}: {
  account: Account
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>
}) {
  const [state, setState] = useState('')
  const [busy, setBusy] = useState(false)
  const [castingFilter, setCastingFilter] = useState<CastingApplication['status'] | 'All'>('All')
  const statuses: CastingApplication['status'][] = ['New', 'Reviewing', 'Callback', 'Interview', 'Finalist', 'Cast', 'Declined', 'Removed']

  if (!['founder', 'administrator', 'producer', 'editor'].includes(account.role)) {
    return (
      <main className="page">
        <h1>Authentication Error</h1>
        <p>You are not authorized to access EBG Studio.</p>
      </main>
    )
  }

  const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const updateShow = (showId: string, patch: Partial<Show>) => {
    onUpdateCms({ ...cms, shows: cms.shows.map((show) => show.id === showId ? { ...show, ...patch } : show) })
  }

  const deleteShow = (showId: string) => {
    if (!confirm('Delete this show and all of its episodes from EBG+?')) return
    const remainingShows = cms.shows.filter((show) => show.id !== showId)
    onUpdateCms({
      ...cms,
      heroShowId: cms.heroShowId === showId ? (remainingShows[0]?.id ?? '') : cms.heroShowId,
      shows: remainingShows,
      episodes: cms.episodes.filter((episode) => episode.showId !== showId),
      rails: cms.rails.map((rail) => ({ ...rail, showIds: rail.showIds.filter((id) => id !== showId) })),
    })
  }

  const addShow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    setBusy(true)
    setState('')
    try {
      const artworkFile = form.get('artworkFile')
      const artwork = artworkFile instanceof File && artworkFile.size > 0
        ? await uploadStudioMedia(artworkFile, 'shows')
        : String(form.get('artworkUrl') ?? '').trim()
      const baseId = slugify(title) || \`show-\${Date.now()}\`
      const showId = cms.shows.some((show) => show.id === baseId) ? \`\${baseId}-\${Date.now()}\` : baseId
      const nextShow: Show = {
        id: showId,
        title,
        category: String(form.get('category') ?? 'EBG+ Original'),
        description: String(form.get('description') ?? ''),
        genre: String(form.get('genre') ?? ''),
        year: Number(form.get('year') ?? new Date().getFullYear()),
        maturity: String(form.get('maturity') ?? 'TV-14') as Show['maturity'],
        status: String(form.get('status') ?? 'Coming Soon') as Show['status'],
        artwork: artwork || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80',
        logo: String(form.get('logo') ?? title).trim() || title,
        cast: [],
      }
      onUpdateCms({ ...cms, shows: [...cms.shows, nextShow] })
      formEl.reset()
      setState(\`\${title} added to EBG+.\`)
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Show could not be added.')
    } finally {
      setBusy(false)
    }
  }

  const addEpisode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    setBusy(true)
    setState('')
    try {
      const showId = String(form.get('showId') ?? '')
      const title = String(form.get('title') ?? '').trim()
      const videoFile = form.get('videoFile')
      const thumbnailFile = form.get('thumbnailFile')
      const videoUrl = videoFile instanceof File && videoFile.size > 0
        ? await uploadStudioMedia(videoFile, 'episodes')
        : String(form.get('videoUrl') ?? '').trim()
      if (!videoUrl) throw new Error('Choose an episode video file or paste a video URL.')
      const thumbnail = thumbnailFile instanceof File && thumbnailFile.size > 0
        ? await uploadStudioMedia(thumbnailFile, 'thumbnails')
        : String(form.get('thumbnailUrl') ?? '').trim()
      const releaseInput = String(form.get('releaseAt') ?? '')
      const releaseDate = releaseInput ? new Date(releaseInput).toISOString() : new Date().toISOString()
      const season = Number(form.get('season') ?? 1)
      const number = Number(form.get('number') ?? 1)
      const episode: Episode = {
        id: \`\${showId}-s\${season}e\${number}-\${Date.now()}\`,
        showId,
        season,
        number,
        title,
        synopsis: String(form.get('synopsis') ?? ''),
        runtime: String(form.get('runtime') ?? ''),
        releaseDate,
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
        videoUrl,
      }
      onUpdateCms({ ...cms, episodes: [...cms.episodes, episode] })
      formEl.reset()
      setState(\`\${title} uploaded and scheduled.\`)
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Episode could not be added.')
    } finally {
      setBusy(false)
    }
  }

  const postNotification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const text = String(form.get('text') ?? '').trim()
    if (!text) return
    const publishInput = String(form.get('publishAt') ?? '')
    const date = publishInput ? new Date(publishInput).toISOString() : new Date().toISOString()
    const notification: NotificationItem = { id: \`notice-\${Date.now()}\`, text, date, read: false }
    onUpdateCms({ ...cms, notifications: [notification, ...(cms.notifications ?? [])] })
    formEl.reset()
    setState('Notification posted to the wall.')
  }

  const visibleCasting = castingFilter === 'All' ? castingApps : castingApps.filter((app) => app.status === castingFilter)

  return (
    <main className="page">
      <h1>EBG Studio</h1>
      <p>Production control for EBG+ shows, episodes, release schedules, casting, and audience notifications.</p>
      {state && <p className="panel">{state}</p>}

      <div className="grid-2">
        <section className="panel">
          <h2>Home Page</h2>
          <label>Brand Slogan<input value={cms.slogan} onChange={(event) => onUpdateCms({ ...cms, slogan: event.target.value })} /></label>
          <label>Hero Show<select value={cms.heroShowId} onChange={(event) => onUpdateCms({ ...cms, heroShowId: event.target.value })}>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>
        </section>

        <section className="panel">
          <h2>Casting Pipeline</h2>
          <p>{castingApps.length} total applications</p>
          <label>Filter<select value={castingFilter} onChange={(event) => setCastingFilter(event.target.value as typeof castingFilter)}><option value="All">All</option>{statuses.map((status) => <option key={status} value={status}>{status} ({castingApps.filter((app) => app.status === status).length})</option>)}</select></label>
          <ul className="list">
            {visibleCasting.map((app) => (
              <li key={app.id}>
                <strong>{app.legalName}</strong> · {app.age} · {app.cityState}<br />
                <small>{app.email}</small>
                <select value={app.status} onChange={(event) => void onUpdateCastingStatus(app.id, event.target.value as CastingApplication['status']).catch((error) => setState(error.message))}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Show Manager</h2>
        <div className="grid-2">
          {cms.shows.map((show) => (
            <article className="panel" key={show.id}>
              <label>Title<input defaultValue={show.title} onBlur={(event) => updateShow(show.id, { title: event.target.value })} /></label>
              <label>Description<textarea defaultValue={show.description} onBlur={(event) => updateShow(show.id, { description: event.target.value })} /></label>
              <label>Status<select value={show.status} onChange={(event) => updateShow(show.id, { status: event.target.value as Show['status'] })}>{['Coming Soon','Now Streaming','Current','On Hiatus','Completed'].map((status) => <option key={status}>{status}</option>)}</select></label>
              <p>{cms.episodes.filter((episode) => episode.showId === show.id).length} episodes</p>
              <button className="btn muted" type="button" onClick={() => deleteShow(show.id)}>Delete Show</button>
            </article>
          ))}
        </div>
        <h3>Add New Show</h3>
        <form className="form-grid" onSubmit={addShow}>
          <label>Title<input name="title" required /></label>
          <label>Logo / Display Title<input name="logo" /></label>
          <label>Category<input name="category" defaultValue="EBG+ Original" required /></label>
          <label>Genre<input name="genre" required /></label>
          <label>Year<input name="year" type="number" defaultValue={new Date().getFullYear()} required /></label>
          <label>Maturity<select name="maturity" defaultValue="TV-14"><option>TV-PG</option><option>TV-14</option><option>TV-MA</option></select></label>
          <label>Status<select name="status" defaultValue="Coming Soon"><option>Coming Soon</option><option>Now Streaming</option><option>Current</option><option>On Hiatus</option><option>Completed</option></select></label>
          <label>Artwork Image<input name="artworkFile" type="file" accept="image/*" /></label>
          <label>Or Artwork URL<input name="artworkUrl" type="url" /></label>
          <label>Description<textarea name="description" required /></label>
          <button className="btn" disabled={busy}>{busy ? 'Working…' : 'Add Show'}</button>
        </form>
      </section>

      <section className="panel">
        <h2>Episode Manager & Scheduler</h2>
        <div className="grid-2">
          {cms.episodes.slice().sort((a, b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate)).map((episode) => {
            const show = cms.shows.find((item) => item.id === episode.showId)
            return (
              <article className="panel" key={episode.id}>
                <strong>{show?.title ?? episode.showId} · S{episode.season}E{episode.number}</strong>
                <h3>{episode.title}</h3>
                <p>{isEpisodeReleased(episode) ? 'Live now' : 'Scheduled'} · {new Date(episode.releaseDate).toLocaleString()}</p>
                <button className="btn muted" type="button" onClick={() => onUpdateCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) })}>Delete Episode</button>
              </article>
            )
          })}
        </div>
        <h3>Upload / Add Episode</h3>
        <form className="form-grid" onSubmit={addEpisode}>
          <label>Series<select name="showId" required>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>
          <label>Season<input name="season" type="number" min="1" defaultValue="1" required /></label>
          <label>Episode Number<input name="number" type="number" min="1" defaultValue="1" required /></label>
          <label>Episode Title<input name="title" required /></label>
          <label>Runtime<input name="runtime" placeholder="47m" required /></label>
          <label>Release Date & Time<input name="releaseAt" type="datetime-local" required /></label>
          <label>Episode Video<input name="videoFile" type="file" accept="video/*" /></label>
          <label>Or Video URL<input name="videoUrl" type="url" /></label>
          <label>Thumbnail<input name="thumbnailFile" type="file" accept="image/*" /></label>
          <label>Or Thumbnail URL<input name="thumbnailUrl" type="url" /></label>
          <label>Synopsis<textarea name="synopsis" required /></label>
          <button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Add Episode'}</button>
        </form>
      </section>

      <section className="panel">
        <h2>Notification Wall</h2>
        <form className="form-grid" onSubmit={postNotification}>
          <label>Message<textarea name="text" required /></label>
          <label>Publish Date & Time<input name="publishAt" type="datetime-local" /></label>
          <button className="btn">Post Notification</button>
        </form>
        <ul className="list">
          {(cms.notifications ?? []).map((notification) => (
            <li key={notification.id}>
              <p>{notification.text}</p>
              <small>{new Date(notification.date).toLocaleString()}</small>
              <button className="btn muted" type="button" onClick={() => onUpdateCms({ ...cms, notifications: (cms.notifications ?? []).filter((item) => item.id !== notification.id) })}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}`

mustReplace(/function StudioPage\([\s\S]*?\n\}\n\nfunction CastingPage/, `${studioPage}\n\nfunction CastingPage`, 'Studio control center')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.6 Studio, scheduling, notifications, media upload, and playback throttling.')
