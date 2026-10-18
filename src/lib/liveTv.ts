export type TvProgram = {
  id: string
  sourceId: string
  sourceKind: 'episode' | 'music-video'
  startsAt: string
  durationSeconds: number
}

export type TvChannel = {
  id: string
  name: string
  description: string
  enabled: boolean
  programs: TvProgram[]
  broadcast: { title: string; url: string; onAir: boolean; endsAt?: string }
}

export type LiveTvConfig = { channels: TvChannel[] }
type CatalogVideo = {
  id: string; title: string; videoUrl: string; thumbnail?: string
  publishStatus?: string; releaseDate?: string; runtime?: string
}
export type TvCatalog = {
  episodes: CatalogVideo[]
  music?: { videos?: CatalogVideo[] }
  liveTv?: LiveTvConfig
}
export type TvSource = CatalogVideo & { sourceKind: TvProgram['sourceKind'] }
export type TvListing = { program: TvProgram; source: TvSource; start: number; end: number }

// JSONB does not preserve object-key order. Compare content, not serialization order.
export const liveTvFingerprint = (value: LiveTvConfig) => JSON.stringify(value, (_, item: unknown) =>
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item)

export const isPlaybackUrl = (value: string) => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}

export function tvSources(cms: TvCatalog, now = Date.now()): TvSource[] {
  const published = (video: CatalogVideo) => isPlaybackUrl(video.videoUrl) &&
    (video.publishStatus === 'live' || (video.publishStatus === 'scheduled' && Date.parse(video.releaseDate || '') <= now))
  return [
    ...cms.episodes.filter(published).map(video => ({ ...video, sourceKind: 'episode' as const })),
    ...(cms.music?.videos ?? []).filter(published).map(video => ({ ...video, sourceKind: 'music-video' as const })),
  ]
}

export function channelListings(channel: TvChannel, sources: TvSource[]): TvListing[] {
  return channel.programs.flatMap(program => {
    const source = sources.find(item => item.id === program.sourceId && item.sourceKind === program.sourceKind)
    const start = Date.parse(program.startsAt)
    return source && Number.isFinite(start) && Number.isFinite(program.durationSeconds) && program.durationSeconds > 0
      ? [{ program, source, start, end: start + program.durationSeconds * 1000 }] : []
  }).sort((a, b) => a.start - b.start)
}

export function channelNow(channel: TvChannel, sources: TvSource[], now = Date.now()) {
  if (!channel.enabled) return { kind: 'offline' as const }
  const broadcast = channel.broadcast
  if (broadcast.onAir && isPlaybackUrl(broadcast.url) && (!broadcast.endsAt || Date.parse(broadcast.endsAt) > now)) {
    return { kind: 'broadcast' as const, title: broadcast.title || channel.name, src: broadcast.url }
  }
  const listing = channelListings(channel, sources).find(item => item.start <= now && item.end > now)
  if (listing) return { kind: 'scheduled' as const, ...listing, title: listing.source.title, src: listing.source.videoUrl, offset: (now - listing.start) / 1000 }
  return { kind: 'offline' as const }
}

export function validateLiveTv(config: LiveTvConfig) {
  const channelIds = new Set<string>()
  for (const channel of config.channels) {
    if (!channel.id || channelIds.has(channel.id)) throw new Error('Every channel needs a unique ID.')
    channelIds.add(channel.id)
    if (!channel.name.trim()) throw new Error('Give every channel a name.')
    if (channel.broadcast.url && !isPlaybackUrl(channel.broadcast.url)) throw new Error('Use an HTTPS playback URL for the broadcast.')
    if (channel.broadcast.onAir && !channel.broadcast.url) throw new Error('Connect a playback feed before marking a broadcast on air.')
    if (channel.broadcast.endsAt && !Number.isFinite(Date.parse(channel.broadcast.endsAt))) throw new Error('Choose a valid broadcast end time.')
    if (channel.broadcast.onAir && channel.broadcast.endsAt && Date.parse(channel.broadcast.endsAt) <= Date.now()) throw new Error('The broadcast end time must be in the future.')
    const sorted = [...channel.programs].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    const programIds = new Set<string>()
    let previousEnd = -Infinity
    for (const program of sorted) {
      if (!program.id || programIds.has(program.id)) throw new Error('Every program needs a unique ID.')
      programIds.add(program.id)
      const start = Date.parse(program.startsAt)
      if (!Number.isFinite(start) || !Number.isFinite(program.durationSeconds) || program.durationSeconds <= 0 || !program.sourceId || !['episode', 'music-video'].includes(program.sourceKind)) throw new Error('Each program needs a video, start time, and positive duration.')
      if (start < previousEnd) throw new Error(`Programs overlap on ${channel.name}. Adjust their start times or durations.`)
      previousEnd = start + program.durationSeconds * 1000
    }
  }
}
