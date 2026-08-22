import fs from 'node:fs'

const appPath=new URL('../studio/src/App.tsx',import.meta.url)
const mainPath=new URL('../studio/src/main.tsx',import.meta.url)
let source=fs.readFileSync(appPath,'utf8')
let main=fs.readFileSync(mainPath,'utf8')
if(!main.includes("./studioInbox.css")){main+="\nimport './studioInbox.css'\n";fs.writeFileSync(mainPath,main)}
if(source.includes('// EBG_STUDIO_PHASE161_INBOX'))process.exit(0)
const must=(pattern,replacement,label)=>{const next=source.replace(pattern,replacement);if(next===source)throw new Error(`Studio Phase 1.61 patch failed: ${label}`);source=next}
must("import FormsNetworkWorkspace from './FormsNetworkWorkspace'","import FormsNetworkWorkspace from './FormsNetworkWorkspace'\nimport StudioInbox from './StudioInbox'\n\n// EBG_STUDIO_PHASE161_INBOX",'inbox import')
must("type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'forms' | 'polls' | 'media' | 'news' | 'notifications' | 'team'","type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'forms' | 'inbox' | 'polls' | 'media' | 'news' | 'notifications' | 'team'",'inbox tab type')
must("  { id: 'forms', label: 'Forms', icon: '▤' },\n  { id: 'polls', label: 'Polls & Voting', icon: '◉' },","  { id: 'forms', label: 'Forms', icon: '▤' },\n  { id: 'inbox', label: 'Inbox', icon: '✉' },\n  { id: 'polls', label: 'Polls & Voting', icon: '◉' },",'inbox tab')
must("          {tab === 'forms' && <FormsNetworkWorkspace />}","          {tab === 'forms' && <FormsNetworkWorkspace />}\n\n          {tab === 'inbox' && <StudioInbox />}",'inbox workspace')
fs.writeFileSync(appPath,source)
console.log('Applied Studio Phase 1.61 applicant Inbox workspace.')
