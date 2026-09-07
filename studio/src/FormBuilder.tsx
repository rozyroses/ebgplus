import { useState } from 'react'
import type { FormEvent } from 'react'
import { createForm } from './formsNetwork'
import type { NetworkFormQuestion, NetworkForm } from './formsNetwork'

type Question = Omit<NetworkFormQuestion, 'id' | 'form_id'> & { localId: string }
const question = (): Question => ({ localId: crypto.randomUUID(), label: '', key: '', type: 'text', required: true, position: 0, options: null, placeholder: null })
export default function FormBuilder({ onCreated }: { onCreated: () => Promise<void> }) {
  const [questions, setQuestions] = useState<Question[]>([question()])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const patch = (id: string, values: Partial<Question>) => setQuestions(items => items.map(q => q.localId === id ? { ...q, ...values } : q))
  const move = (index: number, offset: number) => setQuestions(items => { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next })
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const el = event.currentTarget; const data = new FormData(el); setError('')
    if (!questions.length || questions.some(q => !q.label.trim() || (q.type === 'select' && !q.options?.some(o => o.trim())))) { setError('Give each question a label and add choices to every dropdown.'); return }
    setBusy(true)
    try {
      const slug = String(data.get('slug') || title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (!slug) throw new Error('Add a link name using letters or numbers.')
      await createForm({ title: title.trim(), slug, eyebrow: String(data.get('eyebrow') || 'EBG+ OPPORTUNITY'), description, status: String(data.get('status')) as NetworkForm['status'], submitMessage: String(data.get('submitMessage')), questions: questions.map(({ localId, ...q }, i) => ({ ...q, label: q.label.trim(), key: `question_${localId.replaceAll('-', '')}`, position: i, options: q.type === 'select' ? (q.options || []).map(o => o.trim()).filter(Boolean) : null })) })
      setTitle(''); setDescription(''); setQuestions([question()]); el.reset(); await onCreated()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create this form.') } finally { setBusy(false) }
  }
  return <section className="panel builder-panel"><div className="builder-heading"><div><p className="eyebrow">FORM BUILDER</p><h3>Start a new conversation.</h3></div><button type="button" className="button secondary" onClick={() => setPreview(!preview)}>{preview ? 'Back to editing' : 'Preview form'}</button></div>
    <form onSubmit={submit}><div hidden={preview}><fieldset disabled={busy}><div className="form-grid"><label>Form title<input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your opportunity a name" /></label><label>Link name<input name="slug" pattern="[a-z0-9-]+" placeholder="Automatically generated" /></label><label>Category label<input name="eyebrow" defaultValue="EBG+ OPPORTUNITY" /></label><label>Availability<select name="status" defaultValue="draft"><option value="draft">Draft · keep private</option><option value="open">Open · accept applications</option><option value="closed">Closed</option></select></label><label className="full">Introduction<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Who is this for? What should they know?" /></label></div>
      <div className="builder-heading question-heading"><h4>Your questions <span>{questions.length}</span></h4><button className="button secondary" type="button" onClick={() => setQuestions(items => [...items, question()])}>+ Add question</button></div>
      <div className="question-stack">{questions.map((q, i) => <article className="question-editor" key={q.localId}><div className="question-editor-top"><span>QUESTION {String(i + 1).padStart(2, '0')}</span><div><button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move question ${i + 1} up`}>↑</button><button type="button" disabled={i === questions.length - 1} onClick={() => move(i, 1)} aria-label={`Move question ${i + 1} down`}>↓</button><button type="button" disabled={questions.length === 1} onClick={() => setQuestions(items => items.filter(item => item.localId !== q.localId))}>Remove</button></div></div><div className="form-grid"><label>Question<input required value={q.label} onChange={e => patch(q.localId, { label: e.target.value })} placeholder="What would you like to ask?" /></label><label>Answer type<select value={q.type} onChange={e => patch(q.localId, { type: e.target.value as Question['type'] })}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="email">Email address</option><option value="number">Number</option><option value="select">Dropdown</option></select></label>{q.type === 'select' && <label className="full">Choices · one per line<textarea value={(q.options || []).join('\n')} onChange={e => patch(q.localId, { options: e.target.value.split('\n') })} required /></label>}<label>Placeholder<input value={q.placeholder || ''} onChange={e => patch(q.localId, { placeholder: e.target.value })} /></label><label className="checkbox-label"><input type="checkbox" checked={q.required} onChange={e => patch(q.localId, { required: e.target.checked })} />Required answer</label></div></article>)}</div>
      <label className="confirmation-label">After submission<input name="submitMessage" defaultValue="Thanks — your response has been received." required /></label></fieldset></div>
      {preview && <section className="builder-preview"><p className="eyebrow">APPLICANT PREVIEW · NOTHING IS SUBMITTED</p><h2>{title || 'Your form title'}</h2><p>{description || 'Your introduction appears here.'}</p>{questions.map(q => <label key={q.localId}>{q.label || 'Untitled question'} {q.required ? '(Required)' : '(Optional)'}{q.type === 'textarea' ? <textarea placeholder={q.placeholder || ''} /> : q.type === 'select' ? <select><option>Choose one</option>{q.options?.map((o, i) => <option key={i}>{o}</option>)}</select> : <input type={q.type} placeholder={q.placeholder || ''} />}</label>)}</section>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!preview && <div className="builder-footer"><p>Drafts stay private until you open the form.</p><button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create form ↗'}</button></div>}
    </form></section>
}
