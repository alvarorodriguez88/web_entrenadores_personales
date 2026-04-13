import { Home, LayoutDashboard, Dumbbell } from 'lucide-react'
import Sidebar from '../components/shared/Sidebar'

const clientNavItems = [
  { label: 'Inicio',         path: '/client/inicio',     icon: Home },
  { label: 'Dashboard',      path: '/client/dashboard',  icon: LayoutDashboard },
  { label: 'Entrenamiento',  path: '/client/exercises',  icon: Dumbbell },
]

function ClientLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={clientNavItems} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  )
}

export default ClientLayout
