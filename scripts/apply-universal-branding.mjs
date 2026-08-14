import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

source = source
  .replaceAll('/ebgplus/ebgplus-logo.png', '/ebgplus-logo.png')
  .replaceAll('/ebgplus-logo.svg', '/ebgplus-logo.png')

fs.writeFileSync(appPath, source)
console.log('Applied universal EBG+ branding with the original logo asset.')
