import { publicReleaseId } from './musicDistribution.ts'
export type PublishKind = 'music' | 'episode' | 'show'
export type PublishState = 'draft' | 'scheduled' | 'live' | 'archived'
export type PublishEvent = { at: string; status: string; releaseDate?: string }
export type CatalogItem = { id: string; title?: string; publishStatus?: string; publishHistory?: PublishEvent[]; [key: string]: any }
export type ReviewCatalog = { shows?: CatalogItem[]; episodes?: CatalogItem[]; music?: { artists?: CatalogItem[]; releases?: CatalogItem[]; tracks?: CatalogItem[]; [key: string]: any }; [key: string]: any }
export type ReviewItem = { kind: PublishKind; item: CatalogItem; subtitle: string; image: string; status: string; errors: string[]; warnings: string[]; media: Array<{id: string; title: string; url: string; kind: 'audio' | 'video'}>; fingerprint: string }
const safeMedia = (value: unknown) => { try { return typeof value === 'string' && new URL(value).protocol === 'https:' } catch { return false } }
export function reviewItems(catalog: ReviewCatalog, kind: PublishKind): ReviewItem[] {
  const items = kind === 'music' ? catalog.music?.releases ?? [] : kind === 'episode' ? catalog.episodes ?? [] : catalog.shows ?? []
  return items.map(item => {
    const parent = kind === 'music' ? catalog.music?.artists?.find(artist => artist.id === item.artistId) : kind === 'episode' ? catalog.shows?.find(show => show.id === item.showId) : undefined
    const tracks = kind === 'music' ? (catalog.music?.tracks ?? []).filter(track => track.releaseId === item.id).sort((a,b) => (a.trackNumber || 0)-(b.trackNumber || 0)) : []
    const image = String(kind === 'music' ? item.cover ?? '' : kind === 'episode' ? item.thumbnail || parent?.artwork || '' : item.artwork || '')
    const errors: string[] = [], warnings: string[] = []
    if (!item.title?.trim()) errors.push('Add a title.')
    if (kind !== 'show' && !parent) errors.push(kind === 'music' ? 'Choose an artist.' : 'Choose a show.')
    if (kind === 'music' && (!tracks.length || tracks.some(track => !safeMedia(track.audioUrl)))) errors.push('Upload playable HTTPS audio for every track.')
    if (kind === 'episode' && !safeMedia(item.videoUrl)) errors.push('Upload a playable HTTPS video.')
    if (!safeMedia(image)) (kind === 'show' ? errors : warnings).push('Add cover or thumbnail artwork.')
    if (kind === 'show' && !item.description?.trim()) warnings.push('Add a show description.')
    if (kind === 'episode' && !item.synopsis?.trim()) warnings.push('Add an episode synopsis.')
    if (kind === 'music' && !item.distribution?.credits?.trim()) warnings.push('Add songwriter and producer credits.')
    if (kind === 'music' && !item.genre?.trim()) warnings.push('Add a genre.')
    return { kind, item, subtitle: kind === 'music' ? parent?.name || 'No artist' : kind === 'episode' ? `${parent?.title || 'No show'} · S${item.season || 1}E${item.number || 1}` : 'Show visibility on EBG+ Home', image, status: kind === 'show' ? item.homeVisible === false ? 'hidden' : 'visible' : item.publishStatus ?? (kind === 'episode' ? 'scheduled' : 'draft'), errors, warnings,
      media: kind === 'music' ? tracks.map(track => ({id:track.id, title:track.title || 'Untitled track', url: safeMedia(track.audioUrl) ? track.audioUrl : '', kind:'audio' as const})) : kind === 'episode' && safeMedia(item.videoUrl) ? [{id:item.id, title:item.title || '', url:item.videoUrl, kind:'video' as const}] : [],
      fingerprint: JSON.stringify({item,parent,tracks}) }
  })
}
export function applyPublishReview(latest: ReviewCatalog, reviewed: ReviewItem, status: string, date: string, now = new Date()): ReviewCatalog {
  const current = reviewItems(latest, reviewed.kind).find(row => row.item.id === reviewed.item.id)
  if (!current) throw new Error('This item was deleted. Refresh the publishing center.')
  if (current.fingerprint !== reviewed.fingerprint) throw new Error('This content changed since your review. Refresh and review the latest version.')
  if (!['draft','scheduled','live','archived','visible','hidden'].includes(status) || (reviewed.kind === 'show' ? !['visible','hidden'].includes(status) : !['draft','scheduled','live','archived'].includes(status))) throw new Error('Choose a valid publishing action.')
  if (['live','scheduled','visible'].includes(status) && current.errors.length) throw new Error(current.errors.join(' '))
  if (status === 'scheduled' && (!date || !Number.isFinite(Date.parse(date)) || Date.parse(date) <= now.getTime())) throw new Error('Choose a future release date and time.')
  const at = now.toISOString()
  const releaseDate = status === 'scheduled' ? new Date(date).toISOString() : status === 'live' && reviewed.kind === 'episode' ? at : current.item.releaseDate
  const patch = reviewed.kind === 'show' ? { homeVisible: status === 'visible' } : { publishStatus: status, ...(releaseDate ? {releaseDate} : {}) }
  const updated = { ...current.item, ...patch, publishHistory: [...(current.item.publishHistory ?? []), {at, status, ...(releaseDate ? {releaseDate} : {})}].slice(-50) }
  if (reviewed.kind === 'music') return { ...latest, music: { ...latest.music, releases: latest.music!.releases!.map(item => item.id === updated.id ? updated : item) } }
  const field = reviewed.kind === 'episode' ? 'episodes' : 'shows'
  return { ...latest, [field]: latest[field]!.map(item => item.id === updated.id ? updated : item) }
}
export function publicItemLink(projectId: string, row: ReviewItem) {
  if (row.kind === 'music') return `https://studio.ebgplus.app/#listen/${encodeURIComponent(publicReleaseId(projectId, row.item.id))}`
  return `https://ebgplus.app/app/shows/${encodeURIComponent(row.kind === 'show' ? row.item.id : row.item.showId)}`
}
