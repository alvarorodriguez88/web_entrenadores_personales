import { avatarColor, initials } from '../../utils/format'

export default function AvatarCircle({ nombre = '', apellidos = '', size = 'md' }) {
  const ac  = avatarColor(nombre, apellidos)
  const ini = initials(nombre, apellidos)
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: ac.bg, color: ac.color }}
    >
      {ini}
    </div>
  )
}
