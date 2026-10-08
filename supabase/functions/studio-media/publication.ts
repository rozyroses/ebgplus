export function validMediaPath(path: string): boolean {
  return path.length > 0 && path.length < 1500 && !path.includes('\\') && path.split('/').every(part => !!part && part !== '.' && part !== '..') && /^(studio|catalog)\//.test(path)
}
const due = (item: Record<string, any>, now: number) => item.publishStatus === 'live' || (item.publishStatus === 'scheduled' && Number.isFinite(Date.parse(item.releaseDate)) && Date.parse(item.releaseDate) <= now)
export function isPublishedMedia(cms: Record<string, any>, path: string, origin: string, now = Date.now()): boolean {
  if (!validMediaPath(path)) return false
  function contains(value: unknown): boolean {
    if (typeof value === 'string') {
      try { const u = new URL(value); return u.origin === origin && u.pathname === '/functions/v1/studio-media' && u.searchParams.get('path') === path } catch { return false }
    }
    return Array.isArray(value) ? value.some(contains) : !!value && typeof value === 'object' && Object.values(value).some(contains)
  }
  // Public show artwork and cast photos are published as part of the show page.
  if ((cms.shows || []).some((show: any) => contains([show.artwork,show.banner,show.logoImage,(show.cast || []).filter((person: any) => person.status !== 'Inactive').map((person: any) => person.image)]))) return true
  if ((cms.episodes || []).some((episode: any) => due(episode,now) && contains([episode.videoUrl,episode.thumbnail]))) return true
  const music = cms.music || {}
  const releases = (music.releases || []).filter((release: any) => due(release,now))
  const ids = new Set(releases.map((release: any) => release.id))
  const tracks = (music.tracks || []).filter((track: any) => ids.has(track.releaseId))
  const videos = (music.videos || []).filter((video: any) => due(video,now))
  const artistIds = new Set([...releases,...tracks,...videos].map((item: any) => item.artistId))
  return contains([...releases,...tracks,...videos,...(music.artists || []).filter((artist: any) => artistIds.has(artist.id))])
}
