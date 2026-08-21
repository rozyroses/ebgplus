import { useEffect, useMemo, useState } from 'react'
import { readStoredSession } from '../../src/lib/auth'
import { loadCmsData, saveCmsData } from '../../src/lib/studioData'

type TimedLyric = { start: number; end: number; text: string }
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
  timedLyrics?: TimedLyric[]
}
type MusicCatalog = {
  artists: MusicArtist[]
  releases: MusicRelease[]
  tracks: MusicTrack[]
  videos: unknown[]
  featuredReleaseId?: string
}
type CmsData = Record<string, unknown> & { music?: MusicCatalog }

const endpoint = import.meta.env.VITE_STUDIO_LYRICS_URL || ''
const isMusicTab = () => window.location.hash.replace(/^#\/?/, '') === 'music'
const cleanTimedLyrics = (value?: TimedLyric[]) => Array.isArray(value)
  ? value.filter((line) => line && Number.isFinite(line.start) && Number.isFinite(line.end) && String(line.text || '').trim())
  : []

export default function StudioMusicLyricsV2() {
  const [active, setActive] = useState(isMusicTab)
  const [open, setOpen] = useState(false)
  const [cms, setCms] = useState<CmsData | null>(null)
  const [trackId, setTrackId] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [timedLyrics, setTimedLyrics] = useState<TimedLyric[]>([])
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
        setTimedLyrics(cleanTimedLyrics(selected.timedLyrics))
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
    setTimedLyrics(cleanTimedLyrics(track.timedLyrics))
    setMessage('')
  }

  const generateTimedLyrics = async () => {
    if (!selectedTrack || busy) return
    if (!selectedTrack.audioUrl) {
      setMessage('This track does not have an uploaded audio file yet.')
      return
    }
    if (!endpoint) {
      setMessage('Set VITE_STUDIO_LYRICS_URL to the EBG Studio timed-lyrics Worker first.')
      return
    }
    const session = readStoredSession()
    if (!session) {
      setMessage('Sign in to EBG Studio again before generating timed lyrics.')
      return
    }

    setBusy(true)
    setMessage('Listening to the uploaded track and timing the lyrics…')
    try {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/transcribe-lyrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ audioUrl: selectedTrack.audioUrl, trackId: selectedTrack.id }),
      })
      const payload = await response.json().catch(() => ({})) as {
        text?: string
        timedLyrics?: TimedLyric[]
        language?: string | null
        error?: string
      }
      if (!response.ok) throw new Error(payload.error || `Timed lyric transcription failed (${response.status}).`)
      const nextLines = cleanTimedLyrics(payload.timedLyrics)
      if (!nextLines.length) throw new Error('No vocal lyric lines were detected in this track.')
      setTimedLyrics(nextLines)
      setLyrics(payload.text?.trim() || nextLines.map((line) => line.text).join('\n'))
      setMessage(`Timed lyrics generated from the uploaded audio${payload.language ? ` · ${payload.language}` : ''}. Review any misheard words, then save.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The uploaded song could not be transcribed right now.')
    } finally {
      setBusy(false)
    }
  }

  const updateTimedLine = (index: number, patch: Partial<TimedLyric>) => {
    setTimedLyrics((current) => {
      const next = current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line)
      if (Object.prototype.hasOwnProperty.call(patch, 'text')) setLyrics(next.map((line) => line.text).join('\n'))
      return next
    })
  }

  const removeTimedLine = (index: number) => {
    setTimedLyrics((current) => {
      const next = current.filter((_, lineIndex) => lineIndex !== index)
      setLyrics(next.map((line) => line.text).join('\n'))
      return next
    })
  }

  const saveLyrics = async () => {
    if (!cms || !music || !selectedTrack || busy) return
    const normalizedTimedLyrics = timedLyrics
      .map((line) => ({
        start: Math.max(0, Number(line.start) || 0),
        end: Math.max(Number(line.end) || 0, (Number(line.start) || 0) + 0.1),
        text: line.text.trim(),
      }))
      .filter((line) => line.text)
      .sort((a, b) => a.start - b.start)
    const nextMusic: MusicCatalog = {
      ...music,
      tracks: music.tracks.map((track) => track.id === selectedTrack.id ? {
        ...track,
        lyrics: lyrics.trim(),
        timedLyrics: normalizedTimedLyrics,
      } : track),
    }
    const nextCms: CmsData = { ...cms, music: nextMusic }
    setBusy(true)
    setMessage('')
    try {
      await saveCmsData(nextCms)
      setCms(nextCms)
      setTimedLyrics(normalizedTimedLyrics)
      setMessage(normalizedTimedLyrics.length ? `${normalizedTimedLyrics.length} timed lyric lines saved and synced to this track.` : 'Timed lyrics cleared from this track.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Timed lyrics could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  if (!active) return null

  return (
    <>
      <button type="button" className="music-lyrics-launch" onClick={() => { setOpen(true); void refresh() }}>✦ Lyrics</button>
      {open && (
        <section className="music-lyrics-overlay" aria-label="Music Studio Timed Lyrics Workspace">
          <div className="music-lyrics-shell">
            <header className="music-lyrics-header">
              <div><span>EBG STUDIO / MUSIC</span><h2>Timed Lyrics</h2><p>Generate lyrics from the actual uploaded song, correct the transcription, and sync every line to EBG+ playback.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close lyrics workspace">×</button>
            </header>

            <div className="music-lyrics-workspace">
              <aside className="music-lyrics-track-list">
                <span>TRACKS</span>
                {tracks.map((track) => (
                  <button type="button" key={track.id} className={track.id === trackId ? 'active' : ''} onClick={() => selectTrack(track.id)}>
                    <strong>{track.title}</strong>
                    <small>{music?.artists.find((artist) => artist.id === track.artistId)?.name || 'EBG Artist'}{cleanTimedLyrics(track.timedLyrics).length ? ' · Timed lyrics saved' : ''}</small>
                  </button>
                ))}
                {!tracks.length && <p>No tracks yet. Upload a song in Music Studio first.</p>}
              </aside>

              <main className="music-lyrics-editor">
                {selectedTrack ? (
                  <>
                    <div className="music-lyrics-song-head">
                      <div><span>NOW EDITING</span><h3>{selectedTrack.title}</h3><p>{selectedArtist?.name || 'EBG Artist'}{selectedRelease ? ' · ' + selectedRelease.title : ''}</p></div>
                      <audio controls preload="metadata" src={selectedTrack.audioUrl} />
                    </div>

                    <div className="music-lyrics-actions transcription-actions">
                      <button className="button secondary" type="button" disabled={busy} onClick={() => void generateTimedLyrics()}>{busy ? 'Listening & timing…' : '✦ Generate Timed Lyrics from Audio'}</button>
                      <button className="button" type="button" disabled={busy} onClick={() => void saveLyrics()}>Save & Sync Lyrics</button>
                    </div>

                    {message && <div className="music-lyrics-message">{message}</div>}

                    <section className="music-timed-editor">
                      <div className="music-timed-editor-head"><div><span>SYNCED LINES</span><h4>{timedLyrics.length ? `${timedLyrics.length} lyric lines` : 'No timed lyrics yet'}</h4></div><small>Times are in seconds. Edit any word or timing before saving.</small></div>
                      {timedLyrics.map((line, index) => (
                        <div className="music-timed-line" key={`${index}-${line.start}`}>
                          <label>Start<input type="number" min="0" step="0.1" value={line.start} onChange={(event) => updateTimedLine(index, { start: Number(event.target.value) })} /></label>
                          <label>End<input type="number" min="0" step="0.1" value={line.end} onChange={(event) => updateTimedLine(index, { end: Number(event.target.value) })} /></label>
                          <label className="lyric-text">Lyric<input value={line.text} onChange={(event) => updateTimedLine(index, { text: event.target.value })} /></label>
                          <button type="button" onClick={() => removeTimedLine(index)} aria-label="Remove lyric line">×</button>
                        </div>
                      ))}
                      {!timedLyrics.length && <div className="music-timed-empty">Generate timed lyrics and Studio will listen to the uploaded audio, transcribe the vocals, and place each detected line on the track timeline.</div>}
                    </section>

                    <label className="music-lyrics-field">Plain lyrics fallback<textarea value={lyrics} onChange={(event) => setLyrics(event.target.value)} placeholder="The plain lyric transcript is also saved as a fallback for devices without timed-lyrics support." /></label>
                  </>
                ) : <div className="music-lyrics-empty">Choose a track to start syncing lyrics.</div>}
              </main>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
