import { liveTvFingerprint, normalizeLiveTvConfig, type LiveTvConfig } from '../../../src/lib/liveTv.ts'

// Browser publishing credentials are returned only to authenticated network admins.
// Public catalog data contains the WHEP viewer URL, never the WHIP publisher URL.
const base = Deno.env.get('SUPABASE_URL') || ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || ''
const streamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN') || ''
const allowedOrigins = new Set(['https://ebgplus.app', 'https://www.ebgplus.app', 'https://studio.ebgplus.app', 'https://rozyroses.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173'])
type Broadcast = { title: string; url: string; onAir: boolean; endsAt?: string; protocol?: string; providerInputId?: string }
type Channel = { id: string; enabled: boolean; broadcast: Broadcast; [key: string]: unknown }
type CmsRow = { key: string; updated_at: string; value: { liveTv?: { channels: Channel[] }; [key: string]: unknown } }
type Input = { uid: string; meta?: Record<string, string>; webRTC?: { url?: string }; webRTCPlayback?: { url?: string } }

class RequestError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status } }
const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
async function database(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...dbHeaders, ...init.headers }, signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new RequestError(502, 'The channel catalog could not be updated. Try again shortly.')
  return response.status === 204 ? null : response.json()
}
async function cloudflare(path: string, init: RequestInit = {}): Promise<Input> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/stream/live_inputs${path}`, {
    ...init, headers: { Authorization: `Bearer ${streamToken}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) throw new RequestError(502, 'The streaming service declined the request. Check the account connection and Stream access.')
  return data.result as Input
}
async function readCms(): Promise<CmsRow> {
  const [row] = await database('cms_settings?key=eq.cms&select=key,value,updated_at&limit=1')
  if (!row) throw new RequestError(404, 'The channel catalog is unavailable.')
  return row
}
function ownedInput(input: Input, userId: string, channelId: string) {
  if (input.meta?.ebgAccountId !== userId || input.meta?.ebgChannelId !== channelId) throw new RequestError(403, 'This broadcast belongs to another session.')
}
function viewerUrl(input: Input) {
  const value = input.webRTCPlayback?.url
  if (!value) throw new RequestError(502, 'The streaming service did not return a viewer connection.')
  const url = new URL(value)
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.cloudflarestream.com') || !url.pathname.endsWith('/webRTC/play')) throw new RequestError(502, 'The streaming service returned an invalid viewer connection.')
  return value
}
async function updateChannel(channelId: string, modify: (channel: Channel) => Channel) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await readCms()
    const config = row.value.liveTv
    const channel = config?.channels.find(item => item.id === channelId)
    if (!channel || !config) throw new RequestError(404, 'Save a channel before starting a broadcast.')
    const next = { ...row.value, liveTv: { ...config, channels: config.channels.map(item => item.id === channelId ? modify(item) : item) } }
    const updated = await database(`cms_settings?key=eq.cms&updated_at=eq.${encodeURIComponent(row.updated_at)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ value: next, updated_at: new Date().toISOString() }),
    })
    if (updated?.length) return
  }
  throw new RequestError(409, 'The channel changed while saving. Please try again.')
}

async function saveSettings(value: unknown, expectedFingerprint: unknown) {
  let config: LiveTvConfig
  try { config = normalizeLiveTvConfig(value) }
  catch (error) { throw new RequestError(400, error instanceof Error ? error.message : 'Choose valid channel settings.') }
  if (typeof expectedFingerprint !== 'string') throw new RequestError(400, 'Reload the channel lineup before saving.')
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await readCms()
    if (liveTvFingerprint((row.value.liveTv ?? { channels: [] }) as LiveTvConfig) !== expectedFingerprint) throw new RequestError(409, 'Live TV was changed in another session. Reload the page before saving to avoid overwriting it.')
    // Only merge this lineup into the latest catalog. The timestamp condition
    // preserves concurrent edits to other catalog sections without browser grants.
    const rows = await database(`cms_settings?key=eq.cms&updated_at=eq.${encodeURIComponent(row.updated_at)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ value: { ...row.value, liveTv: config }, updated_at: new Date().toISOString() }),
    })
    const stored = rows?.[0]?.value.liveTv
    if (stored && liveTvFingerprint(stored) === liveTvFingerprint(config)) return stored
  }
  throw new RequestError(409, 'The catalog changed while saving. Please try again.')
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || ''
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin', ...(allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}), 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
  const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers })
  if (origin && !allowedOrigins.has(origin)) return reply(403, { error: 'Origin not allowed.' })
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') return reply(405, { error: 'Use POST.' })
  try {
    const auth = req.headers.get('Authorization') || ''
    if (!/^Bearer \S+$/i.test(auth)) throw new RequestError(401, 'Sign in to use the broadcast desk.')
    const verified = await fetch(`${base}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: auth }, signal: AbortSignal.timeout(10000) })
    if (!verified.ok) throw new RequestError(401, 'Your session expired. Please sign in again.')
    const user = await verified.json()
    if (typeof user.id !== 'string') throw new RequestError(401, 'Your session could not be verified.')
    const [account] = await database(`accounts?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`)
    if (!account || !['founder', 'administrator'].includes(account.role)) throw new RequestError(403, 'An administrator account is required to manage Live TV.')
    const body = await req.json().catch(() => null)
    const action = body?.action
    if (action === 'status') return reply(200, { configured: Boolean(accountId && streamToken) })
    if (action === 'save-settings') return reply(200, { liveTv: await saveSettings(body.config, body.expectedFingerprint) })
    if (!['create', 'activate', 'heartbeat', 'stop'].includes(action)) throw new RequestError(400, 'Unknown broadcast action.')
    if (!accountId || !streamToken) throw new RequestError(503, 'An administrator needs to connect the broadcast service first. Private preview is available.')
    const channelId = typeof body.channelId === 'string' ? body.channelId : ''
    if (!channelId || channelId.length > 150) throw new RequestError(400, 'Choose a valid channel.')
    if (action === 'create') {
      const row = await readCms()
      const channel = row.value.liveTv?.channels.find(item => item.id === channelId)
      if (!channel?.enabled) throw new RequestError(400, 'Save and enable this channel before going live.')
      if (channel.broadcast.onAir && (!channel.broadcast.endsAt || Date.parse(channel.broadcast.endsAt) > Date.now())) throw new RequestError(409, 'This channel already has a broadcast. Stop it before starting another.')
      const input = await cloudflare('', { method: 'POST', body: JSON.stringify({ meta: { name: `EBG+ ${channelId}`, ebgAccountId: user.id, ebgChannelId: channelId }, recording: { mode: 'off' } }) })
      if (!input.uid || !input.webRTC?.url || !input.webRTCPlayback?.url) {
        if (input.uid) await cloudflare(`/${encodeURIComponent(input.uid)}`, { method: 'DELETE' }).catch(() => {})
        throw new RequestError(502, 'The streaming service did not provide a browser broadcast connection.')
      }
      return reply(200, { inputId: input.uid, publishUrl: input.webRTC.url })
    }
    const inputId = typeof body.inputId === 'string' ? body.inputId : ''
    if (!/^[a-f0-9]{32}$/i.test(inputId)) throw new RequestError(400, 'Choose a valid broadcast session.')
    const input = await cloudflare(`/${inputId}`)
    ownedInput(input, user.id, channelId)
    if (action === 'stop') {
      // Only clear the current takeover if it belongs to this exact session.
      await updateChannel(channelId, channel => channel.broadcast.providerInputId === inputId ? { ...channel, broadcast: { ...channel.broadcast, onAir: false, endsAt: new Date().toISOString() } } : channel).catch(error => { if (!(error instanceof RequestError) || error.status !== 404) throw error })
      await cloudflare(`/${inputId}`, { method: 'DELETE' })
      return reply(200, { stopped: true })
    }
    const playback = viewerUrl(input)
    await updateChannel(channelId, channel => {
      if (!channel.enabled) throw new RequestError(409, 'This channel has been hidden. The broadcast cannot go public.')
      const current = channel.broadcast
      if (action === 'heartbeat' && (!current.onAir || current.providerInputId !== inputId)) throw new RequestError(409, 'This broadcast has ended or been replaced.')
      if (action === 'activate' && current.onAir && current.providerInputId !== inputId && (!current.endsAt || Date.parse(current.endsAt) > Date.now())) throw new RequestError(409, 'Another broadcast is already on this channel.')
      const title = action === 'activate' && typeof body.title === 'string' ? body.title.trim().slice(0, 150) : current.title
      return { ...channel, broadcast: { title: title || 'Live on EBG+', url: playback, protocol: 'webrtc', providerInputId: inputId, onAir: true, endsAt: new Date(Date.now() + 90000).toISOString() } }
    })
    return reply(200, { onAir: true, expiresIn: 90 })
  } catch (error) {
    return reply(error instanceof RequestError ? error.status : 500, { error: error instanceof RequestError ? error.message : 'The broadcast request could not be completed. Please try again.' })
  }
})
