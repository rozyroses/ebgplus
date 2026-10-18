import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

// A separate player keeps on-demand resume/speed controls out of linear TV.
export default function LiveTvPlayer({ src, title, start, end, poster }: {
  src: string; title: string; start?: number; end?: number; poster?: string
}) {
  const video = useRef<HTMLVideoElement>(null)
  const hls = useRef<Hls | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const media = video.current
    if (!media) return
    setError(''); setNotice(''); setLoading(true)
    let active = true
    const tune = () => {
      if (start !== undefined && Number.isFinite(media.duration)) {
        const target = Math.max(0, (Date.now() - start) / 1000)
        if (target < media.duration) media.currentTime = target
      }
    }
    const ready = () => { tune(); setLoading(false); void media.play().catch(() => { if (active) setNotice('Press play to join the channel.') }) }
    media.addEventListener('loadedmetadata', ready)
    const isHls = start === undefined || /\.m3u8(?:[?#]|$)/i.test(src)
    if (isHls && !media.canPlayType('application/vnd.apple.mpegurl') && Hls.isSupported()) {
      const client = new Hls({ lowLatencyMode: true })
      hls.current = client
      client.on(Hls.Events.ERROR, (_, data) => {
        if (active && data.fatal) { setLoading(false); setError('The broadcast feed is unavailable. Please try again shortly.') }
      })
      client.loadSource(src)
      client.attachMedia(media)
    } else { media.src = src; media.load() }
    // Wall-clock sync also handles pause/resume, background tabs, and buffering.
    const sync = () => {
      if (start !== undefined && !media.paused && Number.isFinite(media.duration)) {
        const target = (Date.now() - start) / 1000
        if (target >= 0 && target < media.duration && Math.abs(media.currentTime - target) > 3) media.currentTime = target
      }
    }
    const timer = window.setInterval(sync, 5000)
    document.addEventListener('visibilitychange', sync)
    return () => {
      active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', sync)
      media.removeEventListener('loadedmetadata', ready); hls.current?.destroy(); hls.current = null
      media.pause(); media.removeAttribute('src'); media.load()
    }
  }, [src, start, attempt])

  const goLive = () => {
    const media = video.current
    if (!media) return
    if (start !== undefined) media.currentTime = Math.min(Math.max(0, (Date.now() - start) / 1000), Number.isFinite(media.duration) ? Math.max(0, media.duration - 0.1) : Infinity)
    else if (hls.current?.liveSyncPosition != null) media.currentTime = hls.current.liveSyncPosition
    else if (media.seekable.length) media.currentTime = Math.max(media.seekable.start(0), media.seekable.end(media.seekable.length - 1) - 2)
    void media.play().catch(() => setNotice('Use the play button to start watching.'))
  }
  return <div className="tv-player">
    <video ref={video} controls playsInline preload="metadata" poster={poster} aria-label={`${title} live TV player`}
      onPlay={() => {
        const media = video.current
        if (media && start !== undefined && (end === undefined || Date.now() < end) && Number.isFinite(media.duration)) media.currentTime = Math.min(Math.max(0, (Date.now() - start) / 1000), Math.max(0, media.duration - 0.1))
      }} onPlaying={() => { setLoading(false); setNotice('') }} onWaiting={() => setLoading(true)} onCanPlay={() => setLoading(false)}
      onEnded={() => setNotice('This program has ended. The next program starts at its scheduled time.')}
      onError={() => { setLoading(false); setError('This feed couldn’t load. Check your connection or try again shortly.') }} />
    {loading && !error && <p className="tv-player-status" role="status">Connecting to channel…</p>}
    {error && <div className="tv-player-status" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry playback</button></div>}
    <div className="tv-player-footer"><span>● {start === undefined ? 'LIVE BROADCAST' : 'SCHEDULED TV'}</span><button type="button" onClick={goLive}>Jump to live</button></div>
    {notice && <p role="status">{notice}</p>}
  </div>
}
