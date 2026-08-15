import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE130_PRODUCTION_WORKSPACE')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.30 patch failed: ${label}`)
  source = next
}

must(
  "import './phase129-studio-workspace-flow.css'",
  "import './phase129-studio-workspace-flow.css'\nimport './phase130-production-workspace.css'\n\n// EBG_PHASE130_PRODUCTION_WORKSPACE",
  'styles import',
)

must(
  "const allowedStudioSections = ['overview','series','episodes','cast','polls','casting','media','notifications','homepage']",
  "const allowedStudioSections = ['overview','production','series','episodes','cast','polls','casting','media','notifications','homepage']",
  'production route allowance',
)

must(
  "const tabs = [['overview','Overview'],['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['notifications','Notifications'],['homepage','Homepage']]",
  "const tabs = [['overview','Overview'],['production','Production Workspace'],['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting Pipeline'],['media','Media'],['notifications','Notifications'],['homepage','Homepage Editing']]",
  'Studio workspace navigation',
)

source = source.replace(
  '<div className="ebg-studio-head"><div><p className="eyebrow">EBG Studio</p><h2>Production workspace</h2><p>Choose a workspace, focus on one task, and publish when you are ready.</p></div>',
  `<div className="ebg-studio-head"><div><p className="eyebrow">EBG Studio</p><h2>{tab === 'production' ? 'Production Workspace' : tab === 'homepage' ? 'Homepage Editing' : tab === 'casting' ? 'Casting Pipeline' : tabs.find(([id]) => id === tab)?.[1] || 'Studio Workspace'}</h2><p>{tab === 'production' ? 'Your all-in-one production control room — series, episodes, media, cast, polls, releases, and audience updates together.' : tab === 'homepage' ? 'Control what viewers see on the EBG+ homepage without production tools getting in the way.' : tab === 'casting' ? 'Review applicants and move them through the casting process in one dedicated workspace.' : 'Focus on one Studio task at a time, with room to work.'}</p></div>`,
)

const hubStart = source.indexOf('function EbgStudioHub(')
const hubEnd = source.indexOf('\nfunction StudioPage', hubStart)
if (hubStart < 0 || hubEnd < 0) throw new Error('Phase 1.30 patch failed: EbgStudioHub not found')
let hub = source.slice(hubStart, hubEnd)

for (const section of ['series', 'episodes', 'cast', 'polls', 'media', 'notifications']) {
  const needle = `{tab === '${section}' &&`
  const replacement = `{(tab === '${section}' || tab === 'production') &&`
  if (!hub.includes(needle)) throw new Error(`Phase 1.30 patch failed: ${section} production inclusion`)
  hub = hub.replace(needle, replacement)
}

source = source.slice(0, hubStart) + hub + source.slice(hubEnd)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.30 combined Production Workspace with separate Homepage and Casting pages.')
