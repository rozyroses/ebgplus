import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE154_APPLE_MUSIC_STYLE')) process.exit(0)

const audioStart = source.indexOf('function EbgAudioPlayer(')
const videoStart = source.indexOf('\nfunction EbgVideoPlayer(', audioStart)
if (audioStart < 0 || videoStart < 0) throw new Error('Phase 1.54 patch failed: audio player boundary not found')

const appleStylePlayer = `// EBG_PHASE154_APPLE_MUSIC_STYLE
function EbgAudioPlayer({
  src,
  title = 'Now Playing',
  artist = 'EBG+',
  artwork,
}: {
  src: string
  title?: string
  artist?: string
  artwork?: string
}) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const toggle = async () => {
    const media = ref.current
    if (!media) return
    if (media.paused) {
      try { await media.play() } catch { return }
    } else {
      media.pause()
    }
  }

  const seekBy = (seconds: number) => {
    const media = ref.current
    if (!media) return
    const next = Math.min(Math.max(media.currentTime + seconds, 0), media.duration || Infinity)
    media.currentTime = Number.isFinite(next) ? next : 0
    setCurrent(media.currentTime)
  }

  const toggleMute = () => {
    const media = ref.current
    if (!media) return
    media.muted = !media.muted
    setMuted(media.muted)
  }

  return (
    <div className="ebg-music-player" aria-label={title}>
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume)
          setMuted(event.currentTarget.muted)
        }}
      />
      <div className="ebg-music-player-art">{artwork ? <img src={artwork} alt="" /> : <span>♪</span>}</div>
      <div className="ebg-music-player-main">
        <div className="ebg-music-player-copy"><strong>{title}</strong><span>{artist}</span></div>
        <div className="ebg-music-player-transport">
          <button type="button" onClick={() => seekBy(-10)} aria-label="Back 10 seconds">↶</button>
          <button type="button" className="primary" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
          <button type="button" onClick={() => seekBy(10)} aria-label="Forward 10 seconds">↷</button>
        </div>
        <div className="ebg-music-player-timeline">
          <span>{formatPlayerTime(current)}</span>
          <input type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { const media = ref.current; if (!media) return; media.currentTime = Number(event.target.value); setCurrent(media.currentTime) }} aria-label="Seek" />
          <span>-{formatPlayerTime(Math.max(duration - current, 0))}</span>
        </div>
        <div className="ebg-music-player-volume-row">
          <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted || volume === 0 ? '🔇' : '🔊'}</button>
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = ref.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setMuted(false); setVolume(media.volume) }} aria-label="Volume" />
        </div>
      </div>
    </div>
  )
}
`

source = source.slice(0, audioStart) + appleStylePlayer + source.slice(videoStart)

const musicStart = source.indexOf('function MusicPage(')
const artistStart = source.indexOf('\nfunction MusicArtistPage(', musicStart)
if (musicStart >= 0 && artistStart > musicStart) {
  let block = source.slice(musicStart, artistStart)
  block = block.replace(
    '<EbgAudioPlayer src={featuredTracks[0].audioUrl} />',
    '<EbgAudioPlayer src={featuredTracks[0].audioUrl} title={featuredTracks[0].title || featured.title} artist={artistName(featured.artistId)} artwork={featured.cover || undefined} />',
  )
  block = block.replaceAll(
    '<EbgAudioPlayer src={track.audioUrl} />',
    '<EbgAudioPlayer src={track.audioUrl} title={track.title} artist={artistName(track.artistId)} artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || undefined} />',
  )
  source = source.slice(0, musicStart) + block + source.slice(artistStart)
}

const artistPageStart = source.indexOf('function MusicArtistPage(')
const releasePageStart = source.indexOf('\nfunction MusicReleasePage(', artistPageStart)
if (artistPageStart >= 0 && releasePageStart > artistPageStart) {
  let block = source.slice(artistPageStart, releasePageStart)
  block = block.replaceAll(
    '<EbgAudioPlayer src={track.audioUrl} />',
    '<EbgAudioPlayer src={track.audioUrl} title={track.title} artist={artist.name} artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || artist.image || undefined} />',
  )
  source = source.slice(0, artistPageStart) + block + source.slice(releasePageStart)
}

const releasePage = source.indexOf('function MusicReleasePage(')
if (releasePage >= 0) {
  const nextFunction = source.indexOf('\nfunction ', releasePage + 'function MusicReleasePage('.length)
  const end = nextFunction >= 0 ? nextFunction : source.length
  let block = source.slice(releasePage, end)
  block = block.replaceAll(
    '<EbgAudioPlayer src={track.audioUrl} />',
    '<EbgAudioPlayer src={track.audioUrl} title={track.title} artist={artist?.name || \'EBG+\'} artwork={release.cover || undefined} />',
  )
  source = source.slice(0, releasePage) + block + source.slice(end)
}

if (!source.includes("import './phase154-apple-music-player.css'")) {
  const cssImports = [...source.matchAll(/^import ['"]\.\/[^'"]+\.css['"]$/gm)]
  const lastCss = cssImports.at(-1)
  if (!lastCss || lastCss.index == null) throw new Error('Phase 1.54 patch failed: CSS import anchor not found')
  const insertAt = lastCss.index + lastCss[0].length
  source = source.slice(0, insertAt) + "\nimport './phase154-apple-music-player.css'" + source.slice(insertAt)
}

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.54 Apple Music-inspired audio player.')
