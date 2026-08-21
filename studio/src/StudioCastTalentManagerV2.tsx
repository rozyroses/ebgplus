import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { loadCmsData, saveCmsData, uploadStudioMedia } from '../../src/lib/studioData'

type ContentType = 'series' | 'movie'

type CastMember = {
  name: string
  role: string
  city: string
  bio: string
  image?: string
  social?: string
  status?: string
}

type Show = {
  id: string
  title: string
  artwork: string
  contentType?: ContentType
  cast: CastMember[]
}

type CmsData = {
  shows: Show[]
  [key: string]: unknown
}

const isTalentTab = () => window.location.hash.replace(/^#\/?/, '') === 'talent'

export default function StudioCastTalentManagerV2() {
  const [active, setActive] = useState(isTalentTab)
  const [cms, setCms] = useState<CmsData | null>(null)
  const [showId, setShowId] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const next = await loadCmsData<CmsData>()
      if (!next) return
      setCms(next)
      setShowId((current) => current && next.shows.some((show) => show.id === current) ? current : (next.shows[0]?.id ?? ''))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load cast and talent.')
    }
  }

  useEffect(() => {
    const sync = () => setActive(isTalentTab())
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (active) void refresh()
  }, [active])

  const selectedShow = useMemo(() => cms?.shows.find((show) => show.id === showId) ?? cms?.shows[0] ?? null, [cms, showId])
  const editing = editingIndex === null ? null : selectedShow?.cast[editingIndex] ?? null
  const isMovie = (selectedShow?.contentType ?? 'series') === 'movie'

  const save = async (next: CmsData, note: string) => {
    setCms(next)
    try {
      await saveCmsData(next)
      setMessage(note)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Changes could not be saved.')
    }
  }

  const replaceCast = async (nextCast: CastMember[], note: string) => {
    if (!cms || !selectedShow) return
    await save({ ...cms, shows: cms.shows.map((show) => show.id === selectedShow.id ? { ...show, cast: nextCast } : show) }, note)
  }

  const addProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedShow) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setBusy(true)
    try {
      const imageFile = form.get('image')
      const image = imageFile instanceof File && imageFile.size ? await uploadStudioMedia(imageFile, `series/${selectedShow.id}/cast`) : undefined
      const person: CastMember = {
        name: String(form.get('name') ?? '').trim(),
        role: String(form.get('role') ?? (isMovie ? 'Cast' : 'Cast')).trim(),
        city: String(form.get('city') ?? '').trim(),
        bio: String(form.get('bio') ?? '').trim(),
        social: String(form.get('social') ?? '').trim() || undefined,
        status: String(form.get('status') ?? 'Active').trim(),
        image,
      }
      await replaceCast([...selectedShow.cast, person], `${person.name} added.`)
      formElement.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile could not be added.')
    } finally {
      setBusy(false)
    }
  }

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedShow || editingIndex === null || !editing) return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      const imageFile = form.get('image')
      const image = imageFile instanceof File && imageFile.size
        ? await uploadStudioMedia(imageFile, `series/${selectedShow.id}/cast`)
        : editing.image
      const next: CastMember = {
        name: String(form.get('name') ?? '').trim(),
        role: String(form.get('role') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        bio: String(form.get('bio') ?? '').trim(),
        social: String(form.get('social') ?? '').trim() || undefined,
        status: String(form.get('status') ?? 'Active').trim(),
        image,
      }
      await replaceCast(selectedShow.cast.map((person, index) => index === editingIndex ? next : person), `${next.name} updated.`)
      setEditingIndex(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile could not be updated.')
    } finally {
      setBusy(false)
    }
  }

  const deleteProfile = async (index: number) => {
    if (!selectedShow) return
    const person = selectedShow.cast[index]
    if (!person || !window.confirm(`Delete ${person.name} from ${selectedShow.title}?`)) return
    await replaceCast(selectedShow.cast.filter((_, itemIndex) => itemIndex !== index), `${person.name} deleted.`)
    if (editingIndex === index) setEditingIndex(null)
  }

  const moveProfile = async (index: number, direction: -1 | 1) => {
    if (!selectedShow) return
    const target = index + direction
    if (target < 0 || target >= selectedShow.cast.length) return
    const next = [...selectedShow.cast]
    ;[next[index], next[target]] = [next[target], next[index]]
    await replaceCast(next, 'Cast order updated.')
  }

  if (!active || !cms) return null

  return (
    <section className="studio-cast-v2-layer" aria-label="Studio Cast and Talent v2">
      <div className="studio-cast-v2-scroll">
        <header className="cast-v2-header">
          <div>
            <p className="eyebrow">TALENT MANAGEMENT / V2</p>
            <h2>{isMovie ? 'Cast & Crew' : 'Cast & Talent'}</h2>
            <p>Edit profiles, photos, roles, bios, status, social handles, and display order from one workspace.</p>
          </div>
          <div className="cast-v2-header-actions">
            <select value={selectedShow?.id ?? ''} onChange={(event) => { setShowId(event.target.value); setEditingIndex(null) }}>
              {cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}
            </select>
            {selectedShow && <a className="button secondary" href={`https://ebgplus.app/app/shows/${selectedShow.id}`} target="_blank" rel="noreferrer">View live page ↗</a>}
          </div>
        </header>

        {message && <div className="cast-v2-message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        {selectedShow && (
          <>
            <section className="cast-v2-summary">
              <div className="cast-v2-title-card">
                <div>{selectedShow.artwork ? <img src={selectedShow.artwork} alt="" /> : <span>{selectedShow.title.slice(0,1)}</span>}</div>
                <span><small>{isMovie ? 'MOVIE' : 'SERIES'}</small><strong>{selectedShow.title}</strong><em>{selectedShow.cast.length} profile{selectedShow.cast.length === 1 ? '' : 's'}</em></span>
              </div>
            </section>

            <section className="cast-v2-card">
              <div className="cast-v2-card-head"><div><span>{isMovie ? 'CAST & CREW' : 'CAST & TALENT'}</span><h3>Profiles</h3></div><small>Edit or reorder any profile</small></div>
              {selectedShow.cast.length === 0 ? (
                <div className="cast-v2-empty"><strong>No profiles yet.</strong><p>Add the first person below.</p></div>
              ) : (
                <div className="cast-v2-grid">
                  {selectedShow.cast.map((person, index) => (
                    <article key={`${person.name}-${index}`} className="cast-v2-profile">
                      <div className="cast-v2-photo">{person.image ? <img src={person.image} alt="" /> : <span>{person.name.slice(0,1)}</span>}</div>
                      <div className="cast-v2-copy">
                        <span className="cast-v2-status">{person.status || 'Active'}</span>
                        <h4>{person.name}</h4>
                        <p>{person.role}{person.city ? ` · ${person.city}` : ''}</p>
                        {person.bio && <small>{person.bio}</small>}
                        {person.social && <a href={person.social.startsWith('http') ? person.social : `https://instagram.com/${person.social.replace(/^@/, '')}`} target="_blank" rel="noreferrer">{person.social} ↗</a>}
                      </div>
                      <div className="cast-v2-actions">
                        <button className="button secondary" type="button" onClick={() => setEditingIndex(index)}>Edit</button>
                        <button className="button secondary icon" type="button" disabled={index === 0} onClick={() => void moveProfile(index, -1)}>↑</button>
                        <button className="button secondary icon" type="button" disabled={index === selectedShow.cast.length - 1} onClick={() => void moveProfile(index, 1)}>↓</button>
                        <button className="button danger" type="button" onClick={() => void deleteProfile(index)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="cast-v2-card">
              <div className="cast-v2-card-head"><div><span>ADD PROFILE</span><h3>New {isMovie ? 'cast / crew' : 'talent'} profile</h3></div></div>
              <form className="cast-v2-form-grid" onSubmit={addProfile}>
                <label>Name<input name="name" required /></label>
                <label>Role<input name="role" defaultValue="Cast" /></label>
                <label>City / State<input name="city" /></label>
                <label>Status<select name="status" defaultValue="Active"><option>Active</option><option>Recurring</option><option>Guest</option><option>Inactive</option></select></label>
                <label>Social<input name="social" placeholder="@handle or URL" /></label>
                <label>Photo<input name="image" type="file" accept="image/*" /></label>
                <label className="full">Bio<textarea name="bio" /></label>
                <div className="full"><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Add profile'}</button></div>
              </form>
            </section>
          </>
        )}
      </div>

      {editing && editingIndex !== null && (
        <div className="cast-v2-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingIndex(null) }}>
          <section className="cast-v2-modal" role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`}>
            <div className="cast-v2-modal-head"><div><span>EDIT PROFILE</span><h3>{editing.name}</h3></div><button type="button" onClick={() => setEditingIndex(null)}>×</button></div>
            <form className="cast-v2-form-grid" onSubmit={updateProfile}>
              <label>Name<input name="name" defaultValue={editing.name} required /></label>
              <label>Role<input name="role" defaultValue={editing.role} /></label>
              <label>City / State<input name="city" defaultValue={editing.city} /></label>
              <label>Status<select name="status" defaultValue={editing.status || 'Active'}><option>Active</option><option>Recurring</option><option>Guest</option><option>Inactive</option></select></label>
              <label>Social<input name="social" defaultValue={editing.social || ''} /></label>
              <label>Replace photo<input name="image" type="file" accept="image/*" /></label>
              <label className="full">Bio<textarea name="bio" defaultValue={editing.bio} /></label>
              <div className="full cast-v2-modal-actions"><button className="button secondary" type="button" onClick={() => setEditingIndex(null)}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
