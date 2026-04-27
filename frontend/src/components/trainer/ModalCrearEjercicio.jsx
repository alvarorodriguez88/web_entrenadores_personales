import { useState } from 'react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'
import { exercisesApi } from '../../services/api'

const emptyForm = { nombre: '', descripcion: '', grupo_muscular: '', equipamiento: '', video_url: '' }

function ModalCrearEjercicio({ isOpen, onClose, onSuccess }) {
  const [form,   setForm]   = useState(emptyForm)
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

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
        video_url:      form.video_url      || null,
      })
      onSuccess?.()
      cerrar()
    } catch (err) {
      setError(err.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

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
          <Input placeholder="URL del vídeo / imagen" value={form.video_url} onChange={(e) => setField('video_url', e.target.value)} />
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
