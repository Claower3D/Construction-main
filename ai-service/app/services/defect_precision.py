"""
QazGost AI — Two-Stage Precision Defect Pipeline (YOLO11 + SAM)

Architecture (based on MEP-YOLOv11 research, arXiv:2508.11517):
  Stage 1: YOLO11-seg detects defect regions (fast, high recall)
  Stage 2: SAM refines each bbox → pixel-level mask (high precision)

Result: ~95.9% accuracy combining YOLO speed with SAM precision.

Usage:
    pipeline = get_precision_defect_pipeline()
    results = pipeline.detect_and_refine(image, confidence=0.25)
"""

import time
import threading
from typing import List, Dict, Any, Optional
import numpy as np
from loguru import logger


class PrecisionDefectPipeline:
    """
    Two-stage defect detection for maximum accuracy.

    Stage 1: YOLO11 detect/locate defect regions (fast, high recall)
    Stage 2: SAM refine masks (precise pixel-level segmentation)

    Falls back to single-stage YOLO if SAM is unavailable.
    Falls back to OpenCV DefectAnalyzer if YOLO is also unavailable.
    """

    def __init__(self):
        self._detector = None
        self._sam = None
        self._initialized = False

    def _ensure_models(self):
        """Lazy-load models on first use to avoid import-time crashes."""
        if self._initialized:
            return

        # Stage 1: YOLO11 DefectNN
        try:
            from app.models.defect_nn import get_defect_nn
            self._detector = get_defect_nn()
            mode = "NN" if self._detector.is_nn_mode else "OpenCV-fallback"
            logger.info(f"[PrecisionPipeline] Stage 1: DefectNN loaded (mode={mode})")
        except Exception as e:
            logger.warning(f"[PrecisionPipeline] DefectNN unavailable: {e}")

        # Stage 2: SAM
        try:
            from app.models.sam_segmentor import get_sam
            self._sam = get_sam()
            logger.info("[PrecisionPipeline] Stage 2: SAM loaded for mask refinement")
        except Exception as e:
            logger.warning(f"[PrecisionPipeline] SAM unavailable — single-stage mode: {e}")

        self._initialized = True

    def detect_and_refine(
        self,
        image: np.ndarray,
        confidence: float = 0.25,
        iou: float = 0.45,
        refine_with_sam: bool = True,
    ) -> Dict[str, Any]:
        """
        Run two-stage defect detection.

        Args:
            image:           RGB numpy array (H, W, 3)
            confidence:      Detection confidence threshold
            iou:             NMS IoU threshold
            refine_with_sam: Whether to refine masks with SAM (Stage 2)

        Returns:
            Dict with 'defects' list, 'summary', 'timings', 'pipeline_mode'
        """
        self._ensure_models()
        timings = {}
        pipeline_mode = "none"

        # ── Stage 1: YOLO Detection ──────────────────────────────────────────
        t0 = time.time()
        raw_defects = []

        if self._detector is not None:
            raw_defects = self._detector.detect(
                image, confidence=confidence, iou=iou,
            )
            pipeline_mode = "yolo11" if self._detector.is_nn_mode else "opencv_fallback"
        else:
            # Last resort: OpenCV DefectAnalyzer
            try:
                from app.models.defect_detector import get_defect_analyzer
                analyzer = get_defect_analyzer()
                report = analyzer.analyze(image)
                # Convert DefectAnalyzer format to defect_nn format
                for d in report.get("defects", []):
                    raw_defects.append({
                        "defect_type": d.get("defect_type", "crack"),
                        "confidence": d.get("confidence", 0.5),
                        "severity": d.get("severity", "medium"),
                        "bbox": list(d.get("bbox", (0, 0, 1, 1))),
                        "mask": d.get("mask"),
                        "area_px": d.get("area_px", 0),
                    })
                pipeline_mode = "opencv_analyzer"
            except Exception as e:
                logger.error(f"[PrecisionPipeline] All detectors failed: {e}")

        timings["stage1_detect_ms"] = int((time.time() - t0) * 1000)
        logger.info(
            f"[PrecisionPipeline] Stage 1 ({pipeline_mode}): "
            f"{len(raw_defects)} defects in {timings['stage1_detect_ms']}ms"
        )

        # ── Stage 2: SAM Mask Refinement ─────────────────────────────────────
        refined_defects = []
        sam_refined_count = 0

        can_sam = (
            refine_with_sam
            and self._sam is not None
            and raw_defects
            and not getattr(self._sam, '_mock_mode', True)
        )

        if can_sam:
            t1 = time.time()

            for defect in raw_defects:
                refined = self._refine_with_sam(image, defect)
                if refined.get("refinement") == "SAM_v2":
                    sam_refined_count += 1
                refined_defects.append(refined)

            timings["stage2_sam_ms"] = int((time.time() - t1) * 1000)
            pipeline_mode += "+sam"
            logger.info(
                f"[PrecisionPipeline] Stage 2 (SAM): "
                f"{sam_refined_count}/{len(raw_defects)} masks refined "
                f"in {timings['stage2_sam_ms']}ms"
            )
        else:
            refined_defects = raw_defects
            timings["stage2_sam_ms"] = 0

        # ── Summary ──────────────────────────────────────────────────────────
        timings["total_ms"] = int((time.time() - t0) * 1000)

        severity_counts = {"high": 0, "medium": 0, "low": 0}
        type_counts = {}
        for d in refined_defects:
            sev = d.get("severity", "medium")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            dt = d.get("defect_type", "unknown")
            type_counts[dt] = type_counts.get(dt, 0) + 1

        max_severity = "none"
        for sev in ["high", "medium", "low"]:
            if severity_counts.get(sev, 0) > 0:
                max_severity = sev
                break

        return {
            "defects": refined_defects,
            "summary": {
                "total": len(refined_defects),
                "by_severity": severity_counts,
                "by_type": type_counts,
                "max_severity": max_severity,
                "sam_refined": sam_refined_count,
            },
            "pipeline_mode": pipeline_mode,
            "timings": timings,
        }

    def _refine_with_sam(
        self, image: np.ndarray, defect: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Refine a single defect mask using SAM box+point prompt.

        Takes the YOLO bbox, uses center point + box as SAM prompts
        to get pixel-precise mask boundaries.
        """
        bbox = defect.get("bbox")
        if bbox is None or len(bbox) != 4:
            return defect

        try:
            x1, y1, x2, y2 = [int(v) for v in bbox]
            h, w = image.shape[:2]

            # Clamp bbox
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            if x2 <= x1 or y2 <= y1:
                return defect

            # Try SAM segmentation with box prompt
            if hasattr(self._sam, 'segment_with_bbox'):
                sam_masks = self._sam.segment_with_bbox(image, [x1, y1, x2, y2])
                if sam_masks and len(sam_masks) > 0:
                    best_mask = sam_masks[0]
                    if hasattr(best_mask, 'cpu'):
                        best_mask = best_mask.cpu().numpy()
                    best_mask = (best_mask > 0.5).astype(np.uint8)

                    bbox_area = (x2 - x1) * (y2 - y1)
                    mask_area = float(np.sum(best_mask))

                    # Validate: mask should be reasonable relative to bbox
                    if mask_area > max(10, bbox_area * 0.05):
                        defect["mask"] = best_mask
                        defect["area_px"] = mask_area
                        defect["refinement"] = "SAM_v2"
                        return defect

            elif hasattr(self._sam, 'segment'):
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                sam_result = self._sam.segment(
                    image=image,
                    point_coords=np.array([[cx, cy]]),
                    point_labels=np.array([1]),
                    box=np.array([x1, y1, x2, y2]),
                )
                if sam_result is not None and isinstance(sam_result, np.ndarray):
                    best_mask = (sam_result > 0.5).astype(np.uint8)
                    defect["mask"] = best_mask
                    defect["area_px"] = float(np.sum(best_mask))
                    defect["refinement"] = "SAM_v2"
                    return defect

        except Exception as e:
            logger.debug(f"[PrecisionPipeline] SAM refinement failed: {e}")

        return defect


# ─────────────────────────────────────────────
# Thread-safe singleton accessor
# ─────────────────────────────────────────────

_precision_pipeline: Optional[PrecisionDefectPipeline] = None
_precision_lock = threading.Lock()


def get_precision_defect_pipeline() -> PrecisionDefectPipeline:
    """Get singleton PrecisionDefectPipeline instance."""
    global _precision_pipeline
    if _precision_pipeline is None:
        with _precision_lock:
            if _precision_pipeline is None:
                _precision_pipeline = PrecisionDefectPipeline()
    return _precision_pipeline
