import { Link } from 'react-router-dom'
import { useMusicCollection } from './MusicCollectionContext'

export default function PlaylistTrackPicker({ trackId, onNavigate }: { trackId: string; onNavigate?: () => void }) {
  const collection = useMusicCollection()
  if (!collection) return null
  const playlists = collection.rows.filter(row => row.kind==='playlist')
  return <details className="playlist-track-picker"><summary>Add to playlist</summary><div>
    {playlists.length ? <label>Choose a cassette<select aria-label="Choose a playlist" value="" disabled={!collection.ready || collection.busy} onChange={event => { if (event.target.value) void collection.act('playlist',event.target.value,'add_track',{trackId}) }}><option value="">Choose a playlist</option>{playlists.map(row => <option key={row.item_id} value={row.item_id} disabled={row.data.trackIds?.includes(trackId)}>{row.data.title}{row.data.trackIds?.includes(trackId) ? ' · already added' : ''}</option>)}</select></label> : <p>No playlists yet.</p>}
    <Link to="/app/music/collection" onClick={onNavigate}>Create or edit playlists</Link>
    {collection.error && <p role="alert">{collection.error}</p>}
  </div></details>
}
