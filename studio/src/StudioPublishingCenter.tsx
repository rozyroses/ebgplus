import { useEffect, useState } from 'react'
import { loadCmsData, loadProjectCms, saveCmsData, saveProjectCms } from '../../src/lib/studioData'
import { applyPublishReview, publicItemLink, reviewItems } from './publishingReview'
import type { PublishKind, ReviewCatalog, ReviewItem } from './publishingReview'

export default function StudioPublishingCenter({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ReviewCatalog>({})
  const [catalog, setCatalog] = useState<ReviewCatalog>({})
  const [kind, setKind] = useState<PublishKind>('music')
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState('live')
  const [date, setDate] = useState('')
  const [reviewed, setReviewed] = useState<ReviewItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => {
    let cancelled = false
    setProject({}); setCatalog({}); setReviewed(null); setSelectedId(''); setMessage(''); setLoading(true)
    Promise.allSettled([projectId ? loadProjectCms<ReviewCatalog>(projectId) : Promise.resolve(null), loadCmsData<ReviewCatalog>()]).then(results => {
      if (cancelled) return
      if (results[0].status === 'fulfilled') setProject(results[0].value ?? {})
      if (results[1].status === 'fulfilled') setCatalog(results[1].value ?? {})
      if (results.some(result => result.status === 'rejected')) setMessage('Some catalog content could not be loaded. Use Refresh to try again.')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [projectId])
  const refresh = async () => {
    setReviewed(null); setLoading(true)
    try { const [p,c] = await Promise.all([loadProjectCms<ReviewCatalog>(projectId), loadCmsData<ReviewCatalog>()]); setProject(p ?? {}); setCatalog(c ?? {}); setMessage('Latest content loaded.') }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Could not refresh.') }
    finally { setLoading(false) }
  }
  const rows = reviewItems(kind === 'music' ? project : catalog, kind)
  const visible = rows.filter(row => filter === 'all' || row.status === filter)
  const selected = rows.find(row => row.item.id === selectedId)
  const choose = (row: ReviewItem) => { setSelectedId(row.item.id); setStatus(row.kind === 'show' ? row.status === 'hidden' ? 'visible' : 'hidden' : row.status === 'live' ? 'draft' : 'live'); setDate(''); setReviewed(null); setMessage('') }
  const commit = async () => {
    if (!reviewed || busy) return
    setBusy(true)
    try {
      const latest = reviewed.kind === 'music' ? await loadProjectCms<ReviewCatalog>(projectId) : await loadCmsData<ReviewCatalog>()
      if (!latest) throw new Error('Catalog no longer exists. Refresh before continuing.')
      const next = applyPublishReview(latest, reviewed, status, date)
      if (reviewed.kind === 'music') { await saveProjectCms(projectId, next); setProject(next); window.dispatchEvent(new CustomEvent('ebg-studio-cms-saved', {detail:{projectId}})); window.dispatchEvent(new Event('ebg-studio-music-change')) }
      else { await saveCmsData(next); setCatalog(next) }
      setReviewed(null); setMessage(`Saved: ${reviewed.item.title} → ${status}.`)
    } catch(error) { setReviewed(null); setMessage(error instanceof Error ? error.message : 'Publishing failed.') }
    finally { setBusy(false) }
  }
  const actions = kind === 'show' ? [['visible','Show on Home'],['hidden','Hide from Home']] : [['live','Publish on EBG+'],['scheduled','Schedule on EBG+'],['draft','Move to draft'],['archived','Archive']]
  return <section className="publishing-center" aria-label="Publishing center">
    <header><div><p className="eyebrow">REVIEW & PUBLISH</p><h2>Your next release, ready.</h2><p>Check the content, preview the media, then confirm its EBG+ publishing state.</p></div><button className="button secondary" type="button" disabled={busy || loading} onClick={() => void refresh()}>Refresh</button></header>
    <nav aria-label="Content type">{([['music','Music'],['episode','Episodes & movies'],['show','Show visibility']] as const).map(([id,label]) => <button type="button" key={id} className={kind === id ? 'active' : ''} disabled={busy} onClick={() => {setKind(id);setSelectedId('');setFilter('all');setReviewed(null)}}>{label}</button>)}</nav>
    <p className="publishing-source">{kind === 'music' ? 'Source: your selected Studio production. Streaming-platform delivery is managed separately.' : 'Source: the shared EBG+ show catalog used by the Series and Episodes editors.'}</p>
    {message && <p className="publishing-message" role="status">{message}</p>}
    <div className="publishing-layout"><aside><label>Filter by status<select value={filter} disabled={busy} onChange={event => setFilter(event.target.value)}><option value="all">All</option>{(kind === 'show' ? ['visible','hidden'] : ['draft','scheduled','live','archived']).map(value => <option key={value}>{value}</option>)}</select></label>
      {visible.map(row => <button className={`publishing-item ${row.item.id === selectedId ? 'selected' : ''}`} type="button" key={row.item.id} disabled={busy} onClick={() => choose(row)}>{row.image && <img src={row.image} alt="" />}<span><strong>{row.item.title || 'Untitled'}</strong><small>{row.subtitle}</small><small>{row.status} · {row.errors.length ? `${row.errors.length} required fixes` : 'Ready to review'}</small></span></button>)}
      {!visible.length && <p>{loading ? 'Loading content…' : 'No items here yet. Create content in Music or Episodes first.'}</p>}
    </aside><div>{!selected ? <section className="publishing-card"><h3>Select content to review</h3><p>Publishing checks and a media preview will appear here.</p><div className="publishing-actions"><a className="button secondary" href="#music">Open Music</a><a className="button secondary" href="#episodes">Open Episodes</a></div></section> : <>
      <section className="publishing-card"><div className="publishing-preview">{selected.image && <img src={selected.image} alt={`${selected.item.title} artwork`} />}<div><p className="eyebrow">{selected.status}</p><h3>{selected.item.title}</h3><p>{selected.subtitle}</p><p>{selected.item.releaseDate ? `Release date: ${new Date(selected.item.releaseDate).toLocaleString()}` : 'No release date set'}</p><p>{selected.item.synopsis || selected.item.description || selected.item.genre || 'No description yet.'}</p></div></div>
        <h4>Readiness checks</h4>{!selected.errors.length && <p className="publishing-pass">Required checks passed.</p>}{selected.errors.map(text => <p key={text} className="publishing-error">Required: {text}</p>)}{selected.warnings.map(text => <p key={text} className="publishing-warning">Suggested: {text}</p>)}
        {selected.media.map(media => <div className="publishing-media" key={media.id}><strong>{media.title}</strong>{media.kind === 'audio' ? <audio controls preload="none" src={media.url || undefined} /> : <video controls preload="none" src={media.url} />}</div>)}
        <div className="publishing-actions"><button className="button secondary" type="button" onClick={() => {localStorage.setItem('ebg.lumi.prefill', `Help me draft a description and promotional copy for this EBG+ ${selected.kind}. Use only these details, ask for missing information, and do not claim to publish anything: ${JSON.stringify({title:selected.item.title, artistOrShow:selected.subtitle, description:selected.item.description || selected.item.synopsis || '', genre:selected.item.genre || '', releaseDate:selected.item.releaseDate || '', tracks:selected.media.map(media => media.title)})}`); window.location.hash = 'lumi'}}>Draft copy with Lumi ✦</button><a className="button secondary" href={kind === 'music' ? '#music' : kind === 'show' ? '#series' : '#episodes'}>Edit content</a>{['live','scheduled','visible'].includes(selected.status) && <a className="button secondary" href={publicItemLink(projectId, selected)} target="_blank" rel="noreferrer">Open public page ↗</a>}</div>
      </section>
      <section className="publishing-card"><h3>Choose the next state</h3><label>Action<select value={status} disabled={busy} onChange={event => {setStatus(event.target.value);setReviewed(null)}}>{actions.map(([id,label]) => <option value={id} key={id}>{label}</option>)}</select></label>{status === 'scheduled' && <label>Release date and time (your timezone)<input type="datetime-local" value={date} disabled={busy} onChange={event => {setDate(event.target.value);setReviewed(null)}} /></label>}
        {kind === 'show' && <p>This changes Home visibility. Episode publishing is managed separately.</p>}
        {!reviewed ? <button className="button" type="button" disabled={busy || loading || (['live','scheduled','visible'].includes(status) && !!selected.errors.length)} onClick={() => {try {applyPublishReview(kind === 'music' ? project : catalog, selected, status, date);setReviewed(selected)} catch(error){setMessage(error instanceof Error ? error.message : 'Review failed.')}}}>Review change</button> : <div className="publishing-confirm" aria-live="polite"><h4>Confirm: {reviewed.item.title}</h4><p>{selected.status} → <strong>{status}</strong>{status === 'scheduled' ? ` · ${new Date(date).toLocaleString()}` : ''}</p><p>{status === 'live' ? 'This makes the content available to EBG+ viewers now.' : status === 'scheduled' ? 'This saves the release as scheduled for the selected time.' : 'This updates the content’s EBG+ visibility.'}</p><div className="publishing-actions"><button className="button" type="button" disabled={busy} onClick={() => void commit()}>{busy ? 'Saving…' : 'Confirm change'}</button><button className="button secondary" type="button" disabled={busy} onClick={() => setReviewed(null)}>Back</button></div></div>}
      </section>
      <section className="publishing-card"><h3>Publishing history</h3><p>Changes confirmed through this center appear here. Earlier publishing actions are not backfilled.</p>{[...(selected.item.publishHistory ?? [])].reverse().map((event,index) => <div className="publishing-history" key={`${event.at}-${index}`}><strong>{event.status}</strong><span>{new Date(event.at).toLocaleString()}</span></div>)}{!selected.item.publishHistory?.length && <p>No publishing-center changes yet.</p>}</section>
    </>}</div></div>
  </section>
}
