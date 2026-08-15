import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE137_STUDIO_BUILDFIX')) process.exit(0)

const marker = '// EBG_PHASE136_STUDIO_COMPLETE'
if (!source.includes(marker)) throw new Error('Phase 1.37 requires Phase 1.36')
source = source.replace(marker, `${marker}\n// EBG_PHASE137_STUDIO_BUILDFIX`)

source = source.replace(
  'function EbgStudioHub({\n  cms,\n  castingApps,\n  onUpdateCms,',
  'function EbgStudioHub({\n  cms,\n  castingApps: _castingApps,\n  onUpdateCms,',
)

source = source.replace('  const studioNav = useNavigate()\n', '')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.37 Studio build cleanup.')
