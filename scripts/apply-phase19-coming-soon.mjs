import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE19_COMING_SOON')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.9 patch failed: ${label}`)
  source = next
}

must(
  "import './phase18.css'",
  "import './phase18.css'\nimport { getLaunchWaitlistStats, joinLaunchWaitlist, sendLaunchAnnouncement, unsubscribeLaunchWaitlist } from './lib/launchWaitlist'\nimport './phase19.css'\n\n// EBG_PHASE19_COMING_SOON",
  'phase 1.9 imports',
)

must(
  `      <Route path="/" element={<LandingPage cms={cms} />} />`,
  `      <Route path="/" element={<LandingPage cms={cms} />} />\n      <Route path="/coming-soon" element={<ComingSoonPage />} />\n      <Route path="/unsubscribe" element={<UnsubscribePage />} />`,
  'public coming soon routes',
)

const publicPages = `function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState('busy')
    setMessage('')
    try {
      await joinLaunchWaitlist(email)
      setState('success')
      setMessage("you're in. we'll email you the moment EBG+ opens its doors. ✨")
      setEmail('')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Could not join the waitlist.')
    }
  }

  return (
    <main className="coming-soon-page">
      <section className="coming-soon-card">
        <Link className="wordmark" to="/" aria-label="EBG+ home">EBG+</Link>
        <p className="coming-soon-kicker">The next chapter is almost here</p>
        <h1>Something new is coming.</h1>
        <p className="coming-soon-copy">Original shows. Music. Stories. One universe. Be first inside EBG+ when we officially launch.</p>
        <form className="waitlist-form" onSubmit={submit}>
          <input
            aria-label="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button className="btn" disabled={state === 'busy'}>{state === 'busy' ? 'Joining…' : 'Join the Waitlist'}</button>
        </form>
        <p className="waitlist-consent">By joining, you agree to receive EBG+ launch updates at this email. You can unsubscribe at any time.</p>
        {message && <p className={\`waitlist-status \${state === 'success' ? 'success' : 'error'}\`}>{message}</p>}
        <p className="coming-soon-signin">Already part of the team? <Link to="/auth/sign-in">Staff sign in</Link></p>
      </section>
    </main>
  )
}

function UnsubscribePage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [message, setMessage] = useState(token ? 'Removing you from launch emails…' : 'This unsubscribe link is invalid.')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void unsubscribeLaunchWaitlist(token)
      .then((result) => {
        if (!cancelled) setMessage(result?.ok ? "You're unsubscribed from EBG+ launch emails." : 'This unsubscribe link is no longer active.')
      })
      .catch(() => {
        if (!cancelled) setMessage('We could not update your email preference. Please try again.')
      })
    return () => { cancelled = true }
  }, [token])

  return (
    <main className="coming-soon-page">
      <section className="coming-soon-card unsubscribe-card">
        <Link className="wordmark" to="/">EBG+</Link>
        <p className="coming-soon-kicker">Email preferences</p>
        <h1>Got you.</h1>
        <p className="coming-soon-copy">{message}</p>
        <Link className="btn" to="/">Back to EBG+</Link>
      </section>
    </main>
  )
}

function LaunchWaitlistPanel() {
  const [stats, setStats] = useState<{ total: number; active: number; notified: number; unsubscribed: number } | null>(null)
  const [state, setState] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    try {
      setStats(await getLaunchWaitlistStats())
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Could not load waitlist stats.')
    }
  }

  useEffect(() => { void refresh() }, [])

  const sendLaunch = async () => {
    if (!confirm('Send the EBG+ launch announcement to every active waitlist subscriber who has not been notified yet?')) return
    setBusy(true)
    setState('Sending launch emails…')
    try {
      const result = await sendLaunchAnnouncement()
      setState(result.sent > 0 ? \`Launch email sent to \${result.sent} subscriber\${result.sent === 1 ? '' : 's'}.\` : 'Everyone on the active waitlist has already been notified.')
      await refresh()
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Launch emails could not be sent.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="launch-waitlist-panel">
      <h3>Launch Waitlist</h3>
      <p className="studio-help">The public Coming Soon page stores email signups in Supabase. Founder, administrator, or producer accounts can send the launch announcement from here after the email function is configured.</p>
      {stats && (
        <div className="launch-waitlist-stats">
          <div className="launch-waitlist-stat"><strong>{stats.active}</strong><span>Active</span></div>
          <div className="launch-waitlist-stat"><strong>{stats.notified}</strong><span>Notified</span></div>
          <div className="launch-waitlist-stat"><strong>{stats.unsubscribed}</strong><span>Unsubscribed</span></div>
        </div>
      )}
      <div className="actions">
        <Link className="btn muted" to="/coming-soon" target="_blank">Preview Coming Soon</Link>
        <button className="btn muted" type="button" onClick={() => void refresh()} disabled={busy}>Refresh Count</button>
      </div>
      <div className="danger-zone">
        <button className="btn" type="button" onClick={() => void sendLaunch()} disabled={busy}>{busy ? 'Sending…' : 'Send Launch Announcement'}</button>
        {state && <p className="studio-help">{state}</p>}
      </div>
    </section>
  )
}

`

must('function LandingPage({ cms }: { cms: CmsData }) {', `${publicPages}function LandingPage({ cms }: { cms: CmsData }) {`, 'public page components')

must(
  `<Link to="/auth/create-account">Join EBG+</Link>\n          <Link to="/auth/sign-in" className="btn">`,
  `<Link to="/coming-soon">Coming Soon</Link>\n          <Link to="/auth/create-account">Join EBG+</Link>\n          <Link to="/auth/sign-in" className="btn">`,
  'coming soon landing nav link',
)

must(
  `<Link className="btn" to="/auth/create-account">\n              Join EBG+\n            </Link>`,
  `<Link className="btn" to="/coming-soon">\n              Get Launch Updates\n            </Link>`,
  'landing waitlist CTA',
)

must(
  `<p className="studio-help">The featured show owns the large Home hero. Only shows with Home visibility turned on can be featured.</p>`,
  `<p className="studio-help">The featured show owns the large Home hero. Only shows with Home visibility turned on can be featured.</p>\n          <LaunchWaitlistPanel />`,
  'Studio launch waitlist panel',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.9 Coming Soon waitlist and launch-email controls.')
