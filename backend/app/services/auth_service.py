from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import Usuario, Entrenador
from app.schemas.auth import RegisterRequest, TokenPayload



def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: int, rol: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "rol": rol,
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return TokenPayload.model_validate(payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )



def register_user(db: Session, data: RegisterRequest) -> Usuario:
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = Usuario(
        email=data.email,
        passwd_hash=hash_password(data.password),
        rol=data.rol,
        nombre=data.nombre,
        apellidos=data.apellidos
    )
    db.add(user)
    db.flush()

    if data.rol == "ENTRENADOR":
        profile = Entrenador(id_usuario=user.id_usuario)
        db.add(profile)
    elif data.rol == "CLIENTE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clients cannot self-register. They must be invited by a trainer."
        )

    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, email: str, password: str) -> dict:
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user or not verify_password(password, user.passwd_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(user.id_usuario, user.rol)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


def change_password(db: Session, user_id: int, current_password: str, new_password: str) -> None:
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(current_password, user.passwd_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    user.passwd_hash = hash_password(new_password)
    db.commit()