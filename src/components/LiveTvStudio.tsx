import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { saveLiveTvSettings } from '../lib/liveTvData'
import { channelListings, liveTvFingerprint, tvSources, validateLiveTv, type LiveTvConfig, type TvCatalog, type TvChannel } from '../lib/liveTv'
import LiveTvPlayer from './LiveTvPlayer'
import WebRtcViewer from './WebRtcViewer'
import TvPlaylistEditor from './TvPlaylistEditor'
import '../styles/live-tv.css'

const empty: LiveTvConfig = { channels: [] }
const localInput = (value: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function LiveTvStudio({ cms }: { cms: TvCatalog }) {
  const [config, setConfig] = useState<LiveTvConfig>(cms.liveTv ?? empty)
  const [saved, setSaved] = useState(liveTvFingerprint(cms.liveTv ?? empty))
  const [selectedId, setSelectedId] = useState(config.channels[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [now, setNow] = useState(Date.now())
  const dirty = liveTvFingerprint(config) !== saved
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  useEffect(() => {
    if (!dirtyRef.current) { setConfig(cms.liveTv ?? empty); setSaved(liveTvFingerprint(cms.liveTv ?? empty)) }
  }, [cms.liveTv])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer) }, [])
  const selected = config.channels.find(channel => channel.id === selectedId) ?? config.channels[0]
  const sources = tvSources(cms, now)
  const update = (patch: Partial<TvChannel>) => {
    if (!selected) return
    setMessage(''); setFailure(''); setPreview(false)
    setConfig(previous => ({ channels: previous.channels.map(channel => channel.id === selected.id ? { ...channel, ...patch } : channel) }))
  }
  const addChannel = () => {
    const id = crypto.randomUUID()
    setConfig(previous => ({ channels: [...previous.channels, { id, name: 'New channel', description: '', enabled: false, programs: [], playbackMode: 'playlist', playlist: { startsAt: new Date().toISOString(), items: [] }, broadcast: { title: '', url: '', onAir: false } }] }))
    setSelectedId(id); setMessage(''); setFailure(''); setPreview(false)
  }
  const save = async () => {
    setFailure(''); setMessage(''); setBusy(true)
    try {
      const previous = JSON.parse(saved) as LiveTvConfig
      const next = { channels: config.channels.map(channel => {
        const before = previous.channels.find(item => item.id === channel.id)
        const playlist = channel.playlist
        const restart = channel.playbackMode === 'playlist' && playlist && (before?.playbackMode !== 'playlist' || before.playlist?.startsAt !== playlist.startsAt || liveTvFingerprint(before.playlist?.items) !== liveTvFingerprint(playlist.items))
        return restart ? { ...channel, playlist: { ...playlist, startsAt: new Date().toISOString() } } : channel
      }) }
      const stored = await saveLiveTvSettings(next, saved)
      setConfig(stored)
      setSaved(liveTvFingerprint(stored))
      setMessage('Live TV saved. Viewers receive the update within 30 seconds.')
      window.dispatchEvent(new Event('ebg:catalog-updated'))
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Live TV could not be saved.') }
    finally { setBusy(false) }
  }
  const addProgram = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const source = sources.find(item => `${item.sourceKind}:${item.id}` === form.get('source'))
    if (!source) { setFailure('Choose a published video.'); return }
    const startsAt = new Date(String(form.get('startsAt')))
    if (!Number.isFinite(startsAt.getTime())) { setFailure('Choose a valid start time.'); return }
    const program = { id: crypto.randomUUID(), sourceId: source.id, sourceKind: source.sourceKind, startsAt: startsAt.toISOString(), durationSeconds: Math.round(Number(form.get('minutes')) * 60) }
    const programs = [...selected.programs, program].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    try {
      // Draft feeds may be incomplete while editing; validate the program list alone.
      validateLiveTv({ channels: [{ ...selected, broadcast: { title: '', url: '', onAir: false }, programs }] })
      update({ programs }); formElement.reset()
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Could not add this program.') }
  }
  return <main className="page tv-page tv-studio">
    <header className="tv-heading"><div><p className="eyebrow">EBG STUDIO / LIVE TV</p><h1>Your broadcast desk.</h1><p>Create channels, schedule your videos, and go live when you’re ready.</p></div><div className="tv-actions"><Link className="btn muted" to="/app/live-tv">Watch Live TV</Link><Link className="btn muted" to="/app/studio/broadcast">Go live from camera</Link><button className="btn" type="button" disabled={busy || !dirty} onClick={() => void save()}>{busy ? 'Saving…' : dirty ? 'Save changes' : 'All changes saved'}</button></div></header>
    <p className="tv-info">Save channel details and schedules without a broadcast link. A live feed is optional. Changes take effect after you save. Scheduling times use {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
    {failure && <p role="alert" className="tv-error">{failure}</p>}{message && <p role="status" className="tv-success">{message}</p>}
    <fieldset className="tv-editor-fieldset" disabled={busy}><legend className="sr-only">Live TV configuration</legend><div className="tv-editor-grid">
      <aside className="tv-channel-list"><h2>Channels</h2>{config.channels.map(channel => <button type="button" className={channel.id === selected?.id ? 'selected' : ''} key={channel.id} onClick={() => { setSelectedId(channel.id); setPreview(false) }}><strong>{channel.name || 'Untitled channel'}</strong><small>{channel.enabled ? 'Visible to viewers' : 'Hidden'}{channel.broadcast.onAir ? ' · Broadcast enabled' : ''}</small></button>)}<button type="button" className="btn" onClick={addChannel}>+ Add channel</button>{dirty && <button type="button" onClick={() => { setConfig(JSON.parse(saved)); setMessage('Unsaved changes discarded.'); setFailure(''); setPreview(false) }}>Discard changes</button>}</aside>
      {!selected ? <section className="tv-empty"><h2>Start your first channel.</h2><p>Give it a name, build a looping playlist or schedule, then make it visible.</p><button className="btn" type="button" onClick={addChannel}>Create a channel</button></section> : <div className="tv-editor-panels">
        <section className="tv-panel"><h2>Channel details</h2><div className="tv-form-grid"><label>Channel name<input maxLength={100} value={selected.name} onChange={event => update({ name: event.target.value })} /></label><label className="tv-checkbox"><input type="checkbox" checked={selected.enabled} onChange={event => update({ enabled: event.target.checked })} />Visible in Live TV</label><label className="tv-full">Description<textarea maxLength={500} value={selected.description} onChange={event => update({ description: event.target.value })} /></label></div><button type="button" className="tv-danger" onClick={() => { setConfig(previous => ({ channels: previous.channels.filter(channel => channel.id !== selected.id) })); setPreview(false) }}>Remove channel from lineup</button><small>Removal takes effect after saving. Discard changes to undo it.</small></section>
        <details className="tv-panel tv-external-feed" key={selected.id}><summary>External live feed (optional)</summary><p>Only needed when connecting an external broadcast service. You can save this channel with these fields empty.</p><p>Want to broadcast directly? <Link to="/app/studio/broadcast">Use your camera or share your screen ↗</Link></p><p>Or connect the public HLS playback URL from your broadcast service. Start your broadcast there, preview it here, then mark it on air and save.</p><p className="tv-info">Use a viewer playback link, not an RTMP server address, stream key, or API key. Direct camera and screen broadcasts connect automatically from the Go live page.</p><div className="tv-form-grid"><label>Broadcast title<input maxLength={150} value={selected.broadcast.title} onChange={event => update({ broadcast: { ...selected.broadcast, title: event.target.value } })} /></label><label>End time (optional)<input type="datetime-local" value={localInput(selected.broadcast.endsAt ?? '')} onChange={event => update({ broadcast: { ...selected.broadcast, endsAt: event.target.value ? new Date(event.target.value).toISOString() : undefined } })} /></label><label className="tv-full">HLS playback URL (optional)<input type="url" placeholder="https://…/live.m3u8" value={selected.broadcast.url} onChange={event => update({ broadcast: { ...selected.broadcast, url: event.target.value.trim(), protocol: 'hls', providerInputId: undefined } })} /></label><label className="tv-checkbox"><input type="checkbox" disabled={!selected.broadcast.url.trim()} checked={Boolean(selected.broadcast.url.trim() && selected.broadcast.onAir)} onChange={event => update({ broadcast: { ...selected.broadcast, onAir: event.target.checked } })} />Mark broadcast on air</label></div><div className="tv-actions"><button type="button" disabled={!selected.broadcast.url} onClick={() => setPreview(value => !value)}>{preview ? 'Close preview' : 'Preview feed'}</button>{selected.broadcast.onAir && <button type="button" onClick={() => update({ broadcast: { ...selected.broadcast, onAir: false } })}>Stop live takeover</button>}</div>{preview && (selected.broadcast.protocol === 'webrtc' ? <WebRtcViewer src={selected.broadcast.url} title={selected.broadcast.title || selected.name} /> : <LiveTvPlayer src={selected.broadcast.url} title={selected.broadcast.title || selected.name} />)}<small>Stopping or reaching the end time returns viewers to the channel’s playlist or schedule. An empty channel shows an off-air screen.</small></details>
        <section className="tv-panel"><h2>Channel playback</h2><div className="tv-form-grid"><label className="tv-full">Playback mode<select value={selected.playbackMode ?? 'schedule'} onChange={event => update({ playbackMode: event.target.value as TvChannel['playbackMode'], ...(event.target.value === 'playlist' && !selected.playlist ? { playlist: { startsAt: new Date().toISOString(), items: [] } } : {}) })}><option value="playlist">Looping playlist</option><option value="schedule">Scheduled programs</option></select></label></div><p>{selected.playbackMode === 'playlist' ? 'Play your videos in order, around the clock. No individual start times needed.' : 'Choose a specific date and time for each program. Your playlist is kept when you switch modes.'}</p></section>
        {selected.playbackMode === 'playlist' && selected.playlist ? <TvPlaylistEditor key={selected.id} playlist={selected.playlist} sources={sources} onChange={playlist => update({ playlist })} /> : <section className="tv-panel"><h2>Program schedule</h2><p>Viewers join each published video at its current scheduled position. Set the duration to the video’s actual runtime. Back-to-back start times create continuous programming.</p><form className="tv-form-grid" key={selected.id} onSubmit={addProgram}><label className="tv-full">Published video<select name="source" required defaultValue=""><option value="" disabled>Choose an episode or music video</option>{sources.map(source => <option key={`${source.sourceKind}:${source.id}`} value={`${source.sourceKind}:${source.id}`}>{source.sourceKind === 'episode' ? 'Episode' : 'Music video'} · {source.title}{source.runtime ? ` (${source.runtime})` : ''}</option>)}</select></label><label>Starts at<input name="startsAt" type="datetime-local" required /></label><label>Duration in minutes<input name="minutes" type="number" min="0.017" step="any" required placeholder="e.g. 22.5" /></label><div className="tv-full"><button type="submit" disabled={!sources.length}>+ Add program</button></div></form>{!sources.length && <p>Publish an episode or music video first to add it to the schedule.</p>}
          <div className="tv-program-list">{[...selected.programs].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)).map(program => {
            const listing = channelListings(selected, sources).find(item => item.program.id === program.id)
            return <article key={program.id}><div><strong>{listing?.source.title ?? 'Unavailable video — will not air'}</strong><small>{new Date(program.startsAt).toLocaleString()} · {program.durationSeconds / 60} min</small></div><button type="button" aria-label={`Remove ${listing?.source.title ?? 'unavailable program'}`} onClick={() => update({ programs: selected.programs.filter(item => item.id !== program.id) })}>Remove</button></article>
          })}{!selected.programs.length && <p>No programs scheduled. Add a video above to get started.</p>}</div>
        </section>}
      </div>}
    </div></fieldset>
    {dirty && <div className="tv-save-bar"><span>You have unsaved Live TV changes.</span><button className="btn" type="button" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save changes'}</button></div>}
  </main>
}
