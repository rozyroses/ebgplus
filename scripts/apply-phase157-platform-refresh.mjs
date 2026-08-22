import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE157_PLATFORM_REFRESH')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.57 patch failed: ${label}`)
  source = next
}

if (!source.includes("import './phase157-platform-refresh.css'")) {
  source = source.replace("import './App.css'", "import './App.css'\nimport './phase157-platform-refresh.css'\n\n// EBG_PHASE157_PLATFORM_REFRESH")
}

if (!source.includes('type NewsPost =')) {
  must(
    'type CmsData = {',
    `type NewsPost = {\n  id: string\n  headline: string\n  summary: string\n  body: string\n  category: string\n  author: string\n  image?: string\n  featured?: boolean\n  status: 'draft' | 'scheduled' | 'published'\n  publishedAt: string\n}\n\ntype CmsData = {`,
    'news type',
  )
}

if (!source.includes('news?: NewsPost[]')) {
  must('  comingSoon: string[]', '  comingSoon: string[]\n  news?: NewsPost[]', 'cms news field')
}

source = source.replace(
  `        <Route path="originals" element={<CategoryPage title="EBG Originals" copy="Flagship productions and exclusive stories from EBG." />} />`,
  `        <Route path="originals" element={<OriginalsPage cms={cms} />} />`,
)
source = source.replace(
  `        <Route path="universe" element={<UniversePage />} />`,
  `        <Route path="universe" element={<UniversePage cms={cms} />} />`,
)
source = source.replace(
  `        <Route path="news" element={<NewsPage />} />`,
  `        <Route path="news" element={<NewsPage cms={cms} />} />`,
)

if (!source.includes('const publishedNews = (cms.news ?? [])')) {
  source = source.replace(
    '  const previewShows = visibleShows.slice(0, 4)',
    `  const previewShows = visibleShows.slice(0, 4)\n  const publishedNews = (cms.news ?? [])\n    .filter((item) => item.status === 'published' && Date.parse(item.publishedAt) <= Date.now())\n    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))`,
  )
}

const foundersBlock = `<section className="public-founders-section founder-world-v3">
        <div className="public-section-heading compact">
          <p className="eyebrow">Inside the EBG Universe</p>
          <h2>Three creative forces. One universe that keeps expanding.</h2>
          <p>EBG+ is shaped by the individual worlds of Bijou Nicole, Empress V, and Goldie Songs — music, television, visual storytelling, live moments, personality, and original ideas that cross into one shared creative home.</p>
        </div>
        <div className="founder-world-grid">
          <article className="founder-world-card bijou-card">
            <div className="founder-world-number">01</div>
            <p className="eyebrow">BIJOU NICOLE</p>
            <h3>Pop fantasy, R&B emotion, and cinematic world-building.</h3>
            <p>Bijou's corner of EBG blends music, performance, fashion, romantic storytelling, and larger-than-life visual eras. Her projects move between intimate songwriting and theatrical concepts built to feel like complete worlds rather than standalone releases.</p>
            <p className="founder-world-detail">On EBG+ you'll find music, performance films, original programming, behind-the-scenes moments, and stories connected to the evolving Bijou universe.</p>
            <div className="founder-tags"><span>Music</span><span>Originals</span><span>Performance</span><span>Visual Worlds</span></div>
            <Link className="founder-link" to="/auth/sign-in">Enter Bijou's world →</Link>
          </article>
          <article className="founder-world-card empress-card">
            <div className="founder-world-number">02</div>
            <p className="eyebrow">EMPRESS V</p>
            <h3>Theatrical edge, bold emotion, and a world built for the stage.</h3>
            <p>Empress brings a dramatic, performance-first energy to EBG. Her creative world leans into strong visual identity, live storytelling, emotional contrast, and projects that feel equally at home in music, concert films, and character-driven entertainment.</p>
            <p className="founder-world-detail">Her EBG+ presence connects music releases, visual performances, collaborations, special programming, and the stories happening around her creative era.</p>
            <div className="founder-tags"><span>Music</span><span>Live</span><span>Storytelling</span><span>Collaborations</span></div>
            <Link className="founder-link" to="/auth/sign-in">Enter Empress V's world →</Link>
          </article>
          <article className="founder-world-card goldie-card">
            <div className="founder-world-number">03</div>
            <p className="eyebrow">GOLDIE SONGS</p>
            <h3>Soul, conversation, reflection, and artist-first storytelling.</h3>
            <p>Goldie's world brings warmth and perspective to EBG through soulful music, personal storytelling, thoughtful conversations, and creative projects centered on growth, identity, and the life surrounding the art itself.</p>
            <p className="founder-world-detail">Across EBG+ her world can expand through songs, interviews, documentaries, conversations, performances, and original concepts that let audiences know the person behind the music.</p>
            <div className="founder-tags"><span>Music</span><span>Conversations</span><span>Documentary</span><span>Artist Stories</span></div>
            <Link className="founder-link" to="/auth/sign-in">Enter Goldie's world →</Link>
          </article>
        </div>
      </section>

      {publishedNews.length > 0 && (
        <section className="public-news-strip">
          <div className="public-section-heading compact"><p className="eyebrow">Latest from EBG</p><h2>The universe moves fast.</h2><p>Announcements, releases, casting updates, creative news, and the stories happening around EBG.</p></div>
          <div className="public-news-grid">
            {publishedNews.slice(0, 3).map((item) => (
              <article key={item.id} className="public-news-card">
                {item.image && <img src={item.image} alt="" />}
                <div><span>{item.category}</span><h3>{item.headline}</h3><p>{item.summary}</p><small>{item.author} · {new Date(item.publishedAt).toLocaleDateString()}</small></div>
              </article>
            ))}
          </div>
        </section>
      )}`

if (source.includes('<section className="public-founders-section">')) {
  must(/<section className="public-founders-section">[\s\S]*?<\/section>/, foundersBlock, 'homepage founder world')
}

const originalsPage = `function OriginalsPage({ cms }: { cms: CmsData }) {
  const originals = cms.shows.filter((show) => show.category.toLowerCase().includes('original'))
  return (
    <main className="page originals-page-v2">
      <section className="universe-hero"><p className="eyebrow">EBG+ ORIGINALS</p><h1>Stories made inside the EBG universe.</h1><p>Reality, scripted concepts, music films, specials, experiments, and creator-led projects made for EBG+.</p></section>
      {originals.length ? <div className="originals-grid-v2">{originals.map((show) => <Link key={show.id} to={'/app/shows/' + show.id} className="original-card-v2"><div className="original-art" style={{ backgroundImage: 'url(' + show.artwork + ')' }}><span>{show.status}</span></div><div><p className="eyebrow">{show.category}</p><h2>{show.title}</h2><p>{show.description}</p><small>{show.genre} · {show.year} · {show.maturity}</small></div></Link>)}</div> : <section className="panel"><h2>More originals are being prepared.</h2><p>Projects marked as EBG+ Originals in Studio will appear here automatically.</p></section>}
    </main>
  )
}

function UniversePage({ cms }: { cms: CmsData }) {
  const universeShows = cms.shows.filter((show) => ['bijou', 'empress', 'goldie'].some((name) => (show.title + ' ' + show.category + ' ' + show.description).toLowerCase().includes(name)))
  return (
    <main className="page universe-page-v3">
      <section className="universe-hero"><p className="eyebrow">EBG UNIVERSE</p><h1>Music, people, shows, eras, and stories all connected.</h1><p>The EBG Universe is the living world around EBG+ — where artists, originals, relationships, collaborations, performances, releases, behind-the-scenes moments, and major creative eras connect.</p></section>
      <section className="universe-founders-panel"><div><p className="eyebrow">THE FOUNDERS' WORLDS</p><h2>Start with the people shaping the universe.</h2></div><div className="universe-founder-list"><article><strong>Bijou Nicole</strong><p>Pop and R&B storytelling, cinematic visual eras, performance, fashion, original programming, and a creative universe built around transformation and imagination.</p></article><article><strong>Empress V</strong><p>Dramatic live energy, theatrical visual storytelling, emotionally bold music, collaborations, and performance-led projects designed to feel larger than the screen.</p></article><article><strong>Goldie Songs</strong><p>Soulful music, reflection, conversations, documentary-minded storytelling, and artist stories centered on growth, honesty, and connection.</p></article></div></section>
      <section className="universe-map-grid"><article><span>01</span><h3>People</h3><p>Artists, cast, collaborators, creative partners, and personalities who move through EBG projects.</p></article><article><span>02</span><h3>Music & Eras</h3><p>Albums, singles, performances, visual eras, tours, and the stories surrounding each release.</p></article><article><span>03</span><h3>Originals</h3><p>Series, reality concepts, specials, films, and experiments created inside EBG.</p></article><article><span>04</span><h3>Relationships</h3><p>Creative partnerships, friendships, casts, collaborations, and recurring connections across projects.</p></article><article><span>05</span><h3>Timeline</h3><p>Major releases, premieres, announcements, tours, casting moments, and milestones as the universe grows.</p></article><article><span>06</span><h3>Places & Events</h3><p>Venues, cities, sets, travel, premieres, performances, and moments that become part of EBG history.</p></article></section>
      {universeShows.length > 0 && <section className="universe-projects"><div className="section-title"><p className="eyebrow">CONNECTED PROJECTS</p><h2>Explore the universe on EBG+</h2></div><div className="originals-grid-v2">{universeShows.slice(0, 8).map((show) => <Link key={show.id} to={'/app/shows/' + show.id} className="original-card-v2"><div className="original-art" style={{ backgroundImage: 'url(' + show.artwork + ')' }} /><div><h3>{show.title}</h3><p>{show.description}</p></div></Link>)}</div></section>}
    </main>
  )
}`

must(/function UniversePage\(\)[\s\S]*?\n}\n\nfunction NewsPage/, `${originalsPage}\n\nfunction NewsPage`, 'originals and universe pages')

const newsPage = `function NewsPage({ cms }: { cms: CmsData }) {
  const published = (cms.news ?? []).filter((item) => item.status === 'published' && Date.parse(item.publishedAt) <= Date.now()).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const featured = published.find((item) => item.featured) ?? published[0]
  const rest = featured ? published.filter((item) => item.id !== featured.id) : published
  return (
    <main className="page news-page-v2">
      <section className="universe-hero"><p className="eyebrow">EBG NEWS</p><h1>What's happening across EBG.</h1><p>Official announcements, releases, casting updates, premieres, artist news, platform updates, and stories from across the EBG universe.</p></section>
      {featured ? <><article className="news-lead">{featured.image && <img src={featured.image} alt="" />}<div><span>{featured.category}</span><h2>{featured.headline}</h2><p>{featured.summary}</p><small>By {featured.author} · {new Date(featured.publishedAt).toLocaleDateString()}</small><div className="news-body">{featured.body}</div></div></article><div className="news-grid-v2">{rest.map((item) => <article key={item.id}>{item.image && <img src={item.image} alt="" />}<span>{item.category}</span><h3>{item.headline}</h3><p>{item.summary}</p><small>By {item.author} · {new Date(item.publishedAt).toLocaleDateString()}</small></article>)}</div></> : <section className="panel"><p className="eyebrow">NEWSROOM</p><h2>No stories published yet.</h2><p>Founder-published stories from EBG Studio will appear here.</p></section>}
    </main>
  )
}`

must(/function NewsPage\([^)]*\)[\s\S]*?\n}\n\nfunction /, `${newsPage}\n\nfunction `, 'news page')

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.57 platform refresh.')
