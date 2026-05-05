import { useState, useEffect } from 'react'
import { Film, Image as ImageIcon, Grid3X3, HardDrive, Calendar, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import { MEDIA_BASE } from '../../services/api'

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ModalDetalleMultimedia({ isOpen, onClose, archivo, onEliminar }) {
  const [previewError, setPreviewError] = useState(false)

  useEffect(() => { setPreviewError(false) }, [archivo?.nombre_archivo])

  if (!archivo) return null

  const mediaUrl = `${MEDIA_BASE}/${archivo.nombre_archivo}`
  const esVideo  = archivo.tipo === 'VIDEO'
  const Icon     = esVideo ? Film : ImageIcon

  const titleNode = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon size={20} className={esVideo ? 'text-[#1D7FD8]' : 'text-green-600'} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detalle del archivo</p>
        <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{archivo.nombre_original}</p>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleNode} maxWidth="max-w-2xl">
      <div className="flex flex-col">

        {/* Preview */}
        <div className="rounded-2xl overflow-hidden bg-gray-950 flex items-center justify-center min-h-48">
          {previewError ? (
            <div className="flex flex-col items-center gap-2 py-16 text-gray-500">
              <Icon size={40} />
              <p className="text-sm">Preview no disponible</p>
            </div>
          ) : esVideo ? (
            <video
              controls
              src={mediaUrl}
              className="w-full max-h-80 rounded-2xl"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={archivo.nombre_original}
              className="w-full max-h-80 object-contain rounded-2xl"
              onError={() => setPreviewError(true)}
            />
          )}
        </div>

        {/* Nombre del archivo */}
        <p className="mt-4 font-bold text-gray-900 text-base break-all">{archivo.nombre_original}</p>

        {/* Metadatos */}
        <div className="grid grid-cols-3 gap-3 mt-4 border border-gray-100 rounded-2xl p-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Grid3X3 size={11} /> Tipo
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <span className={`w-2 h-2 rounded-full ${esVideo ? 'bg-[#1D7FD8]' : 'bg-green-500'}`} />
              {esVideo ? 'Video' : 'Imagen'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <HardDrive size={11} /> Tamaño
            </span>
            <span className="text-sm font-semibold text-gray-800">{formatBytes(archivo.tamano_bytes)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Calendar size={11} /> Subido el
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {new Date(archivo.fecha_subida).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Botón eliminar */}
        <button
          onClick={() => onEliminar(archivo)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
        >
          <Trash2 size={16} /> Eliminar archivo
        </button>

      </div>
    </Modal>
  )
}

export default ModalDetalleMultimedia
