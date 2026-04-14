import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usersApi, metricsApi } from '../../services/api'
import Button from '../../components/shared/Button'
import Card   from '../../components/shared/Card'

// TODO: sustituir por datos reales de sesionRutina del cliente
const cumplimientoMock = [
  { semana: 'S1', porcentaje: 50 },
  { semana: 'S2', porcentaje: 65 },
  { semana: 'S3', porcentaje: 70 },
  { semana: 'S4', porcentaje: 55 },
  { semana: 'S5', porcentaje: 80 },
  { semana: 'S6', porcentaje: 75 },
]

function ClientePerfilPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [cliente,  setCliente]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [metricas, setMetricas] = useState([])

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [clienteData, metricasData] = await Promise.all([
          usersApi.getClientById(id),
          metricsApi.getClientMetrics(id),
        ])
        setCliente(clienteData)
        setMetricas(metricasData)
      } catch (err) {
        setError(err.message || 'Error al cargar el cliente')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 h-64 justify-center">
        <p className="text-gray-500">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/trainer/clients')}>
          Volver a clientes
        </Button>
      </div>
    )
  }

  const nombre   = `${cliente.user.nombre} ${cliente.user.apellidos}`
  const nivel    = cliente.nivel ?? '—'

  const ultimaMetrica = metricas.length > 0
    ? metricas.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Volver */}
      <button
        onClick={() => navigate('/trainer/clients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors self-start"
      >
        <ArrowLeft size={16} />
        Volver a clientes
      </button>

      <h1 className="text-3xl font-black text-gray-900">Clientes</h1>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Foto placeholder */}
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#1D7FD8]">
              <User size={24} />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-gray-900 text-lg">{nombre}</p>
              <p className="text-sm text-gray-500">Nivel: {nivel}</p>
              {/* TODO: añadir objetivo cuando el schema ClientResponse lo incluya */}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Activo
            </span>
            {/* TODO: abrir modal de asignar rutina */}
            <Button size="sm">Asignar rutina</Button>
          </div>
        </div>
      </Card>

      <Card title="Métricas físicas">
        {ultimaMetrica ? (
          <div className="flex divide-x divide-gray-200">
            {[
              { label: 'Peso',       value: ultimaMetrica.peso_kg           != null ? `${ultimaMetrica.peso_kg} kg`  : '—' },
              { label: 'Altura',     value: ultimaMetrica.altura_cm         != null ? `${ultimaMetrica.altura_cm} cm`: '—' },
              { label: '% Grasa',    value: ultimaMetrica.grasa_pct         != null ? `${ultimaMetrica.grasa_pct}%`  : '—' },
            ].map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 px-4 py-2">
                <p className="text-xl font-bold text-gray-800">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            Sin métricas registradas
          </p>
        )}
      </Card>

      {/* Rendimiento */}
      <Card title="Rendimiento">
        {/* TODO: GET /api/v1/assignments/clients/{id}/sessions para cumplimiento real */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumplimientoMock} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
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
        <p className="text-xs text-gray-400 text-center mt-2">Cumplimiento de rutinas — conformidad semanal</p>
      </Card>

    </div>
  )
}

export default ClientePerfilPage
