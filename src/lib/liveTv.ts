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
  broadcast: { title: string; url: string; onAir: boolean; endsAt?: string; protocol?: 'hls' | 'webrtc'; providerInputId?: string }
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
    return { kind: 'broadcast' as const, title: broadcast.title || channel.name, src: broadcast.url, protocol: broadcast.protocol ?? 'hls' }
  }
  const listing = channelListings(channel, sources).find(item => item.start <= now && item.end > now)
  if (listing) return { kind: 'scheduled' as const, ...listing, title: listing.source.title, src: listing.source.videoUrl, offset: (now - listing.start) / 1000 }
  return { kind: 'offline' as const }
}

// A channel can be saved before a feed is connected. Only a connected feed
// can become an on-air takeover; schedules and channel details are independent.
export function normalizeLiveTvConfig(value: unknown): LiveTvConfig {
  if (!value || typeof value !== 'object' || !('channels' in value) || !Array.isArray(value.channels) || value.channels.length > 100) throw new Error('Choose a valid channel lineup (up to 100 channels).')
  const channels: TvChannel[] = value.channels.map(channel => {
    if (!channel || typeof channel !== 'object' || typeof channel.id !== 'string' || typeof channel.name !== 'string' || typeof channel.description !== 'string' || typeof channel.enabled !== 'boolean' || !Array.isArray(channel.programs) || channel.programs.length > 10000) throw new Error('Each channel needs valid details and a program schedule.')
    const broadcast = channel.broadcast
    if (!broadcast || typeof broadcast.title !== 'string' || typeof broadcast.url !== 'string' || typeof broadcast.onAir !== 'boolean' || (broadcast.endsAt !== undefined && typeof broadcast.endsAt !== 'string') || (broadcast.protocol !== undefined && !['hls', 'webrtc'].includes(broadcast.protocol)) || (broadcast.providerInputId !== undefined && typeof broadcast.providerInputId !== 'string')) throw new Error('Choose valid broadcast settings.')
    if (channel.id.length > 150 || channel.name.length > 100 || channel.description.length > 500 || broadcast.title.length > 150 || broadcast.url.length > 4096) throw new Error('Channel details are too long.')
    const url = broadcast.url.trim()
    return {
      id: channel.id, name: channel.name.trim(), description: channel.description, enabled: channel.enabled,
      programs: channel.programs.map((program: TvProgram) => {
        if (!program || typeof program.id !== 'string' || typeof program.sourceId !== 'string' || typeof program.startsAt !== 'string' || typeof program.durationSeconds !== 'number') throw new Error('Each program needs valid schedule details.')
        return { id: program.id, sourceId: program.sourceId, sourceKind: program.sourceKind, startsAt: program.startsAt, durationSeconds: program.durationSeconds }
      }),
      broadcast: { title: broadcast.title, url, onAir: Boolean(url && broadcast.onAir), ...(broadcast.endsAt ? { endsAt: broadcast.endsAt } : {}), ...(broadcast.protocol ? { protocol: broadcast.protocol } : {}), ...(url && broadcast.providerInputId ? { providerInputId: broadcast.providerInputId } : {}) },
    }
  })
  const config = { channels }
  validateLiveTv(config)
  return config
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
