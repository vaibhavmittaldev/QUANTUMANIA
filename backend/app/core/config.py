import os
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "QUANTUMANIA"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Server & CORS
    PORT: int = int(os.getenv("PORT", "8000"))
    CLIENT_ORIGIN: str = os.getenv("CLIENT_ORIGIN", "http://localhost:3000")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    # Database (Defaults to local SQLite for zero-config local development)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    
    # Security & Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "quantumania-super-secret-jwt-key-sih-2026-phase-01")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

settings = Settings()

# Add CLIENT_ORIGIN if provided in env
if settings.CLIENT_ORIGIN and settings.CLIENT_ORIGIN not in settings.ALLOWED_ORIGINS:
    settings.ALLOWED_ORIGINS.append(settings.CLIENT_ORIGIN)
