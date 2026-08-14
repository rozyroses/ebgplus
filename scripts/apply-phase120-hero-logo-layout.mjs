import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE120_HERO_LOGO_LAYOUT')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.20 patch failed: ${label}`)
  source = next
}

must(
  "import './phase119-media-delete-hero-fit.css'",
  "import './phase119-media-delete-hero-fit.css'\nimport './phase120-hero-logo-layout.css'\n\n// EBG_PHASE120_HERO_LOGO_LAYOUT",
  'styles import',
)

const oldHeroStart = `<section className="hero-banner home-featured-hero" style={{ backgroundImage: \`url(\${hero.banner || hero.artwork})\`, backgroundPosition: hero.bannerPosition || 'center center', backgroundSize: hero.bannerFit || 'contain' }}>\n          <div className="overlay">`
const newHeroStart = `<section className="hero-banner home-featured-hero" style={{ backgroundImage: \`url(\${hero.banner || hero.artwork})\`, backgroundPosition: hero.bannerPosition || 'center center', backgroundSize: hero.bannerFit || 'contain' }}>\n          {hero.logoImage && <img className="home-hero-floating-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />}\n          <div className="overlay">`
must(oldHeroStart, newHeroStart, 'floating show logo')

must(
  `{hero.logoImage ? (\n              <img className="show-logo-image" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n            ) : (\n              <h1>{hero.logo || hero.title}</h1>\n            )}`,
  `{!hero.logoImage && <h1>{hero.logo || hero.title}</h1>}`,
  'remove duplicate inline logo',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.20 hero logo layout.')
