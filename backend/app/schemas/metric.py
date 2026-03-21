from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal

class PhysicalMetricCreate(BaseModel):
    peso_kg: Decimal
    altura_cm: Optional[Decimal] = None
    grasa_pct: Optional[Decimal] = None
    comentario: Optional[str] = None

class PhysicalMetricUpdate(BaseModel):
    peso_kg: Optional[Decimal] = None
    altura_cm: Optional[Decimal] = None
    grasa_pct: Optional[Decimal] = None
    comentario: Optional[str] = None

class PhysicalMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_metrica: int
    id_cliente: int
    fecha_registro: datetime
    peso_kg: Decimal
    altura_cm: Optional[Decimal] = None
    grasa_pct: Optional[Decimal] = None
    comentario: Optional[str] = None