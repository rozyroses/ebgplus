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
await import('./apply-phase153-built-in-players-safe.mjs')
await import('./apply-phase153-player-progress-cleanup.mjs')
await import('./apply-phase154-apple-music-player.mjs')
await import('./apply-phase155-persistent-music-dock.mjs')
await import('./apply-phase156-timed-lyrics.mjs')
await import('./apply-phase157-platform-refresh.mjs')
await import('./apply-phase158-mobile-polish.mjs')
await import('./apply-phase159-forms-v2.mjs')
await import('./apply-phase160-application-network.mjs')

const phase161Path = new URL('./apply-phase161-inbox-notifications.mjs', import.meta.url)
let phase161Source = fs.readFileSync(phase161Path, 'utf8')
const phase161BadInterpolation = '${unreadNetwork+unreadCms} unread update'
if (phase161Source.includes(phase161BadInterpolation)) {
  phase161Source = phase161Source.replace(phase161BadInterpolation, '\\${unreadNetwork+unreadCms} unread update')
  fs.writeFileSync(phase161Path, phase161Source)
  console.log('Applied Phase 1.61 notification template interpolation hotfix.')
}

await import('./apply-phase161-inbox-notifications.mjs')
