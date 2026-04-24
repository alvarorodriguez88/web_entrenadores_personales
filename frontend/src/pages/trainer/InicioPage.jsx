import { useState, useEffect } from 'react'
import { Dumbbell, ClipboardList, Send, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { analyticsApi, exercisesApi, routinesApi, assignmentsApi, usersApi } from '../../services/api'
import KPICard from '../../components/shared/KPICard'
import Card   from '../../components/shared/Card'
import Modal  from '../../components/shared/Modal'
import Input  from '../../components/shared/Input'
import Button from '../../components/shared/Button'

const today = new Date().toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const NIVEL_OPTIONS = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
]

const ALERTA_LABELS = {
  INACTIVIDAD:       'Sin actividad reciente',
  BAJO_RENDIMIENTO:  'Bajo rendimiento',
  BAJO_CUMPLIMIENTO: 'Bajo cumplimiento',
  FALTA_DE_PROGRESO: 'Sin progreso',
}
function alertaLabel(tipo) { return ALERTA_LABELS[tipo] ?? 'Requiere atención' }

function initials(nombre, apellidos) {
  return `${nombre?.[0] ?? ''}${apellidos?.[0] ?? ''}`.toUpperCase()
}

function formatFechaCorta(iso) {
  if (!iso) return ''
  return new Date(iso)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

function buildKpis(data, periodo) {
  const vs = periodo === 'semanal' ? 'semana pasada' : 'mes pasado'
  return [
    {
      title:    'Clientes activos',
      value:    String(data.clientes_activos ?? '—'),
      trend:    data.clientes_activos_diff != null
                  ? `${data.clientes_activos_diff > 0 ? '+' : ''}${data.clientes_activos_diff} vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.clientes_activos_diff ?? 0) >= 0,
    },
    {
      title:    'Cumplimiento rutinas',
      value:    data.cumplimiento_pct != null ? `${data.cumplimiento_pct}%` : '—',
      trend:    data.cumplimiento_pct_diff != null
                  ? `${data.cumplimiento_pct_diff > 0 ? '+' : ''}${data.cumplimiento_pct_diff}% vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.cumplimiento_pct_diff ?? 0) >= 0,
    },
    {
      title:    periodo === 'semanal' ? 'Sesiones esta semana' : 'Sesiones este mes',
      value:    String(data.sesiones_completadas ?? '—'),
      trend:    data.sesiones_completadas_diff != null
                  ? `${data.sesiones_completadas_diff > 0 ? '+' : ''}${data.sesiones_completadas_diff} vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.sesiones_completadas_diff ?? 0) >= 0,
    },
    {
      title:    'Sin actividad',
      value:    String(data.clientes_sin_actividad ?? '—'),
      trend:    data.clientes_sin_actividad_diff != null
                  ? `${data.clientes_sin_actividad_diff > 0 ? '+' : ''}${data.clientes_sin_actividad_diff} vs ${vs}`
                  : `vs ${vs}`,
      positive: (data.clientes_sin_actividad_diff ?? 0) <= 0,
    },
  ]
}

// ── Formularios vacíos ────────────────────────────────────────────
const emptyEj      = { nombre: '', grupo_muscular: '', equipamiento: '', descripcion: '', video_url: '' }
const emptyRutina  = { nombre: '', objetivo: '', nivel: '', descripcion: '' }
const emptyAsignar = { clienteId: '', rutinaId: '', fechaInicio: '', fechaFin: '' }
const emptyCliente = { nombre: '', apellidos: '', email: '', telefono: '' }

function InicioPage() {
  const { user } = useAuth()

  // ── Datos del dashboard ───────────────────────────────────────
  const [periodo,   setPeriodo]   = useState('semanal')
  const [kpis,      setKpis]      = useState([])
  const [alertas,   setAlertas]   = useState([])
  const [actividad, setActividad] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // ── Modal: Crear ejercicio ────────────────────────────────────
  const [modalEj,   setModalEj]   = useState(false)
  const [formEj,    setFormEj]    = useState(emptyEj)
  const [errorEj,   setErrorEj]   = useState('')
  const [savingEj,  setSavingEj]  = useState(false)

  // ── Modal: Crear rutina ───────────────────────────────────────
  const [modalRut,  setModalRut]  = useState(false)
  const [formRut,   setFormRut]   = useState(emptyRutina)
  const [errorRut,  setErrorRut]  = useState('')
  const [savingRut, setSavingRut] = useState(false)

  // ── Modal: Asignar rutina ─────────────────────────────────────
  const [modalAs,   setModalAs]   = useState(false)
  const [formAs,    setFormAs]    = useState(emptyAsignar)
  const [errorAs,   setErrorAs]   = useState('')
  const [savingAs,  setSavingAs]  = useState(false)
  const [clientes,  setClientes]  = useState([])
  const [rutinas,   setRutinas]   = useState([])
  const [loadingAs, setLoadingAs] = useState(false)

  // ── Modal: Añadir cliente ─────────────────────────────────────
  const [modalCli,  setModalCli]  = useState(false)
  const [formCli,   setFormCli]   = useState(emptyCliente)
  const [errorCli,  setErrorCli]  = useState('')
  const [successCli,setSuccessCli]= useState(false)

  // ── Carga datos dashboard ─────────────────────────────────────
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      setError('')
      try {
        const [kpisData, alertasData, actividadData] = await Promise.all([
          analyticsApi.getTrainerKpis(periodo),
          analyticsApi.getTrainerAlerts(),
          analyticsApi.getTrainerRecentActivity(),
        ])
        setKpis(buildKpis(kpisData, periodo))
        setAlertas(Array.isArray(alertasData) ? alertasData : (alertasData?.items ?? alertasData?.alertas ?? []))
        setActividad(Array.isArray(actividadData) ? actividadData : (actividadData?.items ?? actividadData?.actividad ?? []))
      } catch (err) {
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [periodo])

  // ── Carga clientes+rutinas cuando se abre modal Asignar ───────
  useEffect(() => {
    if (!modalAs) return
    async function cargarSelects() {
      setLoadingAs(true)
      try {
        const [cData, rData] = await Promise.all([
          usersApi.getTrainerClients(),
          routinesApi.getRoutines(),
        ])
        setClientes(Array.isArray(cData) ? cData : [])
        setRutinas(Array.isArray(rData) ? rData : [])
      } catch { /* silencioso */ }
      finally { setLoadingAs(false) }
    }
    cargarSelects()
  }, [modalAs])

  // ── Handlers: Crear ejercicio ─────────────────────────────────
  function cerrarEj() { setModalEj(false); setFormEj(emptyEj); setErrorEj('') }
  async function guardarEj() {
    if (!formEj.nombre.trim()) { setErrorEj('El nombre es obligatorio'); return }
    setErrorEj(''); setSavingEj(true)
    try {
      await exercisesApi.createExercise({
        nombre:         formEj.nombre,
        descripcion:    formEj.descripcion    || '',
        grupo_muscular: formEj.grupo_muscular || null,
        equipamiento:   formEj.equipamiento   || null,
        video_url:      formEj.video_url      || null,
      })
      cerrarEj()
    } catch (err) { setErrorEj(err.message || 'Error al crear') }
    finally { setSavingEj(false) }
  }

  // ── Handlers: Crear rutina ────────────────────────────────────
  function cerrarRut() { setModalRut(false); setFormRut(emptyRutina); setErrorRut('') }
  async function guardarRut() {
    if (!formRut.nombre.trim()) { setErrorRut('El nombre es obligatorio'); return }
    setErrorRut(''); setSavingRut(true)
    try {
      await routinesApi.createRoutine({
        nombre:      formRut.nombre,
        objetivo:    formRut.objetivo    || null,
        nivel:       formRut.nivel       || null,
        descripcion: formRut.descripcion || null,
      })
      cerrarRut()
    } catch (err) { setErrorRut(err.message || 'Error al crear') }
    finally { setSavingRut(false) }
  }

  // ── Handlers: Asignar rutina ──────────────────────────────────
  function cerrarAs() { setModalAs(false); setFormAs(emptyAsignar); setErrorAs('') }
  async function guardarAs() {
    if (!formAs.clienteId || !formAs.rutinaId || !formAs.fechaInicio || !formAs.fechaFin) {
      setErrorAs('Todos los campos son obligatorios'); return
    }
    setErrorAs(''); setSavingAs(true)
    try {
      await assignmentsApi.createAssignment(formAs.clienteId, {
        id_rutina:    Number(formAs.rutinaId),
        fecha_inicio: formAs.fechaInicio,
        fecha_fin:    formAs.fechaFin,
      })
      cerrarAs()
    } catch (err) { setErrorAs(err.message || 'Error al asignar') }
    finally { setSavingAs(false) }
  }

  // ── Handlers: Añadir cliente ──────────────────────────────────
  function cerrarCli() { setModalCli(false); setFormCli(emptyCliente); setErrorCli(''); setSuccessCli(false) }
  function invitarCli() {
    if (!formCli.nombre.trim() || !formCli.apellidos.trim() || !formCli.email.trim()) {
      setErrorCli('Nombre, apellidos y correo son obligatorios'); return
    }
    setErrorCli('')
    // TODO: POST /api/v1/invitations cuando esté implementado
    setSuccessCli(true)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  const acciones = [
    { label: 'Crear ejercicio', icon: Dumbbell,     action: () => setModalEj(true)  },
    { label: 'Crear rutina',    icon: ClipboardList, action: () => setModalRut(true) },
    { label: 'Asignar rutina',  icon: Send,          action: () => setModalAs(true)  },
    { label: 'Añadir cliente',  icon: UserPlus,      action: () => setModalCli(true) },
  ]

  return (
    <div className="p-8 flex flex-col gap-8">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {['semanal', 'mensual'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
                ${periodo === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {p === 'semanal' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="flex gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Requieren atención + Actividad reciente */}
      <div className="grid grid-cols-2 gap-4">

        <Card title="Requieren atención">
          {alertas.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No hay clientes que requieran atención</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {alertas.map((a, i) => (
                <li key={i} className="flex items-center gap-3 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1D7FD8] font-semibold text-sm flex items-center justify-center shrink-0">
                    {initials(a.nombre, a.apellidos)}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{a.nombre} {a.apellidos}</span>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full shrink-0">
                    {alertaLabel(a.tipo_alerta)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Actividad reciente">
          {actividad.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin actividad reciente</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {actividad.map((a, i) => (
                <li key={i} className="flex items-center gap-3 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-semibold text-sm flex items-center justify-center shrink-0">
                    {initials(a.nombre, a.apellidos)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.nombre} {a.apellidos}</p>
                    {a.nombre_bloque && <p className="text-xs text-gray-400">{a.nombre_bloque}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-400">{formatFechaCorta(a.fecha_hora)}</span>
                    {a.nota_rendimiento != null && (
                      <span className="text-xs font-bold bg-blue-100 text-[#1D7FD8] px-2 py-0.5 rounded-lg">
                        RPE {Math.round(a.nota_rendimiento)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>

      {/* Acciones rápidas */}
      <div>
        <p className="text-xl font-semibold text-gray-700 mb-6">Acciones rápidas</p>
        <div className="grid grid-cols-4 gap-3">
          {acciones.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-3xl py-6 px-4 hover:border-[#1D7FD8]/40 hover:shadow-sm transition-all text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1D7FD8]/10 flex items-center justify-center">
                <Icon size={20} className="text-[#1D7FD8]" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Modal: Crear ejercicio ── */}
      <Modal isOpen={modalEj} onClose={cerrarEj} title="Crear ejercicio">
        <div className="flex flex-col gap-4">
          <Input placeholder="Nombre del ejercicio *" value={formEj.nombre}
            onChange={(e) => setFormEj((p) => ({ ...p, nombre: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Grupo muscular" value={formEj.grupo_muscular}
              onChange={(e) => setFormEj((p) => ({ ...p, grupo_muscular: e.target.value }))} />
            <Input placeholder="Equipamiento" value={formEj.equipamiento}
              onChange={(e) => setFormEj((p) => ({ ...p, equipamiento: e.target.value }))} />
          </div>
          <Input placeholder="Descripción" value={formEj.descripcion}
            onChange={(e) => setFormEj((p) => ({ ...p, descripcion: e.target.value }))} />
          <Input placeholder="URL del vídeo" value={formEj.video_url}
            onChange={(e) => setFormEj((p) => ({ ...p, video_url: e.target.value }))} />
          {errorEj && <p className="text-sm text-red-500">{errorEj}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={cerrarEj}>Cancelar</Button>
            <Button onClick={guardarEj} disabled={savingEj}>
              {savingEj ? 'Guardando…' : 'Crear ejercicio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Crear rutina ── */}
      <Modal isOpen={modalRut} onClose={cerrarRut} title="Crear rutina">
        <div className="flex flex-col gap-4">
          <Input placeholder="Nombre de la rutina *" value={formRut.nombre}
            onChange={(e) => setFormRut((p) => ({ ...p, nombre: e.target.value }))} />
          <Input placeholder="Objetivo" value={formRut.objetivo}
            onChange={(e) => setFormRut((p) => ({ ...p, objetivo: e.target.value }))} />
          <Input type="select" placeholder="Nivel" value={formRut.nivel}
            options={NIVEL_OPTIONS}
            onChange={(e) => setFormRut((p) => ({ ...p, nivel: e.target.value }))} />
          <Input placeholder="Descripción" value={formRut.descripcion}
            onChange={(e) => setFormRut((p) => ({ ...p, descripcion: e.target.value }))} />
          {errorRut && <p className="text-sm text-red-500">{errorRut}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={cerrarRut}>Cancelar</Button>
            <Button onClick={guardarRut} disabled={savingRut}>
              {savingRut ? 'Guardando…' : 'Crear rutina'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Asignar rutina ── */}
      <Modal isOpen={modalAs} onClose={cerrarAs} title="Asignar rutina">
        {loadingAs ? (
          <div className="flex items-center justify-center py-10">
            <span className="w-6 h-6 border-4 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              type="select"
              placeholder="Cliente *"
              value={formAs.clienteId}
              options={clientes.map((c) => ({
                value: String(c.user?.id_usuario ?? c.id_usuario),
                label: `${c.user?.nombre ?? c.nombre} ${c.user?.apellidos ?? c.apellidos}`,
              }))}
              onChange={(e) => setFormAs((p) => ({ ...p, clienteId: e.target.value }))}
            />
            <Input
              type="select"
              placeholder="Rutina *"
              value={formAs.rutinaId}
              options={rutinas.map((r) => ({ value: String(r.id_rutina), label: r.nombre }))}
              onChange={(e) => setFormAs((p) => ({ ...p, rutinaId: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha inicio *</p>
                <Input type="date" value={formAs.fechaInicio}
                  onChange={(e) => setFormAs((p) => ({ ...p, fechaInicio: e.target.value }))} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha fin *</p>
                <Input type="date" value={formAs.fechaFin}
                  onChange={(e) => setFormAs((p) => ({ ...p, fechaFin: e.target.value }))} />
              </div>
            </div>
            {errorAs && <p className="text-sm text-red-500">{errorAs}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={cerrarAs}>Cancelar</Button>
              <Button onClick={guardarAs} disabled={savingAs}>
                {savingAs ? 'Asignando…' : 'Asignar rutina'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Añadir cliente ── */}
      <Modal isOpen={modalCli} onClose={cerrarCli} title="Añadir cliente">
        {successCli ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">✓</div>
            <p className="text-center text-gray-700 font-medium">Invitación enviada correctamente</p>
            <p className="text-center text-sm text-gray-400">El cliente recibirá un correo para completar su registro.</p>
            <Button onClick={cerrarCli}>Cerrar</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input placeholder="Nombre *" value={formCli.nombre}
                onChange={(e) => setFormCli((p) => ({ ...p, nombre: e.target.value }))} />
              <Input placeholder="Apellidos *" value={formCli.apellidos}
                onChange={(e) => setFormCli((p) => ({ ...p, apellidos: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Input type="email" placeholder="Correo electrónico *" value={formCli.email}
                onChange={(e) => setFormCli((p) => ({ ...p, email: e.target.value }))} />
              <Input type="tel" placeholder="Teléfono" value={formCli.telefono}
                onChange={(e) => setFormCli((p) => ({ ...p, telefono: e.target.value }))} />
            </div>
            {errorCli && <p className="text-sm text-red-500">{errorCli}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={cerrarCli}>Cancelar</Button>
              <Button onClick={invitarCli}>Invitar</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}

export default InicioPage
