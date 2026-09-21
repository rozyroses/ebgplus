import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  loadProjectCms,
  saveProjectCms,
  uploadStudioProjectMedia,
} from '../../src/lib/studioData'

type PublishStatus = 'draft' | 'scheduled' | 'live' | 'archived'
type ReleaseType = 'single' | 'ep' | 'album'
type MusicView = 'home' | 'artists' | 'releases' | 'catalog' | 'videos' | 'new-release'

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
  lyrics?: string
  timedLyrics?: Array<{ start: number; end: number; text: string }>
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

type CmsData = Record<string, unknown> & { music?: MusicCatalog }

type ReleaseDraft = {
  artistId: string
  type: ReleaseType
  title: string
  genre: string
  releaseDate: string
  publishStatus: PublishStatus
  explicit: boolean
}

const emptyMusic: MusicCatalog = { artists: [], releases: [], tracks: [], videos: [] }
const emptyDraft = (): ReleaseDraft => ({
  artistId: '',
  type: 'single',
  title: '',
  genre: '',
  releaseDate: new Date().toISOString().slice(0, 10),
  publishStatus: 'draft',
  explicit: false,
})

const isMusicTab = () => window.location.hash.replace(/^#\/?/, '') === 'music'
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const readProjectId = () => localStorage.getItem('ebg.studio.project.v1') ?? ''

export default function StudioMusicManagerV1() {
  const [active, setActive] = useState(isMusicTab)
  const [projectId, setProjectId] = useState(readProjectId)
  const [cms, setCms] = useState<CmsData | null>(null)
  const [music, setMusic] = useState<MusicCatalog>(emptyMusic)
  const [view, setView] = useState<MusicView>('home')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [wizardStep, setWizardStep] = useState(1)
  const [draft, setDraft] = useState<ReleaseDraft>(emptyDraft)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const refresh = async (targetProjectId = projectId) => {
    if (!targetProjectId) {
      setCms(null)
      setMusic(emptyMusic)
      setMessage('Choose or create a Studio project first.')
      return
    }
    try {
      const next = await loadProjectCms<CmsData>(targetProjectId)
      const value = next ?? {}
      setCms(value)
      setMusic({
        artists: Array.isArray(value.music?.artists) ? value.music!.artists : [],
        releases: Array.isArray(value.music?.releases) ? value.music!.releases : [],
        tracks: Array.isArray(value.music?.tracks) ? value.music!.tracks : [],
        videos: Array.isArray(value.music?.videos) ? value.music!.videos : [],
        featuredReleaseId: value.music?.featuredReleaseId,
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Music data could not be loaded.')
    }
  }

  const saveMusic = async (nextMusic: MusicCatalog, note = 'Music library saved.') => {
    if (!cms || !projectId) return
    const nextCms: CmsData = { ...cms, music: nextMusic }
    setCms(nextCms)
    setMusic(nextMusic)
    try {
      await saveProjectCms(projectId, nextCms)
      setMessage(note)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Music changes could not be saved.')
    }
  }

  useEffect(() => {
    const syncHash = () => setActive(isMusicTab())
    const syncProject = (event: Event) => {
      const custom = event as CustomEvent<{ projectId?: string }>
      const next = custom.detail?.projectId ?? readProjectId()
      setProjectId(next)
      setView('home')
      setWizardStep(1)
      void refresh(next)
    }
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('ebg-studio-project-change', syncProject)
    syncHash()
    return () => {
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('ebg-studio-project-change', syncProject)
    }
  }, [])

  useEffect(() => {
    if (active) void refresh(projectId)
  }, [active, projectId])

  const artistName = (id: string) => music.artists.find((artist) => artist.id === id)?.name ?? 'Unknown artist'
  const releaseName = (id?: string) => music.releases.find((release) => release.id === id)?.title ?? 'Standalone'

  const recentReleases = useMemo(
    () => [...music.releases].sort((a, b) => Date.parse(b.releaseDate || '0') - Date.parse(a.releaseDate || '0')).slice(0, 5),
    [music.releases],
  )

  const addArtist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!projectId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get('name') ?? '').trim()
    if (!name) return
    setBusy(true)
    try {
      const imageFile = form.get('image')
      const image = imageFile instanceof File && imageFile.size
        ? await uploadStudioProjectMedia(imageFile, projectId, 'music/artists')
        : ''
      const base = slugify(name) || `artist-${Date.now()}`
      const id = music.artists.some((artist) => artist.id === base) ? `${base}-${Date.now()}` : base
      const artist: MusicArtist = {
        id,
        name,
        image,
        bio: String(form.get('bio') ?? ''),
        label: String(form.get('label') ?? ''),
      }
      await saveMusic({ ...music, artists: [...music.artists, artist] }, `${name} added.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const finishRelease = async () => {
    if (!projectId || !draft.artistId || !draft.title.trim()) return
    setBusy(true)
    try {
      const cover = coverFile
        ? await uploadStudioProjectMedia(coverFile, projectId, 'music/covers')
        : ''
      const release: MusicRelease = {
        id: `${slugify(draft.title) || 'release'}-${Date.now()}`,
        artistId: draft.artistId,
        title: draft.title.trim(),
        type: draft.type,
        genre: draft.genre.trim(),
        cover,
        releaseDate: draft.releaseDate,
        publishStatus: draft.publishStatus,
        explicit: draft.explicit,
      }
      await saveMusic({ ...music, releases: [...music.releases, release] }, `${release.title} created.`)
      setDraft(emptyDraft())
      setCoverFile(null)
      setWizardStep(1)
      setView('releases')
    } finally {
      setBusy(false)
    }
  }

  const uploadTrack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!projectId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    const artistId = String(form.get('artistId') ?? '')
    const audioFile = form.get('audio')
    if (!title || !artistId || !(audioFile instanceof File) || !audioFile.size) {
      setMessage('Choose an artist, track title, and audio file.')
      return
    }
    setBusy(true)
    try {
      const audioUrl = await uploadStudioProjectMedia(audioFile, projectId, `music/audio/${artistId}`)
      const track: MusicTrack = {
        id: `${slugify(title) || 'track'}-${Date.now()}`,
        artistId,
        releaseId: String(form.get('releaseId') ?? '') || undefined,
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

  const uploadVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!projectId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const title = String(form.get('title') ?? '').trim()
    const artistId = String(form.get('artistId') ?? '')
    const videoFile = form.get('video')
    if (!title || !artistId || !(videoFile instanceof File) || !videoFile.size) {
      setMessage('Choose an artist, title, and video file.')
      return
    }
    setBusy(true)
    try {
      const thumbFile = form.get('thumbnail')
      const [videoUrl, thumbnail] = await Promise.all([
        uploadStudioProjectMedia(videoFile, projectId, `music/videos/${artistId}`),
        thumbFile instanceof File && thumbFile.size
          ? uploadStudioProjectMedia(thumbFile, projectId, `music/video-thumbnails/${artistId}`)
          : Promise.resolve(''),
      ])
      const video: MusicVideo = {
        id: `${slugify(title) || 'video'}-${Date.now()}`,
        artistId,
        trackId: String(form.get('trackId') ?? '') || undefined,
        title,
        videoUrl,
        thumbnail,
        releaseDate: String(form.get('releaseDate') ?? new Date().toISOString().slice(0, 10)),
        publishStatus: String(form.get('publishStatus') ?? 'draft') as PublishStatus,
      }
      await saveMusic({ ...music, videos: [...music.videos, video] }, `${title} video uploaded.`)
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const deleteRelease = async (release: MusicRelease) => {
    if (!window.confirm(`Delete “${release.title}”? Tracks will stay in the catalog.`)) return
    await saveMusic({
      ...music,
      featuredReleaseId: music.featuredReleaseId === release.id ? undefined : music.featuredReleaseId,
      releases: music.releases.filter((item) => item.id !== release.id),
      tracks: music.tracks.map((track) => track.releaseId === release.id ? { ...track, releaseId: undefined } : track),
    }, `${release.title} deleted.`)
  }

  if (!active) return null

  return (
    <section className="studio-music-layer music-v2" aria-label="Music Studio">
      <div className="studio-music-scroll">
        <header className="music-v2-header">
          <div>
            <p className="eyebrow">EBG STUDIO / MUSIC</p>
            <h2>Music Studio</h2>
            <p>One clean place to create releases, upload tracks, manage artists, and publish videos.</p>
          </div>
          <div className="music-v2-header-actions">
            <button className="button" type="button" onClick={() => { setView('new-release'); setWizardStep(1) }}>＋ New Release</button>
            <a className="button secondary" href="https://ebgplus.app/app/music" target="_blank" rel="noreferrer">View Music ↗</a>
          </div>
        </header>

        <nav className="music-v2-nav" aria-label="Music Studio">
          {([
            ['home','Home'],['artists','Artists'],['releases','Releases'],['catalog','Catalog'],['videos','Videos']
          ] as Array<[MusicView,string]>).map(([id,label]) => (
            <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>

        {message && <div className="music-studio-message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        {view === 'home' && (
          <div className="music-v2-home">
            <section className="music-v2-welcome">
              <div><span>YOUR CATALOG</span><h3>Make the next release.</h3><p>Start with a release, then add its tracks, lyrics, videos, and publishing details when you’re ready.</p></div>
              <button className="button" type="button" onClick={() => setView('new-release')}>Create release</button>
            </section>
            <section className="music-studio-stats">
              <article><span>ARTISTS</span><strong>{music.artists.length}</strong></article>
              <article><span>RELEASES</span><strong>{music.releases.length}</strong></article>
              <article><span>TRACKS</span><strong>{music.tracks.length}</strong></article>
              <article><span>VIDEOS</span><strong>{music.videos.length}</strong></article>
            </section>
            <section className="music-studio-library">
              <div className="music-studio-card-head"><div><span>CONTINUE WORKING</span><h3>Recent releases</h3></div></div>
              <div className="music-release-grid">
                {recentReleases.map((release) => (
                  <article key={release.id}>
                    <div className="music-cover">{release.cover ? <img src={release.cover} alt="" /> : <span>♪</span>}</div>
                    <div className="music-release-copy"><span className="music-kicker">{release.type.toUpperCase()} · {artistName(release.artistId)}</span><h4>{release.title}</h4><p>{release.publishStatus} · {release.releaseDate}</p><button className="button secondary" type="button" onClick={() => setView('releases')}>Open release</button></div>
                  </article>
                ))}
                {!recentReleases.length && <p className="music-empty">No releases yet. Your first one starts with the New Release button.</p>}
              </div>
            </section>
          </div>
        )}

        {view === 'new-release' && (
          <section className="music-v2-wizard">
            <div className="music-v2-wizard-head"><div><span>NEW RELEASE</span><h3>Step {wizardStep} of 4</h3></div><button type="button" onClick={() => setView('home')}>×</button></div>
            <div className="music-v2-progress">{[1,2,3,4].map((step) => <span key={step} className={wizardStep >= step ? 'active' : ''}>{step}</span>)}</div>

            {wizardStep === 1 && <div className="music-v2-step"><h4>Who is releasing it?</h4><p>Choose the artist and release type.</p><div className="music-v2-step-grid"><label>Artist<select value={draft.artistId} onChange={(e) => setDraft({ ...draft, artistId: e.target.value })}><option value="">Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><label>Release type<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ReleaseType })}><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option></select></label></div>{!music.artists.length && <p className="music-v2-hint">You need an artist first. <button type="button" onClick={() => setView('artists')}>Add artist →</button></p>}<div className="music-v2-step-actions"><button className="button" type="button" disabled={!draft.artistId} onClick={() => setWizardStep(2)}>Continue</button></div></div>}

            {wizardStep === 2 && <div className="music-v2-step"><h4>Release details</h4><p>Add the information listeners will see.</p><div className="music-v2-step-grid"><label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Genre<input value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} /></label><label>Release date<input type="date" value={draft.releaseDate} onChange={(e) => setDraft({ ...draft, releaseDate: e.target.value })} /></label><label>Status<select value={draft.publishStatus} onChange={(e) => setDraft({ ...draft, publishStatus: e.target.value as PublishStatus })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option></select></label><label className="music-check"><input type="checkbox" checked={draft.explicit} onChange={(e) => setDraft({ ...draft, explicit: e.target.checked })} /> Explicit</label></div><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(1)}>Back</button><button className="button" type="button" disabled={!draft.title.trim()} onClick={() => setWizardStep(3)}>Continue</button></div></div>}

            {wizardStep === 3 && <div className="music-v2-step"><h4>Artwork</h4><p>Add the cover now or come back to it later.</p><label className="music-v2-cover-upload">Cover art<input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} /><span>{coverFile ? coverFile.name : 'Choose image'}</span></label><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(2)}>Back</button><button className="button" type="button" onClick={() => setWizardStep(4)}>Review</button></div></div>}

            {wizardStep === 4 && <div className="music-v2-step"><h4>Ready to create?</h4><div className="music-v2-review"><span>{coverFile ? 'Artwork ready' : 'No artwork yet'}</span><strong>{draft.title}</strong><p>{artistName(draft.artistId)} · {draft.type.toUpperCase()} · {draft.releaseDate}</p><small>{draft.genre || 'No genre'} · {draft.publishStatus}{draft.explicit ? ' · Explicit' : ''}</small></div><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(3)}>Back</button><button className="button" type="button" disabled={busy} onClick={() => void finishRelease()}>{busy ? 'Creating…' : 'Create Release'}</button></div></div>}
          </section>
        )}

        {view === 'artists' && (
          <section className="music-v2-section">
            <div className="music-v2-section-head"><div><span>ARTISTS</span><h3>Your artist profiles</h3></div></div>
            <div className="music-v2-two-column">
              <form className="music-studio-card music-studio-form" onSubmit={addArtist}><div className="music-studio-card-head"><div><span>ADD ARTIST</span><h3>New profile</h3></div></div><label>Artist name<input name="name" required /></label><label>Label / company<input name="label" /></label><label>Artist image<input name="image" type="file" accept="image/*" /></label><label className="full">Bio<textarea name="bio" /></label><div className="full"><button className="button" disabled={busy}>Add Artist</button></div></form>
              <div className="music-artist-list">{music.artists.map((artist) => <article key={artist.id}><div>{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name.slice(0,1)}</span>}</div><span><strong>{artist.name}</strong><small>{artist.label || 'Independent'} · {music.releases.filter((release) => release.artistId === artist.id).length} releases</small></span></article>)}{!music.artists.length && <p className="music-empty">No artists yet.</p>}</div>
            </div>
          </section>
        )}

        {view === 'releases' && (
          <section className="music-v2-section">
            <div className="music-v2-section-head"><div><span>RELEASES</span><h3>Singles, EPs & albums</h3></div><button className="button" type="button" onClick={() => setView('new-release')}>＋ New Release</button></div>
            <div className="music-release-grid">{music.releases.map((release) => <article key={release.id} className={music.featuredReleaseId === release.id ? 'featured' : ''}><div className="music-cover">{release.cover ? <img src={release.cover} alt="" /> : <span>♪</span>}</div><div className="music-release-copy"><span className="music-kicker">{release.type.toUpperCase()} · {artistName(release.artistId)}</span><h4>{release.title}</h4><p>{release.genre || 'Uncategorized'} · {release.releaseDate}</p><div className="music-inline-actions"><button className="button secondary" type="button" onClick={() => void saveMusic({ ...music, featuredReleaseId: release.id }, `${release.title} featured.`)}>Feature</button><button className="button danger" type="button" onClick={() => void deleteRelease(release)}>Delete</button></div></div></article>)}{!music.releases.length && <p className="music-empty">No releases yet.</p>}</div>
          </section>
        )}

        {view === 'catalog' && (
          <section className="music-v2-section">
            <div className="music-v2-section-head"><div><span>CATALOG</span><h3>Tracks</h3></div></div>
            <form className="music-studio-card music-studio-form music-v2-track-form" onSubmit={uploadTrack}><label>Artist<select name="artistId" required defaultValue=""><option value="">Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><label>Release<select name="releaseId" defaultValue=""><option value="">Standalone</option>{music.releases.map((release) => <option key={release.id} value={release.id}>{artistName(release.artistId)} — {release.title}</option>)}</select></label><label>Track title<input name="title" required /></label><label>Track #<input name="trackNumber" type="number" min="1" defaultValue="1" /></label><label>Duration<input name="duration" placeholder="3:42" /></label><label>Audio<input name="audio" type="file" accept="audio/*,.flac" required /></label><label className="music-check"><input name="explicit" type="checkbox" /> Explicit</label><div className="full"><button className="button" disabled={busy}>{busy ? 'Uploading…' : 'Upload Track'}</button></div></form>
            <div className="music-track-list">{music.tracks.map((track) => <article key={track.id}><div className="music-track-number">{track.trackNumber}</div><div><strong>{track.title}{track.explicit ? '  E' : ''}</strong><small>{artistName(track.artistId)} · {releaseName(track.releaseId)} {track.duration ? `· ${track.duration}` : ''}</small></div><audio controls preload="none" src={track.audioUrl} /></article>)}{!music.tracks.length && <p className="music-empty">No tracks uploaded yet.</p>}</div>
          </section>
        )}

        {view === 'videos' && (
          <section className="music-v2-section">
            <div className="music-v2-section-head"><div><span>VIDEOS</span><h3>Music videos</h3></div></div>
            <form className="music-studio-card music-studio-form" onSubmit={uploadVideo}><label>Artist<select name="artistId" required defaultValue=""><option value="">Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><label>Related track<select name="trackId" defaultValue=""><option value="">None</option>{music.tracks.map((track) => <option key={track.id} value={track.id}>{artistName(track.artistId)} — {track.title}</option>)}</select></label><label>Video title<input name="title" required /></label><label>Release date<input name="releaseDate" type="date" /></label><label>Status<select name="publishStatus" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option></select></label><label>Thumbnail<input name="thumbnail" type="file" accept="image/*" /></label><label className="full">Video<input name="video" type="file" accept="video/*" required /></label><div className="full"><button className="button" disabled={busy}>{busy ? 'Uploading…' : 'Upload Video'}</button></div></form>
            <div className="music-video-grid">{music.videos.map((video) => <article key={video.id}><div className="music-video-preview">{video.thumbnail ? <img src={video.thumbnail} alt="" /> : <span>▶</span>}</div><h4>{video.title}</h4><p>{artistName(video.artistId)} · {video.publishStatus}</p></article>)}{!music.videos.length && <p className="music-empty">No music videos yet.</p>}</div>
          </section>
        )}
      </div>
    </section>
  )
}
