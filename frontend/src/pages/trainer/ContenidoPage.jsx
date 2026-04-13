import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import TabBar    from '../../components/shared/TabBar'
import Table     from '../../components/shared/Table'
import Modal     from '../../components/shared/Modal'
import Button    from '../../components/shared/Button'
import Input     from '../../components/shared/Input'

const API_BASE = 'http://localhost:8080/api/v1'
const TABS     = ['Ejercicios', 'Rutinas', 'Multimedia']

const NIVEL_OPTIONS = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
]

const DIFICULTAD_OPTIONS = NIVEL_OPTIONS

// ─────────────────────────────────────────────────────────────────
// PESTAÑA EJERCICIOS
// ─────────────────────────────────────────────────────────────────
const columnasEjercicios = [
  { key: 'nombre',         label: 'Ejercicio'      },
  { key: 'grupo_muscular', label: 'Grupo muscular' },
  { key: 'dificultad',     label: 'Dificultad'     },
  { key: 'equipamiento',   label: 'Equipamiento'   },
  { key: 'uso_rutinas',    label: 'Uso en rutinas' },
]

// TODO: sustituir por GET /api/v1/exercises
const ejerciciosMock = [
  { nombre: 'Press banca', grupo_muscular: 'Pecho',   dificultad: 'INTERMEDIO',   equipamiento: 'Barra',      uso_rutinas: 3 },
  { nombre: 'Sentadilla',  grupo_muscular: 'Piernas', dificultad: 'INTERMEDIO',   equipamiento: 'Barra',      uso_rutinas: 5 },
  { nombre: 'Peso muerto', grupo_muscular: 'Espalda', dificultad: 'AVANZADO',     equipamiento: 'Barra',      uso_rutinas: 2 },
  { nombre: 'Pull-up',     grupo_muscular: 'Espalda', dificultad: 'INTERMEDIO',   equipamiento: 'Barra fija', uso_rutinas: 4 },
  { nombre: 'Plancha',     grupo_muscular: 'Core',    dificultad: 'PRINCIPIANTE', equipamiento: 'Ninguno',    uso_rutinas: 6 },
]

const emptyEjForm = { nombre: '', descripcion: '', dificultad: '', grupo_muscular: '', equipamiento: '', video_url: '' }

function TabEjercicios({ user }) {
  const [busqueda,    setBusqueda]    = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroDif,   setFiltroDif]   = useState('')
  const [filtroEquip, setFiltroEquip] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form,  setForm]  = useState(emptyEjForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const filtrados = ejerciciosMock.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!filtroGrupo || e.grupo_muscular.toLowerCase().includes(filtroGrupo.toLowerCase())) &&
    (!filtroDif   || e.dificultad === filtroDif) &&
    (!filtroEquip || e.equipamiento.toLowerCase().includes(filtroEquip.toLowerCase()))
  )

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }
  function cerrar() { setModalAbierto(false); setForm(emptyEjForm); setError('') }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({
          nombre:         form.nombre,
          descripcion:    form.descripcion    || null,
          dificultad:     form.dificultad     || null,
          grupo_muscular: form.grupo_muscular || null,
          equipamiento:   form.equipamiento   || null,
          video_url:      form.video_url       || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Error al crear'); return }
      // TODO: añadir el ejercicio creado al estado local o refetch
      cerrar()
    } catch { setError('Error al conectar con el servidor') }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <Input placeholder="Nombre ejercicio"  value={busqueda}    onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-40">
          <Input placeholder="Grupo muscular"    value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} />
        </div>
        <div className="w-44">
          <Input type="select" placeholder="Dificultad" value={filtroDif} onChange={(e) => setFiltroDif(e.target.value)} options={DIFICULTAD_OPTIONS} />
        </div>
        <div className="w-40">
          <Input placeholder="Equipamiento" value={filtroEquip} onChange={(e) => setFiltroEquip(e.target.value)} />
        </div>
        <Button onClick={() => setModalAbierto(true)}>Crear ejercicio</Button>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Tabla de ejercicios</p>
        <Table columns={columnasEjercicios} data={filtrados} emptyMessage="No se encontraron ejercicios" />
      </div>

      <Modal isOpen={modalAbierto} onClose={cerrar} title="Crear ejercicio">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del ejercicio</p>
            <div className="flex flex-col gap-3">
              <Input placeholder="Nombre del ejercicio" value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} error={error && !form.nombre.trim() ? error : ''} />
              <div className="flex gap-3">
                <Input type="select" placeholder="Dificultad" value={form.dificultad} onChange={(e) => setField('dificultad', e.target.value)} options={DIFICULTAD_OPTIONS} />
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

// ─────────────────────────────────────────────────────────────────
// PESTAÑA RUTINAS
// ─────────────────────────────────────────────────────────────────

// TODO: sustituir por GET /api/v1/routines
const rutinasMock = [
  { id: 1, nombre: 'Fuerza 4 días',   nivel: 'INTERMEDIO',   objetivo: 'Hipertrofia',      descripcion: 'Rutina de fuerza con énfasis en grandes grupos musculares.' },
  { id: 2, nombre: 'Cardio + Tono',   nivel: 'PRINCIPIANTE', objetivo: 'Pérdida de peso',  descripcion: 'Combinación de cardio y ejercicios de tonificación.' },
  { id: 3, nombre: 'Full Body Avanz', nivel: 'AVANZADO',     objetivo: 'Rendimiento',      descripcion: 'Entrenamiento de cuerpo completo para atletas avanzados.' },
]

// TODO: sustituir por GET /api/v1/users/clients
const clientesMock = [
  { value: '1', label: 'Carlos García'  },
  { value: '2', label: 'Laura Martínez' },
  { value: '3', label: 'Pedro Gómez'   },
]

const emptyRutinaForm = { nombre: '', objetivo: '', nivel: '', descripcion: '' }
const newBloque = () => ({ dia: 1, ejercicios: [''] })

function RutinaCard({ rutina, onAsignar }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="font-bold text-gray-800">{rutina.nombre}</p>
        <p className="text-xs text-gray-500">Nivel: {rutina.nivel}</p>
        <p className="text-xs text-gray-500">Objetivo: {rutina.objetivo}</p>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rutina.descripcion}</p>
      </div>
      <div className="mt-auto">
        <Button size="sm" onClick={() => onAsignar(rutina)}>Asignar</Button>
      </div>
    </div>
  )
}

function TabRutinas({ user }) {
  const [busqueda,    setBusqueda]    = useState('')
  const [filtroObj,   setFiltroObj]   = useState('')

  // Modal crear rutina
  const [modalCrear, setModalCrear] = useState(false)
  const [formR,   setFormR]  = useState(emptyRutinaForm)
  const [bloques, setBloques] = useState([newBloque()])
  const [errorR,  setErrorR] = useState('')
  const [savingR, setSavingR] = useState(false)

  // Modal asignar rutina
  const [modalAsignar,    setModalAsignar]    = useState(false)
  const [rutinaAsignar,   setRutinaAsignar]   = useState(null)
  const [clienteId,       setClienteId]       = useState('')
  const [fechaInicio,     setFechaInicio]     = useState('')
  const [errorA,          setErrorA]          = useState('')
  const [savingA,         setSavingA]         = useState(false)

  const filtradas = rutinasMock.filter((r) =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!filtroObj || r.objetivo.toLowerCase().includes(filtroObj.toLowerCase()))
  )

  // ── Crear rutina ──
  function setFieldR(k, v) { setFormR((p) => ({ ...p, [k]: v })) }

  function addBloque() {
    setBloques((prev) => [...prev, { dia: prev.length + 1, ejercicios: [''] }])
  }
  function addEjercicio(bi) {
    setBloques((prev) => prev.map((b, i) => i === bi ? { ...b, ejercicios: [...b.ejercicios, ''] } : b))
  }
  function updateEjercicio(bi, ei, val) {
    setBloques((prev) => prev.map((b, i) => i === bi ? { ...b, ejercicios: b.ejercicios.map((e, j) => j === ei ? val : e) } : b))
  }
  function removeEjercicio(bi, ei) {
    setBloques((prev) => prev.map((b, i) => i === bi ? { ...b, ejercicios: b.ejercicios.filter((_, j) => j !== ei) } : b))
  }

  function cerrarCrear() { setModalCrear(false); setFormR(emptyRutinaForm); setBloques([newBloque()]); setErrorR('') }

  async function handleCrearRutina() {
    if (!formR.nombre.trim()) { setErrorR('El nombre es obligatorio'); return }
    setErrorR(''); setSavingR(true)
    try {
      // Paso 1: crear rutina
      const res = await fetch(`${API_BASE}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ nombre: formR.nombre, objetivo: formR.objetivo || null, nivel: formR.nivel || null, descripcion: formR.descripcion || null }),
      })
      if (!res.ok) { const d = await res.json(); setErrorR(d.detail || 'Error al crear la rutina'); return }
      const rutina = await res.json()

      // Paso 2: crear bloques
      // TODO: cuando los bloques tengan ejercicios reales, añadir POST /routines/{id}/blocks/{blockId}/exercises
      for (let i = 0; i < bloques.length; i++) {
        await fetch(`${API_BASE}/routines/${rutina.id_rutina}/blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
          body: JSON.stringify({ dia_semana: bloques[i].dia, orden: i + 1 }),
        })
      }
      // TODO: refetch lista de rutinas
      cerrarCrear()
    } catch { setErrorR('Error al conectar con el servidor') }
    finally { setSavingR(false) }
  }

  // ── Asignar rutina ──
  function abrirAsignar(rutina) { setRutinaAsignar(rutina); setClienteId(''); setFechaInicio(''); setErrorA(''); setModalAsignar(true) }
  function cerrarAsignar() { setModalAsignar(false); setRutinaAsignar(null) }

  async function handleAsignar() {
    if (!clienteId) { setErrorA('Selecciona un cliente'); return }
    setErrorA(''); setSavingA(true)
    try {
      // TODO: el body exacto depende del schema de AssignmentCreate — verificar con la API
      const res = await fetch(`${API_BASE}/assignments/clients/${clienteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` },
        body: JSON.stringify({ id_rutina: rutinaAsignar.id, fecha_inicio: fechaInicio || null }),
      })
      if (!res.ok) { const d = await res.json(); setErrorA(d.detail || 'Error al asignar'); return }
      cerrarAsignar()
    } catch { setErrorA('Error al conectar con el servidor') }
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
        {filtradas.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No se encontraron rutinas</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtradas.map((r) => (
              <RutinaCard key={r.id} rutina={r} onAsignar={abrirAsignar} />
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
                          placeholder="Nombre del ejercicio"
                          value={ej}
                          onChange={(e) => updateEjercicio(bi, ei, e.target.value)}
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
              {/* TODO: los ejercicios escritos son texto libre por ahora —
                  conectar con el catálogo real usando un selector de id_ejercicio */}
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
        <div className="flex flex-col gap-4">
          {rutinaAsignar && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="font-semibold text-gray-800">{rutinaAsignar.nombre}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clientes a asignar</p>
            {/* TODO: GET /api/v1/users/clients para cargar clientes reales del entrenador */}
            <Input type="select" placeholder="Selecciona los clientes" value={clienteId} onChange={(e) => setClienteId(e.target.value)} options={clientesMock} error={errorA} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Grupos a asignar</p>
            {/* TODO: GET /api/v1/grupos cuando exista el endpoint */}
            <Input type="select" placeholder="Selecciona los grupos" value="" onChange={() => {}} options={[]} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fecha inicio</p>
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
  const { user }     = useAuth()
  const [activeTab, setActiveTab] = useState('Ejercicios')

  return (
    <div className="p-8 flex flex-col gap-6">
      <h1 className="text-3xl font-black text-gray-900">Contenido</h1>
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div>
        {activeTab === 'Ejercicios' && <TabEjercicios user={user} />}
        {activeTab === 'Rutinas'    && <TabRutinas    user={user} />}
        {activeTab === 'Multimedia' && <TabMultimedia />}
      </div>
    </div>
  )
}

export default ContenidoPage
