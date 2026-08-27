"""
QAZGOST AI Service - Main Application

FastAPI application for construction object detection and volume estimation.
"""

import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from loguru import logger

from app.config import settings, ensure_dirs
from app.api.v1 import analyze, health, estimates, metrics, auth
from app.api.openapi import tags_metadata, get_openapi_config


# Application lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    ensure_dirs()
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"📦 Device: {settings.get_device()}")
    logger.info(f"📚 Docs: http://{settings.HOST}:{settings.PORT}/docs")

    # --- Preload RF-DETR ---
    try:
        from app.models.rfdetr import get_rfdetr
        det = get_rfdetr()
        mode = "mock" if det._mock_mode else "real"
        logger.info(f"✅ RF-DETR loaded [{mode}] — {len(det.CLASS_NAMES)} classes")
    except Exception as e:
        logger.warning(f"⚠️  RF-DETR preload skipped: {e}")

    # --- Preload SAM ---
    try:
        from app.models.sam_segmentor import get_sam
        sam = get_sam()
        mode = "mock" if sam._mock_mode else "real"
        logger.info(f"✅ SAM loaded [{mode}]")
    except Exception as e:
        logger.warning(f"⚠️  SAM preload skipped: {e}")

    # --- Preload Grounding DINO ---
    try:
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        mode = "mock" if gdino._mock_mode else "real"
        logger.info(f"✅ GroundingDINO loaded [{mode}]")
    except Exception as e:
        logger.warning(f"⚠️  GroundingDINO preload skipped: {e}")

    # --- Preload Qwen2.5-VL ---
    try:
        from app.models.qwen_vlm import get_qwen
        qwen = get_qwen()
        logger.info(f"✅ Qwen2.5-VL loaded [mode={qwen._mode}]")
    except Exception as e:
        logger.warning(f"⚠️  Qwen preload skipped: {e}")

    # --- Preload DefectAnalyzer ---
    try:
        from app.models.defect_detector import get_defect_analyzer
        da = get_defect_analyzer()
        logger.info(f"✅ DefectAnalyzer loaded [crack+stain+rust]")
    except Exception as e:
        logger.warning(f"⚠️  DefectAnalyzer preload skipped: {e}")

    # --- Preload QazGost AI DefectNN ---
    try:
        from app.models.defect_nn import get_defect_nn
        dnn = get_defect_nn()
        mode = "NN" if dnn.is_nn_mode else "OpenCV-fallback"
        logger.info(f"✅ QazGost AI DefectNN loaded [{mode}]")
    except Exception as e:
        logger.warning(f"⚠️  DefectNN preload skipped: {e}")

    # --- Preload PriceDB ---
    try:
        from app.services.estimator import _load_price_db
        db = _load_price_db()
        total = len(db.get("works", {})) + len(db.get("materials", {})) + len(db.get("equipment", {}))
        logger.info(f"✅ PriceDB loaded [{total:,} items]")
    except Exception as e:
        logger.warning(f"⚠️  PriceDB preload skipped: {e}")

    yield

    # Shutdown
    logger.info("👋 Shutting down AI service")


# Get OpenAPI config
openapi_config = get_openapi_config()

# Create application with enhanced documentation
app = FastAPI(
    title=openapi_config["title"],
    version=openapi_config["version"],
    description=openapi_config["description"],
    contact=openapi_config["contact"],
    license_info=openapi_config["license_info"],
    terms_of_service=openapi_config["terms_of_service"],
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.3f}"
    return response


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(estimates.router, tags=["Estimates"])
app.include_router(metrics.router, tags=["Monitoring"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])

# QazGost AI Phase 2: LiDAR & Engineering
try:
    from app.api.v1.engineering import router as eng_router
    app.include_router(eng_router, tags=["LiDAR & Engineering"])
    logger.info("✅ Engineering & LiDAR API routes registered")
except ImportError as e:
    logger.warning(f"⚠️  Engineering routes not loaded: {e}")

# Prometheus metrics middleware
app.middleware("http")(metrics.metrics_middleware)


# Root endpoint
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
