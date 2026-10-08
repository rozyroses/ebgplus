import assert from 'node:assert/strict'
import { encodePcm24, peakGain, ceilingAmplitude } from '../studio/src/audioMastering.ts'
import { cleanLinkSlug, brandedReleaseLink, streamingRoute } from '../studio/src/streamingLinks.ts'
const channels=[new Float32Array([-1,-0.5,0,0.5,1]),new Float32Array([1,0.5,0,-0.5,-1])]
const output=encodePcm24(channels,48000),view=new DataView(output)
assert.equal(new TextDecoder().decode(new Uint8Array(output,0,4)),'RIFF')
assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint16(34,true),24);assert.equal(view.getUint32(40,true),30)
assert.equal(view.getUint8(44),0);assert.equal(view.getUint8(46),128)
const odd=encodePcm24([new Float32Array([0])],44100);assert.equal(odd.byteLength,48);assert.equal(new DataView(odd).getUint32(40,true),3)
assert.equal(peakGain([new Float32Array(4)]),1)
assert.equal(peakGain([new Float32Array([0.0001])]),4)
assert.ok(Math.abs(peakGain(channels)-ceilingAmplitude)<1e-6)
assert.throws(()=>encodePcm24([new Float32Array([NaN])],44100));assert.throws(()=>peakGain([new Float32Array([Infinity])]))
assert.throws(()=>encodePcm24([new Float32Array(1),new Float32Array(2)],44100))
for(const invalid of ['../admin','artist/<script>','a','artist/name/third','https://evil.test','a'.repeat(61)])assert.equal(cleanLinkSlug(invalid),'')
assert.equal(cleanLinkSlug('BijouNicole/step-on-up'),'bijounicole/step-on-up')
assert.equal(brandedReleaseLink('bijounicole/step-on-up'),'https://streaming.ebgplus.app/bijounicole/step-on-up')
console.log('24-bit PCM structure, samples, peak ceiling, silence handling and custom link validation passed.')

assert.equal(streamingRoute('streaming.ebgplus.app','/bijounicole'),'bijounicole')
assert.equal(streamingRoute('streaming.ebgplus.app','/bijounicole/step-on-up/'),'bijounicole/step-on-up')
assert.equal(streamingRoute('streaming.ebgplus.app','/'),'')
assert.equal(streamingRoute('studio.ebgplus.app','/stream/bijounicole/step-on-up'),'bijounicole/step-on-up')
assert.equal(streamingRoute('studio.ebgplus.app','/'),null)
assert.equal(streamingRoute('streaming.ebgplus.app.evil.test','/bijounicole'),null)
assert.equal(streamingRoute('streaming.ebgplus.app','/%E0%A4%A'),'__invalid__')
console.log('Streaming domain, clean paths, legacy URLs and Studio isolation checks passed.')
