import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE127_STUDIO_FLOW_HOME_HERO')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.27 patch failed: ${label}`)
  source = next
}

must(
  "import './phase126-home-hero-media-cleanup.css'",
  "import './phase126-home-hero-media-cleanup.css'\nimport './phase127-studio-flow-home-hero.css'\n\n// EBG_PHASE127_STUDIO_FLOW_HOME_HERO",
  'styles import',
)

must(
  "  const [tab, setTab] = useState('series')",
  "  const [tab, setTab] = useState('overview')",
  'Studio initial workflow screen',
)

must(
  "  const tabs = [['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['homepage','Homepage']]",
  "  const tabs = [['overview','Overview'],['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['homepage','Homepage']]",
  'Studio overview tab',
)

const tabsNeedle = `      <div className="ebg-studio-tabs">{tabs.map(([id,label]) => <button type="button" key={id} className={tab===id?'active':''} onClick={() => setTab(id)}>{label}</button>)}</div>`
const flow = `${tabsNeedle}\n\n      {tab === 'overview' && <div className="studio-flow-grid">\n        <button type="button" className="studio-flow-card" onClick={() => setTab('series')}><span>01</span><strong>Series</strong><small>Create and manage EBG+ shows.</small></button>\n        <button type="button" className="studio-flow-card" onClick={() => setTab('episodes')}><span>02</span><strong>Episodes</strong><small>Upload, schedule, publish, and archive episodes.</small></button>\n        <button type="button" className="studio-flow-card" onClick={() => setTab('cast')}><span>03</span><strong>Cast & Talent</strong><small>Manage public cast profiles and talent.</small></button>\n        <button type="button" className="studio-flow-card" onClick={() => setTab('polls')}><span>04</span><strong>Polls & Voting</strong><small>Create fan voting and control results.</small></button>\n        <button type="button" className="studio-flow-card" onClick={() => setTab('casting')}><span>05</span><strong>Casting</strong><small>Review applications and update statuses.</small></button>\n        <button type="button" className="studio-flow-card" onClick={() => setTab('media')}><span>06</span><strong>Media</strong><small>Posters, banners, logos, video, and thumbnails.</small></button>\n        <button type="button" className="studio-flow-card" onClick={() => setTab('homepage')}><span>07</span><strong>Homepage</strong><small>Choose featured content and presentation.</small></button>\n      </div>}`
must(tabsNeedle, flow, 'Studio workflow launcher')

source = source.replace(
  'Create and schedule new episodes in the existing Episode Manager below. This workspace keeps each series organized.',
  'Choose this workspace when you want to manage episodes. Publishing controls stay grouped with the episode tools so you can work one step at a time.'
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.27 Studio workflow and homepage hero polish.')
