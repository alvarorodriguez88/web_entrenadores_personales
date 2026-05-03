export const DIA_CONFIG = {
  1: { abrev: 'Lu', nombre: 'Lunes',     color: '#1D7FD8', bg: '#EFF6FF', border: '#BFDBFE' },
  2: { abrev: 'Ma', nombre: 'Martes',    color: '#16a34a', bg: '#F0FDF4', border: '#BBF7D0' },
  3: { abrev: 'Mi', nombre: 'Miércoles', color: '#ea580c', bg: '#FFF7ED', border: '#FED7AA' },
  4: { abrev: 'Ju', nombre: 'Jueves',    color: '#7c3aed', bg: '#F5F3FF', border: '#DDD6FE' },
  5: { abrev: 'Vi', nombre: 'Viernes',   color: '#0891b2', bg: '#ECFEFF', border: '#A5F3FC' },
  6: { abrev: 'Sá', nombre: 'Sábado',    color: '#db2777', bg: '#FDF2F8', border: '#FBCFE8' },
  7: { abrev: 'Do', nombre: 'Domingo',   color: '#64748b', bg: '#F8FAFC', border: '#E2E8F0' },
}

export const OBJETIVO_OPTIONS = [
  { value: 'Hipertrofia',     label: 'Hipertrofia'     },
  { value: 'Fuerza',          label: 'Fuerza'          },
  { value: 'Pérdida de peso', label: 'Pérdida de peso' },
  { value: 'Resistencia',     label: 'Resistencia'     },
  { value: 'Flexibilidad',    label: 'Flexibilidad'    },
  { value: 'Mantenimiento',   label: 'Mantenimiento'   },
]

export const NIVEL_OPTIONS = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
]

export const NIVEL_CLS = {
  PRINCIPIANTE: 'bg-green-50 text-green-700',
  INTERMEDIO:   'bg-yellow-50 text-yellow-700',
  AVANZADO:     'bg-blue-50 text-blue-700',
}

export const NIVEL_ICON = {
  PRINCIPIANTE: { bg: '#f0fdf4', color: '#16a34a' },
  INTERMEDIO:   { bg: '#fefce8', color: '#ca8a04' },
  AVANZADO:     { bg: '#eff6ff', color: '#1D7FD8' },
}

export const inputCls = `
  w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800
  placeholder:text-gray-400 outline-none transition-colors
  focus:border-[#1D7FD8] focus:ring-1 focus:ring-[#1D7FD8]/20
`

export const numInputCls = `
  w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 text-center
  outline-none focus:border-[#1D7FD8] transition-colors
  [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
`

export const newEjercicio = () => ({
  id_ejercicio: '',
  series_plan:  3,
  reps_plan:    10,
  peso_obj:     '',
  descanso_seg: '',
})
