import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#fff', padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#6b7280', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value != null ? `${p.value}${p.dataKey === 'grasa' ? '%' : ' kg'}` : '—'}</strong>
        </p>
      ))}
    </div>
  )
}

function MetricasEvolucionChart({ data = [], height = 224, mostrar = ['peso', 'grasa'] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-16">
        Sin registros de métricas disponibles
      </p>
    )
  }

  const hasPeso  = mostrar.includes('peso')  && data.some((d) => d.peso  != null)
  const hasGrasa = mostrar.includes('grasa') && data.some((d) => d.grasa != null)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: hasGrasa ? 48 : 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />

        {/* Eje izquierdo — peso en kg */}
        <YAxis
          yAxisId="peso"
          orientation="left"
          domain={['auto', 'auto']}
          tick={{ fontSize: 12, fill: '#f97316' }}
          axisLine={false}
          tickLine={false}
          unit=" kg"
        />

        {/* Eje derecho — grasa en % (solo cuando hay datos de grasa) */}
        {hasGrasa && (
          <YAxis
            yAxisId="grasa"
            orientation="right"
            domain={[0, 'auto']}
            tick={{ fontSize: 12, fill: '#a78bfa' }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
        )}

        <Tooltip content={<CustomTooltip />} />

        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>}
        />

        {hasPeso && (
          <Line
            yAxisId="peso"
            type="monotone"
            dataKey="peso"
            name="Peso (kg, eje izq.)"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        )}

        {hasGrasa && (
          <Line
            yAxisId="grasa"
            type="monotone"
            dataKey="grasa"
            name="% Grasa (eje der.)"
            stroke="#a78bfa"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        )}

      </LineChart>
    </ResponsiveContainer>
  )
}

export default MetricasEvolucionChart
