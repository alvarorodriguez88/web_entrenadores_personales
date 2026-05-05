from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional, Literal


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_usuario: int
    email: EmailStr
    nombre: str
    apellidos: str
    fecha_creacion: datetime

class TrainerUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    especialidad: Optional[str] = None
    bio: Optional[str] = None

class TrainerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserBase
    especialidad: Optional[str] = None
    bio: Optional[str] = None

class ClientUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    nivel: Optional[str] = None
    objetivo: Optional[str] = None

class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserBase
    nivel: Optional[str] = None
    objetivo: Optional[str] = None
    fecha_alta: datetime
    id_entrenador: int

class ClientCreate(BaseModel):
    nombre:    str
    apellidos: str
    email:     EmailStr
    password:  str
    nivel:     Optional[Literal["PRINCIPIANTE","INTERMEDIO","AVANZADO"]] = None
    objetivo:  Optional[Literal["PERDER_PESO","GANAR_MASA","MEJORAR_RESISTENCIA","MEJORAR_FUERZA","MANTENIMIENTO"]] = None
    peso_kg:   Optional[float] = None
    altura_cm: Optional[float] = None
    grasa_pct: Optional[float] = None

class ClientCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_cliente: int
    nombre:     str
    apellidos:  str
    email:      EmailStr