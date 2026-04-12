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

function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre]           = useState('')
  const [apellidos, setApellidos]     = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [terms, setTerms]             = useState(false)
  const [errors, setErrors]           = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)

  function validate() {
    const next = {}
    if (!nombre.trim())     next.nombre     = 'El nombre es obligatorio'
    if (!apellidos.trim())  next.apellidos  = 'Los apellidos son obligatorios'
    if (!email.trim())      next.email      = 'El correo es obligatorio'
    if (!password)          next.password   = 'La contraseña es obligatoria'
    if (password.length > 0 && password.length < 8)
                            next.password   = 'Mínimo 8 caracteres'
    if (password !== confirmPwd)
                            next.confirmPwd = 'Las contraseñas no coinciden'
    if (!terms)             next.terms      = 'Debes aceptar los términos'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nombre,
          apellidos,
          rol: 'ENTRENADOR',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setServerError(data.detail || 'Error al crear la cuenta')
        return
      }

      const { access_token } = await res.json()
      const { nombre: nombrePerfil, role } = await fetchProfile(access_token)

      login({ nombre: nombrePerfil, role, access_token })
      navigate('/trainer/inicio')

    } catch {
      setServerError('Error al conectar con el servidor. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Formulario izquierda */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-10 py-12 bg-white">
        <div className="w-full max-w-sm">

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-8">
            ¡Hagamos algo<br />grande!
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nombre y apellidos en fila */}
            <div className="flex gap-3">
              <Input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                error={errors.nombre}
                disabled={loading}
              />
              <Input
                placeholder="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                error={errors.apellidos}
                disabled={loading}
              />
            </div>

            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={loading}
            />

            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
            />

            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              error={errors.confirmPwd}
              disabled={loading}
            />

            <Input
              type="textarea"
              placeholder="¿Por qué quieres crearte la cuenta?"
              value={''}
              onChange={() => {}}
              disabled={loading}
            />

            {/* Checkbox términos */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                disabled={loading}
                className="mt-0.5 accent-[#1D7FD8]"
              />
              <span className="text-sm text-gray-600">
                Acepto los términos y condiciones
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-500 -mt-2">{errors.terms}</p>
            )}

            {serverError && (
              <p className="text-sm text-red-500">{serverError}</p>
            )}

            <div className="flex justify-end mt-2">
              <Button type="submit" loading={loading}>
                Crear cuenta
              </Button>
            </div>

          </form>
        </div>
      </div>

      {/* Imagen derecha */}
      <div className="hidden md:block w-1/2 bg-gradient-to-br from-gray-600 to-gray-800">
        {/* TODO: reemplazar el gradiente por una imagen real:
            <img src={heroImg} alt="" className="w-full h-full object-cover" /> */}
      </div>

    </div>
  )
}

export default RegisterPage
