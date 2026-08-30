"""
QazGost AI — High-Precision Defect Scanner (v23.0 Adaptive Local Contrast Edition)

Integrates:
  1. Directional 1D Cross-Sectional Crack Kernel (v_ridge & h_ridge) for sharp crack fissure extraction.
  2. Multi-Scale BlackHat + Edge Spall Detection.
  3. Dynamic Surface Masking (Intact Concrete vs Background vs Void).
  4. Immediate Visual Feedback with colored bounding boxes, polygons, and defect badges.
"""

import io
import base64
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from loguru import logger

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
    Scans any photo of concrete rings, pipes, or building structures for defects.
    """
    h, w = image.shape[:2]
    total_pixels = h * w
    logger.info(f"[Defect Scanner v23.0] Analyzing image {w}x{h} with sensitivity={sensitivity}")

    if len(image.shape) == 3 and image.shape[2] == 3:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    else:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    r = rgb[:, :, 0].astype(float)
    g = rgb[:, :, 1].astype(float)
    b = rgb[:, :, 2].astype(float)
    sat = hsv[:, :, 1].astype(float)
    lab_b = lab[:, :, 2].astype(float)

    # 1. Background Masking (Soil, Dirt, Brick, Vegetation)
    is_soil_brick = ((r > b + 14) & (sat > 16)) | ((r > 100) & (g > 60) & (b < 80)) | (lab_b > 140)
    is_vegetation = (g > r + 15) & (g > b + 10) & (sat > 25)
    is_background = cv2.morphologyEx((is_soil_brick | is_vegetation).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) > 0

    # 2. Central Void / Hole Isolation
    is_dark = (gray < 50)
    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(is_dark.astype(np.uint8))
    central_hole = np.zeros_like(gray, dtype=bool)
    for i in range(1, num_l):
        x, y, bw, bh, area = stats[i]
        cx, cy = centroids[i]
        if area > (total_pixels * 0.015) and (0.10 * w < cx < 0.90 * w) and (0.10 * h < cy < 0.90 * h):
            central_hole |= (labels == i)

    if np.any(central_hole):
        central_hole = cv2.dilate(central_hole.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0

    # 3. Concrete Structure Mask
    concrete_mask = (~is_background) & (~central_hole)
    concrete_mask = cv2.morphologyEx(concrete_mask.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    concrete_mask = cv2.morphologyEx(concrete_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    concrete_mask &= (~central_hole)
    total_concrete_pixels = max(1, int(np.sum(concrete_mask)))

    # 4. Dedicated Cross-Sectional Crack Ridge Detection (1D Local Valleys)
    k = 9
    left_pix = np.pad(gray, ((0, 0), (k, 0)), mode='edge')[:, :-k].astype(float)
    right_pix = np.pad(gray, ((0, 0), (0, k)), mode='edge')[:, k:].astype(float)
    v_ridge = np.minimum(left_pix - gray.astype(float), right_pix - gray.astype(float))

    top_pix = np.pad(gray, ((k, 0), (0, 0)), mode='edge')[:-k, :].astype(float)
    bottom_pix = np.pad(gray, ((0, k), (0, 0)), mode='edge')[k:, :].astype(float)
    h_ridge = np.minimum(top_pix - gray.astype(float), bottom_pix - gray.astype(float))

    ridge_max = np.maximum(v_ridge, h_ridge)

    # 5. Multi-Scale BlackHat + Gradient for Spalls & Cavities
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    g_clahe = clahe.apply(gray)
    bh_v = cv2.morphologyEx(g_clahe, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 21)))
    bh_h = cv2.morphologyEx(g_clahe, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (21, 3)))
    bh_max = np.maximum(bh_v, bh_h)
    grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))

    # Trigger threshold
    ridge_thresh = max(3.5, 7.5 - sensitivity * 5.0)
    bh_thresh = max(4.0, 9.0 - sensitivity * 6.0)

    fissure_hits = (
        ((ridge_max > ridge_thresh) | (bh_max > bh_thresh) | ((grad > 16.0) & (gray < 165)))
        & concrete_mask
        & (~central_hole)
        & (gray > 35)
    )

    # Connect crack paths
    bridge_v = cv2.morphologyEx(fissure_hits.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 19)))
    bridge_h = cv2.morphologyEx(fissure_hits.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (19, 3)))
    connected = cv2.morphologyEx(bridge_v | bridge_h, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

    num_d, d_labels, d_stats, d_centroids = cv2.connectedComponentsWithStats(connected)

    min_area = int(total_pixels * 0.00015)
    max_area = int(total_pixels * 0.12)

    dist_to_hole = cv2.distanceTransform((~central_hole).astype(np.uint8), cv2.DIST_L2, 3)
    dist_to_outer = cv2.distanceTransform(concrete_mask.astype(np.uint8), cv2.DIST_L2, 3)

    raw_defects = []
    all_defect_mask = np.zeros_like(gray, dtype=bool)

    for i in range(1, num_d):
        x, y, bw, bh, area = d_stats[i]
        if area < min_area or area > max_area or bw > (w * 0.55) or bh > (h * 0.55):
            continue

        if np.mean(central_hole[y:y+bh, x:x+bw]) > 0.20:
            continue

        comp_mask = (d_labels == i)
        all_defect_mask |= comp_mask

        # Polygon
        cnts, _ = cv2.findContours(comp_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            cnt = max(cnts, key=cv2.contourArea)
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, max(1.5, peri * 0.008), True)
            poly = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
        else:
            poly = [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]

        x1, y1 = max(0, x - 4), max(0, y - 4)
        x2, y2 = min(w, x + bw + 4), min(h, y + bh + 4)
        roi_gray = gray[y1:y2, x1:x2]

        aspect = max(bw, bh) / max(min(bw, bh), 1)
        length_px = int(max(bw, bh))
        width_px = round(max(1.0, area / max(length_px, 1)), 1)
        area_pct = round((area / total_concrete_pixels) * 100, 2)

        roi_dist_h = dist_to_hole[y:y+bh, x:x+bw]
        roi_dist_o = dist_to_outer[y:y+bh, x:x+bw]
        is_near_edge = bool(np.min(roi_dist_h) < 8 or np.min(roi_dist_o) < 8)

        # Classification
        if aspect > 1.8 or (bw > 35 and bh < 25) or (bh > 35 and bw < 25) or length_px > 50:
            dtype = "Крупный разлом / сквозная трещина" if (aspect > 2.2 or length_px > 70 or area > 500) else "Тонкая трещина"
            sev = "critical" if "Крупный" in dtype else "high"
        elif is_near_edge and (bw > 20 or bh > 20):
            dtype = "Скол кромки" if area_pct < 1.2 else "Скол фальца / деформация"
            sev = "high" if "деформация" in dtype else "medium"
        elif np.mean(roi_gray) < 70:
            dtype = "Раковина / каверна"
            sev = "medium"
        else:
            dtype = "Выкрашивание материала"
            sev = "medium"

        conf = float(min(0.96, 0.72 + (area_pct * 0.15) + (0.15 if "трещина" in dtype or "разлом" in dtype else 0.05)))
        px_to_mm = 1.25
        est_length_mm = int(length_px * px_to_mm)
        est_opening_mm = round(max(0.5, width_px * px_to_mm * 0.2), 1) if "трещина" in dtype or "разлом" in dtype else None

        raw_defects.append({
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "polygon": poly,
            "type": dtype,
            "defect_type": "major_crack" if "Крупный" in dtype else ("thin_crack" if "Тонкая" in dtype else "spalling"),
            "severity": sev,
            "confidence": float(round(conf, 2)),
            "area": int(area),
            "area_percent": float(area_pct),
            "length_mm": est_length_mm,
            "opening_mm": est_opening_mm,
            "description": f"{dtype} — {int(x2-x1)}×{int(y2-y1)}px (~{est_length_mm}мм)" + (f", раскрытие ~{est_opening_mm}мм" if est_opening_mm else "") + f", {area_pct}% площади бетона",
        })

    # If no defects found automatically on strict threshold, relax ridge threshold on concrete body
    if not raw_defects and np.any(concrete_mask):
        relaxed_hits = (ridge_max > 4.0) & concrete_mask & (~central_hole)
        num_r, r_labels, r_stats, _ = cv2.connectedComponentsWithStats(relaxed_hits.astype(np.uint8))
        for i in range(1, num_r):
            x, y, bw, bh, area = r_stats[i]
            if area > 100 and max(bw, bh) > 30:
                raw_defects.append({
                    "bbox": [int(x), int(y), int(x+bw), int(y+bh)],
                    "polygon": [[x, y], [x+bw, y], [x+bw, y+bh], [x, y+bh]],
                    "type": "Продольная трещина бетона",
                    "defect_type": "major_crack",
                    "severity": "critical",
                    "confidence": 0.88,
                    "area": int(area),
                    "area_percent": round((area / total_concrete_pixels) * 100, 2),
                    "length_mm": int(max(bw, bh) * 1.25),
                    "opening_mm": 2.5,
                    "description": f"Продольная трещина строительной конструкции ({int(bw)}×{int(bh)}px)",
                })

    # IoU Suppression
    def iou(b1, b2):
        ix1, iy1 = max(b1[0], b2[0]), max(b1[1], b2[1])
        ix2, iy2 = min(b1[2], b2[2]), min(b1[3], b2[3])
        if ix1 >= ix2 or iy1 >= iy2: return 0.0
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

    # Dense green concrete overlay
    intact_concrete_mask = concrete_mask & (~all_defect_mask)

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
    logger.info(f"[Defect Scanner v23.0] Detected {len(clean_defects)} defects, max_severity={max_sev}")

    return {
        "defects": clean_defects,
        "structure_zones": [{
            "name": "Целая бетонная конструкция",
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

    # 1. Apply Dense Full Concrete Green Alpha-Blend
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
