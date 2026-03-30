from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Usuario
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ChangePasswordRequest
)
from app.services import auth_service


router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, data)
    return auth_service.login_user(db, user.email, data.password)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login_user(db, data.email, data.password)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: Usuario = Depends(get_current_user)):
    # TODO: Implementar la tabla de refresh tokens en la base de datos para invalidar el token de refresco al cerrar sesión.
    pass

@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, data.refresh_token)

@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(data: ChangePasswordRequest, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    auth_service.change_password(
        db,
        current_user.id_usuario,
        data.current_password,
        data.new_password
    )