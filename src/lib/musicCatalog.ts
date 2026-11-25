import { catalogTrack } from './musicPlayback.ts'
import type { MusicTrack } from './musicPlayback'

export type LibraryAlbum = { id: string; releaseId?: string; title: string; artist: string; cover?: string; type: string; tracks: MusicTrack[] }
export function buildMusicLibrary(music: Record<string, any>, now = Date.now()): { albums: LibraryAlbum[]; tracks: MusicTrack[] } {
  const releases = (music.releases ?? []).filter((item: any) => item.publishStatus === 'live' || (item.publishStatus === 'scheduled' && !!item.releaseDate && Date.parse(item.releaseDate) <= now))
  const releaseIds = new Set(releases.map((item: any) => item.id))
  const rawTracks = (music.tracks ?? []).filter((track: any) => !track.releaseId || releaseIds.has(track.releaseId))
  const artist = (id: string) => (music.artists ?? []).find((item: any) => item.id === id)
  const albums: LibraryAlbum[] = releases.map((release: any) => ({
    id: release.id, releaseId: release.id, title: release.title, artist: artist(release.artistId)?.name || 'EBG Artist', cover: release.cover, type: release.type || 'album',
    tracks: rawTracks.filter((track: any) => track.releaseId === release.id).sort((a: any,b: any) => (a.trackNumber ?? 0)-(b.trackNumber ?? 0))
      .map((track: any) => catalogTrack(track, artist(track.artistId || release.artistId)?.name || 'EBG Artist', release.cover)),
  }))
  for (const track of rawTracks.filter((item: any) => !item.releaseId)) {
    const artistInfo = artist(track.artistId)
    const cover = track.cover || track.artwork || artistInfo?.image
    const item = catalogTrack(track, artistInfo?.name || 'EBG Artist', cover)
    albums.push({ id: 'track:' + track.id, title: track.title, artist: item.artist, cover, type: 'single', tracks: [item] })
  }
  return { albums, tracks: albums.flatMap(album => album.tracks) }
}
