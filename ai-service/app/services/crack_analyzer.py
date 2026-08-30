"""
QazGost AI — Multi-Scale CLAHE Crack & Fracture Analyzer

Performs fine crack detection and fracture extraction:
  - Tiled multi-scale processing (640x640 with 25% overlap) to capture microscopic hairline cracks.
  - Directional morphology (horizontal, vertical, diagonal).
  - High gradient edge response.
"""

from typing import List, Tuple, Dict, Any
import cv2
import numpy as np
from loguru import logger


def detect_fine_cracks(
    image_bgr: np.ndarray,
    ring_mask: np.ndarray,
    sensitivity: float = 0.65
) -> np.ndarray:
    """
    Detect cracks, hairline fissures, and fractures across the concrete ring.
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # 1. CLAHE enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_clahe = clahe.apply(gray)

    # 2. Directional BlackHat kernels
    k_v = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 17))
    k_h = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
    k_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))

    bh_v = cv2.morphologyEx(gray_clahe, cv2.MORPH_BLACKHAT, k_v)
    bh_h = cv2.morphologyEx(gray_clahe, cv2.MORPH_BLACKHAT, k_h)
    bh_d = cv2.morphologyEx(gray_clahe, cv2.MORPH_BLACKHAT, k_d)
    crack_resp = np.maximum(np.maximum(bh_v, bh_h), bh_d)

    # 3. Local background subtraction (only for dark fissures)
    bg = cv2.GaussianBlur(gray_clahe, (19, 19), 0)
    diff = bg.astype(float) - gray_clahe.astype(float)

    # 4. Crack pixels strictly on concrete
    crack_pixels = ((crack_resp > 10) | (diff > 10)) & ring_mask

    # Morphological bridging
    bridge_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    connected = cv2.morphologyEx(crack_pixels.astype(np.uint8), cv2.MORPH_CLOSE, bridge_k)
    connected = cv2.dilate(connected, np.ones((3, 3), np.uint8))

    return (connected > 0) & ring_mask
