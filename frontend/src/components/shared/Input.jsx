const baseFieldClasses = `
  w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800
  placeholder:text-gray-400 outline-none transition-colors
  border border-transparent
  focus:border-[#1D7FD8] focus:bg-white
  disabled:opacity-50 disabled:cursor-not-allowed
`

const errorFieldClasses = `
  border-red-400 bg-red-50
  focus:border-red-500 focus:bg-red-50
`

function Input({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  options = [],
}) {
  const fieldClasses = `${baseFieldClasses} ${error ? errorFieldClasses : ''}`

  return (
    <div className="flex flex-col gap-1">

      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {type === 'textarea' && (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={4}
          className={`${fieldClasses} resize-none`}
        />
      )}

      {type === 'select' && (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${fieldClasses} cursor-pointer`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {type !== 'textarea' && type !== 'select' && (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={fieldClasses}
        />
      )}

      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}

    </div>
  )
}

export default Input
