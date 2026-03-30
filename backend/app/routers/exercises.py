from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer
from app.models.user import Entrenador
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.services import exercise_service


router = APIRouter()


@router.get("", response_model=list[ExerciseResponse])
def get_exercises(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return exercise_service.get_exercises(db, trainer.id_usuario)

@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(exercise_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return exercise_service.get_exercise_by_id(db, exercise_id, trainer.id_usuario)

@router.post("", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(data: ExerciseCreate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return exercise_service.create_exercise(db, data, trainer.id_usuario)

@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(exercise_id: int, data: ExerciseUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return exercise_service.update_exercise(db, exercise_id, data, trainer.id_usuario)

@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(exercise_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    exercise_service.delete_exercise(db, exercise_id, trainer.id_usuario)

@router.patch("/{exercise_id}/archive", response_model=ExerciseResponse)
def archive_exercise(exercise_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return exercise_service.archive_exercise(db, exercise_id, trainer.id_usuario)

@router.patch("/{exercise_id}/unarchive", response_model=ExerciseResponse)
def unarchive_exercise(exercise_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return exercise_service.unarchive_exercise(db, exercise_id, trainer.id_usuario)