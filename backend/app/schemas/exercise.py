from app.schemas.multimedia import MultimediaResponse
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CategoriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_categoria: int
    nombre: str

class ExerciseCategoryCreate(BaseModel):
    id_categoria: int

class ExerciseCreate(BaseModel):
    nombre: str
    descripcion: str
    grupo_muscular: Optional[str] = None
    equipamiento: Optional[str] = None
    id_video: Optional[int] = None
    id_imagen: Optional[int] = None

class ExerciseUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    grupo_muscular: Optional[str] = None
    equipamiento: Optional[str] = None
    id_video: Optional[int] = None
    id_imagen: Optional[int] = None

class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_ejercicio: int
    id_entrenador: int
    nombre: str
    descripcion: str
    grupo_muscular: Optional[str] = None
    equipamiento: Optional[str] = None
    video: Optional[MultimediaResponse] = None
    imagen: Optional[MultimediaResponse] = None
    archivado: bool
    creado_en: datetime
    categories: list[CategoriaResponse] = []