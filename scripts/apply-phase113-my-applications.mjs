import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE113_MY_APPLICATIONS')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.13 patch failed: ${label}`)
  source = next
}

must(
  "import './phase112.css'",
  "import './phase112.css'\nimport { loadMyCastingApplications, type ViewerApplication } from './lib/applicationData'\nimport './phase113.css'\n\n// EBG_PHASE113_MY_APPLICATIONS",
  'imports',
)

must(
  '<a href="https://forms.ebgplus.app">Casting</a>',
  '<a href="https://forms.ebgplus.app">Casting</a>\n              <Link to="/app/applications">My Applications</Link>',
  'Library My Applications link',
)

must(
  '<Route path="my-list" element={<MyListPage profile={profile} showById={showById} onToggleWatchlist={toggleWatchlist} />} />',
  '<Route path="my-list" element={<MyListPage profile={profile} showById={showById} onToggleWatchlist={toggleWatchlist} />} />\n        <Route path="applications" element={<MyApplicationsPage cms={cms} />} />',
  'My Applications route',
)

const component = `function MyApplicationsPage({ cms }: { cms: CmsData }) {
  const [applications, setApplications] = useState<ViewerApplication[]>([])
  const [state, setState] = useState('Loading your applications…')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const rows = await loadMyCastingApplications()
        if (!active) return
        setApplications(rows)
        setState('')
      } catch (error) {
        if (!active) return
        setState(error instanceof Error ? error.message : 'Applications could not be loaded.')
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const publicStatus = (status: string) => {
    const value = status.toLowerCase()
    if (value === 'new') return { label:'Submitted', step:1, message:'Your application is in! EBG Casting has received it.' }
    if (value === 'reviewing') return { label:'Under Review', step:2, message:'The casting team is currently reviewing your application.' }
    if (value === 'callback') return { label:'Next Step', step:3, message:'Good news — EBG Casting would like to continue with your application. Check your email for next-step details.' }
    if (value === 'interview') return { label:'Interview', step:3, message:'Your application has moved to the interview stage. Keep an eye on your email for scheduling details.' }
    if (value === 'finalist') return { label:'Final Review', step:4, message:'You have reached the final review stage. The casting team will contact you when a decision is ready.' }
    if (value === 'cast') return { label:'Selected', step:5, message:'You have been selected! 🎉 Follow the instructions sent by EBG Casting for your next steps.' }
    if (value === 'declined' || value === 'removed') return { label:'Not Selected', step:5, message:'This casting cycle has closed for your application. Thank you for taking the time to apply.' }
    return { label:'In Progress', step:2, message:'Your application is still active. Check back here for updates.' }
  }

  const showTitle = (showId: string) => cms.shows.find((show) => show.id === showId)?.title ?? showId.replaceAll('-', ' ')

  return (
    <main className="applications-page">
      <section className="applications-hero">
        <p className="eyebrow">EBG Casting</p>
        <h1>My Applications</h1>
        <p>Follow your EBG casting applications from submission through the final decision.</p>
      </section>

      {state && <p className="panel">{state}</p>}

      {!state && applications.length === 0 && (
        <section className="applications-empty">
          <h2>No applications yet.</h2>
          <p>When you apply using the same email as your EBG+ account, your status will appear here.</p>
          <a className="btn" href="https://forms.ebgplus.app">Browse Casting</a>
        </section>
      )}

      <section className="applications-grid">
        {applications.map((application) => {
          const status = publicStatus(application.status)
          return (
            <article className="application-card" key={application.id}>
              <div className="application-card-head">
                <div>
                  <h2>{showTitle(application.show_id)}</h2>
                  <div className="application-meta">Submitted {new Date(application.created_at).toLocaleDateString()} · {application.legal_name}</div>
                </div>
                <span className="application-status">{status.label}</span>
              </div>
              <div className="application-progress" aria-label={\`Application progress: \${status.step} of 5\`}>
                {[1,2,3,4,5].map((step) => <span className={step <= status.step ? 'done' : ''} key={step} />)}
              </div>
              <p className="application-update">{status.message}</p>
            </article>
          )
        })}
      </section>
    </main>
  )
}

`

must('function MyListPage(', `${component}function MyListPage(`, 'My Applications component')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.13 My Applications viewer tracker.')
