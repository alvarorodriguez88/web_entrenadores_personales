from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Usuario, Entrenador, Cliente
from app.services.auth_service import verify_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    payload = verify_token(token)

    user = db.query(Usuario).filter(
        Usuario.id_usuario == int(payload.sub)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

def get_current_trainer(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> Entrenador:
    if current_user.rol != "ENTRENADOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can access this resource"
        )

    trainer = db.query(Entrenador).filter(
        Entrenador.id_usuario == current_user.id_usuario
    ).first()

    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    return trainer

def get_current_client(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> Cliente:
    if current_user.rol != "CLIENTE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can access this resource"
        )

    client = db.query(Cliente).filter(
        Cliente.id_usuario == current_user.id_usuario
    ).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client profile not found"
        )
    return client