from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.exercise import Ejercicio
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate


def get_exercises(db: Session, trainer_id: int) -> list[Ejercicio]:
    return db.query(Ejercicio).filter(
        Ejercicio.id_entrenador == trainer_id
    ).all()

def get_exercise_by_id(db: Session, exercise_id: int, trainer_id: int) -> Ejercicio:
    exercise = db.query(Ejercicio).filter(
        Ejercicio.id_ejercicio == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )
    return exercise

def create_exercise(db: Session, data: ExerciseCreate, trainer_id: int) -> Ejercicio:
    existing = db.query(Ejercicio).filter(
        Ejercicio.id_entrenador == trainer_id,
        Ejercicio.nombre == data.nombre
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an exercise with this name"
        )

    exercise = Ejercicio(
        id_entrenador=trainer_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        grupo_muscular=data.grupo_muscular,
        equipamiento=data.equipamiento,
        video_url=data.video_url,
        fotos_url=data.fotos_url,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise

def update_exercise(db: Session, exercise_id: int, data: ExerciseUpdate, trainer_id: int) -> Ejercicio:
    exercise = get_exercise_by_id(db, exercise_id, trainer_id)

    if data.nombre is not None:
        existing = db.query(Ejercicio).filter(
            Ejercicio.id_entrenador == trainer_id,
            Ejercicio.nombre == data.nombre,
            Ejercicio.id_ejercicio != exercise_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an exercise with this name"
            )
        exercise.nombre = data.nombre

    if data.descripcion is not None:
        exercise.descripcion = data.descripcion
    if data.grupo_muscular is not None:
        exercise.grupo_muscular = data.grupo_muscular
    if data.equipamiento is not None:
        exercise.equipamiento = data.equipamiento
    if data.video_url is not None:
        exercise.video_url = data.video_url
    if data.fotos_url is not None:
        exercise.fotos_url = data.fotos_url

    db.commit()
    db.refresh(exercise)
    return exercise

def delete_exercise(db: Session, exercise_id: int, trainer_id: int) -> None:
    exercise = get_exercise_by_id(db, exercise_id, trainer_id)
    db.delete(exercise)
    db.commit()

def archive_exercise(db: Session, exercise_id: int, trainer_id: int) -> Ejercicio:
    exercise = get_exercise_by_id(db, exercise_id, trainer_id)

    if exercise.archivado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise is already archived"
        )

    exercise.archivado = True
    db.commit()
    db.refresh(exercise)
    return exercise

def unarchive_exercise(db: Session, exercise_id: int, trainer_id: int) -> Ejercicio:
    exercise = get_exercise_by_id(db, exercise_id, trainer_id)

    if not exercise.archivado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise is not archived"
        )

    exercise.archivado = False
    db.commit()
    db.refresh(exercise)
    return exercise