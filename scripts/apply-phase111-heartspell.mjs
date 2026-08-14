import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE111_HEARTSPELL')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.11 patch failed: ${label}`)
  source = next
}

must(
  "import './phase110.css'",
  "import './phase110.css'\nimport './phase111.css'\n\n// EBG_PHASE111_HEARTSPELL",
  'phase 1.11 stylesheet import',
)

must(
  `  cast: Array<{ name: string; role: string; city: string; bio: string }>` ,
  `  cast: Array<{\n    name: string\n    role: string\n    city: string\n    bio: string\n    image?: string\n    social?: string\n    status?: string\n  }>` ,
  'expanded cast metadata',
)

must(
  `        <Route\n          path="watch/:episodeId"`,
  `        <Route path="shows/:showId/cast/:castIndex" element={<CastProfilePage cms={cms} />} />\n        <Route\n          path="watch/:episodeId"`,
  'cast profile route',
)

const showExperience = `function ShowPage({
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

  if (show.id !== 'heartspell-house') {
    return (
      <main className="page show-page">
        <section className="hero-banner small show-detail-hero" style={{ backgroundImage: \`url(\${show.banner || show.artwork})\` }}>
          <div className="overlay">
            <p className="eyebrow">{show.category}</p>
            {show.logoImage ? <img className="show-logo-image" src={show.logoImage} alt={\`\${show.title} logo\`} /> : <h1>{show.logo || show.title}</h1>}
            <p>{show.description}</p>
            <div className="actions">
              {releasedEpisodes[0] && <Link className="btn" to={\`/app/watch/\${releasedEpisodes[0].id}\`}>Watch Now</Link>}
              <button className="btn muted" onClick={() => onToggleWatchlist(show.id)}>{profile.watchlist.includes(show.id) ? '✓ In My List' : '+ Add to My List'}</button>
            </div>
          </div>
        </section>
        <section>
          <h2>Episodes</h2>
          <div className="grid-2">
            {releasedEpisodes.map((episode) => (
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
            {show.cast.map((person) => <article key={person.name} className="panel"><h3>{person.name}</h3><p>{person.role}</p><p>{person.city}</p><p>{person.bio}</p></article>)}
          </div>
        </section>
      </main>
    )
  }

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
    <main className="page show-page heartspell-page">
      <section className="heartspell-hero" style={{ backgroundImage: \`url(\${show.banner || show.artwork})\` }}>
        <div className="heartspell-hero-content">
          <p className="heartspell-kicker">EBG+ Original · Reality & Romance</p>
          {show.logoImage ? <img className="show-logo-image" src={show.logoImage} alt="Heartspell House" /> : <h1 className="heartspell-title">Heartspell House</h1>}
          <div className="heartspell-meta"><span>{show.year}</span><span>{show.maturity}</span><span>{show.status}</span><span>{show.genre}</span></div>
          <p className="heartspell-description">{show.description}</p>
          <div className="actions">
            {firstReleased && <Link className="btn" to={\`/app/watch/\${firstReleased.id}\`}>▶ Watch Now</Link>}
            <button className="btn muted" onClick={() => onToggleWatchlist(show.id)}>{profile.watchlist.includes(show.id) ? '✓ In My List' : '+ My List'}</button>
          </div>
        </div>
      </section>

      <section className="heartspell-section">
        <div className="heartspell-section-head">
          <div><p className="heartspell-kicker">Inside the house</p><h2>Episodes</h2></div>
          {seasons.length > 0 && <div className="heartspell-season-tabs">{seasons.map((item) => <button key={item} className={item === selectedSeason ? 'active' : ''} onClick={() => setSeason(item)}>Season {item}</button>)}</div>}
        </div>
        <div className="heartspell-episode-grid">
          {seasonEpisodes.map((episode) => {
            const badge = episodeBadge(episode)
            const released = isEpisodeReleased(episode)
            return (
              <article key={episode.id} className="heartspell-episode">
                <div className="heartspell-episode-media">
                  <img src={episode.thumbnail} alt={\`Episode \${episode.number}: \${episode.title}\`} loading="lazy" />
                  {badge && <span className={\`heartspell-badge \${released ? 'new' : 'soon'}\`}>{badge}</span>}
                </div>
                <div className="heartspell-episode-body">
                  <p className="heartspell-kicker">S{episode.season} · E{episode.number} · {episode.runtime}</p>
                  <h3>{episode.title}</h3>
                  <p>{episode.synopsis}</p>
                  {released ? <Link to={\`/app/watch/\${episode.id}\`}>{(playback[episode.id] ?? 0) > 0 ? 'Resume episode →' : 'Watch episode →'}</Link> : <span>Premieres {new Date(episode.releaseDate).toLocaleDateString()}</span>}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="heartspell-section">
        <div className="heartspell-section-head"><div><p className="heartspell-kicker">Meet the singles</p><h2>Cast</h2></div><p>{show.cast.length} people inside the house</p></div>
        {show.cast.length > 0 ? (
          <div className="heartspell-cast-grid">
            {show.cast.map((person, index) => (
              <article key={\`\${person.name}-\${index}\`} className="heartspell-cast-card">
                {person.image ? <img className="heartspell-cast-photo" src={person.image} alt={person.name} loading="lazy" /> : <div className="heartspell-cast-fallback">{person.name.slice(0,1)}</div>}
                <div className="heartspell-cast-gradient" />
                <div className="heartspell-cast-copy"><h3>{person.name}</h3><p>{person.city}{person.status ? \` · \${person.status}\` : ''}</p><Link to={\`/app/shows/heartspell-house/cast/\${index}\`}>Meet {person.name.split(' ')[0]} →</Link></div>
              </article>
            ))}
          </div>
        ) : <div className="panel"><h3>Cast reveal coming soon.</h3><p>Heartspell House cast profiles will appear here as EBG announces them.</p></div>}
      </section>

      <section className="heartspell-section heartspell-vote-teaser">
        <p className="heartspell-kicker">You get a say</p>
        <h2>Fan voting is coming to the House.</h2>
        <p>Future Heartspell polls will let viewers weigh in on connections, favorite moments, and show decisions while keeping results controlled by EBG Studio.</p>
        <button className="btn muted" type="button" disabled>Voting opens soon</button>
      </section>

      {newestReleased && <section className="heartspell-section"><p className="heartspell-kicker">Latest from Heartspell</p><h2>{newestReleased.title}</h2><p>{newestReleased.synopsis}</p></section>}
    </main>
  )
}

function CastProfilePage({ cms }: { cms: CmsData }) {
  const { showId, castIndex } = useParams()
  const show = cms.shows.find((item) => item.id === showId)
  const index = Number(castIndex)
  const person = show?.cast[index]
  if (!show || !person || show.id !== 'heartspell-house') return <NotFoundPage />

  return (
    <main className="page heartspell-page heartspell-cast-profile">
      <Link to="/app/shows/heartspell-house">← Back to Heartspell House</Link>
      <section className="heartspell-profile-hero heartspell-section">
        <div className="heartspell-profile-photo">{person.image ? <img src={person.image} alt={person.name} /> : <div className="heartspell-cast-fallback">{person.name.slice(0,1)}</div>}</div>
        <div className="heartspell-profile-copy">
          <p className="heartspell-kicker">Heartspell House · {person.role}</p>
          <h1>{person.name}</h1>
          <div className="heartspell-meta"><span>{person.city}</span>{person.status && <span>{person.status}</span>}</div>
          <p className="bio">{person.bio}</p>
          {person.social && <p><strong>Social:</strong> {person.social}</p>}
        </div>
      </section>
    </main>
  )
}
`

must(/function ShowPage\([\s\S]*?\n\}\n\nfunction WatchPage/, `${showExperience}\n\nfunction WatchPage`, 'Heartspell show and cast profile experience')

const studioPanel = `function HeartspellStudioPanel({ cms, onUpdateCms }: { cms: CmsData; onUpdateCms: (cms: CmsData) => void }) {
  const show = cms.shows.find((item) => item.id === 'heartspell-house')
  const [state, setState] = useState('')
  const [busy, setBusy] = useState(false)
  if (!show) return null

  const saveCast = (cast: Show['cast']) => onUpdateCms({ ...cms, shows: cms.shows.map((item) => item.id === show.id ? { ...item, cast } : item) })

  const addCast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setState('')
    try {
      const form = new FormData(event.currentTarget)
      const imageFile = form.get('imageFile')
      const image = imageFile instanceof File && imageFile.size > 0 ? await uploadStudioMedia(imageFile, 'heartspell/cast') : undefined
      const next = {
        name: String(form.get('name') ?? '').trim(),
        role: String(form.get('role') ?? 'Contestant').trim() || 'Contestant',
        city: String(form.get('city') ?? '').trim(),
        bio: String(form.get('bio') ?? '').trim(),
        social: String(form.get('social') ?? '').trim() || undefined,
        status: String(form.get('status') ?? 'In the House').trim() || undefined,
        image,
      }
      if (!next.name || !next.city || !next.bio) throw new Error('Name, city, and bio are required.')
      saveCast([...show.cast, next])
      event.currentTarget.reset()
      setState('Cast member added to Heartspell House.')
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Cast member could not be added.')
    } finally {
      setBusy(false)
    }
  }

  const editCast = (index: number) => {
    const person = show.cast[index]
    const name = prompt('Cast name', person.name)
    if (!name) return
    const city = prompt('City / State', person.city) ?? person.city
    const role = prompt('Role', person.role) ?? person.role
    const status = prompt('Status', person.status ?? 'In the House') ?? person.status
    const social = prompt('Social handle', person.social ?? '') ?? person.social
    const bio = prompt('Bio', person.bio) ?? person.bio
    saveCast(show.cast.map((item, itemIndex) => itemIndex === index ? { ...item, name, city, role, status, social, bio } : item))
    setState('Cast profile updated.')
  }

  const removeCast = (index: number) => {
    const person = show.cast[index]
    if (!confirm(\`Remove \${person.name} from the Heartspell House cast?\`)) return
    saveCast(show.cast.filter((_, itemIndex) => itemIndex !== index))
    setState('Cast member removed.')
  }

  return (
    <section className="panel heartspell-studio">
      <p className="heartspell-kicker">Flagship original</p>
      <h2>Heartspell House Manager</h2>
      <p className="studio-help">Manage public cast profiles here. Episode scheduling and show media continue to use the main Show Manager above.</p>
      <div className="heartspell-studio-list">
        {show.cast.map((person, index) => (
          <div className="heartspell-studio-person" key={\`\${person.name}-\${index}\`}>
            <div><strong>{person.name}</strong><br /><small>{person.city} · {person.status ?? person.role}</small></div>
            <div className="actions"><button className="btn muted" type="button" onClick={() => editCast(index)}>Edit</button><button className="btn muted" type="button" onClick={() => removeCast(index)}>Remove</button></div>
          </div>
        ))}
      </div>
      <form className="heartspell-studio-form" onSubmit={addCast}>
        <label>Name<input name="name" required /></label>
        <label>City / State<input name="city" required /></label>
        <label>Role<input name="role" defaultValue="Contestant" /></label>
        <label>Status<input name="status" defaultValue="In the House" /></label>
        <label>Social handle<input name="social" placeholder="@handle" /></label>
        <label>Cast photo<input name="imageFile" type="file" accept="image/*" /></label>
        <label className="full">Bio<textarea name="bio" required /></label>
        <div className="actions full"><button className="btn" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Add Cast Member'}</button></div>
      </form>
      {state && <p className="studio-help">{state}</p>}
    </section>
  )
}

`

must('function StudioPage({', `${studioPanel}function StudioPage({`, 'Heartspell Studio manager component')
must('<LaunchWaitlistPanel />', '<LaunchWaitlistPanel />\n          <HeartspellStudioPanel cms={cms} onUpdateCms={onUpdateCms} />', 'Heartspell Studio panel placement')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.11 Heartspell House foundation.')
