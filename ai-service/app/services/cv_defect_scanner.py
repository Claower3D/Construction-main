"""
QazGost AI — Concrete & Structure Defect Scanner (v5.3 Production)

High-precision computer vision pipeline for structural defects on concrete:
  1. Detects actual concrete fractures, cracks, spalls, and surface breaks.
  2. Masks out the central well hole void so it is never falsely marked as a defect.
  3. Separates excavation soil from the concrete ring structure.
  4. Filters intact uniform concrete to prevent false alerts.
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
    "medium":   (230, 180, 20),     # Amber/Yellow
    "low":      (50, 190, 80),      # Green
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


def _detect_fissures_and_spalls(img_bgr: np.ndarray, sensitivity: float = 0.65) -> List[Dict[str, Any]]:
    """
    Locate structural cracks, concrete fissures, and spalled sections.
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

        candidate_boxes.append({
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "type": str(dtype),
            "severity": str(sev),
            "confidence": round(conf, 2),
            "area": int(area),
            "area_percent": float(round(area_pct, 1)),
            "description": f"{dtype} — область {int(x2-x1)}×{int(y2-y1)}px, {round(area_pct, 1)}% площади",
        })

    return candidate_boxes


def scan_defects(image: np.ndarray, sensitivity: float = 0.65) -> Dict[str, Any]:
    """
    Scan image for concrete and structural defects.
    """
    h, w = image.shape[:2]
    logger.info(f"[CV Scanner v5.3] Scanning {w}x{h}, sensitivity={sensitivity}")

    if len(image.shape) == 3 and image.shape[2] == 3:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    else:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    candidates = _detect_fissures_and_spalls(img_bgr, sensitivity=sensitivity)

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

    # Draw annotations
    annotated = _draw_annotations(image.copy(), clean_defects)

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
    logger.info(f"[CV Scanner v5.3] Found {len(clean_defects)} structural defects, max_severity={max_sev}")

    return {
        "defects": clean_defects,
        "annotated_image": annotated_b64,
        "severity_summary": {
            "total": len(clean_defects),
            "by_severity": sev_counts,
            "max_severity": max_sev,
        },
    }


def _draw_annotations(image: np.ndarray, defects: List[Dict]) -> np.ndarray:
    """Draw crisp, high-visibility annotations on image."""
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

    for d in defects:
        x1, y1, x2, y2 = d["bbox"]
        sev = d["severity"]
        color = SEV_COLORS.get(sev, (230, 180, 20))
        conf = d["confidence"]
        dtype = d["type"]

        # Box outline
        draw.rectangle([x1, y1, x2, y2], fill=(*color, 25), outline=(*color, 230), width=2)

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
