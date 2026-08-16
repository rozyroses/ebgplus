import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE143_DESKTOP_SPLIT_HERO')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.43 patch failed: ${label}`)
  source = next
}

must(
  "import './phase142-desktop-brand-mobile-waffle.css'",
  "import './phase142-desktop-brand-mobile-waffle.css'\nimport './phase143-desktop-split-hero.css'\n\n// EBG_PHASE143_DESKTOP_SPLIT_HERO",
  'styles import',
)

must(
  `<div className="home-carousel-brand-stage">\n            <Link className="home-carousel-brand-link" to={\`/app/shows/\${hero.id}\`} aria-label={\`Open \${hero.title}\`}>\n              {hero.logoImage ? (\n                <img className="home-carousel-brand-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n              ) : (\n                <span className="home-carousel-brand-fallback">{hero.logo || hero.title}</span>\n              )}\n            </Link>\n          </div>`,
  `<div\n            className="desktop-hero-visual"\n            style={{\n              backgroundImage: \`url(\${hero.banner || hero.artwork})\`,\n              backgroundPosition: hero.bannerPosition || 'center center',\n              backgroundSize: hero.bannerFit || 'cover',\n            }}\n            aria-hidden="true"\n          />\n\n          <div className="home-carousel-brand-stage">\n            <div className="desktop-hero-panel">\n              <Link className="home-carousel-brand-link" to={\`/app/shows/\${hero.id}\`} aria-label={\`Open \${hero.title}\`}>\n                {hero.logoImage ? (\n                  <img className="home-carousel-brand-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n                ) : (\n                  <span className="home-carousel-brand-fallback">{hero.logo || hero.title}</span>\n                )}\n              </Link>\n              <p className="desktop-hero-meta">{hero.year} · {hero.maturity} · {hero.genre}</p>\n              <Link className="btn desktop-hero-button" to={\`/app/shows/\${hero.id}\`}>View Show</Link>\n            </div>\n          </div>`,
  'split hero markup',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.43 desktop split homepage hero.')
