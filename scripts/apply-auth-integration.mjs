import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_SUPABASE_AUTH_INTEGRATED')) {
  process.exit(0)
}

const mustReplace = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Could not apply ${label} integration patch.`)
  source = next
}

mustReplace(
  "import './App.css'",
  `import './App.css'\nimport {\n  createProfile as createDbProfile,\n  deleteProfile as deleteDbProfile,\n  restoreAuth,\n  signIn as supabaseSignIn,\n  signOut as supabaseSignOut,\n  signUp as supabaseSignUp,\n  updateProfile as updateDbProfile,\n  type AuthState,\n} from './lib/auth'\nimport { requestPasswordReset, updateRecoveredPassword } from './lib/passwordRecovery'\n\n// EBG_SUPABASE_AUTH_INTEGRATED`,
  'auth imports',
)

const shell = `function authAccountToUi(state: AuthState, previous?: Account | null): Account {
  return {
    id: state.account.id,
    email: state.account.email,
    passwordHash: '',
    role: state.account.role,
    profiles: state.profiles.map((profile) => {
      const prior = previous?.profiles.find((item) => item.id === profile.id)
      return {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        watchlist: prior?.watchlist ?? [],
        playback: prior?.playback ?? {},
        liked: prior?.liked ?? [],
        autoplayNext: profile.autoplay_next,
      }
    }),
    notifications: previous?.notifications ?? defaultNotifications,
  }
}

function Shell() {
  const [cms, setCms] = useState<CmsData>(() => loadJson(STORAGE.cms, seedCms))
  const [castingApps, setCastingApps] = useState<CastingApplication[]>(() => loadJson(STORAGE.casting, []))
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => saveJson(STORAGE.cms, cms), [cms])
  useEffect(() => saveJson(STORAGE.casting, castingApps), [castingApps])

  useEffect(() => {
    let active = true
    restoreAuth()
      .then((state) => {
        if (!active || !state) return
        setAuthState(state)
        setAccount((previous) => authAccountToUi(state, previous))
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const profile = useMemo(() => account?.profiles.find((entry) => entry.id === profileId) ?? null, [account, profileId])

  const applyAuthState = (state: AuthState) => {
    setAuthState(state)
    setAccount((previous) => authAccountToUi(state, previous))
    setProfileId(null)
  }

  const handleSignOut = async () => {
    await supabaseSignOut()
    setAuthState(null)
    setAccount(null)
    setProfileId(null)
  }

  const refreshAccountFromServer = async () => {
    const state = await restoreAuth()
    if (!state) return
    setAuthState(state)
    setAccount((previous) => authAccountToUi(state, previous))
  }

  const syncProfileChanges = async (before: Account, after: Account) => {
    try {
      const removed = before.profiles.filter((item) => !after.profiles.some((next) => next.id === item.id))
      for (const profile of removed) await deleteDbProfile(profile.id)

      const added = after.profiles.filter((item) => !before.profiles.some((previous) => previous.id === item.id))
      for (const profile of added) await createDbProfile(profile.name, profile.avatar)

      const changed = after.profiles.filter((next) => {
        const previous = before.profiles.find((item) => item.id === next.id)
        return previous && (
          previous.name !== next.name ||
          previous.avatar !== next.avatar ||
          previous.autoplayNext !== next.autoplayNext
        )
      })
      for (const profile of changed) {
        await updateDbProfile(profile.id, {
          name: profile.name,
          avatar: profile.avatar,
          autoplay_next: profile.autoplayNext,
        })
      }

      if (removed.length || added.length || changed.length) await refreshAccountFromServer()
    } catch (error) {
      console.error('Could not sync EBG+ profile changes.', error)
    }
  }

  const upsertAccount = (updated: Account) => {
    setAccount((previous) => {
      if (previous) void syncProfileChanges(previous, updated)
      return updated
    })
  }

  if (authLoading) {
    return (
      <main className="auth-page">
        <span className="wordmark">EBG+</span>
        <p>Opening EBG+…</p>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage cms={cms} />} />
      <Route
        path="/auth/sign-in"
        element={
          <SignInPage
            onSignIn={async (email, password) => {
              const state = await supabaseSignIn(email, password)
              applyAuthState(state)
            }}
          />
        }
      />
      <Route
        path="/auth/create-account"
        element={
          <CreateAccountPage
            onCreate={async (email, password) => {
              const state = await supabaseSignUp(email, password)
              if (state) applyAuthState(state)
              return state
            }}
          />
        }
      />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/profiles"
        element={
          <ProtectedRoute account={account}>
            <ProfileSelectPage
              account={account!}
              activeProfileId={profileId}
              onSelect={(nextProfileId) => setProfileId(nextProfileId)}
              onUpdateAccount={upsertAccount}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute account={account} profile={profile} requireProfile>
            <AppLayout
              account={account!}
              profile={profile!}
              cms={cms}
              castingApps={castingApps}
              onUpdateCms={setCms}
              onUpdateAccount={upsertAccount}
              onSignOut={handleSignOut}
              onCreateCastingApplication={(app) => setCastingApps((prev) => [app, ...prev])}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}`

mustReplace(/function Shell\(\) \{[\s\S]*?\n\}\n\nfunction ProtectedRoute/, `${shell}\n\nfunction ProtectedRoute`, 'Shell')

const signInPage = `function SignInPage({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<void> }) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSignIn(email, password)
      nav('/profiles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Signing In…' : 'Sign In'}
        </button>
      </form>
      <div className="split-links">
        <Link to="/auth/forgot-password">Forgot Password</Link>
        <Link to="/auth/create-account">Create Account</Link>
      </div>
    </AuthLayout>
  )
}`

mustReplace(/function SignInPage[\s\S]*?\n\}\n\nfunction CreateAccountPage/, `${signInPage}\n\nfunction CreateAccountPage`, 'sign in page')

const createAccountPage = `function CreateAccountPage({
  onCreate,
}: {
  onCreate: (email: string, password: string) => Promise<AuthState | null>
}) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const state = await onCreate(email, password)
      if (!state) {
        setMessage('Check your email to confirm your EBG+ account, then come back and sign in.')
        return
      }
      nav('/profiles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Confirm Password
          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required autoComplete="new-password" />
        </label>
        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  )
}`

mustReplace(/function CreateAccountPage[\s\S]*?\n\}\n\nfunction ForgotPasswordPage/, `${createAccountPage}\n\nfunction ForgotPasswordPage`, 'create account page')

const forgotPasswordPage = `function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setState('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setState('Check your email for the secure EBG+ password reset link.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot Password">
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" />
        </label>
        {error && <p className="error">{error}</p>}
        {state && <p>{state}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <div className="split-links"><Link to="/auth/sign-in">Back to Sign In</Link></div>
    </AuthLayout>
  )
}`

mustReplace(/function ForgotPasswordPage\(\)[\s\S]*?\n\}\n\nfunction ResetPasswordPage/, `${forgotPasswordPage}\n\nfunction ResetPasswordPage`, 'forgot password page')

const resetPasswordPage = `function ResetPasswordPage() {
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await updateRecoveredPassword(password)
      setState('Password updated. Taking you back to sign in…')
      setTimeout(() => nav('/auth/sign-in'), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Password Reset">
      <form onSubmit={onSubmit}>
        <label>
          New Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Confirm Password
          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required autoComplete="new-password" />
        </label>
        {error && <p className="error">{error}</p>}
        {state && <p>{state}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  )
}`

mustReplace(/function ResetPasswordPage[\s\S]*?\n\}\n\nfunction ProfileSelectPage/, `${resetPasswordPage}\n\nfunction ProfileSelectPage`, 'reset password page')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Supabase auth integration.')
