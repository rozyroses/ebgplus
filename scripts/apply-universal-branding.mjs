import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

source = source
  .replaceAll('/ebgplus/ebgplus-logo.png', '/ebgplus-logo.svg')
  .replaceAll('/ebgplus-logo.png', '/ebgplus-logo.svg')

fs.writeFileSync(appPath, source)
console.log('Applied universal transparent EBG+ branding.')
