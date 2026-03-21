from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ExerciseCreate(BaseModel):
    nombre: str
    descripcion: str
    grupo_muscular: Optional[str] = None
    equipamiento: Optional[str] = None
    video_url: Optional[str] = None
    fotos_url: Optional[str] = None


class ExerciseUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    grupo_muscular: Optional[str] = None
    equipamiento: Optional[str] = None
    video_url: Optional[str] = None
    fotos_url: Optional[str] = None


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_ejercicio: int
    id_entrenador: int
    nombre: str
    descripcion: str
    grupo_muscular: Optional[str] = None
    equipamiento: Optional[str] = None
    video_url: Optional[str] = None
    fotos_url: Optional[str] = None
    archivado: bool
    creado_en: datetime