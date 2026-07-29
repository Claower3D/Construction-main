"""
QAZGOST AI - Health Check API

Endpoints for service health monitoring.
Pipeline: RF-DETR + SAM + Qwen2.5-VL
"""

from datetime import datetime
from typing import Dict, Any
import platform

from fastapi import APIRouter
from loguru import logger

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check — returns 200 if service is running.
    Compatible with aiVisionService.js isOnline() check.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "models": ["RF-DETR", "SAM", "Qwen2.5-VL"],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check — reports status of each AI model.
    """
    components: Dict[str, Any] = {}
    overall_status = "healthy"

    # RF-DETR
    try:
        from app.models.rfdetr import get_rfdetr
        det = get_rfdetr()
        components["rfdetr"] = {
            "status": "healthy",
            "mock_mode": det._mock_mode,
            "classes": len(det.CLASS_NAMES),
            "device": str(getattr(det, "device", "cpu")),
        }
    except Exception as exc:
        components["rfdetr"] = {"status": "unhealthy", "error": str(exc)}
        overall_status = "degraded"

    # SAM
    try:
        from app.models.sam_segmentor import get_sam
        sam = get_sam()
        components["sam"] = {
            "status": "healthy",
            "mock_mode": sam._mock_mode,
        }
    except Exception as exc:
        components["sam"] = {"status": "unhealthy", "error": str(exc)}
        overall_status = "degraded"

    # Qwen2.5-VL
    try:
        from app.models.qwen_vlm import get_qwen
        qwen = get_qwen()
        components["qwen"] = {
            "status": "healthy",
            "mode": qwen._mode,   # 'transformers' | 'ollama' | 'mock'
        }
    except Exception as exc:
        components["qwen"] = {"status": "unhealthy", "error": str(exc)}
        overall_status = "degraded"

    # GPU info (optional)
    try:
        import torch
        if torch.cuda.is_available():
            components["gpu"] = {
                "available": True,
                "name": torch.cuda.get_device_name(0),
                "memory_gb": round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1),
            }
        else:
            components["gpu"] = {"available": False}
    except ImportError:
        components["gpu"] = {"available": False, "error": "torch not installed"}

    return {
        "status": overall_status,
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "components": components,
        "system": {
            "platform": platform.system(),
            "python": platform.python_version(),
            "device": settings.get_device(),
        },
    }


@router.get("/health/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness probe — can we serve requests?"""
    try:
        from app.models.rfdetr import get_rfdetr
        get_rfdetr()
        return {"ready": True}
    except Exception as exc:
        return {"ready": False, "reason": str(exc)}


@router.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """Liveness probe — is the process alive?"""
    return {"alive": True}
