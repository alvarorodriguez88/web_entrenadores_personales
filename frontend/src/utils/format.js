export const AVATAR_COLORS = [
  { bg: '#EFF6FF', color: '#1D7FD8' },
  { bg: '#F0FDF4', color: '#16a34a' },
  { bg: '#FFF7ED', color: '#ea580c' },
  { bg: '#F5F3FF', color: '#7c3aed' },
  { bg: '#FDF2F8', color: '#db2777' },
  { bg: '#ECFEFF', color: '#0891b2' },
]

export function avatarColor(nombre = '', apellidos = '') {
  const str = `${nombre}${apellidos}`
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export function initials(nombre = '', apellidos = '') {
  return `${nombre[0] ?? ''}${apellidos[0] ?? ''}`.toUpperCase()
}

export function nivelLabel(nivel = '') {
  return nivel.charAt(0) + nivel.slice(1).toLowerCase()
}
