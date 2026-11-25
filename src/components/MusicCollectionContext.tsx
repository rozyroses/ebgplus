import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { musicCollectionTransport } from '../lib/musicCollectionData'
import type { CollectionAction, CollectionItem, CollectionKind, CollectionTransport } from '../lib/musicCollectionData'

type Collection = { rows: CollectionItem[]; loading: boolean; busy: boolean; ready: boolean; error: string; refresh: () => Promise<void>; act: (kind: CollectionKind,id: string,action: CollectionAction,data?: Record<string,unknown>) => Promise<boolean> }
const Context = createContext<Collection | null>(null)
export const useMusicCollection = () => useContext(Context)
export function MusicCollectionProvider({ accountId, children, transport = musicCollectionTransport }: { accountId: string; children: ReactNode; transport?: CollectionTransport }) {
  const [rows,setRows] = useState<CollectionItem[]>([])
  const [loading,setLoading] = useState(true)
  const [ready,setReady] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const active = useRef(true)
  const pending = useRef(0)
  const revision = useRef(0)
  const readNumber = useRef(0)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const refresh = useCallback(async () => {
    if (pending.current) return
    const version = revision.current, read = ++readNumber.current
    try {
      const next = await transport.load(accountId)
      if (active.current && version===revision.current && read===readNumber.current) { setRows(next); setReady(true); setError('') }
    } catch (cause) {
      if (active.current && version===revision.current && read===readNumber.current) setError(cause instanceof Error ? cause.message : 'Your collection could not load. Try again.')
    } finally { if (active.current) setLoading(false) }
  },[accountId,transport])
  const act = useCallback((kind: CollectionKind,id: string,action: CollectionAction,data: Record<string,unknown> = {}): Promise<boolean> => {
    revision.current++; pending.current++; setBusy(true); setError('')
    const result = queue.current.catch(() => undefined).then(async () => {
      if (!active.current) return false
      try {
        const next = await transport.mutate(accountId,kind,id,action,data)
        if (active.current) { setRows(next); setReady(true) }
        return true
      } catch (cause) {
        if (active.current) setError(cause instanceof Error ? cause.message : 'That change could not be saved. Try again.')
        return false
      } finally { pending.current--; if (active.current) setBusy(pending.current>0) }
    })
    queue.current=result
    return result
  },[accountId,transport])
  useEffect(() => {
    active.current=true
    void refresh()
    const sync = () => { if (document.visibilityState==='visible') void refresh() }
    const timer=window.setInterval(sync,30000)
    window.addEventListener('focus',sync); window.addEventListener('online',sync); document.addEventListener('visibilitychange',sync)
    return () => { active.current=false; window.clearInterval(timer); window.removeEventListener('focus',sync); window.removeEventListener('online',sync); document.removeEventListener('visibilitychange',sync) }
  },[refresh])
  return <Context.Provider value={{ rows,loading,busy,ready,error,refresh,act }}>{children}</Context.Provider>
}
export function CollectionStatus() {
  const collection=useMusicCollection()
  if (!collection) return null
  return <div className="collection-status">{collection.loading ? <p role="status">Opening your collection…</p> : collection.error ? <p role="alert">{collection.error} <button type="button" onClick={() => void collection.refresh()}>Retry</button></p> : collection.busy ? <p role="status">Saving your collection…</p> : <p>Private to your account · saved across your devices</p>}</div>
}
