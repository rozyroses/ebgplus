import { db } from './supabase'
import { readStoredSession } from './auth'

type WatchlistRow = {
  profile_id: string
  show_id: string
  created_at?: string
}

type PlaybackRow = {
  profile_id: string
  episode_id: string
  seconds: number
  updated_at?: string
}

type CastingRow = {
  id?: string
  submitted_by: string
  legal_name: string
  age: number
  city_state: string
  email: string
  relationship_goals: string
  camera_comfort: string
  status?: 'New' | 'Reviewing' | 'Callback' | 'Interview' | 'Finalist' | 'Cast' | 'Declined' | 'Removed'
  created_at?: string
}

const requireSession = () => {
  const session = readStoredSession()
  if (!session) {
    throw new Error('Your EBG+ session has expired. Please sign in again.')
  }
  return session
}

export const loadWatchlist = async (profileId: string) => {
  const session = requireSession()

  const rows = await db.select<WatchlistRow>(
    'watchlist',
    `profile_id=eq.${encodeURIComponent(profileId)}&order=created_at.asc`,
    session.access_token,
  )

  return rows.map((row) => row.show_id)
}

export const addToWatchlist = async (profileId: string, showId: string) => {
  const session = requireSession()

  await db.insert<WatchlistRow>(
    'watchlist',
    {
      profile_id: profileId,
      show_id: showId,
    },
    session.access_token,
  )
}

export const removeFromWatchlist = async (profileId: string, showId: string) => {
  const session = requireSession()

  await db.remove<WatchlistRow>(
    'watchlist',
    `profile_id=eq.${encodeURIComponent(profileId)}&show_id=eq.${encodeURIComponent(showId)}`,
    session.access_token,
  )
}

export const loadPlaybackProgress = async (profileId: string) => {
  const session = requireSession()

  const rows = await db.select<PlaybackRow>(
    'playback_progress',
    `profile_id=eq.${encodeURIComponent(profileId)}`,
    session.access_token,
  )

  return rows.reduce<Record<string, number>>((progress, row) => {
    progress[row.episode_id] = row.seconds
    return progress
  }, {})
}

export const savePlaybackProgress = async (
  profileId: string,
  episodeId: string,
  seconds: number,
) => {
  const session = requireSession()

  const safeSeconds = Math.max(0, Math.floor(seconds))

  const existing = await db.select<PlaybackRow>(
    'playback_progress',
    `profile_id=eq.${encodeURIComponent(profileId)}&episode_id=eq.${encodeURIComponent(episodeId)}`,
    session.access_token,
  )

  if (existing.length > 0) {
    await db.update<PlaybackRow>(
      'playback_progress',
      `profile_id=eq.${encodeURIComponent(profileId)}&episode_id=eq.${encodeURIComponent(episodeId)}`,
      {
        seconds: safeSeconds,
        updated_at: new Date().toISOString(),
      },
      session.access_token,
    )
    return
  }

  await db.insert<PlaybackRow>(
    'playback_progress',
    {
      profile_id: profileId,
      episode_id: episodeId,
      seconds: safeSeconds,
    },
    session.access_token,
  )
}

export const clearPlaybackProgress = async (
  profileId: string,
  episodeId: string,
) => {
  const session = requireSession()

  await db.remove<PlaybackRow>(
    'playback_progress',
    `profile_id=eq.${encodeURIComponent(profileId)}&episode_id=eq.${encodeURIComponent(episodeId)}`,
    session.access_token,
  )
}

export const submitCastingApplication = async (application: {
  legalName: string
  age: number
  cityState: string
  email: string
  relationshipGoals: string
  cameraComfort: string
}) => {
  const session = requireSession()

  const [created] = await db.insert<CastingRow>(
    'casting_applications',
    {
      submitted_by: session.user.id,
      legal_name: application.legalName,
      age: application.age,
      city_state: application.cityState,
      email: application.email,
      relationship_goals: application.relationshipGoals,
      camera_comfort: application.cameraComfort,
      status: 'New',
    },
    session.access_token,
  )

  if (!created) {
    throw new Error('Your casting application could not be submitted.')
  }

  return created
}

export const loadCastingApplications = async () => {
  const session = requireSession()

  return db.select<CastingRow>(
    'casting_applications',
    'order=created_at.desc',
    session.access_token,
  )
}
