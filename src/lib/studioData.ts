import { db, storage } from './supabase'
import { readStoredSession } from './auth'

export type StudioCmsPayload = Record<string, unknown>

export type StudioProject = {
  id: string
  owner_account_id: string
  identity_id: string
  title: string
  slug: string
  project_kind: 'show' | 'music' | 'mixed'
  cms: StudioCmsPayload
  created_at: string
  updated_at: string
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

const requireSession = () => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  return session
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project'

export const loadStudioIdentity = async () => {
  const session = requireSession()
  const rows = await db.select<StudioIdentity>(
    'studio_identities',
    `account_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    session.access_token,
  )
  return rows[0] ?? null
}

export const loadMyStudioProjects = async <T extends StudioCmsPayload = StudioCmsPayload>() => {
  const session = requireSession()
  return db.select<StudioProject & { cms: T }>(
    'studio_projects',
    `owner_account_id=eq.${encodeURIComponent(session.user.id)}&order=updated_at.desc`,
    session.access_token,
  )
}

export const createStudioProject = async <T extends StudioCmsPayload = StudioCmsPayload>(input: {
  title: string
  projectKind: StudioProject['project_kind']
  cms: T
}) => {
  const session = requireSession()
  const identity = await loadStudioIdentity()
  if (!identity) throw new Error('Set up your Creator or Producer profile before creating a project.')

  const base = slugify(input.title)
  const existing = await loadMyStudioProjects()
  let slug = base
  let counter = 2
  while (existing.some((project) => project.slug === slug)) {
    slug = `${base}-${counter}`
    counter += 1
  }

  const [project] = await db.insert<StudioProject & { cms: T }>('studio_projects', {
    owner_account_id: session.user.id,
    identity_id: identity.id,
    title: input.title.trim(),
    slug,
    project_kind: input.projectKind,
    cms: input.cms,
  }, session.access_token)

  if (!project) throw new Error('Studio project could not be created.')
  return project
}

export const loadProjectCms = async <T>(projectId: string) => {
  const session = requireSession()
  const rows = await db.select<StudioProject & { cms: T }>(
    'studio_projects',
    `id=eq.${encodeURIComponent(projectId)}&owner_account_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    session.access_token,
  )
  return rows[0]?.cms ?? null
}

export const saveProjectCms = async <T>(projectId: string, value: T) => {
  const session = requireSession()
  const rows = await db.update<StudioProject & { cms: T }>(
    'studio_projects',
    `id=eq.${encodeURIComponent(projectId)}&owner_account_id=eq.${encodeURIComponent(session.user.id)}`,
    { cms: value as StudioProject['cms'], updated_at: new Date().toISOString() } as Partial<StudioProject & { cms: T }>,
    session.access_token,
  )
  if (!rows.length) throw new Error('This Studio project could not be saved.')
  return rows[0]
}

export const renameStudioProject = async (projectId: string, title: string) => {
  const session = requireSession()
  const rows = await db.update<StudioProject>(
    'studio_projects',
    `id=eq.${encodeURIComponent(projectId)}&owner_account_id=eq.${encodeURIComponent(session.user.id)}`,
    { title: title.trim(), updated_at: new Date().toISOString() },
    session.access_token,
  )
  if (!rows.length) throw new Error('Studio project could not be renamed.')
  return rows[0]
}

// Legacy global CMS helpers remain temporarily for the public viewer while the
// catalog publishing path is migrated. Private Studio code should use project APIs.
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

export const uploadStudioProjectMedia = async (file: File, projectId: string, folder: string) => {
  const session = requireSession()
  const stamp = Date.now()
  const safeFolder = folder
    .split('/')
    .map(safeSegment)
    .filter(Boolean)
    .join('/')
  const path = `studio/${session.user.id}/${safeSegment(projectId)}/${safeFolder}/${stamp}-${safeSegment(file.name)}`
  return storage.uploadPublic('ebg-media', path, file, session.access_token)
}

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
