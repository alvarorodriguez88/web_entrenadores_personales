import { useState } from 'react'
import { Play, X, Video } from 'lucide-react'
import Card   from '../../components/shared/Card'
import Button from '../../components/shared/Button'
import Modal  from '../../components/shared/Modal'

// TODO: sustituir por GET /api/v1/assignments/me — asignación activa del cliente
const rutinaMock = {
  nombre:            'Fuerza — Tren superior',
  duracion_estimada: '60 min',
  objetivo:          'Hipertrofia',
  nivel:             'Intermedio',
  fecha_asignacion:  '01/04/2026',
  progreso:          0,   // porcentaje completado (0–100)
}

// TODO: sustituir por los bloqueRutinaEjercicio de la asignación activa
const ejerciciosMock = [
  {
    id: 1,
    nombre:         'Press de banca',
    grupo_muscular: 'Pecho',
    series:         4,
    repeticiones:   10,
    descripcion:    'Tumbado en el banco, agarra la barra con agarre prono a la anchura de los hombros. Baja la barra de forma controlada hasta rozar el pecho y empuja hasta extender los brazos.',
    video_url:      null, // TODO: enlace al vídeo del ejercicio
  },
  {
    id: 2,
    nombre:         'Remo con mancuerna',
    grupo_muscular: 'Espalda',
    series:         4,
    repeticiones:   12,
    descripcion:    'Apoya una rodilla y una mano en el banco. Con la otra mano tira de la mancuerna hacia la cadera, manteniendo la espalda recta y el codo pegado al cuerpo.',
    video_url:      null,
  },
  {
    id: 3,
    nombre:         'Press militar',
    grupo_muscular: 'Hombros',
    series:         3,
    repeticiones:   10,
    descripcion:    'De pie o sentado, empuja la barra o mancuernas desde los hombros hacia arriba hasta extender los brazos. Evita arquear la zona lumbar.',
    video_url:      null,
  },
  {
    id: 4,
    nombre:         'Curl de bíceps',
    grupo_muscular: 'Bíceps',
    series:         3,
    repeticiones:   12,
    descripcion:    'De pie con los brazos extendidos, flexiona los codos llevando las mancuernas hacia los hombros. Mantén los codos pegados al cuerpo durante todo el movimiento.',
    video_url:      null,
  },
  {
    id: 5,
    nombre:         'Fondos en paralelas',
    grupo_muscular: 'Tríceps',
    series:         3,
    repeticiones:   12,
    descripcion:    'Apoyado en las barras paralelas, baja el cuerpo doblando los codos hasta que formen 90°. Empuja hacia arriba hasta extender los brazos completamente.',
    video_url:      null,
  },
  {
    id: 6,
    nombre:         'Face pull',
    grupo_muscular: 'Hombros / Manguito',
    series:         3,
    repeticiones:   15,
    descripcion:    'Con polea alta, tira de la cuerda hacia la cara separando ambos extremos a la altura de las orejas. Mantén los codos elevados y el core activo.',
    video_url:      null,
  },
]

function EjercicioCard({ ejercicio, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-blue-50 rounded-2xl p-4 flex flex-col gap-2 hover:bg-blue-100 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
    >
      <p className="font-bold text-gray-900 text-sm leading-tight">{ejercicio.nombre}</p>
      <p className="text-xs text-gray-500">{ejercicio.grupo_muscular}</p>
      <p className="text-xs text-[#1D7FD8] font-medium">
        {ejercicio.series} series × {ejercicio.repeticiones} repeticiones
      </p>
    </button>
  )
}

function EntrenamientoPage() {
  const [ejercicioActivo, setEjercicioActivo] = useState(null)

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* ── Título ── */}
      <h1 className="text-3xl font-black text-gray-900">Entrenamiento</h1>

      {/* ── Rutina activa ── */}
      {/* TODO: reemplazar rutinaMock con GET /api/v1/assignments/me */}
      <Card>
        <div className="flex items-start justify-between gap-6">

          {/* Info rutina */}
          <div className="flex flex-col gap-3 flex-1">
            <p className="font-bold text-gray-900 text-lg">{rutinaMock.nombre}</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-gray-600">
              <span><span className="text-gray-400">Duración estimada  </span>{rutinaMock.duracion_estimada}</span>
              <span><span className="text-gray-400">Objetivo  </span>{rutinaMock.objetivo}</span>
              <span><span className="text-gray-400">Nivel de intensidad  </span>{rutinaMock.nivel}</span>
              <span><span className="text-gray-400">Fecha asignación  </span>{rutinaMock.fecha_asignacion}</span>
            </div>
          </div>

          {/* Progreso + Botón */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs text-gray-500 font-medium">
                Progreso: <span className="text-gray-800 font-bold">{rutinaMock.progreso}%</span>
              </span>
              <div className="w-36 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1D7FD8] rounded-full transition-all"
                  style={{ width: `${rutinaMock.progreso}%` }}
                />
              </div>
            </div>
            {/* TODO: navegar a la sesión activa al pulsar Comenzar */}
            <Button>
              <Play size={14} strokeWidth={2} />
              Comenzar
            </Button>
          </div>

        </div>
      </Card>

      {/* ── Ejercicios ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">Ejercicios</h2>

        {/* TODO: reemplazar ejerciciosMock con ejercicios del bloque activo de la asignación */}
        <div className="grid grid-cols-3 gap-4">
          {ejerciciosMock.map((ej) => (
            <EjercicioCard
              key={ej.id}
              ejercicio={ej}
              onClick={() => setEjercicioActivo(ej)}
            />
          ))}
        </div>
      </section>

      {/* ── Modal detalle ejercicio ── */}
      <Modal
        isOpen={!!ejercicioActivo}
        onClose={() => setEjercicioActivo(null)}
        title={ejercicioActivo?.nombre ?? ''}
      >
        {ejercicioActivo && (
          <div className="flex flex-col gap-5">

            {/* Nombre + meta + vídeo */}
            <div className="flex gap-5">

              {/* Info */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Grupo muscular</p>
                  <p className="text-sm font-medium text-gray-800">{ejercicioActivo.grupo_muscular}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Series × Repeticiones</p>
                  <p className="text-sm font-medium text-[#1D7FD8]">
                    {ejercicioActivo.series} series × {ejercicioActivo.repeticiones} reps
                  </p>
                </div>
              </div>

              {/* Vídeo placeholder */}
              {/* TODO: mostrar <video> o <iframe> cuando video_url esté disponible */}
              <div className="w-44 h-28 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400 shrink-0 border border-gray-200">
                <Video size={24} strokeWidth={1.5} />
                <span className="text-xs">Vídeo explicativo</span>
              </div>

            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-700">Descripción</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 leading-relaxed">
                {ejercicioActivo.descripcion}
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  )
}

export default EntrenamientoPage
