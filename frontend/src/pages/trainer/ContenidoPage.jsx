import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload, Dumbbell, ClipboardList, Image as ImageIcon, Archive, ArchiveRestore, Hash, Plus, Search, Play } from 'lucide-react'
import { exercisesApi, routinesApi, multimediaApi, MEDIA_BASE } from '../../services/api'
import TabBar              from '../../components/shared/TabBar'
import SortableTable       from '../../components/shared/SortableTable'
import Modal               from '../../components/shared/Modal'
import Button              from '../../components/shared/Button'
import Input               from '../../components/shared/Input'
import ModalCrearEjercicio                  from '../../components/trainer/ModalCrearEjercicio'
import ModalDetalleEjercicio                from '../../components/trainer/ModalDetalleEjercicio'
import ModalCrearRutina                     from '../../components/trainer/ModalCrearRutina'
import ModalDetalleRutina                   from '../../components/trainer/ModalDetalleRutina'
import ModalAsignarRutina                   from '../../components/trainer/ModalAsignarRutina'
import ModalDetalleMultimedia               from '../../components/trainer/ModalDetalleMultimedia'
import ModalConfirmarEliminarMultimedia     from '../../components/trainer/ModalConfirmarEliminarMultimedia'

const TABS = ['Ejercicios', 'Rutinas', 'Multimedia']


// ─────────────────────────────────────────────────────────────────
// PESTAÑA EJERCICIOS
// ─────────────────────────────────────────────────────────────────
function TabEjercicios() {
  const [ejercicios,        setEjercicios]        = useState([])
  const [loadingEj,         setLoadingEj]         = useState(true)
  const [errorEj,           setErrorEj]           = useState('')
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

    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const columnas = [
    {
      key: 'nombre',
      label: 'Ejercicio',
      width: '2fr',
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
        ? <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50 text-[#1D7FD8] text-xs font-bold">{v}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'equipamiento',
      label: 'Equipamiento',
      render: (v) => v
        ? <span className="font-bold text-gray-700">{v}</span>
        : <span className="text-gray-300">—</span>,
    },
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

  const ejerciciosConId = ejercicios.map(e => ({ ...e, id: e.id_ejercicio }))

  return (
    <>
      <div className="mt-4">
        {loadingEj ? (
          <div className="flex justify-center py-12">
            <span className="w-7 h-7 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorEj ? (
          <p className="text-sm text-red-500 py-8 text-center">{errorEj}</p>
        ) : (
          <SortableTable
            data={ejerciciosConId}
            columns={columnas}
            title="Tabla de ejercicios"
            searchFields={[
              { key: 'nombre',         placeholder: 'Nombre' },
              { key: 'grupo_muscular', placeholder: 'Grupo muscular' },
              { key: 'equipamiento',   placeholder: 'Equipamiento' },
            ]}
            maxHeight="max-h-[392px]"
            emptyMessage="No se encontraron ejercicios"
            onRowClick={setSelectedEjercicio}
            action={
              <Button onClick={() => setModalEj(true)}>
                <Plus size={15} />Crear ejercicio
              </Button>
            }
          />
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
        <Button onClick={() => setModalCrear(true)}>
          <Plus size={15} />
          Crear rutina
          </Button>
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

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MediaCard({ item, onOpen }) {
  const [imgError, setImgError] = useState(false)
  const esVideo = item.tipo === 'VIDEO'

  return (
    <div
      onClick={() => onOpen(item)}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        {esVideo ? (
          <div className="w-full h-full bg-gray-950 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Play size={22} className="text-[#1D7FD8] ml-1" fill="currentColor" />
            </div>
            <span className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              VIDEO
            </span>
          </div>
        ) : (
          <div className="w-full h-full bg-green-50 flex items-center justify-center">
            {!imgError ? (
              <img
                src={`${MEDIA_BASE}/${item.nombre_archivo}`}
                alt={item.nombre_original}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <ImageIcon size={36} className="text-green-300" />
            )}
            <span className="absolute top-2.5 left-2.5 bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded">
              IMAGEN
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2" title={item.nombre_original}>
          {item.nombre_original}
        </p>
        <p className="text-xs text-gray-400">
          {formatBytes(item.tamano_bytes)} · {new Date(item.fecha_subida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

const PILLS = [
  { key: '',       label: 'Todos',    dot: null,           activeClass: 'bg-gray-900 text-white' },
  { key: 'VIDEO',  label: 'Vídeos',   dot: 'bg-[#1D7FD8]', activeClass: 'bg-[#1D7FD8]/10 text-[#1D7FD8]' },
  { key: 'IMAGEN', label: 'Imágenes', dot: 'bg-green-500',  activeClass: 'bg-green-50 text-green-700' },
]

function TabMultimedia() {
  const [archivos,      setArchivos]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [busqueda,      setBusqueda]      = useState('')
  const [filtroTipo,    setFiltroTipo]    = useState('')
  const [uploadModal,   setUploadModal]   = useState(false)
  const [selectedFile,  setSelectedFile]  = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadError,   setUploadError]   = useState('')
  const [deleting,      setDeleting]      = useState(new Set())
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(null)

  async function cargarArchivos() {
    setLoading(true); setError('')
    try {
      const data = await multimediaApi.getFiles()
      setArchivos(data)
    } catch (err) {
      setError(err.message || 'Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarArchivos() }, [])

  function cerrarUpload() { setUploadModal(false); setSelectedFile(null); setUploadError('') }

  async function handleSubir() {
    if (!selectedFile) { setUploadError('Selecciona un archivo'); return }
    setUploading(true); setUploadError('')
    try {
      await multimediaApi.uploadFile(selectedFile)
      cargarArchivos()
      cerrarUpload()
    } catch (err) {
      setUploadError(err.message || 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  async function handleEliminar(item) {
    try {
      const usage = await multimediaApi.getFileUsage(item.id_archivo)
      setConfirmDelete({ item, usage })
    } catch {
      setConfirmDelete({ item, usage: { total: 0, ejercicios: [] } })
    }
  }

  async function confirmarEliminar() {
    if (!confirmDelete) return
    const id = confirmDelete.item.id_archivo
    setDeleting(prev => new Set([...prev, id]))
    setConfirmDelete(null)
    try {
      await multimediaApi.deleteFile(id)
      setArchivos(prev => prev.filter(a => a.id_archivo !== id))
    } catch {

    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const counts = {
    '':       archivos.length,
    'VIDEO':  archivos.filter(a => a.tipo === 'VIDEO').length,
    'IMAGEN': archivos.filter(a => a.tipo === 'IMAGEN').length,
  }

  const filtrados = archivos.filter((a) =>
    (!filtroTipo || a.tipo === filtroTipo) &&
    (!busqueda   || a.nombre_original.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <>
      {/* Fila 1: búsqueda + subir */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            placeholder="Buscar archivo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1D7FD8] transition-colors"
          />
        </div>
        <Button onClick={() => setUploadModal(true)}>
          <Upload size={15} />
          Subir archivo
        </Button>
      </div>

      {/* Fila 2: pills de filtro */}
      <div className="flex items-center gap-2 flex-wrap mt-3">
        {PILLS.map(p => (
          <button
            key={p.key}
            onClick={() => setFiltroTipo(p.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filtroTipo === p.key
                ? p.activeClass
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {p.dot && <span className={`w-2 h-2 rounded-full ${p.dot}`} />}
            {p.label}
            <span className="text-xs opacity-70">{counts[p.key]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-7 h-7 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 py-8 text-center">{error}</p>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-300">
            <Upload size={36} />
            <p className="text-sm">No se encontró contenido multimedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filtrados.map((a) => (
              <MediaCard
                key={a.id_archivo}
                item={a}
                onOpen={setSelectedMedia}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal subir archivo */}
      <Modal isOpen={uploadModal} onClose={cerrarUpload} title="Subir archivo">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selecciona un archivo</p>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 bg-gray-50 cursor-pointer hover:border-[#1D7FD8] transition-colors"
            onClick={() => document.getElementById('media-file-input').click()}
          >
            <Upload size={28} className={selectedFile ? 'text-[#1D7FD8]' : 'text-gray-300'} />
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">Haz clic para seleccionar</p>
                <p className="text-xs text-gray-400">Vídeos e imágenes</p>
              </>
            )}
          </div>
          <input
            id="media-file-input"
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={cerrarUpload}>Cancelar</Button>
            <Button loading={uploading} onClick={handleSubir}>Subir</Button>
          </div>
        </div>
      </Modal>

      <ModalDetalleMultimedia
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        archivo={selectedMedia}
        onEliminar={(item) => { setSelectedMedia(null); handleEliminar(item) }}
      />

      <ModalConfirmarEliminarMultimedia
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        item={confirmDelete?.item ?? null}
        usage={confirmDelete?.usage ?? null}
        onConfirm={confirmarEliminar}
      />
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
