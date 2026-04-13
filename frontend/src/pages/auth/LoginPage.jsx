import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'

const API_BASE = 'http://localhost:8080/api/v1'

async function fetchProfile(token) {
  const headers = { Authorization: `Bearer ${token}` }

  const trainerRes = await fetch(`${API_BASE}/users/trainers/me`, { headers })
  if (trainerRes.ok) {
    const data = await trainerRes.json()
    return { nombre: data.user.nombre, role: 'trainer' }
  }

  const clientRes = await fetch(`${API_BASE}/users/clients/me`, { headers })
  if (clientRes.ok) {
    const data = await clientRes.json()
    return { nombre: data.user.nombre, role: 'client' }
  }

  throw new Error('No se pudo determinar el rol del usuario')
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Credenciales incorrectas')
        return
      }

      const { access_token } = await res.json()
      const { nombre, role } = await fetchProfile(access_token)

      login({ nombre, role, access_token })
      navigate(role === 'trainer' ? '/trainer/inicio' : '/client/inicio')

    } catch {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Imagen izquierda — ocupa toda la altura */}
      <div className="hidden md:block w-1/2 bg-gradient-to-br from-gray-600 to-gray-800">
        {/* TODO: reemplazar el gradiente por una imagen real:
            <img src={heroImg} alt="" className="w-full h-full object-cover" /> */}
      </div>

      {/* Formulario derecha */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-10 py-12 bg-white">
        <div className="w-full max-w-sm">

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-8">
            ¡Nos alegra verte<br />de nuevo!
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex justify-end mt-2">
              <Button type="submit" loading={loading}>
                Iniciar sesión
              </Button>
            </div>
          </form>

        </div>
      </div>

    </div>
  )
}

export default LoginPage
