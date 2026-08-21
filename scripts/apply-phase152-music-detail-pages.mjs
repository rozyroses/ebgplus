import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE152_MUSIC_DETAIL_PAGES')) process.exit(0)

const musicStart = source.indexOf('// EBG_PHASE151_MUSIC_CATALOG\nfunction MusicPage(')
if (musicStart < 0) throw new Error('Phase 1.52 patch failed: Phase 1.51 MusicPage not found')
const musicEnd = source.indexOf('\nfunction ', musicStart + 1)
if (musicEnd < 0) throw new Error('Phase 1.52 patch failed: MusicPage boundary not found')

const pages = `// EBG_PHASE152_MUSIC_DETAIL_PAGES
function MusicPage({ cms }: { cms: CmsData }) {
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const now = Date.now()
  const isPublished = (status?: string, releaseDate?: string) => status === 'live' || (status === 'scheduled' && !!releaseDate && new Date(releaseDate).getTime() <= now)
  const releases = (music.releases ?? []).filter((release: any) => isPublished(release.publishStatus, release.releaseDate))
  const videos = (music.videos ?? []).filter((video: any) => isPublished(video.publishStatus, video.releaseDate))
  const publishedReleaseIds = new Set(releases.map((release: any) => release.id))
  const tracks = (music.tracks ?? []).filter((track: any) => !track.releaseId || publishedReleaseIds.has(track.releaseId))
  const artists = music.artists ?? []
  const artistName = (artistId: string) => artists.find((artist: any) => artist.id === artistId)?.name ?? 'EBG Artist'
  const featured = releases.find((release: any) => release.id === music.featuredReleaseId) ?? releases[0]
  const featuredTracks = featured ? tracks.filter((track: any) => track.releaseId === featured.id).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)) : []

  return (
    <main className="page music-v2-page">
      {featured && (
        <section className="music-v2-hero">
          <Link className="music-v2-cover music-v2-cover-link" to={'/app/music/release/' + featured.id}>{featured.cover ? <img src={featured.cover} alt={featured.title + ' cover'} /> : <span>♫</span>}</Link>
          <div className="music-v2-hero-copy">
            <p className="eyebrow">FEATURED {String(featured.type || 'release').toUpperCase()}</p>
            <h1><Link to={'/app/music/release/' + featured.id}>{featured.title}</Link></h1>
            <p className="music-v2-artist"><Link to={'/app/music/artist/' + featured.artistId}>{artistName(featured.artistId)}</Link></p>
            <p>{featured.genre || 'Music'}{featured.releaseDate ? ' · ' + new Date(featured.releaseDate).getFullYear() : ''}{featured.explicit ? ' · Explicit' : ''}</p>
            {featuredTracks[0]?.audioUrl && <audio controls preload="metadata" src={featuredTracks[0].audioUrl} />}
          </div>
        </section>
      )}

      <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">MUSIC ON EBG+</p><h2>New Releases</h2></div><span>{releases.length} live</span></div>
        {releases.length ? <div className="music-v2-release-grid">{releases.map((release: any) => (
          <Link className="music-v2-release-card" key={release.id} to={'/app/music/release/' + release.id}>
            <div>{release.cover ? <img src={release.cover} alt="" /> : <span>♫</span>}</div>
            <h3>{release.title}</h3>
            <p>{artistName(release.artistId)}</p>
            <small>{String(release.type || 'release').toUpperCase()} · {release.genre || 'Music'}{release.explicit ? ' · E' : ''}</small>
          </Link>
        ))}</div> : <div className="music-v2-empty"><h3>No live releases yet.</h3><p>Music marked Live in EBG Studio will appear here.</p></div>}
      </section>

      {tracks.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">LISTEN NOW</p><h2>Songs</h2></div></div>
        <div className="music-v2-track-list">{tracks.map((track: any) => (
          <article key={track.id}>
            <div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small><Link to={'/app/music/artist/' + track.artistId}>{artistName(track.artistId)}</Link></small></div></div>
            {track.audioUrl && <audio controls preload="none" src={track.audioUrl} />}
          </article>
        ))}</div>
      </section>}

      {videos.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div>
        <div className="music-v2-video-grid">{videos.map((video: any) => (
          <article key={video.id}>
            <video controls preload="metadata" poster={video.thumbnail || undefined} src={video.videoUrl} />
            <h3>{video.title}</h3><p><Link to={'/app/music/artist/' + video.artistId}>{artistName(video.artistId)}</Link></p>
          </article>
        ))}</div>
      </section>}

      {artists.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">EBG ARTISTS</p><h2>Artists</h2></div></div>
        <div className="music-v2-artist-grid">{artists.map((artist: any) => (
          <Link key={artist.id} to={'/app/music/artist/' + artist.id}><article><div>{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name?.slice(0,1) || '♫'}</span>}</div><h3>{artist.name}</h3>{artist.bio && <p>{artist.bio}</p>}</article></Link>
        ))}</div>
      </section>}
    </main>
  )
}

function MusicArtistPage({ cms }: { cms: CmsData }) {
  const { artistId } = useParams()
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const artist = (music.artists ?? []).find((item: any) => item.id === artistId)
  if (!artist) return <NotFoundPage />
  const now = Date.now()
  const isPublished = (status?: string, releaseDate?: string) => status === 'live' || (status === 'scheduled' && !!releaseDate && new Date(releaseDate).getTime() <= now)
  const releases = (music.releases ?? []).filter((release: any) => release.artistId === artist.id && isPublished(release.publishStatus, release.releaseDate))
  const releaseIds = new Set(releases.map((release: any) => release.id))
  const tracks = (music.tracks ?? []).filter((track: any) => track.artistId === artist.id && (!track.releaseId || releaseIds.has(track.releaseId))).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
  const videos = (music.videos ?? []).filter((video: any) => video.artistId === artist.id && isPublished(video.publishStatus, video.releaseDate))

  return (
    <main className="page music-detail-page">
      <Link className="music-detail-back" to="/app/music">← Music</Link>
      <section className="music-artist-hero">
        <div className="music-artist-avatar">{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name?.slice(0,1) || '♫'}</span>}</div>
        <div><p className="eyebrow">ARTIST</p><h1>{artist.name}</h1>{artist.label && <p className="music-detail-muted">{artist.label}</p>}{artist.bio && <p className="music-artist-bio">{artist.bio}</p>}</div>
      </section>

      <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">DISCOGRAPHY</p><h2>Albums & Singles</h2></div><span>{releases.length}</span></div>
        {releases.length ? <div className="music-v2-release-grid">{releases.map((release: any) => (
          <Link className="music-v2-release-card" key={release.id} to={'/app/music/release/' + release.id}><div>{release.cover ? <img src={release.cover} alt="" /> : <span>♫</span>}</div><h3>{release.title}</h3><p>{String(release.type || 'release').toUpperCase()}</p><small>{release.genre || 'Music'}{release.releaseDate ? ' · ' + new Date(release.releaseDate).getFullYear() : ''}</small></Link>
        ))}</div> : <div className="music-v2-empty"><h3>No live releases yet.</h3></div>}
      </section>

      {tracks.length > 0 && <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">CATALOG</p><h2>Songs</h2></div></div><div className="music-v2-track-list">{tracks.map((track: any) => <article key={track.id}><div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{track.duration || 'EBG+'}</small></div></div>{track.audioUrl && <audio controls preload="none" src={track.audioUrl} />}</article>)}</div></section>}

      {videos.length > 0 && <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div><div className="music-v2-video-grid">{videos.map((video: any) => <article key={video.id}><video controls preload="metadata" poster={video.thumbnail || undefined} src={video.videoUrl} /><h3>{video.title}</h3></article>)}</div></section>}
    </main>
  )
}

function MusicReleasePage({ cms }: { cms: CmsData }) {
  const { releaseId } = useParams()
  const music = cms.music ?? { artists: [], releases: [], tracks: [], videos: [] }
  const release = (music.releases ?? []).find((item: any) => item.id === releaseId)
  if (!release) return <NotFoundPage />
  const now = Date.now()
  const published = release.publishStatus === 'live' || (release.publishStatus === 'scheduled' && !!release.releaseDate && new Date(release.releaseDate).getTime() <= now)
  if (!published) return <NotFoundPage />
  const artist = (music.artists ?? []).find((item: any) => item.id === release.artistId)
  const tracks = (music.tracks ?? []).filter((track: any) => track.releaseId === release.id).sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))

  return (
    <main className="page music-detail-page">
      <Link className="music-detail-back" to="/app/music">← Music</Link>
      <section className="music-release-hero">
        <div className="music-release-art">{release.cover ? <img src={release.cover} alt={release.title + ' cover'} /> : <span>♫</span>}</div>
        <div className="music-release-info"><p className="eyebrow">{String(release.type || 'release').toUpperCase()}</p><h1>{release.title}</h1>{artist && <h2><Link to={'/app/music/artist/' + artist.id}>{artist.name}</Link></h2>}<p className="music-detail-muted">{release.genre || 'Music'}{release.releaseDate ? ' · ' + new Date(release.releaseDate).getFullYear() : ''}{release.explicit ? ' · Explicit' : ''}</p><p>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</p></div>
      </section>

      <section className="music-v2-section"><div className="music-v2-section-head"><div><p className="eyebrow">TRACKLIST</p><h2>{release.title}</h2></div></div>{tracks.length ? <div className="music-v2-track-list">{tracks.map((track: any) => <article key={track.id}><div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{track.duration || (artist?.name ?? 'EBG+')}</small></div></div>{track.audioUrl && <audio controls preload="none" src={track.audioUrl} />}</article>)}</div> : <div className="music-v2-empty"><h3>No tracks attached to this release yet.</h3></div>}</section>
    </main>
  )
}`

source = source.slice(0, musicStart) + pages + '\n' + source.slice(musicEnd)

const routeAnchor = '<Route path="music" element={<MusicPage cms={cms} />} />'
if (!source.includes(routeAnchor)) throw new Error('Phase 1.52 patch failed: Music route not found')
source = source.replace(routeAnchor, routeAnchor + '\n        <Route path="music/artist/:artistId" element={<MusicArtistPage cms={cms} />} />\n        <Route path="music/release/:releaseId" element={<MusicReleasePage cms={cms} />} />')

if (!source.includes("import './phase152-music-detail-pages.css'")) {
  const cssImports = [...source.matchAll(/^import ['"]\.\/[^'"]+\.css['"]$/gm)]
  const lastCss = cssImports.at(-1)
  if (!lastCss || lastCss.index == null) throw new Error('Phase 1.52 patch failed: CSS import anchor not found')
  const insertAt = lastCss.index + lastCss[0].length
  source = source.slice(0, insertAt) + "\nimport './phase152-music-detail-pages.css'" + source.slice(insertAt)
}

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.52 artist and release pages.')
