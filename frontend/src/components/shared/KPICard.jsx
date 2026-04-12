import { TrendingUp, TrendingDown } from 'lucide-react'

function KPICard({ title, value, trend, positive }) {
  const TrendIcon = positive ? TrendingUp : TrendingDown
  const trendColor = positive ? 'text-green-600' : 'text-red-500'

  return (
    <div className="flex-1 bg-blue-100 rounded-2xl px-5 py-4 flex flex-col gap-2 min-w-0">

      <p className="text-sm font-medium text-gray-600 truncate">{title}</p>

      <p className="text-3xl font-bold text-gray-800 leading-none">{value}</p>

      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={14} strokeWidth={2} />
          <span>{trend}</span>
        </div>
      )}

    </div>
  )
}

export default KPICard
