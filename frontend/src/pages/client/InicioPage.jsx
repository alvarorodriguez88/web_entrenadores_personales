import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { assignmentsApi, metricsApi, routinesApi, analyticsApi } from '../../services/api'
import Card   from '../../components/shared/Card'
import Button from '../../components/shared/Button'

// TODO: sustituir por GET /api/v1/assignments/me/sessions — sesiones completadas esta semana
const diasEntrenadosMock = [0, 1] // índices 0=Lun … 6=Dom de la semana actual

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getWeekDays() {
  const today = new Date()
  const dow   = today.getDay()
  const diff  = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)

  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      label,
      numero:  d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    }
  })
}

function InicioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const weekDays = getWeekDays()
  const todayIdx = weekDays.findIndex((d) => d.isToday)

  const [rutina,     setRutina]     = useState(null)
  const [asignacion, setAsignacion] = useState(null)
  const [evolution,  setEvolution]  = useState(null)
  const [metricas,   setMetricas]   = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [assignments, evolutionData, metricasData, recentActivityData] = await Promise.allSettled([
          assignmentsApi.getMyAssignments(),
          analyticsApi.getClientEvolution(),
          metricsApi.getMyMetrics(),
          analyticsApi.getClientRecentActivity()
        ])

        if (assignments.status === 'fulfilled') {
          const activa = assignments.value.find((a) => a.estado === 'ACTIVA') ?? null
          setAsignacion(activa)

          if (activa) {
            const rutinaData = await routinesApi.getClientRoutine(activa.id_rutina)
            setRutina(rutinaData)
          }
        }

        if (metricasData.status === 'fulfilled') {
          setMetricas(metricasData.value)
        }

        if (evolutionData.status === 'fulfilled') {
          setEvolution(evolutionData.value)
        }

        if (recentActivityData.status === 'fulfilled') {
          setRecentActivity(recentActivityData.value)
        }
      } catch (err) {
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [user.id])

  const ultimaMetrica = metricas.length > 0
    ? metricas.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  const ultimaEvolucion = evolution?.puntos?.length > 0
    ? evolution.puntos.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  const evolucionRow = [
    { label: 'Cumplimiento', value: ultimaEvolucion?.cumplimiento != null ? `${ultimaEvolucion.cumplimiento}%` : '—' },
    { label: 'Rendimiento', value: ultimaEvolucion?.rendimiento != null ? `${ultimaEvolucion.rendimiento}%` : '—' },
    { label: 'Conformidad', value: ultimaEvolucion?.conformidad != null ? `${ultimaEvolucion.conformidad}%` : '—' },
  ]

  const metricasRow = [
    { label: 'Peso',    value: ultimaMetrica?.peso_kg          != null ? `${ultimaMetrica.peso_kg} kg`   : '—' },
    { label: 'Altura',  value: ultimaMetrica?.altura_cm        != null ? `${ultimaMetrica.altura_cm} cm` : '—' },
    { label: '% Grasa', value: ultimaMetrica?.grasa_pct        != null ? `${ultimaMetrica.grasa_pct}%`   : '—' },
  ]


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

      {/* ── Saludo ── */}
      <h1 className="text-3xl font-black text-gray-900">
        Hola, {user?.nombre}
      </h1>

      {/* ── Tu progreso ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tu progreso</h2>
          <span className="text-xs font-semibold text-[#1D7FD8] bg-blue-50 px-3 py-1 rounded-full">
            Semana
          </span>
        </div>

        <Card>
          {/* Calendario semanal */}
          {/* TODO: sustituir diasEntrenadosMock con assignmentsApi.getMySessions() filtrado por semana actual */}
          <div className="flex gap-2 mb-5">
            {weekDays.map((day, i) => {
              const trained = diasEntrenadosMock.includes(i)
              const isToday = day.isToday

              const cls = [
                'flex flex-col items-center gap-1 flex-1 py-2.5 rounded-xl',
                trained
                  ? 'bg-[#1D7FD8] text-white'
                  : isToday
                    ? 'bg-white border-2 border-[#1D7FD8] text-[#1D7FD8]'
                    : 'bg-gray-100 text-gray-500',
              ].join(' ')

              return (
                <div key={day.label} className={cls}>
                  <span className="text-xs font-medium">{day.label}</span>
                  <span className="text-base font-bold leading-none">{day.numero}</span>
                </div>
              )
            })}
          </div>

          {/* Métricas físicas */}
          <div className="flex divide-x divide-gray-200">
            {evolucionRow.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 px-4 py-2">
                <p className="text-xl font-bold text-gray-800">{m.value}</p>
                <p className="text-xs text-gray-500 text-center leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Tu entrenamiento de hoy ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">Tu entrenamiento de hoy</h2>

        {rutina ? (
          <Card>
            <div className="flex divide-x divide-gray-200 items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <p className="font-bold text-gray-900 text-lg leading-tight">
                  {rutina?.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  Dificultad: {rutina?.nivel}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                <p className="mb-1">
                Objetivo: {rutina?.objetivo}
                </p>
                <p>
                  Descripción: {rutina?.descripcion}
                </p>
              </div>
              <Button onClick={() => navigate('/client/entrenamiento')}>
                Comenzar entreno
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-gray-400 text-center py-4">
              No tienes ninguna rutina asignada actualmente
            </p>
          </Card>
        )}
      </section>

      {/* ── Estado general + Esta semana ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* TODO: sustituir por datos reales de rendimiento semanal */}
        <Card title="Estado general">
          <div className="flex flex-col gap-1.5">
            {metricasRow.map((m) => (
              <div key={m.label} className="flex items-center gap-3 text-sm">
                <span className="text-xl font-bold text-gray-800">{m.label}</span>
                <span className="text-xl text-gray-800">{m.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* TODO: sustituir diasEntrenadosMock con sesiones reales */}
        <Card title="Actividad reciente">
          <div className="flex flex-col gap-2">
            {recentActivity.actividades.map((activity) => (
              <div key={activity.fecha_hora} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">{activity.fecha_hora}</span>
                <span className="text-gray-800">Rendimiento: {activity.nota_rendimiento}</span>
                <span className="text-gray-800">Conformidad: {activity.conformidad}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  )
}

export default InicioPage
