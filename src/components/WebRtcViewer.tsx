import { useEffect, useRef, useState } from 'react'
import { negotiateRtc } from '../lib/browserBroadcast'

export default function WebRtcViewer({ src, title }: { src: string; title: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const pc = new RTCPeerConnection()
    const abort = new AbortController()
    let resource: string | null = null
    const stream = new MediaStream()
    const media = video.current
    setError(''); setLoading(true)
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })
    pc.ontrack = event => { stream.addTrack(event.track); if (media) { media.srcObject = stream; void media.play().catch(() => setLoading(false)) } }
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { setError('The live connection was interrupted. Try reconnecting.'); setLoading(false) } }
    void negotiateRtc(pc, src, abort.signal).then(url => {
      if (abort.signal.aborted && url) void fetch(url, { method: 'DELETE' }).catch(() => {})
      else resource = url
    }).catch(error => { if (!abort.signal.aborted) { setError(error instanceof Error ? error.message : 'The live broadcast could not connect.'); setLoading(false) } })
    const timeout = window.setTimeout(() => { if (!stream.getVideoTracks().length) { setLoading(false); setError('Waiting for the broadcaster. Try reconnecting shortly.') } }, 25000)
    return () => { abort.abort(); clearTimeout(timeout); pc.close(); stream.getTracks().forEach(track => track.stop()); if (media) media.srcObject = null; if (resource) void fetch(resource, { method: 'DELETE', keepalive: true }).catch(() => {}) }
  }, [src, attempt])
  return <div className="tv-player"><video ref={video} aria-label={`${title} live TV player`} controls playsInline autoPlay onPlaying={() => { setLoading(false); setError('') }} />{loading && !error && <p className="tv-player-status" role="status">Connecting to live broadcast…</p>}{error && <div className="tv-player-status" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Reconnect</button></div>}<div className="tv-player-footer"><span>● LIVE BROADCAST</span><button type="button" onClick={() => setAttempt(value => value + 1)}>Reconnect live</button></div></div>
}
