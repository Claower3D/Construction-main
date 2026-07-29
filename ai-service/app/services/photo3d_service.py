"""
QAZGOST AI - Photo3D SfM Service Wrapper

Wraps WebVersion/backend/photo3d.py functions for use in FastAPI pipeline.
Accepts multiple images as numpy arrays, returns structured measurements.
"""

import os
import sys
import tempfile
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

import numpy as np
from loguru import logger

# Add photo3d location to path
_PHOTO3D_DIR = Path(__file__).resolve().parent.parent.parent.parent / "WebVersion" / "backend"
if str(_PHOTO3D_DIR) not in sys.path:
    sys.path.insert(0, str(_PHOTO3D_DIR))

try:
    import cv2
    CV2_OK = True
except ImportError:
    CV2_OK = False


class Photo3DService:
    """
    SfM-based 3D measurement service.

    Accepts 3-10 photos of a construction object taken from different angles,
    reconstructs a sparse 3D point cloud, fits planes, and returns
    area, perimeter, volume, and height measurements.

    Uses: AKAZE features → RANSAC Essential Matrix → Triangulation → Plane Fitting
    """

    def __init__(self, marker_size_m: float = 0.15):
        self.marker_size_m = marker_size_m
        self._photo3d = None
        self._load_photo3d()

    def _load_photo3d(self):
        """Lazy-load photo3d module."""
        try:
            import photo3d
            self._photo3d = photo3d
            logger.info("[Photo3D] Module loaded successfully")
        except ImportError as e:
            logger.warning(f"[Photo3D] Cannot import photo3d: {e}")

    def analyze_images(
        self,
        images: List[np.ndarray],
        scale_hint: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Analyze multiple photos for 3D reconstruction.

        Args:
            images: List of RGB numpy arrays (3-10 photos)
            scale_hint: Optional known scale factor (m/px)

        Returns:
            Dict with area_m2, perimeter_m, volume_m3, height_m,
            confidence, method, planes, etc.
        """
        if not self._photo3d:
            return self._mock_result(len(images))

        if len(images) < 2:
            return self._single_image_result(images[0] if images else None)

        p3d = self._photo3d

        try:
            # Step 1: ArUco scale detection
            aruco_scale = p3d.detect_aruco_scale(images, self.marker_size_m)
            scale_factor = scale_hint or aruco_scale
            scale_method = "user_hint" if scale_hint else (
                "aruco" if aruco_scale else "heuristic"
            )
            logger.info(f"[Photo3D] Scale: {scale_factor} via {scale_method}")

            # Step 2: SfM — recover 3D points
            pts3d, cam_positions = p3d.recover_poses(images)

            if pts3d is None or len(pts3d) < 10:
                logger.warning("[Photo3D] Not enough 3D points, falling back to single image")
                return self._single_image_result(images[0])

            logger.info(f"[Photo3D] Reconstructed {len(pts3d)} 3D points from {len(images)} photos")

            # Step 3: Extract planes
            planes = p3d.extract_planes(pts3d)
            logger.info(f"[Photo3D] Found {len(planes)} planes")

            # Step 4: Compute dimensions
            dims = p3d.compute_dimensions_from_planes(planes, pts3d)

            # Step 5: Calibrate to real-world units
            calibrated = p3d.calibrate_to_real(dims, scale_factor)

            return {
                "success": True,
                "area_m2": calibrated.get("area_m2", 0),
                "perimeter_m": calibrated.get("perimeter_m", 0),
                "volume_m3": calibrated.get("volume_m3", 0),
                "height_m": calibrated.get("height_m", 0),
                "confidence": calibrated.get("confidence", 0.5),
                "method": "sfm_ransac",
                "scale_method": scale_method,
                "scale_factor": scale_factor,
                "num_points_3d": len(pts3d),
                "num_planes": len(planes),
                "num_cameras": len(cam_positions) if cam_positions is not None else 0,
                "planes": [
                    {
                        "area_raw": p.get("area_raw", 0),
                        "perimeter_raw": p.get("perimeter_raw", 0),
                        "normal": list(p.get("normal", [0, 0, 1])),
                    }
                    for p in planes[:5]
                ],
                "warnings": calibrated.get("warnings", []),
            }

        except Exception as e:
            logger.error(f"[Photo3D] SfM error: {e}")
            return {
                "success": False,
                "error": str(e),
                "method": "sfm_failed",
                "confidence": 0,
                **self._single_image_result(images[0]),
            }

    def analyze_from_files(
        self,
        file_paths: List[str],
        scale_hint: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Analyze from file paths instead of numpy arrays."""
        if not CV2_OK:
            return self._mock_result(len(file_paths))

        images = []
        for fp in file_paths:
            img = cv2.imread(fp)
            if img is not None:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                images.append(img)

        if not images:
            return {"success": False, "error": "No valid images found"}

        return self.analyze_images(images, scale_hint)

    def _single_image_result(self, image: Optional[np.ndarray]) -> Dict[str, Any]:
        """Fallback for single/no image."""
        if image is not None and self._photo3d:
            try:
                result = self._photo3d.fallback_single_image([image])
                return {
                    "success": True,
                    "method": "single_image_fallback",
                    "confidence": 0.35,
                    **result,
                }
            except Exception:
                pass

        return self._mock_result(1 if image is not None else 0)

    def _mock_result(self, num_images: int) -> Dict[str, Any]:
        """Mock result when photo3d is unavailable."""
        return {
            "success": True,
            "area_m2": 25.0,
            "perimeter_m": 20.0,
            "volume_m3": 12.5,
            "height_m": 0.5,
            "confidence": 0.3,
            "method": "mock",
            "scale_method": "none",
            "num_points_3d": 0,
            "num_planes": 0,
            "num_cameras": 0,
            "num_images_received": num_images,
            "planes": [],
            "warnings": [
                "Photo3D модуль не доступен — используются примерные значения",
                f"Получено {num_images} фото, нужно 3-10 для 3D реконструкции",
            ],
            "_mock": True,
        }


# ─────────────────────────────────────────────
# Singleton
# ─────────────────────────────────────────────
import threading

_sfm_instance: Optional[Photo3DService] = None
_sfm_lock = threading.Lock()


def get_photo3d_service() -> Photo3DService:
    global _sfm_instance
    if _sfm_instance is None:
        with _sfm_lock:
            if _sfm_instance is None:
                _sfm_instance = Photo3DService()
    return _sfm_instance
