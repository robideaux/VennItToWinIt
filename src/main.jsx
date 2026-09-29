import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { readTheme, applyTheme, watchSystemTheme } from './utils/theme.js'

// Before render, not in an effect: applying it later means a frame of the wrong theme,
// and applying it only inside Settings meant the saved preference was ignored entirely
// until that screen was opened.
applyTheme(readTheme())
watchSystemTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
