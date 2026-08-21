import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE153_BUILTIN_PLAYERS')) process.exit(0)

source = source.replace(
  "import { useEffect, useMemo, useState } from 'react'",
  "import { useEffect, useMemo, useRef, useState } from 'react'",
)

const components = `// EBG_PHASE153_BUILTIN_PLAYERS
function formatPlayerTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes + ':' + String(seconds).padStart(2, '0')
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
    if (media.paused) {
      try { await media.play() } catch { return }
    } else {
      media.pause()
    }
  }

  return (
    <div className="ebg-audio-player" aria-label={title}>
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onVolumeChange={(event) => setVolume(event.currentTarget.volume)}
      />
      <button type="button" className="ebg-player-icon" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
      <span className="ebg-player-time">{formatPlayerTime(current)}</span>
      <input className="ebg-player-progress" type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { const media = ref.current; if (!media) return; media.currentTime = Number(event.target.value); setCurrent(media.currentTime) }} aria-label="Seek" />
      <span className="ebg-player-time">{formatPlayerTime(duration)}</span>
      <button type="button" className="ebg-player-icon" onClick={() => { const media = ref.current; if (!media) return; media.muted = !media.muted }} aria-label="Mute">{volume === 0 || ref.current?.muted ? '🔇' : '🔊'}</button>
      <input className="ebg-player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = ref.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setVolume(media.volume) }} aria-label="Volume" />
    </div>
  )
}

function EbgVideoPlayer({
  src,
  poster,
  title = 'EBG+ Video',
  autoPlay = false,
  startAt = 0,
  onProgress,
  onEnded,
}: {
  src: string
  poster?: string
  title?: string
  autoPlay?: boolean
  startAt?: number
  onProgress?: (seconds: number) => void
  onEnded?: () => void
}) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  const toggle = async () => {
    const media = ref.current
    if (!media) return
    if (media.paused) {
      try { await media.play() } catch { return }
    } else {
      media.pause()
    }
  }

  const fullscreen = async () => {
    const shell = shellRef.current
    if (!shell) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await shell.requestFullscreen()
  }

  return (
    <div ref={shellRef} className="ebg-video-player" aria-label={title}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        onLoadedMetadata={(event) => {
          const media = event.currentTarget
          setDuration(media.duration || 0)
          if (startAt > 0 && startAt < (media.duration || Infinity)) media.currentTime = startAt
        }}
        onTimeUpdate={(event) => {
          setCurrent(event.currentTarget.currentTime)
          onProgress?.(event.currentTarget.currentTime)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onEnded?.() }}
        onVolumeChange={(event) => setVolume(event.currentTarget.volume)}
      />
      <button type="button" className="ebg-video-center-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
      <div className="ebg-video-controls">
        <button type="button" className="ebg-player-icon" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
        <span className="ebg-player-time">{formatPlayerTime(current)}</span>
        <input className="ebg-player-progress" type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { const media = ref.current; if (!media) return; media.currentTime = Number(event.target.value); setCurrent(media.currentTime) }} aria-label="Seek" />
        <span className="ebg-player-time">{formatPlayerTime(duration)}</span>
        <button type="button" className="ebg-player-icon" onClick={() => { const media = ref.current; if (!media) return; media.muted = !media.muted }} aria-label="Mute">{volume === 0 || ref.current?.muted ? '🔇' : '🔊'}</button>
        <input className="ebg-player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = ref.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setVolume(media.volume) }} aria-label="Volume" />
        <button type="button" className="ebg-player-icon" onClick={fullscreen} aria-label="Fullscreen">⛶</button>
      </div>
    </div>
  )
}
`

const insertAt = source.indexOf('function WatchPage(')
if (insertAt < 0) throw new Error('Phase 1.53 patch failed: WatchPage not found')
source = source.slice(0, insertAt) + components + '\n' + source.slice(insertAt)

const watchStart = source.indexOf('function WatchPage(')
const watchEnd = source.indexOf('\nfunction ', watchStart + 'function WatchPage('.length)
if (watchEnd < 0) throw new Error('Phase 1.53 patch failed: WatchPage boundary not found')
let watchBlock = source.slice(watchStart, watchEnd)
const nativeWatchVideo = /\s{6}<video[\s\S]*?\s{6}\/\>/
if (!nativeWatchVideo.test(watchBlock)) throw new Error('Phase 1.53 patch failed: native WatchPage video not found')
watchBlock = watchBlock.replace(nativeWatchVideo, `
      <EbgVideoPlayer
        src={episode.videoUrl}
        title={episode.title}
        autoPlay
        startAt={profile.playback[episode.id] ?? 0}
        onProgress={(seconds) => savePlayback(episode.id, seconds)}
        onEnded={() => {
          savePlayback(episode.id, 0)
          setEnded(true)
        }}
      />`)
source = source.slice(0, watchStart) + watchBlock + source.slice(watchEnd)

source = source.replace(/<audio controls preload="(?:metadata|none)" src=\{([^}]+)\} \/>/g, '<EbgAudioPlayer src={$1} />')
source = source.replace(/<video controls preload="metadata" poster=\{([^}]+)\} src=\{([^}]+)\} \/>/g, '<EbgVideoPlayer poster={$1} src={$2} />')

if (!source.includes("import './phase153-built-in-players.css'")) {
  const cssImports = [...source.matchAll(/^import ['"]\.\/[^'"]+\.css['"]$/gm)]
  const lastCss = cssImports.at(-1)
  if (!lastCss || lastCss.index == null) throw new Error('Phase 1.53 patch failed: CSS import anchor not found')
  const cssInsert = lastCss.index + lastCss[0].length
  source = source.slice(0, cssInsert) + "\nimport './phase153-built-in-players.css'" + source.slice(cssInsert)
}

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.53 built-in audio and video players.')
