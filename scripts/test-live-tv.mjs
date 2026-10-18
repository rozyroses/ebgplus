import assert from 'node:assert/strict'
import { test } from 'node:test'
import { channelNow, channelListings, isPlaybackUrl, liveTvFingerprint, tvSources, validateLiveTv } from '../src/lib/liveTv.ts'

const start = Date.parse('2026-10-18T23:00:00Z')
const episode = { id: 'episode', title: 'Vacation', videoUrl: 'https://media.example/episode.mp4', publishStatus: 'live' }
const musicVideo = { ...episode, id: 'music', title: 'Music video' }
const sources = tvSources({ episodes: [episode], music: { videos: [musicVideo] } }, start)
const slot = (id, offset, durationSeconds = 60) => ({ id, sourceId: 'episode', sourceKind: 'episode', startsAt: new Date(start + offset * 1000).toISOString(), durationSeconds })
const channel = (patch = {}) => ({ id: 'channel', name: 'EBG+', description: '', enabled: true, programs: [slot('first', 0), slot('second', 60)], broadcast: { title: 'Live event', url: 'https://media.example/live.m3u8', onAir: false }, ...patch })

test('joins scheduled TV at wall-clock position and advances at the exact boundary', () => {
  assert.equal(channelNow(channel(), sources, start - 1).kind, 'offline')
  assert.equal(channelNow(channel(), sources, start + 25_000).offset, 25)
  assert.equal(channelNow(channel(), sources, start + 59_999).program.id, 'first')
  assert.equal(channelNow(channel(), sources, start + 60_000).program.id, 'second')
  assert.equal(channelNow(channel(), sources, start + 120_000).kind, 'offline')
})
test('live feed preempts TV and returns to the current program when ended or stopped', () => {
  const live = channel({ broadcast: { title: 'Event', url: 'https://media.example/live.m3u8', onAir: true, endsAt: new Date(start + 30_000).toISOString() } })
  assert.equal(channelNow(live, sources, start).kind, 'broadcast')
  assert.equal(channelNow(live, sources, start + 30_000).kind, 'scheduled')
  assert.equal(channelNow(live, sources, start + 30_000).offset, 30)
  live.broadcast.onAir = false
  assert.equal(channelNow(live, sources, start).kind, 'scheduled')
})
test('hidden channels never play; gaps stay off air', () => {
  assert.equal(channelNow(channel({ enabled: false, broadcast: { url: 'https://example.com/live', onAir: true } }), sources, start).kind, 'offline')
  assert.equal(channelNow(channel({ programs: [slot('late', 90)] }), sources, start).kind, 'offline')
})
test('unpublished, archived, future-release, removed and unsafe videos cannot air', () => {
  const videos = ['draft', 'archived', undefined, 'scheduled'].map((publishStatus, i) => ({ ...episode, id: String(i), publishStatus, releaseDate: new Date(start + 1000).toISOString() }))
  assert.deepEqual(tvSources({ episodes: videos }, start), [])
  assert.equal(tvSources({ episodes: videos }, start + 1000).length, 1)
  assert.equal(tvSources({ episodes: [{ ...episode, videoUrl: 'javascript:alert(1)' }] }, start).length, 0)
  assert.equal(channelNow(channel(), [], start).kind, 'offline')
})
test('episode and music video identifiers are namespaced', () => {
  const duplicate = tvSources({ episodes: [episode], music: { videos: [{ ...musicVideo, id: episode.id }] } }, start)
  const musicChannel = channel({ programs: [{ ...slot('music', 0), sourceKind: 'music-video' }] })
  assert.equal(channelListings(musicChannel, duplicate)[0].source.title, 'Music video')
})
test('rejects overlaps, malformed programs, duplicate IDs, and missing live feeds', () => {
  assert.throws(() => validateLiveTv({ channels: [channel({ programs: [slot('a', 0), slot('b', 59)] })] }), /overlap/)
  for (const duration of [0, -1, NaN, Infinity]) assert.throws(() => validateLiveTv({ channels: [channel({ programs: [slot('bad', 0, duration)] })] }))
  assert.throws(() => validateLiveTv({ channels: [channel({ programs: [slot('same', 0), slot('same', 60)] })] }), /unique/)
  assert.throws(() => validateLiveTv({ channels: [channel({ broadcast: { title: '', url: '', onAir: true } })] }), /Connect/)
  assert.throws(() => validateLiveTv({ channels: [channel({ broadcast: { title: '', url: 'rtmp://server/secret', onAir: false } })] }), /HTTPS/)
  assert.doesNotThrow(() => validateLiveTv({ channels: [channel()] }))
})
test('timezone offsets resolve to the same shared schedule', () => {
  const local = channel({ programs: [{ ...slot('local', 0), startsAt: '2026-10-18T19:00:00-04:00' }] })
  assert.equal(channelNow(local, sources, start + 5000).offset, 5)
})
test('only credential-free HTTPS playback URLs are accepted', () => {
  for (const url of ['rtmp://example.com/key', 'http://example.com/live', 'https://user:secret@example.com/live', 'data:video/mp4,test', 'invalid']) assert.equal(isPlaybackUrl(url), false)
  assert.equal(isPlaybackUrl('https://example.com/live.m3u8?token=public-playback'), true)
})
test('JSONB object-key ordering does not produce false conflicts or failed saves', () => {
  const config = { channels: [channel()] }
  const reordered = JSON.parse(JSON.stringify(config, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).reverse()) : item))
  assert.equal(liveTvFingerprint(config), liveTvFingerprint(reordered))
  reordered.channels[0].name = 'Changed'
  assert.notEqual(liveTvFingerprint(config), liveTvFingerprint(reordered))
})
