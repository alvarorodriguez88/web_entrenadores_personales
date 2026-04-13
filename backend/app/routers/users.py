from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer, get_current_client
from app.models.user import Entrenador, Cliente
from app.schemas.user import (
    TrainerUpdate, TrainerResponse,
    ClientUpdate, ClientResponse
)
from app.services import user_service


router = APIRouter()


@router.get("/trainers/me", response_model=TrainerResponse)
def get_trainer_profile(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return user_service.get_trainer_profile(db, trainer.id_usuario)

@router.put("/trainers/me", response_model=TrainerResponse)
def update_trainer_profile(data: TrainerUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return user_service.update_trainer_profile(db, trainer.id_usuario, data)

@router.get("/clients/me", response_model=ClientResponse)
def get_client_profile(client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return user_service.get_client_profile(db, client.id_usuario)

@router.put("/clients/me", response_model=ClientResponse)
def update_client_profile(data: ClientUpdate, client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return user_service.update_client_profile(db, client.id_usuario, data)

@router.get("/clients/{id_client}", response_model=ClientResponse)
def get_client_by_id(id_client: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return user_service.get_client_by_id(db, trainer.id_usuario, id_client)