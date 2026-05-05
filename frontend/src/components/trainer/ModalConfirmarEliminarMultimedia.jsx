import Modal  from '../shared/Modal'
import Button from '../shared/Button'

function ModalConfirmarEliminarMultimedia({ isOpen, onClose, item, usage, onConfirm }) {
  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar archivo">
      <div className="flex flex-col gap-4">
        {usage?.total > 0 ? (
          <>
            <p className="text-sm text-gray-600">
              Este archivo se usa en <span className="font-semibold">{usage.total}</span> ejercicio(s):
            </p>
            <ul className="text-sm text-gray-500 list-disc pl-5 flex flex-col gap-1">
              {usage.ejercicios.map((ej) => <li key={ej}>{ej}</li>)}
            </ul>
            <p className="text-sm text-gray-600">
              Si lo eliminas, esos ejercicios perderán la referencia al archivo.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            ¿Eliminar <span className="font-semibold">"{item.nombre_original}"</span>? Esta acción no se puede deshacer.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalConfirmarEliminarMultimedia
