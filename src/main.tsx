import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SmoothScroll } from './components/animation/SmoothScroll.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SmoothScroll>
      <App />
    </SmoothScroll>
  </StrictMode>,
)
