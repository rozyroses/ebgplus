import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

const route = '<Route path="/forms" element={<EbgFormsPage cms={cms} />} />'
if (!source.includes(route)) {
  throw new Error('EBG Forms redirect patch failed: /forms route not found')
}

const marker = 'function EbgFormsPage({ cms }: { cms: CmsData }) {'
if (!source.includes(marker)) {
  throw new Error('EBG Forms redirect patch failed: forms component marker not found')
}

if (!source.includes("window.location.replace('https://forms.ebgplus.app')")) {
  source = source.replace(
    marker,
    `${marker}\n  useEffect(() => {\n    window.location.replace('https://forms.ebgplus.app')\n  }, [])`,
  )
}

// Keep Casting in the Library menu, but remove the duplicate footer link.
source = source.replace(
  '<Link to="/app/casting">Casting</Link>',
  '<a href="https://forms.ebgplus.app">Casting</a>',
)
source = source.replace(
  '        <Link to="/app/casting">Casting</Link>\n        <Link to="/app/partnerships">Partnerships</Link>',
  '        <Link to="/app/partnerships">Partnerships</Link>',
)
source = source.replace(
  '        <a href="https://forms.ebgplus.app">Casting</a>\n        <Link to="/app/partnerships">Partnerships</Link>',
  '        <Link to="/app/partnerships">Partnerships</Link>',
)

fs.writeFileSync(path, source)
console.log('EBG Forms domain redirect applied; duplicate footer Casting link removed')
