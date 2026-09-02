"""
QAZGOST AI - Construction Analysis Pipeline V2

Full pipeline:
  1. RF-DETR / GroundingDINO  → detect objects + bbox
  2. SAM                     → refine bbox → precise mask → area_px
  3. Grounding DINO (defects) → cracks, stains, rust (tiled)
  4. DefectAnalyzer           → CV-based defect analysis
  5. Calibrator V2            → ArUco / A4 / EXIF / reference → m/px
  6. Volume Calculator        → area_m2, volume_m3
  7. Qwen2.5-VL              → scene passport → structured JSON
  8. AutoEstimator            → estimate items + total price

Designed to match AnalysisResponse schema (aiClient.js compatible).
"""

import time
import uuid
import hashlib
from typing import List, Optional, Dict, Any, Tuple
import numpy as np

# Cache for image analysis (LRU)
_pipeline_cache: Dict[str, Dict[str, Any]] = {}
_pipeline_cache_max: int = 64

try:
    from app.api.v1.metrics import inc, observe, gauge
except ImportError:
    def inc(*a, **k): pass
    def observe(*a, **k): pass
    def gauge(*a, **k): pass
from loguru import logger

from app.models.rfdetr import get_rfdetr, Detection
from app.models.sam_segmentor import get_sam
from app.models.qwen_vlm import get_qwen
from app.services.calibrator import ScaleCalibrator
from app.services.volume import VolumeCalculator
from app.services.estimator import AutoEstimator, search_items, _load_price_db

# New V2 modules
try:
    from app.models.grounding_dino import get_grounding_dino, LABEL_TO_CATEGORY
    GDINO_AVAILABLE = True
except ImportError:
    GDINO_AVAILABLE = False
    # Hardcoded fallback so category mapping works even without grounding_dino
    _FALLBACK_PROMPTS = {
        "structure": "wall . floor . ceiling . column . beam . slab . foundation . roof",
        "openings":  "window . door . doorway . opening . arch",
        "materials": "brick . concrete block . rebar . formwork . insulation . waterproofing . plaster . tile",
        "defects":   "crack . stain . mold . rust . corrosion . spalling . delamination . efflorescence",
        "pipes":     "pipe . duct . ventilation . cable tray . conduit . drain . manhole",
        "fasteners": "bolt . nut . anchor . bracket . clamp . hanger . profile . drywall screw",
        "equipment": "excavator . crane . scaffolding . ladder . wheelbarrow . concrete mixer",
        "reference": "measuring tape . ruler . person . door . car . brick . A4 paper . credit card",
    }
    LABEL_TO_CATEGORY = {}
    for _cat, _prompt in _FALLBACK_PROMPTS.items():
        for _label in _prompt.split(" . "):
            LABEL_TO_CATEGORY[_label.strip().lower()] = _cat
    logger.warning("[Pipeline] GroundingDINO not available, using fallback LABEL_TO_CATEGORY")

try:
    from app.models.defect_detector import get_defect_analyzer
    DEFECT_AVAILABLE = True
except ImportError:
    DEFECT_AVAILABLE = False
    logger.warning("[Pipeline] DefectAnalyzer not available")

try:
    from app.models.defect_nn import get_defect_nn
    DEFECT_NN_AVAILABLE = True
except ImportError:
    DEFECT_NN_AVAILABLE = False
    logger.info("[Pipeline] QazGost AI DefectNN not available — using OpenCV fallback")


# ─────────────────────────────────────────────
# VirtualDetection — Detection from VLM/Qwen
# ─────────────────────────────────────────────

class VirtualDetection:
    """Detection synthesized from VLM (Qwen) analysis, not from a CV model.
    Provides the same interface as rfdetr.Detection for pipeline compatibility.
    """

    def __init__(self, cls: str, qd_data: Dict, conf: float):
        self.class_name = cls
        self.class_id = -1
        self.confidence = conf / 100 if conf > 1 else conf
        self.area_m2 = qd_data.get("area_m2")
        self.width_m = qd_data.get("width_m")
        self.height_m = qd_data.get("height_m")
        self.depth_m = qd_data.get("depth_m")
        self.volume_m3 = (
            (self.area_m2 or 0) * (self.depth_m or 0.3)
            if self.area_m2 else None
        )
        # Stub attributes for compatibility with Detection
        self.bbox = (0, 0, 1, 1)
        self.center = (0, 0)
        self.width = 1
        self.height = 1
        self.area_px = 0.0
        self.mask = None


class AnalysisPipeline:
    """
    End-to-end construction photo analysis pipeline V2.

    Key improvements over V1:
    - Grounding DINO for open-vocabulary detection
    - Defect analysis (cracks, stains, rust)
    - Multi-method scale calibration (ArUco, A4, EXIF)
    - Combined results: RF-DETR + GroundingDINO + Defects
    - B6: Result caching via module-level _pipeline_cache (bounded LRU)
    """

    def __init__(self, region: str = "almaty"):
        self.region = region.lower()

    # ─────────────────────────────────────────────────────────────────────────
    # Main entry point
    # ─────────────────────────────────────────────────────────────────────────

    def run(
        self,
        image: np.ndarray,
        confidence: float = 0.30,
        reference_object: Optional[str] = None,
        reference_size_m: Optional[float] = None,
        generate_estimate: bool = True,
        calculate_depth: bool = True,
        detect_defects: bool = True,
        use_grounding_dino: bool = True,
        custom_text_prompt: Optional[str] = None,
        image_path: Optional[str] = None,
        user_scale_hint: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Full analysis: detect → segment → defects → calibrate → measure → LLM → estimate.

        Args:
            image:             RGB numpy array (H, W, 3)
            confidence:        Detection confidence threshold
            reference_object:  e.g. "person" for scale hint
            reference_size_m:  Known real-world size of reference object (m)
            generate_estimate: Run AutoEstimator
            calculate_depth:   Estimate depth/volume
            detect_defects:    Run defect detectors (cracks, stains, rust)
            use_grounding_dino: Use open-vocabulary detection
            custom_text_prompt: Custom text prompt for Grounding DINO
            image_path:        Path for EXIF extraction
            user_scale_hint:   {"object_name": str, "size_m": float} from UI
        """
        t0 = time.time()
        image_id = str(uuid.uuid4())
        h, w = image.shape[:2]
        warnings: List[str] = []
        step_timings: Dict[str, int] = {}

        # Cache lookup
        img_hash = hashlib.sha256(image.tobytes()[:1024*1024]).hexdigest()[:16]
        cache_key = f"{img_hash}_{confidence}_{self.region}_{generate_estimate}_{detect_defects}"
        if cache_key in _pipeline_cache:
            logger.info(f"[Pipeline] Cache HIT: {cache_key}")
            cached_res = dict(_pipeline_cache[cache_key])
            cached_res["image_id"] = str(uuid.uuid4())
            cached_res["from_cache"] = True
            return cached_res

        logger.info(f"[Pipeline] START image_id={image_id} size={w}x{h} region={self.region}")

        # ── Step 1: RF-DETR detection ────────────────────────────────────────
        t1 = time.time()
        detector = get_rfdetr()
        raw_detections: List[Detection] = detector.detect(image, confidence=confidence)
        step_timings["rfdetr_ms"] = int((time.time() - t1) * 1000)
        logger.info(f"[Pipeline] RF-DETR: {len(raw_detections)} detections ({step_timings['rfdetr_ms']}ms)")

        if not raw_detections:
            warnings.append("RF-DETR: объекты не обнаружены — попробуйте более чёткое фото")

        # ── Step 1b: Grounding DINO (optional) ───────────────────────────────
        gdino_detections: List[Detection] = []
        if use_grounding_dino and GDINO_AVAILABLE:
            try:
                t_gdino = time.time()
                gdino = get_grounding_dino()
                gdino_detections = gdino.detect(
                    image,
                    text_prompt=custom_text_prompt,
                    box_threshold=0.30,
                )
                step_timings["gdino_ms"] = int((time.time() - t_gdino) * 1000)
                logger.info(f"[Pipeline] GroundingDINO: {len(gdino_detections)} detections ({step_timings['gdino_ms']}ms)")
            except Exception as exc:
                logger.warning(f"[Pipeline] GroundingDINO error: {exc}")

        # Merge: combine RF-DETR + GroundingDINO (deduplicate by IoU)
        all_detections = self._merge_detections(raw_detections, gdino_detections)
        logger.info(f"[Pipeline] Merged: {len(all_detections)} total detections")

        # ── Step 2: SAM segmentation (refine masks) ──────────────────────────
        t_sam = time.time()
        sam = get_sam()
        detections = sam.refine(image, all_detections)
        step_timings["sam_ms"] = int((time.time() - t_sam) * 1000)
        logger.info(f"[Pipeline] SAM: masks refined ({step_timings['sam_ms']}ms)")

        # ── Step 3: Defect analysis (hybrid: GDINO + CV) ────────────────────
        defect_report = None
        gdino_defect_dets: List[Detection] = []

        if detect_defects:
            # 3a: GDINO open-vocabulary defect detection
            if use_grounding_dino and GDINO_AVAILABLE:
                try:
                    gdino = get_grounding_dino()
                    gdino_defect_dets = gdino.detect_defects(image)
                    logger.info(f"[Pipeline] GDINO defects: {len(gdino_defect_dets)} regions")
                except Exception as exc:
                    logger.warning(f"[Pipeline] GDINO defect detection error: {exc}")

            # 3b: Build ROI mask from GDINO defect bboxes
            roi_mask = None
            if gdino_defect_dets:
                roi_mask = np.zeros((h, w), dtype=np.uint8)
                for det in gdino_defect_dets:
                    x1, y1, x2, y2 = det.bbox
                    # Expand bbox by 20% for context
                    bw, bh = x2 - x1, y2 - y1
                    pad_x, pad_y = int(bw * 0.2), int(bh * 0.2)
                    rx1 = max(0, x1 - pad_x)
                    ry1 = max(0, y1 - pad_y)
                    rx2 = min(w, x2 + pad_x)
                    ry2 = min(h, y2 + pad_y)
                    roi_mask[ry1:ry2, rx1:rx2] = 255
                logger.info(f"[Pipeline] ROI mask from {len(gdino_defect_dets)} GDINO defect boxes")

            # 3c: CV defect analysis (with optional ROI guidance)
            if DEFECT_AVAILABLE:
                try:
                    analyzer = get_defect_analyzer()
                    defect_report = analyzer.analyze(image, roi_mask=roi_mask)
                    logger.info(
                        f"[Pipeline] Defects: {defect_report['summary']['total']} found, "
                        f"max_severity={defect_report['max_severity']}"
                    )
                except Exception as exc:
                    logger.warning(f"[Pipeline] DefectAnalyzer error: {exc}")

            # 3d: Add GDINO defect detections to summary if no CV defects found
            if gdino_defect_dets and (not defect_report or defect_report["summary"]["total"] == 0):
                defect_report = defect_report or {
                    "defects": [], "summary": {"cracks": 0, "stains": 0, "rust": 0, "total": 0},
                    "max_severity": "none", "total_defect_area_pct": 0,
                }
                for det in gdino_defect_dets:
                    label = det.class_name.lower()
                    severity = "medium" if det.confidence > 0.5 else "low"
                    defect_report["defects"].append({
                        "type": label,
                        "severity": severity,
                        "bbox": list(det.bbox),
                        "area_px": det.area_px,
                        "confidence": det.confidence,
                        "source": "grounding_dino",
                    })
                    # Update summary counters
                    if "crack" in label:
                        defect_report["summary"]["cracks"] += 1
                    elif "stain" in label or "mold" in label or "efflorescence" in label:
                        defect_report["summary"]["stains"] += 1
                    elif "rust" in label or "corrosion" in label:
                        defect_report["summary"]["rust"] += 1
                    defect_report["summary"]["total"] += 1
                defect_report["max_severity"] = "medium"
                logger.info(f"[Pipeline] Added {len(gdino_defect_dets)} GDINO-only defects")

        # ── Step 4: Scale calibration V2 ─────────────────────────────────────
        calibrator = ScaleCalibrator()

        # Try multi-method calibration
        calib_result = calibrator.calibrate(
            image=image,
            detections=detections,
            image_path=image_path,
            user_scale_hint=(
                {"object_name": reference_object, "size_m": reference_size_m}
                if reference_object and reference_size_m else None
            ),
        )

        scale_factor = calib_result["scale_factor"]
        scale_calibrated = calib_result["confidence"] > 0.5
        scale_method = calib_result["method"]
        needs_scale = calib_result.get("needs_scale", True)

        logger.info(
            f"[Pipeline] Scale: {scale_factor:.6f} m/px via {scale_method} "
            f"(conf={calib_result['confidence']:.2f}, needs_scale={needs_scale})"
        )

        if not scale_calibrated:
            warnings.append(
                "Масштаб определён приблизительно. "
                "Для точности: добавьте ArUco маркер, лист A4 или укажите размер вручную."
            )

        # ── Step 5: Volume calculation ───────────────────────────────────────
        vol_calc = VolumeCalculator(scale_factor=scale_factor)
        measurements: Dict[str, Any] = {}

        ref_classes = detector.REFERENCE_CLASSES
        for det in detections:
            if det.class_name in ref_classes:
                continue
            vol_info = vol_calc.calculate(det, calculate_depth=calculate_depth)
            det.width_m = vol_info.get("width_m")
            det.height_m = vol_info.get("height_m")
            det.depth_m = vol_info.get("depth_m")
            det.area_m2 = vol_info.get("area_m2")
            det.volume_m3 = vol_info.get("volume_m3")

            cls = det.class_name
            if cls not in measurements:
                measurements[cls] = {
                    "count": 0, "total_area_px": 0,
                    "total_area_m2": 0.0, "total_volume_m3": 0.0,
                }
            measurements[cls]["count"] += 1
            measurements[cls]["total_area_px"] += det.area_px
            measurements[cls]["total_area_m2"] += det.area_m2 or 0
            measurements[cls]["total_volume_m3"] += det.volume_m3 or 0

        # ── Step 6: Qwen2.5-VL analysis ─────────────────────────────────────
        qwen = get_qwen()
        construction_detections = [
            d for d in detections if d.class_name not in ref_classes
        ]

        rfdetr_is_mock = detector._mock_mode
        if rfdetr_is_mock:
            logger.info("[Pipeline] RF-DETR in mock mode → Qwen will analyze photo directly")
            warnings.append("RF-DETR не доступен — используется Qwen2.5-VL для визуального анализа")

        qwen_result = qwen.analyze(
            image,
            construction_detections,
            measurements,
            use_direct_prompt=rfdetr_is_mock,
        )
        logger.info(
            f"[Pipeline] Qwen: objectType={qwen_result.get('objectType')} "
            f"conf={qwen_result.get('confidence')}"
        )

        if qwen_result.get("_mock"):
            warnings.append(
                "LLM анализ в mock-режиме. "
                "Для лучших результатов: добавьте Qwen2.5-VL или запустите Ollama."
            )

        # Enrich Qwen result with defect info
        if defect_report and defect_report["summary"]["total"] > 0:
            qwen_result["defects_detected"] = defect_report["summary"]
            if not qwen_result.get("defects"):
                qwen_result["defects"] = defect_report["defects"][:5]

        # ── Step 7: Cost estimation ──────────────────────────────────────────
        estimate_items: List[Dict] = []
        estimate_total: Optional[float] = None
        estimate_confidence: Optional[float] = None
        defect_repair_items: List[Dict] = []
        defect_repair_total: float = 0.0

        if generate_estimate:
            try:
                estimator = AutoEstimator(region=self.region)

                # Override measurements with Qwen visual estimates when RF-DETR mocked
                if rfdetr_is_mock and qwen_result.get("dimensions_estimate"):
                    qd = qwen_result["dimensions_estimate"]
                    obj_type = qwen_result.get("objectType", "generic")
                    area_m2 = qd.get("area_m2")
                    perim_m = qd.get("perimeter_m")
                    depth_m = qd.get("depth_m") or qd.get("height_m")
                    if area_m2 or perim_m:
                        measurements["qwen_estimate"] = {
                            "count": 1,
                            "total_area_px": 0,
                            "total_area_m2": area_m2 or 0,
                            "total_volume_m3": (area_m2 or 0) * (depth_m or 0.3),
                            "source": "qwen_visual",
                            "object_type": obj_type,
                        }

                    # Create a virtual detection for Qwen objectType
                    # so AutoEstimator can use expanded VLM WBS mappings
                    if obj_type != "generic":
                        vdet = VirtualDetection(
                            obj_type, qd,
                            qwen_result.get("confidence", 70)
                        )
                        construction_detections.append(vdet)
                        logger.info(
                            f"[Pipeline] Virtual detection from Qwen: "
                            f"{obj_type} (area={area_m2}, depth={depth_m})"
                        )

                estimate_items, estimate_total, estimate_confidence = estimator.generate(
                    detections=construction_detections,
                    measurements=measurements,
                )

                # Defect repair estimate
                if defect_report and defect_report.get("summary", {}).get("total", 0) > 0:
                    try:
                        defect_repair_items, defect_repair_total = estimator.estimate_defect_repair(
                            defect_report
                        )
                    except Exception as exc:
                        logger.warning(f"[Pipeline] Defect repair estimate error: {exc}")

            except Exception as exc:
                logger.error(f"[Pipeline] Estimator error: {exc}")
                warnings.append(f"Ошибка сметного расчёта: {exc}")

        # ── Step 8: Construction Plan ─────────────────────────────────────────
        plan_result = {"work_items": [], "warnings": [], "required_inputs": []}
        obj_type = qwen_result.get("objectType", "generic")
        try:
            from app.services.planner import ConstructionPlanner
            planner = ConstructionPlanner()

            plan_dimensions = {
                "area_m2": qwen_result.get("dimensions_estimate", {}).get("area_m2"),
                "width_m": qwen_result.get("dimensions_estimate", {}).get("width_m"),
                "height_m": qwen_result.get("dimensions_estimate", {}).get("height_m"),
                "depth_m": qwen_result.get("dimensions_estimate", {}).get("depth_m"),
                "volume_m3": None,
            }
            # Enrich from measurements
            for cls_data in measurements.values():
                if isinstance(cls_data, dict):
                    if cls_data.get("total_area_m2") and not plan_dimensions["area_m2"]:
                        plan_dimensions["area_m2"] = cls_data["total_area_m2"]
                    if cls_data.get("total_volume_m3") and not plan_dimensions["volume_m3"]:
                        plan_dimensions["volume_m3"] = cls_data["total_volume_m3"]

            plan_result = planner.make_plan(
                object_type=obj_type,
                dimensions=plan_dimensions,
                qwen_result=qwen_result,
                description=custom_text_prompt,
            )
            step_timings["planner_ms"] = int((time.time() - t0) * 1000) - sum(
                v for v in step_timings.values()
            )
            logger.info(f"[Pipeline] Planner: {len(plan_result.get('work_items', []))} items")
        except Exception as exc:
            logger.error(f"[Pipeline] Planner error: {exc}")
            warnings.append(f"Ошибка планировщика: {exc}")

        # ── Step 9: Scenarios ─────────────────────────────────────────────────
        scenarios = {}
        try:
            from app.services.scenarios import ScenarioBuilder
            scenario_builder = ScenarioBuilder()

            if estimate_items and estimate_total:
                scenarios = scenario_builder.build_with_tax(
                    estimate_items=estimate_items,
                    estimate_total=estimate_total,
                    estimate_confidence=estimate_confidence or 0.5,
                )
                logger.info(f"[Pipeline] Scenarios: {len(scenarios.get('scenarios', []))} variants")
        except Exception as exc:
            logger.error(f"[Pipeline] Scenarios error: {exc}")
            warnings.append(f"Ошибка сценариев: {exc}")

        # ── Step 10: Intent + Session Status + Accuracy ───────────────────────
        try:
            # Intent
            intent = {
                "category": self._infer_category(obj_type),
                "goal": "estimate_repair_cost" if defect_report and defect_report.get("summary", {}).get("total", 0) > 0
                         else "estimate_construction_cost",
                "objectType": obj_type,
                "workPackages": [
                    {
                        "wbs": item.get("wbs", ""),
                        "name": item.get("name", ""),
                        "confidence": round((estimate_confidence or 0.5), 2),
                    }
                    for item in plan_result.get("work_items", [])
                ],
                "requiredInputs": plan_result.get("required_inputs", []),
            }

            # Accuracy
            type_confidence = min(
                (max(d.confidence for d in detections) if detections else 0.3), 1.0
            )
            dim_confidence = calib_result["confidence"] if scale_calibrated else 0.2
            overall_confidence = round(0.4 * type_confidence + 0.6 * dim_confidence, 2)

            accuracy = {
                "level": "exact" if scale_calibrated and dim_confidence >= 0.65 else "estimated",
                "typeConfidence": round(type_confidence, 2),
                "dimConfidence": round(dim_confidence, 2),
                "overallConfidence": overall_confidence,
                "dimSource": scale_method,
                "scaleAvailable": scale_calibrated,
                "missing": [],
            }
            if not scale_calibrated:
                accuracy["missing"].append("scale")
            if not detections:
                accuracy["missing"].append("detections")
            if plan_result.get("required_inputs"):
                accuracy["missing"].extend(
                    f"answers.{ri.get('key', 'unknown')}" for ri in plan_result["required_inputs"]
                )

            # Session Status
            if not detections and not qwen_result.get("objectType"):
                session_status = "NEED_MORE_PHOTOS"
            elif plan_result.get("required_inputs"):
                session_status = "NEED_ANSWERS"
            elif not scale_calibrated and detections:
                session_status = "NEED_SCALE"
            elif scale_calibrated:
                session_status = "DONE_EXACT"
            else:
                session_status = "DONE_ESTIMATE"

            # Next Actions
            next_actions = self._build_next_actions(session_status, accuracy, plan_result)

            # Questions (from planner + qwen)
            questions = plan_result.get("required_inputs", [])

        except Exception as exc:
            logger.error(f"[Pipeline] Intent/Status error: {exc}")
            warnings.append(f"Ошибка статуса: {exc}")
            intent = {"category": "general", "goal": "estimate_construction_cost", "objectType": obj_type}
            accuracy = {"level": "estimated", "overallConfidence": 0.3}
            session_status = "DONE_ESTIMATE"
            next_actions = []
            questions = []

        # ── Compose response ─────────────────────────────────────────────────
        processing_ms = int((time.time() - t0) * 1000)
        logger.info(
            f"[Pipeline] DONE in {processing_ms}ms — "
            f"{len(estimate_items)} estimate items, status={session_status}"
        )

        # Confidence histogram (for frontend quality indicator)
        all_confidences = [d.confidence for d in detections]
        conf_histogram = {
            "high": sum(1 for c in all_confidences if c >= 0.7),
            "medium": sum(1 for c in all_confidences if 0.4 <= c < 0.7),
            "low": sum(1 for c in all_confidences if c < 0.4),
            "avg": round(sum(all_confidences) / len(all_confidences), 3) if all_confidences else 0,
        }

        # Defect repair cost factor
        defect_repair_cost_factor = 0.0
        if defect_report and defect_report.get("recommendations"):
            defect_repair_cost_factor = sum(
                r.get("cost_factor", 0) * r.get("count", 1)
                for r in defect_report["recommendations"]
            )

        result = {
            "success": True,
            "image_id": image_id,
            "image_width": w,
            "image_height": h,

            # ── Intent (NEW) ──
            "intent": intent,

            # ── Vision ──
            "detected_objects": [self._det_to_dict(d) for d in detections],
            "object_count": len(detections),
            "detection_sources": {
                "rfdetr": len(raw_detections),
                "grounding_dino": len(gdino_detections),
                "gdino_defects": len(gdino_defect_dets),
                "merged": len(all_detections),
            },
            "confidence_histogram": conf_histogram,

            # ── Defects ──
            "defects": defect_report if defect_report else {
                "defects": [], "summary": {"total": 0},
                "max_severity": "none", "total_defect_area_pct": 0,
                "recommendations": [], "confidence_stats": {"min": 0, "max": 0, "avg": 0},
            },
            "defect_repair_cost_factor": round(defect_repair_cost_factor, 4),
            "defect_repair_items": defect_repair_items,
            "defect_repair_total": defect_repair_total,

            # ── Scale ──
            "scale_calibrated": scale_calibrated,
            "scale_factor": scale_factor,
            "scale_method": scale_method,
            "scale_confidence": calib_result["confidence"],
            "reference_object": calib_result.get("reference_object"),
            "needs_scale": needs_scale,

            # ── Measurements ──
            "measurements": measurements,

            # ── Qwen result ──
            "qwen_result": qwen_result,

            # ── Estimate ──
            "estimate_items": estimate_items,
            "estimate_total": estimate_total,
            "estimate_confidence": estimate_confidence,

            # ── Plan ──
            "plan": plan_result,

            # ── Scenarios ──
            "scenarios": scenarios,

            # ── Session Status ──
            "sessionStatus": session_status,
            "accuracy": accuracy,
            "nextActions": next_actions,
            "questions": questions,

            # ── Meta ──
            "processing_time_ms": processing_ms,
            "step_timings": step_timings,
            "warnings": warnings + [w["text"] for w in plan_result.get("warnings", [])],
            "pipeline_version": "3.0",
        }

        # Add price_db_stats only if estimator was created
        if generate_estimate:
            result["price_db_stats"] = {
                "total_items": estimator.db_total,
                "db_prices_used": sum(1 for i in estimate_items if i.get("price_source") == "database"),
                "hardcoded_prices": sum(1 for i in estimate_items if i.get("price_source") == "hardcoded"),
            }

        # ── Track metrics ──
        inc("qazgost_analyses_total")
        observe("qazgost_analysis_duration_seconds", processing_ms / 1000)
        gauge("qazgost_last_detection_count", len(detections))
        gauge("qazgost_last_estimate_total", estimate_total or 0)

        # LRU Cache Store
        if len(_pipeline_cache) >= _pipeline_cache_max:
            try:
                oldest_key = next(iter(_pipeline_cache))
                del _pipeline_cache[oldest_key]
            except StopIteration:
                pass
        _pipeline_cache[cache_key] = result

        return result

    # ─────────────────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _merge_detections(
        self,
        rfdetr_dets: List[Detection],
        gdino_dets: List[Detection],
        iou_threshold: float = 0.5,
    ) -> List[Detection]:
        """
        Merge RF-DETR and GroundingDINO detections, removing duplicates by IoU.
        RF-DETR takes priority (has trained class IDs).
        """
        if not gdino_dets:
            return rfdetr_dets

        merged = list(rfdetr_dets)  # RF-DETR first

        for gd in gdino_dets:
            # Check if GroundingDINO detection overlaps with any RF-DETR detection
            is_duplicate = False
            for rd in merged:
                if self._iou(gd.bbox, rd.bbox) > iou_threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                merged.append(gd)

        return merged

    @staticmethod
    def _iou(box1: tuple, box2: tuple) -> float:
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - inter
        return inter / union if union > 0 else 0

    def _det_to_dict(self, det: Detection) -> Dict[str, Any]:
        cls_name = det.class_name
        result = {
            "class_id": det.class_id,
            "class_name": cls_name,
            "category": LABEL_TO_CATEGORY.get(cls_name.lower(), "other"),
            "confidence": round(det.confidence, 3),
            "bbox": list(det.bbox),
            "center": list(det.center),
            "width_px": det.width,
            "height_px": det.height,
            "area_px": round(det.area_px, 1),
            "width_m": self._r(getattr(det, "width_m", None)),
            "height_m": self._r(getattr(det, "height_m", None)),
            "depth_m": self._r(getattr(det, "depth_m", None)),
            "area_m2": self._r(getattr(det, "area_m2", None)),
            "volume_m3": self._r(getattr(det, "volume_m3", None)),
        }

        # Add SAM mask as RLE + simplified contour polygon
        mask = getattr(det, "mask", None)
        if mask is not None and hasattr(mask, 'shape') and mask.size > 0:
            try:
                import cv2
                # RLE encode for efficient transfer
                flat = mask.flatten()
                rle_counts = []
                flat = mask.flatten()
                # NumPy-vectorized RLE: ~100x faster than Python loop for 4K images
                changes = np.diff(flat.astype(np.int16))
                change_idx = np.where(changes != 0)[0] + 1
                boundaries = np.concatenate(([0], change_idx, [len(flat)]))
                rle_counts = np.diff(boundaries).tolist()
                result["mask_rle"] = {
                    "counts": rle_counts,
                    "size": list(mask.shape),
                    "start_value": int(flat[0]),
                }

                # Simplified contour polygon (for quick canvas drawing)
                contours, _ = cv2.findContours(
                    mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )
                if contours:
                    # Take largest contour, simplify
                    largest = max(contours, key=cv2.contourArea)
                    epsilon = 0.005 * cv2.arcLength(largest, True)
                    approx = cv2.approxPolyDP(largest, epsilon, True)
                    result["mask_contour"] = approx.reshape(-1, 2).tolist()
            except Exception:
                pass

        return result

    @staticmethod
    def _r(v) -> Optional[float]:
        return round(v, 3) if v is not None else None

    @staticmethod
    def _infer_category(object_type: str) -> str:
        """Map objectType to high-level category."""
        CATEGORY_MAP = {
            "foundation_strip": "foundation",
            "foundation_slab": "foundation",
            "foundation_pile": "foundation",
            "wall_brick": "walls",
            "wall_block": "walls",
            "floor_screed": "interior_floors",
            "slab": "structural",
            "roof_flat": "roofing",
            "roof_gable": "roofing",
            "generic": "general",
        }
        return CATEGORY_MAP.get(object_type, "general")

    @staticmethod
    def _build_next_actions(
        session_status: str,
        accuracy: Dict,
        plan_result: Dict,
    ) -> List[Dict]:
        """Generate next action suggestions based on session status."""
        actions = []

        if session_status == "NEED_MORE_PHOTOS":
            actions.append({
                "action": "upload_photos",
                "icon": "📸",
                "hint": "Загрузите чёткое фото объекта",
            })
        elif session_status == "NEED_SCALE":
            actions.append({
                "action": "add_scale_marker",
                "icon": "📏",
                "hint": "Положите лист A4 на объект и сфотографируйте",
            })
            actions.append({
                "action": "manual_scale",
                "icon": "📐",
                "hint": "Введите известный размер (высота двери, ширина окна)",
            })
            actions.append({
                "action": "continue_as_estimate",
                "icon": "📊",
                "hint": "Продолжить как оценочный расчёт",
            })
        elif session_status == "NEED_ANSWERS":
            inputs = plan_result.get("required_inputs", [])
            actions.append({
                "action": "answer_questions",
                "icon": "❓",
                "hint": f"Ответьте на {len(inputs)} вопрос(а) для точного расчёта",
                "questions": [ri["key"] for ri in inputs],
            })
        elif session_status == "DONE_ESTIMATE":
            if not accuracy.get("scaleAvailable"):
                actions.append({
                    "action": "add_scale_marker",
                    "icon": "📏",
                    "hint": "Добавьте масштаб для точного расчёта",
                })
        elif session_status == "DONE_EXACT":
            actions.append({
                "action": "download_pdf",
                "icon": "📄",
                "hint": "Скачать смету в PDF",
            })

        return actions


# ─────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────

def create_pipeline(region: str = "almaty") -> AnalysisPipeline:
    return AnalysisPipeline(region=region)

