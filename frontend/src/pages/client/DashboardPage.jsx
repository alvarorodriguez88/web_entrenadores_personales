import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import KPICard from '../../components/shared/KPICard'
import Card   from '../../components/shared/Card'

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

// TODO: sustituir por GET /api/v1/metrics/clients/{id} — historial de peso real
const pesoData = [
  { mes: 'Nov', peso: 82.0 },
  { mes: 'Dic', peso: 81.2 },
  { mes: 'Ene', peso: 80.5 },
  { mes: 'Feb', peso: 79.8 },
  { mes: 'Mar', peso: 79.1 },
  { mes: 'Abr', peso: 78.4 },
]

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  fontSize: '12px',
}

function DashboardPage() {
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

        {/* TODO: GET /api/v1/metrics/clients/{id} — historial de peso del cliente */}
        <Card title="Progreso físico">
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
        </Card>

      </div>

    </div>
  )
}

export default DashboardPage
