import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE118_REPLACE_MEDIA')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.18 patch failed: ${label}`)
  source = next
}

must(
  "import './phase117-studio-polish.css'",
  "import './phase117-studio-polish.css'\nimport './phase118-replace-media.css'\n\n// EBG_PHASE118_REPLACE_MEDIA",
  'styles import',
)

const replacements = [
  {
    from: `<div><strong>Poster / Cover</strong><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'artwork', 'shows/posters')} /></div>`,
    to: `<div><strong>Poster / Cover</strong><label className="studio-replace-control"><span>Replace Poster</span><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'artwork', 'shows/posters')} /></label></div>`,
  },
  {
    from: `<div><strong>Banner</strong><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'banner', 'shows/banners')} /></div>`,
    to: `<div><strong>Banner</strong><label className="studio-replace-control"><span>Replace Banner</span><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'banner', 'shows/banners')} /></label></div>`,
  },
  {
    from: `<div><strong>Show Logo</strong><input type="file" accept="image/png,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'logoImage', 'shows/logos')} /></div>`,
    to: `<div><strong>Show Logo</strong><label className="studio-replace-control"><span>{show.logoImage ? 'Replace Logo' : 'Upload Logo'}</span><input type="file" accept="image/png,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'logoImage', 'shows/logos')} /></label></div>`,
  },
  {
    from: `<label>Photo<input name="imageFile" type="file" accept="image/*" /></label>`,
    to: `<label>Photo<span className="studio-upload-hint">Add or replace the cast photo.</span><span className="studio-replace-control"><span>Upload / Replace Photo</span><input name="imageFile" type="file" accept="image/*" /></span></label>`,
  },
]

let changed = 0
for (const { from, to } of replacements) {
  if (source.includes(from)) {
    source = source.replaceAll(from, to)
    changed += 1
  }
}

if (changed < 3) throw new Error(`Phase 1.18 expected Studio media controls were not found (matched ${changed}).`)

fs.writeFileSync(path, source)
console.log(`Applied EBG+ Phase 1.18 replace-media controls (${changed} control groups).`)
