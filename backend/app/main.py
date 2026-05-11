from fastapi import FastAPI
import app.models
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import auth, users, exercises, routines, assignments, metrics, analytics, multimedia, chat


MEDIA_DIR = "/app/media"
os.makedirs(MEDIA_DIR, exist_ok=True)

app = FastAPI(
    title="Web Entrenadores API",
    description="API REST para la plataforma de gestión de entrenadores personales",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(exercises.router, prefix="/api/v1/exercises", tags=["Exercises"])
app.include_router(routines.router, prefix="/api/v1/routines", tags=["Routines"])
app.include_router(assignments.router, prefix="/api/v1/assignments", tags=["Assignments"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["Metrics"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(multimedia.router, prefix="/api/v1/multimedia", tags=["Multimedia"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")