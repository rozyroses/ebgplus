import assert from 'node:assert/strict'
import { test } from 'node:test'
import { channelNow, channelListings, channelQueue, normalizeLiveTvConfig, runtimeSeconds, isPlaybackUrl, liveTvFingerprint, tvSources, validateLiveTv } from '../src/lib/liveTv.ts'

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


const looping = (patch = {}) => channel({ playbackMode: 'playlist', playlist: { startsAt: new Date(start).toISOString(), items: [
  { id: 'first', sourceId: 'episode', sourceKind: 'episode', durationSeconds: 60 },
  { id: 'second', sourceId: 'music', sourceKind: 'music-video', durationSeconds: 90 },
] }, ...patch })
test('looping playlists advance in order and repeat indefinitely from a shared clock', () => {
  const loop = looping()
  assert.equal(channelNow(loop, sources, start - 1).kind, 'offline')
  const joined = channelNow(loop, sources, start + 25000)
  assert.equal(joined.kind, 'playlist'); assert.equal(joined.program.id, 'first'); assert.equal(joined.offset, 25)
  assert.equal(channelNow(loop, sources, start + 60000).program.id, 'second')
  assert.equal(channelNow(loop, sources, start + 149999).program.id, 'second')
  const repeat = channelNow(loop, sources, start + 150000)
  assert.equal(repeat.program.id, 'first'); assert.equal(repeat.offset, 0); assert.equal(repeat.start, start + 150000)
  const later = channelNow(loop, sources, start + 150000 * 10000 + 65000)
  assert.equal(later.program.id, 'second'); assert.equal(later.offset, 5)
  assert.deepEqual(channelNow(structuredClone(loop), sources, start + 65000), channelNow(loop, sources, start + 65000))
})
test('playlist guide crosses repeat boundaries and a single video repeats at a new occurrence', () => {
  const queue = channelQueue(looping(), sources, start + 140000, 4)
  assert.deepEqual(queue.map(item => item.program.id), ['second', 'first', 'second', 'first'])
  assert.equal(queue[0].start, start + 60000); assert.equal(queue[1].start, start + 150000)
  assert.ok(queue.every((item, index) => !index || item.start === queue[index - 1].end))
  const single = looping(); single.playlist.items = [single.playlist.items[0]]
  const before = channelNow(single, sources, start + 59999)
  const after = channelNow(single, sources, start + 60000)
  assert.equal(before.src, after.src); assert.notEqual(before.start, after.start); assert.equal(after.offset, 0)
})
test('playlist skips unavailable videos, stays off air if empty or hidden, and handles future starts', () => {
  assert.equal(channelNow(looping({ enabled: false }), sources, start).kind, 'offline')
  assert.equal(channelNow(looping(), [], start).kind, 'offline')
  const empty = looping(); empty.playlist.items = []
  assert.equal(channelNow(empty, sources, start).kind, 'offline'); assert.deepEqual(channelQueue(empty, sources, start), [])
  const playable = sources.filter(source => source.sourceKind === 'music-video')
  assert.equal(channelNow(looping(), playable, start).program.id, 'second')
  assert.equal(channelNow(looping(), playable, start + 90000).offset, 0)
  const future = channelQueue(looping(), sources, start - 10000, 2)
  assert.equal(future[0].start, start); assert.equal(channelNow(looping(), sources, start - 10000).kind, 'offline')
})
test('live takeover returns to the current playlist position when it ends', () => {
  const live = looping({ broadcast: { title: 'Live', url: 'https://media.example/live.m3u8', onAir: true, endsAt: new Date(start + 70000).toISOString() } })
  assert.equal(channelNow(live, sources, start + 65000).kind, 'broadcast')
  const resumed = channelNow(live, sources, start + 70000)
  assert.equal(resumed.kind, 'playlist'); assert.equal(resumed.program.id, 'second'); assert.equal(resumed.offset, 10)
})
test('fractional video lengths preserve exact boundaries without accumulating whole-second gaps', () => {
  const loop = looping(); loop.playlist.items[0].durationSeconds = 2.125; loop.playlist.items[1].durationSeconds = 3.25
  assert.equal(channelNow(loop, sources, start + 2124).program.id, 'first')
  assert.equal(channelNow(loop, sources, start + 2125).program.id, 'second')
  assert.equal(channelNow(loop, sources, start + 5375).program.id, 'first')
  assert.equal(channelNow(loop, sources, start + 5375 * 1000).offset, 0)
})
test('playlist settings survive normalization and reject malformed lengths, IDs, and mode', () => {
  const config = { channels: [looping()] }
  assert.deepEqual(normalizeLiveTvConfig(config), config)
  const jsonbItems = JSON.parse(JSON.stringify(config.channels[0].playlist.items, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).reverse()) : item))
  assert.equal(liveTvFingerprint(config.channels[0].playlist.items), liveTvFingerprint(jsonbItems))
  for (const seconds of [0, -1, Infinity, NaN, 86401]) {
    const bad = structuredClone(config); bad.channels[0].playlist.items[0].durationSeconds = seconds
    assert.throws(() => normalizeLiveTvConfig(bad), /duration/)
  }
  for (const patch of [{ playbackMode: 'random' }, { playlist: { startsAt: 'bad', items: [] } }, { playlist: null }]) assert.throws(() => normalizeLiveTvConfig({ channels: [looping(patch)] }))
  const duplicate = structuredClone(config); duplicate.channels[0].playlist.items[1].id = 'first'
  assert.throws(() => normalizeLiveTvConfig(duplicate), /unique/)
  const reordered = structuredClone(config); reordered.channels[0].playlist.items.reverse()
  assert.notEqual(liveTvFingerprint(config), liveTvFingerprint(reordered))
})
test('catalog runtime fallback accepts common video formats and rejects ambiguous values', () => {
  for (const [value, seconds] of [['42 min', 2520], ['22.5m', 1350], ['20s', 20], ['1h 30m', 5400], ['3:25', 205], ['1:02:03', 3723]]) assert.equal(runtimeSeconds(value), seconds)
  for (const value of ['', 'unknown', '42', '2:99', 'live', 'about 10m']) assert.equal(runtimeSeconds(value), undefined)
})
