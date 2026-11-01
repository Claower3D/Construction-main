"""
QAZGOST AI Service Configuration

Environment variables and settings management.
"""

import os
from pathlib import Path
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field

# Корень ai-service (…/ai-service), не зависит от текущего каталога процесса
BASE_DIR = Path(__file__).resolve().parent.parent


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
    
    # CORS — production origins only (dev origins via CORS_DEV=true env)
    CORS_ORIGINS: List[str] = Field(default=[
        "https://qazgost.kz",
        "https://www.qazgost.kz",
        "https://construction-api.kmp99.workers.dev",
    ])
    CORS_DEV: bool = Field(default=True)  # Set to false in production
    
    # Model paths (Updated to 2026 SOTA yo26 / YOLO11 architecture with YOLOv8 backward compatibility)
    MODEL_DIR: Path = Field(default=Path("./models"))
    YOLO_MODEL: str = Field(default="yolo26m.pt")  # base model 2026 (falls back to yolo11m.pt / yolov8m.pt)
    YOLO_CONSTRUCTION_MODEL: str = Field(default="qazgost_detector_v26.pt")  # QazGost AI trained 2026 model
    DEPTH_MODEL: str = Field(default="Intel/dpt-large")
    
    # Processing
    MAX_IMAGE_SIZE: int = Field(default=4096)  # max dimension
    MIN_IMAGE_SIZE: int = Field(default=100)    # min dimension
    DEFAULT_CONFIDENCE: float = Field(default=0.30)
    DEFECT_CONFIDENCE: float = Field(default=0.25)
    DEFAULT_IOU: float = Field(default=0.45)
    
    # Rate Limiting
    RATE_LIMIT_ANALYZE: str = Field(default="10/minute")
    RATE_LIMIT_ESTIMATES: str = Field(default="30/minute")
    RATE_LIMIT_DEFAULT: str = Field(default="60/minute")
    # In-process limiter (app/api/v1/metrics.py): запросов в минуту на клиента
    RATE_LIMIT_GENERAL_PER_MIN: int = Field(default=120)
    RATE_LIMIT_HEAVY_PER_MIN: int = Field(default=10)   # /analyze, /analyze-3d, /analyze/intent, /defect-scan
    # За Go-прокси все запросы приходят с одного IP — берём клиента из X-Forwarded-For / X-Real-IP
    TRUST_FORWARDED_FOR: bool = Field(default=True)

    # Image Validation
    ALLOWED_IMAGE_TYPES: List[str] = Field(default=["image/jpeg", "image/png", "image/webp"])
    MAX_UPLOAD_IMAGE_SIZE: int = Field(default=15 * 1024 * 1024)  # 15MB на одно изображение → 413
    MAX_IMAGE_PIXELS: int = Field(default=40_000_000)             # защита от decompression bomb → 413
    MAX_UPLOAD_AUDIO_SIZE: int = Field(default=10 * 1024 * 1024)  # 10MB для /speech/recognize

    # Defect detection (YOLO, обученная модель 6 классов)
    # DEFECT_MODEL_PATH: путь к весам или список через запятую (порядок приоритета).
    # Пусто → DEFECT_MODEL_CANDIDATES. Относительные пути — от каталога ai-service.
    DEFECT_MODEL_PATH: Optional[str] = Field(default=None)
    DEFECT_MODEL_CANDIDATES: List[str] = Field(default=[
        "models/defect_yolo26_best.pt",
        "models/defect_yolov8s_best.pt",
    ])
    # Как выбирать среди кандидатов (если DEFECT_MODEL_PATH не задан):
    #   best_map — веса с лучшим mAP50-95 на val по <веса>.meta.json (без meta — в порядке списка);
    #   first    — первый существующий файл из списка.
    DEFECT_MODEL_SELECT: str = Field(default="best_map")
    # Порог уверенности. Пусто → берётся из <веса>.meta.json (max F1 на val, scripts/eval_defects.py),
    # иначе 0.25. Параметр sensitivity запроса /defect-scan сдвигает порог относительно этого значения.
    DEFECT_CONF_THRESHOLD: Optional[float] = Field(default=None)
    DEFECT_IOU: float = Field(default=0.5)
    DEFECT_IMGSZ: Optional[int] = Field(default=None)  # пусто → imgsz, на котором обучалась модель

    # Налоги. С 01.01.2026 ставка НДС в РК — 16% (новый Налоговый кодекс РК, подписан 18.07.2025;
    # источник: https://en.tengrinews.kz/laws_initiatives/tokaev-signs-new-tax-code-with-vat-hike-to-16-and-268704)
    VAT_RATE: float = Field(default=0.16)

    # Отчёты: путь к TTF-шрифту с кириллицей (по умолчанию ищется DejaVuSans)
    PDF_FONT_PATH: Optional[str] = Field(default=None)

    # Хранилище смет (SQLite). В Docker указывать путь на томе, например /app/db/estimates.db
    ESTIMATES_DB_PATH: Optional[Path] = Field(default=None)

    # Каталог модуля photo3d (SfM). По умолчанию ../WebVersion/backend или ./photo3d
    PHOTO3D_DIR: Optional[Path] = Field(default=None)
    
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

