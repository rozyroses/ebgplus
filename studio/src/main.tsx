import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import TeamAccessPanel from './TeamAccessPanel'
import './styles.css'
import './teamAccess.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TeamAccessPanel />
  </StrictMode>,
)
