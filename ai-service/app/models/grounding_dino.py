"""
QAZGOST AI - Grounding DINO Detector

Open-vocabulary object detection: detect ANY construction object by text query.
Grounding DINO 1.5 + tiling for small objects (fasteners, cracks, wires).

Pipeline:
  1. User/system provides text captions: "wall . crack . pipe . rebar"
  2. Grounding DINO returns bboxes with class labels
  3. Pass bboxes to SAM 2 for precise masks

License: Apache 2.0 (IDEA-Research)
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

# Grounding DINO via autodistill / groundingdino package
try:
    from groundingdino.util.inference import load_model, predict
    GDINO_AVAILABLE = True
except ImportError:
    GDINO_AVAILABLE = False
    logger.warning("groundingdino not installed. Running in mock mode.")

from app.config import settings
from app.models.rfdetr import Detection


# ─────────────────────────────────────────────
# Construction-specific text prompts
# ─────────────────────────────────────────────

# Default prompts for construction scene analysis
CONSTRUCTION_PROMPTS = {
    "structure": "wall . floor . ceiling . column . beam . slab . foundation . roof",
    "openings":  "window . door . doorway . opening . arch",
    "materials": "brick . concrete block . rebar . formwork . insulation . waterproofing . plaster . tile",
    "defects":   "crack . stain . mold . rust . corrosion . spalling . delamination . efflorescence",
    "pipes":     "pipe . duct . ventilation . cable tray . conduit . drain . manhole",
    "fasteners": "bolt . nut . anchor . bracket . clamp . hanger . profile . drywall screw",
    "equipment": "excavator . crane . scaffolding . ladder . wheelbarrow . concrete mixer",
    "reference": "measuring tape . ruler . person . door . car . brick . A4 paper . credit card",
}

# Merged prompt for full scene analysis
FULL_SCENE_PROMPT = " . ".join([
    CONSTRUCTION_PROMPTS["structure"],
    CONSTRUCTION_PROMPTS["openings"],
    CONSTRUCTION_PROMPTS["materials"],
    CONSTRUCTION_PROMPTS["defects"],
    CONSTRUCTION_PROMPTS["pipes"],
    CONSTRUCTION_PROMPTS["reference"],
])

# Category mapping: detected label → category
LABEL_TO_CATEGORY = {}
for cat, prompt in CONSTRUCTION_PROMPTS.items():
    for label in prompt.split(" . "):
        LABEL_TO_CATEGORY[label.strip().lower()] = cat


class GroundingDINODetector:
    """
    Open-vocabulary construction object detector.

    Unlike RF-DETR (fixed classes), Grounding DINO can detect ANY object
    described by a text query. This is crucial for:
    - Finding objects not in RF-DETR training set
    - Detecting specific materials ("brick", "concrete block")
    - Finding defects ("crack", "mold", "rust")
    - Finding scale references ("A4 paper", "credit card")
    """

    def __init__(
        self,
        config_path: Optional[str] = None,
        weights_path: Optional[str] = None,
        device: Optional[str] = None,
    ):
        self.device = device or settings.get_device()
        self.model = None
        self._mock_mode = True

        # Resolve paths
        if config_path:
            self.config_path = Path(config_path)
        else:
            self.config_path = settings.get_model_path("GroundingDINO_SwinT_OGC.py")

        if weights_path:
            self.weights_path = Path(weights_path)
        else:
            self.weights_path = settings.get_model_path("groundingdino_swint_ogc.pth")

        self._load_model()

    def _load_model(self):
        if not GDINO_AVAILABLE or not TORCH_AVAILABLE:
            logger.warning("[GroundingDINO] Running in mock mode (package unavailable)")
            return

        if not self.weights_path.exists():
            logger.warning(
                f"[GroundingDINO] Weights not found at {self.weights_path}. "
                "Mock mode. Download: https://github.com/IDEA-Research/GroundingDINO"
            )
            return

        try:
            logger.info(f"[GroundingDINO] Loading model on {self.device}")
            self.model = load_model(
                str(self.config_path),
                str(self.weights_path),
                device=self.device,
            )
            self._mock_mode = False
            logger.info("[GroundingDINO] ✅ Model loaded successfully")
        except Exception as exc:
            logger.error(f"[GroundingDINO] Failed to load: {exc}")
            self._mock_mode = True

    def detect(
        self,
        image: np.ndarray,
        text_prompt: Optional[str] = None,
        box_threshold: float = 0.30,
        text_threshold: float = 0.25,
        tile_mode: bool = False,
    ) -> List[Detection]:
        """
        Detect objects matching text description.

        Args:
            image:          RGB numpy array (H, W, 3)
            text_prompt:    Text query, e.g. "wall . crack . pipe"
                           Uses FULL_SCENE_PROMPT if None
            box_threshold:  Confidence threshold for boxes
            text_threshold: Confidence threshold for text matching
            tile_mode:      If True, split image into tiles for small objects

        Returns:
            List[Detection] with class_name from text query
        """
        prompt = text_prompt or FULL_SCENE_PROMPT

        if self._mock_mode or self.model is None:
            return self._mock_detect(image, prompt)

        if tile_mode:
            return self._detect_with_tiling(image, prompt, box_threshold, text_threshold)

        return self._detect_single(image, prompt, box_threshold, text_threshold)

    def _detect_single(
        self,
        image: np.ndarray,
        prompt: str,
        box_threshold: float,
        text_threshold: float,
    ) -> List[Detection]:
        """Run detection on a single image."""
        try:
            import torch
            from PIL import Image as PILImage

            pil_img = PILImage.fromarray(image.astype(np.uint8))

            boxes, logits, phrases = predict(
                model=self.model,
                image=pil_img,
                caption=prompt,
                box_threshold=box_threshold,
                text_threshold=text_threshold,
                device=self.device,
            )

            h, w = image.shape[:2]
            detections = []

            for i, (box, logit, phrase) in enumerate(zip(boxes, logits, phrases)):
                # Grounding DINO returns normalized cx, cy, w, h
                cx, cy, bw, bh = box.tolist()
                x1 = int((cx - bw / 2) * w)
                y1 = int((cy - bh / 2) * h)
                x2 = int((cx + bw / 2) * w)
                y2 = int((cy + bh / 2) * h)

                # Clamp to image bounds
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)

                label = phrase.strip().lower()
                category = LABEL_TO_CATEGORY.get(label, "unknown")

                detections.append(Detection(
                    class_id=i,
                    class_name=label,
                    confidence=float(logit),
                    bbox=(x1, y1, x2, y2),
                ))

            logger.info(f"[GroundingDINO] Detected {len(detections)} objects")
            return detections

        except Exception as exc:
            logger.error(f"[GroundingDINO] Inference error: {exc}")
            return self._mock_detect(image, prompt)

    def _detect_with_tiling(
        self,
        image: np.ndarray,
        prompt: str,
        box_threshold: float,
        text_threshold: float,
        tile_size: int = 640,
        overlap: float = 0.2,
    ) -> List[Detection]:
        """
        Split image into overlapping tiles for detecting small objects.

        Useful for: fasteners, cracks, small pipes, wiring.
        """
        h, w = image.shape[:2]
        stride = int(tile_size * (1 - overlap))
        all_detections = []

        for y_start in range(0, h, stride):
            for x_start in range(0, w, stride):
                y_end = min(y_start + tile_size, h)
                x_end = min(x_start + tile_size, w)
                tile = image[y_start:y_end, x_start:x_end]

                tile_dets = self._detect_single(tile, prompt, box_threshold, text_threshold)

                # Remap bbox coordinates to full image
                for det in tile_dets:
                    x1, y1, x2, y2 = det.bbox
                    det.bbox = (x1 + x_start, y1 + y_start, x2 + x_start, y2 + y_start)
                    all_detections.append(det)

        # NMS to remove duplicates from overlapping tiles
        all_detections = self._nms(all_detections, iou_threshold=0.5)
        logger.info(f"[GroundingDINO] Tiled detection: {len(all_detections)} objects (after NMS)")
        return all_detections

    def _nms(self, detections: List[Detection], iou_threshold: float = 0.5) -> List[Detection]:
        """Non-Maximum Suppression across tiles."""
        if not detections:
            return []

        # Sort by confidence descending
        detections.sort(key=lambda d: d.confidence, reverse=True)
        keep = []

        for det in detections:
            should_keep = True
            for kept in keep:
                if det.class_name != kept.class_name:
                    continue
                if self._iou(det.bbox, kept.bbox) > iou_threshold:
                    should_keep = False
                    break
            if should_keep:
                keep.append(det)

        return keep

    @staticmethod
    def _iou(box1: tuple, box2: tuple) -> float:
        """Calculate IoU between two bboxes (x1,y1,x2,y2)."""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - inter

        return inter / union if union > 0 else 0

    def detect_defects(self, image: np.ndarray) -> List[Detection]:
        """Detect only defects (cracks, stains, mold, rust, corrosion)."""
        return self.detect(
            image,
            text_prompt=CONSTRUCTION_PROMPTS["defects"],
            box_threshold=0.25,
            text_threshold=0.20,
            tile_mode=True,  # Defects are often small
        )

    def detect_references(self, image: np.ndarray) -> List[Detection]:
        """Detect only scale reference objects."""
        return self.detect(
            image,
            text_prompt=CONSTRUCTION_PROMPTS["reference"],
            box_threshold=0.35,
        )

    def detect_materials(self, image: np.ndarray) -> List[Detection]:
        """Detect visible construction materials."""
        return self.detect(
            image,
            text_prompt=CONSTRUCTION_PROMPTS["materials"],
            box_threshold=0.30,
        )

    # ── mock ──────────────────────────────────────────────────────────────────

    def _mock_detect(self, image: np.ndarray, prompt: str) -> List[Detection]:
        """Realistic mock detections for development / CI."""
        h, w = image.shape[:2]
        logger.debug("[GroundingDINO] Generating mock detections")

        # Parse prompt labels to generate relevant mocks
        labels = [l.strip() for l in prompt.split(".") if l.strip()]
        mock_dets = []

        # Generate 3-5 mock detections from the prompt labels
        mock_configs = [
            {"label": "wall",       "conf": 0.87, "box": (0.05, 0.10, 0.95, 0.85)},
            {"label": "crack",      "conf": 0.72, "box": (0.30, 0.40, 0.45, 0.60)},
            {"label": "concrete block","conf": 0.81,"box": (0.10, 0.15, 0.50, 0.70)},
            {"label": "person",     "conf": 0.93, "box": (0.80, 0.10, 0.95, 0.90)},
            {"label": "rebar",      "conf": 0.78, "box": (0.15, 0.30, 0.85, 0.45)},
        ]

        for i, mc in enumerate(mock_configs):
            if mc["label"] in prompt.lower() or len(mock_dets) < 3:
                bx = mc["box"]
                mock_dets.append(Detection(
                    class_id=i,
                    class_name=mc["label"],
                    confidence=mc["conf"],
                    bbox=(int(bx[0]*w), int(bx[1]*h), int(bx[2]*w), int(bx[3]*h)),
                ))

        return mock_dets[:5]


# ─────────────────────────────────────────────
# Thread-safe singleton
# ─────────────────────────────────────────────

_gdino_instance: Optional[GroundingDINODetector] = None
_gdino_lock = threading.Lock()


def get_grounding_dino() -> GroundingDINODetector:
    """Return (or create) Grounding DINO singleton — thread-safe."""
    global _gdino_instance
    if _gdino_instance is None:
        with _gdino_lock:
            if _gdino_instance is None:
                logger.info("Creating GroundingDINODetector singleton...")
                _gdino_instance = GroundingDINODetector()
    return _gdino_instance
