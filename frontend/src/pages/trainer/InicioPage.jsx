import { useState, useEffect } from 'react'
import { Dumbbell, ClipboardList, Send, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi } from '../../services/api'
import KPICard             from '../../components/shared/KPICard'
import Card                from '../../components/shared/Card'
import AlertList           from '../../components/shared/AlertList'
import PeriodoToggle       from '../../components/shared/PeriodoToggle'
import ModalCrearEjercicio    from '../../components/trainer/ModalCrearEjercicio'
import ModalCrearRutina        from '../../components/trainer/ModalCrearRutina'
import ModalSeleccionarRutina  from '../../components/trainer/ModalSeleccionarRutina'
import ModalAsignarRutina      from '../../components/trainer/ModalAsignarRutina'
import ModalAnadirCliente      from '../../components/trainer/ModalAnadirCliente'

const today = new Date().toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

function formatFechaCorta(iso) {
  if (!iso) return ''
  return new Date(iso)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

function buildKpis(data, periodo) {
  const vs = periodo === 'semanal' ? 'semana pasada' : 'mes pasado'
  return [
    {
      title:    'Clientes activos',
      value:    String(data.clientes_activos ?? '—'),
      trend:    data.clientes_activos_diff != null
                  ? `${data.clientes_activos_diff > 0 ? '+' : ''}${data.clientes_activos_diff} vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.clientes_activos_diff ?? 0) >= 0,
    },
    {
      title:    'Cumplimiento rutinas',
      value:    data.cumplimiento_pct != null ? `${data.cumplimiento_pct}%` : '—',
      trend:    data.cumplimiento_pct_diff != null
                  ? `${data.cumplimiento_pct_diff > 0 ? '+' : ''}${data.cumplimiento_pct_diff}% vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.cumplimiento_pct_diff ?? 0) >= 0,
    },
    {
      title:    periodo === 'semanal' ? 'Sesiones esta semana' : 'Sesiones este mes',
      value:    String(data.sesiones_completadas ?? '—'),
      trend:    data.sesiones_completadas_diff != null
                  ? `${data.sesiones_completadas_diff > 0 ? '+' : ''}${data.sesiones_completadas_diff} vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.sesiones_completadas_diff ?? 0) >= 0,
    },
    {
      title:    'Sin actividad',
      value:    String(data.clientes_sin_actividad ?? '—'),
      trend:    data.clientes_sin_actividad_diff != null
                  ? `${data.clientes_sin_actividad_diff > 0 ? '+' : ''}${data.clientes_sin_actividad_diff} vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.clientes_sin_actividad_diff ?? 0) <= 0,
    },
  ]
}

function InicioPage() {
  const { user } = useAuth()

  const [periodo,   setPeriodo]   = useState('semanal')
  const [kpis,      setKpis]      = useState([])
  const [alertas,   setAlertas]   = useState([])
  const [actividad, setActividad] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  const [modalEj,  setModalEj]  = useState(false)
  const [modalRut, setModalRut] = useState(false)
  const [modalAs,  setModalAs]  = useState(false)
  const [modalCli, setModalCli] = useState(false)

  const [modalAsignar,       setModalAsignar]       = useState(false)
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null)

  function handleSeleccionarRutina(rutina) {
    setModalAs(false)
    setRutinaSeleccionada(rutina)
    setModalAsignar(true)
  }

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [kpisData, alertasData, actividadData] = await Promise.all([
          analyticsApi.getTrainerKpis(periodo),
          analyticsApi.getTrainerAlerts(),
          analyticsApi.getTrainerRecentActivity(),
        ])
        setKpis(buildKpis(kpisData, periodo))
        setAlertas(Array.isArray(alertasData) ? alertasData : (alertasData?.items ?? alertasData?.alertas ?? []))
        setActividad(Array.isArray(actividadData) ? actividadData : (actividadData?.items ?? actividadData?.actividad ?? []))
      } catch (err) {
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [periodo])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  const acciones = [
    { label: 'Crear ejercicio', icon: Dumbbell,     action: () => setModalEj(true)  },
    { label: 'Crear rutina',    icon: ClipboardList, action: () => setModalRut(true) },
    { label: 'Asignar rutina',  icon: Send,          action: () => setModalAs(true)  },
    { label: 'Añadir cliente',  icon: UserPlus,      action: () => setModalCli(true) },
  ]

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <PeriodoToggle value={periodo} onChange={setPeriodo} />
      </div>

      {/* KPIs */}
      <div className="flex gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Requieren atención + Actividad reciente */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Requieren atención">
          <AlertList
            alertas={alertas}
            emptyMessage="No hay clientes que requieran atención"
          />
        </Card>

        <Card title="Actividad reciente">
          {actividad.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin actividad reciente</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {actividad.map((a, i) => (
                <li key={i} className="flex items-center gap-3 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-semibold text-sm flex items-center justify-center shrink-0">
                    {initials(a.nombre, a.apellidos)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.nombre} {a.apellidos}</p>
                    {a.nombre_bloque && <p className="text-xs text-gray-400">{a.nombre_bloque}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-400">{formatFechaCorta(a.fecha_hora)}</span>
                    {a.nota_rendimiento != null && (
                      <span className="text-xs font-bold bg-blue-100 text-[#1D7FD8] px-2 py-0.5 rounded-lg">
                        Rendimiento: {Math.round(a.nota_rendimiento)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>

      {/* Acciones rápidas */}
      <div>
        <p className="text-xl font-semibold text-gray-700 mb-6">Acciones rápidas</p>
        <div className="grid grid-cols-4 gap-3">
          {acciones.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-3xl py-6 px-4 hover:border-[#1D7FD8]/40 hover:shadow-sm transition-all text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1D7FD8]/10 flex items-center justify-center">
                <Icon size={20} className="text-[#1D7FD8]" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modales */}
      <ModalCrearEjercicio isOpen={modalEj}  onClose={() => setModalEj(false)} />
      <ModalCrearRutina    isOpen={modalRut} onClose={() => setModalRut(false)} />
      <ModalSeleccionarRutina
        isOpen={modalAs}
        onClose={() => setModalAs(false)}
        onSelect={handleSeleccionarRutina}
      />
      <ModalAsignarRutina
        isOpen={modalAsignar}
        rutina={rutinaSeleccionada}
        onClose={() => { setModalAsignar(false); setRutinaSeleccionada(null) }}
      />
      <ModalAnadirCliente  isOpen={modalCli} onClose={() => setModalCli(false)} />

    </div>
  )
}

export default InicioPage
