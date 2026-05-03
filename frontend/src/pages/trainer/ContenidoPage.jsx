import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload, Dumbbell, ClipboardList, Film, Image as ImageIcon, Archive, ArchiveRestore, Hash, Plus, Search } from 'lucide-react'
import { exercisesApi, routinesApi } from '../../services/api'
import TabBar              from '../../components/shared/TabBar'
import Table               from '../../components/shared/Table'
import Modal               from '../../components/shared/Modal'
import Button              from '../../components/shared/Button'
import Input               from '../../components/shared/Input'
import ModalCrearEjercicio    from '../../components/trainer/ModalCrearEjercicio'
import ModalDetalleEjercicio  from '../../components/trainer/ModalDetalleEjercicio'
import ModalCrearRutina       from '../../components/trainer/ModalCrearRutina'
import ModalDetalleRutina     from '../../components/trainer/ModalDetalleRutina'
import ModalAsignarRutina     from '../../components/trainer/ModalAsignarRutina'

const TABS = ['Ejercicios', 'Rutinas', 'Multimedia']


// ─────────────────────────────────────────────────────────────────
// PESTAÑA EJERCICIOS
// ─────────────────────────────────────────────────────────────────
function TabEjercicios() {
  const [ejercicios,   setEjercicios]   = useState([])
  const [loadingEj,    setLoadingEj]    = useState(true)
  const [errorEj,      setErrorEj]      = useState('')
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroGrupo,  setFiltroGrupo]  = useState('')
  const [filtroEquip,  setFiltroEquip]  = useState('')
  const [modalEj,           setModalEj]           = useState(false)
  const [selectedEjercicio, setSelectedEjercicio] = useState(null)
  const [toggling,          setToggling]          = useState(new Set())

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

  async function handleToggle(ejercicio) {
    const id = ejercicio.id_ejercicio
    setToggling(prev => new Set([...prev, id]))
    try {
      const updated = ejercicio.archivado
        ? await exercisesApi.unarchiveExercise(id)
        : await exercisesApi.archiveExercise(id)
      setEjercicios(prev => prev.map(e => e.id_ejercicio === id ? updated : e))
    } catch {
      // silencioso — el estado local no cambia
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const columnas = [
    {
      key: 'nombre',
      label: 'Ejercicio',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Hash size={14} className="text-[#1D7FD8]" />
          </div>
          <span className="font-semibold text-gray-900">{v}</span>
        </div>
      ),
    },
    {
      key: 'grupo_muscular',
      label: 'Grupo muscular',
      render: (v) => v
        ? <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50 text-[#1D7FD8] text-xs font-medium">{v}</span>
        : <span className="text-gray-300">—</span>,
    },
    { key: 'equipamiento', label: 'Equipamiento' },
    {
      key: 'archivado',
      label: 'Estado',
      render: (v) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
          ${v ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-red-500' : 'bg-green-500'}`} />
          {v ? 'Inactivo' : 'Activo'}
        </span>
      ),
    },
    {
      key: '_action',
      label: '',
      render: (_, row) => {
        const loading = toggling.has(row.id_ejercicio)
        const Icon = row.archivado ? ArchiveRestore : Archive
        return (
          <button
            disabled={loading}
            title={row.archivado ? 'Activar' : 'Archivar'}
            onClick={(e) => { e.stopPropagation(); handleToggle(row) }}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? '…' : <Icon size={15} />}
          </button>
        )
      },
    },
  ]

  const filtrados = ejercicios.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!filtroGrupo || (e.grupo_muscular ?? '').toLowerCase().includes(filtroGrupo.toLowerCase())) &&
    (!filtroEquip || (e.equipamiento ?? '').toLowerCase().includes(filtroEquip.toLowerCase()))
  )

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-44 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            placeholder="Nombre ejercicio"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors"
          />
        </div>
        <div className="w-44">
          <input
            placeholder="Grupo muscular"
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors"
          />
        </div>
        <div className="w-44">
          <input
            placeholder="Equipamiento"
            value={filtroEquip}
            onChange={(e) => setFiltroEquip(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors"
          />
        </div>
        <Button onClick={() => setModalEj(true)}>
          <Plus size={15} />
          Crear ejercicio
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-gray-700">Tabla de ejercicios</p>
          {!loadingEj && !errorEj && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {filtrados.length}
            </span>
          )}
        </div>
        {loadingEj ? (
          <div className="flex justify-center py-12">
            <span className="w-7 h-7 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorEj ? (
          <p className="text-sm text-red-500 py-8 text-center">{errorEj}</p>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-300">
            <Dumbbell size={36} />
            <p className="text-sm">No se encontraron ejercicios</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <Table columns={columnas} data={filtrados} onRowClick={setSelectedEjercicio} />
          </div>
        )}
      </div>

      <ModalCrearEjercicio
        isOpen={modalEj}
        onClose={() => setModalEj(false)}
        onSuccess={cargarEjercicios}
      />
      <ModalDetalleEjercicio
        isOpen={!!selectedEjercicio}
        onClose={() => setSelectedEjercicio(null)}
        ejercicio={selectedEjercicio}
        onSuccess={cargarEjercicios}
      />
    </>
  )
}


// ─────────────────────────────────────────────────────────────────
// PESTAÑA RUTINAS
// ─────────────────────────────────────────────────────────────────
const NIVEL_COLOR = {
  PRINCIPIANTE: { strip: 'bg-green-400',  badge: 'bg-green-100 text-green-700'   },
  INTERMEDIO:   { strip: 'bg-[#1D7FD8]',  badge: 'bg-blue-100 text-[#1D7FD8]'   },
  AVANZADO:     { strip: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
}

function nivelColors(nivel) {
  return NIVEL_COLOR[(nivel ?? '').toUpperCase()] ?? { strip: 'bg-gray-200', badge: 'bg-gray-100 text-gray-500' }
}

function RutinaCard({ rutina, onAsignar, onToggle, onDetalle, toggling }) {
  const nc = rutina.archivado ? { strip: 'bg-gray-200', badge: 'bg-gray-100 text-gray-500' } : nivelColors(rutina.nivel)
  const loadingToggle = toggling.has(rutina.id_rutina)

  return (
    <div
      onClick={() => onDetalle(rutina)}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className={`h-1.5 ${nc.strip}`} />
      <div className="p-5 flex flex-col gap-3 flex-1">

        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-gray-900 leading-snug">{rutina.nombre}</p>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${nc.badge}`}>
            {rutina.archivado ? 'Archivada' : (rutina.nivel ?? '—')}
          </span>
        </div>

        {rutina.objetivo && (
          <span className="self-start text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
            {rutina.objetivo}
          </span>
        )}

        <p className={`text-xs text-gray-400 line-clamp-2 flex-1 ${rutina.archivado ? 'opacity-60' : ''}`}>
          {rutina.descripcion}
        </p>

        {rutina.archivado ? (
          <button
            disabled={loadingToggle}
            onClick={(e) => { e.stopPropagation(); onToggle(rutina) }}
            className="mt-auto w-full flex items-center justify-center bg-green-100 text-green-700
                       text-sm font-semibold py-2 rounded-xl hover:bg-green-200 transition-colors
                       disabled:opacity-50"
          >
            {loadingToggle ? '…' : 'Activar'}
          </button>
        ) : (
          <div className="mt-auto flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAsignar(rutina) }}
              className="flex-1 flex items-center justify-center bg-[#1D7FD8]/10 text-[#1D7FD8]
                         text-sm font-semibold py-2 rounded-xl hover:bg-[#1D7FD8]/20 transition-colors"
            >
              Asignar
            </button>
            <button
              disabled={loadingToggle}
              onClick={(e) => { e.stopPropagation(); onToggle(rutina) }}
              className="px-3 flex items-center justify-center bg-gray-100 text-gray-500
                         text-sm font-semibold py-2 rounded-xl hover:bg-gray-200 transition-colors
                         disabled:opacity-50"
            >
              {loadingToggle ? '…' : 'Archivar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TabRutinas() {
  const [rutinas,        setRutinas]        = useState([])
  const [ejercicios,     setEjercicios]     = useState([])
  const [loadingRutinas, setLoadingRutinas] = useState(true)
  const [errorRutinas,   setErrorRutinas]   = useState('')
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroObj,      setFiltroObj]      = useState('')
  const [modalCrear,     setModalCrear]     = useState(false)
  const [modalAsignar,   setModalAsignar]   = useState(false)
  const [rutinaAsignar,  setRutinaAsignar]  = useState(null)
  const [selectedRutina, setSelectedRutina] = useState(null)
  const [toggling,       setToggling]       = useState(new Set())

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

  useEffect(() => {
    cargarRutinas()
    exercisesApi.getExercises().then(setEjercicios).catch(() => {})
  }, [])

  async function handleToggle(rutina) {
    const id = rutina.id_rutina
    setToggling(prev => new Set([...prev, id]))
    try {
      const updated = rutina.archivado
        ? await routinesApi.unarchiveRoutine(id)
        : await routinesApi.archiveRoutine(id)
      setRutinas(prev => prev.map(r => r.id_rutina === id ? updated : r))
    } catch {
      // silencioso — el estado local no cambia
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const filtradas = rutinas.filter((r) =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!filtroObj || (r.objetivo ?? '').toLowerCase().includes(filtroObj.toLowerCase()))
  )
  const activas    = filtradas.filter((r) => !r.archivado)
  const archivadas = filtradas.filter((r) =>  r.archivado)

  function abrirAsignar(rutina) {
    setRutinaAsignar(rutina)
    setModalAsignar(true)
  }
  function cerrarAsignar() {
    setModalAsignar(false)
    setRutinaAsignar(null)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <Input placeholder="Nombre rutina" value={busqueda}  onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-44">
          <Input placeholder="Objetivo"      value={filtroObj} onChange={(e) => setFiltroObj(e.target.value)} />
        </div>
        <Button onClick={() => setModalCrear(true)}>Crear rutina</Button>
      </div>

      <div className="mt-4 flex flex-col gap-8">
        {/* Rutinas activas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold text-gray-700">Rutinas</p>
            {!loadingRutinas && !errorRutinas && (
              <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {activas.length}
              </span>
            )}
          </div>
          {loadingRutinas ? (
            <div className="flex justify-center py-12">
              <span className="w-7 h-7 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : errorRutinas ? (
            <p className="text-sm text-red-500 py-8 text-center">{errorRutinas}</p>
          ) : activas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-300">
              <ClipboardList size={36} />
              <p className="text-sm">No se encontraron rutinas activas</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {activas.map((r) => (
                <RutinaCard
                  key={r.id_rutina}
                  rutina={r}
                  onAsignar={abrirAsignar}
                  onToggle={handleToggle}
                  onDetalle={setSelectedRutina}
                  toggling={toggling}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rutinas archivadas */}
        {!loadingRutinas && !errorRutinas && archivadas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Archive size={14} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-400">Archivadas</p>
              <span className="text-xs font-semibold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                {archivadas.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {archivadas.map((r) => (
                <RutinaCard
                  key={r.id_rutina}
                  rutina={r}
                  onAsignar={abrirAsignar}
                  onToggle={handleToggle}
                  onDetalle={setSelectedRutina}
                  toggling={toggling}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ModalCrearRutina
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        onSuccess={cargarRutinas}
      />
      <ModalAsignarRutina
        isOpen={modalAsignar}
        onClose={cerrarAsignar}
        rutina={rutinaAsignar}
      />
      <ModalDetalleRutina
        isOpen={!!selectedRutina}
        onClose={() => setSelectedRutina(null)}
        rutina={selectedRutina}
        ejercicios={ejercicios}
        onSuccess={() => { setSelectedRutina(null); cargarRutinas() }}
      />
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

const TIPO_CONFIG = {
  'Vídeo': { icon: Film,       bg: 'from-blue-50 to-blue-100',   badge: 'bg-blue-100 text-[#1D7FD8]'  },
  'Foto':  { icon: ImageIcon,  bg: 'from-green-50 to-green-100', badge: 'bg-green-100 text-green-700' },
}

function tipoConfig(tipo) {
  return TIPO_CONFIG[tipo] ?? { icon: Upload, bg: 'from-gray-50 to-gray-100', badge: 'bg-gray-100 text-gray-500' }
}

function MediaCard({ item }) {
  const cfg = tipoConfig(item.tipo)
  const Icon = cfg.icon
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className={`h-32 bg-gradient-to-br ${cfg.bg} flex items-center justify-center relative`}>
        <Icon size={36} className="text-gray-300" />
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {item.tipo}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <p className="font-semibold text-sm text-gray-900 truncate">{item.nombre}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{item.tamaño}</span>
          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{item.asociado}</span>
        </div>
      </div>
    </div>
  )
}

function TabMultimedia() {
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroEj,     setFiltroEj]     = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form,         setForm]         = useState(emptyMediaForm)
  const [error,        setError]        = useState('')

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
          <Input placeholder="Tipo de archivo"    value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} />
        </div>
        <div className="flex-1 min-w-36">
          <Input placeholder="Ejercicio asociado" value={filtroEj}   onChange={(e) => setFiltroEj(e.target.value)} />
        </div>
        <Button onClick={() => setModalAbierto(true)}>Subir archivo</Button>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-gray-700">Contenido multimedia</p>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {filtrados.length}
          </span>
        </div>
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-300">
            <Upload size={36} />
            <p className="text-sm">No se encontró contenido multimedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
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
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'Ejercicios')

  return (
    <div className="p-8 flex flex-col gap-6">
      <h1 className="text-4xl font-black text-gray-900">Contenido</h1>
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
