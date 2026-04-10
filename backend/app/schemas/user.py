from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional


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

    user : UserBase
    especialidad: Optional[str] = None
    bio: Optional[str] = None

class ClientUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    nivel: Optional[str] = None

class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user : UserBase
    nivel: str
    fecha_alta: datetime
    id_entrenador: int