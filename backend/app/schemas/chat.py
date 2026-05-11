from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class ChatMessageIn(BaseModel):
    content: str


class ChatSessionCreate(BaseModel):
    titulo: Optional[str] = None


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_chat_sesion: int = Field(serialization_alias="id_chat_sesion")
    titulo: Optional[str] = Field(serialization_alias="titulo")
    fecha_creacion: datetime = Field(serialization_alias="fecha_creacion")
    fecha_updated: datetime = Field(serialization_alias="fecha_updated")


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_chat_mensaje: int = Field(serialization_alias="id_chat_mensaje")
    rol: str = Field(serialization_alias="rol")
    content: str
    fecha_creacion: datetime = Field(serialization_alias="fecha_creacion")

class ChatSessionWithMessages(ChatSessionResponse):
    messages: list[ChatMessageResponse] = []