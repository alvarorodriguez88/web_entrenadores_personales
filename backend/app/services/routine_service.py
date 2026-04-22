from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.routine import Rutina, BloqueRutina, BloqueRutinaEjercicio
from app.models.assignment import AsignacionRutina
from app.models.exercise import Ejercicio
from app.schemas.routine import (
    RoutineCreate, RoutineUpdate,
    BlockCreate, BlockUpdate,
    BlockExerciseCreate, BlockExerciseUpdate,
    ReorderRequest
)


def get_routines(db: Session, trainer_id: int) -> list[Rutina]:
    return db.query(Rutina).filter(
        Rutina.id_entrenador == trainer_id
    ).all()

def get_client_routines(db: Session, client_id: int) -> list[Rutina]:
    return db.query(Rutina).join(AsignacionRutina).filter(
        AsignacionRutina.estado == 'ACTIVA',
        AsignacionRutina.id_cliente == client_id,
    ).all()

def get_routine_by_id(db: Session, routine_id: int, trainer_id: int) -> Rutina:
    routine = db.query(Rutina).filter(
        Rutina.id_rutina == routine_id,
        Rutina.id_entrenador == trainer_id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found"
        )
    return routine

def get_client_routine(db: Session, routine_id: int, client_id: int) -> Rutina:
    routine = db.query(Rutina).join(AsignacionRutina).filter(
        Rutina.id_rutina == routine_id,
        AsignacionRutina.estado == 'ACTIVA',
        AsignacionRutina.id_cliente == client_id,
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found"
        )
    return routine

def create_routine(db: Session, data: RoutineCreate, trainer_id: int) -> Rutina:
    routine = Rutina(
        id_entrenador=trainer_id,
        nombre=data.nombre,
        objetivo=data.objetivo,
        descripcion=data.descripcion,
        nivel=data.nivel,
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine

def update_routine(db: Session, routine_id: int, data: RoutineUpdate, trainer_id: int) -> Rutina:
    routine = get_routine_by_id(db, routine_id, trainer_id)

    if data.nombre is not None:
        routine.nombre = data.nombre
    if data.objetivo is not None:
        routine.objetivo = data.objetivo
    if data.descripcion is not None:
        routine.descripcion = data.descripcion
    if data.nivel is not None:
        routine.nivel = data.nivel

    db.commit()
    db.refresh(routine)
    return routine

def delete_routine(db: Session, routine_id: int, trainer_id: int) -> None:
    routine = get_routine_by_id(db, routine_id, trainer_id)
    db.delete(routine)
    db.commit()

def duplicate_routine(db: Session, routine_id: int, trainer_id: int) -> Rutina:
    original = get_routine_by_id(db, routine_id, trainer_id)

    new_routine = Rutina(
        id_entrenador=trainer_id,
        nombre=f"{original.nombre} (copia)",
        objetivo=original.objetivo,
        descripcion=original.descripcion,
        nivel=original.nivel,
    )
    db.add(new_routine)
    db.flush()

    for block in original.blocks:
        new_block = BloqueRutina(
            id_rutina=new_routine.id_rutina,
            numero_dia=block.numero_dia,
            nombre=block.nombre,
            notas=block.notas,
        )
        db.add(new_block)
        db.flush()

        for block_exercise in block.block_exercises:
            new_block_exercise = BloqueRutinaEjercicio(
                id_bloque_rutina=new_block.id_bloque_rutina,
                id_ejercicio=block_exercise.id_ejercicio,
                orden=block_exercise.orden,
                series_plan=block_exercise.series_plan,
                reps_plan=block_exercise.reps_plan,
                descanso_seg=block_exercise.descanso_seg,
                peso_obj=block_exercise.peso_obj,
                notas=block_exercise.notas,
            )
            db.add(new_block_exercise)

    db.commit()
    db.refresh(new_routine)
    return new_routine

def archive_routine(db: Session, routine_id: int, trainer_id: int) -> Rutina:
    routine = get_routine_by_id(db, routine_id, trainer_id)

    if routine.archivado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Routine is already archived"
        )

    routine.archivado = True
    db.commit()
    db.refresh(routine)
    return routine

def unarchive_routine(db: Session, routine_id: int, trainer_id: int) -> Rutina:
    routine = get_routine_by_id(db, routine_id, trainer_id)

    if not routine.archivado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Routine is not archived"
        )

    routine.archivado = False
    db.commit()
    db.refresh(routine)
    return routine



def get_blocks(db: Session, routine_id: int, trainer_id: int) -> list[BloqueRutina]:
    get_routine_by_id(db, routine_id, trainer_id)
    return db.query(BloqueRutina).filter(
        BloqueRutina.id_rutina == routine_id
    ).order_by(BloqueRutina.numero_dia).all()

def get_block_by_id(db: Session, routine_id: int, block_id: int, trainer_id: int) -> BloqueRutina:
    get_routine_by_id(db, routine_id, trainer_id)

    block = db.query(BloqueRutina).filter(
        BloqueRutina.id_bloque_rutina == block_id,
        BloqueRutina.id_rutina == routine_id
    ).first()

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found"
        )
    return block

def create_block(db: Session, routine_id: int, data: BlockCreate, trainer_id: int) -> BloqueRutina:
    get_routine_by_id(db, routine_id, trainer_id)

    existing = db.query(BloqueRutina).filter(
        BloqueRutina.id_rutina == routine_id,
        BloqueRutina.numero_dia == data.numero_dia
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Day {data.numero_dia} already exists in this routine"
        )

    block = BloqueRutina(
        id_rutina=routine_id,
        numero_dia=data.numero_dia,
        nombre=data.nombre,
        notas=data.notas,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block

def update_block(db: Session, routine_id: int, block_id: int, data: BlockUpdate, trainer_id: int) -> BloqueRutina:
    block = get_block_by_id(db, routine_id, block_id, trainer_id)

    if data.nombre is not None:
        block.nombre = data.nombre
    if data.notas is not None:
        block.notas = data.notas

    db.commit()
    db.refresh(block)
    return block

def delete_block(db: Session, routine_id: int, block_id: int, trainer_id: int) -> None:
    block = get_block_by_id(db, routine_id, block_id, trainer_id)
    db.delete(block)
    db.commit()


def get_block_exercises(db: Session, routine_id: int, block_id: int, trainer_id: int) -> list[BloqueRutinaEjercicio]:
    get_block_by_id(db, routine_id, block_id, trainer_id)
    return db.query(BloqueRutinaEjercicio).filter(
        BloqueRutinaEjercicio.id_bloque_rutina == block_id
    ).order_by(BloqueRutinaEjercicio.orden).all()

def get_block_exercise_by_id(db: Session, routine_id: int, block_id: int, block_exercise_id: int, trainer_id: int) -> BloqueRutinaEjercicio:
    get_block_by_id(db, routine_id, block_id, trainer_id)

    block_exercise = db.query(BloqueRutinaEjercicio).filter(
        BloqueRutinaEjercicio.id_bloque_rutina_ejercicio == block_exercise_id,
        BloqueRutinaEjercicio.id_bloque_rutina == block_id
    ).first()

    if not block_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in this block"
        )
    return block_exercise

def create_block_exercise(db: Session, routine_id: int, block_id: int, data: BlockExerciseCreate, trainer_id: int) -> BloqueRutinaEjercicio:
    get_block_by_id(db, routine_id, block_id, trainer_id)

    exercise = db.query(Ejercicio).filter(
        Ejercicio.id_ejercicio == data.id_ejercicio,
        Ejercicio.id_entrenador == trainer_id
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in your catalog"
        )

    existing = db.query(BloqueRutinaEjercicio).filter(
        BloqueRutinaEjercicio.id_bloque_rutina == block_id,
        BloqueRutinaEjercicio.orden == data.orden
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order position {data.orden} is already taken in this block"
        )

    block_exercise = BloqueRutinaEjercicio(
        id_bloque_rutina=block_id,
        id_ejercicio=data.id_ejercicio,
        orden=data.orden,
        series_plan=data.series_plan,
        reps_plan=data.reps_plan,
        descanso_seg=data.descanso_seg,
        peso_obj=data.peso_obj,
        notas=data.notas,
    )
    db.add(block_exercise)
    db.commit()
    db.refresh(block_exercise)
    return block_exercise

def update_block_exercise(db: Session, routine_id: int, block_id: int, block_exercise_id: int, data: BlockExerciseUpdate, trainer_id: int) -> BloqueRutinaEjercicio:
    block_exercise = get_block_exercise_by_id(db, routine_id, block_id, block_exercise_id, trainer_id)

    if data.orden is not None:
        existing = db.query(BloqueRutinaEjercicio).filter(
            BloqueRutinaEjercicio.id_bloque_rutina == block_id,
            BloqueRutinaEjercicio.orden == data.orden,
            BloqueRutinaEjercicio.id_bloque_rutina_ejercicio != block_exercise_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order position {data.orden} is already taken in this block"
            )
        block_exercise.orden = data.orden

    if data.series_plan is not None:
        block_exercise.series_plan = data.series_plan
    if data.reps_plan is not None:
        block_exercise.reps_plan = data.reps_plan
    if data.descanso_seg is not None:
        block_exercise.descanso_seg = data.descanso_seg
    if data.peso_obj is not None:
        block_exercise.peso_obj = data.peso_obj
    if data.notas is not None:
        block_exercise.notas = data.notas

    db.commit()
    db.refresh(block_exercise)
    return block_exercise

def delete_block_exercise(db: Session, routine_id: int, block_id: int, block_exercise_id: int, trainer_id: int) -> None:
    block_exercise = get_block_exercise_by_id(db, routine_id, block_id, block_exercise_id, trainer_id)
    db.delete(block_exercise)
    db.commit()

def reorder_block_exercises(db: Session, routine_id: int, block_id: int, data: ReorderRequest, trainer_id: int) -> list[BloqueRutinaEjercicio]:
    get_block_by_id(db, routine_id, block_id, trainer_id)

    for block_exercise_id in data.ordered_ids:
        block_exercise = db.query(BloqueRutinaEjercicio).filter(
            BloqueRutinaEjercicio.id_bloque_rutina_ejercicio == block_exercise_id,
            BloqueRutinaEjercicio.id_bloque_rutina == block_id
        ).first()
        if not block_exercise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercise {block_exercise_id} not found in this block"
            )
        block_exercise.orden = -block_exercise.orden
    db.flush()

    for new_order, block_exercise_id in enumerate(data.ordered_ids, start=1):
        block_exercise = db.query(BloqueRutinaEjercicio).filter(
            BloqueRutinaEjercicio.id_bloque_rutina_ejercicio == block_exercise_id
        ).first()
        block_exercise.orden = new_order

    db.commit()
    return get_block_exercises(db, routine_id, block_id, trainer_id)