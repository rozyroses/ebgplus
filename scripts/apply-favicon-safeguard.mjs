import fs from 'node:fs'

const path = new URL('../index.html', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

source = source
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />')
  .replace(/<link rel="apple-touch-icon"[^>]*>/, '<link rel="apple-touch-icon" href="/favicon.svg" />')

if (!source.includes('href="/favicon.svg"')) {
  throw new Error('Favicon safeguard failed to lock /favicon.svg')
}

fs.writeFileSync(path, source)
console.log('Locked dedicated transparent EBG+ favicon.')
