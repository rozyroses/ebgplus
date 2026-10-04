import assert from 'node:assert/strict'
import { AudioSizeError, encodeMonoWav, prepareLyricsAudio, transcribeUploadedAudio } from '../studio/src/lyricsAudio.ts'

const wav = new DataView(encodeMonoWav(new Float32Array([-2, -1, 0, 1, 2])))
assert.equal(wav.getUint32(24, true), 16000)
assert.equal(wav.getUint16(22, true), 1)
assert.equal(wav.getUint32(40, true), 10)
assert.equal(wav.getInt16(44, true), -32768)
assert.equal(wav.getInt16(52, true), 32767)
assert.equal(wav.byteLength, 54)

const originalFetch = globalThis.fetch
const originalContext = globalThis.OfflineAudioContext
const segments = []
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
globalThis.OfflineAudioContext = class {
  constructor(channels, frames, rate) { this.frames = frames; assert.equal(channels, 1); assert.equal(rate, 16000) }
  async decodeAudioData() { return { duration: 601 } }
  createBufferSource() { return { connect() {}, start: (when, offset, duration) => segments.push({ offset, duration }) } }
  async startRendering() { return { getChannelData: () => new Float32Array(this.frames) } }
}
try {
  const chunks = []
  for await (const chunk of prepareLyricsAudio('https://media.example/master.wav')) chunks.push(chunk)
  assert.deepEqual(segments, [{ offset: 0, duration: 300 }, { offset: 300, duration: 300 }, { offset: 600, duration: 1 }])
  assert.equal(chunks.length, 3)
  assert.ok(chunks.every(chunk => chunk.file.size < 24 * 1024 * 1024))
  const requests = [], uploads = []
  const result = await transcribeUploadedAudio({
    audioUrl: 'https://media.example/master.wav',
    transcribe: async url => {
      requests.push(url)
      if (url.endsWith('master.wav')) throw new AudioSizeError('larger than 24 MB')
      return { text: 'Words', timedLyrics: [{ start: 0, end: 3, text: 'Words' }] }
    },
    prepare: async function* () { yield* chunks },
    upload: async file => { uploads.push(file); return `https://media.example/${file.name}` },
    progress() {},
  })
  assert.equal(requests.length, 4)
  assert.equal(uploads.length, 3)
  assert.deepEqual(result.timedLyrics.map(line => [line.start, line.end]), [[0, 3], [300, 303], [600, 601]])
  assert.equal(result.text, 'Words\nWords\nWords')
  let prepared = false
  const small = { text: 'Small song' }
  assert.equal(await transcribeUploadedAudio({ audioUrl: 'small', transcribe: async () => small, upload: async () => { throw Error('unexpected upload') }, progress() {}, prepare: async function* () { prepared = true } }), small)
  assert.equal(prepared, false)
  await assert.rejects(transcribeUploadedAudio({ audioUrl: 'private', transcribe: async () => { throw Error('staff access required') }, upload: async () => '', progress() {}, prepare: async function* () { prepared = true } }), /staff access/)
  assert.equal(prepared, false)
} finally {
  globalThis.fetch = originalFetch
  globalThis.OfflineAudioContext = originalContext
}
console.log('Large audio is downmixed into bounded WAV parts; timestamps join correctly, small files and authorization errors avoid conversion.')
