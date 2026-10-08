import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { listLumiPublications, publishLumiContent, updateLumiPublication, deleteLumiPublication } from '../../src/lib/studioData'
import type { LumiPublication, LumiPublicationKind } from '../../src/lib/studioData'

export default function StudioNewsroom({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<LumiPublication[]>([])
  const [editing, setEditing] = useState<LumiPublication | null>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    setEditing(null); setItems([]); setNotice('')
    if (projectId) void listLumiPublications(projectId).then(rows => { if (active) setItems(rows) }).catch(error => { if (active) setNotice(error.message) })
    return () => { active = false }
  }, [projectId])
  const refresh = async () => setItems(await listLumiPublications(projectId))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !projectId) return
    const element = event.currentTarget
    const data = new FormData(element)
    const input = { projectId, kind: String(data.get('kind')) as LumiPublicationKind, title: String(data.get('title') || '').trim(), body: String(data.get('body') || '').trim(), link: String(data.get('link') || '').trim() }
    if (!input.title || !input.body) return setNotice('Add a title and message.')
    if (input.link && !/^https:\/\//i.test(input.link)) return setNotice('Links must use HTTPS.')
    if (!window.confirm(editing ? 'Save these changes on EBG+?' : `Publish this ${input.kind === 'news' ? 'news article' : 'notification'} on EBG+ now?`)) return
    setBusy(true); setNotice('')
    try {
      const result = editing ? await updateLumiPublication({ ...input, id: editing.id }) : await publishLumiContent(input)
      if (!result.ok) throw new Error('Publishing was not confirmed.')
      setEditing(null); element.reset(); await refresh(); setNotice('Published changes confirmed on EBG+.')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not publish. Your draft is still here.') }
    finally { setBusy(false) }
  }
  return <section className="panel"><h2>News & notifications</h2><p>Publish and manage updates from the selected production. News appears in EBG+ News; notifications appear in viewers’ notification center.</p>{notice && <p role="status">{notice}</p>}{!projectId ? <p>Create or select a production first.</p> : <>
    <form key={editing?.id || 'new'} className="form-grid" onSubmit={submit}>
      <label>Type<select name="kind" defaultValue={editing?.kind || 'news'} disabled={busy || !!editing}><option value="news">News article</option><option value="notification">Viewer notification</option></select>{editing && <input type="hidden" name="kind" value={editing.kind} />}</label>
      <label>Title<input name="title" required maxLength={180} defaultValue={editing?.headline || editing?.title || ''} disabled={busy} /></label>
      <label className="full">Message<textarea name="body" required defaultValue={editing?.body || editing?.text || ''} disabled={busy} /></label>
      <label className="full">Optional HTTPS link<input name="link" type="url" defaultValue={editing?.link || ''} disabled={busy} /></label>
      <div className="full"><button className="button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Review & save' : 'Review & publish'}</button>{editing && <button type="button" className="button secondary" disabled={busy} onClick={() => setEditing(null)}>Cancel editing</button>}</div>
    </form><h3>Published updates</h3>{!items.length && <p>No updates from this production yet.</p>}{items.map(item => <article key={item.id}><strong>{item.headline || item.title}</strong><p>{item.kind === 'news' ? 'News article' : 'Notification'} · {item.publishedAt || item.date}</p><p>{item.body || item.text}</p><button className="button secondary" disabled={busy} onClick={() => setEditing(item)}>Edit</button><button className="button danger" disabled={busy} onClick={async () => { if (!window.confirm('Delete this published update from EBG+?')) return; setBusy(true); try { await deleteLumiPublication({ projectId, kind: item.kind, id: item.id }); await refresh(); if (editing?.id === item.id) setEditing(null); setNotice('Update deleted.') } catch(error) { setNotice(error instanceof Error ? error.message : 'Could not delete.') } finally { setBusy(false) } }}>Delete</button></article>)}
  </>}</section>
}
