from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer, get_current_client
from app.models.user import Entrenador, Cliente
from app.schemas.routine import (
    RoutineCreate, RoutineUpdate, RoutineResponse,
    BlockCreate, BlockUpdate, BlockResponse,
    BlockExerciseCreate, BlockExerciseUpdate, BlockExerciseResponse,
    ReorderRequest, RoutineAssignmentClient
)
from app.services import routine_service


router = APIRouter()


@router.get("", response_model=list[RoutineResponse])
def get_routines(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_routines(db, trainer.id_usuario)

@router.get("/client", response_model=list[RoutineResponse])
def get_client_routines(client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return routine_service.get_client_routines(db, client.id_usuario)

@router.get("/{routine_id}", response_model=RoutineResponse)
def get_routine(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_routine_by_id(db, routine_id, trainer.id_usuario)

@router.get("/client/{routine_id}", response_model=RoutineResponse)
def get_client_routine(routine_id: int, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return routine_service.get_client_routine(db, routine_id, client.id_usuario)

@router.post("", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def create_routine(data: RoutineCreate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.create_routine(db, data, trainer.id_usuario)

@router.put("/{routine_id}", response_model=RoutineResponse)
def update_routine(routine_id: int, data: RoutineUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.update_routine(db, routine_id, data, trainer.id_usuario)

@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    routine_service.delete_routine(db, routine_id, trainer.id_usuario)

@router.post("/{routine_id}/duplicate", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def duplicate_routine(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.duplicate_routine(db, routine_id, trainer.id_usuario)

@router.patch("/{routine_id}/archive", response_model=RoutineResponse)
def archive_routine(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.archive_routine(db, routine_id, trainer.id_usuario)

@router.patch("/{routine_id}/unarchive", response_model=RoutineResponse)
def unarchive_routine(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.unarchive_routine(db, routine_id, trainer.id_usuario)

@router.get("/{routine_id}/blocks", response_model=list[BlockResponse])
def get_blocks(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_blocks(db, routine_id, trainer.id_usuario)

@router.get("/{routine_id}/blocks/{block_id}", response_model=BlockResponse)
def get_block(routine_id: int, block_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_block_by_id(db, routine_id, block_id, trainer.id_usuario)

@router.post("/{routine_id}/blocks", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
def create_block(routine_id: int, data: BlockCreate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.create_block(db, routine_id, data, trainer.id_usuario)

@router.put("/{routine_id}/blocks/{block_id}", response_model=BlockResponse)
def update_block(routine_id: int, block_id: int, data: BlockUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.update_block(db, routine_id, block_id, data, trainer.id_usuario)

@router.delete("/{routine_id}/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(routine_id: int, block_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    routine_service.delete_block(db, routine_id, block_id, trainer.id_usuario)

@router.get("/{routine_id}/blocks/{block_id}/exercises", response_model=list[BlockExerciseResponse])
def get_block_exercises(routine_id: int, block_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_block_exercises(db, routine_id, block_id, trainer.id_usuario)

@router.get("/{routine_id}/blocks/{block_id}/exercises/{block_exercise_id}", response_model=BlockExerciseResponse)
def get_block_exercise(routine_id: int, block_id: int, block_exercise_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_block_exercise_by_id(db, routine_id, block_id, block_exercise_id, trainer.id_usuario)

@router.post("/{routine_id}/blocks/{block_id}/exercises", response_model=BlockExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_block_exercise(routine_id: int, block_id: int, data: BlockExerciseCreate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.create_block_exercise(db, routine_id, block_id, data, trainer.id_usuario)

@router.put("/{routine_id}/blocks/{block_id}/exercises/{block_exercise_id}", response_model=BlockExerciseResponse)
def update_block_exercise(routine_id: int, block_id: int, block_exercise_id: int, data: BlockExerciseUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.update_block_exercise(db, routine_id, block_id, block_exercise_id, data, trainer.id_usuario)

@router.delete("/{routine_id}/blocks/{block_id}/exercises/{block_exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block_exercise(routine_id: int, block_id: int, block_exercise_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    routine_service.delete_block_exercise(db, routine_id, block_id, block_exercise_id, trainer.id_usuario)

@router.patch("/{routine_id}/blocks/{block_id}/exercises/reorder", response_model=list[BlockExerciseResponse])
def reorder_block_exercises(routine_id: int, block_id: int, data: ReorderRequest, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.reorder_block_exercises(db, routine_id, block_id, data, trainer.id_usuario)

@router.get("/{routine_id}/assignments", response_model=list[RoutineAssignmentClient])
def list_routine_assignments(routine_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return routine_service.get_routine_assignments(db, routine_id, trainer.id_usuario)