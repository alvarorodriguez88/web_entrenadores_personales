from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MultimediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_archivo: int
    id_entrenador: int
    nombre_original: str
    nombre_archivo: str
    tipo: str
    tamano_bytes: int
    fecha_subida: datetime


class MultimediaEnUsoResponse(BaseModel):
    total: int
    ejercicios: list[str]