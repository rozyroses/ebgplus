import { useState } from 'react'
import { Link } from 'react-router-dom'

type MovieTitle = { id: string; title: string; description: string; category: string; genre: string; artwork: string; banner?: string; year: number; maturity: string; status: string; homeVisible?: boolean }
export default function MoviesPage({ cms }: { cms: { shows: MovieTitle[] } }) {
  const [genre, setGenre] = useState('All')
  const [search, setSearch] = useState('')
  const movies = cms.shows.filter(show => show.homeVisible !== false && /movie|film|special|documentary/i.test(show.category))
  const genres = ['All', ...new Set(movies.map(show => show.genre).filter(Boolean))]
  const visible = movies.filter(show => (genre === 'All' || show.genre === genre) && `${show.title} ${show.description}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="page movies-library"><header className="movies-library-heading"><p className="eyebrow">THE EBG+ COLLECTION</p><h1>Make it a movie night.</h1><p>Films, documentaries, and specials. Find your next story.</p></header><div className="movies-library-tools"><label>Find a title<input type="search" placeholder="Search movies & specials" value={search} onChange={event => setSearch(event.target.value)} /></label><label>Genre<select value={genre} onChange={event => setGenre(event.target.value)}>{genres.map(value => <option key={value}>{value}</option>)}</select></label></div>{visible.length ? <div className="movies-library-grid">{visible.map(movie => <Link to={`/app/shows/${movie.id}`} className="movie-library-card" key={movie.id}><div>{movie.artwork || movie.banner ? <img src={movie.artwork || movie.banner} alt="" loading="lazy" /> : <strong>{movie.title}</strong>}<span>{movie.status}</span></div><p>{movie.genre} · {movie.year} · {movie.maturity}</p><h2>{movie.title}</h2></Link>)}</div> : <section className="movies-library-empty"><span aria-hidden="true">▷</span><h2>{movies.length ? 'No titles match that search.' : 'The collection is growing.'}</h2><p>{movies.length ? 'Try another title or genre.' : 'New films and specials will appear here as they’re added to EBG+.'}</p><Link className="btn muted" to="/app/shows">Explore shows</Link></section>}</main>
}
