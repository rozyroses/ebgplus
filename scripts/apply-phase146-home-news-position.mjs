import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (source.includes('// EBG_PHASE146_HOME_NEWS_POSITION')) process.exit(0)

const marker = 'What’s happening on EBG+'
const markerIndex = source.indexOf(marker)
if (markerIndex < 0) throw new Error('Phase 1.46 patch failed: homepage news section not found')

const sectionStart = source.lastIndexOf('<section className="home-section">', markerIndex)
if (sectionStart < 0) throw new Error('Phase 1.46 patch failed: homepage news section start not found')

const sectionClose = '</section>'
const sectionEndIndex = source.indexOf(sectionClose, markerIndex)
if (sectionEndIndex < 0) throw new Error('Phase 1.46 patch failed: homepage news section end not found')

const sectionEnd = sectionEndIndex + sectionClose.length
const block = source.slice(sectionStart, sectionEnd)
source = source.slice(0, sectionStart) + source.slice(sectionEnd)

const contentCardIndex = source.indexOf('\nfunction ContentCard')
if (contentCardIndex < 0) throw new Error('Phase 1.46 patch failed: ContentCard boundary not found')

const homeMainClose = source.lastIndexOf('    </main>', contentCardIndex)
if (homeMainClose < 0) throw new Error('Phase 1.46 patch failed: homepage closing main not found')

const movedBlock = `\n\n      {/* EBG_PHASE146_HOME_NEWS_POSITION */}\n      ${block.trimStart()}`
source = source.slice(0, homeMainClose) + movedBlock + '\n' + source.slice(homeMainClose)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.46 homepage news placement.')
