import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function formatFecha(v) {
  if (!v) return v
  // "2026-02-23" → "23/02"
  const parts = String(v).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`
  return v
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#fff', padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#6b7280', marginBottom: 6 }}>{formatFecha(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value != null ? (p.dataKey === 'rendimiento' ? p.value.toFixed(1) : `${p.value}%`) : '—'}</strong>
        </p>
      ))}
    </div>
  )
}

/**
 * Gráfica de evolución con doble eje Y:
 *   - Eje izquierdo (%): cumplimiento y conformidad
 *   - Eje derecho (0–10): rendimiento
 *
 * Props:
 *   data    — array de puntos { fecha, rendimiento, cumplimiento, conformidad }
 *   xKey    — campo usado para el eje X (default: 'fecha')
 *   height  — altura del contenedor en px (default: 224)
 */
function EvolucionChart({ data = [], xKey = 'fecha', height = 224 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 24, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatFecha}
        />

        {/* Eje izquierdo — porcentaje */}
        <YAxis
          yAxisId="pct"
          orientation="left"
          domain={[0, 100]}
          unit="%"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />

        {/* Eje derecho — nota 0-10 */}
        <YAxis
          yAxisId="nota"
          orientation="right"
          domain={[0, 10]}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>}
        />

        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="cumplimiento"
          name="Cumplimiento"
          stroke="#34d399"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="conformidad"
          name="Conformidad"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="nota"
          type="monotone"
          dataKey="rendimiento"
          name="Rendimiento"
          stroke="#1D7FD8"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#1D7FD8', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default EvolucionChart
