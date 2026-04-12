import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import TrainerLayout from './layouts/TrainerLayout'
import ClientLayout from './layouts/ClientLayout'

import LandingPage from './pages/auth/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import ClientHomePage from './pages/client/InicioPage'
import ClientDashboardPage from './pages/client/DashboardPage'
import ExercisesPage from './pages/client/EntrenamientoPage'

import TrainerHomePage from './pages/trainer/InicioPage'
import TrainerDashboardPage from './pages/trainer/DashboardPage'
import ContentPage from './pages/trainer/ContenidoPage'
import ClientsPage from './pages/trainer/ClientesPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/client/inicio"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientLayout>
                  <ClientHomePage />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientLayout>
                  <ClientDashboardPage />
                </ClientLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/exercises"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientLayout>
                  <ExercisesPage />
                </ClientLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trainer/inicio"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerLayout>
                  <TrainerHomePage />
                </TrainerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerLayout>
                  <TrainerDashboardPage />
                </TrainerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/content"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerLayout>
                  <ContentPage />
                </TrainerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/clients"
            element={
              <ProtectedRoute requiredRole="trainer">
                <TrainerLayout>
                  <ClientsPage />
                </TrainerLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
