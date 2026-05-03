import { NavLink, useNavigate } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function Sidebar({ navItems, onAjustesClick }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col text-white bg-[#1e3a5f]">

      <div className="px-5 pt-6 pb-5">
        <div className="w-12 h-12 rounded-xl bg-[#1D7FD8] flex items-center justify-center font-bold text-lg tracking-tight">
          L
        </div>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6 flex flex-col gap-1">
        <div className="border-t border-white/15 my-2" />
        {onAjustesClick ? (
          <button
            onClick={onAjustesClick}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-colors w-full text-left"
          >
            <Settings size={18} strokeWidth={1.75} />
            Ajustes
          </button>
        ) : (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Settings size={18} strokeWidth={1.75} />
            Ajustes
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-colors w-full text-left"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}

export default Sidebar
