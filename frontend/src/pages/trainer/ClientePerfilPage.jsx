import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usersApi, metricsApi, analyticsApi, assignmentsApi, routinesApi } from '../../services/api'
import Button        from '../../components/shared/Button'
import Card          from '../../components/shared/Card'
import PeriodoToggle from '../../components/shared/PeriodoToggle'
import EvolucionChart from '../../components/shared/EvolucionChart'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-green-100 text-green-700',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

function initials(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function getDiasEntreno(bloques, anio, mes, fechaInicio, fechaFin) {
  const diasSemana = [...new Set(bloques.map((b) => b.numero_dia))]
  const result = []
  const d = new Date(anio, mes - 1, 1)
  while (d.getMonth() === mes - 1) {
    const dow = d.getDay()
    const numeroDia = dow === 0 ? 7 : dow

    const dentroDeRango =
      (!fechaInicio || d >= new Date(fechaInicio)) &&
      (!fechaFin    || d <= new Date(fechaFin))

    if (diasSemana.includes(numeroDia) && dentroDeRango) result.push(d.getDate())
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

function ClientePerfilPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [cliente,      setCliente]      = useState(null)
  const [metricas,     setMetricas]     = useState([])
  const [asignacion,   setAsignacion]   = useState(null)
  const [rutinaNombre, setRutinaNombre] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const [periodo,   setPeriodo]   = useState('semanal')
  const [evolucion, setEvolucion] = useState([])
  const [loadingEv, setLoadingEv] = useState(true)

  // Modal Gestionar rutina
  const [modalGestionar, setModalGestionar] = useState(false)
  const [bloquesGest,    setBloquesGest]    = useState([])
  const [loadingGest,    setLoadingGest]    = useState(false)
  const [errorGest,      setErrorGest]      = useState('')
  const [savingGest,     setSavingGest]     = useState(false)
  const [editFechaFin,   setEditFechaFin]   = useState('')
  const [editNotas,      setEditNotas]      = useState('')
  const [calMes,         setCalMes]         = useState(() => {
    const hoy = new Date()
    return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
  })

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [clienteData, metricasData, asignacionesData] = await Promise.all([
          usersApi.getClientById(id),
          metricsApi.getClientMetrics(id),
          assignmentsApi.getClientAssignments(id),
        ])
        setCliente(clienteData)
        setMetricas(Array.isArray(metricasData) ? metricasData : [])
        const activa = Array.isArray(asignacionesData) && asignacionesData.length > 0
          ? asignacionesData[0] : null
        setAsignacion(activa)
        if (activa) {
          const rutina = await routinesApi.getRoutine(activa.id_rutina)
          setRutinaNombre(rutina.nombre)
        }
      } catch (err) {
        setError(err.message || 'Error al cargar el cliente')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [id])

  useEffect(() => {
    async function cargarEvolucion() {
      setLoadingEv(true)
      try {
        const data = await analyticsApi.getTrainerClientEvolution(id, periodo)
        const serie = Array.isArray(data)
          ? data
          : (data?.puntos ?? data?.serie ?? data?.historico ?? data?.items ?? [])
        setEvolucion(serie)
      } catch {
        setEvolucion([])
      } finally {
        setLoadingEv(false)
      }
    }
    cargarEvolucion()
  }, [id, periodo])

  async function abrirGestionar() {
    setModalGestionar(true)
    if (!asignacion) return
    setEditFechaFin(asignacion.fecha_fin ?? '')
    setEditNotas(asignacion.notas ?? '')
    setLoadingGest(true)
    setErrorGest('')
    try {
      const blocksRaw = await routinesApi.getBlocks(asignacion.id_rutina)
      const blocks = Array.isArray(blocksRaw) ? blocksRaw : []
      const bloquesCon = await Promise.all(
        blocks.map(async (b) => {
          const ejRaw = await routinesApi.getBlockExercises(asignacion.id_rutina, b.id_bloque_rutina)
          return { ...b, ejercicios: Array.isArray(ejRaw) ? ejRaw : [] }
        })
      )
      setBloquesGest(bloquesCon.sort((a, b) => a.numero_dia - b.numero_dia))
    } catch (err) {
      setErrorGest(err.message || 'Error al cargar la rutina')
    } finally {
      setLoadingGest(false)
    }
  }

  async function handleGuardarGestion() {
    if (!asignacion) return
    setSavingGest(true)
    setErrorGest('')
    try {
      const updated = await assignmentsApi.updateAssignment(asignacion.id_asignacion_rutina, {
        fecha_fin: editFechaFin || undefined,
        notas:     editNotas    || undefined,
      })
      setAsignacion(updated)
      setModalGestionar(false)
    } catch (err) {
      setErrorGest(err.message || 'Error al guardar')
    } finally {
      setSavingGest(false)
    }
  }

  function cambiarMes(delta) {
    setCalMes(({ anio, mes }) => {
      let nuevoMes = mes + delta
      let nuevoAnio = anio
      if (nuevoMes > 12) { nuevoMes = 1;  nuevoAnio++ }
      if (nuevoMes < 1)  { nuevoMes = 12; nuevoAnio-- }
      return { anio: nuevoAnio, mes: nuevoMes }
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 h-64 justify-center">
        <p className="text-gray-500">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/trainer/clients')}>
          Volver a clientes
        </Button>
      </div>
    )
  }

  const nombre = `${cliente.user.nombre} ${cliente.user.apellidos}`

  const ultimaMetrica = metricas.length > 0
    ? metricas.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
    : null

  const hoy = new Date()
  const diasEntreno = getDiasEntreno(bloquesGest, calMes.anio, calMes.mes, asignacion?.fecha_inicio, asignacion?.fecha_fin)
  const offset = primerDiaSemana(calMes.anio, calMes.mes)
  const totalDias = diasEnMes(calMes.anio, calMes.mes)

  return (
    <div className="p-8 flex flex-col gap-6">

      {/* Volver */}
      <button
        onClick={() => navigate('/trainer/clients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors self-start"
      >
        <ArrowLeft size={16} />
        Volver a clientes
      </button>

      <h1 className="text-3xl font-black text-gray-900">{nombre}</h1>

      {/* Datos del cliente */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center
                          text-[#1D7FD8] text-lg font-black flex-shrink-0">
            {initials(nombre)}
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight">{nombre}</p>
            <p className="text-sm text-gray-500">{cliente.user.email}</p>
          </div>

          <div className="w-px h-10 bg-gray-200 mx-2 flex-shrink-0" />

          <div className="flex gap-8 flex-1">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400">Nivel</p>
              {cliente.nivel
                ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold
                    ${NIVEL_BADGE[(cliente.nivel ?? '').toUpperCase()] ?? 'bg-gray-100 text-gray-500'}`}>
                    {cliente.nivel}
                  </span>
                : <span className="text-sm text-gray-300">—</span>
              }
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-400">Objetivo</p>
              <p className="text-sm font-semibold text-gray-700">{cliente.objetivo ?? '—'}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-400">Rutina activa</p>
              <p className="text-sm font-semibold text-gray-700">
                {rutinaNombre || (asignacion ? 'Cargando…' : 'Sin rutina')}
              </p>
            </div>
          </div>

          <Button size="sm" onClick={abrirGestionar}>Gestionar rutina</Button>
        </div>
      </Card>

      {/* Métricas físicas */}
      <Card title="Métricas físicas">
        {ultimaMetrica ? (
          <div className="flex divide-x divide-gray-200">
            {[
              { label: 'Peso',    value: ultimaMetrica.peso_kg    != null ? `${ultimaMetrica.peso_kg} kg`   : '—' },
              { label: 'Altura',  value: ultimaMetrica.altura_cm  != null ? `${ultimaMetrica.altura_cm} cm` : '—' },
              { label: '% Grasa', value: ultimaMetrica.grasa_pct  != null ? `${ultimaMetrica.grasa_pct}%`   : '—' },
            ].map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 px-4 py-4">
                <p className="text-2xl font-black text-gray-900">{m.value}</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            Sin métricas registradas
          </p>
        )}
      </Card>

      {/* Evolución individual */}
      <Card
        title="Evolución individual"
        action={<PeriodoToggle value={periodo} onChange={setPeriodo} />}
      >
        {loadingEv ? (
          <div className="h-56 flex items-center justify-center">
            <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : evolucion.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Sin datos de evolución para este periodo
          </p>
        ) : (
          <>
            <EvolucionChart data={evolucion} />
            <p className="text-xs text-gray-400 text-center mt-2">
              Evolución histórica — rendimiento (0–10, eje der.) · cumplimiento y conformidad (%, eje izq.)
            </p>
          </>
        )}
      </Card>

      {/* Modal Gestionar rutina */}
      {modalGestionar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">

            {/* Cabecera modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gestionar rutina</h2>
                {rutinaNombre && (
                  <p className="text-sm text-gray-500 mt-0.5">{rutinaNombre}</p>
                )}
              </div>
              <button
                onClick={() => setModalGestionar(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">

              {!asignacion ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Este cliente no tiene ninguna rutina asignada actualmente.
                </p>
              ) : (
                <>
                  {/* Campos editables */}
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-500">Fecha fin</label>
                      <input
                        type="date"
                        value={editFechaFin}
                        onChange={(e) => setEditFechaFin(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-500">Notas</label>
                      <input
                        type="text"
                        value={editNotas}
                        onChange={(e) => setEditNotas(e.target.value)}
                        placeholder="Opcional"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30"
                      />
                    </div>
                  </div>

                  {/* Bloques */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Bloques</p>
                    {loadingGest ? (
                      <div className="flex justify-center py-4">
                        <span className="w-5 h-5 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : bloquesGest.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-2">Sin bloques</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {bloquesGest.map((bloque) => (
                          <div key={bloque.id_bloque_rutina} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#1D7FD8]/10 text-[#1D7FD8] text-xs font-bold
                                            flex items-center justify-center shrink-0 mt-0.5">
                              {bloque.numero_dia}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                {DIAS_SEMANA[bloque.numero_dia - 1]}
                                {bloque.nombre ? ` · ${bloque.nombre}` : ''}
                              </p>
                              {bloque.ejercicios.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Sin ejercicios</p>
                              ) : (
                                <ul className="flex flex-col gap-1">
                                  {bloque.ejercicios.map((ej) => (
                                    <li key={ej.id_bloque_rutina_ejercicio} className="text-sm text-gray-700 flex gap-2">
                                      <span className="text-gray-400">·</span>
                                      <span>
                                        Ejercicio #{ej.id_ejercicio}
                                        {ej.series_plan != null && <> · {ej.series_plan} series</>}
                                        {ej.reps_plan   != null && <> · {ej.reps_plan} reps</>}
                                        {ej.peso_obj    != null && <> · {ej.peso_obj} kg</>}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calendario mensual */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {MESES[calMes.mes - 1]} {calMes.anio}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cambiarMes(-1)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => cambiarMes(1)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Cabecera días */}
                    <div className="grid grid-cols-7 mb-1">
                      {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                      ))}
                    </div>

                    {/* Celdas */}
                    <div className="grid grid-cols-7 gap-y-1">
                      {Array.from({ length: offset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {Array.from({ length: totalDias }, (_, i) => i + 1).map((dia) => {
                        const esEntreno = diasEntreno.includes(dia)
                        const esHoy = hoy.getFullYear() === calMes.anio &&
                          hoy.getMonth() + 1 === calMes.mes &&
                          hoy.getDate() === dia
                        return (
                          <div key={dia} className="flex justify-center items-center py-0.5">
                            <span
                              className={[
                                'w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium',
                                esEntreno
                                  ? 'bg-[#1D7FD8] text-white'
                                  : esHoy
                                    ? 'ring-1 ring-[#1D7FD8] text-[#1D7FD8]'
                                    : 'text-gray-700',
                              ].join(' ')}
                            >
                              {dia}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {errorGest && (
                <p className="text-sm text-red-500">{errorGest}</p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="secondary" onClick={() => setModalGestionar(false)}>
                Cancelar
              </Button>
              {asignacion && (
                <Button onClick={handleGuardarGestion} disabled={savingGest}>
                  {savingGest ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default ClientePerfilPage
