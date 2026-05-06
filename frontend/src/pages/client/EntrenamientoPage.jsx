import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Video, Clock, ChevronRight, Lightbulb, Check } from 'lucide-react'
import Modal  from '../../components/shared/Modal'
import { analyticsApi, MEDIA_BASE } from '../../services/api'

const CATEGORIA_COLORS = {
  FUERZA:       { bg: '#EFF6FF', text: '#1D7FD8' },
  CARDIO:       { bg: '#FFF7ED', text: '#ea580c' },
  FLEXIBILIDAD: { bg: '#F0FDF4', text: '#16a34a' },
  RESISTENCIA:  { bg: '#FAF5FF', text: '#7c3aed' },
  HIIT:         { bg: '#FFF1F2', text: '#dc2626' },
}
const DEFAULT_CAT = { bg: '#F3F4F6', text: '#6b7280' }
function getCatColor(cat) { return CATEGORIA_COLORS[cat?.toUpperCase()] ?? DEFAULT_CAT }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES')
}

function EjercicioCard({ ejercicio, index, onClick }) {
  const catColor = getCatColor(ejercicio.categorias?.[0])
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-[#1D7FD8]/30 hover:shadow-sm transition-all text-left"
    >
      <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 text-sm font-bold flex items-center justify-center shrink-0">
        {ejercicio.orden ?? index + 1}
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900 text-sm">{ejercicio.nombre}</p>
          {ejercicio.categorias?.[0] && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: catColor.bg, color: catColor.text }}
            >
              {ejercicio.categorias[0].toUpperCase()}
            </span>
          )}
        </div>
        {ejercicio.grupo_muscular && (
          <p className="text-xs text-gray-400">{ejercicio.grupo_muscular}</p>
        )}
        <p className="text-sm font-semibold text-[#1D7FD8] flex items-center gap-2">
          {ejercicio.series_plan} series × {ejercicio.reps_plan} reps
          {ejercicio.descanso_seg != null && (
            <span className="text-gray-400 font-normal flex items-center gap-1">
              <Clock size={12} /> {ejercicio.descanso_seg}s descanso
            </span>
          )}
        </p>
      </div>

      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  )
}

function EntrenamientoPage() {
  const navigate = useNavigate()
  const [workouts,        setWorkouts]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [ejercicioActivo, setEjercicioActivo] = useState(null)

  useEffect(() => {
    async function cargarEntrenamiento() {
      setLoading(true)
      setError('')
      try {
        const data = await analyticsApi.getClientTodayWorkout()
        setWorkouts(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Error al cargar el entrenamiento')
      } finally {
        setLoading(false)
      }
    }
    cargarEntrenamiento()
  }, [])

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

      <h1 className="text-4xl font-black text-gray-900">Entrenamiento</h1>

      {workouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center">
          <p className="text-sm text-gray-400">No tienes entrenamiento para hoy</p>
        </div>
      ) : workouts.map((workout, wi) => {
        const today        = new Date()
        const inicio       = workout.fecha_inicio ? new Date(workout.fecha_inicio) : null
        const fin          = workout.fecha_fin    ? new Date(workout.fecha_fin)    : null
        const totalSemanas = inicio && fin ? Math.max(1, Math.ceil((fin - inicio) / (7 * 86400000))) : 1
        const semanaActual = inicio
          ? Math.min(totalSemanas, Math.max(1, Math.ceil((today - inicio) / (7 * 86400000))))
          : 1
        const progresoPct = Math.round((semanaActual / totalSemanas) * 100)

        return (
          <div key={wi} className="flex flex-col gap-4">
            {/* ── Card principal ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-[#1D7FD8]">

              {/* Zona superior */}
              <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">

                {/* Izquierda: nombre rutina + bloque·día·notas */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{workout.nombre_rutina}</h2>
                    {workout.nivel_rutina && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {workout.nivel_rutina.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold">{workout.nombre_bloque ?? `Bloque ${workout.numero_dia}`}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">Día {workout.numero_dia}</span>
                    {workout.notas_bloque && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-[#1D7FD8]">{workout.notas_bloque}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Derecha: semana + barra de progreso */}
                <div className="flex flex-col items-end gap-2 shrink-0 min-w-[140px]">
                  <p className="text-sm text-gray-500">
                    Semana <strong className="text-gray-900">{semanaActual}</strong> de {totalSemanas}
                  </p>
                  <div className="h-1.5 rounded-full bg-gray-100 w-full">
                    <div className="h-1.5 rounded-full bg-[#1D7FD8]" style={{ width: `${progresoPct}%` }} />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Zona inferior: objetivo + estado/botón */}
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {workout.ejercicios?.length ?? 0} ejercicios
                  {workout.objetivo_rutina && ` · ${workout.objetivo_rutina}`}
                </p>
                {workout.sesion_hoy ? (
                  <div className="flex items-center gap-2 flex-wrap bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 shrink-0">
                    <Check size={14} className="text-green-600 shrink-0" />
                    <span className="text-sm font-semibold text-green-700">Completada hoy</span>
                    {workout.sesion_hoy.duracion_min != null && (
                      <span className="text-xs text-gray-400">· {workout.sesion_hoy.duracion_min} min</span>
                    )}
                    <span className="text-xs text-gray-400">· RPE {workout.sesion_hoy.esfuerzo_rpe}/10</span>
                    {workout.sesion_hoy.conformidad != null && (
                      <span className="text-xs text-gray-400">· Conformidad {workout.sesion_hoy.conformidad / 10}/10</span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/client/sesion', { state: { workout } })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D7FD8] text-white text-sm font-semibold hover:bg-[#1a6fc0] transition-colors shrink-0"
                  >
                    <Play size={14} fill="white" strokeWidth={0} />
                    Comenzar sesión
                  </button>
                )}
              </div>
            </div>

            {/* ── Ejercicios del día ── */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ejercicios del día</h2>
                <span className="text-xs text-gray-400">
                  {workout.ejercicios?.length ?? 0} ejercicios · toca para ver detalles
                </span>
              </div>

              {!workout.ejercicios?.length ? (
                <div className="bg-white rounded-2xl border border-gray-100 px-6 py-10 text-center">
                  <p className="text-sm text-gray-400">Este bloque no tiene ejercicios configurados</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {workout.ejercicios.map((ej, i) => (
                    <EjercicioCard
                      key={ej.id_ejercicio}
                      ejercicio={ej}
                      index={i}
                      onClick={() => setEjercicioActivo(ej)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      })}

      {/* ── Modal detalle ejercicio ── */}
      <Modal
        isOpen={!!ejercicioActivo}
        onClose={() => setEjercicioActivo(null)}
        title={ejercicioActivo?.nombre ?? ''}
      >
        {ejercicioActivo && (
          <div className="flex flex-col gap-5">

            {/* Categoría + grupo muscular */}
            <div className="flex items-center gap-2 flex-wrap -mt-2">
              {ejercicioActivo.categorias?.map((cat) => {
                const c = getCatColor(cat)
                return (
                  <span
                    key={cat}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    {cat.toUpperCase()}
                  </span>
                )
              })}
              {ejercicioActivo.grupo_muscular && (
                <span className="text-sm text-gray-400">{ejercicioActivo.grupo_muscular}</span>
              )}
            </div>

            {/* Banda azul clara de stats */}
            <div className="bg-blue-50 rounded-2xl px-6 py-4 flex items-center gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-black text-[#1D7FD8]">{ejercicioActivo.series_plan}</span>
                <span className="text-xs text-[#1D7FD8]/70 font-medium">Series</span>
              </div>
              <div className="w-px h-10 bg-blue-200" />
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-black text-[#1D7FD8]">{ejercicioActivo.reps_plan}</span>
                <span className="text-xs text-[#1D7FD8]/70 font-medium">Reps</span>
              </div>
              {ejercicioActivo.descanso_seg != null && (
                <>
                  <div className="w-px h-10 bg-blue-200" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-[#1D7FD8]">{ejercicioActivo.descanso_seg}s</span>
                    <span className="text-xs text-[#1D7FD8]/70 font-medium">Descanso</span>
                  </div>
                </>
              )}
              {ejercicioActivo.peso_obj != null && (
                <>
                  <div className="w-px h-10 bg-blue-200" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-[#1D7FD8]">{ejercicioActivo.peso_obj} kg</span>
                    <span className="text-xs text-[#1D7FD8]/70 font-medium">Objetivo</span>
                  </div>
                </>
              )}
            </div>

            {/* Zona de media */}
            {ejercicioActivo.video ? (
              <video
                controls
                src={`${MEDIA_BASE}/${ejercicioActivo.video.nombre_archivo}`}
                className="w-full rounded-2xl bg-[#0d1421] max-h-56"
              />
            ) : (
              <div className="w-full h-44 rounded-2xl bg-[#0d1421] flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Video size={24} className="text-white/30" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-white/30">Sin vídeo demostrativo</span>
              </div>
            )}

            {ejercicioActivo.imagen && (
              <img
                src={`${MEDIA_BASE}/${ejercicioActivo.imagen.nombre_archivo}`}
                alt={ejercicioActivo.imagen.nombre_original}
                className="w-full rounded-2xl object-contain bg-gray-50 max-h-48"
              />
            )}

            {/* CÓMO EJECUTARLO */}
            {ejercicioActivo.descripcion && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-[#1D7FD8]/70 uppercase tracking-widest">Cómo ejecutarlo</p>
                <p className="text-sm text-gray-700 leading-relaxed">{ejercicioActivo.descripcion}</p>
              </div>
            )}

            {/* Notas del entrenador */}
            {ejercicioActivo.notas && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-3">
                <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{ejercicioActivo.notas}</p>
              </div>
            )}

          </div>
        )}
      </Modal>

    </div>
  )
}

export default EntrenamientoPage
