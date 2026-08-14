import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE18_HOMEPAGE_STUDIO')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.8 patch failed: ${label}`)
  source = next
}

must(
  "import './phase17.css'",
  "import './phase17.css'\nimport './phase18.css'\n\n// EBG_PHASE18_HOMEPAGE_STUDIO",
  'phase 1.8 stylesheet import',
)

must(
  `  artwork: string\n  logo: string\n  cast: Array<{ name: string; role: string; city: string; bio: string }>` ,
  `  artwork: string\n  banner?: string\n  logo: string\n  logoImage?: string\n  homeVisible?: boolean\n  cast: Array<{ name: string; role: string; city: string; bio: string }>` ,
  'show media and visibility fields',
)

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
  const hero = homeShows.find((show) => show.id === cms.heroShowId) ?? homeShows[0]
  const heroEpisode = hero
    ? episodes.find((episode) => episode.showId === hero.id && isEpisodeReleased(episode))
    : undefined
  const continueWatchingEpisodes = episodes.filter((episode) => (profile.playback[episode.id] ?? 0) > 0)

  return (
    <main className="page">
      {hero ? (
        <section className="hero-banner home-featured-hero" style={{ backgroundImage: \`url(\${hero.banner || hero.artwork})\` }}>
          <div className="overlay">
            <p className="eyebrow">{hero.category}</p>
            {hero.logoImage ? (
              <img className="show-logo-image" src={hero.logoImage} alt={\`\${hero.title} logo\`} />
            ) : (
              <h1>{hero.logo || hero.title}</h1>
            )}
            <p>{hero.description}</p>
            <p>{hero.year} · {hero.maturity} · {hero.status}</p>
            <div className="actions">
              {heroEpisode ? (
                <Link className="btn" to={\`/app/watch/\${heroEpisode.id}\`}>Play</Link>
              ) : (
                <Link className="btn" to={\`/app/shows/\${hero.id}\`}>View Show</Link>
              )}
              <Link className="btn muted" to={\`/app/shows/\${hero.id}\`}>More Info</Link>
              <button className="btn muted" onClick={() => onToggleWatchlist(hero.id)}>
                {profile.watchlist.includes(hero.id) ? '✓ In My List' : '+ My List'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel home-featured-empty">
          <p className="eyebrow">Featured on EBG+</p>
          <h2>No featured show is visible yet.</h2>
          <p>Staff can choose a featured show and turn on Home visibility in EBG Studio.</p>
        </section>
      )}

      {continueWatchingEpisodes.length > 0 ? (
        <section>
          <h2>Continue Watching</h2>
          <div className="rail">
            {continueWatchingEpisodes.map((episode) => {
              const progress = profile.playback[episode.id] ?? 0
              return (
                <article key={episode.id} className="episode-card">
                  <img src={episode.thumbnail} alt={\`\${episode.title} thumbnail\`} loading="lazy" />
                  <div>
                    <h3>{episode.title}</h3>
                    <p>S{episode.season} · E{episode.number}</p>
                    <progress value={progress} max={3600} />
                    <Link to={\`/app/watch/\${episode.id}\`}>Resume</Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <section>
          <h2>Continue Watching</h2>
          <p>Start watching something and your shows will appear here.</p>
        </section>
      )}

      {cms.rails
        .map((rail) => ({
          ...rail,
          shows: rail.showIds
            .filter((id) => homeShowIds.has(id))
            .map((id) => showById.get(id))
            .filter(Boolean) as Show[],
        }))
        .filter((rail) => rail.shows.length > 0)
        .map((rail) => (
          <section key={rail.id}>
            <h2>{rail.title}</h2>
            <div className="rail">
              {rail.shows.map((show) => (
                <ContentCard
                  key={show.id}
                  show={show}
                  inList={profile.watchlist.includes(show.id)}
                  onToggle={() => onToggleWatchlist(show.id)}
                />
              ))}
            </div>
          </section>
        ))}
    </main>
  )
}`

must(/function HomePage\([\s\S]*?\n\}\n\nfunction ContentCard/, `${homePage}\n\nfunction ContentCard`, 'homepage featured show and visibility')

const showPage = `function ShowPage({
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
  if (!show) return <NotFoundPage />

  const episodes = cms.episodes.filter((episode) => episode.showId === show.id && isEpisodeReleased(episode))

  return (
    <main className="page show-page">
      <section className="hero-banner small show-detail-hero" style={{ backgroundImage: \`url(\${show.banner || show.artwork})\` }}>
        <div className="overlay">
          <p className="eyebrow">{show.category}</p>
          {show.logoImage ? (
            <img className="show-logo-image" src={show.logoImage} alt={\`\${show.title} logo\`} />
          ) : (
            <h1>{show.logo || show.title}</h1>
          )}
          <p>{show.description}</p>
          <div className="actions">
            {episodes[0] && (
              <Link className="btn" to={\`/app/watch/\${episodes[0].id}\`}>Watch Now</Link>
            )}
            <button className="btn muted" onClick={() => onToggleWatchlist(show.id)}>
              {profile.watchlist.includes(show.id) ? '✓ In My List' : '+ Add to My List'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2>Episodes</h2>
        <div className="grid-2">
          {episodes.map((episode) => (
            <article key={episode.id} className="episode-card">
              <img src={episode.thumbnail} alt={\`\${episode.title} thumbnail\`} loading="lazy" />
              <div>
                <h3>Episode {episode.number}: {episode.title}</h3>
                <p>{episode.synopsis}</p>
                <p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleDateString()}</p>
                {(playback[episode.id] ?? 0) > 0 && <p>Progress saved</p>}
                <Link to={\`/app/watch/\${episode.id}\`}>Watch</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Cast</h2>
        <div className="grid-3">
          {show.cast.map((person) => (
            <article key={person.name} className="panel">
              <h3>{person.name}</h3>
              <p>{person.role}</p>
              <p>{person.city}</p>
              <p>{person.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}`

must(/function ShowPage\([\s\S]*?\n\}\n\nconst isEpisodeReleased|function ShowPage\([\s\S]*?\n\}\n\nfunction WatchPage/, (match) => {
  const suffix = match.includes('const isEpisodeReleased') ? '\n\nconst isEpisodeReleased' : '\n\nfunction WatchPage'
  return `${showPage}${suffix}`
}, 'show page banner and logo')

must(
  `  const updateShow = (showId: string, patch: Partial<Show>) => {\n    onUpdateCms({ ...cms, shows: cms.shows.map((show) => show.id === showId ? { ...show, ...patch } : show) })\n  }`,
  `  const updateShow = (showId: string, patch: Partial<Show>) => {\n    onUpdateCms({ ...cms, shows: cms.shows.map((show) => show.id === showId ? { ...show, ...patch } : show) })\n  }\n\n  const replaceShowMedia = async (showId: string, file: File | undefined, field: 'artwork' | 'banner' | 'logoImage', folder: string) => {\n    if (!file || file.size === 0) return\n    setBusy(true)\n    setState('')\n    try {\n      const url = await uploadStudioMedia(file, folder)\n      updateShow(showId, { [field]: url } as Partial<Show>)\n      setState('Show media updated.')\n    } catch (error) {\n      setState(error instanceof Error ? error.message : 'Show media could not be updated.')\n    } finally {\n      setBusy(false)\n    }\n  }\n\n  const setFeaturedShow = (showId: string) => {\n    const show = cms.shows.find((item) => item.id === showId)\n    onUpdateCms({\n      ...cms,\n      heroShowId: showId,\n      shows: cms.shows.map((item) => item.id === showId ? { ...item, homeVisible: true } : item),\n    })\n  }`,
  'studio show media helpers',
)

must(
  `      const artworkFile = form.get('artworkFile')\n      if (!(artworkFile instanceof File) || artworkFile.size === 0) throw new Error('Choose a show artwork image to upload.')\n      const artwork = await uploadStudioMedia(artworkFile, 'shows')`,
  `      const artworkFile = form.get('artworkFile')\n      const bannerFile = form.get('bannerFile')\n      const logoFile = form.get('logoFile')\n      if (!(artworkFile instanceof File) || artworkFile.size === 0) throw new Error('Choose a poster / cover image to upload.')\n      if (!(bannerFile instanceof File) || bannerFile.size === 0) throw new Error('Choose a banner image to upload.')\n      const artwork = await uploadStudioMedia(artworkFile, 'shows/posters')\n      const banner = await uploadStudioMedia(bannerFile, 'shows/banners')\n      const logoImage = logoFile instanceof File && logoFile.size > 0 ? await uploadStudioMedia(logoFile, 'shows/logos') : undefined`,
  'new show media uploads',
)

must(
  `        artwork,\n        logo: String(form.get('logo') ?? title).trim() || title,\n        cast: [],`,
  `        artwork,\n        banner,\n        logo: title,\n        logoImage,\n        homeVisible: form.get('homeVisible') === 'on',\n        cast: [],`,
  'new show media fields',
)

must(
  `      onUpdateCms({ ...cms, shows: [...cms.shows, nextShow] })`,
  `      const makeFeatured = form.get('makeFeatured') === 'on'\n      onUpdateCms({ ...cms, heroShowId: makeFeatured ? showId : cms.heroShowId, shows: [...cms.shows, nextShow] })`,
  'new show featured toggle',
)

must(
  `<label>Hero Show<select value={cms.heroShowId} onChange={(event) => onUpdateCms({ ...cms, heroShowId: event.target.value })}>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>`,
  `<label>Featured Show<select value={cms.heroShowId} onChange={(event) => setFeaturedShow(event.target.value)}>{cms.shows.filter((show) => show.homeVisible !== false).map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>\n          <p className="studio-help">The featured show owns the large Home hero. Only shows with Home visibility turned on can be featured.</p>`,
  'homepage featured show selector',
)

must(
  `<label>Status<select value={show.status} onChange={(event) => updateShow(show.id, { status: event.target.value as Show['status'] })}>{['Coming Soon','Now Streaming','Current','On Hiatus','Completed'].map((status) => <option key={status}>{status}</option>)}</select></label>\n              <p>{cms.episodes.filter((episode) => episode.showId === show.id).length} episodes</p>`,
  `<label>Status<select value={show.status} onChange={(event) => updateShow(show.id, { status: event.target.value as Show['status'] })}>{['Coming Soon','Now Streaming','Current','On Hiatus','Completed'].map((status) => <option key={status}>{status}</option>)}</select></label>\n              <label className="studio-toggle"><input type="checkbox" checked={show.homeVisible !== false} onChange={(event) => updateShow(show.id, { homeVisible: event.target.checked })} /> Show on Home</label>\n              <div className="studio-media-preview">\n                <img src={show.artwork} alt="Poster preview" />\n                <div><strong>Poster / Cover</strong><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'artwork', 'shows/posters')} /></div>\n              </div>\n              <div className="studio-media-preview wide">\n                <img src={show.banner || show.artwork} alt="Banner preview" />\n                <div><strong>Banner</strong><input type="file" accept="image/*" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'banner', 'shows/banners')} /></div>\n              </div>\n              <div className="studio-media-preview logo-preview">\n                {show.logoImage ? <img src={show.logoImage} alt="Show logo preview" /> : <span>{show.title}</span>}\n                <div><strong>Show Logo</strong><input type="file" accept="image/png,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceShowMedia(show.id, event.target.files?.[0], 'logoImage', 'shows/logos')} /></div>\n              </div>\n              <p>{cms.episodes.filter((episode) => episode.showId === show.id).length} episodes</p>\n              <div className="actions">\n                <button className="btn" type="button" disabled={cms.heroShowId === show.id} onClick={() => setFeaturedShow(show.id)}>{cms.heroShowId === show.id ? 'Featured on Home' : 'Set as Featured'}</button>\n              </div>`,
  'show manager visibility and media controls',
)

must(
  `<label>Title<input name="title" required /></label>\n          <label>Logo / Display Title<input name="logo" /></label>`,
  `<label>Title<input name="title" required /></label>`,
  'remove text logo field',
)

must(
  `<label>Artwork Image<input name="artworkFile" type="file" accept="image/*" required /></label>\n          <label>Description<textarea name="description" required /></label>`,
  `<label>Poster / Cover Image<input name="artworkFile" type="file" accept="image/*" required /></label>\n          <label>Homepage + Show Page Banner<input name="bannerFile" type="file" accept="image/*" required /></label>\n          <label>Show Logo Image <span className="studio-help">transparent PNG/WebP recommended</span><input name="logoFile" type="file" accept="image/png,image/webp,image/svg+xml" /></label>\n          <label className="studio-toggle"><input name="homeVisible" type="checkbox" defaultChecked /> Show on Home</label>\n          <label className="studio-toggle"><input name="makeFeatured" type="checkbox" /> Make this the featured Home show</label>\n          <label>Description<textarea name="description" required /></label>`,
  'new show simplified media form',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.8 Studio homepage visibility, featured show, banner, and logo controls.')
