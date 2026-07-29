"""
QAZGOST AI - YOLOv8 Detector Wrapper

Wrapper for YOLOv8 object detection with construction-specific classes.
"""

import threading
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics not installed. Detector will use mock mode.")

from app.config import settings


class Detection:
    """Single detection result."""
    
    def __init__(
        self,
        class_id: int,
        class_name: str,
        confidence: float,
        bbox: Tuple[int, int, int, int],  # x1, y1, x2, y2
        mask: Optional[np.ndarray] = None,
        area_px: Optional[float] = None
    ):
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox
        self.mask = mask
        self.area_px = area_px or self._calculate_bbox_area()
    
    def _calculate_bbox_area(self) -> float:
        """Calculate bounding box area in pixels."""
        x1, y1, x2, y2 = self.bbox
        return (x2 - x1) * (y2 - y1)
    
    @property
    def center(self) -> Tuple[int, int]:
        """Get center point of detection."""
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)
    
    @property
    def width(self) -> int:
        return self.bbox[2] - self.bbox[0]
    
    @property
    def height(self) -> int:
        return self.bbox[3] - self.bbox[1]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "class_id": self.class_id,
            "class_name": self.class_name,
            "confidence": round(self.confidence, 3),
            "bbox": list(self.bbox),
            "center": list(self.center),
            "width_px": self.width,
            "height_px": self.height,
            "area_px": round(self.area_px, 1),
            "has_mask": self.mask is not None
        }


class ConstructionDetector:
    """
    YOLOv8-based detector for construction objects.
    
    Supports both pre-trained and custom-trained models.
    Falls back to mock mode if ultralytics is not available.
    """
    
    # Class names matching dataset.yaml
    CLASS_NAMES = [
        "trench", "pit", "foundation", "pipe_pvc", "pipe_metal",
        "pipe_hdpe", "manhole", "wall_brick", "wall_block", "concrete_slab",
        "rebar", "gravel_bed", "sand_bed", "waterproofing", "insulation",
        "formwork", "pile", "measuring_tape", "person", "excavator_bucket"
    ]
    
    # Reference objects for scale calibration
    REFERENCE_CLASSES = {"measuring_tape", "person", "excavator_bucket"}
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        confidence: float = 0.25,
        iou: float = 0.45,
        device: Optional[str] = None
    ):
        self.model_path = model_path or settings.YOLO_MODEL
        self.confidence = confidence
        self.iou = iou
        self.device = device or settings.get_device()
        self.model = None
        self.model_name = self.model_path
        
        self._load_model()
    
    def _load_model(self):
        """Load YOLOv8 model."""
        if not YOLO_AVAILABLE:
            logger.warning("Running in mock mode - no actual detection")
            return
        
        try:
            # Check for custom construction model first
            custom_model_path = settings.get_model_path(settings.YOLO_CONSTRUCTION_MODEL)
            
            if custom_model_path.exists():
                logger.info(f"Loading custom model: {custom_model_path}")
                self.model = YOLO(str(custom_model_path))
                self.model_name = settings.YOLO_CONSTRUCTION_MODEL
            else:
                # Fall back to base YOLOv8 model
                logger.info(f"Loading base model: {self.model_path}")
                self.model = YOLO(self.model_path)
                self.model_name = self.model_path
            
            # Move to device
            self.model.to(self.device)
            
            # Enable half precision on GPU
            if self.device == "cuda" and settings.HALF_PRECISION:
                self.model.model.half()
            
            logger.info(f"✅ Model loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def detect(
        self,
        image: np.ndarray,
        confidence: Optional[float] = None,
        iou: Optional[float] = None,
        classes: Optional[List[int]] = None
    ) -> List[Detection]:
        """
        Detect objects in image.
        
        Args:
            image: Input image as numpy array (BGR or RGB)
            confidence: Confidence threshold (default: self.confidence)
            iou: IoU threshold for NMS (default: self.iou)
            classes: List of class IDs to detect (default: all)
        
        Returns:
            List of Detection objects
        """
        if not YOLO_AVAILABLE or self.model is None:
            return self._mock_detect(image)
        
        conf = confidence or self.confidence
        iou_thresh = iou or self.iou
        
        # Run inference
        results = self.model.predict(
            source=image,
            conf=conf,
            iou=iou_thresh,
            classes=classes,
            device=self.device,
            verbose=False
        )
        
        detections = []
        
        for result in results:
            boxes = result.boxes
            
            if boxes is None:
                continue
            
            for i in range(len(boxes)):
                # Get box coordinates
                xyxy = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = map(int, xyxy)
                
                # Get class and confidence
                class_id = int(boxes.cls[i].cpu().numpy())
                conf = float(boxes.conf[i].cpu().numpy())
                
                # Get class name
                if class_id < len(self.CLASS_NAMES):
                    class_name = self.CLASS_NAMES[class_id]
                else:
                    # Use model's class names for base YOLO
                    class_name = result.names.get(class_id, f"class_{class_id}")
                
                # Get mask if available (segmentation model)
                mask = None
                area_px = None
                
                if result.masks is not None and i < len(result.masks):
                    mask = result.masks[i].data.cpu().numpy()
                    area_px = float(np.sum(mask))
                
                detection = Detection(
                    class_id=class_id,
                    class_name=class_name,
                    confidence=conf,
                    bbox=(x1, y1, x2, y2),
                    mask=mask,
                    area_px=area_px
                )
                detections.append(detection)
        
        logger.debug(f"Detected {len(detections)} objects")
        return detections
    
    def detect_with_segmentation(
        self,
        image: np.ndarray,
        **kwargs
    ) -> List[Detection]:
        """
        Detect objects with instance segmentation.
        
        Same as detect() but uses segmentation model.
        """
        # For now, same as detect - will switch to seg model when available
        return self.detect(image, **kwargs)
    
    def find_reference_objects(
        self,
        detections: List[Detection]
    ) -> List[Detection]:
        """
        Find reference objects that can be used for scale calibration.
        
        Returns detections of measuring_tape, person, or excavator_bucket.
        """
        return [d for d in detections if d.class_name in self.REFERENCE_CLASSES]
    
    def filter_by_class(
        self,
        detections: List[Detection],
        class_names: List[str]
    ) -> List[Detection]:
        """Filter detections by class name."""
        return [d for d in detections if d.class_name in class_names]
    
    def filter_by_confidence(
        self,
        detections: List[Detection],
        min_confidence: float
    ) -> List[Detection]:
        """Filter detections by minimum confidence."""
        return [d for d in detections if d.confidence >= min_confidence]
    
    def _mock_detect(self, image: np.ndarray) -> List[Detection]:
        """
        Generate mock detections for testing without model.
        
        Creates realistic-looking detections based on image size.
        """
        h, w = image.shape[:2]
        
        # Generate some mock detections
        mock_detections = [
            Detection(
                class_id=0,
                class_name="trench",
                confidence=0.87,
                bbox=(int(w*0.1), int(h*0.3), int(w*0.9), int(h*0.7))
            ),
            Detection(
                class_id=3,
                class_name="pipe_pvc",
                confidence=0.92,
                bbox=(int(w*0.15), int(h*0.45), int(w*0.85), int(h*0.55))
            ),
            Detection(
                class_id=18,
                class_name="person",
                confidence=0.95,
                bbox=(int(w*0.8), int(h*0.2), int(w*0.95), int(h*0.9))
            )
        ]
        
        logger.debug(f"Generated {len(mock_detections)} mock detections")
        return mock_detections


# Thread-safe Singleton
_detector_instance: Optional[ConstructionDetector] = None
_detector_lock = threading.Lock()


def get_detector() -> ConstructionDetector:
    """Get or create detector singleton (thread-safe).
    
    Uses double-checked locking to avoid acquiring the lock
    on every call while preventing race conditions during first creation.
    """
    global _detector_instance
    
    if _detector_instance is None:
        with _detector_lock:
            # Double-check after acquiring lock
            if _detector_instance is None:
                logger.info("Creating ConstructionDetector singleton...")
                _detector_instance = ConstructionDetector()
    
    return _detector_instance


def reset_detector() -> None:
    """Reset the detector singleton (for testing or model reload)."""
    global _detector_instance
    with _detector_lock:
        if _detector_instance is not None:
            logger.info("Resetting ConstructionDetector singleton...")
            _detector_instance = None

