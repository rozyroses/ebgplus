import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE133_MANAGEMENT_CLEANUP')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.33 patch failed: ${label}`)
  source = next
}

must(
  "import './phase132-studio2.css'",
  "import './phase132-studio2.css'\nimport './phase133-management-cleanup.css'\n\n// EBG_PHASE133_MANAGEMENT_CLEANUP",
  'styles import',
)

must(
  '<Route path="studio/:studioSection?" element={<StudioPage',
  '<Route path="management" element={<ManagementPage account={account} cms={cms} castingApps={castingApps} onUpdateCms={onUpdateCms} onUpdateCastingStatus={onUpdateCastingStatus} />} />\n          <Route path="studio/:studioSection?" element={<StudioPage',
  'Management route',
)

const managementPage = `function ManagementPage({
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
  const [castingFilter, setCastingFilter] = useState<CastingApplication['status'] | 'All'>('All')
  const [message, setMessage] = useState('')
  const statuses: CastingApplication['status'][] = ['New', 'Reviewing', 'Callback', 'Interview', 'Finalist', 'Cast', 'Declined', 'Removed']
  const visibleCasting = castingFilter === 'All' ? castingApps : castingApps.filter((app) => app.status === castingFilter)
  const staff = ['founder', 'administrator', 'producer', 'editor'].includes(account.role)

  if (!staff) {
    return <main className="page"><h1>Authentication Error</h1><p>You are not authorized to access EBG Management.</p></main>
  }

  return (
    <main className="management-page">
      <header className="management-hero">
        <div><p className="eyebrow">Library / Management</p><h1>EBG Management</h1><p>Homepage controls and casting operations live here, outside the production Studio.</p></div>
        <Link className="btn muted" to="/app/studio/overview">Open EBG Studio</Link>
      </header>
      {message && <p className="panel management-message">{message}</p>}

      <section className="management-grid">
        <article className="management-card">
          <div className="management-card-head"><div><span>HOMEPAGE</span><h2>Homepage Editing</h2></div><Link to="/app/home">View Home</Link></div>
          <label>Brand Slogan<input value={cms.slogan} onChange={(event) => onUpdateCms({ ...cms, slogan: event.target.value })} /></label>
          <label>Featured Show<select value={cms.heroShowId} onChange={(event) => onUpdateCms({ ...cms, heroShowId: event.target.value })}>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>
          <p className="management-help">The featured show controls the large EBG+ homepage hero. Only shows enabled for Home should be featured.</p>
          <div className="management-show-list">{cms.shows.map((show) => <button type="button" key={show.id} className={show.id === cms.heroShowId ? 'active' : ''} onClick={() => onUpdateCms({ ...cms, heroShowId: show.id })}><img src={show.artwork} alt="" /><span><strong>{show.title}</strong><small>{show.status}</small></span></button>)}</div>
        </article>

        <article className="management-card">
          <div className="management-card-head"><div><span>CASTING</span><h2>Casting Pipeline</h2></div><a href="https://forms.ebgplus.app" target="_blank" rel="noreferrer">Open Forms</a></div>
          <div className="management-casting-summary"><strong>{castingApps.length}</strong><span>total applications</span></div>
          <label>Filter<select value={castingFilter} onChange={(event) => setCastingFilter(event.target.value as typeof castingFilter)}><option value="All">All</option>{statuses.map((status) => <option key={status} value={status}>{status} ({castingApps.filter((app) => app.status === status).length})</option>)}</select></label>
          <div className="management-applications">{visibleCasting.map((app) => <article key={app.id}><div><strong>{app.legalName}</strong><p>{app.age} · {app.cityState}</p><small>{app.email}</small></div><select value={app.status} onChange={(event) => void onUpdateCastingStatus(app.id, event.target.value as CastingApplication['status']).then(() => setMessage(app.legalName + ' moved to ' + event.target.value + '.')).catch((error) => setMessage(error instanceof Error ? error.message : 'Could not update casting status.'))}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></article>)}</div>
        </article>
      </section>
    </main>
  )
}

`

must('function StudioPage({', `${managementPage}function StudioPage({`, 'Management component')

const menuMatch = source.match(/<details className="nav-menu library-menu">[\s\S]*?<\/details>/)
if (!menuMatch) throw new Error('Phase 1.33 patch failed: Library menu not found')
let menu = menuMatch[0]
if (!menu.includes('/app/management')) {
  const myApps = '<Link to="/app/applications">My Applications</Link>'
  if (!menu.includes(myApps)) throw new Error('Phase 1.33 patch failed: Library My Applications anchor')
  menu = menu.replace(myApps, `${myApps}\n              {['founder','administrator','producer','editor'].includes(account.role) && <Link to="/app/management">Management</Link>}`)
  source = source.replace(menuMatch[0], menu)
}

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.33 Management page and legacy Studio cleanup.')
