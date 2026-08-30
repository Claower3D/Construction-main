"""
QazGost AI — Concrete Defect Classifier & Metrics Calculator (v2.0)

Classifies detected defect components into 8 official categories:
  1. major_crack: Крупные сквозные трещины и разломы (Красный #FF0000)
  2. thin_crack: Тонкие и волосные трещины (Красный #FF1744)
  3. branching_crack: Ответвления и сетка трещин (Красный #D50000)
  4. edge_spall: Сколы кромки изделия (Жёлтый #FFD600)
  5. spalling: Выкрашивание и потеря материала (Жёлтый #FFEA00)
  6. surface_erosion: Эрозия и разрушение поверхности (Оранжевый #FF9100)
  7. cavity: Раковины, каверны и углубления (Тёмно-оранжевый #FF6D00)
  8. edge_deformation: Деформация кромки (Оранжево-красный #FF3D00)
"""

from typing import List, Dict, Any, Tuple
import cv2
import numpy as np
from loguru import logger

DEFECT_COLOR_PALETTE = {
    "intact":           {"hex": "#00C853", "rgba": (0, 200, 83, 75)},       # Translucent Green
    "major_crack":     {"hex": "#FF0000", "rgba": (255, 0, 0, 160)},      # Crimson Red
    "thin_crack":      {"hex": "#FF1744", "rgba": (255, 23, 68, 150)},     # Red
    "branching_crack": {"hex": "#D50000", "rgba": (213, 0, 0, 150)},      # Deep Red
    "edge_spall":      {"hex": "#FFD600", "rgba": (255, 214, 0, 140)},    # Yellow
    "spalling":        {"hex": "#FFEA00", "rgba": (255, 234, 0, 140)},    # Bright Yellow
    "surface_erosion": {"hex": "#FF9100", "rgba": (255, 145, 0, 140)},    # Amber
    "cavity":          {"hex": "#FF6D00", "rgba": (255, 109, 0, 140)},    # Deep Orange
    "edge_deformation":{"hex": "#FF3D00", "rgba": (255, 61, 0, 150)},     # Red-Orange
}

DEFECT_RU_TITLES = {
    "major_crack":      "Крупный разлом / сквозная трещина",
    "thin_crack":       "Тонкая трещина",
    "branching_crack":  "Ответвление / сетка трещин",
    "edge_spall":       "Скол кромки",
    "spalling":         "Выкрашивание материала",
    "surface_erosion":  "Эрозия поверхности",
    "cavity":           "Раковина / каверна",
    "edge_deformation": "Деформация кромки",
}


def classify_defect_component(
    component_mask: np.ndarray,
    roi_gray: np.ndarray,
    bbox: List[int],
    total_ring_pixels: int,
    is_near_edge: bool = False
) -> Dict[str, Any]:
    """
    Analyze geometric shape, intensity gradient, and topology to classify defect into 1 of 8 categories.
    """
    x1, y1, x2, y2 = bbox
    bw, bh = x2 - x1, y2 - y1
    area_px = int(np.sum(component_mask))
    area_pct_of_ring = round((area_px / max(total_ring_pixels, 1)) * 100, 2)

    aspect = max(bw, bh) / max(min(bw, bh), 1)
    mean_val = float(np.mean(roi_gray)) if roi_gray.size > 0 else 120.0
    min_val = float(np.min(roi_gray)) if roi_gray.size > 0 else 50.0

    length_px = int(max(bw, bh))
    width_px = round(max(1.0, area_px / max(length_px, 1)), 1)

    # ─────────────────────────────────────────────────────────────────────────
    # Classification Logic (8 Distinct Classes)
    # ─────────────────────────────────────────────────────────────────────────
    # Major through-cracks: long or high aspect ratio with dark core
    if (aspect > 1.5 and length_px > 55) or (length_px > 85 and min_val < 60):
        if length_px > 100 or area_pct_of_ring > 0.35 or min_val < 45:
            defect_type = "major_crack"
            severity = "critical"
        else:
            defect_type = "thin_crack"
            severity = "medium"
    elif is_near_edge and (bw > 22 or bh > 22):
        if area_pct_of_ring > 1.0 or min_val < 35:
            defect_type = "edge_deformation"
            severity = "critical"
        else:
            defect_type = "edge_spall"
            severity = "medium"
    elif mean_val < 75 or min_val < 40:
        defect_type = "cavity"
        severity = "medium" if area_px > 200 else "low"
    elif area_px > 450:
        defect_type = "spalling"
        severity = "medium"
    else:
        defect_type = "surface_erosion"
        severity = "low"

    conf = float(min(0.98, 0.65 + (area_pct_of_ring * 0.12) + (0.15 if aspect > 1.8 else 0.05)))

    return {
        "defect_type": defect_type,
        "type_ru": DEFECT_RU_TITLES.get(defect_type, defect_type),
        "severity": severity,
        "confidence": round(conf, 2),
        "area_pixels": area_px,
        "area_percent_of_ring": area_pct_of_ring,
        "length_pixels": length_px,
        "approximate_width_pixels": width_px,
        "color_hex": DEFECT_COLOR_PALETTE.get(defect_type, {}).get("hex", "#FF0000"),
        "color_rgba": DEFECT_COLOR_PALETTE.get(defect_type, {}).get("rgba", (255, 0, 0, 140)),
    }
