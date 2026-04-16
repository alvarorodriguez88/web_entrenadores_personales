from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class Ejercicio(Base):
    __tablename__ = "ejercicio"
    
    id_ejercicio = Column(Integer, primary_key=True, autoincrement=True)
    id_entrenador = Column(Integer, ForeignKey("entrenador.id_usuario"), nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=False)
    grupo_muscular = Column(String(50), nullable=True)
    equipamiento = Column(String(50), nullable=True)
    video_url = Column(String(255), nullable=True)
    fotos_url = Column(String(255), nullable=True)
    archivado = Column(Boolean, nullable=False, default=False)
    creado_en = Column(DateTime, nullable=False, server_default=func.now())

    trainer = relationship("Entrenador", back_populates="exercises")

    routine_block_exercises = relationship("BloqueRutinaEjercicio", back_populates="exercise")
    completed_exercises = relationship("EjercicioRealizado", back_populates="exercise")
    categories = relationship("EjercicioCategoria", back_populates="exercise")


class Categoria(Base):
    __tablename__ = "categoria"
    
    id_categoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)

    exercise_categories = relationship("EjercicioCategoria", back_populates="category")

class EjercicioCategoria(Base):
    __tablename__ = "ejercicioCategoria"

    id_ejercicio = Column(Integer, ForeignKey("ejercicio.id_ejercicio"), primary_key=True)
    id_categoria = Column(Integer, ForeignKey("categoria.id_categoria"), primary_key=True)

    exercise = relationship("Ejercicio", back_populates="categories")
    category = relationship("Categoria", back_populates="exercise_categories")

 