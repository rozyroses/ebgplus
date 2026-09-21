import { auth, db, supabaseConfigured, type SupabaseSession } from './supabase'

export type EbgRole = 'viewer' | 'editor' | 'producer' | 'administrator' | 'founder'
export type EbgAccountType = 'viewer' | 'creator' | 'producer' | 'founder'
export type PublicSignupAccountType = 'viewer' | 'creator' | 'producer'

export type AuthAccount = {
  id: string
  email: string
  role: EbgRole
  account_type?: EbgAccountType
  verified_badge?: 'artist' | 'founder' | null
}

export type AuthProfile = {
  id: string
  account_id: string
  name: string
  avatar: string
  autoplay_next: boolean
}

export type StudioIdentity = {
  id: string
  account_id: string
  identity_type: 'creator' | 'producer' | 'founder'
  display_name: string
  company_name?: string | null
  bio: string
  verified: boolean
  badge_tone: 'blue' | 'violet' | 'gold' | 'green'
}

export type AuthState = {
  session: SupabaseSession
  account: AuthAccount
  profiles: AuthProfile[]
  studioIdentity: StudioIdentity | null
}

export type SignUpOptions = {
  accountType: PublicSignupAccountType
  displayName: string
  companyName?: string
}

const SESSION_KEY = 'ebg.supabase.session.v1'

export const authConfigured = supabaseConfigured

export const readStoredSession = (): SupabaseSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SupabaseSession) : null
  } catch {
    return null
  }
}

const storeSession = (session: SupabaseSession | null) => {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export const loadAuthState = async (session: SupabaseSession): Promise<AuthState> => {
  const [account] = await db.select<AuthAccount>('accounts', `id=eq.${encodeURIComponent(session.user.id)}`, session.access_token)
  if (!account) throw new Error('Your EBG+ account record could not be loaded.')

  const profiles = await db.select<AuthProfile>(
    'profiles',
    `account_id=eq.${encodeURIComponent(session.user.id)}&order=created_at.asc`,
    session.access_token,
  )

  const identities = await db.select<StudioIdentity>(
    'studio_identities',
    `account_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    session.access_token,
  ).catch(() => [])

  return { session, account, profiles, studioIdentity: identities[0] ?? null }
}

export const restoreAuth = async (): Promise<AuthState | null> => {
  const stored = readStoredSession()
  if (!stored) return null

  try {
    const expiresAt = stored.expires_at ?? 0
    const session = expiresAt && expiresAt * 1000 <= Date.now() + 60_000
      ? await auth.refresh(stored.refresh_token)
      : stored
    storeSession(session)
    await auth.getUser(session.access_token)
    return await loadAuthState(session)
  } catch {
    storeSession(null)
    return null
  }
}

export const signIn = async (email: string, password: string): Promise<AuthState> => {
  if (!authConfigured) throw new Error('EBG+ authentication is not configured yet.')
  const session = await auth.signIn(email.trim(), password)
  storeSession(session)
  return loadAuthState(session)
}

export const signUp = async (email: string, password: string, options: SignUpOptions): Promise<AuthState | null> => {
  if (!authConfigured) throw new Error('EBG+ authentication is not configured yet.')
  const displayName = options.displayName.trim()
  if (!displayName) throw new Error('Choose a display name.')
  if (options.accountType === 'producer' && !options.companyName?.trim()) throw new Error('Add your production company or producer name.')
  const result = await auth.signUp(email.trim(), password, {
    account_type: options.accountType,
    display_name: displayName,
    company_name: options.companyName?.trim() || null,
  })
  const session = 'access_token' in result ? result : result.session
  if (!session) return null
  storeSession(session)
  return loadAuthState(session)
}

const requireSession = () => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  return session
}

export const createProfile = async (name: string, avatar = '✨') => {
  const session = requireSession()
  const [profile] = await db.insert<AuthProfile>('profiles', {
    account_id: session.user.id,
    name,
    avatar,
    autoplay_next: true,
  }, session.access_token)
  if (!profile) throw new Error('Profile could not be created.')
  return profile
}

export const updateProfile = async (profileId: string, values: Partial<Pick<AuthProfile, 'name' | 'avatar' | 'autoplay_next'>>) => {
  const session = requireSession()
  const [profile] = await db.update<AuthProfile>('profiles', `id=eq.${encodeURIComponent(profileId)}`, values, session.access_token)
  if (!profile) throw new Error('Profile could not be updated.')
  return profile
}

export const deleteProfile = async (profileId: string) => {
  const session = requireSession()
  await db.remove<AuthProfile>('profiles', `id=eq.${encodeURIComponent(profileId)}`, session.access_token)
}

export const signOut = async () => {
  const session = readStoredSession()
  try {
    if (session) await auth.signOut(session.access_token)
  } finally {
    storeSession(null)
  }
}
