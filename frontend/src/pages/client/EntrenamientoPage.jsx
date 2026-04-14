import { useState, useEffect } from 'react'
import { Play, Video } from 'lucide-react'
import Card   from '../../components/shared/Card'
import Button from '../../components/shared/Button'
import Modal  from '../../components/shared/Modal'
import { assignmentsApi } from '../../services/api'

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
  const [asignacion,      setAsignacion]      = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [ejercicioActivo, setEjercicioActivo] = useState(null)

  useEffect(() => {
    async function cargarAsignacion() {
      setLoading(true)
      setError('')
      try {
        const data = await assignmentsApi.getMyAssignments()
        const activa = data.find((a) => a.estado === 'ACTIVA') ?? null
        setAsignacion(activa)
      } catch (err) {
        setError(err.message || 'Error al cargar la asignación')
      } finally {
        setLoading(false)
      }
    }
    cargarAsignacion()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* ── Título ── */}
      <h1 className="text-3xl font-black text-gray-900">Entrenamiento</h1>

      {asignacion === null ? (
        <Card>
          <p className="text-sm text-gray-400 text-center py-4">
            No tienes ninguna rutina asignada actualmente
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-start justify-between gap-6">

              {/* Info rutina */}
              {/* TODO: el backend no expone nombre/nivel/objetivo de la rutina al cliente.
                        Considerar añadir un endpoint GET /assignments/me/{id}/routine
                        o incluir datos de rutina en AssignmentResponse. */}
              <div className="flex flex-col gap-3 flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  Rutina #{asignacion.id_rutina}
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-gray-600">
                  <span>
                    <span className="text-gray-400">Fecha de inicio  </span>
                    {asignacion.fecha_inicio
                      ? new Date(asignacion.fecha_inicio).toLocaleDateString('es-ES')
                      : '—'}
                  </span>
                  <span>
                    <span className="text-gray-400">Fecha de fin  </span>
                    {asignacion.fecha_fin
                      ? new Date(asignacion.fecha_fin).toLocaleDateString('es-ES')
                      : '—'}
                  </span>
                  {asignacion.notas && (
                    <span className="col-span-2">
                      <span className="text-gray-400">Notas  </span>
                      {asignacion.notas}
                    </span>
                  )}
                </div>
              </div>

              {/* Progreso + Botón */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">
                    {/* TODO: calcular progreso real desde sesiones completadas */}
                    Progreso: <span className="text-gray-800 font-bold">0%</span>
                  </span>
                  <div className="w-36 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1D7FD8] rounded-full" style={{ width: '0%' }} />
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

            {/* TODO: GET /assignments/me/{id}/sessions — cargar ejercicios del bloque del día activo */}
            <Card>
              <p className="text-sm text-gray-400 text-center py-4">
                Selecciona un día para ver los ejercicios
              </p>
            </Card>
          </section>
        </>
      )}

      {/* ── Modal detalle ejercicio ── */}
      <Modal
        isOpen={!!ejercicioActivo}
        onClose={() => setEjercicioActivo(null)}
        title={ejercicioActivo?.nombre ?? ''}
      >
        {ejercicioActivo && (
          <div className="flex flex-col gap-5">

            <div className="flex gap-5">
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

              <div className="w-44 h-28 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400 shrink-0 border border-gray-200">
                <Video size={24} strokeWidth={1.5} />
                <span className="text-xs">Vídeo explicativo</span>
              </div>
            </div>

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
