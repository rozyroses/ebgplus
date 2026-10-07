export const platforms = [
  { id: 'spotify', name: 'Spotify', host: 'open.spotify.com' },
  { id: 'apple', name: 'Apple Music', host: 'music.apple.com' },
  { id: 'youtube', name: 'YouTube Music', host: 'music.youtube.com' },
  { id: 'amazon', name: 'Amazon Music', host: 'music.amazon.com' },
  { id: 'tidal', name: 'Tidal', host: 'tidal.com' },
  { id: 'deezer', name: 'Deezer', host: 'deezer.com' },
] as const
export type Platform = typeof platforms[number]['id']
export type DistributionDetails = {
  label: string; copyright: string; recordingRights: string; upc: string
  credits: string; territories: string; rightsConfirmed: boolean
}
export const emptyDistribution = (): DistributionDetails => ({ label: '', copyright: '', recordingRights: '', upc: '', credits: '', territories: 'Worldwide', rightsConfirmed: false })
export function cleanPlatformLinks(input: Partial<Record<Platform, string>>) {
  const output: Partial<Record<Platform, string>> = {}
  for (const platform of platforms) {
    const value = input[platform.id]?.trim()
    if (!value) continue
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || !(url.hostname === platform.host || url.hostname.endsWith(`.${platform.host}`))) throw new Error(`Use a direct HTTPS ${platform.name} listening link.`)
    output[platform.id] = url.href
  }
  return output
}
export function publicReleaseId(projectId: string, id: string) {
  return id.startsWith(`lumi-${projectId.replaceAll('-', '')}-`) ? id : `project-${projectId}-${id}`
}
export function releaseLink(projectId: string, id: string) {
  return `https://studio.ebgplus.app/#listen/${encodeURIComponent(publicReleaseId(projectId, id))}`
}
export function distributionMissing(release: { cover?: string; genre?: string; releaseDate?: string }, tracks: Array<{ audioUrl?: string; losslessUrl?: string }>, details: DistributionDetails) {
  const missing: string[] = []
  if (!release.cover) missing.push('Cover artwork')
  if (!release.genre) missing.push('Genre')
  if (!release.releaseDate) missing.push('Release date')
  if (!tracks.length || tracks.some(track => !track.audioUrl)) missing.push('Audio for every track')
  if (tracks.some(track => !track.losslessUrl)) missing.push('Lossless masters for every track')
  if (!details.copyright.trim() || !details.recordingRights.trim()) missing.push('Copyright and recording rights')
  if (!details.credits.trim()) missing.push('Songwriter and producer credits')
  if (!details.rightsConfirmed) missing.push('Rights confirmation')
  return missing
}
