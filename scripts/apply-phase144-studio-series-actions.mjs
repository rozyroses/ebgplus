import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE144_STUDIO_SERIES_ACTIONS')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.44 patch failed: ${label}`)
  source = next
}

must(
  "import './phase143-desktop-split-hero.css'",
  "import './phase143-desktop-split-hero.css'\nimport './phase144-studio-series-actions.css'\n\n// EBG_PHASE144_STUDIO_SERIES_ACTIONS",
  'styles import',
)

must(
  `  const deleteShow = (showId: string) => {\n    if (!window.confirm('Delete this series and all of its episodes?')) return`,
  `  const duplicateShow = (sourceShow: Show) => {\n    const baseId = slugify(\`\${sourceShow.title}-copy\`) || \`show-copy-\${Date.now()}\`\n    const id = cms.shows.some((item) => item.id === baseId) ? \`\${baseId}-\${Date.now()}\` : baseId\n    const copy: Show = {\n      ...sourceShow,\n      id,\n      title: \`\${sourceShow.title} Copy\`,\n      status: 'Coming Soon',\n      homeVisible: false,\n      cast: sourceShow.cast.map((person) => ({ ...person })),\n    }\n    onUpdateCms({ ...cms, shows: [...cms.shows, copy] })\n    setShowId(id)\n    setMessage(\`\${copy.title} created. Episodes were not duplicated.\`)\n  }\n\n  const deleteShow = (showId: string) => {\n    if (!window.confirm('Delete this series and all of its episodes?')) return`,
  'duplicate series helper',
)

must(
  `<section className="studio36-card"><div className="studio36-card-head"><div><span>EDIT SERIES</span><h2>{show.title}</h2></div><button className="studio36-danger" type="button" onClick={() => deleteShow(show.id)}>Delete</button></div><div className="studio36-form-grid">`,
  `<section className="studio36-card"><div className="studio36-card-head studio44-series-head"><div><span>EDIT SERIES</span><h2>{show.title}</h2></div><div className="studio44-series-actions"><Link className="studio44-action" to={\`/app/shows/\${show.id}\`}>View Show</Link><button className="studio44-action" type="button" onClick={() => { onUpdateCms({ ...cms, heroShowId: show.id, shows: cms.shows.map((item) => item.id === show.id ? { ...item, homeVisible: true } : item) }); setMessage(\`\${show.title} is now featured on Home.\`) }}>Set Featured</button><button className="studio44-action" type="button" onClick={() => { const nextVisible = show.homeVisible === false; updateShow(show.id, { homeVisible: nextVisible }); setMessage(nextVisible ? \`\${show.title} is visible on Home.\` : \`\${show.title} is hidden from Home.\`) }}>{show.homeVisible === false ? 'Show on Home' : 'Hide from Home'}</button><button className="studio44-action" type="button" onClick={() => duplicateShow(show)}>Duplicate</button><button className="studio36-danger" type="button" onClick={() => deleteShow(show.id)}>Delete</button></div></div><div className="studio36-form-grid">`,
  'series action bar',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.44 Studio Series actions.')
