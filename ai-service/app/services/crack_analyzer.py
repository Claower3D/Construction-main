"""
QazGost AI — Multi-Scale Crack & Defect Extraction Engine (v4.0 Precision Edition)

Extracts true structural fractures, cracks, and surface spalls strictly on concrete bodies:
  1. Directional valley and fissure profiling.
  2. Multi-angle directional BlackHat filters.
  3. Strict suppression of background and perimeter silhouette boundaries.
"""

from typing import List, Tuple, Dict, Any
import cv2
import numpy as np
from loguru import logger


def detect_fine_cracks(
    image_bgr: np.ndarray,
    ring_mask: np.ndarray,
    central_hole_mask: np.ndarray = None,
    sensitivity: float = 0.65
) -> np.ndarray:
    """
    Extract all true structural fractures, cracks, and surface spalls strictly on the concrete body.
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Structure interior boundary suppression
    ring_boundary = cv2.morphologyEx(ring_mask.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((9, 9), np.uint8)) > 0
    safe_interior = (cv2.erode(ring_mask.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0) & (~ring_boundary)
    if central_hole_mask is not None:
        safe_interior &= (~central_hole_mask)

    smooth = cv2.bilateralFilter(gray, 7, 28, 28)

    # 2. Symmetric 1D valley profile across 4 principal angles
    valley_max = np.zeros_like(gray, dtype=np.float32)
    for theta_deg in [0, 45, 90, 135]:
        theta = np.deg2rad(theta_deg)
        nx, ny = np.cos(theta + np.pi / 2), np.sin(theta + np.pi / 2)
        for d in [2, 3, 5]:
            dx1, dy1 = int(round(nx * d)), int(round(ny * d))
            dx2, dy2 = int(round(-nx * d)), int(round(-ny * d))
            s1 = np.roll(np.roll(smooth, dy1, axis=0), dx1, axis=1).astype(float)
            s2 = np.roll(np.roll(smooth, dy2, axis=0), dx2, axis=1).astype(float)
            dip = np.maximum(0, np.minimum(s1 - smooth, s2 - smooth))
            valley_max = np.maximum(valley_max, dip)

    # 3. Directional BlackHat filters
    k_v = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 21))
    k_h = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 3))
    k_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))

    bh_v = cv2.morphologyEx(smooth, cv2.MORPH_BLACKHAT, k_v)
    bh_h = cv2.morphologyEx(smooth, cv2.MORPH_BLACKHAT, k_h)
    bh_d = cv2.morphologyEx(smooth, cv2.MORPH_BLACKHAT, k_d)
    bh_comb = np.maximum(np.maximum(bh_v, bh_h), bh_d)

    # Thresholds adaptive to sensitivity
    v_thresh = max(4.0, 7.5 - sensitivity * 3.5)
    bh_thresh = max(4.5, 8.0 - sensitivity * 3.5)

    crack_pixels = ((valley_max > v_thresh) | (bh_comb > bh_thresh)) & safe_interior

    # 4. Spalling / Surface chips
    lap = cv2.Laplacian(smooth, cv2.CV_32F)
    local_roughness = cv2.blur(np.abs(lap), (9, 9))
    spall_pixels = (local_roughness > 16.0) & (bh_comb > 4.0) & safe_interior

    combined_signal = (crack_pixels | spall_pixels).astype(np.uint8)

    # Connect adjacent crack segments along vertical and diagonal directions
    v_bridge = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 9))
    connected = cv2.morphologyEx(combined_signal, cv2.MORPH_CLOSE, v_bridge)
    connected = cv2.morphologyEx(connected, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))

    return (connected > 0) & safe_interior
