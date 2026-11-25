import { db } from './supabase'
import { readStoredSession } from './auth'

export type CollectionKind = 'album' | 'favorite' | 'playlist' | 'recent'
export type CassetteTone = 'lavender' | 'rose' | 'sage' | 'blue' | 'honey'
export type CollectionItem = { account_id: string; kind: CollectionKind; item_id: string; data: { title?: string; tone?: CassetteTone; trackIds?: string[] }; updated_at: string }
export type CollectionAction = 'save' | 'remove' | 'create' | 'rename' | 'add_track' | 'remove_track' | 'move_track' | 'import'
export type CollectionTransport = {
  load: (accountId: string) => Promise<CollectionItem[]>
  mutate: (accountId: string,kind: CollectionKind,id: string,action: CollectionAction,data: Record<string,unknown>) => Promise<CollectionItem[]>
}
function sessionFor(accountId: string) {
  const session = readStoredSession()
  if (!session || session.user.id !== accountId) throw new Error('Sign in again to load your music collection.')
  return session
}
export const musicCollectionTransport: CollectionTransport = {
  load: accountId => db.select<CollectionItem>('music_collection_items',`account_id=eq.${encodeURIComponent(accountId)}&order=updated_at.desc,item_id.asc&limit=5000`,sessionFor(accountId).access_token),
  mutate: (accountId,kind,id,action,data) => db.rpc<CollectionItem[]>('music_collection_mutate',{ p_kind:kind,p_id:id,p_action:action,p_data:data },sessionFor(accountId).access_token),
}
