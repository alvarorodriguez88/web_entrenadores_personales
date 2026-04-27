import { formatDateTime } from '../../utils/date'

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

const NIVEL_BADGE = {
  PRINCIPIANTE: 'bg-gray-100 text-gray-600',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

function cumplimientoColor(pct) {
  if (pct == null) return { bar: '#d1d5db', badge: 'bg-gray-100 text-gray-500' }
  if (pct >= 70)   return { bar: '#34d399',  badge: 'bg-green-100 text-green-700' }
  if (pct >= 40)   return { bar: '#fbbf24',  badge: 'bg-yellow-100 text-yellow-700' }
  return              { bar: '#f87171',  badge: 'bg-red-100 text-red-600' }
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
        const { bar, badge } = cumplimientoColor(row.cumplimiento_pct)
        const nivelClass = NIVEL_BADGE[row.nivel] ?? 'bg-gray-100 text-gray-600'

        return (
          <li key={i} className="flex items-center gap-4 py-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1D7FD8] font-semibold text-sm flex items-center justify-center shrink-0">
              {initials(row.nombre, row.apellidos)}
            </div>

            {/* Nombre + métricas */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-gray-900">
                  {row.nombre} {row.apellidos}
                </span>
                {row.nivel && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${nivelClass}`}>
                    {row.nivel.charAt(0) + row.nivel.slice(1).toLowerCase()}
                  </span>
                )}
              </div>

              {/* Barra de cumplimiento */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-24 shrink-0">Cumplimiento</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(row.cumplimiento_pct ?? 0, 100)}%`, backgroundColor: bar }}
                  />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${badge}`}>
                  {row.cumplimiento_pct != null ? `${row.cumplimiento_pct}%` : '—'}
                </span>
              </div>
            </div>

            {/* Rendimiento + última sesión */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {row.rendimiento_avg != null && (
                <span className="text-xs font-bold bg-blue-50 text-[#1D7FD8] px-2.5 py-1 rounded-lg">
                  RPE {Number(row.rendimiento_avg).toFixed(1)}
                </span>
              )}
              {row.ultima_sesion && (
                <span className="text-xs text-gray-400">
                  {formatDateTime(row.ultima_sesion)}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ClientStatsTable
