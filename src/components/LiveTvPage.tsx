import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { channelListings, channelNow, tvSources, type TvCatalog } from '../lib/liveTv'
import LiveTvPlayer from './LiveTvPlayer'
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
  const upcoming = selected ? channelListings(selected, sources).filter(listing => listing.end > now).slice(0, 8) : []
  return <main className="page tv-page">
    <header className="tv-heading"><div><p className="eyebrow">TUNE IN TO EBG+</p><h1>Live TV</h1><p>Your shows. Shared moments. Live as they happen.</p></div>{canManage && <Link className="btn muted" to="/app/studio/live-tv">Manage Live TV</Link>}</header>
    {!selected ? <section className="tv-empty"><span aria-hidden="true">◉</span><h2>The next chapter is on air soon.</h2><p>Channels and live broadcasts will appear here when they’re ready.</p>{canManage && <Link className="btn" to="/app/studio/live-tv">Set up a channel</Link>}</section> : <>
      <div className="tv-watch-grid"><section className="tv-watch" aria-label="Watch channel">
        {current.kind !== 'offline' ? <LiveTvPlayer key={selected.id} src={current.src} title={current.title} start={current.kind === 'scheduled' ? current.start : undefined} end={current.kind === 'scheduled' ? current.end : undefined} poster={current.kind === 'scheduled' ? current.source.thumbnail : undefined} /> : <div className="tv-off-air"><span>◉</span><h2>{selected.name} is off air</h2><p>{upcoming[0] ? `Next: ${upcoming[0].source.title} · ${date(upcoming[0].start)}, ${clock(upcoming[0].start)}` : 'Check back for the next broadcast.'}</p></div>}
        <div className="tv-now"><span className={`tv-badge ${current.kind === 'broadcast' ? 'is-live' : ''}`}>{current.kind === 'broadcast' ? '● LIVE NOW' : current.kind === 'scheduled' ? 'ON AIR' : 'OFF AIR'}</span><h2>{current.kind === 'offline' ? selected.name : current.title}</h2><p>{selected.name}{selected.description ? ` · ${selected.description}` : ''}</p>{current.kind === 'scheduled' && <><progress aria-label="Program progress" max={current.program.durationSeconds} value={current.offset} /><small>{clock(current.start)} – {clock(current.end)} · Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}</small></>}</div>
      </section><aside className="tv-up-next"><h2>On this channel</h2>{current.kind === 'broadcast' && <p className="tv-live-note">A live broadcast is taking over this channel. Scheduled programming resumes when it ends.</p>}{upcoming.map(listing => <article key={listing.program.id}><time dateTime={listing.program.startsAt}>{date(listing.start)} · {clock(listing.start)} – {clock(listing.end)}</time><h3>{listing.source.title}</h3><small>{listing.start <= now ? current.kind === 'broadcast' ? 'Scheduled during live coverage' : 'Now playing' : 'Up next'}</small></article>)}{!upcoming.length && <p>No upcoming programs announced.</p>}</aside></div>
      <section className="tv-guide"><div className="tv-section-heading"><h2>Channel guide</h2><span>Times shown in your local timezone</span></div>{channels.map((channel, index) => {
        const playing = channelNow(channel, sources, now)
        const next = channelListings(channel, sources).find(listing => listing.start > now)
        return <button className={`tv-guide-row ${channel.id === selected.id ? 'selected' : ''}`} type="button" key={channel.id} aria-pressed={channel.id === selected.id} onClick={() => setParams({ channel: channel.id }, { replace: true })}><span className="tv-channel-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{channel.name}</strong><small>{playing.kind === 'broadcast' ? '● Live broadcast' : playing.kind === 'scheduled' ? 'Scheduled TV' : 'Off air'}</small></span><span><small>NOW</small><strong>{playing.kind === 'offline' ? 'Back soon' : playing.title}</strong></span><span><small>UP NEXT{next ? ` · ${clock(next.start)}` : ''}</small><strong>{next?.source.title || 'To be announced'}</strong></span><span aria-hidden="true">▶</span></button>
      })}</section>
    </>}
  </main>
}
