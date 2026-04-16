from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.assignment import AsignacionRutina, SesionRutina, EjercicioRealizado, AsignacionEjercicio
from app.models.user import Cliente
from app.models.routine import Rutina, BloqueRutina, BloqueRutinaEjercicio
from app.schemas.assignment import (
    AssignmentCreate, AssignmentStatusUpdate,
    SessionCreate, SessionUpdate,
    ExerciseLogCreate, ExerciseLogUpdate,
    AssignmentExerciseCreate, AssignmentExerciseUpdate
)
from app.services.user_service import update_client_nivel_if_needed


def get_assignments(db: Session, trainer_id: int) -> list[AsignacionRutina]:
    return db.query(AsignacionRutina).join(Cliente).filter(
        Cliente.id_entrenador == trainer_id,
        AsignacionRutina.estado == "ACTIVA"
    ).all()

def get_assignment_history(db: Session, trainer_id: int) -> list[AsignacionRutina]:
    return db.query(AsignacionRutina).join(Cliente).filter(
        Cliente.id_entrenador == trainer_id
    ).all()

def get_client_assignments_trainer(db: Session, client_id: int, trainer_id: int) -> list[AsignacionRutina]:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)
    return db.query(AsignacionRutina).filter(
        AsignacionRutina.id_cliente == client_id,
        AsignacionRutina.estado == "ACTIVA"
    ).all()

def get_client_assignments_client(db: Session, client_id: int) -> list[AsignacionRutina]:
    return db.query(AsignacionRutina).filter(
        AsignacionRutina.id_cliente == client_id,
        AsignacionRutina.estado == "ACTIVA"
    ).all()

def get_client_assignment_history(db: Session, client_id: int, trainer_id: int) -> list[AsignacionRutina]:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)
    return db.query(AsignacionRutina).filter(
        AsignacionRutina.id_cliente == client_id
    ).all()

def get_assignment_by_id(db: Session, assignment_id: int, trainer_id: int) -> AsignacionRutina:
    assignment = db.query(AsignacionRutina).join(Cliente).filter(
        AsignacionRutina.id_asignacion_rutina == assignment_id,
        Cliente.id_entrenador == trainer_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return assignment

def create_assignment(db: Session, client_id: int, data: AssignmentCreate, trainer_id: int) -> AsignacionRutina:
    client = _verify_client_belongs_to_trainer(db, client_id, trainer_id)

    routine = db.query(Rutina).filter(
        Rutina.id_rutina == data.id_rutina,
        Rutina.id_entrenador == trainer_id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found in your catalog"
        )

    assignment = AsignacionRutina(
        id_cliente=client_id,
        id_rutina=data.id_rutina,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        estado="ACTIVA",
        notas=data.notas,
    )
    db.add(assignment)

    update_client_nivel_if_needed(client, routine.nivel)

    db.commit()
    db.refresh(assignment)
    return assignment

def update_assignment_status(db: Session, assignment_id: int, data: AssignmentStatusUpdate, trainer_id: int) -> AsignacionRutina:
    valid_statuses = ["ACTIVA", "PAUSADA", "FINALIZADA"]
    if data.estado not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    assignment = get_assignment_by_id(db, assignment_id, trainer_id)
    assignment.estado = data.estado
    db.commit()
    db.refresh(assignment)
    return assignment

def delete_assignment(db: Session, assignment_id: int, trainer_id: int) -> None:
    assignment = get_assignment_by_id(db, assignment_id, trainer_id)
    db.delete(assignment)
    db.commit()



def get_sessions(db: Session, assignment_id: int, user_id: int, is_trainer: bool) -> list[SesionRutina]:
    _verify_assignment_access(db, assignment_id, user_id, is_trainer)
    return db.query(SesionRutina).filter(
        SesionRutina.id_asignacion == assignment_id
    ).all()

def get_session_by_id(db: Session, assignment_id: int, session_id: int, user_id: int, is_trainer: bool) -> SesionRutina:
    _verify_assignment_access(db, assignment_id, user_id, is_trainer)

    session = db.query(SesionRutina).filter(
        SesionRutina.id_sesion_rutina == session_id,
        SesionRutina.id_asignacion == assignment_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session

def create_session(db: Session, assignment_id: int, data: SessionCreate, client_id: int) -> SesionRutina:
    assignment = db.query(AsignacionRutina).filter(
        AsignacionRutina.id_asignacion_rutina == assignment_id,
        AsignacionRutina.id_cliente == client_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.estado != "ACTIVA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot log sessions for a paused or finished assignment"
        )

    block = db.query(BloqueRutina).filter(
        BloqueRutina.id_bloque_rutina == data.id_bloque_rutina,
        BloqueRutina.id_rutina == assignment.id_rutina
    ).first()

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found in this routine"
        )

    session = SesionRutina(
        id_asignacion=assignment_id,
        id_bloque_rutina=data.id_bloque_rutina,
        duracion_min=data.duracion_min,
        esfuerzo_rpe=data.esfuerzo_rpe,
        conformidad=data.conformidad,
        comentario=data.comentario,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def update_session(db: Session, assignment_id: int, session_id: int, data: SessionUpdate, client_id: int) -> SesionRutina:
    session = get_session_by_id(db, assignment_id, session_id, client_id, is_trainer=False)

    if data.duracion_min is not None:
        session.duracion_min = data.duracion_min
    if data.esfuerzo_rpe is not None:
        session.esfuerzo_rpe = data.esfuerzo_rpe
    if data.conformidad is not None:
        session.conformidad = data.conformidad
    if data.nota_rendimiento is not None:
        session.nota_rendimiento = data.nota_rendimiento
    if data.comentario is not None:
        session.comentario = data.comentario

    db.commit()
    db.refresh(session)
    return session

def delete_session(db: Session, assignment_id: int, session_id: int, client_id: int) -> None:
    session = get_session_by_id(db, assignment_id, session_id, client_id, is_trainer=False)
    db.delete(session)
    db.commit()



def get_exercise_logs(db: Session, session_id: int, user_id: int, is_trainer: bool) -> list[EjercicioRealizado]:
    _get_session_for_access(db, session_id, user_id, is_trainer)
    return db.query(EjercicioRealizado).filter(
        EjercicioRealizado.id_sesion == session_id
    ).order_by(EjercicioRealizado.orden).all()

def get_exercise_log_by_id(db: Session, log_id: int, user_id: int, is_trainer: bool) -> EjercicioRealizado:
    log = db.query(EjercicioRealizado).filter(
        EjercicioRealizado.id_ejercicio_realizado == log_id
    ).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise log not found"
        )

    _get_session_for_access(db, log.id_sesion, user_id, is_trainer)
    return log

def get_client_exercise_logs(db: Session, client_id: int, trainer_id: int) -> list[EjercicioRealizado]:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)
    return db.query(EjercicioRealizado).join(SesionRutina).join(AsignacionRutina).filter(
        AsignacionRutina.id_cliente == client_id
    ).order_by(EjercicioRealizado.orden).all()

def create_exercise_log(db: Session, session_id: int, data: ExerciseLogCreate, client_id: int) -> EjercicioRealizado:
    _get_session_for_access(db, session_id, client_id, is_trainer=False)

    existing = db.query(EjercicioRealizado).filter(
        EjercicioRealizado.id_sesion == session_id,
        EjercicioRealizado.orden == data.orden
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order position {data.orden} is already taken in this session"
        )

    log = EjercicioRealizado(
        id_sesion=session_id,
        id_ejercicio=data.id_ejercicio,
        orden=data.orden,
        series_real=data.series_real,
        reps_real=data.reps_real,
        peso_real=data.peso_real,
        rpe_real=data.rpe_real,
        comentario=data.comentario
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def update_exercise_log(db: Session, log_id: int, data: ExerciseLogUpdate, client_id: int) -> EjercicioRealizado:
    log = get_exercise_log_by_id(db, log_id, client_id, is_trainer=False)

    if data.series_real is not None:
        log.series_real = data.series_real
    if data.reps_real is not None:
        log.reps_real = data.reps_real
    if data.peso_real is not None:
        log.peso_real = data.peso_real
    if data.rpe_real is not None:
        log.rpe_real = data.rpe_real
    if data.comentario is not None:
        log.comentario = data.comentario

    db.commit()
    db.refresh(log)
    return log

def delete_exercise_log(db: Session, log_id: int, client_id: int) -> None:
    log = get_exercise_log_by_id(db, log_id, client_id, is_trainer=False)
    db.delete(log)
    db.commit()



def _verify_client_belongs_to_trainer(db: Session, client_id: int, trainer_id: int) -> Cliente:
    client = db.query(Cliente).filter(
        Cliente.id_usuario == client_id,
        Cliente.id_entrenador == trainer_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client

def _verify_assignment_access(db: Session, assignment_id: int, user_id: int, is_trainer: bool) -> AsignacionRutina:
    if is_trainer:
        return get_assignment_by_id(db, assignment_id, trainer_id=user_id)

    assignment = db.query(AsignacionRutina).filter(
        AsignacionRutina.id_asignacion_rutina == assignment_id,
        AsignacionRutina.id_cliente == user_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return assignment

def _get_session_for_access(db: Session, session_id: int, user_id: int, is_trainer: bool) -> SesionRutina:
    session = db.query(SesionRutina).filter(
        SesionRutina.id_sesion_rutina == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if is_trainer:
        get_assignment_by_id(db, session.id_asignacion, trainer_id=user_id)
    else:
        assignment = db.query(AsignacionRutina).filter(
            AsignacionRutina.id_asignacion_rutina == session.id_asignacion,
            AsignacionRutina.id_cliente == user_id
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

    return session

def get_assignment_exercises(db: Session, assignment_id: int, user_id: int, is_trainer: bool) -> list[AsignacionEjercicio]:
    _verify_assignment_access(db, assignment_id, user_id, is_trainer)
    return db.query(AsignacionEjercicio).filter(
        AsignacionEjercicio.id_asignacion_rutina == assignment_id
    ).all()

def get_assignment_exercise_by_id(db: Session, assignment_id: int, customization_id: int, user_id: int, is_trainer: bool) -> AsignacionEjercicio:
    _verify_assignment_access(db, assignment_id, user_id, is_trainer)

    customization = db.query(AsignacionEjercicio).filter(
        AsignacionEjercicio.id_asignacion_ejercicio == customization_id,
        AsignacionEjercicio.id_asignacion_rutina == assignment_id
    ).first()

    if not customization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise customization not found"
        )
    return customization

def create_assignment_exercise(db: Session, assignment_id: int, data: AssignmentExerciseCreate, trainer_id: int) -> AsignacionEjercicio:
    assignment = get_assignment_by_id(db, assignment_id, trainer_id)

    block_exercise = db.query(BloqueRutinaEjercicio).join(BloqueRutina).filter(
        BloqueRutinaEjercicio.id_bloque_rutina_ejercicio == data.id_bloque_rutina_ej,
        BloqueRutina.id_rutina == assignment.id_rutina
    ).first()

    if not block_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in this routine"
        )

    existing = db.query(AsignacionEjercicio).filter(
        AsignacionEjercicio.id_asignacion_rutina == assignment_id,
        AsignacionEjercicio.id_bloque_rutina_ej == data.id_bloque_rutina_ej
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customization already exists for this exercise. Use PUT to update it."
        )

    customization = AsignacionEjercicio(
        id_asignacion_rutina=assignment_id,
        id_bloque_rutina_ej=data.id_bloque_rutina_ej,
        series_plan=data.series_plan,
        reps_plan=data.reps_plan,
        peso_obj=data.peso_obj,
        descanso_seg=data.descanso_seg,
        notas=data.notas
    )
    db.add(customization)
    db.commit()
    db.refresh(customization)
    return customization

def update_assignment_exercise(db: Session, assignment_id: int, customization_id: int, data: AssignmentExerciseUpdate, trainer_id: int) -> AsignacionEjercicio:
    customization = get_assignment_exercise_by_id(
        db, assignment_id, customization_id, trainer_id, is_trainer=True
    )

    if data.series_plan is not None:
        customization.series_plan = data.series_plan
    if data.reps_plan is not None:
        customization.reps_plan = data.reps_plan
    if data.peso_obj is not None:
        customization.peso_obj = data.peso_obj
    if data.descanso_seg is not None:
        customization.descanso_seg = data.descanso_seg
    if data.notas is not None:
        customization.notas = data.notas

    db.commit()
    db.refresh(customization)
    return customization

def delete_assignment_exercise(db: Session, assignment_id: int, customization_id: int, trainer_id: int) -> None:
    customization = get_assignment_exercise_by_id(
        db, assignment_id, customization_id, trainer_id, is_trainer=True
    )
    db.delete(customization)
    db.commit()