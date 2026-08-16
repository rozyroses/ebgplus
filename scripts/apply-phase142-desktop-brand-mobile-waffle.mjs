import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE142_DESKTOP_BRAND_MOBILE_WAFFLE')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.42 patch failed: ${label}`)
  source = next
}

must(
  "import './phase141-carousel-brand-only.css'",
  "import './phase141-carousel-brand-only.css'\nimport './phase142-desktop-brand-mobile-waffle.css'\n\n// EBG_PHASE142_DESKTOP_BRAND_MOBILE_WAFFLE",
  'styles import',
)

must(
  `<Link className="home-carousel-brand-link" to={\`/app/shows/\${hero.id}\`} aria-label={\`Open \${hero.title}\`}>\n            {hero.logoImage ? (\n              <img className="home-carousel-brand-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n            ) : (\n              <span className="home-carousel-brand-fallback">{hero.logo || hero.title}</span>\n            )}\n          </Link>`,
  `<div className="home-carousel-brand-stage">\n            <Link className="home-carousel-brand-link" to={\`/app/shows/\${hero.id}\`} aria-label={\`Open \${hero.title}\`}>\n              {hero.logoImage ? (\n                <img className="home-carousel-brand-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n              ) : (\n                <span className="home-carousel-brand-fallback">{hero.logo || hero.title}</span>\n              )}\n            </Link>\n          </div>`,
  'desktop brand stage',
)

const mobileNav = `function MobileNav() {
  const [waffleOpen, setWaffleOpen] = useState(false)

  const closeWaffle = () => setWaffleOpen(false)

  return (
    <>
      <div className="mobile-waffle-nav">
        <button
          className={\`mobile-waffle-button \${waffleOpen ? 'active' : ''}\`}
          type="button"
          aria-label={waffleOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={waffleOpen}
          onClick={() => setWaffleOpen((open) => !open)}
        >
          <span className="waffle-grid" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i />
          </span>
        </button>

        {waffleOpen && (
          <>
            <button className="mobile-waffle-backdrop" type="button" aria-label="Close navigation" onClick={closeWaffle} />
            <nav className="mobile-waffle-drawer" aria-label="Mobile menu">
              <div className="mobile-waffle-head">
                <span>Explore EBG+</span>
                <button type="button" onClick={closeWaffle} aria-label="Close menu">×</button>
              </div>

              <div className="mobile-waffle-section">
                <span className="mobile-waffle-label">Watch</span>
                <Link to="/app/home" onClick={closeWaffle}>Home</Link>
                <Link to="/app/shows" onClick={closeWaffle}>Shows</Link>
                <Link to="/app/music" onClick={closeWaffle}>Music</Link>
                <Link to="/app/universe" onClick={closeWaffle}>EBG Universe</Link>
                <Link to="/app/news" onClick={closeWaffle}>New & Hot</Link>
                <Link to="/app/search" onClick={closeWaffle}>Search</Link>
              </div>

              <div className="mobile-waffle-section">
                <span className="mobile-waffle-label">Library</span>
                <Link to="/app/my-list" onClick={closeWaffle}>My List</Link>
                <Link to="/app/applications" onClick={closeWaffle}>My Applications</Link>
                <Link to="/app/notifications" onClick={closeWaffle}>Notifications</Link>
                <a href="https://forms.ebgplus.app" onClick={closeWaffle}>Casting</a>
              </div>

              <div className="mobile-waffle-section mobile-waffle-section-last">
                <span className="mobile-waffle-label">Account</span>
                <Link to="/app/settings" onClick={closeWaffle}>Settings</Link>
              </div>
            </nav>
          </>
        )}
      </div>

      <nav className="mobile-nav" aria-label="Mobile quick navigation">
        <Link to="/app/home">Home</Link>
        <Link to="/app/news">New & Hot</Link>
        <Link to="/app/search">Search</Link>
        <Link to="/app/my-list">My List</Link>
        <Link to="/app/settings">Profile</Link>
      </nav>
    </>
  )
}`

must(
  /function MobileNav\(\) \{[\s\S]*?\n\}\n\nfunction Footer/,
  `${mobileNav}\n\nfunction Footer`,
  'mobile waffle navigation',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.42 desktop hero brand stage and mobile waffle navigation.')
