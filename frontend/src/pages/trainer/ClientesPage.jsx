import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users } from 'lucide-react'
import Table              from '../../components/shared/Table'
import Button             from '../../components/shared/Button'
import Input              from '../../components/shared/Input'
import ModalAnadirCliente from '../../components/trainer/ModalAnadirCliente'
import { analyticsApi }   from '../../services/api'

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-green-100 text-green-700',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

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

const columnasClientes = [
  {
    key: 'nombre',
    label: 'Cliente',
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1D7FD8] text-xs font-bold
                        flex items-center justify-center shrink-0">
          {initials(v)}
        </div>
        <span className="font-medium text-gray-900">{v}</span>
      </div>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    render: (v) => <span className="text-gray-500 text-sm">{v}</span>,
  },
  {
    key: 'nivel',
    label: 'Nivel',
    render: (v) => {
      const cls = NIVEL_BADGE[(v ?? '').toUpperCase()]
      return cls
        ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{v}</span>
        : <span className="text-gray-300">—</span>
    },
  },
  {
    key: 'rutina_actual',
    label: 'Rutina actual',
    render: (v) => v
      ? <span className="text-gray-800 text-sm font-medium">{v}</span>
      : <span className="text-gray-300">—</span>,
  },
  {
    key: 'ultima_actividad',
    label: 'Última actividad',
    render: (v) => <span className="text-gray-500 text-sm">{fmtFecha(v)}</span>,
  },
]

function ClientesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [clientes,     setClientes]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroGrupo,  setFiltroGrupo]  = useState('')
  const [modalAbierto, setModalAbierto] = useState(!!location.state?.openModal)

  useEffect(() => {
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
    cargarClientes()
  }, [])

  const filas = clientes
    .map((c) => ({
      id:               c.id_cliente,
      nombre:           `${c.nombre} ${c.apellidos}`,
      email:            c.email,
      nivel:            c.nivel ?? null,
      rutina_actual:    c.rutina_activa ?? null,
      ultima_actividad: c.ultima_sesion,
    }))
    .filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="p-8 flex flex-col gap-6">

      <h1 className="text-3xl font-black text-gray-900">Clientes</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <Input placeholder="Nombre" value={busqueda}    onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-44">
          <Input placeholder="Grupo" value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} />
        </div>
        <Button onClick={() => setModalAbierto(true)}>Añadir cliente</Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-gray-700">Tabla de clientes</p>
          {!loading && !error && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {filas.length}
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 py-4">{error}</p>
        ) : filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-300">
            <Users size={36} />
            <p className="text-sm">No hay clientes registrados</p>
          </div>
        ) : (
          <Table
            columns={columnasClientes}
            data={filas}
            onRowClick={(row) => navigate(`/trainer/clients/${row.id}`)}
          />
        )}
      </div>

      <ModalAnadirCliente
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />

    </div>
  )
}

export default ClientesPage
