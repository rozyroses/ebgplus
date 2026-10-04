import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { audioMime, catalogTrack, nextQueueIndex, selectSource, sourceSupported } from '../lib/musicPlayback'
import type { AudioQuality, MusicSource, MusicTrack } from '../lib/musicPlayback'

type PlayRequest = { track: MusicTrack; queue: MusicTrack[]; shuffle?: boolean }
const PLAY_EVENT = 'ebg-music-play-v2'
const QUEUE_EVENT = 'ebg-music-queue-v2'
const FAVORITES_KEY = 'ebg.music.favorites.v1'
const QUALITY_KEY = 'ebg.music.quality.v1'
const FAVORITES_EVENT = 'ebg-music-favorites-v1'
function readPreference<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback } }
function savePreference(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Device storage is optional. */ } }
export function useMusicFavorites() {
  const read = () => { const saved = readPreference<unknown>(FAVORITES_KEY, []); return Array.isArray(saved) ? saved.filter(item => typeof item === 'string') as string[] : [] }
  const [favorites, setFavorites] = useState<string[]>(read)
  useEffect(() => { const sync = () => setFavorites(read()); window.addEventListener(FAVORITES_EVENT, sync); window.addEventListener('storage', sync); return () => { window.removeEventListener(FAVORITES_EVENT, sync); window.removeEventListener('storage', sync) } }, [])
  return favorites
}
const playTracks = (track: MusicTrack, queue: MusicTrack[], shuffle = false) => window.dispatchEvent(new CustomEvent<PlayRequest>(PLAY_EVENT, { detail: { track, queue: queue.filter(item => item.sources.length), shuffle } }))
const time = (seconds: number) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00'
function SourceBadges({ track }: { track: MusicTrack }) {
  return <span className="music-source-badges">{track.sources.some(source => source.quality === 'lossless') && <span>Lossless source</span>}{track.sources.some(source => source.quality === 'atmos') && <span>Atmos mix</span>}</span>
}
export function EbgAudioPlayer(props: { track?: MusicTrack; queue?: MusicTrack[]; src: string; title?: string; artist?: string; artwork?: string; lyrics?: string; timedLyrics?: MusicTrack['timedLyrics'] }) {
  const track = props.track || catalogTrack({ audioUrl: props.src, title: props.title, lyrics: props.lyrics, timedLyrics: props.timedLyrics }, props.artist || 'EBG+', props.artwork)
  const [queued, setQueued] = useState(false)
  useEffect(() => { if (!queued) return; const timer = window.setTimeout(() => setQueued(false), 2000); return () => window.clearTimeout(timer) }, [queued])
  if (!track.sources.length) return null
  return <div className="music-track-actions"><button type="button" className="music-track-launcher" onClick={() => playTracks(track, props.queue || [track])} aria-label={`Play ${track.title}`}>
    <span className="music-track-launcher-art">{track.artwork ? <img src={track.artwork} alt="" /> : '♪'}</span><span className="music-track-launcher-copy"><strong>{track.title}</strong><small>{track.artist}</small><SourceBadges track={track} /></span><span className="music-track-launcher-play" aria-hidden="true">▶</span>
  </button><button className="music-queue-add" type="button" aria-label={`Add ${track.title} to queue`} onClick={() => { window.dispatchEvent(new CustomEvent(QUEUE_EVENT, { detail: track })); setQueued(true) }}>{queued ? 'Added' : '+ Queue'}</button><span className="music-sr-only" role="status">{queued ? `${track.title} added to queue` : ''}</span></div>
}
export function MusicCollectionActions({ tracks }: { tracks: MusicTrack[] }) {
  const playable = tracks.filter(track => track.sources.length)
  if (!playable.length) return null
  return <div className="music-collection-actions"><button className="btn" type="button" onClick={() => playTracks(playable[0], playable)}>Play all</button><button className="btn muted" type="button" onClick={() => playTracks(playable[Math.floor(Math.random() * playable.length)], playable, true)}>Shuffle</button></div>
}

export function EbgMusicDock() {
  const audio = useRef<HTMLAudioElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const queueRef = useRef<MusicTrack[]>([])
  const indexRef = useRef(0)
  const optionsRef = useRef({ repeat: 'off' as 'off' | 'all' | 'one', shuffle: false })
  const [queue, setQueue] = useState<MusicTrack[]>([])
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off')
  const [quality, setQuality] = useState<AudioQuality>(() => { const saved = readPreference<string>(QUALITY_KEY, 'auto'); return ['auto', 'standard', 'lossless', 'atmos'].includes(saved) ? saved as AudioQuality : 'auto' })
  const [selectedSource, setSelectedSource] = useState<MusicSource | null>(null)
  const [supported, setSupported] = useState<boolean[]>([])
  const [failedSources, setFailedSources] = useState<string[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [panel, setPanel] = useState<'lyrics' | 'queue'>('queue')
  const favorites = useMusicFavorites()
  const track = queue[index]
  const resume = useRef({ time: 0, play: true })
  const choose = (next: number) => { audio.current?.pause(); resume.current = { time: 0, play: true }; indexRef.current = next; setIndex(next); setPosition(0); setDuration(0); setFailedSources([]); setError(''); setNotice('') }
  const changeQueue = (next: MusicTrack[]) => { queueRef.current = next; setQueue(next) }
  optionsRef.current = { repeat, shuffle }

  useEffect(() => {
    const play = (event: Event) => {
      const request = (event as CustomEvent<PlayRequest>).detail
      if (!request?.track?.sources?.length) return
      const tracks = request.queue.length ? request.queue : [request.track]
      const next = Math.max(0, tracks.findIndex(item => item.id === request.track.id))
      audio.current?.pause(); changeQueue(tracks); choose(next); setShuffle(!!request.shuffle)
    }
    const add = (event: Event) => {
      const item = (event as CustomEvent<MusicTrack>).detail
      if (!item?.sources?.length) return
      if (!queueRef.current.length) { changeQueue([item]); choose(0); resume.current.play = false }
      else changeQueue([...queueRef.current, item])
      setNotice(`${item.title} added to queue.`)
    }
    window.addEventListener(PLAY_EVENT, play); window.addEventListener(QUEUE_EVENT, add)
    return () => { window.removeEventListener(PLAY_EVENT, play); window.removeEventListener(QUEUE_EVENT, add) }
  }, [])

  useEffect(() => {
    const media = audio.current
    if (!track || !media) return
    let cancelled = false
    setLoading(true); setSelectedSource(null); setSupported([])
    void Promise.all(track.sources.map(source => sourceSupported(source, media))).then(flags => {
      if (cancelled) return
      setSupported(flags)
      const usable = flags.map((flag, i) => flag && !failedSources.includes(track.sources[i].url))
      const source = selectSource(track.sources, quality, usable)
      if (!source) { media.pause(); media.removeAttribute('src'); media.load(); setLoading(false); setError('No compatible audio source is available for this song on this device. Try another song.'); return }
      setSelectedSource(source); setError('')
      if (quality !== 'auto' && source.quality !== quality) setNotice(`${quality === 'atmos' ? 'Dolby Atmos' : quality === 'lossless' ? 'Lossless' : 'Standard'} is unavailable here. Playing ${source.quality === 'atmos' ? 'the Atmos mix' : source.quality} instead.`)
      media.src = source.url; media.load()
    })
    return () => { cancelled = true }
  }, [track, quality, failedSources])

  useEffect(() => {
    const node = dialog.current
    if (expanded && node && !node.open) node.showModal()
    else if (!expanded && node?.open) node.close()
  }, [expanded])
  useEffect(() => {
    if (!track || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, artwork: track.artwork ? [{ src: track.artwork }] : [] })
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => { void audio.current?.play().catch(() => setError('Tap play to start listening.')) }],
      ['pause', () => audio.current?.pause()],
      ['nexttrack', () => { const next = nextQueueIndex(queueRef.current.length, indexRef.current, 'off', optionsRef.current.shuffle); if (next !== null) choose(next) }],
      ['previoustrack', () => { if ((audio.current?.currentTime || 0) > 3 || indexRef.current === 0) { if (audio.current) audio.current.currentTime = 0 } else choose(indexRef.current - 1) }],
      ['seekto', details => { if (audio.current && details.seekTime !== undefined) audio.current.currentTime = details.seekTime }],
    ]
    for (const [action, handler] of handlers) { try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* Not supported on every device. */ } }
    return () => { navigator.mediaSession.metadata = null; for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null) } catch {} } }
  }, [track])
  useEffect(() => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused' }, [playing])

  if (!track) return null
  const seek = (value: number) => { if (audio.current && Number.isFinite(duration) && duration > 0) { audio.current.currentTime = Math.max(0, Math.min(value, duration)); setPosition(audio.current.currentTime) } }
  const toggle = () => { const media = audio.current; if (!media) return; if (media.paused) void media.play().catch(() => setError('Playback could not start. Tap play again or choose another audio quality.')); else media.pause() }
  const advance = (automatic = false) => {
    const next = nextQueueIndex(queue.length, index, automatic ? repeat : repeat === 'one' ? 'off' : repeat, shuffle)
    if (next === index) { seek(0); void audio.current?.play().catch(() => setError('Tap play to resume.')) }
    else if (next !== null) choose(next)
    else { setPlaying(false); setNotice('You reached the end of the queue.') }
  }
  const previous = () => { if (position > 3 || index === 0) seek(0); else choose(index - 1) }
  const close = () => { audio.current?.pause(); changeQueue([]); setExpanded(false); setPlaying(false); setSelectedSource(null); setError(''); setNotice('') }
  const changeQuality = (next: AudioQuality) => { resume.current = { time: audio.current?.currentTime || 0, play: !audio.current?.paused }; savePreference(QUALITY_KEY, next); setFailedSources([]); setNotice(''); setQuality(next) }
  const favorite = favorites.includes(track.id)
  const favoriteTrack = () => { const next = favorite ? favorites.filter(id => id !== track.id) : [...favorites, track.id]; savePreference(FAVORITES_KEY, next); window.dispatchEvent(new Event(FAVORITES_EVENT)) }
  const qualityLabel = selectedSource?.quality === 'atmos' ? 'Dolby Atmos source' : selectedSource?.quality === 'lossless' ? 'Lossless source' : 'Standard audio'
  const activeLyric = track.timedLyrics?.findIndex(line => position >= line.start && position < line.end) ?? -1
  const playButton = <button type="button" className="music-play-button" disabled={loading || !selectedSource} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{loading ? '…' : playing ? '❚❚' : '▶'}</button>
  return <>
    <audio ref={audio} preload="metadata" onLoadedMetadata={event => {
      const media = event.currentTarget; setDuration(Number.isFinite(media.duration) ? media.duration : 0); setLoading(false)
      if (resume.current.time && Number.isFinite(media.duration)) media.currentTime = Math.min(resume.current.time, Math.max(0, media.duration - .1))
      setPosition(media.currentTime); if (resume.current.play) void media.play().catch(() => setNotice('Ready to listen. Tap play.'))
    }} onTimeUpdate={event => setPosition(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => advance(true)} onWaiting={() => setLoading(true)} onCanPlay={() => setLoading(false)} onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted) }} onError={() => {
      if (!selectedSource) return
      resume.current = { time: position, play: true }; setFailedSources(previous => [...previous, selectedSource.url]); setNotice('That source could not play. Trying another compatible source.')
    }} />
    <aside className="music-dock-v3" aria-label="Now playing">
      <button className="music-dock-info" type="button" onClick={() => setExpanded(true)} aria-label="Open now playing"><span className="music-dock-art">{track.artwork ? <img src={track.artwork} alt="" /> : '♪'}</span><span><strong>{track.title}</strong><small>{track.artist} · {qualityLabel}</small></span></button>
      <button type="button" className="music-icon-button music-dock-previous" onClick={previous} aria-label="Previous song">⏮</button>{playButton}<button type="button" className="music-icon-button" onClick={() => advance()} disabled={queue.length < 2 && repeat === 'off'} aria-label="Next song">⏭</button>
      <button type="button" className="music-icon-button" onClick={favoriteTrack} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={favorite}>{favorite ? '♥' : '♡'}</button>
      <button type="button" className="music-icon-button" onClick={close} aria-label="Close player">×</button>
      <input className="music-dock-seek" type="range" min="0" max={duration || 1} step=".1" value={Math.min(position, duration || 0)} onChange={event => seek(Number(event.target.value))} aria-label="Seek song" disabled={!duration} />
      {(error || notice) && <p className="music-dock-notice" role={error ? 'alert' : 'status'}>{error || notice}</p>}
    </aside>
    <dialog ref={dialog} className="music-dialog-v3" aria-labelledby="music-dialog-title" onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)}>
      <header><span>NOW PLAYING</span><button type="button" className="music-icon-button" onClick={() => setExpanded(false)} aria-label="Close now playing">×</button></header>
      <div className="music-dialog-grid"><section className="music-listening-panel">
        <div className="music-playing-art">{track.artwork ? <img src={track.artwork} alt="" /> : <span>♪</span>}</div><h2 id="music-dialog-title">{track.title}</h2><p>{track.artist}</p>
        <span className="music-quality-badge">{qualityLabel}{selectedSource?.bitDepth && selectedSource?.sampleRate ? ` · ${selectedSource.bitDepth}-bit / ${selectedSource.sampleRate / 1000} kHz` : ''}</span>
        <div className="music-timeline"><span>{time(position)}</span><input type="range" min="0" max={duration || 1} step=".1" value={Math.min(position, duration || 0)} onChange={event => seek(Number(event.target.value))} aria-label="Seek song" disabled={!duration} /><span>{time(duration)}</span></div>
        <div className="music-transport"><button type="button" className="music-icon-button" aria-label="Shuffle" aria-pressed={shuffle} onClick={() => setShuffle(!shuffle)}>⤨</button><button type="button" className="music-icon-button" onClick={previous} aria-label="Previous song">⏮</button>{playButton}<button type="button" className="music-icon-button" onClick={() => advance()} aria-label="Next song">⏭</button><button type="button" className="music-icon-button" aria-label={`Repeat: ${repeat}`} aria-pressed={repeat !== 'off'} onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}>{repeat === 'one' ? '↻ 1' : '↻'}</button></div>
        <div className="music-volume"><button type="button" className="music-icon-button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { if (audio.current) audio.current.muted = !muted }}>{muted ? 'Muted' : 'Volume'}</button><input type="range" min="0" max="1" step=".05" value={volume} onChange={event => { if (audio.current) { audio.current.volume = Number(event.target.value); audio.current.muted = false } }} aria-label="Volume" /></div>
        <div className="music-listening-options"><label>Audio quality<select value={quality} onChange={event => changeQuality(event.target.value as AudioQuality)}><option value="auto">Best available</option>{(['standard', 'lossless', 'atmos'] as const).map(option => <option key={option} value={option} disabled={!track.sources.some((source, i) => source.quality === option && supported[i])}>{option === 'atmos' ? 'Dolby Atmos' : option === 'lossless' ? 'Lossless' : 'Standard'}</option>)}</select></label><button className="btn muted" type="button" onClick={favoriteTrack} aria-pressed={favorite}>{favorite ? '♥ Saved' : '♡ Favorite'}</button></div>
        <p className="music-quality-note">Quality depends on the available mix, browser, and output device. Bluetooth and system processing may affect lossless output.</p>{(error || notice) && <p role={error ? 'alert' : 'status'}>{error || notice}</p>}
      </section><section className="music-companion-panel"><div className="music-panel-tabs"><button type="button" aria-pressed={panel === 'queue'} onClick={() => setPanel('queue')}>Queue ({queue.length})</button><button type="button" aria-pressed={panel === 'lyrics'} onClick={() => setPanel('lyrics')}>Lyrics</button></div>
        {panel === 'queue' ? <ol className="music-queue-list">{queue.map((item, i) => <li key={`${item.id}-${i}`} className={i === index ? 'active' : ''}><button type="button" aria-current={i === index ? 'true' : undefined} onClick={() => choose(i)}><span>{i === index && playing ? '♫' : i + 1}</span><span><strong>{item.title}</strong><small>{item.artist}</small></span></button>{i !== index && <button type="button" className="music-icon-button" aria-label={`Remove ${item.title} from queue`} onClick={() => { changeQueue(queue.filter((_, n) => n !== i)); if (i < index) { indexRef.current = index - 1; setIndex(index - 1) } }}>×</button>}</li>)}</ol> : track.timedLyrics?.length ? <div className="music-lyrics-lines">{track.timedLyrics.map((line, i) => <button className={i === activeLyric ? 'active' : ''} type="button" key={`${line.start}-${i}`} onClick={() => seek(line.start)}>{line.text}</button>)}</div> : <p className="music-plain-lyrics">{track.lyrics || 'Lyrics haven’t been added for this song yet.'}</p>}
      </section></div>
    </dialog>
  </>
}

export function MusicQualityEditor({ tracks, onSave }: { tracks: Record<string, any>[]; onSave: (tracks: Record<string, any>[]) => void }) {
  const [message, setMessage] = useState('')
  if (!tracks.length) return null
  const save = (event: FormEvent<HTMLFormElement>, id: unknown) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form)
    const losslessUrl = String(data.get('losslessUrl') || '').trim(), atmosUrl = String(data.get('atmosUrl') || '').trim()
    const losslessMimeType = String(data.get('losslessMimeType') || 'audio/flac')
    const proposed = catalogTrack({ losslessUrl, losslessMimeType, atmosUrl }, '')
    if ((losslessUrl && !proposed.sources.some(source => source.quality === 'lossless')) || (atmosUrl && !proposed.sources.some(source => source.quality === 'atmos'))) { setMessage('Use a FLAC or PCM WAV URL for lossless and an MP4 URL for the Atmos mix.'); return }
    onSave(tracks.map(track => track.id === id ? { ...track, losslessUrl, losslessMimeType, atmosUrl } : track)); setMessage('Audio source settings submitted.')
  }
  return <details className="studio3-composer music-quality-editor"><summary><span>♫</span><div><strong>Music audio sources</strong><small>Add lossless masters and Dolby Atmos mixes.</small></div></summary><div className="studio3-composer-body"><p>Keep the standard stereo source as a fallback. Use a genuine FLAC or PCM WAV master for lossless, and a Dolby Digital Plus JOC Atmos mix in an MP4 file for compatible devices. These fields do not convert stereo audio into Atmos.</p>{tracks.map(track => <form className="studio3-form-grid" key={`${track.id}-${track.losslessUrl}-${track.atmosUrl}`} onSubmit={event => save(event, track.id)}><h3 className="full">{track.title}</h3><label>Lossless master URL<input type="url" name="losslessUrl" defaultValue={track.losslessUrl || ''} placeholder="https://…/master.flac" /></label><label>Lossless format<select name="losslessMimeType" defaultValue={track.losslessMimeType || audioMime(track.losslessUrl || '') || 'audio/flac'}><option value="audio/flac">FLAC</option><option value="audio/wav">PCM WAV</option></select></label><label className="full">Dolby Atmos mix URL<input type="url" name="atmosUrl" defaultValue={track.atmosUrl || ''} placeholder="https://…/atmos.mp4" /></label><button className="btn" type="submit">Save audio sources</button></form>)}{message && <p role="status">{message}</p>}</div></details>
}
