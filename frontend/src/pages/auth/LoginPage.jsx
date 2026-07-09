import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi, usersApi } from '../../services/api'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import loginImg from '../../assets/login.jpg'
import logo from '../../assets/logo.svg'

async function fetchProfile() {
  try {
    const data = await usersApi.getTrainerProfile()
    return { id: data.user.id_usuario, nombre: data.user.nombre, role: 'trainer' }
  } catch {}

  try {
    const data = await usersApi.getClientProfile()
    return { id: data.user.id_usuario, nombre: data.user.nombre, role: 'client' }
  } catch {}

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
      const { access_token } = await authApi.login(email, password)

      localStorage.setItem('user', JSON.stringify({ access_token }))

      const { nombre, role } = await fetchProfile()

      login({ nombre, role, access_token })
      navigate(role === 'trainer' ? '/trainer/inicio' : '/client/inicio')

    } catch {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* Imagen izquierda */}
      <div className="hidden md:block w-1/2 h-full">
        <img src={loginImg} alt="" className="block w-full h-full object-cover" />
      </div>

      <div className="w-full md:w-1/2 h-full flex items-center justify-center px-10 py-12 bg-white">
        <div className="w-full max-w-sm">

          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden cursor-pointer"
            >
              <img src={logo} alt="Volcán Fitness" className="w-full h-full object-cover" />
            </button>
          </div>

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-24">
            ¡Nos alegra verte de nuevo!
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

            <div className="mt-2">
              <Button type="submit" size="lg" variant="primaryDark" fullWidth loading={loading}>
                Iniciar sesión
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-12">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-[#4C6EF5] underline hover:text-[#3b5bdb]"
            >
              Regístrate
            </button>
          </p>

        </div>
      </div>

    </div>
  )
}

export default LoginPage
