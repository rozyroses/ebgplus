import { db, storage } from './supabase'
import { readStoredSession } from './auth'

export type StudioCmsPayload = Record<string, unknown>

const requireSession = () => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  return session
}

export const loadCmsData = async <T>() => {
  const rows = await db.select<{ key: string; value: T }>('cms_settings', 'key=eq.cms&limit=1')
  return rows[0]?.value ?? null
}

export const saveCmsData = async <T>(value: T) => {
  const session = requireSession()
  const existing = await db.select<{ key: string }>('cms_settings', 'key=eq.cms&limit=1', session.access_token)
  const payload = { value, updated_at: new Date().toISOString() }

  if (existing.length) {
    await db.update('cms_settings', 'key=eq.cms', payload, session.access_token)
  } else {
    await db.insert('cms_settings', { key: 'cms', ...payload }, session.access_token)
  }
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
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file'

export const uploadStudioMedia = async (file: File, folder: string) => {
  const session = requireSession()
  const stamp = Date.now()
  const safeFolder = folder
    .split('/')
    .map(safeSegment)
    .filter(Boolean)
    .join('/')
  const path = `${safeFolder}/${stamp}-${safeSegment(file.name)}`
  return storage.uploadPublic('ebg-media', path, file, session.access_token)
}
