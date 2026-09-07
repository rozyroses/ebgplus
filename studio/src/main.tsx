import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import TeamAccessPanel from './TeamAccessPanel'
import StudioLumi from './StudioLumi'
import StudioSeriesManagerV2 from './StudioSeriesManagerV2'
import StudioEpisodesManagerV2 from './StudioEpisodesManagerV2'
import StudioCastTalentManagerV2 from './StudioCastTalentManagerV2'
import StudioBrandAssetDeleteControls from './StudioBrandAssetDeleteControls'
import StudioMusicManagerV1 from './StudioMusicManagerV1'
import StudioMusicLyricsV2 from './StudioMusicLyricsV2'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TeamAccessPanel />
    <StudioLumi />
    <StudioSeriesManagerV2 />
    <StudioEpisodesManagerV2 />
    <StudioCastTalentManagerV2 />
    <StudioBrandAssetDeleteControls />
    <StudioMusicManagerV1 />
    <StudioMusicLyricsV2 />
  </StrictMode>,
)



import './legacy.css'
import './redesign.css'
