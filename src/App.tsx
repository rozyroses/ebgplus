import { defaultViewerPreferences, saveViewerPreferences, useViewerPreferences } from './lib/viewerPreferences'
import EbgVideoPlayer from './components/VideoPlayer'
import { useEffect, useMemo, useState } from 'react'
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
  useSearchParams,
} from 'react-router-dom'
import './App.css'
import { EbgAudioPlayer, EbgMusicDock, MusicCollectionActions, MusicQualityEditor, useMusicFavorites } from './components/MusicPlayer'
import { catalogTrack, hasPlayableAudio } from './lib/musicPlayback'
import './styles/public-home.css'
import './phase157-platform-refresh.css'
import './phase158-mobile-polish.css'
import { loadPublicForm, loadPublicForms, loadStaffForms, loadStaffSubmissions, submitEbgForm, updateFormStatus, updateSubmission, type EbgForm, type EbgFormSubmission } from './lib/formsV2Data'
import './phase159-forms-v2.css'
import { loadApplicantNetwork, loadApplicantMessages, sendApplicantMessage, markNotificationRead, deleteApplicantSubmission, type ApplicantSubmission, type ApplicantMessage, type AccountNotification } from './lib/applicationNetworkData'
import './phase160-application-network.css'
import { loadInboxNetwork, loadInboxThread, sendInboxMessage, markInboxThreadRead, markOneNetworkNotificationRead, markAllNetworkNotificationsRead, type InboxSubmission, type InboxMessage, type InboxNotification } from './lib/inboxData'
import './phase161-inbox-notifications.css'
import './phase162-lumi-studio-handoff.css'

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
import './mobile-v4.css'

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
  type PublicSignupAccountType,
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
  accountType: 'viewer' | 'creator' | 'producer' | 'founder'
  profiles: Profile[]
  notifications: NotificationItem[]
  verifiedBadge?: 'artist' | 'founder' | null
  studioVerified?: boolean
  studioBadgeTone?: 'blue' | 'violet' | 'gold' | 'green'
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
      category: 'Music on EBG+',
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

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const getTheme = () => {
    const saved = localStorage.getItem('ebg.theme.v1')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  const [theme,setTheme]=useState<'light'|'dark'>(()=>getTheme())

  useEffect(()=>{
    document.documentElement.dataset.theme=theme
    document.documentElement.style.colorScheme=theme
    localStorage.setItem('ebg.theme.v1',theme)
    window.dispatchEvent(new CustomEvent('ebg-theme-change',{detail:theme}))
  },[theme])

  useEffect(()=>{
    const sync=(event:Event)=>{
      const next=(event as CustomEvent<'light'|'dark'>).detail
      if(next==='light'||next==='dark') setTheme(next)
    }
    window.addEventListener('ebg-theme-change',sync)
    return()=>window.removeEventListener('ebg-theme-change',sync)
  },[])

  const next=theme==='light'?'dark':'light'
  return <button className={`theme-toggle ${compact?'compact':''}`} type="button" onClick={()=>setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
    <span aria-hidden="true">{theme==='light'?'☾':'☀'}</span><strong>{compact?'':theme==='light'?'Dark':'Light'}</strong>
  </button>
}

function App() {
  useEffect(()=>{
    const saved=localStorage.getItem('ebg.theme.v1')
    const theme=saved==='light'||saved==='dark' ? saved : (window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light')
    document.documentElement.dataset.theme=theme
    document.documentElement.style.colorScheme=theme
  },[])

  useEffect(() => {
    if (window.location.hostname === 'studio.ebgplus.app') {
      const suffix = window.location.pathname.startsWith('/app/studio') ? window.location.pathname : '/app/studio/overview'
      window.location.replace('https://ebgplus.app' + suffix + window.location.search + window.location.hash)
    }
  }, [])

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
    accountType: state.account.account_type ?? (state.account.role === 'founder' ? 'founder' : state.account.role === 'producer' ? 'producer' : 'viewer'),
    verifiedBadge: state.account.verified_badge ?? (state.account.role === 'founder' ? 'founder' : null),
    studioVerified: state.studioIdentity?.verified ?? false,
    studioBadgeTone: state.studioIdentity?.badge_tone,
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
            onCreate={async (email, password, options) => {
              const state = await supabaseSignUp(email, password, options)
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
                setProfileId(nextProfileId)
                Promise.all([loadWatchlist(nextProfileId), loadPlaybackProgress(nextProfileId)])
                  .then(([watchlist, playback]) => {
                    setAccount((previous) => previous ? {
                      ...previous,
                      profiles: previous.profiles.map((item) => item.id === nextProfileId ? { ...item, watchlist, playback } : item),
                    } : previous)
                  })
                  .catch((error) => {
                    console.error('Could not load profile data.', error)
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
        <h1>Find your next opportunity.</h1>
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
          <p className="coming-soon-copy">Original shows, music, stories, and the artists creating it. Join early and be first inside when EBG+ opens its doors.</p>
          <div className="ebg-launch-pillars" aria-label="What is coming to EBG+">
            <div className="ebg-launch-pillar"><strong>Original Shows</strong>Series, reality, and new EBG+ originals.</div>
            <div className="ebg-launch-pillar"><strong>Music</strong>Artist hubs, releases, performances, and more.</div>
            <div className="ebg-launch-pillar"><strong>Creators</strong>Original ideas and the people bringing them to life.</div>
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
  const shows = cms.shows.filter((show) => show.homeVisible !== false)
  const [selectedId, setSelectedId] = useState('')
  const featured = shows.find((show) => show.id === selectedId) || shows[0]
  const news = (cms.news ?? []).filter((item) => item.status === 'published' && Date.parse(item.publishedAt) <= Date.now()).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 3)
  return (
    <main className="ebg-home">
      <a className="eh-skip" href="#discover">Skip to content</a>
      <header className="eh-header">
        <Link className="eh-logo" to="/" aria-label="EBG Plus home">EBG<span>+</span></Link>
        <nav aria-label="Main navigation"><a href="#discover">Discover</a><Link to="/app/music">Music</Link><a href="#creators">For creators</a></nav>
        <div className="eh-account"><ThemeToggle compact /><Link to="/auth/sign-in">Sign in</Link><Link className="eh-button" to="/auth/create-account">Join EBG+</Link></div>
      </header>
      <section className="eh-intro" aria-labelledby="eh-title">
        <div><p className="eh-eyebrow"><span /> ORIGINALS. MUSIC. CULTURE.</p><h1 id="eh-title">Find your people.<br />Feel <em>everything.</em></h1></div>
        <div className="eh-intro-side"><p>The stories you get into.<br />The artists you come back for.<br />All together on EBG+.</p><a href="#discover" className="eh-text-link">Explore the lineup <span aria-hidden="true">↓</span></a></div>
      </section>
      {featured && <section className="eh-feature" aria-label="Featured on EBG+">
        <img className="eh-feature-image" src={featured.banner || featured.artwork} alt="" fetchPriority="high" />
        <div className="eh-feature-shade" />
        <div className="eh-feature-top"><span>IN THE SPOTLIGHT</span><span>{featured.status}</span></div>
        <div className="eh-feature-copy"><p className="eh-eyebrow">{featured.category || 'EBG+ ORIGINAL'}</p><h2>{featured.title}</h2><p>{featured.description}</p><div className="eh-feature-actions"><Link className="eh-button eh-button-white" to={`/app/shows/${featured.id}`}>Explore series <span aria-hidden="true">↗</span></Link><span>{featured.genre} · {featured.year}</span></div></div>
        {shows.length > 1 && <div className="eh-feature-picker" aria-label="Choose featured title">{shows.slice(0, 4).map((show, index) => <button type="button" key={show.id} aria-pressed={featured.id === show.id} onClick={() => setSelectedId(show.id)}><span>{String(index + 1).padStart(2, '0')}</span>{show.title}</button>)}</div>}
      </section>}
      <section id="discover" className="eh-section">
        <div className="eh-section-heading"><div><p className="eh-eyebrow">YOUR NEXT PLAY</p><h2>A little drama. A lot to love.</h2></div><Link className="eh-text-link" to="/app/shows">Explore all shows ↗</Link></div>
        <div className="eh-show-grid">{shows.slice(0, 8).map((show) => <Link className="eh-show" key={show.id} to={`/app/shows/${show.id}`}><div className="eh-show-art"><img src={show.artwork || show.banner} alt="" loading="lazy" /><span>{show.status}</span><b aria-hidden="true">↗</b></div><p>{show.genre}</p><h3>{show.title}</h3></Link>)}</div>
        {!shows.length && <p className="eh-empty">Our next chapter is on its way. Join EBG+ to discover what comes next.</p>}
      </section>
      {news.length > 0 && <section className="eh-section"><div className="eh-section-heading"><div><p className="eh-eyebrow">THE LATEST</p><h2>Stay in the conversation.</h2></div></div><div className="eh-news-grid">{news.map((item) => <article className="eh-news" key={item.id}>{item.image && <img src={item.image} alt="" loading="lazy" />}<p className="eh-eyebrow">{item.category}</p><h3>{item.headline}</h3><p>{item.summary}</p><small>{new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></article>)}</div></section>}
      <section id="creators" className="eh-create"><div><p className="eh-eyebrow">MAKE YOUR NEXT CHAPTER</p><h2>Got a story?<br /><em>Give it a home.</em></h2></div><div><p>A space for creators, producers, and the people who love what they make. Start your EBG+ account and find where you belong.</p><Link className="eh-button" to="/auth/create-account">Create your account ↗</Link></div></section>
      <footer className="eh-footer"><Link className="eh-logo" to="/">EBG<span>+</span></Link><p>Original shows. Independent music.</p><nav aria-label="Footer navigation"><Link to="/about">About EBG</Link><Link to="/auth/sign-in">Sign in</Link><a href="https://studio.ebgplus.app">Creator studio ↗</a></nav><small>© {new Date().getFullYear()} EBG+</small></footer>
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

function SignupBadge({ tone, compact = false }: { tone: 'blue' | 'violet' | 'gold' | 'green'; compact?: boolean }) {
  const fill = tone === 'violet' ? '#8b6cff' : tone === 'gold' ? '#d4aa49' : tone === 'green' ? '#27a86f' : '#2499ea'
  return (
    <svg className={compact ? 'signup-verified-badge compact' : 'signup-verified-badge'} viewBox="0 0 44 44" aria-hidden="true">
      <g fill={fill}>
        <circle cx="22" cy="22" r="14" />
        {Array.from({ length: 12 }).map((_, index) => {
          const angle = (Math.PI * 2 * index) / 12
          return <circle key={index} cx={22 + Math.cos(angle) * 12} cy={22 + Math.sin(angle) * 12} r="7.2" />
        })}
      </g>
      <path d="M14.5 22.5 19.5 27.5 30.5 15.5" fill="none" stroke="white" strokeWidth="4.4" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  )
}

function CreateAccountPage({
  onCreate,
}: {
  onCreate: (email: string, password: string, options: { accountType: PublicSignupAccountType; displayName: string; companyName?: string }) => Promise<AuthState | null>
}) {
  const nav = useNavigate()
  const [accountType, setAccountType] = useState<PublicSignupAccountType>('viewer')
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const options: Array<{ id: PublicSignupAccountType; title: string; copy: string; note: string; badge?: 'blue' | 'violet' }> = [
    { id: 'viewer', title: 'Viewer', copy: 'Watch EBG+, build your list, vote, apply, and follow your favorite productions.', note: 'No Studio access.' },
    { id: 'creator', title: 'Creator', copy: 'Build and publish your own shows, episodes, music, and creative projects.', note: 'Private Creator Studio.', badge: 'blue' },
    { id: 'producer', title: 'Producer', copy: 'Release projects under your producer identity or production company.', note: 'Private Producer Studio.', badge: 'violet' },
  ]

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!displayName.trim()) return setError(accountType === 'viewer' ? 'Choose your profile name.' : 'Choose the name you want shown on your creator profile.')
    if (accountType === 'producer' && !companyName.trim()) return setError('Add your production company or producer name.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const state = await onCreate(email, password, { accountType, displayName, companyName: companyName.trim() || undefined })
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
      <div className="signup-account-types" role="radiogroup" aria-label="Choose account type">
        {options.map((option) => (
          <button
            key={option.id}
            className={`signup-account-type ${accountType === option.id ? 'selected' : ''}`}
            type="button"
            role="radio"
            aria-checked={accountType === option.id}
            onClick={() => setAccountType(option.id)}
          >
            <span className="signup-account-icon">{option.badge ? <SignupBadge tone={option.badge} /> : '▶'}</span>
            <span><strong>{option.title}</strong><small>{option.copy}</small><em>{option.note}</em></span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        <label>
          {accountType === 'viewer' ? 'Profile name' : accountType === 'producer' ? 'Producer name' : 'Creator name'}
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} placeholder={accountType === 'viewer' ? 'What should we call you?' : 'Your public creative name'} />
        </label>
        {accountType !== 'viewer' && (
          <label>
            {accountType === 'producer' ? 'Production company' : 'Studio / brand name (optional)'}
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required={accountType === 'producer'} maxLength={100} placeholder={accountType === 'producer' ? 'e.g. Wolfpark Productions' : 'Optional'} />
          </label>
        )}
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
        {accountType !== 'viewer' && <p className="signup-privacy-note"><strong>Your Studio is private.</strong> Your projects belong to this account. Other creators, producers, and founders do not automatically get access.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p>{message}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating Account…' : accountType === 'viewer' ? 'Create Viewer Account' : `Create ${accountType === 'creator' ? 'Creator' : 'Producer'} Account`}
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
        {state && <p>{s…23414 tokens truncated…rl',file);e.currentTarget.value=''}}/></label>
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
  useEffect(() => {
    const destination = studioSection === 'audience' ? 'casting' : studioSection === 'content' ? 'series' : studioSection || 'overview'
    window.location.replace('https://studio.ebgplus.app/#' + destination)
  }, [studioSection])

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
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sort, setSort] = useState('catalog')
  const favorites = useMusicFavorites()
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const now = Date.now()
  const isPublished = (status?: string, releaseDate?: string) => status === 'live' || (status === 'scheduled' && !!releaseDate && new Date(releaseDate).getTime() <= now)
  const releases = (music.releases ?? []).filter((release: any) => isPublished(release.publishStatus, release.releaseDate))
  const videos = (music.videos ?? []).filter((video: any) => isPublished(video.publishStatus, video.releaseDate))
  const publishedReleaseIds = new Set(releases.map((release: any) => release.id))
  const tracks = (music.tracks ?? []).filter((track: any) => !track.releaseId || publishedReleaseIds.has(track.releaseId))
  const artists = music.artists ?? []
  const artistName = (artistId: string) => artists.find((artist: any) => artist.id === artistId)?.name ?? 'EBG Artist'
  const visibleTracks = tracks.filter((track: any) => {
    const details = catalogTrack(track, artistName(track.artistId))
    return (!favoritesOnly || favorites.includes(details.id)) && `${track.title} ${details.artist}`.toLowerCase().includes(query.trim().toLowerCase())
  }).sort((a: any, b: any) => sort === 'title' ? String(a.title).localeCompare(String(b.title)) : sort === 'artist' ? artistName(a.artistId).localeCompare(artistName(b.artistId)) : 0)
  const featured = releases.find((release: any) => release.id === music.featuredReleaseId) ?? releases[0]
  const featuredTracks = featured ? tracks.filter((track: any) => track.releaseId === featured.id).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)) : []

  return (
    <main className="page music-v2-page">
      <div className="music-catalog-tools"><label>Find a song or artist<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search songs and artists" /></label><label>Sort songs<select value={sort} onChange={event => setSort(event.target.value)}><option value="catalog">Catalog order</option><option value="title">Song title</option><option value="artist">Artist</option></select></label><button className="btn muted" type="button" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(!favoritesOnly)}>{favoritesOnly ? '♥ Favorites' : '♡ Favorites'}</button></div>
      {featured && (
        <section className="music-v2-hero">
          <Link className="music-v2-cover music-v2-cover-link" to={'/app/music/release/' + featured.id}>{featured.cover ? <img src={featured.cover} alt={featured.title + ' cover'} /> : <span>♫</span>}</Link>
          <div className="music-v2-hero-copy">
            <p className="eyebrow">FEATURED {String(featured.type || 'release').toUpperCase()}</p>
            <h1><Link to={'/app/music/release/' + featured.id}>{featured.title}</Link></h1>
            <p className="music-v2-artist"><Link to={'/app/music/artist/' + featured.artistId}>{artistName(featured.artistId)}</Link></p>
            <p>{featured.genre || 'Music'}{featured.releaseDate ? ' · ' + new Date(featured.releaseDate).getFullYear() : ''}{featured.explicit ? ' · Explicit' : ''}</p>
            {featuredTracks[0] && hasPlayableAudio(featuredTracks[0]) && <EbgAudioPlayer track={catalogTrack(featuredTracks[0], artistName(featured.artistId), featured.cover)} queue={featuredTracks.map((item: any) => catalogTrack(item, artistName(featured.artistId), featured.cover))} src={featuredTracks[0].audioUrl || ''} title={featuredTracks[0].title || featured.title} artist={artistName(featured.artistId)} artwork={featured.cover || undefined} lyrics={featuredTracks[0].lyrics || ''} timedLyrics={featuredTracks[0].timedLyrics || []} />}
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
        <div className="music-v2-section-head"><div><p className="eyebrow">LISTEN NOW</p><h2>Songs</h2></div><MusicCollectionActions tracks={visibleTracks.map((item: any) => catalogTrack(item, artistName(item.artistId), releases.find((r: any) => r.id === item.releaseId)?.cover))} /></div>
        <div className="music-v2-track-list">{visibleTracks.map((track: any) => (
          <article key={track.id}>
            <div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small><Link to={'/app/music/artist/' + track.artistId}>{artistName(track.artistId)}</Link></small></div></div>
            {hasPlayableAudio(track) && <EbgAudioPlayer track={catalogTrack(track, artistName(track.artistId), releases.find((r: any) => r.id === track.releaseId)?.cover)} queue={visibleTracks.map((item: any) => catalogTrack(item, artistName(item.artistId), releases.find((r: any) => r.id === item.releaseId)?.cover))} src={track.audioUrl || ''} title={track.title} artist={artistName(track.artistId)} artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || undefined} lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />}
          </article>
        ))}</div>
        {!visibleTracks.length && <div className="music-v2-empty"><h3>{favoritesOnly ? 'No saved songs match.' : 'No songs match your search.'}</h3><p>{favoritesOnly ? 'Favorite songs in the player to find them here. Favorites are saved on this device.' : 'Try another title or artist.'}</p></div>}
      </section>}

      {videos.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div>
        <div className="music-v2-video-grid">{videos.map((video: any) => (
          <article key={video.id}>
            <EbgVideoPlayer contentId={video.id} title={video.title} poster={video.thumbnail || undefined} src={video.videoUrl} />
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
        <div><p className="eyebrow">ARTIST</p><h1>{artist.name}</h1>{artist.label && <p className="music-detail-muted">{artist.label}</p>}{artist.bio && <p className="music-artist-bio">{artist.bio}</p>}<MusicCollectionActions tracks={tracks.map((item: any) => catalogTrack(item, artist.name, releases.find((r: any) => r.id === item.releaseId)?.cover || artist.image))} /></div>
      </section>

      <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">DISCOGRAPHY</p><h2>Albums & Singles</h2></div><span>{releases.length}</span></div>
        {releases.length ? <div className="music-v2-release-grid">{releases.map((release: any) => (
          <Link className="music-v2-release-card" key={release.id} to={'/app/music/release/' + release.id}><div>{release.cover ? <img src={release.cover} alt="" /> : <span>♫</span>}</div><h3>{release.title}</h3><p>{String(release.type || 'release').toUpperCase()}</p><small>{release.genre || 'Music'}{release.releaseDate ? ' · ' + new Date(release.releaseDate).getFullYear() : ''}</small></Link>
        ))}</div> : <div className="music-v2-empty"><h3>No live releases yet.</h3></div>}
      </section>

      {tracks.length > 0 && <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">CATALOG</p><h2>Songs</h2></div></div><div className="music-v2-track-list">{tracks.map((track: any) => <article key={track.id}><div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{track.duration || 'EBG+'}</small></div></div>{hasPlayableAudio(track) && <EbgAudioPlayer track={catalogTrack(track, artist.name, releases.find((r: any) => r.id === track.releaseId)?.cover || artist.image)} queue={tracks.map((item: any) => catalogTrack(item, artist.name, releases.find((r: any) => r.id === item.releaseId)?.cover || artist.image))} src={track.audioUrl || ''} title={track.title} artist={artist.name} artwork={releases.find((release: any) => release.id === track.releaseId)?.cover || artist.image || undefined} lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />}</article>)}</div></section>}

      {videos.length > 0 && <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div><div className="music-v2-video-grid">{videos.map((video: any) => <article key={video.id}><EbgVideoPlayer contentId={video.id} title={video.title} poster={video.thumbnail || undefined} src={video.videoUrl} /><h3>{video.title}</h3></article>)}</div></section>}
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
        <div className="music-release-info"><p className="eyebrow">{String(release.type || 'release').toUpperCase()}</p><h1>{release.title}</h1>{artist && <h2><Link to={'/app/music/artist/' + artist.id}>{artist.name}</Link></h2>}<p className="music-detail-muted">{release.genre || 'Music'}{release.releaseDate ? ' · ' + new Date(release.releaseDate).getFullYear() : ''}{release.explicit ? ' · Explicit' : ''}</p><p>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</p><MusicCollectionActions tracks={tracks.map((item: any) => catalogTrack(item, artist?.name || 'EBG+', release.cover))} /></div>
      </section>

      <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">TRACKLIST</p><h2>{release.title}</h2></div></div>{tracks.length ? <div className="music-v2-track-list">{tracks.map((track: any) => <article key={track.id}><div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{track.duration || (artist?.name ?? 'EBG+')}</small></div></div>{hasPlayableAudio(track) && <EbgAudioPlayer track={catalogTrack(track, artist?.name || 'EBG+', release.cover)} queue={tracks.map((item: any) => catalogTrack(item, artist?.name || 'EBG+', release.cover))} src={track.audioUrl || ''} title={track.title} artist={artist?.name || 'EBG+'} artwork={release.cover || undefined} lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />}</article>)}</div> : <div className="music-v2-empty"><h3>No tracks attached to this release yet.</h3></div>}</section>
    </main>
  )
}

function OriginalsPage({ cms }: { cms: CmsData }) {
  const originals = cms.shows.filter((show) => show.category.toLowerCase().includes('original'))
  return (
    <main className="page originals-page-v2">
      <section className="editorial-page-hero"><p className="eyebrow">EBG+ ORIGINALS</p><h1>Original stories. Only on EBG+.</h1><p>Reality, scripted concepts, music films, specials, experiments, and creator-led projects made for EBG+.</p></section>
      {originals.length ? <div className="originals-grid-v2">{originals.map((show) => <Link key={show.id} to={'/app/shows/' + show.id} className="original-card-v2"><div className="original-art" style={{ backgroundImage: 'url(' + show.artwork + ')' }}><span>{show.status}</span></div><div><p className="eyebrow">{show.category}</p><h2>{show.title}</h2><p>{show.description}</p><small>{show.genre} · {show.year} · {show.maturity}</small></div></Link>)}</div> : <section className="panel"><h2>More originals are being prepared.</h2><p>Projects marked as EBG+ Originals in Studio will appear here automatically.</p></section>}
    </main>
  )
}

function NewsPage({ cms }: { cms: CmsData }) {
  const published = (cms.news ?? []).filter((item) => item.status === 'published' && Date.parse(item.publishedAt) <= Date.now()).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const featured = published.find((item) => item.featured) ?? published[0]
  const rest = featured ? published.filter((item) => item.id !== featured.id) : published
  return (
    <main className="page news-page-v2">
      <section className="editorial-page-hero"><p className="eyebrow">EBG NEWS</p><h1>What's happening across EBG.</h1><p>Official announcements, releases, casting updates, premieres, artist news, platform updates, and stories from across EBG.</p></section>
      {featured ? <><article className="news-lead">{featured.image && <img src={featured.image} alt="" />}<div><span>{featured.category}</span><h2>{featured.headline}</h2><p>{featured.summary}</p><small>By {featured.author} · {new Date(featured.publishedAt).toLocaleDateString()}</small><div className="news-body">{featured.body}</div></div></article><div className="news-grid-v2">{rest.map((item) => <article key={item.id}>{item.image && <img src={item.image} alt="" />}<span>{item.category}</span><h3>{item.headline}</h3><p>{item.summary}</p><small>By {item.author} · {new Date(item.publishedAt).toLocaleDateString()}</small></article>)}</div></> : <section className="panel"><p className="eyebrow">NEWSROOM</p><h2>No stories published yet.</h2><p>Founder-published stories from EBG Studio will appear here.</p></section>}
    <NetworkLinks cms={cms} /></main>
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
    <PublicInfoShell eyebrow="About EBG" title="Stories, music, personalities, and worlds that keep growing." intro="EBG+ is the streaming home for EBG originals, reality programming, cinematic music experiences, specials, and artist stories.">
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
        <section className="info-card"><h2>Music & talent</h2><p>Performance opportunities, original music, artist collaborations, creative talent, and projects that fit EBG.</p></section>
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

  useEffect(() => { setWaffleOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!waffleOpen) return
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWaffleOpen(false)
        document.querySelector<HTMLButtonElement>('.mobile-waffle-button')?.focus()
      }
    }
    document.addEventListener('keydown', dismiss)
    return () => document.removeEventListener('keydown', dismiss)
  }, [waffleOpen])

  return (
    <>
      <div className="mobile-waffle-nav">
        <button className={'mobile-waffle-button ' + (waffleOpen ? 'active' : '')} type="button" aria-label={waffleOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={waffleOpen} onClick={() => setWaffleOpen((open) => !open)}>
          <span className="waffle-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
        </button>
        {waffleOpen && <><button className="mobile-waffle-backdrop" type="button" aria-label="Close navigation" onClick={closeWaffle} /><nav className="mobile-waffle-drawer" aria-label="Mobile menu">
          <div className="mobile-waffle-head"><span>Explore EBG+</span><button type="button" onClick={closeWaffle} aria-label="Close menu">×</button></div>
          <div className="mobile-waffle-section"><span className="mobile-waffle-label">Watch</span><Link to="/app/home" onClick={closeWaffle}>Home</Link><Link to="/app/shows" onClick={closeWaffle}>Shows</Link><Link to="/app/originals" onClick={closeWaffle}>EBG Originals</Link><Link to="/app/movies" onClick={closeWaffle}>Movies & Specials</Link><Link to="/app/music" onClick={closeWaffle}>Music</Link><Link to="/app/news" onClick={closeWaffle}>News</Link><Link to="/app/search" onClick={closeWaffle}>Search</Link></div>
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
