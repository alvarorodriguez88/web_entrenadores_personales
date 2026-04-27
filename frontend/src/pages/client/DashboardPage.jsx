import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import Card           from '../../components/shared/Card'
import Button         from '../../components/shared/Button'
import EvolucionChart from '../../components/shared/EvolucionChart'
import DonutChart     from '../../components/shared/DonutChart'
import { metricsApi, analyticsApi, usersApi } from '../../services/api'

const OBJETIVO_CONFIG = {
  PERDER_PESO:         { unit: 'kg', color: '#f59e0b' },
  GANAR_MASA:          { unit: 'kg', color: '#34d399' },
  MEJORAR_FUERZA:      { unit: 'kg', color: '#a78bfa' },
  MEJORAR_RESISTENCIA: { unit: 'kg', color: '#1D7FD8' },
  MANTENIMIENTO:       { unit: 'kg', color: '#6b7280' },
}
const DEFAULT_CONFIG = { unit: 'kg', color: '#f97316' }

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  fontSize: '12px',
}

function DashboardPage() {
  const [loadingEv,      setLoadingEv]      = useState(false)
  const [periodo,        setPeriodo]        = useState('semanal')
  const [evolucion,      setEvolucion]      = useState([])
  const [metricas,       setMetricas]       = useState([])
  const [distEjercicios, setDistEjercicios] = useState([])
  const [clientProfile,  setClientProfile]  = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [metricsData, distData, profileData] = await Promise.all([
          metricsApi.getMyMetrics(),
          analyticsApi.getClientExerciseDistribution(),
          usersApi.getClientProfile(),
        ])
        setMetricas(metricsData)
        setDistEjercicios(distData?.categorias ?? [])
        setClientProfile(profileData)
      } catch (err) {
        setError(err.message || 'Error al cargar las métricas')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  useEffect(() => {
    async function cargarEvolucion() {
      setLoadingEv(true)
      try {
        const data = await analyticsApi.getClientEvolution(periodo)
        const serie = Array.isArray(data)
          ? data
          : (data?.puntos ?? data?.serie ?? data?.historico ?? data?.items ?? [])
        setEvolucion(serie)
      } catch {
        setEvolucion([])
      } finally {
        setLoadingEv(false)
      }
    }
    cargarEvolucion()
  }, [periodo])

  // ── Evolución individual ──────────────────────────────────────────
  const mejorPunto = evolucion.length > 0
    ? evolucion.reduce((best, p) => p.conformidad > best.conformidad ? p : best)
    : null
  const mejorFechaLabel = mejorPunto?.fecha
    ? mejorPunto.fecha.split('-').slice(1).reverse().join('/')
    : null

  // ── Tipo de ejercicios ────────────────────────────────────────────
  const totalEjercicios = distEjercicios.reduce((s, c) => s + c.cantidad, 0)
  const topCategoria    = distEjercicios[0] ?? null
  const donutData       = distEjercicios.map((c) => ({ name: c.categoria, value: c.porcentaje }))
  const donutHighlight  = topCategoria
    ? <><span className="font-bold">{topCategoria.categoria}</span> es tu categoría principal con un {topCategoria.porcentaje}% del total</>
    : null

  // ── Evolución del peso ────────────────────────────────────────────
  const chartConfig = OBJETIVO_CONFIG[clientProfile?.objetivo] ?? DEFAULT_CONFIG

  const pesoData = [...metricas]
    .sort((a, b) => (a.fecha_registro ?? a.fecha) > (b.fecha_registro ?? b.fecha) ? 1 : -1)
    .filter((m) => m.peso_kg != null)
    .map((m) => {
      const d = new Date(m.fecha_registro ?? m.fecha)
      return {
        fecha: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        peso:  m.peso_kg,
        _ms:   d.getTime(),
      }
    })

  const pesoActual  = pesoData.at(-1)?.peso ?? null
  const pesoInicial = pesoData[0]?.peso ?? null

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-8">

      <h1 className="text-4xl font-black text-gray-900">Mi progreso</h1>

      {/* ── Evolución individual ── */}
      <Card
        title="Evolución individual"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPeriodo((p) => (p === 'semanal' ? 'mensual' : 'semanal'))}
          >
            {periodo === 'semanal' ? 'Semana' : 'Mes'}
          </Button>
        }
      >
        {mejorPunto && (
          <p className="text-sm text-[#1D7FD8] mb-3">
            Tu mejor semana fue la del {mejorFechaLabel} · Conformidad: {mejorPunto.conformidad}%
          </p>
        )}
        {loadingEv ? (
          <div className="h-72 flex items-center justify-center">
            <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : evolucion.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Sin datos de evolución para este periodo
          </p>
        ) : (
          <EvolucionChart
            data={evolucion}
            highlightFecha={mejorPunto?.fecha}
            highlightConformidad={mejorPunto?.conformidad}
            height={280}
          />
        )}
      </Card>

      {/* ── Tipo de ejercicios + Evolución del peso ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* ── Tipo de ejercicios ── */}
        <Card title="Tipo de ejercicios">
          <DonutChart
            data={donutData}
            subtitle={`Últimas 8 semanas · ${totalEjercicios} ejercicios totales`}
            highlightText={donutHighlight}
            emptyMessage="Completa al menos una sesión para ver la distribución"
          />
        </Card>

        {/* ── Evolución del peso ── */}
        <Card title="Evolución del peso">
          {pesoData.length > 0 ? (
            <>
              {pesoActual != null && (
                <p className="text-sm text-gray-400 mb-3">
                  Peso actual: <strong className="text-gray-700">{pesoActual} kg</strong>
                </p>
              )}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pesoData} margin={{ top: 4, right: 48, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      unit=" kg"
                    />
                    <Tooltip
                      formatter={(v) => [`${v} kg`, 'Peso']}
                      contentStyle={tooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke={chartConfig.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: chartConfig.color, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                    {pesoData.length > 0 && pesoActual != null && (
                      <ReferenceDot
                        x={pesoData.at(-1).fecha}
                        y={pesoActual}
                        r={0}
                        label={{
                          value: `${pesoActual} kg`,
                          position: 'right',
                          fill: chartConfig.color,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">
              Sin registros de peso disponibles
            </p>
          )}
        </Card>

      </div>

    </div>
  )
}

export default DashboardPage
