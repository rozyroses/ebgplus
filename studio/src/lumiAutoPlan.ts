export const autoDestinations = ['news', 'notification', 'show', 'episode', 'cast', 'poster', 'banner', 'logo', 'music', 'music-video', 'form'] as const
export type AutoDestination = typeof autoDestinations[number]
export type AutoPlan = { title: string; body: string; artist: string; role: string; genre: string; questions: string; season: number; number: number; contentType: 'series' | 'movie' }
export function parseAutoPlan(raw: string): AutoPlan {
  const text = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\s*\x60\x60\x60$/, '')
  let value: Record<string, unknown>
  try { value = JSON.parse(text) } catch { throw new Error('Lumi could not prepare a valid upload. Add clearer material and try again.') }
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Lumi needs clearer material to prepare this upload.')
  const read = (key: string, limit: number) => typeof value[key] === 'string' ? value[key].trim().slice(0, limit) : ''
  return { title: read('title', 120), body: read('body', 12000), artist: read('artist', 120), role: read('role', 120), genre: read('genre', 120), questions: read('questions', 10000),
    season: Number(value.season), number: Number(value.number), contentType: value.contentType === 'movie' ? 'movie' : 'series' }
}
export function validateAutoPlan(destination: AutoDestination, plan: AutoPlan, showId: string, mediaType: string) {
  if (!plan.title && !['poster','banner','logo'].includes(destination)) throw new Error('Add the title or cast member name to your material.')
  if (['episode','cast','poster','banner','logo'].includes(destination) && !showId) throw new Error('Choose the destination show.')
  if (['news','notification','show','cast','form'].includes(destination) && !plan.body) throw new Error('Add the public copy or description to your material.')
  if (['poster','banner','logo','cast','show'].includes(destination) && !mediaType.startsWith('image/')) throw new Error('Attach the image to publish, or choose Generate artwork.')
  if (destination === 'episode' && (!mediaType.startsWith('video/') || !Number.isInteger(plan.season) || plan.season < 1 || !Number.isInteger(plan.number) || plan.number < 1)) throw new Error('Episodes need a video, season number, and episode number.')
  if (['music','music-video'].includes(destination) && (!plan.artist || !mediaType.startsWith(destination === 'music' ? 'audio/' : 'video/'))) throw new Error('Add the artist name and attach the audio or video.')
  if (destination === 'form' && !plan.questions) throw new Error('Add the form questions: one line per question, label | type | choices.')
}
