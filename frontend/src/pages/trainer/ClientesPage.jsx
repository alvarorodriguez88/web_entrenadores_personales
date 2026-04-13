import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table  from '../../components/shared/Table'
import Modal  from '../../components/shared/Modal'
import Button from '../../components/shared/Button'
import Input  from '../../components/shared/Input'

const SEXO_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino'  },
  { value: 'O', label: 'Otro'      },
]

const columnasClientes = [
  { key: 'nombre',           label: 'Cliente'           },
  { key: 'objetivo',         label: 'Objetivo'          },
  { key: 'rutina_actual',    label: 'Rutina actual'      },
  { key: 'cumplimiento',     label: 'Cumplimiento'       },
  { key: 'ultima_actividad', label: 'Última actividad'   },
  { key: 'estado',           label: 'Estado'             },
]

// TODO: sustituir por GET /api/v1/users/clients (cuando exista endpoint de lista)
const clientesMock = [
  { id: 1, nombre: 'Carlos García',   objetivo: 'Hipertrofia',     rutina_actual: 'Fuerza 4 días',  cumplimiento: '85%', ultima_actividad: 'Hace 1 día',   estado: 'Activo' },
  { id: 2, nombre: 'Laura Martínez',  objetivo: 'Pérdida de peso', rutina_actual: 'Cardio + Tono',  cumplimiento: '45%', ultima_actividad: 'Hace 5 días',  estado: 'Alerta' },
  { id: 3, nombre: 'Pedro Gómez',     objetivo: 'Rendimiento',     rutina_actual: 'Full Body Avanz',cumplimiento: '30%', ultima_actividad: 'Hace 8 días',  estado: 'Alerta' },
]

const emptyForm = { nombre: '', apellidos: '', email: '', telefono: '', sexo: '', peso_kg: '', altura_cm: '', porcentaje_grasa: '' }

function ClientesPage() {
  const navigate = useNavigate()

  const [busqueda,  setBusqueda]  = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form,    setForm]    = useState(emptyForm)
  const [errors,  setErrors]  = useState({})
  const [success, setSuccess] = useState(false)

  const filtrados = clientesMock.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function cerrar() { setModalAbierto(false); setForm(emptyForm); setErrors({}); setSuccess(false) }

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
    // TODO: cuando exista el sistema de invitaciones, llamar a POST /api/v1/invitations
    setSuccess(true)
  }

  return (
    <div className="p-8 flex flex-col gap-6">

      <h1 className="text-3xl font-black text-gray-900">Clientes</h1>

      {/* Buscador + botón */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <Input placeholder="Nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-44">
          <Input placeholder="Grupo" value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} />
        </div>
        <Button onClick={() => setModalAbierto(true)}>Añadir cliente</Button>
      </div>

      {/* Tabla */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Tabla de clientes</p>
        <Table
          columns={columnasClientes}
          data={filtrados}
          emptyMessage="No se encontraron clientes"
          onRowClick={(row) => navigate(`/trainer/clients/${row.id}`)}
        />
      </div>

      {/* Modal añadir cliente */}
      <Modal isOpen={modalAbierto} onClose={cerrar} title="Añadir cliente">
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
            {/* Datos personales */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del cliente</p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Input placeholder="Nombre del cliente" value={form.nombre}    onChange={(e) => setField('nombre',    e.target.value)} error={errors.nombre} />
                  <Input placeholder="Apellidos"           value={form.apellidos} onChange={(e) => setField('apellidos', e.target.value)} error={errors.apellidos} />
                </div>
                <div className="flex gap-3">
                  <Input type="email"  placeholder="Correo electrónico" value={form.email}    onChange={(e) => setField('email',    e.target.value)} error={errors.email} />
                  <Input type="tel"    placeholder="Número de teléfono" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Datos físicos */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos físicos del cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <Input type="select" placeholder="Sexo"                value={form.sexo}             onChange={(e) => setField('sexo',             e.target.value)} options={SEXO_OPTIONS} />
                <Input type="number" placeholder="Peso (kg)"           value={form.peso_kg}           onChange={(e) => setField('peso_kg',           e.target.value)} />
                <Input type="number" placeholder="Altura (cm)"         value={form.altura_cm}         onChange={(e) => setField('altura_cm',         e.target.value)} />
                <Input type="number" placeholder="Porcentaje de grasa" value={form.porcentaje_grasa}  onChange={(e) => setField('porcentaje_grasa',  e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleInvitar}>Invitar</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}

export default ClientesPage
