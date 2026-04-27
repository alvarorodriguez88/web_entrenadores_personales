import { useState, useEffect } from 'react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'
import { usersApi, routinesApi, exercisesApi, assignmentsApi } from '../../services/api'

function ModalAsignarRutina({ isOpen, onClose, onSuccess, rutina = null }) {
  const [clientes,       setClientes]       = useState([])
  const [rutinas,        setRutinas]        = useState([])
  const [rutinaId,       setRutinaId]       = useState('')
  const [clienteId,      setClienteId]      = useState('')
  const [fechaInicio,    setFechaInicio]    = useState('')
  const [fechaFin,       setFechaFin]       = useState('')
  const [bloquesAsignar, setBloquesAsignar] = useState([])
  const [ejerciciosDisp, setEjerciciosDisp] = useState([])
  const [loadingBloques, setLoadingBloques] = useState(false)
  const [loadingDatos,   setLoadingDatos]   = useState(false)
  const [error,          setError]          = useState('')
  const [saving,         setSaving]         = useState(false)

  // La rutina activa: viene de la prop o del selector interno
  const rutinaActiva = rutina ?? rutinas.find((r) => String(r.id_rutina) === rutinaId) ?? null

  useEffect(() => {
    if (!isOpen) return
    setLoadingDatos(true)
    const peticiones = [
      usersApi.getTrainerClients(),
      exercisesApi.getExercises(),
    ]
    if (!rutina) peticiones.push(routinesApi.getRoutines())

    Promise.all(peticiones)
      .then(([cData, eData, rData]) => {
        setClientes(Array.isArray(cData) ? cData : [])
        setEjerciciosDisp((Array.isArray(eData) ? eData : []).filter((e) => !e.archivado))
        if (rData) setRutinas(Array.isArray(rData) ? rData : [])
      })
      .catch(() => {})
      .finally(() => setLoadingDatos(false))
  }, [isOpen])

  // Cuando hay una rutina prop, carga sus bloques al abrir
  useEffect(() => {
    if (!isOpen || !rutina) return
    cargarBloques(rutina.id_rutina)
  }, [isOpen, rutina])

  // Cuando el selector interno cambia de rutina, carga sus bloques
  useEffect(() => {
    if (!isOpen || rutina || !rutinaId) return
    const r = rutinas.find((r) => String(r.id_rutina) === rutinaId)
    if (r) cargarBloques(r.id_rutina)
    else setBloquesAsignar([])
  }, [rutinaId])

  async function cargarBloques(idRutina) {
    setLoadingBloques(true)
    try {
      const bloques = await routinesApi.getBlocks(idRutina)
      const bloquesConEj = await Promise.all(
        bloques.map(async (b) => {
          const ejercicios = await routinesApi.getBlockExercises(idRutina, b.id_bloque_rutina)
          return {
            ...b,
            ejercicios: ejercicios.map((ej) => ({
              ...ej,
              override_series: '',
              override_reps:   '',
              override_peso:   '',
            })),
          }
        })
      )
      setBloquesAsignar(bloquesConEj)
    } catch {
      setBloquesAsignar([])
    } finally {
      setLoadingBloques(false)
    }
  }

  function updateOverride(bi, ei, campo, valor) {
    setBloquesAsignar((prev) => prev.map((b, i) =>
      i === bi ? { ...b, ejercicios: b.ejercicios.map((e, j) => j === ei ? { ...e, [campo]: valor } : e) } : b
    ))
  }

  function cerrar() {
    onClose()
    setRutinaId('')
    setClienteId('')
    setFechaInicio('')
    setFechaFin('')
    setBloquesAsignar([])
    setError('')
  }

  async function handleAsignar() {
    if (!rutina && !rutinaId) { setError('Selecciona una rutina');            return }
    if (!clienteId)           { setError('Selecciona un cliente');             return }
    if (!fechaInicio)         { setError('La fecha de inicio es obligatoria'); return }
    if (!fechaFin)            { setError('La fecha de fin es obligatoria');    return }
    setError(''); setSaving(true)
    try {
      const idRutina = rutina ? rutina.id_rutina : Number(rutinaId)
      const asignacion = await assignmentsApi.createAssignment(clienteId, {
        id_rutina:    idRutina,
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
      })
      for (const bloque of bloquesAsignar) {
        for (const ej of bloque.ejercicios) {
          if (ej.override_series !== '' || ej.override_reps !== '' || ej.override_peso !== '') {
            await assignmentsApi.createAssignmentExercise(asignacion.id_asignacion_rutina, {
              id_bloque_rutina_ej: ej.id_bloque_rutina_ejercicio,
              series_plan: ej.override_series !== '' ? Number(ej.override_series) : null,
              reps_plan:   ej.override_reps   !== '' ? Number(ej.override_reps)   : null,
              peso_obj:    ej.override_peso   !== '' ? Number(ej.override_peso)   : null,
            })
          }
        }
      }
      onSuccess?.()
      cerrar()
    } catch (err) {
      setError(err.message || 'Error al asignar')
    } finally {
      setSaving(false)
    }
  }

  const clienteOptions = clientes.map((c) => ({
    value: String(c.user.id_usuario),
    label: `${c.user.nombre} ${c.user.apellidos}`,
  }))
  const rutinaOptions = rutinas.map((r) => ({ value: String(r.id_rutina), label: r.nombre }))

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Asignar rutina">
      {loadingDatos ? (
        <div className="flex items-center justify-center py-10">
          <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* Header con info de rutina (cuando viene de ContenidoPage) */}
          {rutinaActiva && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="font-semibold text-gray-800">{rutinaActiva.nombre}</p>
              {rutinaActiva.nivel && <p className="text-xs text-gray-500 mt-0.5">Nivel: {rutinaActiva.nivel}</p>}
            </div>
          )}

          {/* Selector de rutina (cuando viene de InicioPage) */}
          {!rutina && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rutina</p>
              <Input
                type="select"
                placeholder="Selecciona una rutina *"
                value={rutinaId}
                onChange={(e) => setRutinaId(e.target.value)}
                options={rutinaOptions}
              />
            </div>
          )}

          {/* Datos de la asignación */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de la asignación</p>
            <div className="flex flex-col gap-3">
              <Input
                type="select"
                placeholder="Selecciona un cliente *"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                options={clienteOptions}
              />
              <div className="flex gap-3">
                <Input label="Fecha inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                <Input label="Fecha fin"    type="date" value={fechaFin}    onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Personalización por cliente */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Personalización por cliente{' '}
              <span className="normal-case font-normal text-gray-400">(opcional — deja vacío para usar los valores de la rutina)</span>
            </p>
            {loadingBloques ? (
              <div className="flex justify-center py-4">
                <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bloquesAsignar.length === 0 ? (
              <p className="text-sm text-gray-400">
                {rutinaActiva ? 'Esta rutina no tiene ejercicios definidos' : 'Selecciona una rutina para ver los ejercicios'}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {bloquesAsignar.map((bloque, bi) => (
                  <div key={bloque.id_bloque_rutina} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-[#1D7FD8]">
                      Día {bloque.numero_dia}{bloque.nombre ? ` — ${bloque.nombre}` : ''}
                    </p>
                    {bloque.ejercicios.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin ejercicios en este bloque</p>
                    ) : (
                      bloque.ejercicios.map((ej, ei) => {
                        const ejNombre = ejerciciosDisp.find((e) => e.id_ejercicio === ej.id_ejercicio)?.nombre ?? `Ejercicio ${ej.orden}`
                        return (
                          <div key={ej.id_bloque_rutina_ejercicio} className="flex gap-2 items-center">
                            <span className="flex-1 text-sm text-gray-700 truncate">{ejNombre}</span>
                            <div className="w-16">
                              <Input type="number" placeholder={String(ej.series_plan)}
                                value={ej.override_series} onChange={(e) => updateOverride(bi, ei, 'override_series', e.target.value)} />
                            </div>
                            <div className="w-16">
                              <Input type="number" placeholder={String(ej.reps_plan)}
                                value={ej.override_reps} onChange={(e) => updateOverride(bi, ei, 'override_reps', e.target.value)} />
                            </div>
                            <div className="w-20">
                              <Input type="number" placeholder={ej.peso_obj != null ? String(ej.peso_obj) : 'Peso kg'}
                                value={ej.override_peso} onChange={(e) => updateOverride(bi, ei, 'override_peso', e.target.value)} />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={cerrar}>Cancelar</Button>
            <Button loading={saving} onClick={handleAsignar}>Guardar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ModalAsignarRutina
