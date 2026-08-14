import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './phase17-fixes.css'
import './phase17-force-fixes.css'
import './branding.css'
import SplashScreen from './components/SplashScreen.tsx'

function Root() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1500)
    return () => window.clearTimeout(timer)
  }, [])

  return showSplash ? <SplashScreen /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
