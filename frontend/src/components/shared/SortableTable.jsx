import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'

const ALIGN = {
  left:   { header: 'justify-start',  cell: 'justify-start'  },
  center: { header: 'justify-center', cell: 'justify-center' },
  right:  { header: 'justify-end',    cell: 'justify-end'    },
}

function SortIcon({ colKey, sortKey, sortDir }) {
  if (sortKey !== colKey) return <ChevronsUpDown size={12} className="text-gray-300 shrink-0" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-[#1D7FD8] shrink-0" />
    : <ChevronDown size={12} className="text-[#1D7FD8] shrink-0" />
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30 focus:border-[#1D7FD8]"
      />
    </div>
  )
}

function SortableTable({
  data = [],
  columns = [],
  title,
  searchFields,
  searchPlaceholder = 'Buscar…',
  maxHeight = 'max-h-[560px]',
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  action,
}) {
  const isMulti = searchFields?.length > 0 && typeof searchFields[0] === 'object'

  const [query,   setQuery]   = useState('')
  const [filters, setFilters] = useState(() =>
    isMulti ? Object.fromEntries(searchFields.map(f => [f.key, ''])) : {}
  )
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const gridCols = columns.map(c => c.width ?? '1fr').join(' ')

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = isMulti
    ? data.filter(row =>
        searchFields.every(f => {
          const val = filters[f.key]
          return !val || String(row[f.key] ?? '').toLowerCase().includes(val.toLowerCase())
        })
      )
    : data.filter(row => {
        const fields = searchFields ?? columns.map(c => c.key)
        return fields.some(f => String(row[f] ?? '').toLowerCase().includes(query.toLowerCase()))
      })

  const activeCol = columns.find(c => c.key === sortKey)

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        if (activeCol?.sortFn) return activeCol.sortFn(a, b, sortDir)
        const va = a[sortKey] ?? ''
        const vb = b[sortKey] ?? ''
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortDir === 'asc' ? va - vb : vb - va
        }
        return sortDir === 'asc'
          ? String(va).localeCompare(String(vb), 'es')
          : String(vb).localeCompare(String(va), 'es')
      })
    : filtered

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">{emptyMessage}</p>
  }

  const colHeaders = (
    <div className="grid gap-3 px-6 py-3 border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
      {columns.map(col => (
        <button
          key={col.key}
          onClick={() => handleSort(col.key)}
          className={`flex items-center gap-1 text-[11px] font-semibold tracking-widest text-gray-400 uppercase hover:text-gray-600 transition-colors select-none ${ALIGN[col.align ?? 'left'].header}`}
        >
          {col.label}
          <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
        </button>
      ))}
    </div>
  )

  const rows = sorted.length === 0 ? (
    <p className="text-sm text-gray-400 py-8 text-center px-6">
      Sin resultados para la búsqueda actual
    </p>
  ) : (
    <ul className={`flex flex-col divide-y divide-gray-100 ${maxHeight} overflow-y-auto`}>
      {sorted.map((row, i) => (
        <li
          key={row.id ?? i}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={`grid items-center py-4 gap-3 px-6 ${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
          style={{ gridTemplateColumns: gridCols }}
        >
          {columns.map(col => (
            <div key={col.key} className={`min-w-0 overflow-hidden flex items-center ${ALIGN[col.align ?? 'left'].cell}`}>
              {col.render
                ? col.render(row[col.key], row)
                : <span className="text-sm text-gray-700 truncate min-w-0 w-full">{row[col.key] ?? '—'}</span>
              }
            </div>
          ))}
        </li>
      ))}
    </ul>
  )

  if (title) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Fila 1: título + badge + (buscador único | espacio) + botón acción */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 shrink-0">{title}</span>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
            {data.length}
          </span>
          {!isMulti ? (
            <div className="flex-1">
              <SearchInput value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder} />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {/* Fila 2 (solo multi-filter): un input por campo */}
        {isMulti && (
          <div className="flex gap-2 px-6 py-3 border-b border-gray-100">
            {searchFields.map(f => (
              <SearchInput
                key={f.key}
                value={filters[f.key]}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            ))}
          </div>
        )}

        {colHeaders}
        {rows}
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-3">
      {!isMulti ? (
        <SearchInput value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder} />
      ) : (
        <div className="flex gap-2">
          {searchFields.map(f => (
            <SearchInput
              key={f.key}
              value={filters[f.key]}
              onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          ))}
        </div>
      )}
      {colHeaders}
      {rows}
    </div>
  )
}

export default SortableTable
