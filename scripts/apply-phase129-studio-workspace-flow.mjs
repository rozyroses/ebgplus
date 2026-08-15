import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE129_STUDIO_WORKSPACE_FLOW')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.29 patch failed: ${label}`)
  source = next
}

must(
  "import './phase128-studio-pages.css'",
  "import './phase128-studio-pages.css'\nimport './phase129-studio-workspace-flow.css'\n\n// EBG_PHASE129_STUDIO_WORKSPACE_FLOW",
  'styles import',
)

// Turn the Studio section switcher into route navigation so every workspace behaves like its own page.
must(
  /<div className="ebg-studio-tabs">\{tabs\.map\(\(\[id,label\]\) => <button type="button" key=\{id\} className=\{tab===id\?'active':''\} onClick=\{\(\) => setTab\(id\)\}>\{label\}<\/button>\)\}<\/div>/,
  `<nav className="studio-workspace-sidebar" aria-label="EBG Studio workspaces">{tabs.map(([id,label]) => <Link key={id} to={\`/app/studio/\${id}\`} className={tab===id?'active':''}><span className="studio-workspace-dot" />{label}</Link>)}</nav>`,
  'workspace route navigation',
)

// Give the Studio header a clearer workspace identity.
source = source.replace(
  '<div className="ebg-studio-head"><div><p className="eyebrow">EBG Studio</p><h2>Content headquarters</h2><p>Manage every EBG+ series from one place.</p></div>',
  '<div className="ebg-studio-head"><div><p className="eyebrow">EBG Studio</p><h2>Production workspace</h2><p>Choose a workspace, focus on one task, and publish when you are ready.</p></div>',
)

// Add wizard state to the legacy Studio manager without changing its data/publishing logic.
const studioStart = source.indexOf('function StudioPage(')
const studioEnd = source.indexOf('\nfunction CastingPage', studioStart)
if (studioStart < 0 || studioEnd < 0) throw new Error('Phase 1.29 patch failed: StudioPage not found')
let studio = source.slice(studioStart, studioEnd)

const routeState = '  const { studioSection } = useParams()'
if (!studio.includes(routeState)) throw new Error('Phase 1.29 patch failed: routed Studio state not found')
studio = studio.replace(routeState, `${routeState}\n  const [episodeWizardStep, setEpisodeWizardStep] = useState(1)`)

const episodeFormPattern = /<h3>Upload \/ Add Episode<\/h3>\s*<form className="form-grid" onSubmit=\{addEpisode\}>[\s\S]*?<\/form>/
const episodeFlow = `<div className="studio-upload-flow-head">
          <div>
            <p className="eyebrow">Episode Upload</p>
            <h3>Add a new episode</h3>
            <p>Move through one step at a time. Nothing publishes until the final step.</p>
          </div>
          <span>Step {episodeWizardStep} of 4</span>
        </div>
        <div className="studio-upload-progress" aria-label={\`Episode upload step \${episodeWizardStep} of 4\`}>
          {[1,2,3,4].map((step) => <span key={step} className={step <= episodeWizardStep ? 'active' : ''} />)}
        </div>
        <form className={\`studio-upload-flow step-\${episodeWizardStep}\`} onSubmit={addEpisode}>
          <section className="upload-step upload-step-1">
            <div className="upload-step-copy"><span>01</span><div><h4>Choose the series</h4><p>Tell EBG+ where this episode belongs.</p></div></div>
            <div className="upload-step-fields">
              <label>Series<select name="showId" required>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>
              <label>Season<input name="season" type="number" min="1" defaultValue="1" required /></label>
              <label>Episode Number<input name="number" type="number" min="1" defaultValue="1" required /></label>
            </div>
          </section>

          <section className="upload-step upload-step-2">
            <div className="upload-step-copy"><span>02</span><div><h4>Episode details</h4><p>Add the title and information viewers will see on the episode page.</p></div></div>
            <div className="upload-step-fields">
              <label>Episode Title<input name="title" required /></label>
              <label>Runtime<input name="runtime" placeholder="47m" required /></label>
              <label className="full">Synopsis<textarea name="synopsis" required /></label>
            </div>
          </section>

          <section className="upload-step upload-step-3">
            <div className="upload-step-copy"><span>03</span><div><h4>Upload media</h4><p>Add the episode video and thumbnail. You can replace or delete them later.</p></div></div>
            <div className="upload-step-fields">
              <label>Episode Video<input name="videoFile" type="file" accept="video/*" /></label>
              <label>Or Video URL<input name="videoUrl" type="url" /></label>
              <label>Thumbnail<input name="thumbnailFile" type="file" accept="image/*" /></label>
              <label>Or Thumbnail URL<input name="thumbnailUrl" type="url" /></label>
            </div>
          </section>

          <section className="upload-step upload-step-4">
            <div className="upload-step-copy"><span>04</span><div><h4>Release & publish</h4><p>Choose when the episode should appear, then save a draft, schedule it, or publish now.</p></div></div>
            <div className="upload-step-fields">
              <label>Release Date & Time<input name="releaseAt" type="datetime-local" /></label>
            </div>
            <div className="episode-publish-actions studio-flow-publish-actions"><button className="btn muted" type="submit" value="draft" disabled={busy}>{busy ? 'Working…' : 'Save Draft'}</button><button className="btn muted" type="submit" value="scheduled" disabled={busy}>{busy ? 'Working…' : 'Schedule'}</button><button className="btn" type="submit" value="live" disabled={busy}>{busy ? 'Working…' : 'Publish Now'}</button></div>
          </section>

          <div className="studio-upload-nav">
            <button className="btn muted" type="button" disabled={episodeWizardStep === 1 || busy} onClick={() => setEpisodeWizardStep((step) => Math.max(1, step - 1))}>Back</button>
            {episodeWizardStep < 4 && <button className="btn" type="button" disabled={busy} onClick={() => setEpisodeWizardStep((step) => Math.min(4, step + 1))}>Continue</button>}
          </div>
        </form>`

const nextStudio = studio.replace(episodeFormPattern, episodeFlow)
if (nextStudio === studio) throw new Error('Phase 1.29 patch failed: episode upload flow')
studio = nextStudio

studio = studio.replace(
  /formEl\.reset\(\)\n\s*setState\(action === 'live'/,
  "formEl.reset()\n      setEpisodeWizardStep(1)\n      setState(action === 'live'",
)

source = source.slice(0, studioStart) + studio + source.slice(studioEnd)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.29 Studio workspace redesign and episode upload flow.')
