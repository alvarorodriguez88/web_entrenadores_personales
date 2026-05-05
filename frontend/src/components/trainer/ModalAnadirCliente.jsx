import { useState } from 'react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'
import { usersApi } from '../../services/api'

const NIVEL_OPTIONS = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
]

const OBJETIVO_OPTIONS = [
  { value: 'PERDER_PESO',         label: 'Perder peso'          },
  { value: 'GANAR_MASA',          label: 'Ganar masa muscular'  },
  { value: 'MEJORAR_RESISTENCIA', label: 'Mejorar resistencia'  },
  { value: 'MEJORAR_FUERZA',      label: 'Mejorar fuerza'       },
  { value: 'MANTENIMIENTO',       label: 'Mantenimiento'        },
]

const emptyForm = {
  nombre: '', apellidos: '', email: '', password: '',
  nivel: '', objetivo: '',
  peso_kg: '', altura_cm: '', grasa_pct: '',
}

function ModalAnadirCliente({ isOpen, onClose, onSuccess }) {
  const [form,    setForm]    = useState(emptyForm)
  const [errors,  setErrors]  = useState({})
  const [success, setSuccess] = useState(false)
  const [saving,  setSaving]  = useState(false)

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function cerrar() { onClose(); setForm(emptyForm); setErrors({}); setSuccess(false) }

  function validate() {
    const e = {}
    if (!form.nombre.trim())    e.nombre    = 'El nombre es obligatorio'
    if (!form.apellidos.trim()) e.apellidos = 'Los apellidos son obligatorios'
    if (!form.email.trim())     e.email     = 'El correo es obligatorio'
    if (!form.password.trim())  e.password  = 'La contraseña es obligatoria'
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  async function handleCrear() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      await usersApi.createClient({
        nombre:    form.nombre,
        apellidos: form.apellidos,
        email:     form.email,
        password:  form.password,
        nivel:     form.nivel    || null,
        objetivo:  form.objetivo || null,
        peso_kg:   form.peso_kg   ? Number(form.peso_kg)   : null,
        altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
        grasa_pct: form.grasa_pct ? Number(form.grasa_pct) : null,
      })
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setErrors({ general: err.message || 'Error al crear el cliente' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Añadir cliente">
      {success ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">✓</div>
          <p className="text-center text-gray-700 font-medium">Cliente dado de alta correctamente</p>
          <p className="text-center text-sm text-gray-400">
            Ya puede iniciar sesión con su email y la contraseña temporal que le has asignado.
          </p>
          <Button onClick={cerrar}>Cerrar</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del cliente</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Input placeholder="Nombre" value={form.nombre}    onChange={(e) => setField('nombre',    e.target.value)} error={errors.nombre} />
                <Input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setField('apellidos', e.target.value)} error={errors.apellidos} />
              </div>
              <Input type="email" placeholder="Correo electrónico" value={form.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} />
              <Input type="password" placeholder="Contraseña temporal (mín. 6 caracteres)" value={form.password} onChange={(e) => setField('password', e.target.value)} error={errors.password} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Perfil deportivo</p>
            <div className="flex gap-3">
              <Input type="select" placeholder="Nivel" value={form.nivel} onChange={(e) => setField('nivel', e.target.value)} options={NIVEL_OPTIONS} />
              <Input type="select" placeholder="Objetivo" value={form.objetivo} onChange={(e) => setField('objetivo', e.target.value)} options={OBJETIVO_OPTIONS} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos físicos <span className="font-normal normal-case text-gray-400">(opcionales)</span></p>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" placeholder="Peso (kg)"    value={form.peso_kg}   onChange={(e) => setField('peso_kg',   e.target.value)} />
              <Input type="number" placeholder="Altura (cm)"  value={form.altura_cm} onChange={(e) => setField('altura_cm', e.target.value)} />
              <Input type="number" placeholder="% Grasa"      value={form.grasa_pct} onChange={(e) => setField('grasa_pct', e.target.value)} />
            </div>
          </div>

          {errors.general && (
            <p className="text-sm text-red-500">{errors.general}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleCrear} disabled={saving}>
              {saving ? 'Creando…' : 'Crear cliente'}
            </Button>
          </div>

        </div>
      )}
    </Modal>
  )
}

export default ModalAnadirCliente
