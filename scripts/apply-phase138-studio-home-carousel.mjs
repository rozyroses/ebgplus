import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE138_STUDIO_HOME_CAROUSEL')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.38 patch failed: ${label}`)
  source = next
}

must(
  "import './phase136-studio-complete.css'",
  "import './phase136-studio-complete.css'\nimport './phase138-studio-home-carousel.css'\n\n// EBG_PHASE138_STUDIO_HOME_CAROUSEL",
  'styles import',
)

const studioPage = `function StudioPage({
  account,
  cms,
  castingApps,
  onUpdateCms,
  onUpdateCastingStatus,
}: {
  account: Account
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>
}) {
  const { studioSection } = useParams()

  if (!['founder', 'administrator', 'producer', 'editor'].includes(account.role)) {
    return (
      <main className="page">
        <h1>Authentication Error</h1>
        <p>You are not authorized to access EBG Studio.</p>
      </main>
    )
  }

  if (!studioSection) return <Navigate to="/app/studio/overview" replace />

  return (
    <main className={\`page studio-route studio-route-\${studioSection}\`}>
      <EbgStudioHub
        cms={cms}
        castingApps={castingApps}
        onUpdateCms={onUpdateCms}
        onUpdateCastingStatus={onUpdateCastingStatus}
      />
    </main>
  )
}`

must(/function StudioPage\([\s\S]*?\n\}\n\nfunction CastingPage/, `${studioPage}\n\nfunction CastingPage`, 'remove legacy Studio page')

const homePage = `function HomePage({
  cms,
  profile,
  showById,
  episodes,
  onToggleWatchlist,
}: {
  cms: CmsData
  profile: Profile
  showById: Map<string, Show>
  episodes: Episode[]
  onToggleWatchlist: (showId: string) => void
}) {
  const homeShows = cms.shows.filter((show) => show.homeVisible !== false)
  const homeShowIds = new Set(homeShows.map((show) => show.id))
  const preferredHeroIndex = Math.max(0, homeShows.findIndex((show) => show.id === cms.heroShowId))
  const [heroIndex, setHeroIndex] = useState(preferredHeroIndex)
  const hero = homeShows[heroIndex] ?? homeShows[0]
  const heroEpisode = hero
    ? episodes.find((episode) => episode.showId === hero.id && isEpisodeReleased(episode))
    : undefined
  const continueWatchingEpisodes = episodes.filter((episode) => (profile.playback[episode.id] ?? 0) > 0)
  const comingSoonShows = homeShows.filter((show) => show.status === 'Coming Soon').slice(0, 3)
  const releasedEpisodes = episodes
    .filter((episode) => isEpisodeReleased(episode))
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
  const newestEpisode = releasedEpisodes[0]
  const newestShow = newestEpisode ? showById.get(newestEpisode.showId) : undefined

  useEffect(() => {
    const nextPreferred = homeShows.findIndex((show) => show.id === cms.heroShowId)
    if (nextPreferred >= 0) setHeroIndex(nextPreferred)
    else if (heroIndex >= homeShows.length) setHeroIndex(0)
  }, [cms.heroShowId, homeShows.length])

  useEffect(() => {
    if (homeShows.length < 2) return
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % homeShows.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [homeShows.length])

  const moveHero = (direction: -1 | 1) => {
    if (!homeShows.length) return
    setHeroIndex((current) => (current + direction + homeShows.length) % homeShows.length)
  }

  return (
    <main className="page home-v2">
      {hero ? (
        <section
          key={hero.id}
          className="hero-banner home-featured-hero home-carousel-hero"
          style={{
            backgroundImage: \`url(\${hero.banner || hero.artwork})\`,
            backgroundPosition: hero.bannerPosition || 'center center',
            backgroundSize: hero.bannerFit || 'cover',
          }}
          aria-live="polite"
        >
          <div className="overlay home-carousel-overlay">
            <div className="hero-kicker">
              <span className="hero-pill">Featured on EBG+</span>
              <span className="hero-pill">{hero.status}</span>
            </div>
            {hero.logoImage ? (
              <img className="home-carousel-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />
            ) : (
              <h1 className="home-carousel-title-fallback">{hero.logo || hero.title}</h1>
            )}
            <p className="hero-meta">{hero.year} · {hero.maturity} · {hero.genre}</p>
            <div className="actions">
              {heroEpisode ? (
                <Link className="btn" to={\`/app/watch/\${heroEpisode.id}\`}>▶ Play</Link>
              ) : (
                <Link className="btn" to={\`/app/shows/\${hero.id}\`}>View Show</Link>
              )}
              <Link className="btn muted" to={\`/app/shows/\${hero.id}\`}>ⓘ More Info</Link>
              <button className="btn muted" onClick={() => onToggleWatchlist(hero.id)}>
                {profile.watchlist.includes(hero.id) ? '✓ In My List' : '+ My List'}
              </button>
            </div>
          </div>

          {homeShows.length > 1 && (
            <div className="home-carousel-controls" aria-label="Featured shows">
              <button type="button" className="home-carousel-arrow" onClick={() => moveHero(-1)} aria-label="Previous featured show">‹</button>
              <div className="home-carousel-dots">
                {homeShows.map((show, index) => (
                  <button
                    key={show.id}
                    type="button"
                    className={index === heroIndex ? 'active' : ''}
                    onClick={() => setHeroIndex(index)}
                    aria-label={\`Show \${show.title}\`}
                    aria-current={index === heroIndex ? 'true' : undefined}
                  />
                ))}
              </div>
              <button type="button" className="home-carousel-arrow" onClick={() => moveHero(1)} aria-label="Next featured show">›</button>
            </div>
          )}
        </section>
      ) : (
        <section className="panel home-featured-empty">
          <p className="eyebrow">Featured on EBG+</p>
          <h2>No featured show is visible yet.</h2>
          <p>Staff can turn on Home visibility for a series in EBG Studio.</p>
        </section>
      )}

      <section className="home-welcome">
        <div>
          <p className="eyebrow">Your EBG+</p>
          <h1>Welcome back, {profile.name}.</h1>
          <p>Your shows, stories, applications, and the latest from EBG — all in one place.</p>
        </div>
        <Link className="btn muted" to="/app/my-list">Open My List</Link>
      </section>

      {continueWatchingEpisodes.length > 0 ? (
        <section className="home-section">
          <div className="home-section-head">
            <div><h2>Continue Watching</h2><p>Pick up exactly where you left off.</p></div>
          </div>
          <div className="rail">
            {continueWatchingEpisodes.map((episode) => {
              const progress = profile.playback[episode.id] ?? 0
              const show = showById.get(episode.showId)
              return (
                <article key={episode.id} className="continue-card-v2">
                  <Link to={\`/app/watch/\${episode.id}\`}><img src={episode.thumbnail} alt={\`\${episode.title} thumbnail\`} loading="lazy" /></Link>
                  <div className="continue-card-body">
                    <p className="eyebrow">{show?.title || 'EBG+'}</p>
                    <h3>{episode.title}</h3>
                    <p>S{episode.season} · E{episode.number}</p>
                    <progress value={progress} max={3600} />
                    <Link to={\`/app/watch/\${episode.id}\`}>Resume →</Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="home-section">
        <div className="home-section-head">
          <div><h2>What’s happening on EBG+</h2><p>Jump into the parts of the platform that move with you.</p></div>
        </div>
        <div className="home-pulse-grid">
          <article className="home-pulse-card">
            <div><span className="pulse-badge">Casting</span><h3>Step into the story.</h3><p>Open casting opportunities and official EBG submissions live in EBG Forms.</p></div>
            <a href="https://forms.ebgplus.app">View Casting →</a>
          </article>
          <article className="home-pulse-card">
            <div><span className="pulse-badge">Applications</span><h3>Track your application.</h3><p>See your current casting status and follow each application from submission to final decision.</p></div>
            <Link to="/app/applications">My Applications →</Link>
          </article>
          <article className="home-pulse-card">
            <div><span className="pulse-badge">{newestEpisode ? 'New Release' : 'Discover'}</span><h3>{newestEpisode ? newestEpisode.title : 'Explore EBG+'}</h3><p>{newestEpisode && newestShow ? \`New from \${newestShow.title}.\` : 'Discover originals, music, specials, and the wider EBG universe.'}</p></div>
            {newestEpisode ? <Link to={\`/app/watch/\${newestEpisode.id}\`}>Watch Now →</Link> : <Link to="/app/shows">Browse Shows →</Link>}
          </article>
        </div>
      </section>

      {cms.rails
        .map((rail) => ({
          ...rail,
          shows: rail.showIds.filter((id) => homeShowIds.has(id)).map((id) => showById.get(id)).filter(Boolean) as Show[],
        }))
        .filter((rail) => rail.shows.length > 0)
        .map((rail) => (
          <section className="home-section" key={rail.id}>
            <div className="home-section-head"><div><h2>{rail.title}</h2></div></div>
            <div className="rail">
              {rail.shows.map((show) => (
                <ContentCard key={show.id} show={show} inList={profile.watchlist.includes(show.id)} onToggle={() => onToggleWatchlist(show.id)} />
              ))}
            </div>
          </section>
        ))}

      <section className="home-section">
        <div className="home-section-head"><div><h2>Coming Soon</h2><p>A look at what’s next on EBG+.</p></div></div>
        {comingSoonShows.length ? (
          <div className="home-coming-grid">
            {comingSoonShows.map((show) => (
              <Link key={show.id} className="home-coming-card" to={\`/app/shows/\${show.id}\`} style={{ backgroundImage: \`url(\${show.banner || show.artwork})\` }}>
                <div><span className="pulse-badge">Coming Soon</span><h3>{show.title}</h3><p>{show.genre}</p></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-empty-v2">Nothing has been announced here yet. Keep an eye on EBG+.</div>
        )}
      </section>
    </main>
  )
}`

must(/function HomePage\([\s\S]*?\n\}\n\nfunction ContentCard/, `${homePage}\n\nfunction ContentCard`, 'homepage rotating hero')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.38 Studio cleanup, Overview redirect, and rotating homepage hero.')
