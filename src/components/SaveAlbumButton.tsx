import { useMusicCollection } from './MusicCollectionContext'

export default function SaveAlbumButton({ albumId }: { albumId: string }) {
  const collection=useMusicCollection()
  if (!collection) return null
  const saved=collection.rows.some(row => row.kind==='album' && row.item_id===albumId)
  return <button type="button" className="btn muted collection-save-album" aria-pressed={saved} disabled={!collection.ready || collection.busy} onClick={() => void collection.act('album',albumId,saved ? 'remove' : 'save')}>{saved ? '♥ Album saved' : '♡ Save album'}</button>
}
