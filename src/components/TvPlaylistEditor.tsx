import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Hls from 'hls.js'
import { runtimeSeconds, type TvPlaylist, type TvSource } from '../lib/liveTv'

const playlistLength = (seconds: number) => {
  const whole = Math.round(seconds)
  const hours = Math.floor(whole / 3600)
  return [hours || undefined, hours ? String(Math.floor(whole / 60) % 60).padStart(2, '0') : Math.floor(whole / 60), String(whole % 60).padStart(2, '0')].filter(value => value !== undefined).join(':')
}

export default function TvPlaylistEditor({ playlist, sources, onChange }: {
  playlist: TvPlaylist; sources: TvSource[]; onChange: (playlist: TvPlaylist) => void
}) {
  const [sourceKey, setSourceKey] = useState('')
  const [duration, setDuration] = useState('')
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState('')
  const selected = sources.find(source => `${source.sourceKind}:${source.id}` === sourceKey)
  const url = selected?.videoUrl
  const runtime = selected?.runtime
  useEffect(() => {
    if (!url) { setDuration(''); setNotice(''); setChecking(false); return }
    const fallback = runtimeSeconds(runtime)
    setDuration(fallback ? String(fallback) : '')
    setChecking(true); setNotice('Reading the video length…')
    const video = document.createElement('video')
    video.preload = 'metadata'
    let client: Hls | undefined
    let finished = false
    const finish = (seconds?: number) => {
      if (finished) return
      finished = true
      window.clearTimeout(timer)
      setChecking(false)
      if (seconds && Number.isFinite(seconds) && seconds <= 86400) {
        setDuration(String(Math.round(seconds * 1000) / 1000)); setNotice('Video length detected automatically.')
      } else setNotice(fallback ? 'Using the catalog runtime. Confirm the length below before adding.' : 'This host could not provide the length. Enter the video’s length in seconds.')
      client?.destroy(); video.removeAttribute('src'); video.load()
    }
    const timer = window.setTimeout(() => finish(), 12000)
    video.onloadedmetadata = () => finish(video.duration)
    video.onerror = () => finish()
    if (/\.m3u8(?:[?#]|$)/i.test(url) && !video.canPlayType('application/vnd.apple.mpegurl') && Hls.isSupported()) {
      client = new Hls()
      client.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) finish() })
      client.loadSource(url); client.attachMedia(video)
    } else { video.src = url; video.load() }
    return () => { finished = true; window.clearTimeout(timer); video.onloadedmetadata = null; video.onerror = null; client?.destroy(); video.removeAttribute('src'); video.load() }
  }, [url, runtime])
  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const seconds = Number(duration)
    if (!selected || !Number.isFinite(seconds) || seconds <= 0 || seconds > 86400) return
    onChange({ ...playlist, items: [...playlist.items, { id: crypto.randomUUID(), sourceId: selected.id, sourceKind: selected.sourceKind, durationSeconds: seconds }] })
    setSourceKey('')
  }
  const move = (index: number, direction: number) => {
    const items = [...playlist.items]
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    onChange({ ...playlist, items })
  }
  return <section className="tv-panel tv-playlist-editor">
    <div className="tv-section-heading"><h2>Looping playlist</h2><span>Repeats automatically · {playlist.items.length} videos</span></div>
    <p>Add videos in the order you want. After the last video, the channel starts again from the top. Everyone watches at the same point, even when you close Studio.</p>
    <form className="tv-form-grid" onSubmit={add}>
      <label className="tv-full">Playlist video<select required value={sourceKey} onChange={event => setSourceKey(event.target.value)}><option value="" disabled>Choose a published video</option>{sources.map(source => <option key={`${source.sourceKind}:${source.id}`} value={`${source.sourceKind}:${source.id}`}>{source.sourceKind === 'episode' ? 'Episode' : 'Music video'} · {source.title}</option>)}</select></label>
      {selected && <><label>Video length (seconds)<input type="number" min="0.001" max="86400" step="0.001" required value={duration} disabled={checking} onChange={event => setDuration(event.target.value)} /></label><p className="tv-metadata-note" role="status">{notice}</p></>}
      <div className="tv-full"><button type="submit" disabled={!selected || checking || !Number(duration) || playlist.items.length >= 500}>+ Add to playlist</button></div>
    </form>
    {!sources.length && <p>Publish an episode or music video first to add it to your playlist.</p>}
    <ol className="tv-playlist-items">{playlist.items.map((item, index) => {
      const source = sources.find(source => source.id === item.sourceId && source.sourceKind === item.sourceKind)
      const title = source?.title ?? 'Unavailable video'
      return <li key={item.id}><div className="tv-playlist-entry"><span className="tv-playlist-position">{index + 1}</span><div><strong>{title}</strong><small>{playlistLength(item.durationSeconds)}{!source ? ' · Will be skipped until published and available' : ''}</small></div></div><div className="tv-actions"><button type="button" aria-label={`Move ${title} up`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Move ${title} down`} disabled={index === playlist.items.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" aria-label={`Remove ${title} from playlist`} onClick={() => onChange({ ...playlist, items: playlist.items.filter(entry => entry.id !== item.id) })}>Remove</button></div></li>
    })}</ol>
    {!playlist.items.length ? <p>Your playlist is empty. Add a video to start building your loop.</p> : <div className="tv-section-heading"><p>One full loop: {playlistLength(playlist.items.reduce((total, item) => total + item.durationSeconds, 0))}</p><button type="button" onClick={() => onChange({ ...playlist, startsAt: new Date().toISOString() })}>Restart from first video on save</button></div>}
    <small>Save to apply changes. Adding, removing, or reordering videos restarts the loop. Live broadcasts take priority; the playlist returns when they end. Unavailable or unpublished videos are skipped.</small>
  </section>
}
