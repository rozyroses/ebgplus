import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  loadProjectCms,
  saveProjectCms,
  uploadStudioProjectMedia,
} from '../../src/lib/studioData'

import { EbgAudioPlayer, EbgMusicDock, MusicCollectionActions } from '../../src/components/MusicPlayer'
import { catalogTrack } from '../../src/lib/musicPlayback'
import { mergeMusicEdits } from './mergeMusicEdits'
import { generateTrackLyrics } from './generateTrackLyrics'
import { assertLyricTranscript } from './lyricsAudio'
import { assertReleaseAudio, attachReleaseTracks, replaceTrackAudio } from './releaseWizard'
import StudioAudioSources from './StudioAudioSources'
import ReleaseMetadataFields from './ReleaseMetadataFields'
import StudioMastering from './StudioMastering'
import { emptyDistribution } from './musicDistribution'
import MusicDistributionPanel from './MusicDistributionPanel'
import type { DistributionDetails, Platform } from './musicDistribution'

type PublishStatus = 'draft' | 'scheduled' | 'live' | 'archived'
type ReleaseType = 'single' | 'ep' | 'album'
type MusicView = 'home' | 'artists' | 'releases' | 'catalog' | 'videos' | 'new-release' | 'streaming-links' | 'mastering' | 'release-saved'

type MusicArtist = {
  id: string
  name: string
  image?: string
  bio?: string
  label?: string
}

type MusicRelease = {
  distribution?: DistributionDetails
  streamingLinks?: Partial<Record<Platform, string>>
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
  losslessUrl?: string
  losslessMimeType?: string
  atmosUrl?: string
  audioUrl: string
  originalAudioUrl?: string
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
  const [editingRelease, setEditingRelease] = useState<MusicRelease | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [wizardTracks, setWizardTracks] = useState<MusicTrack[]>([])
  const [trackFile, setTrackFile] = useState<File | null>(null)
  const [trackTitle, setTrackTitle] = useState('')
  const [metadata, setMetadata] = useState<DistributionDetails>(emptyDistribution)
  const [selectedReleaseId, setSelectedReleaseId] = useState('')
  const [masterTrackId, setMasterTrackId] = useState('')
  useEffect(() => {
    if (!coverFile) { setCoverPreview(''); return }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])


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
    try {
      const latest = await loadProjectCms<CmsData>(projectId) ?? {}
      const merged = mergeMusicEdits(music, nextMusic, latest.music ?? emptyMusic)
      const nextCms: CmsData = { ...latest, music: merged }
      const saved = await saveProjectCms(projectId, nextCms)
      setCms(saved.cms)
      setMusic(saved.cms.music ?? merged)
      window.dispatchEvent(new CustomEvent('ebg-studio-cms-saved', {detail:{projectId}}))
      setMessage(note)
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Music changes could not be saved.')
      return false
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
      setEditingRelease(null)
      setDraft(emptyDraft()); setMetadata(emptyDistribution()); setSelectedReleaseId(''); setMasterTrackId('')
      setCoverFile(null)
      setWizardTracks([]); setTrackFile(null); setTrackTitle('')
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
      if (!(await saveMusic({ ...music, artists: [...music.artists, artist] }, `${name} added.`))) return
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const finishRelease = async () => {
    if (!projectId || !draft.artistId || !draft.title.trim()) return
    setBusy(true)
    try {
      assertReleaseAudio(draft.publishStatus, wizardTracks)
      const pendingTracks = wizardTracks.map(track => ({...track, timedLyrics:track.timedLyrics?.filter(line => Number.isFinite(line.start) && Number.isFinite(line.end) && line.text.trim()).map(line => ({...line, start:Math.max(0,line.start),end:Math.max(line.end,Math.max(0,line.start)+0.1),text:line.text.trim()})).sort((a,b) => a.start-b.start)}))
      pendingTracks.forEach(track => assertLyricTranscript({text:track.lyrics, timedLyrics:track.timedLyrics}))
      const cover = coverFile
        ? await uploadStudioProjectMedia(coverFile, projectId, 'music/covers')
        : music.releases.find(item => item.id === editingRelease?.id)?.cover || editingRelease?.cover || ''
      const release: MusicRelease = {
        id: editingRelease?.id || `${slugify(draft.title) || 'release'}-${Date.now()}`,
        artistId: draft.artistId,
        title: draft.title.trim(),
        type: draft.type,
        genre: draft.genre.trim(),
        cover,
        releaseDate: draft.releaseDate,
        publishStatus: draft.publishStatus,
        explicit: draft.explicit,
        distribution: metadata,
      }
      const tracks = attachReleaseTracks(music.tracks, pendingTracks, release.id, release.artistId)
      if (!(await saveMusic({ ...music, tracks, releases: editingRelease ? music.releases.map(item => item.id === editingRelease.id ? { ...item, ...release } : item) : [...music.releases, release] }, `${release.title} saved with ${wizardTracks.length} track${wizardTracks.length === 1 ? '' : 's'}. ${release.publishStatus === 'live' ? 'Published on EBG+ Music.' : release.publishStatus === 'scheduled' ? 'Scheduled on EBG+ Music.' : 'Draft saved.'}`))) return
      setEditingRelease(null)
      setDraft(emptyDraft())
      setCoverFile(null)
      setWizardStep(1)
      setWizardTracks([]); setTrackFile(null); setTrackTitle('')
      setSelectedReleaseId(release.id)
      setView('release-saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Release could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const uploadWizardTrack = async () => {
    if (!projectId || !trackFile || busy) return
    setBusy(true); setMessage('Uploading song audio…')
    try {
      const audioUrl = await uploadStudioProjectMedia(trackFile, projectId, `music/audio/${draft.artistId}`)
      const title = trackTitle.trim() || (draft.type === 'single' ? draft.title.trim() : trackFile.name.replace(/\.[^.]+$/, ''))
      const track: MusicTrack = { id: `${slugify(title) || 'track'}-${Date.now()}`, artistId:draft.artistId, title, audioUrl, trackNumber:wizardTracks.length + 1, explicit:draft.explicit }
      if (/\.flac$/i.test(trackFile.name)) { track.losslessUrl=audioUrl; track.losslessMimeType='audio/flac' }
      setWizardTracks(current => [...current,track]); setTrackFile(null); setTrackTitle('')
      setMessage('Audio uploaded. Continue to generate lyrics, then save the release.')
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Audio upload failed. Try again.') }
    finally { setBusy(false) }
  }
  const replaceWizardAudio = async (track: MusicTrack, file: File | undefined) => {
    if (!file || !projectId || busy) return
    setBusy(true); setMessage('Replacing song audio…')
    try {
      const audioUrl = await uploadStudioProjectMedia(file, projectId, `music/audio/${track.id}`)
      const flac = /\.flac$/i.test(file.name)
      setWizardTracks(current => current.map(item => item.id === track.id ? replaceTrackAudio(item,audioUrl,flac) : item))
      setMessage('Audio replaced in this draft. Regenerate lyrics and save the release to publish the replacement. Previous alternate mixes were cleared.')
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Audio could not be replaced.') }
    finally { setBusy(false) }
  }
  const generateWizardLyrics = async (track: MusicTrack) => {
    if (busy) return
    setBusy(true); setMessage('Listening to the song and timing its lyrics…')
    try {
      const payload = await generateTrackLyrics(projectId, track, setMessage)
      const timedLyrics = (payload.timedLyrics ?? []).filter(line => Number.isFinite(line.start) && Number.isFinite(line.end) && line.text?.trim())
      setWizardTracks(current => current.map(item => item.id === track.id ? {...item, timedLyrics, lyrics:payload.text?.trim() || timedLyrics.map(line => line.text).join('\n')} : item))
      setMessage('Timed lyrics ready. Review the words and timing below before saving.')
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Lyrics could not be generated. You can skip this step.') }
    finally { setBusy(false) }
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
      const losslessFile = form.get('losslessFile') as File
      const atmosFile = form.get('atmosFile') as File
      const primaryLossless = /\.flac$/i.test(audioFile.name) || (/\.wav$/i.test(audioFile.name) && form.get('confirmPcm') === 'on')
      if (losslessFile?.size && !/\.(flac|wav)$/i.test(losslessFile.name)) throw new Error('Use a FLAC or PCM WAV lossless master.')
      if (atmosFile?.size && !/\.(mp4|m4a)$/i.test(atmosFile.name)) throw new Error('Use an Atmos DD+ JOC mix in MP4 or M4A.')
      if (atmosFile?.size && form.get('confirmAtmos') !== 'on') throw new Error('Confirm that your alternate file contains a genuine Dolby Atmos mix.')
      if (primaryLossless && losslessFile?.size) throw new Error('Your main file is already lossless. Leave the alternate lossless upload empty.')
      const audioUrl = await uploadStudioProjectMedia(audioFile, projectId, `music/audio/${artistId}`)
      const losslessUrl = primaryLossless ? audioUrl : losslessFile?.size ? await uploadStudioProjectMedia(losslessFile, projectId, `music/lossless/${artistId}`) : ''
      const losslessMimeType = primaryLossless ? (/\.flac$/i.test(audioFile.name) ? 'audio/flac' : 'audio/wav') : losslessFile?.size ? (/\.flac$/i.test(losslessFile.name) ? 'audio/flac' : 'audio/wav') : ''
      const atmosUrl = atmosFile?.size ? await uploadStudioProjectMedia(atmosFile, projectId, `music/atmos/${artistId}`) : ''
      const track: MusicTrack = {
        id: `${slugify(title) || 'track'}-${Date.now()}`,
        artistId,
        releaseId: String(form.get('releaseId') ?? '') || undefined,
        title,
        audioUrl,
        losslessUrl,
        losslessMimeType,
        atmosUrl,
        trackNumber: Number(form.get('trackNumber') ?? 1),
        duration: String(form.get('duration') ?? ''),
        explicit: form.get('explicit') === 'on',
      }
      if (!(await saveMusic({ ...music, tracks: [...music.tracks, track] }, `${title} uploaded.`))) return
      formElement.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Track could not be uploaded. Your inputs are retained.')
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
      if (!(await saveMusic({ ...music, videos: [...music.videos, video] }, `${title} video uploaded.`))) return
      formElement.reset()
    } finally {
      setBusy(false)
    }
  }

  const openLyrics = (trackId?: string) => window.dispatchEvent(new CustomEvent('ebg-studio-open-lyrics', { detail: { trackId } }))

  const editRelease = (release: MusicRelease) => {
    setEditingRelease(release)
    setDraft({ artistId: release.artistId, type: release.type, title: release.title, genre: release.genre || '', releaseDate: release.releaseDate?.slice(0, 10) || '', publishStatus: release.publishStatus, explicit: !!release.explicit })
    setCoverFile(null)
    setMetadata({...emptyDistribution(),...release.distribution})
    setWizardTracks(music.tracks.filter(track => track.releaseId === release.id).map(track => ({...track})))
    setTrackFile(null); setTrackTitle('')
    setView('new-release')
    setWizardStep(2)
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

  const previewTracks = music.tracks.map(track => catalogTrack(track, artistName(track.artistId), music.releases.find(release => release.id === track.releaseId)?.cover))
  useEffect(() => {
    const sync = () => { void refresh(projectId) }
    window.addEventListener('ebg-studio-music-change', sync)
    return () => window.removeEventListener('ebg-studio-music-change', sync)
  }, [projectId])

  if (!active) return null

  return (
    <section className="studio-music-layer music-v2" aria-label="Music Studio">
      <EbgMusicDock key={projectId} /><div className="studio-music-scroll">
        <header className="music-v2-header">
          <div>
            <p className="eyebrow">EBG STUDIO / MUSIC</p>
            <h2>Music Studio</h2>
            <p>One clean place to create releases, upload tracks, manage artists, and publish videos.</p>
          </div>
          <div className="music-v2-header-actions"><a className="button secondary" href="#publishing">Review & Publish</a><button className="button secondary" type="button" onClick={() => openLyrics()}>Generate / edit timed lyrics</button>
            <button className="button" type="button" onClick={() => { setEditingRelease(null); setDraft(emptyDraft()); setMetadata(emptyDistribution()); setCoverFile(null); setWizardTracks([]); setTrackFile(null); setTrackTitle(''); setView('new-release'); setWizardStep(1) }}>＋ New Release</button>
            <a className="button secondary" href="https://ebgplus.app/app/music" target="_blank" rel="noreferrer">View Music ↗</a>
          </div>
        </header>

        <nav className="music-v2-nav" aria-label="Music Studio">
          {([
            ['home','Home'],['artists','Artists'],['releases','Releases'],['catalog','Catalog'],['mastering','Mastering'],['streaming-links','Streaming links'],['videos','Videos']
          ] as Array<[MusicView,string]>).map(([id,label]) => (
            <button key={id} type="button" className={view === id ? 'active' : ''} disabled={busy} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>

        {message && <div className="music-studio-message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        {view === 'home' && (
          <div className="music-v2-home">
            <section className="music-v2-welcome">
              <div><span>YOUR CATALOG</span><h3>Make the next release.</h3><p>Add release details, cover art, audio, and timed lyrics in one flow, then publish when you’re ready.</p></div>
              <button className="button" type="button" onClick={() => { setEditingRelease(null); setDraft(emptyDraft()); setMetadata(emptyDistribution()); setCoverFile(null); setWizardTracks([]); setTrackFile(null); setTrackTitle(''); setWizardStep(1); setView('new-release') }}>Create release</button>
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
                    <div className="music-release-copy"><span className="music-kicker">{release.type.toUpperCase()} · {artistName(release.artistId)}</span><h4>{release.title}</h4><p>{release.publishStatus} · {release.releaseDate}</p><button className="button secondary" type="button" onClick={() => editRelease(release)}>Edit release</button></div>
                  </article>
                ))}
                {!recentReleases.length && <p className="music-empty">No releases yet. Your first one starts with the New Release button.</p>}
              </div>
            </section>
          </div>
        )}

        {view === 'new-release' && (
          <section className="music-v2-wizard"><fieldset className="music-wizard-fields" disabled={busy}>
            <div className="music-v2-wizard-head"><div><span>{editingRelease ? 'EDIT RELEASE' : 'NEW RELEASE'}</span><h3>{editingRelease ? `${editingRelease.title} · step ${wizardStep} of 8` : `Step ${wizardStep} of 8`}</h3></div><button type="button" onClick={() => setView('home')}>×</button></div>
            {editingRelease && <div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(5)}>Replace song audio</button></div>}
            <div className="music-v2-progress">{['Artist','Details','Metadata','Artwork','Audio','Mastering','Lyrics','Review'].map((label,index) => <button type="button" key={label} className={wizardStep === index+1 ? 'active' : ''} disabled={!editingRelease && index+1 > wizardStep} onClick={() => setWizardStep(index+1)}>{index+1} · {label}</button>)}</div>




            {wizardStep === 1 && <div className="music-v2-step"><h4>Who is releasing it?</h4><p>Choose the artist and release type.</p><div className="music-v2-step-grid"><label>Artist<select value={draft.artistId} onChange={(e) => setDraft({ ...draft, artistId: e.target.value })}><option value="">Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><label>Release type<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ReleaseType })}><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option></select></label></div>{!music.artists.length && <p className="music-v2-hint">You need an artist first. <button type="button" onClick={() => setView('artists')}>Add artist →</button></p>}<div className="music-v2-step-actions"><button className="button" type="button" disabled={!draft.artistId} onClick={() => setWizardStep(2)}>Continue</button></div></div>}

            {wizardStep === 2 && <div className="music-v2-step"><h4>Release details</h4><p>Add the information listeners will see.</p><div className="music-v2-step-grid"><label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Genre<input value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} /></label><label>Release date<input type="date" value={draft.releaseDate} onChange={(e) => setDraft({ ...draft, releaseDate: e.target.value })} /></label><label>Status<select value={draft.publishStatus} onChange={(e) => setDraft({ ...draft, publishStatus: e.target.value as PublishStatus })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></label><label className="music-check"><input type="checkbox" checked={draft.explicit} onChange={(e) => setDraft({ ...draft, explicit: e.target.checked })} /> Explicit</label></div><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(1)}>Back</button><button className="button" type="button" disabled={!draft.title.trim()} onClick={() => setWizardStep(3)}>Continue</button></div></div>}

            {wizardStep === 3 && <><ReleaseMetadataFields value={metadata} onChange={setMetadata} /><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(2)}>Back</button><button className="button" type="button" onClick={() => setWizardStep(4)}>Continue to artwork</button></div></>}
            {wizardStep === 4 && <div className="music-v2-step"><h4>Artwork</h4><p>This cover is reused on EBG+ Music and your listening page. Upload once.</p>{(coverPreview || music.releases.find(item => item.id === editingRelease?.id)?.cover) && <img className="music-wizard-cover" src={coverPreview || music.releases.find(item => item.id === editingRelease?.id)?.cover} alt="Release cover preview" />}<label className="music-v2-cover-upload">Cover art<input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} /><span>{coverFile ? coverFile.name : editingRelease?.cover ? 'Keep existing cover · choose only to replace' : 'Choose image'}</span></label><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(3)}>Back</button><button className="button" type="button" onClick={() => setWizardStep(5)}>Continue</button></div></div>}

            {wizardStep === 5 && <div className="music-v2-step"><h4>Song audio</h4><p>Add the songs for this release here. Each upload is attached automatically when you save.</p>
              {wizardTracks.map(track => <article className="music-wizard-track" key={track.id}><label>Track title<input value={track.title} onChange={event => setWizardTracks(current => current.map(item => item.id === track.id ? {...item,title:event.target.value} : item))} /></label><audio controls preload="none" src={track.audioUrl} aria-label={`Preview ${track.title}`} /><label className="button secondary music-replace-audio">Replace audio<input type="file" accept="audio/*,.flac,.wav" onChange={event => {void replaceWizardAudio(track,event.target.files?.[0]);event.target.value=''}} /></label><button className="button secondary" type="button" onClick={() => setWizardTracks(current => current.filter(item => item.id !== track.id).map((item,index) => ({...item,trackNumber:index+1})))}>Remove from release</button></article>)}
              <div className="music-v2-step-grid"><label>New track title<input value={trackTitle} placeholder={draft.title || 'Song title'} onChange={event => setTrackTitle(event.target.value)} /></label><label>Song audio<input key={wizardTracks.length} type="file" accept="audio/*,.flac,.wav" onChange={event => setTrackFile(event.target.files?.[0] ?? null)} /></label></div>
              <button className="button secondary" type="button" disabled={!trackFile || !draft.artistId} onClick={() => void uploadWizardTrack()}>Upload song</button>
              <div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(4)}>Back</button><button className="button" type="button" onClick={() => { if (trackFile) { setMessage('Upload the selected song before continuing.'); return } setWizardStep(6) }}>Continue</button></div>
            </div>}
            {wizardStep === 6 && <div className="music-v2-step"><h4>Mastering & audio formats</h4><p>Optional: preview a stereo master or attach existing lossless/Atmos mixes. Skip to keep your uploaded audio.</p>{wizardTracks.map(track => <StudioMastering onBusyChange={setBusy} key={track.id} projectId={projectId} track={track} onSave={async patch => {setWizardTracks(current => current.map(item => item.id === track.id ? {...item,...patch} : item));return true}} />)}{!wizardTracks.length && <p>Add audio before mastering.</p>}<div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(5)}>Back</button><button className="button" type="button" onClick={() => setWizardStep(7)}>Continue to lyrics</button></div></div>}
            {wizardStep === 7 && <div className="music-v2-step"><h4>Timed lyrics</h4><p>Generate from each uploaded song, review the words and timestamps, or continue without lyrics.</p>
              {!wizardTracks.length && <p>Add audio in the previous step to generate timed lyrics.</p>}
              {wizardTracks.map(track => <article className="music-wizard-track" key={track.id}><h5>{track.title}</h5><audio controls preload="none" src={track.audioUrl} aria-label={`Preview lyrics for ${track.title}`} /><button className="button secondary" type="button" onClick={() => void generateWizardLyrics(track)}>{track.timedLyrics?.length ? 'Regenerate timed lyrics' : 'Generate timed lyrics'}</button><label>Lyrics<textarea value={track.lyrics || ''} onChange={event => setWizardTracks(current => current.map(item => item.id === track.id ? {...item,lyrics:event.target.value} : item))} /></label>
                {(track.timedLyrics || []).map((line,index) => <div className="music-wizard-lyric" key={index}><label>Start (seconds)<input type="number" min="0" step="0.1" value={line.start} onChange={event => setWizardTracks(current => current.map(item => item.id === track.id ? {...item,timedLyrics:item.timedLyrics?.map((old,i) => i === index ? {...old,start:Number(event.target.value)} : old)} : item))} /></label><label>End (seconds)<input type="number" min={line.start} step="0.1" value={line.end} onChange={event => setWizardTracks(current => current.map(item => item.id === track.id ? {...item,timedLyrics:item.timedLyrics?.map((old,i) => i === index ? {...old,end:Number(event.target.value)} : old)} : item))} /></label><label>Lyric line<input value={line.text} onChange={event => setWizardTracks(current => current.map(item => item.id === track.id ? {...item,timedLyrics:item.timedLyrics?.map((old,i) => i === index ? {...old,text:event.target.value} : old)} : item))} /></label></div>)}
              </article>)}
              <div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(6)}>Back</button><button className="button" type="button" onClick={() => setWizardStep(8)}>Review release</button></div>
            </div>}

            {wizardStep === 8 && <div className="music-v2-step"><h4>{editingRelease ? 'Ready to save your changes?' : 'Ready to create?'}</h4><div className="music-v2-review"><span>{coverFile ? 'New artwork ready' : editingRelease?.cover ? 'Existing artwork retained' : 'No artwork yet'}</span><strong>{draft.title}</strong><p>{artistName(draft.artistId)} · {draft.type.toUpperCase()} · {draft.releaseDate}</p><p>{wizardTracks.length} track{wizardTracks.length === 1 ? '' : 's'} · {wizardTracks.filter(track => track.timedLyrics?.length).length} with timed lyrics</p>{['live','scheduled'].includes(draft.publishStatus) && !wizardTracks.length && <p role="alert">Add song audio before publishing. Go back to Audio or choose Draft.</p>}<small>{draft.genre || 'No genre'} · {draft.publishStatus}{draft.explicit ? ' · Explicit' : ''}</small></div><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setWizardStep(7)}>Back</button><button className="button" type="button" disabled={busy || (['live','scheduled'].includes(draft.publishStatus) && !wizardTracks.length)} onClick={() => void finishRelease()}>{busy ? 'Saving…' : draft.publishStatus === 'live' ? 'Save & publish on EBG+' : draft.publishStatus === 'scheduled' ? 'Save & schedule on EBG+' : editingRelease ? 'Save changes' : 'Create Release'}</button></div></div>}
          </fieldset></section>
        )}

        {view === 'release-saved' && <section className="music-v2-section"><h3>Release saved</h3><p>Your audio, lyrics, artwork, and metadata are saved together. Create a streaming link now, or come back to Streaming links later.</p><div className="music-v2-step-actions"><button className="button secondary" type="button" onClick={() => setView('releases')}>Done</button><button className="button" type="button" onClick={() => setView('streaming-links')}>Create streaming link</button></div></section>}
        {view === 'streaming-links' && <section className="music-v2-section"><h3>Streaming links</h3><p>Manage listening destinations separately from release metadata.</p><label>Release<select value={selectedReleaseId} onChange={e => setSelectedReleaseId(e.target.value)}><option value="">Choose release</option>{music.releases.map(release => <option key={release.id} value={release.id}>{artistName(release.artistId)} · {release.title}</option>)}</select></label>{music.releases.filter(release => release.id === selectedReleaseId).map(release => <MusicDistributionPanel key={`${projectId}-${release.id}`} projectId={projectId} release={release} artistName={artistName(release.artistId)} onSave={async patch => !!(await saveMusic({...music,releases:music.releases.map(item => item.id === release.id ? {...item,...patch} : item)},'Streaming destinations saved.'))} />)}{!music.releases.length && <p>Create a release first. Its artwork will be reused here automatically.</p>}</section>}
        {view === 'mastering' && <section className="music-v2-section"><h3>Mastering</h3><p>Choose a saved track to preview and apply a stereo master or attach prepared audio formats.</p><label>Track<select disabled={busy} value={masterTrackId} onChange={e => setMasterTrackId(e.target.value)}><option value="">Choose track</option>{music.tracks.map(track => <option key={track.id} value={track.id}>{artistName(track.artistId)} · {track.title}</option>)}</select></label>{music.tracks.filter(track => track.id === masterTrackId).map(track => <StudioMastering onBusyChange={setBusy} key={`${projectId}-${track.id}`} projectId={projectId} track={track} onSave={async patch => !!(await saveMusic({...music,tracks:music.tracks.map(item => item.id === track.id ? {...item,...patch} : item)},'Track audio updated.'))} />)}</section>}

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
            <div className="music-v2-section-head"><div><span>RELEASES</span><h3>Singles, EPs & albums</h3></div><button className="button" type="button" onClick={() => { setEditingRelease(null); setDraft(emptyDraft()); setMetadata(emptyDistribution()); setCoverFile(null); setWizardTracks([]); setTrackFile(null); setTrackTitle(''); setWizardStep(1); setView('new-release') }}>＋ New Release</button></div>
            <div className="music-release-grid">{music.releases.map((release) => <article key={release.id} className={music.featuredReleaseId === release.id ? 'featured' : ''}>
              <button className="music-release-open" type="button" onClick={() => editRelease(release)} aria-label={`Edit ${release.title}`}>
                <span className="music-cover">{release.cover ? <img src={release.cover} alt="" /> : <span>♪</span>}</span>
                <span className="music-release-copy"><span className="music-kicker">{release.type.toUpperCase()} · {artistName(release.artistId)}</span><strong>{release.title}</strong><span>{release.publishStatus} · {release.genre || 'Uncategorized'} · {release.releaseDate}</span><small>{music.tracks.some(track => track.releaseId === release.id) ? 'Click to edit release' : 'Audio missing · edit release to add songs'}</small></span>
              </button>
              <div className="music-inline-actions"><button className="button secondary" type="button" disabled={busy} onClick={() => void saveMusic({ ...music, featuredReleaseId: release.id }, `${release.title} featured.`)}>Feature</button><button className="button danger" type="button" disabled={busy} onClick={() => void deleteRelease(release)}>Delete</button></div>
            </article>)}{!music.releases.length && <p className="music-empty">No releases yet.</p>}</div>
          </section>
        )}

        {view === 'catalog' && (
          <section className="music-v2-section">
            <div className="music-v2-section-head"><div><span>CATALOG</span><h3>Tracks</h3></div></div>
            <form className="music-studio-card music-studio-form music-v2-track-form" onSubmit={uploadTrack}><label>Artist<select name="artistId" required defaultValue=""><option value="">Select artist</option>{music.artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><label>Release<select name="releaseId" defaultValue=""><option value="">Standalone</option>{music.releases.map((release) => <option key={release.id} value={release.id}>{artistName(release.artistId)} — {release.title}</option>)}</select></label><label>Track title<input name="title" required /></label><label>Track #<input name="trackNumber" type="number" min="1" defaultValue="1" /></label><label>Duration<input name="duration" placeholder="3:42" /></label><label className="full">Song file<input name="audio" type="file" accept="audio/*,.flac,.wav" required /><small>Upload once. FLAC is automatically available as lossless; MP3/M4A plays as standard stereo.</small></label><label className="music-check full"><input name="confirmPcm" type="checkbox" /> If uploading WAV, this is a lossless PCM master.</label><details className="studio-upload-versions full"><summary>Optional alternate audio versions</summary><p>Only add these if you have a different master or Atmos mix. Everything saves with the same Upload Track button.</p><label>Alternate lossless master<input name="losslessFile" type="file" accept=".flac,.wav" /></label><label>Dolby Atmos mix<input name="atmosFile" type="file" accept=".mp4,.m4a" /></label><label className="music-check"><input name="confirmAtmos" type="checkbox" /> This is an actual Dolby Atmos DD+ JOC mix.</label></details><label className="music-check"><input name="explicit" type="checkbox" /> Explicit</label><div className="full"><button className="button" disabled={busy}>{busy ? 'Uploading…' : 'Upload Track'}</button></div></form>
            <MusicCollectionActions tracks={previewTracks} /><div className="music-track-list">{music.tracks.map((track) => <article key={track.id}><div className="music-track-number">{track.trackNumber}</div><div><strong>{track.title}{track.explicit ? '  E' : ''}</strong><small>{artistName(track.artistId)} · {releaseName(track.releaseId)} {track.duration ? `· ${track.duration}` : ''}</small></div><EbgAudioPlayer src={track.audioUrl} track={previewTracks.find(item => item.id === track.id)} queue={previewTracks} /><button className="button secondary music-track-lyrics" type="button" onClick={() => openLyrics(track.id)}>Generate / edit timed lyrics</button><StudioAudioSources key={`${projectId}-${track.id}`} projectId={projectId} track={track} onSave={async patch => !!(await saveMusic({ ...music, tracks: music.tracks.map(item => item.id === track.id ? { ...item, ...patch } : item) }, `${track.title} audio sources saved.`))} /></article>)}{!music.tracks.length && <p className="music-empty">No tracks uploaded yet.</p>}</div>
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
