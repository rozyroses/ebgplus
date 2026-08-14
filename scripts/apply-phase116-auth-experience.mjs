import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE116_PUBLIC_LANDING')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.16 landing patch failed: ${label}`)
  source = next
}

must(
  "import './phase115-home.css'",
  "import './phase115-home.css'\nimport './phase116-auth.css'\n\n// EBG_PHASE116_PUBLIC_LANDING",
  'styles import',
)

const landingPage = `function LandingPage({ cms }: { cms: CmsData }) {
  const visibleShows = cms.shows.filter((show) => show.homeVisible !== false)
  const previewShows = visibleShows.slice(0, 4)

  return (
    <main className="landing public-landing-v2">
      <header className="topbar public-topbar">
        <Link className="wordmark" to="/">EBG+</Link>
        <nav>
          <Link to="/coming-soon">Coming Soon</Link>
          <Link to="/auth/create-account">Join EBG+</Link>
          <Link to="/auth/sign-in" className="btn">Sign In</Link>
        </nav>
      </header>

      <section className="hero public-hero" aria-label="EBG+ introduction">
        <div className="public-hero-copy">
          <p className="eyebrow">EBG Original Network</p>
          <h1>{cms.slogan}</h1>
          <p className="public-hero-lead">Premium series, reality television, cinematic music performances, artist stories, and the evolving EBG universe — all in one place.</p>
          <div className="actions">
            <Link className="btn" to="/coming-soon">Get Launch Updates</Link>
            <Link className="btn muted" to="/auth/sign-in">Sign In</Link>
          </div>
        </div>
        <div className="public-hero-orbit" aria-hidden="true">
          <span>EBG+</span><span>ORIGINALS</span><span>MUSIC</span><span>STORIES</span>
        </div>
      </section>

      <section className="public-intro-section">
        <div className="public-section-heading">
          <p className="eyebrow">Inside EBG+</p>
          <h2>Watch the story. Then step inside it.</h2>
          <p>EBG+ combines streaming with interactive fan experiences, creator-led programming, casting, application updates, and a growing entertainment universe.</p>
        </div>
        <div className="public-benefit-grid">
          <article><span>01</span><h3>Original programming</h3><p>Reality series, specials, music films, interviews, performances, and EBG-exclusive projects.</p></article>
          <article><span>02</span><h3>Your own library</h3><p>Create profiles, build My List, save playback progress, and pick up where you left off.</p></article>
          <article><span>03</span><h3>Interactive fandom</h3><p>Join eligible live polls and voting experiences as EBG+ stories unfold.</p></article>
          <article><span>04</span><h3>Casting connection</h3><p>Apply through EBG Forms and track eligible application updates from your EBG+ account.</p></article>
        </div>
      </section>

      <section className="public-founders-section">
        <div className="public-section-heading compact">
          <p className="eyebrow">The EBG world</p>
          <h2>Three artists. Three distinct worlds. One creative home.</h2>
          <p>Discover music and programming connected to Bijou Nicole, Empress V, and Goldie Songs across EBG+.</p>
        </div>
        <div className="public-creator-grid">
          <article className="public-creator-card">
            <div className="public-creator-mark">BN</div>
            <p className="eyebrow">Artist spotlight</p>
            <h3>Bijou Nicole</h3>
            <p>Her public music catalog includes projects such as <em>555</em> and <em>HEARTSPELL</em>, alongside releases including “Found You” and “Bites The Dust.”</p>
            <span className="creator-footnote">Music, performance & EBG+ originals</span>
          </article>
          <article className="public-creator-card">
            <div className="public-creator-mark">EV</div>
            <p className="eyebrow">Artist spotlight</p>
            <h3>Empress V</h3>
            <p>Her public catalog includes <em>Soft Lips, Hard Truths</em> and songs such as “On Repeat,” “Love Me Loud,” and “Phone On Silent.”</p>
            <span className="creator-footnote">Music, performance & visual storytelling</span>
          </article>
          <article className="public-creator-card">
            <div className="public-creator-mark">GS</div>
            <p className="eyebrow">Artist spotlight</p>
            <h3>Goldie Songs</h3>
            <p>Her public catalog includes <em>MADE FOR MORE</em>, <em>NOSTALGIA</em>, “Safe with me,” and “Crowned.”</p>
            <span className="creator-footnote">Music, conversations & artist stories</span>
          </article>
        </div>
      </section>

      {previewShows.length > 0 && (
        <section className="public-preview-section">
          <div className="public-section-heading compact">
            <p className="eyebrow">On EBG+</p>
            <h2>A first look at the world.</h2>
          </div>
          <div className="public-preview-grid">
            {previewShows.map((show) => (
              <article key={show.id} className="public-preview-card" style={{ backgroundImage: \`url(\${show.banner || show.artwork})\` }}>
                <div>
                  <span>{show.status}</span>
                  <h3>{show.title}</h3>
                  <p>{show.genre}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="public-join-banner">
        <div>
          <p className="eyebrow">Your seat is waiting</p>
          <h2>One account connects your EBG+ experience.</h2>
          <p>Use one email for your account and eligible casting submissions so application updates can stay connected to you.</p>
        </div>
        <div className="actions">
          <Link className="btn" to="/auth/create-account">Join EBG+</Link>
          <Link className="btn muted" to="/about">Learn About EBG</Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}`

must(/function LandingPage\([\s\S]*?\n\}\n\nfunction AuthLayout/, `${landingPage}\n\nfunction AuthLayout`, 'public landing page')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.16 public landing experience.')
