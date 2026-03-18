from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=False, unique=True)
    passwd_hash = Column(String(255), nullable=False)
    rol = Column(Enum("ENTRENADOR", "CLIENTE"), nullable=False)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    nombre = Column(String(45), nullable=False)
    apellidos = Column(String(80), nullable=False)

    trainer = relationship("Entrenador", back_populates="user", uselist=False)
    client = relationship("Cliente", back_populates="user", uselist=False)


class Entrenador(Base):
    __tablename__ = "entrenador"

    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), primary_key=True)
    especialidad = Column(String(80), nullable=True)
    bio = Column(String(255), nullable=True)

    user = relationship("Usuario", back_populates="trainer")
    clients = relationship("Cliente", back_populates="trainer")
    routines = relationship("Rutina", back_populates="trainer")
    exercises = relationship("Ejercicio", back_populates="trainer")


class Cliente(Base):
    __tablename__ = "cliente"

    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), primary_key=True)
    id_entrenador = Column(Integer, ForeignKey("entrenador.id_usuario"), nullable=False)
    fecha_alta = Column(DateTime, nullable=False, server_default=func.now())
    nivel = Column(
        Enum("PRINCIPIANTE", "INTERMEDIO", "AVANZADO"),
        nullable=False
    )

    user = relationship("Usuario", back_populates="client")
    trainer = relationship("Entrenador", back_populates="clients")
    physical_metrics = relationship("MetricaFisica", back_populates="client")
    routine_assignments = relationship("AsignacionRutina", back_populates="client")