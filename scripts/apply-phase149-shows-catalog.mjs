import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_PHASE149_SHOWS_CATALOG')) process.exit(0)

const showsPage = `function ShowsPage({ cms }: { cms: CmsData }) {
  const featured = cms.shows.find((show) => show.id === cms.heroShowId) ?? cms.shows[0]
  const comingSoon = cms.shows.filter((show) => show.status === 'Coming Soon')
  const groups = Array.from(new Set(cms.shows.map((show) => show.category || show.genre || 'EBG+')))
    .map((label) => ({ label, shows: cms.shows.filter((show) => (show.category || show.genre || 'EBG+') === label) }))
    .filter((group) => group.shows.length > 0)

  return (
    <main className="page shows-catalog-page">
      <header className="shows-catalog-head">
        <div>
          <p className="eyebrow">Explore EBG+</p>
          <h1>Shows & Movies</h1>
          <p>Original series, films, specials, reality, and stories from across the EBG universe.</p>
        </div>
      </header>

      {featured ? (
        <section className="shows-catalog-feature" style={{ backgroundImage: 'url(' + (featured.banner || featured.artwork) + ')' }}>
          <div className="shows-catalog-feature-overlay">
            <span className="shows-catalog-pill">Featured on EBG+</span>
            {featured.logoImage ? <img className="shows-catalog-logo" src={featured.logoImage} alt={featured.title + ' logo'} /> : <h2>{featured.logo || featured.title}</h2>}
            <p className="shows-catalog-meta">{featured.year} · {featured.maturity} · {featured.genre}</p>
            <p className="shows-catalog-description">{featured.description}</p>
            <div className="actions"><Link className="btn" to={'/app/shows/' + featured.id}>View Title</Link></div>
          </div>
        </section>
      ) : null}

      {comingSoon.length > 0 ? (
        <section className="shows-catalog-section">
          <div className="shows-catalog-section-head"><div><p className="eyebrow">Up next</p><h2>Coming Soon</h2></div></div>
          <div className="shows-catalog-wide-grid">
            {comingSoon.map((show) => (
              <Link key={show.id} className="shows-catalog-wide-card" to={'/app/shows/' + show.id} style={{ backgroundImage: 'url(' + (show.banner || show.artwork) + ')' }}>
                <div><span className="shows-catalog-pill">Coming Soon</span><h3>{show.title}</h3><p>{show.genre}</p></div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {groups.map((group) => (
        <section className="shows-catalog-section" key={group.label}>
          <div className="shows-catalog-section-head"><div><p className="eyebrow">Browse</p><h2>{group.label}</h2></div><span>{group.shows.length} title{group.shows.length === 1 ? '' : 's'}</span></div>
          <div className="shows-browse-grid shows-catalog-grid">
            {group.shows.map((show) => (
              <article className="shows-browse-card shows-catalog-card" key={show.id}>
                <Link className="shows-browse-art" to={'/app/shows/' + show.id}>
                  <img src={show.artwork} alt={show.title + ' artwork'} loading="lazy" />
                  <span className="shows-browse-status">{show.status}</span>
                </Link>
                <div className="shows-browse-copy">
                  <h3>{show.title}</h3>
                  <p>{show.genre} · {show.maturity}</p>
                  <Link className="shows-browse-link" to={'/app/shows/' + show.id}>View Title →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {/* EBG_PHASE149_SHOWS_CATALOG */}
    </main>
  )
}`

const next = source.replace(/function ShowsPage\([\s\S]*?\n\}\n\n(?:\/\/ EBG_PHASE148_UNIVERSAL_SHOW_EXPERIENCE\n)?function ShowPage/, showsPage + '\n\nfunction ShowPage')
if (next === source) throw new Error('Phase 1.49 patch failed: Shows page boundary not found')
source = next

const styleAnchor = "import './phase147-homepage-polish.css'"
if (source.includes(styleAnchor) && !source.includes("import './phase149-shows-catalog.css'")) {
  source = source.replace(styleAnchor, styleAnchor + "\nimport './phase149-shows-catalog.css'")
} else if (!source.includes("import './phase149-shows-catalog.css'")) {
  throw new Error('Phase 1.49 patch failed: stylesheet anchor not found')
}

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.49 Shows catalog experience.')
