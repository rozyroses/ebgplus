import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE126_HOME_HERO_MEDIA_CLEANUP')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.26 patch failed: ${label}`)
  source = next
}

must(
  "import './phase125-episode-publishing.css'",
  "import './phase125-episode-publishing.css'\nimport './phase126-home-hero-media-cleanup.css'\n\n// EBG_PHASE126_HOME_HERO_MEDIA_CLEANUP",
  'styles import',
)

must(
  `  const clearEpisodeThumbnail = (episodeId: string) => {\n    if (!window.confirm('Delete this episode thumbnail?')) return\n    updateEpisode(episodeId, { thumbnail: '' })\n    setState('Episode thumbnail deleted.')\n  }`,
  `  const clearEpisodeThumbnail = (episodeId: string) => {\n    if (!window.confirm('Delete this episode thumbnail?')) return\n    updateEpisode(episodeId, { thumbnail: '' })\n    setState('Episode thumbnail deleted.')\n  }\n\n  const clearEpisodeVideo = (episodeId: string) => {\n    if (!window.confirm('Delete this episode video? The episode will not be playable until a new video is uploaded.')) return\n    updateEpisode(episodeId, { videoUrl: '', publishStatus: 'draft' })\n    setState('Episode video deleted and moved back to Draft.')\n  }`,
  'delete episode video helper',
)

must(
  `<label className="btn muted episode-file-button">Replace Video<input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceEpisodeMedia(episode.id, 'videoUrl', file); event.currentTarget.value = '' }} /></label></div>`,
  `<label className="btn muted episode-file-button">Replace Video<input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceEpisodeMedia(episode.id, 'videoUrl', file); event.currentTarget.value = '' }} /></label><button className="btn muted" type="button" disabled={!episode.videoUrl} onClick={() => clearEpisodeVideo(episode.id)}>Delete Video</button></div>`,
  'delete episode video control',
)

if (!source.includes('>Delete Banner</button>')) {
  throw new Error('Phase 1.26 safeguard failed: Studio Delete Banner control is missing.')
}

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.26 homepage hero/media cleanup and safeguarded Delete Banner.')
