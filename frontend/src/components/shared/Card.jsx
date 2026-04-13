function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>

      {title && (
        <>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
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
