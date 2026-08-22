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

// Legacy EBG Management has been retired. Keep the historical route only as a
// compatibility redirect so old bookmarks land in EBG Studio instead of
// exposing a second staff dashboard.
must(
  '<Route path="partnerships" element={<PartnershipsPage />} />',
  '<Route path="partnerships" element={<PartnershipsPage />} />\n        <Route path="management" element={<ManagementPage />} />',
  'Management compatibility route',
)

const managementPage = `function ManagementPage() {
  return <Navigate to="/app/studio/overview" replace />
}

`

must('function StudioPage({', `${managementPage}function StudioPage({`, 'Management compatibility redirect')

// Do not add a Management item to the EBG+ Library menu. Staff work now lives
// in EBG Studio only.

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.33 legacy Management retirement and Studio redirect.')
