import { useState, useEffect } from 'react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'
import { exercisesApi, multimediaApi } from '../../services/api'

const emptyForm = { nombre: '', descripcion: '', grupo_muscular: '', equipamiento: '', id_video: null, id_imagen: null }

const selectClass = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1D7FD8] transition-colors'

function ModalCrearEjercicio({ isOpen, onClose, onSuccess }) {
  const [form,       setForm]       = useState(emptyForm)
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [mediaFiles, setMediaFiles] = useState([])

  useEffect(() => {
    if (!isOpen) return
    multimediaApi.getFiles().then(setMediaFiles).catch(() => {})
  }, [isOpen])

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function cerrar() { onClose(); setForm(emptyForm); setError('') }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setSaving(true)
    try {
      await exercisesApi.createExercise({
        nombre:         form.nombre,
        descripcion:    form.descripcion    || '',
        grupo_muscular: form.grupo_muscular || null,
        equipamiento:   form.equipamiento   || null,
        id_video:       form.id_video       ?? null,
        id_imagen:      form.id_imagen      ?? null,
      })
      onSuccess?.()
      cerrar()
    } catch (err) {
      setError(err.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const videos   = mediaFiles.filter(f => f.tipo === 'VIDEO')
  const imagenes = mediaFiles.filter(f => f.tipo === 'IMAGEN')

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Crear ejercicio">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del ejercicio</p>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Nombre del ejercicio"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              error={error && !form.nombre.trim() ? error : ''}
            />
            <div className="flex gap-3">
              <Input placeholder="Grupo muscular" value={form.grupo_muscular} onChange={(e) => setField('grupo_muscular', e.target.value)} />
              <Input placeholder="Equipamiento"   value={form.equipamiento}   onChange={(e) => setField('equipamiento',   e.target.value)} />
            </div>
            <Input type="textarea" placeholder="Descripción" value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contenido multimedia</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vídeo de referencia</label>
              <select
                value={form.id_video ?? ''}
                onChange={(e) => setField('id_video', e.target.value ? Number(e.target.value) : null)}
                className={selectClass}
              >
                <option value="">Sin vídeo</option>
                {videos.map(f => (
                  <option key={f.id_archivo} value={f.id_archivo}>{f.nombre_original}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Imagen de referencia</label>
              <select
                value={form.id_imagen ?? ''}
                onChange={(e) => setField('id_imagen', e.target.value ? Number(e.target.value) : null)}
                className={selectClass}
              >
                <option value="">Sin imagen</option>
                {imagenes.map(f => (
                  <option key={f.id_archivo} value={f.id_archivo}>{f.nombre_original}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {error && form.nombre.trim() && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={cerrar}>Cancelar</Button>
          <Button loading={saving} onClick={handleGuardar}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalCrearEjercicio
