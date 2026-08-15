import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE128_STUDIO_PAGES')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.28 patch failed: ${label}`)
  source = next
}

must(
  "import './phase127-studio-flow-home-hero.css'",
  "import './phase127-studio-flow-home-hero.css'\nimport './phase128-studio-pages.css'\n\n// EBG_PHASE128_STUDIO_PAGES",
  'styles import',
)

must('path="studio"', 'path="studio/:studioSection?"', 'Studio routed path')

must(
  "  const [tab, setTab] = useState('series')",
  `  const { studioSection } = useParams()\n  const studioNav = useNavigate()\n  const allowedStudioSections = ['overview','series','episodes','cast','polls','casting','media','notifications','homepage']\n  const tab = allowedStudioSections.includes(studioSection ?? '') ? (studioSection as string) : 'overview'\n  const setTab = (next: string) => studioNav(\`/app/studio/\${next}\`)`,
  'route-backed Studio section',
)

must(
  "  const tabs = [['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['notifications','Notifications'],['homepage','Homepage']]",
  "  const tabs = [['overview','Overview'],['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['notifications','Notifications'],['homepage','Homepage']]",
  'Studio page navigation',
)

const seriesNeedle = `      {tab === 'series' &&`
const overview = `      {tab === 'overview' && <div className="studio-page-overview">\n        <div className="studio-page-title"><div><p className="eyebrow">EBG Studio</p><h3>Choose a workspace</h3><p>Every part of EBG+ now has its own Studio page so you can focus on one job at a time.</p></div></div>\n        <div className="studio-page-launcher">\n          {tabs.filter(([id]) => id !== 'overview').map(([id,label], index) => <button className="studio-page-launch-card" type="button" key={id} onClick={() => setTab(id)}><span>{String(index + 1).padStart(2,'0')}</span><strong>{label}</strong><small>{id === 'series' ? 'Create and manage shows.' : id === 'episodes' ? 'Upload, publish, schedule, and archive episodes.' : id === 'cast' ? 'Manage cast and talent profiles.' : id === 'polls' ? 'Build polls and control fan voting.' : id === 'casting' ? 'Review applications and update statuses.' : id === 'media' ? 'Manage posters, banners, logos, thumbnails, and video.' : id === 'notifications' ? 'Draft, schedule, and send viewer updates.' : 'Control featured homepage content.'}</small></button>)}\n        </div>\n      </div>}\n\n${seriesNeedle}`
must(seriesNeedle, overview, 'Studio overview page')

must(
  `  const [castingFilter, setCastingFilter] = useState<CastingApplication['status'] | 'All'>('All')`,
  `  const [castingFilter, setCastingFilter] = useState<CastingApplication['status'] | 'All'>('All')\n  const { studioSection } = useParams()`,
  'Studio page route state',
)

must(
  '<main className="page">\n      <h1>EBG Studio</h1>',
  `<main className={\`page studio-route studio-route-\${studioSection || 'overview'}\`}>\n      <h1>EBG Studio</h1>`,
  'Studio route class',
)

source = source.replace(
  '<section className="panel">\n          <h2>Home Page</h2>',
  '<section className="panel legacy-home-manager">\n          <h2>Home Page</h2>',
)
source = source.replace(
  '<section className="panel">\n          <h2>Casting Pipeline</h2>',
  '<section className="panel legacy-casting-manager">\n          <h2>Casting Pipeline</h2>',
)
source = source.replace(
  '<section className="panel">\n        <h2>Show Manager</h2>',
  '<section className="panel legacy-show-manager">\n        <h2>Show Manager</h2>',
)
source = source.replace(
  '<section className="panel">\n        <h2>Episode Manager & Scheduler</h2>',
  '<section className="panel legacy-episode-manager">\n        <h2>Episode Manager & Scheduler</h2>',
)

if (!source.includes('legacy-show-manager') || !source.includes('legacy-episode-manager')) {
  throw new Error('Phase 1.28 could not classify the legacy Studio managers.')
}

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.28 routed Studio pages.')
