import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (!source.includes('// EBG_PHASE150_EXTERNAL_STUDIO')) {
  const legacyLink = `<Link to="/app/studio">EBG Studio</Link>`
  const externalLink = `<a href="https://studio.ebgplus.app" target="_blank" rel="noreferrer">EBG Studio</a>`
  if (!source.includes(legacyLink)) throw new Error('Phase 1.50 patch failed: legacy Studio navigation link not found')
  source = source.replace(legacyLink, externalLink)

  const locationAnchor = `  const location = useLocation()`
  if (!source.includes(locationAnchor)) throw new Error('Phase 1.50 patch failed: AppLayout location anchor not found')
  source = source.replace(
    locationAnchor,
    `${locationAnchor}\n\n  useEffect(() => {\n    if (location.pathname === '/app/studio') {\n      window.location.replace('https://studio.ebgplus.app')\n    }\n  }, [location.pathname])`,
  )

  source = source.replace(
    'function AppLayout({',
    '// EBG_PHASE150_EXTERNAL_STUDIO\nfunction AppLayout({',
  )

  fs.writeFileSync(path, source)
  console.log('Applied EBG+ Phase 1.50 external Studio navigation and legacy redirect.')
}
