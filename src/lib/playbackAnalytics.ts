import { advancePlaybackClock } from './playbackClock'
import { useEffect, useRef } from 'react'
import { db } from './supabase'
import { readStoredSession } from './auth'

export function usePlaybackAnalytics(id: string | undefined, title: string | undefined, kind: 'video' | 'music') {
  const current = useRef<{ id: string; contentId: string; title: string; accountId: string; token: string; seconds: number; last: number | null; completed: boolean } | null>(null)
  const flush = () => {
    const row = current.current
    if (!row) return
    void db.rpc('record_playback_session', { p_id: row.id, p_content_id: row.contentId, p_kind: kind, p_title: row.title, p_seconds: Math.floor(row.seconds), p_completed: row.completed }, row.token).catch(() => { /* Analytics never interrupts playback. */ })
  }
  const tick = () => {
    const row = current.current
    if (!row || row.last === null) return
    advancePlaybackClock(row, performance.now())
  }
  const pause = () => { tick(); if (current.current) current.current.last = null; flush() }
  useEffect(() => {
    current.current = null
    let ticks = 0
    const timer = setInterval(() => { tick(); if (++ticks % 15 === 0) flush() }, 1000)
    const hide = () => { if (document.visibilityState === 'hidden') { tick(); flush() } }
    window.addEventListener('pagehide', pause); document.addEventListener('visibilitychange', hide)
    return () => { pause(); current.current = null; clearInterval(timer); window.removeEventListener('pagehide', pause); document.removeEventListener('visibilitychange', hide) }
  }, [id, kind])
  return {
    onPlaying: () => {
      const session = readStoredSession()
      if (!session || !id) return
      if (!current.current || current.current.accountId !== session.user.id || current.current.completed) {
        current.current = { id: crypto.randomUUID(), contentId: id, title: (title || 'Untitled').slice(0,300), accountId: session.user.id, token: session.access_token, seconds: 0, last: null, completed: false }
        flush()
      }
      current.current.token = session.access_token
      current.current.last = performance.now()
    },
    onPause: pause,
    onWaiting: pause,
    onEnded: () => { tick(); if (current.current) { current.current.completed = true; current.current.last = null }; flush() },
  }
}
