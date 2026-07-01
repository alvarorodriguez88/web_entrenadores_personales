import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import Button             from '../../components/shared/Button'
import SortableTable      from '../../components/shared/SortableTable'
import ModalAnadirCliente from '../../components/trainer/ModalAnadirCliente'
import { analyticsApi }   from '../../services/api'

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-green-100 text-green-700',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

const NIVEL_ORDER = { PRINCIPIANTE: 0, INTERMEDIO: 1, AVANZADO: 2 }

function initials(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const hoy = new Date()
  const dias = Math.floor((hoy - d) / 86400000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7)  return `Hace ${dias} días`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

const columns = [
  {
    key: 'nombre',
    label: 'Cliente',
    width: '2fr',
    render: v => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#1D7FD8] text-white text-sm font-bold flex items-center justify-center shrink-0">
          {initials(v)}
        </div>
        <span className="text-sm font-semibold text-gray-900 truncate">{v}</span>
      </div>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    render: v => <span className="text-sm text-gray-500 truncate block">{v}</span>,
  },
  {
    key: 'nivel',
    label: 'Nivel',
    render: v => {
      const cls = NIVEL_BADGE[(v ?? '').toUpperCase()]
      return cls
        ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{v}</span>
        : <span className="text-gray-300 text-sm">—</span>
    },
    sortFn: (a, b, dir) => {
      const va = NIVEL_ORDER[a.nivel] ?? -1
      const vb = NIVEL_ORDER[b.nivel] ?? -1
      return dir === 'asc' ? va - vb : vb - va
    },
  },
  {
    key: 'rutina_actual',
    label: 'Rutina actual',
    render: v => v
      ? <span className="text-sm text-gray-700 truncate block">{v}</span>
      : <span className="text-gray-300 text-sm">—</span>,
  },
  {
    key: 'ultima_actividad',
    label: 'Última actividad',
    render: v => <span className="text-sm text-gray-500">{fmtFecha(v)}</span>,
  },
]

function ClientesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [clientes,     setClientes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [modalAbierto, setModalAbierto] = useState(!!location.state?.openModal)

  async function cargarClientes() {
    setLoading(true)
    setError('')
    try {
      const data = await analyticsApi.getTrainerClientsList()
      setClientes(data)
    } catch (err) {
      setError(err.message || 'Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarClientes() }, [])

  const mapped = clientes.map(c => ({
    id:               c.id_cliente,
    nombre:           `${c.nombre} ${c.apellidos}`,
    email:            c.email,
    nivel:            c.nivel ?? null,
    rutina_actual:    c.rutina_activa ?? null,
    ultima_actividad: c.ultima_sesion ?? null,
  }))

  return (
    <div className="p-8 flex flex-col gap-6">

      <div>
        <h1 className="text-4xl font-black text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-400 mt-1">Gestiona tu cartera de entrenados, sus rutinas activas y su progreso.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 py-4">{error}</p>
      ) : mapped.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-300">
          <Users size={36} />
          <p className="text-sm">No hay clientes registrados</p>
        </div>
      ) : (
        <SortableTable
          data={mapped}
          columns={columns}
          title="Tabla de clientes"
          searchFields={[
            { key: 'nombre',        placeholder: 'Nombre' },
            { key: 'email',         placeholder: 'Email' },
            { key: 'nivel',         placeholder: 'Nivel' },
            { key: 'rutina_actual', placeholder: 'Rutina' },
          ]}
          maxHeight="max-h-[505px]"
          emptyMessage="No hay clientes registrados"
          onRowClick={row => navigate(`/trainer/clients/${row.id}`)}
          action={
            <Button onClick={() => setModalAbierto(true)}>
              <Plus size={15} />Añadir cliente
            </Button>
          }
        />
      )}

      <ModalAnadirCliente
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSuccess={cargarClientes}
      />

    </div>
  )
}

export default ClientesPage
