import { useState, useEffect } from 'react'
import { Film, Image as ImageIcon, Pencil, Hash, Link2, Archive, ArchiveRestore, Grid3X3, ChevronRight, ChevronDown, Check } from 'lucide-react'
import Modal  from '../shared/Modal'
import Button from '../shared/Button'
import { exercisesApi, multimediaApi, MEDIA_BASE } from '../../services/api'
import Spinner from '../shared/Spinner'

const selectClass = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1D7FD8] transition-colors'
const inputClass  = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1D7FD8] transition-colors'

const GRUPOS_MUSCULARES = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Core', 'Pantorrillas',
  'Antebrazo', 'Full Body', 'Cardio',
]

const NIVEL_BADGE = {
  PRINCIPIANTE: { pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  INTERMEDIO:   { pill: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  AVANZADO:     { pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
}
function nivelBadge(nivel) {
  return NIVEL_BADGE[(nivel ?? '').toUpperCase()] ?? { pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
}

function ModalDetalleEjercicio({ isOpen, onClose, ejercicio, onSuccess }) {
  const [rutinas,    setRutinas]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [editando,   setEditando]   = useState(false)
  const [form,       setForm]       = useState({})
  const [saving,     setSaving]     = useState(false)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [archiving,  setArchiving]  = useState(false)

  useEffect(() => {
    if (!isOpen || !ejercicio) return
    setRutinas([])
    setEditando(false)
    setErrorMsg('')
    setLoading(true)
    exercisesApi.getExerciseRoutines(ejercicio.id_ejercicio)
      .then(setRutinas)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, ejercicio?.id_ejercicio])

  function abrirEdicion() {
    setForm({
      nombre:         ejercicio.nombre         ?? '',
      descripcion:    ejercicio.descripcion    ?? '',
      grupo_muscular: ejercicio.grupo_muscular ?? '',
      equipamiento:   ejercicio.equipamiento   ?? '',
      id_video:       ejercicio.video?.id_archivo  ?? null,
      id_imagen:      ejercicio.imagen?.id_archivo ?? null,
      archivado:      ejercicio.archivado      ?? false,
    })
    setErrorMsg('')
    setEditando(true)
    multimediaApi.getFiles().then(setMediaFiles).catch(() => {})
  }

  function cancelarEdicion() { setEditando(false); setErrorMsg('') }

  async function guardarCambios() {
    if (!form.nombre.trim()) { setErrorMsg('El nombre es obligatorio'); return }
    setSaving(true); setErrorMsg('')
    try {
      await exercisesApi.updateExercise(ejercicio.id_ejercicio, form)
      if (form.archivado !== ejercicio.archivado) {
        form.archivado
          ? await exercisesApi.archiveExercise(ejercicio.id_ejercicio)
          : await exercisesApi.unarchiveExercise(ejercicio.id_ejercicio)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleArchivado() {
    setArchiving(true)
    try {
      ejercicio.archivado
        ? await exercisesApi.unarchiveExercise(ejercicio.id_ejercicio)
        : await exercisesApi.archiveExercise(ejercicio.id_ejercicio)
      onSuccess?.()
      onClose()
    } catch {
      // silencioso
    } finally {
      setArchiving(false)
    }
  }

  if (!ejercicio) return null

  const footerVista = (
    <div className="px-6 py-4 flex items-center justify-between">
      <button
        onClick={handleToggleArchivado}
        disabled={archiving}
        className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        {ejercicio.archivado ? <ArchiveRestore size={16} /> : <Archive size={16} />}
        {archiving ? '…' : ejercicio.archivado ? 'Activar' : 'Archivar'}
      </button>
      <button
        onClick={abrirEdicion}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D7FD8] hover:bg-[#1a72c4] text-white text-sm font-bold transition-colors"
      >
        <Pencil size={14} />
        Editar
      </button>
    </div>
  )

  const footerEdicion = (
    <div className="px-6 py-4 flex items-center justify-end gap-3">
      <Button variant="secondary" onClick={cancelarEdicion} disabled={saving}>Cancelar</Button>
      <Button onClick={guardarCambios} loading={saving}>
        {!saving && <Check size={14} />}
        Guardar cambios
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? 'EDITAR EJERCICIO' : 'DETALLE DEL EJERCICIO'}
      titleClassName="text-xs font-bold text-gray-400 tracking-widest"
      maxWidth="max-w-xl"
      footer={editando ? footerEdicion : footerVista}
    >
      {editando ? (

        /* ── MODO EDICIÓN ─────────────────────────────────────── */
        <div className="flex flex-col gap-6">

          {/* Hero */}
          <div className="flex items-start gap-4 pb-5 border-b border-gray-100">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#1D7FD8] to-blue-700 flex items-center justify-center shadow-md">
              <Hash size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{ejercicio.nombre}</h2>
              <p className="text-sm text-gray-400 mt-0.5 leading-snug">
                Modifica los datos del ejercicio. Los cambios se aplicarán a todas las rutinas que lo usan.
              </p>
            </div>
          </div>

          {/* Sección 1 — Datos */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1D7FD8] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos del ejercicio</p>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                placeholder="Nombre del ejercicio"
                value={form.nombre}
                onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Grupo muscular + Equipamiento */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                  Grupo muscular <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.grupo_muscular}
                    onChange={(e) => setForm(p => ({ ...p, grupo_muscular: e.target.value }))}
                    className={`${selectClass} appearance-none pr-10`}
                  >
                    <option value="">Selecciona grupo</option>
                    {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
                    {form.grupo_muscular && !GRUPOS_MUSCULARES.includes(form.grupo_muscular) && (
                      <option value={form.grupo_muscular}>{form.grupo_muscular}</option>
                    )}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                  Equipamiento <span className="text-xs font-normal text-gray-400">opcional</span>
                </label>
                <input
                  placeholder="Ej. Mancuernas, Barra…"
                  value={form.equipamiento}
                  onChange={(e) => setForm(p => ({ ...p, equipamiento: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Descripción con contador */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-1.5 block">Descripción</label>
              <textarea
                placeholder="Descripción del ejercicio"
                value={form.descripcion}
                maxLength={280}
                onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
                rows={4}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1D7FD8] transition-colors resize-y"
              />
              <p className="text-xs text-[#1D7FD8] mt-1">{(form.descripcion ?? '').length} / 280 caracteres</p>
            </div>

            {/* Estado */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-2 block">Estado</label>
              <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden p-1 gap-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, archivado: false }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                    !form.archivado
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Activo
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, archivado: true }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    form.archivado
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Inactivo
                </button>
              </div>
            </div>
          </div>

          {/* Sección 2 — Multimedia */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1D7FD8] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contenido multimedia</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Vídeo de referencia <span className="text-xs font-normal text-gray-400">opcional</span>
              </label>
              <div className="relative">
                <select
                  value={form.id_video ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, id_video: e.target.value ? Number(e.target.value) : null }))}
                  className={`${selectClass} appearance-none pr-10`}
                >
                  <option value="">Sin vídeo</option>
                  {mediaFiles.filter(f => f.tipo === 'VIDEO').map(f => (
                    <option key={f.id_archivo} value={f.id_archivo}>{f.nombre_original}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Imagen de referencia <span className="text-xs font-normal text-gray-400">opcional</span>
              </label>
              <div className="relative">
                <select
                  value={form.id_imagen ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, id_imagen: e.target.value ? Number(e.target.value) : null }))}
                  className={`${selectClass} appearance-none pr-10`}
                >
                  <option value="">Sin imagen</option>
                  {mediaFiles.filter(f => f.tipo === 'IMAGEN').map(f => (
                    <option key={f.id_archivo} value={f.id_archivo}>{f.nombre_original}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        </div>

      ) : (

        /* ── MODO VISTA ───────────────────────────────────────── */
        <div className="flex flex-col">

          {/* Hero: icono + nombre + badges inline */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-[#1D7FD8] to-blue-700 flex items-center justify-center shadow-md">
              <Hash size={28} className="text-white" />
            </div>
            <div className="flex flex-col gap-2 pt-1 min-w-0">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{ejercicio.nombre}</h2>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {ejercicio.grupo_muscular && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#1D7FD8] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D7FD8]" />
                    {ejercicio.grupo_muscular}
                  </span>
                )}
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">
                  {ejercicio.equipamiento || 'Sin equipamiento'}
                </span>
                <span className="text-gray-300">·</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold ${ejercicio.archivado ? 'text-red-500' : 'text-green-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ejercicio.archivado ? 'bg-red-500' : 'bg-green-500'}`} />
                  {ejercicio.archivado ? 'Inactivo' : 'Activo'}
                </span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {ejercicio.descripcion && (
            <p className="text-sm text-gray-500 leading-relaxed mb-5">{ejercicio.descripcion}</p>
          )}

          <div className="border-t border-gray-100 mb-5" />

          {/* Demostración — vídeo */}
          {ejercicio.video && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Grid3X3 size={14} className="text-[#1D7FD8]" />
                <p className="text-xs font-bold text-gray-700 tracking-widest uppercase">Demostración</p>
              </div>
              <video
                controls
                src={`${MEDIA_BASE}/${ejercicio.video.nombre_archivo}`}
                className="w-full rounded-xl bg-black"
              />
            </div>
          )}

          {/* Imagen de referencia */}
          {ejercicio.imagen && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={14} className="text-green-600" />
                <p className="text-xs font-bold text-gray-700 tracking-widest uppercase">Imagen de referencia</p>
              </div>
              <img
                src={`${MEDIA_BASE}/${ejercicio.imagen.nombre_archivo}`}
                alt={ejercicio.imagen.nombre_original}
                className="w-full rounded-xl object-contain bg-gray-50 max-h-64"
              />
            </div>
          )}

          {/* Rutinas */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={14} className="text-[#1D7FD8]" />
              <p className="text-xs font-bold text-gray-700 tracking-widest uppercase">Rutinas que usan este ejercicio</p>
              {!loading && (
                <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {rutinas.length}
                </span>
              )}
            </div>

            {loading ? (
              <Spinner />
            ) : rutinas.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Este ejercicio no se usa en ninguna rutina activa
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {rutinas.map((r) => {
                  const nb = nivelBadge(r.nivel)
                  return (
                    <div key={r.id_rutina} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white">
                      <span className="text-sm font-semibold text-gray-800">{r.nombre}</span>
                      <div className="flex items-center gap-2">
                        {r.nivel && (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${nb.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${nb.dot}`} />
                            {r.nivel.charAt(0) + r.nivel.slice(1).toLowerCase()}
                          </span>
                        )}
                        {r.archivado && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                            Archivada
                          </span>
                        )}
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </Modal>
  )
}

export default ModalDetalleEjercicio
