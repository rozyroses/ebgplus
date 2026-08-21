import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE147_UNIVERSAL_SHOW_EXPERIENCE')) process.exit(0)

const universalShowExperience = `function ShowPage({
  cms,
  profile,
  playback,
  onToggleWatchlist,
}: {
  cms: CmsData
  profile: Profile
  playback: Record<string, number>
  onToggleWatchlist: (showId: string) => void
}) {
  const { showId } = useParams()
  const show = cms.shows.find((entry) => entry.id === showId)
  const [season, setSeason] = useState(1)
  if (!show) return <NotFoundPage />

  const allEpisodes = cms.episodes
    .filter((episode) => episode.showId === show.id)
    .sort((a, b) => a.season - b.season || a.number - b.number)
  const releasedEpisodes = allEpisodes.filter((episode) => isEpisodeReleased(episode))
  const seasons = Array.from(new Set(allEpisodes.map((episode) => episode.season))).sort((a, b) => a - b)
  const selectedSeason = seasons.includes(season) ? season : seasons[0] ?? 1
  const seasonEpisodes = allEpisodes.filter((episode) => episode.season === selectedSeason)
  const firstReleased = releasedEpisodes[0]
  const newestReleased = [...releasedEpisodes].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0]

  const episodeBadge = (episode: Episode) => {
    if (!isEpisodeReleased(episode)) return 'Coming soon'
    const age = Date.now() - new Date(episode.releaseDate).getTime()
    return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000 ? 'New episode' : ''
  }

  return (
    <main className="page show-page heartspell-page universal-show-page">
      <section className="heartspell-hero" style={{ backgroundImage: `url(${show.banner || show.artwork})` }}>
        <div className="heartspell-hero-content">
          <p className="heartspell-kicker">{show.category || 'EBG+'}</p>
          {show.logoImage ? <img className="show-logo-image" src={show.logoImage} alt={`${show.title} logo`} /> : <h1 className="heartspell-title">{show.logo || show.title}</h1>}
          <div className="heartspell-meta"><span>{show.year}</span><span>{show.maturity}</span><span>{show.status}</span><span>{show.genre}</span></div>
          <p className="heartspell-description">{show.description}</p>
          <div className="actions">
            {firstReleased ? <Link className="btn" to={`/app/watch/${firstReleased.id}`}>▶ Watch Now</Link> : <Link className="btn" to="/app/shows">Browse EBG+</Link>}
            <button className="btn muted" onClick={() => onToggleWatchlist(show.id)}>{profile.watchlist.includes(show.id) ? '✓ In My List' : '+ My List'}</button>
          </div>
        </div>
      </section>

      {allEpisodes.length > 0 ? (
        <section className="heartspell-section">
          <div className="heartspell-section-head">
            <div><p className="heartspell-kicker">Watch now</p><h2>{seasons.length > 1 ? 'Episodes' : 'Episodes & Video'}</h2></div>
            {seasons.length > 1 && <div className="heartspell-season-tabs">{seasons.map((item) => <button key={item} className={item === selectedSeason ? 'active' : ''} onClick={() => setSeason(item)}>Season {item}</button>)}</div>}
          </div>
          <div className="heartspell-episode-grid">
            {seasonEpisodes.map((episode) => {
              const badge = episodeBadge(episode)
              const released = isEpisodeReleased(episode)
              return (
                <article key={episode.id} className="heartspell-episode">
                  <div className="heartspell-episode-media">
                    <img src={episode.thumbnail} alt={`Episode ${episode.number}: ${episode.title}`} loading="lazy" />
                    {badge && <span className={`heartspell-badge ${released ? 'new' : 'soon'}`}>{badge}</span>}
                  </div>
                  <div className="heartspell-episode-body">
                    <p className="heartspell-kicker">S{episode.season} · E{episode.number} · {episode.runtime}</p>
                    <h3>{episode.title}</h3>
                    <p>{episode.synopsis}</p>
                    {released ? <Link to={`/app/watch/${episode.id}`}>{(playback[episode.id] ?? 0) > 0 ? 'Resume →' : 'Watch →'}</Link> : <span>Premieres {new Date(episode.releaseDate).toLocaleDateString()}</span>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="heartspell-section">
        <div className="heartspell-section-head"><div><p className="heartspell-kicker">Meet the cast</p><h2>Cast</h2></div>{show.cast.length > 0 && <p>{show.cast.length} cast member{show.cast.length === 1 ? '' : 's'}</p>}</div>
        {show.cast.length > 0 ? (
          <div className="heartspell-cast-grid">
            {show.cast.map((person, index) => (
              <article key={`${person.name}-${index}`} className="heartspell-cast-card">
                {person.image ? <img className="heartspell-cast-photo" src={person.image} alt={person.name} loading="lazy" /> : <div className="heartspell-cast-fallback">{person.name.slice(0,1)}</div>}
                <div className="heartspell-cast-gradient" />
                <div className="heartspell-cast-copy"><h3>{person.name}</h3><p>{person.city}{person.status ? ` · ${person.status}` : person.role ? ` · ${person.role}` : ''}</p><Link to={`/app/shows/${show.id}/cast/${index}`}>Meet {person.name.split(' ')[0]} →</Link></div>
              </article>
            ))}
          </div>
        ) : <div className="panel"><h3>Cast details coming soon.</h3><p>Cast profiles will appear here when they’re added in EBG Studio.</p></div>}
      </section>

      {newestReleased && <section className="heartspell-section"><p className="heartspell-kicker">Latest from {show.title}</p><h2>{newestReleased.title}</h2><p>{newestReleased.synopsis}</p></section>}
    </main>
  )
}

function CastProfilePage({ cms }: { cms: CmsData }) {
  const { showId, castIndex } = useParams()
  const show = cms.shows.find((item) => item.id === showId)
  const index = Number(castIndex)
  const person = show?.cast[index]
  if (!show || !person) return <NotFoundPage />

  return (
    <main className="page heartspell-page heartspell-cast-profile universal-show-page">
      <Link to={`/app/shows/${show.id}`}>← Back to {show.title}</Link>
      <section className="heartspell-profile-hero heartspell-section">
        <div className="heartspell-profile-photo">{person.image ? <img src={person.image} alt={person.name} /> : <div className="heartspell-cast-fallback">{person.name.slice(0,1)}</div>}</div>
        <div className="heartspell-profile-copy">
          <p className="heartspell-kicker">{show.title}{person.role ? ` · ${person.role}` : ''}</p>
          <h1>{person.name}</h1>
          <div className="heartspell-meta">{person.city && <span>{person.city}</span>}{person.status && <span>{person.status}</span>}</div>
          <p className="bio">{person.bio}</p>
          {person.social && <p><strong>Social:</strong> {person.social}</p>}
        </div>
      </section>
    </main>
  )
}

// EBG_PHASE147_UNIVERSAL_SHOW_EXPERIENCE`

const next = source.replace(/function ShowPage\([\s\S]*?\n\}\n\nfunction WatchPage/, `${universalShowExperience}\n\nfunction WatchPage`)
if (next === source) throw new Error('Phase 1.47 patch failed: show experience boundary not found')
source = next

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.47 universal show and movie experience.')
