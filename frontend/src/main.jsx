import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { RouterProvider } from 'react-router-dom'
import { router } from './utils/routes.jsx'
import Navbar from './components/Navbar.jsx'
import { ProviderContextComponent } from './ContextStore/Provider.jsx'

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
})
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline />
      <ProviderContextComponent>
        <RouterProvider router={router} />
      </ProviderContextComponent>
    </ThemeProvider>
  </StrictMode>
)
