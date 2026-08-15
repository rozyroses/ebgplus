import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE135_STUDIO_RENDER_FIX')) process.exit(0)

const styleNeedle = "import './phase133-management-cleanup.css'"
if (!source.includes(styleNeedle)) throw new Error('Phase 1.35 requires Phase 1.33 styles import')
source = source.replace(
  styleNeedle,
  `${styleNeedle}\nimport './phase135-studio-render-fix.css'`,
)

const studioStart = source.indexOf('function StudioPage(')
const studioEnd = source.indexOf('\nfunction CastingPage', studioStart)
if (studioStart < 0 || studioEnd < 0) throw new Error('Phase 1.35 could not locate StudioPage boundaries')

let studio = source.slice(studioStart, studioEnd)
const hub = '<EbgStudioHub cms={cms} castingApps={castingApps} onUpdateCms={onUpdateCms} onUpdateCastingStatus={onUpdateCastingStatus} />'
const hubIndex = studio.indexOf(hub)
if (hubIndex < 0) throw new Error('Phase 1.35 could not find the Studio hub placement')

// Phase 1.12 placed the universal hub inside the legacy Home Page manager.
// Phase 1.33 intentionally hides that manager, so Studio 2.0 was being built
// and deployed inside a hidden ancestor. Remove that placement and mount the
// hub at the top level of StudioPage instead.
studio = studio.slice(0, hubIndex) + studio.slice(hubIndex + hub.length)

const gridAnchor = '<div className="grid-2">'
const gridIndex = studio.indexOf(gridAnchor)
if (gridIndex < 0) throw new Error('Phase 1.35 could not find the legacy manager grid')
studio = studio.slice(0, gridIndex) + `{/* EBG_PHASE135_STUDIO_RENDER_FIX */}\n      ${hub}\n      ` + studio.slice(gridIndex)

source = source.slice(0, studioStart) + studio + source.slice(studioEnd)
fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.35 Studio render placement fix.')
