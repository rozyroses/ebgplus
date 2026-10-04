import assert from 'node:assert/strict'
import { catalogTrack, nextQueueIndex, selectSource, sourceSupported } from '../src/lib/musicPlayback.ts'

const song = catalogTrack({ id: 'song', title: 'Test', audioUrl: 'https://media.example/song.mp3', losslessUrl: 'https://media.example/master.flac', atmosUrl: 'https://media.example/atmos.mp4' }, 'Artist')
assert.deepEqual(song.sources.map(source => source.quality), ['standard', 'lossless', 'atmos'])
assert.equal(selectSource(song.sources, 'auto', [true, true, false]).quality, 'lossless')
assert.equal(selectSource(song.sources, 'auto', [true, true, true]).quality, 'atmos')
assert.equal(selectSource(song.sources, 'atmos', [true, true, false]).quality, 'standard')
assert.equal(selectSource(song.sources, 'lossless', [false, false, false]), null)
assert.equal(catalogTrack({ audioUrl: 'https://media.example/song.mp3', losslessUrl: 'https://media.example/song.mp3' }, '').sources.length, 1)
assert.equal(catalogTrack({ losslessUrl: 'https://media.example/song.mp3', losslessMimeType: 'audio/flac', atmosUrl: 'https://media.example/song.mp3' }, '').sources.length, 0)
assert.equal(catalogTrack({ audioUrl: 'javascript:alert(1)' }, '').sources.length, 0)
assert.equal(catalogTrack({ audioUrl: 'https://media.example/master.flac?token=test' }, '').sources[0].quality, 'lossless')
assert.equal(nextQueueIndex(3, 2, 'off', false), null)
assert.equal(nextQueueIndex(3, 2, 'all', false), 0)
assert.equal(nextQueueIndex(3, 1, 'one', false), 1)
assert.notEqual(nextQueueIndex(3, 1, 'off', true, () => 0.5), 1)
assert.equal(nextQueueIndex(0, 0, 'all', true), null)

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
let checkedConfig
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaCapabilities: { decodingInfo: async config => { checkedConfig = config; return { supported: true } } } } })
const media = { canPlayType: type => type === 'audio/flac' ? 'probably' : '' }
assert.equal(await sourceSupported(song.sources[1], media), true)
assert.equal(await sourceSupported(song.sources[2], media), true)
assert.equal(checkedConfig.audio.spatialRendering, true)
assert.equal(checkedConfig.type, 'file')
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} })
assert.equal(await sourceSupported(song.sources[2], media), false, 'Never infer spatial support from EC-3 decoding alone')
if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
else delete globalThis.navigator
console.log('Music source selection, spatial capability checks, safe URLs, and queue behavior passed.')
