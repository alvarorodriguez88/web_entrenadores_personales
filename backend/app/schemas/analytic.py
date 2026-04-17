from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class TrainerKPIsResponse(BaseModel):
    clientes_activos: int
    clientes_activos_comparativa: int
    cumplimiento_pct: float
    cumplimiento_pct_comparativa: float
    sesiones_completadas: int
    sesiones_completadas_comparativa: int
    clientes_sin_actividad: int
    clientes_sin_actividad_comparativa: int

class AlertaClienteResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellidos: str
    tipo_alerta: str

class TrainerAlertsResponse(BaseModel):
    alertas: list[AlertaClienteResponse]

class RecentActivityItemResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellidos: str
    fecha_hora: datetime
    nombre_bloque: Optional[str] = None
    nota_rendimiento: Optional[float] = None

class PerformanceDistributionResponse(BaseModel):
    alto: int
    medio: int
    bajo: int
    inactivo: int

class ClientTableRowResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellidos: str
    cumplimiento_pct: float
    rendimiento_avg: float
    ultima_sesion: Optional[datetime] = None
    nivel: Optional[str] = None

class EvolutionPointResponse(BaseModel):
    fecha: str
    rendimiento: float
    cumplimiento: float
    conformidad: float

class EvolutionResponse(BaseModel):
    puntos: list[EvolutionPointResponse]


class ClientKPIsResponse(BaseModel):
    rendimiento_avg: float
    cumplimiento_pct: float
    conformidad_avg: float
    sesiones_completadas: int
    sesiones_completadas_comparativa: int
    cumplimiento_rutinas_pct: float

class CalendarDayResponse(BaseModel):
    fecha: date
    tiene_sesion: bool
    completada: bool

class WeeklyCalendarResponse(BaseModel):
    dias: list[CalendarDayResponse]

class TodayWorkoutResponse(BaseModel):
    nombre_bloque: Optional[str] = None
    nombre_rutina: str
    ejercicios: list[str]

class ExerciseDistributionItemResponse(BaseModel):
    categoria: str
    cantidad: int
    porcentaje: float

class ExerciseDistributionResponse(BaseModel):
    categorias: list[ExerciseDistributionItemResponse]