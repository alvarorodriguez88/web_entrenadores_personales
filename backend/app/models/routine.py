from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, ForeignKey, DECIMAL, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Rutina(Base):
    __tablename__ = "rutina"

    id_rutina = Column(Integer, primary_key=True, autoincrement=True)
    id_entrenador = Column(Integer, ForeignKey("entrenador.id_usuario"), nullable=False)
    nombre = Column(String(100), nullable=False)
    objetivo = Column(String(150), nullable=True)
    descripcion = Column(String(255), nullable=True)
    nivel = Column(
        Enum("PRINCIPIANTE", "INTERMEDIO", "AVANZADO"),
        nullable=True
    )
    archivado = Column(Boolean, nullable=False, default=False)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())

    trainer = relationship("Entrenador", back_populates="routines")
    blocks = relationship("BloqueRutina", back_populates="routine", cascade="all, delete-orphan")
    assignments = relationship("AsignacionRutina", back_populates="routine")


class BloqueRutina(Base):
    __tablename__ = "bloqueRutina"

    id_bloque_rutina = Column(Integer, primary_key=True, autoincrement=True)
    id_rutina = Column(Integer, ForeignKey("rutina.id_rutina"), nullable=False)
    numero_dia = Column(Integer, nullable=False)
    nombre = Column(String(80), nullable=True)
    notas = Column(String(255), nullable=True)

    routine = relationship("Rutina", back_populates="blocks")
    block_exercises = relationship("BloqueRutinaEjercicio", back_populates="block", cascade="all, delete-orphan")
    sessions = relationship("SesionRutina", back_populates="routine_block")


class BloqueRutinaEjercicio(Base):
    __tablename__ = "bloqueRutinaEjercicio"

    id_bloque_rutina_ejercicio = Column(Integer, primary_key=True, autoincrement=True)
    id_bloque_rutina = Column(Integer, ForeignKey("bloqueRutina.id_bloque_rutina"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("ejercicio.id_ejercicio"), nullable=False)
    orden = Column(Integer, nullable=False)
    reps_plan = Column(Integer, nullable=False)
    series_plan = Column(Integer, nullable=False)
    descanso_seg = Column(SmallInteger, nullable=True)
    peso_obj = Column(DECIMAL(6, 2), nullable=True)
    notas = Column(String(255), nullable=True)

    block = relationship("BloqueRutina", back_populates="block_exercises")
    exercise = relationship("Ejercicio", back_populates="routine_block_exercises")
    customizations = relationship("AsignacionEjercicio", back_populates="block_exercise", cascade="all, delete-orphan")

    @property
    def nombre_ejercicio(self):
        return self.exercise.nombre if self.exercise else None