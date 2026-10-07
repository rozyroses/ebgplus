import { createClient } from 'jsr:@supabase/supabase-js@2'
const headers = { 'Access-Control-Allow-Origin': 'https://studio.ebgplus.app', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) return json({ error: 'Studio sign-in required.' }, 401)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user) return json({ error: 'Please sign in again.' }, 401)
    if (Number(request.headers.get('content-length')) > 6000000) return json({ error: 'Audio is too large.' }, 413)
    const form = await request.formData()
    const projectId = form.get('projectId')
    if (typeof projectId !== 'string') return json({ error: 'Choose a Studio project.' }, 400)
    const { data: project, error: projectError } = await admin.from('studio_projects').select('id').eq('id', projectId).eq('owner_account_id', user.id).maybeSingle()
    if (projectError || !project) return json({ error: 'You do not have access to this project.' }, 403)
    const audio = form.get('audio')
    if (!(audio instanceof File) || audio.size < 46 || audio.size > 5760044) return json({ error: 'Choose audio up to two minutes long.' }, 400)
    const bytes = new Uint8Array(await audio.arrayBuffer()); const view = new DataView(bytes.buffer)
    const tag = (offset: number, length: number) => new TextDecoder().decode(bytes.slice(offset, offset + length))
    if (tag(0, 4) !== 'RIFF' || tag(8, 4) !== 'WAVE' || tag(12, 4) !== 'fmt ' || tag(36, 4) !== 'data' || view.getUint32(16, true) !== 16 || view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1 || view.getUint32(24, true) !== 24000 || view.getUint16(34, true) !== 16 || view.getUint32(40, true) !== bytes.length - 44 || (bytes.length - 44) % 2) return json({ error: 'Unsupported audio format. Please upload again through Studio.' }, 400)
    const key = Deno.env.get('META_API_KEY') || Deno.env.get('MODEL_API_KEY')
    if (!key) return json({ error: 'Voice transcription is not configured yet.' }, 503)
    const upstream = new FormData()
    upstream.append('request', new Blob([JSON.stringify({ model: 'muse-voice-transcribe-1.0', audioEncoding: 'WAV', mode: 'PUSH_TO_TALK', keywords: ['EBG+', 'Lumi'] })], { type: 'application/json' }))
    upstream.append('audio', audio, 'message.wav')
    const response = await fetch('https://api.meta.ai/v1/asr/transcribe', { method: 'POST', headers: { Authorization: `Bearer ${key}`, Accept: 'text/plain' }, body: upstream, signal: AbortSignal.timeout(90000) })
    if (!response.ok) { console.error('Lumi transcription provider failed', response.status); return json({ error: response.status === 401 ? 'The transcription service credentials need updating.' : response.status === 429 ? 'Voice transcription is busy. Please try again shortly.' : 'Voice transcription failed. Please try again.' }, 502) }
    const text = (await response.text()).trim()
    if (!text) return json({ error: 'No speech was detected. Please try again.' }, 422)
    return json({ text })
  } catch { return json({ error: 'Could not transcribe this audio. Please try again.' }, 500) }
})
