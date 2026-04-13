import { useAuth } from '../../context/AuthContext'
import KPICard from '../../components/shared/KPICard'
import Card from '../../components/shared/Card'
import Button from '../../components/shared/Button'

const today = new Date().toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// TODO: sustituir por datos reales de la API
const kpis = [
  { title: 'Clientes activos',      value: '12', trend: '+2 este mes',           positive: true  },
  { title: 'Cumplimiento rutinas',  value: '78%', trend: '-4% vs semana pasada', positive: false },
  { title: 'Sesiones esta semana',  value: '34', trend: '+8% vs semana pasada',  positive: true  },
  { title: 'Sin actividad',         value: '3',  trend: '+1 esta semana',        positive: false },
]

function InicioPage() {
  const { user } = useAuth()

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <Button variant="secondary" size="sm">Semana</Button>
      </div>

      {/* KPIs */}
      <div className="flex gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Clientes que requieren atención + Actividad reciente */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Clientes que requieren atención">
          {/* TODO: GET /api/v1/users/clients → filtrar por bajo cumplimiento */}
          <p className="text-sm text-gray-400 py-8 text-center">
            No hay clientes que requieran atención
          </p>
        </Card>

        <Card title="Actividad reciente">
          {/* TODO: endpoint de actividad reciente (sesiones de los últimos días) */}
          <p className="text-sm text-gray-400 py-8 text-center">
            Sin actividad reciente
          </p>
        </Card>

      </div>

      {/* Acciones rápidas */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Acciones rápidas</p>
        <div className="flex gap-3">
          {/* TODO: abrir modales correspondientes en cada acción */}
          <Button variant="secondary" size="sm">Crear ejercicio</Button>
          <Button variant="secondary" size="sm">Crear rutina</Button>
          <Button variant="secondary" size="sm">Asignar rutina</Button>
          <Button variant="secondary" size="sm">Añadir cliente</Button>
        </div>
      </div>

    </div>
  )
}

export default InicioPage
