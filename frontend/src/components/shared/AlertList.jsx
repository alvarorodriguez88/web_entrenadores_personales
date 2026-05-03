const ALERTA_LABELS = {
  INACTIVIDAD:       'Sin actividad reciente',
  BAJO_RENDIMIENTO:  'Bajo rendimiento',
  BAJO_CUMPLIMIENTO: 'Bajo cumplimiento',
  FALTA_DE_PROGRESO: 'Sin progreso',
}

function alertaLabel(tipo) {
  return ALERTA_LABELS[tipo] ?? 'Requiere atención'
}

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

function AlertList({ alertas = [], emptyMessage = 'No hay alertas' }) {
  if (alertas.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">{emptyMessage}</p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-100">
      {alertas.map((a, i) => (
        <li key={i} className="flex items-center gap-3 py-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1D7FD8] font-semibold text-sm flex items-center justify-center shrink-0">
            {initials(a.nombre, a.apellidos)}
          </div>
          <span className="flex-1 text-sm font-semibold text-gray-800">
            {a.nombre} {a.apellidos}
          </span>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full shrink-0">
            {alertaLabel(a.tipo_alerta)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default AlertList
