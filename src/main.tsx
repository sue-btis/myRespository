import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/funnel-display'
import '@fontsource-variable/unbounded'
import '@fontsource-variable/doto'
import '@fontsource/michroma'
import './styles/tokens.css'
import './styles/base.css'
import './styles/rail.css'
import './styles/hero.css'
import './styles/work.css'
import './styles/about.css'
import './styles/close.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
