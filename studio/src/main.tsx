import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import TeamAccessPanel from './TeamAccessPanel'
import StudioLumi from './StudioLumi'
import StudioSeriesManagerV2 from './StudioSeriesManagerV2'
import './styles.css'
import './teamAccess.css'
import './studioLumi.css'
import './lumiGlow.css'
import './studioSeriesManagerV2.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TeamAccessPanel />
    <StudioLumi />
    <StudioSeriesManagerV2 />
  </StrictMode>,
)
