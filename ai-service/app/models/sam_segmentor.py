"""
QAZGOST AI - SAM (Segment Anything Model) Wrapper

Refines bounding-box detections into precise polygon masks.
Gives accurate area/perimeter → better volume/material estimates.

License: SAM weights — Apache 2.0 (Meta AI)
"""

import threading
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from loguru import logger

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from segment_anything import sam_model_registry, SamPredictor
    SAM_AVAILABLE = True
except ImportError:
    SAM_AVAILABLE = False
    logger.warning("segment_anything not installed. SAM running in mock mode.")

from app.config import settings
from app.models.rfdetr import Detection


class SAMSegmentor:
    """
    SAM-based instance segmentor.

    Given a list of bounding-box Detections (from RF-DETR),
    refines each bbox to a precise binary mask, then computes:
      - area_px  (from mask — much more accurate than bbox)
      - contour_points  (list of [x,y] for polygon display)

    Falls back to bbox-derived "mock mask" when SAM weights not present.
    """

    # Default: SAM-ViT-B (vit_b) — smallest, good for real-time use
    # For max accuracy: vit_h (~2.5 GB)
    MODEL_TYPE = "vit_b"

    def __init__(
        self,
        weights_path: Optional[str] = None,
        device: Optional[str] = None,
    ):
        self.device = device or settings.get_device()
        self.predictor: Optional[Any] = None
        self._mock_mode = True

        if weights_path:
            p = Path(weights_path)
        else:
            p = settings.get_model_path("sam_vit_b_01ec64.pth")

        self.weights_path = p
        self._load_model()

    def _load_model(self):
        if not SAM_AVAILABLE or not TORCH_AVAILABLE:
            logger.warning("[SAM] Running in mock mode (package unavailable)")
            return

        if not self.weights_path.exists():
            logger.warning(
                f"[SAM] Weights not found at {self.weights_path}. "
                "Mock masks enabled. Download: "
                "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
            )
            return

        try:
            logger.info(f"[SAM] Loading {self.MODEL_TYPE} from {self.weights_path}")
            sam = sam_model_registry[self.MODEL_TYPE](
                checkpoint=str(self.weights_path)
            )
            sam.to(device=self.device)
            self.predictor = SamPredictor(sam)
            self._mock_mode = False
            logger.info("[SAM] ✅ Model loaded successfully")
        except Exception as exc:
            logger.error(f"[SAM] Load failed: {exc}")
            self._mock_mode = True

    def refine(
        self,
        image: np.ndarray,
        detections: List[Detection],
    ) -> List[Detection]:
        """
        For each detection, compute SAM mask from its bbox.
        Mutates detection.mask and detection.area_px in-place.

        Args:
            image:      RGB numpy array (H, W, 3)
            detections: Detections from RF-DETR

        Returns:
            Same list, with .mask and .area_px updated.
        """
        if not detections:
            return detections

        if self._mock_mode or self.predictor is None:
            return self._mock_refine(image, detections)

        try:
            self.predictor.set_image(image)

            for det in detections:
                x1, y1, x2, y2 = det.bbox
                input_box = np.array([x1, y1, x2, y2])

                masks, scores, _ = self.predictor.predict(
                    box=input_box[None, :],
                    multimask_output=False,
                )
                # masks shape: (1, H, W)
                best_mask = masks[0]  # boolean array
                det.mask = best_mask.astype(np.uint8)
                det.area_px = float(np.sum(best_mask))

            logger.debug(f"[SAM] Refined {len(detections)} detections")
            return detections

        except Exception as exc:
            logger.error(f"[SAM] Refinement error: {exc}")
            return self._mock_refine(image, detections)

    def extract_contour(self, mask: np.ndarray) -> List[List[int]]:
        """
        Extract polygon contour from binary mask.

        Returns list of [x, y] points (simplified polygon).
        """
        try:
            import cv2
            contours, _ = cv2.findContours(
                mask.astype(np.uint8),
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )
            if not contours:
                return []
            # Take largest contour, simplify
            c = max(contours, key=cv2.contourArea)
            epsilon = 0.01 * cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, epsilon, True)
            return approx.reshape(-1, 2).tolist()
        except Exception:
            return []

    # ── mock ──────────────────────────────────────────────────────────────────

    def _mock_refine(
        self,
        image: np.ndarray,
        detections: List[Detection],
    ) -> List[Detection]:
        """
        Mock: elliptical mask inscribed in bbox.
        More realistic than bbox area (~78% coverage).
        """
        h, w = image.shape[:2]
        for det in detections:
            x1, y1, x2, y2 = det.bbox
            bw, bh = x2 - x1, y2 - y1
            # Ellipse fill ratio ≈ π/4 ≈ 0.785
            det.area_px = bw * bh * 0.785
            # Set a simple mask (ellipse) — not used downstream unless needed
            mask = np.zeros((h, w), dtype=np.uint8)
            try:
                import cv2
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                cv2.ellipse(mask, (cx, cy), (bw // 2, bh // 2), 0, 0, 360, 1, -1)
            except Exception:
                pass
            det.mask = mask
        return detections


# ─────────────────────────────────────────────
# Thread-safe singleton
# ─────────────────────────────────────────────

_sam_instance: Optional[SAMSegmentor] = None
_sam_lock = threading.Lock()


def get_sam() -> SAMSegmentor:
    global _sam_instance
    if _sam_instance is None:
        with _sam_lock:
            if _sam_instance is None:
                logger.info("Creating SAMSegmentor singleton...")
                _sam_instance = SAMSegmentor()
    return _sam_instance
