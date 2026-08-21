import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { loadCmsData, saveCmsData, uploadStudioMedia } from '../../src/lib/studioData'

type ContentType = 'series' | 'movie'

type Show = {
  id: string
  title: string
  category: string
  description: string
  genre: string
  year: number
  maturity: string
  status: string
  artwork: string
  banner?: string
  logo: string
  logoImage?: string
  homeVisible?: boolean
  contentType?: ContentType
  cast: Array<Record<string, unknown>>
}

type CmsData = {
  slogan: string
  heroShowId: string
  shows: Show[]
  episodes: Array<{ showId: string }>
  rails: Array<{ id: string; title: string; showIds: string[] }>
  comingSoon: string[]
  notifications?: unknown[]
}

const isSeriesTab = () => window.location.hash.replace(/^#\/?/, '') === 'series'
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function StudioSeriesManagerV2() {
  const [active, setActive] = useState(isSeriesTab)
  const [cms, setCms] = useState<CmsData | null>(null)
  const [showId, setShowId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const next = await loadCmsData<CmsData>()
      if (!next) return
      setCms(next)
      setShowId((current) => current && next.shows.some((show) => show.id === current) ? current : (next.shows[0]?.id ?? ''))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load the Studio slate.')
    }
  }

  useEffect(() => {
    const sync = () => setActive(isSeriesTab())
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (active) void refresh()
  }, [active])

  const selected = useMemo(() => cms?.shows.find((show) => show.id === showId) ?? cms?.shows[0] ?? null, [cms, showId])

  const save = async (next: CmsData, note = 'Saved.') => {
    setCms(next)
    try {
      await saveCmsData(next)
      setMessage(note)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Changes could not be saved.')
    }
  }

  const patchSelected = async (patch: Partial<Show>, note?: string) => {
    if (!cms || !selected) return
    await save({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, ...patch } : show) }, note)
  }

  const uploadMedia = async (field: 'artwork' | 'banner' | 'logoImage', file?: File) => {
    if (!file?.size) return
    setBusy(true)
    try {
      const folder = field === 'artwork' ? 'shows/posters' : field === 'banner' ? 'shows/banners' : 'shows/logos'
      const url = await uploadStudioMedia(file, folder)
      await patchSelected({ [field]: url } as Partial<Show>, `${field === 'logoImage' ? 'Logo' : field[0].toUpperCase() + field.slice(1)} updated.`)
    } finally {
      setBusy(false)
    }
  }

  const createTitle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cms) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    setBusy(true)
    try {
      const artworkFile = form.get('artwork')
      const artwork = artworkFile instanceof File && artworkFile.size ? await uploadStudioMedia(artworkFile, 'shows/posters') : ''
      const base = slugify(title) || `title-${Date.now()}`
      const id = cms.shows.some((show) => show.id === base) ? `${base}-${Date.now()}` : base
      const nextShow: Show = {
        id,
        title,
        contentType: String(form.get('contentType') ?? 'series') as ContentType,
        category: String(form.get('category') ?? 'EBG+ Original'),
        description: String(form.get('description') ?? ''),
        genre: String(form.get('genre') ?? ''),
        year: Number(form.get('year') ?? new Date().getFullYear()),
        maturity: String(form.get('maturity') ?? 'TV-14'),
        status: String(form.get('status') ?? 'Coming Soon'),
        artwork,
        logo: title,
        homeVisible: true,
        cast: [],
      }
      await save({ ...cms, shows: [...cms.shows, nextShow] }, `${title} created.`)
      setShowId(id)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  if (!active || !cms) return null

  const selectedEpisodeCount = selected ? cms.episodes.filter((episode) => episode.showId === selected.id).length : 0
  const type = selected?.contentType ?? 'series'

  return (
    <section className="studio-series-v2-layer" aria-label="Studio Series Manager v2">
      <div className="studio-series-v2-scroll">
        <header className="series-v2-header">
          <div>
            <p className="eyebrow">SLATE MANAGEMENT / V2</p>
            <h2>Series & Movies</h2>
            <p>Build the public-facing title, control its release state, and manage every piece of key art from one place.</p>
          </div>
          <div className="series-v2-header-actions">
            <span>{cms.shows.length} titles</span>
            <a className="button secondary" href={selected ? `https://ebgplus.app/app/shows/${selected.id}` : 'https://ebgplus.app/app/shows'} target="_blank" rel="noreferrer">View live page ↗</a>
          </div>
        </header>

        {message && <div className="series-v2-message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        <div className="series-v2-layout">
          <aside className="series-v2-library">
            <div className="series-v2-section-title"><span>YOUR SLATE</span><strong>Titles</strong></div>
            <div className="series-v2-title-list">
              {cms.shows.map((show) => (
                <button key={show.id} type="button" className={show.id === selected?.id ? 'active' : ''} onClick={() => setShowId(show.id)}>
                  <div>{show.artwork ? <img src={show.artwork} alt="" /> : <span>{show.title.slice(0,1)}</span>}</div>
                  <span><strong>{show.title}</strong><small>{(show.contentType ?? 'series') === 'movie' ? 'Movie' : 'Series'} · {show.status}</small></span>
                </button>
              ))}
            </div>
          </aside>

          <div className="series-v2-content">
            {selected && (
              <>
                <section className="series-v2-hero" style={{ backgroundImage: `url(${selected.banner || selected.artwork})` }}>
                  <div className="series-v2-hero-shade" />
                  <div className="series-v2-hero-copy">
                    <span className="series-v2-type">{type === 'movie' ? 'MOVIE' : 'SERIES'}</span>
                    {selected.logoImage ? <img className="series-v2-logo" src={selected.logoImage} alt={`${selected.title} logo`} /> : <h3>{selected.title}</h3>}
                    <p>{selected.genre || 'Uncategorized'} · {selected.year} · {selected.maturity}</p>
                    <div><span>{selected.status}</span><span>{selected.homeVisible === false ? 'Hidden from Home' : 'Visible on Home'}</span><span>{selectedEpisodeCount} {selectedEpisodeCount === 1 ? 'episode' : 'episodes'}</span></div>
                  </div>
                </section>

                <section className="series-v2-card">
                  <div className="series-v2-card-head"><div><span>CORE DETAILS</span><h3>{selected.title}</h3></div><a href={`https://ebgplus.app/app/shows/${selected.id}`} target="_blank" rel="noreferrer">Open on EBG+ ↗</a></div>
                  <div className="series-v2-form-grid">
                    <label>Content type<select value={type} onChange={(event) => void patchSelected({ contentType: event.target.value as ContentType }, 'Content type updated.')}><option value="series">Series</option><option value="movie">Movie</option></select></label>
                    <label>Status<select value={selected.status} onChange={(event) => void patchSelected({ status: event.target.value }, 'Status updated.')}><option>Coming Soon</option><option>Now Streaming</option><option>Current</option><option>On Hiatus</option><option>Completed</option></select></label>
                    <label>Title<input value={selected.title} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, title: event.target.value, logo: show.logo === show.title ? event.target.value : show.logo } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Category<input value={selected.category} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, category: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Genre<input value={selected.genre} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, genre: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Maturity<input value={selected.maturity} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, maturity: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Year<input type="number" value={selected.year} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, year: Number(event.target.value) } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                    <label>Homepage<select value={selected.homeVisible === false ? 'hidden' : 'visible'} onChange={(event) => void patchSelected({ homeVisible: event.target.value === 'visible' }, 'Homepage visibility updated.')}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label>
                    <label className="full">Description<textarea value={selected.description} onChange={(event) => setCms({ ...cms, shows: cms.shows.map((show) => show.id === selected.id ? { ...show, description: event.target.value } : show) })} onBlur={() => void saveCmsData(cms)} /></label>
                  </div>
                  <div className="series-v2-actions">
                    <button className="button" type="button" onClick={() => void save({ ...cms, heroShowId: selected.id }, `${selected.title} is now featured.`)}>Set as featured</button>
                    <button className="button secondary" type="button" onClick={() => { window.location.hash = 'episodes' }}>Manage {type === 'movie' ? 'video' : 'episodes'} →</button>
                    <button className="button secondary" type="button" onClick={() => { window.location.hash = 'talent' }}>Cast & talent →</button>
                  </div>
                </section>

                <section className="series-v2-card">
                  <div className="series-v2-card-head"><div><span>BRAND ASSETS</span><h3>Artwork</h3></div><small>Poster · Banner · Logo</small></div>
                  <div className="series-v2-media-grid">
                    <label><span>Poster</span><div className="series-v2-poster-preview">{selected.artwork ? <img src={selected.artwork} alt="" /> : <b>No poster</b>}</div><input type="file" accept="image/*" onChange={(event) => void uploadMedia('artwork', event.target.files?.[0])} /></label>
                    <label><span>Banner</span><div className="series-v2-banner-preview">{selected.banner ? <img src={selected.banner} alt="" /> : <b>No banner</b>}</div><input type="file" accept="image/*" onChange={(event) => void uploadMedia('banner', event.target.files?.[0])} /></label>
                    <label><span>Logo</span><div className="series-v2-logo-preview">{selected.logoImage ? <img src={selected.logoImage} alt="" /> : <b>{selected.logo || selected.title}</b>}</div><input type="file" accept="image/*" onChange={(event) => void uploadMedia('logoImage', event.target.files?.[0])} /></label>
                  </div>
                </section>
              </>
            )}

            <section className="series-v2-card series-v2-create">
              <div className="series-v2-card-head"><div><span>NEW TITLE</span><h3>Add to the slate</h3></div><small>Create a series or movie</small></div>
              <form className="series-v2-form-grid" onSubmit={createTitle}>
                <label>Title<input name="title" required /></label>
                <label>Content type<select name="contentType" defaultValue="series"><option value="series">Series</option><option value="movie">Movie</option></select></label>
                <label>Category<input name="category" defaultValue="EBG+ Original" /></label>
                <label>Genre<input name="genre" /></label>
                <label>Year<input name="year" type="number" defaultValue={new Date().getFullYear()} /></label>
                <label>Maturity<select name="maturity" defaultValue="TV-14"><option>TV-PG</option><option>TV-14</option><option>TV-MA</option><option>PG</option><option>PG-13</option><option>R</option></select></label>
                <label>Status<select name="status" defaultValue="Coming Soon"><option>Coming Soon</option><option>Now Streaming</option><option>Current</option><option>Completed</option></select></label>
                <label>Poster<input name="artwork" type="file" accept="image/*" /></label>
                <label className="full">Description<textarea name="description" /></label>
                <div className="full"><button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create title'}</button></div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
