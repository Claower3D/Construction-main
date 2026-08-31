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

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    SLOWAPI_AVAILABLE = True
except ImportError:
    SLOWAPI_AVAILABLE = False
    logger.warning("slowapi not installed — rate limiting disabled")

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

    # --- Parallel model preloading (ThreadPool for ~5x faster startup) ---
    import concurrent.futures

    def _load_rfdetr():
        from app.models.rfdetr import get_rfdetr
        det = get_rfdetr()
        mode = "mock" if det._mock_mode else "real"
        logger.info(f"✅ RF-DETR loaded [{mode}] — {len(det.CLASS_NAMES)} classes")

    def _load_sam():
        from app.models.sam_segmentor import get_sam
        sam = get_sam()
        mode = "mock" if sam._mock_mode else "real"
        logger.info(f"✅ SAM loaded [{mode}]")

    def _load_gdino():
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        mode = "mock" if gdino._mock_mode else "real"
        logger.info(f"✅ GroundingDINO loaded [{mode}]")

    def _load_qwen():
        from app.models.qwen_vlm import get_qwen
        qwen = get_qwen()
        logger.info(f"✅ Qwen2.5-VL loaded [mode={qwen._mode}]")

    def _load_defect():
        from app.models.defect_detector import get_defect_analyzer
        da = get_defect_analyzer()
        logger.info(f"✅ DefectAnalyzer loaded [crack+stain+rust]")

    def _load_defect_nn():
        from app.models.defect_nn import get_defect_nn
        dnn = get_defect_nn()
        mode = "NN" if dnn.is_nn_mode else "OpenCV-fallback"
        logger.info(f"✅ QazGost AI DefectNN loaded [{mode}]")

    def _load_pricedb():
        from app.services.estimator import _load_price_db
        db = _load_price_db()
        total = len(db.get("works", {})) + len(db.get("materials", {})) + len(db.get("equipment", {}))
        logger.info(f"✅ PriceDB loaded [{total:,} items]")

    loaders = [_load_rfdetr, _load_sam, _load_gdino, _load_qwen, _load_defect, _load_defect_nn, _load_pricedb]

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fn): fn.__name__ for fn in loaders}
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                future.result()
            except Exception as e:
                logger.warning(f"⚠️  {name} preload skipped: {e}")

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

# Rate limiting setup
if SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info(f"Rate limiting enabled: analyze={settings.RATE_LIMIT_ANALYZE}, estimates={settings.RATE_LIMIT_ESTIMATES}")
else:
    limiter = None

# CORS middleware
cors_origins = list(settings.CORS_ORIGINS)
if settings.CORS_DEV:
    cors_origins.extend([
        "http://localhost:3000", "http://localhost:5173",
        "http://localhost:8080", "http://127.0.0.1:5500",
    ])

# Production-safe CORS: explicit methods and headers instead of wildcard
allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
allowed_headers = ["Content-Type", "Authorization", "X-Request-ID", "X-API-Key"]
if settings.CORS_DEV:
    allowed_methods = ["*"]
    allowed_headers = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=allowed_methods,
    allow_headers=allowed_headers,
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
