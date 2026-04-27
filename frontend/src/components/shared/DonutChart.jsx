import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const DEFAULT_COLORS = ['#1D7FD8', '#f97316', '#34d399', '#a78bfa', '#f87171', '#60a5fa']

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  fontSize: '12px',
}

function DonutChart({
  data = [],
  colors,
  subtitle,
  highlightText,
  emptyMessage = 'Sin datos disponibles',
}) {
  const palette = colors ?? DEFAULT_COLORS

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-16">{emptyMessage}</p>
    )
  }

  return (
    <>
      {subtitle && (
        <p className="text-sm text-gray-400 mb-4">{subtitle}</p>
      )}

      <div className="flex gap-4 items-center">
        {/* Donut */}
        <div className="w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name ?? i}
                    fill={entry.color ?? palette[i % palette.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [`${v}%`, name]}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda con barras */}
        <div className="flex-1 flex flex-col gap-2.5">
          {data.map((item, i) => {
            const color = item.color ?? palette[i % palette.length]
            return (
              <div key={item.name ?? i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                    {item.name}
                  </span>
                  <span className="text-sm font-bold" style={{ color }}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-gray-100 w-full">
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {highlightText && (
        <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800">
          {highlightText}
        </div>
      )}
    </>
  )
}

export default DonutChart
