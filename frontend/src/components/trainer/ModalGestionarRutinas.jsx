import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Calendar, Pencil, Pause, Check, Play } from 'lucide-react'
import { assignmentsApi, routinesApi } from '../../services/api'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const COLORES = ['#1D7FD8', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6']

function getDiasEntreno(bloques, anio, mes, fechaInicio, fechaFin) {
  const diasSemana = [...new Set(bloques.map(b => b.numero_dia))]
  const result = []
  const d = new Date(anio, mes - 1, 1)
  while (d.getMonth() === mes - 1) {
    const dow = d.getDay()
    const numeroDia = dow === 0 ? 7 : dow
    const fechaInicioD = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null
    const fechaFinD    = fechaFin    ? new Date(fechaFin    + 'T00:00:00') : null
    const dentroRango =
      (!fechaInicioD || d >= fechaInicioD) &&
      (!fechaFinD    || d <= fechaFinD)
    if (diasSemana.includes(numeroDia) && dentroRango) result.push(d.getDate())
    d.setDate(d.getDate() + 1)
  }
  return result
}

function primerDiaSemana(anio, mes) {
  const dow = new Date(anio, mes - 1, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

function diasEnMes(anio, mes) {
  return new Date(anio, mes, 0).getDate()
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function ModalGestionarRutinas({
  isOpen,
  onClose,
  clienteId,
  clienteNombre,
  clienteEmail,
  onActualizacion,
}) {
  const hoy = new Date()
  const mesHoy = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }

  const [asignaciones,  setAsignaciones]  = useState([])
  const [bloquesCache,  setBloquesCache]  = useState({})
  const [tab,           setTab]           = useState('ACTIVA')
  const [expandidos,    setExpandidos]    = useState(new Set())
  const [editandoId,    setEditandoId]    = useState(null)
  const [editForm,      setEditForm]      = useState({ fecha_inicio: '', fecha_fin: '', notas: '' })
  const [calMes,        setCalMes]        = useState({})
  const [saving,        setSaving]        = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [mostrandoNueva, setMostrandoNueva] = useState(false)
  const [nuevaForm,     setNuevaForm]     = useState({ id_rutina: '', fecha_inicio: '', fecha_fin: '', notas: '' })
  const [todasRutinas,  setTodasRutinas]  = useState([])
  const [creando,       setCreando]       = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTab('ACTIVA')
    setExpandidos(new Set())
    setEditandoId(null)
    setMostrandoNueva(false)
    setError('')
    cargar()
  }, [isOpen, clienteId])

  async function cargar() {
    setLoading(true)
    setError('')
    try {
      const data = await assignmentsApi.getClientAssignmentHistory(clienteId)
      const lista = Array.isArray(data) ? data : []
      setAsignaciones(lista)

      const mesesInit = {}
      lista.forEach(a => { mesesInit[a.id_asignacion_rutina] = { ...mesHoy } })
      setCalMes(mesesInit)
    } catch (err) {
      setError(err.message || 'Error al cargar asignaciones')
    } finally {
      setLoading(false)
    }
  }

  async function toggleExpandido(asignacion) {
    const id = asignacion.id_asignacion_rutina
    const nuevo = new Set(expandidos)
    if (nuevo.has(id)) {
      nuevo.delete(id)
    } else {
      nuevo.add(id)
      if (!bloquesCache[asignacion.id_rutina]) {
        try {
          const raw = await routinesApi.getBlocks(asignacion.id_rutina)
          const blocks = Array.isArray(raw) ? raw : []
          const conEj = await Promise.all(
            blocks.map(async b => {
              const ejRaw = await routinesApi.getBlockExercises(asignacion.id_rutina, b.id_bloque_rutina)
              return { ...b, ejercicios: Array.isArray(ejRaw) ? ejRaw : [] }
            })
          )
          setBloquesCache(prev => ({
            ...prev,
            [asignacion.id_rutina]: conEj.sort((a, b) => a.numero_dia - b.numero_dia),
          }))
        } catch {}
      }
    }
    setExpandidos(nuevo)
  }

  function iniciarEdicion(asignacion) {
    setEditandoId(asignacion.id_asignacion_rutina)
    setEditForm({
      fecha_inicio: asignacion.fecha_inicio ?? '',
      fecha_fin:    asignacion.fecha_fin    ?? '',
      notas:        asignacion.notas        ?? '',
    })
  }

  async function guardarEdicion(asignacion) {
    const id = asignacion.id_asignacion_rutina
    setSaving(id)
    setError('')
    try {
      const updated = await assignmentsApi.updateAssignment(id, {
        fecha_inicio: editForm.fecha_inicio || undefined,
        fecha_fin:    editForm.fecha_fin    || undefined,
        notas:        editForm.notas        || undefined,
      })
      setAsignaciones(prev => prev.map(a => a.id_asignacion_rutina === id ? updated : a))
      setEditandoId(null)
      onActualizacion?.()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(null)
    }
  }

  async function cambiarEstado(asignacion, nuevoEstado) {
    const id = asignacion.id_asignacion_rutina
    setSaving(id)
    setError('')
    try {
      const updated = await assignmentsApi.updateAssignmentStatus(id, nuevoEstado)
      setAsignaciones(prev => prev.map(a => a.id_asignacion_rutina === id ? updated : a))
      onActualizacion?.()
    } catch (err) {
      setError(err.message || 'Error al cambiar estado')
    } finally {
      setSaving(null)
    }
  }

  async function abrirNuevaAsignacion() {
    setMostrandoNueva(true)
    setNuevaForm({ id_rutina: '', fecha_inicio: '', fecha_fin: '', notas: '' })
    if (todasRutinas.length === 0) {
      try {
        const data = await routinesApi.getRoutines()
        setTodasRutinas(Array.isArray(data) ? data.filter(r => !r.archivado) : [])
      } catch {}
    }
  }

  async function crearAsignacion() {
    if (!nuevaForm.id_rutina || !nuevaForm.fecha_inicio || !nuevaForm.fecha_fin) return
    setCreando(true)
    setError('')
    try {
      await assignmentsApi.createAssignment(clienteId, {
        id_rutina:    parseInt(nuevaForm.id_rutina),
        fecha_inicio: nuevaForm.fecha_inicio,
        fecha_fin:    nuevaForm.fecha_fin,
        notas:        nuevaForm.notas || undefined,
      })
      setMostrandoNueva(false)
      setBloquesCache({})
      await cargar()
      onActualizacion?.()
    } catch (err) {
      setError(err.message || 'Error al crear asignación')
    } finally {
      setCreando(false)
    }
  }

  function cambiarMesAsignacion(id, delta) {
    setCalMes(prev => {
      const actual = prev[id] ?? mesHoy
      let m = actual.mes + delta
      let a = actual.anio
      if (m > 12) { m = 1;  a++ }
      if (m < 1)  { m = 12; a-- }
      return { ...prev, [id]: { anio: a, mes: m } }
    })
  }

  const activas     = asignaciones.filter(a => a.estado === 'ACTIVA')
  const pausadas    = asignaciones.filter(a => a.estado === 'PAUSADA')
  const finalizadas = asignaciones.filter(a => a.estado === 'FINALIZADA')
  const visibles    = { ACTIVA: activas, PAUSADA: pausadas, FINALIZADA: finalizadas }[tab] ?? []

  const colorMap = {}
  asignaciones.forEach((a, i) => {
    colorMap[a.id_asignacion_rutina] = COLORES[i % COLORES.length]
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Asignaciones de rutinas</h2>
            <p className="text-sm text-gray-500 mt-0.5">{clienteNombre} · {clienteEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={abrirNuevaAsignacion}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D7FD8] text-white text-sm font-semibold rounded-xl hover:bg-[#1a72c4] transition-colors"
            >
              <Plus size={15} />
              Nueva asignación
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {[
            { key: 'ACTIVA',     label: 'Activas',     count: activas.length,     dot: 'bg-green-500' },
            { key: 'PAUSADA',    label: 'Pausadas',    count: pausadas.length,    dot: 'bg-yellow-500' },
            { key: 'FINALIZADA', label: 'Finalizadas', count: finalizadas.length, dot: 'bg-gray-400' },
          ].map(({ key, label, count, dot }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-2 px-1 py-3 mr-6 text-sm font-semibold border-b-2 transition-colors',
                tab === key
                  ? 'border-[#1D7FD8] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
              <span className={[
                'px-1.5 py-0.5 rounded-full text-xs font-bold',
                tab === key ? 'bg-[#1D7FD8] text-white' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-4">

          {/* Form nueva asignación */}
          {mostrandoNueva && (
            <div className="border border-[#1D7FD8]/30 rounded-xl p-4 bg-blue-50/40 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">Nueva asignación</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Rutina</label>
                  <select
                    value={nuevaForm.id_rutina}
                    onChange={e => setNuevaForm(f => ({ ...f, id_rutina: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30 bg-white"
                  >
                    <option value="">Selecciona una rutina…</option>
                    {todasRutinas.map(r => (
                      <option key={r.id_rutina} value={r.id_rutina}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Fecha inicio</label>
                  <input
                    type="date"
                    value={nuevaForm.fecha_inicio}
                    onChange={e => setNuevaForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Fecha fin</label>
                  <input
                    type="date"
                    value={nuevaForm.fecha_fin}
                    onChange={e => setNuevaForm(f => ({ ...f, fecha_fin: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Notas (opcional)</label>
                  <input
                    type="text"
                    value={nuevaForm.notas}
                    onChange={e => setNuevaForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Observaciones sobre esta asignación"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setMostrandoNueva(false)}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearAsignacion}
                  disabled={creando || !nuevaForm.id_rutina || !nuevaForm.fecha_inicio || !nuevaForm.fecha_fin}
                  className="px-4 py-1.5 bg-[#1D7FD8] text-white text-sm font-semibold rounded-lg hover:bg-[#1a72c4] disabled:opacity-50 transition-colors"
                >
                  {creando ? 'Creando…' : 'Crear asignación'}
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-10">
              <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {!loading && visibles.length === 0 && !mostrandoNueva && (
            <p className="text-sm text-gray-400 text-center py-10">
              No hay asignaciones {tab === 'ACTIVA' ? 'activas' : tab === 'PAUSADA' ? 'pausadas' : 'finalizadas'}.
            </p>
          )}

          {/* Tarjetas de asignación */}
          {!loading && visibles.map(asignacion => {
            const id      = asignacion.id_asignacion_rutina
            const color   = colorMap[id]
            const expan   = expandidos.has(id)
            const editando = editandoId === id
            const esSaving = saving === id
            const bloques  = bloquesCache[asignacion.id_rutina] ?? []
            const cal      = calMes[id] ?? mesHoy
            const dias     = getDiasEntreno(bloques, cal.anio, cal.mes, asignacion.fecha_inicio, asignacion.fecha_fin)
            const offset   = primerDiaSemana(cal.anio, cal.mes)
            const total    = diasEnMes(cal.anio, cal.mes)

            return (
              <div
                key={id}
                className="rounded-xl border border-gray-100 overflow-hidden flex-shrink-0"
                style={{ borderLeftWidth: 4, borderLeftColor: color, borderLeftStyle: 'solid' }}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start gap-3 p-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + '18' }}
                  >
                    <Calendar size={18} style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {asignacion.nombre_rutina ?? `Rutina #${asignacion.id_rutina}`}
                      </span>
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: asignacion.estado === 'ACTIVA' ? '#f0fdf4' : asignacion.estado === 'PAUSADA' ? '#fefce8' : '#f3f4f6',
                          color: asignacion.estado === 'ACTIVA' ? '#16a34a' : asignacion.estado === 'PAUSADA' ? '#ca8a04' : '#6b7280',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: asignacion.estado === 'ACTIVA' ? '#22c55e' : asignacion.estado === 'PAUSADA' ? '#f59e0b' : '#9ca3af',
                          }}
                        />
                        {asignacion.estado.charAt(0) + asignacion.estado.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Calendar size={12} className="shrink-0" />
                      <span>{formatDate(asignacion.fecha_inicio)} → {formatDate(asignacion.fecha_fin)}</span>
                      {asignacion.notas && (
                        <span className="italic text-gray-400">
                          "{asignacion.notas.length > 35 ? asignacion.notas.slice(0, 35) + '…' : asignacion.notas}"
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!editando ? (
                      <>
                        <button
                          onClick={() => iniciarEdicion(asignacion)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                          <Pencil size={12} /> Editar fechas
                        </button>
                        {asignacion.estado === 'ACTIVA' && (
                          <>
                            <button
                              onClick={() => cambiarEstado(asignacion, 'PAUSADA')}
                              disabled={esSaving}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-600 border border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              <Pause size={12} /> Pausar
                            </button>
                            <button
                              onClick={() => cambiarEstado(asignacion, 'FINALIZADA')}
                              disabled={esSaving}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              <Check size={12} /> Finalizar
                            </button>
                          </>
                        )}
                        {asignacion.estado === 'PAUSADA' && (
                          <button
                            onClick={() => cambiarEstado(asignacion, 'ACTIVA')}
                            disabled={esSaving}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            <Play size={12} /> Reactivar
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditandoId(null)}
                          className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => guardarEdicion(asignacion)}
                          disabled={esSaving}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D7FD8] rounded-lg hover:bg-[#1a72c4] disabled:opacity-50 transition-colors"
                        >
                          {esSaving ? '…' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formulario de edición de fechas */}
                {editando && (
                  <div className="px-4 pb-4 grid grid-cols-3 gap-3 border-t border-gray-50 pt-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Fecha inicio</label>
                      <input
                        type="date"
                        value={editForm.fecha_inicio}
                        onChange={e => setEditForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Fecha fin</label>
                      <input
                        type="date"
                        value={editForm.fecha_fin}
                        onChange={e => setEditForm(f => ({ ...f, fecha_fin: e.target.value }))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Notas</label>
                      <input
                        type="text"
                        value={editForm.notas}
                        onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))}
                        placeholder="Opcional"
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                      />
                    </div>
                  </div>
                )}

                {/* Toggle bloques y calendario */}
                <button
                  onClick={() => toggleExpandido(asignacion)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    {expan ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Ver bloques y calendario
                  </span>
                  {bloques.length > 0 && (
                    <span className="font-normal text-gray-400">
                      {bloques.length} día{bloques.length !== 1 ? 's' : ''} de entrenamiento
                    </span>
                  )}
                </button>

                {/* Contenido expandido */}
                {expan && (
                  <div className="border-t border-gray-100 grid grid-cols-2">

                    {/* Bloques */}
                    <div className="p-4 border-r border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Bloques de entrenamiento
                      </p>
                      {bloques.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Sin bloques</p>
                      ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-64">
                          {bloques.map(bloque => (
                            <div key={bloque.id_bloque_rutina} className="flex gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                                style={{ backgroundColor: color }}
                              >
                                {bloque.numero_dia}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-gray-700 truncate">
                                    {DIAS_SEMANA[bloque.numero_dia - 1]}
                                    {bloque.nombre ? ` · ${bloque.nombre}` : ''}
                                  </p>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium shrink-0"
                                    style={{ backgroundColor: color + '15', color }}>
                                    {bloque.ejercicios.length} ej.
                                  </span>
                                </div>
                                <ul className="mt-1 flex flex-col gap-0.5">
                                  {bloque.ejercicios.map(ej => (
                                    <li key={ej.id_bloque_rutina_ejercicio} className="flex items-center justify-between text-xs text-gray-600 gap-2">
                                      <span className="flex items-center gap-1 min-w-0">
                                        <span className="font-bold shrink-0" style={{ color }}>•</span>
                                        <span className="truncate">{ej.nombre_ejercicio ?? `#${ej.id_ejercicio}`}</span>
                                      </span>
                                      <span className="text-gray-400 shrink-0">
                                        {ej.series_plan} × {ej.reps_plan} reps
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Calendario */}
                    <div className="p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Calendario
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700">
                          {MESES[cal.mes - 1]} {cal.anio}
                        </p>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => cambiarMesAsignacion(id, -1)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            onClick={() => cambiarMesAsignacion(id, 1)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 mb-1">
                        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: total }, (_, i) => i + 1).map(dia => {
                          const esEntreno = dias.includes(dia)
                          const esHoyDia  = hoy.getFullYear() === cal.anio &&
                                            hoy.getMonth() + 1 === cal.mes &&
                                            hoy.getDate() === dia
                          return (
                            <div key={dia} className="flex justify-center items-center py-0.5">
                              <span
                                className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium"
                                style={
                                  esEntreno
                                    ? { backgroundColor: color, color: '#fff' }
                                    : esHoyDia
                                      ? { boxShadow: `0 0 0 1px ${color}`, color }
                                      : { color: '#374151' }
                                }
                              >
                                {dia}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {activas.length} activa{activas.length !== 1 ? 's' : ''} · {pausadas.length} pausada{pausadas.length !== 1 ? 's' : ''} · {finalizadas.length} finalizada{finalizadas.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
