import { useEffect, useState } from 'react'
import { db } from '../../src/lib/supabase'
import { readStoredSession } from '../../src/lib/auth'
import './studioAnalytics.css'
type Content = { content_id: string; content_kind: string; title: string; plays: number; seconds: number; finishes: number }
type Analytics = { totals: { plays: number; viewers: number; seconds: number; finishes: number }; content: Content[]; daily: { day: string; plays: number; seconds: number }[] }
const minutes = (seconds: number) => (seconds / 60).toLocaleString(undefined, { maximumFractionDigits: 1 })
export default function StudioAnalytics() {
  const [days, setDays] = useState(30), [data, setData] = useState<Analytics | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setData(null)
    const session = readStoredSession()
    if (!session) { setError('Sign in to Studio again.'); setLoading(false); return }
    db.rpc<Analytics>('studio_playback_analytics', { p_days: days }, session.access_token).then(result => { if(active) setData(result) }).catch(reason => { if(active) setError(reason instanceof Error ? reason.message : 'Could not load analytics.') }).finally(() => { if(active) setLoading(false) })
    return () => { active = false }
  }, [days,refresh])
  const exportCsv = () => {
    if (!data) return
    const quote = (value: unknown) => '"' + String(value).replace(/^[=+@-]/, "'$&").replaceAll('"','""') + '"'
    const rows = [['Title','Type','Plays','Played minutes','Finished sessions'],...data.content.map(row => [row.title,row.content_kind,row.plays,(row.seconds/60).toFixed(2),row.finishes])]
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(quote).join(',')).join('\r\n')], {type:'text/csv;charset=utf-8'})); const link = document.createElement('a'); link.href=url; link.download=`ebg-analytics-${days}-days.csv`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <section className="studio-analytics"><header><div><p className="eyebrow">AUDIENCE</p><h2>What’s getting played.</h2><p>EBG+ video and music playback across the platform. Staff access only.</p></div><label>Period<select value={days} onChange={event=>setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label><button className="button secondary" disabled={loading} onClick={()=>setRefresh(value=>value+1)}>Refresh</button><button className="button secondary" disabled={!data || loading} onClick={exportCsv}>Export CSV</button></header>
    <p>Tracking starts with the October 7 update. Signed-in playback only; external streaming platforms and earlier plays aren’t included. A play is one playback session; pauses and seeks don’t add plays. Played minutes measure time playing, not the furthest timestamp. Finished sessions reached the end, even if the viewer skipped.</p>
    {loading && <p role="status">Loading analytics…</p>}{error && <p role="alert">{error}</p>}
    {data && <><div className="analytics-cards">{[['Plays',data.totals.plays],['Unique accounts',data.totals.viewers],['Played minutes',minutes(data.totals.seconds)],['Finished sessions',data.totals.finishes]].map(([label,value])=><article key={label}><small>{label}</small><strong>{value}</strong></article>)}</div>
    {!data.totals.plays ? <div className="panel"><h3>Your audience story starts here.</h3><p>Play a video or song on EBG+ while signed in, then refresh. Tracking can take about 15 seconds to update.</p></div> : <><h3>Daily plays · eastern time</h3><div className="analytics-bars">{data.daily.map(day=><div key={day.day}><span>{day.day}</span><meter min={0} max={Math.max(1,...data.daily.map(d=>d.plays))} value={day.plays} aria-label={`${day.day}: ${day.plays} plays`} /><strong>{day.plays}</strong></div>)}</div><h3>Top content · up to 50 titles</h3><div className="analytics-table"><table><thead><tr><th>Title</th><th>Type</th><th>Plays</th><th>Played minutes</th><th>Finished</th></tr></thead><tbody>{data.content.map(row=><tr key={row.content_kind+row.content_id}><td>{row.title}</td><td>{row.content_kind}</td><td>{row.plays}</td><td>{minutes(row.seconds)}</td><td>{row.finishes}</td></tr>)}</tbody></table></div></> }</>}
  </section>
}
