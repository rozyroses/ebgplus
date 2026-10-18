import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { channelQueue, channelNow, tvSources, type TvCatalog } from '../lib/liveTv'
import LiveTvPlayer from './LiveTvPlayer'
import WebRtcViewer from './WebRtcViewer'
import '../styles/live-tv.css'

const clock = (time: number) => new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const date = (time: number) => new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' })

export default function LiveTvPage({ cms, canManage }: { cms: TvCatalog; canManage: boolean }) {
  const [params, setParams] = useSearchParams()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  const channels = (cms.liveTv?.channels ?? []).filter(channel => channel.enabled)
  const selected = channels.find(channel => channel.id === params.get('channel')) ?? channels[0]
  const sources = tvSources(cms, now)
  const current = selected ? channelNow(selected, sources, now) : { kind: 'offline' as const }
  const linear = current.kind === 'scheduled' || current.kind === 'playlist'
  const upcoming = selected ? channelQueue(selected, sources, now) : []
  const currentEnd = linear ? current.end : undefined
  useEffect(() => {
    if (currentEnd === undefined) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.max(0, currentEnd - Date.now()) + 5))
    return () => window.clearTimeout(timer)
  }, [currentEnd])
  return <main className="page tv-page">
    <header className="tv-heading"><div><p className="eyebrow">TUNE IN TO EBG+</p><h1>Live TV</h1><p>Your shows. Shared moments. Live as they happen.</p></div>{canManage && <div className="tv-actions"><Link className="btn muted" to="/app/studio/live-tv">Manage Live TV</Link><Link className="btn" to="/app/studio/broadcast">Go live</Link></div>}</header>
    {!selected ? <section className="tv-empty"><span aria-hidden="true">◉</span><h2>The next chapter is on air soon.</h2><p>Channels and live broadcasts will appear here when they’re ready.</p>{canManage && <Link className="btn" to="/app/studio/live-tv">Set up a channel</Link>}</section> : <>
      <div className="tv-watch-grid"><section className="tv-watch" aria-label="Watch channel">
        {current.kind === 'broadcast' && current.protocol === 'webrtc' ? <WebRtcViewer src={current.src} title={current.title} /> : current.kind !== 'offline' ? <LiveTvPlayer key={selected.id} src={current.src} title={current.title} start={linear ? current.start : undefined} end={linear ? current.end : undefined} poster={linear ? current.source.thumbnail : undefined} playlist={current.kind === 'playlist'} /> : <div className="tv-off-air"><span>◉</span><h2>{selected.name} is off air</h2><p>{upcoming[0] ? `Next: ${upcoming[0].source.title} · ${date(upcoming[0].start)}, ${clock(upcoming[0].start)}` : 'Check back for the next broadcast.'}</p></div>}
        <div className="tv-now"><span className={`tv-badge ${current.kind === 'broadcast' ? 'is-live' : ''}`}>{current.kind === 'broadcast' ? '● LIVE NOW' : linear ? current.kind === 'playlist' ? 'LOOPING PLAYLIST' : 'ON AIR' : 'OFF AIR'}</span><h2>{current.kind === 'offline' ? selected.name : current.title}</h2><p>{selected.name}{selected.description ? ` · ${selected.description}` : ''}</p>{linear && <><progress aria-label="Program progress" max={current.program.durationSeconds} value={current.offset} /><small>{clock(current.start)} – {clock(current.end)} · Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}</small></>}</div>
      </section><aside className="tv-up-next"><h2>On this channel</h2>{current.kind === 'broadcast' && <p className="tv-live-note">A live broadcast is taking over this channel. Channel programming resumes when it ends.</p>}{upcoming.map(listing => <article key={`${listing.program.id}:${listing.start}`}><time dateTime={new Date(listing.start).toISOString()}>{date(listing.start)} · {clock(listing.start)} – {clock(listing.end)}</time><h3>{listing.source.title}</h3><small>{listing.start <= now ? current.kind === 'broadcast' ? 'Scheduled during live coverage' : 'Now playing' : 'Up next'}</small></article>)}{!upcoming.length && <p>No videos are ready to play on this channel.</p>}</aside></div>
      <section className="tv-guide"><div className="tv-section-heading"><h2>Channel guide</h2><span>Times shown in your local timezone</span></div>{channels.map((channel, index) => {
        const playing = channelNow(channel, sources, now)
        const next = channelQueue(channel, sources, now, 2).find(listing => listing.start > now)
        return <button className={`tv-guide-row ${channel.id === selected.id ? 'selected' : ''}`} type="button" key={channel.id} aria-pressed={channel.id === selected.id} onClick={() => setParams({ channel: channel.id }, { replace: true })}><span className="tv-channel-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{channel.name}</strong><small>{playing.kind === 'broadcast' ? '● Live broadcast' : playing.kind === 'playlist' ? 'Looping playlist' : playing.kind === 'scheduled' ? 'Scheduled TV' : 'Off air'}</small></span><span><small>NOW</small><strong>{playing.kind === 'offline' ? 'Back soon' : playing.title}</strong></span><span><small>UP NEXT{next ? ` · ${clock(next.start)}` : ''}</small><strong>{next?.source.title || 'To be announced'}</strong></span><span aria-hidden="true">▶</span></button>
      })}</section>
    </>}
  </main>
}
