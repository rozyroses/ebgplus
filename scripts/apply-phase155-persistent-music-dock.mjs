import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE155_PERSISTENT_MUSIC_DOCK')) process.exit(0)

const audioStart = source.indexOf('// EBG_PHASE154_APPLE_MUSIC_STYLE\nfunction EbgAudioPlayer(')
const videoStart = source.indexOf('\nfunction EbgVideoPlayer(', audioStart)
if (audioStart < 0 || videoStart < 0) throw new Error('Phase 1.55 patch failed: Phase 1.54 audio player boundary not found')

const dockComponents = `// EBG_PHASE155_PERSISTENT_MUSIC_DOCK
type EbgMusicTrackDetail = {
  src: string
  title: string
  artist: string
  artwork?: string
  lyrics?: string
}

function EbgAudioPlayer({
  src,
  title = 'Now Playing',
  artist = 'EBG+',
  artwork,
  lyrics,
}: {
  src: string
  title?: string
  artist?: string
  artwork?: string
  lyrics?: string
}) {
  const play = () => {
    window.dispatchEvent(new CustomEvent<EbgMusicTrackDetail>('ebg-music-play', {
      detail: { src, title, artist, artwork, lyrics },
    }))
  }

  return (
    <button type="button" className="ebg-track-launcher" onClick={play} aria-label={'Play ' + title}>
      <span className="ebg-track-launcher-art">{artwork ? <img src={artwork} alt="" /> : '♪'}</span>
      <span className="ebg-track-launcher-copy"><strong>{title}</strong><small>{artist}</small></span>
      <span className="ebg-track-launcher-play">▶</span>
    </button>
  )
}

function EbgMusicDock() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<EbgMusicTrackDetail | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const onPlayTrack = (event: Event) => {
      const detail = (event as CustomEvent<EbgMusicTrackDetail>).detail
      if (!detail?.src) return
      setTrack(detail)
      setCurrent(0)
      setDuration(0)
    }
    window.addEventListener('ebg-music-play', onPlayTrack)
    return () => window.removeEventListener('ebg-music-play', onPlayTrack)
  }, [])

  useEffect(() => {
    if (!track?.src) return
    const media = audioRef.current
    if (!media) return
    media.load()
    void media.play().catch(() => undefined)
  }, [track?.src])

  if (!track) return null

  const toggle = async () => {
    const media = audioRef.current
    if (!media) return
    if (media.paused) {
      try { await media.play() } catch { return }
    } else {
      media.pause()
    }
  }

  const seek = (value: number) => {
    const media = audioRef.current
    if (!media) return
    media.currentTime = value
    setCurrent(value)
  }

  const close = () => {
    const media = audioRef.current
    if (media) media.pause()
    setTrack(null)
    setExpanded(false)
    setPlaying(false)
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted) }}
      />

      <aside className="ebg-music-dock" aria-label="Now playing">
        <button type="button" className="ebg-music-dock-open" onClick={() => setExpanded(true)} aria-label="Open Now Playing">
          <span className="ebg-music-dock-art">{track.artwork ? <img src={track.artwork} alt="" /> : '♪'}</span>
          <span className="ebg-music-dock-copy"><strong>{track.title}</strong><small>{track.artist}</small></span>
        </button>
        <button type="button" className="ebg-music-dock-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
        <div className="ebg-music-dock-progress">
          <input type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" />
        </div>
        <button type="button" className="ebg-music-dock-close" onClick={close} aria-label="Close player">×</button>
      </aside>

      {expanded && (
        <div className="ebg-now-playing-overlay" role="dialog" aria-modal="true" aria-label="Now Playing">
          <button type="button" className="ebg-now-playing-dismiss" onClick={() => setExpanded(false)} aria-label="Close Now Playing">⌄</button>
          <div className="ebg-now-playing-shell">
            <section className="ebg-now-playing-main">
              <div className="ebg-now-playing-art">{track.artwork ? <img src={track.artwork} alt="" /> : <span>♪</span>}</div>
              <div className="ebg-now-playing-copy"><span>NOW PLAYING</span><h2>{track.title}</h2><p>{track.artist}</p></div>
              <div className="ebg-now-playing-timeline">
                <span>{formatPlayerTime(current)}</span>
                <input type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" />
                <span>-{formatPlayerTime(Math.max(duration - current, 0))}</span>
              </div>
              <div className="ebg-now-playing-controls">
                <button type="button" onClick={() => seek(Math.max(current - 10, 0))} aria-label="Back 10 seconds">↶</button>
                <button type="button" className="primary" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
                <button type="button" onClick={() => seek(Math.min(current + 10, duration || current + 10))} aria-label="Forward 10 seconds">↷</button>
              </div>
              <div className="ebg-now-playing-volume">
                <button type="button" onClick={() => { const media = audioRef.current; if (!media) return; media.muted = !media.muted; setMuted(media.muted) }} aria-label={muted ? 'Unmute' : 'Mute'}>{muted || volume === 0 ? '🔇' : '🔊'}</button>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = audioRef.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setMuted(false); setVolume(media.volume) }} aria-label="Volume" />
              </div>
            </section>
            <section className="ebg-now-playing-lyrics">
              <span>LYRICS</span>
              {track.lyrics?.trim() ? <div>{track.lyrics}</div> : <p>Lyrics haven’t been added for this song yet.</p>}
            </section>
          </div>
        </div>
      )}
    </>
  )
}
`

source = source.slice(0, audioStart) + dockComponents + source.slice(videoStart)

source = source.replace(
  'artwork={featured.cover || undefined} />',
  'artwork={featured.cover || undefined} lyrics={featuredTracks[0].lyrics || \'\'} />',
)
source = source.replaceAll(
  'artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || undefined} />',
  'artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || undefined} lyrics={track.lyrics || \'\'} />',
)
source = source.replaceAll(
  'artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || artist.image || undefined} />',
  'artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || artist.image || undefined} lyrics={track.lyrics || \'\'} />',
)
source = source.replaceAll(
  'artwork={release.cover || undefined} />',
  'artwork={release.cover || undefined} lyrics={track.lyrics || \'\'} />',
)

const appLayoutStart = source.indexOf('function AppLayout(')
const homePageStart = source.indexOf('\nfunction HomePage(', appLayoutStart)
if (appLayoutStart < 0 || homePageStart < 0) throw new Error('Phase 1.55 patch failed: AppLayout boundary not found')
let appLayout = source.slice(appLayoutStart, homePageStart)
if (!appLayout.includes('<EbgMusicDock />')) {
  const mobileNavAnchor = '      <MobileNav />'
  if (!appLayout.includes(mobileNavAnchor)) throw new Error('Phase 1.55 patch failed: MobileNav anchor not found')
  appLayout = appLayout.replace(mobileNavAnchor, '      <EbgMusicDock />\n' + mobileNavAnchor)
  source = source.slice(0, appLayoutStart) + appLayout + source.slice(homePageStart)
}

if (!source.includes("import './phase155-persistent-music-dock.css'")) {
  const cssImports = [...source.matchAll(/^import ['"]\.\/[^'"]+\.css['"]$/gm)]
  const lastCss = cssImports.at(-1)
  if (!lastCss || lastCss.index == null) throw new Error('Phase 1.55 patch failed: CSS import anchor not found')
  const insertAt = lastCss.index + lastCss[0].length
  source = source.slice(0, insertAt) + "\nimport './phase155-persistent-music-dock.css'" + source.slice(insertAt)
}

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.55 persistent expandable Music dock with lyrics.')
