import { useState } from 'react'
import { Home, LayoutDashboard, BookOpen, Users } from 'lucide-react'
import Sidebar from '../components/shared/Sidebar'
import ModalCambiarContrasena from '../components/shared/ModalCambiarContrasena'

const trainerNavItems = [
  { label: 'Inicio',     path: '/trainer/inicio',     icon: Home },
  { label: 'Dashboard',  path: '/trainer/dashboard',  icon: LayoutDashboard },
  { label: 'Contenido',  path: '/trainer/content',    icon: BookOpen },
  { label: 'Clientes',   path: '/trainer/clients',    icon: Users },
]

function TrainerLayout({ children }) {
  const [modalAjustes, setModalAjustes] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={trainerNavItems} onAjustesClick={() => setModalAjustes(true)} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
      <ModalCambiarContrasena isOpen={modalAjustes} onClose={() => setModalAjustes(false)} />
    </div>
  )
}

export default TrainerLayout
