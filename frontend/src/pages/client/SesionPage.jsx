import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Clock, Trophy, AlertTriangle, Check } from 'lucide-react'
import { assignmentsApi } from '../../services/api'
import NivelBadge from '../../components/shared/NivelBadge'

const CATEGORIA_COLORS = {
  FUERZA:       { bg: '#EFF6FF', text: '#1D7FD8' },
  CARDIO:       { bg: '#FFF7ED', text: '#ea580c' },
  FLEXIBILIDAD: { bg: '#F0FDF4', text: '#16a34a' },
  RESISTENCIA:  { bg: '#FAF5FF', text: '#7c3aed' },
  HIIT:         { bg: '#FFF1F2', text: '#dc2626' },
}
const DEFAULT_CAT = { bg: '#F3F4F6', text: '#6b7280' }
function getCatColor(cat) { return CATEGORIA_COLORS[cat?.toUpperCase()] ?? DEFAULT_CAT }

function formatSegundos(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function initSeries(ej) {
  return Array.from({ length: ej.series_plan || 3 }, () => ({
    kg:    ej.peso_obj != null ? String(ej.peso_obj) : '',
    reps:  String(ej.reps_plan || ''),
    hecha: false,
  }))
}

/* ── Timer SVG circular ── */
function RestCircle({ restante, total }) {
  const pct = total > 0 ? (restante / total) * 100 : 0
  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="absolute inset-0 w-10 h-10 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.9"
          fill="none"
          stroke="#1D7FD8"
          strokeWidth="3"
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] font-bold text-[#1D7FD8] z-10">{restante}</span>
    </div>
  )
}

/* ── Input numérico para KG/REPS ── */
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 text-center outline-none focus:border-[#1D7FD8] transition-colors bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
const inputHechaCls = 'w-full border border-green-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 text-center outline-none bg-green-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export default function SesionPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const workout   = location.state?.workout

  const [ejerciciosState, setEjerciciosState] = useState(() =>
    workout ? workout.ejercicios.map(ej => ({ ...ej, series: initSeries(ej) })) : []
  )
  const [segundos,   setSegundos]   = useState(0)
  const [descanso,   setDescanso]   = useState(null) // { restante, total, ejIdx }
  const [showModal,  setShowModal]  = useState(false)
  const [rpe,        setRpe]        = useState(5)
  const [conformidad, setConformidad] = useState(5)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!workout) navigate('/client/exercises', { replace: true })
  }, [workout, navigate])

  useEffect(() => {
    const id = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!descanso) return
    const id = setInterval(() => {
      setDescanso(prev => {
        if (!prev) return null
        if (prev.restante <= 1) return null
        return { ...prev, restante: prev.restante - 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [descanso?.total, descanso?.ejIdx])

  if (!workout) return null


  const totalSeries   = ejerciciosState.reduce((s, e) => s + e.series.length, 0)
  const hechas        = ejerciciosState.reduce((s, e) => s + e.series.filter(x => x.hecha).length, 0)
  const pct           = totalSeries > 0 ? Math.round((hechas / totalSeries) * 100) : 0
  const volumen       = ejerciciosState.reduce((s, e) =>
    s + e.series.filter(x => x.hecha).reduce((ss, x) => ss + (parseFloat(x.kg) || 0) * (parseInt(x.reps) || 0), 0), 0)
  const ejCompletados = ejerciciosState.filter(e => e.series.every(x => x.hecha)).length

  const hoy       = new Date()
  const inicio    = workout.fecha_inicio ? new Date(workout.fecha_inicio) : null
  const fin       = workout.fecha_fin    ? new Date(workout.fecha_fin)    : null
  const totalSem  = inicio && fin ? Math.max(1, Math.ceil((fin - inicio) / (7 * 86400000))) : 1
  const semActual = inicio ? Math.min(totalSem, Math.max(1, Math.ceil((hoy - inicio) / (7 * 86400000)))) : 1

  function setSerie(ejIdx, serIdx, campo, valor) {
    setEjerciciosState(prev => prev.map((e, i) =>
      i !== ejIdx ? e : {
        ...e,
        series: e.series.map((s, j) => j !== serIdx ? s : { ...s, [campo]: valor }),
      }
    ))
  }

  function completarSerie(ejIdx, serIdx) {
    setEjerciciosState(prev => {
      const next = prev.map((e, i) =>
        i !== ejIdx ? e : {
          ...e,
          series: e.series.map((s, j) => j !== serIdx ? s : { ...s, hecha: !s.hecha }),
        }
      )
      const ej  = next[ejIdx]
      const ser = ej.series[serIdx]
      const esUltima = serIdx === ej.series.length - 1
      if (ser.hecha && ej.descanso_seg > 0 && !esUltima) {
        setDescanso({ restante: ej.descanso_seg, total: ej.descanso_seg, ejIdx })
      }
      return next
    })
  }

  function añadirSerie(ejIdx) {
    setEjerciciosState(prev => prev.map((e, i) => {
      if (i !== ejIdx) return e
      const last = e.series.at(-1)
      return { ...e, series: [...e.series, { kg: last?.kg ?? '', reps: last?.reps ?? '', hecha: false }] }
    }))
  }

  async function handleGuardar() {
    setSaving(true)
    setError('')
    try {
      const sesion = await assignmentsApi.createMySession(workout.id_asignacion_rutina, {
        id_bloque_rutina: workout.id_bloque_rutina,
        duracion_min:     Math.max(1, Math.round(segundos / 60)),
        esfuerzo_rpe:     rpe,
        conformidad:      conformidad * 10,
      })
      const sessionId = sesion.id_sesion_rutina
      for (let idx = 0; idx < ejerciciosState.length; idx++) {
        const ej     = ejerciciosState[idx]
        const heched = ej.series.filter(s => s.hecha)
        if (heched.length === 0) continue
        const last = heched.at(-1)
        await assignmentsApi.createMyExerciseLog(sessionId, {
          id_ejercicio: ej.id_ejercicio,
          orden:        idx + 1,
          series_real:  heched.length,
          reps_real:    parseInt(last.reps) || ej.reps_plan || 1,
          peso_real:    last.kg !== '' ? parseFloat(last.kg) : null,
        })
      }
      navigate('/client/inicio')
    } catch (err) {
      setError(err.message || 'Error al guardar la sesión')
      setSaving(false)
    }
  }

  const ejerciciosIncompletos = ejerciciosState.filter(e => !e.series.every(s => s.hecha))

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/client/exercises')}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-gray-900 text-base">{workout.nombre_rutina}</span>
              {workout.nivel_rutina && <NivelBadge nivel={workout.nivel_rutina} />}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {workout.objetivo_rutina ?? workout.nombre_bloque ?? '—'}
              {' · '}Día {workout.numero_dia}
              {' · '}Semana {semActual}/{totalSem}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50">
              <Clock size={14} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-700 tabular-nums">{formatSegundos(segundos)}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-[#1D7FD8] text-white text-sm font-bold hover:bg-[#1a6fc0] transition-colors"
            >
              Terminar
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{hechas} de {totalSeries} series completadas</span>
            <span className="font-semibold text-[#1D7FD8]">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-[#1D7FD8] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-2xl mx-auto w-full">

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: `${ejCompletados}/${ejerciciosState.length}`, lbl: 'Ejercicios' },
            { val: `${Math.round(volumen)} kg`,                  lbl: 'Volumen' },
            { val: formatSegundos(segundos),                     lbl: 'Duración' },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 text-center shadow-sm">
              <p className="text-xl font-black text-gray-900 tabular-nums">{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Exercise cards */}
        {ejerciciosState.map((ej, ejIdx) => {
          const cat      = ej.categorias?.[0]
          const catColor = getCatColor(cat)
          const tieneKg  = ej.peso_obj != null || ej.categorias?.some(c => c.toUpperCase() !== 'CARDIO')
          const heched   = ej.series.filter(s => s.hecha).length
          const mostrarDescanso = descanso && descanso.ejIdx === ejIdx

          return (
            <div key={ejIdx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Cabecera */}
              <div className="px-5 py-4 flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {ejIdx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-900">{ej.nombre}</span>
                    {cat && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: catColor.bg, color: catColor.text }}
                      >
                        {cat.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {ej.grupo_muscular && (
                    <p className="text-xs text-gray-400 mt-0.5">{ej.grupo_muscular}</p>
                  )}
                </div>
                <span className="text-sm shrink-0 mt-0.5">
                  <span className="font-black text-[#1D7FD8]">{heched}/{ej.series.length}</span>
                  <span className="text-gray-400"> series</span>
                </span>
              </div>

              {/* Tabla de series */}
              <div className="px-5 pb-4">
                {/* Cabecera columnas */}
                <div className={`grid gap-3 mb-2 pb-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide ${tieneKg ? 'grid-cols-[28px_1fr_1fr_36px]' : 'grid-cols-[28px_1fr_36px]'}`}>
                  <span>#</span>
                  {tieneKg && <span>Peso</span>}
                  <span>Reps</span>
                  <span />
                </div>

                {/* Filas */}
                <div className="flex flex-col gap-2">
                  {ej.series.map((serie, serIdx) => (
                    <div key={serIdx}>
                      {/* Fila de serie */}
                      <div className={`grid gap-3 items-center ${tieneKg ? 'grid-cols-[28px_1fr_1fr_36px]' : 'grid-cols-[28px_1fr_36px]'}`}>
                        <span className={`text-sm font-bold text-center ${serie.hecha ? 'text-green-600' : 'text-gray-400'}`}>
                          {serIdx + 1}
                        </span>

                        {tieneKg && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400 font-medium ml-1">KG</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="—"
                              className={serie.hecha ? inputHechaCls : inputCls}
                              value={serie.kg}
                              onChange={e => setSerie(ejIdx, serIdx, 'kg', e.target.value)}
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-gray-400 font-medium ml-1">REPS</span>
                          <input
                            type="number"
                            min="1"
                            className={serie.hecha ? inputHechaCls : inputCls}
                            value={serie.reps}
                            onChange={e => setSerie(ejIdx, serIdx, 'reps', e.target.value)}
                          />
                        </div>

                        <button
                          onClick={() => completarSerie(ejIdx, serIdx)}
                          className={[
                            'w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 self-end',
                            serie.hecha
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-500',
                          ].join(' ')}
                        >
                          <Check size={16} strokeWidth={serie.hecha ? 3 : 2} />
                        </button>
                      </div>

                      {mostrarDescanso && serie.hecha && serIdx === ej.series.filter(s => s.hecha).length - 1 && serIdx < ej.series.length - 1 && (
                        <div className="mt-2 flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                          <RestCircle restante={descanso.restante} total={descanso.total} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">Descanso</p>
                            <p className="text-xs text-gray-500">Siguiente serie en {descanso.restante}s</p>
                          </div>
                          <button
                            onClick={() => setDescanso(null)}
                            className="text-sm font-bold text-[#1D7FD8] hover:underline"
                          >
                            Saltar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Añadir serie */}
                <button
                  onClick={() => añadirSerie(ejIdx)}
                  className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
                >
                  + Añadir serie
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modal de finalización ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="px-6 pt-8 pb-4 flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-1">
                <Trophy size={32} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">¡Sesión completada!</h2>
              <p className="text-sm text-gray-400">
                {workout.nombre_rutina} · {workout.nombre_bloque ?? `Día ${workout.numero_dia}`}
              </p>
            </div>

            {/* Stats */}
            <div className="px-6 grid grid-cols-3 gap-3 mb-4">
              {[
                { val: formatSegundos(segundos), lbl: 'Duración' },
                { val: String(hechas),           lbl: 'Series hechas' },
                { val: `${Math.round(volumen)} kg`, lbl: 'Volumen total' },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="bg-gray-50 rounded-xl px-3 py-4 text-center">
                  <p className="text-lg font-black text-gray-900 tabular-nums">{val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>

            {/* Ejercicios incompletos */}
            {ejerciciosIncompletos.length > 0 && (
              <div className="px-6 mb-4 flex flex-col gap-2">
                {ejerciciosIncompletos.map((ej, i) => {
                  const heched = ej.series.filter(s => s.hecha).length
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{ej.nombre}</span>
                      </div>
                      <span className="text-sm font-bold text-orange-500">{heched}/{ej.series.length} series</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* RPE */}
            <div className="px-6 mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                Esfuerzo percibido (RPE)
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Lo difícil que te resultó — esfuerzo físico durante el entreno
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setRpe(n)}
                    className={[
                      'flex-1 min-w-[36px] py-2 rounded-xl text-sm font-bold transition-colors',
                      rpe === n
                        ? 'bg-[#1D7FD8] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Conformidad */}
            <div className="px-6 mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                Conformidad
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Si te gustó el entrenamiento — satisfacción general con la sesión
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setConformidad(n)}
                    className={[
                      'flex-1 min-w-[36px] py-2 rounded-xl text-sm font-bold transition-colors',
                      conformidad === n
                        ? 'bg-[#1D7FD8] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="px-6 mb-3 text-sm text-red-500 text-center">{error}</p>}

            {/* Botón guardar */}
            <div className="px-6 pb-6">
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#1D7FD8] text-white font-bold text-base hover:bg-[#1a6fc0] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Guardando…' : 'Guardar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
