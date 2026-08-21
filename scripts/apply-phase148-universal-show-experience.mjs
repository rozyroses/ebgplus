import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

if (!source.includes('// EBG_PHASE148_UNIVERSAL_SHOW_EXPERIENCE')) {
  const genericBranch = /\n  if \(show\.id !== 'heartspell-house'\) \{[\s\S]*?\n  \}\n\n  const seasons =/
  if (!genericBranch.test(source)) throw new Error('Phase 1.48 patch failed: generic show branch not found')
  source = source.replace(genericBranch, '\n\n  const seasons =')

  const replacements = [
    ["    <main className=\"page show-page heartspell-page\">", "    <main className=\"page show-page heartspell-page universal-show-page\">"],
    ["          <p className=\"heartspell-kicker\">EBG+ Original · Reality & Romance</p>", "          <p className=\"heartspell-kicker\">{show.category || 'EBG+'}</p>"],
    ["{show.logoImage ? <img className=\"show-logo-image\" src={show.logoImage} alt=\"Heartspell House\" /> : <h1 className=\"heartspell-title\">Heartspell House</h1>}", "{show.logoImage ? <img className=\"show-logo-image\" src={show.logoImage} alt={`${show.title} logo`} /> : <h1 className=\"heartspell-title\">{show.logo || show.title}</h1>}"],
    ["<div><p className=\"heartspell-kicker\">Inside the house</p><h2>Episodes</h2></div>", "<div><p className=\"heartspell-kicker\">Watch now</p><h2>Episodes</h2></div>"],
    ["<div className=\"heartspell-section-head\"><div><p className=\"heartspell-kicker\">Meet the singles</p><h2>Cast</h2></div><p>{show.cast.length} people inside the house</p></div>", "<div className=\"heartspell-section-head\"><div><p className=\"heartspell-kicker\">Meet the cast</p><h2>Cast</h2></div><p>{show.cast.length} cast member{show.cast.length === 1 ? '' : 's'}</p></div>"],
    ["<Link to={`/app/shows/heartspell-house/cast/${index}`}>Meet {person.name.split(' ')[0]} →</Link>", "<Link to={`/app/shows/${show.id}/cast/${index}`}>Meet {person.name.split(' ')[0]} →</Link>"],
    ["<div className=\"panel\"><h3>Cast reveal coming soon.</h3><p>Heartspell House cast profiles will appear here as EBG announces them.</p></div>", "<div className=\"panel\"><h3>Cast details coming soon.</h3><p>Cast profiles will appear here when they’re added in EBG Studio.</p></div>"],
    ["<h2>Fan voting is coming to the House.</h2>", "<h2>More ways to engage are coming.</h2>"],
    ["<p>Future Heartspell polls will let viewers weigh in on connections, favorite moments, and show decisions while keeping results controlled by EBG Studio.</p>", "<p>Future polls and interactive moments can appear here when they’re enabled for this title in EBG Studio.</p>"],
    ["{newestReleased && <section className=\"heartspell-section\"><p className=\"heartspell-kicker\">Latest from Heartspell</p><h2>{newestReleased.title}</h2><p>{newestReleased.synopsis}</p></section>}", "{newestReleased && <section className=\"heartspell-section\"><p className=\"heartspell-kicker\">Latest from {show.title}</p><h2>{newestReleased.title}</h2><p>{newestReleased.synopsis}</p></section>}"],
    ["  if (!show || !person || show.id !== 'heartspell-house') return <NotFoundPage />", "  if (!show || !person) return <NotFoundPage />"],
    ["    <main className=\"page heartspell-page heartspell-cast-profile\">", "    <main className=\"page heartspell-page heartspell-cast-profile universal-show-page\">"],
    ["      <Link to=\"/app/shows/heartspell-house\">← Back to Heartspell House</Link>", "      <Link to={`/app/shows/${show.id}`}>← Back to {show.title}</Link>"],
    ["          <p className=\"heartspell-kicker\">Heartspell House · {person.role}</p>", "          <p className=\"heartspell-kicker\">{show.title}{person.role ? ` · ${person.role}` : ''}</p>"],
  ]

  for (const [from, to] of replacements) {
    if (!source.includes(from)) throw new Error(`Phase 1.48 patch failed: expected show template fragment missing: ${from.slice(0, 52)}`)
    source = source.replace(from, to)
  }

  source = source.replace('function ShowPage({', '// EBG_PHASE148_UNIVERSAL_SHOW_EXPERIENCE\nfunction ShowPage({')
  fs.writeFileSync(path, source)
  console.log('Applied EBG+ Phase 1.48 universal show and movie experience.')
}
