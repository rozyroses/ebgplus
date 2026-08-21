import fs from 'node:fs'

const phasePath = new URL('./apply-phase152-music-detail-pages.mjs', import.meta.url)
let source = fs.readFileSync(phasePath, 'utf8')

const oldLine = "const musicEnd = source.indexOf('\\nfunction ', musicStart + 1)"
const replacement = "const musicFunctionStart = source.indexOf('function MusicPage(', musicStart)\nif (musicFunctionStart < 0) throw new Error('Phase 1.52 patch failed: MusicPage function start not found')\nconst musicEnd = source.indexOf('\\nfunction ', musicFunctionStart + 'function MusicPage('.length)"

if (source.includes(oldLine)) {
  source = source.replace(oldLine, replacement)
  fs.writeFileSync(phasePath, source)
  console.log('Applied Phase 1.52 MusicPage boundary hotfix.')
}

await import('./apply-phase152-music-detail-pages.mjs')
