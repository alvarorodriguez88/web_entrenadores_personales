import { useState, useEffect } from 'react'
import Card                   from '../../components/shared/Card'
import Button                 from '../../components/shared/Button'
import EvolucionChart         from '../../components/shared/EvolucionChart'
import DonutChart             from '../../components/shared/DonutChart'
import MetricasEvolucionChart from '../../components/shared/MetricasEvolucionChart'
import { metricsApi, analyticsApi, usersApi } from '../../services/api'

const OBJETIVO_METRICA_CONFIG = {
  PERDER_PESO:         { titulo: 'Pérdida de peso',     mostrar: ['peso', 'grasa'] },
  GANAR_MASA:          { titulo: 'Ganancia muscular',   mostrar: ['peso', 'grasa'] },
  MEJORAR_FUERZA:      { titulo: 'Seguimiento de peso', mostrar: ['peso']          },
  MEJORAR_RESISTENCIA: { titulo: 'Seguimiento de peso', mostrar: ['peso']          },
  MANTENIMIENTO:       { titulo: 'Control de peso',     mostrar: ['peso']          },
}
const DEFAULT_METRICA_CONFIG = { titulo: 'Composición corporal', mostrar: ['peso', 'grasa'] }

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

  // ── Composición corporal ─────────────────────────────────────────
  const metricasOrdenadas = [...metricas]
    .sort((a, b) => (a.fecha_registro ?? a.fecha) > (b.fecha_registro ?? b.fecha) ? 1 : -1)

  const metricasChartData = metricasOrdenadas.map((m) => {
    const d = new Date(m.fecha_registro ?? m.fecha)
    return {
      fecha: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      peso:  m.peso_kg  != null ? Number(m.peso_kg)  : null,
      grasa: m.grasa_pct != null ? Number(m.grasa_pct) : null,
    }
  })

  const ultimaMetrica  = metricasOrdenadas.at(-1) ?? null
  const metricaConfig  = OBJETIVO_METRICA_CONFIG[clientProfile?.objetivo] ?? DEFAULT_METRICA_CONFIG

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

        {/* ── Métrica por objetivo ── */}
        <Card title={metricaConfig.titulo}>
          {ultimaMetrica != null && (
            <p className="text-sm text-gray-400 mb-3">
              {metricaConfig.mostrar.includes('peso') && ultimaMetrica.peso_kg != null && (
                <>Peso: <strong className="text-gray-700">{ultimaMetrica.peso_kg} kg</strong></>
              )}
              {metricaConfig.mostrar.includes('peso') && metricaConfig.mostrar.includes('grasa') &&
               ultimaMetrica.peso_kg != null && ultimaMetrica.grasa_pct != null && (
                <span className="mx-2">·</span>
              )}
              {metricaConfig.mostrar.includes('grasa') && ultimaMetrica.grasa_pct != null && (
                <>Grasa: <strong className="text-gray-700">{ultimaMetrica.grasa_pct}%</strong></>
              )}
            </p>
          )}
          <MetricasEvolucionChart data={metricasChartData} height={224} mostrar={metricaConfig.mostrar} />
        </Card>

      </div>

    </div>
  )
}

export default DashboardPage
