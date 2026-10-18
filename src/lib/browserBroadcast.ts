import { readStoredSession } from './auth'

const root = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
export async function broadcastRequest<T>(action: string, values: Record<string, unknown> = {}, keepalive = false): Promise<T> {
  const session = readStoredSession()
  if (!session || !root) throw new Error('Sign in to your staff account to use the broadcast desk.')
  const response = await fetch(`${root}/functions/v1/browser-broadcast`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: publicKey, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, ...values }), keepalive,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The broadcast service could not be reached.')
  return data as T
}

export async function negotiateRtc(pc: RTCPeerConnection, url: string, signal: AbortSignal) {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  if (pc.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); pc.removeEventListener('icegatheringstatechange', changed); signal.removeEventListener('abort', abort) }
    const changed = () => { if (pc.iceGatheringState === 'complete') { cleanup(); resolve() } }
    const abort = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { cleanup(); resolve() }, 5000)
    pc.addEventListener('icegatheringstatechange', changed); signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: pc.localDescription?.sdp, signal })
  if (!response.ok) throw new Error('The live connection was declined by the streaming service.')
  await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() })
  const location = response.headers.get('Location')
  return location ? new URL(location, url).toString() : null
}

export async function waitForRtc(pc: RTCPeerConnection, signal: AbortSignal) {
  if (pc.connectionState === 'connected') return
  await new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => { clearTimeout(timer); pc.removeEventListener('connectionstatechange', changed); signal.removeEventListener('abort', aborted); if (error) reject(error); else resolve() }
    const changed = () => { if (pc.connectionState === 'connected') finish(); else if (['failed', 'closed'].includes(pc.connectionState)) finish(new Error('The live connection failed. Check your network and try again.')) }
    const aborted = () => finish(new DOMException('Cancelled', 'AbortError'))
    const timer = setTimeout(() => finish(new Error('The streaming connection timed out. Check your network and try again.')), 20000)
    pc.addEventListener('connectionstatechange', changed); signal.addEventListener('abort', aborted, { once: true })
    if (signal.aborted) aborted()
  })
}
