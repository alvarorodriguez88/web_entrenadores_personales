import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Card   from '../../components/shared/Card'
import Button from '../../components/shared/Button'

// TODO: sustituir por GET /api/v1/assignments/me/sessions — sesiones completadas esta semana
const diasEntrenadosMock = [0, 1] // índices 0=Lun … 6=Dom de la semana actual

// TODO: sustituir por métricas reales del cliente (sesiones, carga, cumplimiento)
const metricasMock = [
  { label: 'Sesiones esta semana', value: '2 / 4' },
  { label: 'Carga total (kg)',      value: '3.240' },
  { label: 'Cumplimiento',          value: '85%'   },
]

// TODO: sustituir por GET /api/v1/assignments/me — asignación activa
const rutinaHoyMock = {
  nombre: 'Fuerza — Tren superior',
  info:   'Día 3 de 4 · 6 ejercicios · ~60 min',
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getWeekDays() {
  const today = new Date()
  const dow   = today.getDay()                        // 0=Dom, 1=Lun …
  const diff  = dow === 0 ? -6 : 1 - dow             // desplazamiento al lunes
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)

  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      label,
      numero:  d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    }
  })
}

function InicioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const weekDays = getWeekDays()
  const todayIdx = weekDays.findIndex((d) => d.isToday)

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* ── Saludo ── */}
      <h1 className="text-3xl font-black text-gray-900">
        Hola, {user?.nombre}
      </h1>

      {/* ── Tu progreso ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tu progreso</h2>
          <span className="text-xs font-semibold text-[#1D7FD8] bg-blue-50 px-3 py-1 rounded-full">
            Semana
          </span>
        </div>

        <Card>
          {/* Calendario semanal */}
          <div className="flex gap-2 mb-5">
            {weekDays.map((day, i) => {
              const trained = diasEntrenadosMock.includes(i)
              const isToday = day.isToday

              const cls = [
                'flex flex-col items-center gap-1 flex-1 py-2.5 rounded-xl',
                trained
                  ? 'bg-[#1D7FD8] text-white'
                  : isToday
                    ? 'bg-white border-2 border-[#1D7FD8] text-[#1D7FD8]'
                    : 'bg-gray-100 text-gray-500',
              ].join(' ')

              return (
                <div key={day.label} className={cls}>
                  <span className="text-xs font-medium">{day.label}</span>
                  <span className="text-base font-bold leading-none">{day.numero}</span>
                </div>
              )
            })}
          </div>

          {/* Métricas separadas por divisores */}
          <div className="flex divide-x divide-gray-200">
            {metricasMock.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 px-4 py-2">
                <p className="text-xl font-bold text-gray-800">{m.value}</p>
                <p className="text-xs text-gray-500 text-center leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Tu entrenamiento de hoy ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">Tu entrenamiento de hoy</h2>

        {/* TODO: reemplazar rutinaHoyMock con GET /api/v1/assignments/me */}
        <Card>
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-2 flex-1">
              <p className="font-bold text-gray-900 text-lg leading-tight">
                {rutinaHoyMock.nombre}
              </p>
              <span className="self-start text-sm text-[#1D7FD8] bg-blue-50 px-3 py-1 rounded-lg">
                {rutinaHoyMock.info}
              </span>
            </div>
            <Button onClick={() => navigate('/client/exercises')}>
              Comenzar entreno
            </Button>
          </div>
        </Card>
      </section>

      {/* ── Estado general + Esta semana ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* TODO: sustituir por datos reales de rendimiento semanal */}
        <Card title="Estado general">
          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-gray-800">Buen rendimiento</p>
            <p className="text-sm text-gray-500">
              Mejoraste un 12% en relación a la semana pasada
            </p>
          </div>
        </Card>

        {/* TODO: sustituir por GET /api/v1/assignments/me — planning semanal */}
        <Card title="Esta semana">
          <div className="flex flex-col gap-2">
            {DAY_LABELS.map((label, i) => {
              const trained = diasEntrenadosMock.includes(i)
              const isToday = i === todayIdx

              return (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className="w-7 text-gray-500 shrink-0">{label}</span>
                  <span className={`flex-1 text-xs px-2 py-0.5 rounded-full text-center ${
                    trained
                      ? 'bg-green-100 text-green-700'
                      : isToday
                        ? 'bg-blue-50 text-[#1D7FD8]'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {trained ? 'Completado' : isToday ? 'Hoy' : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

      </div>

    </div>
  )
}

export default InicioPage
