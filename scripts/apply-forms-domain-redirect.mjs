import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

const oldRoute = '<Route path="/forms" element={<EbgFormsPage cms={cms} />} />'
const newRoute = '<Route path="/forms" element={<EbgFormsDomainRedirect />} />'

if (!source.includes(oldRoute) && !source.includes(newRoute)) {
  throw new Error('EBG Forms redirect patch failed: /forms route not found')
}

source = source.replace(oldRoute, newRoute)

if (!source.includes('function EbgFormsDomainRedirect()')) {
  const marker = 'function EbgFormsPage({ cms }: { cms: CmsData }) {'
  if (!source.includes(marker)) {
    throw new Error('EBG Forms redirect patch failed: forms component marker not found')
  }

  const redirectComponent = `function EbgFormsDomainRedirect() {\n  useEffect(() => {\n    window.location.replace('https://forms.ebgplus.app')\n  }, [])\n\n  return (\n    <main className="forms-portal">\n      <div className="forms-shell">\n        <section className="forms-card">\n          <p className="forms-eyebrow">EBG Forms</p>\n          <h1>Opening casting…</h1>\n          <p>If you are not redirected automatically, <a href="https://forms.ebgplus.app">continue to EBG Forms</a>.</p>\n        </section>\n      </div>\n    </main>\n  )\n}\n\n`

  source = source.replace(marker, redirectComponent + marker)
}

fs.writeFileSync(path, source)
console.log('EBG Forms domain redirect applied')
