import { useNavigate } from 'react-router-dom'
import Button from '../../components/shared/Button'
import logo from '../../assets/logo.svg'
import landingImg from '../../assets/landing.jpg'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Enlace discreto para registro de entrenadores */}
      <div className="absolute top-3 right-4 z-10">
        <button
          onClick={() => navigate('/register')}
          className="text-xs text-white/60 hover:text-white/90 transition-colors"
        >
          ¿Eres entrenador? Crear cuenta
        </button>
      </div>

      {/* Hero — imagen de fondo */}
      <div className="relative h-80 sm:h-96 overflow-visible">
        <img src={landingImg} alt="" className="absolute inset-0 w-full h-full object-cover" />

        {/* Logo circular centrado, sobresale sobre el hero */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2
                        w-36 h-36 rounded-full bg-white
                        flex items-center justify-center
                        ring-4 ring-white shadow-lg overflow-hidden">
          <img src={logo} alt="Volcán Fitness" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col items-center gap-8 pt-28 pb-16 px-6">

        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight text-center">
          Volcán Fitness
        </h1>

        <div className="flex gap-4">
          <Button size="lg" variant="primaryDark" onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
        </div>

      </div>

    </div>
  )
}

export default LandingPage
