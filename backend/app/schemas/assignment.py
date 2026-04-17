from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from decimal import Decimal


class AssignmentCreate(BaseModel):
    id_rutina: int
    fecha_inicio: date
    fecha_fin: date
    notas: Optional[str] = None

class AssignmentStatusUpdate(BaseModel):
    estado: str

class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_asignacion_rutina: int
    id_cliente: int
    id_rutina: int
    fecha_inicio: date
    fecha_fin: date
    estado: str
    notas: Optional[str] = None

class SessionCreate(BaseModel):
    id_bloque_rutina: int
    duracion_min: Optional[int] = None
    esfuerzo_rpe: int
    conformidad: Optional[int] = None
    comentario: Optional[str] = None

class SessionUpdate(BaseModel):
    duracion_min: Optional[int] = None
    esfuerzo_rpe: Optional[int] = None
    conformidad: Optional[int] = None
    nota_rendimiento: Optional[Decimal] = None
    comentario: Optional[str] = None

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_sesion_rutina: int
    id_asignacion: int
    id_bloque_rutina: int
    fecha_hora: datetime
    duracion_min: Optional[int] = None
    esfuerzo_rpe: int
    conformidad: Optional[int] = None
    nota_rendimiento: Optional[Decimal] = None
    comentario: Optional[str] = None

class ExerciseLogCreate(BaseModel):
    id_ejercicio: int
    orden: int
    series_real: int
    reps_real: int
    peso_real: Optional[Decimal] = None
    rpe_real: Optional[int] = None
    comentario: Optional[str] = None

class ExerciseLogUpdate(BaseModel):
    series_real: Optional[int] = None
    reps_real: Optional[int] = None
    peso_real: Optional[Decimal] = None
    rpe_real: Optional[int] = None
    comentario: Optional[str] = None

class ExerciseLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_ejercicio_realizado: int
    id_sesion: int
    id_ejercicio: int
    orden: int
    series_real: int
    reps_real: int
    peso_real: Optional[Decimal] = None
    rpe_real: Optional[int] = None
    comentario: Optional[str] = None

class AssignmentExerciseCreate(BaseModel):
    id_bloque_rutina_ej: int
    series_plan: Optional[int] = None
    reps_plan: Optional[int] = None
    peso_obj: Optional[Decimal] = None
    descanso_seg: Optional[int] = None
    notas: Optional[str] = None

class AssignmentExerciseUpdate(BaseModel):
    series_plan: Optional[int] = None
    reps_plan: Optional[int] = None
    peso_obj: Optional[Decimal] = None
    descanso_seg: Optional[int] = None
    notas: Optional[str] = None

class AssignmentExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_asignacion_ejercicio: int
    id_asignacion_rutina: int
    id_bloque_rutina_ej: int
    series_plan: Optional[int] = None
    reps_plan: Optional[int] = None
    peso_obj: Optional[Decimal] = None
    descanso_seg: Optional[int] = None
    notas: Optional[str] = None