import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE124_REFERENCE_HERO')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.24 patch failed: ${label}`)
  source = next
}

must(
  "import './phase123-casting-status-alerts.css'",
  "import './phase123-casting-status-alerts.css'\nimport './phase124-reference-hero.css'\n\n// EBG_PHASE124_REFERENCE_HERO",
  'styles import',
)

must(
  `          {hero.logoImage && <img className="home-hero-floating-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />}\n          <div className="overlay">`,
  `          <div className="overlay">`,
  'remove floating show logo',
)

must(
  `{!hero.logoImage && <h1>{hero.logo || hero.title}</h1>}`,
  `{hero.logoImage ? (\n              <img className="home-hero-title-logo" src={hero.logoImage} alt={\`\${hero.title} logo\`} />\n            ) : (\n              <h1>{hero.logo || hero.title}</h1>\n            )}`,
  'place show title art inside hero copy',
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.24 reference-style homepage hero.')
