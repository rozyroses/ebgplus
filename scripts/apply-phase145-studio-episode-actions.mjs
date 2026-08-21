import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE145_STUDIO_EPISODE_ACTIONS')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.45 patch failed: ${label}`)
  source = next
}

must(
  "import './phase144-studio-series-actions.css'",
  "import './phase144-studio-series-actions.css'\nimport './phase145-studio-episode-actions.css'\n\n// EBG_PHASE145_STUDIO_EPISODE_ACTIONS",
  'styles import',
)

must(
  `  const replaceEpisodeMedia = async (episodeId: string, field: 'thumbnail' | 'videoUrl', file?: File) => {`,
  `  const duplicateEpisode = (episode: Episode) => {\n    const copy: Episode = {\n      ...episode,\n      id: \`\${episode.id}-copy-\${Date.now()}\`,\n      title: \`\${episode.title} Copy\`,\n      publishStatus: 'draft',\n      releaseDate: new Date().toISOString(),\n    }\n    onUpdateCms({ ...cms, episodes: [...cms.episodes, copy] })\n    setMessage(\`\${copy.title} created as a draft.\`)\n  }\n\n  const rescheduleEpisode = (episode: Episode) => {\n    const current = new Date(episode.releaseDate)\n    const currentValue = Number.isNaN(current.getTime()) ? '' : current.toISOString().slice(0, 16)\n    const nextValue = window.prompt('Enter the new release date and time (YYYY-MM-DDTHH:MM):', currentValue)\n    if (!nextValue) return\n    const nextDate = new Date(nextValue)\n    if (Number.isNaN(nextDate.getTime())) {\n      setMessage('That release date is not valid.')\n      return\n    }\n    updateEpisode(episode.id, { publishStatus: 'scheduled', releaseDate: nextDate.toISOString() })\n    setMessage(\`\${episode.title} rescheduled.\`)\n  }\n\n  const replaceEpisodeMedia = async (episodeId: string, field: 'thumbnail' | 'videoUrl', file?: File) => {`,
  'episode action helpers',
)

const oldEpisodeCard = `<article key={episode.id}><img src={episode.thumbnail} alt=""/><div className="studio36-episode-copy"><span>S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleString()}</p><select value={episode.publishStatus ?? 'scheduled'} onChange={(event) => updateEpisode(episode.id, { publishStatus: event.target.value as Episode['publishStatus'], releaseDate: event.target.value === 'live' ? new Date().toISOString() : episode.releaseDate })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></div><div className="studio36-media-buttons"><label>Thumbnail<input type="file" accept="image/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void replaceEpisodeMedia(episode.id,'thumbnail',file); event.currentTarget.value='' }}/></label><label>Video<input type="file" accept="video/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void replaceEpisodeMedia(episode.id,'videoUrl',file); event.currentTarget.value='' }}/></label><button className="studio36-danger" type="button" onClick={() => { if(window.confirm('Delete this episode?')) onUpdateCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) }) }}>Delete</button></div></article>`

const newEpisodeCard = `<article key={episode.id} className="studio45-episode-card"><img src={episode.thumbnail} alt=""/><div className="studio36-episode-copy"><span>S{episode.season}E{episode.number}</span><h3>{episode.title}</h3><p>{episode.runtime} · {new Date(episode.releaseDate).toLocaleString()}</p><select value={episode.publishStatus ?? 'scheduled'} onChange={(event) => updateEpisode(episode.id, { publishStatus: event.target.value as Episode['publishStatus'], releaseDate: event.target.value === 'live' ? new Date().toISOString() : episode.releaseDate })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="archived">Archived</option></select></div><div className="studio45-episode-actions">{episode.videoUrl ? <a className="studio45-action" href={episode.videoUrl} target="_blank" rel="noreferrer">Preview</a> : null}<button className="studio45-action" type="button" onClick={() => { const live = episode.publishStatus === 'live'; updateEpisode(episode.id, { publishStatus: live ? 'draft' : 'live', releaseDate: live ? episode.releaseDate : new Date().toISOString() }); setMessage(live ? \`\${episode.title} moved to Draft.\` : \`\${episode.title} published.\`) }}>{episode.publishStatus === 'live' ? 'Unpublish' : 'Publish Now'}</button><button className="studio45-action" type="button" onClick={() => rescheduleEpisode(episode)}>Reschedule</button><button className="studio45-action" type="button" onClick={() => duplicateEpisode(episode)}>Duplicate</button><label className="studio45-action studio45-upload">Replace Thumbnail<input type="file" accept="image/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void replaceEpisodeMedia(episode.id,'thumbnail',file); event.currentTarget.value='' }}/></label><label className="studio45-action studio45-upload">Replace Video<input type="file" accept="video/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void replaceEpisodeMedia(episode.id,'videoUrl',file); event.currentTarget.value='' }}/></label><button className="studio36-danger" type="button" onClick={() => { if(window.confirm(\`Delete \"\${episode.title}\"? This cannot be undone.\`)) { onUpdateCms({ ...cms, episodes: cms.episodes.filter((item) => item.id !== episode.id) }); setMessage('Episode deleted.') } }}>Delete</button></div></article>`

must(oldEpisodeCard, newEpisodeCard, 'episode action bar')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.45 Studio Episode actions.')

await import('./apply-phase146-home-news-position.mjs')
