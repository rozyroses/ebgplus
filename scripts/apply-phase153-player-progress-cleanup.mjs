import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

const watchStart = source.indexOf('function WatchPage(')
if (watchStart < 0) throw new Error('Phase 1.53 cleanup failed: WatchPage not found')
const watchEnd = source.indexOf('\nfunction ', watchStart + 'function WatchPage('.length)
if (watchEnd < 0) throw new Error('Phase 1.53 cleanup failed: WatchPage boundary not found')

let watchBlock = source.slice(watchStart, watchEnd)
watchBlock = watchBlock.replace(/\n  const lastSavedSeconds = useRef\(0\)\n\n  useEffect\(\(\) => \{[\s\S]*?\n  \}, \[episode\?\.id\]\)\n/, '\n')
watchBlock = watchBlock.replace(/\n  const persistProgress = \(seconds: number, force = false\) => \{[\s\S]*?\n  \}\n/, '\n')

if (watchBlock.includes('persistProgress')) {
  throw new Error('Phase 1.53 cleanup failed: persistProgress is still present')
}

source = source.slice(0, watchStart) + watchBlock + source.slice(watchEnd)
fs.writeFileSync(appPath, source)
console.log('Removed obsolete Phase 1.6 playback helper after EBG+ player upgrade.')
