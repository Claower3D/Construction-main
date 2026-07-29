"""
QAZGOST AI Service Configuration

Environment variables and settings management.
"""

import os
from pathlib import Path
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "QAZGOST AI Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False)
    
    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8001)
    WORKERS: int = Field(default=1)
    
    # CORS — specify allowed origins (avoid "*" with credentials)
    CORS_ORIGINS: List[str] = Field(default=[
        "https://qazgost.kz",
        "https://www.qazgost.kz",
        "https://construction-api.kmp99.workers.dev",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ])
    
    # Model paths
    MODEL_DIR: Path = Field(default=Path("./models"))
    YOLO_MODEL: str = Field(default="yolov8m.pt")
    YOLO_CONSTRUCTION_MODEL: str = Field(default="yolov8_construction.pt")
    DEPTH_MODEL: str = Field(default="Intel/dpt-large")
    
    # Processing
    MAX_IMAGE_SIZE: int = Field(default=4096)  # max dimension
    DEFAULT_CONFIDENCE: float = Field(default=0.25)
    DEFAULT_IOU: float = Field(default=0.45)
    
    # Device
    DEVICE: str = Field(default="auto")  # "auto", "cuda", "cpu"
    HALF_PRECISION: bool = Field(default=True)  # FP16 on GPU
    
    # LLM Integration
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    LLM_MODEL: str = Field(default="gpt-4-turbo-preview")
    
    # Ollama (Qwen2.5-VL backend)
    OLLAMA_HOST: str = Field(default="http://localhost:11434")
    QWEN_MODEL: str = Field(default="qwen2.5vl:7b")
    OLLAMA_NUM_PARALLEL: int = Field(default=2)
    OLLAMA_MAX_LOADED_MODELS: int = Field(default=2)
    OLLAMA_PORT: int = Field(default=11434)

    # Docker / Ports
    AI_PORT: int = Field(default=8001)

    # Telegram Auth
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(default=None)
    TELEGRAM_BOT_NAME: str = Field(default="QazGostBot")

    # Bot URLs
    AI_SERVICE_URL: str = Field(default="http://localhost:8001")
    BACKEND_URL: str = Field(default="http://localhost:3001")
    WEB_APP_URL: str = Field(default="https://qazgost.kz")
    BOT_API_KEY: Optional[str] = Field(default=None)

    # JWT Authentication
    JWT_SECRET: Optional[str] = Field(default=None)
    JWT_ACCESS_EXPIRY: int = Field(default=3600)      # 1 hour
    JWT_REFRESH_EXPIRY: int = Field(default=604800)    # 7 days

    # Firebase (for custom token generation)
    FIREBASE_SERVICE_ACCOUNT: Optional[str] = Field(default=None)
    
    # Storage
    UPLOAD_DIR: Path = Field(default=Path("./uploads"))
    RESULTS_DIR: Path = Field(default=Path("./results"))
    MAX_UPLOAD_SIZE: int = Field(default=50 * 1024 * 1024)  # 50MB
    
    # Cache
    ENABLE_CACHE: bool = Field(default=True)
    CACHE_TTL: int = Field(default=3600)  # 1 hour
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    
    # Dataset
    DATASET_PATH: Path = Field(default=Path("./data"))
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Don't crash on unknown .env variables
    
    def get_model_path(self, model_name: str) -> Path:
        """Get full path to a model file."""
        return self.MODEL_DIR / model_name
    
    def get_device(self) -> str:
        """Determine the best available device."""
        if self.DEVICE != "auto":
            return self.DEVICE
        
        try:
            import torch
            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return "mps"  # Apple Silicon
            else:
                return "cpu"
        except ImportError:
            return "cpu"


# Global settings instance
settings = Settings()

# Flag to track directory initialization
_dirs_ensured = False


def ensure_dirs():
    """Create required directories if they don't exist.
    
    Call this explicitly during application startup (not on import)
    to avoid side effects during testing and module loading.
    """
    global _dirs_ensured
    if _dirs_ensured:
        return
    
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    _dirs_ensured = True

