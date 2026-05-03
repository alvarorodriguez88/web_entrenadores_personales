import { useState, useEffect } from 'react'
import { Scale, Ruler, Droplets } from 'lucide-react'
import Modal  from '../shared/Modal'
import Button from '../shared/Button'
import { metricsApi } from '../../services/api'

const CAMPOS = [
  { key: 'peso_kg',   label: 'Peso',    icon: Scale,    unit: 'kg', required: true,  min: 1,  max: 500, step: 0.1 },
  { key: 'altura_cm', label: 'Altura',  icon: Ruler,    unit: 'cm', required: false, min: 50, max: 300, step: 1   },
  { key: 'grasa_pct', label: '% Grasa', icon: Droplets, unit: '%',  required: false, min: 1,  max: 100, step: 0.1 },
]

const EMPTY = Object.fromEntries(CAMPOS.map((c) => [c.key, '']))

function ModalRegistrarMetrica({ open, onClose, onSaved, ultimaMetrica }) {
  const [form,    setForm]    = useState(EMPTY)
  const [comment, setComment] = useState('')
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      peso_kg:   ultimaMetrica?.peso_kg   != null ? String(ultimaMetrica.peso_kg)   : '',
      altura_cm: ultimaMetrica?.altura_cm != null ? String(ultimaMetrica.altura_cm) : '',
      grasa_pct: ultimaMetrica?.grasa_pct != null ? String(ultimaMetrica.grasa_pct) : '',
    })
    setComment(ultimaMetrica?.comentario ?? '')
    setError('')
  }, [open])

  function handleClose() {
    setForm(EMPTY)
    setComment('')
    setError('')
    onClose()
  }

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.peso_kg || Number(form.peso_kg) <= 0) {
      setError('El peso es obligatorio y debe ser mayor que 0.')
      return
    }

    const payload = { peso_kg: Number(form.peso_kg) }

    const alturaFinal = form.altura_cm !== '' ? Number(form.altura_cm)
                      : ultimaMetrica?.altura_cm != null ? Number(ultimaMetrica.altura_cm)
                      : null
    if (alturaFinal != null) payload.altura_cm = alturaFinal

    const grasaFinal = form.grasa_pct !== '' ? Number(form.grasa_pct)
                     : ultimaMetrica?.grasa_pct != null ? Number(ultimaMetrica.grasa_pct)
                     : null
    if (grasaFinal != null) payload.grasa_pct = grasaFinal

    if (comment.trim()) payload.comentario = comment.trim()

    setSaving(true)
    try {
      await metricsApi.createClientMetric(payload)
      setForm(EMPTY)
      setComment('')
      onSaved()
    } catch (err) {
      setError(err.message || 'Error al guardar la métrica')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="Registrar métricas" maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {CAMPOS.map(({ key, label, icon: Icon, unit, required, min, max, step }) => (
          <div key={key}>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <Icon size={14} className="text-[#1D7FD8]" />
              {label}
              {required && <span className="text-red-400">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                min={min}
                max={max}
                step={step}
                placeholder={ultimaMetrica?.[key] != null ? `último: ${ultimaMetrica[key]}` : `ej. ${min}`}
                required={required}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30 focus:border-[#1D7FD8]"
              />
              <span className="text-sm text-gray-400 w-6">{unit}</span>
            </div>
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Comentario</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Opcional…"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D7FD8]/30 focus:border-[#1D7FD8]"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            Guardar
          </Button>
        </div>

      </form>
    </Modal>
  )
}

export default ModalRegistrarMetrica
