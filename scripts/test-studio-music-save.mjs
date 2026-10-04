import assert from 'node:assert/strict'
import { mergeMusicEdits } from '../studio/src/mergeMusicEdits.ts'
const base = { artists: [], releases: [], videos: [], tracks: [{ id: 'song', audioUrl: 'stereo.mp3', lyrics: 'old', losslessUrl: '' }] }
const desired = { ...base, tracks: [{ ...base.tracks[0], losslessUrl: 'master.flac' }] }
const latest = { ...base, tracks: [{ ...base.tracks[0], lyrics: 'new lyrics' }, { id: 'remote-song' }] }
const saved = mergeMusicEdits(base, desired, latest)
assert.equal(saved.tracks[0].lyrics, 'new lyrics')
assert.equal(saved.tracks[0].losslessUrl, 'master.flac')
assert.equal(saved.tracks.length, 2)
assert.equal(mergeMusicEdits(base, desired, { ...base, tracks: [] }).tracks.length, 0)
assert.equal(mergeMusicEdits(base, { ...desired, tracks: [{ ...desired.tracks[0], losslessUrl: '' }] }, { ...latest, tracks: [{ ...latest.tracks[0], losslessUrl: 'existing.flac' }] }).tracks[0].losslessUrl, 'existing.flac')
assert.equal(mergeMusicEdits({ ...base, tracks: [{ ...base.tracks[0], losslessUrl: 'existing.flac' }] }, { ...base, tracks: [{ ...base.tracks[0], losslessUrl: '' }] }, { ...latest, tracks: [{ ...latest.tracks[0], losslessUrl: 'existing.flac' }] }).tracks[0].losslessUrl, '')
console.log('Studio saves preserve remote lyrics, additions, deletions, and intentional source removal.')
