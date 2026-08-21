import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import TeamAccessPanel from './TeamAccessPanel'
import StudioLumi from './StudioLumi'
import './styles.css'
import './teamAccess.css'
import './studioLumi.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TeamAccessPanel />
    <StudioLumi />
  </StrictMode>,
)
