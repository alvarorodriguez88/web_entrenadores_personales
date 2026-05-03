function KPICard({ title, value, trend, positive }) {
  return (
    <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-5 flex flex-col gap-3 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-snug">{title}</p>
      <p className="text-4xl font-black text-gray-900 leading-none">{value}</p>
      {trend && (
        <div className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg text-sm font-semibold
          ${positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
        >
          <span>{positive ? '↑' : '↓'}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}

export default KPICard
