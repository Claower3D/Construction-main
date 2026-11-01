"""
QAZGOST AI - Image Analysis API

Main endpoint for construction object detection and analysis.
Pipeline: RF-DETR → SAM → Qwen2.5-VL → AutoEstimator
"""

import io
import base64
import time
from typing import Optional, List, Dict, Any
import numpy as np

from fastapi import APIRouter, File, UploadFile, Query, HTTPException, Depends, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from PIL import Image
from loguru import logger

from app.config import settings
from app.services.pipeline import create_pipeline
from app.models.rfdetr import get_rfdetr  # for /detect and /classes
from app.services.estimator import search_items, get_price, _load_price_db
from app.api.v1.jwt_auth import get_current_user, get_optional_user
from app.api.uploads import (
    read_upload_limited, decode_image_with_size, read_image_upload, read_image_upload_with_size,
)

try:
    from app.services.photo3d_service import get_photo3d_service
    PHOTO3D_AVAILABLE = True
except ImportError:
    PHOTO3D_AVAILABLE = False


router = APIRouter()


# ===== SCHEMAS =====

class DetectionResult(BaseModel):
    """Single detected object."""
    class_id: int
    class_name: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    center: List[int]  # [x, y]
    width_px: int
    height_px: int
    area_px: float
    
    # Measurements (if scale calibrated)
    width_m: Optional[float] = None
    height_m: Optional[float] = None
    depth_m: Optional[float] = None
    area_m2: Optional[float] = None
    volume_m3: Optional[float] = None


class EstimateItem(BaseModel):
    """Single estimate line item."""
    work_code: str
    work_name: str
    unit: str
    quantity: float
    unit_price: float
    total_price: float
    confidence: float


class AnalysisResponse(BaseModel):
    """Full analysis response v3.0 — IntentContract for server-first architecture."""
    success: bool
    image_id: str

    # Image info
    image_width: int
    image_height: int

    # Intent (NEW v3.0)
    intent: Optional[Dict[str, Any]] = None

    # Detections
    detected_objects: List[DetectionResult]
    object_count: int
    detection_sources: Optional[Dict[str, int]] = None
    confidence_histogram: Optional[Dict[str, Any]] = None

    # Defects
    defects: Optional[Dict[str, Any]] = None
    defect_repair_cost_factor: Optional[float] = None
    defect_repair_items: Optional[List[Dict]] = None
    defect_repair_total: Optional[float] = None

    # Scale calibration
    scale_calibrated: bool
    scale_factor: Optional[float] = None
    scale_method: Optional[str] = None
    scale_confidence: Optional[float] = None
    reference_object: Optional[str] = None
    needs_scale: Optional[bool] = None

    # Measurements
    measurements: Optional[Dict[str, Any]] = None

    # Qwen2.5-VL structured result
    qwen_result: Optional[Dict[str, Any]] = None

    # Auto-estimation
    estimate_items: Optional[List[Dict[str, Any]]] = None
    estimate_total: Optional[float] = None
    estimate_confidence: Optional[float] = None
    price_db_stats: Optional[Dict[str, Any]] = None

    # Plan (NEW v3.0)
    plan: Optional[Dict[str, Any]] = None

    # Scenarios (NEW v3.0)
    scenarios: Optional[Dict[str, Any]] = None

    # Session Status (NEW v3.0)
    sessionStatus: Optional[str] = None
    accuracy: Optional[Dict[str, Any]] = None
    nextActions: Optional[List[Dict[str, Any]]] = None
    questions: Optional[List[Dict[str, Any]]] = None

    # Performance
    processing_time_ms: int
    step_timings: Optional[Dict[str, Any]] = None
    pipeline_version: Optional[str] = None

    # Warnings
    warnings: List[str] = []


# ===== ENDPOINTS =====

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    user: dict = Depends(get_current_user),
    reference_object: Optional[str] = Query(
        None,
        description="Reference object type for scale: 'person', 'measuring_tape', 'excavator_bucket'"
    ),
    reference_size: Optional[float] = Query(
        None,
        description="Known size of reference object in meters"
    ),
    calculate_depth: bool = Query(
        True,
        description="Calculate depth map"
    ),
    generate_estimate: bool = Query(
        True,
        description="Generate automatic estimate"
    ),
    confidence: float = Query(
        0.25,
        ge=0.1,
        le=0.95,
        description="Detection confidence threshold"
    ),
    region: str = Query(
        "almaty",
        description="Region for pricing (affects coefficients)"
    ),
    custom_text_prompt: Optional[str] = Query(
        None,
        description="User description of the object (for Qwen VLM context)"
    ),
    category: Optional[str] = Query(
        None,
        description="Work category hint (e.g. 'interior', 'foundation')"
    ),
) -> Dict[str, Any]:
    """
    Analyze construction photo — Server-First IntentContract (v3.0).
    
    Returns full IntentContract JSON with:
    - intent, plan, scenarios, sessionStatus, accuracy, nextActions, questions
    - detected_objects, defects, scale, measurements, estimate
    
    This endpoint performs:
    1. Object detection (RF-DETR + GroundingDINO)
    2. Segmentation (SAM)
    3. Scale calibration
    4. Visual analysis (Qwen2.5-VL)
    5. Defect detection
    6. Cost estimation (AutoEstimator)
    7. Construction planning (Planner)
    8. Scenario generation (Economy/Standard/Premium)
    9. Intent + session status + accuracy
    """
    # Log authenticated user
    logger.info(f"📸 Analyze request from user={user.get('uid', '?')} ({user.get('name', '')})")

    # Read with size limit (413), decode with format/pixel checks (400/413/415)
    contents = await read_upload_limited(file, settings.MAX_UPLOAD_IMAGE_SIZE, what="Изображение")
    pil_img, (w, h) = decode_image_with_size(contents, max_side=settings.MAX_IMAGE_SIZE)
    if min(h, w) < settings.MIN_IMAGE_SIZE:
        raise HTTPException(
            400, f"Image too small ({w}x{h}). Minimum dimension: {settings.MIN_IMAGE_SIZE}px"
        )
    logger.info(f"Image validated: {w}x{h}, {len(contents)//1024}KB")
    image_np = np.array(pil_img)

    # ── Run full pipeline v3.0 (CPU/GPU heavy → threadpool, не блокируем event loop) ──
    pipeline = create_pipeline(region=region)
    result = await run_in_threadpool(
        pipeline.run,
        image=image_np,
        confidence=confidence,
        reference_object=reference_object,
        reference_size_m=reference_size,
        generate_estimate=generate_estimate,
        calculate_depth=calculate_depth,
        custom_text_prompt=custom_text_prompt,
    )

    # Inject annotated defect image if defects were found
    from app.services.defect_visualizer import annotate_defects_pil, image_to_base64, get_severity
    
    defects_data = result.get("defects", {})
    defect_items = defects_data.get("items", defects_data.get("detections", []))
    
    if defect_items and len(defect_items) > 0:
        try:
            # Build defect list for visualizer
            vis_defects = []
            for d in defect_items:
                vis_defects.append({
                    "bbox": d.get("bbox", d.get("bounding_box", [0, 0, 50, 50])),
                    "type": d.get("type", d.get("class_name", d.get("defect_type", "defect"))),
                    "confidence": d.get("confidence", d.get("score", 0.5)),
                    "severity": d.get("severity", "medium"),
                    "description": d.get("description", ""),
                })
            
            annotated = annotate_defects_pil(image_np, vis_defects)
            result["defect_annotated_image"] = image_to_base64(annotated)
            
            # Add severity summary
            severity_counts = {}
            for vd in vis_defects:
                sev = vd.get("severity", get_severity(vd["type"]))
                severity_counts[sev] = severity_counts.get(sev, 0) + 1
            
            result["defect_severity_summary"] = {
                "total": len(vis_defects),
                "by_severity": severity_counts,
                "max_severity": max(severity_counts.keys(), 
                    key=lambda s: {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}.get(s, 0)),
            }
            
            logger.info(f"[Visualizer] Annotated {len(vis_defects)} defects on image")
        except Exception as exc:
            logger.warning(f"[Visualizer] Failed to annotate: {exc}")
    
    return result


@router.post("/analyze/intent")
async def analyze_intent(request: Request) -> Dict[str, Any]:
    """
    Упрощённый анализ для Telegram-бота (app/bot.py): фото + описание → объекты и смета.

    multipart/form-data: file (фото), description, category, region.
    JSON без фото → 422: текстовый расчёт бот выполняет локально (_fallback_estimate).
    Ответ в формате, который ожидает bot._format_estimate_result().
    """
    ctype = request.headers.get("content-type", "")
    upload = None
    if ctype.startswith("multipart/form-data"):
        form = await request.form()
        upload = form.get("file")
        description = str(form.get("description") or "")[:500]
        region = str(form.get("region") or "almaty")[:40]
        category = str(form.get("category") or "")[:40]
    else:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(400, "Ожидается multipart/form-data с полем file или JSON")
        if not isinstance(body, dict):
            raise HTTPException(400, "Ожидается JSON-объект")
        description = str(body.get("description") or "")[:500]
        region = str(body.get("region") or "almaty")[:40]
        category = str(body.get("category") or "")[:40]

    if upload is None or not hasattr(upload, "read"):
        raise HTTPException(
            422, "Для AI-анализа нужно фото (multipart, поле file). Расчёт по тексту выполняется без AI-сервиса."
        )

    image_np = await read_image_upload(upload, max_side=settings.MAX_IMAGE_SIZE)
    pipeline = create_pipeline(region=region)
    result = await run_in_threadpool(
        pipeline.run, image=image_np, calculate_depth=False, custom_text_prompt=description or None,
    )

    items = []
    for it in result.get("estimate_items") or []:
        items.append({
            "name": it.get("work_name") or it.get("name") or it.get("work_code", ""),
            "category": it.get("category") or ("material" if it.get("type") == "material" else "work"),
            "total": float(it.get("total_price") or it.get("total") or 0),
        })
    return {
        "success": True,
        "is_mock": bool(result.get("is_mock")),
        "category": category,
        "region": region,
        "detections": [
            {"label": d.get("class_name"), "confidence": d.get("confidence", 0)}
            for d in (result.get("detected_objects") or [])
        ],
        "estimate_items": items,
        "estimate_total": float(result.get("estimate_total") or 0),
        "confidence": float(result.get("estimate_confidence") or 0),
        "warnings": result.get("warnings", []),
    }


@router.post("/defect-scan")
async def defect_scan(
    file: UploadFile = File(..., description="Photo to scan for defects"),
    sensitivity: float = Query(
        0.65, ge=0.1, le=1.0,
        description="Чувствительность 0.1…1.0: 0.5–0.65 = откалиброванный порог модели, выше — больше находок",
    ),
    prompt: Optional[str] = Query(None, max_length=500, description="Подсказка (используется только внешним детектором Roboflow)"),
) -> Dict[str, Any]:
    """
    Сканирование фото на строительные дефекты.

    Детекторы: обученная YOLO-модель (основной) → Roboflow (если YOLO недоступна и задан ключ)
    → эвристический CV-сканер (fallback). Ответ содержит аннотированное изображение,
    список дефектов (bbox в пикселях исходного фото), метод устранения и оценку стоимости.
    """
    from app.services.defect_scan import run_defect_scan

    image_np, orig_size = await read_image_upload_with_size(file, max_side=1600)
    return await run_in_threadpool(run_defect_scan, image_np, orig_size, sensitivity, prompt)


@router.post("/detect")
async def detect_only(
    file: UploadFile = File(...),
    confidence: float = Query(0.25, ge=0.1, le=0.95),
    classes: Optional[str] = Query(None, description="Comma-separated class names to filter")
) -> Dict[str, Any]:
    """
    Simple detection endpoint without depth/estimation.
    
    Faster than full analysis, returns only bounding boxes.
    """
    start_time = time.time()

    image_np = await read_image_upload(file, max_side=settings.MAX_IMAGE_SIZE)

    # Run RF-DETR detection (fast path — no SAM/Qwen)
    detector = get_rfdetr()
    detections = await run_in_threadpool(detector.detect, image_np, confidence=confidence)
    objects = [d.to_dict() for d in detections]
    if classes:
        wanted = {c.strip() for c in classes.split(",") if c.strip()}
        objects = [o for o in objects if o.get("class_name") in wanted]

    is_mock = bool(getattr(detector, "_mock_mode", False))
    resp: Dict[str, Any] = {
        "success": True,
        "is_mock": is_mock,
        "objects": objects,
        "count": len(objects),
        "processing_time_ms": int((time.time() - start_time) * 1000),
    }
    if is_mock:
        for o in objects:
            o["mock"] = True
        resp["warnings"] = [
            "ДЕМО-РЕЖИМ: детектор RF-DETR не загружен — объекты сгенерированы заглушкой и не отражают фото."
        ]
    return resp


@router.get("/classes")
async def list_classes() -> Dict[str, Any]:
    """
    List all supported object classes.
    """
    detector = get_rfdetr()

    return {
        "classes": [
            {"id": i, "name": name}
            for i, name in enumerate(detector.CLASS_NAMES)
        ],
        "total": len(detector.CLASS_NAMES),
        "reference_classes": list(detector.REFERENCE_CLASSES),
        "models": ["RF-DETR", "SAM", "Qwen2.5-VL", "GroundingDINO", "Photo3D-SfM"],
    }


@router.post("/analyze-3d")
async def analyze_3d(
    files: List[UploadFile] = File(
        ...,
        description="3-10 photos of construction object from different angles"
    ),
    scale_hint: Optional[float] = Query(
        None, gt=0, le=10,
        description="Known scale factor (meters/pixel). If not provided, ArUco detection or heuristic is used."
    ),
    marker_size_m: Optional[float] = Query(
        0.15, gt=0, le=5,
        description="ArUco marker side length in meters (default 15cm)"
    ),
) -> Dict[str, Any]:
    """
    Multi-photo 3D analysis via Structure-from-Motion.
    Upload 3-10 photos taken from different angles around a construction object.
    """
    start_time = time.time()

    if not PHOTO3D_AVAILABLE:
        raise HTTPException(503, "Photo3D service is not available")

    if len(files) < 2:
        raise HTTPException(400, "At least 2 photos required for 3D reconstruction (recommended 3-10)")

    if len(files) > 15:
        raise HTTPException(400, "Maximum 15 photos allowed")

    # Read and decode images (each with size / pixel limits)
    images = []
    warnings = []
    for i, f in enumerate(files):
        try:
            images.append(await read_image_upload(f, max_side=1600))
        except HTTPException as exc:
            if exc.status_code == 413:
                raise
            warnings.append(f"File {i} ({f.filename}): skipped — {exc.detail}")

    if len(images) < 2:
        raise HTTPException(400, f"Need at least 2 valid images, got {len(images)}")

    logger.info(f"[API] analyze-3d: {len(images)} valid photos received")

    # Run SfM pipeline (heavy → threadpool)
    service = get_photo3d_service()
    result = await run_in_threadpool(service.analyze_images, images, scale_hint=scale_hint)

    processing_time = int((time.time() - start_time) * 1000)

    result["processing_time_ms"] = processing_time
    result["num_images_received"] = len(images)
    result["is_mock"] = result.get("method") == "mock"
    if result["is_mock"]:
        warnings.insert(0, "ДЕМО-РЕЖИМ: модуль photo3d недоступен — размеры сгенерированы заглушкой и не отражают фото.")
    if warnings:
        result.setdefault("warnings", []).extend(warnings)

    logger.info(
        f"[API] analyze-3d complete: "
        f"area={result.get('area_m2', 0):.2f}m², "
        f"height={result.get('height_m', 0):.2f}m, "
        f"confidence={result.get('confidence', 0):.2f}, "
        f"time={processing_time}ms"
    )

    return result


# ===== PRICE DATABASE ENDPOINTS =====

@router.get("/prices/search")
async def search_prices(
    q: str = Query(..., min_length=2, description="Search query (work/material name)"),
    type: str = Query("all", description="Filter by type: 'works', 'materials', 'equipment', 'all'"),
    limit: int = Query(20, ge=1, le=100, description="Max results"),
) -> Dict[str, Any]:
    """
    Search the price database (~24000 items).
    
    Fuzzy search by name across works, materials, equipment.
    Returns matching items with codes, prices, and units.
    """
    results = search_items(q, item_type=type, limit=limit)
    return {
        "success": True,
        "query": q,
        "type": type,
        "results": results,
        "count": len(results),
    }


@router.get("/prices/item/{code}")
async def get_price_item(code: str) -> Dict[str, Any]:
    """Get a single item by its exact code."""
    item = get_price(code)
    if not item:
        raise HTTPException(404, f"Item '{code}' not found")
    return {"success": True, "item": item}


@router.get("/prices/stats")
async def price_db_stats() -> Dict[str, Any]:
    """Get price database statistics."""
    db = _load_price_db()
    works = db.get("works", {})
    materials = db.get("materials", {})
    equipment = db.get("equipment", {})

    # Count categories
    work_cats = {}
    for item in works.values():
        cat = item.get("category", "uncategorized")
        work_cats[cat] = work_cats.get(cat, 0) + 1

    mat_cats = {}
    for item in materials.values():
        cat = item.get("category", "uncategorized")
        mat_cats[cat] = mat_cats.get(cat, 0) + 1

    eq_cats = {}
    for item in equipment.values():
        cat = item.get("category", "uncategorized")
        eq_cats[cat] = eq_cats.get(cat, 0) + 1

    return {
        "success": True,
        "version": db.get("version", "unknown"),
        "exported_at": db.get("exported_at", "unknown"),
        "works": {"count": len(works), "categories": work_cats},
        "materials": {"count": len(materials), "categories": mat_cats},
        "equipment": {"count": len(equipment), "categories": eq_cats},
        "total": len(works) + len(materials) + len(equipment),
        "regional_coefficients": db.get("regional_coefficients", {}),
    }
