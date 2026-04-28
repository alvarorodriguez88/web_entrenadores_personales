import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import Modal from '../shared/Modal'
import { exercisesApi } from '../../services/api'

const NIVEL_COLOR = {
  PRINCIPIANTE: 'bg-green-100 text-green-700',
  INTERMEDIO:   'bg-blue-100 text-[#1D7FD8]',
  AVANZADO:     'bg-purple-100 text-purple-700',
}

function nivelBadge(nivel) {
  return NIVEL_COLOR[(nivel ?? '').toUpperCase()] ?? 'bg-gray-100 text-gray-500'
}

function ModalDetalleEjercicio({ isOpen, onClose, ejercicio }) {
  const [rutinas,  setRutinas]  = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!isOpen || !ejercicio) return
    setRutinas([])
    setLoading(true)
    exercisesApi.getExerciseRoutines(ejercicio.id_ejercicio)
      .then(setRutinas)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, ejercicio?.id_ejercicio])

  if (!ejercicio) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del ejercicio">
      <div className="flex flex-col gap-5">

        {/* Cabecera del ejercicio */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900">{ejercicio.nombre}</h3>
            {ejercicio.archivado && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                Inactivo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {ejercicio.grupo_muscular && (
              <span className="inline-flex px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1D7FD8] text-xs font-medium">
                {ejercicio.grupo_muscular}
              </span>
            )}
            {ejercicio.equipamiento && (
              <span className="inline-flex px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                {ejercicio.equipamiento}
              </span>
            )}
          </div>

          {ejercicio.descripcion && (
            <p className="text-sm text-gray-500 leading-relaxed">{ejercicio.descripcion}</p>
          )}

          {ejercicio.video_url && (
            <a
              href={ejercicio.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D7FD8] hover:underline"
            >
              <ExternalLink size={13} />
              Ver vídeo de referencia
            </a>
          )}
        </div>

        {/* Rutinas */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Rutinas que usan este ejercicio
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <span className="w-5 h-5 border-2 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rutinas.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Este ejercicio no se usa en ninguna rutina activa
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {rutinas.map((r) => (
                <div key={r.id_rutina} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium text-gray-800">{r.nombre}</span>
                  <div className="flex items-center gap-1.5">
                    {r.nivel && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${nivelBadge(r.nivel)}`}>
                        {r.nivel.charAt(0) + r.nivel.slice(1).toLowerCase()}
                      </span>
                    )}
                    {r.archivado && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        Archivada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}

export default ModalDetalleEjercicio
