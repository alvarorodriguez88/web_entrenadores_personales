function Card({ title, children, className = '', action }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm ${className}`}>

      {title && (
        <>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          <div className="px-5 py-4">
            {children}
          </div>
        </>
      )}

      {!title && (
        <div className="px-5 py-4">
          {children}
        </div>
      )}

    </div>
  )
}

export default Card
