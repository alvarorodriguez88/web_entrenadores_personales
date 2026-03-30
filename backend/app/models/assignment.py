from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, ForeignKey, DECIMAL, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AsignacionRutina(Base):
    __tablename__ = "asignacionRutina"

    id_asignacion_rutina = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id_usuario"), nullable=False)
    id_rutina = Column(Integer, ForeignKey("rutina.id_rutina"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(
        Enum("ACTIVA", "PAUSADA", "FINALIZADA"),
        nullable=False
    )
    notas = Column(String(255), nullable=True)

    client = relationship("Cliente", back_populates="routine_assignments")
    routine = relationship("Rutina", back_populates="assignments")
    sessions = relationship("SesionRutina", back_populates="assignment", cascade="all, delete-orphan")


class SesionRutina(Base):
    __tablename__ = "sesionRutina"

    id_sesion_rutina = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacionRutina.id_asignacion_rutina"), nullable=False)
    id_bloque_rutina = Column(Integer, ForeignKey("bloqueRutina.id_bloque_rutina"), nullable=False)
    fecha_hora = Column(DateTime, nullable=True, server_default=func.now())
    duracion_min = Column(SmallInteger, nullable=True)
    esfuerzo_rpe = Column(Integer, nullable=False)
    comentario = Column(String(255), nullable=True)

    assignment = relationship("AsignacionRutina", back_populates="sessions")
    routine_block = relationship("BloqueRutina", back_populates="sessions")
    completed_exercises = relationship("EjercicioRealizado", back_populates="session", cascade="all, delete-orphan")


class EjercicioRealizado(Base):
    __tablename__ = "ejercicioRealizado"

    id_ejercicio_realizado = Column(Integer, primary_key=True, autoincrement=True)
    id_sesion = Column(Integer, ForeignKey("sesionRutina.id_sesion_rutina"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("ejercicio.id_ejercicio"), nullable=False)
    orden = Column(Integer, nullable=False)
    series_real = Column(Integer, nullable=False)
    reps_real = Column(Integer, nullable=False)
    peso_real = Column(DECIMAL(6, 2), nullable=True)
    rpe_real = Column(Integer, nullable=True)
    comentario = Column(String(255), nullable=True)

    session = relationship("SesionRutina", back_populates="completed_exercises")
    exercise = relationship("Ejercicio", back_populates="completed_exercises")