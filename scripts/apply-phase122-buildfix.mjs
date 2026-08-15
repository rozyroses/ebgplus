import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

const next = source.replace(
  /\n\s*const postNotification = \(event: FormEvent<HTMLFormElement>\) => \{[\s\S]*?\n\s*\}\n\n\s*const visibleCasting/,
  '\n\n  const visibleCasting',
)

if (next === source) {
  throw new Error('Phase 1.22 build fix could not find the legacy postNotification helper.')
}

fs.writeFileSync(path, next)
console.log('Removed legacy postNotification helper after Notifications 2.0 migration.')
