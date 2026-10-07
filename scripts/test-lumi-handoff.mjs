import assert from 'node:assert/strict'
import { applyLumiHandoff } from '../studio/src/lumiHandoff.ts'

const cms = { heroShowId: 'show', shows: [{ id: 'show', title: 'Show', artwork: 'old', status: 'Live' }], episodes: [{ id: 'episode', title: 'Episode', synopsis: 'old', publishStatus: 'scheduled' }], music: { tracks: [{ id: 'track' }], releases: [{ id: 'release', title: 'Release', publishStatus: 'draft' }] } }
const image = 'https://example.com/artwork.png'
for (const destination of ['poster', 'banner', 'logo']) {
  const next = applyLumiHandoff(cms, destination, 'show', image)
  assert.equal(next.shows[0].status, 'Live')
  assert.equal(next.episodes, cms.episodes)
  assert.equal(next.music, cms.music)
}
const cover = applyLumiHandoff(cms, 'cover', 'release', image)
assert.equal(cover.music.releases[0].cover, image)
assert.equal(cover.music.releases[0].publishStatus, 'draft')
assert.equal(cover.music.tracks, cms.music.tracks)
const synopsis = applyLumiHandoff(cms, 'synopsis', 'episode', ' New synopsis ')
assert.equal(synopsis.episodes[0].synopsis, 'New synopsis')
assert.equal(synopsis.episodes[0].publishStatus, 'scheduled')
assert.equal(cms.episodes[0].synopsis, 'old')
assert.equal(applyLumiHandoff(cms, 'thumbnail', 'episode', image).episodes[0].thumbnail, image)
assert.equal(applyLumiHandoff(cms, 'description', 'show', 'Copy').shows[0].description, 'Copy')
assert.throws(() => applyLumiHandoff(cms, 'poster', 'missing', image))
assert.throws(() => applyLumiHandoff(cms, 'poster', 'show', 'javascript:alert(1)'))
assert.throws(() => applyLumiHandoff(cms, 'poster', 'show', 'http://example.com/art.png'))
assert.throws(() => applyLumiHandoff(cms, 'description', 'show', '  '))
console.log('Lumi handoffs preserve unrelated content and release state; missing targets and unsafe images are rejected.')
