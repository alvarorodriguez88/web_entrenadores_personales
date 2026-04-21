import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { exercisesApi, routinesApi, assignmentsApi, usersApi } from '../../services/api'
import TabBar    from '../../components/shared/TabBar'
import Table     from '../../components/shared/Table'
import Modal     from '../../components/shared/Modal'
import Button    from '../../components/shared/Button'
import Input     from '../../components/shared/Input'

const TABS     = ['Ejercicios', 'Rutinas', 'Multimedia']

const NIVEL_OPTIONS = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
]

const columnasEjercicios = [
  { key: 'nombre',         label: 'Ejercicio'      },
  { key: 'grupo_muscular', label: 'Grupo muscular' },
  { key: 'equipamiento',   label: 'Equipamiento'   },
  { key: 'archivado',      label: 'Estado',        render: (v) => v ? 'Archivado' : 'Activo' },
]

const emptyEjForm = { nombre: '', descripcion: '', grupo_muscular: '', equipamiento: '', video_url: '' }


function TabEjercicios() {
  const [ejercicios,   setEjercicios]   = useState([])
  const [loadingEj,    setLoadingEj]    = useState(true)
  const [errorEj,      setErrorEj]      = useState('')

  const [busqueda,    setBusqueda]    = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroEquip, setFiltroEquip] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form,  setForm]  = useState(emptyEjForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function cargarEjercicios() {
    setLoadingEj(true)
    setErrorEj('')
    try {
      const data = await exercisesApi.getExercises()
      setEjercicios(data)
    } catch (err) {
      setErrorEj(err.message || 'Error al cargar ejercicios')
    } finally {
      setLoadingEj(false)
    }
  }

  useEffect(() => { cargarEjercicios() }, [])

  const filtrados = ejercicios.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!filtroGrupo || (e.grupo_muscular ?? '').toLowerCase().includes(filtroGrupo.toLowerCase())) &&
    (!filtroEquip || (e.equipamiento ?? '').toLowerCase().includes(filtroEquip.toLowerCase()))
  )

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }
  function cerrar() { setModalAbierto(false); setForm(emptyEjForm); setError('') }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setSaving(true)
    try {
      await exercisesApi.createExercise({
        nombre:         form.nombre,
        descripcion:    form.descripcion    || '',
        grupo_muscular: form.grupo_muscular || null,
        equipamiento:   form.equipamiento   || null,
        video_url:      form.video_url      || null,
      })
      cerrar()
      cargarEjercicios()
    } catch (err) { setError(err.message || 'Error al crear') }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <Input placeholder="Nombre ejercicio" value={busqueda}    onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-40">
          <Input placeholder="Grupo muscular"   value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} />
        </div>
        <div className="w-40">
          <Input placeholder="Equipamiento"     value={filtroEquip} onChange={(e) => setFiltroEquip(e.target.value)} />
        </div>
        <Button onClick={() => setModalAbierto(true)}>Crear ejercicio</Button>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Tabla de ejercicios</p>
        {loadingEj ? (
          <div className="flex justify-center py-12">
            <span className="w-7 h-7 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorEj ? (
          <p className="text-sm text-red-500 py-8 text-center">{errorEj}</p>
        ) : (
          <Table columns={columnasEjercicios} data={filtrados} emptyMessage="No se encontraron ejercicios" />
        )}
      </div>

      <Modal isOpen={modalAbierto} onClose={cerrar} title="Crear ejercicio">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del ejercicio</p>
            <div className="flex flex-col gap-3">
              <Input placeholder="Nombre del ejercicio" value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} error={error && !form.nombre.trim() ? error : ''} />
              <div className="flex gap-3">
                <Input placeholder="Grupo muscular" value={form.grupo_muscular} onChange={(e) => setField('grupo_muscular', e.target.value)} />
                <Input placeholder="Equipamiento"   value={form.equipamiento}   onChange={(e) => setField('equipamiento',   e.target.value)} />
              </div>
              <Input type="textarea" placeholder="Descripción" value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contenido multimedia</p>
            <Input placeholder="URL del vídeo / imagen" value={form.video_url} onChange={(e) => setField('video_url', e.target.value)} />
          </div>
          {error && form.nombre.trim() && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={cerrar}>Cancelar</Button>
            <Button loading={saving} onClick={handleGuardar}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}


const emptyRutinaForm = { nombre: '', objetivo: '', nivel: '', descripcion: '' }
const newEj     = () => ({ id_ejercicio: '', series_plan: 3, reps_plan: 10, peso_obj: '' })
const newBloque = () => ({ dia: 1, ejercicios: [newEj()] })

function RutinaCard({ rutina, onAsignar }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="font-bold text-gray-800">{rutina.nombre}</p>
        <p className="text-xs text-gray-500">Nivel: {rutina.nivel ?? '—'}</p>
        <p className="text-xs text-gray-500">Objetivo: {rutina.objetivo ?? '—'}</p>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rutina.descripcion}</p>
      </div>
      <div className="mt-auto">
        <Button size="sm" onClick={() => onAsignar(rutina)}>Asignar</Button>
      </div>
    </div>
  )
}

function TabRutinas() {
  const [rutinas,        setRutinas]        = useState([])
  const [loadingRutinas, setLoadingRutinas] = useState(true)
  const [errorRutinas,   setErrorRutinas]   = useState('')

  const [clientes,        setClientes]        = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [ejerciciosDisp, setEjerciciosDisp] = useState([])

  const [busqueda,    setBusqueda]    = useState('')
  const [filtroObj,   setFiltroObj]   = useState('')

  const [modalCrear, setModalCrear] = useState(false)
  const [formR,   setFormR]  = useState(emptyRutinaForm)
  const [bloques, setBloques] = useState([newBloque()])
  const [errorR,  setErrorR] = useState('')
  const [savingR, setSavingR] = useState(false)

  const [modalAsignar,    setModalAsignar]    = useState(false)
  const [rutinaAsignar,   setRutinaAsignar]   = useState(null)
  const [clienteId,       setClienteId]       = useState('')
  const [fechaInicio,     setFechaInicio]     = useState('')
  const [fechaFin,        setFechaFin]        = useState('')
  const [bloquesAsignar,  setBloquesAsignar]  = useState([])
  const [loadingBloques,  setLoadingBloques]  = useState(false)
  const [errorA,          setErrorA]          = useState('')
  const [savingA,         setSavingA]         = useState(false)

  async function cargarRutinas() {
    setLoadingRutinas(true)
    setErrorRutinas('')
    try {
      const data = await routinesApi.getRoutines()
      setRutinas(data)
    } catch (err) {
      setErrorRutinas(err.message || 'Error al cargar rutinas')
    } finally {
      setLoadingRutinas(false)
    }
  }

  async function cargarClientes() {
    setLoadingClientes(true)
    try {
      const data = await usersApi.getTrainerClients()
      setClientes(data)
    } catch {
    } finally {
      setLoadingClientes(false)
    }
  }

  useEffect(() => {
    cargarRutinas()
    cargarClientes()
    exercisesApi.getExercises()
      .then((data) => setEjerciciosDisp(data.filter((e) => !e.archivado)))
      .catch(() => {})
  }, [])

  const clienteOptions = clientes.map((c) => ({
    value: String(c.user.id_usuario),
    label: `${c.user.nombre} ${c.user.apellidos}`,
  }))

  const filtradas = rutinas.filter((r) =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!filtroObj || (r.objetivo ?? '').toLowerCase().includes(filtroObj.toLowerCase()))
  )

  const ejercicioOptions = ejerciciosDisp.map((e) => ({ value: String(e.id_ejercicio), label: e.nombre }))

  function setFieldR(k, v) { setFormR((p) => ({ ...p, [k]: v })) }

  function addBloque() {
    setBloques((prev) => [...prev, { dia: prev.length + 1, ejercicios: [newEj()] }])
  }
  function addEjercicio(bi) {
    setBloques((prev) => prev.map((b, i) => i === bi ? { ...b, ejercicios: [...b.ejercicios, newEj()] } : b))
  }
  function updateEjercicio(bi, ei, campo, valor) {
    setBloques((prev) => prev.map((b, i) =>
      i === bi ? { ...b, ejercicios: b.ejercicios.map((e, j) => j === ei ? { ...e, [campo]: valor } : e) } : b
    ))
  }
  function removeEjercicio(bi, ei) {
    setBloques((prev) => prev.map((b, i) => i === bi ? { ...b, ejercicios: b.ejercicios.filter((_, j) => j !== ei) } : b))
  }

  function cerrarCrear() { setModalCrear(false); setFormR(emptyRutinaForm); setBloques([newBloque()]); setErrorR('') }

  async function handleCrearRutina() {
    if (!formR.nombre.trim()) { setErrorR('El nombre es obligatorio'); return }
    setErrorR(''); setSavingR(true)
    try {
      const rutina = await routinesApi.createRoutine({
        nombre:      formR.nombre,
        objetivo:    formR.objetivo    || null,
        nivel:       formR.nivel       || null,
        descripcion: formR.descripcion || null,
      })

      for (let i = 0; i < bloques.length; i++) {
        const block = await routinesApi.createBlock(rutina.id_rutina, { numero_dia: bloques[i].dia })
        for (let j = 0; j < bloques[i].ejercicios.length; j++) {
          const ej = bloques[i].ejercicios[j]
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
      cerrarCrear()
      cargarRutinas()
    } catch (err) { setErrorR(err.message || 'Error al crear la rutina') }
    finally { setSavingR(false) }
  }

  async function abrirAsignar(rutina) {
    setRutinaAsignar(rutina)
    setClienteId('')
    setFechaInicio('')
    setFechaFin('')
    setErrorA('')
    setBloquesAsignar([])
    setModalAsignar(true)
    setLoadingBloques(true)
    try {
      const bloques = await routinesApi.getBlocks(rutina.id_rutina)
      const bloquesConEj = await Promise.all(
        bloques.map(async (b) => {
          const ejercicios = await routinesApi.getBlockExercises(rutina.id_rutina, b.id_bloque_rutina)
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
    } finally {
      setLoadingBloques(false)
    }
  }

  function cerrarAsignar() { setModalAsignar(false); setRutinaAsignar(null); setBloquesAsignar([]) }

  function updateOverride(bi, ei, campo, valor) {
    setBloquesAsignar((prev) => prev.map((b, i) =>
      i === bi ? { ...b, ejercicios: b.ejercicios.map((e, j) => j === ei ? { ...e, [campo]: valor } : e) } : b
    ))
  }

  async function handleAsignar() {
    if (!clienteId)   { setErrorA('Selecciona un cliente');       return }
    if (!fechaInicio) { setErrorA('La fecha de inicio es obligatoria'); return }
    if (!fechaFin)    { setErrorA('La fecha de fin es obligatoria');    return }
    setErrorA(''); setSavingA(true)
    try {
      const asignacion = await assignmentsApi.createAssignment(clienteId, {
        id_rutina:    rutinaAsignar.id_rutina,
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
      cerrarAsignar()
    } catch (err) { setErrorA(err.message || 'Error al asignar') }
    finally { setSavingA(false) }
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <Input placeholder="Nombre rutina" value={busqueda}  onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-44">
          <Input placeholder="Objetivo"      value={filtroObj} onChange={(e) => setFiltroObj(e.target.value)} />
        </div>
        <Button onClick={() => setModalCrear(true)}>Crear rutina</Button>
      </div>

      {/* Grid de tarjetas */}
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Rutinas</p>
        {loadingRutinas ? (
          <div className="flex justify-center py-12">
            <span className="w-7 h-7 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorRutinas ? (
          <p className="text-sm text-red-500 py-8 text-center">{errorRutinas}</p>
        ) : filtradas.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No se encontraron rutinas</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtradas.map((r) => (
              <RutinaCard key={r.id_rutina} rutina={r} onAsignar={abrirAsignar} />
            ))}
          </div>
        )}
      </div>

      {/* Modal crear rutina */}
      <Modal isOpen={modalCrear} onClose={cerrarCrear} title="Crear rutina">
        <div className="flex flex-col gap-5">
          {/* Datos generales */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de la rutina</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Input placeholder="Nombre de la rutina" value={formR.nombre}   onChange={(e) => setFieldR('nombre',   e.target.value)} error={errorR && !formR.nombre.trim() ? errorR : ''} />
                <Input placeholder="Objetivo"            value={formR.objetivo} onChange={(e) => setFieldR('objetivo', e.target.value)} />
                <Input type="select" placeholder="Nivel" value={formR.nivel}    onChange={(e) => setFieldR('nivel',    e.target.value)} options={NIVEL_OPTIONS} />
              </div>
              <Input type="textarea" placeholder="Descripción" value={formR.descripcion} onChange={(e) => setFieldR('descripcion', e.target.value)} />
            </div>
          </div>

          {/* Bloques */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ejercicios de la rutina</p>
            <div className="flex flex-col gap-3">
              {bloques.map((bloque, bi) => (
                <div key={bi} className="bg-blue-50 rounded-xl p-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-[#1D7FD8]">Día {bloque.dia}</p>
                  {bloque.ejercicios.map((ej, ei) => (
                    <div key={ei} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          type="select"
                          placeholder="Selecciona ejercicio"
                          value={ej.id_ejercicio}
                          options={ejercicioOptions}
                          onChange={(e) => updateEjercicio(bi, ei, 'id_ejercicio', e.target.value)}
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          placeholder="Series"
                          value={ej.series_plan}
                          onChange={(e) => updateEjercicio(bi, ei, 'series_plan', e.target.value)}
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={ej.reps_plan}
                          onChange={(e) => updateEjercicio(bi, ei, 'reps_plan', e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Peso kg"
                          value={ej.peso_obj}
                          onChange={(e) => updateEjercicio(bi, ei, 'peso_obj', e.target.value)}
                        />
                      </div>
                      {bloque.ejercicios.length > 1 && (
                        <button onClick={() => removeEjercicio(bi, ei)} className="text-gray-400 hover:text-red-500 text-lg leading-none px-1">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addEjercicio(bi)} className="text-xs text-[#1D7FD8] hover:underline self-start mt-1">
                    + Añadir ejercicio
                  </button>
                </div>
              ))}
              <button onClick={addBloque} className="text-sm text-[#1D7FD8] hover:underline self-start">
                + Añadir bloque
              </button>
            </div>
          </div>

          {errorR && formR.nombre.trim() && <p className="text-sm text-red-500">{errorR}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={cerrarCrear}>Cancelar</Button>
            <Button loading={savingR} onClick={handleCrearRutina}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal asignar rutina */}
      <Modal isOpen={modalAsignar} onClose={cerrarAsignar} title="Asignar rutina">
        <div className="flex flex-col gap-5">
          {rutinaAsignar && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="font-semibold text-gray-800">{rutinaAsignar.nombre}</p>
              {rutinaAsignar.nivel && <p className="text-xs text-gray-500 mt-0.5">Nivel: {rutinaAsignar.nivel}</p>}
            </div>
          )}

          {/* Datos de la asignación */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de la asignación</p>
            <div className="flex flex-col gap-3">
              <Input
                type="select"
                placeholder={loadingClientes ? 'Cargando clientes…' : 'Selecciona un cliente'}
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

          {/* Personalización de ejercicios por cliente */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Personalización por cliente <span className="normal-case font-normal text-gray-400">(opcional — deja vacío para usar los valores de la rutina)</span>
            </p>
            {loadingBloques ? (
              <div className="flex justify-center py-4">
                <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bloquesAsignar.length === 0 ? (
              <p className="text-sm text-gray-400">Esta rutina no tiene ejercicios definidos</p>
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
                              <Input
                                type="number"
                                placeholder={String(ej.series_plan)}
                                value={ej.override_series}
                                onChange={(e) => updateOverride(bi, ei, 'override_series', e.target.value)}
                              />
                            </div>
                            <div className="w-16">
                              <Input
                                type="number"
                                placeholder={String(ej.reps_plan)}
                                value={ej.override_reps}
                                onChange={(e) => updateOverride(bi, ei, 'override_reps', e.target.value)}
                              />
                            </div>
                            <div className="w-20">
                              <Input
                                type="number"
                                placeholder={ej.peso_obj != null ? String(ej.peso_obj) : 'Peso kg'}
                                value={ej.override_peso}
                                onChange={(e) => updateOverride(bi, ei, 'override_peso', e.target.value)}
                              />
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

          {errorA && <p className="text-sm text-red-500">{errorA}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={cerrarAsignar}>Cancelar</Button>
            <Button loading={savingA} onClick={handleAsignar}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// PESTAÑA MULTIMEDIA
// ─────────────────────────────────────────────────────────────────

// TODO: sustituir por GET multimedia cuando exista el endpoint
const multimediaMock = [
  { id: 1, nombre: 'Press banca técnica', tipo: 'Vídeo', tamaño: '12 MB', asociado: 'Press banca' },
  { id: 2, nombre: 'Sentadilla guía',     tipo: 'Vídeo', tamaño: '8 MB',  asociado: 'Sentadilla'  },
  { id: 3, nombre: 'Postura plancha',     tipo: 'Foto',  tamaño: '2 MB',  asociado: 'Plancha'     },
  { id: 4, nombre: 'Pull-up progresión',  tipo: 'Vídeo', tamaño: '15 MB', asociado: 'Pull-up'     },
]

const emptyMediaForm = { nombre: '', url: '' }

function MediaCard({ item }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-28 bg-gray-200 flex items-center justify-center">
        <Upload size={28} className="text-gray-400" />
      </div>
      <div className="p-4 flex flex-col gap-1">
        <p className="font-semibold text-sm text-gray-800">{item.nombre}</p>
        <p className="text-xs text-gray-500">Tipo: {item.tipo}</p>
        <p className="text-xs text-gray-500">Tamaño: {item.tamaño}</p>
        <p className="text-xs text-gray-500">Asociado: {item.asociado}</p>
      </div>
    </div>
  )
}

function TabMultimedia() {
  const [filtroTipo,  setFiltroTipo]  = useState('')
  const [filtroEj,    setFiltroEj]    = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form,  setForm]  = useState(emptyMediaForm)
  const [error, setError] = useState('')

  const filtrados = multimediaMock.filter((m) =>
    (!filtroTipo || m.tipo.toLowerCase().includes(filtroTipo.toLowerCase())) &&
    (!filtroEj   || m.asociado.toLowerCase().includes(filtroEj.toLowerCase()))
  )

  function cerrar() { setModalAbierto(false); setForm(emptyMediaForm); setError('') }

  function handleGuardar() {
    if (!form.nombre.trim() || !form.url.trim()) { setError('Nombre y URL son obligatorios'); return }
    // TODO: conectar con endpoint de multimedia cuando exista
    cerrar()
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-44">
          <Input placeholder="Tipo de archivo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} />
        </div>
        <div className="flex-1 min-w-36">
          <Input placeholder="Ejercicio asociado" value={filtroEj} onChange={(e) => setFiltroEj(e.target.value)} />
        </div>
        <Button onClick={() => setModalAbierto(true)}>Subir archivo</Button>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Contenido multimedia</p>
        {filtrados.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No se encontró contenido multimedia</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtrados.map((m) => <MediaCard key={m.id} item={m} />)}
          </div>
        )}
      </div>

      <Modal isOpen={modalAbierto} onClose={cerrar} title="Subir archivo">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del archivo</p>
            <Input placeholder="Nombre del archivo" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
          </div>

          {/* Área visual drag & drop — el backend almacena URLs, no binarios */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contenido multimedia</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 mb-3 bg-gray-50">
              <Upload size={28} />
              <p className="text-sm">Sube el archivo</p>
              <p className="text-xs text-gray-300">El backend almacena la URL, no el fichero</p>
            </div>
            {/* TODO: cuando exista almacenamiento real, reemplazar por un input[type=file] */}
            <Input placeholder="URL del archivo" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={cerrar}>Cancelar</Button>
            <Button onClick={handleGuardar}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────
function ContenidoPage() {
  const [activeTab, setActiveTab] = useState('Ejercicios')

  return (
    <div className="p-8 flex flex-col gap-6">
      <h1 className="text-3xl font-black text-gray-900">Contenido</h1>
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div>
        {activeTab === 'Ejercicios' && <TabEjercicios />}
        {activeTab === 'Rutinas'    && <TabRutinas />}
        {activeTab === 'Multimedia' && <TabMultimedia />}
      </div>
    </div>
  )
}

export default ContenidoPage
