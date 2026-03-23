# Import all services here for easy access from other modules
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    verify_token, register_user, login_user,
    refresh_access_token, change_password
)
from app.services.user_service import (
    get_trainer_profile, get_client_profile,
    update_trainer_profile, update_client_profile
)
from app.services.exercise_service import (
    get_exercises, get_exercise_by_id,
    create_exercise, update_exercise, delete_exercise,
    archive_exercise, unarchive_exercise
)
from app.services.routine_service import (
    get_routines, get_routine_by_id,
    create_routine, update_routine, delete_routine,
    duplicate_routine, archive_routine, unarchive_routine,
    get_blocks, get_block_by_id,
    create_block, update_block, delete_block, reorder_blocks,
    get_block_exercises, get_block_exercise_by_id,
    create_block_exercise, update_block_exercise,
    delete_block_exercise, reorder_block_exercises
)
from app.services.assignment_service import (
    get_assignments, get_assignment_history,
    get_client_assignments, get_client_assignment_history,
    get_assignment_by_id, create_assignment,
    update_assignment_status, delete_assignment,
    get_sessions, get_session_by_id,
    create_session, update_session, delete_session,
    get_exercise_logs, get_exercise_log_by_id,
    get_client_exercise_logs, create_exercise_log,
    update_exercise_log, delete_exercise_log
)
from app.services.metric_service import (
    get_physical_metrics, get_physical_metric_by_id,
    create_physical_metric, update_physical_metric,
    delete_physical_metric
)