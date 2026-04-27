import { useState, useEffect } from 'react'
import Modal  from '../shared/Modal'
import Input  from '../shared/Input'
import Button from '../shared/Button'
import { exercisesApi, routinesApi } from '../../services/api'

const NIVEL_OPTIONS = [
  { value: 'PRINCIPIANTE', label: 'Principiante' },
  { value: 'INTERMEDIO',   label: 'Intermedio'   },
  { value: 'AVANZADO',     label: 'Avanzado'     },
]

const emptyForm   = { nombre: '', objetivo: '', nivel: '', descripcion: '' }
const newEj       = () => ({ id_ejercicio: '', series_plan: 3, reps_plan: 10, peso_obj: '' })
const newBloque   = () => ({ dia: 1, ejercicios: [newEj()] })

function ModalCrearRutina({ isOpen, onClose, onSuccess }) {
  const [form,           setForm]           = useState(emptyForm)
  const [bloques,        setBloques]        = useState([newBloque()])
  const [ejerciciosDisp, setEjerciciosDisp] = useState([])
  const [error,          setError]          = useState('')
  const [saving,         setSaving]         = useState(false)

  useEffect(() => {
    if (!isOpen) return
    exercisesApi.getExercises()
      .then((data) => setEjerciciosDisp(data.filter((e) => !e.archivado)))
      .catch(() => {})
  }, [isOpen])

  const ejercicioOptions = ejerciciosDisp.map((e) => ({ value: String(e.id_ejercicio), label: e.nombre }))

  function setFieldR(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function addBloque() {
    setBloques((prev) => [...prev, { dia: prev.length + 1, ejercicios: [newEj()] }])
  }
  function addEjercicio(bi) {
    setBloques((prev) => prev.map((b, i) => i === bi ? { ...b, ejercicios: [...b.ejercicios, newEj()] } : b))
  }
  function updateEjercicio(bi, ei, campo, valor) {
    setBloques((prev) => prev.map((b, i) =>
      i === bi ? { ...b, ejercicios: b.ejercicios.map((e, j) => j === ei ? { ...e, [campo]: valor } : e) } : b
    ))
  }
  function removeEjercicio(bi, ei) {
    setBloques((prev) => prev.map((b, i) =>
      i === bi ? { ...b, ejercicios: b.ejercicios.filter((_, j) => j !== ei) } : b
    ))
  }

  function cerrar() { onClose(); setForm(emptyForm); setBloques([newBloque()]); setError('') }

  async function handleCrearRutina() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(''); setSaving(true)
    try {
      const rutina = await routinesApi.createRoutine({
        nombre:      form.nombre,
        objetivo:    form.objetivo    || null,
        nivel:       form.nivel       || null,
        descripcion: form.descripcion || null,
      })

      for (let i = 0; i < bloques.length; i++) {
        const block = await routinesApi.createBlock(rutina.id_rutina, { numero_dia: bloques[i].dia })
        for (let j = 0; j < bloques[i].ejercicios.length; j++) {
          const ej = bloques[i].ejercicios[j]
          if (!ej.id_ejercicio) continue
          await routinesApi.createBlockExercise(rutina.id_rutina, block.id_bloque_rutina, {
            id_ejercicio: Number(ej.id_ejercicio),
            orden:        j + 1,
            series_plan:  Number(ej.series_plan) || 1,
            reps_plan:    Number(ej.reps_plan)   || 1,
            peso_obj:     ej.peso_obj !== '' ? Number(ej.peso_obj) : null,
          })
        }
      }
      onSuccess?.()
      cerrar()
    } catch (err) {
      setError(err.message || 'Error al crear la rutina')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={cerrar} title="Crear rutina">
      <div className="flex flex-col gap-5">

        {/* Datos generales */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos de la rutina</p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Input
                placeholder="Nombre de la rutina"
                value={form.nombre}
                onChange={(e) => setFieldR('nombre', e.target.value)}
                error={error && !form.nombre.trim() ? error : ''}
              />
              <Input placeholder="Objetivo" value={form.objetivo} onChange={(e) => setFieldR('objetivo', e.target.value)} />
              <Input type="select" placeholder="Nivel" value={form.nivel} onChange={(e) => setFieldR('nivel', e.target.value)} options={NIVEL_OPTIONS} />
            </div>
            <Input type="textarea" placeholder="Descripción" value={form.descripcion} onChange={(e) => setFieldR('descripcion', e.target.value)} />
          </div>
        </div>

        {/* Bloques */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ejercicios de la rutina</p>
          <div className="flex flex-col gap-3">
            {bloques.map((bloque, bi) => (
              <div key={bi} className="bg-blue-50 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#1D7FD8]">Día {bloque.dia}</p>
                {bloque.ejercicios.map((ej, ei) => (
                  <div key={ei} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        type="select"
                        placeholder="Selecciona ejercicio"
                        value={ej.id_ejercicio}
                        options={ejercicioOptions}
                        onChange={(e) => updateEjercicio(bi, ei, 'id_ejercicio', e.target.value)}
                      />
                    </div>
                    <div className="w-16">
                      <Input type="number" placeholder="Series" value={ej.series_plan}
                        onChange={(e) => updateEjercicio(bi, ei, 'series_plan', e.target.value)} />
                    </div>
                    <div className="w-16">
                      <Input type="number" placeholder="Reps" value={ej.reps_plan}
                        onChange={(e) => updateEjercicio(bi, ei, 'reps_plan', e.target.value)} />
                    </div>
                    <div className="w-20">
                      <Input type="number" placeholder="Peso kg" value={ej.peso_obj}
                        onChange={(e) => updateEjercicio(bi, ei, 'peso_obj', e.target.value)} />
                    </div>
                    {bloque.ejercicios.length > 1 && (
                      <button onClick={() => removeEjercicio(bi, ei)}
                        className="text-gray-400 hover:text-red-500 text-lg leading-none px-1">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addEjercicio(bi)}
                  className="text-xs text-[#1D7FD8] hover:underline self-start mt-1">
                  + Añadir ejercicio
                </button>
              </div>
            ))}
            <button onClick={addBloque} className="text-sm text-[#1D7FD8] hover:underline self-start">
              + Añadir bloque
            </button>
          </div>
        </div>

        {error && form.nombre.trim() && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={cerrar}>Cancelar</Button>
          <Button loading={saving} onClick={handleCrearRutina}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalCrearRutina
