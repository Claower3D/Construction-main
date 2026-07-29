"""
QAZGOST AI - Depth Estimation Module

Monocular depth estimation using transformer-based models.
"""

import threading
from pathlib import Path
from typing import Optional, Tuple
import numpy as np
from loguru import logger

try:
    import torch
    from transformers import DPTForDepthEstimation, DPTImageProcessor
    from PIL import Image
    DEPTH_AVAILABLE = True
except ImportError:
    DEPTH_AVAILABLE = False
    logger.warning("transformers/torch not installed. Depth estimation will use mock mode.")

from app.config import settings


class DepthEstimator:
    """
    Monocular depth estimation using DPT (Dense Prediction Transformer).
    
    Supports multiple models:
    - Intel/dpt-large (default, good accuracy)
    - Intel/dpt-hybrid-midas (faster, slightly less accurate)
    - facebook/dpt-dinov2-large-kitti (trained on outdoor scenes)
    """
    
    def __init__(
        self,
        model_name: Optional[str] = None,
        device: Optional[str] = None
    ):
        self.model_name = model_name or settings.DEPTH_MODEL
        self.device = device or settings.get_device()
        self.model = None
        self.processor = None
        
        self._load_model()
    
    def _load_model(self):
        """Load depth estimation model."""
        if not DEPTH_AVAILABLE:
            logger.warning("Running in mock mode - no actual depth estimation")
            return
        
        try:
            logger.info(f"Loading depth model: {self.model_name}")
            
            self.processor = DPTImageProcessor.from_pretrained(self.model_name)
            self.model = DPTForDepthEstimation.from_pretrained(self.model_name)
            
            # Move to device
            self.model.to(self.device)
            self.model.eval()
            
            # Enable half precision on GPU
            if self.device == "cuda" and settings.HALF_PRECISION:
                self.model.half()
            
            logger.info(f"✅ Depth model loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load depth model: {e}")
            raise
    
    def estimate(
        self,
        image: np.ndarray,
        normalize: bool = True
    ) -> np.ndarray:
        """
        Estimate depth from single image.
        
        Args:
            image: Input image as numpy array (H, W, C) in RGB format
            normalize: Whether to normalize depth to [0, 1] range
        
        Returns:
            Depth map as numpy array (H, W) with relative depth values.
            Higher values = further from camera.
        """
        if not DEPTH_AVAILABLE or self.model is None:
            return self._mock_estimate(image)
        
        # Convert to PIL Image
        if isinstance(image, np.ndarray):
            pil_image = Image.fromarray(image)
        else:
            pil_image = image
        
        original_size = (image.shape[0], image.shape[1])
        
        # Preprocess
        inputs = self.processor(images=pil_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Handle half precision
        if self.device == "cuda" and settings.HALF_PRECISION:
            inputs = {k: v.half() if v.dtype == torch.float32 else v for k, v in inputs.items()}
        
        # Inference
        with torch.no_grad():
            outputs = self.model(**inputs)
            predicted_depth = outputs.predicted_depth
        
        # Interpolate to original size
        depth_map = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=original_size,
            mode="bicubic",
            align_corners=False,
        ).squeeze()
        
        # Convert to numpy
        depth_map = depth_map.cpu().numpy()
        
        # Normalize to [0, 1]
        if normalize:
            depth_min = depth_map.min()
            depth_max = depth_map.max()
            if depth_max - depth_min > 0:
                depth_map = (depth_map - depth_min) / (depth_max - depth_min)
        
        return depth_map
    
    def estimate_absolute_depth(
        self,
        image: np.ndarray,
        reference_distance: float,
        reference_bbox: Tuple[int, int, int, int]
    ) -> np.ndarray:
        """
        Estimate absolute depth using a reference object with known distance.
        
        Args:
            image: Input image
            reference_distance: Known distance to reference object in meters
            reference_bbox: Bounding box of reference object (x1, y1, x2, y2)
        
        Returns:
            Depth map in meters
        """
        # Get relative depth map
        relative_depth = self.estimate(image, normalize=False)
        
        # Get average depth at reference location
        x1, y1, x2, y2 = reference_bbox
        reference_depth = np.mean(relative_depth[y1:y2, x1:x2])
        
        # Calculate scale factor
        # depth_in_meters = relative_depth * scale_factor
        scale_factor = reference_distance / reference_depth
        
        # Convert to absolute depth
        absolute_depth = relative_depth * scale_factor
        
        return absolute_depth
    
    def get_depth_at_point(
        self,
        depth_map: np.ndarray,
        point: Tuple[int, int]
    ) -> float:
        """
        Get depth value at specific point.
        
        Args:
            depth_map: Depth map array
            point: (x, y) coordinates
        
        Returns:
            Depth value at point
        """
        x, y = point
        h, w = depth_map.shape
        
        # Clamp to valid range
        x = max(0, min(x, w - 1))
        y = max(0, min(y, h - 1))
        
        return float(depth_map[y, x])
    
    def get_depth_in_region(
        self,
        depth_map: np.ndarray,
        bbox: Tuple[int, int, int, int]
    ) -> dict:
        """
        Get depth statistics in a bounding box region.
        
        Returns:
            dict with min, max, mean, median depth values
        """
        x1, y1, x2, y2 = bbox
        h, w = depth_map.shape
        
        # Clamp to valid range
        x1 = max(0, min(x1, w))
        x2 = max(0, min(x2, w))
        y1 = max(0, min(y1, h))
        y2 = max(0, min(y2, h))
        
        region = depth_map[y1:y2, x1:x2]
        
        if region.size == 0:
            return {"min": 0, "max": 0, "mean": 0, "median": 0}
        
        return {
            "min": float(np.min(region)),
            "max": float(np.max(region)),
            "mean": float(np.mean(region)),
            "median": float(np.median(region)),
            "std": float(np.std(region))
        }
    
    def estimate_object_depth(
        self,
        depth_map: np.ndarray,
        bbox: Tuple[int, int, int, int],
        method: str = "bottom"
    ) -> float:
        """
        Estimate depth at object location.
        
        Args:
            depth_map: Depth map array
            bbox: Object bounding box (x1, y1, x2, y2)
            method: How to calculate depth
                - "center": depth at center point
                - "mean": mean depth in bbox
                - "bottom": depth at bottom of bbox (for standing objects)
        
        Returns:
            Estimated depth value
        """
        x1, y1, x2, y2 = bbox
        
        if method == "center":
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            return self.get_depth_at_point(depth_map, (center_x, center_y))
        
        elif method == "mean":
            stats = self.get_depth_in_region(depth_map, bbox)
            return stats["mean"]
        
        elif method == "bottom":
            # Use bottom 20% of bbox
            bottom_y1 = y2 - int((y2 - y1) * 0.2)
            stats = self.get_depth_in_region(depth_map, (x1, bottom_y1, x2, y2))
            return stats["mean"]
        
        else:
            raise ValueError(f"Unknown method: {method}")
    
    def _mock_estimate(self, image: np.ndarray) -> np.ndarray:
        """
        Generate mock depth map for testing.
        
        Creates a gradient depth map with some random variation.
        """
        h, w = image.shape[:2]
        
        # Create base gradient (top=far, bottom=near)
        y_coords = np.linspace(0, 1, h)
        depth_map = np.tile(y_coords, (w, 1)).T
        
        # Add some noise
        noise = np.random.normal(0, 0.05, (h, w))
        depth_map = np.clip(depth_map + noise, 0, 1)
        
        logger.debug(f"Generated mock depth map {h}x{w}")
        return depth_map.astype(np.float32)


# Thread-safe Singleton
_depth_instance: Optional[DepthEstimator] = None
_depth_lock = threading.Lock()


def get_depth_estimator() -> DepthEstimator:
    """Get or create depth estimator singleton (thread-safe).
    
    Uses double-checked locking to avoid acquiring the lock
    on every call while preventing race conditions during first creation.
    """
    global _depth_instance
    
    if _depth_instance is None:
        with _depth_lock:
            # Double-check after acquiring lock
            if _depth_instance is None:
                logger.info("Creating DepthEstimator singleton...")
                _depth_instance = DepthEstimator()
    
    return _depth_instance


def reset_depth_estimator() -> None:
    """Reset the depth estimator singleton (for testing or model reload)."""
    global _depth_instance
    with _depth_lock:
        if _depth_instance is not None:
            logger.info("Resetting DepthEstimator singleton...")
            _depth_instance = None

