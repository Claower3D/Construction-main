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

from fastapi import APIRouter, File, UploadFile, Query, HTTPException, Depends
from pydantic import BaseModel
from PIL import Image
from loguru import logger

from app.config import settings
from app.services.pipeline import create_pipeline
from app.models.rfdetr import get_rfdetr  # for /detect and /classes
from app.services.estimator import search_items, get_price, _load_price_db
from app.api.v1.jwt_auth import get_current_user, get_optional_user

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

    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    # Read and decode image
    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents))
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        # Resize if too large
        h, w = pil_img.height, pil_img.width
        if max(h, w) > settings.MAX_IMAGE_SIZE:
            scale = settings.MAX_IMAGE_SIZE / max(h, w)
            pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        image_np = np.array(pil_img)
    except Exception as exc:
        logger.error(f"Failed to read image: {exc}")
        raise HTTPException(400, f"Invalid image file: {exc}")

    # ── Run full pipeline v3.0 ───────────────────────────────────────────────
    pipeline = create_pipeline(region=region)
    result = pipeline.run(
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


@router.post("/defect-scan")
async def defect_scan(
    file: UploadFile = File(..., description="Photo to scan for defects"),
    sensitivity: float = Query(0.65, ge=0.1, le=1.0, description="Detection sensitivity (0.1=low, 1.0=high)"),
    prompt: Optional[str] = Query(None, description="User prompt describing specific defects or inspection target"),
) -> Dict[str, Any]:
    """
    Scan photo for construction defects.
    
    Uses trained YOLOv8 model (primary) with CV heuristic fallback.
    NO JWT required. Returns annotated image with colored bounding boxes.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents))
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        
        # Limit size for speed
        h, w = pil_img.height, pil_img.width
        if max(h, w) > 1600:
            scale = 1600 / max(h, w)
            pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        
        image_np = np.array(pil_img)
    except Exception as exc:
        raise HTTPException(400, f"Invalid image: {exc}")
    
    result = None
    yolo_defects = []
    
    # Step 1: Check Direct Roboflow Inference first
    from app.models.roboflow_detector import get_roboflow_detector
    rf_detector = get_roboflow_detector()
    rf_defects = []
    if rf_detector.is_configured():
        rf_defects = rf_detector.infer(image_np, confidence=sensitivity * 0.5, prompt=prompt)

    # Step 2: Dynamic CV / Deep Feature Analysis
    from app.services.cv_defect_scanner import scan_defects, _draw_annotations
    cv_result = scan_defects(image_np, sensitivity=sensitivity)
    
    if rf_defects:
        all_defects = rf_defects
        logger.info(f"[DefectScan] Using {len(rf_defects)} defects directly from Roboflow model")
        # Draw on image with solid ring
        annotated_mat = _draw_annotations(image_np.copy(), all_defects)
        pil_out = Image.fromarray(annotated_mat)
        buf = io.BytesIO()
        pil_out.save(buf, format="JPEG", quality=92)
        annotated_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"
    else:
        all_defects = list(cv_result["defects"])
        annotated_b64 = cv_result["annotated_image"]

    structure_zones = cv_result.get("structure_zones", [])

    # Build summary
    sev_counts = {}
    for d in all_defects:
        s = d["severity"]
        sev_counts[s] = sev_counts.get(s, 0) + 1
    max_sev = max(sev_counts.keys(), key=lambda s: sev_order.get(s, 0)) if sev_counts else "low"

    result = {
        "defects": all_defects,
        "structure_zones": structure_zones,
        "annotated_image": annotated_b64,
        "severity_summary": {"total": len(all_defects), "by_severity": sev_counts, "max_severity": max_sev},
    }
    
    # Format response
    defect_items = result["defects"]
    sev_summary = result["severity_summary"]
    
    # Build text report
    if defect_items:
        primary = defect_items[0]
        defect_type = primary["type"]
        severity_map = {
            "critical": "5 класс — КРИТИЧЕСКИЙ (аварийный)",
            "high": "4 класс — Высокий риск",
            "medium": "3 класс — Требует устранения",
            "low": "2 класс — Незначительный",
        }
        severity_text = severity_map.get(primary["severity"], "3 класс — Требует устранения")
    else:
        defect_type = "Дефектов не обнаружено"
        severity_text = "Норма"
    
    return {
        "success": True,
        "defectType": defect_type,
        "severity": severity_text,
        "snipCode": "СНиП РК 3.02-04-2019 / СП РК 1.03-106-2012",
        "fixMethod": _get_fix_method(defect_type),
        "estimatedCost": _estimate_cost(defect_items),
        "workDays": max(1, len(defect_items)),
        "defect_annotated_image": result["annotated_image"],
        "defect_severity_summary": sev_summary,
        "defects": {
            "items": defect_items,
            "total": len(defect_items),
        },
    }


def _get_fix_method(defect_type: str) -> str:
    methods = {
        "Трещина": "Расшивка трещины на глубину 10 мм, обеспыливание, грунтовка глубокого проникновения, армирование серпянкой и шпатлевание полимерцементным составом.",
        "Глубокое повреждение": "Демонтаж повреждённого участка, восстановление армокаркаса, заливка ремонтным составом повышенной прочности.",
        "Коррозия / ржавчина": "Зачистка коррозии до чистого металла, обработка преобразователем ржавчины, нанесение антикоррозийного грунта и защитного покрытия.",
        "Биопоражение / плесень": "Обработка фунгицидным составом, сушка, нанесение антисептической грунтовки и защитного слоя.",
        "Отслоение / сколы": "Удаление отслоившегося материала, обеспыливание, грунтовка контактная, восстановление ремонтной смесью.",
        "Дефект поверхности": "Локальный ремонт с применением сертифицированных ремонтных смесей.",
    }
    return methods.get(defect_type, methods["Дефект поверхности"])


def _estimate_cost(defects: List) -> str:
    if not defects:
        return "0 ₸"
    base = 0
    for d in defects:
        sev_cost = {"critical": 80000, "high": 50000, "medium": 30000, "low": 15000}
        base += sev_cost.get(d["severity"], 30000)
    low = int(base * 0.8)
    high = int(base * 1.3)
    return f"{low:,} – {high:,} ₸".replace(",", " ")


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
    
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image_np = np.array(image)
    
    # Run RF-DETR detection (fast path — no SAM/Qwen)
    detector = get_rfdetr()
    detections = detector.detect(image_np, confidence=confidence)
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return {
        "success": True,
        "objects": [d.to_dict() for d in detections],
        "count": len(detections),
        "processing_time_ms": processing_time
    }


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
        None,
        description="Known scale factor (meters/pixel). If not provided, ArUco detection or heuristic is used."
    ),
    marker_size_m: Optional[float] = Query(
        0.15,
        description="ArUco marker side length in meters (default 15cm)"
    ),
) -> Dict[str, Any]:
    """
    Multi-photo 3D analysis via Structure-from-Motion.

    Upload 3-10 photos taken from different angles around a construction object.
    The system will:
    1. Search for ArUco markers for scale calibration
    2. Extract AKAZE features + match across photo pairs
    3. Recover camera poses via RANSAC Essential Matrix
    4. Triangulate 3D point cloud
    5. Fit planes via RANSAC
    6. Compute area, perimeter, volume, height

    **Best Results:**
    - Use 5-8 photos from different angles (30-60° apart)
    - Include an ArUco marker or A4 paper for scale
    - Keep lighting consistent
    - Overlap between photos should be 60-80%

    **Example:**
    ```
    curl -X POST "http://localhost:8001/api/v1/analyze-3d" \\
         -F "files=@photo1.jpg" \\
         -F "files=@photo2.jpg" \\
         -F "files=@photo3.jpg" \\
         -F "files=@photo4.jpg" \\
         -F "files=@photo5.jpg"
    ```
    """
    start_time = time.time()

    if not PHOTO3D_AVAILABLE:
        raise HTTPException(503, "Photo3D service is not available")

    if len(files) < 2:
        raise HTTPException(400, "At least 2 photos required for 3D reconstruction (recommended 3-10)")

    if len(files) > 15:
        raise HTTPException(400, "Maximum 15 photos allowed")

    # Read and decode images
    images = []
    warnings = []
    for i, f in enumerate(files):
        if not f.content_type or not f.content_type.startswith("image/"):
            warnings.append(f"File {i}: skipped (not an image)")
            continue
        try:
            # Read directly into PIL (avoids double RAM allocation)
            pil_img = Image.open(f.file).convert("RGB")

            # Resize if too large
            h, w = pil_img.height, pil_img.width
            max_dim = 1600
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                pil_img = pil_img.resize(
                    (int(w * scale), int(h * scale)), Image.LANCZOS
                )

            images.append(np.array(pil_img))
        except Exception as exc:
            warnings.append(f"File {i} ({f.filename}): failed to read — {exc}")

    if len(images) < 2:
        raise HTTPException(400, f"Need at least 2 valid images, got {len(images)}")

    logger.info(f"[API] analyze-3d: {len(images)} valid photos received")

    # Run SfM pipeline
    service = get_photo3d_service()
    result = service.analyze_images(images, scale_hint=scale_hint)

    processing_time = int((time.time() - start_time) * 1000)

    result["processing_time_ms"] = processing_time
    result["num_images_received"] = len(images)
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
