import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'
import './phase157-platform-refresh.css'
import './phase158-mobile-polish.css'
import { loadPublicForm, loadPublicForms, loadStaffForms, loadStaffSubmissions, submitEbgForm, updateFormStatus, updateSubmission, type EbgForm, type EbgFormSubmission } from './lib/formsV2Data'
import './phase159-forms-v2.css'
import { loadApplicantNetwork, loadApplicantMessages, sendApplicantMessage, markNotificationRead, deleteApplicantSubmission, type ApplicantSubmission, type ApplicantMessage, type AccountNotification } from './lib/applicationNetworkData'
import './phase160-application-network.css'
import { loadInboxNetwork, loadInboxThread, sendInboxMessage, markInboxThreadRead, markOneNetworkNotificationRead, markAllNetworkNotificationsRead, type InboxSubmission, type InboxMessage, type InboxNotification } from './lib/inboxData'
import './phase161-inbox-notifications.css'

// EBG_PHASE161_INBOX_NOTIFICATIONS

// EBG_PHASE160_APPLICATION_NETWORK

// EBG_PHASE159_FORMS_V2

// EBG_PHASE158_MOBILE_POLISH

// EBG_PHASE157_PLATFORM_REFRESH
import './phase17.css'
import './phase18.css'
import './phase115.css'
import './phase116-auth.css'
import './phase117-studio-polish.css'
import './phase118-replace-media.css'
import './phase119-media-delete-hero-fit.css'
import './phase120-hero-logo-layout.css'
import './phase121-shows-grid.css'
import './phase122-notifications2.css'
import './phase124-reference-hero.css'
import './phase125-episode-publishing.css'
import './phase126-home-hero-media-cleanup.css'
import './phase127-studio-flow-home-hero.css'
import './phase128-studio-pages.css'
import './phase129-studio-workspace-flow.css'
import './phase130-production-workspace.css'
import './phase131-studio-visual-redesign.css'
import './phase132-studio2.css'
import './phase133-management-cleanup.css'
import './phase135-studio-render-fix.css'
import './phase136-studio-complete.css'
import './phase138-studio-home-carousel.css'
import './phase140-carousel-logo-visibility.css'
import './phase141-carousel-brand-only.css'
import './phase142-desktop-brand-mobile-waffle.css'
import './phase143-desktop-split-hero.css'
import './phase144-studio-series-actions.css'
import './phase145-studio-episode-actions.css'
import './phase147-homepage-polish.css'
import './phase149-shows-catalog.css'

// EBG_PHASE147_HOMEPAGE_POLISH

// EBG_PHASE145_STUDIO_EPISODE_ACTIONS

// EBG_PHASE144_STUDIO_SERIES_ACTIONS

// EBG_PHASE143_DESKTOP_SPLIT_HERO

// EBG_PHASE142_DESKTOP_BRAND_MOBILE_WAFFLE

// EBG_PHASE141_CAROUSEL_BRAND_ONLY

// EBG_PHASE140_CAROUSEL_LOGO_VISIBILITY

// EBG_PHASE138_STUDIO_HOME_CAROUSEL
// EBG_PHASE139_REMOVE_LEGACY_WAITLIST

// EBG_PHASE136_STUDIO_COMPLETE
// EBG_PHASE137_STUDIO_BUILDFIX

// EBG_PHASE134_STUDIO_SYNTAX_REBUILD

// EBG_PHASE133_MANAGEMENT_CLEANUP

// EBG_PHASE132_STUDIO2

// EBG_PHASE131_STUDIO_VISUAL_REDESIGN

// EBG_PHASE130_PRODUCTION_WORKSPACE

// EBG_PHASE129_STUDIO_WORKSPACE_FLOW

// EBG_PHASE128_STUDIO_PAGES

// EBG_PHASE127_HOME_HERO_POLISH

// EBG_PHASE126_HOME_HERO_MEDIA_CLEANUP

// EBG_PHASE125_EPISODE_PUBLISHING

// EBG_PHASE124_REFERENCE_HERO

// EBG_PHASE123_CASTING_ALERTS

// EBG_PHASE122_NOTIFICATIONS2

// EBG_PHASE121_SHOWS_GRID

// EBG_PHASE120_HERO_LOGO_LAYOUT

// EBG_PHASE119_MEDIA_DELETE_HERO_FIT

// EBG_PHASE118_REPLACE_MEDIA

// EBG_PHASE117_STUDIO_POLISH

// EBG_PHASE116_PUBLIC_LANDING

// EBG_PHASE115_HOMEPAGE_REFRESH
import { joinLaunchWaitlist, unsubscribeLaunchWaitlist } from './lib/launchWaitlist'
import './phase19.css'
import './phase110.css'
import './phase111.css'
import { createPoll, deletePoll, loadPollOptions, loadPollResults, loadPolls, updatePoll, voteInPoll, type Poll, type PollOption, type PollResult } from './lib/pollData'
import './phase112.css'
import './phase113.css'
import './phase114-footer.css'

// EBG_PHASE114_FOOTER_PAGES

// EBG_PHASE113_MY_APPLICATIONS

// EBG_PHASE112_STUDIO_POLLS_FORMS

// EBG_PHASE111_HEARTSPELL

// EBG_PHASE110_COMING_SOON_POLISH

// EBG_PHASE19_COMING_SOON

// EBG_PHASE18_HOMEPAGE_STUDIO
import './nav17.css'
import './phase151-music-catalog.css'
import './phase152-music-detail-pages.css'
import './phase153-built-in-players.css'
import './phase154-apple-music-player.css'
import './phase155-persistent-music-dock.css'
import './phase156-timed-lyrics.css'

// EBG_NAV_CLEANUP_INTEGRATED
import { uploadProfilePhoto } from './lib/profileMedia'

// EBG_PHASE17_UI_MEDIA_INTEGRATED
import {
  createProfile as createDbProfile,
  deleteProfile as deleteDbProfile,
  restoreAuth,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  signUp as supabaseSignUp,
  updateProfile as updateDbProfile,
  type AuthState,
} from './lib/auth'
import { requestPasswordReset, updateRecoveredPassword } from './lib/passwordRecovery'
import {
  addToWatchlist,
  loadCastingApplications,
  loadPlaybackProgress,
  loadWatchlist,
  removeFromWatchlist,
  savePlaybackProgress,
  submitCastingApplication,
} from './lib/userData'

// EBG_SUPABASE_USERDATA_INTEGRATED
import { loadCmsData, saveCmsData, updateCastingApplicationStatus, uploadStudioMedia } from './lib/studioData'

// EBG_PHASE16_STUDIO_INTEGRATED

// EBG_SUPABASE_AUTH_INTEGRATED

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
  publishStatus?: 'draft' | 'scheduled' | 'live' | 'archived'
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
  banner?: string
  bannerPosition?: string
  bannerFit?: 'cover' | 'contain'
  logo: string
  logoImage?: string
  homeVisible?: boolean
  cast: Array<{
    name: string
    role: string
    city: string
    bio: string
    image?: string
    social?: string
    status?: string
  }>
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
  title?: string
  audience?: 'all' | 'members' | 'casting'
  status?: 'draft' | 'scheduled' | 'sent'
  link?: string
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

type NewsPost = {
  id: string
  headline: string
  summary: string
  body: string
  category: string
  author: string
  image?: string
  featured?: boolean
  status: 'draft' | 'scheduled' | 'published'
  publishedAt: string
}

type CmsData = {
  slogan: string
  heroShowId: string
  shows: Show[]
  episodes: Episode[]
  rails: ContentRail[]
  comingSoon: string[]
  news?: NewsPost[]
  notifications?: NotificationItem[]
  music?: any
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
  verifiedBadge?: 'artist' | 'founder' | null
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

const randomInt = (max: number) => {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % max
}

const id = () => {
  const values = new Uint8Array(8)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')
}

const createStarterProfile = (name = 'Main Profile'): Profile => ({
  id: id(),
  name,
  avatar: AVATARS[randomInt(AVATARS.length)] ?? '✨',
  watchlist: [],
  playback: {},
  liked: [],
  autoplayNext: true,
})

function AvatarVisual({ avatar, nav = false }: { avatar: string; nav?: boolean }) {
  const image = /^https?:\/\//i.test(avatar)
  if (image) return <img className={nav ? 'nav-avatar' : 'profile-avatar-image'} src={avatar} alt="Profile" />
  return <span className={nav ? 'nav-avatar avatar' : 'avatar'}>{avatar || '✨'}</span>
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Shell />
    </BrowserRouter>
  )
}

function authAccountToUi(state: AuthState, previous?: Account | null): Account {
  return {
    id: state.account.id,
    email: state.account.email,
    passwordHash: '',
    role: state.account.role,
    verifiedBadge: state.account.verified_badge ?? (state.account.role === 'founder' ? 'founder' : null),
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
  const [castingApps, setCastingApps] = useState<CastingApplication[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [profileId, setProfileId] = useState<string | null>(() => localStorage.getItem('ebg.activeProfile.v1'))
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (profileId) localStorage.setItem('ebg.activeProfile.v1', profileId)
    else localStorage.removeItem('ebg.activeProfile.v1')
  }, [profileId])

  useEffect(() => saveJson(STORAGE.cms, cms), [cms])
  useEffect(() => {
    void loadCmsData<CmsData>()
      .then((remoteCms) => {
        if (remoteCms) setCms(remoteCms)
      })
      .catch((error) => console.error('Could not load EBG+ Studio CMS.', error))
  }, [])

  useEffect(() => {
    let active = true
    restoreAuth()
      .then((state) => {
        if (!active || !state) return
        setAccount((previous) => authAccountToUi(state, previous))
        void loadStaffCasting(state)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const profile = useMemo(() => account?.profiles.find((entry) => entry.id === profileId) ?? null, [account, profileId])

  const loadStaffCasting = async (state: AuthState) => {
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
    setAccount((previous) => authAccountToUi(state, previous))
    setProfileId(null)
    void loadStaffCasting(state)
  }

  const handleSignOut = async () => {
    await supabaseSignOut()
    setAccount(null)
    setProfileId(null)
  }

  const refreshAccountFromServer = async () => {
    const state = await restoreAuth()
    if (!state) return
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
      <Route path="/" element={window.location.hostname === 'forms.ebgplus.app' ? <EbgFormsV2Home /> : <LandingPage cms={cms} />} />
      <Route path="/about" element={<AboutEbgPage />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/accessibility" element={<AccessibilityPage />} />
      <Route path="/partnerships" element={<PublicPartnershipsPage />} />
      <Route path="/coming-soon" element={<ComingSoonPage />} />
      <Route path="/forms" element={<EbgFormsV2Home />} />
      <Route path="/forms/:slug" element={<EbgFormsV2Public />} />
      <Route path="/dashboard" element={account ? <EbgFormsV2Dashboard account={account} /> : <Navigate to="/auth/sign-in" replace />} />
      <Route path="/unsubscribe" element={<UnsubscribePage />} />
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
              onSelect={(nextProfileId) => {
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
              }}
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
              onUpdateCms={(nextCms) => {
                setCms(nextCms)
                void saveCmsData(nextCms).catch((error) => console.error('Could not save EBG+ Studio CMS.', error))
              }}
              onUpdateCastingStatus={async (applicationId, status) => {
                await updateCastingApplicationStatus(applicationId, status)
                setCastingApps((previous) => previous.map((app) => app.id === applicationId ? { ...app, status } : app))
              }}
              onUpdateAccount={upsertAccount}
              onSignOut={handleSignOut}
              onCreateCastingApplication={async (app) => {
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
              }}
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
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/app/studio') {
      window.location.replace('https://studio.ebgplus.app')
    }
  }, [location.pathname])
  if (!account) {
    if (location.pathname.startsWith('/app/')) sessionStorage.setItem('ebg.returnTo.v1', location.pathname)
    return <Navigate to="/auth/sign-in" replace />
  }
  if (requireProfile && !profile) {
    if (location.pathname.startsWith('/app/')) sessionStorage.setItem('ebg.returnTo.v1', location.pathname)
    return <Navigate to="/profiles" replace />
  }
  return <>{children}</>
}

function EbgFormsV2Chrome({ children, dashboard = false }: { children: ReactNode; dashboard?: boolean }) {
  return (
    <main className="forms2-shell">
      <header className="forms2-topbar">
        <Link className="forms2-brand" to="/">EBG+ <span>FORMS</span></Link>
        <div className="forms2-actions">
          {dashboard ? <Link className="btn muted" to="/">Public Forms</Link> : <Link className="btn muted" to="/dashboard">Dashboard</Link>}
          <a className="btn" href="https://ebgplus.app">EBG+</a>
        </div>
      </header>
      {children}
    </main>
  )
}

function EbgFormsV2Home() {
  const [forms, setForms] = useState<EbgForm[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPublicForms().then(setForms).catch((error) => setMessage(error instanceof Error ? error.message : 'Forms could not be loaded.'))
  }, [])

  return (
    <EbgFormsV2Chrome>
      <section className="forms2-hero">
        <p className="forms2-eyebrow">EBG FORMS 2.0</p>
        <h1>Step into the EBG universe.</h1>
        <p>Applications, casting calls, sign-ups, and official EBG submissions now live in one place. Choose an open form below.</p>
        <div className="forms2-form-list">
          {forms.map((form) => <Link className="forms2-form-card" key={form.id} to={'/forms/' + form.slug}><span>{form.eyebrow}</span><h2>{form.title}</h2><p>{form.description}</p><strong>Open form →</strong></Link>)}
        </div>
        {!forms.length && !message && <div className="forms2-empty">No forms are open right now.</div>}
        {message && <p className="forms2-error">{message}</p>}
        <p className="forms2-legacy-note">Legacy EBG Forms has been sunset. New submissions are collected through EBG Forms 2.0.</p>
      </section>
    </EbgFormsV2Chrome>
  )
}

function EbgFormsV2Public() {
  const { slug = '' } = useParams()
  const [form, setForm] = useState<EbgForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setLoading(true)
    loadPublicForm(slug).then(setForm).catch((error) => setMessage(error instanceof Error ? error.message : 'Form could not be loaded.')).finally(() => setLoading(false))
  }, [slug])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    setMessage('Submitting…')
    setSuccess(false)
    const data = new FormData(event.currentTarget)
    const answers: Record<string, unknown> = {}
    for (const question of form.questions ?? []) answers[question.key] = String(data.get(question.key) ?? '').trim()
    const emailQuestion = (form.questions ?? []).find((question) => question.type === 'email')
    const email = emailQuestion ? String(answers[emailQuestion.key] ?? '') : ''
    try {
      await submitEbgForm(form.id, answers, email)
      event.currentTarget.reset()
      setSuccess(true)
      setMessage(form.submit_message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Your response could not be submitted.')
    }
  }

  if (loading) return <EbgFormsV2Chrome><div className="forms2-empty">Opening form…</div></EbgFormsV2Chrome>
  if (!form) return <EbgFormsV2Chrome><div className="forms2-empty"><h1>Form unavailable</h1><p>{message || 'This form is closed or does not exist.'}</p><Link className="btn" to="/">View open forms</Link></div></EbgFormsV2Chrome>

  return (
    <EbgFormsV2Chrome>
      <section className="forms2-public-card">
        <p className="forms2-eyebrow">{form.eyebrow}</p><h1>{form.title}</h1><p>{form.description}</p>
        <form onSubmit={submit}>
          <div className="forms2-question-grid">
            {(form.questions ?? []).map((question) => <label className={'forms2-question ' + (question.type === 'textarea' ? 'full' : '')} key={question.id}>{question.label}{question.type === 'textarea' ? <textarea name={question.key} required={question.required} placeholder={question.placeholder ?? ''} /> : question.type === 'select' ? <select name={question.key} required={question.required}><option value="">Choose one</option>{(question.options ?? []).map((option) => <option key={option}>{option}</option>)}</select> : <input name={question.key} type={question.type} required={question.required} placeholder={question.placeholder ?? ''} min={question.key === 'age' ? 21 : undefined} />}</label>)}
          </div>
          <button className="forms2-submit" type="submit">Submit to EBG</button>
        </form>
        {message && <p className={success ? 'forms2-success' : 'forms2-error'}>{message}</p>}
      </section>
    </EbgFormsV2Chrome>
  )
}

function EbgFormsV2Dashboard({ account }: { account: Account }) {
  const allowed = ['founder','administrator','producer','editor'].includes(account.role)
  const [forms, setForms] = useState<EbgForm[]>([])
  const [submissions, setSubmissions] = useState<EbgFormSubmission[]>([])
  const [formId, setFormId] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const nextForms = await loadStaffForms()
      const selected = formId || nextForms[0]?.id || ''
      if (!formId && selected) setFormId(selected)
      setForms(nextForms)
      setSubmissions(await loadStaffSubmissions(selected || undefined))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Dashboard could not be loaded.')
    }
  }

  useEffect(() => {
    if (!allowed) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), 2500)
    return () => window.clearInterval(timer)
  }, [allowed, formId])

  if (!allowed) return <EbgFormsV2Chrome dashboard><div className="forms2-empty"><h1>Staff access required.</h1><p>This dashboard is available to the EBG team.</p></div></EbgFormsV2Chrome>

  const activeForm = forms.find((form) => form.id === formId)
  const visible = submissions.filter((submission) => filter === 'all' || submission.status === filter)
  const newCount = submissions.filter((submission) => submission.status === 'new').length
  const accepted = submissions.filter((submission) => submission.status === 'accepted').length
  const today = submissions.filter((submission) => Date.now() - Date.parse(submission.created_at) < 86400000).length
  const labelFor = (key: string) => activeForm?.questions?.find((question) => question.key === key)?.label ?? key

  const saveStatus = async (submission: EbgFormSubmission, status: EbgFormSubmission['status']) => {
    await updateSubmission(submission.id, { status })
    setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, status } : item))
  }

  const saveNotes = async (submission: EbgFormSubmission, internal_notes: string) => {
    await updateSubmission(submission.id, { internal_notes })
    setMessage('Notes saved.')
  }

  return (
    <EbgFormsV2Chrome dashboard>
      <section className="forms2-dashboard">
        <div><p className="forms2-eyebrow">LIVE RESPONSE CENTER</p><h1>Forms Dashboard</h1><p className="forms2-live-dot">Live refresh every 2.5 seconds</p></div>
        <div className="forms2-stats"><div className="forms2-stat"><span>Total</span><strong>{submissions.length}</strong></div><div className="forms2-stat"><span>New</span><strong>{newCount}</strong></div><div className="forms2-stat"><span>Today</span><strong>{today}</strong></div><div className="forms2-stat"><span>Accepted</span><strong>{accepted}</strong></div></div>
        {message && <p className="forms2-success">{message}</p>}
        <div className="forms2-dashboard-grid">
          <aside className="forms2-panel forms2-sidebar">
            {forms.map((form) => <button key={form.id} className={form.id === formId ? 'active' : ''} type="button" onClick={() => setFormId(form.id)}><strong>{form.title}</strong><br/><small>{form.status}</small></button>)}
            {activeForm && <select value={activeForm.status} onChange={(event) => { const status = event.target.value as EbgForm['status']; void updateFormStatus(activeForm.id, status).then(() => setForms((current) => current.map((form) => form.id === activeForm.id ? { ...form, status } : form))) }}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select>}
          </aside>
          <div className="forms2-panel">
            <div className="forms2-status-row"><strong>{activeForm?.title ?? 'Responses'}</strong><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All responses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="contacted">Contacted</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div>
            <div className="forms2-response-list">
              {visible.map((submission) => <article className="forms2-response" key={submission.id}><div><h3>{submission.respondent_email || 'Anonymous response'}</h3><p className="forms2-response-meta">Submitted {new Date(submission.created_at).toLocaleString()}</p><div className="forms2-answer-grid">{Object.entries(submission.answers).map(([key,value]) => <div className="forms2-answer" key={key}><small>{labelFor(key)}</small><span>{String(value)}</span></div>)}</div><textarea className="forms2-notes" defaultValue={submission.internal_notes} placeholder="Internal notes…" onBlur={(event) => void saveNotes(submission, event.target.value)} /></div><div><select value={submission.status} onChange={(event) => void saveStatus(submission, event.target.value as EbgFormSubmission['status'])}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="contacted">Contacted</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div></article>)}
              {!visible.length && <div className="forms2-empty">No responses in this view yet.</div>}
            </div>
          </div>
        </div>
      </section>
    </EbgFormsV2Chrome>
  )
}

function ComingSoonPage() {
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
      <section className="coming-soon-card ebg-launch-card">
        <div className="ebg-launch-topbar">
          <Link to="/" aria-label="EBG+ home">
            <img className="ebg-launch-logo" src="/ebgplus-logo.png" alt="EBG+" />
          </Link>
          <span className="ebg-launch-status">Opening soon</span>
        </div>
        <div className="ebg-launch-main">
          <p className="coming-soon-kicker">The next chapter is almost here</p>
          <h1>Entertainment, <span>the EBG way.</span></h1>
          <p className="coming-soon-copy">Original shows, music, stories, and a universe built around the people creating it. Join early and be first inside when EBG+ opens its doors.</p>
          <div className="ebg-launch-pillars" aria-label="What is coming to EBG+">
            <div className="ebg-launch-pillar"><strong>Original Shows</strong>Series, reality, and new EBG+ originals.</div>
            <div className="ebg-launch-pillar"><strong>Music</strong>Artist hubs, releases, performances, and more.</div>
            <div className="ebg-launch-pillar"><strong>EBG Universe</strong>Stories, people, worlds, and everything between.</div>
          </div>
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
          {message && <p className={`waitlist-status ${state === 'success' ? 'success' : 'error'}`}>{message}</p>}
        </div>
        <footer className="ebg-launch-footer">
          <p className="ebg-launch-footer-copy">EBG+ is a new home for original entertainment from EBG. Early subscribers get launch updates only — no clutter, no daily spam.</p>
          <p className="coming-soon-signin">Already part of the team? <Link to="/auth/sign-in">Staff sign in</Link></p>
        </footer>
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

function LandingPage({ cms }: { cms: CmsData }) {
  const visibleShows = cms.shows.filter((show) => show.homeVisible !== false)
  const previewShows = visibleShows.slice(0, 4)
  const publishedNews = (cms.news ?? [])
    .filter((item) => item.status === 'published' && Date.parse(item.publishedAt) <= Date.now())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  return (
    <main className="landing public-landing-v2">
      <header className="topbar public-topbar">
        <Link className="wordmark" to="/">EBG+</Link>
        <nav aria-label="Main navigation">
          <a href="#discover">Discover</a>
          <a href="#universe">The universe</a>
          <Link to="/auth/create-account">Join EBG+</Link>
          <Link to="/auth/sign-in" className="btn">Sign In</Link>
        </nav>
      </header>

      <section className="hero public-hero" aria-label="EBG+ introduction">
        <div className="public-hero-copy">
          <p className="eyebrow">ORIGINAL ENTERTAINMENT. DISTINCTLY EBG.</p>
          <h1>Your next<br /><em>obsession.</em></h1>
          <p className="public-hero-lead">Premium series, reality television, cinematic music performances, artist stories, and the evolving EBG universe — all in one place.</p>
          <div className="actions">
            <Link className="btn" to="/auth/create-account">Find your world <span aria-hidden="true">↗</span></Link>
            <Link className="btn muted" to="/auth/sign-in">Sign In</Link>
          </div>
        </div>
        <div className="public-hero-orbit" aria-hidden="true">
          <div className="brand-feature"><img src="/branding/ebgplus-ink-blue.png" alt="" /><p>One universe.<br />Endless possibilities.</p><span>ORIGINALS · MUSIC · STORIES</span></div>
        </div>
      </section>

      <section id="discover" className="public-intro-section">
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

      <section id="universe" className="public-founders-section founder-world-v3">
        <div className="public-section-heading compact">
          <p className="eyebrow">Inside the EBG Universe</p>
          <h2>Three creative forces. One universe that keeps expanding.</h2>
          <p>EBG+ is shaped by the individual worlds of Bijou Nicole, Empress V, and Goldie Songs — music, television, visual storytelling, live moments, personality, and original ideas that cross into one shared creative home.</p>
        </div>
        <div className="founder-world-grid">
          <article className="founder-world-card bijou-card">
            <div className="founder-world-number">01</div>
            <p className="eyebrow">BIJOU NICOLE</p>
            <h3>Pop fantasy, R&B emotion, and cinematic world-building.</h3>
            <p>Bijou's corner of EBG blends music, performance, fashion, romantic storytelling, and larger-than-life visual eras. Her projects move between intimate songwriting and theatrical concepts built to feel like complete worlds rather than standalone releases.</p>
            <p className="founder-world-detail">On EBG+ you'll find music, performance films, original programming, behind-the-scenes moments, and stories connected to the evolving Bijou universe.</p>
            <div className="founder-tags"><span>Music</span><span>Originals</span><span>Performance</span><span>Visual Worlds</span></div>
            <Link className="founder-link" to="/auth/sign-in">Enter Bijou's world →</Link>
          </article>
          <article className="founder-world-card empress-card">
            <div className="founder-world-number">02</div>
            <p className="eyebrow">EMPRESS V</p>
            <h3>Theatrical edge, bold emotion, and a world built for the stage.</h3>
            <p>Empress brings a dramatic, performance-first energy to EBG. Her creative world leans into strong visual identity, live storytelling, emotional contrast, and projects that feel equally at home in music, concert films, and character-driven entertainment.</p>
            <p className="founder-world-detail">Her EBG+ presence connects music releases, visual performances, collaborations, special programming, and the stories happening around her creative era.</p>
            <div className="founder-tags"><span>Music</span><span>Live</span><span>Storytelling</span><span>Collaborations</span></div>
            <Link className="founder-link" to="/auth/sign-in">Enter Empress V's world →</Link>
          </article>
          <article className="founder-world-card goldie-card">
            <div className="founder-world-number">03</div>
            <p className="eyebrow">GOLDIE SONGS</p>
            <h3>Soul, conversation, reflection, and artist-first storytelling.</h3>
            <p>Goldie's world brings warmth and perspective to EBG through soulful music, personal storytelling, thoughtful conversations, and creative projects centered on growth, identity, and the life surrounding the art itself.</p>
            <p className="founder-world-detail">Across EBG+ her world can expand through songs, interviews, documentaries, conversations, performances, and original concepts that let audiences know the person behind the music.</p>
            <div className="founder-tags"><span>Music</span><span>Conversations</span><span>Documentary</span><span>Artist Stories</span></div>
            <Link className="founder-link" to="/auth/sign-in">Enter Goldie's world →</Link>
          </article>
        </div>
      </section>

      {publishedNews.length > 0 && (
        <section className="public-news-strip">
          <div className="public-section-heading compact"><p className="eyebrow">Latest from EBG</p><h2>The universe moves fast.</h2><p>Announcements, releases, casting updates, creative news, and the stories happening around EBG.</p></div>
          <div className="public-news-grid">
            {publishedNews.slice(0, 3).map((item) => (
              <article key={item.id} className="public-news-card">
                {item.image && <img src={item.image} alt="" />}
                <div><span>{item.category}</span><h3>{item.headline}</h3><p>{item.summary}</p><small>{item.author} · {new Date(item.publishedAt).toLocaleDateString()}</small></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {previewShows.length > 0 && (
        <section className="public-preview-section">
          <div className="public-section-heading compact">
            <p className="eyebrow">On EBG+</p>
            <h2>A first look at the world.</h2>
          </div>
          <div className="public-preview-grid">
            {previewShows.map((show) => (
              <article key={show.id} className="public-preview-card" style={{ backgroundImage: 'url(' + (show.banner || show.artwork) + ')' }}>
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
}

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <Link className="wordmark" to="/">
        EBG+
      </Link>
      <section className="auth-card">
        <p className="eyebrow">YOUR WORLD STARTS HERE</p>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  )
}

function SignInPage({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<void> }) {
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
        {error && <p className="error" role="alert">{error}</p>}
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
}

function CreateAccountPage({
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
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p>{message}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  )
}

function ForgotPasswordPage() {
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
        {error && <p className="error" role="alert">{error}</p>}
        {state && <p>{state}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <div className="split-links"><Link to="/auth/sign-in">Back to Sign In</Link></div>
    </AuthLayout>
  )
}

function ResetPasswordPage() {
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
        {error && <p className="error" role="alert">{error}</p>}
        {state && <p>{state}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
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

  const selectProfile = (profileId: string) => {
    onSelect(profileId)
    const returnTo = sessionStorage.getItem('ebg.returnTo.v1') || '/app/home'
    sessionStorage.removeItem('ebg.returnTo.v1')
    nav(returnTo)
  }

  return (
    <main className="profiles-page profile-select-v2">
      <header className="profile-select-header">
        <Link className="wordmark" to="/" aria-label="EBG+ home">EBG+</Link>
        <div className="profile-select-account">
          <span>Signed in as</span>
          <strong>{account.email}</strong>
        </div>
      </header>

      <section className="profile-select-shell">
        <p className="eyebrow">Choose your space</p>
        <h1>Who's watching?</h1>
        <p className="profile-select-subcopy">Pick a profile to jump back into your EBG+ world.</p>

        <div className="profile-grid">
          {account.profiles.map((entry) => (
            <article
              key={entry.id}
              className={`profile-card ${activeProfileId === entry.id ? 'active' : ''}`}
            >
              <button
                type="button"
                className="profile-card-select"
                onClick={() => {
                  if (!manage) selectProfile(entry.id)
                }}
                aria-label={manage ? `Manage ${entry.name}` : `Continue as ${entry.name}`}
              >
                <AvatarVisual avatar={entry.avatar} />
                <span className="profile-card-name">{entry.name}</span>
                <span className="profile-card-hint">{manage ? 'Editing profile' : 'Enter profile'}</span>
              </button>

              {manage && (
                <div className="manage-tools">
                  <button
                    type="button"
                    onClick={() => {
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
                    onClick={() => {
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
                    disabled={account.profiles.length <= 1}
                    onClick={() => removeProfile(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}

          <button
            type="button"
            className="profile-add-card"
            onClick={() => {
              const name = prompt('Profile name')
              if (!name) return
              onUpdateAccount({ ...account, profiles: [...account.profiles, createStarterProfile(name)] })
            }}
          >
            <span className="profile-add-icon" aria-hidden="true">+</span>
            <span>Add Profile</span>
          </button>
        </div>

        <div className="actions">
          <button className="btn muted" type="button" onClick={() => setManage((value) => !value)}>
            {manage ? 'Done' : 'Manage Profiles'}
          </button>
        </div>
      </section>
    </main>
  )
}

// EBG_PHASE150_EXTERNAL_STUDIO
function AppLayout({
  account,
  profile,
  cms,
  castingApps,
  onUpdateCms,
  onUpdateAccount,
  onSignOut,
  onCreateCastingApplication,
  onUpdateCastingStatus,
}: {
  account: Account
  profile: Profile
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateAccount: (account: Account) => void
  onSignOut: () => void
  onCreateCastingApplication: (app: CastingApplication) => Promise<void>
  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>
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
      <aside className="viewer-sidebar" aria-label="EBG+ sidebar">
        <Link className="wordmark" to="/app/home" aria-label="EBG+ home">EBG+</Link>
        <p className="sidebar-caption">YOUR ENTERTAINMENT. YOUR WORLD.</p>
        <nav aria-label="Browse">
          {[["Discover", "/app/home", "⌂"], ["Originals", "/app/originals", "✦"], ["Shows", "/app/shows", "▤"], ["Music", "/app/music", "♫"], ["The universe", "/app/universe", "◎"], ["Search", "/app/search", "⌕"]].map(([label, to, icon]) => <NavLink key={to} to={to}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}
        </nav>
        <p className="sidebar-caption">YOUR SPACE</p>
        <nav aria-label="Your library">
          {[["My list", "/app/my-list"], ["Applications", "/app/applications"], ["Messages", "/app/inbox"], ["Notifications", "/app/notifications"], ["Settings", "/app/settings"]].map(([label, to]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <Link className="sidebar-profile" to="/profiles"><AvatarVisual avatar={profile.avatar} nav /><span>{profile.name}<small>Switch profile</small></span></Link>
      </aside>
      <header className="topbar app">
        <Link className="wordmark" to="/app/home" aria-label="EBG+ Home">EBG+</Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          {[
            ['Home', '/app/home'],
            ['Shows', '/app/shows'],
            ['Movies', '/app/movies'],
            ['Music', '/app/music'],
          ].map(([label, path]) => (
            <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>{label}</Link>
          ))}
          <details className="nav-menu">
            <summary>Explore <span aria-hidden="true">⌄</span></summary>
            <div className="nav-dropdown">
              <Link to="/app/originals">EBG Originals</Link>
              <Link to="/app/universe">EBG Universe</Link>
              <Link to="/app/news">News</Link>
            </div>
          </details>
        </nav>
        <div className="right-nav">
          <Link className="nav-icon-link" to="/app/search">Search</Link>
          <details className="nav-menu library-menu">
            <summary>Library <span aria-hidden="true">⌄</span></summary>
            <div className="nav-dropdown nav-dropdown-right">
              <Link to="/app/my-list">My List</Link>
              <Link to="/app/applications">My Applications</Link>
              <Link to="/app/inbox">Messages</Link>
              <Link to="/app/notifications">Notifications</Link>
              <a href="https://forms.ebgplus.app">Casting</a>
            </div>
          </details>
          <details className="nav-menu profile-menu">
            <summary className="profile-menu-trigger" aria-label="Profile menu"><AvatarVisual avatar={profile.avatar} nav /><span aria-hidden="true">⌄</span></summary>
            <div className="nav-dropdown nav-dropdown-right profile-dropdown">
              <div className="profile-dropdown-heading"><AvatarVisual avatar={profile.avatar} /><div><strong>{profile.name}</strong><small>{account.email}</small></div></div>
              <Link to="/app/settings">Settings</Link>
              <Link to="/profiles">Switch Profile</Link>
              {['founder', 'administrator', 'producer', 'editor'].includes(account.role) && <a href="https://studio.ebgplus.app" target="_blank" rel="noreferrer">EBG Studio</a>}
              <button type="button" onClick={onSignOut}>Sign Out</button>
            </div>
          </details>
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
        <Route path="music/artist/:artistId" element={<MusicArtistPage cms={cms} />} />
        <Route path="music/release/:releaseId" element={<MusicReleasePage cms={cms} />} />
        <Route path="originals" element={<OriginalsPage cms={cms} />} />
        <Route path="universe" element={<UniversePage cms={cms} />} />
        <Route path="news" element={<NewsPage cms={cms} />} />
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
        <Route path="shows/:showId/cast/:castIndex" element={<CastProfilePage cms={cms} />} />
        <Route
          path="watch/:episodeId"
          element={<WatchPage episodes={cms.episodes.filter(isEpisodeReleased)} profile={profile} savePlayback={savePlayback} />}
        />
        <Route path="my-list" element={<MyListPage profile={profile} showById={showById} onToggleWatchlist={toggleWatchlist} />} />
        <Route path="applications" element={<MyApplicationsPage cms={cms} />} />
        <Route path="inbox" element={<NetworkInboxPage cms={cms} />} />
        <Route path="search" element={<SearchPage cms={cms} />} />
        <Route path="notifications" element={<NotificationsPage cms={cms} account={account} castingApps={castingApps} />} />
        <Route path="settings" element={<SettingsPage account={account} profile={profile} onUpdateAccount={onUpdateAccount} onSignOut={onSignOut} />} />
        <Route
          path="casting"
          element={<CastingPage onSubmitApplication={onCreateCastingApplication} />}
        />
        <Route path="partnerships" element={<PartnershipsPage />} />
        <Route path="management" element={<ManagementPage />} />
        <Route
          path="studio/:studioSection?"
          element={
            <StudioPage
              account={account}
              cms={cms}
              castingApps={castingApps}
              onUpdateCms={onUpdateCms}
              onUpdateCastingStatus={onUpdateCastingStatus}
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <EbgMusicDock />
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
  const homeShows = cms.shows.filter((show) => show.homeVisible !== false)
  const homeShowIds = new Set(homeShows.map((show) => show.id))
  const preferredHeroIndex = Math.max(0, homeShows.findIndex((show) => show.id === cms.heroShowId))
  const [heroIndex, setHeroIndex] = useState(preferredHeroIndex)
  const hero = homeShows[heroIndex] ?? homeShows[0]
  const continueWatchingEpisodes = episodes.filter((episode) => (profile.playback[episode.id] ?? 0) > 0)
  const comingSoonShows = homeShows.filter((show) => show.status === 'Coming Soon').slice(0, 3)
  const releasedEpisodes = episodes
    .filter((episode) => isEpisodeReleased(episode))
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
  const newestEpisode = releasedEpisodes[0]
  const newestShow = newestEpisode ? showById.get(newestEpisode.showId) : undefined

  useEffect(() => {
    const nextPreferred = homeShows.findIndex((show) => show.id === cms.heroShowId)
    if (nextPreferred >= 0) setHeroIndex(nextPreferred)
    else if (heroIndex >= homeShows.length) setHeroIndex(0)
  }, [cms.heroShowId, homeShows.length])

  useEffect(() => {
    if (homeShows.length < 2) return
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % homeShows.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [homeShows.length])

  const moveHero = (direction: -1 | 1) => {
    if (!homeShows.length) return
    setHeroIndex((current) => (current + direction + homeShows.length) % homeShows.length)
  }

  return (
    <main className="page home-v2">
      {hero ? (
        <section
          key={hero.id}
          className="hero-banner home-featured-hero home-carousel-hero"
          style={{
            backgroundImage: `url(${hero.banner || hero.artwork})`,
            backgroundPosition: hero.bannerPosition || 'center center',
            backgroundSize: hero.bannerFit || 'cover',
          }}
          aria-live="polite"
        >
          <div
            className="desktop-hero-visual"
            style={{
              backgroundImage: `url(${hero.banner || hero.artwork})`,
              backgroundPosition: hero.bannerPosition || 'center center',
              backgroundSize: hero.bannerFit || 'cover',
            }}
            aria-hidden="true"
          />

          <div className="home-carousel-brand-stage">
            <div className="desktop-hero-panel">
              <Link className="home-carousel-brand-link" to={`/app/shows/${hero.id}`} aria-label={`Open ${hero.title}`}>
                {hero.logoImage ? (
                  <img className="home-carousel-brand-logo" src={hero.logoImage} alt={`${hero.title} logo`} />
                ) : (
                  <span className="home-carousel-brand-fallback">{hero.logo || hero.title}</span>
                )}
              </Link>
              <p className="desktop-hero-meta">{hero.year} · {hero.maturity} · {hero.genre}</p>
              <Link className="btn desktop-hero-button" to={`/app/shows/${hero.id}`}>View Show</Link>
            </div>
          </div>

          {homeShows.length > 1 && (
            <div className="home-carousel-controls" aria-label="Featured shows">
              <button type="button" className="home-carousel-arrow" onClick={() => moveHero(-1)} aria-label="Previous featured show">‹</button>
              <div className="home-carousel-dots">
                {homeShows.map((show, index) => (
                  <button
                    key={show.id}
                    type="button"
                    className={index === heroIndex ? 'active' : ''}
                    onClick={() => setHeroIndex(index)}
                    aria-label={`Show ${show.title}`}
                    aria-current={index === heroIndex ? 'true' : undefined}
                  />
                ))}
              </div>
              <button type="button" className="home-carousel-arrow" onClick={() => moveHero(1)} aria-label="Next featured show">›</button>
            </div>
          )}
        </section>
      ) : (
        <section className="panel home-featured-empty">
          <p className="eyebrow">Featured on EBG+</p>
          <h2>No featured show is visible yet.</h2>
          <p>Staff can turn on Home visibility for a series in EBG Studio.</p>
        </section>
      )}

      <section className="home-welcome">
        <div>
          <p className="eyebrow">Your EBG+</p>
          <h1>Welcome back, {profile.name}.</h1>
          <p>Your shows, stories, applications, and the latest from EBG — all in one place.</p>
        </div>
        <Link className="btn muted" to="/app/my-list">Open My List</Link>
      </section>

      <nav className="home-shortcuts" aria-label="Quick links">
        <Link className="home-shortcut" to="/app/my-list">
          <span className="home-shortcut-icon" aria-hidden="true">♡</span>
          <span><strong>My List</strong><small>Your saved shows and favorites.</small></span>
        </Link>
        <Link className="home-shortcut" to="/app/applications">
          <span className="home-shortcut-icon" aria-hidden="true">↗</span>
          <span><strong>Applications</strong><small>Track casting and submission updates.</small></span>
        </Link>
        <Link className="home-shortcut" to="/app/inbox">
          <span className="home-shortcut-icon" aria-hidden="true">✉</span>
          <span><strong>Inbox</strong><small>Messages and EBG+ network updates.</small></span>
        </Link>
        <Link className="home-shortcut" to="/app/music">
          <span className="home-shortcut-icon" aria-hidden="true">♫</span>
          <span><strong>Music</strong><small>Jump into releases and artist worlds.</small></span>
        </Link>
      </nav>

      {continueWatchingEpisodes.length > 0 ? (
        <section className="home-section">
          <div className="home-section-head">
            <div><h2>Continue Watching</h2><p>Pick up exactly where you left off.</p></div>
          </div>
          <div className="rail">
            {continueWatchingEpisodes.map((episode) => {
              const progress = profile.playback[episode.id] ?? 0
              const show = showById.get(episode.showId)
              return (
                <article key={episode.id} className="continue-card-v2">
                  <Link to={`/app/watch/${episode.id}`}><img src={episode.thumbnail} alt={`${episode.title} thumbnail`} loading="lazy" /></Link>
                  <div className="continue-card-body">
                    <p className="eyebrow">{show?.title || 'EBG+'}</p>
                    <h3>{episode.title}</h3>
                    <p>S{episode.season} · E{episode.number}</p>
                    <progress value={progress} max={3600} />
                    <Link to={`/app/watch/${episode.id}`}>Resume →</Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}



      {cms.rails
        .map((rail) => ({
          ...rail,
          shows: rail.showIds.filter((id) => homeShowIds.has(id)).map((id) => showById.get(id)).filter(Boolean) as Show[],
        }))
        .filter((rail) => rail.shows.length > 0)
        .map((rail) => (
          <section className="home-section" key={rail.id}>
            <div className="home-section-head"><div><h2>{rail.title}</h2></div></div>
            <div className="rail">
              {rail.shows.map((show) => (
                <ContentCard key={show.id} show={show} inList={profile.watchlist.includes(show.id)} onToggle={() => onToggleWatchlist(show.id)} />
              ))}
            </div>
          </section>
        ))}

      <section className="home-section">
        <div className="home-section-head"><div><h2>Coming Soon</h2><p>A look at what’s next on EBG+.</p></div></div>
        {comingSoonShows.length ? (
          <div className="home-coming-grid">
            {comingSoonShows.map((show) => (
              <Link key={show.id} className="home-coming-card" to={`/app/shows/${show.id}`} style={{ backgroundImage: `url(${show.banner || show.artwork})` }}>
                <div><span className="pulse-badge">Coming Soon</span><h3>{show.title}</h3><p>{show.genre}</p></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-empty-v2">Nothing has been announced here yet. Keep an eye on EBG+.</div>
        )}
      </section>


      {/* EBG_PHASE146_HOME_NEWS_POSITION */}
      <section className="home-section">
        <div className="home-section-head">
          <div><h2>What’s happening on EBG+</h2><p>Jump into the parts of the platform that move with you.</p></div>
        </div>
        <div className="home-pulse-grid">
          <article className="home-pulse-card">
            <div><span className="pulse-badge">Casting</span><h3>Step into the story.</h3><p>Open casting opportunities and official EBG submissions live in EBG Forms.</p></div>
            <a href="https://forms.ebgplus.app">View Casting →</a>
          </article>
          <article className="home-pulse-card">
            <div><span className="pulse-badge">Applications</span><h3>Track your application.</h3><p>See your current casting status and follow each application from submission to final decision.</p></div>
            <Link to="/app/applications">My Applications →</Link>
          </article>
          <article className="home-pulse-card">
            <div><span className="pulse-badge">{newestEpisode ? 'New Release' : 'Discover'}</span><h3>{newestEpisode ? newestEpisode.title : 'Explore EBG+'}</h3><p>{newestEpisode && newestShow ? `New from ${newestShow.title}.` : 'Discover originals, music, specials, and the wider EBG universe.'}</p></div>
            {newestEpisode ? <Link to={`/app/watch/${newestEpisode.id}`}>Watch Now →</Link> : <Link to="/app/shows">Browse Shows →</Link>}
          </article>
        </div>
      </section>
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
  const featured = cms.shows.find((show) => show.id === cms.heroShowId) ?? cms.shows[0]
  const comingSoon = cms.shows.filter((show) => show.status === 'Coming Soon')
  const groups = Array.from(new Set(cms.shows.map((show) => show.category || show.genre || 'EBG+')))
    .map((label) => ({ label, shows: cms.shows.filter((show) => (show.category || show.genre || 'EBG+') === label) }))
    .filter((group) => group.shows.length > 0)

  return (
    <main className="page shows-catalog-page">
      <header className="shows-catalog-head">
        <div>
          <p className="eyebrow">Explore EBG+</p>
          <h1>Shows & Movies</h1>
          <p>Original series, films, specials, reality, and stories from across the EBG universe.</p>
        </div>
      </header>

      {featured ? (
        <section className="shows-catalog-feature" style={{ backgroundImage: 'url(' + (featured.banner || featured.artwork) + ')' }}>
          <div className="shows-catalog-feature-overlay">
            <span className="shows-catalog-pill">Featured on EBG+</span>
            {featured.logoImage ? <img className="shows-catalog-logo" src={featured.logoImage} alt={featured.title + ' logo'} /> : <h2>{featured.logo || featured.title}</h2>}
            <p className="shows-catalog-meta">{featured.year} · {featured.maturity} · {featured.genre}</p>
            <p className="shows-catalog-description">{featured.description}</p>
            <div className="actions"><Link className="btn" to={'/app/shows/' + featured.id}>View Title</Link></div>
          </div>
        </section>
      ) : null}

      {comingSoon.length > 0 ? (
        <section className="shows-catalog-section">
          <div className="shows-catalog-section-head"><div><p className="eyebrow">Up next</p><h2>Coming Soon</h2></div></div>
          <div className="shows-catalog-wide-grid">
            {comingSoon.map((show) => (
              <Link key={show.id} className="shows-catalog-wide-card" to={'/app/shows/' + show.id} style={{ backgroundImage: 'url(' + (show.banner || show.artwork) + ')' }}>
                <div><span className="shows-catalog-pill">Coming Soon</span><h3>{show.title}</h3><p>{show.genre}</p></div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {groups.map((group) => (
        <section className="shows-catalog-section" key={group.label}>
          <div className="shows-catalog-section-head"><div><p className="eyebrow">Browse</p><h2>{group.label}</h2></div><span>{group.shows.length} title{group.shows.length === 1 ? '' : 's'}</span></div>
          <div className="shows-browse-grid shows-catalog-grid">
            {group.shows.map((show) => (
              <article className="shows-browse-card shows-catalog-card" key={show.id}>
                <Link className="shows-browse-art" to={'/app/shows/' + show.id}>
                  <img src={show.artwork} alt={show.title + ' artwork'} loading="lazy" />
                  <span className="shows-browse-status">{show.status}</span>
                </Link>
                <div className="shows-browse-copy">
                  <h3>{show.title}</h3>
                  <p>{show.genre} · {show.maturity}</p>
                  <Link className="shows-browse-link" to={'/app/shows/' + show.id}>View Title →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {/* EBG_PHASE149_SHOWS_CATALOG */}
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
  const [season, setSeason] = useState(1)
  if (!show) return <NotFoundPage />

  const allEpisodes = cms.episodes
    .filter((episode) => episode.showId === show.id)
    .sort((a, b) => a.season - b.season || a.number - b.number)
  const releasedEpisodes = allEpisodes.filter((episode) => isEpisodeReleased(episode))


  const seasons = Array.from(new Set(allEpisodes.map((episode) => episode.season))).sort((a, b) => a - b)
  const selectedSeason = seasons.includes(season) ? season : seasons[0] ?? 1
  const seasonEpisodes = allEpisodes.filter((episode) => episode.season === selectedSeason)
  const firstReleased = releasedEpisodes[0]
  const newestReleased = [...releasedEpisodes].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0]

  const episodeBadge = (episode: Episode) => {
    if (!isEpisodeReleased(episode)) return 'Coming soon'
    const age = Date.now() - new Date(episode.releaseDate).getTime()
    return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000 ? 'New episode' : ''
  }

  return (
    <main className="page show-page heartspell-page universal-show-page">
      <section className="heartspell-hero" style={{ backgroundImage: `url(${show.banner || show.artwork})` }}>
        <div className="heartspell-hero-content">
          <p className="heartspell-kicker">{show.category || 'EBG+'}</p>
          {show.logoImage ? <img className="show-logo-image" src={show.logoImage} alt={`${show.title} logo`} /> : <h1 className="heartspell-title">{show.logo || show.title}</h1>}
          <div className="heartspell-meta"><span>{show.year}</span><span>{show.maturity}</span><span>{show.status}</span><span>{show.genre}</span></div>
          <p className="heartspell-description">{show.description}</p>
          <div className="actions">
            {firstReleased && <Link className="btn" to={`/app/watch/${firstReleased.id}`}>▶ Watch Now</Link>}
            <button className="btn muted" onClick={() => onToggleWatchlist(show.id)}>{profile.watchlist.includes(show.id) ? '✓ In My List' : '+ My List'}</button>
          </div>
        </div>
      </section>

      <section className="heartspell-section">
        <div className="heartspell-section-head">
          <div><p className="heartspell-kicker">Watch now</p><h2>Episodes</h2></div>
          {seasons.length > 0 && <div className="heartspell-season-tabs">{seasons.map((item) => <button key={item} className={item === selectedSeason ? 'active' : ''} onClick={() => setSeason(item)}>Season {item}</button>)}</div>}
        </div>
        <div className="heartspell-episode-grid">
          {seasonEpisodes.map((episode) => {
            const badge = episodeBadge(episode)
            const released = isEpisodeReleased(episode)
            return (
              <article key={episode.id} className="heartspell-episode">
                <div className="heartspell-episode-media">
                  <img src={episode.thumbnail} alt={`Episode ${episode.number}: ${episode.title}`} loading="lazy" />
                  {badge && <span className={`heartspell-badge ${released ? 'new' : 'soon'}`}>{badge}</span>}
                </div>
                <div className="heartspell-episode-body">
                  <p className="heartspell-kicker">S{episode.season} · E{episode.number} · {episode.runtime}</p>
                  <h3>{episode.title}</h3>
                  <p>{episode.synopsis}</p>
                  {released ? <Link to={`/app/watch/${episode.id}`}>{(playback[episode.id] ?? 0) > 0 ? 'Resume episode →' : 'Watch episode →'}</Link> : <span>Premieres {new Date(episode.releaseDate).toLocaleDateString()}</span>}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="heartspell-section">
        <div className="heartspell-section-head"><div><p className="heartspell-kicker">Meet the cast</p><h2>Cast</h2></div><p>{show.cast.length} cast member{show.cast.length === 1 ? '' : 's'}</p></div>
        {show.cast.length > 0 ? (
          <div className="heartspell-cast-grid">
            {show.cast.map((person, index) => (
              <article key={`${person.name}-${index}`} className="heartspell-cast-card">
                {person.image ? <img className="heartspell-cast-photo" src={person.image} alt={person.name} loading="lazy" /> : <div className="heartspell-cast-fallback">{person.name.slice(0,1)}</div>}
                <div className="heartspell-cast-gradient" />
                <div className="heartspell-cast-copy"><h3>{person.name}</h3><p>{person.city}{person.status ? ` · ${person.status}` : ''}</p><Link to={`/app/shows/${show.id}/cast/${index}`}>Meet {person.name.split(' ')[0]} →</Link></div>
              </article>
            ))}
          </div>
        ) : <div className="panel"><h3>Cast details coming soon.</h3><p>Cast profiles will appear here when they’re added in EBG Studio.</p></div>}
      </section>

      <LivePollSection showId={show.id} />

      {newestReleased && <section className="heartspell-section"><p className="heartspell-kicker">Latest from {show.title}</p><h2>{newestReleased.title}</h2><p>{newestReleased.synopsis}</p></section>}
    </main>
  )
}

function LivePollSection({ showId }: { showId: string }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [options, setOptions] = useState<Record<string, PollOption[]>>({})
  const [results, setResults] = useState<Record<string, PollResult[]>>({})
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const nextPolls = await loadPolls(showId)
      setPolls(nextPolls)
      const optionPairs = await Promise.all(nextPolls.map(async (poll) => [poll.id, await loadPollOptions(poll.id)] as const))
      setOptions(Object.fromEntries(optionPairs))
      const resultPairs = await Promise.all(nextPolls.map(async (poll) => {
        try { return [poll.id, await loadPollResults(poll.id)] as const } catch { return [poll.id, []] as const }
      }))
      setResults(Object.fromEntries(resultPairs))
    } catch {
      setPolls([])
    }
  }

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 2500)
    return () => window.clearInterval(timer)
  }, [showId])

  const vote = async (pollId: string, optionId: string) => {
    setMessage('Saving your vote…')
    try {
      await voteInPoll(pollId, optionId)
      setMessage('Vote counted ✨')
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Vote could not be saved.')
    }
  }

  if (polls.length === 0) return null

  return (
    <section className="heartspell-section live-polls">
      <p className="heartspell-kicker">Fan voting</p>
      <h2>Your vote matters.</h2>
      <p>Results update automatically while polls are live.</p>
      {polls.map((poll) => (
        <article className="live-poll-card" key={poll.id}>
          <span className={`poll-status ${poll.status}`}>{poll.status}</span>
          <h3>{poll.question}</h3>
          {poll.description && <p>{poll.description}</p>}
          {poll.status === 'open' && (options[poll.id] ?? []).map((option) => (
            <button className="poll-option-button" type="button" key={option.id} onClick={() => void vote(poll.id, option.id)}><span>{option.label}</span><span>Vote</span></button>
          ))}
          {(results[poll.id] ?? []).map((result) => (
            <div className="fan-result" key={result.option_id}>
              <div className="fan-result-line"><span>{result.label}</span><strong>{result.percentage}%</strong></div>
              <div className="fan-result-bar"><span style={{ width: `${result.percentage}%` }} /></div>
            </div>
          ))}
          {(results[poll.id]?.[0]?.total_votes ?? 0) > 0 && <small>{results[poll.id][0].total_votes} total votes</small>}
        </article>
      ))}
      {message && <p className="studio-help">{message}</p>}
    </section>
  )
}

function CastProfilePage({ cms }: { cms: CmsData }) {
  const { showId, castIndex } = useParams()
  const show = cms.shows.find((item) => item.id === showId)
  const index = Number(castIndex)
  const person = show?.cast[index]
  if (!show || !person) return <NotFoundPage />

  return (
    <main className="page heartspell-page heartspell-cast-profile universal-show-page">
      <Link to={`/app/shows/${show.id}`}>← Back to {show.title}</Link>
      <section className="heartspell-profile-hero heartspell-section">
        <div className="heartspell-profile-photo">{person.image ? <img src={person.image} alt={person.name} /> : <div className="heartspell-cast-fallback">{person.name.slice(0,1)}</div>}</div>
        <div className="heartspell-profile-copy">
          <p className="heartspell-kicker">{show.title}{person.role ? ` · ${person.role}` : ''}</p>
          <h1>{person.name}</h1>
          <div className="heartspell-meta"><span>{person.city}</span>{person.status && <span>{person.status}</span>}</div>
          <p className="bio">{person.bio}</p>
          {person.social && <p><strong>Social:</strong> {person.social}</p>}
        </div>
      </section>
    </main>
  )
}


const isEpisodeReleased = (episode: Episode) => {
  if (episode.publishStatus === 'draft' || episode.publishStatus === 'archived') return false
  if (episode.publishStatus === 'live') return true
  const releaseAt = Date.parse(episode.releaseDate)
  return Number.isNaN(releaseAt) || releaseAt <= Date.now()
}

// EBG_PHASE153_BUILTIN_PLAYERS_SAFE
function formatPlayerTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0')
}

// EBG_PHASE155_PERSISTENT_MUSIC_DOCK
// EBG_PHASE156_TIMED_LYRICS
type EbgTimedLyric = { start: number; end: number; text: string }
type EbgMusicTrackDetail = {
  src: string
  title: string
  artist: string
  artwork?: string
  lyrics?: string
  timedLyrics?: EbgTimedLyric[]
}

function EbgAudioPlayer({
  src,
  title = 'Now Playing',
  artist = 'EBG+',
  artwork,
  lyrics,
  timedLyrics,
}: {
  src: string
  title?: string
  artist?: string
  artwork?: string
  lyrics?: string
  timedLyrics?: EbgTimedLyric[]
}) {
  const play = () => {
    window.dispatchEvent(new CustomEvent<EbgMusicTrackDetail>('ebg-music-play', {
      detail: { src, title, artist, artwork, lyrics, timedLyrics },
    }))
  }

  return (
    <button type="button" className="ebg-track-launcher" onClick={play} aria-label={'Play ' + title}>
      <span className="ebg-track-launcher-art">{artwork ? <img src={artwork} alt="" /> : '♪'}</span>
      <span className="ebg-track-launcher-copy"><strong>{title}</strong><small>{artist}</small></span>
      <span className="ebg-track-launcher-play">▶</span>
    </button>
  )
}

function EbgMusicDock() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<EbgMusicTrackDetail | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const onPlayTrack = (event: Event) => {
      const detail = (event as CustomEvent<EbgMusicTrackDetail>).detail
      if (!detail?.src) return
      setTrack(detail)
      setCurrent(0)
      setDuration(0)
    }
    window.addEventListener('ebg-music-play', onPlayTrack)
    return () => window.removeEventListener('ebg-music-play', onPlayTrack)
  }, [])

  useEffect(() => {
    if (!track?.src) return
    const media = audioRef.current
    if (!media) return
    media.load()
    void media.play().catch(() => undefined)
  }, [track?.src])

  const timedLyrics = track?.timedLyrics ?? []
  const activeLyricIndex = timedLyrics.findIndex((line) => current >= line.start && current < line.end)

  useEffect(() => {
    if (!expanded || activeLyricIndex < 0) return
    const node = document.querySelector<HTMLElement>('[data-ebg-lyric-index="' + activeLyricIndex + '"]')
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeLyricIndex, expanded])

  if (!track) return null

  const toggle = async () => {
    const media = audioRef.current
    if (!media) return
    if (media.paused) {
      try { await media.play() } catch { return }
    } else {
      media.pause()
    }
  }

  const seek = (value: number) => {
    const media = audioRef.current
    if (!media) return
    media.currentTime = value
    setCurrent(value)
  }

  const close = () => {
    const media = audioRef.current
    if (media) media.pause()
    setTrack(null)
    setExpanded(false)
    setPlaying(false)
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted) }}
      />

      <aside className="ebg-music-dock" aria-label="Now playing">
        <button type="button" className="ebg-music-dock-open" onClick={() => setExpanded(true)} aria-label="Open Now Playing">
          <span className="ebg-music-dock-art">{track.artwork ? <img src={track.artwork} alt="" /> : '♪'}</span>
          <span className="ebg-music-dock-copy"><strong>{track.title}</strong><small>{track.artist}</small></span>
        </button>
        <button type="button" className="ebg-music-dock-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
        <div className="ebg-music-dock-progress">
          <input type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" />
        </div>
        <button type="button" className="ebg-music-dock-close" onClick={close} aria-label="Close player">×</button>
      </aside>

      {expanded && (
        <div className="ebg-now-playing-overlay" role="dialog" aria-modal="true" aria-label="Now Playing">
          <button type="button" className="ebg-now-playing-dismiss" onClick={() => setExpanded(false)} aria-label="Close Now Playing">⌄</button>
          <div className="ebg-now-playing-shell">
            <section className="ebg-now-playing-main">
              <div className="ebg-now-playing-art">{track.artwork ? <img src={track.artwork} alt="" /> : <span>♪</span>}</div>
              <div className="ebg-now-playing-copy"><span>NOW PLAYING</span><h2>{track.title}</h2><p>{track.artist}</p></div>
              <div className="ebg-now-playing-timeline">
                <span>{formatPlayerTime(current)}</span>
                <input type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" />
                <span>-{formatPlayerTime(Math.max(duration - current, 0))}</span>
              </div>
              <div className="ebg-now-playing-controls">
                <button type="button" onClick={() => seek(Math.max(current - 10, 0))} aria-label="Back 10 seconds">↶</button>
                <button type="button" className="primary" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
                <button type="button" onClick={() => seek(Math.min(current + 10, duration || current + 10))} aria-label="Forward 10 seconds">↷</button>
              </div>
              <div className="ebg-now-playing-volume">
                <button type="button" onClick={() => { const media = audioRef.current; if (!media) return; media.muted = !media.muted; setMuted(media.muted) }} aria-label={muted ? 'Unmute' : 'Mute'}>{muted || volume === 0 ? '🔇' : '🔊'}</button>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = audioRef.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setMuted(false); setVolume(media.volume) }} aria-label="Volume" />
              </div>
            </section>
            <section className="ebg-now-playing-lyrics ebg-synced-lyrics">
              <span>LYRICS</span>
              {timedLyrics.length ? (
                <div className="ebg-synced-lyrics-scroll">
                  {timedLyrics.map((line, index) => (
                    <button
                      type="button"
                      key={index + '-' + line.start}
                      data-ebg-lyric-index={index}
                      className={index === activeLyricIndex ? 'active' : index < activeLyricIndex ? 'past' : ''}
                      onClick={() => seek(line.start)}
                    >
                      {line.text}
                    </button>
                  ))}
                </div>
              ) : track.lyrics?.trim() ? <div className="ebg-plain-lyrics">{track.lyrics}</div> : <p>Lyrics haven’t been added for this song yet.</p>}
            </section>
          </div>
        </div>
      )}
    </>
  )
}

function EbgVideoPlayer({ src, poster, title = 'EBG+ Video', autoPlay = false, startAt = 0, onProgress, onEnded }: { src: string; poster?: string; title?: string; autoPlay?: boolean; startAt?: number; onProgress?: (seconds: number) => void; onEnded?: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const toggle = async () => {
    const media = ref.current
    if (!media) return
    if (media.paused) { try { await media.play() } catch { return } } else media.pause()
  }
  const fullscreen = async () => {
    const shell = shellRef.current
    if (!shell) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await shell.requestFullscreen()
  }
  return (
    <div ref={shellRef} className="ebg-video-player" aria-label={title}>
      <video ref={ref} src={src} poster={poster} autoPlay={autoPlay} playsInline onLoadedMetadata={(event) => { const media = event.currentTarget; setDuration(media.duration || 0); if (startAt > 0 && startAt < (media.duration || Infinity)) media.currentTime = startAt }} onTimeUpdate={(event) => { setCurrent(event.currentTarget.currentTime); if (onProgress) onProgress(event.currentTarget.currentTime) }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); if (onEnded) onEnded() }} onVolumeChange={(event) => setVolume(event.currentTarget.volume)} />
      <button type="button" className="ebg-video-center-play" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
      <div className="ebg-video-controls">
        <button type="button" className="ebg-player-icon" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
        <span className="ebg-player-time">{formatPlayerTime(current)}</span>
        <input className="ebg-player-progress" type="range" min="0" max={Math.max(duration, 0.01)} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { const media = ref.current; if (!media) return; media.currentTime = Number(event.target.value); setCurrent(media.currentTime) }} aria-label="Seek" />
        <span className="ebg-player-time">{formatPlayerTime(duration)}</span>
        <button type="button" className="ebg-player-icon" onClick={() => { const media = ref.current; if (!media) return; media.muted = !media.muted }}>{volume === 0 || ref.current?.muted ? '🔇' : '🔊'}</button>
        <input className="ebg-player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const media = ref.current; if (!media) return; media.volume = Number(event.target.value); media.muted = false; setVolume(media.volume) }} aria-label="Volume" />
        <button type="button" className="ebg-player-icon" onClick={fullscreen}>⛶</button>
      </div>
    </div>
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
      <EbgVideoPlayer
        src={episode.videoUrl}
        title={episode.title}
        autoPlay
        startAt={profile.playback[episode.id] ?? 0}
        onProgress={(seconds) => savePlayback(episode.id, seconds)}
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

function NetworkInboxPage({ cms }: { cms: CmsData }) {
  const [submissions,setSubmissions]=useState<InboxSubmission[]>([])
  const [messages,setMessages]=useState<InboxMessage[]>([])
  const [forms,setForms]=useState<Array<{id:string;title:string;slug:string;eyebrow:string}>>([])
  const [active,setActive]=useState<InboxSubmission|null>(null)
  const [thread,setThread]=useState<InboxMessage[]>([])
  const [filter,setFilter]=useState<'all'|'unread'|'active'>('all')
  const [state,setState]=useState('Loading messages…')
  const refresh=async()=>{try{const data=await loadInboxNetwork();setSubmissions(data.submissions);setMessages(data.messages);setForms(data.forms);setState('')}catch(error){setState(error instanceof Error?error.message:'Inbox could not be loaded.')}}
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),4000);return()=>window.clearInterval(timer)},[])
  const formTitle=(id:string)=>forms.find(f=>f.id===id)?.title??cms.shows.find(show=>show.id===id)?.title??'EBG Application'
  const unreadFor=(id:string)=>messages.filter(message=>message.submission_id===id&&!message.read_by_applicant).length
  const latestFor=(id:string)=>messages.find(message=>message.submission_id===id)
  const visible=submissions.filter(sub=>filter==='all'||(filter==='unread'?unreadFor(sub.id)>0:sub.conversation_state!=='resolved'))
  const openThread=async(sub:InboxSubmission)=>{setActive(sub);await markInboxThreadRead(sub.id).catch(()=>{});setThread(await loadInboxThread(sub.id));await refresh()}
  const send=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!active)return;const el=event.currentTarget;const data=new FormData(el);const body=String(data.get('body')??'').trim();if(!body)return;await sendInboxMessage(active.id,body);el.reset();setThread(await loadInboxThread(active.id));await refresh()}
  return <main className="page ebg-inbox-page"><section className="ebg-inbox-hero"><div><p className="eyebrow">EBG+ MESSAGES</p><h1>Inbox</h1><p>Private conversations with EBG about your applications, callbacks, and next steps.</p></div><div className="ebg-inbox-count"><strong>{submissions.reduce((sum,sub)=>sum+unreadFor(sub.id),0)}</strong><span>unread</span></div></section>
    <div className="ebg-inbox-filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button><button className={filter==='unread'?'active':''} onClick={()=>setFilter('unread')}>Unread</button><button className={filter==='active'?'active':''} onClick={()=>setFilter('active')}>Active</button></div>
    {state&&<p className="panel">{state}</p>}
    {!state&&!visible.length&&<section className="ebg-inbox-empty"><span>✉</span><h2>No messages here yet.</h2><p>When EBG contacts you about an application, the conversation will appear here.</p></section>}
    <section className="ebg-inbox-list">{visible.map(sub=>{const latest=latestFor(sub.id);const unread=unreadFor(sub.id);return <button key={sub.id} className={'ebg-inbox-row '+(unread?'unread':'')} onClick={()=>void openThread(sub)}><div className="ebg-inbox-avatar">EBG</div><div className="ebg-inbox-copy"><div><strong>{formTitle(sub.form_id)}</strong><span>{sub.conversation_state?.replaceAll('_',' ')??'open'}</span></div><p>{latest?.body??'Application submitted. Start a conversation with EBG.'}</p><small>{new Date(latest?.created_at??sub.created_at).toLocaleString()}</small></div>{unread>0&&<b>{unread}</b>}</button>})}</section>
    {active&&<div className="ebg-inbox-overlay"><section className="ebg-inbox-thread"><header><div><p className="eyebrow">PRIVATE EBG THREAD</p><h2>{formTitle(active.form_id)}</h2><span>{active.conversation_state?.replaceAll('_',' ')??'open'}</span></div><button onClick={()=>setActive(null)}>×</button></header><div className="ebg-inbox-chat">{thread.map(message=><article className={message.sender_account_id===active.submitted_by?'mine':'theirs'} key={message.id}><strong>{message.sender_account_id===active.submitted_by?'You':message.sender_label||'EBG Team'}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString()}</small></article>)}</div><form onSubmit={send}><textarea name="body" required placeholder="Write a message to EBG…"/><button className="btn">Send</button></form></section></div>}
  </main>
}

function MyApplicationsPage({ cms }: { cms: CmsData }) {
  const [submissions,setSubmissions]=useState<ApplicantSubmission[]>([])
  const [forms,setForms]=useState<Array<{id:string;title:string;slug:string;eyebrow:string}>>([])
  const [notices,setNotices]=useState<AccountNotification[]>([])
  const [active,setActive]=useState<ApplicantSubmission|null>(null)
  const [messages,setMessages]=useState<ApplicantMessage[]>([])
  const [state,setState]=useState('Loading your application center…')
  const [deletingId,setDeletingId]=useState<string|null>(null)

  const refresh=async()=>{try{const data=await loadApplicantNetwork();setSubmissions(data.submissions);setForms(data.forms);setNotices(data.notifications);setState('')}catch(error){setState(error instanceof Error?error.message:'Applications could not be loaded.')}}
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),5000);return()=>window.clearInterval(timer)},[])

  const openThread=async(submission:ApplicantSubmission)=>{setActive(submission);try{setMessages(await loadApplicantMessages(submission.id))}catch(error){setState(error instanceof Error?error.message:'Messages could not be loaded.')}}
  const send=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!active)return;const el=event.currentTarget;const data=new FormData(el);const body=String(data.get('body')??'').trim();if(!body)return;await sendApplicantMessage(active.id,body);el.reset();setMessages(await loadApplicantMessages(active.id))}
  const statusCopy=(status:string)=>({new:['Submitted','Your application has been received.'],reviewing:['Under Review','The EBG team is reviewing your application.'],contacted:['Next Step','EBG has reached out with a next step. Check your messages.'],accepted:['Accepted','You have been selected. 🎉'],declined:['Closed','This application cycle has closed. Thank you for applying.']}[status]??['In Progress','Your application is still active.'])
  const formTitle=(id:string)=>forms.find(form=>form.id===id)?.title??cms.shows.find(show=>show.id===id)?.title??'EBG Application'
  const removeSubmission=async(submission:ApplicantSubmission)=>{
    const label=formTitle(submission.form_id)
    if(!window.confirm(`Delete this ${label} submission permanently? This also removes its application messages and cannot be undone.`)) return
    setDeletingId(submission.id)
    setState('Deleting submission…')
    try{
      await deleteApplicantSubmission(submission.id)
      if(active?.id===submission.id){setActive(null);setMessages([])}
      setSubmissions(previous=>previous.filter(item=>item.id!==submission.id))
      setState('Submission deleted.')
      window.setTimeout(()=>setState(''),1800)
      await refresh()
    }catch(error){
      setState(error instanceof Error?error.message:'Submission could not be deleted.')
    }finally{
      setDeletingId(null)
    }
  }

  return <main className="applications-page application-network-page">
    <section className="applications-hero"><p className="eyebrow">EBG APPLICATION CENTER</p><h1>My Applications</h1><p>Status updates, official messages, and every application you’ve submitted to the EBG network — all in one place.</p><a className="btn" href="https://forms.ebgplus.app">Browse open forms</a></section>
    {state&&<p className="panel application-state">{state}</p>}
    {!!notices.length&&<section className="application-notice-panel"><div className="application-section-head"><h2>Updates</h2><span>{notices.filter(n=>!n.read).length} unread</span></div><div className="application-notices">{notices.slice(0,8).map(n=><button key={n.id} className={n.read?'read':''} onClick={()=>{void markNotificationRead(n.id).then(refresh)}}><strong>{n.title}</strong><span>{n.text}</span><small>{new Date(n.created_at).toLocaleString()}</small></button>)}</div></section>}
    {!state&&!submissions.length&&<section className="applications-empty"><h2>No applications yet.</h2><p>Sign in before submitting a form and it will appear here automatically.</p><a className="btn" href="https://forms.ebgplus.app">Explore EBG Forms</a></section>}
    <section className="application-network-grid">{submissions.map(sub=>{const copy=statusCopy(sub.status);return <article className="application-network-card" key={sub.id}><div className="application-card-head"><div><p className="eyebrow">{formTitle(sub.form_id)}</p><h2>{String(sub.answers?.legalName??sub.respondent_email??'Application')}</h2><small>Submitted {new Date(sub.created_at).toLocaleDateString()}</small></div><span className={'application-status '+sub.status}>{copy[0]}</span></div><p>{copy[1]}</p><div className="application-answer-preview">{Object.entries(sub.answers).slice(0,4).map(([key,value])=><div key={key}><small>{key.replaceAll('_',' ')}</small><span>{String(value)}</span></div>)}</div><div className="application-card-actions"><button className="btn muted" onClick={()=>void openThread(sub)}>Messages & details</button><button className="application-delete" type="button" disabled={deletingId===sub.id} onClick={()=>void removeSubmission(sub)}>{deletingId===sub.id?'Deleting…':'Delete submission'}</button></div></article>})}</section>
    {active&&<div className="application-thread-overlay"><section className="application-thread"><div className="application-thread-head"><div><p className="eyebrow">PRIVATE APPLICATION THREAD</p><h2>{formTitle(active.form_id)}</h2></div><button aria-label="Close application thread" onClick={()=>setActive(null)}>×</button></div><div className="application-thread-answers">{Object.entries(active.answers).map(([key,value])=><div key={key}><small>{key.replaceAll('_',' ')}</small><span>{String(value)}</span></div>)}</div><div className="application-chat">{messages.map(msg=><article key={msg.id}><strong>{msg.sender_account_id===active.submitted_by?'You':'EBG Team'}</strong><p>{msg.body}</p><small>{new Date(msg.created_at).toLocaleString()}</small></article>)}</div><form onSubmit={send}><textarea name="body" required placeholder="Message the EBG team about this application…"/><button className="btn">Send message</button></form></section></div>}
  </main>
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

function NotificationsPage({ cms, account, castingApps }: { cms: CmsData; account: Account; castingApps: CastingApplication[] }) {
  const storageKey = `ebg.notifications.read.${account.id}`
  const [network,setNetwork]=useState<InboxNotification[]>([])
  const [readIds,setReadIds]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)??'[]') as string[]}catch{return[]}})
  const [loading,setLoading]=useState(true)
  const isCastingApplicant=castingApps.some(app=>app.email.toLowerCase()===account.email.toLowerCase())
  const refresh=async()=>{try{const data=await loadInboxNetwork();setNetwork(data.notifications)}finally{setLoading(false)}}
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),5000);return()=>window.clearInterval(timer)},[])
  const cmsNotices=[...(cms.notifications??[])].filter(n=>{const status=n.status??'sent';if(status==='draft')return false;const publishAt=Date.parse(n.date);if(status==='scheduled'&&!Number.isNaN(publishAt)&&publishAt>Date.now())return false;if(n.audience==='casting'&&!isCastingApplicant)return false;return true}).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))
  const unreadNetwork=network.filter(n=>!n.read).length
  const unreadCms=cmsNotices.filter(n=>!readIds.includes(n.id)).length
  const markCms=(id:string)=>{if(readIds.includes(id))return;const next=[...readIds,id];setReadIds(next);localStorage.setItem(storageKey,JSON.stringify(next))}
  const markAll=async()=>{await markAllNetworkNotificationsRead().catch(()=>{});const ids=cmsNotices.map(n=>n.id);setReadIds(ids);localStorage.setItem(storageKey,JSON.stringify(ids));await refresh()}
  return <main className="page notifications-v2 network-notifications-page"><div className="notifications-v2-head"><div><p className="eyebrow">EBG+ NOTIFICATIONS</p><h1>Notifications</h1><p>{unreadNetwork+unreadCms?`${unreadNetwork+unreadCms} unread update${unreadNetwork+unreadCms===1?'':'s'}`:'You’re all caught up.'}</p></div>{unreadNetwork+unreadCms>0&&<button className="btn muted" onClick={()=>void markAll()}>Mark all read</button>}</div>
    {loading&&<p className="panel">Loading notifications…</p>}
    <div className="network-notification-list">{network.map(n=><button key={n.id} className={'network-notification-card '+(n.read?'read':'unread')} onClick={()=>{void markOneNetworkNotificationRead(n.id).then(refresh)}}><span className="network-notification-icon">{n.kind==='application_message'?'✉':'✓'}</span><div><small>{n.kind==='application_message'?'MESSAGE':'APPLICATION UPDATE'} · {new Date(n.created_at).toLocaleString()}</small><strong>{n.title}</strong><p>{n.text}</p>{n.link&&<Link to={n.link}>Open →</Link>}</div></button>)}</div>
    {!!cmsNotices.length&&<section className="network-announcements"><h2>From EBG+</h2><div className="notifications-v2-list">{cmsNotices.map(n=>{const read=readIds.includes(n.id);return <article className={'notification-v2-card '+(read?'read':'unread')} key={n.id}><div className="notification-v2-dot"/><div><div className="notification-v2-meta"><span>EBG+</span><time>{new Date(n.date).toLocaleString()}</time></div><h2>{n.title||'EBG+ Update'}</h2><p>{n.text}</p>{n.link&&<Link className="notification-v2-link" to={n.link} onClick={()=>markCms(n.id)}>View update →</Link>}<button className="notification-read-button" onClick={()=>markCms(n.id)}>{read?'Read':'Mark read'}</button></div></article>})}</div></section>}
  </main>
}

function SettingsPage({ account, profile, onUpdateAccount, onSignOut }: { account: Account; profile: Profile; onUpdateAccount: (account: Account) => void; onSignOut: () => void }) {
  const [state, setState] = useState('')
  const [uploading, setUploading] = useState(false)
  const updateProfile = (patch: Partial<Profile>) => onUpdateAccount({ ...account, profiles: account.profiles.map((item) => item.id === profile.id ? { ...item, ...patch } : item) })
  const uploadPhoto = async (file?: File) => { if (!file) return; setUploading(true); setState(''); try { const avatar = await uploadProfilePhoto(file); updateProfile({ avatar }); setState('Profile photo updated.') } catch (error) { setState(error instanceof Error ? error.message : 'Profile photo could not be uploaded.') } finally { setUploading(false) } }
  return (<main className="page"><p className="eyebrow">Your EBG+ experience</p><h1>Settings</h1><div className="settings-shell"><section className="panel settings-profile-card"><AvatarVisual avatar={profile.avatar} /><h2>{profile.name}</h2><p>{account.email}</p><label>Choose profile photo<input type="file" accept="image/*" disabled={uploading} onChange={(event) => void uploadPhoto(event.target.files?.[0])} /></label>{state && <p>{state}</p>}</section><div className="settings-section"><section className="panel"><h2>Profile</h2><label>Profile name<input defaultValue={profile.name} maxLength={40} onBlur={(event) => { const name = event.target.value.trim(); if (name && name !== profile.name) updateProfile({ name }) }} /></label><div className="setting-row"><div><strong>Autoplay next episode</strong><p>Automatically continue to the next available episode.</p></div><input type="checkbox" checked={profile.autoplayNext} onChange={(event) => updateProfile({ autoplayNext: event.target.checked })} /></div></section><section className="panel"><h2>Account</h2><div className="setting-row"><span>Email</span><strong>{account.email}</strong></div><div className="setting-row"><span>Access</span><strong>{account.role}</strong></div><button className="btn muted" onClick={onSignOut}>Sign Out</button></section><section className="panel"><h2>Playback & Accessibility</h2><p>Caption, audio, language, and device preferences will live here as EBG+ expands.</p></section></div></div></main>)
}

function EbgStudioHub({
  cms,
  castingApps: _castingApps,
  onUpdateCms,
  onUpdateCastingStatus: _onUpdateCastingStatus,
}: {
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>
}) {
  const { studioSection } = useParams()
  const [showId, setShowId] = useState(cms.shows[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [polls, setPolls] = useState<Poll[]>([])
  const [pollResults, setPollResults] = useState<Record<string, PollResult[]>>({})

  const workspaces = [
    ['overview', 'Overview', '✦'],
    ['content', 'Content', '▤'],
    ['audience', 'Audience', '◎'],
    ['settings', 'Settings', '⚙'],
  ] as const
  type StudioWorkspace = typeof workspaces[number][0]
  const aliases: Record<string, StudioWorkspace> = {
    production: 'content',
    series: 'content',
    episodes: 'content',
    media: 'content',
    cast: 'audience',
    polls: 'audience',
    notifications: 'audience',
    casting: 'audience',
    homepage: 'settings',
  }
  const requested = studioSection ?? 'overview'
  const tab: StudioWorkspace = workspaces.some(([id]) => id === requested)
    ? requested as StudioWorkspace
    : aliases[requested] ?? 'overview'
  const show = cms.shows.find((item) => item.id === showId) ?? cms.shows[0]

  useEffect(() => {
    if (!cms.shows.some((item) => item.id === showId)) setShowId(cms.shows[0]?.id ?? '')
  }, [cms.shows, showId])

  const refreshPolls = async () => {
    try {
      const next = await loadPolls(undefined, true)
      setPolls(next)
      const pairs = await Promise.all(next.map(async (poll) => {
        try { return [poll.id, await loadPollResults(poll.id)] as const } catch { return [poll.id, []] as const }
      }))
      setPollResults(Object.fromEntries(pairs))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load polls.')
    }
  }

  useEffect(() => { void refreshPolls() }, [])

  if (!show) return null

  const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const selectedEpisodes = cms.episodes.filter((episode) => episode.showId === show.id)
  const liveEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'live')
  const scheduledEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'scheduled')
  const activePolls = polls.filter((poll) => poll.status === 'open')
  const title = workspaces.find(([id]) => id === tab)?.[1] ?? 'Overview'
  const draftEpisodes = selectedEpisodes.filter((episode) => episode.publishStatus === 'draft')
  const showPolls = polls.filter((poll) => poll.show_id === show.id)
  const recentEpisodes = [...selectedEpisodes].sort((a,b) => Date.parse(b.releaseDate) - Date.parse(a.releaseDate)).slice(0,4)

  const updateShow = (showId: string, patch: Partial<Show>) => {
    onUpdateCms({ ...cms, shows: cms.shows.map((item) => item.id === showId ? { ...item, ...patch } : item) })
  }

  const addShow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const showTitle = String(form.get('title') ?? '').trim()
    if (!showTitle) return
    setBusy(true); setMessage('Creating series…')
    try {
      const posterFile = form.get('artworkFile')
      const artwork = posterFile instanceof File && posterFile.size > 0
        ? await uploadStudioMedia(posterFile, 'shows/posters')
        : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80'
      const baseId = slugify(showTitle) || `show-${Date.now()}`
      const id = cms.shows.some((item) => item.id === baseId) ? `${baseId}-${Date.now()}` : baseId
      const nextShow: Show = {
        id,
        title: showTitle,
        category: String(form.get('category') ?? 'EBG+ Original'),
        description: String(form.get('description') ?? ''),
        genre: String(form.get('genre') ?? ''),
        year: Number(form.get('year') ?? new Date().getFullYear()),
        maturity: String(form.get('maturity') ?? 'TV-14') as Show['maturity'],
        status: String(form.get('status') ?? 'Coming Soon') as Show['status'],
        artwork,
        logo: showTitle,
        cast: [],
      }
      onUpdateCms({ ...cms, shows: [...cms.shows, nextShow] })
      setShowId(id); formEl.reset(); setMessage(`${showTitle} created.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Series could not be created.') }
    finally { setBusy(false) }
  }

  const duplicateShow = (sourceShow: Show) => {
    const baseId = slugify(`${sourceShow.title}-copy`) || `show-copy-${Date.now()}`
    const id = cms.shows.some((item) => item.id === baseId) ? `${baseId}-${Date.now()}` : baseId
    const copy: Show = {
      ...sourceShow,
      id,
      title: `${sourceShow.title} Copy`,
      status: 'Coming Soon',
      homeVisible: false,
      cast: sourceShow.cast.map((person) => ({ ...person })),
    }
    onUpdateCms({ ...cms, shows: [...cms.shows, copy] })
    setShowId(id)
    setMessage(`${copy.title} created. Episodes were not duplicated.`)
  }

  const deleteShow = (showId: string) => {
    if (!window.confirm('Delete this series and all of its episodes?')) return
    const remaining = cms.shows.filter((item) => item.id !== showId)
    onUpdateCms({
      ...cms,
      heroShowId: cms.heroShowId === showId ? (remaining[0]?.id ?? '') : cms.heroShowId,
      shows: remaining,
      episodes: cms.episodes.filter((episode) => episode.showId !== showId),
      rails: cms.rails.map((rail) => ({ ...rail, showIds: rail.showIds.filter((id) => id !== showId) })),
    })
    setShowId(remaining[0]?.id ?? '')
  }

  const replaceShowMedia = async (field: 'artwork' | 'banner' | 'logoImage', file?: File) => {
    if (!file?.size) return
    setBusy(true); setMessage('Uploading media…')
    try {
      const folder = field === 'artwork' ? 'shows/posters' : field === 'banner' ? 'shows/banners' : 'shows/logos'
      const url = await uploadStudioMedia(file, folder)
      updateShow(show.id, { [field]: url } as Partial<Show>)
      setMessage('Media updated.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Media upload failed.') }
    finally { setBusy(false) }
  }

  const addEpisode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action = (submitter?.value || 'scheduled') as 'draft' | 'scheduled' | 'live'
    setBusy(true); setMessage('Uploading episode…')
    try {
      const episodeTitle = String(form.get('title') ?? '').trim()
      const videoFile = form.get('videoFile')
      const thumbnailFile = form.get('thumbnailFile')
      if (!(videoFile instanceof File) || !videoFile.size) throw new Error('Choose an episode video file.')
      const videoUrl = await uploadStudioMedia(videoFile, 'episodes')
      const thumbnail = thumbnailFile instanceof File && thumbnailFile.size > 0
        ? await uploadStudioMedia(thumbnailFile, 'thumbnails')
        : show.artwork
      const releaseInput = String(form.get('releaseAt') ?? '')
      if (action === 'scheduled' && !releaseInput) throw new Error('Choose a release date and time before scheduling.')
      const releaseDate = action === 'live' ? new Date().toISOString() : releaseInput ? new Date(releaseInput).toISOString() : new Date().toISOString()
      const season = Number(form.get('season') ?? 1)
      const number = Number(form.get('number') ?? 1)
      const episode: Episode = {
        id: `${show.id}-s${season}e${number}-${Date.now()}`,
        showId: show.id,
        season,
        number,
        title: episodeTitle,
        synopsis: String(form.get('synopsis') ?? ''),
        runtime: String(form.get('runtime') ?? ''),
        releaseDate,
        thumbnail,
        videoUrl,
        publishStatus: action,
      }
      onUpdateCms({ ...cms, episodes: [...cms.episodes, episode] })
      formEl.reset(); setMessage(action === 'live' ? 'Episode published.' : action === 'scheduled' ? 'Episode scheduled.' : 'Episode saved as draft.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Episode upload failed.') }
    finally { setBusy(false) }
  }

  const updateEpisode = (episodeId: string, patch: Partial<Episode>) => {
    onUpdateCms({ ...cms, episodes: cms.episodes.map((episode) => episode.id === episodeId ? { ...episode, ...patch } : episode) })
  }

  const duplicateEpisode = (episode: Episode) => {
    const copy: Episode = {
      ...episode,
      id: `${episode.id}-copy-${Date.now()}`,
      title: `${episode.title} Copy`,
      publishStatus: 'draft',
      releaseDate: new Date().toISOString(),
    }
    onUpdateCms({ ...cms, episodes: [...cms.episodes, copy] })
    setMessage(`${copy.title} created as a draft.`)
  }

  const rescheduleEpisode = (episode: Episode) => {
    const current = new Date(episode.releaseDate)
    const currentValue = Number.isNaN(current.getTime()) ? '' : current.toISOString().slice(0, 16)
    const nextValue = window.prompt('Enter the new release date and time (YYYY-MM-DDTHH:MM):', currentValue)
    if (!nextValue) return
    const nextDate = new Date(nextValue)
    if (Number.isNaN(nextDate.getTime())) {
      setMessage('That release date is not valid.')
      return
    }
    updateEpisode(episode.id, { publishStatus: 'scheduled', releaseDate: nextDate.toISOString() })
    setMessage(`${episode.title} rescheduled.`)
  }

  const replaceEpisodeMedia = async (episodeId: string, field: 'thumbnail' | 'videoUrl', file?: File) => {
    if (!file?.size) return
    setBusy(true); setMessage('Uploading replacement…')
    try {
      const url = await uploadStudioMedia(file, field === 'thumbnail' ? 'thumbnails' : 'episodes')
      updateEpisode(episodeId, { [field]: url } as Partial<Episode>)
      setMessage('Episode media updated.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Replacement failed.') }
    finally { setBusy(false) }
  }

  const addCast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    setBusy(true); setMessage('Adding talent…')
    try {
      const file = form.get('imageFile')
      const image = file instanceof File && file.size > 0 ? await uploadStudioMedia(file, `series/${show.id}/cast`) : undefined
      const person = {
        name: String(form.get('name') ?? ''),
        role: String(form.get('role') ?? 'Cast'),
        city: String(form.get('city') ?? ''),
        bio: String(form.get('bio') ?? ''),
        social: String(form.get('social') ?? '') || undefined,
        status: String(form.get('status') ?? '') || undefined,
        image,
      }
      updateShow(show.id, { cast: [...show.cast, person] })
      formEl.reset(); setMessage('Talent added.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Talent could not be added.') }
    finally { setBusy(false) }
  }

  const createNewPoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const options = String(form.get('options') ?? '').split('\n').map((item) => item.trim()).filter(Boolean)
    if (options.length < 2) return setMessage('Add at least two poll options.')
    try {
      await createPoll({
        showId: show.id,
        question: String(form.get('question') ?? ''),
        description: String(form.get('description') ?? ''),
        options,
        status: String(form.get('status') ?? 'draft') as any,
        opensAt: String(form.get('opensAt') ?? '') || null,
        closesAt: String(form.get('closesAt') ?? '') || null,
        resultsVisibility: String(form.get('resultsVisibility') ?? 'live') as any,
      })
      formEl.reset(); setMessage('Poll created.'); await refreshPolls()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Poll could not be created.') }
  }

  const publishNotification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action = (submitter?.value || 'draft') as 'draft' | 'scheduled' | 'sent'
    const publishInput = String(form.get('publishAt') ?? '')
    if (action === 'scheduled' && !publishInput) return setMessage('Choose a date and time before scheduling.')
    const notification: NotificationItem = {
      id: `notice-${Date.now()}`,
      title: String(form.get('title') ?? '').trim(),
      text: String(form.get('text') ?? '').trim(),
      date: action === 'sent' ? new Date().toISOString() : publishInput ? new Date(publishInput).toISOString() : new Date().toISOString(),
      read: false,
      audience: String(form.get('audience') ?? 'all') as NotificationItem['audience'],
      status: action,
      link: String(form.get('link') ?? '').trim() || undefined,
    }
    if (!notification.title || !notification.text) return setMessage('Add a title and message first.')
    onUpdateCms({ ...cms, notifications: [notification, ...(cms.notifications ?? [])] })
    formEl.reset(); setMessage(action === 'sent' ? 'Notification sent.' : action === 'scheduled' ? 'Notification scheduled.' : 'Draft saved.')
  }

  return (
    <section className={`studio3 studio3-${tab}`}>
      <header className="studio3-header">
        <div className="studio3-brand-wrap">
          <Link className="studio3-brand" to="/app/studio/overview"><strong>EBG+</strong><span>Studio</span></Link>
          <span className="studio3-live-dot">Live CMS</span>
        </div>

        <nav className="studio3-nav" aria-label="EBG Studio">
          {workspaces.map(([id,label,icon]) => (
            <Link key={id} to={`/app/studio/${id}`} className={tab===id?'active':''}>
              <span>{icon}</span><strong>{label}</strong>
            </Link>
          ))}
        </nav>

        <div className="studio3-header-actions">
          <label className="studio3-project-picker">
            <span>Working on</span>
            <select value={show.id} onChange={(event)=>setShowId(event.target.value)}>
              {cms.shows.map((item)=><option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <Link className="studio3-view-site" to="/app/home">View EBG+</Link>
        </div>
      </header>

      {message && <div className="studio3-toast"><span>{message}</span><button type="button" onClick={()=>setMessage('')}>×</button></div>}

      <main className="studio3-main">
        <section className="studio3-page-intro">
          <div><p>EBG Studio</p><h1>{title}</h1><span>{tab==='overview'?'Everything important, without the clutter.':tab==='content'?'Build, publish, and package every production in one workspace.':tab==='audience'?'Manage the people, participation, and updates around your shows.':'Control homepage placement and production-level settings.'}</span></div>
          <div className="studio3-intro-status"><span>{show.status}</span><strong>{show.title}</strong></div>
        </section>

        {tab==='overview' && <div className="studio3-stack">
          <section className="studio3-overview-hero">
            <div className="studio3-overview-copy">
              <span className="studio3-kicker">TODAY IN STUDIO</span>
              <h2>Run the whole platform without digging through menus.</h2>
              <p>{show.title} is selected. Jump straight into publishing, audience tools, or homepage controls.</p>
              <div className="studio3-actions">
                <Link className="btn" to="/app/studio/content">Open Content</Link>
                <Link className="btn muted" to="/app/studio/audience">Audience tools</Link>
              </div>
            </div>
            <div className="studio3-featured-show" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(30,33,61,.82)),url(${show.banner||show.artwork})`}}>
              <span>{show.category}</span><strong>{show.title}</strong><small>{show.genre} · {show.year}</small>
            </div>
          </section>

          <section className="studio3-metrics">
            <article className="sky"><span>Series</span><strong>{cms.shows.length}</strong><small>{cms.shows.filter(item=>item.homeVisible!==false).length} visible on Home</small></article>
            <article className="mint"><span>Live episodes</span><strong>{cms.episodes.filter(e=>e.publishStatus==='live').length}</strong><small>{scheduledEpisodes.length} scheduled for {show.title}</small></article>
            <article className="blush"><span>Drafts</span><strong>{cms.episodes.filter(e=>e.publishStatus==='draft').length}</strong><small>{draftEpisodes.length} in this production</small></article>
            <article className="lilac"><span>Open polls</span><strong>{activePolls.length}</strong><small>{showPolls.length} total for this show</small></article>
          </section>

          <section className="studio3-overview-grid">
            <article className="studio3-panel studio3-quick-panel">
              <div className="studio3-panel-head"><div><span>QUICK ACTIONS</span><h2>What do you want to do?</h2></div></div>
              <div className="studio3-quick-grid">
                <Link to="/app/studio/content#upload-episode"><span>▶</span><div><strong>Upload episode</strong><small>Draft, schedule, or publish.</small></div><b>→</b></Link>
                <Link to="/app/studio/content#create-series"><span>＋</span><div><strong>Create series</strong><small>Start a new production.</small></div><b>→</b></Link>
                <Link to="/app/studio/audience#create-poll"><span>◉</span><div><strong>Launch poll</strong><small>Ask the audience something.</small></div><b>→</b></Link>
                <Link to="/app/studio/audience#send-update"><span>✦</span><div><strong>Send update</strong><small>Notify viewers or applicants.</small></div><b>→</b></Link>
              </div>
            </article>

            <article className="studio3-panel">
              <div className="studio3-panel-head"><div><span>RECENT RELEASES</span><h2>{show.title}</h2></div><Link to="/app/studio/content">Manage</Link></div>
              <div className="studio3-recent-list">
                {recentEpisodes.map((episode)=><div key={episode.id}><img src={episode.thumbnail} alt=""/><div><strong>{episode.title}</strong><small>S{episode.season}E{episode.number} · {episode.publishStatus}</small></div><span>{new Date(episode.releaseDate).toLocaleDateString()}</span></div>)}
                {!recentEpisodes.length&&<p className="studio3-empty">No episodes yet. Content is ready when you are.</p>}
              </div>
            </article>
          </section>

          <section className="studio3-workspace-cards">
            <Link to="/app/studio/content"><span>▤</span><strong>Content</strong><p>Series, episodes, artwork, banners, and release controls.</p></Link>
            <Link to="/app/studio/audience"><span>◎</span><strong>Audience</strong><p>Cast, polls, notifications, and application shortcuts.</p></Link>
            <Link to="/app/studio/settings"><span>⚙</span><strong>Settings</strong><p>Homepage visibility, featured placement, and production controls.</p></Link>
          </section>
        </div>}

        {tab==='content' && <div className="studio3-stack">
          <section className="studio3-panel studio3-production-banner">
            <div className="studio3-production-art" style={{backgroundImage:`url(${show.banner||show.artwork})`}} />
            <div className="studio3-production-copy">
              <span>{show.category}</span><h2>{show.title}</h2><p>{show.genre} · {show.year} · {show.maturity}</p>
              <div className="studio3-actions"><Link className="btn muted" to={`/app/shows/${show.id}`}>View show</Link><button className="btn" type="button" onClick={()=>{onUpdateCms({...cms,heroShowId:show.id,shows:cms.shows.map(item=>item.id===show.id?{...item,homeVisible:true}:item)});setMessage(`${show.title} is now featured on Home.`)}}>Feature on Home</button></div>
            </div>
          </section>

          <section className="studio3-content-grid">
            <article className="studio3-panel">
              <div className="studio3-panel-head"><div><span>SERIES</span><h2>Production library</h2></div><strong>{cms.shows.length}</strong></div>
              <div className="studio3-show-rail">{cms.shows.map(item=><button key={item.id} type="button" className={item.id===show.id?'active':''} onClick={()=>setShowId(item.id)}><img src={item.artwork} alt=""/><span><strong>{item.title}</strong><small>{item.status}</small></span></button>)}</div>
            </article>

            <article className="studio3-panel">
              <div className="studio3-panel-head"><div><span>DETAILS</span><h2>Edit {show.title}</h2></div><div className="studio3-mini-actions"><button type="button" onClick={()=>duplicateShow(show)}>Duplicate</button><button type="button" className="danger" onClick={()=>deleteShow(show.id)}>Delete</button></div></div>
              <div className="studio3-form-grid">
                <label>Title<input value={show.title} onChange={e=>updateShow(show.id,{title:e.target.value})}/></label>
                <label>Status<select value={show.status} onChange={e=>updateShow(show.id,{status:e.target.value as Show['status']})}><option>Coming Soon</option><option>Now Streaming</option><option>Current</option></select></label>
                <label>Genre<input value={show.genre} onChange={e=>updateShow(show.id,{genre:e.target.value})}/></label>
                <label>Year<input type="number" value={show.year} onChange={e=>updateShow(show.id,{year:Number(e.target.value)})}/></label>
                <label>Rating<input value={show.maturity} onChange={e=>updateShow(show.id,{maturity:e.target.value as Show['maturity']})}/></label>
                <label>Category<input value={show.category} onChange={e=>updateShow(show.id,{category:e.target.value})}/></label>
                <label className="full">Description<textarea value={show.description} onChange={e=>updateShow(show.id,{description:e.target.value})}/></label>
              </div>
            </article>
          </section>

          <details className="studio3-composer" id="create-series">
            <summary><span>＋</span><div><strong>Create a new series</strong><small>Start a production without leaving Content.</small></div><b>Open</b></summary>
            <form className="studio3-form-grid studio3-composer-body" onSubmit={addShow}>
              <label>Title<input name="title" required/></label><label>Category<input name="category" defaultValue="EBG+ Original"/></label>
              <label>Genre<input name="genre" required/></label><label>Year<input name="year" type="number" defaultValue={new Date().getFullYear()}/></label>
              <label>Rating<input name="maturity" defaultValue="TV-14"/></label><label>Status<select name="status" defaultValue="Coming Soon"><option>Coming Soon</option><option>Now Streaming</option></select></label>
              <label>Poster<input name="artworkFile" type="file" accept="image/*"/></label><label className="full">Description<textarea name="description" required/></label>
              <div className="full studio3-actions"><button className="btn" disabled={busy}>{busy?'Creating…':'Create Series'}</button></div>
            </form>
          </details>

          <section className="studio3-panel">
            <div className="studio3-panel-head"><div><span>EPISODES</span><h2>Release library</h2></div><strong>{selectedEpisodes.length}</strong></div>
            <div className="studio3-episode-list">
              {selectedEpisodes.map(episode=><article key={episode.id}>
                <img src={episode.thumbnail} alt=""/>
                <div className="studio3-episode-info"><span>S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleString()}</p><select value={episode.publishStatus??'scheduled'} onChange={e=>updateEpisode(episode.id,{publishStatus:e.target.value as Episode['publishStatus'],releaseDate:e.target.value==='live'?new Date().toISOString():episode.releaseDate})}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></div>
                <div className="studio3-row-actions">
                  {episode.videoUrl&&<a href={episode.videoUrl} target="_blank" rel="noreferrer">Preview</a>}
                  <button type="button" onClick={()=>{const live=episode.publishStatus==='live';updateEpisode(episode.id,{publishStatus:live?'draft':'live',releaseDate:live?episode.releaseDate:new Date().toISOString()});setMessage(live?`${episode.title} moved to Draft.`:`${episode.title} published.`)}}>{episode.publishStatus==='live'?'Unpublish':'Publish'}</button>
                  <button type="button" onClick={()=>rescheduleEpisode(episode)}>Schedule</button>
                  <button type="button" onClick={()=>duplicateEpisode(episode)}>Duplicate</button>
                  <label>Thumbnail<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void replaceEpisodeMedia(episode.id,'thumbnail',file);e.currentTarget.value=''}}/></label>
                  <label>Video<input type="file" accept="video/*" onChange={e=>{const file=e.target.files?.[0];if(file)void replaceEpisodeMedia(episode.id,'videoUrl',file);e.currentTarget.value=''}}/></label>
                  <button className="danger" type="button" onClick={()=>{if(window.confirm(`Delete "${episode.title}"? This cannot be undone.`)){onUpdateCms({...cms,episodes:cms.episodes.filter(item=>item.id!==episode.id)});setMessage('Episode deleted.')}}}>Delete</button>
                </div>
              </article>)}
              {!selectedEpisodes.length&&<p className="studio3-empty">No episodes in this production yet.</p>}
            </div>
          </section>

          <details className="studio3-composer" id="upload-episode">
            <summary><span>▶</span><div><strong>Upload an episode</strong><small>Draft it, schedule it, or publish immediately.</small></div><b>Open</b></summary>
            <form className="studio3-form-grid studio3-composer-body" onSubmit={addEpisode}>
              <label>Season<input name="season" type="number" min="1" defaultValue="1" required/></label><label>Episode<input name="number" type="number" min="1" defaultValue={selectedEpisodes.length+1} required/></label>
              <label className="full">Title<input name="title" required/></label><label>Runtime<input name="runtime" placeholder="42 min" required/></label>
              <label>Release date & time<input name="releaseAt" type="datetime-local"/></label><label>Thumbnail<input name="thumbnailFile" type="file" accept="image/*"/></label>
              <label>Video<input name="videoFile" type="file" accept="video/*" required/></label><label className="full">Synopsis<textarea name="synopsis" required/></label>
              <div className="full studio3-publish-actions"><button className="btn muted" type="submit" value="draft" disabled={busy}>Save Draft</button><button className="btn muted" type="submit" value="scheduled" disabled={busy}>Schedule</button><button className="btn" type="submit" value="live" disabled={busy}>{busy?'Uploading…':'Publish Now'}</button></div>
            </form>
          </details>

          <section className="studio3-panel">
            <div className="studio3-panel-head"><div><span>MEDIA</span><h2>Brand assets</h2></div></div>
            <div className="studio3-assets">
              <article><span>Poster</span><img src={show.artwork} alt=""/><label>Replace poster<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void replaceShowMedia('artwork',file);e.currentTarget.value=''}}/></label></article>
              <article className="wide"><span>Banner</span><img src={show.banner||show.artwork} alt=""/><label>{show.banner?'Replace banner':'Upload banner'}<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)void replaceShowMedia('banner',file);e.currentTarget.value=''}}/></label></article>
              <article><span>Logo</span>{show.logoImage?<img src={show.logoImage} alt=""/>:<div className="studio3-logo-placeholder">{show.logo}</div>}<label>{show.logoImage?'Replace logo':'Upload logo'}<input type="file" accept="image/png,image/webp,image/svg+xml" onChange={e=>{const file=e.target.files?.[0];if(file)void replaceShowMedia('logoImage',file);e.currentTarget.value=''}}/></label></article>
            </div>
          </section>
        </div>}

        {tab==='audience' && <div className="studio3-stack">
          <section className="studio3-audience-links">
            <a href="https://forms.ebgplus.app" target="_blank" rel="noreferrer"><span>✦</span><div><strong>EBG Forms</strong><small>Open casting and submissions.</small></div><b>↗</b></a>
            <Link to="/app/applications"><span>▣</span><div><strong>Applications</strong><small>Review your connected application center.</small></div><b>→</b></Link>
            <Link to="/app/inbox"><span>✉</span><div><strong>Inbox</strong><small>Messages and applicant conversations.</small></div><b>→</b></Link>
          </section>

          <section className="studio3-panel">
            <div className="studio3-panel-head"><div><span>PEOPLE</span><h2>Cast & talent</h2></div><strong>{show.cast.length}</strong></div>
            <div className="studio3-cast-grid">{show.cast.map((person,index)=><article key={person.name+index}>{person.image?<img src={person.image} alt=""/>:<div className="studio3-avatar">{person.name.slice(0,1)}</div>}<div><h3>{person.name}</h3><p>{person.role} · {person.city}</p><small>{person.bio}</small><button className="studio3-danger-link" type="button" onClick={()=>updateShow(show.id,{cast:show.cast.filter((_,i)=>i!==index)})}>Remove</button></div></article>)}</div>
            {!show.cast.length&&<p className="studio3-empty">No talent profiles attached yet.</p>}
          </section>

          <details className="studio3-composer">
            <summary><span>＋</span><div><strong>Add talent</strong><small>Create a cast or contributor profile.</small></div><b>Open</b></summary>
            <form className="studio3-form-grid studio3-composer-body" onSubmit={addCast}><label>Name<input name="name" required/></label><label>Role<input name="role" defaultValue="Cast"/></label><label>City / State<input name="city" required/></label><label>Status<input name="status" placeholder="Active"/></label><label>Social<input name="social" placeholder="@handle"/></label><label>Photo<input name="imageFile" type="file" accept="image/*"/></label><label className="full">Bio<textarea name="bio" required/></label><div className="full studio3-actions"><button className="btn" disabled={busy}>Add Talent</button></div></form>
          </details>

          <section className="studio3-dual">
            <article className="studio3-panel">
              <div className="studio3-panel-head"><div><span>POLLS</span><h2>Audience voting</h2></div><strong>{showPolls.length}</strong></div>
              <div className="studio3-poll-list">{showPolls.map(poll=><div key={poll.id}><div><span className={`studio3-status ${poll.status}`}>{poll.status}</span><h3>{poll.question}</h3>{(pollResults[poll.id]??[]).slice(0,4).map(r=><p key={r.option_id}>{r.label}<strong>{r.percentage}%</strong></p>)}</div><div className="studio3-mini-actions"><button type="button" onClick={()=>void updatePoll(poll.id,{status:poll.status==='open'?'closed':'open'}).then(refreshPolls)}>{poll.status==='open'?'Close':'Open'}</button><button className="danger" type="button" onClick={()=>{if(window.confirm('Delete this poll?'))void deletePoll(poll.id).then(refreshPolls)}}>Delete</button></div></div>)}</div>
              {!showPolls.length&&<p className="studio3-empty">No polls for this show.</p>}
            </article>

            <article className="studio3-panel">
              <div className="studio3-panel-head"><div><span>UPDATES</span><h2>Notification history</h2></div><strong>{(cms.notifications??[]).length}</strong></div>
              <div className="studio3-notice-list">{(cms.notifications??[]).slice(0,8).map(notice=><div key={notice.id}><div><span className={`studio3-status ${notice.status??'sent'}`}>{notice.status??'sent'}</span><h3>{notice.title||'EBG+ Update'}</h3><p>{notice.text}</p><small>{new Date(notice.date).toLocaleString()}</small></div><button className="studio3-danger-link" type="button" onClick={()=>onUpdateCms({...cms,notifications:(cms.notifications??[]).filter(item=>item.id!==notice.id)})}>Delete</button></div>)}</div>
              {!(cms.notifications??[]).length&&<p className="studio3-empty">No notifications yet.</p>}
            </article>
          </section>

          <details className="studio3-composer" id="create-poll">
            <summary><span>◉</span><div><strong>Create a poll</strong><small>Build an audience vote for {show.title}.</small></div><b>Open</b></summary>
            <form className="studio3-form-grid studio3-composer-body" onSubmit={createNewPoll}><label className="full">Question<input name="question" required/></label><label className="full">Description<textarea name="description"/></label><label className="full">Options — one per line<textarea name="options" required placeholder={'Option A\nOption B'}/></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="open">Open now</option><option value="closed">Closed</option></select></label><label>Results<select name="resultsVisibility" defaultValue="live"><option value="live">Live</option><option value="after_close">After close</option><option value="hidden">Staff only</option></select></label><label>Opens<input name="opensAt" type="datetime-local"/></label><label>Closes<input name="closesAt" type="datetime-local"/></label><div className="full studio3-actions"><button className="btn">Create Poll</button></div></form>
          </details>

          <details className="studio3-composer" id="send-update">
            <summary><span>✦</span><div><strong>Send an update</strong><small>Draft, schedule, or publish a notification.</small></div><b>Open</b></summary>
            <form className="studio3-form-grid studio3-composer-body" onSubmit={publishNotification}><label>Title<input name="title" required/></label><label>Audience<select name="audience" defaultValue="all"><option value="all">Everyone</option><option value="members">Members</option><option value="casting">Casting applicants</option></select></label><label className="full">Message<textarea name="text" required/></label><label>Schedule<input name="publishAt" type="datetime-local"/></label><label>Optional link<input name="link" placeholder="/app/shows/..."/></label><div className="full studio3-publish-actions"><button className="btn muted" type="submit" value="draft">Save Draft</button><button className="btn muted" type="submit" value="scheduled">Schedule</button><button className="btn" type="submit" value="sent">Send Now</button></div></form>
          </details>
        </div>}

        {tab==='settings' && <div className="studio3-stack">
          <section className="studio3-settings-grid">
            <article className="studio3-panel studio3-home-preview">
              <div className="studio3-panel-head"><div><span>HOMEPAGE</span><h2>Viewer placement</h2></div><span className={`studio3-status ${show.homeVisible===false?'draft':'live'}`}>{show.homeVisible===false?'Hidden':'Visible'}</span></div>
              <div className="studio3-home-card" style={{backgroundImage:`linear-gradient(180deg,rgba(27,31,60,.05),rgba(27,31,60,.86)),url(${show.banner||show.artwork})`}}><span>{cms.heroShowId===show.id?'Featured hero':'Standard placement'}</span><strong>{show.title}</strong></div>
              <div className="studio3-settings-actions">
                <button className="btn" type="button" onClick={()=>{onUpdateCms({...cms,heroShowId:show.id,shows:cms.shows.map(item=>item.id===show.id?{...item,homeVisible:true}:item)});setMessage(`${show.title} is now featured on Home.`)}}>Set as featured hero</button>
                <button className="btn muted" type="button" onClick={()=>{const next=show.homeVisible===false;updateShow(show.id,{homeVisible:next});setMessage(next?`${show.title} is visible on Home.`:`${show.title} is hidden from Home.`)}}>{show.homeVisible===false?'Show on Home':'Hide from Home'}</button>
              </div>
            </article>

            <article className="studio3-panel">
              <div className="studio3-panel-head"><div><span>PRODUCTION</span><h2>Current setup</h2></div></div>
              <dl className="studio3-definition-list"><div><dt>Series status</dt><dd>{show.status}</dd></div><div><dt>Featured</dt><dd>{cms.heroShowId===show.id?'Yes':'No'}</dd></div><div><dt>Episodes</dt><dd>{selectedEpisodes.length}</dd></div><div><dt>Cast profiles</dt><dd>{show.cast.length}</dd></div><div><dt>Open polls</dt><dd>{showPolls.filter(p=>p.status==='open').length}</dd></div><div><dt>Home visibility</dt><dd>{show.homeVisible===false?'Hidden':'Visible'}</dd></div></dl>
            </article>
          </section>

          <section className="studio3-panel">
            <div className="studio3-panel-head"><div><span>SHORTCUTS</span><h2>Platform controls</h2></div></div>
            <div className="studio3-settings-links"><Link to={`/app/shows/${show.id}`}>Preview show page <b>→</b></Link><Link to="/app/home">Preview EBG+ Home <b>→</b></Link><a href="https://forms.ebgplus.app" target="_blank" rel="noreferrer">Open EBG Forms <b>↗</b></a><Link to="/app/applications">Application center <b>→</b></Link></div>
          </section>

          <section className="studio3-panel studio3-danger-zone">
            <div><span>DANGER ZONE</span><h2>Production actions</h2><p>Duplicate this series for a new version, or permanently remove it and its episodes from the CMS.</p></div>
            <div className="studio3-actions"><button className="btn muted" type="button" onClick={()=>duplicateShow(show)}>Duplicate series</button><button className="studio3-danger-button" type="button" onClick={()=>deleteShow(show.id)}>Delete series</button></div>
          </section>
        </div>}
      </main>
    </section>
  )
}


function ManagementPage() {
  return <Navigate to="/app/studio/overview" replace />
}

function StudioPage({
  account,
  cms,
  castingApps,
  onUpdateCms,
  onUpdateCastingStatus,
}: {
  account: Account
  cms: CmsData
  castingApps: CastingApplication[]
  onUpdateCms: (cms: CmsData) => void
  onUpdateCastingStatus: (applicationId: string, status: CastingApplication['status']) => Promise<void>
}) {
  const { studioSection } = useParams()

  if (!['founder', 'administrator', 'producer', 'editor'].includes(account.role)) {
    return (
      <main className="page">
        <h1>Authentication Error</h1>
        <p>You are not authorized to access EBG Studio.</p>
      </main>
    )
  }

  if (!studioSection) return <Navigate to="/app/studio/overview" replace />

  return (
    <main className={`page studio-route studio-route-${studioSection}`}>
      <EbgStudioHub
        cms={cms}
        castingApps={castingApps}
        onUpdateCms={onUpdateCms}
        onUpdateCastingStatus={onUpdateCastingStatus}
      />
    </main>
  )
}

function CastingPage({ onSubmitApplication }: { onSubmitApplication: (app: CastingApplication) => Promise<void> }) {
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
}

// EBG_PHASE152_MUSIC_DETAIL_PAGES
function MusicPage({ cms }: { cms: CmsData }) {
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const now = Date.now()
  const isPublished = (status?: string, releaseDate?: string) => status === 'live' || (status === 'scheduled' && !!releaseDate && new Date(releaseDate).getTime() <= now)
  const releases = (music.releases ?? []).filter((release: any) => isPublished(release.publishStatus, release.releaseDate))
  const videos = (music.videos ?? []).filter((video: any) => isPublished(video.publishStatus, video.releaseDate))
  const publishedReleaseIds = new Set(releases.map((release: any) => release.id))
  const tracks = (music.tracks ?? []).filter((track: any) => !track.releaseId || publishedReleaseIds.has(track.releaseId))
  const artists = music.artists ?? []
  const artistName = (artistId: string) => artists.find((artist: any) => artist.id === artistId)?.name ?? 'EBG Artist'
  const featured = releases.find((release: any) => release.id === music.featuredReleaseId) ?? releases[0]
  const featuredTracks = featured ? tracks.filter((track: any) => track.releaseId === featured.id).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)) : []

  return (
    <main className="page music-v2-page">
      {featured && (
        <section className="music-v2-hero">
          <Link className="music-v2-cover music-v2-cover-link" to={'/app/music/release/' + featured.id}>{featured.cover ? <img src={featured.cover} alt={featured.title + ' cover'} /> : <span>♫</span>}</Link>
          <div className="music-v2-hero-copy">
            <p className="eyebrow">FEATURED {String(featured.type || 'release').toUpperCase()}</p>
            <h1><Link to={'/app/music/release/' + featured.id}>{featured.title}</Link></h1>
            <p className="music-v2-artist"><Link to={'/app/music/artist/' + featured.artistId}>{artistName(featured.artistId)}</Link></p>
            <p>{featured.genre || 'Music'}{featured.releaseDate ? ' · ' + new Date(featured.releaseDate).getFullYear() : ''}{featured.explicit ? ' · Explicit' : ''}</p>
            {featuredTracks[0]?.audioUrl && <EbgAudioPlayer src={featuredTracks[0].audioUrl} title={featuredTracks[0].title || featured.title} artist={artistName(featured.artistId)} artwork={featured.cover || undefined} lyrics={featuredTracks[0].lyrics || ''} timedLyrics={featuredTracks[0].timedLyrics || []} />}
          </div>
        </section>
      )}

      <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">MUSIC ON EBG+</p><h2>New Releases</h2></div><span>{releases.length} live</span></div>
        {releases.length ? <div className="music-v2-release-grid">{releases.map((release: any) => (
          <Link className="music-v2-release-card" key={release.id} to={'/app/music/release/' + release.id}>
            <div>{release.cover ? <img src={release.cover} alt="" /> : <span>♫</span>}</div>
            <h3>{release.title}</h3>
            <p>{artistName(release.artistId)}</p>
            <small>{String(release.type || 'release').toUpperCase()} · {release.genre || 'Music'}{release.explicit ? ' · E' : ''}</small>
          </Link>
        ))}</div> : <div className="music-v2-empty"><h3>No live releases yet.</h3><p>Music marked Live in EBG Studio will appear here.</p></div>}
      </section>

      {tracks.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">LISTEN NOW</p><h2>Songs</h2></div></div>
        <div className="music-v2-track-list">{tracks.map((track: any) => (
          <article key={track.id}>
            <div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small><Link to={'/app/music/artist/' + track.artistId}>{artistName(track.artistId)}</Link></small></div></div>
            {track.audioUrl && <EbgAudioPlayer src={track.audioUrl} title={track.title} artist={artistName(track.artistId)} artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || undefined} lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />}
          </article>
        ))}</div>
      </section>}

      {videos.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div>
        <div className="music-v2-video-grid">{videos.map((video: any) => (
          <article key={video.id}>
            <EbgVideoPlayer poster={video.thumbnail || undefined} src={video.videoUrl} />
            <h3>{video.title}</h3><p><Link to={'/app/music/artist/' + video.artistId}>{artistName(video.artistId)}</Link></p>
          </article>
        ))}</div>
      </section>}

      {artists.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">EBG ARTISTS</p><h2>Artists</h2></div></div>
        <div className="music-v2-artist-grid">{artists.map((artist: any) => (
          <Link key={artist.id} to={'/app/music/artist/' + artist.id}><article><div>{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name?.slice(0,1) || '♫'}</span>}</div><h3>{artist.name}</h3>{artist.bio && <p>{artist.bio}</p>}</article></Link>
        ))}</div>
      </section>}
    </main>
  )
}

function MusicArtistPage({ cms }: { cms: CmsData }) {
  const { artistId } = useParams()
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const artist = (music.artists ?? []).find((item: any) => item.id === artistId)
  if (!artist) return <NotFoundPage />
  const now = Date.now()
  const isPublished = (status?: string, releaseDate?: string) => status === 'live' || (status === 'scheduled' && !!releaseDate && new Date(releaseDate).getTime() <= now)
  const releases = (music.releases ?? []).filter((release: any) => release.artistId === artist.id && isPublished(release.publishStatus, release.releaseDate))
  const releaseIds = new Set(releases.map((release: any) => release.id))
  const tracks = (music.tracks ?? []).filter((track: any) => track.artistId === artist.id && (!track.releaseId || releaseIds.has(track.releaseId))).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
  const videos = (music.videos ?? []).filter((video: any) => video.artistId === artist.id && isPublished(video.publishStatus, video.releaseDate))

  return (
    <main className="page music-detail-page">
      <Link className="music-detail-back" to="/app/music">← Music</Link>
      <section className="music-artist-hero">
        <div className="music-artist-avatar">{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name?.slice(0,1) || '♫'}</span>}</div>
        <div><p className="eyebrow">ARTIST</p><h1>{artist.name}</h1>{artist.label && <p className="music-detail-muted">{artist.label}</p>}{artist.bio && <p className="music-artist-bio">{artist.bio}</p>}</div>
      </section>

      <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">DISCOGRAPHY</p><h2>Albums & Singles</h2></div><span>{releases.length}</span></div>
        {releases.length ? <div className="music-v2-release-grid">{releases.map((release: any) => (
          <Link className="music-v2-release-card" key={release.id} to={'/app/music/release/' + release.id}><div>{release.cover ? <img src={release.cover} alt="" /> : <span>♫</span>}</div><h3>{release.title}</h3><p>{String(release.type || 'release').toUpperCase()}</p><small>{release.genre || 'Music'}{release.releaseDate ? ' · ' + new Date(release.releaseDate).getFullYear() : ''}</small></Link>
        ))}</div> : <div className="music-v2-empty"><h3>No live releases yet.</h3></div>}
      </section>

      {tracks.length > 0 && <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">CATALOG</p><h2>Songs</h2></div></div><div className="music-v2-track-list">{tracks.map((track: any) => <article key={track.id}><div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{track.duration || 'EBG+'}</small></div></div>{track.audioUrl && <EbgAudioPlayer src={track.audioUrl} title={track.title} artist={artist.name} artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || artist.image || undefined} lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />}</article>)}</div></section>}

      {videos.length > 0 && <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div><div className="music-v2-video-grid">{videos.map((video: any) => <article key={video.id}><EbgVideoPlayer poster={video.thumbnail || undefined} src={video.videoUrl} /><h3>{video.title}</h3></article>)}</div></section>}
    </main>
  )
}

function MusicReleasePage({ cms }: { cms: CmsData }) {
  const { releaseId } = useParams()
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const release = (music.releases ?? []).find((item: any) => item.id === releaseId)
  if (!release) return <NotFoundPage />
  const now = Date.now()
  const published = release.publishStatus === 'live' || (release.publishStatus === 'scheduled' && !!release.releaseDate && new Date(release.releaseDate).getTime() <= now)
  if (!published) return <NotFoundPage />
  const artist = (music.artists ?? []).find((item: any) => item.id === release.artistId)
  const tracks = (music.tracks ?? []).filter((track: any) => track.releaseId === release.id).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))

  return (
    <main className="page music-detail-page">
      <Link className="music-detail-back" to="/app/music">← Music</Link>
      <section className="music-release-hero">
        <div className="music-release-art">{release.cover ? <img src={release.cover} alt={release.title + ' cover'} /> : <span>♫</span>}</div>
        <div className="music-release-info"><p className="eyebrow">{String(release.type || 'release').toUpperCase()}</p><h1>{release.title}</h1>{artist && <h2><Link to={'/app/music/artist/' + artist.id}>{artist.name}</Link></h2>}<p className="music-detail-muted">{release.genre || 'Music'}{release.releaseDate ? ' · ' + new Date(release.releaseDate).getFullYear() : ''}{release.explicit ? ' · Explicit' : ''}</p><p>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</p></div>
      </section>

      <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">TRACKLIST</p><h2>{release.title}</h2></div></div>{tracks.length ? <div className="music-v2-track-list">{tracks.map((track: any) => <article key={track.id}><div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{track.duration || (artist?.name ?? 'EBG+')}</small></div></div>{track.audioUrl && <EbgAudioPlayer src={track.audioUrl} title={track.title} artist={artist?.name || 'EBG+'} artwork={release.cover || undefined} lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />}</article>)}</div> : <div className="music-v2-empty"><h3>No tracks attached to this release yet.</h3></div>}</section>
    </main>
  )
}

function OriginalsPage({ cms }: { cms: CmsData }) {
  const originals = cms.shows.filter((show) => show.category.toLowerCase().includes('original'))
  return (
    <main className="page originals-page-v2">
      <section className="universe-hero"><p className="eyebrow">EBG+ ORIGINALS</p><h1>Stories made inside the EBG universe.</h1><p>Reality, scripted concepts, music films, specials, experiments, and creator-led projects made for EBG+.</p></section>
      {originals.length ? <div className="originals-grid-v2">{originals.map((show) => <Link key={show.id} to={'/app/shows/' + show.id} className="original-card-v2"><div className="original-art" style={{ backgroundImage: 'url(' + show.artwork + ')' }}><span>{show.status}</span></div><div><p className="eyebrow">{show.category}</p><h2>{show.title}</h2><p>{show.description}</p><small>{show.genre} · {show.year} · {show.maturity}</small></div></Link>)}</div> : <section className="panel"><h2>More originals are being prepared.</h2><p>Projects marked as EBG+ Originals in Studio will appear here automatically.</p></section>}
    </main>
  )
}

function UniversePage({ cms }: { cms: CmsData }) {
  const universeShows = cms.shows.filter((show) => ['bijou', 'empress', 'goldie'].some((name) => (show.title + ' ' + show.category + ' ' + show.description).toLowerCase().includes(name)))
  return (
    <main className="page universe-page-v3">
      <section className="universe-hero"><p className="eyebrow">EBG UNIVERSE</p><h1>Music, people, shows, eras, and stories all connected.</h1><p>The EBG Universe is the living world around EBG+ — where artists, originals, relationships, collaborations, performances, releases, behind-the-scenes moments, and major creative eras connect.</p></section>
      <section className="universe-founders-panel"><div><p className="eyebrow">THE FOUNDERS' WORLDS</p><h2>Start with the people shaping the universe.</h2></div><div className="universe-founder-list"><article><strong>Bijou Nicole</strong><p>Pop and R&B storytelling, cinematic visual eras, performance, fashion, original programming, and a creative universe built around transformation and imagination.</p></article><article><strong>Empress V</strong><p>Dramatic live energy, theatrical visual storytelling, emotionally bold music, collaborations, and performance-led projects designed to feel larger than the screen.</p></article><article><strong>Goldie Songs</strong><p>Soulful music, reflection, conversations, documentary-minded storytelling, and artist stories centered on growth, honesty, and connection.</p></article></div></section>
      <section className="universe-map-grid"><article><span>01</span><h3>People</h3><p>Artists, cast, collaborators, creative partners, and personalities who move through EBG projects.</p></article><article><span>02</span><h3>Music & Eras</h3><p>Albums, singles, performances, visual eras, tours, and the stories surrounding each release.</p></article><article><span>03</span><h3>Originals</h3><p>Series, reality concepts, specials, films, and experiments created inside EBG.</p></article><article><span>04</span><h3>Relationships</h3><p>Creative partnerships, friendships, casts, collaborations, and recurring connections across projects.</p></article><article><span>05</span><h3>Timeline</h3><p>Major releases, premieres, announcements, tours, casting moments, and milestones as the universe grows.</p></article><article><span>06</span><h3>Places & Events</h3><p>Venues, cities, sets, travel, premieres, performances, and moments that become part of EBG history.</p></article></section>
      {universeShows.length > 0 && <section className="universe-projects"><div className="section-title"><p className="eyebrow">CONNECTED PROJECTS</p><h2>Explore the universe on EBG+</h2></div><div className="originals-grid-v2">{universeShows.slice(0, 8).map((show) => <Link key={show.id} to={'/app/shows/' + show.id} className="original-card-v2"><div className="original-art" style={{ backgroundImage: 'url(' + show.artwork + ')' }} /><div><h3>{show.title}</h3><p>{show.description}</p></div></Link>)}</div></section>}
    </main>
  )
}

function NewsPage({ cms }: { cms: CmsData }) {
  const published = (cms.news ?? []).filter((item) => item.status === 'published' && Date.parse(item.publishedAt) <= Date.now()).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const featured = published.find((item) => item.featured) ?? published[0]
  const rest = featured ? published.filter((item) => item.id !== featured.id) : published
  return (
    <main className="page news-page-v2">
      <section className="universe-hero"><p className="eyebrow">EBG NEWS</p><h1>What's happening across EBG.</h1><p>Official announcements, releases, casting updates, premieres, artist news, platform updates, and stories from across the EBG universe.</p></section>
      {featured ? <><article className="news-lead">{featured.image && <img src={featured.image} alt="" />}<div><span>{featured.category}</span><h2>{featured.headline}</h2><p>{featured.summary}</p><small>By {featured.author} · {new Date(featured.publishedAt).toLocaleDateString()}</small><div className="news-body">{featured.body}</div></div></article><div className="news-grid-v2">{rest.map((item) => <article key={item.id}>{item.image && <img src={item.image} alt="" />}<span>{item.category}</span><h3>{item.headline}</h3><p>{item.summary}</p><small>By {item.author} · {new Date(item.publishedAt).toLocaleDateString()}</small></article>)}</div></> : <section className="panel"><p className="eyebrow">NEWSROOM</p><h2>No stories published yet.</h2><p>Founder-published stories from EBG Studio will appear here.</p></section>}
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

function PublicInfoShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
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
  const location = useLocation()
  const [waffleOpen, setWaffleOpen] = useState(false)
  const closeWaffle = () => setWaffleOpen(false)

  return (
    <>
      <div className="mobile-waffle-nav">
        <button className={'mobile-waffle-button ' + (waffleOpen ? 'active' : '')} type="button" aria-label={waffleOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={waffleOpen} onClick={() => setWaffleOpen((open) => !open)}>
          <span className="waffle-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
        </button>
        {waffleOpen && <><button className="mobile-waffle-backdrop" type="button" aria-label="Close navigation" onClick={closeWaffle} /><nav className="mobile-waffle-drawer" aria-label="Mobile menu">
          <div className="mobile-waffle-head"><span>Explore EBG+</span><button type="button" onClick={closeWaffle} aria-label="Close menu">×</button></div>
          <div className="mobile-waffle-section"><span className="mobile-waffle-label">Watch</span><Link to="/app/home" onClick={closeWaffle}>Home</Link><Link to="/app/shows" onClick={closeWaffle}>Shows</Link><Link to="/app/originals" onClick={closeWaffle}>EBG Originals</Link><Link to="/app/movies" onClick={closeWaffle}>Movies & Specials</Link><Link to="/app/music" onClick={closeWaffle}>Music</Link><Link to="/app/universe" onClick={closeWaffle}>EBG Universe</Link><Link to="/app/news" onClick={closeWaffle}>News</Link><Link to="/app/search" onClick={closeWaffle}>Search</Link></div>
          <div className="mobile-waffle-section"><span className="mobile-waffle-label">Library</span><Link to="/app/my-list" onClick={closeWaffle}>My List</Link><Link to="/app/applications" onClick={closeWaffle}>My Applications</Link><Link to="/app/inbox" onClick={closeWaffle}>Messages</Link><Link to="/app/notifications" onClick={closeWaffle}>Notifications</Link><a href="https://forms.ebgplus.app" onClick={closeWaffle}>Casting</a></div>
          <div className="mobile-waffle-section mobile-waffle-section-last"><span className="mobile-waffle-label">Account</span><Link to="/app/settings" onClick={closeWaffle}>Profile & Settings</Link></div>
        </nav></>}
      </div>
      <nav className="mobile-nav mobile-nav-v2" aria-label="Mobile quick navigation">{[["Home", "/app/home", "⌂"], ["Originals", "/app/originals", "✦"], ["Music", "/app/music", "♫"], ["Search", "/app/search", "⌕"], ["Profile", "/app/settings", "◎"]].map(([label, to, icon]) => <Link key={to} to={to} aria-current={location.pathname.startsWith(to) ? 'page' : undefined} onClick={closeWaffle}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
    </>
  )
}

function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`footer ${compact ? 'compact' : ''}`}>
      <div>
        <Link to="/about">About EBG</Link>
        <Link to="/help">Help Center</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/partnerships">Partnerships</Link>
      </div>
      <p>© EBG / EBG+. All rights reserved.</p>
    </footer>
  )
}

export default App
