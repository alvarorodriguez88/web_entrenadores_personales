
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../PageTitle'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  function simularLoginEntrenador() {
    login({ nombre: 'Álvaro', role: 'trainer' })
    navigate('/trainer/inicio')
  }

  function simularLoginCliente() {
    login({ nombre: 'Carlos', role: 'client' })
    navigate('/client/inicio')
  }

  return (
    <div>
        <PageTitle title="Login" section="Auth" />
        <h1>Login temporal</h1>
        <button onClick={simularLoginEntrenador}>
          Entrar como entrenador
        </button>
        <button onClick={simularLoginCliente}>
          Entrar como cliente
        </button>
    </div>
    )
}

export default LoginPage
