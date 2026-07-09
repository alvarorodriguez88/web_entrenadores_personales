from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int = 3306
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
 
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    OLLAMA_URL: str = "http://ollama:11434/v1/chat/completions"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    MCP_URL: str = "http://mcp:8000/mcp"

    class Config:
        env_file = ".env"

settings = Settings()