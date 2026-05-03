import { useState, useEffect } from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'
import { exercisesApi } from '../../services/api'
import Spinner    from '../shared/Spinner'
import NivelBadge from '../shared/NivelBadge'

function ModalDetalleEjercicio({ isOpen, onClose, ejercicio, onSuccess }) {
  const [rutinas,  setRutinas]  = useState([])
  const [loading,  setLoading]  = useState(false)

  const [editando, setEditando] = useState(false)
  const [form,     setForm]     = useState({})
  const [saving,   setSaving]   = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
      nombre:          ejercicio.nombre          ?? '',
      descripcion:     ejercicio.descripcion     ?? '',
      grupo_muscular:  ejercicio.grupo_muscular  ?? '',
      equipamiento:    ejercicio.equipamiento    ?? '',
      video_url:       ejercicio.video_url       ?? '',
    })
    setErrorMsg('')
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setErrorMsg('')
  }

  async function guardarCambios() {
    if (!form.nombre.trim()) { setErrorMsg('El nombre es obligatorio'); return }
    setSaving(true)
    setErrorMsg('')
    try {
      await exercisesApi.updateExercise(ejercicio.id_ejercicio, form)
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (!ejercicio) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? 'Editar ejercicio' : 'Detalle del ejercicio'}
    >
      {editando ? (
        <div className="flex flex-col gap-5">

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del ejercicio</p>
            <Input
              label="Nombre"
              placeholder="Nombre del ejercicio"
              value={form.nombre}
              onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Grupo muscular"
                  placeholder="Ej. Pierna, Espalda…"
                  value={form.grupo_muscular}
                  onChange={(e) => setForm(p => ({ ...p, grupo_muscular: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Equipamiento"
                  placeholder="Ej. Mancuernas, Barra…"
                  value={form.equipamiento}
                  onChange={(e) => setForm(p => ({ ...p, equipamiento: e.target.value }))}
                />
              </div>
            </div>
            <Input
              type="textarea"
              label="Descripción"
              placeholder="Descripción del ejercicio"
              value={form.descripcion}
              onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contenido multimedia</p>
            <Input
              label="URL del vídeo / imagen"
              placeholder="https://…"
              value={form.video_url}
              onChange={(e) => setForm(p => ({ ...p, video_url: e.target.value }))}
            />
          </div>

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={cancelarEdicion} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={guardarCambios} loading={saving}>
              Guardar cambios
            </Button>
          </div>

        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* Cabecera del ejercicio */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-900">{ejercicio.nombre}</h3>
              {ejercicio.archivado && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  Inactivo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {ejercicio.grupo_muscular && (
                <span className="inline-flex px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1D7FD8] text-xs font-medium">
                  {ejercicio.grupo_muscular}
                </span>
              )}
              {ejercicio.equipamiento && (
                <span className="inline-flex px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                  {ejercicio.equipamiento}
                </span>
              )}
            </div>

            {ejercicio.descripcion && (
              <p className="text-sm text-gray-500 leading-relaxed">{ejercicio.descripcion}</p>
            )}

            {ejercicio.video_url && (
              <a
                href={ejercicio.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D7FD8] hover:underline"
              >
                <ExternalLink size={13} />
                Ver vídeo de referencia
              </a>
            )}
          </div>

          {/* Rutinas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Rutinas que usan este ejercicio
            </p>

            {loading ? (
              <Spinner />
            ) : rutinas.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Este ejercicio no se usa en ninguna rutina activa
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {rutinas.map((r) => (
                  <div key={r.id_rutina} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-medium text-gray-800">{r.nombre}</span>
                    <div className="flex items-center gap-1.5">
                      {r.nivel && <NivelBadge nivel={r.nivel} />}
                      {r.archivado && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          Archivada
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end pt-1">
            <Button variant="secondary" onClick={abrirEdicion}>
              <Pencil size={14} />
              Editar
            </Button>
          </div>

        </div>
      )}
    </Modal>
  )
}

export default ModalDetalleEjercicio
