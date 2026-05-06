import { useState, useEffect, useMemo } from 'react'
import { BookOpen, X, Trash2, ChevronRight } from 'lucide-react'
import { routinesApi } from '../../services/api'
import ModalPersonalizacionCliente from './ModalPersonalizacionCliente'
import {
  DIA_CONFIG, OBJETIVO_OPTIONS, NIVEL_OPTIONS, NIVEL_ICON, inputCls, numInputCls, newEjercicio,
} from '../../utils/rutinas'
import { avatarColor, initials } from '../../utils/format'
import { formatDate } from '../../utils/date'
import Spinner     from '../shared/Spinner'
import NivelBadge  from '../shared/NivelBadge'
import AvatarCircle from '../shared/AvatarCircle'

const ESTADO_BADGE = {
  ACTIVA:     { cls: 'bg-green-50 text-green-700',   dot: '#16a34a', label: 'Activa'     },
  PAUSADA:    { cls: 'bg-yellow-50 text-yellow-700', dot: '#ca8a04', label: 'Pausada'    },
  COMPLETADA: { cls: 'bg-gray-100 text-gray-500',    dot: '#9CA3AF', label: 'Finalizada' },
  INACTIVA:   { cls: 'bg-gray-100 text-gray-500',    dot: '#9CA3AF', label: 'Inactiva'   },
}

const emptyForm = { nombre: '', objetivo: '', nivel: '', descripcion: '' }

export default function ModalDetalleRutina({ isOpen, onClose, rutina, ejercicios = [], onSuccess }) {
  const [tab,  setTab]  = useState('info')
  const [form, setForm] = useState(emptyForm)

  const [diasSeleccionados,    setDiasSeleccionados]    = useState(new Set())
  const [bloquesPorDia,        setBloquesPorDia]        = useState({})
  const [bloquesEliminados,    setBloquesEliminados]    = useState([])
  const [ejerciciosEliminados, setEjerciciosEliminados] = useState({})

  const [asignaciones,          setAsignaciones]          = useState([])
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!isOpen || !rutina) return
    setTab('info')
    setForm({
      nombre:      rutina.nombre      ?? '',
      objetivo:    rutina.objetivo    ?? '',
      nivel:       rutina.nivel       ?? '',
      descripcion: rutina.descripcion ?? '',
    })
    setDiasSeleccionados(new Set())
    setBloquesPorDia({})
    setBloquesEliminados([])
    setEjerciciosEliminados({})
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
      setAsignaciones(Array.isArray(asignData) ? asignData : [])

      const diasSet = new Set()
      const porDia  = {}
      await Promise.all(
        bloquesData.map(async (b) => {
          const exs = await routinesApi.getBlockExercises(routineId, b.id_bloque_rutina)
          diasSet.add(b.numero_dia)
          porDia[b.numero_dia] = {
            id_bloque_rutina: b.id_bloque_rutina,
            nombre:           b.nombre ?? '',
            ejercicios:       (Array.isArray(exs) ? exs : []).map((e, i) => ({
              id_be:        e.id_bloque_rutina_ejercicio,
              id_ejercicio: String(e.id_ejercicio),
              series_plan:  e.series_plan  ?? 3,
              reps_plan:    e.reps_plan    ?? 10,
              peso_obj:     e.peso_obj     ?? '',
              descanso_seg: e.descanso_seg ?? '',
              orden:        e.orden        ?? i + 1,
            })),
          }
        })
      )
      setDiasSeleccionados(diasSet)
      setBloquesPorDia(porDia)
    } catch {
      
    } finally {
      setLoading(false)
    }
  }

  // ── Contadores live ─────────────────────────────────────────────
  const totalDias = diasSeleccionados.size

  const totalEjercicios = useMemo(() =>
    Object.values(bloquesPorDia).reduce(
      (sum, b) => sum + b.ejercicios.filter((e) => e.id_ejercicio).length,
      0
    ), [bloquesPorDia])

  const clientesActivos = asignaciones.filter((a) => a.estado === 'ACTIVA').length

  const ejercicioOptions = ejercicios
    .filter((e) => !e.archivado)
    .map((e) => ({ value: String(e.id_ejercicio), label: e.nombre }))

  // ── Form ────────────────────────────────────────────────────────
  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  // ── Estructura: días ────────────────────────────────────────────
  function toggleDia(dia) {
    setDiasSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(dia)) {
        next.delete(dia)
        const bloque = bloquesPorDia[dia]
        if (bloque?.id_bloque_rutina) {
          setBloquesEliminados((p) => [...p, { id_bloque_rutina: bloque.id_bloque_rutina }])
        }
        setBloquesPorDia((p) => { const q = { ...p }; delete q[dia]; return q })
      } else {
        next.add(dia)
        setBloquesPorDia((p) => ({
          ...p,
          [dia]: { id_bloque_rutina: undefined, nombre: '', ejercicios: [newEjercicio()] },
        }))
      }
      return next
    })
  }

  function setBloqueName(dia, nombre) {
    setBloquesPorDia((p) => ({ ...p, [dia]: { ...p[dia], nombre } }))
  }

  // ── Estructura: ejercicios ──────────────────────────────────────
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
    const bloque = bloquesPorDia[dia]
    const ej = bloque.ejercicios[ei]
    if (ej.id_be && bloque.id_bloque_rutina) {
      setEjerciciosEliminados((p) => {
        const key  = bloque.id_bloque_rutina
        const prev = p[key] ?? new Set()
        return { ...p, [key]: new Set([...prev, ej.id_be]) }
      })
    }
    setBloquesPorDia((p) => ({
      ...p,
      [dia]: { ...p[dia], ejercicios: p[dia].ejercicios.filter((_, j) => j !== ei) },
    }))
  }

  // ── Guardar ────────────────────────────────────────────────────
  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setSaving(true)
    try {
      await routinesApi.updateRoutine(rutina.id_rutina, {
        nombre:      form.nombre      || null,
        objetivo:    form.objetivo    || null,
        nivel:       form.nivel       || null,
        descripcion: form.descripcion || null,
      })

      for (const b of bloquesEliminados) {
        await routinesApi.deleteBlock(rutina.id_rutina, b.id_bloque_rutina)
      }

      for (const dia of [1, 2, 3, 4, 5, 6, 7]) {
        if (!diasSeleccionados.has(dia)) continue
        const bloque = bloquesPorDia[dia]
        let blockId  = bloque.id_bloque_rutina

        if (blockId) {
          await routinesApi.updateBlock(rutina.id_rutina, blockId, { nombre: bloque.nombre || null })
        } else {
          const newBlock = await routinesApi.createBlock(rutina.id_rutina, {
            numero_dia: dia,
            nombre:     bloque.nombre || null,
          })
          blockId = newBlock.id_bloque_rutina
        }

        const toDelete = ejerciciosEliminados[bloque.id_bloque_rutina] ?? new Set()
        for (const id_be of toDelete) {
          await routinesApi.deleteBlockExercise(rutina.id_rutina, blockId, id_be)
        }

        for (let j = 0; j < bloque.ejercicios.length; j++) {
          const ej = bloque.ejercicios[j]
          if (!ej.id_ejercicio) continue
          const data = {
            id_ejercicio: Number(ej.id_ejercicio),
            orden:        j + 1,
            series_plan:  Number(ej.series_plan) || 1,
            reps_plan:    Number(ej.reps_plan)   || 1,
            peso_obj:     ej.peso_obj     !== '' ? Number(ej.peso_obj)     : null,
            descanso_seg: ej.descanso_seg !== '' ? Number(ej.descanso_seg) : null,
          }
          if (ej.id_be) {
            await routinesApi.updateBlockExercise(rutina.id_rutina, blockId, ej.id_be, data)
          } else {
            await routinesApi.createBlockExercise(rutina.id_rutina, blockId, data)
          }
        }
      }

      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Archivar ───────────────────────────────────────────────────
  async function handleArchivar() {
    setArchiving(true)
    try {
      await routinesApi.archiveRoutine(rutina.id_rutina)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Error al archivar')
      setArchiving(false)
    }
  }

  if (!isOpen || !rutina) return null

  const nivelIcon     = NIVEL_ICON[form.nivel] ?? { bg: '#F3F4F6', color: '#6B7280' }
  const diasOrdenados = [1, 2, 3, 4, 5, 6, 7].filter((d) => diasSeleccionados.has(d))

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100 shrink-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: nivelIcon.bg }}
          >
            <BookOpen size={20} style={{ color: nivelIcon.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-gray-900">{form.nombre || rutina.nombre}</h2>
              <NivelBadge nivel={form.nivel} />
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {[form.objetivo, `${totalDias} ${totalDias === 1 ? 'día' : 'días'}/semana`]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: 'info',       label: 'Información',        badge: null                },
            { key: 'estructura', label: 'Estructura',         badge: totalDias           },
            { key: 'clientes',   label: 'Clientes asignados', badge: asignaciones.length },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm border-b-2 transition-colors ${
                tab === key
                  ? 'border-[#1D7FD8] text-gray-900 font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
              {badge != null && badge > 0 && (
                <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Pestaña: Información */}
          {tab === 'info' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-[1fr_160px_160px] gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</label>
                  <input
                    className={inputCls}
                    placeholder="Nombre de la rutina"
                    value={form.nombre}
                    onChange={(e) => setField('nombre', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel</label>
                  <select
                    className={`${inputCls} cursor-pointer`}
                    value={form.nivel}
                    onChange={(e) => setField('nivel', e.target.value)}
                  >
                    <option value="">Sin especificar</option>
                    {NIVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Objetivo</label>
                  <select
                    className={`${inputCls} cursor-pointer`}
                    value={form.objetivo}
                    onChange={(e) => setField('objetivo', e.target.value)}
                  >
                    <option value="">Sin especificar</option>
                    {OBJETIVO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder="Descripción de la rutina (opcional)..."
                  value={form.descripcion}
                  onChange={(e) => setField('descripcion', e.target.value)}
                />
              </div>

              {loading ? <Spinner /> : (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: totalDias,       label: 'Días / semana'    },
                    { value: totalEjercicios, label: 'Total ejercicios' },
                    { value: clientesActivos, label: 'Clientes activos' },
                  ].map(({ value, label }) => (
                    <div key={label} className="border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-1">
                      <span className="text-3xl font-black text-gray-900">{value}</span>
                      <span className="text-xs text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Estructura */}
          {tab === 'estructura' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Días de entrenamiento</p>

              <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Añadir día</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7].map((dia) => {
                    const cfg      = DIA_CONFIG[dia]
                    const selected = diasSeleccionados.has(dia)
                    return (
                      <button
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        className="w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all shrink-0"
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
                        <span className="text-xs font-bold">{cfg.abrev}</span>
                        <span
                          className="mt-0.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: selected ? cfg.color : 'transparent' }}
                        />
                      </button>
                    )
                  })}
                  {diasSeleccionados.size === 0 && (
                    <span className="text-sm text-gray-400 ml-2">Pulsa un día libre para añadirlo</span>
                  )}
                </div>
              </div>

              {loading ? <Spinner /> : diasOrdenados.map((dia, idx) => {
                const cfg    = DIA_CONFIG[dia]
                const bloque = bloquesPorDia[dia]
                if (!bloque) return null
                const numEj = bloque.ejercicios.filter((e) => e.id_ejercicio).length
                return (
                  <div
                    key={dia}
                    className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 shrink-0">{cfg.nombre}</span>
                      <input
                        className="ml-2 flex-1 max-w-[200px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors"
                        placeholder="Nombre del bloque (opcional)"
                        value={bloque.nombre}
                        onChange={(e) => setBloqueName(dia, e.target.value)}
                      />
                      <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-lg bg-white/70 text-gray-500 shrink-0">
                        {numEj} ej.
                      </span>
                      <button
                        onClick={() => toggleDia(dia)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 bg-white/70 hover:bg-white/90 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="bg-white px-4 pb-4">
                      <div
                        className="grid gap-2 mb-2 pt-3 border-t border-gray-100"
                        style={{ gridTemplateColumns: '1fr 68px 68px 76px 80px 24px' }}
                      >
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ejercicio</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Series</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reps</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Peso kg</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Descanso s</span>
                        <span />
                      </div>
                      <div className="flex flex-col gap-2">
                        {bloque.ejercicios.map((ej, ei) => (
                          <div
                            key={ei}
                            className="grid gap-2 items-center"
                            style={{ gridTemplateColumns: '1fr 68px 68px 76px 80px 24px' }}
                          >
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
                            <input type="number" min="0" className={numInputCls}
                              placeholder="—" value={ej.descanso_seg}
                              onChange={(e) => updateEjercicio(dia, ei, 'descanso_seg', e.target.value)} />
                            <button
                              onClick={() => removeEjercicio(dia, ei)}
                              disabled={bloque.ejercicios.length === 1}
                              className="flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
          )}

          {/* Pestaña: Clientes asignados */}
          {tab === 'clientes' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Clientes con esta rutina asignada
              </p>
              {loading ? <Spinner /> : asignaciones.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">
                  Ningún cliente tiene esta rutina asignada
                </p>
              ) : (
                asignaciones.map((a) => {
                  const est = ESTADO_BADGE[a.estado] ?? ESTADO_BADGE.INACTIVA
                  const esEditable = a.estado === 'ACTIVA' || a.estado === 'PAUSADA'
                  const Wrapper = esEditable ? 'button' : 'div'
                  return (
                    <Wrapper
                      key={a.id_asignacion_rutina}
                      onClick={esEditable ? () => setAsignacionSeleccionada(a) : undefined}
                      className={`flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl w-full text-left${esEditable ? ' hover:border-[#1D7FD8]/40 hover:shadow-sm transition-all cursor-pointer' : ''}`}
                    >
                      <AvatarCircle nombre={a.nombre} apellidos={a.apellidos} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {a.nombre} {a.apellidos}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${est.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: est.dot }} />
                        {est.label}
                      </span>
                      {esEditable && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
                    </Wrapper>
                  )
                })
              )}
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-4 shrink-0">
          <button
            onClick={handleArchivar}
            disabled={archiving}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:underline disabled:opacity-60 transition-colors"
          >
            <Trash2 size={15} />
            {archiving ? 'Archivando…' : 'Archivar rutina'}
          </button>

          {error && (
            <p className="text-sm text-red-500 flex-1 text-center">{error}</p>
          )}

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D7FD8] hover:bg-[#1a6fc0] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>

      </div>
    </div>

    <ModalPersonalizacionCliente
      isOpen={!!asignacionSeleccionada}
      onClose={() => setAsignacionSeleccionada(null)}
      asignacion={asignacionSeleccionada}
      rutinaId={rutina?.id_rutina}
    />
    </>
  )
}
