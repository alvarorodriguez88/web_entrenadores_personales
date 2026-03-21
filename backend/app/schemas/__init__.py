from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ChangePasswordRequest, TokenPayload
)
from app.schemas.user import TrainerUpdate, TrainerResponse, ClientUpdate, ClientResponse
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.schemas.routine import (
    RoutineCreate, RoutineUpdate, RoutineResponse,
    BlockCreate, BlockUpdate, BlockResponse,
    BlockExerciseCreate, BlockExerciseUpdate, BlockExerciseResponse,
    ReorderRequest
)
from app.schemas.assignment import (
    AssignmentCreate, AssignmentStatusUpdate, AssignmentResponse,
    SessionCreate, SessionUpdate, SessionResponse,
    ExerciseLogCreate, ExerciseLogUpdate, ExerciseLogResponse
)
from app.schemas.metric import PhysicalMetricCreate, PhysicalMetricUpdate, PhysicalMetricResponse