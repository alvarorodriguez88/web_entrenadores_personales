import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { exercisesApi, routinesApi } from '../../services/api'
import {
  DIA_CONFIG, OBJETIVO_OPTIONS, NIVEL_OPTIONS, inputCls, numInputCls, newEjercicio,
} from '../../utils/rutinas'

const emptyForm = { nombre: '', objetivo: '', nivel: '', descripcion: '' }

function ModalCrearRutina({ isOpen, onClose, onSuccess }) {
  const [form,              setForm]              = useState(emptyForm)
  const [diasSeleccionados, setDiasSeleccionados] = useState(new Set())
  const [bloquesPorDia,     setBloquesPorDia]     = useState({})
  const [ejerciciosDisp,    setEjerciciosDisp]    = useState([])
  const [error,             setError]             = useState('')
  const [saving,            setSaving]            = useState(false)

  useEffect(() => {
    if (!isOpen) return
    exercisesApi.getExercises()
      .then((data) => setEjerciciosDisp(data.filter((e) => !e.archivado)))
      .catch(() => {})
  }, [isOpen])

  const ejercicioOptions = ejerciciosDisp.map((e) => ({
    value: String(e.id_ejercicio),
    label: e.nombre,
  }))

  const totalDias       = diasSeleccionados.size
  const totalEjercicios = Object.values(bloquesPorDia).reduce(
    (sum, b) => sum + b.ejercicios.filter((e) => e.id_ejercicio).length,
    0
  )

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function toggleDia(dia) {
    setDiasSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(dia)) {
        next.delete(dia)
        setBloquesPorDia((p) => { const q = { ...p }; delete q[dia]; return q })
      } else {
        next.add(dia)
        setBloquesPorDia((p) => ({ ...p, [dia]: { nombre: '', ejercicios: [newEjercicio()] } }))
      }
      return next
    })
  }

  function setBloqueName(dia, nombre) {
    setBloquesPorDia((p) => ({ ...p, [dia]: { ...p[dia], nombre } }))
  }

  function addEjercicio(dia) {
    setBloquesPorDia((p) => ({
      ...p,
      [dia]: { ...p[dia], ejercicios: [...p[dia].ejercicios, newEjercicio()] },
    }))
  }

  function updateEjercicio(dia, ei, campo, valor) {
    setBloquesPorDia((p) => ({
      ...p,
      [dia]: {
        ...p[dia],
        ejercicios: p[dia].ejercicios.map((e, j) => j === ei ? { ...e, [campo]: valor } : e),
      },
    }))
  }

  function removeEjercicio(dia, ei) {
    setBloquesPorDia((p) => ({
      ...p,
      [dia]: {
        ...p[dia],
        ejercicios: p[dia].ejercicios.filter((_, j) => j !== ei),
      },
    }))
  }

  function cerrar() {
    onClose()
    setForm(emptyForm)
    setDiasSeleccionados(new Set())
    setBloquesPorDia({})
    setError('')
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (diasSeleccionados.size === 0) { setError('Selecciona al menos un día de entrenamiento'); return }
    setError(''); setSaving(true)
    try {
      const rutina = await routinesApi.createRoutine({
        nombre:      form.nombre,
        objetivo:    form.objetivo    || null,
        nivel:       form.nivel       || null,
        descripcion: form.descripcion || null,
      })
      for (const dia of [1, 2, 3, 4, 5, 6, 7]) {
        if (!diasSeleccionados.has(dia)) continue
        const bloque = bloquesPorDia[dia]
        const block  = await routinesApi.createBlock(rutina.id_rutina, {
          numero_dia: dia,
          nombre:     bloque.nombre || null,
        })
        for (let j = 0; j < bloque.ejercicios.length; j++) {
          const ej = bloque.ejercicios[j]
          if (!ej.id_ejercicio) continue
          await routinesApi.createBlockExercise(rutina.id_rutina, block.id_bloque_rutina, {
            id_ejercicio: Number(ej.id_ejercicio),
            orden:        j + 1,
            series_plan:  Number(ej.series_plan) || 1,
            reps_plan:    Number(ej.reps_plan)   || 1,
            peso_obj:     ej.peso_obj !== '' ? Number(ej.peso_obj) : null,
          })
        }
      }
      onSuccess?.()
      cerrar()
    } catch (err) {
      setError(err.message || 'Error al crear la rutina')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={cerrar}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-black text-gray-900">Crear rutina</h2>
            <p className="text-sm text-gray-400">
              {totalDias} {totalDias === 1 ? 'día' : 'días'} · {totalEjercicios} {totalEjercicios === 1 ? 'ejercicio asignado' : 'ejercicios asignados'}
            </p>
          </div>
          <button
            onClick={cerrar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

          {/* Datos de la rutina */}
          <section className="flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos de la rutina</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</label>
                <input
                  className={inputCls}
                  placeholder="p. ej. Fuerza Base 3 días"
                  value={form.nombre}
                  onChange={(e) => setField('nombre', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Objetivo</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={form.objetivo}
                  onChange={(e) => setField('objetivo', e.target.value)}
                >
                  <option value="">Objetivo</option>
                  {OBJETIVO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={form.nivel}
                  onChange={(e) => setField('nivel', e.target.value)}
                >
                  <option value="">Nivel</option>
                  {NIVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Descripción de la rutina (opcional)..."
              value={form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
            />
          </section>

          {/* Días de entrenamiento */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Días de entrenamiento</p>
              <p className="text-sm text-gray-400">Selecciona los días en los que se entrena esta rutina</p>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((dia) => {
                const cfg      = DIA_CONFIG[dia]
                const selected = diasSeleccionados.has(dia)
                return (
                  <button
                    key={dia}
                    onClick={() => toggleDia(dia)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl transition-all"
                    style={selected ? {
                      border:          `2px solid ${cfg.color}`,
                      backgroundColor: cfg.bg,
                      color:           cfg.color,
                    } : {
                      border:          '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color:           '#9CA3AF',
                    }}
                  >
                    <span className="text-sm font-bold">{cfg.abrev}</span>
                    <span
                      className="mt-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selected ? cfg.color : 'transparent' }}
                    />
                  </button>
                )
              })}
            </div>
          </section>

          {/* Tarjetas de bloque */}
          {[1, 2, 3, 4, 5, 6, 7].filter((d) => diasSeleccionados.has(d)).map((dia) => {
            const cfg    = DIA_CONFIG[dia]
            const bloque = bloquesPorDia[dia]
            if (!bloque) return null
            return (
              <div
                key={dia}
                className="rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  >
                    {cfg.abrev}
                  </span>
                  <span className="font-semibold text-gray-800">{cfg.nombre}</span>
                  <input
                    className="ml-auto flex-1 max-w-[240px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors"
                    placeholder="Nombre del bloque (opcional)"
                    value={bloque.nombre}
                    onChange={(e) => setBloqueName(dia, e.target.value)}
                  />
                  <button
                    onClick={() => toggleDia(dia)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 bg-white/70 hover:bg-white/90 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="bg-white px-4 pb-4">
                  <div className="grid gap-2 mb-2 pt-3 border-t border-gray-100"
                    style={{ gridTemplateColumns: '1fr 80px 80px 96px 24px' }}>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ejercicio</span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Series</span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reps</span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Peso (kg)</span>
                    <span />
                  </div>

                  <div className="flex flex-col gap-2">
                    {bloque.ejercicios.map((ej, ei) => (
                      <div key={ei} className="grid gap-2 items-center"
                        style={{ gridTemplateColumns: '1fr 80px 80px 96px 24px' }}>
                        <select
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1D7FD8] transition-colors cursor-pointer"
                          value={ej.id_ejercicio}
                          onChange={(e) => updateEjercicio(dia, ei, 'id_ejercicio', e.target.value)}
                        >
                          <option value="">Selecciona ejercicio</option>
                          {ejercicioOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <input type="number" min="1" className={numInputCls}
                          value={ej.series_plan}
                          onChange={(e) => updateEjercicio(dia, ei, 'series_plan', e.target.value)} />
                        <input type="number" min="1" className={numInputCls}
                          value={ej.reps_plan}
                          onChange={(e) => updateEjercicio(dia, ei, 'reps_plan', e.target.value)} />
                        <input type="number" min="0" step="0.5" className={numInputCls}
                          placeholder="—" value={ej.peso_obj}
                          onChange={(e) => updateEjercicio(dia, ei, 'peso_obj', e.target.value)} />
                        <button
                          onClick={() => removeEjercicio(dia, ei)}
                          disabled={bloque.ejercicios.length === 1}
                          className="flex items-center justify-center text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addEjercicio(dia)}
                    className="mt-3 text-sm font-semibold hover:underline"
                    style={{ color: cfg.color }}
                  >
                    + Añadir ejercicio
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : <span />}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={cerrar}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D7FD8] hover:bg-[#1a6fc0] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar rutina'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalCrearRutina
