import { useState } from 'react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'

const SEXO_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino'  },
  { value: 'O', label: 'Otro'      },
]

const emptyForm = {
  nombre: '', apellidos: '', email: '', telefono: '',
  sexo: '', peso_kg: '', altura_cm: '', porcentaje_grasa: '',
}

function ModalAnadirCliente({ isOpen, onClose, onSuccess }) {
  const [form,    setForm]    = useState(emptyForm)
  const [errors,  setErrors]  = useState({})
  const [success, setSuccess] = useState(false)

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function cerrar() { onClose(); setForm(emptyForm); setErrors({}); setSuccess(false) }

  function validate() {
    const e = {}
    if (!form.nombre.trim())    e.nombre    = 'El nombre es obligatorio'
    if (!form.apellidos.trim()) e.apellidos = 'Los apellidos son obligatorios'
    if (!form.email.trim())     e.email     = 'El correo es obligatorio'
    return e
  }

  function handleInvitar() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    // TODO: POST /api/v1/invitations cuando esté implementado
    onSuccess?.()
    setSuccess(true)
  }

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Añadir cliente">
      {success ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">✓</div>
          <p className="text-center text-gray-700 font-medium">Invitación enviada correctamente</p>
          <p className="text-center text-sm text-gray-400">
            El cliente recibirá un correo para completar su registro.
          </p>
          <Button onClick={cerrar}>Cerrar</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del cliente</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Input placeholder="Nombre del cliente" value={form.nombre}    onChange={(e) => setField('nombre',    e.target.value)} error={errors.nombre} />
                <Input placeholder="Apellidos"           value={form.apellidos} onChange={(e) => setField('apellidos', e.target.value)} error={errors.apellidos} />
              </div>
              <div className="flex gap-3">
                <Input type="email" placeholder="Correo electrónico" value={form.email}    onChange={(e) => setField('email',    e.target.value)} error={errors.email} />
                <Input type="tel"   placeholder="Número de teléfono" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos físicos del cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <Input type="select" placeholder="Sexo"                value={form.sexo}            onChange={(e) => setField('sexo',            e.target.value)} options={SEXO_OPTIONS} />
              <Input type="number" placeholder="Peso (kg)"           value={form.peso_kg}          onChange={(e) => setField('peso_kg',          e.target.value)} />
              <Input type="number" placeholder="Altura (cm)"         value={form.altura_cm}        onChange={(e) => setField('altura_cm',        e.target.value)} />
              <Input type="number" placeholder="Porcentaje de grasa" value={form.porcentaje_grasa} onChange={(e) => setField('porcentaje_grasa', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleInvitar}>Invitar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ModalAnadirCliente
