import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import Modal  from './Modal'
import Input  from './Input'
import Button from './Button'
import { authApi } from '../../services/api'

function ModalCambiarContrasena({ isOpen, onClose }) {
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [contrasenaNueva,  setContrasenaNueva]  = useState('')
  const [confirmarNueva,   setConfirmarNueva]   = useState('')
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [exito,   setExito]   = useState(false)

  function cerrar() {
    setContrasenaActual('')
    setContrasenaNueva('')
    setConfirmarNueva('')
    setError('')
    setSaving(false)
    setExito(false)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!contrasenaActual || !contrasenaNueva || !confirmarNueva)
      return setError('Completa todos los campos.')
    if (contrasenaNueva !== confirmarNueva)
      return setError('Las contraseñas nuevas no coinciden.')
    setSaving(true)
    setError('')
    try {
      await authApi.changePassword(contrasenaActual, contrasenaNueva)
      setExito(true)
    } catch (err) {
      setError(err.message || 'Contraseña actual incorrecta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Ajustes">
      {exito ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle size={40} className="text-green-500" />
          <p className="text-sm font-medium text-gray-700">Contraseña actualizada correctamente</p>
          <Button onClick={cerrar}>Cerrar</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <Input
            label="Contraseña actual"
            type="password"
            value={contrasenaActual}
            onChange={e => setContrasenaActual(e.target.value)}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={contrasenaNueva}
            onChange={e => setContrasenaNueva(e.target.value)}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmarNueva}
            onChange={e => setConfirmarNueva(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={cerrar}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ModalCambiarContrasena
