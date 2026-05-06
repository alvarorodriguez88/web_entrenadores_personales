from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ArchivoMultimedia(Base):
    __tablename__ = "archivoMultimedia"

    id_archivo      = Column(Integer, primary_key=True, autoincrement=True)
    id_entrenador   = Column(Integer, ForeignKey("entrenador.id_usuario"), nullable=False)
    nombre_original = Column(String(255), nullable=False)
    nombre_archivo  = Column(String(255), nullable=False, unique=True)
    tipo            = Column(Enum("VIDEO", "IMAGEN"), nullable=False)
    tamano_bytes    = Column(Integer, nullable=False)
    fecha_subida    = Column(DateTime, nullable=False, server_default=func.now())

    trainer = relationship("Entrenador", back_populates="media_files")