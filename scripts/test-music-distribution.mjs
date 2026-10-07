import assert from 'node:assert/strict'
import { cleanPlatformLinks, publicReleaseId, releaseLink, distributionMissing, emptyDistribution } from '../studio/src/musicDistribution.ts'
assert.deepEqual(cleanPlatformLinks({ spotify: 'https://open.spotify.com/album/abc', apple: '' }), { spotify: 'https://open.spotify.com/album/abc' })
for (const value of ['javascript:alert(1)', 'https://open.spotify.com.evil.test/album/abc', 'https://user:pass@open.spotify.com/album/abc', 'http://open.spotify.com/album/abc']) assert.throws(() => cleanPlatformLinks({ spotify: value }))
const pid = '00000000-0000-0000-0000-000000000001'
assert.equal(publicReleaseId(pid, 'release'), `project-${pid}-release`)
const lumi = `lumi-${pid.replaceAll('-', '')}-release`
assert.equal(publicReleaseId(pid, lumi), lumi)
assert.ok(releaseLink(pid, 'title / test').includes('title%20%2F%20test'))
assert.ok(distributionMissing({}, [], emptyDistribution()).includes('Audio for every track'))
assert.deepEqual(distributionMissing({ cover: 'cover', genre: 'R&B', releaseDate: '2026-10-07' }, [{ audioUrl: 'audio', losslessUrl: 'master' }], { ...emptyDistribution(), copyright: 'Artist', recordingRights: 'Artist', credits: 'Writer', rightsConfirmed: true }), [])
console.log('Distribution link validation, public IDs and basic readiness checks passed.')
