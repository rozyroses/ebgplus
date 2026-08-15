import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE127_HOME_HERO_POLISH')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.27 patch failed: ${label}`)
  source = next
}

must(
  "import './phase126-home-hero-media-cleanup.css'",
  "import './phase126-home-hero-media-cleanup.css'\nimport './phase127-studio-flow-home-hero.css'\n\n// EBG_PHASE127_HOME_HERO_POLISH",
  'styles import',
)

source = source.replace(
  'Create and schedule new episodes in the existing Episode Manager below. This workspace keeps each series organized.',
  'Episode publishing tools are available in the dedicated Episodes workspace.'
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.27 homepage hero polish.')
