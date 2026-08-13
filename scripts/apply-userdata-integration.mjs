import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_SUPABASE_USERDATA_INTEGRATED')) process.exit(0)

const mustReplace = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Could not apply ${label} integration patch.`)
  source = next
}

mustReplace(
  "import { requestPasswordReset, updateRecoveredPassword } from './lib/passwordRecovery'",
  `import { requestPasswordReset, updateRecoveredPassword } from './lib/passwordRecovery'\nimport {\n  addToWatchlist,\n  loadCastingApplications,\n  loadPlaybackProgress,\n  loadWatchlist,\n  removeFromWatchlist,\n  savePlaybackProgress,\n  submitCastingApplication,\n} from './lib/userData'\n\n// EBG_SUPABASE_USERDATA_INTEGRATED`,
  'user data imports',
)

mustReplace(
  "  const [castingApps, setCastingApps] = useState<CastingApplication[]>(() => loadJson(STORAGE.casting, []))",
  "  const [castingApps, setCastingApps] = useState<CastingApplication[]>([])",
  'casting state',
)

mustReplace(
  "  useEffect(() => saveJson(STORAGE.casting, castingApps), [castingApps])\n",
  '',
  'legacy casting persistence',
)

mustReplace(
  /  const applyAuthState = \(state: AuthState\) => \{[\s\S]*?\n  \}\n\n  const handleSignOut/,
  `  const loadStaffCasting = async (state: AuthState) => {
    if (!['founder', 'administrator', 'producer', 'editor'].includes(state.account.role)) {
      setCastingApps([])
      return
    }
    try {
      const rows = await loadCastingApplications()
      setCastingApps(rows.map((row) => ({
        id: row.id ?? id(),
        legalName: row.legal_name,
        age: row.age,
        cityState: row.city_state,
        email: row.email,
        relationshipGoals: row.relationship_goals,
        cameraComfort: row.camera_comfort,
        status: row.status ?? 'New',
      })))
    } catch (error) {
      console.error('Could not load casting applications.', error)
    }
  }

  const applyAuthState = (state: AuthState) => {
    setAuthState(state)
    setAccount((previous) => authAccountToUi(state, previous))
    setProfileId(null)
    void loadStaffCasting(state)
  }

  const handleSignOut`,
  'staff casting loader',
)

mustReplace(
  "        setAccount((previous) => authAccountToUi(state, previous))",
  "        setAccount((previous) => authAccountToUi(state, previous))\n        void loadStaffCasting(state)",
  'restore staff casting',
)

mustReplace(
  /  const syncProfileChanges = async \(before: Account, after: Account\) => \{[\s\S]*?\n  \}\n\n  const upsertAccount/,
  `  const syncProfileChanges = async (before: Account, after: Account) => {
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

      for (const nextProfile of after.profiles) {
        const previous = before.profiles.find((item) => item.id === nextProfile.id)
        if (!previous) continue

        const addedShows = nextProfile.watchlist.filter((showId) => !previous.watchlist.includes(showId))
        const removedShows = previous.watchlist.filter((showId) => !nextProfile.watchlist.includes(showId))
        for (const showId of addedShows) await addToWatchlist(nextProfile.id, showId)
        for (const showId of removedShows) await removeFromWatchlist(nextProfile.id, showId)

        const playbackIds = new Set([...Object.keys(previous.playback), ...Object.keys(nextProfile.playback)])
        for (const episodeId of playbackIds) {
          const beforeSeconds = previous.playback[episodeId] ?? 0
          const afterSeconds = nextProfile.playback[episodeId] ?? 0
          if (beforeSeconds !== afterSeconds) await savePlaybackProgress(nextProfile.id, episodeId, afterSeconds)
        }
      }

      if (removed.length || added.length || changed.length) await refreshAccountFromServer()
    } catch (error) {
      console.error('Could not sync EBG+ profile changes.', error)
    }
  }

  const upsertAccount`,
  'profile data syncing',
)

mustReplace(
  "              onSelect={(nextProfileId) => setProfileId(nextProfileId)}",
  `              onSelect={(nextProfileId) => {
                Promise.all([loadWatchlist(nextProfileId), loadPlaybackProgress(nextProfileId)])
                  .then(([watchlist, playback]) => {
                    setAccount((previous) => previous ? {
                      ...previous,
                      profiles: previous.profiles.map((item) => item.id === nextProfileId ? { ...item, watchlist, playback } : item),
                    } : previous)
                    setProfileId(nextProfileId)
                  })
                  .catch((error) => {
                    console.error('Could not load profile data.', error)
                    setProfileId(nextProfileId)
                  })
              }}`,
  'profile data hydration',
)

mustReplace(
  "              onCreateCastingApplication={(app) => setCastingApps((prev) => [app, ...prev])}",
  `              onCreateCastingApplication={async (app) => {
                const row = await submitCastingApplication({
                  legalName: app.legalName,
                  age: app.age,
                  cityState: app.cityState,
                  email: app.email,
                  relationshipGoals: app.relationshipGoals,
                  cameraComfort: app.cameraComfort,
                })
                const saved: CastingApplication = {
                  ...app,
                  id: row.id ?? app.id,
                  status: row.status ?? 'New',
                }
                setCastingApps((prev) => [saved, ...prev])
              }}`,
  'casting submission',
)

mustReplace(
  "  onCreateCastingApplication: (app: CastingApplication) => void",
  "  onCreateCastingApplication: (app: CastingApplication) => Promise<void>",
  'casting callback type',
)

const castingPage = `function CastingPage({ onSubmitApplication }: { onSubmitApplication: (app: CastingApplication) => Promise<void> }) {
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const age = Number(form.get('age') ?? 0)
    if (age < 21) {
      setState('Heartspell House applicants must be 21+.')
      return
    }
    const app: CastingApplication = {
      id: id(),
      legalName: String(form.get('legalName') ?? ''),
      age,
      cityState: String(form.get('cityState') ?? ''),
      email: String(form.get('email') ?? ''),
      relationshipGoals: String(form.get('relationshipGoals') ?? ''),
      cameraComfort: String(form.get('cameraComfort') ?? ''),
      status: 'New',
    }
    setLoading(true)
    setState('')
    try {
      await onSubmitApplication(app)
      formEl.reset()
      setState('Application submitted privately to EBG Studio.')
    } catch (error) {
      setState(error instanceof Error ? error.message : 'Application could not be submitted.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <h1>Casting & Submissions</h1>
      <p>Heartspell House casting requires applicants to be 21+ and consent to platform rules.</p>
      <form onSubmit={onSubmit} className="panel form-grid">
        <label>Legal or Preferred Name<input name="legalName" required /></label>
        <label>Age<input type="number" name="age" min={21} required /></label>
        <label>City / State<input name="cityState" required /></label>
        <label>Email<input type="email" name="email" required /></label>
        <label>Relationship Goals<textarea name="relationshipGoals" required /></label>
        <label>Camera Comfort<textarea name="cameraComfort" required /></label>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Application'}</button>
      </form>
      {state && <p>{state}</p>}
    </main>
  )
}`

mustReplace(/function CastingPage\([\s\S]*?\n\}\n\nfunction MusicPage/, `${castingPage}\n\nfunction MusicPage`, 'casting page')

mustReplace(
  "  const [profileId, setProfileId] = useState<string | null>(null)",
  "  const [profileId, setProfileId] = useState<string | null>(() => localStorage.getItem('ebg.activeProfile.v1'))",
  'persisted profile selection',
)

mustReplace(
  "  const [authLoading, setAuthLoading] = useState(true)",
  `  const [authLoading, setAuthLoading] = useState(true)\n\n  useEffect(() => {\n    if (profileId) localStorage.setItem('ebg.activeProfile.v1', profileId)\n    else localStorage.removeItem('ebg.activeProfile.v1')\n  }, [profileId])`,
  'profile persistence effect',
)

mustReplace(
  /function ProtectedRoute\(\{[\s\S]*?\n\}\n\nfunction LandingPage/,
  `function ProtectedRoute({\n  account,\n  profile,\n  requireProfile = false,\n  children,\n}: {\n  account: Account | null\n  profile?: Profile | null\n  requireProfile?: boolean\n  children: ReactNode\n}) {\n  const location = useLocation()\n  if (!account) {\n    if (location.pathname.startsWith('/app/')) sessionStorage.setItem('ebg.returnTo.v1', location.pathname)\n    return <Navigate to=\"/auth/sign-in\" replace />\n  }\n  if (requireProfile && !profile) {\n    if (location.pathname.startsWith('/app/')) sessionStorage.setItem('ebg.returnTo.v1', location.pathname)\n    return <Navigate to=\"/profiles\" replace />\n  }\n  return <>{children}</>\n}\n\nfunction LandingPage`,
  'protected route return path',
)

mustReplace(
  "                onSelect(entry.id)\n                nav('/app/home')",
  `                onSelect(entry.id)\n                const returnTo = sessionStorage.getItem('ebg.returnTo.v1') || '/app/home'\n                sessionStorage.removeItem('ebg.returnTo.v1')\n                nav(returnTo)`,
  'profile return navigation',
)

mustReplace(
  `        <div className="right-nav">\n          <Link to="/app/search">Search</Link>\n          <Link to="/app/my-list">My List</Link>\n          <Link to="/app/notifications">Notifications</Link>\n          <Link to="/app/settings">{profile.avatar}</Link>\n        </div>`,
  `        <div className="right-nav">\n          <Link to="/app/search">Search</Link>\n          <Link to="/app/my-list">My List</Link>\n          <Link to="/app/casting">Casting</Link>\n          {['founder', 'administrator', 'producer', 'editor'].includes(account.role) && (\n            <Link to="/app/studio">EBG Studio</Link>\n          )}\n          <Link to="/app/notifications">Notifications</Link>\n          <Link to="/app/settings">{profile.avatar}</Link>\n        </div>`,
  'Studio navigation link',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Supabase user-data integration with Studio navigation fixes.')