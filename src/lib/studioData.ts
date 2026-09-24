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

export type LumiPublicationKind = 'news' | 'notification'

export const publishLumiContent = async (input: {
  projectId: string
  kind: LumiPublicationKind
  title: string
  body: string
  link?: string
}) => {
  const session = requireSession()
  return db.rpc<{ ok: boolean; kind: LumiPublicationKind; id: string; publishedAt: string }>(
    'publish_lumi_content',
    {
      p_project_id: input.projectId,
      p_kind: input.kind,
      p_title: input.title.trim(),
      p_body: input.body.trim(),
      p_link: input.link?.trim() || null,
    },
    session.access_token,
  )
}

export type LumiPublication = {
  id: string
  kind: LumiPublicationKind
  headline?: string
  title?: string
  body?: string
  text?: string
  summary?: string
  link?: string | null
  publishedAt?: string
  date?: string
  updatedAt?: string
  sourceProjectId?: string
}

export const listLumiPublications = async (projectId: string) => {
  const session = requireSession()
  return db.rpc<LumiPublication[]>(
    'list_lumi_publications',
    { p_project_id: projectId },
    session.access_token,
  )
}

export const updateLumiPublication = async (input: {
  projectId: string
  kind: LumiPublicationKind
  id: string
  title: string
  body: string
  link?: string
}) => {
  const session = requireSession()
  return db.rpc<{ ok: boolean; kind: LumiPublicationKind; id: string; updatedAt: string }>(
    'update_lumi_publication',
    {
      p_project_id: input.projectId,
      p_kind: input.kind,
      p_id: input.id,
      p_title: input.title.trim(),
      p_body: input.body.trim(),
      p_link: input.link?.trim() || null,
    },
    session.access_token,
  )
}

export const deleteLumiPublication = async (input: {
  projectId: string
  kind: LumiPublicationKind
  id: string
}) => {
  const session = requireSession()
  return db.rpc<{ ok: boolean; kind: LumiPublicationKind; id: string }>(
    'delete_lumi_publication',
    {
      p_project_id: input.projectId,
      p_kind: input.kind,
      p_id: input.id,
    },
    session.access_token,
  )
}

export type LumiChatMessage = {
  role: 'user' | 'lumi'
  text: string
}

export type LumiChat = {
  id: string
  owner_account_id: string
  project_id: string
  title: string
  messages: LumiChatMessage[]
  created_at: string
  updated_at: string
}

const chatTitleFromPrompt = (prompt: string) => {
  const clean = prompt.replace(/\s+/g, ' ').trim()
  if (!clean) return 'New chat'
  return clean.length > 48 ? clean.slice(0, 45).trimEnd() + '…' : clean
}

export const listLumiChats = async (projectId: string) => {
  const session = requireSession()
  return db.select<LumiChat>(
    'lumi_chats',
    `project_id=eq.${encodeURIComponent(projectId)}&order=updated_at.desc`,
    session.access_token,
  )
}

export const createLumiChat = async (projectId: string, firstPrompt?: string) => {
  const session = requireSession()
  const rows = await db.insert<LumiChat>(
    'lumi_chats',
    {
      owner_account_id: session.user.id,
      project_id: projectId,
      title: chatTitleFromPrompt(firstPrompt || ''),
      messages: [],
      updated_at: new Date().toISOString(),
    },
    session.access_token,
  )
  const chat = rows[0]
  if (!chat) throw new Error('Lumi could not create a new chat.')
  return chat
}

export const saveLumiChat = async (chatId: string, messages: LumiChatMessage[], title?: string) => {
  const session = requireSession()
  const rows = await db.update<LumiChat>(
    'lumi_chats',
    `id=eq.${encodeURIComponent(chatId)}&owner_account_id=eq.${encodeURIComponent(session.user.id)}`,
    {
      messages,
      ...(title ? { title: chatTitleFromPrompt(title) } : {}),
      updated_at: new Date().toISOString(),
    },
    session.access_token,
  )
  const chat = rows[0]
  if (!chat) throw new Error('Lumi chat could not be saved.')
  return chat
}

export const renameLumiChat = async (chatId: string, title: string) => {
  const session = requireSession()
  const clean = title.trim() || 'New chat'
  const rows = await db.update<LumiChat>(
    'lumi_chats',
    `id=eq.${encodeURIComponent(chatId)}&owner_account_id=eq.${encodeURIComponent(session.user.id)}`,
    { title: clean.slice(0, 80), updated_at: new Date().toISOString() },
    session.access_token,
  )
  const chat = rows[0]
  if (!chat) throw new Error('Lumi chat could not be renamed.')
  return chat
}

export const deleteLumiChat = async (chatId: string) => {
  const session = requireSession()
  await db.remove<LumiChat>(
    'lumi_chats',
    `id=eq.${encodeURIComponent(chatId)}&owner_account_id=eq.${encodeURIComponent(session.user.id)}`,
    session.access_token,
  )
}

export type LumiMusicReleaseInput = {
  projectId: string
  artistName: string
  title: string
  releaseType: 'single' | 'ep' | 'album'
  genre?: string
  cover?: string
  releaseDate?: string
  publishStatus: 'draft' | 'scheduled' | 'live'
  explicit?: boolean
}

export const publishLumiMusicRelease = async (input: LumiMusicReleaseInput) => {
  const session = requireSession()
  return db.rpc<{
    ok: boolean
    kind: 'music'
    id: string
    artistId: string
    publishStatus: 'draft' | 'scheduled' | 'live'
  }>(
    'publish_lumi_music_release',
    {
      p_project_id: input.projectId,
      p_artist_name: input.artistName.trim(),
      p_title: input.title.trim(),
      p_release_type: input.releaseType,
      p_genre: input.genre?.trim() || '',
      p_cover: input.cover?.trim() || '',
      p_release_date: input.releaseDate?.trim() || null,
      p_publish_status: input.publishStatus,
      p_explicit: Boolean(input.explicit),
    },
    session.access_token,
  )
}

