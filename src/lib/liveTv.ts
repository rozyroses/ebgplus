export type TvProgram = {
  id: string
  sourceId: string
  sourceKind: 'episode' | 'music-video'
  startsAt: string
  durationSeconds: number
}

export type TvPlaylistItem = Omit<TvProgram, 'startsAt'>
export type TvPlaylist = { startsAt: string; items: TvPlaylistItem[] }

export type TvChannel = {
  id: string
  name: string
  description: string
  enabled: boolean
  programs: TvProgram[]
  playbackMode?: 'schedule' | 'playlist'
  playlist?: TvPlaylist
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
export const liveTvFingerprint = (value: unknown) => JSON.stringify(value, (_, item: unknown) =>
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

// Resolve occurrences from a shared clock, so repeat cycles survive page closes
// and every viewer joins the same video at the same point.
export function channelQueue(channel: TvChannel, sources: TvSource[], now = Date.now(), limit = 8): TvListing[] {
  if (channel.playbackMode !== 'playlist') return channelListings(channel, sources).filter(listing => listing.end > now).slice(0, limit)
  const playlist = channel.playlist
  const anchor = Date.parse(playlist?.startsAt ?? '')
  if (!playlist || !Number.isFinite(anchor)) return []
  const items = playlist.items.flatMap(item => {
    const source = sources.find(source => source.id === item.sourceId && source.sourceKind === item.sourceKind)
    return source && Number.isFinite(item.durationSeconds) && item.durationSeconds > 0 ? [{ item, source }] : []
  })
  const cycleMs = items.reduce((sum, { item }) => sum + item.durationSeconds * 1000, 0)
  if (!items.length || !Number.isFinite(cycleMs) || cycleMs <= 0) return []
  const cycleStart = anchor + Math.max(0, Math.floor((now - anchor) / cycleMs)) * cycleMs
  let offset = 0
  let index = 0
  while (index < items.length && cycleStart + offset + items[index].item.durationSeconds * 1000 <= now) {
    offset += items[index].item.durationSeconds * 1000; index++
  }
  let start = cycleStart + offset
  const listings: TvListing[] = []
  for (let count = 0; count < Math.min(Math.max(0, limit), 100); count++) {
    const { item, source } = items[index % items.length]
    const end = start + item.durationSeconds * 1000
    listings.push({ program: { ...item, startsAt: new Date(start).toISOString() }, source, start, end })
    start = end; index++
  }
  return listings
}

// Catalog runtime is a fallback when the media host cannot return metadata.
export function runtimeSeconds(value: string = ''): number | undefined {
  const text = value.trim().toLowerCase()
  if (/^\d+:\d{2}(?::\d{2})?$/.test(text)) {
    const parts = text.split(':').map(Number)
    if (parts.slice(1).some(part => part >= 60)) return undefined
    const seconds = parts.reduce((sum, part) => sum * 60 + part, 0)
    return seconds > 0 ? seconds : undefined
  }
  const units = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g)]
  if (!units.length || text.replace(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g, '').trim()) return undefined
  const seconds = units.reduce((sum, match) => sum + Number(match[1]) * (match[2].startsWith('h') ? 3600 : match[2].startsWith('m') ? 60 : 1), 0)
  return seconds > 0 ? seconds : undefined
}

export function channelNow(channel: TvChannel, sources: TvSource[], now = Date.now()) {
  if (!channel.enabled) return { kind: 'offline' as const }
  const broadcast = channel.broadcast
  if (broadcast.onAir && isPlaybackUrl(broadcast.url) && (!broadcast.endsAt || Date.parse(broadcast.endsAt) > now)) {
    return { kind: 'broadcast' as const, title: broadcast.title || channel.name, src: broadcast.url, protocol: broadcast.protocol ?? 'hls' }
  }
  const listing = channelQueue(channel, sources, now, 1).find(item => item.start <= now && item.end > now)
  if (listing) {
    const playing = { ...listing, title: listing.source.title, src: listing.source.videoUrl, offset: (now - listing.start) / 1000 }
    return channel.playbackMode === 'playlist' ? { kind: 'playlist' as const, ...playing } : { kind: 'scheduled' as const, ...playing }
  }
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
    if (channel.playbackMode !== undefined && !['schedule', 'playlist'].includes(channel.playbackMode)) throw new Error('Choose a valid channel playback mode.')
    let playlist: TvPlaylist | undefined
    if (channel.playlist !== undefined) {
      if (!channel.playlist || typeof channel.playlist.startsAt !== 'string' || !Array.isArray(channel.playlist.items) || channel.playlist.items.length > 500) throw new Error('Choose a valid playlist (up to 500 videos).')
      playlist = { startsAt: channel.playlist.startsAt, items: channel.playlist.items.map((item: TvPlaylistItem) => {
        if (!item || typeof item.id !== 'string' || typeof item.sourceId !== 'string' || typeof item.durationSeconds !== 'number') throw new Error('Each playlist video needs valid details and a duration.')
        return { id: item.id, sourceId: item.sourceId, sourceKind: item.sourceKind, durationSeconds: item.durationSeconds }
      }) }
    }
    const url = broadcast.url.trim()
    return {
      id: channel.id, name: channel.name.trim(), description: channel.description, enabled: channel.enabled,
      ...(channel.playbackMode ? { playbackMode: channel.playbackMode } : {}),
      ...(playlist ? { playlist } : {}),
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
    if (channel.playbackMode === 'playlist' && !channel.playlist) throw new Error('Set up a playlist for this channel.')
    if (channel.playlist) {
      if (!Number.isFinite(Date.parse(channel.playlist.startsAt))) throw new Error('Choose a valid playlist start time.')
      const ids = new Set<string>()
      for (const item of channel.playlist.items) {
        if (!item.id || ids.has(item.id)) throw new Error('Every playlist entry needs a unique ID.')
        ids.add(item.id)
        if (!item.sourceId || !['episode', 'music-video'].includes(item.sourceKind) || !Number.isFinite(item.durationSeconds) || item.durationSeconds <= 0 || item.durationSeconds > 86400) throw new Error('Each playlist video needs a video and a duration between 0 and 24 hours.')
      }
    }
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
