from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Literal, Optional

from app.database import get_db
from app.dependencies import get_current_trainer, get_current_client
from app.models.user import Entrenador, Cliente
from app.schemas.analytic import (
    TrainerKPIsResponse, TrainerAlertsResponse, RecentActivityItemResponse,
    PerformanceDistributionResponse, ClientTableRowResponse,
    EvolutionResponse, ClientKPIsResponse, WeeklyCalendarResponse,
    TodayWorkoutResponse, ExerciseDistributionResponse
)
from app.services import analytics_service

router = APIRouter()


@router.get("/trainer/kpis", response_model=TrainerKPIsResponse)
def get_trainer_kpis(periodo: Literal["semanal", "mensual"] = "semanal", trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return analytics_service.get_trainer_kpis(db, trainer.id_usuario, periodo)

@router.get("/trainer/alerts", response_model=TrainerAlertsResponse)
def get_trainer_alerts(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    alerts = analytics_service.get_trainer_alerts(db, trainer.id_usuario)
    return {"alertas": alerts}

@router.get("/trainer/recent-activity", response_model=list[RecentActivityItemResponse])
def get_trainer_recent_activity(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return analytics_service.get_trainer_recent_activity(db, trainer.id_usuario)

@router.get("/trainer/performance-distribution", response_model=PerformanceDistributionResponse)
def get_trainer_performance_distribution(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return analytics_service.get_trainer_performance_distribution(db, trainer.id_usuario)

@router.get("/trainer/clients/table", response_model=list[ClientTableRowResponse])
def get_trainer_clients_table(periodo: Literal["semanal", "mensual"] = "semanal", trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return analytics_service.get_trainer_clients_table(db, trainer.id_usuario, periodo)

@router.get("/trainer/evolution", response_model=EvolutionResponse)
def get_trainer_evolution(periodo: Literal["semanal", "mensual"] = "semanal", trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    points = analytics_service.get_trainer_evolution(db, trainer.id_usuario, periodo)
    return {"puntos": points}

@router.get("/trainer/clients/{client_id}/evolution", response_model=EvolutionResponse)
def get_trainer_client_evolution(client_id: int, periodo: Literal["semanal", "mensual"] = "semanal", trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    points = analytics_service.get_trainer_client_evolution(db, trainer.id_usuario, client_id, periodo)
    return {"puntos": points}


@router.get("/client/kpis", response_model=ClientKPIsResponse)
def get_client_kpis(periodo: Literal["semanal", "mensual"] = "semanal", client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return analytics_service.get_client_kpis(db, client.id_usuario, periodo)

@router.get("/client/weekly-calendar", response_model=WeeklyCalendarResponse)
def get_client_weekly_calendar(client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    dias = analytics_service.get_client_weekly_calendar(db, client.id_usuario)
    return {"dias": dias}

@router.get("/client/today-workout", response_model=Optional[TodayWorkoutResponse])
def get_client_today_workout(client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    return analytics_service.get_client_today_workout(db, client.id_usuario)

@router.get("/client/evolution", response_model=EvolutionResponse)
def get_client_evolution(periodo: Literal["semanal", "mensual"] = "semanal", client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    points = analytics_service.get_client_evolution(db, client.id_usuario, periodo)
    return {"puntos": points}

@router.get("/client/exercise-distribution", response_model=ExerciseDistributionResponse)
def get_client_exercise_distribution(client: Cliente = Depends(get_current_client), db: Session = Depends(get_db)):
    categorias = analytics_service.get_client_exercise_distribution(db, client.id_usuario)
    return {"categorias": categorias}