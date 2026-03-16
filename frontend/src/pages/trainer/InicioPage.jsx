import { useNavigate } from 'react-router-dom'
import PageTitle from '../PageTitle'

function HomePage() {

  const navigate = useNavigate()

  function navegarADashboard() {
    navigate('/trainer/dashboard')
  }
    

  return (
    <>
    
    <PageTitle title="Inicio Trainer" section="Trainer" />
    
    <button onClick={navegarADashboard}>
      Ir a Dashboard
    </button>
    
    </>
  )

}

export default HomePage
