import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import KPICard from '../../components/shared/KPICard'
import Card   from '../../components/shared/Card'
import { metricsApi } from '../../services/api'

// TODO: sustituir por GET /api/v1/assignments/me — cumplimiento y sesiones
const kpisMock = [
  { title: 'Sesiones completadas', value: '18',   trend: '+3 este mes',   positive: true  },
  { title: 'Cumplimiento semanal', value: '85%',  trend: '+12% vs semana anterior', positive: true  },
  { title: 'Peso actual (kg)',      value: '78,4', trend: '−1,2 kg este mes',        positive: true  },
  { title: 'Progreso general',      value: '72%',  trend: '+8% vs inicio',           positive: true  },
]

// TODO: sustituir por GET /api/v1/assignments/me/sessions — cumplimiento semanal real
const evolucionData = [
  { semana: 'S1', rendimiento: 55 },
  { semana: 'S2', rendimiento: 60 },
  { semana: 'S3', rendimiento: 50 },
  { semana: 'S4', rendimiento: 70 },
  { semana: 'S5', rendimiento: 75 },
  { semana: 'S6', rendimiento: 68 },
  { semana: 'S7', rendimiento: 85 },
]

// TODO: sustituir por GET /api/v1/assignments/me — tipo de ejercicios de la rutina activa
const tipoEjerciciosData = [
  { name: 'Fuerza',     value: 45 },
  { name: 'Cardio',     value: 25 },
  { name: 'Movilidad',  value: 20 },
  { name: 'Core',       value: 10 },
]
const DONUT_COLORS = ['#1D7FD8', '#34d399', '#f59e0b', '#a78bfa']

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  fontSize: '12px',
}

function DashboardPage() {
  const [metricas, setMetricas] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function cargarMetricas() {
      setLoading(true)
      setError('')
      try {
        const data = await metricsApi.getMyMetrics()
        setMetricas(data)
      } catch (err) {
        setError(err.message || 'Error al cargar las métricas')
      } finally {
        setLoading(false)
      }
    }
    cargarMetricas()
  }, [])

  // Ordenar por fecha y mapear para el gráfico de peso
  const pesoData = [...metricas]
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
    .filter((m) => m.peso_kg != null)
    .map((m) => ({
      mes:  new Date(m.fecha).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      peso: m.peso_kg,
    }))

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

      {/* ── Título ── */}
      <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>

      {/* ── KPIs ── */}
      {/* TODO: reemplazar kpisMock con datos reales de la API */}
      <div className="flex gap-4">
        {kpisMock.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            positive={kpi.positive}
          />
        ))}
      </div>

      {/* ── Evolución de rendimiento ── */}
      {/* TODO: GET /api/v1/assignments/me/sessions para cumplimiento real por semana */}
      <Card title="Evolución de rendimiento">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucionData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="semana"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Rendimiento']}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="rendimiento"
                stroke="#1D7FD8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#1D7FD8', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Índice de rendimiento semanal (% cumplimiento y conformidad)
        </p>
      </Card>

      {/* ── Tipo de ejercicios + Progreso físico ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* TODO: GET /api/v1/assignments/me — distribución por tipo de ejercicio */}
        <Card title="Tipo de ejercicios">
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tipoEjerciciosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tipoEjerciciosData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [`${v}%`, name]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Progreso físico">
          {pesoData.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pesoData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      unit=" kg"
                    />
                    <Tooltip
                      formatter={(v) => [`${v} kg`, 'Peso']}
                      contentStyle={tooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Evolución del peso corporal (kg)
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin registros de peso disponibles
            </p>
          )}
        </Card>

      </div>

    </div>
  )
}

export default DashboardPage
