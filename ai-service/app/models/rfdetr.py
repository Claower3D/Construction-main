"""
QAZGOST AI - RF-DETR Detector Wrapper

RF-DETR (Apache 2.0) — transfer-friendly transformer detector.
Falls back gracefully to mock mode if model/weights not available.
"""

import threading
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from loguru import logger

# RF-DETR (rfdetr package or local clone)
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not installed. RF-DETR will run in mock mode.")

try:
    from rfdetr import RFDETRBase  # pip install rfdetr
    RFDETR_AVAILABLE = True
except ImportError:
    RFDETR_AVAILABLE = False
    logger.warning("rfdetr package not installed. Running in mock mode.")

from app.config import settings


# ─────────────────────────────────────────────
# Detection dataclass (same as legacy detector)
# ─────────────────────────────────────────────

class Detection:
    """Single detection result (RF-DETR compatible)."""

    def __init__(
        self,
        class_id: int,
        class_name: str,
        confidence: float,
        bbox: Tuple[int, int, int, int],   # x1, y1, x2, y2
        mask: Optional[np.ndarray] = None,
        area_px: Optional[float] = None,
    ):
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox
        self.mask = mask
        self.area_px = area_px or self._bbox_area()

    def _bbox_area(self) -> float:
        x1, y1, x2, y2 = self.bbox
        return max(0.0, (x2 - x1) * (y2 - y1))

    @property
    def center(self) -> Tuple[int, int]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)

    @property
    def width(self) -> int:
        return self.bbox[2] - self.bbox[0]

    @property
    def height(self) -> int:
        return self.bbox[3] - self.bbox[1]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_id":   self.class_id,
            "class_name": self.class_name,
            "confidence": round(self.confidence, 3),
            "bbox":       list(self.bbox),
            "center":     list(self.center),
            "width_px":   self.width,
            "height_px":  self.height,
            "area_px":    round(self.area_px, 1),
            "has_mask":   self.mask is not None,
        }


# ─────────────────────────────────────────────
# RF-DETR Detector
# ─────────────────────────────────────────────

class RFDETRDetector:
    """
    RF-DETR based detector for construction objects.

    Architecture:
      - Backbone: DINOv2 (frozen) + RF attention projection
      - Head: DETR decoder + classification + bbox
      - Fine-tuned on QAZGOST construction dataset

    Falls back to mock mode when weights are unavailable.
    """

    # Same class list as YOLO wrapper — compatible with existing estimator
    CLASS_NAMES = [
        "trench", "pit", "foundation", "pipe_pvc", "pipe_metal",
        "pipe_hdpe", "manhole", "wall_brick", "wall_block", "concrete_slab",
        "rebar", "gravel_bed", "sand_bed", "waterproofing", "insulation",
        "formwork", "pile", "measuring_tape", "person", "excavator_bucket"
    ]

    REFERENCE_CLASSES = {"measuring_tape", "person", "excavator_bucket"}

    def __init__(
        self,
        weights_path: Optional[str] = None,
        confidence: float = 0.30,
        device: Optional[str] = None,
    ):
        self.confidence = confidence
        self.device = device or settings.get_device()
        self.model = None
        self._mock_mode = True

        # Resolve weights path
        if weights_path:
            p = Path(weights_path)
        else:
            p = settings.get_model_path("rfdetr_construction.pth")

        self.weights_path = p
        self._load_model()

    def _load_model(self):
        if not RFDETR_AVAILABLE or not TORCH_AVAILABLE:
            logger.warning("[RF-DETR] Running in mock mode (package unavailable)")
            return

        # Try custom construction weights first
        if self.weights_path.exists():
            try:
                logger.info(f"[RF-DETR] Loading custom weights from {self.weights_path} on {self.device}")
                self.model = RFDETRBase(
                    pretrain_weights=str(self.weights_path),
                    num_classes=len(self.CLASS_NAMES),
                    device=self.device,
                )
                self._mock_mode = False
                self._using_coco = False
                logger.info("[RF-DETR] ✅ Custom construction model loaded")
                return
            except Exception as exc:
                logger.warning(f"[RF-DETR] Custom weights failed: {exc}")

        # Fallback: use pretrained COCO model (downloads automatically)
        try:
            logger.info(f"[RF-DETR] Custom weights not found at {self.weights_path}. "
                        "Loading pretrained COCO model as fallback...")
            self.model = RFDETRBase(device=self.device)
            self._mock_mode = False
            self._using_coco = True
            logger.info("[RF-DETR] ✅ Pretrained COCO model loaded (fallback)")
        except Exception as exc:
            logger.error(f"[RF-DETR] All load attempts failed: {exc}")
            self._mock_mode = True
            self._using_coco = False

    # COCO → construction class mapping (best-effort)
    COCO_TO_CONSTRUCTION = {
        "person": "person",
        "truck": "excavator_bucket",
        "car": "person",
        "bicycle": "person",
    }

    def detect(
        self,
        image: np.ndarray,
        confidence: Optional[float] = None,
    ) -> List[Detection]:
        """
        Detect construction objects in image.

        Args:
            image: RGB numpy array (H, W, 3)
            confidence: Confidence threshold override

        Returns:
            List[Detection]
        """
        if self._mock_mode or self.model is None:
            return self._mock_detect(image)

        conf_thresh = confidence or self.confidence

        try:
            import torch
            from PIL import Image as PILImage

            pil_img = PILImage.fromarray(image.astype(np.uint8))
            with torch.no_grad():
                outputs = self.model.predict(pil_img, threshold=conf_thresh)

            detections = []
            h, w = image.shape[:2]

            # supervision.Detections format (from rfdetr package)
            if hasattr(outputs, "xyxy"):
                coco_names = getattr(self.model, "class_names", {})
                for i in range(len(outputs)):
                    x1, y1, x2, y2 = [int(v) for v in outputs.xyxy[i]]
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)
                    class_id = int(outputs.class_id[i])
                    score = float(outputs.confidence[i])

                    # Get class name — COCO names if using pretrained
                    if getattr(self, "_using_coco", False) and coco_names:
                        raw_name = coco_names.get(class_id, f"class_{class_id}")
                        class_name = self.COCO_TO_CONSTRUCTION.get(raw_name, raw_name)
                    elif class_id < len(self.CLASS_NAMES):
                        class_name = self.CLASS_NAMES[class_id]
                    else:
                        class_name = f"class_{class_id}"

                    detections.append(Detection(
                        class_id=class_id,
                        class_name=class_name,
                        confidence=score,
                        bbox=(x1, y1, x2, y2),
                    ))
            else:
                # Legacy list-of-dicts format
                for det in outputs:
                    class_id = int(det["class_id"])
                    class_name = (
                        self.CLASS_NAMES[class_id]
                        if class_id < len(self.CLASS_NAMES)
                        else f"class_{class_id}"
                    )
                    x1, y1, x2, y2 = [int(v) for v in det["bbox_xyxy"]]
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)

                    detections.append(Detection(
                        class_id=class_id,
                        class_name=class_name,
                        confidence=float(det["score"]),
                        bbox=(x1, y1, x2, y2),
                    ))

            logger.debug(f"[RF-DETR] Detected {len(detections)} objects")
            return detections

        except Exception as exc:
            logger.error(f"[RF-DETR] Inference error: {exc}")
            return self._mock_detect(image)

    def find_reference_objects(self, detections: List[Detection]) -> List[Detection]:
        return [d for d in detections if d.class_name in self.REFERENCE_CLASSES]

    # ── mock ──────────────────────────────────────────────────────────────────

    def _mock_detect(self, image: np.ndarray) -> List[Detection]:
        """Realistic mock detections for development / CI."""
        h, w = image.shape[:2]
        logger.debug("[RF-DETR] Generating mock detections")
        return [
            Detection(
                class_id=2,
                class_name="foundation",
                confidence=0.89,
                bbox=(int(w * 0.05), int(h * 0.25), int(w * 0.95), int(h * 0.75)),
            ),
            Detection(
                class_id=10,
                class_name="rebar",
                confidence=0.82,
                bbox=(int(w * 0.1), int(h * 0.3), int(w * 0.9), int(h * 0.7)),
            ),
            Detection(
                class_id=15,
                class_name="formwork",
                confidence=0.76,
                bbox=(int(w * 0.05), int(h * 0.2), int(w * 0.5), int(h * 0.8)),
            ),
            Detection(
                class_id=18,
                class_name="person",
                confidence=0.95,
                bbox=(int(w * 0.82), int(h * 0.15), int(w * 0.97), int(h * 0.95)),
            ),
        ]


# ─────────────────────────────────────────────
# Thread-safe singleton
# ─────────────────────────────────────────────

_rfdetr_instance: Optional[RFDETRDetector] = None
_rfdetr_lock = threading.Lock()


def get_rfdetr() -> RFDETRDetector:
    """Return (or create) RF-DETR singleton — thread-safe."""
    global _rfdetr_instance
    if _rfdetr_instance is None:
        with _rfdetr_lock:
            if _rfdetr_instance is None:
                logger.info("Creating RFDETRDetector singleton...")
                _rfdetr_instance = RFDETRDetector()
    return _rfdetr_instance


def reset_rfdetr() -> None:
    """Reset singleton (for testing or weight reload)."""
    global _rfdetr_instance
    with _rfdetr_lock:
        _rfdetr_instance = None
