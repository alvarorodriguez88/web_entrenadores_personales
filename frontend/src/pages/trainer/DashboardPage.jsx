import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { analyticsApi } from '../../services/api'
import Card from '../../components/shared/Card'
import Table from '../../components/shared/Table'
import Button from '../../components/shared/Button'
import { formatDateTime } from '../../utils/date'

const DONUT_COLORS = ['#1D7FD8', '#60a5fa', '#fbbf24', '#f87171']

// TODO: sustituir por datos reales — GET grupos cuando exista el endpoint
const tablaGrupalData = []

const columnasIndividual = [
  { key: 'nombre',                label: 'Cliente', render: (_, row) => `${row.nombre} ${row.apellidos}` },
  { key: 'cumplimiento_pct',      label: 'Cumplimiento' },
  { key: 'rendimiento_avg',       label: 'Rendimiento' },
  { key: 'ultima_sesion',         label: 'Última sesión', render: (val) => formatDateTime(val) },
  { key: 'nivel',                 label: 'Nivel' },
]

const columnasGrupal = [
  { key: 'grupo',                 label: 'Grupo' },
  { key: 'cumplimiento_pct',      label: 'Cumplimiento' },
  { key: 'rendimiento_avg',       label: 'Rendimiento' },
  { key: 'ultima_sesion',         label: 'Última sesión', render: (val) => formatDateTime(val) },
  { key: 'nivel',                 label: 'Nivel' },
]

function toArray(val, ...keys) {
  if (Array.isArray(val)) return val
  for (const k of keys) {
    if (Array.isArray(val?.[k])) return val[k]
  }
  return []
}

function DashboardPage() {
  const [periodo,       setPeriodo]       = useState('semanal')
  const [cumplimiento,  setCumplimiento]  = useState([])
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
        const [kpisData, distData, alertasData, tablaData] = await Promise.all([
          analyticsApi.getTrainerKpis(periodo),
          analyticsApi.getTrainerPerformanceDistribution(),
          analyticsApi.getTrainerAlerts(),
          analyticsApi.getTrainerClientsTable(periodo),
        ])

        // El backend devuelve la serie histórica dentro de los KPIs
        setCumplimiento(toArray(kpisData, 'serie_cumplimiento', 'historico', 'serie'))
        setDistribucion([
          { name: 'Alto rendimiento', value: distData.alto,     color: DONUT_COLORS[0] },
          { name: 'Medio',            value: distData.medio,    color: DONUT_COLORS[1] },
          { name: 'Bajo',             value: distData.bajo,     color: DONUT_COLORS[2] },
          { name: 'Inactivo',         value: distData.inactivo, color: DONUT_COLORS[3] },
        ].filter(item => item.value > 0))
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <Button variant="secondary" size="sm" onClick={togglePeriodo}>
          {periodo === 'semanal' ? 'Semana' : 'Mes'}
        </Button>
      </div>

      {/* TODO: añadir gráfico de evolución promedio general cuando el backend exponga
               GET /analytics/trainer/evolution — actualmente no existe el endpoint */}

      {/* Gráfico de líneas — Cumplimiento */}
      <Card title="Cumplimiento de rutina y conformidad">
        {cumplimiento.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin datos de cumplimiento</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumplimiento} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Cumplimiento']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="porcentaje"
                  stroke="#1D7FD8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1D7FD8', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Donut + Clientes que requieren atención */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Distribución de rendimiento">
          {distribucion.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin datos de distribución</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucion}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distribucion.map((entry, i) => (
                      <Cell key={entry.name ?? i} fill={entry.color ?? DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [v, name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Clientes que requieren atención">
          {alertas.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Todos los clientes están al día
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {alertas.map((a, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700">
                    {a.nombre} {a.apellidos}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs font-semibold text-red-500">{a.tipo_alerta}</span>
                    {a.ultima_sesion && (
                      <span className="text-xs text-gray-400">{a.ultima_sesion}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>

      {/* Tabla individual */}
      <Card title="Tabla individual">
        <Table
          columns={columnasIndividual}
          data={tablaClientes}
          emptyMessage="No hay datos de clientes individuales"
        />
      </Card>

      {/* Tabla grupal */}
      <Card title="Tabla grupal">
        {/* TODO: GET /api/v1/grupos cuando exista el endpoint de grupos */}
        <Table
          columns={columnasGrupal}
          data={tablaGrupalData}
          emptyMessage="No hay grupos creados todavía"
        />
      </Card>

    </div>
  )
}

export default DashboardPage
