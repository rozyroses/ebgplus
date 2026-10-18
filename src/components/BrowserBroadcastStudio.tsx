import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { broadcastRequest, negotiateRtc, waitForRtc } from '../lib/browserBroadcast'
import type { TvCatalog } from '../lib/liveTv'
import '../styles/browser-broadcast.css'

type LiveInput = { inputId: string; publishUrl: string }
type Active = { pc: RTCPeerConnection; abort: AbortController; inputId: string; channelId: string; resource?: string | null; heartbeat?: number }

export default function BrowserBroadcastStudio({ cms }: { cms: TvCatalog }) {
  const channels = (cms.liveTv?.channels ?? []).filter(channel => channel.enabled)
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<'camera' | 'screen'>('camera')
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Your preview is private.')
  const video = useRef<HTMLVideoElement>(null)
  const media = useRef<MediaStream | null>(null)
  const active = useRef<Active | null>(null)
  const stopRef = useRef<() => Promise<void>>(async () => {})
  const mounted = useRef(true)
  const releaseMedia = () => { media.current?.getTracks().forEach(track => track.stop()); media.current = null; if (video.current) video.current.srcObject = null; setPreviewing(false); setMuted(false) }
  const stop = async () => {
    const session = active.current
    active.current = null
    if (session) {
      session.abort.abort(); window.clearInterval(session.heartbeat); session.pc.close()
      if (session.resource) void fetch(session.resource, { method: 'DELETE', keepalive: true }).catch(() => {})
      try { await broadcastRequest('stop', { channelId: session.channelId, inputId: session.inputId }, true) } catch { if (mounted.current) setError('The connection is stopped. The channel will return to its schedule within 90 seconds.') }
    }
    if (mounted.current) { setLive(false); setBusy(false); setStatus('Broadcast ended. Your preview is private.'); window.dispatchEvent(new Event('ebg:catalog-updated')) }
  }
  stopRef.current = stop
  useEffect(() => {
    mounted.current = true
    void broadcastRequest<{ configured: boolean }>('status').then(data => { if (mounted.current) setConfigured(data.configured) }).catch(error => { if (mounted.current) { setConfigured(false); setError(error instanceof Error ? error.message : 'Could not check the broadcast service.') } })
    return () => { mounted.current = false; void stopRef.current(); media.current?.getTracks().forEach(track => track.stop()) }
  }, [])
  useEffect(() => {
    if (!live) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [live])
  const preview = async () => {
    setError(''); setBusy(true)
    releaseMedia()
    try {
      if (!navigator.mediaDevices) throw new Error('Camera access needs a secure browser connection.')
      const stream = source === 'camera'
        ? await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return }
      media.current = stream
      if (video.current) { video.current.srcObject = stream; await video.current.play() }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { void stopRef.current(); releaseMedia() }, { once: true })
      setPreviewing(true); setStatus('Preview ready. Only you can see this until you choose Go live.')
    } catch (error) { releaseMedia(); setError(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Permission wasn’t granted. Allow camera/microphone access or choose a screen to share.' : error instanceof Error ? error.message : 'The preview could not start.') }
    finally { if (mounted.current) setBusy(false) }
  }
  const goLive = async () => {
    if (!media.current || !channelId || !title.trim()) return
    setBusy(true); setError(''); setStatus('Connecting your broadcast…')
    const pc = new RTCPeerConnection()
    const abort = new AbortController()
    let input: LiveInput | null = null
    try {
      input = await broadcastRequest<LiveInput>('create', { channelId, title: title.trim() })
      if (!mounted.current) { void broadcastRequest('stop', { channelId, inputId: input.inputId }, true).catch(() => {}); pc.close(); return }
      const session: Active = { pc, abort, inputId: input.inputId, channelId }
      active.current = session
      media.current.getTracks().forEach(track => pc.addTransceiver(track, { direction: 'sendonly', streams: [media.current!] }))
      session.resource = await negotiateRtc(pc, input.publishUrl, abort.signal)
      await waitForRtc(pc, abort.signal)
      if (active.current !== session || abort.signal.aborted) return
      await broadcastRequest('activate', { channelId, inputId: input.inputId, title: title.trim() })
      session.heartbeat = window.setInterval(() => {
        if (pc.connectionState !== 'connected') return
        void broadcastRequest('heartbeat', { channelId, inputId: session.inputId }).catch(() => { void stopRef.current() })
      }, 25000)
      pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { setError('Your live connection dropped. The broadcast has stopped.'); void stopRef.current() } }
      if (!mounted.current) { void stopRef.current(); return }
      setLive(true); setStatus('You’re live. Your channel is broadcasting now.'); window.dispatchEvent(new Event('ebg:catalog-updated'))
    } catch (error) {
      if (input && !active.current) void broadcastRequest('stop', { channelId, inputId: input.inputId }, true).catch(() => {})
      await stopRef.current()
      if (mounted.current) setError(error instanceof Error ? error.message : 'Your broadcast could not start.')
    } finally { if (mounted.current) setBusy(false) }
  }
  return <main className="page broadcast-page"><header className="broadcast-heading"><div><p className="eyebrow">EBG STUDIO / BROADCAST</p><h1>Your moment. Live.</h1><p>Go live from your camera or share your screen, right here.</p></div><Link className="btn muted" to="/app/studio/live-tv">Manage channels</Link></header>
    <div className="broadcast-layout"><section className="broadcast-preview"><div className={`broadcast-status ${live ? 'is-live' : ''}`}><span />{live ? 'LIVE ON EBG+' : 'PRIVATE PREVIEW'}</div><video ref={video} muted playsInline autoPlay aria-label="Your private broadcast preview" />{!previewing && <div className="broadcast-preview-empty"><span aria-hidden="true">◉</span><h2>Start with a preview.</h2><p>Check your picture and sound before going live.</p></div>}<div className="broadcast-preview-footer"><p role="status">{status}</p>{previewing && <button type="button" onClick={() => { const next = !muted; media.current?.getAudioTracks().forEach(track => { track.enabled = !next }); setMuted(next) }}>{muted ? 'Unmute microphone' : 'Mute microphone'}</button>}</div></section>
      <section className="broadcast-controls"><h2>Set the scene.</h2><label>Where are we going live?<select value={channelId} disabled={live || busy} onChange={event => setChannelId(event.target.value)}><option value="" disabled>Choose a saved channel</option>{channels.map(channel => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>{!channels.length && <p>Create and enable a channel first. <Link to="/app/studio/live-tv">Set up your channel ↗</Link></p>}<label>Broadcast title<input maxLength={150} value={title} disabled={live || busy} onChange={event => setTitle(event.target.value)} placeholder="What’s happening?" /></label><fieldset disabled={live || busy}><legend>Choose your source</legend><div className="broadcast-sources"><button type="button" aria-pressed={source === 'camera'} onClick={() => { setSource('camera'); releaseMedia() }}>Camera</button><button type="button" aria-pressed={source === 'screen'} disabled={!navigator.mediaDevices?.getDisplayMedia} onClick={() => { setSource('screen'); releaseMedia() }}>Screen share</button></div></fieldset><p className="broadcast-tip">Screen sharing and shared audio depend on your browser. On a phone, use Camera.</p>{configured === false && <div className="broadcast-setup"><strong>Broadcast service setup required</strong><p>An administrator needs to connect the streaming service before broadcasts can go public. You can still test your private camera preview.</p></div>}{configured === null && <p>Checking the broadcast service…</p>}{error && <p className="tv-error" role="alert">{error}</p>}
        <div className="broadcast-buttons">{!live && <button className="btn muted" type="button" disabled={busy} onClick={() => void preview()}>{busy ? 'Please wait…' : previewing ? 'Restart preview' : source === 'camera' ? 'Preview camera' : 'Choose a screen'}</button>}{live ? <button className="btn broadcast-stop" type="button" disabled={busy} onClick={() => void stop()}>End broadcast</button> : <button className="btn" type="button" disabled={busy || !configured || !previewing || !channelId || !title.trim()} onClick={() => void goLive()}>Go live</button>}</div><small>Your preview stays private until the live connection is confirmed. Closing this page ends your broadcast. Broadcast only content you own or have permission to share.</small></section></div>
    <section className="broadcast-upload-note"><div><p className="eyebrow">PLAY SOMETHING YOU’VE ALREADY MADE</p><h2>Got a video ready?</h2><p>Upload and publish it in Studio, then add it to a channel schedule. It plays automatically for everyone without a camera or broadcast app.</p></div><Link className="btn muted" to="/app/studio/live-tv">Build a schedule ↗</Link></section>
  </main>
}
