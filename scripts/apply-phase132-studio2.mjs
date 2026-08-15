import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE132_STUDIO2')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.32 patch failed: ${label}`)
  source = next
}

must(
  "import './phase131-studio-visual-redesign.css'",
  "import './phase131-studio-visual-redesign.css'\nimport './phase132-studio2.css'\n\n// EBG_PHASE132_STUDIO2",
  'styles import',
)

const hubStart = source.indexOf('function EbgStudioHub(')
const hubEnd = source.indexOf('\nfunction StudioPage', hubStart)
if (hubStart < 0 || hubEnd < 0) throw new Error('Phase 1.32 patch failed: EbgStudioHub not found')
let hub = source.slice(hubStart, hubEnd)

const returnStart = hub.indexOf('  return (')
const returnEnd = hub.lastIndexOf('\n  )\n}')
if (returnStart < 0 || returnEnd < 0) throw new Error('Phase 1.32 patch failed: EbgStudioHub return block not found')

const newReturn = `  const studioSections = [
    ['overview','Overview','Dashboard'],
    ['production','Production','Control room'],
    ['series','Series','Shows & originals'],
    ['episodes','Episodes','Upload & releases'],
    ['cast','Cast & Talent','People'],
    ['polls','Polls & Voting','Audience'],
    ['casting','Casting','Pipeline'],
    ['media','Media','Artwork & video'],
    ['notifications','Notifications','Audience updates'],
    ['homepage','Homepage','Featured content'],
  ]
  const studioTitle = studioSections.find(([id]) => id === tab)?.[1] ?? 'Overview'
  const studioSubtitle = studioSections.find(([id]) => id === tab)?.[2] ?? 'Dashboard'
  const selectedEpisodes = cms.episodes.filter((episode) => episode.showId === show.id)
  const liveEpisodes = cms.episodes.filter((episode) => episode.publishStatus === 'live' || (!episode.publishStatus && Date.parse(episode.releaseDate) <= Date.now()))
  const scheduledEpisodes = cms.episodes.filter((episode) => episode.publishStatus === 'scheduled')
  const activePolls = polls.filter((poll) => poll.status === 'open')
  const openCasting = castingApps.filter((app) => !['Cast','Declined','Removed'].includes(app.status))
  const recentEpisodes = [...cms.episodes].sort((a,b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate)).slice(0,5)

  return (
    <section className={\`studio2 studio2-\${tab}\`}>
      <aside className="studio2-sidebar">
        <Link className="studio2-brand" to="/app/studio/overview"><span>EBG</span><strong>STUDIO</strong></Link>
        <nav className="studio2-nav" aria-label="EBG Studio">
          {studioSections.map(([id,label,sub]) => <Link key={id} to={\`/app/studio/\${id}\`} className={tab===id?'active':''}><i aria-hidden="true" /><span><strong>{label}</strong><small>{sub}</small></span></Link>)}
        </nav>
        <div className="studio2-side-note"><span>LIVE CMS</span><p>{cms.shows.length} series · {cms.episodes.length} episodes</p></div>
      </aside>

      <div className="studio2-main">
        <header className="studio2-topbar">
          <div><p className="studio2-kicker">EBG Studio / {studioTitle}</p><h1>{studioTitle}</h1><p>{tab === 'overview' ? 'Your publishing dashboard for everything happening across EBG+.' : tab === 'production' ? 'The all-in-one command center for shows, episodes, talent, media, polls, releases, and audience updates.' : tab === 'homepage' ? 'Shape the first thing viewers see when they open EBG+.' : tab === 'casting' ? 'Review applicants and move talent through the casting process.' : \`Manage \${studioSubtitle.toLowerCase()} without the rest of Studio getting in your way.\`}</p></div>
          <div className="studio2-top-actions"><select value={show.id} onChange={(event) => setShowId(event.target.value)}>{cms.shows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Link className="btn muted" to="/app/home">View EBG+</Link></div>
        </header>

        {tab === 'overview' && <div className="studio2-dashboard">
          <section className="studio2-hero-card">
            <div><span className="studio2-eyebrow">PUBLISHING HQ</span><h2>Everything EBG+.<br/>One control room.</h2><p>Jump into a focused workspace or open Production for the full picture.</p><div className="actions"><Link className="btn" to="/app/studio/production">Open Production</Link><Link className="btn muted" to="/app/studio/episodes">Upload Episode</Link></div></div>
            <div className="studio2-hero-orb"><span>{cms.shows.length}</span><small>ACTIVE<br/>SERIES</small></div>
          </section>
          <section className="studio2-stats">
            <article><span>Series</span><strong>{cms.shows.length}</strong><small>{cms.shows.filter((item)=>item.status==='Now Streaming'||item.status==='Current').length} currently active</small></article>
            <article><span>Episodes</span><strong>{cms.episodes.length}</strong><small>{liveEpisodes.length} live · {scheduledEpisodes.length} scheduled</small></article>
            <article><span>Casting</span><strong>{openCasting.length}</strong><small>{castingApps.length} total applications</small></article>
            <article><span>Live polls</span><strong>{activePolls.length}</strong><small>{polls.length} total polls</small></article>
          </section>
          <section className="studio2-panel studio2-workspace-grid"><div className="studio2-panel-head"><div><span>WORKSPACES</span><h3>Where do you want to work?</h3></div></div><div className="studio2-launch-grid">{studioSections.filter(([id])=>!['overview'].includes(id)).map(([id,label,sub],index)=><Link to={\`/app/studio/\${id}\`} key={id}><span>{String(index+1).padStart(2,'0')}</span><strong>{label}</strong><small>{sub}</small><b>→</b></Link>)}</div></section>
          <section className="studio2-two-col"><article className="studio2-panel"><div className="studio2-panel-head"><div><span>RECENT RELEASES</span><h3>Episodes</h3></div><Link to="/app/studio/episodes">See all</Link></div><div className="studio2-list">{recentEpisodes.map((episode)=><div key={episode.id}><img src={episode.thumbnail} alt=""/><span><strong>{episode.title}</strong><small>{cms.shows.find((item)=>item.id===episode.showId)?.title ?? episode.showId} · S{episode.season}E{episode.number}</small></span><em>{episode.publishStatus ?? (Date.parse(episode.releaseDate)<=Date.now()?'live':'scheduled')}</em></div>)}</div></article><article className="studio2-panel"><div className="studio2-panel-head"><div><span>SERIES</span><h3>Current slate</h3></div><Link to="/app/studio/series">Manage</Link></div><div className="studio2-poster-row">{cms.shows.slice(0,4).map((item)=><button type="button" key={item.id} onClick={()=>{setShowId(item.id);setTab('series')}}><img src={item.artwork} alt=""/><span>{item.title}</span></button>)}</div></article></section>
        </div>}

        {tab === 'production' && <div className="studio2-production">
          <section className="studio2-stats compact"><article><span>Selected series</span><strong>{show.title}</strong><small>{show.status}</small></article><article><span>Episodes</span><strong>{selectedEpisodes.length}</strong><small>{selectedEpisodes.filter((e)=>e.publishStatus==='live').length} live</small></article><article><span>Cast</span><strong>{show.cast.length}</strong><small>profiles attached</small></article><article><span>Polls</span><strong>{polls.filter((p)=>p.show_id===show.id).length}</strong><small>{polls.filter((p)=>p.show_id===show.id&&p.status==='open').length} open now</small></article></section>
          <section className="studio2-command-grid">
            <article className="studio2-panel studio2-series-command"><div className="studio2-panel-head"><div><span>SERIES CONTROL</span><h3>{show.title}</h3></div><Link to="/app/studio/series">Full editor</Link></div><div className="studio2-series-banner" style={{backgroundImage:\`linear-gradient(90deg,rgba(5,5,6,.92),rgba(5,5,6,.18)),url(\${show.banner||show.artwork})\`}}><div><span>{show.category}</span><h4>{show.title}</h4><p>{show.genre} · {show.year} · {show.maturity}</p><button className="btn muted" type="button" onClick={()=>updateShow({homeVisible:show.homeVisible===false})}>{show.homeVisible===false?'Show on Home':'Hide from Home'}</button></div></div></article>
            <article className="studio2-panel"><div className="studio2-panel-head"><div><span>RELEASE QUEUE</span><h3>Episodes</h3></div><Link to="/app/studio/episodes">Manage</Link></div><div className="studio2-list">{selectedEpisodes.slice(-5).reverse().map((episode)=><div key={episode.id}><img src={episode.thumbnail} alt=""/><span><strong>{episode.title}</strong><small>S{episode.season}E{episode.number} · {episode.runtime}</small></span><select value={episode.publishStatus ?? (Date.parse(episode.releaseDate)<=Date.now()?'live':'scheduled')} onChange={(event)=>onUpdateCms({...cms,episodes:cms.episodes.map((item)=>item.id===episode.id?{...item,publishStatus:event.target.value as Episode['publishStatus']}:item)})}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></div>)}</div></article>
            <article className="studio2-panel"><div className="studio2-panel-head"><div><span>TALENT</span><h3>Cast & Talent</h3></div><Link to="/app/studio/cast">Manage</Link></div><div className="studio2-people">{show.cast.slice(0,6).map((person,index)=><div key={person.name+index}>{person.image?<img src={person.image} alt=""/>:<span>{person.name.slice(0,1)}</span>}<strong>{person.name}</strong><small>{person.role}</small></div>)}</div></article>
            <article className="studio2-panel"><div className="studio2-panel-head"><div><span>AUDIENCE</span><h3>Polls & Updates</h3></div><Link to="/app/studio/polls">Open polls</Link></div><div className="studio2-mini-cards"><div><strong>{polls.filter((p)=>p.show_id===show.id&&p.status==='open').length}</strong><span>open polls</span></div><div><strong>{(cms.notifications??[]).filter((n)=>n.status==='scheduled').length}</strong><span>scheduled notices</span></div><div><strong>{(cms.notifications??[]).filter((n)=>n.status==='sent'||!n.status).length}</strong><span>sent updates</span></div></div></article>
            <article className="studio2-panel studio2-media-command"><div className="studio2-panel-head"><div><span>MEDIA</span><h3>Brand assets</h3></div><Link to="/app/studio/media">Manage</Link></div><div className="studio2-media-strip"><div><small>Poster</small><img src={show.artwork} alt=""/></div><div><small>Banner</small><img src={show.banner||show.artwork} alt=""/></div><div><small>Logo</small>{show.logoImage?<img src={show.logoImage} alt=""/>:<span>{show.logo}</span>}</div></div></article>
            <article className="studio2-panel"><div className="studio2-panel-head"><div><span>QUICK ACTIONS</span><h3>Keep production moving</h3></div></div><div className="studio2-quick-actions"><Link to="/app/studio/episodes">Upload episode <b>→</b></Link><Link to="/app/studio/media">Replace artwork <b>→</b></Link><Link to="/app/studio/cast">Add talent <b>→</b></Link><Link to="/app/studio/notifications">Send update <b>→</b></Link></div></article>
          </section>
        </div>}

        {tab === 'series' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>SERIES LIBRARY</span><h2>Your shows</h2><p>Select a series to edit its production details and assets below.</p></div><a className="btn" href="#studio-create-series">Create Series</a></div><div className="studio2-show-grid">{cms.shows.map((item)=><button type="button" key={item.id} className={item.id===show.id?'selected':''} onClick={()=>setShowId(item.id)}><img src={item.artwork} alt=""/><div><span>{item.status}</span><strong>{item.title}</strong><small>{item.genre} · {item.year}</small></div></button>)}</div></div>}

        {tab === 'episodes' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>EPISODE LIBRARY</span><h2>{show.title}</h2><p>Manage releases, media, status, and upload new episodes with the guided flow below.</p></div><span className="studio2-count">{selectedEpisodes.length} episodes</span></div><div className="studio2-episode-grid">{selectedEpisodes.map((episode)=><article key={episode.id}><img src={episode.thumbnail} alt=""/><div><span>S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleDateString()}</p><em>{episode.publishStatus ?? 'scheduled'}</em></div></article>)}</div></div>}

        {tab === 'cast' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>CAST & TALENT</span><h2>{show.title}</h2><p>Manage cast profiles, roles, bios, and photography.</p></div><span className="studio2-count">{show.cast.length} people</span></div><div className="studio2-cast-grid">{show.cast.map((person,index)=><article key={person.name+index}>{person.image?<img src={person.image} alt=""/>:<div className="studio2-avatar-fallback">{person.name.slice(0,1)}</div>}<div><span>{person.status??'Active'}</span><h3>{person.name}</h3><p>{person.role} · {person.city}</p><small>{person.bio}</small><button type="button" className="studio-delete-media" onClick={()=>updateShow({cast:show.cast.filter((_,i)=>i!==index)})}>Remove</button></div></article>)}</div><section className="studio2-panel studio2-create-card"><span>ADD TALENT</span><h3>New cast profile</h3><form className="studio-form-grid" onSubmit={addCast}><label>Name<input name="name" required /></label><label>Role<input name="role" defaultValue="Cast" /></label><label>City / State<input name="city" required /></label><label>Status<input name="status" placeholder="Active / Host / Eliminated" /></label><label>Social<input name="social" placeholder="@handle" /></label><label>Photo<input name="imageFile" type="file" accept="image/*" /></label><label className="full">Bio<textarea name="bio" required /></label><div className="full actions"><button className="btn" type="submit">Add to {show.title}</button></div></form></section></div>}

        {tab === 'polls' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>AUDIENCE INTERACTION</span><h2>Polls & Voting</h2><p>Create fan polls, open or close voting, and watch results.</p></div><span className="studio2-count">{activePolls.length} live</span></div><div className="studio2-poll-grid">{polls.filter((poll)=>poll.show_id===show.id).map((poll)=><article key={poll.id}><div><em>{poll.status}</em><h3>{poll.question}</h3><p>{poll.description}</p></div><div className="studio2-poll-results">{(pollResults[poll.id]??[]).slice(0,4).map((result)=><div key={result.option_id}><span>{result.label}</span><strong>{result.percentage}%</strong></div>)}</div><div className="actions"><button className="btn muted" type="button" onClick={()=>void updatePoll(poll.id,{status:poll.status==='open'?'closed':'open'}).then(refreshPolls)}>{poll.status==='open'?'Close Poll':'Open Poll'}</button><button className="studio-delete-media" type="button" onClick={()=>{if(confirm('Delete this poll?')) void deletePoll(poll.id).then(refreshPolls)}}>Delete</button></div></article>)}</div><section className="studio2-panel studio2-create-card"><span>NEW POLL</span><h3>Create audience vote</h3><form className="studio-form-grid" onSubmit={createNewPoll}><label className="full">Question<input name="question" required /></label><label className="full">Description<textarea name="description" /></label><label className="full">Options — one per line<textarea name="options" required /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="open">Open now</option><option value="closed">Closed</option></select></label><label>Fan results<select name="resultsVisibility" defaultValue="live"><option value="live">Live</option><option value="after_close">After poll closes</option><option value="hidden">Staff only</option></select></label><label>Opens at<input name="opensAt" type="datetime-local" /></label><label>Closes at<input name="closesAt" type="datetime-local" /></label><div className="full actions"><button className="btn" type="submit">Create Poll</button></div></form></section></div>}

        {tab === 'casting' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>CASTING PIPELINE</span><h2>Applications</h2><p>Move applicants through review, callbacks, interviews, finalist decisions, and casting.</p></div><Link className="btn muted" to="https://forms.ebgplus.app" target="_blank">Open EBG Forms</Link></div><div className="studio2-casting-board">{['New','Reviewing','Callback','Interview','Finalist','Cast'].map((status)=><section key={status}><div><strong>{status}</strong><span>{castingApps.filter((app)=>app.status===status).length}</span></div>{castingApps.filter((app)=>app.status===status).map((app)=><article key={app.id}><h4>{app.legalName}</h4><p>{app.age} · {app.cityState}</p><small>{app.email}</small><select value={app.status} onChange={(event)=>void onUpdateCastingStatus(app.id,event.target.value as CastingApplication['status'])}>{['New','Reviewing','Callback','Interview','Finalist','Cast','Declined','Removed'].map((item)=><option key={item}>{item}</option>)}</select></article>)}</section>)}</div></div>}

        {tab === 'media' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>MEDIA LIBRARY</span><h2>{show.title}</h2><p>See every core visual asset in one place. Replacement controls live in the editor below.</p></div></div><div className="studio2-assets"><article><span>POSTER / COVER</span><img src={show.artwork} alt=""/></article><article className="wide"><span>HOMEPAGE / SHOW BANNER</span><img src={show.banner||show.artwork} alt=""/></article><article><span>SHOW LOGO</span>{show.logoImage?<img src={show.logoImage} alt=""/>:<div className="studio2-logo-placeholder">{show.logo}</div>}</article></div></div>}

        {tab === 'notifications' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>AUDIENCE UPDATES</span><h2>Notifications</h2><p>Draft, schedule, and send updates to EBG+ viewers.</p></div><span className="studio2-count">{(cms.notifications??[]).length} updates</span></div><section className="studio2-panel studio2-create-card"><form className="studio-form-grid notification-publisher" onSubmit={publishNotification}><label>Title<input name="title" required placeholder="New episode tonight" /></label><label>Audience<select name="audience" defaultValue="all"><option value="all">Everyone</option><option value="members">Signed-in members</option><option value="casting">Casting applicants</option></select></label><label className="full">Message<textarea name="text" required /></label><label>Schedule date & time<input name="publishAt" type="datetime-local" /></label><label>Optional EBG+ link<input name="link" placeholder="/app/shows/..." /></label><div className="full notification-publish-actions"><button className="btn muted" type="submit" value="draft">Save Draft</button><button className="btn muted" type="submit" value="scheduled">Schedule</button><button className="btn" type="submit" value="sent">Send Now</button></div></form></section><div className="studio2-notice-list">{(cms.notifications??[]).map((notification)=><article key={notification.id}><div><em>{notification.status??'sent'}</em><span>{notification.audience??'all'}</span></div><h3>{notification.title||'EBG+ Update'}</h3><p>{notification.text}</p><small>{new Date(notification.date).toLocaleString()}</small><button className="studio-delete-media" type="button" onClick={()=>onUpdateCms({...cms,notifications:(cms.notifications??[]).filter((item)=>item.id!==notification.id)})}>Delete</button></article>)}</div></div>}

        {tab === 'homepage' && <div className="studio2-route-page"><div className="studio2-page-intro"><div><span>HOMEPAGE EDITING</span><h2>Viewer first impression</h2><p>Choose the featured series and control what appears on Home. The detailed controls are below.</p></div><Link className="btn muted" to="/app/home">Preview Home</Link></div><section className="studio2-home-preview" style={{backgroundImage:\`linear-gradient(90deg,rgba(5,5,6,.9),rgba(5,5,6,.15)),url(\${(cms.shows.find((item)=>item.id===cms.heroShowId)?.banner||cms.shows.find((item)=>item.id===cms.heroShowId)?.artwork)||show.artwork})\`}}><div><span>FEATURED NOW</span><h3>{cms.shows.find((item)=>item.id===cms.heroShowId)?.title ?? show.title}</h3><p>{cms.slogan}</p></div></section></div>}

        {message && <div className="studio2-toast">{message}</div>}
      </div>
    </section>
  )`

hub = hub.slice(0, returnStart) + newReturn + hub.slice(returnEnd + '\n  )'.length)
source = source.slice(0, hubStart) + hub + source.slice(hubEnd)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.32 Studio 2.0 full interface rebuild.')
