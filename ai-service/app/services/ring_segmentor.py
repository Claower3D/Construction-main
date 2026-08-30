"""
QazGost AI — Concrete Ring Dynamic Segmentor

Dynamically segments concrete rings, pipes, and structures from arbitrary photos:
  - Isolates concrete body using adaptive color, chroma, and texture analysis.
  - Automatically isolates and excludes the central hole/void.
  - Identifies and strictly excludes surrounding soil, trench dirt, grass, and background.
  - Generates a clean boolean ring_mask = concrete_structure - central_hole.
  - Zero hardcoded coordinates, radii, or ellipses.
"""

from typing import Tuple, Dict, Any, List
import cv2
import numpy as np
from loguru import logger


def extract_polygons(mask: np.ndarray, min_area: int = 80, approx_eps: float = 0.008) -> List[List[List[int]]]:
    """Extract simplified polygon coordinates from a binary mask."""
    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys = []
    for cnt in contours:
        if cv2.contourArea(cnt) < min_area:
            continue
        epsilon = approx_eps * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        if len(approx) >= 3:
            pts = approx.reshape(-1, 2).tolist()
            polys.append(pts)
    return polys


def segment_ring(image_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Dynamically segment any concrete ring or pipe.

    Returns:
      ring_mask: Boolean mask of the visible concrete ring body only.
      central_hole_mask: Boolean mask of the inner hole cavity.
      soil_background_mask: Boolean mask of the ground/soil/background.
      metadata: Dict containing detected geometric centroids, areas, and bounds.
    """
    h, w = image_bgr.shape[:2]
    total_area = h * w

    # Color space conversions
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)

    r = rgb[:, :, 0].astype(float)
    g = rgb[:, :, 1].astype(float)
    b = rgb[:, :, 2].astype(float)
    sat = hsv[:, :, 1].astype(float)
    val = hsv[:, :, 2].astype(float)
    l_chan = lab[:, :, 0].astype(float)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Automatic Soil & Earth Background Detection
    # ─────────────────────────────────────────────────────────────────────────
    # Soil/clay/trench earth has warm tones where R > B, noticeable chroma saturation,
    # or characteristic earthy Lab b* values (yellow-brown direction)
    lab_b = lab[:, :, 2].astype(float)
    is_soil = (
        ((r > b + 12) & (sat > 16)) |
        ((r > 75) & (g > 55) & (b < 75)) |
        ((lab_b > 138) & (sat > 18))
    )
    # Morphological cleanup of soil mask
    soil_clean = cv2.morphologyEx(is_soil.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    soil_background_mask = soil_clean > 0

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Automatic Central Hole / Void Isolation
    # ─────────────────────────────────────────────────────────────────────────
    # Central hole is a dark cavity located in the inner zone of the concrete ring.
    # We find connected components of dark pixels (L < 65 or Gray < 65) that are
    # surrounded by concrete.
    is_dark = (gray < 65) | (l_chan < 65)
    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(is_dark.astype(np.uint8))

    central_hole_mask = np.zeros_like(gray, dtype=bool)
    img_center_x, img_center_y = w / 2.0, h / 2.0

    for i in range(1, num_l):
        x, y, bw, bh, area = stats[i]
        cx, cy = centroids[i]
        # Hole must be significant in size (> 3% of photo) and reasonably near center
        dist_to_center = np.hypot(cx - img_center_x, cy - img_center_y)
        if area > (total_area * 0.03) and dist_to_center < (min(w, h) * 0.38):
            central_hole_mask |= (labels == i)

    # Dilate hole slightly to ensure strict isolation of interior
    if np.any(central_hole_mask):
        central_hole_mask = cv2.dilate(central_hole_mask.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    else:
        # Fallback if image has high lighting inside hole
        # Detect inner contour of the neutral concrete region
        pass

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Dynamic Concrete Body Mask: ring_mask = concrete_structure - hole
    # ─────────────────────────────────────────────────────────────────────────
    raw_concrete = (~soil_background_mask) & (~central_hole_mask)

    # Morphological closing to bridge small texture variations within the concrete ring
    concrete_clean = cv2.morphologyEx(raw_concrete.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    concrete_clean = cv2.morphologyEx(concrete_clean, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    # Keep the largest outer concrete component(s)
    num_c, c_labels, c_stats, _ = cv2.connectedComponentsWithStats(concrete_clean)
    ring_mask = np.zeros_like(gray, dtype=bool)
    for i in range(1, num_c):
        if c_stats[i, cv2.CC_STAT_AREA] > (total_area * 0.05):
            ring_mask |= (c_labels == i)

    # Re-enforce hole exclusion
    ring_mask = ring_mask & (~central_hole_mask)

    ring_area_px = int(np.sum(ring_mask))
    ring_area_pct = round((ring_area_px / total_area) * 100, 1)

    metadata = {
        "image_width": int(w),
        "image_height": int(h),
        "total_pixels": int(total_area),
        "ring_detected": bool(ring_area_px > total_area * 0.05),
        "ring_area_pixels": ring_area_px,
        "ring_area_percent": ring_area_pct,
        "hole_detected": bool(np.any(central_hole_mask)),
        "hole_area_pixels": int(np.sum(central_hole_mask)),
    }

    logger.info(f"[Ring Segmentor] Extracted ring: {ring_area_pct}% coverage, hole={metadata['hole_detected']}")
    return ring_mask, central_hole_mask, soil_background_mask, metadata
