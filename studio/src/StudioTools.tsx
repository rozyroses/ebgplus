import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
const lazyTools = {
  team: lazy(() => import('./TeamAccessPanel')),
  lumi: lazy(() => import('./StudioLumi')),
  series: lazy(() => import('./StudioSeriesManagerV2')),
  episodes: lazy(() => import('./StudioEpisodesManagerV2')),
  talent: lazy(() => import('./StudioCastTalentManagerV2')),
  music: lazy(() => import('./StudioMusicManagerV1')),
} as const

type LazyToolKey = keyof typeof lazyTools

export default function StudioLazyTools() {
  const readHash = () => window.location.hash.replace(/^#\/?/, '') as LazyToolKey
  const [active, setActive] = useState<LazyToolKey>(readHash)

  useEffect(() => {
    const sync = () => setActive(readHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const Component = useMemo(() => lazyTools[active], [active])
  if (!Component) return null

  return (
    <Suspense fallback={<div className="studio-tool-loading">Opening {active}…</div>}>
      <Component />
      {active === 'music' && (
        <Suspense fallback={null}>
          <LazyMusicLyrics />
        </Suspense>
      )}
    </Suspense>
  )
}

const LazyMusicLyrics = lazy(() => import('./StudioMusicLyricsV2'))

