import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE119_MEDIA_DELETE_HERO_FIT')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.19 patch failed: ${label}`)
  source = next
}

must(
  "import './phase118-replace-media.css'",
  "import './phase118-replace-media.css'\nimport './phase119-media-delete-hero-fit.css'\n\n// EBG_PHASE119_MEDIA_DELETE_HERO_FIT",
  'styles import',
)

must(
  `  bannerPosition?: string\n  logo: string`,
  `  bannerPosition?: string\n  bannerFit?: 'cover' | 'contain'\n  logo: string`,
  'banner fit field',
)

source = source.replaceAll(
  `backgroundPosition: hero.bannerPosition || 'center center' }}`,
  `backgroundPosition: hero.bannerPosition || 'center center', backgroundSize: hero.bannerFit || 'contain' }}`,
)
source = source.replaceAll(
  `backgroundPosition: show.bannerPosition || 'center center' }}`,
  `backgroundPosition: show.bannerPosition || 'center center', backgroundSize: show.bannerFit || 'contain' }}`,
)

const replaceHelperNeedle = `  const setFeaturedShow = (showId: string) => {`
if (!source.includes('const clearShowMedia = (showId: string')) {
  must(
    replaceHelperNeedle,
    `  const clearShowMedia = (showId: string, field: 'artwork' | 'banner' | 'logoImage') => {\n    const current = cms.shows.find((item) => item.id === showId)\n    if (!current) return\n    if (field === 'artwork' && !current.banner) {\n      setState('Add a banner before deleting the poster so the show always has artwork.')\n      return\n    }\n    if (!window.confirm(\`Delete this \${field === 'artwork' ? 'poster' : field === 'logoImage' ? 'logo' : 'banner'}?\`)) return\n    const value = field === 'artwork' ? (current.banner || '') : undefined\n    updateShow(showId, { [field]: value } as Partial<Show>)\n    setState('Media removed.')\n  }\n\n${replaceHelperNeedle}`,
    'clear media helper',
  )
}

const controls = [
  {
    from: `<label className="studio-replace-control"><span>Replace Poster</span><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'artwork', 'shows/posters')} /></label>`,
    to: `<div className="studio-media-actions"><label className="studio-replace-control"><span>Replace Poster</span><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'artwork', 'shows/posters')} /></label><button className="studio-delete-media" type="button" disabled={busy || !show.artwork} onClick={() => clearShowMedia(show.id, 'artwork')}>Delete Poster</button></div>`,
  },
  {
    from: `<label className="studio-replace-control"><span>Replace Banner</span><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'banner', 'shows/banners')} /></label>`,
    to: `<div className="studio-media-actions"><label className="studio-replace-control"><span>{show.banner ? 'Replace Banner' : 'Upload Banner'}</span><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'banner', 'shows/banners')} /></label>{show.banner && <button className="studio-delete-media" type="button" disabled={busy} onClick={() => clearShowMedia(show.id, 'banner')}>Delete Banner</button>}</div>`,
  },
  {
    from: `<label className="studio-replace-control"><span>{show.logoImage ? 'Replace Logo' : 'Upload Logo'}</span><input type="file" accept="image/png,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'logoImage', 'shows/logos')} /></label>`,
    to: `<div className="studio-media-actions"><label className="studio-replace-control"><span>{show.logoImage ? 'Replace Logo' : 'Upload Logo'}</span><input type="file" accept="image/png,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'logoImage', 'shows/logos')} /></label>{show.logoImage && <button className="studio-delete-media" type="button" disabled={busy} onClick={() => clearShowMedia(show.id, 'logoImage')}>Delete Logo</button>}</div>`,
  },
]

for (const { from, to } of controls) must(from, to, 'delete media control')

const oldFitControls = `<label>Banner focal point<select value={show.bannerPosition || 'center center'} onChange={(event)=>updateShow({bannerPosition:event.target.value})}><option value="center center">Center</option><option value="center top">Top</option><option value="center bottom">Bottom</option><option value="left center">Left</option><option value="right center">Right</option><option value="25% center">Left-center</option><option value="75% center">Right-center</option></select></label>`
const newFitControls = `${oldFitControls}<label>Banner fit<select value={show.bannerFit || 'contain'} onChange={(event)=>updateShow({bannerFit:event.target.value as 'cover' | 'contain'})}><option value="contain">Show full banner</option><option value="cover">Fill hero (crop)</option></select></label>`
must(oldFitControls, newFitControls, 'homepage banner fit control')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.19 media delete and hero fit controls.')
