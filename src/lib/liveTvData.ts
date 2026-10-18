import { readStoredSession } from './auth'
import { db } from './supabase'
import { liveTvFingerprint, validateLiveTv, type LiveTvConfig } from './liveTv'

type CmsRow = { key: string; updated_at: string; value: Record<string, unknown> & { liveTv?: LiveTvConfig } }
const empty: LiveTvConfig = { channels: [] }

export async function saveLiveTvSettings(config: LiveTvConfig, expectedFingerprint: string) {
  validateLiveTv(config)
  const session = readStoredSession()
  if (!session) throw new Error('Please sign in again before saving Live TV.')
  const [snapshot] = await db.select<CmsRow>('cms_settings', 'key=eq.cms&select=key,value,updated_at&limit=1', session.access_token)
  if (!snapshot) throw new Error('The shared catalog could not be loaded. Nothing was saved.')
  if (liveTvFingerprint(snapshot.value.liveTv ?? empty) !== expectedFingerprint) throw new Error('Live TV was changed in another session. Reload the page before saving to avoid overwriting it.')
  // The global-write RLS policy authorizes this update. Matching updated_at makes
  // the write atomic: concurrent catalog edits are preserved instead of replaced.
  const rows = await db.update<CmsRow>('cms_settings', `key=eq.cms&updated_at=eq.${encodeURIComponent(snapshot.updated_at)}`, {
    value: { ...snapshot.value, liveTv: config }, updated_at: new Date().toISOString(),
  }, session.access_token)
  const stored = rows[0]?.value.liveTv
  if (!stored) throw new Error('The catalog changed or your account cannot manage the channel lineup. Reload before trying again.')
  if (liveTvFingerprint(stored) !== liveTvFingerprint(config)) throw new Error('The saved Live TV settings could not be verified. Reload before trying again.')
  return stored
}
