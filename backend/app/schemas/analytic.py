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

class TodayBlockExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id_ejercicio:   int
    nombre:         str
    grupo_muscular: Optional[str] = None
    equipamiento:   Optional[str] = None
    descripcion:    Optional[str] = None
    video_url:      Optional[str] = None
    categorias:     list[str] = []
    series_plan:    int
    reps_plan:      int
    peso_obj:       Optional[float] = None
    descanso_seg:   Optional[int] = None
    notas:          Optional[str] = None
    orden:          int

class TodayWorkoutResponse(BaseModel):
    nombre_rutina:      str
    nivel_rutina:       Optional[str] = None
    objetivo_rutina:    Optional[str] = None
    descripcion_rutina: Optional[str] = None
    nombre_bloque:      Optional[str] = None
    numero_dia:         int
    notas_bloque:       Optional[str] = None
    fecha_inicio:       Optional[date] = None
    fecha_fin:          Optional[date] = None
    ejercicios:         list[TodayBlockExerciseResponse] = []

class ClientRecentActivityItemResponse(BaseModel):
    fecha_hora: datetime
    nota_rendimiento: Optional[float] = None
    conformidad: Optional[float] = None

class ClientRecentActivityResponse(BaseModel):
    actividades: list[ClientRecentActivityItemResponse]

class ExerciseDistributionItemResponse(BaseModel):
    categoria: str
    cantidad: int
    porcentaje: float

class ExerciseDistributionResponse(BaseModel):
    categorias: list[ExerciseDistributionItemResponse]