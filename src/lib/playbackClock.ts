export type PlaybackClock = { seconds: number; last: number | null }
export function advancePlaybackClock(clock: PlaybackClock, now: number) {
  if (clock.last === null) return
  clock.seconds += Math.min(5, Math.max(0, (now - clock.last) / 1000))
  clock.last = now
}
