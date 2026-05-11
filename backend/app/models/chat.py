from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ChatSesion(Base):
    __tablename__ = "chat_sesion"

    id_chat_sesion = Column(Integer, primary_key=True, autoincrement=True)
    id_entrenador = Column(Integer, ForeignKey("entrenador.id_usuario"), nullable=False)
    titulo = Column(String(150), nullable=True)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_updated = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    trainer = relationship("Entrenador", back_populates="chat_sessions")
    messages = relationship("ChatMensaje", back_populates="session", cascade="all, delete-orphan")


class ChatMensaje(Base):
    __tablename__ = "chat_mensaje"

    id_chat_mensaje = Column(Integer, primary_key=True, autoincrement=True)
    id_sesion = Column(Integer, ForeignKey("chat_sesion.id_chat_sesion"), nullable=False)
    rol = Column(Enum('user', 'assistant', 'tool'), nullable=False)
    content = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())

    session = relationship("ChatSesion", back_populates="messages")