"""
QazGost AI — Pure Dynamic AI-Vision Defect Scanner (v21.0 True Object & Defect Vision)

NO HARDCODED COORDINATES.
Dynamic computer vision architecture:
  1. Dynamic Concrete Ring Segmentation per-image (hue/chroma + geometry + hole isolation).
  2. Multi-scale directional ridge & trough defect filters.
  3. Morphological connected component analysis & polygon extraction.
  4. Real-time physical metrics estimation (mm length, opening, area %, severity).
  5. Dense green overlay of intact concrete structure.
"""

import io
import base64
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from loguru import logger

from app.services.ring_segmentor import segment_ring, extract_polygons

SEV_COLORS = {
    "critical": (235, 35, 35),
    "high":     (245, 110, 20),
    "medium":   (235, 190, 25),
    "low":      (50, 200, 85),
}

SEV_LABELS_RU = {
    "critical": "КРИТИЧЕСКИЙ",
    "high":     "ВЫСОКИЙ",
    "medium":   "СРЕДНИЙ",
    "low":      "НИЗКИЙ",
}


def scan_defects(image: np.ndarray, sensitivity: float = 0.65) -> Dict[str, Any]:
    """
    Pure dynamic computer vision scan on any concrete ring or pipe photo.
    """
    h, w = image.shape[:2]
    total_pixels = h * w
    logger.info(f"[CV Scanner v21.0 Dynamic] Analyzing image {w}x{h}, sensitivity={sensitivity}")

    if len(image.shape) == 3 and image.shape[2] == 3:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    else:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Dynamic scene segmentation: ring_mask, hole_mask, soil_mask
    ring_mask, central_hole_mask, soil_mask, ring_meta = segment_ring(img_bgr)
    total_ring_pixels = int(np.sum(ring_mask))

    # 2. Dynamic Feature Extraction on Concrete Surface:
    # A) Multi-directional BlackHat filters for cracks & fissures
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    g_clahe = clahe.apply(gray)

    k_v = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 19))
    k_h = cv2.getStructuringElement(cv2.MORPH_RECT, (19, 3))
    k_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))

    bh_v = cv2.morphologyEx(g_clahe, cv2.MORPH_BLACKHAT, k_v)
    bh_h = cv2.morphologyEx(g_clahe, cv2.MORPH_BLACKHAT, k_h)
    bh_d = cv2.morphologyEx(g_clahe, cv2.MORPH_BLACKHAT, k_d)
    bh_max = np.maximum(np.maximum(bh_v, bh_h), bh_d)

    # B) Local intensity trough filter (detects dark valleys & cracks)
    local_mean = cv2.blur(gray, (19, 19))
    local_diff = local_mean.astype(float) - gray.astype(float)

    # C) Surface gradient (detects chips, spalls, surface breakdown)
    grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))

    # Dynamic thresholding based on sensitivity
    bh_thresh = max(4.0, 10.0 - sensitivity * 6.0)
    diff_thresh = max(4.5, 11.0 - sensitivity * 7.0)
    grad_thresh = max(10.0, 20.0 - sensitivity * 10.0)

    defect_signal = (
        ((bh_max > bh_thresh) | (local_diff > diff_thresh) | ((grad > grad_thresh) & (gray < 165)))
        & ring_mask
        & (~central_hole_mask)
    )

    # Bridge adjacent pixels along crack paths
    bridge_v = cv2.morphologyEx(defect_signal.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 11)))
    bridge_h = cv2.morphologyEx(defect_signal.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (11, 3)))
    connected = cv2.morphologyEx(bridge_v | bridge_h, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(connected)

    min_area = int(total_pixels * 0.0001)
    max_area = int(total_pixels * 0.08)

    dist_to_hole = cv2.distanceTransform((~central_hole_mask).astype(np.uint8), cv2.DIST_L2, 3)
    dist_to_outer = cv2.distanceTransform(ring_mask.astype(np.uint8), cv2.DIST_L2, 3)

    raw_defects = []
    all_defect_mask = np.zeros_like(gray, dtype=bool)

    for i in range(1, num_l):
        x, y, bw, bh, area = stats[i]
        if area < min_area or area > max_area or bw > (w * 0.45) or bh > (h * 0.45):
            continue

        # Zero hole bleed
        if np.mean(central_hole_mask[y:y+bh, x:x+bw]) > 0.15:
            continue

        comp_mask = (labels == i)
        all_defect_mask |= comp_mask
        comp_polys = extract_polygons(comp_mask, min_area=int(min_area * 0.4), approx_eps=0.010)
        poly = comp_polys[0] if comp_polys else [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]

        x1, y1 = max(0, x - 4), max(0, y - 4)
        x2, y2 = min(w, x + bw + 4), min(h, y + bh + 4)
        roi_gray = gray[y1:y2, x1:x2]

        aspect = max(bw, bh) / max(min(bw, bh), 1)
        mean_val = float(np.mean(roi_gray)) if roi_gray.size > 0 else 120.0
        min_val = float(np.min(roi_gray)) if roi_gray.size > 0 else 50.0
        area_pct_of_ring = round((area / max(total_ring_pixels, 1)) * 100, 2)
        length_px = int(max(bw, bh))
        width_px = round(max(1.0, area / max(length_px, 1)), 1)

        roi_dist_h = dist_to_hole[y:y+bh, x:x+bw]
        roi_dist_o = dist_to_outer[y:y+bh, x:x+bw]
        is_near_edge = bool(np.min(roi_dist_h) < 8 or np.min(roi_dist_o) < 8)

        # Dynamic Defect Classification:
        if aspect > 1.6 or (bw > 35 and bh < 25) or (bh > 35 and bw < 25):
            dtype = "Крупный разлом / сквозная трещина" if (aspect > 2.0 or area_pct_of_ring > 0.3 or length_px > 60) else "Тонкая трещина"
            sev = "critical" if "Крупный" in dtype else "high"
        elif is_near_edge and (bw > 20 or bh > 20):
            dtype = "Скол кромки" if area_pct_of_ring < 1.0 else "Скол фальца / деформация"
            sev = "high" if "деформация" in dtype else "medium"
        elif mean_val < 70 or min_val < 35:
            dtype = "Раковина / каверна"
            sev = "medium" if area > 200 else "low"
        elif area > 400:
            dtype = "Выкрашивание материала"
            sev = "medium"
        else:
            dtype = "Эрозия поверхности"
            sev = "low"

        conf = float(min(0.96, 0.65 + (area_pct_of_ring * 0.15) + (0.15 if "трещина" in dtype or "разлом" in dtype else 0.05)))

        px_to_mm = 1.25
        est_length_mm = int(length_px * px_to_mm)
        est_opening_mm = round(max(0.4, width_px * px_to_mm * 0.15), 1) if "трещина" in dtype or "разлом" in dtype else None

        raw_defects.append({
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "polygon": [[int(pt[0]), int(pt[1])] for pt in poly],
            "type": dtype,
            "defect_type": "major_crack" if "Крупный" in dtype else ("thin_crack" if "Тонкая" in dtype else "spalling"),
            "severity": sev,
            "confidence": float(round(conf, 2)),
            "area": int(area),
            "area_percent": float(area_pct_of_ring),
            "length_mm": est_length_mm,
            "opening_mm": est_opening_mm,
            "description": f"{dtype} — {int(x2-x1)}×{int(y2-y1)}px (~{est_length_mm}мм)" + (f", раскрытие ~{est_opening_mm}мм" if est_opening_mm else "") + f", {area_pct_of_ring}% площади кольца",
        })

    # IoU Suppression / Non-Maximum Suppression
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
    for cand in sorted(raw_defects, key=lambda c: c["area"], reverse=True):
        if not any(iou(cand["bbox"], cd["bbox"]) > 0.25 for cd in clean_defects):
            clean_defects.append(cand)

    sev_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    clean_defects.sort(key=lambda d: (sev_order.get(d["severity"], 0), d["area"]), reverse=True)
    clean_defects = clean_defects[:12]
    for idx, d in enumerate(clean_defects):
        d["id"] = idx + 1

    # Dense Intact Ring Mask for composite overlay
    intact_concrete_mask = ring_mask & (~all_defect_mask)

    annotated = _draw_annotations(image.copy(), clean_defects, ring_mask=intact_concrete_mask)

    pil_out = Image.fromarray(annotated)
    buf = io.BytesIO()
    pil_out.save(buf, format="JPEG", quality=92)
    b64 = base64.b64encode(buf.getvalue()).decode()
    annotated_b64 = f"data:image/jpeg;base64,{b64}"

    sev_counts = {}
    for d in clean_defects:
        s = d["severity"]
        sev_counts[s] = sev_counts.get(s, 0) + 1

    max_sev = max(sev_counts.keys(), key=lambda s: sev_order.get(s, 0)) if sev_counts else "low"
    logger.info(f"[CV Scanner v21.0 Dynamic] Found {len(clean_defects)} defects dynamically, max_severity={max_sev}")

    return {
        "defects": clean_defects,
        "structure_zones": [{
            "name": "Целое бетонное кольцо",
            "type": "intact_concrete",
            "color": [0, 200, 83, 75]
        }],
        "annotated_image": annotated_b64,
        "severity_summary": {
            "total": len(clean_defects),
            "by_severity": sev_counts,
            "max_severity": max_sev,
        },
    }


def _draw_annotations(image: np.ndarray, defects: List[Dict], structure_zones: List[Dict] = None, ring_mask: np.ndarray = None) -> np.ndarray:
    h, w = image.shape[:2]

    # 1. Apply Dense Full Ring Green Alpha-Blend (Direct Pixel Mask)
    if ring_mask is not None:
        green_color = np.array([0, 200, 83], dtype=np.float32)
        alpha = 0.32
        blend_slice = image[ring_mask].astype(np.float32)
        image[ring_mask] = (blend_slice * (1.0 - alpha) + green_color * alpha).astype(np.uint8)

    pil_img = Image.fromarray(image).convert("RGBA")
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_size = max(13, int(min(w, h) * 0.022))
    small_size = max(11, int(font_size * 0.8))

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
        small_font = ImageFont.truetype("arial.ttf", small_size)
    except Exception:
        font = ImageFont.load_default()
        small_font = font

    # 2. Draw defects
    for d in defects:
        x1, y1, x2, y2 = d["bbox"]
        sev = d["severity"]
        dtype = d["type"]
        conf = d["confidence"]

        if sev == "critical" or "трещина" in dtype.lower() or "разлом" in dtype.lower():
            color = (255, 23, 68)
        elif "скол" in dtype.lower() or "деформация" in dtype.lower() or sev == "high":
            color = (255, 214, 0)
        else:
            color = (255, 145, 0)

        pts = [tuple(p) for p in d.get("polygon", [])]
        if len(pts) >= 3:
            draw.polygon(pts, fill=(*color, 140), outline=(*color, 255))

        draw.rectangle([x1, y1, x2, y2], fill=(*color, 20), outline=(*color, 230), width=2)

        blen = max(12, int(min(x2 - x1, y2 - y1) * 0.15))
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            draw.line([(cx, cy), (cx + dx * blen, cy)], fill=(*color, 255), width=3)
            draw.line([(cx, cy), (cx, cy + dy * blen)], fill=(*color, 255), width=3)

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
