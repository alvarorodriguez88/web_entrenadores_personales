
async def build_blocks_with_exercises(routine_id: int, api_get) -> list:
    blocks = await api_get(f"/routines/{routine_id}/blocks")
    result = []
    for block in blocks:
        block_id = block["id_bloque_rutina"]
        exercises = await api_get(f"/routines/{routine_id}/blocks/{block_id}/exercises")
        result.append({
            "dia_semana": block["numero_dia"],
            "nombre": block.get("nombre"),
            "notas": block.get("notas"),
            "ejercicios": [
                {
                    "nombre": e.get("nombre_ejercicio"),
                    "orden": e["orden"],
                    "series": e["series_plan"],
                    "reps": e["reps_plan"],
                    "peso_obj_kg": e.get("peso_obj"),
                    "descanso_seg": e.get("descanso_seg"),
                }
                for e in exercises
            ],
        })
    return result