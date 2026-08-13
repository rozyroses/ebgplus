import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'

type Role = 'viewer' | 'editor' | 'producer' | 'administrator' | 'founder'

type Episode = {
  id: string
  showId: string
  season: number
  number: number
  title: string
  synopsis: string
  runtime: string
  releaseDate: string
  thumbnail: string
  videoUrl: string
}

type Show = {
  id: string
  title: string
  category: string
  description: string
  genre: string
  year: number
  maturity: 'TV-PG' | 'TV-14' | 'TV-MA'
  status: 'Coming Soon' | 'Now Streaming' | 'Current' | 'On Hiatus' | 'Completed'
  artwork: string
  logo: string
  cast: Array<{ name: string; role: string; city: string; bio: string }>
}

type ContentRail = {
  id: string
  title: string
  showIds: string[]
}

type NotificationItem = {
  id: string
  text: string
  date: string
  read: boolean
}

type CastingApplication = {
  id: string
  legalName: string
  age: number
  cityState: string
  email: string
  relationshipGoals: string
  cameraComfort: string
  status: 'New' | 'Reviewing' | 'Callback' | 'Interview' | 'Finalist' | 'Cast' | 'Declined' | 'Removed'
}

type CmsData = {
  slogan: string
  heroShowId: string
  shows: Show[]
  episodes: Episode[]
  rails: ContentRail[]
  comingSoon: string[]
}

type Profile = {
  id: string
  name: string
  avatar: string
  watchlist: string[]
  playback: Record<string, number>
  liked: string[]
  autoplayNext: boolean
}

type Account = {
  id: string
  email: string
  passwordHash: string
  role: Role
  profiles: Profile[]
  notifications: NotificationItem[]
}

const STORAGE = {
  accounts: 'ebg.accounts.v1',
  cms: 'ebg.cms.v1',
  casting: 'ebg.casting.v1',
}

const AVATARS = ['✨', '💛', '🎬', '🎤', '🌙', '👑', '🎭', '💫', '🎻', '🔥']

const seedCms: CmsData = {
  slogan: 'Stories live here.',
  heroShowId: 'heartspell-house',
  shows: [
    {
      id: 'heartspell-house',
      title: 'Heartspell House',
      category: 'EBG+ Original · Reality & Romance',
      description:
        'A glamorous reality dating experiment where real singles navigate romance, loyalty, and chaos under one cinematic roof.',
      genre: 'Reality, Romance',
      year: 2026,
      maturity: 'TV-14',
      status: 'Now Streaming',
      artwork:
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1600&q=80',
      logo: 'HEARTSPELL HOUSE',
      cast: [
        {
          name: 'Ari Monroe',
          role: 'Contestant',
          city: 'Atlanta, GA',
          bio: 'A hopeless romantic with a sharp wit and no patience for mixed signals.',
        },
        {
          name: 'Nia Sol',
          role: 'Contestant',
          city: 'Houston, TX',
          bio: 'A creative strategist searching for loyalty, laughter, and a real connection.',
        },
        {
          name: 'Rome Vega',
          role: 'Contestant',
          city: 'Los Angeles, CA',
          bio: 'A charismatic musician balancing chemistry, ambition, and complicated feelings.',
        },
      ],
    },
    {
      id: 'bijou-live',
      title: 'Bijou Nicole: Midnight Session',
      category: 'Music on EBG+',
      description: 'An intimate live performance filmed in antique-gold candlelight.',
      genre: 'Music Special',
      year: 2026,
      maturity: 'TV-PG',
      status: 'Coming Soon',
      artwork:
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1600&q=80',
      logo: 'BIJOU NICOLE',
      cast: [],
    },
    {
      id: 'empress-after-dark',
      title: 'Empress V: After Dark',
      category: 'EBG Universe',
      description: 'A theatrical concert film with bold storytelling and live arrangements.',
      genre: 'Music, Performance',
      year: 2026,
      maturity: 'TV-14',
      status: 'Coming Soon',
      artwork:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      logo: 'EMPRESS V',
      cast: [],
    },
    {
      id: 'goldie-conversations',
      title: 'Goldie Songs: Conversations in Color',
      category: 'EBG News',
      description: 'Soulful interviews, backstage moments, and reflections on artistry.',
      genre: 'Documentary, Interview',
      year: 2026,
      maturity: 'TV-PG',
      status: 'Coming Soon',
      artwork:
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80',
      logo: 'GOLDIE SONGS',
      cast: [],
    },
  ],
  episodes: [
    {
      id: 'hs-s1e1',
      showId: 'heartspell-house',
      season: 1,
      number: 1,
      title: 'First Impressions, Final Consequences',
      synopsis: 'Singles enter Heartspell House and first sparks collide with instant rivalries.',
      runtime: '47m',
      releaseDate: '2026-08-01',
      thumbnail:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: 'hs-s1e2',
      showId: 'heartspell-house',
      season: 1,
      number: 2,
      title: 'The Loyalty Test',
      synopsis: 'A surprise challenge splits couples and exposes hidden intentions.',
      runtime: '51m',
      releaseDate: '2026-08-08',
      thumbnail:
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: 'hs-s1e3',
      showId: 'heartspell-house',
      season: 1,
      number: 3,
      title: 'Messy in the Best Way',
      synopsis: 'A new arrival turns the house upside down during a midnight reveal.',
      runtime: '49m',
      releaseDate: '2026-08-15',
      thumbnail:
        'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  ],
  rails: [
    { id: 'trending', title: 'Trending on EBG+', showIds: ['heartspell-house', 'bijou-live', 'empress-after-dark'] },
    { id: 'originals', title: 'EBG+ Originals', showIds: ['heartspell-house'] },
    { id: 'music', title: 'Music on EBG+', showIds: ['bijou-live', 'empress-after-dark', 'goldie-conversations'] },
    { id: 'founders', title: 'From the EBG Founders', showIds: ['bijou-live', 'empress-after-dark', 'goldie-conversations'] },
    { id: 'coming', title: 'Coming Soon', showIds: ['bijou-live', 'empress-after-dark', 'goldie-conversations'] },
  ],
  comingSoon: ['bijou-live', 'empress-after-dark', 'goldie-conversations'],
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'n1',
    text: 'Heartspell House voting opens this Friday at 8PM ET.',
    date: '2026-08-12',
    read: false,
  },
  {
    id: 'n2',
    text: 'New episode available: Heartspell House S1:E3.',
    date: '2026-08-15',
    read: false,
  },
]

const loadJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const saveJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))

const id = () => Math.random().toString(36).slice(2, 10)

const hashPassword = async (email: string, password: string) => {
  const enc = new TextEncoder().encode(`${email.toLowerCase()}::${password}`)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const createStarterProfile = (name = 'Main Profile'): Profile => ({
  id: id(),
  name,
  avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] ?? '✨',
  watchlist: [],
  playback: {},
  liked: [],
  autoplayNext: true,
})

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}

function Shell() {
  const [cms, setCms] = useState<CmsData>(() => loadJson(STORAGE.cms, seedCms))
  const [accounts, setAccounts] = useState<Account[]>(() => loadJson(STORAGE.accounts, []))
  const [castingApps, setCastingApps] = useState<CastingApplication[]>(() => loadJson(STORAGE.casting, []))
  const [accountId, setAccountId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => saveJson(STORAGE.cms, cms), [cms])
  useEffect(() => saveJson(STORAGE.accounts, accounts), [accounts])
  useEffect(() => saveJson(STORAGE.casting, castingApps), [castingApps])

  const account = useMemo(() => accounts.find((entry) => entry.id === accountId) ?? null, [accountId, accounts])
  const profile = useMemo(() => account?.profiles.find((entry) => entry.id === profileId) ?? null, [account, profileId])

  const signOut = () => {
    setProfileId(null)
    setAccountId(null)
  }

  const upsertAccount = (updated: Account) =>
    setAccounts((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))

  return (
    <Routes>
      <Route path="/" element={<LandingPage cms={cms} />} />
      <Route
        path="/auth/sign-in"
        element={
          <SignInPage
            accounts={accounts}
            onSignedIn={(nextId) => {
              setAccountId(nextId)
              setProfileId(null)
            }}
          />
        }
      />
      <Route
        path="/auth/create-account"
        element={
          <CreateAccountPage
            accounts={accounts}
            onCreate={async (email, password) => {
              const passwordHash = await hashPassword(email, password)
              const role: Role = accounts.length === 0 ? 'founder' : 'viewer'
              const next: Account = {
                id: id(),
                email,
                passwordHash,
                role,
                profiles: [createStarterProfile()],
                notifications: defaultNotifications,
              }
              setAccounts((prev) => [...prev, next])
              setAccountId(next.id)
              setProfileId(null)
            }}
          />
        }
      />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/auth/reset-password"
        element={<ResetPasswordPage accounts={accounts} onUpdateAccounts={setAccounts} />}
      />
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
              onSignOut={signOut}
              onCreateCastingApplication={(app) => setCastingApps((prev) => [app, ...prev])}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function ProtectedRoute({
  account,
  profile,
  requireProfile = false,
  children,
}: {
  account: Account | null
  profile?: Profile | null
  requireProfile?: boolean
  children: ReactNode
}) {
  if (!account) return <Navigate to="/auth/sign-in" replace />
  if (requireProfile && !profile) return <Navigate to="/profiles" replace />
  return <>{children}</>
}

function LandingPage({ cms }: { cms: CmsData }) {
  return (
    <main className="landing">
      <header className="topbar">
        <span className="wordmark">EBG+</span>
        <nav>
          <Link to="/auth/create-account">Join EBG+</Link>
          <Link to="/auth/sign-in" className="btn">
            Sign In
          </Link>
        </nav>
      </header>
      <section className="hero" aria-label="Marketing hero">
        <div>
          <p className="eyebrow">EBG Original Network</p>
          <h1>{cms.slogan}</h1>
          <p>
            Premium series, reality television, cinematic music performances, and the evolving EBG universe — all in one
            place.
          </p>
          <div className="actions">
            <Link className="btn" to="/auth/create-account">
              Join EBG+
            </Link>
            <Link className="btn muted" to="/auth/sign-in">
              Sign In
            </Link>
          </div>
        </div>
      </section>
      <section className="feature-grid" aria-label="Platform highlights">
        <article>
          <h2>Heartspell House</h2>
          <p>Reality, romance, reunion specials, and interactive fan voting.</p>
        </article>
        <article>
          <h2>Music on EBG+</h2>
          <p>Performances, visual albums, interviews, rehearsals, and backstage sessions.</p>
        </article>
        <article>
          <h2>Founder Hubs</h2>
          <p>Bijou Nicole, Empress V, and Goldie Songs — equal creative pillars of EBG.</p>
        </article>
      </section>
      <Footer />
    </main>
  )
}

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <Link className="wordmark" to="/">
        EBG+
      </Link>
      <section className="auth-card">
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  )
}

function SignInPage({ accounts, onSignedIn }: { accounts: Account[]; onSignedIn: (id: string) => void }) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const target = accounts.find((entry) => entry.email.toLowerCase() === email.toLowerCase())
    if (!target) return setError('No account found for that email.')
    const passwordHash = await hashPassword(email, password)
    if (target.passwordHash !== passwordHash) return setError('Incorrect password.')
    onSignedIn(target.id)
    nav('/profiles')
  }

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">
          Sign In
        </button>
      </form>
      <div className="split-links">
        <Link to="/auth/forgot-password">Forgot Password</Link>
        <Link to="/auth/create-account">Create Account</Link>
      </div>
    </AuthLayout>
  )
}

function CreateAccountPage({
  accounts,
  onCreate,
}: {
  accounts: Account[]
  onCreate: (email: string, password: string) => Promise<void>
}) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (accounts.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) return setError('Email already in use.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    await onCreate(email, password)
    nav('/profiles')
  }

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} />
        </label>
        <label>
          Confirm Password
          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">
          Create Account
        </button>
      </form>
    </AuthLayout>
  )
}

function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password">
      <p>Enter your account email on the reset page to create a new password.</p>
      <Link className="btn" to="/auth/reset-password">
        Go to Password Reset
      </Link>
    </AuthLayout>
  )
}

function ResetPasswordPage({
  accounts,
  onUpdateAccounts,
}: {
  accounts: Account[]
  onUpdateAccounts: (accounts: Account[]) => void
}) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState('')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const index = accounts.findIndex((entry) => entry.email.toLowerCase() === email.toLowerCase())
    if (index < 0) return setState('No account found for that email.')
    const nextAccounts = [...accounts]
    nextAccounts[index] = {
      ...nextAccounts[index],
      passwordHash: await hashPassword(email, password),
    }
    onUpdateAccounts(nextAccounts)
    setState('Password reset complete. You can now sign in.')
    setTimeout(() => nav('/auth/sign-in'), 1200)
  }

  return (
    <AuthLayout title="Password Reset">
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          New Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} />
        </label>
        <button className="btn" type="submit">
          Reset Password
        </button>
      </form>
      {state && <p>{state}</p>}
    </AuthLayout>
  )
}

function ProfileSelectPage({
  account,
  activeProfileId,
  onSelect,
  onUpdateAccount,
}: {
  account: Account
  activeProfileId: string | null
  onSelect: (id: string) => void
  onUpdateAccount: (account: Account) => void
}) {
  const nav = useNavigate()
  const [manage, setManage] = useState(false)

  const removeProfile = (profileId: string) => {
    if (account.profiles.length <= 1) return
    onUpdateAccount({
      ...account,
      profiles: account.profiles.filter((entry) => entry.id !== profileId),
    })
  }

  return (
    <main className="profiles-page">
      <h1>Who's watching?</h1>
      <div className="profile-grid">
        {account.profiles.map((entry) => (
          <button
            key={entry.id}
            className={`profile-card ${activeProfileId === entry.id ? 'active' : ''}`}
            onClick={() => {
              if (!manage) {
                onSelect(entry.id)
                nav('/app/home')
              }
            }}
          >
            <span className="avatar" aria-hidden="true">
              {entry.avatar}
            </span>
            <span>{entry.name}</span>
            {manage && (
              <div className="manage-tools">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    const name = prompt('Rename profile', entry.name)
                    if (!name) return
                    onUpdateAccount({
                      ...account,
                      profiles: account.profiles.map((profile) =>
                        profile.id === entry.id ? { ...profile, name } : profile,
                      ),
                    })
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    const avatar = prompt(`Choose avatar: ${AVATARS.join(' ')}`, entry.avatar)
                    if (!avatar) return
                    onUpdateAccount({
                      ...account,
                      profiles: account.profiles.map((profile) =>
                        profile.id === entry.id ? { ...profile, avatar: avatar.slice(0, 2) } : profile,
                      ),
                    })
                  }}
                >
                  Avatar
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeProfile(entry.id)
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </button>
        ))}
        <button
          className="profile-card add"
          onClick={() => {
            const name = prompt('Profile name')
            if (!name) return
            onUpdateAccount({ ...account, profiles: [...account.profiles, createStarterProfile(name)] })
          }}
        >
          + Add Profile
        </button>
      </div>
      <div className="actions">
        <button className="btn muted" onClick={() => setManage((value) => !value)}>
          {manage ? 'Done' : 'Manage Profiles'}
        </button>
      </div>
    </main>
  )
}

function AppLayout({
  account,
  profile,
  cms,
  castingApps,
  onUpdateCms,
  onUpdateAccount,
  onSignOut,
  onCreateCastingApplication,
}: {
  account: Account
  profile: Profile
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateAccount: (account: Account) => void
  onSignOut: () => void
  onCreateCastingApplication: (app: CastingApplication) => void
}) {
  const location = useLocation()

  const showById = useMemo(() => new Map(cms.shows.map((show) => [show.id, show])), [cms.shows])

  const toggleWatchlist = (showId: string) => {
    const nextWatchlist = profile.watchlist.includes(showId)
      ? profile.watchlist.filter((id) => id !== showId)
      : [...profile.watchlist, showId]
    onUpdateAccount({
      ...account,
      profiles: account.profiles.map((item) => (item.id === profile.id ? { ...item, watchlist: nextWatchlist } : item)),
    })
  }

  const savePlayback = (episodeId: string, seconds: number) => {
    onUpdateAccount({
      ...account,
      profiles: account.profiles.map((item) =>
        item.id === profile.id
          ? {
              ...item,
              playback: { ...item.playback, [episodeId]: Math.max(0, Math.floor(seconds)) },
            }
          : item,
      ),
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar app">
        <span className="wordmark">EBG+</span>
        <nav>
          {[
            ['Home', '/app/home'],
            ['Shows', '/app/shows'],
            ['Movies / Specials', '/app/movies'],
            ['Music', '/app/music'],
            ['EBG Originals', '/app/originals'],
            ['EBG Universe', '/app/universe'],
            ['News', '/app/news'],
          ].map(([label, path]) => (
            <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="right-nav">
          <Link to="/app/search">Search</Link>
          <Link to="/app/my-list">My List</Link>
          <Link to="/app/notifications">Notifications</Link>
          <Link to="/app/settings">{profile.avatar}</Link>
        </div>
      </header>

      <Routes>
        <Route
          path="home"
          element={
            <HomePage
              cms={cms}
              profile={profile}
              showById={showById}
              episodes={cms.episodes}
              onToggleWatchlist={toggleWatchlist}
            />
          }
        />
        <Route path="shows" element={<ShowsPage cms={cms} />} />
        <Route path="movies" element={<CategoryPage title="Movies / Specials" copy="Premium cinematic specials and events." />} />
        <Route path="music" element={<MusicPage cms={cms} />} />
        <Route path="originals" element={<CategoryPage title="EBG Originals" copy="Flagship productions and exclusive stories from EBG." />} />
        <Route path="universe" element={<UniversePage />} />
        <Route path="news" element={<NewsPage />} />
        <Route
          path="shows/:showId"
          element={
            <ShowPage
              cms={cms}
              profile={profile}
              onToggleWatchlist={toggleWatchlist}
              playback={profile.playback}
            />
          }
        />
        <Route
          path="watch/:episodeId"
          element={<WatchPage episodes={cms.episodes} profile={profile} savePlayback={savePlayback} />}
        />
        <Route path="my-list" element={<MyListPage profile={profile} showById={showById} onToggleWatchlist={toggleWatchlist} />} />
        <Route path="search" element={<SearchPage cms={cms} />} />
        <Route path="notifications" element={<NotificationsPage account={account} />} />
        <Route path="settings" element={<SettingsPage account={account} profile={profile} onSignOut={onSignOut} />} />
        <Route
          path="casting"
          element={<CastingPage onSubmitApplication={onCreateCastingApplication} />}
        />
        <Route path="partnerships" element={<PartnershipsPage />} />
        <Route
          path="studio"
          element={
            <StudioPage
              account={account}
              cms={cms}
              castingApps={castingApps}
              onUpdateCms={onUpdateCms}
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <MobileNav />
      <Footer compact />
    </div>
  )
}

function HomePage({
  cms,
  profile,
  showById,
  episodes,
  onToggleWatchlist,
}: {
  cms: CmsData
  profile: Profile
  showById: Map<string, Show>
  episodes: Episode[]
  onToggleWatchlist: (showId: string) => void
}) {
  const hero = showById.get(cms.heroShowId)
  const continueWatchingEpisodes = episodes.filter((episode) => (profile.playback[episode.id] ?? 0) > 0)

  return (
    <main className="page">
      {hero && (
        <section className="hero-banner" style={{ backgroundImage: `url(${hero.artwork})` }}>
          <div className="overlay">
            <p className="eyebrow">{hero.category}</p>
            <h1>{hero.logo}</h1>
            <p>{hero.description}</p>
            <p>
              {hero.year} · {hero.maturity} · {hero.status}
            </p>
            <div className="actions">
              <Link className="btn" to="/app/shows/heartspell-house">
                Play
              </Link>
              <Link className="btn muted" to={`/app/shows/${hero.id}`}>
                More Info
              </Link>
              <button className="btn muted" onClick={() => onToggleWatchlist(hero.id)}>
                {profile.watchlist.includes(hero.id) ? '✓ In My List' : '+ My List'}
              </button>
            </div>
          </div>
        </section>
      )}

      {continueWatchingEpisodes.length > 0 ? (
        <section>
          <h2>Continue Watching</h2>
          <div className="rail">
            {continueWatchingEpisodes.map((episode) => {
              const progress = profile.playback[episode.id] ?? 0
              return (
                <article key={episode.id} className="episode-card">
                  <img src={episode.thumbnail} alt={`${episode.title} thumbnail`} loading="lazy" />
                  <div>
                    <h3>{episode.title}</h3>
                    <p>
                      S{episode.season} · E{episode.number}
                    </p>
                    <progress value={progress} max={3600} />
                    <Link to={`/app/watch/${episode.id}`}>Resume</Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <section>
          <h2>Continue Watching</h2>
          <p>Start watching something and your shows will appear here.</p>
        </section>
      )}

      {cms.rails
        .map((rail) => ({ ...rail, shows: rail.showIds.map((id) => showById.get(id)).filter(Boolean) as Show[] }))
        .filter((rail) => rail.shows.length > 0)
        .map((rail) => (
          <section key={rail.id}>
            <h2>{rail.title}</h2>
            <div className="rail">
              {rail.shows.map((show) => (
                <ContentCard
                  key={show.id}
                  show={show}
                  inList={profile.watchlist.includes(show.id)}
                  onToggle={() => onToggleWatchlist(show.id)}
                />
              ))}
            </div>
          </section>
        ))}
    </main>
  )
}

function ContentCard({ show, inList, onToggle }: { show: Show; inList: boolean; onToggle: () => void }) {
  return (
    <article className="content-card">
      <Link to={`/app/shows/${show.id}`}>
        <img src={show.artwork} alt={`${show.title} artwork`} loading="lazy" />
      </Link>
      <div>
        <h3>{show.title}</h3>
        <p>
          {show.genre} · {show.maturity}
        </p>
        <div className="actions">
          <Link className="btn" to={`/app/shows/${show.id}`}>
            Play
          </Link>
          <button className="btn muted" onClick={onToggle}>
            {inList ? '✓ My List' : '+ My List'}
          </button>
        </div>
      </div>
    </article>
  )
}

function ShowsPage({ cms }: { cms: CmsData }) {
  return (
    <main className="page">
      <h1>Shows</h1>
      <div className="grid-3">
        {cms.shows.map((show) => (
          <ContentCard key={show.id} show={show} inList={false} onToggle={() => undefined} />
        ))}
      </div>
    </main>
  )
}

function ShowPage({
  cms,
  profile,
  playback,
  onToggleWatchlist,
}: {
  cms: CmsData
  profile: Profile
  playback: Record<string, number>
  onToggleWatchlist: (showId: string) => void
}) {
  const { showId } = useParams()
  const show = cms.shows.find((entry) => entry.id === showId)
  if (!show) return <NotFoundPage />

  const episodes = cms.episodes.filter((episode) => episode.showId === show.id)

  return (
    <main className="page show-page">
      <section className="hero-banner small" style={{ backgroundImage: `url(${show.artwork})` }}>
        <div className="overlay">
          <p className="eyebrow">{show.category}</p>
          <h1>{show.title}</h1>
          <p>{show.description}</p>
          <div className="actions">
            {episodes[0] && (
              <Link className="btn" to={`/app/watch/${episodes[0].id}`}>
                Watch Trailer / Episode
              </Link>
            )}
            <button className="btn muted" onClick={() => onToggleWatchlist(show.id)}>
              {profile.watchlist.includes(show.id) ? '✓ In My List' : '+ Add to My List'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2>Episodes</h2>
        <div className="grid-2">
          {episodes.map((episode) => (
            <article key={episode.id} className="episode-card">
              <img src={episode.thumbnail} alt={`${episode.title} thumbnail`} loading="lazy" />
              <div>
                <h3>
                  Episode {episode.number}: {episode.title}
                </h3>
                <p>{episode.synopsis}</p>
                <p>
                  {episode.runtime} · {episode.releaseDate}
                </p>
                {(playback[episode.id] ?? 0) > 0 && <p>Progress saved</p>}
                <Link to={`/app/watch/${episode.id}`}>Watch</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Cast</h2>
        <div className="grid-3">
          {show.cast.map((person) => (
            <article key={person.name} className="panel">
              <h3>{person.name}</h3>
              <p>{person.role}</p>
              <p>{person.city}</p>
              <p>{person.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function WatchPage({
  episodes,
  profile,
  savePlayback,
}: {
  episodes: Episode[]
  profile: Profile
  savePlayback: (episodeId: string, seconds: number) => void
}) {
  const { episodeId } = useParams()
  const nav = useNavigate()
  const episode = episodes.find((item) => item.id === episodeId)
  const currentIndex = episodes.findIndex((item) => item.id === episodeId)
  const nextEpisode = currentIndex >= 0 ? episodes[currentIndex + 1] : undefined
  const [ended, setEnded] = useState(false)

  if (!episode) return <NotFoundPage />

  return (
    <main className="player-page">
      <button className="btn muted" onClick={() => nav(-1)}>
        Back
      </button>
      <h1>
        {episode.title} · S{episode.season}:E{episode.number}
      </h1>
      <video
        controls
        autoPlay
        src={episode.videoUrl}
        onLoadedMetadata={(event) => {
          const saved = profile.playback[episode.id] ?? 0
          if (saved > 0) event.currentTarget.currentTime = saved
        }}
        onTimeUpdate={(event) => savePlayback(episode.id, event.currentTarget.currentTime)}
        onEnded={() => {
          savePlayback(episode.id, 0)
          setEnded(true)
        }}
      />
      {ended && nextEpisode && (
        <section className="panel">
          <h2>Next Episode</h2>
          <p>{nextEpisode.title}</p>
          <div className="actions">
            <Link className="btn" to={`/app/watch/${nextEpisode.id}`}>
              Play Next
            </Link>
            <button className="btn muted" onClick={() => setEnded(false)}>
              Cancel Autoplay
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

function MyListPage({
  profile,
  showById,
  onToggleWatchlist,
}: {
  profile: Profile
  showById: Map<string, Show>
  onToggleWatchlist: (showId: string) => void
}) {
  const shows = profile.watchlist.map((showId) => showById.get(showId)).filter(Boolean) as Show[]

  return (
    <main className="page">
      <h1>My List</h1>
      {shows.length === 0 ? (
        <p>Save shows and specials you love and they&apos;ll appear here.</p>
      ) : (
        <div className="grid-3">
          {shows.map((show) => (
            <ContentCard key={show.id} show={show} inList onToggle={() => onToggleWatchlist(show.id)} />
          ))}
        </div>
      )}
    </main>
  )
}

function SearchPage({ cms }: { cms: CmsData }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return []
    return cms.shows.filter(
      (show) =>
        show.title.toLowerCase().includes(term) ||
        show.genre.toLowerCase().includes(term) ||
        show.description.toLowerCase().includes(term),
    )
  }, [cms.shows, query])

  return (
    <main className="page">
      <h1>Search</h1>
      <label>
        Find shows, episodes, artists, and genres
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search EBG+" />
      </label>
      {query && (
        <section>
          {matches.length === 0 ? (
            <div className="panel">
              <h2>No results</h2>
              <p>Try another title, artist, or genre.</p>
            </div>
          ) : (
            <div className="grid-3">
              {matches.map((show) => (
                <ContentCard key={show.id} show={show} inList={false} onToggle={() => undefined} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

function NotificationsPage({ account }: { account: Account }) {
  return (
    <main className="page">
      <h1>Notifications</h1>
      <ul className="list">
        {account.notifications.map((notification) => (
          <li key={notification.id}>
            <p>{notification.text}</p>
            <small>{notification.date}</small>
          </li>
        ))}
      </ul>
    </main>
  )
}

function SettingsPage({ account, profile, onSignOut }: { account: Account; profile: Profile; onSignOut: () => void }) {
  return (
    <main className="page">
      <h1>Account & Profile</h1>
      <div className="grid-2">
        <section className="panel">
          <h2>Account</h2>
          <p>{account.email}</p>
          <p>Role: {account.role}</p>
          <button className="btn" onClick={onSignOut}>
            Sign Out
          </button>
        </section>
        <section className="panel">
          <h2>Playback</h2>
          <p>Autoplay next episode: {profile.autoplayNext ? 'On' : 'Off'}</p>
          <p>Captions and notification controls are profile-based and ready for expansion.</p>
        </section>
      </div>
    </main>
  )
}

function StudioPage({
  account,
  cms,
  castingApps,
  onUpdateCms,
}: {
  account: Account
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
}) {
  if (!['founder', 'administrator', 'producer', 'editor'].includes(account.role)) {
    return (
      <main className="page">
        <h1>Authentication Error</h1>
        <p>You are not authorized to access EBG Studio.</p>
      </main>
    )
  }

  return (
    <main className="page">
      <h1>EBG Studio</h1>
      <p>Secure admin CMS for EBG staff.</p>
      <div className="grid-2">
        <section className="panel">
          <h2>Home Page Management</h2>
          <label>
            Brand Slogan
            <input
              value={cms.slogan}
              onChange={(event) => onUpdateCms({ ...cms, slogan: event.target.value })}
            />
          </label>
          <label>
            Hero Show
            <select
              value={cms.heroShowId}
              onChange={(event) => onUpdateCms({ ...cms, heroShowId: event.target.value })}
            >
              {cms.shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.title}
                </option>
              ))}
            </select>
          </label>
        </section>
        <section className="panel">
          <h2>Heartspell Production Dashboard</h2>
          <p>Applications: {castingApps.length}</p>
          <ul className="list">
            {castingApps.slice(0, 5).map((app) => (
              <li key={app.id}>
                <strong>{app.legalName}</strong> · {app.age} · {app.cityState} · {app.status}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

function CastingPage({ onSubmitApplication }: { onSubmitApplication: (app: CastingApplication) => void }) {
  const [state, setState] = useState('')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
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
    onSubmitApplication(app)
    event.currentTarget.reset()
    setState('Application submitted privately to EBG Studio.')
  }

  return (
    <main className="page">
      <h1>Casting & Submissions</h1>
      <p>Heartspell House casting requires applicants to be 21+ and consent to platform rules.</p>
      <form onSubmit={onSubmit} className="panel form-grid">
        <label>
          Legal or Preferred Name
          <input name="legalName" required />
        </label>
        <label>
          Age
          <input type="number" name="age" min={21} required />
        </label>
        <label>
          City / State
          <input name="cityState" required />
        </label>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Relationship Goals
          <textarea name="relationshipGoals" required />
        </label>
        <label>
          Camera Comfort
          <textarea name="cameraComfort" required />
        </label>
        <button className="btn" type="submit">
          Submit Application
        </button>
      </form>
      {state && <p>{state}</p>}
    </main>
  )
}

function MusicPage({ cms }: { cms: CmsData }) {
  return (
    <main className="page">
      <h1>Music on EBG+</h1>
      <p>Performances, concerts, visual albums, tour content, and music documentaries.</p>
      <div className="grid-3">
        {cms.shows
          .filter((show) => show.category.includes('Music'))
          .map((show) => (
            <ContentCard key={show.id} show={show} inList={false} onToggle={() => undefined} />
          ))}
      </div>
    </main>
  )
}

function UniversePage() {
  return (
    <main className="page">
      <h1>EBG Universe</h1>
      <div className="grid-3">
        {['People', 'Relationships', 'Families', 'Timeline', 'Locations', 'Major Events'].map((title) => (
          <section className="panel" key={title}>
            <h2>{title}</h2>
            <p>Spoiler-aware encyclopedia modules are ready for expansion.</p>
          </section>
        ))}
      </div>
    </main>
  )
}

function NewsPage() {
  return (
    <main className="page">
      <h1>EBG Newsroom</h1>
      <article className="panel">
        <p className="eyebrow">Announcement · 2026-08-13</p>
        <h2>Heartspell House Reunion Special Announced</h2>
        <p>Cast reactions, fan questions, and a full recap special are in development.</p>
      </article>
    </main>
  )
}

function CategoryPage({ title, copy }: { title: string; copy: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>{copy}</p>
      <p className="panel">Coming Soon</p>
    </main>
  )
}

function PartnershipsPage() {
  return (
    <main className="page">
      <h1>Partnerships</h1>
      <p>Brand, sponsor, distribution, and production collaboration inquiries.</p>
      <p className="panel">Contact partnerships@ebgplus.example (placeholder)</p>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="page center">
      <h1>Looks like this scene didn&apos;t make the final cut.</h1>
      <Link className="btn" to="/app/home">
        Back to EBG+
      </Link>
    </main>
  )
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link to="/app/home">Home</Link>
      <Link to="/app/news">New & Hot</Link>
      <Link to="/app/search">Search</Link>
      <Link to="/app/my-list">My List</Link>
      <Link to="/app/settings">Profile</Link>
    </nav>
  )
}

function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`footer ${compact ? 'compact' : ''}`}>
      <div>
        <Link to="/app/universe">About EBG</Link>
        <Link to="/app/settings">Help Center</Link>
        <Link to="/app/settings">Terms</Link>
        <Link to="/app/settings">Privacy</Link>
        <Link to="/app/settings">Accessibility</Link>
        <Link to="/app/casting">Casting</Link>
        <Link to="/app/partnerships">Partnerships</Link>
      </div>
      <p>© EBG / EBG+. All rights reserved.</p>
    </footer>
  )
}

export default App
