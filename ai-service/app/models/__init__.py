"""App models package."""

from app.models.detector import Detection, ConstructionDetector, get_detector
from app.models.depth import DepthEstimator, get_depth_estimator

__all__ = [
    "Detection",
    "ConstructionDetector", 
    "get_detector",
    "DepthEstimator",
    "get_depth_estimator"
]
