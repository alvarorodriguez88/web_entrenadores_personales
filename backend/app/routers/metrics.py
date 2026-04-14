from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer, get_current_client
from app.models.user import Entrenador, Cliente
from app.schemas.metric import (
    PhysicalMetricCreate, PhysicalMetricUpdate, PhysicalMetricResponse
)
from app.services import metric_service


router = APIRouter()


@router.get("/clients/me", response_model=list[PhysicalMetricResponse])
def get_my_physical_metrics(current_client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return metric_service.get_physical_metrics_client(db, current_client.id_usuario)

@router.post("/clients/me", response_model=PhysicalMetricResponse, status_code=status.HTTP_201_CREATED)
def create_my_physical_metric(data: PhysicalMetricCreate, current_client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return metric_service.create_physical_metric_client(db, current_client.id_usuario, data)

@router.get("/clients/{client_id}", response_model=list[PhysicalMetricResponse])
def get_physical_metrics(client_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return metric_service.get_physical_metrics_trainer(db, client_id, trainer.id_usuario)

@router.get("/clients/{client_id}/{metric_id}", response_model=PhysicalMetricResponse)
def get_physical_metric(client_id: int, metric_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return metric_service.get_physical_metric_by_id(db, client_id, metric_id, trainer.id_usuario)

@router.post("/clients/{client_id}", response_model=PhysicalMetricResponse, status_code=status.HTTP_201_CREATED)
def create_physical_metric(client_id: int, data: PhysicalMetricCreate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return metric_service.create_physical_metric(db, client_id, data, trainer.id_usuario)

@router.put("/clients/{client_id}/{metric_id}", response_model=PhysicalMetricResponse)
def update_physical_metric(client_id: int, metric_id: int, data: PhysicalMetricUpdate, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return metric_service.update_physical_metric(db, client_id, metric_id, data, trainer.id_usuario)

@router.delete("/clients/{client_id}/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_physical_metric(client_id: int, metric_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    metric_service.delete_physical_metric(db, client_id, metric_id, trainer.id_usuario)