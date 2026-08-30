"""
QazGost AI — Concrete & Structure Defect Scanner (v6.0 Polygon Segmentation Edition)

Generates pixel-accurate polygon segmentation for:
  - 🟢 Intact concrete structure (celaya zona / intact ring body)
  - 🔴 Critical structural fractures & through-cracks (skvoznye treshchiny)
  - 🟡 Spalled, chipped, or degraded concrete sections (skoly / vyboiny)
  - Full polygon vertex coordinates [[x,y], ...] returned in API for frontend interactive overlay.
"""

import io
import base64
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, Any, List, Tuple
from loguru import logger

SEV_COLORS = {
    "critical": (230, 40, 40),      # Bright Red
    "high":     (240, 110, 20),     # Orange
    "medium":   (235, 185, 25),     # Amber/Yellow
    "low":      (50, 195, 85),      # Green
}

SEV_LABELS_RU = {
    "critical": "КРИТИЧЕСКИЙ",
    "high":     "ВЫСОКИЙ",
    "medium":   "СРЕДНИЙ",
    "low":      "НИЗКИЙ",
}


def _segment_scene(img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Segment image into:
    - is_soil: Excavation ground / dirt (warm brownish tones)
    - center_hole_mask: Deep dark central shaft interior
    - concrete_mask: Concrete structure area (ring/walls/ledges)
    """
    h, w = img_bgr.shape[:2]
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    r = rgb[:, :, 0].astype(float)
    g = rgb[:, :, 1].astype(float)
    b = rgb[:, :, 2].astype(float)
    sat = hsv[:, :, 1]

    # 1. Excavation soil mask: warm brownish/tan tones
    is_soil = (r > b + 15) & (r > 65) & (sat > 22)

    # 2. Central shaft void mask (dark interior)
    is_dark = gray < 65
    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(is_dark.astype(np.uint8))
    center_hole_mask = np.zeros_like(gray, dtype=bool)
    for i in range(1, num_l):
        x, y, bw, bh, area = stats[i]
        cx, cy = centroids[i]
        dist = np.hypot(cx - w/2, cy - h/2)
        if area > (w * h * 0.03) and dist < (min(w, h) * 0.35):
            center_hole_mask |= (labels == i)

    # 3. Active concrete structure mask
    concrete_mask = (~is_soil) & (~center_hole_mask)

    return is_soil, center_hole_mask, concrete_mask


def _extract_polygons(mask: np.ndarray, min_area: int = 100, approx_eps: float = 0.008) -> List[List[List[int]]]:
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


def _detect_fissures_and_spalls(img_bgr: np.ndarray, sensitivity: float = 0.65) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Locate structural cracks, concrete fissures, spalls, and intact concrete polygons.
    """
    h, w = img_bgr.shape[:2]
    total_pixels = h * w
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    is_soil, center_hole_mask, concrete_mask = _segment_scene(img_bgr)

    # 1. Dark fissure response via background subtraction
    blur_k = max(15, int(min(w, h) * 0.03) | 1)
    bg = cv2.GaussianBlur(gray, (blur_k, blur_k), 0)
    diff = bg.astype(float) - gray.astype(float)
    diff_thresh = max(10, int(18 - sensitivity * 10))
    dark_cracks = (diff > diff_thresh) & concrete_mask

    # 2. High-magnitude edge gradients on concrete
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    gmag = cv2.magnitude(gx, gy)
    grad_thresh = max(40, int(70 - sensitivity * 30))
    edge_cracks = (gmag > grad_thresh) & (gray < 165) & concrete_mask

    # 3. Multi-scale BlackHat morphology
    k_size = max(9, int(min(w, h) * 0.02) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    bh_thresh = max(8, int(15 - sensitivity * 8))
    bh_cracks = (blackhat > bh_thresh) & concrete_mask

    # Combine crack signals
    crack_map = dark_cracks | edge_cracks | bh_cracks

    # Morphological bridging for continuous crack trajectories
    bridge_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    connected = cv2.morphologyEx(crack_map.astype(np.uint8), cv2.MORPH_CLOSE, bridge_k)
    connected = cv2.dilate(connected, bridge_k, iterations=1)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(connected)

    min_area = int(total_pixels * 0.0004)  # Min 0.04%
    max_area = int(total_pixels * 0.08)    # Max 8%

    candidate_boxes = []
    all_defect_mask = np.zeros_like(gray, dtype=bool)

    for i in range(1, num_labels):
        x, y, bw, bh, area = stats[i]
        if area < min_area or area > max_area:
            continue

        # Skip regions overlapping the central shaft void
        if np.mean(center_hole_mask[y:y+bh, x:x+bw]) > 0.25:
            continue

        # Skip regions mostly located in external soil
        if np.mean(is_soil[y:y+bh, x:x+bw]) > 0.35:
            continue

        # Skip smooth uniform concrete with low variance
        if np.std(gray[y:y+bh, x:x+bw]) < 13:
            continue

        # Extract local defect polygon
        comp_mask = (labels == i)
        all_defect_mask |= comp_mask
        comp_polys = _extract_polygons(comp_mask, min_area=int(min_area * 0.5), approx_eps=0.015)
        poly_pts = comp_polys[0] if comp_polys else [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]

        aspect = max(bw, bh) / max(min(bw, bh), 1)
        pad = 6
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(w, x + bw + pad), min(h, y + bh + pad)

        roi_gray = gray[y1:y2, x1:x2]
        mean_brightness = np.mean(roi_gray) if roi_gray.size > 0 else 100

        area_pct = (area / total_pixels) * 100

        # Classify defect type and severity
        if aspect > 1.8 or (bw > 50 and bh < 38) or (bh > 50 and bw < 38):
            dtype = "Трещина"
            sev = "critical" if (aspect > 2.5 or area_pct > 0.5) else "high"
        elif mean_brightness < 70:
            dtype = "Глубокое повреждение / скол"
            sev = "critical" if area_pct > 0.6 else "high"
        else:
            dtype = "Повреждение бетона"
            sev = "medium" if area_pct > 0.3 else "low"

        conf = float(min(0.96, 0.55 + (area_pct * 0.15) + (0.15 if aspect > 2.0 else 0.05)))

        # Physical scale approximation (based on standard 1000-1500mm concrete rings: ~1.2mm/px)
        px_to_mm = 1.25
        est_length_mm = int(max(bw, bh) * px_to_mm)
        est_opening_mm = round(max(0.4, (min(bw, bh) * px_to_mm * 0.08)), 1) if dtype == "Трещина" else None

        candidate_boxes.append({
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "polygon": poly_pts,
            "type": str(dtype),
            "severity": str(sev),
            "confidence": round(conf, 2),
            "area": int(area),
            "area_percent": float(round(area_pct, 1)),
            "length_mm": est_length_mm,
            "opening_mm": est_opening_mm,
            "description": f"{dtype} — область {int(x2-x1)}×{int(y2-y1)}px (~{est_length_mm}мм)" + (f", раскрытие ~{est_opening_mm}мм" if est_opening_mm else "") + f", {round(area_pct, 1)}% площади",
        })

    # Segment intact concrete body (excluding defect mask & void)
    intact_concrete_mask = concrete_mask & (~all_defect_mask)
    intact_clean = cv2.morphologyEx(intact_concrete_mask.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7,7), np.uint8))
    intact_polys = _extract_polygons(intact_clean, min_area=int(total_pixels * 0.04), approx_eps=0.006)

    structure_zones = []
    for ip in intact_polys:
        structure_zones.append({
            "name": "Целое бетонное тело конструкции (Intact Ring Body)",
            "type": "intact_concrete",
            "polygon": ip,
            "color": [40, 200, 75, 55],  # Translucent green
        })

    return candidate_boxes, structure_zones


def scan_defects(image: np.ndarray, sensitivity: float = 0.65) -> Dict[str, Any]:
    """
    Scan image for concrete and structural defects with polygon segmentation.
    """
    h, w = image.shape[:2]
    logger.info(f"[CV Scanner v6.0 Polygon Edition] Scanning {w}x{h}, sensitivity={sensitivity}")

    if len(image.shape) == 3 and image.shape[2] == 3:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    else:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    candidates, structure_zones = _detect_fissures_and_spalls(img_bgr, sensitivity=sensitivity)

    # Deduplicate overlapping boxes
    def iou(b1, b2):
        ix1, iy1 = max(b1[0], b2[0]), max(b1[1], b2[1])
        ix2, iy2 = min(b1[2], b2[2]), min(b1[3], b2[3])
        if ix1 >= ix2 or iy1 >= iy2:
            return 0.0
        inter = (ix2 - ix1) * (iy2 - iy1)
        a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
        a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
        return inter / min(a1, a2)

    clean_defects = []
    for cand in sorted(candidates, key=lambda c: c["area"], reverse=True):
        if not any(iou(cand["bbox"], cd["bbox"]) > 0.25 for cd in clean_defects):
            clean_defects.append(cand)

    # Order by severity rank, then area
    sev_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    clean_defects.sort(key=lambda d: (sev_rank.get(d["severity"], 0), d["area_percent"]), reverse=True)
    clean_defects = clean_defects[:8]

    for idx, d in enumerate(clean_defects):
        d["id"] = idx + 1

    # Draw annotations with polygon overlay
    annotated = _draw_annotations(image.copy(), clean_defects, structure_zones)

    # Encode to JPEG base64
    pil_out = Image.fromarray(annotated)
    buf = io.BytesIO()
    pil_out.save(buf, format="JPEG", quality=92)
    b64 = base64.b64encode(buf.getvalue()).decode()
    annotated_b64 = f"data:image/jpeg;base64,{b64}"

    # Summary
    sev_counts = {}
    for d in clean_defects:
        s = d["severity"]
        sev_counts[s] = sev_counts.get(s, 0) + 1

    max_sev = max(sev_counts.keys(), key=lambda s: sev_rank.get(s, 0)) if sev_counts else "low"
    logger.info(f"[CV Scanner v6.0] Segmented {len(clean_defects)} defects + {len(structure_zones)} structure zones, max_severity={max_sev}")

    return {
        "defects": clean_defects,
        "structure_zones": structure_zones,
        "annotated_image": annotated_b64,
        "severity_summary": {
            "total": len(clean_defects),
            "by_severity": sev_counts,
            "max_severity": max_sev,
        },
    }


def _draw_annotations(image: np.ndarray, defects: List[Dict], structure_zones: List[Dict] = None) -> np.ndarray:
    """Draw crisp polygon overlays, intact structure glow, and defect markers."""
    pil_img = Image.fromarray(image).convert("RGBA")
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    h, w = image.shape[:2]
    font_size = max(13, int(min(w, h) * 0.022))
    small_size = max(11, int(font_size * 0.8))

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
        small_font = ImageFont.truetype("arial.ttf", small_size)
    except Exception:
        font = ImageFont.load_default()
        small_font = font

    # 1. Draw intact concrete structure zone (soft translucent green overlay)
    if structure_zones:
        for sz in structure_zones:
            pts = [tuple(p) for p in sz.get("polygon", [])]
            if len(pts) >= 3:
                draw.polygon(pts, fill=(45, 195, 80, 40), outline=(45, 210, 85, 140))

    # 2. Draw defect polygons & boxes
    for d in defects:
        x1, y1, x2, y2 = d["bbox"]
        sev = d["severity"]
        color = SEV_COLORS.get(sev, (230, 180, 20))
        conf = d["confidence"]
        dtype = d["type"]

        # If polygon points are present, fill polygon with colored mask
        pts = [tuple(p) for p in d.get("polygon", [])]
        if len(pts) >= 3:
            draw.polygon(pts, fill=(*color, 90), outline=(*color, 255))

        # Box outline
        draw.rectangle([x1, y1, x2, y2], fill=(*color, 20), outline=(*color, 230), width=2)

        # High-visibility corner brackets
        blen = max(12, int(min(x2 - x1, y2 - y1) * 0.15))
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            draw.line([(cx, cy), (cx + dx * blen, cy)], fill=(*color, 255), width=3)
            draw.line([(cx, cy), (cx, cy + dy * blen)], fill=(*color, 255), width=3)

        # Label tag
        label_t = f"#{d['id']} {dtype}"
        sub_t = f"{int(conf*100)}% | {SEV_LABELS_RU.get(sev, sev)}"

        bb1 = draw.textbbox((0, 0), label_t, font=font)
        lw = bb1[2] - bb1[0] + 12
        lh = bb1[3] - bb1[1] + 4

        bb2 = draw.textbbox((0, 0), sub_t, font=small_font)
        sw = bb2[2] - bb2[0] + 12
        sh = bb2[3] - bb2[1] + 4

        tag_w = max(lw, sw)
        tag_h = lh + sh + 2

        lx = x1
        ly = y1 - tag_h - 4
        if ly < 4:
            ly = y1 + 4

        draw.rectangle([lx, ly, lx + tag_w, ly + tag_h], fill=(12, 16, 28, 235), outline=(*color, 200), width=1)
        draw.text((lx + 6, ly + 2), label_t, fill=(*color, 255), font=font)
        draw.text((lx + 6, ly + lh + 1), sub_t, fill=(210, 220, 235, 230), font=small_font)

    result = Image.alpha_composite(pil_img, overlay).convert("RGB")
    return np.array(result)
