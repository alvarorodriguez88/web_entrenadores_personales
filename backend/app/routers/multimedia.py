from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer
from app.models.user import Entrenador
from app.schemas.multimedia import MultimediaResponse, MultimediaEnUsoResponse
from app.services import multimedia_service


router = APIRouter()


@router.get("", response_model=list[MultimediaResponse])
def get_files(trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return multimedia_service.get_files(db, trainer.id_usuario)

@router.post("/upload", response_model=MultimediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...), trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    return await multimedia_service.upload_file(db, trainer.id_usuario, file)

@router.get("/{file_id}/usage", response_model=MultimediaEnUsoResponse)
def get_file_usage(file_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    ejercicios = multimedia_service.check_file_in_use(db, file_id, trainer.id_usuario)
    return {"total": len(ejercicios), "ejercicios": ejercicios}

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: int, trainer: Entrenador = Depends(get_current_trainer), db: Session = Depends(get_db)):
    multimedia_service.delete_file(db, file_id, trainer.id_usuario)