from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer, get_current_client
from app.models.user import Entrenador, Cliente
from app.schemas.assignment import (
    AssignmentCreate, AssignmentStatusUpdate, AssignmentResponse,
    SessionCreate, SessionUpdate, SessionResponse,
    ExerciseLogCreate, ExerciseLogUpdate, ExerciseLogResponse
)
from app.services import assignment_service


router = APIRouter()


@router.get("", response_model=list[AssignmentResponse])
def get_assignments(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_assignments(db, trainer.id_usuario)

@router.get("/history", response_model=list[AssignmentResponse])
def get_assignment_history(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_assignment_history(db, trainer.id_usuario)

@router.patch("/{assignment_id}/status", response_model=AssignmentResponse)
def update_assignment_status(assignment_id: int, data: AssignmentStatusUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.update_assignment_status(db, assignment_id, data, trainer.id_usuario)

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    assignment_service.delete_assignment(db, assignment_id, trainer.id_usuario)

@router.get("/clients/{client_id}", response_model=list[AssignmentResponse])
def get_client_assignments(client_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_client_assignments(db, client_id, trainer.id_usuario)

@router.get("/clients/{client_id}/history", response_model=list[AssignmentResponse])
def get_client_assignment_history(client_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_client_assignment_history(db, client_id, trainer.id_usuario)

@router.post("/clients/{client_id}", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(client_id: int, data: AssignmentCreate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.create_assignment(db, client_id, data, trainer.id_usuario)

@router.get("/{assignment_id}/sessions", response_model=list[SessionResponse])
def get_sessions(assignment_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_sessions(db, assignment_id, trainer.id_usuario, is_trainer=True)

@router.get("/{assignment_id}/sessions/{session_id}", response_model=SessionResponse)
def get_session(assignment_id: int, session_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_session_by_id(db, assignment_id, session_id, trainer.id_usuario, is_trainer=True)

@router.post("/me/{assignment_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(assignment_id: int, data: SessionCreate, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return assignment_service.create_session(db, assignment_id, data, client.id_usuario)

@router.put("/me/{assignment_id}/sessions/{session_id}", response_model=SessionResponse)
def update_session(assignment_id: int, session_id: int, data: SessionUpdate, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return assignment_service.update_session(db, assignment_id, session_id, data, client.id_usuario)

@router.delete("/me/{assignment_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(assignment_id: int, session_id: int, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    assignment_service.delete_session(db, assignment_id, session_id, client.id_usuario)

@router.get("/sessions/{session_id}/logs", response_model=list[ExerciseLogResponse])
def get_exercise_logs(session_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return assignment_service.get_exercise_logs(db, session_id, trainer.id_usuario, is_trainer=True)

@router.post("/me/sessions/{session_id}/logs", response_model=ExerciseLogResponse, status_code=status.HTTP_201_CREATED)
def create_exercise_log(session_id: int, data: ExerciseLogCreate, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return assignment_service.create_exercise_log(db, session_id, data, client.id_usuario)

@router.put("/me/logs/{log_id}", response_model=ExerciseLogResponse)
def update_exercise_log(log_id: int, data: ExerciseLogUpdate, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return assignment_service.update_exercise_log(db, log_id, data, client.id_usuario)

@router.delete("/me/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise_log(log_id: int, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    assignment_service.delete_exercise_log(db, log_id, client.id_usuario)