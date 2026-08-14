import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE112_STUDIO_POLLS_FORMS')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.12 patch failed: ${label}`)
  source = next
}

must(
  "import './phase111.css'",
  "import './phase111.css'\nimport { createPoll, deletePoll, loadPollOptions, loadPollResults, loadPolls, updatePoll, voteInPoll, type Poll, type PollOption, type PollResult } from './lib/pollData'\nimport { submitPublicCastingApplication } from './lib/formsData'\nimport './phase112.css'\n\n// EBG_PHASE112_STUDIO_POLLS_FORMS",
  'phase 1.12 imports',
)

must(
  `      <Route path="/coming-soon" element={<ComingSoonPage />} />`,
  `      <Route path="/coming-soon" element={<ComingSoonPage />} />\n      <Route path="/forms" element={<EbgFormsPage cms={cms} />} />`,
  'EBG Forms public route',
)

const formsPage = `function EbgFormsPage({ cms }: { cms: CmsData }) {
  const castingShows = cms.shows.filter((show) => show.id === 'heartspell-house')
  const [showId, setShowId] = useState(castingShows[0]?.id ?? 'heartspell-house')
  const [state, setState('')]

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState('Submitting…')
    const form = new FormData(event.currentTarget)
    try {
      await submitPublicCastingApplication({
        showId,
        legalName: String(form.get('legalName') ?? ''),
        age: Number(form.get('age') ?? 0),
        cityState: String(form.get('cityState') ?? ''),
        email: String(form.get('email') ?? ''),
        relationshipGoals: String(form.get('relationshipGoals') ?? ''),
        cameraComfort: String(form.get('cameraComfort') ?? ''),
      })
      event.currentTarget.reset()
      setState('Application received. EBG casting will contact selected applicants. ✨')
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Application could not be submitted.')
    }
  }

  return (
    <main className="forms-portal">
      <div className="forms-shell">
        <header className="forms-brand"><Link className="wordmark" to="/">EBG+</Link><span>Forms</span></header>
        <section className="forms-card">
          <p className="forms-eyebrow">EBG Casting</p>
          <h1>Step into the story.</h1>
          <p>Apply for current EBG+ casting opportunities. Heartspell House is the first open series.</p>
          <form className="forms-grid" onSubmit={submit}>
            <label className="full">Series<select value={showId} onChange={(event) => setShowId(event.target.value)}>{castingShows.map((show) => <option value={show.id} key={show.id}>{show.title}</option>)}</select></label>
            <label>Name<input name="legalName" required /></label>
            <label>Age<input name="age" type="number" min="21" required /></label>
            <label>City / State<input name="cityState" required /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label className="full">What are you looking for?<textarea name="relationshipGoals" minLength={10} required /></label>
            <label className="full">Tell us about your comfort being filmed.<textarea name="cameraComfort" minLength={10} required /></label>
            <div className="full actions"><button className="btn" type="submit">Submit Application</button></div>
          </form>
          {state && <p className={state.includes('received') ? 'forms-success' : 'studio-help'}>{state}</p>}
        </section>
      </div>
    </main>
  )
}

`

must('function ComingSoonPage() {', `${formsPage}function ComingSoonPage() {`, 'EBG Forms component')

const livePolls = `function LivePollSection({ showId }: { showId: string }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [options, setOptions] = useState<Record<string, PollOption[]>>({})
  const [results, setResults] = useState<Record<string, PollResult[]>>({})
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const nextPolls = await loadPolls(showId)
      setPolls(nextPolls)
      const optionPairs = await Promise.all(nextPolls.map(async (poll) => [poll.id, await loadPollOptions(poll.id)] as const))
      setOptions(Object.fromEntries(optionPairs))
      const resultPairs = await Promise.all(nextPolls.map(async (poll) => {
        try { return [poll.id, await loadPollResults(poll.id)] as const } catch { return [poll.id, []] as const }
      }))
      setResults(Object.fromEntries(resultPairs))
    } catch {
      setPolls([])
    }
  }

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 2500)
    return () => window.clearInterval(timer)
  }, [showId])

  const vote = async (pollId: string, optionId: string) => {
    setMessage('Saving your vote…')
    try {
      await voteInPoll(pollId, optionId)
      setMessage('Vote counted ✨')
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Vote could not be saved.')
    }
  }

  if (polls.length === 0) return null

  return (
    <section className="heartspell-section live-polls">
      <p className="heartspell-kicker">Fan voting</p>
      <h2>Your vote matters.</h2>
      <p>Results update automatically while polls are live.</p>
      {polls.map((poll) => (
        <article className="live-poll-card" key={poll.id}>
          <span className={\`poll-status \${poll.status}\`}>{poll.status}</span>
          <h3>{poll.question}</h3>
          {poll.description && <p>{poll.description}</p>}
          {poll.status === 'open' && (options[poll.id] ?? []).map((option) => (
            <button className="poll-option-button" type="button" key={option.id} onClick={() => void vote(poll.id, option.id)}><span>{option.label}</span><span>Vote</span></button>
          ))}
          {(results[poll.id] ?? []).map((result) => (
            <div className="fan-result" key={result.option_id}>
              <div className="fan-result-line"><span>{result.label}</span><strong>{result.percentage}%</strong></div>
              <div className="fan-result-bar"><span style={{ width: \`\${result.percentage}%\` }} /></div>
            </div>
          ))}
          {(results[poll.id]?.[0]?.total_votes ?? 0) > 0 && <small>{results[poll.id][0].total_votes} total votes</small>}
        </article>
      ))}
      {message && <p className="studio-help">{message}</p>}
    </section>
  )
}

`

must('function CastProfilePage({ cms }: { cms: CmsData }) {', `${livePolls}function CastProfilePage({ cms }: { cms: CmsData }) {`, 'live polling component')

must(
  `<section className="heartspell-section heartspell-vote-teaser">[\\s\\S]*?</section>`,
  `<LivePollSection showId={show.id} />`,
  'replace Heartspell voting teaser with live polls',
)

const studioHub = `function EbgStudioHub({ cms, castingApps, onUpdateCms, onUpdateCastingStatus }: { cms: CmsData; castingApps: CastingApplication[]; onUpdateCms: (cms: CmsData) => void; onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void> }) {
  const [tab, setTab] = useState('series')
  const [showId, setShowId] = useState(cms.shows[0]?.id ?? '')
  const [polls, setPolls] = useState<Poll[]>([])
  const [pollResults, setPollResults] = useState<Record<string, PollResult[]>>({})
  const [message, setMessage] = useState('')
  const show = cms.shows.find((item) => item.id === showId) ?? cms.shows[0]

  const refreshPolls = async () => {
    try {
      const next = await loadPolls(undefined, true)
      setPolls(next)
      const pairs = await Promise.all(next.map(async (poll) => {
        try { return [poll.id, await loadPollResults(poll.id)] as const } catch { return [poll.id, []] as const }
      }))
      setPollResults(Object.fromEntries(pairs))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load polls.') }
  }

  useEffect(() => {
    void refreshPolls()
    const timer = window.setInterval(() => void refreshPolls(), 2500)
    return () => window.clearInterval(timer)
  }, [])

  if (!show) return null
  const updateShow = (patch: Partial<Show>) => onUpdateCms({ ...cms, shows: cms.shows.map((item) => item.id === show.id ? { ...item, ...patch } : item) })
  const tabs = [['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['homepage','Homepage']]

  const addCast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const imageFile = form.get('imageFile')
      const image = imageFile instanceof File && imageFile.size > 0 ? await uploadStudioMedia(imageFile, \`series/\${show.id}/cast\`) : undefined
      const person = { name:String(form.get('name') ?? ''), role:String(form.get('role') ?? 'Cast'), city:String(form.get('city') ?? ''), bio:String(form.get('bio') ?? ''), social:String(form.get('social') ?? '') || undefined, status:String(form.get('status') ?? '') || undefined, image }
      updateShow({ cast:[...show.cast, person] })
      event.currentTarget.reset(); setMessage('Cast member added.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not add cast member.') }
  }

  const createNewPoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const options = String(form.get('options') ?? '').split('\\n').map((item) => item.trim()).filter(Boolean)
    if (options.length < 2) return setMessage('Add at least two poll options, one per line.')
    try {
      await createPoll({ showId:show.id, question:String(form.get('question') ?? ''), description:String(form.get('description') ?? ''), options, status:String(form.get('status') ?? 'draft') as any, opensAt:String(form.get('opensAt') ?? '') || null, closesAt:String(form.get('closesAt') ?? '') || null, resultsVisibility:String(form.get('resultsVisibility') ?? 'live') as any })
      event.currentTarget.reset(); setMessage('Poll created.'); await refreshPolls()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create poll.') }
  }

  return (
    <section className="ebg-studio-hub">
      <div className="ebg-studio-head"><div><p className="eyebrow">EBG Studio</p><h2>Content headquarters</h2><p>Manage every EBG+ series from one place.</p></div><select className="studio-series-select" value={show.id} onChange={(event) => setShowId(event.target.value)}>{cms.shows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
      <div className="ebg-studio-tabs">{tabs.map(([id,label]) => <button type="button" key={id} className={tab===id?'active':''} onClick={() => setTab(id)}>{label}</button>)}</div>

      {tab === 'series' && <div className="ebg-studio-grid">{cms.shows.map((item) => <article key={item.id} className={\`ebg-studio-card \${item.id===show.id?'selected':''}\`}><img src={item.banner || item.artwork} alt="" /><h3>{item.title}</h3><p>{item.status} · {item.genre}</p><button className="btn muted" type="button" onClick={() => {setShowId(item.id);setTab('episodes')}}>Manage Series</button></article>)}</div>}

      {tab === 'episodes' && <div><div className="studio-section-head"><h3>{show.title} · Episodes</h3><span>{cms.episodes.filter((e) => e.showId===show.id).length} episodes</span></div><div className="studio-stack">{cms.episodes.filter((e) => e.showId===show.id).map((episode) => <div className="studio-row" key={episode.id}><div className="studio-row-copy"><strong>S{episode.season} E{episode.number} · {episode.title}</strong><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleString()}</p></div></div>)}</div><p className="studio-help">Create and schedule new episodes in the existing Episode Manager below. This workspace keeps each series organized.</p></div>}

      {tab === 'cast' && <div><div className="studio-section-head"><h3>{show.title} · Cast & Talent</h3><span>{show.cast.length} people</span></div><div className="studio-stack">{show.cast.map((person,index) => <div className="studio-row" key={person.name+index}><div className="studio-row-copy"><strong>{person.name}</strong><p>{person.role} · {person.city} · {person.status ?? 'Active'}</p></div><button className="btn muted" type="button" onClick={() => updateShow({ cast:show.cast.filter((_,i)=>i!==index) })}>Remove</button></div>)}</div><form className="studio-form-grid" onSubmit={addCast}><label>Name<input name="name" required /></label><label>Role<input name="role" defaultValue="Cast" /></label><label>City / State<input name="city" required /></label><label>Status<input name="status" placeholder="Active / Host / Eliminated" /></label><label>Social<input name="social" placeholder="@handle" /></label><label>Photo<input name="imageFile" type="file" accept="image/*" /></label><label className="full">Bio<textarea name="bio" required /></label><div className="full actions"><button className="btn" type="submit">Add to {show.title}</button></div></form></div>}

      {tab === 'polls' && <div><div className="studio-section-head"><h3>Polls & Voting</h3><span>Live results refresh automatically</span></div><form className="studio-form-grid" onSubmit={createNewPoll}><label className="full">Question<input name="question" required /></label><label className="full">Description<textarea name="description" /></label><label className="full">Options — one per line<textarea name="options" required placeholder={'Option A\\nOption B'} /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="open">Open now</option><option value="closed">Closed</option></select></label><label>Fan results<select name="resultsVisibility" defaultValue="live"><option value="live">Live</option><option value="after_close">After poll closes</option><option value="hidden">Staff only</option></select></label><label>Opens at<input name="opensAt" type="datetime-local" /></label><label>Closes at<input name="closesAt" type="datetime-local" /></label><div className="full actions"><button className="btn" type="submit">Create Poll for {show.title}</button></div></form><div className="studio-stack">{polls.filter((poll)=>poll.show_id===show.id).map((poll)=><div className="ebg-studio-card" key={poll.id}><span className={\`poll-status \${poll.status}\`}>{poll.status}</span><h3>{poll.question}</h3><div className="studio-poll-results">{(pollResults[poll.id]??[]).map((r)=><div className="studio-poll-result" key={r.option_id}><span>{r.label}</span><strong>{r.votes} · {r.percentage}%</strong><div className="studio-poll-bar"><span style={{width:\`\${r.percentage}%\`}} /></div></div>)}</div><div className="actions"><button className="btn muted" onClick={() => void updatePoll(poll.id,{status:poll.status==='open'?'closed':'open'}).then(refreshPolls)} type="button">{poll.status==='open'?'Close Poll':'Open Poll'}</button><button className="btn muted" type="button" onClick={() => {if(confirm('Delete this poll?')) void deletePoll(poll.id).then(refreshPolls)}}>Delete</button></div></div>)}</div></div>}

      {tab === 'casting' && <div><div className="studio-section-head"><h3>Casting</h3><Link className="btn muted" to="/forms" target="_blank">Open EBG Forms</Link></div><div className="studio-stack">{castingApps.map((app)=><div className="studio-row" key={app.id}><div className="studio-row-copy"><strong>{app.legalName}</strong><p>{app.age} · {app.cityState} · {app.status}</p></div><select value={app.status} onChange={(event)=>void onUpdateCastingStatus(app.id,event.target.value as CastingApplication['status'])}>{['New','Reviewing','Callback','Interview','Finalist','Cast','Declined','Removed'].map((s)=><option key={s}>{s}</option>)}</select></div>)}</div></div>}

      {tab === 'media' && <div><h3>{show.title} · Media</h3><p className="studio-help">Poster, banner, logo, episode thumbnails, video uploads, and cast photography are managed per series. Use the Show Manager below for current media replacement controls.</p></div>}
      {tab === 'homepage' && <div><h3>Homepage placement</h3><p>{show.title} is {show.homeVisible===false?'hidden from':'visible on'} Home.</p><div className="actions"><button className="btn" type="button" onClick={()=>updateShow({homeVisible:show.homeVisible===false})}>{show.homeVisible===false?'Show on Home':'Hide from Home'}</button></div></div>}
      {message && <p className="studio-help">{message}</p>}
    </section>
  )
}

`

must(/function HeartspellStudioPanel\([\s\S]*?\n\}\n\n(?=function StudioPage)/, studioHub, 'replace Heartspell-only Studio panel with universal EBG Studio hub')
must('<HeartspellStudioPanel cms={cms} onUpdateCms={onUpdateCms} />', '<EbgStudioHub cms={cms} castingApps={castingApps} onUpdateCms={onUpdateCms} onUpdateCastingStatus={onUpdateCastingStatus} />', 'universal Studio placement')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.12 universal Studio, polls, and Forms portal.')
