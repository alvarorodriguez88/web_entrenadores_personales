import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceDot,
} from 'recharts'

function formatFecha(v) {
  if (!v) return v
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
          {p.name.split(' (')[0]}: <strong>{p.value != null ? (p.dataKey === 'rendimiento' ? p.value.toFixed(1) : `${p.value}%`) : '—'}</strong>
        </p>
      ))}
    </div>
  )
}

function EvolucionChart({ data = [], xKey = 'fecha', height = 280, highlightFecha, highlightConformidad }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 50, left: 10, bottom: 0 }}>
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
          tick={{ fontSize: 12, fill: '#34d399' }}
          axisLine={false}
          tickLine={false}
          label={{ value: '% conformidad / cumplimiento', angle: -90, position: 'insideLeft', style: { fill: '#34d399', fontSize: 11 }, dx: 0, dy: 75 }}
        />

        {/* Eje derecho — nota 0-10 */}
        <YAxis
          yAxisId="nota"
          orientation="right"
          domain={[0, 10]}
          tick={{ fontSize: 12, fill: '#60a5fa' }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Rendimiento', angle: 90, position: 'insideRight', style: { fill: '#60a5fa', fontSize: 11 }, dx: 0, dy: 50 }}
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
          dataKey="conformidad"
          name="Conformidad (%, eje izq.)"
          stroke="#34d399"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="cumplimiento"
          name="Cumplimiento (%, eje izq.)"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="nota"
          type="monotone"
          dataKey="rendimiento"
          name="Rendimiento (0–10, eje der.)"
          stroke="#60a5fa"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />

        {highlightFecha != null && highlightConformidad != null && (
          <ReferenceDot
            x={highlightFecha}
            y={highlightConformidad}
            yAxisId="pct"
            r={8}
            fill="#34d399"
            stroke="white"
            strokeWidth={2}
            label={{ value: `${highlightConformidad}%`, position: 'top', fill: '#34d399', fontSize: 12, fontWeight: 'bold' }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default EvolucionChart
