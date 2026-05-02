from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.user import Cliente
from app.models.assignment import AsignacionRutina, SesionRutina, EjercicioRealizado, AsignacionEjercicio
from app.models.routine import Rutina, BloqueRutina, BloqueRutinaEjercicio
from app.models.exercise import Ejercicio, EjercicioCategoria, Categoria
from app.services.user_service import get_trainer_clients
from app.services.assignment_service import _verify_client_belongs_to_trainer, auto_finalize_expired


def _get_period_range(periodo: str) -> tuple[date, date, date, date]:
    today = date.today()

    if periodo == "semanal":
        start_current = today - timedelta(days=today.weekday())
        end_current = start_current + timedelta(days=6)
        start_previous = start_current - timedelta(weeks=1)
        end_previous = start_current - timedelta(days=1)
    else:
        start_current = today.replace(day=1)
        if today.month == 12:
            end_current = today.replace(day=31)
        else:
            end_current = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        start_previous = (start_current - timedelta(days=1)).replace(day=1)
        end_previous = start_current - timedelta(days=1)

    return start_current, end_current, start_previous, end_previous

def _get_period_ranges(periodo: str) -> list[tuple[date, date]]:
    today = date.today()
    ranges = []

    if periodo == "semanal":
        for i in range(7, -1, -1):
            week_start = today - timedelta(weeks=i) - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            ranges.append((week_start, week_end))
    else:
        for i in range(5, -1, -1):
            month_date = today.replace(day=1)
            for _ in range(i):
                month_date = (month_date - timedelta(days=1)).replace(day=1)
            month_start = month_date
            if month_date.month == 12:
                month_end = month_date.replace(day=31)
            else:
                month_end = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)
            ranges.append((month_start, month_end))

    return ranges

def _get_expected_sessions_in_period(db: Session, assignment: AsignacionRutina, start: date, end: date) -> int:
    num_blocks = db.query(func.count(BloqueRutina.id_bloque_rutina)).filter(
        BloqueRutina.id_rutina == assignment.id_rutina
    ).scalar() or 0

    if num_blocks == 0:
        return 0

    period_start = max(start, assignment.fecha_inicio)
    period_end = min(end, assignment.fecha_fin)

    if period_start > period_end:
        return 0

    days_in_period = (period_end - period_start).days + 1
    weeks_in_period = days_in_period / 7

    return round(num_blocks * weeks_in_period)

def _get_client_cumplimiento(db: Session, client_id: int, start: date, end: date) -> float:
    assignments = db.query(AsignacionRutina).filter(
        AsignacionRutina.id_cliente == client_id,
        AsignacionRutina.estado == "ACTIVA"
    ).all()

    if not assignments:
        return 0.0

    total_expected = 0
    total_done = 0

    for assignment in assignments:
        expected = _get_expected_sessions_in_period(db, assignment, start, end)
        total_expected += expected

        done = db.query(func.count(SesionRutina.id_sesion_rutina)).filter(
            SesionRutina.id_asignacion == assignment.id_asignacion_rutina,
            func.date(SesionRutina.fecha_hora) >= start,
            func.date(SesionRutina.fecha_hora) <= end
        ).scalar() or 0
        total_done += done

    if total_expected == 0:
        return 0.0

    return round(min(100.0, (total_done / total_expected) * 100), 2)

def _get_client_rendimiento(db: Session, client_id: int, start: date, end: date) -> float:
    result = db.query(func.avg(SesionRutina.nota_rendimiento)).join(
        AsignacionRutina
    ).filter(
        AsignacionRutina.id_cliente == client_id,
        SesionRutina.nota_rendimiento.isnot(None),
        SesionRutina.nota_rendimiento > 0,
        func.date(SesionRutina.fecha_hora) >= start,
        func.date(SesionRutina.fecha_hora) <= end
    ).scalar()

    return round(float(result), 2) if result else 0.0

def _get_client_conformidad(db: Session, client_id: int, start: date, end: date) -> float:
    result = db.query(func.avg(SesionRutina.conformidad)).join(
        AsignacionRutina
    ).filter(
        AsignacionRutina.id_cliente == client_id,
        SesionRutina.conformidad.isnot(None),
        func.date(SesionRutina.fecha_hora) >= start,
        func.date(SesionRutina.fecha_hora) <= end
    ).scalar()

    return round(float(result), 2) if result else 0.0


def get_trainer_kpis(db: Session, trainer_id: int, periodo: str) -> dict:
    start, end, start_prev, end_prev = _get_period_range(periodo)
    clients = get_trainer_clients(db, trainer_id)
    client_ids = [c.id_usuario for c in clients]

    if not client_ids:
        return {
            "clientes_activos": 0,
            "clientes_activos_comparativa": 0,
            "cumplimiento_pct": 0.0,
            "cumplimiento_pct_comparativa": 0.0,
            "sesiones_completadas": 0,
            "sesiones_completadas_comparativa": 0,
            "clientes_sin_actividad": 0,
            "clientes_sin_actividad_comparativa": 0,
        }

    activos_current = db.query(func.count(func.distinct(
        SesionRutina.id_asignacion
    ))).join(AsignacionRutina).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        func.date(SesionRutina.fecha_hora) >= start,
        func.date(SesionRutina.fecha_hora) <= end
    ).scalar() or 0

    activos_prev = db.query(func.count(func.distinct(
        SesionRutina.id_asignacion
    ))).join(AsignacionRutina).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        func.date(SesionRutina.fecha_hora) >= start_prev,
        func.date(SesionRutina.fecha_hora) <= end_prev
    ).scalar() or 0

    cumplimientos = [_get_client_cumplimiento(db, cid, start, end) for cid in client_ids]
    cumplimientos_prev = [_get_client_cumplimiento(db, cid, start_prev, end_prev) for cid in client_ids]
    cumplimiento_avg = round(sum(cumplimientos) / len(cumplimientos), 2) if cumplimientos else 0.0
    cumplimiento_avg_prev = round(sum(cumplimientos_prev) / len(cumplimientos_prev), 2) if cumplimientos_prev else 0.0

    sesiones_current = db.query(func.count(SesionRutina.id_sesion_rutina)).join(
        AsignacionRutina
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        func.date(SesionRutina.fecha_hora) >= start,
        func.date(SesionRutina.fecha_hora) <= end
    ).scalar() or 0

    sesiones_prev = db.query(func.count(SesionRutina.id_sesion_rutina)).join(
        AsignacionRutina
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        func.date(SesionRutina.fecha_hora) >= start_prev,
        func.date(SesionRutina.fecha_hora) <= end_prev
    ).scalar() or 0

    clientes_con_actividad = db.query(func.distinct(AsignacionRutina.id_cliente)).join(
        SesionRutina
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        func.date(SesionRutina.fecha_hora) >= start,
        func.date(SesionRutina.fecha_hora) <= end
    ).all()
    ids_con_actividad = {r[0] for r in clientes_con_actividad}
    sin_actividad_current = len([cid for cid in client_ids if cid not in ids_con_actividad])

    clientes_con_actividad_prev = db.query(func.distinct(AsignacionRutina.id_cliente)).join(
        SesionRutina
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        func.date(SesionRutina.fecha_hora) >= start_prev,
        func.date(SesionRutina.fecha_hora) <= end_prev
    ).all()
    ids_con_actividad_prev = {r[0] for r in clientes_con_actividad_prev}
    sin_actividad_prev = len([cid for cid in client_ids if cid not in ids_con_actividad_prev])

    return {
        "clientes_activos": activos_current,
        "clientes_activos_comparativa": activos_current - activos_prev,
        "cumplimiento_pct": cumplimiento_avg,
        "cumplimiento_pct_comparativa": round(cumplimiento_avg - cumplimiento_avg_prev, 2),
        "sesiones_completadas": sesiones_current,
        "sesiones_completadas_comparativa": sesiones_current - sesiones_prev,
        "clientes_sin_actividad": sin_actividad_current,
        "clientes_sin_actividad_comparativa": sin_actividad_current - sin_actividad_prev,
    }

def get_trainer_alerts(db: Session, trainer_id: int) -> list[dict]:
    clients = get_trainer_clients(db, trainer_id)
    alerts = []
    today = date.today()
    four_weeks_ago = today - timedelta(weeks=4)
    two_weeks_ago = today - timedelta(weeks=2)
    one_week_ago = today - timedelta(weeks=1)

    for client in clients:
        client_data = {
            "id_cliente": client.id_usuario,
            "nombre": client.user.nombre,
            "apellidos": client.user.apellidos,
        }

        sessions_zero = db.query(func.count(SesionRutina.id_sesion_rutina)).join(
            AsignacionRutina
        ).filter(
            AsignacionRutina.id_cliente == client.id_usuario,
            SesionRutina.nota_rendimiento == 0
        ).scalar() or 0

        if sessions_zero > 3:
            alerts.append({**client_data, "tipo_alerta": "INACTIVIDAD"})
            continue

        rendimiento_week = _get_client_rendimiento(db, client.id_usuario, one_week_ago, today)
        if 0 < rendimiento_week < 4:
            alerts.append({**client_data, "tipo_alerta": "BAJO_RENDIMIENTO"})
            continue

        week1_start = two_weeks_ago
        week1_end = two_weeks_ago + timedelta(days=6)
        week2_start = one_week_ago
        week2_end = today

        cumpl_week1 = _get_client_cumplimiento(db, client.id_usuario, week1_start, week1_end)
        cumpl_week2 = _get_client_cumplimiento(db, client.id_usuario, week2_start, week2_end)

        if cumpl_week1 < 60 and cumpl_week2 < 60:
            alerts.append({**client_data, "tipo_alerta": "BAJO_CUMPLIMIENTO"})
            continue

        if client.objetivo == "MANTENIMIENTO":
            continue

        sessions_4w = db.query(SesionRutina).join(AsignacionRutina).filter(
            AsignacionRutina.id_cliente == client.id_usuario,
            SesionRutina.nota_rendimiento.isnot(None),
            SesionRutina.nota_rendimiento > 0,
            func.date(SesionRutina.fecha_hora) >= four_weeks_ago
        ).order_by(SesionRutina.fecha_hora).all()

        if len(sessions_4w) >= 2:
            first_half = sessions_4w[:len(sessions_4w)//2]
            second_half = sessions_4w[len(sessions_4w)//2:]
            avg_first = sum(float(s.nota_rendimiento) for s in first_half) / len(first_half)
            avg_second = sum(float(s.nota_rendimiento) for s in second_half) / len(second_half)
            if avg_second <= avg_first:
                alerts.append({**client_data, "tipo_alerta": "FALTA_DE_PROGRESO"})

    return alerts

def get_trainer_recent_activity(db: Session, trainer_id: int) -> list[dict]:
    clients = get_trainer_clients(db, trainer_id)
    client_ids = [c.id_usuario for c in clients]

    if not client_ids:
        return []

    sessions = db.query(SesionRutina, BloqueRutina, Cliente).join(
        AsignacionRutina, SesionRutina.id_asignacion == AsignacionRutina.id_asignacion_rutina
    ).join(
        BloqueRutina, SesionRutina.id_bloque_rutina == BloqueRutina.id_bloque_rutina
    ).join(
        Cliente, AsignacionRutina.id_cliente == Cliente.id_usuario
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids)
    ).order_by(
        SesionRutina.fecha_hora.desc()
    ).limit(5).all()

    result = []
    for session, block, client in sessions:
        result.append({
            "id_cliente": client.id_usuario,
            "nombre": client.user.nombre,
            "apellidos": client.user.apellidos,
            "fecha_hora": session.fecha_hora,
            "nombre_bloque": block.nombre,
            "nota_rendimiento": float(session.nota_rendimiento) if session.nota_rendimiento else None,
        })
    return result

def get_trainer_performance_distribution(db: Session, trainer_id: int) -> dict:
    clients = get_trainer_clients(db, trainer_id)
    print(f"Total clientes encontrados: {len(clients)} → ids: {[c.id_usuario for c in clients]}")
    today = date.today()
    one_week_ago = today - timedelta(weeks=2)

    alto = medio = bajo = inactivo = 0

    for client in clients:
        print(f"Buscando sesiones para id_usuario={client.id_usuario}, rango={one_week_ago} → {today}")
        avg = _get_client_rendimiento(db, client.id_usuario, one_week_ago, today)
        print(f"  avg={avg}")
        if avg == 0:
            inactivo += 1
        elif avg >= 8:
            alto += 1
        elif avg >= 4:
            medio += 1
        else:
            bajo += 1

    return {"alto": alto, "medio": medio, "bajo": bajo, "inactivo": inactivo}

def get_trainer_clients_list(db: Session, trainer_id: int) -> list[dict]:
    clients = get_trainer_clients(db, trainer_id)
    if not clients:
        return []

    client_ids = [c.id_usuario for c in clients]

    today = date.today()
    assignments = db.query(AsignacionRutina, Rutina).join(
        Rutina, AsignacionRutina.id_rutina == Rutina.id_rutina
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids),
        AsignacionRutina.estado == "ACTIVA",
        Rutina.archivado == False,
        or_(AsignacionRutina.fecha_inicio == None, AsignacionRutina.fecha_inicio <= today),
        or_(AsignacionRutina.fecha_fin   == None, AsignacionRutina.fecha_fin   >= today),
    ).all()
    rutina_map = {a.id_cliente: r.nombre for a, r in assignments}

    sesion_rows = db.query(
        AsignacionRutina.id_cliente,
        func.max(SesionRutina.fecha_hora).label("ultima")
    ).join(
        SesionRutina, SesionRutina.id_asignacion == AsignacionRutina.id_asignacion_rutina
    ).filter(
        AsignacionRutina.id_cliente.in_(client_ids)
    ).group_by(AsignacionRutina.id_cliente).all()
    sesion_map = {row.id_cliente: row.ultima for row in sesion_rows}

    return [
        {
            "id_cliente":    c.id_usuario,
            "nombre":        c.user.nombre,
            "apellidos":     c.user.apellidos,
            "email":         c.user.email,
            "nivel":         c.nivel,
            "rutina_activa": rutina_map.get(c.id_usuario),
            "ultima_sesion": sesion_map.get(c.id_usuario),
        }
        for c in clients
    ]

def get_trainer_clients_table(db: Session, trainer_id: int, periodo: str) -> list[dict]:
    start, end, _, _ = _get_period_range(periodo)
    clients = get_trainer_clients(db, trainer_id)

    result = []
    for client in clients:
        ultima_sesion = db.query(SesionRutina.fecha_hora).join(AsignacionRutina).filter(
            AsignacionRutina.id_cliente == client.id_usuario
        ).order_by(SesionRutina.fecha_hora.desc()).first()

        result.append({
            "id_cliente": client.id_usuario,
            "nombre": client.user.nombre,
            "apellidos": client.user.apellidos,
            "cumplimiento_pct": _get_client_cumplimiento(db, client.id_usuario, start, end),
            "conformidad_avg": _get_client_conformidad(db, client.id_usuario, start, end),
            "rendimiento_avg": _get_client_rendimiento(db, client.id_usuario, start, end),
            "ultima_sesion": ultima_sesion[0] if ultima_sesion else None,
            "nivel": client.nivel,
        })
    return result

def get_trainer_client_evolution(db: Session, trainer_id: int, client_id: int, periodo: str) -> list[dict]:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)
    return _get_evolution_points(db, client_id, periodo)


def get_client_kpis(db: Session, client_id: int, periodo: str) -> dict:
    start, end, start_prev, end_prev = _get_period_range(periodo)

    rendimiento = _get_client_rendimiento(db, client_id, start, end)
    cumplimiento = _get_client_cumplimiento(db, client_id, start, end)
    conformidad = _get_client_conformidad(db, client_id, start, end)

    sesiones_current = db.query(func.count(SesionRutina.id_sesion_rutina)).join(
        AsignacionRutina
    ).filter(
        AsignacionRutina.id_cliente == client_id,
        func.date(SesionRutina.fecha_hora) >= start,
        func.date(SesionRutina.fecha_hora) <= end
    ).scalar() or 0

    sesiones_prev = db.query(func.count(SesionRutina.id_sesion_rutina)).join(
        AsignacionRutina
    ).filter(
        AsignacionRutina.id_cliente == client_id,
        func.date(SesionRutina.fecha_hora) >= start_prev,
        func.date(SesionRutina.fecha_hora) <= end_prev
    ).scalar() or 0

    assignments = db.query(AsignacionRutina).filter(
        AsignacionRutina.id_cliente == client_id,
        AsignacionRutina.estado == "ACTIVA"
    ).all()

    total_expected = sum(
        _get_expected_sessions_in_period(db, a, start, end) for a in assignments
    )
    cumplimiento_rutinas = round(
        min(100.0, (sesiones_current / total_expected) * 100), 2
    ) if total_expected > 0 else 0.0

    return {
        "rendimiento_avg": rendimiento,
        "cumplimiento_pct": cumplimiento,
        "conformidad_avg": conformidad,
        "sesiones_completadas": sesiones_current,
        "sesiones_completadas_comparativa": sesiones_current - sesiones_prev,
        "cumplimiento_rutinas_pct": cumplimiento_rutinas,
    }

def get_client_weekly_calendar(db: Session, client_id: int) -> list[dict]:
    auto_finalize_expired(db, client_id)

    today = date.today()
    monday = today - timedelta(days=today.weekday())

    assignments = db.query(AsignacionRutina).join(Rutina).filter(
        AsignacionRutina.id_cliente == client_id,
        AsignacionRutina.estado == "ACTIVA",
        Rutina.archivado == False,
        AsignacionRutina.fecha_inicio <= today,
        AsignacionRutina.fecha_fin   >= today,
    ).all()

    planned_days: set[int] = set()
    assignment_ids: list[int] = []
    for a in assignments:
        blocks = db.query(BloqueRutina).filter(
            BloqueRutina.id_rutina == a.id_rutina
        ).all()
        planned_days.update(b.numero_dia for b in blocks)
        assignment_ids.append(a.id_asignacion_rutina)

    result = []
    for i in range(7):
        day = monday + timedelta(days=i)
        weekday = i + 1
        tiene_sesion = weekday in planned_days

        completada = False
        if tiene_sesion and assignment_ids:
            completada = db.query(SesionRutina).filter(
                SesionRutina.id_asignacion.in_(assignment_ids),
                func.date(SesionRutina.fecha_hora) == day
            ).first() is not None

        result.append({
            "fecha": day,
            "tiene_sesion": tiene_sesion,
            "completada": completada,
        })
    return result

def get_client_today_workout(db: Session, client_id: int) -> list[dict]:
    auto_finalize_expired(db, client_id)

    today = date.today()
    weekday = today.weekday() + 1

    assignments = db.query(AsignacionRutina).join(Rutina).filter(
        AsignacionRutina.id_cliente == client_id,
        AsignacionRutina.estado == "ACTIVA",
        Rutina.archivado == False,
        AsignacionRutina.fecha_inicio <= today,
        AsignacionRutina.fecha_fin   >= today,
    ).order_by(AsignacionRutina.fecha_inicio.desc()).all()

    result = []
    for assignment in assignments:
        routine = db.query(Rutina).filter(
            Rutina.id_rutina == assignment.id_rutina
        ).first()

        block = db.query(BloqueRutina).filter(
            BloqueRutina.id_rutina == assignment.id_rutina,
            BloqueRutina.numero_dia == weekday
        ).first()
        if not block:
            continue

        block_exercises = db.query(BloqueRutinaEjercicio, Ejercicio).join(
            Ejercicio, BloqueRutinaEjercicio.id_ejercicio == Ejercicio.id_ejercicio
        ).filter(
            BloqueRutinaEjercicio.id_bloque_rutina == block.id_bloque_rutina
        ).order_by(BloqueRutinaEjercicio.orden).all()

        customizations = db.query(AsignacionEjercicio).filter(
            AsignacionEjercicio.id_asignacion_rutina == assignment.id_asignacion_rutina
        ).all()
        custom_map = {c.id_bloque_rutina_ej: c for c in customizations}

        exercises_result = []
        for bre, ejercicio in block_exercises:
            custom = custom_map.get(bre.id_bloque_rutina_ejercicio)

            cat_rows = db.query(Categoria.nombre).join(
                EjercicioCategoria, Categoria.id_categoria == EjercicioCategoria.id_categoria
            ).filter(EjercicioCategoria.id_ejercicio == ejercicio.id_ejercicio).all()
            categorias = [r.nombre for r in cat_rows]

            exercises_result.append({
                "id_ejercicio":   ejercicio.id_ejercicio,
                "nombre":         ejercicio.nombre,
                "grupo_muscular": ejercicio.grupo_muscular,
                "equipamiento":   ejercicio.equipamiento,
                "descripcion":    ejercicio.descripcion,
                "video_url":      ejercicio.video_url,
                "categorias":     categorias,
                "series_plan":    custom.series_plan if custom and custom.series_plan is not None else bre.series_plan,
                "reps_plan":      custom.reps_plan   if custom and custom.reps_plan   is not None else bre.reps_plan,
                "peso_obj":       float(custom.peso_obj)     if custom and custom.peso_obj     is not None else (float(bre.peso_obj) if bre.peso_obj is not None else None),
                "descanso_seg":   custom.descanso_seg if custom and custom.descanso_seg is not None else bre.descanso_seg,
                "notas":          custom.notas        if custom and custom.notas        is not None else bre.notas,
                "orden":          bre.orden,
            })

        sesion_hoy = db.query(SesionRutina).filter(
            SesionRutina.id_asignacion == assignment.id_asignacion_rutina,
            SesionRutina.id_bloque_rutina == block.id_bloque_rutina,
            func.date(SesionRutina.fecha_hora) == today,
        ).first()

        result.append({
            "id_asignacion_rutina": assignment.id_asignacion_rutina,
            "id_bloque_rutina":     block.id_bloque_rutina,
            "nombre_rutina":        routine.nombre,
            "nivel_rutina":         routine.nivel,
            "objetivo_rutina":      routine.objetivo,
            "descripcion_rutina":   routine.descripcion,
            "nombre_bloque":        block.nombre,
            "numero_dia":           block.numero_dia,
            "notas_bloque":         block.notas,
            "fecha_inicio":         assignment.fecha_inicio,
            "fecha_fin":            assignment.fecha_fin,
            "ejercicios":           exercises_result,
            "sesion_hoy": {
                "id_sesion_rutina": sesion_hoy.id_sesion_rutina,
                "duracion_min":     sesion_hoy.duracion_min,
                "esfuerzo_rpe":     sesion_hoy.esfuerzo_rpe,
                "conformidad":      sesion_hoy.conformidad,
                "nota_rendimiento": float(sesion_hoy.nota_rendimiento) if sesion_hoy.nota_rendimiento else None,
            } if sesion_hoy else None,
        })

    return result

def get_client_recent_activity(db: Session, client_id: int) -> list[dict]:
    sessions = db.query(SesionRutina).filter(
        SesionRutina.id_asignacion.in_(
            db.query(AsignacionRutina.id_asignacion_rutina).filter(
                AsignacionRutina.id_cliente == client_id
            )
        )
    ).order_by(SesionRutina.fecha_hora.desc()).limit(5).all()

    return [
        {
            "fecha_hora": s.fecha_hora,
            "nota_rendimiento": float(s.nota_rendimiento) if s.nota_rendimiento else None,
            "conformidad": float(s.conformidad) if s.conformidad else None
        }
        for s in sessions
    ]

def get_client_evolution(db: Session, client_id: int, periodo: str) -> list[dict]:
    return _get_evolution_points(db, client_id, periodo)

def get_client_exercise_distribution(db: Session, client_id: int) -> list[dict]:
    rows = db.query(
        Categoria.nombre,
        func.count(EjercicioCategoria.id_ejercicio).label("cantidad")
    ).join(
        EjercicioCategoria, Categoria.id_categoria == EjercicioCategoria.id_categoria
    ).join(
        Ejercicio, EjercicioCategoria.id_ejercicio == Ejercicio.id_ejercicio
    ).join(
        EjercicioRealizado, Ejercicio.id_ejercicio == EjercicioRealizado.id_ejercicio
    ).join(
        SesionRutina, EjercicioRealizado.id_sesion == SesionRutina.id_sesion_rutina
    ).join(
        AsignacionRutina, SesionRutina.id_asignacion == AsignacionRutina.id_asignacion_rutina
    ).filter(
        AsignacionRutina.id_cliente == client_id
    ).group_by(Categoria.nombre).all()

    total = sum(r.cantidad for r in rows)
    if total == 0:
        return []

    return [
        {
            "categoria": r.nombre,
            "cantidad": r.cantidad,
            "porcentaje": round((r.cantidad / total) * 100, 2),
        }
        for r in rows
    ]

def get_trainer_evolution(db: Session, trainer_id: int, periodo: str) -> list[dict]:
    clients = get_trainer_clients(db, trainer_id)
    if not clients:
        return []

    client_ids = [c.id_usuario for c in clients]
    points = []

    for start, end in _get_period_ranges(periodo):
        rendimientos = [_get_client_rendimiento(db, cid, start, end) for cid in client_ids]
        cumplimientos = [_get_client_cumplimiento(db, cid, start, end) for cid in client_ids]
        conformidades = [_get_client_conformidad(db, cid, start, end) for cid in client_ids]

        points.append({
            "fecha": str(start),
            "rendimiento": round(sum(rendimientos) / len(rendimientos), 2),
            "cumplimiento": round(sum(cumplimientos) / len(cumplimientos), 2),
            "conformidad": round(sum(conformidades) / len(conformidades), 2),
        })

    return points

def _get_evolution_points(db: Session, client_id: int, periodo: str) -> list[dict]:
    points = []
    for start, end in _get_period_ranges(periodo):
        points.append({
            "fecha": str(start),
            "rendimiento": _get_client_rendimiento(db, client_id, start, end),
            "cumplimiento": _get_client_cumplimiento(db, client_id, start, end),
            "conformidad": _get_client_conformidad(db, client_id, start, end),
        })
    return points