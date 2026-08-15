import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE127_STUDIO_ROUTE_FLOW')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.27 patch failed: ${label}`)
  source = next
}

must(
  "import './phase126-home-hero-media-cleanup.css'",
  "import './phase126-home-hero-media-cleanup.css'\nimport './phase127-studio-flow-home-hero.css'\n\n// EBG_PHASE127_STUDIO_ROUTE_FLOW",
  'styles import',
)

must(
  'path="studio"',
  'path="studio/*"',
  'Studio wildcard route',
)

const hubStart = source.indexOf('function EbgStudioHub(')
const hubEnd = source.indexOf('\nfunction StudioPage', hubStart)
if (hubStart < 0 || hubEnd < 0) throw new Error('Phase 1.27 patch failed: EBG Studio hub not found')
let hub = source.slice(hubStart, hubEnd)

mustHub(
  "  const [tab, setTab] = useState('series')",
  "  const studioLocation = useLocation()\n  const navigate = useNavigate()\n  const routePart = studioLocation.pathname.split('/').filter(Boolean).at(-1)\n  const studioSection = routePart === 'studio' ? 'overview' : (routePart || 'overview')",
  'Studio route state',
)

function mustHub(pattern, replacement, label) {
  const next = hub.replace(pattern, replacement)
  if (next === hub) throw new Error(`Phase 1.27 patch failed: ${label}`)
  hub = next
}

mustHub(
  "  const tabs = [['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['notifications','Notifications'],['homepage','Homepage']]",
  "  const studioSections = [['overview','Overview'],['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['notifications','Notifications'],['homepage','Homepage']] as const",
  'Studio section list',
)

const oldTabs = `      <div className="ebg-studio-tabs">{tabs.map(([id,label]) => <button type="button" key={id} className={tab===id?'active':''} onClick={() => setTab(id)}>{label}</button>)}</div>`
const newTabs = `      <nav className="ebg-studio-tabs studio-route-nav" aria-label="EBG Studio sections">{studioSections.map(([id,label]) => <Link key={id} to={\`/app/studio/\${id}\`} className={studioSection===id?'active':''}>{label}</Link>)}</nav>`
mustHub(oldTabs, newTabs, 'Studio route navigation')

const overview = `\n\n      {studioSection === 'overview' && <div className="studio-flow-grid">{studioSections.filter(([id]) => id !== 'overview').map(([id,label], index) => <Link key={id} className="studio-flow-card" to={\`/app/studio/\${id}\`}><span>{String(index + 1).padStart(2,'0')}</span><strong>{label}</strong><small>{id === 'series' ? 'Create and manage EBG+ shows.' : id === 'episodes' ? 'Upload, schedule, publish, and archive episodes.' : id === 'cast' ? 'Manage cast and talent profiles.' : id === 'polls' ? 'Create fan voting and control results.' : id === 'casting' ? 'Review applications and update statuses.' : id === 'media' ? 'Manage posters, banners, logos, video, and thumbnails.' : id === 'notifications' ? 'Draft, schedule, and send viewer updates.' : 'Control featured homepage content and placement.'}</small></Link>)}</div>}`
hub = hub.replace(newTabs, newTabs + overview)

hub = hub.replaceAll("tab === '", "studioSection === '")
hub = hub.replaceAll("tab===", "studioSection===")
hub = hub.replace("setTab('episodes')", "navigate('/app/studio/episodes')")
hub = hub.replace(
  'Create and schedule new episodes in the existing Episode Manager below. This workspace keeps each series organized.',
  'Use the full publishing manager on this Episodes page to create, schedule, publish, replace, or remove episode media.'
)
hub = hub.replace(
  'Poster, banner, logo, episode thumbnails, video uploads, and cast photography are managed per series. Use the Show Manager below for current media replacement controls.',
  'Poster, banner, logo, episode thumbnails, video uploads, and cast photography are managed here for the selected series.'
)

source = source.slice(0, hubStart) + hub + source.slice(hubEnd)

const studioStart = source.indexOf('function StudioPage(')
const studioEnd = source.indexOf('\nfunction CastingPage', studioStart)
if (studioStart < 0 || studioEnd < 0) throw new Error('Phase 1.27 patch failed: StudioPage not found')
let studio = source.slice(studioStart, studioEnd)

const statusNeedle = "  const statuses: CastingApplication['status'][] = ['New', 'Reviewing', 'Callback', 'Interview', 'Finalist', 'Cast', 'Declined', 'Removed']"
const statusReplacement = `${statusNeedle}\n  const studioLocation = useLocation()\n  const studioRoutePart = studioLocation.pathname.split('/').filter(Boolean).at(-1)\n  const studioRoute = studioRoutePart === 'studio' ? 'overview' : (studioRoutePart || 'overview')`
if (!studio.includes(statusNeedle)) throw new Error('Phase 1.27 patch failed: Studio route helper hook')
studio = studio.replace(statusNeedle, statusReplacement)

const studioMain = `  return (\n    <main className="page">\n      <h1>EBG Studio</h1>`
const studioMainReplacement = `  return (\n    <main className={\`page studio-page studio-route-\${studioRoute}\`}>\n      <h1>EBG Studio</h1>`
if (!studio.includes(studioMain)) throw new Error('Phase 1.27 patch failed: Studio page class')
studio = studio.replace(studioMain, studioMainReplacement)

const summaryGrid = `      <div className="grid-2">\n        <section className="panel">`
if (!studio.includes(summaryGrid)) throw new Error('Phase 1.27 patch failed: Studio summary grid')
studio = studio.replace(summaryGrid, `      <div className="grid-2 studio-legacy-summary-grid">\n        <section className="panel">`)

const showManager = `      <section className="panel">\n        <h2>Show Manager</h2>`
if (!studio.includes(showManager)) throw new Error('Phase 1.27 patch failed: Show Manager section')
studio = studio.replace(showManager, `      <section className="panel studio-legacy-series-manager">\n        <h2>Show Manager</h2>`)

const episodeManager = `      <section className="panel">\n        <h2>Episode Manager & Scheduler</h2>`
if (!studio.includes(episodeManager)) throw new Error('Phase 1.27 patch failed: Episode Manager section')
studio = studio.replace(episodeManager, `      <section className="panel studio-legacy-episode-manager">\n        <h2>Episode Manager & Scheduler</h2>`)

source = source.slice(0, studioStart) + studio + source.slice(studioEnd)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.27 dedicated Studio route workspaces and homepage hero polish.')
