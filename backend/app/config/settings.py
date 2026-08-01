from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(str(ENV_PATH), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


    # App
    APP_NAME: str = "VoyageAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/voyageai"

    # Auth
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # RAG / Documents
    UPLOAD_DIR: str = "uploads"
    CHROMA_PERSIST_DIR: str = "chroma_data"
    EMBEDDING_MODEL: str = "models/embedding-001"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200


@lru_cache
def get_settings() -> Settings:
    return Settings()
