import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (!source.includes('// EBG_PHASE151_MUSIC_CATALOG')) {
  const cmsAnchor = '  comingSoon: string[]'
  if (!source.includes(cmsAnchor)) throw new Error('Phase 1.51 patch failed: CmsData anchor not found')
  source = source.replace(cmsAnchor, `${cmsAnchor}\n  music?: any`)

  const musicPage = `// EBG_PHASE151_MUSIC_CATALOG
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
          <div className="music-v2-cover">{featured.cover ? <img src={featured.cover} alt={`${featured.title} cover`} /> : <span>♫</span>}</div>
          <div className="music-v2-hero-copy">
            <p className="eyebrow">FEATURED {String(featured.type || 'release').toUpperCase()}</p>
            <h1>{featured.title}</h1>
            <p className="music-v2-artist">{artistName(featured.artistId)}</p>
            <p>{featured.genre || 'Music'}{featured.releaseDate ? ` · ${new Date(featured.releaseDate).getFullYear()}` : ''}{featured.explicit ? ' · Explicit' : ''}</p>
            {featuredTracks[0]?.audioUrl && <audio controls preload="metadata" src={featuredTracks[0].audioUrl} />}
          </div>
        </section>
      )}

      <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">MUSIC ON EBG+</p><h2>New Releases</h2></div><span>{releases.length} live</span></div>
        {releases.length ? <div className="music-v2-release-grid">{releases.map((release: any) => (
          <article className="music-v2-release-card" key={release.id}>
            <div>{release.cover ? <img src={release.cover} alt="" /> : <span>♫</span>}</div>
            <h3>{release.title}</h3>
            <p>{artistName(release.artistId)}</p>
            <small>{String(release.type || 'release').toUpperCase()} · {release.genre || 'Music'}{release.explicit ? ' · E' : ''}</small>
          </article>
        ))}</div> : <div className="music-v2-empty"><h3>No live releases yet.</h3><p>Music marked Live in EBG Studio will appear here.</p></div>}
      </section>

      {tracks.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">LISTEN NOW</p><h2>Songs</h2></div></div>
        <div className="music-v2-track-list">{tracks.map((track: any) => (
          <article key={track.id}>
            <div className="music-v2-track-meta"><span className="music-v2-track-number">{track.trackNumber || '•'}</span><div><strong>{track.title}{track.explicit ? ' ᴱ' : ''}</strong><small>{artistName(track.artistId)}</small></div></div>
            {track.audioUrl && <audio controls preload="none" src={track.audioUrl} />}
          </article>
        ))}</div>
      </section>}

      {videos.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">WATCH</p><h2>Music Videos</h2></div></div>
        <div className="music-v2-video-grid">{videos.map((video: any) => (
          <article key={video.id}>
            <video controls preload="metadata" poster={video.thumbnail || undefined} src={video.videoUrl} />
            <h3>{video.title}</h3><p>{artistName(video.artistId)}</p>
          </article>
        ))}</div>
      </section>}

      {artists.length > 0 && <section className="music-v2-section">
        <div className="music-v2-section-head"><div><p className="eyebrow">EBG ARTISTS</p><h2>Artists</h2></div></div>
        <div className="music-v2-artist-grid">{artists.map((artist: any) => (
          <article key={artist.id}><div>{artist.image ? <img src={artist.image} alt="" /> : <span>{artist.name?.slice(0,1) || '♫'}</span>}</div><h3>{artist.name}</h3>{artist.bio && <p>{artist.bio}</p>}</article>
        ))}</div>
      </section>}
    </main>
  )
}`

  const musicBoundary = /function MusicPage\([\s\S]*?\n\}\n\nfunction /
  if (!musicBoundary.test(source)) throw new Error('Phase 1.51 patch failed: Music page boundary not found')
  source = source.replace(musicBoundary, musicPage + '\n\nfunction ')

  const styleAnchor = "import './phase149-shows-catalog.css'"
  if (!source.includes(styleAnchor)) throw new Error('Phase 1.51 patch failed: stylesheet anchor not found')
  source = source.replace(styleAnchor, styleAnchor + "\nimport './phase151-music-catalog.css'")

  fs.writeFileSync(appPath, source)
  console.log('Applied EBG+ Phase 1.51 Music catalog publishing.')
}
