import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE125_EPISODE_PUBLISHING')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.25 patch failed: ${label}`)
  source = next
}

must(
  "import './phase124-reference-hero.css'",
  "import './phase124-reference-hero.css'\nimport './phase125-episode-publishing.css'\n\n// EBG_PHASE125_EPISODE_PUBLISHING",
  'styles import',
)

must(
  `  videoUrl: string\n}`,
  `  videoUrl: string\n  publishStatus?: 'draft' | 'scheduled' | 'live' | 'archived'\n}`,
  'episode publishing type',
)

must(
  `const isEpisodeReleased = (episode: Episode) => {\n  const releaseAt = Date.parse(episode.releaseDate)\n  return Number.isNaN(releaseAt) || releaseAt <= Date.now()\n}`,
  `const isEpisodeReleased = (episode: Episode) => {\n  if (episode.publishStatus === 'draft' || episode.publishStatus === 'archived') return false\n  if (episode.publishStatus === 'live') return true\n  const releaseAt = Date.parse(episode.releaseDate)\n  return Number.isNaN(releaseAt) || releaseAt <= Date.now()\n}`,
  'viewer publishing guard',
)

const oldAddStart = `  const addEpisode = async (event: FormEvent<HTMLFormElement>) => {\n    event.preventDefault()\n    const formEl = event.currentTarget\n    const form = new FormData(formEl)`
const newAddStart = `  const addEpisode = async (event: FormEvent<HTMLFormElement>) => {\n    event.preventDefault()\n    const formEl = event.currentTarget\n    const form = new FormData(formEl)\n    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null\n    const action = (submitter?.value || 'scheduled') as 'draft' | 'scheduled' | 'live'`
must(oldAddStart, newAddStart, 'episode form action')

must(
  `      const releaseInput = String(form.get('releaseAt') ?? '')\n      const releaseDate = releaseInput ? new Date(releaseInput).toISOString() : new Date().toISOString()`,
  `      const releaseInput = String(form.get('releaseAt') ?? '')\n      if (action === 'scheduled' && !releaseInput) throw new Error('Choose a release date and time before scheduling.')\n      const releaseDate = action === 'live' ? new Date().toISOString() : releaseInput ? new Date(releaseInput).toISOString() : new Date().toISOString()`,
  'episode release action date',
)

must(
  `        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',\n        videoUrl,`,
  `        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',\n        videoUrl,\n        publishStatus: action,`,
  'episode status creation',
)

must(
  `      setState(\`\${title} uploaded and scheduled.\`)`,
  `      setState(action === 'live' ? \`\${title} is live.\` : action === 'scheduled' ? \`\${title} scheduled.\` : \`\${title} saved as a draft.\`)`,
  'episode publishing feedback',
)

const helperNeedle = `  const visibleCasting = castingFilter === 'All' ? castingApps : castingApps.filter((app) => app.status === castingFilter)`
const helpers = `  const updateEpisode = (episodeId: string, patch: Partial<Episode>) => {\n    onUpdateCms({ ...cms, episodes: cms.episodes.map((episode) => episode.id === episodeId ? { ...episode, ...patch } : episode) })\n  }\n\n  const replaceEpisodeMedia = async (episodeId: string, field: 'thumbnail' | 'videoUrl', file: File) => {\n    if (!file.size) return\n    setBusy(true)\n    setState('Uploading replacement…')\n    try {\n      const folder = field === 'thumbnail' ? 'thumbnails' : 'episodes'\n      const url = await uploadStudioMedia(file, folder)\n      updateEpisode(episodeId, { [field]: url } as Partial<Episode>)\n      setState(field === 'thumbnail' ? 'Episode thumbnail replaced.' : 'Episode video replaced.')\n    } catch (error) {\n      setState(error instanceof Error ? error.message : 'Episode media could not be replaced.')\n    } finally {\n      setBusy(false)\n    }\n  }\n\n  const clearEpisodeThumbnail = (episodeId: string) => {\n    if (!window.confirm('Delete this episode thumbnail?')) return\n    updateEpisode(episodeId, { thumbnail: '' })\n    setState('Episode thumbnail deleted.')\n  }\n\n${helperNeedle}`
must(helperNeedle, helpers, 'episode management helpers')

must(
  `<p>{isEpisodeReleased(episode) ? 'Live now' : 'Scheduled'} · {new Date(episode.releaseDate).toLocaleString()}</p>\n                <button className="btn muted" type="button" onClick={() => onUpdateCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) })}>Delete Episode</button>`,
  `<div className="episode-publish-meta"><span className={\`episode-status-pill \${episode.publishStatus ?? (isEpisodeReleased(episode) ? 'live' : 'scheduled')}\`}>{episode.publishStatus ?? (isEpisodeReleased(episode) ? 'live' : 'scheduled')}</span><span>{new Date(episode.releaseDate).toLocaleString()}</span></div>\n                <label>Publishing status<select value={episode.publishStatus ?? (isEpisodeReleased(episode) ? 'live' : 'scheduled')} onChange={(event) => updateEpisode(episode.id, { publishStatus: event.target.value as Episode['publishStatus'], releaseDate: event.target.value === 'live' ? new Date().toISOString() : episode.releaseDate })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></label>\n                <div className="episode-media-actions"><label className="btn muted episode-file-button">Replace Thumbnail<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceEpisodeMedia(episode.id, 'thumbnail', file); event.currentTarget.value = '' }} /></label><button className="btn muted" type="button" disabled={!episode.thumbnail} onClick={() => clearEpisodeThumbnail(episode.id)}>Delete Thumbnail</button><label className="btn muted episode-file-button">Replace Video<input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceEpisodeMedia(episode.id, 'videoUrl', file); event.currentTarget.value = '' }} /></label></div>\n                <button className="studio-delete-media" type="button" onClick={() => { if (window.confirm('Delete this episode from EBG+?')) onUpdateCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) }) }}>Delete Episode</button>`,
  'episode manager publishing controls',
)

must(
  `<label>Release Date & Time<input name="releaseAt" type="datetime-local" required /></label>`,
  `<label>Release Date & Time<input name="releaseAt" type="datetime-local" /></label>`,
  'optional release time for drafts/live',
)

must(
  `<button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Add Episode'}</button>`,
  `<div className="episode-publish-actions"><button className="btn muted" type="submit" value="draft" disabled={busy}>{busy ? 'Working…' : 'Save Draft'}</button><button className="btn muted" type="submit" value="scheduled" disabled={busy}>{busy ? 'Working…' : 'Schedule'}</button><button className="btn" type="submit" value="live" disabled={busy}>{busy ? 'Working…' : 'Publish Now'}</button></div>`,
  'episode publishing buttons',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.25 episode publishing controls.')
