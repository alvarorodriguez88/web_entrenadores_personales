import { Home, LayoutDashboard, BookOpen, Users } from 'lucide-react'
import Sidebar from '../components/shared/Sidebar'

const trainerNavItems = [
  { label: 'Inicio',     path: '/trainer/inicio',     icon: Home },
  { label: 'Dashboard',  path: '/trainer/dashboard',  icon: LayoutDashboard },
  { label: 'Contenido',  path: '/trainer/content',    icon: BookOpen },
  { label: 'Clientes',   path: '/trainer/clients',    icon: Users },
]

function TrainerLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={trainerNavItems} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  )
}

export default TrainerLayout
