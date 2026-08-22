import fs from 'node:fs'

const appPath = new URL('../studio/src/App.tsx', import.meta.url)
const mainPath = new URL('../studio/src/main.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')
let main = fs.readFileSync(mainPath, 'utf8')

if (!main.includes("./studioFormsNetwork.css")) {
  main += "\nimport './studioFormsNetwork.css'\n"
  fs.writeFileSync(mainPath, main)
}
if (source.includes('// EBG_STUDIO_PHASE160_FORMS_NETWORK')) process.exit(0)
const must=(pattern,replacement,label)=>{const next=source.replace(pattern,replacement);if(next===source)throw new Error(`Studio Phase 1.60 patch failed: ${label}`);source=next}

must("import { db } from '../../src/lib/supabase'","import { db } from '../../src/lib/supabase'\nimport FormsNetworkWorkspace from './FormsNetworkWorkspace'\nimport { setVerifiedBadge } from './formsNetwork'\n\n// EBG_STUDIO_PHASE160_FORMS_NETWORK",'forms import')
must("type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'polls' | 'media' | 'news' | 'notifications' | 'team'","type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'forms' | 'polls' | 'media' | 'news' | 'notifications' | 'team'",'forms tab type')
must("  { id: 'casting', label: 'Casting', icon: '◇' },\n  { id: 'polls', label: 'Polls & Voting', icon: '◉' },","  { id: 'casting', label: 'Casting', icon: '◇' },\n  { id: 'forms', label: 'Forms', icon: '▤' },\n  { id: 'polls', label: 'Polls & Voting', icon: '◉' },",'forms tab')
must("type TeamAccount = {\n  id: string\n  email: string | null\n  role: string\n  created_at?: string\n}","type TeamAccount = {\n  id: string\n  email: string | null\n  role: string\n  verified_badge?: 'artist' | 'founder' | null\n  created_at?: string\n}",'team verification type')
must("          {tab === 'casting' && (","          {tab === 'forms' && <FormsNetworkWorkspace />}\n\n          {tab === 'casting' && (",'forms workspace')

const oldTeam=`          {tab === 'team' && (\n            <section className=\"panel\"><PanelHeading eyebrow=\"ACCESS\" title=\"EBG Studio team\" /><p className=\"muted-copy\">Roles are currently read from the shared EBG+ accounts table. Granular role permissions are the next backend migration.</p><div className=\"team-grid\">{team.filter((account) => STAFF_ROLES.has(account.role as StaffRole)).map((account) => <article key={account.id}><div className=\"avatar-fallback\">{account.email?.slice(0, 1).toUpperCase() ?? 'E'}</div><div><strong>{account.email ?? account.id}</strong><span>{account.role}</span></div></article>)}</div></section>\n          )}`
const newTeam=`          {tab === 'team' && (\n            <section className=\"panel\"><PanelHeading eyebrow=\"ACCESS & IDENTITY\" title=\"EBG Studio team\" /><p className=\"muted-copy\">Founders can assign official Artist or Founder verification. Founder accounts are verified automatically.</p><div className=\"team-grid\">{team.filter((account) => STAFF_ROLES.has(account.role as StaffRole) || account.verified_badge === 'artist').map((account) => <article key={account.id}><div className=\"avatar-fallback\">{account.email?.slice(0, 1).toUpperCase() ?? 'E'}</div><div><strong>{account.email ?? account.id} {account.verified_badge && <span className=\"verified-badge\" title={account.verified_badge + ' verified'}>✓</span>}</strong><span>{account.role}{account.verified_badge ? ' · ' + account.verified_badge + ' verified' : ''}</span>{authState.account.role === 'founder' && <select value={account.verified_badge ?? ''} onChange={(event) => { const badge=(event.target.value || null) as 'artist'|'founder'|null; void setVerifiedBadge(account.id,badge).then(refreshAuxiliary).then(()=>setMessage('Verification updated.')) }}><option value=\"\">Not verified</option><option value=\"artist\">Artist verified</option><option value=\"founder\">Founder verified</option></select>}</div></article>)}</div></section>\n          )}`
must(oldTeam,newTeam,'verified badges team controls')

fs.writeFileSync(appPath, source)
console.log('Applied Studio Phase 1.60 Forms Network and verification workspace.')
