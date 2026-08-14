import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE116_AUTH_EXPERIENCE')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.16 patch failed: ${label}`)
  source = next
}

must(
  "import './phase115-home.css'",
  "import './phase115-home.css'\nimport './phase116-auth.css'\n\n// EBG_PHASE116_AUTH_EXPERIENCE",
  'styles import',
)

const authLayout = `function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="auth-page auth-experience">
      <div className="auth-backdrop" aria-hidden="true" />
      <header className="auth-topbar">
        <Link className="wordmark" to="/">EBG+</Link>
        <div className="auth-top-links">
          <Link to="/help">Help</Link>
          <Link to="/about">About EBG</Link>
        </div>
      </header>

      <div className="auth-stage">
        <section className="auth-story" aria-label="Welcome to EBG+">
          <p className="eyebrow">Stories live here.</p>
          <h1>One account. The whole EBG+ world.</h1>
          <p className="auth-lead">Stream originals, save what you love, follow casting updates, join fan voting, and keep your place across EBG+.</p>

          <div className="auth-benefits">
            <span>✓ Continue Watching</span>
            <span>✓ My List & profiles</span>
            <span>✓ Casting application updates</span>
            <span>✓ Interactive fan voting</span>
          </div>

          <div className="auth-creators-wrap">
            <div className="auth-section-heading">
              <p className="eyebrow">Inside the EBG world</p>
              <h2>Meet three creative pillars.</h2>
            </div>
            <div className="auth-creators">
              <article className="auth-creator-card">
                <span className="creator-monogram">BN</span>
                <div><h3>Bijou Nicole</h3><p>Her 2026 music catalog includes <em>555</em>, <em>HEARTSPELL</em>, “Found You,” and “Bites The Dust.”</p></div>
              </article>
              <article className="auth-creator-card">
                <span className="creator-monogram">EV</span>
                <div><h3>Empress V</h3><p>Her 2026 releases include <em>Soft Lips, Hard Truths</em> and “On Repeat,” with songs such as “Love Me Loud” and “Phone On Silent.”</p></div>
              </article>
              <article className="auth-creator-card">
                <span className="creator-monogram">GS</span>
                <div><h3>Goldie Songs</h3><p>Her 2026 catalog includes <em>MADE FOR MORE</em>, <em>NOSTALGIA</em>, “Safe with me,” and “Crowned.”</p></div>
              </article>
            </div>
          </div>
        </section>

        <section className="auth-card auth-card-premium">
          <div className="auth-card-heading">
            <p className="eyebrow">EBG+ Account</p>
            <h2>{title}</h2>
          </div>
          {children}
          <p className="auth-security-note">Your password stays private. EBG+ will never ask you to send a password or authentication code by email.</p>
          <div className="auth-legal-links">
            <Link to="/terms">Terms</Link><span>·</span><Link to="/privacy">Privacy</Link><span>·</span><Link to="/accessibility">Accessibility</Link>
          </div>
        </section>
      </div>
    </main>
  )
}`

must(/function AuthLayout\([\s\S]*?\n\}\n\nfunction SignInPage/, `${authLayout}\n\nfunction SignInPage`, 'AuthLayout')

must(
  `        <button className="btn" type="submit" disabled={loading}>\n          {loading ? 'Creating Account…' : 'Create Account'}\n        </button>\n      </form>`,
  `        <button className="btn" type="submit" disabled={loading}>\n          {loading ? 'Creating Account…' : 'Create Account'}\n        </button>\n      </form>\n      <p className="auth-account-note">Use an email you check regularly. If you submit an EBG casting application with the same email, your application can appear in <strong>Library → My Applications</strong> after you sign in.</p>\n      <p className="auth-consent-copy">By creating an account, you agree to the <Link to="/terms">Terms of Use</Link> and acknowledge the <Link to="/privacy">Privacy notice</Link>.</p>`,
  'create account guidance',
)

must(
  `      <div className="split-links">\n        <Link to="/auth/forgot-password">Forgot Password</Link>\n        <Link to="/auth/create-account">Create Account</Link>\n      </div>`,
  `      <div className="split-links">\n        <Link to="/auth/forgot-password">Forgot Password</Link>\n        <Link to="/auth/create-account">Create Account</Link>\n      </div>\n      <p className="auth-account-note compact">Signing in also reconnects your profiles, My List, playback progress, and eligible casting application updates.</p>`,
  'sign in guidance',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.16 premium auth experience.')
