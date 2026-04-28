import { formatShortDate } from '../../utils/date'

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-gray-100 text-gray-600',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

// Cumplimiento y conformidad: porcentaje 0-100
function pctBadge(val) {
  if (val == null || val === 0) return 'bg-gray-100 text-gray-400'
  if (val >= 70) return 'bg-green-100 text-green-700'
  if (val >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

// Rendimiento: nota 0-10
function rendimientoBadge(val) {
  if (val == null || val === 0) return 'bg-gray-100 text-gray-400'
  if (val >= 7) return 'bg-green-100 text-green-700'
  if (val >= 4) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

function ClientStatsTable({ data = [], emptyMessage = 'No hay datos disponibles' }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-12 text-center">{emptyMessage}</p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-100">
      {data.map((row, i) => {
        const nivelClass = NIVEL_BADGE[row.nivel] ?? 'bg-gray-100 text-gray-600'

        return (
          <li key={i} className="flex items-center gap-4 py-4">

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1D7FD8] font-semibold text-sm flex items-center justify-center shrink-0">
              {initials(row.nombre, row.apellidos)}
            </div>

            {/* Nombre + nivel */}
            <div className="shrink-0 w-82 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {row.nombre} {row.apellidos} {row.nivel && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${nivelClass}`}>
                  {row.nivel.charAt(0) + row.nivel.slice(1).toLowerCase()}
                </span>
              )}
              </p>
            </div>

            {/* Tres métricas */}
            <div className="flex-1 grid grid-cols-3 gap-1">

              {/* Cumplimiento */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Cumplimiento</span>
                <span className={`self-start text-xs font-bold px-2 py-0.5 rounded-md ${pctBadge(row.cumplimiento_pct)}`}>
                  {row.cumplimiento_pct != null && row.cumplimiento_pct > 0 ? `${row.cumplimiento_pct}%` : '—'}
                </span>
              </div>

              {/* Conformidad */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Conformidad</span>
                <span className={`self-start text-xs font-bold px-2 py-0.5 rounded-md ${pctBadge(row.conformidad_avg)}`}>
                  {row.conformidad_avg != null && row.conformidad_avg > 0 ? `${Math.round(row.conformidad_avg)}%` : '—'}
                </span>
              </div>

              {/* Rendimiento */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Rendimiento</span>
                <span className={`self-start text-xs font-bold px-2 py-0.5 rounded-md ${rendimientoBadge(row.rendimiento_avg)}`}>
                  {row.rendimiento_avg != null && row.rendimiento_avg > 0 ? `${Number(row.rendimiento_avg).toFixed(1)} / 10` : '—'}
                </span>
              </div>

            </div>

            {/* Última sesión */}
            <div className="flex flex-col items-end shrink-0 w-20">
              <span className="text-xs text-gray-400">Última sesión</span>
              <span className="text-sm font-medium text-gray-600">
                {formatShortDate(row.ultima_sesion)}
              </span>
            </div>

          </li>
        )
      })}
    </ul>
  )
}

export default ClientStatsTable
