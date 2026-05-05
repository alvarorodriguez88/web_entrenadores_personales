from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.user import Usuario, Entrenador, Cliente
from app.models.metric import MetricaFisica
from app.schemas.user import TrainerUpdate, ClientUpdate, ClientCreate
from app.services.auth_service import hash_password


NIVEL_ORDER = {"PRINCIPIANTE": 1, "INTERMEDIO": 2, "AVANZADO": 3}

def get_trainer_profile(db: Session, user_id: int) -> Entrenador:
    trainer = db.query(Entrenador).options(
        joinedload(Entrenador.user)
    ).filter(
        Entrenador.id_usuario == user_id
    ).first()

    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    return trainer

def get_client_profile(db: Session, user_id: int) -> Cliente:
    client = db.query(Cliente).options(
        joinedload(Cliente.user)
    ).filter(
        Cliente.id_usuario == user_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client

def update_trainer_profile(db: Session, user_id: int, data: TrainerUpdate) -> Entrenador:
    trainer = get_trainer_profile(db, user_id)

    if data.nombre is not None:
        trainer.user.nombre = data.nombre
    if data.apellidos is not None:
        trainer.user.apellidos = data.apellidos
    if data.email is not None:
        _check_email_available(db, data.email, user_id)
        trainer.user.email = data.email
    if data.especialidad is not None:
        trainer.especialidad = data.especialidad
    if data.bio is not None:
        trainer.bio = data.bio

    db.commit()
    db.refresh(trainer)
    return trainer

def update_client_profile(db: Session, user_id: int, data: ClientUpdate) -> Cliente:
    client = get_client_profile(db, user_id)

    if data.nombre is not None:
        client.user.nombre = data.nombre
    if data.apellidos is not None:
        client.user.apellidos = data.apellidos
    if data.email is not None:
        _check_email_available(db, data.email, user_id)
        client.user.email = data.email
    if data.nivel is not None:
        client.nivel = data.nivel
    if data.objetivo is not None:
        client.objetivo = data.objetivo

    db.commit()
    db.refresh(client)
    return client

def get_client_by_id(db: Session, trainer_id: int, client_id: int) -> Cliente:
    client = db.query(Cliente).options(
        joinedload(Cliente.user)
    ).filter(
        Cliente.id_usuario == client_id,
        Cliente.id_entrenador == trainer_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

def get_trainer_clients(db: Session, trainer_id: int) -> list[Cliente]:
    clients = db.query(Cliente).options(
        joinedload(Cliente.user)
    ).filter(
        Cliente.id_entrenador == trainer_id
    ).all()
    return clients

def update_client_nivel_if_needed(client: Cliente, rutina_nivel: str) -> None:
    if rutina_nivel is None:
        return

    current_order = NIVEL_ORDER.get(client.nivel, 0)
    routine_order = NIVEL_ORDER.get(rutina_nivel, 0)

    if routine_order > current_order:
        client.nivel = rutina_nivel

def create_client_for_trainer(db: Session, trainer_id: int, data: ClientCreate) -> Cliente:
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = Usuario(
        email       = data.email,
        passwd_hash = hash_password(data.password),
        rol         = "CLIENTE",
        nombre      = data.nombre,
        apellidos   = data.apellidos,
    )
    db.add(user)
    db.flush()

    client = Cliente(
        id_usuario    = user.id_usuario,
        id_entrenador = trainer_id,
        nivel         = data.nivel,
        objetivo      = data.objetivo,
    )
    db.add(client)

    if data.peso_kg is not None:
        metric = MetricaFisica(
            id_cliente = user.id_usuario,
            peso_kg    = data.peso_kg,
            altura_cm  = data.altura_cm,
            grasa_pct  = data.grasa_pct,
        )
        db.add(metric)

    db.commit()
    db.refresh(client)
    return client

def _check_email_available(db: Session, email: str, current_user_id: int) -> None:
    existing = db.query(Usuario).filter(
        Usuario.email == email,
        Usuario.id_usuario != current_user_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )