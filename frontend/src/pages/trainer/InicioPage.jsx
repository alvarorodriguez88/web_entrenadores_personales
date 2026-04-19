import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi } from '../../services/api'
import KPICard from '../../components/shared/KPICard'
import Card from '../../components/shared/Card'
import Button from '../../components/shared/Button'

const today = new Date().toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

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

  function togglePeriodo() {
    setPeriodo((p) => (p === 'semanal' ? 'mensual' : 'semanal'))
  }

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
        <Button variant="secondary" size="sm" onClick={togglePeriodo}>
          {periodo === 'semanal' ? 'Semana' : 'Mes'}
        </Button>
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
          {alertas.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No hay clientes que requieran atención
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {alertas.map((a, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700">
                    {a.nombre} {a.apellidos}
                  </span>
                  <span className="text-xs text-red-500 font-medium">{a.tipo_alerta}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Actividad reciente">
          {actividad.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Sin actividad reciente
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {actividad.map((a, i) => (
                <li key={i} className="flex flex-col gap-0.5 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {a.nombre} {a.apellidos}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{a.nombre_bloque}</span>
                    {a.nota_rendimiento != null && (
                      <span className="text-xs text-[#1D7FD8] font-medium">RPE {a.nota_rendimiento}</span>
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
        <p className="text-sm font-semibold text-gray-700 mb-3">Acciones rápidas</p>
        <div className="flex gap-3">
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
