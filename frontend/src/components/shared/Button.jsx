const variantClasses = {
  primary:     'bg-[#1D7FD8] text-white hover:bg-[#1565b0] disabled:bg-[#1D7FD8]/50',
  primaryDark: 'bg-[#4C6EF5] text-white shadow-lg shadow-[#4C6EF5]/40 hover:bg-[#3b5bdb] disabled:bg-[#4C6EF5]/50',
  secondary:   'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-100/60 disabled:text-gray-400',
  danger:      'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-500/50',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg font-medium',
  md: 'px-5 py-2.5 text-sm rounded-xl font-medium',
  lg: 'px-8 py-3.5 text-base rounded-full font-bold',
}

function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  children,
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        transition-colors cursor-pointer
        disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {loading && (
        <span
          className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}

export default Button
