import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './teamAccess.css'
import './studioLumi.css'
import './lumiGlow.css'
import './studioSeriesManagerV2.css'
import './studioEpisodesManagerV2.css'
import './studioCastTalentManagerV2.css'
import './studioBrandAssetDelete.css'
import './studioMusicManagerV1.css'
import './studioMusicLyricsV2.css'
import './studioFounderNews.css'
import './musicDistribution.css'
import './studioPublishingCenter.css'

const PublicMusicRelease = lazy(() => import('./PublicMusicRelease'))
function StudioRoot() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const sync = () => setHash(window.location.hash); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync) }, [])
  if (hash.startsWith('#listen/')) {
    let id = ''
    try { id = decodeURIComponent(hash.slice('#listen/'.length)) } catch { /* Unavailable release. */ }
    return <Suspense fallback={<main className="public-release">Loading release…</main>}><PublicMusicRelease id={id} /></Suspense>
  }
  return <App />
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudioRoot />
  </StrictMode>,
)
import './studioMobileV4.css'

import './studioV3.css'
import './musicPlayerShared.css'
import './musicRefresh.css'

import './studioFormsNetwork.css'

import './studioInbox.css'

import './studioWorkflow.css'
