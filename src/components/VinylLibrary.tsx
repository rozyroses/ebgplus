import { Link } from 'react-router-dom'
import { playMusicAlbum } from './MusicPlayer'

import type { LibraryAlbum } from '../lib/musicCatalog'

export default function VinylLibrary({ albums, query, favorites, favoritesOnly, compact = false }: {
  albums: LibraryAlbum[]
  query: string
  favorites: string[]
  compact?: boolean
  favoritesOnly: boolean
}) {
  const search = query.trim().toLowerCase()
  const visible = albums.filter(album =>
    `${album.title} ${album.artist} ${album.tracks.map(track => track.title).join(' ')}`.toLowerCase().includes(search)
    && (!favoritesOnly || album.tracks.some(track => favorites.includes(track.id))))

  return <section className="vinyl-library" aria-labelledby={compact ? 'saved-albums-title' : 'vinyl-library-title'}>
    {!compact && <div className="vinyl-library-heading">
      <div><p className="eyebrow">THE EBG+ COLLECTION</p><h1 id="vinyl-library-title">Pick a record.<br /><span>Make yourself at home.</span></h1></div>
      <p>Your music, a little more hands-on.<br />Choose an album spine to drop the needle.</p>
    </div>}
    <div className="vinyl-shelf-heading"><h2 id={compact ? 'saved-albums-title' : undefined}>{compact ? 'Saved albums' : 'Music library'}</h2><span>{visible.length} {visible.length === 1 ? 'record' : 'records'}</span></div>
    {visible.length ? <>
      <div className="vinyl-shelf" role="group" aria-label="Album shelf. Scroll to browse; select a spine to play.">
        {visible.map((album, index) => {
          const playable = album.tracks.some(track => track.sources.length)
          const content = <>
            <span className="vinyl-case-spine"><span className="vinyl-spine-mark" aria-hidden="true">ebg+</span><strong>{album.title}</strong><small>{album.artist}</small><span className="vinyl-spine-dot" aria-hidden="true" /></span>
            <span className="vinyl-case-cover">{album.cover ? <img src={album.cover} alt="" loading="lazy" /> : <span className="vinyl-cover-fallback"><strong>{album.title}</strong><small>{album.artist}</small></span>}<span className="vinyl-case-hint">{playable ? 'Open & play' : 'View album'}</span></span>
          </>
          const className = `vinyl-case vinyl-case-tone-${index % 5}`
          return playable ? <button key={album.id} type="button" className={className} aria-label={`Open and play ${album.title} by ${album.artist}`} title={`${album.title} · ${album.artist}`} onClick={() => playMusicAlbum(album)}>{content}</button>
            : album.releaseId ? <Link key={album.id} className={className} to={`/app/music/release/${album.releaseId}`} aria-label={`View ${album.title} by ${album.artist}`}>{content}</Link>
              : <button key={album.id} type="button" className={className} disabled aria-label={`${album.title} — audio unavailable`}>{content}</button>
        })}
      </div>
      <p className="vinyl-shelf-caption"><span aria-hidden="true">♫</span> Browse the spines. Open a sleeve. Let it play.</p>
    </> : <div className="vinyl-library-empty"><h3>{albums.length ? 'No records match.' : compact ? 'Your record shelf is waiting.' : 'Your collection starts here.'}</h3><p>{albums.length ? 'Try another album, song, or artist, or turn off Favorites.' : compact ? 'Save an album from the listening room to keep it here.' : 'Published music from EBG Studio will appear on this shelf.'}</p></div>}
  </section>
}
