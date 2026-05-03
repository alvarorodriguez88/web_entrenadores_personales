import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { usersApi, metricsApi, analyticsApi, assignmentsApi, routinesApi } from '../../services/api'
import Button           from '../../components/shared/Button'
import Card             from '../../components/shared/Card'
import PeriodoToggle    from '../../components/shared/PeriodoToggle'
import EvolucionChart         from '../../components/shared/EvolucionChart'
import MetricasEvolucionChart from '../../components/shared/MetricasEvolucionChart'
import ModalGestionarRutinas from '../../components/trainer/ModalGestionarRutinas'

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-green-100 text-green-700',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

function initials(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function formatObjetivo(v) {
  if (!v) return '—'
  return v.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ClientePerfilPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [cliente,      setCliente]      = useState(null)
  const [metricas,     setMetricas]     = useState([])
  const [asignacion,   setAsignacion]   = useState(null)
  const [rutinaNombre, setRutinaNombre] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const [periodo,   setPeriodo]   = useState('semanal')
  const [evolucion, setEvolucion] = useState([])
  const [loadingEv, setLoadingEv] = useState(true)

  const [modalGestionar,   setModalGestionar]   = useState(false)
  const [historialAbierto, setHistorialAbierto] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [id])

  useEffect(() => {
    async function cargarEvolucion() {
      setLoadingEv(true)
      try {
        const data = await analyticsApi.getTrainerClientEvolution(id, periodo)
        const serie = Array.isArray(data)
          ? data
          : (data?.puntos ?? data?.serie ?? data?.historico ?? data?.items ?? [])
        setEvolucion(serie)
      } catch {
        setEvolucion([])
      } finally {
        setLoadingEv(false)
      }
    }
    cargarEvolucion()
  }, [id, periodo])

  async function cargarDatos() {
    setLoading(true)
    setError('')
    try {
      const [clienteData, metricasData, asignacionesData] = await Promise.all([
        usersApi.getClientById(id),
        metricsApi.getClientMetrics(id),
        assignmentsApi.getClientAssignments(id),
      ])
      setCliente(clienteData)
      setMetricas(Array.isArray(metricasData) ? metricasData : [])
      const activa = Array.isArray(asignacionesData) && asignacionesData.length > 0
        ? asignacionesData[0] : null
      setAsignacion(activa)
      if (activa) {
        const rutina = await routinesApi.getRoutine(activa.id_rutina)
        setRutinaNombre(rutina.nombre)
      } else {
        setRutinaNombre('')
      }
    } catch (err) {
      setError(err.message || 'Error al cargar el cliente')
    } finally {
      setLoading(false)
    }
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
      <div className="p-8 flex flex-col items-center gap-4 h-64 justify-center">
        <p className="text-gray-500">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/trainer/clients')}>
          Volver a clientes
        </Button>
      </div>
    )
  }

  const nombre = `${cliente.user.nombre} ${cliente.user.apellidos}`

  const ultimaMetrica = metricas.length > 0
    ? metricas.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  const metricasChart = [...metricas]
    .sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro))
    .map(m => ({
      fecha: new Date(m.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      peso:  m.peso_kg   != null ? parseFloat(m.peso_kg)   : null,
      grasa: m.grasa_pct != null ? parseFloat(m.grasa_pct) : null,
    }))

  return (
    <div className="p-8 flex flex-col gap-6">

      <button
        onClick={() => navigate('/trainer/clients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors self-start"
      >
        <ArrowLeft size={16} />
        Volver a clientes
      </button>

      <h1 className="text-4xl font-black text-gray-900">Perfil individual</h1>

      {/* Datos del cliente */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center
                          text-[#1D7FD8] text-lg font-black flex-shrink-0">
            {initials(nombre)}
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight">{nombre}</p>
            <p className="text-sm text-gray-500">{cliente.user.email}</p>
          </div>

          <div className="w-px h-10 bg-gray-200 mx-2 flex-shrink-0" />

          <div className="flex gap-8 flex-1">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400">Nivel</p>
              {cliente.nivel
                ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold
                    ${NIVEL_BADGE[(cliente.nivel ?? '').toUpperCase()] ?? 'bg-gray-100 text-gray-500'}`}>
                    {cliente.nivel}
                  </span>
                : <span className="text-sm text-gray-300">—</span>
              }
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-400">Objetivo</p>
              <p className="text-sm font-semibold text-gray-700">{formatObjetivo(cliente.objetivo)}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-400">Rutina activa</p>
              <p className="text-sm font-semibold text-gray-700">
                {rutinaNombre || (asignacion ? 'Cargando…' : 'Sin rutina')}
              </p>
            </div>
          </div>

          <Button size="sm" onClick={() => setModalGestionar(true)}>Gestionar rutinas</Button>
        </div>
      </Card>

      {/* Métricas físicas */}
      <Card title="Métricas físicas">
        {ultimaMetrica ? (
          <div className="flex divide-x divide-gray-200">
            {[
              { label: 'Peso',    value: ultimaMetrica.peso_kg    != null ? `${ultimaMetrica.peso_kg} kg`   : '—' },
              { label: 'Altura',  value: ultimaMetrica.altura_cm  != null ? `${ultimaMetrica.altura_cm} cm` : '—' },
              { label: '% Grasa', value: ultimaMetrica.grasa_pct  != null ? `${ultimaMetrica.grasa_pct}%`   : '—' },
            ].map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 px-4 py-4">
                <p className="text-2xl font-black text-gray-900">{m.value}</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            Sin métricas registradas
          </p>
        )}

        {metricas.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setHistorialAbierto(v => !v)}
              className="flex items-center gap-1.5 text-sm text-[#1D7FD8] font-medium
                         hover:text-blue-700 transition-colors w-full justify-center
                         border-t border-gray-100 pt-3 mt-2"
            >
              {historialAbierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {historialAbierto ? 'Ocultar historial' : 'Ver historial'}
            </button>

            {historialAbierto && (
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2 text-center">Evolución del peso</p>
                  <MetricasEvolucionChart data={metricasChart} mostrar={['peso']} height={200} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2 text-center">Evolución de % grasa</p>
                  <MetricasEvolucionChart data={metricasChart} mostrar={['grasa']} height={200} />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Evolución individual */}
      <Card
        title="Evolución individual"
        action={<PeriodoToggle value={periodo} onChange={setPeriodo} />}
      >
        {loadingEv ? (
          <div className="h-56 flex items-center justify-center">
            <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : evolucion.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Sin datos de evolución para este periodo
          </p>
        ) : (
          <>
            <EvolucionChart data={evolucion} />
            <p className="text-xs text-gray-400 text-center mt-2">
              Evolución histórica — rendimiento (0–10, eje der.) · cumplimiento y conformidad (%, eje izq.)
            </p>
          </>
        )}
      </Card>

      <ModalGestionarRutinas
        isOpen={modalGestionar}
        onClose={() => setModalGestionar(false)}
        clienteId={id}
        clienteNombre={nombre}
        clienteEmail={cliente.user.email}
        onActualizacion={cargarDatos}
      />

    </div>
  )
}

export default ClientePerfilPage
