import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { loadCmsData, saveCmsData, uploadStudioMedia } from '../../src/lib/studioData'

type PublishStatus = 'draft' | 'scheduled' | 'live' | 'archived'
type ReleaseType = 'single' | 'ep' | 'album'

type MusicArtist = {
  id: string
  name: string
  image?: string
  bio?: string
  label?: string
}

type MusicRelease = {
  id: string
  artistId: string
  title: string
  type: ReleaseType
  genre: string
  cover: string
  releaseDate: string
  publishStatus: PublishStatus
  explicit?: boolean
}

type MusicTrack = {
  id: string
  artistId: string
  releaseId?: string
  title: string
  audioUrl: string
  trackNumber: number
  duration?: string
  explicit?: boolean
}

type MusicVideo = {
  id: string
  artistId: string
  trackId?: string
  title: string
  videoUrl: string
  thumbnail?: string
  releaseDate: string
  publishStatus: PublishStatus
}

type MusicCatalog = {
  artists: MusicArtist[]
  releases: MusicRelease[]
  tracks: MusicTrack[]
  videos: MusicVideo[]
  featuredReleaseId?: string
}

type CmsData = Record<string, unknown> & {
  music?: MusicCatalog
}

const emptyMusic: MusicCatalog = { artists: [], releases: [], tracks: [], videos: [] }
const isMusicTab = () => window.location.hash.replace(/^#\/?/, '') === 'music'
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const today = () => new Date().toISOString().slice(0, 10)

const normalizeMusic = (music?: Partial<MusicCatalog> | null): MusicCatalog => ({
  artists: Array.isArray(music?.artists) ? music!.artists! : [],
  releases: Array.isArray(music?.releases) ? music!.releases! : [],
  tracks: Array.isArray(music?.tracks) ? music!.tracks! : [],
  videos: Array.isArray(music?.videos) ? music!.videos! : [],
  featuredReleaseId: music?.featuredReleaseId,
})

export default function StudioMusicManagerV1() {
  const [active, setActive] = useState(isMusicTab)
  const [cms, setCms] = useState<CmsData | null>(null)
  const [music, setMusic] = useState<MusicCatalog>(emptyMusic)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const next = await loadCmsData<CmsData>()
      if (!next) return
      setCms(next)
      setMusic(normalizeMusic(next.music))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Music data could not be loaded.')
    }
  }

  const saveMusic = async (nextMusic: MusicCatalog, note = 'Music library saved.') => {
    if (!cms) return
    const nextCms: CmsData = { ...cms, music: nextMusic }
    setCms(nextCms)
    setMusic(nextMusic)
    try {
      await saveCmsData(nextCms)
      setMessage(note)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Music changes could not be saved.')
    }
  }

  useEffect(() => {
    const sync = () => setActive(isMusicTab())
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (active) void refresh()
  }, [active])

  useEffect(() => {
    let observer: MutationObserver | null = null

    const syncNav = () => {
      const nav = document.querySelector<HTMLElement>('.sidebar nav')
      if (!nav) return
      let button = nav.querySelector<HTMLButtonElement>('[data-studio-music-nav]')
      if (!button) {
        button = document.createElement('button')
        button.type = 'button'
        button.dataset.studioMusicNav = 'true'
        button.innerHTML = '<span>♫</span>Music'
        button.addEventListener('click', () => { window.location.hash = 'music' })
        const mediaButton = Array.from(nav.querySelectorAll<HTMLButtonElement>('button')).find((item) => item.textContent?.trim().endsWith('Media'))
        if (mediaButton) nav.insertBefore(button, mediaButton)
        else nav.appendChild(button)
      }
      const onMusic = isMusicTab()
      button.classList.toggle('active', onMusic)
      if (onMusic) {
        nav.querySelectorAll<HTMLButtonElement>('button').forEach((item) => {
          if (item !== button) item.classList.remove('active')
        })
      }
    }

    const sync = () => syncNav()
    window.addEventListener('hashchange', sync)
    observer = new MutationObserver(syncNav)
    observer.observe(document.body, { childList: true, subtree: true })
    syncNav()
    return () => {
      window.removeEventListener('hashchange', sync)
      observer?.disconnect()
    }
  }, [])

  const artistName = (artistId: string) => music.artists.find((artist) => artist.id === artistId)?.name ?? 'Unknown artist'
  const releaseName = (releaseId?: string) => music.releases.find((release) => release.id === releaseId)?.title ?? 'Standalone single'

  const releasesByArtist = useMemo(() => {
    const result: Record<string, MusicRelease[]> = {}
    music.releases.forEach((release) => {
      result[release.artistId] = [...(result[release.artistId] ?? []), release]
    })
    return result
  }, [music.releases])

  const createArtist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get('name') ?? '').trim()
    if (!name) return
    setBusy(true)
    try {
      const imageFile = form.get('image')
      const image = imageFile instanceof File && imageFile.size ? await uploadStudioMedia(imageFile, 'music/artists') : ''
      const base = slugify(name) || `artist-${Date.now()}`
      const id = music.artists.some((artist) => artist.id === base) ? `${base}-${Date.now()}` : base
      const artist: MusicArtist = {
        id,
        name,
        image,
        bio: String(form.get('bio') ?? ''),
        label: String(form.get('label') ?? 'Wolfpark Recordings'),
      }
      await saveMusic({ ...music, artists: [...music.artists, artist] }, `${name} added to Music Studio.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const createRelease = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    const artistId = String(form.get('artistId') ?? '')
    if (!title || !artistId) return
    setBusy(true)
    try {
      const coverFile = form.get('cover')
      const cover = coverFile instanceof File && coverFile.size ? await uploadStudioMedia(coverFile, 'music/covers') : ''
      const release: MusicRelease = {
        id: `${slugify(title) || 'release'}-${Date.now()}`,
        artistId,
        title,
        type: String(form.get('type') ?? 'single') as ReleaseType,
        genre: String(form.get('genre') ?? ''),
        cover,
        releaseDate: String(form.get('releaseDate') ?? today()),
        publishStatus: String(form.get('publishStatus') ?? 'draft') as PublishStatus,
        explicit: form.get('explicit') === 'on',
      }
      await saveMusic({ ...music, releases: [...music.releases, release] }, `${title} release created.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const createTrack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    const artistId = String(form.get('artistId') ?? '')
    const audioFile = form.get('audio')
    if (!title || !artistId || !(audioFile instanceof File) || !audioFile.size) {
      setMessage('Choose an artist, title, and audio file first.')
      return
    }
    setBusy(true)
    try {
      const audioUrl = await uploadStudioMedia(audioFile, `music/audio/${artistId}`)
      const releaseId = String(form.get('releaseId') ?? '') || undefined
      const track: MusicTrack = {
        id: `${slugify(title) || 'track'}-${Date.now()}`,
        artistId,
        releaseId,
        title,
        audioUrl,
        trackNumber: Number(form.get('trackNumber') ?? 1),
        duration: String(form.get('duration') ?? ''),
        explicit: form.get('explicit') === 'on',
      }
      await saveMusic({ ...music, tracks: [...music.tracks, track] }, `${title} uploaded.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const createVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    const artistId = String(form.get('artistId') ?? '')
    const videoFile = form.get('video')
    if (!title || !artistId || !(videoFile instanceof File) || !videoFile.size) {
      setMessage('Choose an artist, title, and music video file first.')
      return
    }
    setBusy(true)
    try {
      const thumbFile = form.get('thumbnail')
      const [videoUrl, thumbnail] = await Promise.all([
        uploadStudioMedia(videoFile, `music/videos/${artistId}`),
        thumbFile instanceof File && thumbFile.size ? uploadStudioMedia(thumbFile, `music/video-thumbnails/${artistId}`) : Promise.resolve(''),
      ])
      const video: MusicVideo = {
        id: `${slugify(title) || 'video'}-${Date.now()}`,
        artistId,
        trackId: String(form.get('trackId') ?? '') || undefined,
        title,
        videoUrl,
        thumbnail,
        releaseDate: String(form.get('releaseDate') ?? today()),
        publishStatus: String(form.get('publishStatus') ?? 'draft') as PublishStatus,
      }
      await saveMusic({ ...music, videos: [...music.videos, video] }, `${title} music video uploaded.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const patchRelease = (releaseId: string, patch: Partial<MusicRelease>, note: string) =>
    saveMusic({ ...music, releases: music.releases.map((release) => release.id === releaseId ? { ...release, ...patch } : release) }, note)

  const patchVideo = (videoId: string, patch: Partial<MusicVideo>, note: string) =>
    saveMusic({ ...music, videos: music.videos.map((video) => video.id === videoId ? { ...video, ...patch } : video) }, note)

  const removeRelease = async (releaseId: string) => {
    const release = music.releases.find((item) => item.id === releaseId)
    if (!release || !window.confirm(`Delete “${release.title}” from Music Studio? Tracks will become standalone.`)) return
    await saveMusic({
      ...music,
      featuredReleaseId: music.featuredReleaseId === releaseId ? undefined : music.featuredReleaseId,
      releases: music.releases.filter((item) => item.id !== releaseId),
      tracks: music.tracks.map((track) => track.releaseId === releaseId ? { ...track, releaseId: undefined } : track),
    }, `${release.title} removed.`)
  }

  const removeTrack = async (trackId: string) => {
    const track = music.tracks.find((item) => item.id === trackId)
    if (!track || !window.confirm(`Delete “${track.title}” from the catalog?`)) return
    await saveMusic({ ...music, tracks: music.tracks.filter((item) => item.id !== trackId), videos: music.videos.map((video) => video.trackId === trackId ? { ...video, trackId: undefined } : video) }, `${track.title} removed.`)
  }

  const removeVideo = async (videoId: string) => {
    const video = music.videos.find((item) => item.id === videoId)
    if (!video || !window.confirm(`Delete “${video.title}” from the catalog?`)) return
    await saveMusic({ ...music, videos: music.videos.filter((item) => item.id !== videoId) }, `${video.title} removed.`)
  }

  if (!active) return null

  return (
    <section className="studio-music-layer" aria-label="Studio Music Manager">
      <div className="studio-music-scroll">
        <header className="music-studio-header">
          <div>
            <p className="eyebrow">EBG STUDIO / MUSIC</p>
            <h2>Music Studio</h2>
            <p>Upload songs, build releases, publish music videos, and manage the catalog that powers Music on EBG+.</p>
          </div>
          <a className="button secondary" href="https://ebgplus.app/app/music" target="_blank" rel="noreferrer">View Music ↗</a>
        </header>

        {message && <div className="music-studio-message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        <section className="music-studio-stats">
          <article><span>ARTISTS</span><strong>{music.artists.length}</strong></article>
          <article><span>RELEASES</span><strong>{music.releases.length}</strong></article>
          <article><span>TRACKS</span><strong>{music.tracks.length}</strong></article>
          <article><span>MUSIC VIDEOS</span><strong>{music.videos.length}</strong></article>
        </section>

        <div className="music-studio-grid">
          <section className="music-studio-card">
            <div className="music-studio-card-head"><div><span>ARTISTS</span><h3>Add artist</h3></div><small>Profiles power artist attribution</small></div>
            <form className="music-studio-form" onSubmit={createArtist}>
              <label>Artist name<input name="name" required /></label>
              <label>Label<input name="label" defaultValue="Wolfpark Recordings" /></label>
              <label>Artist image<input name="image" type="file" accept="image/*" /></label>
              <label className="full">Bio<textarea name="bio" /></label>
              <div className="full"><button className="button" disabled={busy}>Add artist</button></div>
            </form>
            <div className="music-artist-list">
              {music.artists.map((artist) => (
                <article key={artist.id}>
                  <div>{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name.slice(0,1)}</span>}</div>
                  <span><strong>{artist.name}</strong><small>{artist.label || 'Independent'} · {(releasesByArtist[artist.id] ?? []).length} releases</small></span>
                </article>
              ))}
              {!music.artists.length && <p className="music-empty">Add your first artist to unlock releases, tracks, and videos.</p>}
            </div>
          </section>

          <section className="music-studio-card">
            <div className="music-studio-card-head"><div><span>RELEASES</span><h3>Single, EP or album</h3></div><small>Cover art + release controls</small></div>
            <form className="music-studio-form" onSubmit={createRelease}>
              <label>Artist<select name="artistId" required defaultValue=""><option value="" disabled>Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
              <label>Release type<select name="type" defaultValue="single"><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option></select></label>
              <label>Title<input name="title" required /></label>
              <label>Genre<input name="genre" placeholder="R&B, Pop, Afrobeats…" /></label>
              <label>Release date<input name="releaseDate" type="date" defaultValue={today()} /></label>
              <label>Status<select name="publishStatus" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></label>
              <label>Cover art<input name="cover" type="file" accept="image/*" /></label>
              <label className="music-check"><input name="explicit" type="checkbox" /> Explicit</label>
              <div className="full"><button className="button" disabled={busy}>Create release</button></div>
            </form>
          </section>

          <section className="music-studio-card">
            <div className="music-studio-card-head"><div><span>TRACK UPLOAD</span><h3>Upload music</h3></div><small>MP3 · WAV · M4A · FLAC</small></div>
            <form className="music-studio-form" onSubmit={createTrack}>
              <label>Artist<select name="artistId" required defaultValue=""><option value="" disabled>Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
              <label>Release<select name="releaseId" defaultValue=""><option value="">Standalone single / none</option>{music.releases.map((release) => <option key={release.id} value={release.id}>{artistName(release.artistId)} — {release.title}</option>)}</select></label>
              <label>Track title<input name="title" required /></label>
              <label>Track number<input name="trackNumber" type="number" min="1" defaultValue="1" /></label>
              <label>Duration<input name="duration" placeholder="3:42" /></label>
              <label>Audio file<input name="audio" type="file" accept="audio/*,.flac" required /></label>
              <label className="music-check"><input name="explicit" type="checkbox" /> Explicit</label>
              <div className="full"><button className="button" disabled={busy}>{busy ? 'Uploading…' : 'Upload track'}</button></div>
            </form>
          </section>

          <section className="music-studio-card">
            <div className="music-studio-card-head"><div><span>MUSIC VIDEOS</span><h3>Upload MV</h3></div><small>Full video + thumbnail</small></div>
            <form className="music-studio-form" onSubmit={createVideo}>
              <label>Artist<select name="artistId" required defaultValue=""><option value="" disabled>Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
              <label>Related song<select name="trackId" defaultValue=""><option value="">No linked song</option>{music.tracks.map((track) => <option key={track.id} value={track.id}>{artistName(track.artistId)} — {track.title}</option>)}</select></label>
              <label>Video title<input name="title" required /></label>
              <label>Release date<input name="releaseDate" type="date" defaultValue={today()} /></label>
              <label>Status<select name="publishStatus" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></label>
              <label>Thumbnail<input name="thumbnail" type="file" accept="image/*" /></label>
              <label className="full">Music video<input name="video" type="file" accept="video/*" required /></label>
              <div className="full"><button className="button" disabled={busy}>{busy ? 'Uploading…' : 'Upload music video'}</button></div>
            </form>
          </section>
        </div>

        <section className="music-studio-library">
          <div className="music-studio-card-head"><div><span>CATALOG</span><h3>Releases</h3></div><small>Feature, publish, preview, or remove</small></div>
          <div className="music-release-grid">
            {music.releases.map((release) => (
              <article key={release.id} className={music.featuredReleaseId === release.id ? 'featured' : ''}>
                <div className="music-cover">{release.cover ? <img src={release.cover} alt="" /> : <span>♪</span>}</div>
                <div className="music-release-copy">
                  <span className="music-kicker">{release.type.toUpperCase()} · {artistName(release.artistId)}</span>
                  <h4>{release.title}</h4>
                  <p>{release.genre || 'Uncategorized'} · {release.releaseDate || 'No date'} {release.explicit ? '· E' : ''}</p>
                  <select value={release.publishStatus} onChange={(event) => void patchRelease(release.id, { publishStatus: event.target.value as PublishStatus }, `${release.title} status updated.`)}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select>
                  <div className="music-inline-actions">
                    <button className="button secondary" type="button" onClick={() => void saveMusic({ ...music, featuredReleaseId: release.id }, `${release.title} is featured.`)}>Feature</button>
                    <button className="button danger" type="button" onClick={() => void removeRelease(release.id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
            {!music.releases.length && <p className="music-empty">No releases yet.</p>}
          </div>
        </section>

        <section className="music-studio-library">
          <div className="music-studio-card-head"><div><span>AUDIO LIBRARY</span><h3>Tracks</h3></div><small>Listen inside Studio before publishing</small></div>
          <div className="music-track-list">
            {music.tracks.map((track) => (
              <article key={track.id}>
                <div className="music-track-number">{track.trackNumber}</div>
                <div><strong>{track.title}{track.explicit ? '  E' : ''}</strong><small>{artistName(track.artistId)} · {releaseName(track.releaseId)} {track.duration ? `· ${track.duration}` : ''}</small></div>
                <audio controls preload="none" src={track.audioUrl} />
                <button className="button danger" type="button" onClick={() => void removeTrack(track.id)}>Delete</button>
              </article>
            ))}
            {!music.tracks.length && <p className="music-empty">Uploaded songs will appear here with an audio preview.</p>}
          </div>
        </section>

        <section className="music-studio-library">
          <div className="music-studio-card-head"><div><span>VIDEO LIBRARY</span><h3>Music videos</h3></div><small>Preview and release-control every MV</small></div>
          <div className="music-video-grid">
            {music.videos.map((video) => (
              <article key={video.id}>
                <div className="music-video-preview">{video.thumbnail ? <img src={video.thumbnail} alt="" /> : <video src={video.videoUrl} preload="metadata" />}</div>
                <div>
                  <span className="music-kicker">{artistName(video.artistId)}</span>
                  <h4>{video.title}</h4>
                  <p>{video.trackId ? `Song: ${music.tracks.find((track) => track.id === video.trackId)?.title ?? 'Linked track'}` : 'Standalone video'} · {video.releaseDate}</p>
                  <video controls preload="none" src={video.videoUrl} />
                  <select value={video.publishStatus} onChange={(event) => void patchVideo(video.id, { publishStatus: event.target.value as PublishStatus }, `${video.title} status updated.`)}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select>
                  <button className="button danger" type="button" onClick={() => void removeVideo(video.id)}>Delete</button>
                </div>
              </article>
            ))}
            {!music.videos.length && <p className="music-empty">Music videos will appear here after upload.</p>}
          </div>
        </section>
      </div>
    </section>
  )
}
