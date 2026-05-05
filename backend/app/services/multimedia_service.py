import os
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.models.multimedia import ArchivoMultimedia
from app.models.exercise import Ejercicio


MEDIA_DIR = "/app/media"


def get_files(db: Session, trainer_id: int) -> list[ArchivoMultimedia]:
    return db.query(ArchivoMultimedia).filter(
        ArchivoMultimedia.id_entrenador == trainer_id
    ).order_by(ArchivoMultimedia.fecha_subida.desc()).all()

def get_file_by_id(db: Session, file_id: int, trainer_id: int) -> ArchivoMultimedia:
    file = db.query(ArchivoMultimedia).filter(
        ArchivoMultimedia.id_archivo == file_id,
        ArchivoMultimedia.id_entrenador == trainer_id
    ).first()

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found"
        )
    return file

def check_file_in_use(db: Session, file_id: int, trainer_id: int) -> list[str]:
    get_file_by_id(db, file_id, trainer_id)

    exercises = db.query(Ejercicio).filter(
        (Ejercicio.id_video == file_id) | (Ejercicio.id_imagen == file_id),
        Ejercicio.id_entrenador == trainer_id
    ).all()

    return [e.nombre for e in exercises]

async def upload_file(db: Session, trainer_id: int, file: UploadFile) -> ArchivoMultimedia:
    content_type = file.content_type or ""
    if content_type.startswith("video/"):
        tipo = "VIDEO"
    elif content_type.startswith("image/"):
        tipo = "IMAGEN"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image and video files are allowed"
        )

    extension = os.path.splitext(file.filename)[1].lower()
    nombre_archivo = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(MEDIA_DIR, nombre_archivo)

    contents = await file.read()
    os.makedirs(MEDIA_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(contents)

    media = ArchivoMultimedia(
        id_entrenador=trainer_id,
        nombre_original=file.filename,
        nombre_archivo=nombre_archivo,
        tipo=tipo,
        tamano_bytes=len(contents),
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media

def delete_file(db: Session, file_id: int, trainer_id: int) -> None:
    media = get_file_by_id(db, file_id, trainer_id)
    file_path = os.path.join(MEDIA_DIR, media.nombre_archivo)

    db.delete(media)
    db.commit()

    if os.path.exists(file_path):
        os.remove(file_path)