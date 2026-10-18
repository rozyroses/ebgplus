import { broadcastRequest } from './browserBroadcast'
import { normalizeLiveTvConfig, type LiveTvConfig } from './liveTv'

export async function saveLiveTvSettings(config: LiveTvConfig, expectedFingerprint: string) {
  const normalized = normalizeLiveTvConfig(config)
  const result = await broadcastRequest<{ liveTv: LiveTvConfig }>('save-settings', { config: normalized, expectedFingerprint })
  return result.liveTv
}
