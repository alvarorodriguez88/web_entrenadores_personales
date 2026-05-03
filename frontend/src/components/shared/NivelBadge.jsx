import { NIVEL_CLS } from '../../utils/rutinas'
import { nivelLabel } from '../../utils/format'

export default function NivelBadge({ nivel }) {
  if (!nivel) return null
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NIVEL_CLS[nivel] ?? 'bg-gray-100 text-gray-500'}`}>
      {nivelLabel(nivel)}
    </span>
  )
}
