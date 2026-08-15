import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE140_CAROUSEL_LOGO_VISIBILITY')) process.exit(0)

const needle = "import './phase138-studio-home-carousel.css'"
if (!source.includes(needle)) throw new Error('Phase 1.40 requires Phase 1.38 styles')

source = source.replace(
  needle,
  `${needle}\nimport './phase140-carousel-logo-visibility.css'\n\n// EBG_PHASE140_CAROUSEL_LOGO_VISIBILITY`,
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.40 carousel logo visibility fix.')
