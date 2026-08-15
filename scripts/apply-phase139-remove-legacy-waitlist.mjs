import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE139_REMOVE_LEGACY_WAITLIST')) process.exit(0)

source = source.replace(
  "import { getLaunchWaitlistStats, joinLaunchWaitlist, sendLaunchAnnouncement, unsubscribeLaunchWaitlist } from './lib/launchWaitlist'",
  "import { joinLaunchWaitlist, unsubscribeLaunchWaitlist } from './lib/launchWaitlist'",
)

const before = source
source = source.replace(/\nfunction LaunchWaitlistPanel\(\) \{[\s\S]*?\n\}\n\n(?=function LandingPage)/, '\n')
if (source === before) throw new Error('Phase 1.39 could not remove LaunchWaitlistPanel')

source = source.replace(
  "// EBG_PHASE138_STUDIO_HOME_CAROUSEL",
  "// EBG_PHASE138_STUDIO_HOME_CAROUSEL\n// EBG_PHASE139_REMOVE_LEGACY_WAITLIST",
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.39 legacy waitlist cleanup.')
