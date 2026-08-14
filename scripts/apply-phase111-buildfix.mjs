import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (!source.includes('const isEpisodeReleased =')) {
  const anchor = 'function WatchPage({' 
  if (!source.includes(anchor)) throw new Error('Phase 1.11 build fix could not find WatchPage.')
  source = source.replace(
    anchor,
    `const isEpisodeReleased = (episode: Episode) => {\n  const releaseAt = Date.parse(episode.releaseDate)\n  return Number.isNaN(releaseAt) || releaseAt <= Date.now()\n}\n\n${anchor}`,
  )
}

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.11 build fix.')
