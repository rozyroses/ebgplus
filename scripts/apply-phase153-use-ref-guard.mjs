import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

const match = source.match(/import\s*\{([^}]*)\}\s*from ['"]react['"]/)
if (!match) throw new Error('Phase 1.53 compile guard failed: React import not found')

const names = match[1]
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)

if (!names.includes('useRef')) {
  names.push('useRef')
  const replacement = `import { ${names.join(', ')} } from 'react'`
  source = source.replace(match[0], replacement)
  fs.writeFileSync(appPath, source)
  console.log('Applied Phase 1.53 useRef compile guard.')
}
