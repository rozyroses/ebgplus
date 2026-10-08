import { canonicalMedia } from '../../src/lib/privateMedia'
import { loadCmsData, loadProjectCms, saveCmsData, saveProjectCms, publishLumiContent } from '../../src/lib/studioData'
import { createForm } from './formsNetwork'
import { parseFormQuestions } from './formBuilder'
import { validateAutoPlan } from './lumiAutoPlan'
import type { AutoDestination, AutoPlan } from './lumiAutoPlan'
type RecordItem = Record<string, any>
type Catalog = RecordItem & { shows?: RecordItem[]; episodes?: RecordItem[] }
export async function publishAutoMaterial(projectId: string, destination: AutoDestination, plan: AutoPlan, showId: string, media: { url: string; type: string; cover?: string }, operationId: string, assertAuthorized: () => void) {
  assertAuthorized()
  validateAutoPlan(destination, plan, showId, media.type)
  const privateCms = await loadProjectCms<Catalog>(projectId)
  if (!privateCms) throw new Error('You do not have access to this Studio project.')
  if (destination === 'news' || destination === 'notification') {
    assertAuthorized()
    await publishLumiContent({ projectId, kind: destination, title: plan.title, body: plan.body })
    return 'https://ebgplus.app/app/' + (destination === 'news' ? 'news' : 'notifications')
  }
  if (destination === 'form') {
    const slug = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + operationId.slice(-8)
    assertAuthorized()
    const form = await createForm({ title: plan.title, slug, eyebrow: 'EBG FORM', description: plan.body, status: 'open', submitMessage: 'Thanks — your response has been received.', questions: parseFormQuestions(plan.questions) })
    return 'https://forms.ebgplus.app/forms/' + form.slug
  }
  const now = new Date().toISOString()
  const id = 'lumi-auto-' + operationId
  if (destination === 'music' || destination === 'music-video') {
    const music = privateCms.music || { artists: [], releases: [], tracks: [], videos: [] }
    const artist = (music.artists || []).find((item: RecordItem) => item.name.toLowerCase() === plan.artist.toLowerCase())
    const artistId = artist?.id || id + '-artist'
    const artists = artist ? music.artists : [...(music.artists || []), { id: artistId, name: plan.artist, image: '', bio: '', label: '' }]
    const nextMusic = { ...music, artists }
    if (destination === 'music') {
      nextMusic.releases = [...(music.releases || []), { id, artistId, title: plan.title, type: 'single', genre: plan.genre, cover: media.cover || '', releaseDate: now, publishStatus: 'live' }]
      nextMusic.tracks = [...(music.tracks || []), { id: id + '-track', artistId, releaseId: id, title: plan.title, audioUrl: media.url, audioMimeType: media.type, trackNumber: 1, explicit: false }]
    } else nextMusic.videos = [...(music.videos || []), { id, artistId, title: plan.title, videoUrl: media.url, thumbnail: media.cover || '', releaseDate: now, publishStatus: 'live' }]
    assertAuthorized()
    await saveProjectCms(projectId, { ...privateCms, music: nextMusic })
    const publicCms = await loadCmsData<Catalog>()
    const collection = destination === 'music' ? 'releases' : 'videos'
    if (!publicCms?.music?.[collection]?.some((item: RecordItem) => item.id === 'project-' + projectId + '-' + id && item.publishStatus === 'live')) throw new Error('Saved in Studio, but the public music catalog was not confirmed. Check Music before retrying.')
    return 'https://ebgplus.app/app/music'
  }
  const cms = await loadCmsData<Catalog>()
  if (!cms) throw new Error('The public catalog could not be loaded.')
  const shows = cms.shows || []
  const selected = shows.find(show => show.id === showId)
  if (['episode','cast','poster','banner','logo'].includes(destination) && !selected) throw new Error('The destination show no longer exists.')
  let next = { ...cms }
  if (destination === 'show') next.shows = [...shows, { id, title: plan.title, description: plan.body, logo: plan.title, category: 'EBG+ Original', genre: plan.genre, year: new Date().getFullYear(), maturity: 'TV-14', status: 'Coming Soon', contentType: plan.contentType, artwork: media.url, cast: [], homeVisible: true }]
  else if (destination === 'episode') {
    if ((cms.episodes || []).some(item => item.showId === showId && Number(item.season) === plan.season && Number(item.number) === plan.number)) throw new Error('That episode number already exists. Use Episodes to replace its video.')
    next.episodes = [...(cms.episodes || []), { id, showId, title: plan.title, synopsis: plan.body, season: plan.season, number: plan.number, videoUrl: media.url, thumbnail: media.cover || '', runtime: '', releaseDate: now, publishStatus: 'live' }]
  } else if (destination === 'cast') {
    const cast = selected!.cast || []
    const matches = cast.filter((item: RecordItem) => item.name.toLowerCase() === plan.title.toLowerCase())
    if (matches.length > 1) throw new Error('Multiple cast members have that name. Use Talent to select the correct record.')
    const nextCast = matches.length ? cast.map((item: RecordItem) => item.name.toLowerCase() === plan.title.toLowerCase() ? { ...item, image: media.url, bio: plan.body, role: plan.role || item.role } : item)
      : [...cast, { name: plan.title, role: plan.role, bio: plan.body, city: '', image: media.url }]
    next.shows = shows.map(show => show.id === showId ? { ...show, cast: nextCast } : show)
  } else {
    const field = { poster: 'artwork', banner: 'banner', logo: 'logoImage' }[destination as 'poster' | 'banner' | 'logo']
    if (!field) throw new Error('Unsupported destination.')
    next.shows = shows.map(show => show.id === showId ? { ...show, [field]: media.url } : show)
  }
  assertAuthorized()
  await saveCmsData(next)
  const saved = canonicalMedia(await loadCmsData<Catalog>())
  const exists = destination === 'show' ? saved?.shows?.some(item => item.id === id)
    : destination === 'episode' ? saved?.episodes?.some(item => item.id === id)
    : destination === 'cast' ? saved?.shows?.find(item => item.id === showId)?.cast?.some((item: RecordItem) => item.name === plan.title && item.image === canonicalMedia(media.url))
    : saved?.shows?.find(item => item.id === showId)?.[{ poster: 'artwork', banner: 'banner', logo: 'logoImage' }[destination as 'poster' | 'banner' | 'logo']] === canonicalMedia(media.url)
  if (!exists) throw new Error('The catalog did not confirm this change. Check the site before retrying.')
  return 'https://ebgplus.app/app/shows/' + (destination === 'show' ? id : showId)
}
