import fs from 'node:fs'

const appPath = new URL('../studio/src/App.tsx', import.meta.url)
const mainPath = new URL('../studio/src/main.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')
let main = fs.readFileSync(mainPath, 'utf8')

if (!main.includes("./studioV3.css")) {
  main += "\nimport './studioV3.css'\n"
  fs.writeFileSync(mainPath, main)
}

if (source.includes('// EBG_STUDIO_V3_SHELL')) process.exit(0)

const parseAnchor = `const parseTab = (): StudioTab => {
  const value = window.location.hash.replace(/^#\\/?/, '') as StudioTab
  return TABS.some((tab) => tab.id === value) ? value : 'overview'
}`

if (!source.includes(parseAnchor)) throw new Error('Studio V3 shell failed: parseTab anchor not found')

const shellHelpers = `${parseAnchor}

// EBG_STUDIO_V3_SHELL
type StudioWorkspaceId = 'overview' | 'content' | 'audience' | 'tools'
type StudioTool = StudioTab | 'forms' | 'inbox' | 'music' | 'news' | 'lumi'

const TOOL_LABELS: Record<string, string> = {
  overview: 'Overview',
  series: 'Series',
  episodes: 'Episodes',
  media: 'Media',
  music: 'Music',
  talent: 'Cast & Talent',
  casting: 'Casting',
  forms: 'Forms',
  inbox: 'Inbox',
  polls: 'Polls & Voting',
  notifications: 'Notifications',
  news: 'News',
  team: 'Team',
  lumi: 'Lumi',
}

const STUDIO_WORKSPACES: Array<{ id: StudioWorkspaceId; label: string; icon: string; copy: string; tools: StudioTool[] }> = [
  { id: 'overview', label: 'Overview', icon: '✦', copy: 'What needs your attention right now.', tools: ['overview'] },
  { id: 'content', label: 'Content', icon: '▤', copy: 'Shows, episodes, media, and music.', tools: ['series', 'episodes', 'media', 'music'] },
  { id: 'audience', label: 'Audience', icon: '◎', copy: 'Talent, casting, forms, messages, polls, and updates.', tools: ['talent', 'casting', 'forms', 'inbox', 'polls', 'notifications'] },
  { id: 'tools', label: 'Tools', icon: '⌘', copy: 'Newsroom, team access, and Lumi.', tools: ['news', 'team', 'lumi'] },
]

const readStudioTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('ebg.studio.theme.v1')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function StudioThemeToggle({ theme, onChange }: { theme: 'light' | 'dark'; onChange: (next: 'light' | 'dark') => void }) {
  const next = theme === 'light' ? 'dark' : 'light'
  return <button className="studio-theme-toggle" type="button" onClick={() => onChange(next)} aria-label={\`Switch to \${next} mode\`}>
    <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span><strong>{theme === 'light' ? 'Dark' : 'Light'}</strong>
  </button>
}`

source = source.replace(parseAnchor, shellHelpers)

const stateAnchor = `  const [tab, setTabState] = useState<StudioTab>(parseTab)`
if (!source.includes(stateAnchor)) throw new Error('Studio V3 shell failed: tab state anchor not found')
source = source.replace(stateAnchor, `${stateAnchor}
  const [activeTool, setActiveTool] = useState<StudioTool>(() => (window.location.hash.replace(/^#\\/?/, '') || 'overview') as StudioTool)
  const [theme, setTheme] = useState<'light' | 'dark'>(readStudioTheme)`)

const setTabBlock = `  const setTab = (next: StudioTab) => {
    window.location.hash = next
    setTabState(next)
  }`
if (!source.includes(setTabBlock)) throw new Error('Studio V3 shell failed: setTab block not found')
source = source.replace(setTabBlock, `  const setTab = (next: StudioTab) => {
    window.location.hash = next
    setTabState(next)
    setActiveTool(next)
  }

  const goToTool = (next: StudioTool) => {
    window.location.hash = next
    setActiveTool(next)
    if (TABS.some((item) => item.id === next)) setTabState(next as StudioTab)
    else setTabState('overview')
  }`)

const hashEffect = `  useEffect(() => {
    const sync = () => setTabState(parseTab())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])`
if (!source.includes(hashEffect)) throw new Error('Studio V3 shell failed: hash effect not found')
source = source.replace(hashEffect, `  useEffect(() => {
    const sync = () => {
      const raw = (window.location.hash.replace(/^#\\/?/, '') || 'overview') as StudioTool
      setActiveTool(raw)
      setTabState(parseTab())
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.studioTheme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('ebg.studio.theme.v1', theme)
  }, [theme])`)

const metricAnchor = `  const openCasting = casting.filter((app) => !['Cast', 'Declined', 'Removed'].includes(app.status)).length`
if (!source.includes(metricAnchor)) throw new Error('Studio V3 shell failed: metric anchor not found')
source = source.replace(metricAnchor, `${metricAnchor}
  const activeWorkspace = STUDIO_WORKSPACES.find((workspace) => workspace.tools.includes(activeTool)) ?? STUDIO_WORKSPACES[0]`)

const shellStart = source.indexOf('    <div className="studio-shell">')
const workspaceStart = source.indexOf('        <main className="workspace">', shellStart)
if (shellStart < 0 || workspaceStart < 0) throw new Error('Studio V3 shell failed: shell boundaries not found')

const newShell = `    <div className="studio-shell studio-v3-shell">
      <aside className="sidebar studio-compat-nav" aria-hidden="true">
        <nav>
          {TABS.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)}>{item.label}</button>)}
        </nav>
      </aside>

      <div className="studio-main">
        <header className="studio-v3-topbar">
          <button className="studio-v3-brand" type="button" onClick={() => goToTool('overview')}>
            <span>EBG+</span><strong>Studio</strong><em>3</em>
          </button>

          <nav className="studio-v3-workspaces" aria-label="Studio workspaces">
            {STUDIO_WORKSPACES.map((workspace) => (
              <button key={workspace.id} type="button" className={activeWorkspace.id === workspace.id ? 'active' : ''} onClick={() => goToTool(workspace.tools[0])}>
                <span>{workspace.icon}</span><strong>{workspace.label}</strong>
              </button>
            ))}
          </nav>

          <div className="studio-v3-actions">
            {cms.shows.length > 0 && <label className="studio-v3-production"><span>Production</span><select value={selectedShow?.id ?? ''} onChange={(event) => setShowId(event.target.value)}>{cms.shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}</select></label>}
            <StudioThemeToggle theme={theme} onChange={setTheme} />
            <a className="studio-v3-view" href="https://ebgplus.app" target="_blank" rel="noreferrer">View EBG+ ↗</a>
          </div>
        </header>

        <section className="studio-v3-context">
          <div>
            <p>EBG Studio / {activeWorkspace.label}</p>
            <h1>{TOOL_LABELS[activeTool] ?? activeWorkspace.label}</h1>
            <span>{activeWorkspace.copy}</span>
          </div>
          <nav className="studio-v3-tools" aria-label={activeWorkspace.label + " tools"}>
            {activeWorkspace.tools.map((tool) => <button key={tool} type="button" className={activeTool === tool ? 'active' : ''} onClick={() => goToTool(tool)}>{TOOL_LABELS[tool]}</button>)}
          </nav>
          <div className="studio-v3-account"><span>{authState.account.role}</span><strong>{authState.account.email}</strong><button type="button" onClick={() => void signOutNow()}>Sign out</button></div>
        </section>

        {message && <div className="message"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}

        <main className="workspace">`

source = source.slice(0, shellStart) + newShell + source.slice(workspaceStart + '        <main className="workspace">'.length)

source = source.replace(
  '<p className="eyebrow">PRODUCTION HQ</p><h2>Everything EBG+.<br />One control room.</h2><p>Publish releases, manage talent, review casting, and shape what viewers see.</p>',
  '<p className="eyebrow">YOUR STUDIO, SIMPLIFIED</p><h2>Create. Publish.<br />Keep it moving.</h2><p>Everything you need to run EBG+ — grouped into focused workspaces instead of a wall of tabs.</p>',
)

source = source.replace(
  '<section className="panel"><PanelHeading eyebrow="WORKSPACES" title="Where do you want to work?" /><div className="launch-grid">{TABS.filter((item) => item.id !== \'overview\' && (authState.account.role === \'founder\' || ![\'news\', \'notifications\'].includes(item.id))).map((item, index) => <button type="button" key={item.id} onClick={() => setTab(item.id)}><span>{String(index + 1).padStart(2, \'0\')}</span><strong>{item.label}</strong><b>→</b></button>)}</div></section>',
  '<section className="panel studio-v3-workspace-cards"><PanelHeading eyebrow="WORKSPACES" title="Jump back in" /><div className="launch-grid">{STUDIO_WORKSPACES.filter((workspace) => workspace.id !== \'overview\').map((workspace, index) => <button type="button" key={workspace.id} onClick={() => goToTool(workspace.tools[0])}><span>{String(index + 1).padStart(2, \'0\')}</span><strong>{workspace.label}</strong><small>{workspace.copy}</small><b>→</b></button>)}</div></section>',
)

fs.writeFileSync(appPath, source)
console.log('Applied standalone Studio 3 shell and theme controls.')
