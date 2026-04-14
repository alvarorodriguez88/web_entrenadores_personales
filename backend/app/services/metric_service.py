from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.metric import MetricaFisica
from app.schemas.metric import PhysicalMetricCreate, PhysicalMetricUpdate
from app.services.assignment_service import _verify_client_belongs_to_trainer


def get_physical_metrics_trainer(db: Session, client_id: int, trainer_id: int) -> list[MetricaFisica]:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)
    return db.query(MetricaFisica).filter(
        MetricaFisica.id_cliente == client_id
    ).order_by(MetricaFisica.fecha_registro).all()

def get_physical_metrics_client(db: Session, client_id: int) -> list[MetricaFisica]:
    return db.query(MetricaFisica).filter(
        MetricaFisica.id_cliente == client_id
    ).order_by(MetricaFisica.fecha_registro).all()

def get_physical_metric_by_id(db: Session, client_id: int, metric_id: int, trainer_id: int) -> MetricaFisica:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)

    metric = db.query(MetricaFisica).filter(
        MetricaFisica.id_metrica == metric_id,
        MetricaFisica.id_cliente == client_id
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical metric not found"
        )
    return metric

def create_physical_metric_trainer(db: Session, client_id: int, data: PhysicalMetricCreate, trainer_id: int) -> MetricaFisica:
    _verify_client_belongs_to_trainer(db, client_id, trainer_id)

    metric = MetricaFisica(
        id_cliente=client_id,
        peso_kg=data.peso_kg,
        altura_cm=data.altura_cm,
        grasa_pct=data.grasa_pct,
        comentario=data.comentario,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

def create_physical_metric_client(db: Session, client_id: int, data: PhysicalMetricCreate) -> MetricaFisica:
    metric = MetricaFisica(
        id_cliente=client_id,
        peso_kg=data.peso_kg,
        altura_cm=data.altura_cm,
        grasa_pct=data.grasa_pct,
        comentario=data.comentario,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

def update_physical_metric(db: Session, client_id: int, metric_id: int, data: PhysicalMetricUpdate, trainer_id: int) -> MetricaFisica:
    metric = get_physical_metric_by_id(db, client_id, metric_id, trainer_id)

    if data.peso_kg is not None:
        metric.peso_kg = data.peso_kg
    if data.altura_cm is not None:
        metric.altura_cm = data.altura_cm
    if data.grasa_pct is not None:
        metric.grasa_pct = data.grasa_pct
    if data.comentario is not None:
        metric.comentario = data.comentario

    db.commit()
    db.refresh(metric)
    return metric

def delete_physical_metric(db: Session, client_id: int, metric_id: int, trainer_id: int) -> None:
    metric = get_physical_metric_by_id(db, client_id, metric_id, trainer_id)
    db.delete(metric)
    db.commit()