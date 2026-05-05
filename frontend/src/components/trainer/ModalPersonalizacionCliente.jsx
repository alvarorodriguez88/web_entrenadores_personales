import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import Modal from '../shared/Modal'
import { routinesApi, assignmentsApi } from '../../services/api'
import AvatarCircle from '../shared/AvatarCircle'
import Spinner from '../shared/Spinner'

const ESTADO_BADGE = {
  ACTIVA:  { cls: 'bg-green-50 text-green-700',   dot: '#16a34a', label: 'Activa'  },
  PAUSADA: { cls: 'bg-yellow-50 text-yellow-700', dot: '#ca8a04', label: 'Pausada' },
}

const numCls = 'w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 text-center outline-none focus:border-[#1D7FD8] transition-colors placeholder:text-gray-300'
const notasCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1D7FD8] transition-colors placeholder:text-gray-300'

export default function ModalPersonalizacionCliente({ isOpen, onClose, asignacion, rutinaId }) {
  const [bloques,  setBloques]  = useState([])
  const [existing, setExisting] = useState({})
  const [form,     setForm]     = useState({})
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!isOpen || !asignacion || !rutinaId) return
    setError('')
    setBloques([])
    setExisting({})
    setForm({})
    cargarDatos()
  }, [isOpen, asignacion?.id_asignacion_rutina, rutinaId])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [bloquesRaw, customsRaw] = await Promise.all([
        routinesApi.getBlocks(rutinaId),
        assignmentsApi.getAssignmentExercises(asignacion.id_asignacion_rutina),
      ])

      const bloquesConEj = await Promise.all(
        (Array.isArray(bloquesRaw) ? bloquesRaw : []).map(async (b) => {
          const exs = await routinesApi.getBlockExercises(rutinaId, b.id_bloque_rutina)
          return { ...b, ejercicios: Array.isArray(exs) ? exs : [] }
        })
      )
      bloquesConEj.sort((a, b) => a.numero_dia - b.numero_dia)
      setBloques(bloquesConEj)

      const existingMap = {}
      for (const c of (Array.isArray(customsRaw) ? customsRaw : [])) {
        existingMap[c.id_bloque_rutina_ej] = c
      }
      setExisting(existingMap)

      const initForm = {}
      for (const [id, c] of Object.entries(existingMap)) {
        initForm[id] = {
          series:   c.series_plan  != null ? String(c.series_plan)  : '',
          reps:     c.reps_plan    != null ? String(c.reps_plan)    : '',
          peso:     c.peso_obj     != null ? String(c.peso_obj)     : '',
          descanso: c.descanso_seg != null ? String(c.descanso_seg) : '',
          notas:    c.notas ?? '',
        }
      }
      setForm(initForm)
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  function setField(id_be, campo, valor) {
    setForm((p) => ({ ...p, [id_be]: { ...(p[id_be] ?? {}), [campo]: valor } }))
  }

  async function guardar() {
    setError('')
    setSaving(true)
    try {
      for (const bloque of bloques) {
        for (const ej of bloque.ejercicios) {
          const id = ej.id_bloque_rutina_ejercicio
          const ex = existing[id]
          const f  = form[id] ?? {}
          const data = {
            series_plan:  f.series   ? Number(f.series)   : null,
            reps_plan:    f.reps     ? Number(f.reps)     : null,
            peso_obj:     f.peso     ? Number(f.peso)     : null,
            descanso_seg: f.descanso ? Number(f.descanso) : null,
            notas:        f.notas?.trim() || null,
          }
          const hasValues = Object.values(data).some((v) => v != null)

          if (ex && hasValues) {
            await assignmentsApi.updateAssignmentExercise(
              asignacion.id_asignacion_rutina, ex.id_asignacion_ejercicio, data
            )
          } else if (ex && !hasValues) {
            await assignmentsApi.deleteAssignmentExercise(
              asignacion.id_asignacion_rutina, ex.id_asignacion_ejercicio
            )
          } else if (!ex && hasValues) {
            await assignmentsApi.createAssignmentExercise(
              asignacion.id_asignacion_rutina, { id_bloque_rutina_ej: id, ...data }
            )
          }
        }
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !asignacion) return null

  const est = ESTADO_BADGE[asignacion.estado] ?? ESTADO_BADGE.ACTIVA

  const footer = (
    <div className="px-6 py-4 flex items-center gap-4">
      {error && <p className="text-sm text-red-500 flex-1">{error}</p>}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D7FD8] hover:bg-[#1a6fc0] disabled:opacity-60 transition-colors"
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Check size={14} />
          }
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Personalización de ejercicios"
      maxWidth="max-w-3xl"
      footer={footer}
    >
      {/* Client header */}
      <div className="flex items-center gap-3 pb-5 border-b border-gray-100 -mt-2">
        <AvatarCircle nombre={asignacion.nombre} apellidos={asignacion.apellidos} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{asignacion.nombre} {asignacion.apellidos}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Deja un campo vacío para usar el valor por defecto de la rutina
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${est.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: est.dot }} />
          {est.label}
        </span>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : bloques.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          Esta rutina no tiene ejercicios configurados
        </p>
      ) : (
        <div className="flex flex-col gap-6 mt-5">
          {bloques.map((bloque) => (
            <div key={bloque.id_bloque_rutina} className="flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Día {bloque.numero_dia}{bloque.nombre ? ` — ${bloque.nombre}` : ''}
              </p>

              <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 68px 68px 76px 80px 1fr' }}>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ejercicio</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Series</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reps</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Peso kg</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Desc. s</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notas</span>
              </div>

              <div className="flex flex-col gap-2">
                {bloque.ejercicios.map((ej) => {
                  const id = ej.id_bloque_rutina_ejercicio
                  const f  = form[id] ?? {}
                  return (
                    <div
                      key={id}
                      className="grid gap-2 items-center"
                      style={{ gridTemplateColumns: '1fr 68px 68px 76px 80px 1fr' }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{ej.nombre_ejercicio}</p>
                        <p className="text-xs text-gray-400">
                          {ej.series_plan}×{ej.reps_plan}
                          {ej.peso_obj    != null ? ` · ${ej.peso_obj}kg`   : ''}
                          {ej.descanso_seg != null ? ` · ${ej.descanso_seg}s` : ''}
                        </p>
                      </div>
                      <input
                        type="number" min="1" className={numCls}
                        placeholder={String(ej.series_plan)}
                        value={f.series ?? ''}
                        onChange={(e) => setField(id, 'series', e.target.value)}
                      />
                      <input
                        type="number" min="1" className={numCls}
                        placeholder={String(ej.reps_plan)}
                        value={f.reps ?? ''}
                        onChange={(e) => setField(id, 'reps', e.target.value)}
                      />
                      <input
                        type="number" min="0" step="0.5" className={numCls}
                        placeholder={ej.peso_obj != null ? String(ej.peso_obj) : '—'}
                        value={f.peso ?? ''}
                        onChange={(e) => setField(id, 'peso', e.target.value)}
                      />
                      <input
                        type="number" min="0" className={numCls}
                        placeholder={ej.descanso_seg != null ? String(ej.descanso_seg) : '—'}
                        value={f.descanso ?? ''}
                        onChange={(e) => setField(id, 'descanso', e.target.value)}
                      />
                      <input
                        type="text" className={notasCls}
                        placeholder="Nota para este ejercicio…"
                        value={f.notas ?? ''}
                        onChange={(e) => setField(id, 'notas', e.target.value)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
