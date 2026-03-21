from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MetricaFisica(Base):
    __tablename__ = "metricafisica"

    id_metrica = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id_usuario"), nullable=False)
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())
    peso_kg = Column(DECIMAL(5, 2), nullable=False)
    altura_cm = Column(DECIMAL(5, 2), nullable=True)
    grasa_pct = Column(DECIMAL(5, 2), nullable=True)
    comentario = Column(String(255), nullable=True)

    client = relationship("Cliente", back_populates="physical_metrics")