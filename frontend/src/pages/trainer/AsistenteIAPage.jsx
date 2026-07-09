import { useState, useEffect, useRef, forwardRef } from 'react'
import { Sparkles, Plus, Search, Send, Copy, ThumbsUp, MoreHorizontal, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { chatApi } from '../../services/api'
import Spinner from '../../components/shared/Spinner'
import AvatarCircle from '../../components/shared/AvatarCircle'


function getGroup(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 6 * 86400000)
  if (d >= today) return 'HOY'
  if (d >= yesterday) return 'AYER'
  if (d >= weekAgo) return 'ESTA SEMANA'
  return 'ANTERIORES'
}

function formatTimestamp(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 6 * 86400000)
  if (d >= today) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (d >= yesterday) return 'Ayer'
  if (d >= weekAgo) {
    const s = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
}

function formatMsgTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function agruparSesiones(sesiones) {
  const groups = { HOY: [], AYER: [], 'ESTA SEMANA': [], ANTERIORES: [] }
  sesiones.forEach(s => { groups[getGroup(s.fecha_updated)].push(s) })
  return groups
}

const GROUP_ORDER = ['HOY', 'AYER', 'ESTA SEMANA', 'ANTERIORES']


function parseBold(text) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)
}

function renderContent(text) {
  if (!text) return null
  const lines = text.split('\n')
  const result = []
  let listItems = []

  const flushList = () => {
    if (!listItems.length) return
    result.push(
      <ul key={`ul-${result.length}`} className="my-2 space-y-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="text-gray-400 shrink-0 mt-0.5">·</span>
            <span>{parseBold(item)}</span>
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, i) => {
    const m = line.match(/^[-*•]\s+(.+)/)
    if (m) { listItems.push(m[1]); return }
    flushList()
    if (!line.trim()) {
      if (result.length) result.push(<div key={`sp-${i}`} className="h-2" />)
    } else {
      result.push(<p key={`p-${i}`} className="leading-relaxed">{parseBold(line)}</p>)
    }
  })
  flushList()
  return result
}

// ── Suggestion cards ─────────────────────────────────────────

const SUGERENCIAS = [
  { titulo: 'Diseña un mesociclo de fuerza',    desc: '8 semanas, 4 días/sem, intermedio', prompt: 'Diseña un mesociclo de fuerza de 8 semanas, 4 días por semana, nivel intermedio.' },
  { titulo: 'Analiza el progreso de un cliente', desc: 'Tendencias, adherencia, plateaus',   prompt: 'Analiza el progreso de mis clientes: tendencias de rendimiento, adherencia y posibles plateaus.' },
  { titulo: 'Adaptar rutina por lesión',         desc: 'Hombro, rodilla, lumbar…',           prompt: 'Necesito adaptar una rutina por lesión. ¿Qué alternativas hay para hombro, rodilla y lumbar?' },
  { titulo: 'Redactar mensaje para un cliente',  desc: 'Feedback semanal, recordatorio…',    prompt: 'Ayúdame a redactar un mensaje de feedback semanal motivador para un cliente.' },
]

// ── Sub-components ───────────────────────────────────────────

function MessageBubble({ msg, user, onCopy }) {
  const isUser = msg.rol === 'user'

  if (isUser) {
    return (
      <div className="flex items-end gap-3 justify-end">
        <div className="max-w-lg">
          <div className="bg-[#1D7FD8] text-white text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-br-sm">
            {msg.content}
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1 pr-1">{formatMsgTime(msg.fecha_creacion)}</p>
        </div>
        <AvatarCircle nombre={user?.nombre ?? ''} apellidos="" size="sm" />
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#1D7FD8] flex items-center justify-center shrink-0 shadow-sm">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-gray-700">Asistente</span>
          <span className="text-[10px] text-gray-400">{formatMsgTime(msg.fecha_creacion)}</span>
        </div>
        <div className="text-sm text-gray-800">{renderContent(msg.content)}</div>
        <div className="flex items-center gap-0.5 mt-2">
          <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Copiar">
            <Copy size={13} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Me gusta">
            <ThumbsUp size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#1D7FD8] flex items-center justify-center shrink-0 shadow-sm">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

const ChatInput = forwardRef(function ChatInput({ value, onChange, onKeyDown, onSend, disabled, placeholder }, ref) {
  return (
    <div className="px-6 pb-6 pt-2">
      <div className="flex items-end gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-[#1D7FD8] transition-colors">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 resize-none text-sm text-gray-800 outline-none placeholder-gray-400 bg-transparent leading-relaxed"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="w-8 h-8 rounded-xl bg-[#1D7FD8] hover:bg-[#1a72c4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  )
})

// ── Main page ────────────────────────────────────────────────

function AsistenteIAPage() {
  const { user } = useAuth()
  const [sesiones,       setSesiones]       = useState([])
  const [loadingSesiones,setLoadingSesiones] = useState(true)
  const [selectedId,     setSelectedId]     = useState(null)
  const [sessionData,    setSessionData]    = useState(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [sending,        setSending]        = useState(false)
  const [inputText,      setInputText]      = useState('')
  const [busqueda,       setBusqueda]       = useState('')
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [previews,       setPreviews]       = useState({})

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)
  const menuRef        = useRef(null)

  useEffect(() => {
    chatApi.getSessions()
      .then(setSesiones)
      .catch(() => {})
      .finally(() => setLoadingSesiones(false))
  }, [])

  useEffect(() => {
    if (!selectedId) { setSessionData(null); return }
    setLoadingSession(true)
    chatApi.getSession(selectedId)
      .then(data => {
        setSessionData(data)
        const last = (data.messages ?? []).filter(m => m.rol === 'user').at(-1)
        if (last) setPreviews(p => ({ ...p, [selectedId]: last.content }))
      })
      .catch(() => {})
      .finally(() => setLoadingSession(false))
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessionData?.messages?.length, sending])

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleNueva() {
    setSelectedId(null)
    setSessionData(null)
    setInputText('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handleSend(texto) {
    const content = (texto ?? inputText).trim()
    if (!content || sending) return

    let sesionId = selectedId

    if (!sesionId) {
      try {
        const nueva = await chatApi.createSession(content.slice(0, 60))
        sesionId = nueva.id_chat_sesion
        setSesiones(prev => [nueva, ...prev])
        setSelectedId(sesionId)
        setSessionData({ ...nueva, messages: [] })
      } catch { return }
    }

    const tempId = Date.now()
    const userMsg = { id_chat_mensaje: tempId, rol: 'user', content, fecha_creacion: new Date().toISOString() }
    setSessionData(prev => ({ ...prev, messages: [...(prev?.messages ?? []), userMsg] }))
    setInputText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSending(true)
    setPreviews(p => ({ ...p, [sesionId]: content }))

    try {
      const respuesta = await chatApi.sendMessage(sesionId, content)
      setSessionData(prev => ({ ...prev, messages: [...(prev?.messages ?? []), respuesta] }))
      setSesiones(prev => prev.map(s =>
        s.id_chat_sesion === sesionId ? { ...s, fecha_updated: respuesta.fecha_creacion } : s
      ))
    } catch {
      setSessionData(prev => ({
        ...prev,
        messages: (prev?.messages ?? []).filter(m => m.id_chat_mensaje !== tempId)
      }))
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    try {
      await chatApi.deleteSession(selectedId)
      setSesiones(prev => prev.filter(s => s.id_chat_sesion !== selectedId))
      setSelectedId(null)
      setSessionData(null)
      setMenuOpen(false)
    } catch {}
  }

  function handleInputChange(e) {
    setInputText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sesionesFiltradas = busqueda
    ? sesiones.filter(s => (s.titulo ?? '').toLowerCase().includes(busqueda.toLowerCase()))
    : sesiones
  const grupos = agruparSesiones(sesionesFiltradas)
  const nombre = user?.nombre ?? 'entrenador'

  return (
    <div className="h-full flex overflow-hidden bg-white">

      {/* ── Panel lista ───────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-gray-100 bg-white">

        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-gray-900">Asistente IA</h1>
            <p className="text-xs text-gray-400 mt-0.5">{sesiones.length} conversaciones</p>
          </div>
          <button
            onClick={handleNueva}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D7FD8] hover:bg-[#1a72c4] text-white text-xs font-bold transition-colors"
          >
            <Plus size={13} />
            Nueva
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar en conversaciones..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1D7FD8] transition-colors placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {loadingSesiones ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : sesiones.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Sin conversaciones todavía</p>
          ) : (
            GROUP_ORDER.map(grupo => {
              const items = grupos[grupo]
              if (!items.length) return null
              return (
                <div key={grupo} className="mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-2">{grupo}</p>
                  {items.map(s => (
                    <button
                      key={s.id_chat_sesion}
                      onClick={() => setSelectedId(s.id_chat_sesion)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-colors ${
                        selectedId === s.id_chat_sesion ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold truncate ${selectedId === s.id_chat_sesion ? 'text-[#1D7FD8]' : 'text-gray-800'}`}>
                          {s.titulo || 'Nueva conversación'}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatTimestamp(s.fecha_updated)}</span>
                      </div>
                      {previews[s.id_chat_sesion] && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          Tú: {previews[s.id_chat_sesion]}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Panel principal ───────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-gray-50">

        {selectedId ? (
          <>
            {/* Cabecera conversación */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  {sessionData?.titulo || 'Nueva conversación'}
                </h2>
                {sessionData && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Iniciada el {new Date(sessionData.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6">
              {loadingSession ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : (
                (sessionData?.messages ?? [])
                  .filter(m => m.rol !== 'tool')
                  .map(msg => (
                    <MessageBubble
                      key={msg.id_chat_mensaje}
                      msg={msg}
                      user={user}
                      onCopy={() => navigator.clipboard.writeText(msg.content).catch(() => {})}
                    />
                  ))
              )}
              {sending && <ThinkingBubble />}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSend={() => handleSend()}
              disabled={sending}
              placeholder="Escribe un mensaje..."
            />
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1D7FD8] flex items-center justify-center shadow-lg">
                  <Sparkles size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900">
                    Hola {nombre}, ¿en qué te ayudo hoy?
                  </h2>
                  <p className="text-gray-500 mt-2.5 text-sm max-w-md leading-relaxed">
                    Pregúntame sobre programación, nutrición, comunicación con clientes o lesiones.
                    Tengo acceso al historial de tus clientes para darte respuestas con contexto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGERENCIAS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.prompt)}
                    className="text-left px-4 py-4 rounded-xl border border-gray-200 bg-white hover:border-[#1D7FD8] hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-bold text-gray-900">{s.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <ChatInput
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSend={() => handleSend()}
              disabled={sending}
              placeholder="Empieza una conversación nueva..."
            />
          </>
        )}
      </div>
    </div>
  )
}

export default AsistenteIAPage
