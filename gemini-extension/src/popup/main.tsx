import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopUp from './PopUp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopUp />
  </StrictMode>,
)
