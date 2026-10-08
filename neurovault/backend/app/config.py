import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "NeuroVault"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "neurovault"
    DATABASE_URL: str = "mysql+asyncmy://root:@127.0.0.1:3306/neurovault?charset=utf8mb4"

    # JWT
    JWT_SECRET_KEY: str = "neurovault-super-secret-jwt-key-2026-production-ready"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI / LLM
    LLM_PROVIDER: str = "ollama"  # ollama | openai | mock
    LLM_MODEL: str = "qwen2.5:3b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # Embeddings
    EMBEDDING_PROVIDER: str = "ollama"  # ollama | openai | mock
    EMBEDDING_MODEL: str = "nomic-embed-text"
    EMBEDDING_DIMENSION: int = 768

    # Hybrid Retrieval Weights
    RETRIEVAL_TOP_K: int = 8
    SEMANTIC_WEIGHT: float = 0.45
    KEYWORD_WEIGHT: float = 0.20
    IMPORTANCE_WEIGHT: float = 0.15
    CONFIDENCE_WEIGHT: float = 0.10
    RECENCY_WEIGHT: float = 0.10

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
