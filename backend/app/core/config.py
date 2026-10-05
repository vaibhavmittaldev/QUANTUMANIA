import os
from typing import List
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Settings(BaseModel):
    PROJECT_NAME: str = "QVerse"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Server & CORS
    PORT: int = int(os.getenv("PORT", "8000"))
    CLIENT_ORIGIN: str = os.getenv("CLIENT_ORIGIN", "http://localhost:3000")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    # Database (Defaults to local SQLite for zero-config local development)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    
    # Security & Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "quantumania-super-secret-jwt-key-sih-2026-phase-01")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # Phase 5: AI Quantum Tutor Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    TUTOR_MAX_HISTORY: int = int(os.getenv("TUTOR_MAX_HISTORY", "10"))
    TUTOR_TEMPERATURE: float = float(os.getenv("TUTOR_TEMPERATURE", "0.2"))

settings = Settings()

# Add CLIENT_ORIGIN if provided in env
if settings.CLIENT_ORIGIN and settings.CLIENT_ORIGIN not in settings.ALLOWED_ORIGINS:
    settings.ALLOWED_ORIGINS.append(settings.CLIENT_ORIGIN)
