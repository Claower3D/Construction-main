"""
QazGost AI — Multi-Scale Crack & Defect Extraction Engine (v3.0)

Isolates:
  1. Top vertical fracture splitting the top ring rim.
  2. Right through-wall horizontal/radial fracture.
  3. Inner shelf chips/spalls.
  4. Lower-left concrete pitting and surface spalls.
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
    Extract all true structural fractures, cracks, and surface spalls strictly on the concrete ring.
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Dark fissure response via Gaussian background subtraction
    bg = cv2.GaussianBlur(gray, (19, 19), 0)
    diff = bg.astype(float) - gray.astype(float)
    diff_pixels = (diff > max(9.0, 15.0 - sensitivity * 9.0)) & ring_mask

    # 2. Multi-angle directional BlackHat filters
    k_v1 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 25))  # Long vertical through-cracks
    k_v2 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 15))  # Medium vertical
    k_h = cv2.getStructuringElement(cv2.MORPH_RECT, (19, 3))   # Horizontal fractures
    k_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))  # Diagonal fissures

    bh_v1 = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, k_v1)
    bh_v2 = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, k_v2)
    bh_h = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, k_h)
    bh_d = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, k_d)
    bh_max = np.maximum(np.maximum(bh_v1, bh_v2), np.maximum(bh_h, bh_d))
    bh_pixels = (bh_max > max(5.0, 10.0 - sensitivity * 7.0)) & ring_mask

    # 3. High gradient edge response on concrete textures
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    gmag = cv2.magnitude(gx, gy)
    edge_pixels = (gmag > 32.0) & (gray < 175) & ring_mask

    combined_signal = (diff_pixels | bh_pixels | edge_pixels) & ring_mask
    if central_hole_mask is not None:
        combined_signal &= (~central_hole_mask)

    # Bridge close adjacent segments without merging distant defects
    bridge_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    connected = cv2.morphologyEx(combined_signal.astype(np.uint8), cv2.MORPH_CLOSE, bridge_k)

    return (connected > 0) & ring_mask
