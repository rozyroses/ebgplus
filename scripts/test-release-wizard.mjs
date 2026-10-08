import assert from 'node:assert/strict'
import { assertReleaseAudio, attachReleaseTracks } from '../studio/src/releaseWizard.ts'
assert.doesNotThrow(() => assertReleaseAudio('draft',[]))
assert.throws(() => assertReleaseAudio('live',[]),/Upload audio/)
assert.throws(() => assertReleaseAudio('scheduled',[{audioUrl:''}]),/Upload audio/)
assert.throws(() => assertReleaseAudio('live',[{audioUrl:'javascript:alert(1)'}]),/Upload audio/)
const lines=[{start:1,end:3,text:'A lyric'}]
const pending=[{id:'new-song',artistId:'old',audioUrl:'https://media.test/song.wav',timedLyrics:lines}]
assert.doesNotThrow(() => assertReleaseAudio('live',pending))
const unrelated={id:'other-song',artistId:'other',releaseId:'other-release'}
const result=attachReleaseTracks([unrelated,{id:'removed',artistId:'old',releaseId:'release'}],pending,'release','artist')
assert.equal(result[0],unrelated)
assert.equal(result[1].releaseId,'release')
assert.equal(result[1].artistId,'artist')
assert.equal(result[1].timedLyrics,lines)
assert.equal(pending[0].releaseId,undefined)
assert.ok(!result.some(track => track.id==='removed'))
console.log('The release wizard attaches audio and timed lyrics together and blocks publishing without playable audio.')
