import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ImpersonationBanner from './components/ImpersonationBanner.tsx'
import SystemBanner from './components/SystemBanner.tsx'
import { useEffect } from 'react'

function Root() {
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        // TODO: open command palette
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <SystemBanner />
      <ImpersonationBanner />
      <Root />
    </>
  </StrictMode>,
)
