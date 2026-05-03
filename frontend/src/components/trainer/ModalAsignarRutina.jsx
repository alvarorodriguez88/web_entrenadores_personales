import { useState, useEffect, useMemo } from 'react'
import { X, Search, ArrowRight, ArrowLeft, Check, Info, BookOpen } from 'lucide-react'
import { usersApi, routinesApi, assignmentsApi } from '../../services/api'
import { NIVEL_CLS, numInputCls } from '../../utils/rutinas'
import { nivelLabel } from '../../utils/format'
import Spinner      from '../shared/Spinner'
import NivelBadge   from '../shared/NivelBadge'
import AvatarCircle from '../shared/AvatarCircle'

const DIAS_MAP = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
}

function StepBar({ step }) {
  const steps = [
    { id: 1, label: 'Cliente' },
    { id: 2, label: 'Fechas y ajustes' },
    { id: 3, label: 'Personalización' },
  ]
  return (
    <div className="flex items-center px-6 py-4 border-b border-gray-100 shrink-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={
                step > s.id
                  ? { backgroundColor: '#16a34a', color: '#fff' }
                  : step === s.id
                  ? { backgroundColor: '#1D7FD8', color: '#fff' }
                  : { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
              }
            >
              {step > s.id ? <Check size={12} /> : s.id}
            </div>
            <span
              className="text-sm whitespace-nowrap"
              style={
                step === s.id
                  ? { fontWeight: 700, color: '#111827' }
                  : step > s.id
                  ? { color: '#16a34a', fontWeight: 500 }
                  : { color: '#9CA3AF' }
              }
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-px mx-3"
              style={{ width: 60, backgroundColor: step > s.id ? '#4ade80' : '#E5E7EB' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ModalAsignarRutina({
  isOpen,
  onClose,
  onSuccess,
  rutina,
  clientePrefijado,
}) {
  const stepInicial = clientePrefijado ? 2 : 1

  const [step,                setStep]                = useState(stepInicial)
  const [clientes,            setClientes]            = useState([])
  const [clientesConRutina,   setClientesConRutina]   = useState(new Set())
  const [rutinaActivaMap,     setRutinaActivaMap]     = useState({})
  const [busqueda,            setBusqueda]            = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const [fechaInicio,   setFechaInicio]   = useState('')
  const [fechaFin,      setFechaFin]      = useState('')
  const [estadoInicial, setEstadoInicial] = useState('ACTIVA')
  const [notas,         setNotas]         = useState('')

  const [bloques,        setBloques]        = useState([])
  const [overrides,      setOverrides]      = useState({})
  const [loadingBloques, setLoadingBloques] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!isOpen || !rutina) return
    const inicial = clientePrefijado
      ? { id: clientePrefijado.id, fullName: clientePrefijado.nombre, email: clientePrefijado.email, nivel: null }
      : null
    setStep(stepInicial)
    setClienteSeleccionado(inicial)
    setBusqueda('')
    setFechaInicio('')
    setFechaFin('')
    setEstadoInicial('ACTIVA')
    setNotas('')
    setBloques([])
    setOverrides({})
    setError('')
    loadInitialData()
  }, [isOpen, rutina?.id_rutina])

  async function loadInitialData() {
    if (!rutina) return
    setLoading(true)
    try {
      const [rawClientes, asigRutina] = await Promise.all([
        usersApi.getTrainerClients(),
        routinesApi.getRoutineAssignments(rutina.id_rutina).catch(() => []),
      ])

      const lista = Array.isArray(rawClientes) ? rawClientes : []
      setClientes(lista)

      const asigArr   = Array.isArray(asigRutina) ? asigRutina : []
      const tienenEsta = new Set(
        asigArr.filter(a => a.estado === 'ACTIVA').map(a => a.id_cliente).filter(Boolean)
      )
      setClientesConRutina(tienenEsta)

      const rutinaMap = {}
      await Promise.all(lista.map(async c => {
        try {
          const asigs  = await assignmentsApi.getClientAssignments(c.user.id_usuario)
          const activa = Array.isArray(asigs) ? asigs.find(a => a.estado === 'ACTIVA') : null
          rutinaMap[c.user.id_usuario] = activa?.nombre_rutina ?? null
        } catch {
          rutinaMap[c.user.id_usuario] = null
        }
      }))
      setRutinaActivaMap(rutinaMap)
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientes
    const q = busqueda.toLowerCase()
    return clientes.filter(c => {
      const nombre = `${c.user?.nombre ?? ''} ${c.user?.apellidos ?? ''}`.toLowerCase()
      const email  = (c.user?.email ?? '').toLowerCase()
      return nombre.includes(q) || email.includes(q)
    })
  }, [clientes, busqueda])

  function seleccionarCliente(c) {
    setClienteSeleccionado({
      id:       c.user.id_usuario,
      fullName: `${c.user.nombre} ${c.user.apellidos}`.trim(),
      email:    c.user.email,
      nivel:    c.nivel,
      nombre:   c.user.nombre,
      apellidos: c.user.apellidos,
    })
  }

  function irASiguiente() {
    if (step === 1) {
      if (!clienteSeleccionado) { setError('Selecciona un cliente para continuar'); return }
      setError('')
      setStep(2)
    }
  }

  async function irAStep3() {
    if (!fechaInicio || !fechaFin) { setError('Las fechas de inicio y fin son obligatorias'); return }
    setError('')
    if (bloques.length === 0) {
      setLoadingBloques(true)
      try {
        const rawBloques = await routinesApi.getBlocks(rutina.id_rutina)
        const sorted = Array.isArray(rawBloques)
          ? rawBloques.sort((a, b) => a.numero_dia - b.numero_dia)
          : []
        const conEj = await Promise.all(
          sorted.map(async b => {
            const ejs = await routinesApi.getBlockExercises(rutina.id_rutina, b.id_bloque_rutina).catch(() => [])
            return { ...b, ejercicios: Array.isArray(ejs) ? ejs.sort((a, b2) => a.orden - b2.orden) : [] }
          })
        )
        setBloques(conEj)
      } catch (err) {
        setError(err.message || 'Error al cargar ejercicios')
        setLoadingBloques(false)
        return
      }
      setLoadingBloques(false)
    }
    setStep(3)
  }

  function setOverride(idBloqueEj, campo, valor) {
    setOverrides(prev => ({
      ...prev,
      [idBloqueEj]: { ...(prev[idBloqueEj] ?? {}), [campo]: valor },
    }))
  }

  async function handleGuardar() {
    setSaving(true)
    setError('')
    try {
      const asignacion = await assignmentsApi.createAssignment(clienteSeleccionado.id, {
        id_rutina:    rutina.id_rutina,
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        notas:        notas || null,
      })

      if (estadoInicial === 'PAUSADA') {
        await assignmentsApi.updateAssignmentStatus(asignacion.id_asignacion_rutina, 'PAUSADA')
      }

      for (const [idBloqueEjStr, vals] of Object.entries(overrides)) {
        if (!vals.series && !vals.reps && !vals.peso) continue
        await assignmentsApi.createAssignmentExercise(asignacion.id_asignacion_rutina, {
          id_bloque_rutina_ej: Number(idBloqueEjStr),
          series_plan: vals.series ? Number(vals.series) : null,
          reps_plan:   vals.reps   ? Number(vals.reps)   : null,
          peso_obj:    vals.peso   ? Number(vals.peso)   : null,
        })
      }

      onSuccess?.()
      cerrar()
    } catch (err) {
      setError(err.message || 'Error al asignar la rutina')
    } finally {
      setSaving(false)
    }
  }

  function cerrar() {
    onClose()
    setStep(stepInicial)
    setClienteSeleccionado(clientePrefijado
      ? { id: clientePrefijado.id, fullName: clientePrefijado.nombre, email: clientePrefijado.email, nivel: null }
      : null
    )
    setBusqueda('')
    setFechaInicio('')
    setFechaFin('')
    setEstadoInicial('ACTIVA')
    setNotas('')
    setBloques([])
    setOverrides({})
    setError('')
  }

  if (!isOpen || !rutina) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={cerrar}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-[#1D7FD8]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Asignar rutina</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-semibold text-[#1D7FD8]">{rutina.nombre}</span>
                <NivelBadge nivel={rutina.nivel} />
              </div>
            </div>
          </div>
          <button
            onClick={cerrar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step bar */}
        <StepBar step={step} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* STEP 1: Cliente */}
          {step === 1 && (
            <>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Buscar cliente
                </p>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] focus:ring-1 focus:ring-[#1D7FD8]/20 transition-colors"
                    placeholder="Nombre o email..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              {loading ? <Spinner className="py-8" /> : (
                <div className="flex flex-col gap-2">
                  {clientesFiltrados.map(c => {
                    const fullName    = `${c.user?.nombre ?? ''} ${c.user?.apellidos ?? ''}`.trim()
                    const email       = c.user?.email ?? ''
                    const nivel       = c.nivel
                    const tieneEsta   = clientesConRutina.has(c.user?.id_usuario)
                    const rutinaActiva = rutinaActivaMap[c.user?.id_usuario]
                    const selected    = clienteSeleccionado?.id === c.user?.id_usuario

                    return (
                      <button
                        key={c.user?.id_usuario}
                        onClick={() => seleccionarCliente(c)}
                        className={[
                          'w-full text-left flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors',
                          selected
                            ? 'border-[#1D7FD8] bg-blue-50/40'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <AvatarCircle nombre={c.user?.nombre} apellidos={c.user?.apellidos} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{fullName}</span>
                            <NivelBadge nivel={nivel} />
                            {tieneEsta && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                Ya tiene esta rutina
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{email}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">Rutina activa</p>
                          <p className={`text-xs font-semibold mt-0.5 ${rutinaActiva ? 'text-gray-700' : 'text-gray-400'}`}>
                            {rutinaActiva ?? 'Sin rutina'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                  {clientesFiltrados.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No se encontraron clientes</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* STEP 2: Fechas y ajustes */}
          {step === 2 && clienteSeleccionado && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl">
                <AvatarCircle
                  nombre={clienteSeleccionado.nombre ?? clienteSeleccionado.fullName}
                  apellidos={clienteSeleccionado.apellidos ?? ''}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{clienteSeleccionado.fullName}</p>
                  <p className="text-xs text-gray-400">{clienteSeleccionado.email}</p>
                </div>
                {!clientePrefijado && (
                  <button
                    onClick={() => { setStep(1); setError('') }}
                    className="text-sm font-semibold text-[#1D7FD8] hover:underline shrink-0"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha inicio</label>
                  <input
                    type="date"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1D7FD8] transition-colors"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha fin</label>
                  <input
                    type="date"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1D7FD8] transition-colors"
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado inicial</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'ACTIVA',  label: 'Activa',  dot: '#22c55e', selCls: 'border-green-500 bg-green-50 text-green-700' },
                    { value: 'PAUSADA', label: 'Pausada', dot: '#f59e0b', selCls: 'border-amber-400 bg-amber-50 text-amber-700' },
                  ].map(({ value, label, dot, selCls }) => {
                    const selected = estadoInicial === value
                    return (
                      <button
                        key={value}
                        onClick={() => setEstadoInicial(value)}
                        className={[
                          'flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors',
                          selected ? selCls : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                        ].join(' ')}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                        {label}
                        {selected && <Check size={14} className="ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Notas{' '}
                  <span className="normal-case font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors resize-none"
                  rows={3}
                  placeholder="Observaciones para esta asignación..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                />
              </div>
            </>
          )}

          {/* STEP 3: Personalización */}
          {step === 3 && (
            <>
              <div className="flex items-start gap-2.5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                <Info size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Opcional</span> — deja vacío para usar los valores de la rutina.
                  Solo rellena si quieres ajustar algo para este cliente.
                </p>
              </div>

              {loadingBloques ? <Spinner className="py-8" /> : (
                <div className="flex flex-col gap-4">
                  {bloques.map(bloque => (
                    <div key={bloque.id_bloque_rutina} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50/40">
                        <div className="w-7 h-7 rounded-full bg-[#1D7FD8] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {bloque.numero_dia}
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">
                          {DIAS_MAP[bloque.numero_dia] ?? `Día ${bloque.numero_dia}`}
                          {bloque.nombre && (
                            <span className="font-normal text-gray-400"> · {bloque.nombre}</span>
                          )}
                        </span>
                      </div>

                      <div className="px-4 pb-4">
                        <div
                          className="grid gap-2 pt-3 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 mb-2"
                          style={{ gridTemplateColumns: '1fr 72px 72px 88px' }}
                        >
                          <span>Ejercicio</span>
                          <span className="text-center">Series</span>
                          <span className="text-center">Reps</span>
                          <span className="text-center">Peso (kg)</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {bloque.ejercicios.map(ej => {
                            const ov = overrides[ej.id_bloque_rutina_ejercicio] ?? {}
                            return (
                              <div
                                key={ej.id_bloque_rutina_ejercicio}
                                className="grid gap-2 items-center"
                                style={{ gridTemplateColumns: '1fr 72px 72px 88px' }}
                              >
                                <span className="text-sm text-gray-800 truncate">
                                  {ej.nombre_ejercicio ?? `Ejercicio #${ej.id_ejercicio}`}
                                </span>
                                <input type="number" min="1" className={numInputCls}
                                  placeholder={String(ej.series_plan ?? '—')}
                                  value={ov.series ?? ''}
                                  onChange={e => setOverride(ej.id_bloque_rutina_ejercicio, 'series', e.target.value)} />
                                <input type="number" min="1" className={numInputCls}
                                  placeholder={String(ej.reps_plan ?? '—')}
                                  value={ov.reps ?? ''}
                                  onChange={e => setOverride(ej.id_bloque_rutina_ejercicio, 'reps', e.target.value)} />
                                <input type="number" min="0" step="0.5" className={numInputCls}
                                  placeholder={ej.peso_obj != null ? String(ej.peso_obj) : '—'}
                                  value={ov.peso ?? ''}
                                  onChange={e => setOverride(ej.id_bloque_rutina_ejercicio, 'peso', e.target.value)} />
                              </div>
                            )
                          })}
                          {bloque.ejercicios.length === 0 && (
                            <p className="text-xs text-gray-400 py-2">Sin ejercicios en este bloque</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {bloques.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Esta rutina no tiene bloques de ejercicios</p>
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {step > stepInicial && (
              <button
                onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={14} /> Atrás
              </button>
            )}
            <button
              onClick={cerrar}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            {step === 1 && (
              <button
                onClick={irASiguiente}
                disabled={!clienteSeleccionado}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D7FD8] hover:bg-[#1a6fc0] disabled:opacity-40 transition-colors"
              >
                Siguiente <ArrowRight size={14} />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={irAStep3}
                disabled={!fechaInicio || !fechaFin}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1D7FD8] hover:bg-[#1a6fc0] disabled:opacity-40 transition-colors"
              >
                Siguiente <ArrowRight size={14} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Asignando…' : <><Check size={14} /> Asignar rutina</>}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
