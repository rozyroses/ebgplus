import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE153_BUILTIN_PLAYERS_SAFE')) process.exit(0)

const reactImport = source.match(/import\s*\{([^}]*)\}\s*from ['"]react['"]/)
if (!reactImport) throw new Error('Phase 1.53 safe patch failed: React import not found')
const reactNames = reactImport[1].split(',').map((name) => name.trim()).filter(Boolean)
if (!reactNames.includes('useRef')) reactNames.push('useRef')
source = source.replace(reactImport[0], `import { ${reactNames.join(', ')} } from 'react'`)

const components = `// EBG_PHASE153_BUILTIN_PLAYERS_SAFE
function formatPlayerTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0')
}

function EbgAudioPlayer({ src, title = 'EBG+ Audio' }: { src: string; title?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const toggle = async () => {
    const media = ref.current
    if (!media) return
    if (media.paused) { try { await media.play() } catch { return } } else media.pause()
  }
  return (
    <div className="ebg-audio-player" aria-label={title}>
      <audio ref={ref} src={src} preload="metadata" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onVolumeChange={(event) => setVolume(event.currentTarget.volume)} />
      <button type="button" className="ebg-player-icon" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
      <span className="ebg-player-time">{formatPlayerTime(current)}</span>
      <input className="ebg-player-progress" type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { const media = ref.current; if (!media) return; media.currentTime = Number(event.target.value); setCurrent(media.currentTime) }} aria-label="Seek" />
      <span className="ebg-player-time">{formatPlayerTime(duration)}</span>
      <button type="button" className="ebg-player-icon" onClick={() => { const media = ref.current; if (!media) return; media.muted = !media.muted }}>{volume === 0 || ref.current?.muted ? '🔇' : '🔊'}</button>
      <input className="ebg-player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = ref.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setVolume(media.volume) }} aria-label="Volume" />
    </div>
  )
}

function EbgVideoPlayer({ src, poster, title = 'EBG+ Video', autoPlay = false, startAt = 0, onProgress, onEnded }: { src: string; poster?: string; title?: string; autoPlay?: boolean; startAt?: number; onProgress?: (seconds: number) => void; onEnded?: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const toggle = async () => {
    const media = ref.current
    if (!media) return
    if (media.paused) { try { await media.play() } catch { return } } else media.pause()
  }
  const fullscreen = async () => {
    const shell = shellRef.current
    if (!shell) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await shell.requestFullscreen()
  }
  return (
    <div ref={shellRef} className="ebg-video-player" aria-label={title}>
      <video ref={ref} src={src} poster={poster} autoPlay={autoPlay} playsInline onLoadedMetadata={(event) => { const media = event.currentTarget; setDuration(media.duration || 0); if (startAt > 0 && startAt < (media.duration || Infinity)) media.currentTime = startAt }} onTimeUpdate={(event) => { setCurrent(event.currentTarget.currentTime); if (onProgress) onProgress(event.currentTarget.currentTime) }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); if (onEnded) onEnded() }} onVolumeChange={(event) => setVolume(event.currentTarget.volume)} />
      <button type="button" className="ebg-video-center-play" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
      <div className="ebg-video-controls">
        <button type="button" className="ebg-player-icon" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
        <span className="ebg-player-time">{formatPlayerTime(current)}</span>
        <input className="ebg-player-progress" type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { const media = ref.current; if (!media) return; media.currentTime = Number(event.target.value); setCurrent(media.currentTime) }} aria-label="Seek" />
        <span className="ebg-player-time">{formatPlayerTime(duration)}</span>
        <button type="button" className="ebg-player-icon" onClick={() => { const media = ref.current; if (!media) return; media.muted = !media.muted }}>{volume === 0 || ref.current?.muted ? '🔇' : '🔊'}</button>
        <input className="ebg-player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = ref.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setVolume(media.volume) }} aria-label="Volume" />
        <button type="button" className="ebg-player-icon" onClick={fullscreen}>⛶</button>
      </div>
    </div>
  )
}
`

const watchStart = source.indexOf('function WatchPage(')
if (watchStart < 0) throw new Error('Phase 1.53 safe patch failed: WatchPage not found')
source = source.slice(0, watchStart) + components + '\n' + source.slice(watchStart)

const patchedWatchStart = source.indexOf('function WatchPage(')
const patchedWatchEnd = source.indexOf('\nfunction ', patchedWatchStart + 'function WatchPage('.length)
if (patchedWatchEnd < 0) throw new Error('Phase 1.53 safe patch failed: WatchPage boundary not found')
let watchBlock = source.slice(patchedWatchStart, patchedWatchEnd)
const videoStart = watchBlock.indexOf('<video')
if (videoStart >= 0) {
  const videoEnd = watchBlock.indexOf('/>', videoStart)
  if (videoEnd >= 0) {
    const replacementVideo = `<EbgVideoPlayer\n        src={episode.videoUrl}\n        title={episode.title}\n        autoPlay\n        startAt={profile.playback[episode.id] ?? 0}\n        onProgress={(seconds) => savePlayback(episode.id, seconds)}\n        onEnded={() => {\n          savePlayback(episode.id, 0)\n          setEnded(true)\n        }}\n      />`
    watchBlock = watchBlock.slice(0, videoStart) + replacementVideo + watchBlock.slice(videoEnd + 2)
  }
}
source = source.slice(0, patchedWatchStart) + watchBlock + source.slice(patchedWatchEnd)

source = source.replace(/<audio\s+controls\s+preload="(?:metadata|none)"\s+src=\{([^}]+)\}\s*\/>/g, '<EbgAudioPlayer src={$1} />')
source = source.replace(/<video\s+controls\s+preload="metadata"\s+poster=\{([^}]+)\}\s+src=\{([^}]+)\}\s*\/>/g, '<EbgVideoPlayer poster={$1} src={$2} />')

if (!source.includes("import './phase153-built-in-players.css'")) {
  const cssImports = [...source.matchAll(/^import ['"]\.\/[^'"]+\.css['"]$/gm)]
  const lastCss = cssImports.at(-1)
  if (!lastCss || lastCss.index == null) throw new Error('Phase 1.53 safe patch failed: CSS import anchor not found')
  const cssInsert = lastCss.index + lastCss[0].length
  source = source.slice(0, cssInsert) + "\nimport './phase153-built-in-players.css'" + source.slice(cssInsert)
}

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.53 safe built-in players.')
