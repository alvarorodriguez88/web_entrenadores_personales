import { useState, useEffect } from 'react'
import { analyticsApi } from '../../services/api'
import Card              from '../../components/shared/Card'
import EvolucionChart    from '../../components/shared/EvolucionChart'
import PeriodoToggle     from '../../components/shared/PeriodoToggle'
import DonutChart        from '../../components/shared/DonutChart'
import AlertList         from '../../components/shared/AlertList'
import ClientStatsTable  from '../../components/shared/ClientStatsTable'

const DONUT_COLORS = ['#1D7FD8', '#60a5fa', '#fbbf24', '#f87171']

// TODO: sustituir por datos reales — GET grupos cuando exista el endpoint
const tablaGrupalData = []

function toArray(val, ...keys) {
  if (Array.isArray(val)) return val
  for (const k of keys) {
    if (Array.isArray(val?.[k])) return val[k]
  }
  return []
}

function DashboardPage() {
  const [periodo,       setPeriodo]       = useState('semanal')
  const [evolution,     setEvolution]     = useState([])
  const [distribucion,  setDistribucion]  = useState([])
  const [alertas,       setAlertas]       = useState([])
  const [tablaClientes, setTablaClientes] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [evolutionData, distData, alertasData, tablaData] = await Promise.all([
          analyticsApi.getTrainerEvolution(periodo),
          analyticsApi.getTrainerPerformanceDistribution(),
          analyticsApi.getTrainerAlerts(),
          analyticsApi.getTrainerClientsTable(periodo),
        ])

        setEvolution(toArray(evolutionData, 'puntos'))
        setDistribucion([
          { name: 'Alto rendimiento', value: distData.alto,     color: DONUT_COLORS[0] },
          { name: 'Medio',            value: distData.medio,    color: DONUT_COLORS[1] },
          { name: 'Bajo',             value: distData.bajo,     color: DONUT_COLORS[2] },
          { name: 'Inactivo',         value: distData.inactivo, color: DONUT_COLORS[3] },
        ].filter(item => item.value > 0).sort((a, b) => b.value - a.value))
        setAlertas(toArray(alertasData, 'items', 'alertas'))
        setTablaClientes(toArray(tablaData, 'items', 'clientes'))
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

  const totalClientes = distribucion.reduce((s, d) => s + d.value, 0)

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-gray-900">Análisis</h1>
        <PeriodoToggle value={periodo} onChange={setPeriodo} />
      </div>

      {/* Gráfico de líneas — Cumplimiento */}
      <Card title="Evolución del cumplimiento, conformidad y rendimiento">
        {evolution.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin datos de cumplimiento</p>
        ) : (
          <EvolucionChart data={evolution} />
        )}
      </Card>

      {/* Donut + Clientes que requieren atención */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Distribución de rendimiento">
          <DonutChart
            data={distribucion}
            subtitle={totalClientes > 0 ? `${totalClientes} clientes en total` : undefined}
            highlightText={distribucion[0] && (
              <>
                <span className="font-bold">{distribucion[0].name}</span>
                {' '}es el grupo más numeroso
              </>
            )}
            emptyMessage="Sin datos de distribución"
          />
        </Card>

        <Card title="Clientes que requieren atención">
          <AlertList
            alertas={alertas}
            emptyMessage="Todos los clientes están al día"
          />
        </Card>

      </div>

      {/* Tabla individual */}
      <Card title="Tabla individual">
        <ClientStatsTable
          data={tablaClientes}
          emptyMessage="No hay datos de clientes individuales"
        />
      </Card>

    </div>
  )
}

export default DashboardPage
