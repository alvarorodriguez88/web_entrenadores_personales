import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Ruler, Droplets, Play } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { assignmentsApi, metricsApi, routinesApi, analyticsApi } from '../../services/api'
import { formatDateTime } from '../../utils/date'
import Card                  from '../../components/shared/Card'
import Button                from '../../components/shared/Button'
import ModalRegistrarMetrica from '../../components/client/ModalRegistrarMetrica'

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

function getDayClasses(i, todayIdx, isToday, calendarDay) {
  const isPast     = i < todayIdx
  const completado = calendarDay?.completada   ?? false
  const programado = calendarDay?.tiene_sesion ?? false

  if (isToday)                             return 'bg-white border-2 border-[#1D7FD8] text-[#1D7FD8]'
  if (isPast && completado)                return 'bg-[#1D7FD8] text-white'
  if (isPast && programado && !completado) return 'bg-red-100 text-red-500'
  if (!isPast && programado)               return 'bg-gray-100 text-gray-500'
  if (isPast)                              return 'bg-gray-100 text-gray-400'
  return 'bg-gray-100 text-gray-400'
}

function getDotClass(i, todayIdx, isToday, calendarDay) {
  const isPast     = i < todayIdx
  const completado = calendarDay?.completada   ?? false
  const programado = calendarDay?.tiene_sesion ?? false

  if (isPast && completado)                return 'bg-green-400'
  if (isPast && programado && !completado) return 'bg-red-300'
  if (isToday && programado)               return 'bg-[#1D7FD8]'
  if (!isPast && !isToday && programado)   return 'bg-blue-300'
  return null
}

function nivelBadgeClasses(nivel) {
  if (!nivel) return 'bg-gray-100 text-gray-500'
  const n = nivel.toLowerCase()
  if (n.includes('alto') || n.includes('avanzado'))  return 'bg-red-100 text-red-600'
  if (n.includes('medio') || n.includes('intermedio')) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function rpeBadgeClasses(conformidad) {
  if (conformidad == null) return 'bg-gray-100 text-gray-500'
  if (conformidad >= 90)   return 'bg-green-100 text-green-700'
  if (conformidad >= 75)   return 'bg-orange-100 text-orange-600'
  return 'bg-red-100 text-red-600'
}

function conformidadBarClasses(pct) {
  if (pct >= 90) return 'bg-green-500'
  if (pct >= 75) return 'bg-amber-400'
  return 'bg-red-400'
}

function ActivityItem({ activity }) {
  const conformidad = activity.conformidad ?? 0
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-400">{formatDateTime(activity.fecha_hora)}</span>
        {activity.nota_rendimiento != null && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${rpeBadgeClasses(conformidad)}`}>
            Rend. {activity.nota_rendimiento}/10
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 w-20 shrink-0">Conformidad</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${conformidadBarClasses(conformidad)}`}
            style={{ width: `${Math.min(100, conformidad)}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-600 w-10 text-right">{conformidad}%</span>
      </div>
    </div>
  )
}

function InicioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const weekDays = getWeekDays()
  const todayIdx = weekDays.findIndex((d) => d.isToday)

  const [rutina,          setRutina]          = useState(null)
  const [asignacion,      setAsignacion]      = useState(null)
  const [evolution,       setEvolution]       = useState(null)
  const [metricas,        setMetricas]        = useState([])
  const [recentActivity,  setRecentActivity]  = useState([])
  const [calendarDays,    setCalendarDays]    = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [modalMetrica,    setModalMetrica]    = useState(false)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [assignments, evolutionData, metricasData, recentActivityData, calendarData] = await Promise.allSettled([
        assignmentsApi.getMyAssignments(),
        analyticsApi.getClientEvolution(),
        metricsApi.getMyMetrics(),
        analyticsApi.getClientRecentActivity(),
        analyticsApi.getClientWeeklyCalendar(),
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

      if (calendarData.status === 'fulfilled') {
        setCalendarDays(calendarData.value?.dias ?? [])
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [user.id, cargarDatos])

  const ultimaMetrica = metricas.length > 0
    ? metricas.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  const ultimaEvolucion = evolution?.puntos?.length > 0
    ? evolution.puntos.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  const evolucionRow = [
    { label: 'Cumplimiento', value: ultimaEvolucion?.cumplimiento != null ? `${ultimaEvolucion.cumplimiento}%` : '—' },
    { label: 'Rendimiento',  value: ultimaEvolucion?.rendimiento  != null ? `${Math.round(ultimaEvolucion.rendimiento * 10)}%`  : '—' },
    { label: 'Conformidad',  value: ultimaEvolucion?.conformidad  != null ? `${ultimaEvolucion.conformidad}%`  : '—' },
  ]

  const metricasRow = [
    { label: 'Peso',    value: ultimaMetrica?.peso_kg   != null ? `${ultimaMetrica.peso_kg} kg`   : '—', Icon: Scale    },
    { label: 'Altura',  value: ultimaMetrica?.altura_cm != null ? `${ultimaMetrica.altura_cm} cm` : '—', Icon: Ruler    },
    { label: '% Grasa', value: ultimaMetrica?.grasa_pct != null ? `${ultimaMetrica.grasa_pct}%`   : '—', Icon: Droplets },
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

  const actividades = recentActivity?.actividades ?? []

  const DIAS_ES  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const hoy      = new Date()
  const fechaHoy = `${DIAS_ES[hoy.getDay()]} ${hoy.getDate()} de ${MESES_ES[hoy.getMonth()]}`

  return (
    <>
    <div className="p-8 flex flex-col gap-8">

      {/* ── Saludo ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-gray-900">
          Hola, <span className="text-[#1D7FD8]">{user?.nombre}</span> 👋
        </h1>
        <p className="text-sm text-gray-400">
          {fechaHoy}
          {calendarDays[todayIdx]?.tiene_sesion && rutina && (
            <>
              {' · '}
              <span className="text-[#1D7FD8] font-medium">
                Tienes entreno hoy — {rutina.nombre}
              </span>
            </>
          )}
        </p>
      </div>

      {/* ── Tu progreso ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tu progreso</h2>
        </div>

        <Card>
          {/* Calendario semanal */}
          <div className="flex gap-2 mb-4">
            {weekDays.map((day, i) => {
              const dotClass = getDotClass(i, todayIdx, day.isToday, calendarDays[i])
              return (
                <div
                  key={day.label}
                  className={[
                    'flex flex-col items-center justify-center gap-1.5 flex-1 py-4 rounded-2xl transition-colors',
                    getDayClasses(i, todayIdx, day.isToday, calendarDays[i]),
                  ].join(' ')}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider leading-none">
                    {day.label}
                  </span>
                  <span className="text-2xl font-black leading-none">{day.numero}</span>
                  {dotClass
                    ? <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                    : <span className="w-2 h-2" />
                  }
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-5 px-1">
            {[
              { dot: 'bg-[#1D7FD8]', label: 'Completado'    },
              { dot: 'bg-red-300',   label: 'No completado' },
              { dot: 'bg-blue-300',  label: 'Programado'    },
            ].map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                {label}
              </span>
            ))}
          </div>

          {/* Métricas de evolución */}
          <div className="flex divide-x divide-gray-200">
            {evolucionRow.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2 px-4 py-5">
                <p className="text-2xl font-black text-gray-900">{m.value}</p>
                <p className="text-sm text-gray-400 text-center">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Tu entrenamiento de hoy ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tu entrenamiento de hoy</h2>

        {rutina ? (() => {
          const today        = new Date()
          const inicio       = asignacion?.fecha_inicio ? new Date(asignacion.fecha_inicio) : null
          const fin          = asignacion?.fecha_fin    ? new Date(asignacion.fecha_fin)    : null
          const semanaActual = inicio ? Math.max(1, Math.ceil((today - inicio) / (7 * 86400000))) : null
          const totalSemanas = inicio && fin ? Math.ceil((fin - inicio) / (7 * 86400000)) : null
          const numeroDias   = calendarDays.filter(d => d.tiene_sesion).length

          const subtitulo = [
            numeroDias > 0 ? `${numeroDias} días` : null,
            semanaActual != null
              ? totalSemanas != null && semanaActual <= totalSemanas
                ? `Semana ${semanaActual} de ${totalSemanas}`
                : `Semana ${semanaActual}`
              : null,
          ].filter(Boolean).join(' · ')

          return (
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#1D7FD8] rounded-2xl p-5 flex flex-col gap-4">
              {/* Nombre + badge nivel */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{rutina.nombre}</p>
                  {subtitulo && (
                    <p className="text-sm text-gray-400 mt-0.5">{subtitulo}</p>
                  )}
                </div>
                {rutina.nivel && (
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-gray-100 text-gray-600 shrink-0 mt-0.5">
                    {rutina.nivel}
                  </span>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Objetivo y descripción */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Objetivo</p>
                  <p className="text-sm text-gray-700">{rutina.objetivo || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descripción</p>
                  <p className="text-sm text-gray-700">{rutina.descripcion || '—'}</p>
                </div>
              </div>

              {/* Botón ancho */}
              <button
                onClick={() => navigate('/client/entrenamiento')}
                className="w-full flex items-center justify-center gap-2 bg-[#1D7FD8] hover:bg-blue-600 text-white font-bold text-sm py-3 rounded-xl transition-colors"
              >
                <Play size={14} fill="currentColor" strokeWidth={0} />
                Comenzar entrenamiento
              </button>
            </div>
          )
        })() : (
          <Card>
            <p className="text-sm text-gray-400 text-center py-4">
              No tienes ninguna rutina asignada actualmente
            </p>
          </Card>
        )}
      </section>

      {/* ── Estado general + Actividad reciente ── */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Estado general">
          <div className="grid grid-cols-3 gap-3">
            {metricasRow.map(({ label, value, Icon }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                <Icon size={20} className="text-[#1D7FD8]" />
                <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setModalMetrica(true)}
            className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-[#1D7FD8] border border-[#1D7FD8]/30 hover:bg-[#1D7FD8]/5 transition-colors"
          >
            + Registrar métricas
          </button>
        </Card>

        <Card title="Actividad reciente">
          {actividades.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin actividad reciente</p>
          ) : (() => {
            const mondayThisWeek = (() => {
              const d = new Date(); d.setHours(0, 0, 0, 0)
              d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
              return d
            })()
            const estaSemana = actividades.filter(a => new Date(a.fecha_hora) >= mondayThisWeek)
            const anteriores  = actividades.filter(a => new Date(a.fecha_hora) <  mondayThisWeek)
            return (
              <div className="flex flex-col">
                {estaSemana.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Esta semana</p>
                    <div className="divide-y divide-gray-100">
                      {estaSemana.map((a, i) => <ActivityItem key={i} activity={a} />)}
                    </div>
                  </>
                )}
                {anteriores.length > 0 && (
                  <>
                    <p className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ${estaSemana.length > 0 ? 'mt-4' : ''}`}>
                      Anteriores
                    </p>
                    <div className="divide-y divide-gray-100">
                      {anteriores.map((a, i) => <ActivityItem key={i} activity={a} />)}
                    </div>
                  </>
                )}
              </div>
            )
          })()}
        </Card>

      </div>

    </div>

    <ModalRegistrarMetrica
      open={modalMetrica}
      onClose={() => setModalMetrica(false)}
      onSaved={() => { setModalMetrica(false); cargarDatos() }}
      ultimaMetrica={ultimaMetrica}
    />
    </>
  )
}

export default InicioPage
