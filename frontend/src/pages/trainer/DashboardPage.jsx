import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import Card from '../../components/shared/Card'
import Table from '../../components/shared/Table'
import Button from '../../components/shared/Button'

// TODO: sustituir por datos reales de la API
const cumplimientoData = [
  { semana: 'S1', porcentaje: 65 },
  { semana: 'S2', porcentaje: 70 },
  { semana: 'S3', porcentaje: 60 },
  { semana: 'S4', porcentaje: 78 },
  { semana: 'S5', porcentaje: 74 },
  { semana: 'S6', porcentaje: 82 },
]

// TODO: sustituir por datos reales de la API
const rendimientoData = [
  { name: 'Alto rendimiento', value: 4,  color: '#1D7FD8' },
  { name: 'Medio',            value: 5,  color: '#60a5fa' },
  { name: 'Bajo',             value: 2,  color: '#fbbf24' },
  { name: 'Inactivos',        value: 1,  color: '#f87171' },
]

// TODO: sustituir por datos reales — GET /api/v1/users/clients + assignments
const clientesAtencion = [
  { nombre: 'Laura Martínez', progreso: '45%', ultima_sesion: 'Hace 5 días' },
  { nombre: 'Pedro Gómez',    progreso: '30%', ultima_sesion: 'Hace 8 días' },
]

// TODO: sustituir por datos reales de la API
const tablaIndividualData = [
  {
    cliente:       'Carlos García',
    cumplimiento:  '85%',
    progreso:      '+12%',
    ultima_sesion: 'Hace 1 día',
    estado:        'Activo',
  },
  {
    cliente:       'Laura Martínez',
    cumplimiento:  '45%',
    progreso:      '-8%',
    ultima_sesion: 'Hace 5 días',
    estado:        'Alerta',
  },
]

// TODO: sustituir por datos reales — GET grupos cuando exista el endpoint
const tablaGrupalData = []

const columnasIndividual = [
  { key: 'cliente',       label: 'Cliente' },
  { key: 'cumplimiento',  label: 'Cumplimiento' },
  { key: 'progreso',      label: 'Progreso' },
  { key: 'ultima_sesion', label: 'Última sesión' },
  { key: 'estado',        label: 'Estado' },
]

const columnasGrupal = [
  { key: 'grupo',         label: 'Grupo' },
  { key: 'cumplimiento',  label: 'Cumplimiento' },
  { key: 'progreso',      label: 'Progreso' },
  { key: 'ultima_sesion', label: 'Última sesión' },
  { key: 'estado',        label: 'Estado' },
]

function DashboardPage() {
  return (
    <div className="p-8 flex flex-col gap-8">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <Button variant="secondary" size="sm">Semana</Button>
      </div>

      {/* Gráfico de líneas — Cumplimiento */}
      <Card title="Cumplimiento de rutina y conformidad">
        {/* TODO: GET /api/v1/assignments con filtro de semana para calcular % cumplimiento */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumplimientoData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semana" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
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
      </Card>

      {/* Donut + Clientes que requieren atención */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Distribución de rendimiento">
          {/* TODO: calcular distribución a partir de sesionRutina y cumplimiento */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rendimientoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {rendimientoData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
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
        </Card>

        <Card title="Clientes que requieren atención">
          {/* TODO: GET /api/v1/users/clients → ordenar por cumplimiento ascendente */}
          {clientesAtencion.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Todos los clientes están al día
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {clientesAtencion.map((c) => (
                <li key={c.nombre} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{c.nombre}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs font-semibold text-red-500">{c.progreso}</span>
                    <span className="text-xs text-gray-400">{c.ultima_sesion}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>

      {/* Tabla individual */}
      <Card title="Tabla individual">
        {/* TODO: GET /api/v1/assignments → agrupar por cliente con métricas */}
        <Table
          columns={columnasIndividual}
          data={tablaIndividualData}
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
