import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE110_COMING_SOON_POLISH')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.10 patch failed: ${label}`)
  source = next
}

must(
  "import './phase19.css'",
  "import './phase19.css'\nimport './phase110.css'\n\n// EBG_PHASE110_COMING_SOON_POLISH",
  'phase 1.10 styles',
)

must(
  `<section className="coming-soon-card">\n        <Link className="wordmark" to="/" aria-label="EBG+ home">EBG+</Link>\n        <p className="coming-soon-kicker">The next chapter is almost here</p>\n        <h1>Something new is coming.</h1>\n        <p className="coming-soon-copy">Original shows. Music. Stories. One universe. Be first inside EBG+ when we officially launch.</p>\n        <form className="waitlist-form" onSubmit={submit}>`,
  `<section className="coming-soon-card ebg-launch-card">\n        <div className="ebg-launch-topbar">\n          <Link to="/" aria-label="EBG+ home">\n            <img className="ebg-launch-logo" src={\`${import.meta.env.BASE_URL}ebgplus-logo.png\`} alt="EBG+" />\n          </Link>\n          <span className="ebg-launch-status">Opening soon</span>\n        </div>\n        <div className="ebg-launch-main">\n          <p className="coming-soon-kicker">The next chapter is almost here</p>\n          <h1>Entertainment, <span>the EBG way.</span></h1>\n          <p className="coming-soon-copy">Original shows, music, stories, and a universe built around the people creating it. Join early and be first inside when EBG+ opens its doors.</p>\n          <div className="ebg-launch-pillars" aria-label="What is coming to EBG+">\n            <div className="ebg-launch-pillar"><strong>Original Shows</strong>Series, reality, and new EBG+ originals.</div>\n            <div className="ebg-launch-pillar"><strong>Music</strong>Artist hubs, releases, performances, and more.</div>\n            <div className="ebg-launch-pillar"><strong>EBG Universe</strong>Stories, people, worlds, and everything between.</div>\n          </div>\n          <form className="waitlist-form" onSubmit={submit}>`,
  'coming soon hero',
)

must(
  `        <p className="waitlist-consent">By joining, you agree to receive EBG+ launch updates at this email. You can unsubscribe at any time.</p>\n        {message && <p className={\`waitlist-status \${state === 'success' ? 'success' : 'error'}\`}>{message}</p>}\n        <p className="coming-soon-signin">Already part of the team? <Link to="/auth/sign-in">Staff sign in</Link></p>\n      </section>`,
  `          <p className="waitlist-consent">By joining, you agree to receive EBG+ launch updates at this email. You can unsubscribe at any time.</p>\n          {message && <p className={\`waitlist-status \${state === 'success' ? 'success' : 'error'}\`}>{message}</p>}\n        </div>\n        <footer className="ebg-launch-footer">\n          <p className="ebg-launch-footer-copy">EBG+ is a new home for original entertainment from EBG. Early subscribers get launch updates only — no clutter, no daily spam.</p>\n          <p className="coming-soon-signin">Already part of the team? <Link to="/auth/sign-in">Staff sign in</Link></p>\n        </footer>\n      </section>`,
  'coming soon footer',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.10 Coming Soon polish.')
