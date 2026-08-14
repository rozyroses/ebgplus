import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_PHASE114_FOOTER_PAGES')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.14 patch failed: ${label}`)
  source = next
}

must(
  "import './phase113.css'",
  "import './phase113.css'\nimport './phase114-footer.css'\n\n// EBG_PHASE114_FOOTER_PAGES",
  'styles import',
)

must(
  `      <Route path="/" element={<LandingPage cms={cms} />} />`,
  `      <Route path="/" element={<LandingPage cms={cms} />} />\n      <Route path="/about" element={<AboutEbgPage />} />\n      <Route path="/help" element={<HelpCenterPage />} />\n      <Route path="/terms" element={<TermsPage />} />\n      <Route path="/privacy" element={<PrivacyPage />} />\n      <Route path="/accessibility" element={<AccessibilityPage />} />\n      <Route path="/partnerships" element={<PublicPartnershipsPage />} />`,
  'public footer routes',
)

const pages = `function PublicInfoShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" to="/">EBG+</Link>
        <nav><Link to="/">Home</Link><Link to="/auth/sign-in">Sign In</Link></nav>
      </header>
      <main className="info-page">
        <section className="info-hero">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </section>
        {children}
      </main>
      <Footer />
    </>
  )
}

function AboutEbgPage() {
  return (
    <PublicInfoShell eyebrow="About EBG" title="Stories, music, personalities, and worlds that keep growing." intro="EBG+ is the streaming home for EBG originals, reality programming, cinematic music experiences, specials, and the wider EBG universe.">
      <div className="info-grid">
        <section className="info-card"><h2>What lives here</h2><p>EBG+ brings together series, music films, interviews, behind-the-scenes moments, interactive fan experiences, and original projects in one place.</p></section>
        <section className="info-card"><h2>Built around creators</h2><p>Bijou Nicole, Empress V, and Goldie Songs are central creative pillars of the EBG world, with room for new talent, collaborators, and original productions to grow alongside them.</p></section>
        <section className="info-card info-wide"><h2>More than streaming</h2><p>EBG+ is designed to connect viewers to the story beyond the episode through casting, fan voting, application tracking, EBG Studio-powered updates, and future interactive experiences.</p></section>
      </div>
    </PublicInfoShell>
  )
}

function HelpCenterPage() {
  return (
    <PublicInfoShell eyebrow="Help Center" title="Need a hand?" intro="Quick answers for watching EBG+, managing your account, casting, and application updates.">
      <div className="info-grid">
        <section className="info-card"><h2>Account & profiles</h2><ul><li>Sign in with the email attached to your EBG+ account.</li><li>Use profiles to keep viewing activity and My List organized.</li><li>Password recovery is available from the sign-in screen.</li></ul></section>
        <section className="info-card"><h2>Watching</h2><ul><li>Playback progress is saved so you can continue later.</li><li>Use My List to save shows and specials.</li><li>If a title is marked Coming Soon, it is not yet available to play.</li></ul></section>
        <section className="info-card"><h2>Casting & applications</h2><ul><li>Open casting lives at forms.ebgplus.app.</li><li>Signed-in viewers can check their own status under Library → My Applications.</li><li>Application updates come from EBG casting and may change as a project moves forward.</li></ul></section>
        <section className="info-card"><h2>Still need help?</h2><p>Email EBG+ and include the email on your account plus a short description of what happened. Do not send passwords or private authentication codes.</p><div className="info-contact"><a href="mailto:hello@ebgplus.app">hello@ebgplus.app</a></div></section>
      </div>
    </PublicInfoShell>
  )
}

function TermsPage() {
  return (
    <PublicInfoShell eyebrow="Terms of Use" title="The ground rules for EBG+." intro="These terms explain the basic rules for using EBG+, its accounts, content, interactive features, and submission tools.">
      <div className="info-grid">
        <section className="info-card"><h2>Your account</h2><p>Keep your sign-in information secure and provide accurate account information. You are responsible for activity performed through your account unless you report unauthorized access.</p></section>
        <section className="info-card"><h2>Content & access</h2><p>EBG+ content, branding, artwork, video, audio, and platform materials are provided for personal viewing unless a separate written agreement says otherwise. Availability can change as programming is added, updated, or removed.</p></section>
        <section className="info-card"><h2>Acceptable use</h2><p>Do not interfere with the service, attempt to bypass access controls, scrape protected information, impersonate others, abuse voting systems, or use EBG+ to harm other people.</p></section>
        <section className="info-card"><h2>Casting & submissions</h2><p>Submitting a form does not guarantee selection, employment, compensation, screen time, or participation. EBG may review, decline, close, or advance submissions according to the needs and eligibility rules of each project.</p></section>
        <section className="info-card info-wide"><h2>Changes & contact</h2><p>Features and these terms may evolve as EBG+ grows. Material updates should be reflected on this page. Questions can be sent to <a href="mailto:hello@ebgplus.app">hello@ebgplus.app</a>.</p></section>
      </div>
      <p className="info-meta">Effective August 14, 2026.</p>
    </PublicInfoShell>
  )
}

function PrivacyPage() {
  return (
    <PublicInfoShell eyebrow="Privacy" title="Your information should have a clear purpose." intro="This page explains the kinds of information EBG+ uses to operate accounts, viewing features, casting submissions, and platform experiences.">
      <div className="info-grid">
        <section className="info-card"><h2>Information you provide</h2><p>This can include your account email, profile information, casting application details, and information you intentionally submit through EBG+ or EBG Forms.</p></section>
        <section className="info-card"><h2>Platform activity</h2><p>EBG+ may store information needed for features such as My List, playback progress, profiles, notifications, voting, and application status.</p></section>
        <section className="info-card"><h2>How it is used</h2><p>Information is used to provide the service, maintain accounts, personalize viewer features, operate casting workflows, protect platform integrity, and communicate relevant updates.</p></section>
        <section className="info-card"><h2>Service providers</h2><p>EBG+ relies on infrastructure and service providers to host, authenticate, store, and deliver parts of the platform. Information may be processed by those providers as necessary to operate EBG+.</p></section>
        <section className="info-card"><h2>Application privacy</h2><p>Viewer application tracking is designed so signed-in users can retrieve only applications associated with their own account identity or matching account email.</p></section>
        <section className="info-card"><h2>Your choices</h2><p>You can contact EBG+ about privacy questions or account information at <a href="mailto:hello@ebgplus.app">hello@ebgplus.app</a>. Never email your password or authentication codes.</p></section>
      </div>
      <p className="info-meta">Last updated August 14, 2026.</p>
    </PublicInfoShell>
  )
}

function AccessibilityPage() {
  return (
    <PublicInfoShell eyebrow="Accessibility" title="EBG+ should be enjoyable by as many people as possible." intro="Accessibility is an ongoing part of how EBG+ is designed, tested, and improved.">
      <div className="info-grid">
        <section className="info-card"><h2>Our approach</h2><p>We aim for readable contrast, keyboard-friendly navigation, meaningful labels, responsive layouts, and media experiences that can grow to support captions and other accessibility features.</p></section>
        <section className="info-card"><h2>Known growth areas</h2><p>EBG+ is still evolving. Caption coverage, focus behavior, screen-reader polish, motion preferences, and media controls should continue to improve as the platform expands.</p></section>
        <section className="info-card info-wide"><h2>Tell us what is not working</h2><p>If a page, control, form, or video experience creates an accessibility barrier, email <a href="mailto:hello@ebgplus.app">hello@ebgplus.app</a> with the page and a description of the issue so it can be reviewed.</p></section>
      </div>
    </PublicInfoShell>
  )
}

function PublicPartnershipsPage() {
  return (
    <PublicInfoShell eyebrow="Partnerships" title="Build something memorable with EBG." intro="EBG+ welcomes serious conversations around brand partnerships, sponsorships, production, distribution, music, events, and creative collaborations.">
      <div className="info-grid">
        <section className="info-card"><h2>Brand & sponsorship</h2><p>Integrated campaigns, sponsored experiences, event support, and thoughtful brand participation around EBG programming.</p></section>
        <section className="info-card"><h2>Production & distribution</h2><p>Production resources, location partnerships, post-production, distribution opportunities, platform expansion, and strategic collaborations.</p></section>
        <section className="info-card"><h2>Music & talent</h2><p>Performance opportunities, original music, artist collaborations, creative talent, and projects that fit the EBG universe.</p></section>
        <section className="info-card"><h2>Start a conversation</h2><p>Send a concise introduction, organization or project name, what you are proposing, and the best way to reach you.</p><div className="info-contact"><a href="mailto:hello@ebgplus.app?subject=EBG%2B%20Partnership%20Inquiry">hello@ebgplus.app</a></div></section>
      </div>
    </PublicInfoShell>
  )
}

`

must('function NotFoundPage() {', `${pages}function NotFoundPage() {`, 'public info components')

must(
  `<div>\n        <Link to="/app/universe">About EBG</Link>\n        <Link to="/app/settings">Help Center</Link>\n        <Link to="/app/settings">Terms</Link>\n        <Link to="/app/settings">Privacy</Link>\n        <Link to="/app/settings">Accessibility</Link>`,
  `<div>\n        <Link to="/about">About EBG</Link>\n        <Link to="/help">Help Center</Link>\n        <Link to="/terms">Terms</Link>\n        <Link to="/privacy">Privacy</Link>\n        <Link to="/accessibility">Accessibility</Link>`,
  'footer core links',
)

source = source.replace('        <Link to="/app/partnerships">Partnerships</Link>', '        <Link to="/partnerships">Partnerships</Link>')
source = source.replace('        <Link to="/app/casting">Casting</Link>\n', '')
source = source.replace('        <a href="https://forms.ebgplus.app">Casting</a>\n', '')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.14 real footer pages.')
