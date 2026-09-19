const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const missing = required.filter(name => !process.env[name]?.trim())
if (missing.length) {
  console.error(`Missing GitHub Actions repository variables: ${missing.join(', ')}. Set these in Settings > Secrets and variables > Actions > Variables.`)
  process.exit(1)
}
try {
  const url = new URL(process.env.VITE_SUPABASE_URL)
  if (url.protocol !== 'https:') throw new Error('HTTPS required')
} catch {
  console.error('VITE_SUPABASE_URL must be a valid HTTPS project URL.')
  process.exit(1)
}
console.log('Deployment configuration is present.')
