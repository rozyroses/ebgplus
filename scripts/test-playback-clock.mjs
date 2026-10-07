import assert from 'node:assert/strict'
import { advancePlaybackClock } from '../src/lib/playbackClock.ts'
const clock = { seconds: 0, last: 0 }
advancePlaybackClock(clock,1000)
assert.equal(clock.seconds,1)
clock.last=null
advancePlaybackClock(clock,100000)
assert.equal(clock.seconds,1,'Paused time is excluded')
clock.last=100000
advancePlaybackClock(clock,101000)
assert.equal(clock.seconds,2,'Resume counts only playing time')
advancePlaybackClock(clock,500000)
assert.equal(clock.seconds,7,'Suspended tabs cannot contribute long gaps')
advancePlaybackClock(clock,499000)
assert.equal(clock.seconds,7,'Clock cannot reduce played seconds')
console.log('Playback clock excludes pauses and bounds suspended-tab gaps. Seeking never supplies media position to the clock.')
