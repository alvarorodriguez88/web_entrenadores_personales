import SortableTable from './SortableTable'
import { formatShortDate } from '../../utils/date'

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-green-100 text-gray-600',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

function pctBadge(val) {
  if (val == null || val === 0) return 'bg-gray-100 text-gray-400'
  if (val >= 70) return 'bg-green-100 text-green-700'
  if (val >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

function rendimientoBadge(val) {
  if (val == null || val === 0) return 'bg-gray-100 text-gray-400'
  if (val >= 7) return 'bg-green-100 text-green-700'
  if (val >= 4) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

const columns = [
  {
    key: 'nombre',
    label: 'Cliente',
    width: '2fr',
    render: (_, row) => (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#1D7FD8] text-white font-semibold text-sm flex items-center justify-center shrink-0">
          {initials(row.nombre, row.apellidos)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {row.nombre} {row.apellidos}
          </p>
          {row.nivel && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NIVEL_BADGE[row.nivel] ?? 'bg-gray-100 text-gray-600'}`}>
              {row.nivel.charAt(0) + row.nivel.slice(1).toLowerCase()}
            </span>
          )}
        </div>
      </div>
    ),
    sortFn: (a, b, dir) => {
      const va = `${a.nombre ?? ''} ${a.apellidos ?? ''}`
      const vb = `${b.nombre ?? ''} ${b.apellidos ?? ''}`
      return dir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es')
    },
  },
  {
    key: 'cumplimiento_pct',
    label: 'Cumplimiento',
    render: v => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${pctBadge(v)}`}>
        {v != null && v > 0 ? `${v}%` : '—'}
      </span>
    ),
  },
  {
    key: 'conformidad_avg',
    label: 'Conformidad',
    render: v => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${pctBadge(v)}`}>
        {v != null && v > 0 ? `${Math.round(v)}%` : '—'}
      </span>
    ),
  },
  {
    key: 'rendimiento_avg',
    label: 'Rendimiento',
    render: v => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${rendimientoBadge(v)}`}>
        {v != null && v > 0 ? `${Number(v).toFixed(1)} / 10` : '—'}
      </span>
    ),
  },
  {
    key: 'ultima_sesion',
    label: 'Última sesión',
    render: v => (
      <span className="text-sm font-medium text-gray-600">{formatShortDate(v)}</span>
    ),
  },
]

function ClientStatsTable({ data = [], emptyMessage = 'No hay datos disponibles', title }) {
  return (
    <SortableTable
      data={data}
      columns={columns}
      title={title}
      searchFields={['nombre', 'apellidos']}
      searchPlaceholder="Buscar por nombre…"
      maxHeight="max-h-[560px]"
      emptyMessage={emptyMessage}
    />
  )
}

export default ClientStatsTable
