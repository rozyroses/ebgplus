import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_PHASE147_HOMEPAGE_POLISH')) process.exit(0)

const anchor = "import './phase145-studio-episode-actions.css'"
if (!source.includes(anchor)) throw new Error('Phase 1.47 patch failed: style import anchor not found')

source = source.replace(
  anchor,
  `${anchor}\nimport './phase147-homepage-polish.css'\n\n// EBG_PHASE147_HOMEPAGE_POLISH`,
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.47 homepage card and Coming Soon polish.')
