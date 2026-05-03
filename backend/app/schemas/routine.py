from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from decimal import Decimal


class RoutineCreate(BaseModel):
    nombre: str
    objetivo: Optional[str] = None
    descripcion: Optional[str] = None
    nivel: Optional[str] = None

class RoutineUpdate(BaseModel):
    nombre: Optional[str] = None
    objetivo: Optional[str] = None
    descripcion: Optional[str] = None
    nivel: Optional[str] = None

class RoutineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_rutina: int
    id_entrenador: int
    nombre: str
    objetivo: Optional[str] = None
    descripcion: Optional[str] = None
    nivel: Optional[str] = None
    archivado: bool
    fecha_creacion: datetime

class BlockCreate(BaseModel):
    numero_dia: int
    nombre: Optional[str] = None
    notas: Optional[str] = None

class BlockUpdate(BaseModel):
    numero_dia: Optional[int] = None
    nombre: Optional[str] = None
    notas: Optional[str] = None

class BlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_bloque_rutina: int
    id_rutina: int
    numero_dia: int
    nombre: Optional[str] = None
    notas: Optional[str] = None

class BlockExerciseCreate(BaseModel):
    id_ejercicio: int
    orden: int
    series_plan: int
    reps_plan: int
    descanso_seg: Optional[int] = None
    peso_obj: Optional[Decimal] = None
    notas: Optional[str] = None

class BlockExerciseUpdate(BaseModel):
    orden: Optional[int] = None
    series_plan: Optional[int] = None
    reps_plan: Optional[int] = None
    descanso_seg: Optional[int] = None
    peso_obj: Optional[Decimal] = None
    notas: Optional[str] = None

class BlockExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_bloque_rutina_ejercicio: int
    id_bloque_rutina: int
    id_ejercicio: int
    nombre_ejercicio: Optional[str] = None
    orden: int
    series_plan: int
    reps_plan: int
    descanso_seg: Optional[int] = None
    peso_obj: Optional[Decimal] = None
    notas: Optional[str] = None

class ReorderRequest(BaseModel):
    ordered_ids: list[int]

class RoutineAssignmentClient(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_asignacion_rutina: int
    id_cliente: int
    nombre: str
    apellidos: str
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: str