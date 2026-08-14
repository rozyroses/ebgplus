import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE117_STUDIO_POLISH')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.17 patch failed: ${label}`)
  source = next
}

must(
  "import './phase116-auth.css'",
  "import './phase116-auth.css'\nimport './phase117-studio-polish.css'\n\n// EBG_PHASE117_STUDIO_POLISH",
  'styles import',
)

must(
  `  banner?: string\n  logo: string`,
  `  banner?: string\n  bannerPosition?: string\n  logo: string`,
  'banner position field',
)

source = source.replace(
  `style={{ backgroundImage: \`url(\${hero.banner || hero.artwork})\` }}`,
  `style={{ backgroundImage: \`url(\${hero.banner || hero.artwork})\`, backgroundPosition: hero.bannerPosition || 'center center' }}`,
)

source = source.replace(
  `style={{ backgroundImage: \`url(\${show.banner || show.artwork})\` }}`,
  `style={{ backgroundImage: \`url(\${show.banner || show.artwork})\`, backgroundPosition: show.bannerPosition || 'center center' }}`,
)

const oldHomepage = `{tab === 'homepage' && <div><h3>Homepage placement</h3><p>{show.title} is {show.homeVisible===false?'hidden from':'visible on'} Home.</p><div className="actions"><button className="btn" type="button" onClick={()=>updateShow({homeVisible:show.homeVisible===false})}>{show.homeVisible===false?'Show on Home':'Hide from Home'}</button></div></div>}`

const newHomepage = `{tab === 'homepage' && <div className="studio-homepage-workspace"><div><h3>Homepage placement</h3><p>{show.title} is {show.homeVisible===false?'hidden from':'visible on'} Home.</p></div><div className="studio-banner-focal-preview" style={{ backgroundImage: \`url(\${show.banner || show.artwork})\`, backgroundPosition: show.bannerPosition || 'center center' }} /><p className="studio-banner-tip">This preview matches the wide homepage hero crop. Pick the focal point that keeps faces, titles, and important artwork inside the frame.</p><div className="studio-homepage-controls"><label>Banner focal point<select value={show.bannerPosition || 'center center'} onChange={(event)=>updateShow({bannerPosition:event.target.value})}><option value="center center">Center</option><option value="center top">Top</option><option value="center bottom">Bottom</option><option value="left center">Left</option><option value="right center">Right</option><option value="25% center">Left-center</option><option value="75% center">Right-center</option></select></label><div className="actions"><button className="btn" type="button" onClick={()=>updateShow({homeVisible:show.homeVisible===false})}>{show.homeVisible===false?'Show on Home':'Hide from Home'}</button></div></div></div>}`

must(oldHomepage, newHomepage, 'homepage banner framing controls')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.17 Studio workspace and banner framing polish.')
