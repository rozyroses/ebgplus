import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE131_STUDIO_VISUAL_REDESIGN')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.31 patch failed: ${label}`)
  source = next
}

must(
  "import './phase130-production-workspace.css'",
  "import './phase130-production-workspace.css'\nimport './phase131-studio-visual-redesign.css'\n\n// EBG_PHASE131_STUDIO_VISUAL_REDESIGN",
  'styles import',
)

source = source.replace(
  '<p>Every part of EBG+ now has its own Studio page so you can focus on one job at a time.</p>',
  '<p>Jump into a focused workspace, or open Production Workspace for the full control room.</p>',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.31 Studio visual redesign.')
