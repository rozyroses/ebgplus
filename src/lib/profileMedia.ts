import { storage } from './supabase'
import { readStoredSession } from './auth'

const safeSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'profile-photo'

export const uploadProfilePhoto = async (file: File) => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file for your profile photo.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Profile photos must be 10 MB or smaller.')

  const path = `profiles/${session.user.id}/${Date.now()}-${safeSegment(file.name)}`
  return storage.uploadPublic('ebg-media', path, file, session.access_token)
}
