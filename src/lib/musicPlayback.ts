export type AudioQuality = 'auto' | 'standard' | 'lossless' | 'atmos'
export type MusicSource = { url: string; contentType: string; quality: Exclude<AudioQuality, 'auto'>; sampleRate?: number; bitDepth?: number }
export type MusicTrack = {
  id: string; src: string; title: string; artist: string; artwork?: string;
  lyrics?: string; timedLyrics?: { start: number; end: number; text: string }[];
  sources: MusicSource[];
}
export const safeAudioUrl = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return ''
  try { const url = new URL(value, 'https://ebgplus.app'); return ['https:', 'http:'].includes(url.protocol) ? value.trim() : '' } catch { return '' }
}
export function audioMime(url: string): string {
  const path = url.split(/[?#]/)[0].toLowerCase()
  if (path.endsWith('.flac')) return 'audio/flac'
  if (path.endsWith('.wav')) return 'audio/wav'
  if (path.endsWith('.ogg')) return 'audio/ogg'
  if (path.endsWith('.m4a') || path.endsWith('.mp4')) return 'audio/mp4'
  if (path.endsWith('.mp3')) return 'audio/mpeg'
  return ''
}
export function catalogTrack(item: Record<string, any>, artist: string, artwork?: string): MusicTrack {
  const src = safeAudioUrl(item.audioUrl)
  const sources: MusicSource[] = []
  if (src) sources.push({ url: src, contentType: item.audioMimeType || audioMime(src), quality: audioMime(src) === 'audio/flac' ? 'lossless' : 'standard' })
  const lossless = safeAudioUrl(item.losslessUrl)
  // Explicit lossless source: FLAC or PCM WAV. Do not relabel a lossy URL.
  const losslessType = item.losslessMimeType || audioMime(lossless)
  if (lossless && ['audio/flac', 'audio/wav', 'audio/wave', 'audio/x-wav'].includes(losslessType) && !['audio/mpeg', 'audio/ogg', 'audio/mp4'].includes(audioMime(lossless))) sources.push({ url: lossless, contentType: losslessType, quality: 'lossless', sampleRate: item.sampleRate, bitDepth: item.bitDepth })
  const atmos = safeAudioUrl(item.atmosUrl)
  if (atmos && (!audioMime(atmos) || audioMime(atmos) === 'audio/mp4')) sources.push({ url: atmos, contentType: 'audio/mp4; codecs="ec-3"', quality: 'atmos' })
  return { id: String(item.id || src || lossless || atmos), src, title: item.title || 'Untitled song', artist, artwork, lyrics: item.lyrics, timedLyrics: item.timedLyrics || [], sources }
}
export const hasPlayableAudio = (item: Record<string, any>) => catalogTrack(item, '').sources.length > 0
export function selectSource(sources: MusicSource[], preferred: AudioQuality, supported: boolean[]): MusicSource | null {
  const available = sources.filter((_, index) => supported[index])
  const order = preferred === 'auto' ? ['atmos', 'lossless', 'standard'] : [preferred, 'standard', 'lossless']
  for (const quality of order) { const found = available.find(source => source.quality === quality); if (found) return found }
  return null
}
export async function sourceSupported(source: MusicSource, media: HTMLAudioElement): Promise<boolean> {
  if (source.quality !== 'atmos') return !source.contentType || media.canPlayType(source.contentType) !== ''
  // EC-3 decoding alone does not establish Atmos spatial rendering support.
  if (!navigator.mediaCapabilities?.decodingInfo) return false
  try {
    const info = await navigator.mediaCapabilities.decodingInfo({
      type: 'file', audio: { contentType: source.contentType, channels: '16', bitrate: 768000, samplerate: 48000, spatialRendering: true } as AudioConfiguration,
    })
    return info.supported
  } catch { return false }
}
export function nextQueueIndex(length: number, current: number, repeat: 'off' | 'all' | 'one', shuffle: boolean, random = Math.random): number | null {
  if (!length) return null
  if (repeat === 'one') return current
  if (shuffle && length > 1) { const next = Math.floor(random() * (length - 1)); return next >= current ? next + 1 : next }
  if (current + 1 < length) return current + 1
  return repeat === 'all' ? 0 : null
}
