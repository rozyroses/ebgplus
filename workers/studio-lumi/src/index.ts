export interface Env {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  LUMI_GATEWAY_URL: string
  ALLOWED_ORIGIN?: string
}

type StudioShow = {
  id: string
  title: string
  description?: string
  genre?: string
  status?: string
  cast?: Array<{ name: string; role: string; city?: string; bio?: string }>
}

type StudioEpisode = {
  id: string
  showId: string
  season: number
  number: number
  title: string
  synopsis?: string
  runtime?: string
  releaseDate?: string
  publishStatus?: string
}

type ScopedCms = {
  shows?: StudioShow[]
  episodes?: StudioEpisode[]
}

const json = (body: unknown, status = 200, origin = '*') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  },
})

const compactContext = (show: StudioShow, episodes: StudioEpisode[]) => ({
  show: {
    id: show.id,
    title: show.title,
    description: show.description ?? '',
    genre: show.genre ?? '',
    status: show.status ?? '',
    cast: (show.cast ?? []).slice(0, 30),
  },
  episodes: episodes
    .sort((a, b) => (a.season - b.season) || (a.number - b.number))
    .slice(-40)
    .map((episode) => ({
      season: episode.season,
      number: episode.number,
      title: episode.title,
      synopsis: episode.synopsis ?? '',
      runtime: episode.runtime ?? '',
      releaseDate: episode.releaseDate ?? '',
      publishStatus: episode.publishStatus ?? '',
    })),
})

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('Origin') || ''
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://studio.ebgplus.app'
    const corsOrigin = requestOrigin === allowedOrigin ? allowedOrigin : allowedOrigin

    if (request.method === 'OPTIONS') return json({}, 204, corsOrigin)
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, corsOrigin)

    if (requestOrigin && requestOrigin !== allowedOrigin) {
      return json({ error: 'Origin not allowed.' }, 403, corsOrigin)
    }

    const authorization = request.headers.get('Authorization') || ''
    if (!authorization.startsWith('Bearer ')) {
      return json({ error: 'EBG+ Studio sign-in required.' }, 401, corsOrigin)
    }

    let payload: { showId?: string; messages?: Array<{ role: string; content: string }> }
    try {
      payload = await request.json()
    } catch {
      return json({ error: 'Invalid JSON request.' }, 400, corsOrigin)
    }

    const showId = String(payload.showId || '').trim()
    if (!showId) return json({ error: 'A production is required.' }, 400, corsOrigin)

    const cmsResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/studio_load_cms`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    if (!cmsResponse.ok) {
      const details = await cmsResponse.text()
      return json({ error: 'Studio access could not be verified.', details: details.slice(0, 300) }, cmsResponse.status === 401 ? 401 : 403, corsOrigin)
    }

    const cms = await cmsResponse.json() as ScopedCms | null
    const show = cms?.shows?.find((item) => item.id === showId)
    if (!show) {
      return json({ error: 'You do not have Studio access to that production.' }, 403, corsOrigin)
    }

    const episodes = (cms?.episodes ?? []).filter((episode) => episode.showId === showId)
    const context = compactContext(show, episodes)
    const userMessages = Array.isArray(payload.messages) ? payload.messages.slice(-12) : []

    const lumiResponse = await fetch(env.LUMI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'create',
        space: {
          name: `EBG Studio · ${show.title}`,
          instructions: 'Act as Lumi inside EBG Studio. Be a practical creative and production collaborator. You are suggestion-only: never claim to publish, edit, approve, contact talent, or change EBG+ data. Use only the provided production context and clearly say when information is missing.',
        },
        messages: [
          {
            role: 'user',
            content: `[EBG Studio production context — authorized server-side for this signed-in account]\n${JSON.stringify(context)}`,
          },
          ...userMessages,
        ],
      }),
    })

    const raw = await lumiResponse.text()
    if (!lumiResponse.ok) {
      return json({ error: 'Lumi gateway could not answer right now.', details: raw.slice(0, 300) }, 502, corsOrigin)
    }

    let reply = raw
    try {
      const decoded = JSON.parse(raw) as { reply?: string; text?: string; message?: string; content?: string }
      reply = decoded.reply || decoded.text || decoded.message || decoded.content || raw
    } catch {
      // The existing Lumi gateway may return plain text.
    }

    return json({ reply }, 200, corsOrigin)
  },
}
