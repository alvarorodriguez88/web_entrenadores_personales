import { useState, useEffect } from 'react'
import { X, ArrowRight, BookOpen } from 'lucide-react'
import { routinesApi } from '../../services/api'
import { NIVEL_ICON } from '../../utils/rutinas'
import Spinner    from '../shared/Spinner'
import NivelBadge from '../shared/NivelBadge'

export default function ModalSeleccionarRutina({
  isOpen,
  onClose,
  clienteNombre,
  onSelect,
}) {
  const [rutinas,      setRutinas]      = useState([])
  const [bloquesCounts, setBloquesCounts] = useState({})
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setRutinas([])
    setBloquesCounts({})
    cargarRutinas()
  }, [isOpen])

  async function cargarRutinas() {
    setLoading(true)
    try {
      const data  = await routinesApi.getRoutines()
      const lista = Array.isArray(data) ? data.filter(r => !r.archivado) : []
      setRutinas(lista)

      const counts = {}
      await Promise.all(lista.map(async r => {
        try {
          const bloques = await routinesApi.getBlocks(r.id_rutina)
          counts[r.id_rutina] = Array.isArray(bloques) ? bloques.length : 0
        } catch {
          counts[r.id_rutina] = 0
        }
      }))
      setBloquesCounts(counts)
    } catch {
      setRutinas([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900">Seleccionar rutina</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Para asignar a{' '}
              <span className="font-semibold text-gray-600">{clienteNombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2">
          {loading ? <Spinner /> : rutinas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No hay rutinas disponibles</p>
          ) : (
            rutinas.map(r => {
              const nivelIcon  = NIVEL_ICON[r.nivel] ?? { bg: '#F3F4F6', color: '#6B7280' }
              const diasSemana = bloquesCounts[r.id_rutina]

              return (
                <button
                  key={r.id_rutina}
                  onClick={() => onSelect(r)}
                  className="w-full text-left flex items-center gap-4 px-4 py-3.5 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: nivelIcon.bg }}
                  >
                    <BookOpen size={18} style={{ color: nivelIcon.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{r.nombre}</span>
                      <NivelBadge nivel={r.nivel} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.objetivo ?? '—'}
                      {diasSemana != null && diasSemana > 0 && (
                        <> · {diasSemana} {diasSemana === 1 ? 'día' : 'días'}/semana</>
                      )}
                    </p>
                  </div>

                  <ArrowRight size={16} className="text-gray-300 group-hover:text-[#1D7FD8] transition-colors shrink-0" />
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  )
}
