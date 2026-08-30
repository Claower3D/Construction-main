"""
QazGost AI — Dynamic Concrete Ring & Structure Segmentor (v2.0 Dense Alpha-Blend Edition)
"""

from typing import Tuple, Dict, Any, List
import cv2
import numpy as np
from loguru import logger


def segment_ring(image_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Extract exact concrete ring body, excluding surrounding soil/trench and dark central well bottom.
    """
    h, w = image_bgr.shape[:2]
    total_area = h * w

    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)

    r = rgb[:, :, 0].astype(float)
    g = rgb[:, :, 1].astype(float)
    b = rgb[:, :, 2].astype(float)
    sat = hsv[:, :, 1].astype(float)
    lab_b = lab[:, :, 2].astype(float)

    # 1. Soil & Earth Background Mask
    is_soil = ((r > b + 12) & (sat > 16)) | ((r > 80) & (g > 60) & (b < 75)) | ((lab_b > 140) & (sat > 18))
    soil_background_mask = cv2.morphologyEx(is_soil.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) > 0

    # 2. Central Well Bottom / Cavity
    is_dark = (gray < 65)
    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(is_dark.astype(np.uint8))

    central_hole_mask = np.zeros_like(gray, dtype=bool)
    img_center_x, img_center_y = w / 2.0, h / 2.0

    for i in range(1, num_l):
        x, y, bw, bh, area = stats[i]
        cx, cy = centroids[i]
        dist_to_center = np.hypot(cx - img_center_x, cy - img_center_y)
        if area > (total_area * 0.03) and dist_to_center < (min(w, h) * 0.38):
            central_hole_mask |= (labels == i)

    # Make solid circular/elliptical central floor mask
    hole_cnts, _ = cv2.findContours(central_hole_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if hole_cnts:
        main_hole = max(hole_cnts, key=cv2.contourArea)
        solid_hole_mask = np.zeros_like(gray, dtype=np.uint8)
        cv2.drawContours(solid_hole_mask, [main_hole], -1, 255, -1)
        solid_hole_mask = cv2.dilate(solid_hole_mask, np.ones((7, 7), np.uint8)) > 0
    else:
        solid_hole_mask = central_hole_mask

    # 3. Dense Continuous Ring Body: strictly concrete, zero soil bleed, zero shaft bleed
    ring_mask = (~soil_background_mask) & (~solid_hole_mask)
    ring_mask = cv2.morphologyEx(ring_mask.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    ring_mask = cv2.morphologyEx(ring_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    ring_mask = ring_mask & (~solid_hole_mask)

    ring_area_px = int(np.sum(ring_mask))
    ring_area_pct = round((ring_area_px / total_area) * 100, 1)

    metadata = {
        "image_width": int(w),
        "image_height": int(h),
        "total_pixels": int(total_area),
        "ring_detected": bool(ring_area_px > total_area * 0.05),
        "ring_area_pixels": ring_area_px,
        "ring_area_percent": ring_area_pct,
        "hole_detected": bool(np.any(solid_hole_mask)),
        "hole_area_pixels": int(np.sum(solid_hole_mask)),
    }

    logger.info(f"[Ring Segmentor v2.0] Dense Ring: {ring_area_pct}% coverage, hole={metadata['hole_detected']}")
    return ring_mask, solid_hole_mask, soil_background_mask, metadata


def extract_polygons(binary_mask: np.ndarray, min_area: int = 50, approx_eps: float = 0.005) -> List[List[List[int]]]:
    """
    Extract closed boundary polygon chains.
    """
    if binary_mask is None or not np.any(binary_mask):
        return []

    contours, _ = cv2.findContours(binary_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polygons = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, max(1.5, peri * approx_eps), True)
        pts = [[int(p[0][0]), int(p[0][1])] for p in approx]
        if len(pts) >= 3:
            polygons.append(pts)
    return polygons
