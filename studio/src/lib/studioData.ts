import { db, storage } from '../../../src/lib/supabase'
import { readStoredSession } from '../../../src/lib/auth'

const requireSession = () => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  return session
}

export const loadCmsData = async <T>() => {
  const session = requireSession()
  return db.rpc<T | null>('studio_load_cms', {}, session.access_token)
}

export const saveCmsData = async <T>(value: T) => {
  const session = requireSession()
  await db.rpc('studio_save_cms', { p_value: value }, session.access_token)
}

export const updateCastingApplicationStatus = async (applicationId: string, status: string) => {
  const session = requireSession()
  const rows = await db.update<{ id: string; status: string }>(
    'casting_applications',
    `id=eq.${encodeURIComponent(applicationId)}`,
    { status },
    session.access_token,
  )
  if (!rows.length) throw new Error('Casting status could not be updated.')
  return rows[0]
}

const safeSegment = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'

export const uploadStudioMedia = async (file: File, folder: string) => {
  const session = requireSession()
  const stamp = Date.now()
  const safeFolder = folder.split('/').map(safeSegment).filter(Boolean).join('/')
  const path = `${safeFolder}/${stamp}-${safeSegment(file.name)}`
  return storage.uploadPublic('ebg-media', path, file, session.access_token)
}
