/** Preserve remotely changed fields when saving a locally edited catalog. */
export function mergeMusicEdits<T extends { artists: any[]; releases: any[]; tracks: any[]; videos: any[]; featuredReleaseId?: string }>(baseline: T, desired: T, latest: T): T {
  const merged = { ...latest, ...desired }
  for (const key of ['artists', 'releases', 'tracks', 'videos'] as const) {
    const removed = new Set(baseline[key].filter(item => !desired[key].some(next => next.id === item.id)).map(item => item.id))
    const result = latest[key].filter(item => !removed.has(item.id))
    for (const item of desired[key]) {
      const before = baseline[key].find(old => old.id === item.id)
      const index = result.findIndex(old => old.id === item.id)
      if (before && index < 0) continue
      const patch = Object.fromEntries(Object.keys(item).filter(field => !before || JSON.stringify(item[field]) !== JSON.stringify(before[field])).map(field => [field, item[field]]))
      if (index < 0) result.push(item)
      else result[index] = { ...result[index], ...patch }
    }
    merged[key] = result
  }
  if (desired.featuredReleaseId === baseline.featuredReleaseId) merged.featuredReleaseId = latest.featuredReleaseId
  return merged
}
