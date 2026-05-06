import { X } from 'lucide-react'

function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-lg', titleClassName }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className={titleClassName ?? 'text-lg font-semibold text-gray-800'}>{title}</div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido con scroll si es necesario */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>

        {/* Footer fijo fuera del scroll */}
        {footer && (
          <div className="border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
