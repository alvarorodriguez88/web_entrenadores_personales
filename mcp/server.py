from mcp.server.fastmcp import FastMCP
from api_client import api_get

mcp = FastMCP(
    name="web-entrenadores",
    instructions="""
    You are an assistant for personal trainers using the web-entrenadores platform.
    You have access to the trainer's clients, routines and analytics data.
    Use the available tools to answer questions accurately based on real data.
    When comparing clients or recommending routines, always base your answer on the data retrieved.
    Respond in the same language the trainer uses.
    """,
)


@mcp.tool()
async def get_client_details(client_id: int) -> dict:
    """
    Returns the full profile of a client.
    Includes: id, name, surnames, email, level (PRINCIPIANTE/INTERMEDIO/AVANZADO), creation date,
    objective (PERDER_PESO/GANAR_MASA/MEJORAR_RESISTENCIA/MEJORAR_FUERZA/MANTENIMIENTO),
    Use this to get all relevant information about a client in one place.
    """
    return await api_get(f"/users/clients/{client_id}")

@mcp.tool()
async def get_trainer_clients() -> list:
    """
    Returns the full list of the trainer's clients.
    Each client includes: id, name, surnames, email, level (PRINCIPIANTE/INTERMEDIO/AVANZADO),
    current active routine name, and date of last session.
    Use this to find clients with a specific profile or to compare clients.
    """
    return await api_get("/analytics/trainer/clients/list")

@mcp.tool()
async def get_routine_details(routine_id: int) -> dict:
    """
    Returns the full details of a routine.
    Includes: name, level, objective, description, and for each block
    the day of week (1=Monday to 7=Sunday), name, notes and all exercises with
    planned sets, reps, weight and rest.
    Use this to get all relevant information about a routine in one place.
    """
    routine = await api_get(f"/routines/{routine_id}")
    blocks = await api_get(f"/routines/{routine_id}/blocks")

    blocks_with_exercises = []
    for block in blocks:
        block_id = block["id_bloque_rutina"]
        exercises = await api_get(f"/routines/{routine_id}/blocks/{block_id}/exercises")

        blocks_with_exercises.append({
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

    return {
        "id_rutina": routine_id,
        "nombre": routine["nombre"],
        "nivel": routine.get("nivel"),
        "objetivo": routine.get("objetivo"),
        "descripcion": routine.get("descripcion"),
        "dias_semana": len(blocks_with_exercises),
        "bloques": blocks_with_exercises,
    }

@mcp.tool()
async def get_routines_with_details() -> list:
    """
    Returns all trainer routines with their complete structure: blocks and exercises.
    Each routine includes: name, level, objective, description, and for each block
    the day of week (1=Monday to 7=Sunday), name, and all exercises with planned
    sets, reps, weight and rest.
    Use this to recommend a routine to a client based on their profile and goals.
    """
    routines_list = await api_get("/routines")

    result = []
    for routine in routines_list:
        if routine.get("archivado"):
            continue

        routine_id = routine["id_rutina"]
        blocks = await api_get(f"/routines/{routine_id}/blocks")
        blocks_with_exercises = []

        for block in blocks:
            block_id = block["id_bloque_rutina"]
            exercises = await api_get(f"/routines/{routine_id}/blocks/{block_id}/exercises")

            blocks_with_exercises.append({
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
        result.append({
            "id_rutina": routine_id,
            "nombre": routine["nombre"],
            "nivel": routine.get("nivel"),
            "objetivo": routine.get("objetivo"),
            "descripcion": routine.get("descripcion"),
            "dias_semana": len(blocks_with_exercises),
            "bloques": blocks_with_exercises,
        })

    return result

@mcp.tool()
async def get_clients_with_stats(periodo: str = "semanal") -> list:
    """
    Returns all trainer clients with their full profile and performance stats.
    Each client includes: id, name, surnames, level, objective, active routine,
    last session date, compliance percentage and average performance score.
    periodo: 'semanal' (current week) or 'mensual' (current month).
    Use this to filter or list clients by any condition:
    - clients with low performance (rendimiento_avg < 4)
    - clients without an active routine (rutina_activa is null)
    - clients by level (PRINCIPIANTE / INTERMEDIO / AVANZADO)
    - clients by objective (PERDER_PESO / GANAR_MASA / MEJORAR_RESISTENCIA / MEJORAR_FUERZA / MANTENIMIENTO)
    - clients inactive for a long time (ultima_sesion is null or old date)
    - clients with low compliance (cumplimiento_pct < 60)
    - clients with low accordance (conformidad_avg < 50 in 3 periods in a row)
    """
    clients_list = await api_get("/analytics/trainer/clients/list")
    clients_table = await api_get(
        "/analytics/trainer/clients/table",
        params={"periodo": periodo}
    )

    stats_map = {c["id_cliente"]: c for c in clients_table}

    result = []
    for client in clients_list:
        cid = client["id_cliente"]
        stats = stats_map.get(cid, {})
        result.append({
            "id_cliente": cid,
            "nombre": client["nombre"],
            "apellidos": client["apellidos"],
            "nivel": client.get("nivel"),
            "rutina_activa": client.get("rutina_activa"),
            "ultima_sesion": client.get("ultima_sesion"),
            "cumplimiento_pct": stats.get("cumplimiento_pct", 0.0),
            "rendimiento_avg": stats.get("rendimiento_avg", 0.0),
            "conformidad_avg": stats.get("conformidad_avg", 0.0),
        })

    return result

@mcp.tool()
async def get_client_training_history(client_id: int) -> dict:
    """
    Returns the full training history of a client.
    Includes all routine assignments (active, paused and finished) with their
    dates and status, plus the monthly evolution of performance, compliance
    and conformity scores.
    Use this to understand how a client has progressed over time or what
    routines they have had assigned.
    """
    assignments = await api_get(f"/assignments/clients/{client_id}/history")
    evolution = await api_get(
        f"/analytics/trainer/clients/{client_id}/evolution",
        params={"periodo": "mensual"}
    )

    result = []
    for a in assignments:
        result.append({
            "rutina_id": a["id_rutina"],
            "nombre_rutina": a.get("nombre_rutina"),
            "fecha_inicio": a["fecha_inicio"],
            "fecha_fin": a["fecha_fin"],
            "estado": a["estado"],
        })
    puntos = evolution.get("puntos", [])

    return {
        "asignaciones": result,
        "evolucion": puntos,
    }

@mcp.tool()
async def get_client_physical_history(client_id: int) -> list:
    """
    Returns the full physical metrics history of a client.
    Each record includes: date, weight (kg), height (cm) and body fat percentage.
    Records are ordered from oldest to most recent.
    Use this to analyze physical evolution, weight loss or muscle gain progress.
    """
    metrics = await api_get(f"/metrics/clients/{client_id}")

    result = []
    for m in metrics:
        result.append({
            "fecha": m["fecha_registro"],
            "peso_kg": m["peso_kg"],
            "altura_cm": m.get("altura_cm"),
            "grasa_pct": m.get("grasa_pct"),
        })
    return result



if __name__ == "__main__":
    mcp.run(transport="sse")