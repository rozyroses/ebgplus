import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE141_CAROUSEL_BRAND_ONLY')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.41 patch failed: ${label}`)
  source = next
}

must(
  "import './phase140-carousel-logo-visibility.css'",
  "import './phase140-carousel-logo-visibility.css'\nimport './phase141-carousel-brand-only.css'\n\n// EBG_PHASE141_CAROUSEL_BRAND_ONLY",
  'styles import',
)

source = source.replace(
  /\n  const heroEpisode = hero\n    \? episodes\.find\(\(episode\) => episode\.showId === hero\.id && isEpisodeReleased\(episode\)\)\n    : undefined/,
  '',
)

must(
  /\n          <div className="overlay home-carousel-overlay">[\s\S]*?\n          <\/div>\n\n          \{homeShows\.length > 1 && \(/,
  `\n          <Link className="home-carousel-brand-link" to={\`/app/shows/\${hero.id}\`} aria-label={\`Open \${hero.title}\`}>\n            {hero.logoImage ? (\n              <img className="home-carousel-brand-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n            ) : (\n              <span className="home-carousel-brand-fallback">{hero.logo || hero.title}</span>\n            )}\n          </Link>\n\n          {homeShows.length > 1 && (`,
  'brand-only hero layer',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.41 brand-only homepage carousel layer.')
