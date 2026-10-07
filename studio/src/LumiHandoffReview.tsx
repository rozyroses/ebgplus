import { useEffect, useRef, useState, type FormEvent } from 'react'
import { loadProjectCms, saveProjectCms } from '../../src/lib/studioData'
import { applyLumiHandoff, destinationFields, type CreatorCms, type Destination } from './lumiHandoff'

export default function LumiHandoffReview({ projectId, image, text, onClose, onSaved }: {
  projectId: string; image?: string; text: string; onClose: () => void; onSaved: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [cms, setCms] = useState<CreatorCms | null>(null)
  const [destination, setDestination] = useState<Destination>(image ? 'poster' : 'description')
  const [id, setId] = useState('')
  const [value, setValue] = useState(image || text)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    dialog.current?.showModal()
    let live = true
    loadProjectCms<CreatorCms>(projectId).then((next) => {
      if (live) { setCms(next); if (!next) setError('Project unavailable.') }
    }).catch((err) => { if (live) setError(err instanceof Error ? err.message : 'Could not load project.') })
    return () => { live = false }
  }, [projectId])
  const [collection, field] = destinationFields[destination]
  const items = (collection === 'releases' ? cms?.music?.releases : cms?.[collection]) || []
  const selected = items.find((item) => item.id === id)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !selected) return
    setBusy(true); setError('')
    try {
      const latest = await loadProjectCms<CreatorCms>(projectId)
      if (!latest) throw new Error('Project unavailable.')
      if (latest[collection === 'releases' ? 'music' : collection]) {
        const records = collection === 'releases' ? latest.music?.releases : latest[collection]
        const current = records?.find((item) => item.id === id)
        if (current?.[field] !== selected[field]) throw new Error('This field changed since you opened the review. Close and reopen to review the latest version.')
      }
      const next = applyLumiHandoff(latest, destination, id, value)
      await saveProjectCms(projectId, next)
      window.dispatchEvent(new CustomEvent('ebg-studio-cms-saved', { detail: { projectId } }))
      onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save. Your content is still here.') }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="lumi-handoff-dialog" aria-labelledby="handoff-title" onCancel={(event) => { if (busy) event.preventDefault(); else onClose() }}>
    <form onSubmit={save}>
      <header><div><span>LUMI → STUDIO</span><h2 id="handoff-title">Choose where it belongs.</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="Close review">×</button></header>
      <p>Review the destination and content before applying it to this project. Changes to live content may appear publicly.</p>
      <label>Use as<select disabled={busy} value={destination} onChange={(e) => { setDestination(e.target.value as Destination); setId('') }}>
        {(image ? ['poster', 'banner', 'logo', 'thumbnail', 'cover'] : ['description', 'synopsis']).map((item) => <option key={item} value={item}>{item}</option>)}
      </select></label>
      <label>Destination<select required disabled={busy} value={id} onChange={(e) => setId(e.target.value)}><option value="">Choose an item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {cms && !items.length && <p role="status">Create a {collection === 'shows' ? 'show' : collection === 'episodes' ? 'episode' : 'music release'} in this project first.</p>}
      {selected && <details><summary>Current {destination}</summary>{image ? <p>{String(selected[field] || 'No artwork yet')}</p> : <p>{String(selected[field] || 'No copy yet')}</p>}</details>}
      {image ? <img src={image} alt="Artwork to apply" /> : <label>Copy<textarea rows={8} required disabled={busy} value={value} onChange={(e) => setValue(e.target.value)} /></label>}
      {error && <p role="alert">{error}</p>}
      <footer><button type="button" disabled={busy} onClick={onClose}>Keep in Lumi</button><button type="submit" disabled={busy || !selected || !value.trim()}>{busy ? 'Saving…' : 'Apply to Studio'}</button></footer>
    </form>
  </dialog>
}
