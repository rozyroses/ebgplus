import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE156_TIMED_LYRICS')) process.exit(0)

const detailAnchor = `type EbgMusicTrackDetail = {
  src: string
  title: string
  artist: string
  artwork?: string
  lyrics?: string
}`
if (!source.includes(detailAnchor)) throw new Error('Phase 1.56 patch failed: music track detail type not found')
source = source.replace(detailAnchor, `// EBG_PHASE156_TIMED_LYRICS
type EbgTimedLyric = { start: number; end: number; text: string }
type EbgMusicTrackDetail = {
  src: string
  title: string
  artist: string
  artwork?: string
  lyrics?: string
  timedLyrics?: EbgTimedLyric[]
}`)

source = source.replace(
  `  artwork,
  lyrics,
}: {
  src: string
  title?: string
  artist?: string
  artwork?: string
  lyrics?: string
}) {`,
  `  artwork,
  lyrics,
  timedLyrics,
}: {
  src: string
  title?: string
  artist?: string
  artwork?: string
  lyrics?: string
  timedLyrics?: EbgTimedLyric[]
}) {`,
)
source = source.replace(
  `detail: { src, title, artist, artwork, lyrics },`,
  `detail: { src, title, artist, artwork, lyrics, timedLyrics },`,
)

source = source.replace(
  `lyrics={featuredTracks[0].lyrics || ''} />`,
  `lyrics={featuredTracks[0].lyrics || ''} timedLyrics={featuredTracks[0].timedLyrics || []} />`,
)
source = source.replaceAll(
  `lyrics={track.lyrics || ''} />`,
  `lyrics={track.lyrics || ''} timedLyrics={track.timedLyrics || []} />`,
)

const earlyReturn = `  if (!track) return null`
if (!source.includes(earlyReturn)) throw new Error('Phase 1.56 patch failed: music dock early return not found')
source = source.replace(earlyReturn, `  const timedLyrics = track?.timedLyrics ?? []
  const activeLyricIndex = timedLyrics.findIndex((line) => current >= line.start && current < line.end)

  useEffect(() => {
    if (!expanded || activeLyricIndex < 0) return
    const node = document.querySelector<HTMLElement>('[data-ebg-lyric-index="' + activeLyricIndex + '"]')
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeLyricIndex, expanded])

  if (!track) return null`)

const lyricsBlock = `            <section className="ebg-now-playing-lyrics">
              <span>LYRICS</span>
              {track.lyrics?.trim() ? <div>{track.lyrics}</div> : <p>Lyrics haven’t been added for this song yet.</p>}
            </section>`
if (!source.includes(lyricsBlock)) throw new Error('Phase 1.56 patch failed: lyrics panel not found')
source = source.replace(lyricsBlock, `            <section className="ebg-now-playing-lyrics ebg-synced-lyrics">
              <span>LYRICS</span>
              {timedLyrics.length ? (
                <div className="ebg-synced-lyrics-scroll">
                  {timedLyrics.map((line, index) => (
                    <button
                      type="button"
                      key={index + '-' + line.start}
                      data-ebg-lyric-index={index}
                      className={index === activeLyricIndex ? 'active' : index < activeLyricIndex ? 'past' : ''}
                      onClick={() => seek(line.start)}
                    >
                      {line.text}
                    </button>
                  ))}
                </div>
              ) : track.lyrics?.trim() ? <div className="ebg-plain-lyrics">{track.lyrics}</div> : <p>Lyrics haven’t been added for this song yet.</p>}
            </section>`)

if (!source.includes("import './phase156-timed-lyrics.css'")) {
  const cssImports = [...source.matchAll(/^import ['"]\.\/[^'"]+\.css['"]$/gm)]
  const lastCss = cssImports.at(-1)
  if (!lastCss || lastCss.index == null) throw new Error('Phase 1.56 patch failed: CSS import anchor not found')
  const insertAt = lastCss.index + lastCss[0].length
  source = source.slice(0, insertAt) + "\nimport './phase156-timed-lyrics.css'" + source.slice(insertAt)
}

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.56 synced timed lyrics.')
