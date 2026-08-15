import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE134_STUDIO_SYNTAX_REBUILD')) process.exit(0)

const importNeedle = "import './phase133-management-cleanup.css'"
if (!source.includes(importNeedle)) throw new Error('Phase 1.34 requires Phase 1.33 styles import')
source = source.replace(importNeedle, `${importNeedle}\n\n// EBG_PHASE134_STUDIO_SYNTAX_REBUILD`)

const hubStart = source.indexOf('function EbgStudioHub(')
const hubEnd = source.indexOf('\nfunction ManagementPage(', hubStart)
if (hubStart < 0 || hubEnd < 0) throw new Error('Phase 1.34 could not locate Studio hub boundaries')

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
  const sections = [
    ['overview', 'Overview', 'Dashboard'],
    ['production', 'Production', 'Control room'],
    ['series', 'Series', 'Shows & originals'],
    ['episodes', 'Episodes', 'Upload & releases'],
    ['cast', 'Cast & Talent', 'People'],
    ['polls', 'Polls & Voting', 'Audience'],
    ['media', 'Media', 'Artwork & video'],
    ['notifications', 'Notifications', 'Audience updates'],
  ] as const
  const allowed = sections.map(([id]) => id)
  const tab = allowed.includes((studioSection ?? 'overview') as typeof allowed[number])
    ? (studioSection as typeof allowed[number])
    : 'overview'
  const [showId, setShowId] = useState(cms.shows[0]?.id ?? '')
  const show = cms.shows.find((item) => item.id === showId) ?? cms.shows[0]

  useEffect(() => {
    if (!cms.shows.some((item) => item.id === showId)) setShowId(cms.shows[0]?.id ?? '')
  }, [cms.shows, showId])

  if (!show) return null

  const selectedEpisodes = cms.episodes.filter((episode) => episode.showId === show.id)
  const liveEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'live')
  const scheduledEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'scheduled')
  const selectedTitle = sections.find(([id]) => id === tab)?.[1] ?? 'Overview'
  const updateShow = (patch: Partial<Show>) => {
    onUpdateCms({
      ...cms,
      shows: cms.shows.map((item) => (item.id === show.id ? { ...item, ...patch } : item)),
    })
  }

  return (
    <section className={\`studio2 studio2-\${tab}\`}>
      <aside className="studio2-sidebar">
        <button className="studio2-brand" type="button" onClick={() => studioNav('/app/studio/overview')}>
          <span>EBG</span><strong>STUDIO</strong>
        </button>
        <nav className="studio2-nav" aria-label="EBG Studio">
          {sections.map(([id, label, sub]) => (
            <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => studioNav(\`/app/studio/\${id}\`)}>
              <i aria-hidden="true" />
              <span><strong>{label}</strong><small>{sub}</small></span>
            </button>
          ))}
        </nav>
        <div className="studio2-side-note"><span>LIVE CMS</span><p>{cms.shows.length} series · {cms.episodes.length} episodes</p></div>
      </aside>

      <div className="studio2-main">
        <header className="studio2-topbar">
          <div>
            <p className="studio2-kicker">EBG Studio / {selectedTitle}</p>
            <h1>{selectedTitle}</h1>
            <p>{tab === 'production' ? 'Your all-in-one production command center.' : tab === 'series' ? 'Create and manage EBG+ series.' : tab === 'episodes' ? 'Upload, schedule, publish, and manage episodes.' : 'Manage the EBG+ production slate from one place.'}</p>
          </div>
          <div className="studio2-top-actions">
            <select value={show.id} onChange={(event) => setShowId(event.target.value)}>
              {cms.shows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <Link className="btn muted" to="/app/home">View EBG+</Link>
          </div>
        </header>

        {tab === 'overview' && (
          <div className="studio2-dashboard">
            <section className="studio2-hero-card">
              <div><span className="studio2-eyebrow">PUBLISHING HQ</span><h2>Everything EBG+.<br />One control room.</h2><p>Open Production for the full picture or jump into a focused workspace.</p><div className="actions"><button className="btn" type="button" onClick={() => studioNav('/app/studio/production')}>Open Production</button><button className="btn muted" type="button" onClick={() => studioNav('/app/studio/episodes')}>Upload Episode</button></div></div>
              <div className="studio2-hero-orb"><span>{cms.shows.length}</span><small>ACTIVE<br />SERIES</small></div>
            </section>
            <section className="studio2-stats">
              <article><span>Series</span><strong>{cms.shows.length}</strong><small>on the EBG+ slate</small></article>
              <article><span>Episodes</span><strong>{cms.episodes.length}</strong><small>across all series</small></article>
              <article><span>Casting</span><strong>{castingApps.length}</strong><small>applications in Management</small></article>
              <article><span>Selected</span><strong>{selectedEpisodes.length}</strong><small>{show.title} episodes</small></article>
            </section>
            <section className="studio2-panel studio2-workspace-grid">
              <div className="studio2-panel-head"><div><span>WORKSPACES</span><h3>Choose where to work</h3></div></div>
              <div className="studio2-launch-grid">
                {sections.filter(([id]) => id !== 'overview').map(([id, label, sub], index) => (
                  <button type="button" key={id} onClick={() => studioNav(\`/app/studio/\${id}\`)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong><small>{sub}</small><b>→</b></button>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'production' && (
          <div className="studio2-production">
            <section className="studio2-stats compact">
              <article><span>Selected series</span><strong>{show.title}</strong><small>{show.status}</small></article>
              <article><span>Episodes</span><strong>{selectedEpisodes.length}</strong><small>{liveEpisodes.length} live · {scheduledEpisodes.length} scheduled</small></article>
              <article><span>Cast</span><strong>{show.cast.length}</strong><small>profiles attached</small></article>
              <article><span>Homepage</span><strong>{show.homeVisible === false ? 'Hidden' : 'Visible'}</strong><small>viewer availability</small></article>
            </section>
            <section className="studio2-command-grid">
              <article className="studio2-panel studio2-series-command"><div className="studio2-panel-head"><div><span>SERIES CONTROL</span><h3>{show.title}</h3></div><button type="button" onClick={() => studioNav('/app/studio/series')}>Full editor</button></div><div className="studio2-series-banner" style={{ backgroundImage: \`linear-gradient(90deg,rgba(5,5,6,.92),rgba(5,5,6,.18)),url(\${show.banner || show.artwork})\` }}><div><span>{show.category}</span><h4>{show.title}</h4><p>{show.genre} · {show.year} · {show.maturity}</p><button className="btn muted" type="button" onClick={() => updateShow({ homeVisible: show.homeVisible === false })}>{show.homeVisible === false ? 'Show on Home' : 'Hide from Home'}</button></div></div></article>
              <article className="studio2-panel"><div className="studio2-panel-head"><div><span>EPISODES</span><h3>Release board</h3></div><button type="button" onClick={() => studioNav('/app/studio/episodes')}>Manage</button></div><div className="studio2-list">{selectedEpisodes.slice(-5).reverse().map((episode) => <div key={episode.id}><img src={episode.thumbnail} alt="" /><span><strong>{episode.title}</strong><small>S{episode.season}E{episode.number} · {episode.runtime}</small></span><em>{episode.publishStatus ?? 'scheduled'}</em></div>)}</div></article>
              <article className="studio2-panel"><div className="studio2-panel-head"><div><span>TALENT</span><h3>Cast & Talent</h3></div><button type="button" onClick={() => studioNav('/app/studio/cast')}>Manage</button></div><div className="studio2-people">{show.cast.slice(0, 6).map((person, index) => <div key={person.name + index}>{person.image ? <img src={person.image} alt="" /> : <span>{person.name.slice(0, 1)}</span>}<strong>{person.name}</strong><small>{person.role}</small></div>)}</div></article>
              <article className="studio2-panel"><div className="studio2-panel-head"><div><span>QUICK ACTIONS</span><h3>Keep production moving</h3></div></div><div className="studio2-quick-actions"><button type="button" onClick={() => studioNav('/app/studio/series')}>Manage series <b>→</b></button><button type="button" onClick={() => studioNav('/app/studio/episodes')}>Upload episode <b>→</b></button><button type="button" onClick={() => studioNav('/app/studio/media')}>Manage media <b>→</b></button><button type="button" onClick={() => studioNav('/app/studio/notifications')}>Send update <b>→</b></button></div></article>
            </section>
          </div>
        )}

        {tab === 'series' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>SERIES LIBRARY</span><h2>Your shows</h2><p>Select a series, then use the Show Manager below to edit details and media.</p></div></div><div className="studio2-show-grid">{cms.shows.map((item) => <button type="button" key={item.id} className={item.id === show.id ? 'selected' : ''} onClick={() => setShowId(item.id)}><img src={item.artwork} alt="" /><div><span>{item.status}</span><strong>{item.title}</strong><small>{item.genre} · {item.year}</small></div></button>)}</div></div>}

        {tab === 'episodes' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>EPISODE LIBRARY</span><h2>{show.title}</h2><p>The Episode Manager, Scheduler, and guided uploader are directly below.</p></div><span className="studio2-count">{selectedEpisodes.length} episodes</span></div><div className="studio2-episode-grid">{selectedEpisodes.map((episode) => <article key={episode.id}><img src={episode.thumbnail} alt="" /><div><span>S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime}</p><em>{episode.publishStatus ?? 'scheduled'}</em></div></article>)}</div></div>}

        {tab === 'cast' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>CAST & TALENT</span><h2>{show.title}</h2><p>Talent attached to this production.</p></div><span className="studio2-count">{show.cast.length} people</span></div><div className="studio2-cast-grid">{show.cast.map((person, index) => <article key={person.name + index}>{person.image ? <img src={person.image} alt="" /> : <div className="studio2-avatar-fallback">{person.name.slice(0, 1)}</div>}<div><h3>{person.name}</h3><p>{person.role} · {person.city}</p><small>{person.bio}</small></div></article>)}</div></div>}

        {tab === 'polls' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>AUDIENCE</span><h2>Polls & Voting</h2><p>Poll publishing remains connected to the existing Studio poll system.</p></div></div></div>}

        {tab === 'media' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>MEDIA LIBRARY</span><h2>{show.title}</h2><p>Core artwork and video assets for the selected series.</p></div></div><div className="studio2-assets"><article><span>POSTER / COVER</span><img src={show.artwork} alt="" /></article><article className="wide"><span>BANNER</span><img src={show.banner || show.artwork} alt="" /></article><article><span>SHOW LOGO</span>{show.logoImage ? <img src={show.logoImage} alt="" /> : <div className="studio2-logo-placeholder">{show.logo}</div>}</article></div></div>}

        {tab === 'notifications' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>AUDIENCE UPDATES</span><h2>Notifications</h2><p>Recent EBG+ viewer updates.</p></div><span className="studio2-count">{(cms.notifications ?? []).length} updates</span></div><div className="studio2-notice-list">{(cms.notifications ?? []).map((notification) => <article key={notification.id}><h3>{notification.title || 'EBG+ Update'}</h3><p>{notification.text}</p><small>{new Date(notification.date).toLocaleString()}</small></article>)}</div></div>}
      </div>
    </section>
  )
}

`

source = source.slice(0, hubStart) + hub + source.slice(hubEnd)
fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.34 Studio syntax rebuild.')
