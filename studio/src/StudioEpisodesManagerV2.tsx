import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { loadCmsData, saveCmsData, uploadStudioMedia } from '../../src/lib/studioData'

type PublishStatus = 'draft' | 'scheduled' | 'live' | 'archived'
type ContentType = 'series' | 'movie'

type Show = {
  id: string
  title: string
  artwork: string
  contentType?: ContentType
}

type Episode = {
  id: string
  showId: string
  season: number
  number: number
  title: string
  synopsis: string
  runtime: string
  releaseDate: string
  thumbnail: string
  videoUrl: string
  publishStatus?: PublishStatus
}

type CmsData = {
  shows: Show[]
  episodes: Episode[]
  [key: string]: unknown
}

const isEpisodesTab = () => window.location.hash.replace(/^#\/?/, '') === 'episodes'
const nowIso = () => new Date().toISOString()
const statusLabel = (status?: PublishStatus) => status ?? 'scheduled'

export default function StudioEpisodesManagerV2() {
  const [active, setActive] = useState(isEpisodesTab)
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
      setMessage(error instanceof Error ? error.message : 'Could not load release data.')
    }
  }

  useEffect(() => {
    const sync = () => setActive(isEpisodesTab())
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (active) void refresh()
  }, [active])

  const selectedShow = useMemo(() => cms?.shows.find((show) => show.id === showId) ?? cms?.shows[0] ?? null, [cms, showId])
  const selectedEpisodes = useMemo(() => {
    if (!cms || !selectedShow) return []
    return cms.episodes
      .filter((episode) => episode.showId === selectedShow.id)
      .sort((a, b) => a.season - b.season || a.number - b.number)
  }, [cms, selectedShow])
  const groupedSeasons = useMemo(() => {
    const groups = new Map<number, Episode[]>()
    for (const episode of selectedEpisodes) {
      const season = episode.season || 1
      groups.set(season, [...(groups.get(season) ?? []), episode])
    }
    return [...groups.entries()].sort(([a], [b]) => a - b)
  }, [selectedEpisodes])

  const save = async (next: CmsData, note = 'Saved.') => {
    setCms(next)
    try {
      await saveCmsData(next)
      setMessage(note)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Changes could not be saved.')
    }
  }

  const patchEpisode = async (episodeId: string, patch: Partial<Episode>, note = 'Release updated.') => {
    if (!cms) return
    await save({ ...cms, episodes: cms.episodes.map((episode) => episode.id === episodeId ? { ...episode, ...patch } : episode) }, note)
  }

  const duplicateEpisode = async (episode: Episode) => {
    if (!cms) return
    const copy: Episode = {
      ...episode,
      id: `${episode.id}-copy-${Date.now()}`,
      title: `${episode.title} Copy`,
      publishStatus: 'draft',
      releaseDate: nowIso(),
    }
    await save({ ...cms, episodes: [...cms.episodes, copy] }, `${copy.title} created as draft.`)
  }

  const deleteEpisode = async (episode: Episode) => {
    if (!cms || !window.confirm(`Delete “${episode.title}”?`)) return
    await save({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) }, `${episode.title} deleted.`)
  }

  const createRelease = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cms || !selectedShow) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const video = form.get('video')
    if (!(video instanceof File) || !video.size) return setMessage('Choose a video first.')

    setBusy(true)
    try {
      const isMovie = (selectedShow.contentType ?? 'series') === 'movie'
      const thumbnailFile = form.get('thumbnail')
      const videoUrl = await uploadStudioMedia(video, `episodes/${selectedShow.id}`)
      const thumbnail = thumbnailFile instanceof File && thumbnailFile.size
        ? await uploadStudioMedia(thumbnailFile, `episodes/${selectedShow.id}/thumbnails`)
        : selectedShow.artwork
      const publishStatus = String(form.get('publishStatus') ?? 'draft') as PublishStatus
      const releaseInput = String(form.get('releaseDate') ?? '')
      if (publishStatus === 'scheduled' && !releaseInput) throw new Error('Choose a release date before scheduling.')
      const season = isMovie ? 1 : Number(form.get('season') ?? 1)
      const number = isMovie ? 1 : Number(form.get('number') ?? selectedEpisodes.length + 1)
      const title = String(form.get('title') ?? '').trim() || selectedShow.title
      const release: Episode = {
        id: `${selectedShow.id}-${isMovie ? 'feature' : `s${season}e${number}`}-${Date.now()}`,
        showId: selectedShow.id,
        season,
        number,
        title,
        synopsis: String(form.get('synopsis') ?? ''),
        runtime: String(form.get('runtime') ?? ''),
        releaseDate: publishStatus === 'live' ? nowIso() : releaseInput ? new Date(releaseInput).toISOString() : nowIso(),
        thumbnail,
        videoUrl,
        publishStatus,
      }
      const withoutOldMovieAsset = isMovie ? cms.episodes.filter((episode) => episode.showId !== selectedShow.id) : cms.episodes
      await save({ ...cms, episodes: [...withoutOldMovieAsset, release] }, isMovie ? `${selectedShow.title} movie release saved.` : `${release.title} saved.`)
      formElement.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Release could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  if (!active || !cms) return null

  const isMovie = (selectedShow?.contentType ?? 'series') === 'movie'
  const liveCount = selectedEpisodes.filter((episode) => statusLabel(episode.publishStatus) === 'live').length
  const scheduledCount = selectedEpisodes.filter((episode) => statusLabel(episode.publishStatus) === 'scheduled').length
  const draftCount = selectedEpisodes.filter((episode) => statusLabel(episode.publishStatus) === 'draft').length

  const renderReleaseCard = (episode: Episode) => (
    <article className="episodes-v2-release-card" key={episode.id}>
      <div className="episodes-v2-thumb">{episode.thumbnail ? <img src={episode.thumbnail} alt="" /> : <span>▶</span>}</div>
      <div className="episodes-v2-release-copy">
        <div className="episodes-v2-release-topline">
          <span className={`episodes-v2-status status-${statusLabel(episode.publishStatus)}`}>{statusLabel(episode.publishStatus)}</span>
          {!isMovie && <span>S{episode.season} · E{episode.number}</span>}
          {isMovie && <span>Feature release</span>}
        </div>
        <h4>{episode.title}</h4>
        <p>{episode.runtime || 'Runtime not set'} · {new Date(episode.releaseDate).toLocaleString()}</p>
        {episode.synopsis && <small>{episode.synopsis}</small>}
      </div>
      <div className="episodes-v2-release-actions">
        <select value={statusLabel(episode.publishStatus)} onChange={(event) => void patchEpisode(episode.id, { publishStatus: event.target.value as PublishStatus, releaseDate: event.target.value === 'live' ? nowIso() : episode.releaseDate }, 'Publishing status updated.')}>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="archived">Archived</option>
        </select>
        <input type="datetime-local" aria-label="Release date" value={new Date(episode.releaseDate).toISOString().slice(0,16)} onChange={(event) => void patchEpisode(episode.id, { releaseDate: new Date(event.target.value).toISOString() }, 'Release date updated.')} />
        <div>
          {episode.videoUrl && <a className="button secondary" href={episode.videoUrl} target="_blank" rel="noreferrer">Preview ↗</a>}
          {!isMovie && <button className="button secondary" type="button" onClick={() => void duplicateEpisode(episode)}>Duplicate</button>}
          <button className="button danger" type="button" onClick={() => void deleteEpisode(episode)}>Delete</button>
        </div>
      </div>
    </article>
  )

  return (
    <section className="studio-episodes-v2-layer" aria-label="Studio Episodes workflow v2">
      <div className="studio-episodes-v2-scroll">
        <header className="episodes-v2-header">
          <div>
            <p className="eyebrow">RELEASE WORKFLOW / V2</p>
            <h2>{isMovie ? 'Movie release' : 'Episodes'}</h2>
            <p>{isMovie ? 'Manage the feature video, release timing, artwork preview, and publishing state.' : 'Organize seasons, schedule releases, preview media, and move episodes from draft to live.'}</p>
          </div>
          <div className="episodes-v2-header-actions">
            <select value={selectedShow?.id ?? ''} onChange={(event) => setShowId(event.target.value)}>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select>
            {selectedShow && <a className="button secondary" href={`https://ebgplus.app/app/shows/${selectedShow.id}`} target="_blank" rel="noreferrer">View live page ↗</a>}
          </div>
        </header>

        {message && <div className="episodes-v2-message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        {selectedShow && (
          <>
            <section className="episodes-v2-summary">
              <div className="episodes-v2-title-card">
                <div>{selectedShow.artwork ? <img src={selectedShow.artwork} alt="" /> : <span>{selectedShow.title.slice(0,1)}</span>}</div>
                <span><small>{isMovie ? 'MOVIE' : 'SERIES'}</small><strong>{selectedShow.title}</strong><em>{isMovie ? (selectedEpisodes.length ? 'Release asset loaded' : 'No release asset yet') : `${selectedEpisodes.length} total episodes`}</em></span>
              </div>
              <div className="episodes-v2-stat"><span>Live</span><strong>{liveCount}</strong></div>
              <div className="episodes-v2-stat"><span>Scheduled</span><strong>{scheduledCount}</strong></div>
              <div className="episodes-v2-stat"><span>Drafts</span><strong>{draftCount}</strong></div>
            </section>

            <section className="episodes-v2-card">
              <div className="episodes-v2-card-head"><div><span>{isMovie ? 'RELEASE ASSET' : 'LIBRARY'}</span><h3>{isMovie ? selectedShow.title : 'Episode library'}</h3></div><small>{isMovie ? 'One feature video' : `${groupedSeasons.length} season${groupedSeasons.length === 1 ? '' : 's'}`}</small></div>
              {selectedEpisodes.length === 0 ? <div className="episodes-v2-empty"><strong>Nothing uploaded yet.</strong><p>{isMovie ? 'Add the feature video below.' : 'Create the first episode below.'}</p></div> : isMovie ? <div className="episodes-v2-list">{selectedEpisodes.map(renderReleaseCard)}</div> : <div className="episodes-v2-seasons">{groupedSeasons.map(([season, episodes]) => <section key={season}><div className="episodes-v2-season-head"><span>SEASON {season}</span><small>{episodes.length} episode{episodes.length === 1 ? '' : 's'}</small></div><div className="episodes-v2-list">{episodes.map(renderReleaseCard)}</div></section>)}</div>}
            </section>

            <section className="episodes-v2-card episodes-v2-create">
              <div className="episodes-v2-card-head"><div><span>UPLOAD</span><h3>{isMovie ? 'Add / replace movie video' : 'New episode'}</h3></div><small>{isMovie ? 'Saving replaces the current movie asset' : 'Draft, schedule, or publish now'}</small></div>
              <form className="episodes-v2-form-grid" onSubmit={createRelease}>
                <label>Title<input name="title" defaultValue={isMovie ? selectedShow.title : ''} required /></label>
                <label>Runtime<input name="runtime" placeholder={isMovie ? '1h 42m' : '48m'} /></label>
                {!isMovie && <><label>Season<input name="season" type="number" min="1" defaultValue="1" /></label><label>Episode<input name="number" type="number" min="1" defaultValue={selectedEpisodes.length + 1} /></label></>}
                <label>Publishing<select name="publishStatus" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Publish now</option></select></label>
                <label>Release date<input name="releaseDate" type="datetime-local" /></label>
                <label>Video<input name="video" type="file" accept="video/*" required /></label>
                <label>Thumbnail<input name="thumbnail" type="file" accept="image/*" /></label>
                <label className="full">Synopsis<textarea name="synopsis" /></label>
                <div className="full episodes-v2-submit"><button className="button" disabled={busy}>{busy ? 'Uploading…' : isMovie ? 'Save movie release' : 'Save episode'}</button><span>Video uploads use the existing secure Studio media pipeline.</span></div>
              </form>
            </section>
          </>
        )}
      </div>
    </section>
  )
}
