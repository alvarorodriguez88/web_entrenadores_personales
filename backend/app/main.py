from fastapi import FastAPI
import app.models
 
app = FastAPI(
    title="Web Entrenadores API",
    description="API REST para la plataforma de gestión de entrenadores personales",
    version="1.0.0",
)
 
 
@app.get("/health")
def health_check():
    """Endpoint para verificar que la API está funcionando."""
    return {"status": "ok"}