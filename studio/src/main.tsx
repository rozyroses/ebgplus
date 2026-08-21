import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import TeamAccessPanel from './TeamAccessPanel'
import StudioLumi from './StudioLumi'
import StudioSeriesManagerV2 from './StudioSeriesManagerV2'
import StudioEpisodesManagerV2 from './StudioEpisodesManagerV2'
import StudioCastTalentManagerV2 from './StudioCastTalentManagerV2'
import StudioBrandAssetDeleteControls from './StudioBrandAssetDeleteControls'
import './styles.css'
import './teamAccess.css'
import './studioLumi.css'
import './lumiGlow.css'
import './studioSeriesManagerV2.css'
import './studioEpisodesManagerV2.css'
import './studioCastTalentManagerV2.css'
import './studioBrandAssetDelete.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TeamAccessPanel />
    <StudioLumi />
    <StudioSeriesManagerV2 />
    <StudioEpisodesManagerV2 />
    <StudioCastTalentManagerV2 />
    <StudioBrandAssetDeleteControls />
  </StrictMode>,
)
