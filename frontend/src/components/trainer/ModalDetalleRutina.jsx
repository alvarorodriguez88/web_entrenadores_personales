import { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import Button from '../shared/Button'
import Input from '../shared/Input'
import { routinesApi } from '../../services/api'

const NIVEL_OPTIONS = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO']

const ESTADO_BADGE = {
  ACTIVA:   'bg-green-100 text-green-700',
  INACTIVA: 'bg-gray-100 text-gray-500',
  COMPLETADA: 'bg-blue-100 text-[#1D7FD8]',
}

function estadoBadge(estado) {
  return ESTADO_BADGE[estado] ?? 'bg-gray-100 text-gray-500'
}

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const emptyForm = { nombre: '', objetivo: '', descripcion: '', nivel: '' }

function ModalDetalleRutina({ isOpen, onClose, rutina, ejercicios = [], onSuccess }) {
  const [form,         setForm]        = useState(emptyForm)
  const [bloques,      setBloques]     = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading,      setLoading]     = useState(false)
  const [saving,       setSaving]      = useState(false)
  const [error,        setError]       = useState('')

  useEffect(() => {
    if (!isOpen || !rutina) return
    setForm({
      nombre:      rutina.nombre      ?? '',
      objetivo:    rutina.objetivo    ?? '',
      descripcion: rutina.descripcion ?? '',
      nivel:       rutina.nivel       ?? '',
    })
    setBloques([])
    setAsignaciones([])
    setError('')
    cargarDatos(rutina.id_rutina)
  }, [isOpen, rutina?.id_rutina])

  async function cargarDatos(routineId) {
    setLoading(true)
    try {
      const [bloquesData, asignData] = await Promise.all([
        routinesApi.getBlocks(routineId),
        routinesApi.getRoutineAssignments(routineId),
      ])
      setAsignaciones(asignData)

      const bloquesConEjercicios = await Promise.all(
        bloquesData.map(async (b) => {
          const exs = await routinesApi.getBlockExercises(routineId, b.id_bloque_rutina)
          return { ...b, ejercicios: exs }
        })
      )
      setBloques(bloquesConEjercicios)
    } catch {
      // silencioso — las secciones muestran vacío
    } finally {
      setLoading(false)
    }
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      await routinesApi.updateRoutine(rutina.id_rutina, {
        nombre:      form.nombre      || null,
        objetivo:    form.objetivo    || null,
        descripcion: form.descripcion || null,
        nivel:       form.nivel       || null,
      })
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function resolveNombre(id_ejercicio) {
    return ejercicios.find((e) => e.id_ejercicio === id_ejercicio)?.nombre ?? `Ej. #${id_ejercicio}`
  }

  if (!rutina) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de la rutina" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-6">

        {/* ── Sección editar ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Información de la rutina
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                placeholder="Nombre de la rutina"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Objetivo</label>
              <Input
                value={form.objetivo}
                onChange={(e) => setField('objetivo', e.target.value)}
                placeholder="Objetivo"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nivel</label>
              <select
                value={form.nivel}
                onChange={(e) => setField('nivel', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
              >
                <option value="">Sin especificar</option>
                {NIVEL_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n.charAt(0) + n.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setField('descripcion', e.target.value)}
                placeholder="Descripción de la rutina"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30 resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button loading={saving} onClick={handleGuardar}>Guardar cambios</Button>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Sección estructura ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Estructura de la rutina
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <span className="w-5 h-5 border-2 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bloques.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Esta rutina no tiene bloques definidos
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {bloques.map((bloque) => (
                <div key={bloque.id_bloque_rutina} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-700 mb-2">
                    Día {bloque.numero_dia}{bloque.nombre ? ` — ${bloque.nombre}` : ''}
                  </p>
                  {bloque.ejercicios.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin ejercicios</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {bloque.ejercicios.map((be) => {
                        const parts = [
                          `${be.series_plan}×${be.reps_plan} reps`,
                          be.peso_obj  ? `${be.peso_obj} kg`  : null,
                          be.descanso_seg ? `${be.descanso_seg}s descanso` : null,
                        ].filter(Boolean)
                        return (
                          <p key={be.id_bloque_rutina_ejercicio} className="text-xs text-gray-600">
                            <span className="font-medium">{resolveNombre(be.id_ejercicio)}</span>
                            {' — '}
                            <span className="text-gray-400">{parts.join(' · ')}</span>
                          </p>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Sección clientes asignados ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Clientes asignados
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <span className="w-5 h-5 border-2 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : asignaciones.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Ningún cliente tiene esta rutina asignada
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {asignaciones.map((a) => (
                <div key={a.id_asignacion_rutina} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1D7FD8] text-xs font-bold flex items-center justify-center shrink-0">
                    {initials(a.nombre, a.apellidos)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {a.nombre} {a.apellidos}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${estadoBadge(a.estado)}`}>
                    {a.estado.charAt(0) + a.estado.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}

export default ModalDetalleRutina
