import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

export default function RootLayout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet /> {/* Aquí se renderizarán los componentes de página */}
      </main>
    </div>
  )
}
