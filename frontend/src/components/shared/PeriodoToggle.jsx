const OPCIONES = [
  { value: 'semanal', label: 'Semana' },
  { value: 'mensual', label: 'Mes'    },
]

function PeriodoToggle({ value, onChange }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
      {OPCIONES.map((op) => (
        <button
          key={op.value}
          onClick={() => onChange(op.value)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
            ${value === op.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'}`}
        >
          {op.label}
        </button>
      ))}
    </div>
  )
}

export default PeriodoToggle
