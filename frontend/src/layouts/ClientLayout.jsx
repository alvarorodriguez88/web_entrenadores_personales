import { useState } from 'react'
import { Home, LayoutDashboard, Dumbbell } from 'lucide-react'
import Sidebar from '../components/shared/Sidebar'
import ModalCambiarContrasena from '../components/shared/ModalCambiarContrasena'

const clientNavItems = [
  { label: 'Inicio',         path: '/client/inicio',     icon: Home },
  { label: 'Análisis',      path: '/client/dashboard',  icon: LayoutDashboard },
  { label: 'Entrenamiento',  path: '/client/exercises',  icon: Dumbbell },
]

function ClientLayout({ children }) {
  const [modalAjustes, setModalAjustes] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={clientNavItems} onAjustesClick={() => setModalAjustes(true)} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
      <ModalCambiarContrasena isOpen={modalAjustes} onClose={() => setModalAjustes(false)} />
    </div>
  )
}

export default ClientLayout
