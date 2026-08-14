import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE121_SHOWS_GRID')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.21 patch failed: ${label}`)
  source = next
}

must(
  "import './phase120-hero-logo-layout.css'",
  "import './phase120-hero-logo-layout.css'\nimport './phase121-shows-grid.css'\n\n// EBG_PHASE121_SHOWS_GRID",
  'styles import',
)

must(
  `<main className="page">\n      <h1>Shows</h1>\n      <div className="grid-3">\n        {cms.shows.map((show) => (\n          <ContentCard key={show.id} show={show} inList={false} onToggle={() => undefined} />\n        ))}\n      </div>\n    </main>`,
  `<main className="page shows-browse-page">\n      <div className="shows-browse-head">\n        <div>\n          <p className="eyebrow">EBG+ Series</p>\n          <h1>Shows</h1>\n          <p>Original series, reality television, and stories from across the EBG universe.</p>\n        </div>\n      </div>\n      <div className="shows-browse-grid">\n        {cms.shows.map((show) => (\n          <article className="shows-browse-card" key={show.id}>\n            <Link className="shows-browse-art" to={\`/app/shows/\${show.id}\`}>\n              <img src={show.artwork} alt={\`\${show.title} artwork\`} loading="lazy" />\n              <span className="shows-browse-status">{show.status}</span>\n            </Link>\n            <div className="shows-browse-copy">\n              <h2>{show.title}</h2>\n              <p>{show.genre} · {show.maturity}</p>\n              <Link className="shows-browse-link" to={\`/app/shows/\${show.id}\`}>View Show →</Link>\n            </div>\n          </article>\n        ))}\n      </div>\n    </main>`,
  'Shows page browse layout',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.21 Shows browse card layout.')
