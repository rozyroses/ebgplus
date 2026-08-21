import { useEffect, useMemo, useState } from 'react'
import { readStoredSession } from '../../src/lib/auth'
import { loadCmsData, saveCmsData } from '../../src/lib/studioData'

type MusicArtist = { id: string; name: string }
type MusicRelease = { id: string; artistId: string; title: string; genre?: string }
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
}
type MusicCatalog = {
  artists: MusicArtist[]
  releases: MusicRelease[]
  tracks: MusicTrack[]
  videos: unknown[]
  featuredReleaseId?: string
}
type CmsData = Record<string, unknown> & {
  shows?: Array<{ id: string; title: string }>
  music?: MusicCatalog
}

const endpoint = import.meta.env.VITE_STUDIO_LUMI_URL || ''
const isMusicTab = () => window.location.hash.replace(/^#\/?/, '') === 'music'

export default function StudioMusicLyricsV2() {
  const [active, setActive] = useState(isMusicTab)
  const [open, setOpen] = useState(false)
  const [cms, setCms] = useState<CmsData | null>(null)
  const [trackId, setTrackId] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [direction, setDirection] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const sync = () => {
      const next = isMusicTab()
      setActive(next)
      if (!next) setOpen(false)
    }
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const refresh = async () => {
    try {
      const next = await loadCmsData<CmsData>()
      if (!next) return
      setCms(next)
      const tracks = next.music?.tracks ?? []
      const selected = tracks.find((track) => track.id === trackId) ?? tracks[0]
      if (selected) {
        setTrackId(selected.id)
        setLyrics(selected.lyrics ?? '')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lyrics workspace could not load Music Studio.')
    }
  }

  useEffect(() => {
    if (active) void refresh()
  }, [active])

  const music = cms?.music
  const tracks = music?.tracks ?? []
  const selectedTrack = useMemo(() => tracks.find((track) => track.id === trackId) ?? null, [tracks, trackId])
  const selectedArtist = selectedTrack ? music?.artists.find((artist) => artist.id === selectedTrack.artistId) : undefined
  const selectedRelease = selectedTrack?.releaseId ? music?.releases.find((release) => release.id === selectedTrack.releaseId) : undefined

  const selectTrack = (id: string) => {
    const track = tracks.find((item) => item.id === id)
    if (!track) return
    setTrackId(id)
    setLyrics(track.lyrics ?? '')
    setMessage('')
  }

  const generateLyrics = async () => {
    if (!selectedTrack || busy) return
    if (!endpoint) {
      setMessage('Set VITE_STUDIO_LUMI_URL before using Generate with Lumi.')
      return
    }
    const session = readStoredSession()
    if (!session) {
      setMessage('Sign in to EBG Studio again before using Lumi.')
      return
    }
    const showId = cms?.shows?.[0]?.id
    if (!showId) {
      setMessage('Lumi needs at least one accessible Studio production to verify your staff access.')
      return
    }

    const prompt = [
      'Write completely original song lyrics for EBG+ Music Studio.',
      'Track title: ' + selectedTrack.title,
      'Artist: ' + (selectedArtist?.name || 'EBG Artist'),
      'Release: ' + (selectedRelease?.title || 'Standalone single'),
      'Genre: ' + (selectedRelease?.genre || 'unspecified'),
      direction.trim() ? 'Creative direction from the user: ' + direction.trim() : 'Creative direction: polished, memorable, emotionally specific, and performance-ready.',
      'Do not quote, imitate, or closely rewrite any existing copyrighted song.',
      'Return lyrics only. Use clear section labels like [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], and [Outro] when useful.',
    ].join('\n')

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          showId,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const payload = await response.json().catch(() => ({})) as { reply?: string; error?: string }
      if (!response.ok) throw new Error(payload.error || `Lumi request failed (${response.status}).`)
      const generated = payload.reply?.trim()
      if (!generated) throw new Error('Lumi returned an empty lyric draft. Try a more specific creative direction.')
      setLyrics(generated)
      setMessage('Lumi drafted original lyrics. Edit anything you want, then save.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lumi could not generate lyrics right now.')
    } finally {
      setBusy(false)
    }
  }

  const saveLyrics = async () => {
    if (!cms || !music || !selectedTrack || busy) return
    const nextMusic: MusicCatalog = {
      ...music,
      tracks: music.tracks.map((track) => track.id === selectedTrack.id ? { ...track, lyrics: lyrics.trim() } : track),
    }
    const nextCms: CmsData = { ...cms, music: nextMusic }
    setBusy(true)
    setMessage('')
    try {
      await saveCmsData(nextCms)
      setCms(nextCms)
      setMessage(lyrics.trim() ? 'Lyrics saved to this track.' : 'Lyrics cleared from this track.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lyrics could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  if (!active) return null

  return (
    <>
      <button type="button" className="music-lyrics-launch" onClick={() => { setOpen(true); void refresh() }}>✦ Lyrics</button>
      {open && (
        <section className="music-lyrics-overlay" aria-label="Music Studio Lyrics Workspace">
          <div className="music-lyrics-shell">
            <header className="music-lyrics-header">
              <div><span>EBG STUDIO / MUSIC</span><h2>Lyrics</h2><p>Generate with Lumi, edit the draft, and publish the words that appear in EBG+ Now Playing.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close lyrics workspace">×</button>
            </header>

            <div className="music-lyrics-workspace">
              <aside className="music-lyrics-track-list">
                <span>TRACKS</span>
                {tracks.map((track) => (
                  <button type="button" key={track.id} className={track.id === trackId ? 'active' : ''} onClick={() => selectTrack(track.id)}>
                    <strong>{track.title}</strong>
                    <small>{music?.artists.find((artist) => artist.id === track.artistId)?.name || 'EBG Artist'}{track.lyrics?.trim() ? ' · Lyrics saved' : ''}</small>
                  </button>
                ))}
                {!tracks.length && <p>No tracks yet. Upload a song in Music Studio first.</p>}
              </aside>

              <main className="music-lyrics-editor">
                {selectedTrack ? (
                  <>
                    <div className="music-lyrics-song-head">
                      <div><span>NOW EDITING</span><h3>{selectedTrack.title}</h3><p>{selectedArtist?.name || 'EBG Artist'}{selectedRelease ? ' · ' + selectedRelease.title : ''}</p></div>
                      <audio controls preload="none" src={selectedTrack.audioUrl} />
                    </div>

                    <label className="music-lyrics-direction">Creative direction for Lumi<textarea value={direction} onChange={(event) => setDirection(event.target.value)} placeholder="Dark 90s R&B, jealous but vulnerable, huge singable chorus…" /></label>
                    <div className="music-lyrics-actions">
                      <button className="button secondary" type="button" disabled={busy} onClick={() => void generateLyrics()}>{busy ? 'Lumi is writing…' : '✦ Generate with Lumi'}</button>
                      <button className="button" type="button" disabled={busy} onClick={() => void saveLyrics()}>Save Lyrics</button>
                    </div>

                    {message && <div className="music-lyrics-message">{message}</div>}
                    <label className="music-lyrics-field">Lyrics<textarea value={lyrics} onChange={(event) => setLyrics(event.target.value)} placeholder="[Verse 1]\n…" /></label>
                  </>
                ) : <div className="music-lyrics-empty">Choose a track to start writing.</div>}
              </main>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
