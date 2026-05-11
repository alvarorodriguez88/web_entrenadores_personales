from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer
from app.models.user import Entrenador
from app.schemas.chat import (ChatSessionCreate, ChatSessionResponse, ChatSessionWithMessages, ChatMessageResponse, ChatMessageIn)
from app.services import chat_service


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.post("", response_model=ChatSessionResponse)
async def create_chat_session(chat_session: ChatSessionCreate, db: Session = Depends(get_db), current_trainer: Entrenador = Depends(get_current_trainer)):
    session = chat_service.create_session(db, current_trainer.id_usuario, chat_session)
    return session

@router.get("", response_model=list[ChatSessionResponse])
async def list_chat_sessions(db: Session = Depends(get_db), current_trainer: Entrenador = Depends(get_current_trainer)):
    return chat_service.get_sessions(db, current_trainer.id_usuario)

@router.get("/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(session_id: int, db: Session = Depends(get_db), current_trainer: Entrenador = Depends(get_current_trainer)):
    session = chat_service.get_session(db, session_id, current_trainer.id_usuario)
    messages = chat_service.get_messages(db, session_id, current_trainer.id_usuario)
    return ChatSessionWithMessages(
        id_chat_sesion=session.id_chat_sesion,
        titulo=session.titulo,
        fecha_creacion=session.fecha_creacion,
        fecha_updated=session.fecha_updated,
        messages=[ChatMessageResponse(
            id_chat_mensaje=m.id_chat_mensaje,
            rol=m.rol,
            content=m.content,
            fecha_creacion=m.fecha_creacion,
        ) for m in messages]
    )

@router.post("/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(session_id: int, message: ChatMessageIn, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), current_trainer: Entrenador = Depends(get_current_trainer)):
    msg = await chat_service.send_message(db=db, trainer_id=current_trainer.id_usuario, trainer_token=token, session_id=session_id, user_content=message.content)
    return ChatMessageResponse(
        id_chat_mensaje=msg.id_chat_mensaje,
        rol=msg.rol,
        content=msg.content,
        fecha_creacion=msg.fecha_creacion,
    )

@router.delete("/{session_id}")
async def delete_chat_session(session_id: int, db: Session = Depends(get_db), current_trainer: Entrenador = Depends(get_current_trainer)):
    chat_service.delete_session(db, session_id, current_trainer.id_usuario)
    return {"ok": True}
