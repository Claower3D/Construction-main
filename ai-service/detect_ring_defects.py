"""
QazGost AI — Concrete Ring Defect Analyzer CLI & Engine (Standalone Script)

Usage:
  python detect_ring_defects.py --input path/to/image.jpg --output-dir results --confidence 0.35

Outputs:
  - results/annotated_result.png
  - results/masks.png
  - results/defects.json
  - results/summary.json
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from loguru import logger

# Add parent directory to path for service imports
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from app.services.ring_segmentor import segment_ring, extract_polygons
from app.services.crack_analyzer import detect_fine_cracks
from app.services.defect_classifier import classify_defect_component, DEFECT_COLOR_PALETTE, DEFECT_RU_TITLES


def load_image(image_path: str) -> np.ndarray:
    """Load image from disk preserving full resolution."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not decode image at: {image_path}")
    return img_bgr


def detect_defects(
    image_bgr: np.ndarray,
    ring_mask: np.ndarray,
    central_hole_mask: np.ndarray,
    confidence_threshold: float = 0.35
) -> Tuple[List[Dict[str, Any]], np.ndarray]:
    """
    Detect, merge, and classify all defects strictly inside ring_mask.
    """
    h, w = image_bgr.shape[:2]
    total_pixels = h * w
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    total_ring_pixels = int(np.sum(ring_mask))

    # 1. Fine crack detection via multi-scale CLAHE & directional morphology
    crack_map = detect_fine_cracks(image_bgr, ring_mask, sensitivity=0.65)
    connected = crack_map & ring_mask & (~central_hole_mask)

    num_l, labels, stats, centroids = cv2.connectedComponentsWithStats(connected.astype(np.uint8))

    defects = []
    min_area = int(total_pixels * 0.0003)
    max_area = int(total_pixels * 0.04)

    # Distance transform for edge proximity
    dist_to_hole = cv2.distanceTransform((~central_hole_mask).astype(np.uint8), cv2.DIST_L2, 3)
    dist_to_outer = cv2.distanceTransform(ring_mask.astype(np.uint8), cv2.DIST_L2, 3)

    for i in range(1, num_l):
        x, y, bw, bh, area = stats[i]
        if area < min_area or area > max_area:
            continue

        # Zero center hole bleed verification
        if np.mean(central_hole_mask[y:y+bh, x:x+bw]) > 0.10:
            continue

        comp_mask = (labels == i)
        comp_polys = extract_polygons(comp_mask, min_area=int(min_area * 0.5), approx_eps=0.012)
        poly = comp_polys[0] if comp_polys else [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]

        x1, y1 = max(0, x - 4), max(0, y - 4)
        x2, y2 = min(w, x + bw + 4), min(h, y + bh + 4)
        roi_gray = gray[y1:y2, x1:x2]

        roi_dist_h = dist_to_hole[y:y+bh, x:x+bw]
        roi_dist_o = dist_to_outer[y:y+bh, x:x+bw]
        is_near_edge = bool(np.min(roi_dist_h) < 6 or np.min(roi_dist_o) < 6)

        classified = classify_defect_component(
            component_mask=comp_mask,
            roi_gray=roi_gray,
            bbox=[x1, y1, x2, y2],
            total_ring_pixels=total_ring_pixels,
            is_near_edge=is_near_edge
        )

        if classified["confidence"] < confidence_threshold:
            continue

        defects.append({
            "defect_id": len(defects) + 1,
            "defect_type": classified["defect_type"],
            "type_ru": classified["type_ru"],
            "severity": classified["severity"],
            "confidence": classified["confidence"],
            "polygon": poly,
            "bounding_box": [int(x1), int(y1), int(x2), int(y2)],
            "area_pixels": classified["area_pixels"],
            "area_percent_of_ring": classified["area_percent_of_ring"],
            "length_pixels": classified["length_pixels"],
            "approximate_width_pixels": classified["approximate_width_pixels"],
            "color_hex": classified["color_hex"],
            "color_rgba": classified["color_rgba"],
        })

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
    for cand in sorted(defects, key=lambda c: c["area_pixels"], reverse=True):
        if not any(iou(cand["bounding_box"], cd["bounding_box"]) > 0.25 for cd in clean_defects):
            clean_defects.append(cand)

    # Sort defects by severity (critical first) and area
    sev_order = {"critical": 3, "medium": 2, "low": 1}
    clean_defects.sort(key=lambda d: (sev_order.get(d["severity"], 0), d["area_pixels"]), reverse=True)
    clean_defects = clean_defects[:8]
    for idx, d in enumerate(clean_defects):
        d["defect_id"] = idx + 1

    return clean_defects, connected > 0


def render_overlay(
    image_bgr: np.ndarray,
    ring_mask: np.ndarray,
    defects: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Render:
      1. annotated_result.png (Photographic rendering with alpha composite layers & labels)
      2. masks.png (Discrete color-coded class map)
    """
    h, w = image_bgr.shape[:2]
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb).convert("RGBA")
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    masks_img = np.zeros((h, w, 3), dtype=np.uint8)

    # 1. Render Intact Concrete Ring (Translucent Green #00C853)
    defect_mask_accum = np.zeros((h, w), dtype=bool)
    for d in defects:
        pts = np.array(d["polygon"], dtype=np.int32)
        if len(pts) >= 3:
            cv2.fillPoly(defect_mask_accum, [pts], True)
        else:
            bx1, by1, bx2, by2 = d["bounding_box"]
            defect_mask_accum[by1:by2, bx1:bx2] = True

    intact_mask = ring_mask & (~defect_mask_accum)
    intact_polys = extract_polygons(intact_mask, min_area=int(h * w * 0.01), approx_eps=0.005)

    intact_color = DEFECT_COLOR_PALETTE["intact"]["rgba"]
    for ip in intact_polys:
        pts = [tuple(p) for p in ip]
        if len(pts) >= 3:
            draw.polygon(pts, fill=intact_color, outline=(0, 230, 90, 160))

    masks_img[intact_mask] = (0, 200, 83)

    # 2. Render Defect Zones & Outlines
    font_size = max(13, int(min(w, h) * 0.022))
    small_size = max(11, int(font_size * 0.8))

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
        small_font = ImageFont.truetype("arial.ttf", small_size)
    except Exception:
        font = ImageFont.load_default()
        small_font = font

    for d in defects:
        rgba = d["color_rgba"]
        rgb_color = rgba[:3]
        pts = [tuple(p) for p in d["polygon"]]
        x1, y1, x2, y2 = d["bounding_box"]

        if len(pts) >= 3:
            draw.polygon(pts, fill=rgba, outline=(*rgb_color, 255))
            pts_np = np.array(d["polygon"], dtype=np.int32)
            cv2.fillPoly(masks_img, [pts_np], rgb_color)
        else:
            draw.rectangle([x1, y1, x2, y2], fill=rgba, outline=(*rgb_color, 255), width=2)
            masks_img[y1:y2, x1:x2] = rgb_color

        draw.rectangle([x1, y1, x2, y2], fill=(*rgb_color, 20), outline=(*rgb_color, 220), width=2)

        # Label tag
        label_text = f"#{d['defect_id']} {d['type_ru']}"
        sub_text = f"{int(d['confidence']*100)}% | {d['severity'].upper()}"

        bb1 = draw.textbbox((0, 0), label_text, font=font)
        lw = bb1[2] - bb1[0] + 12
        lh = bb1[3] - bb1[1] + 4

        bb2 = draw.textbbox((0, 0), sub_text, font=small_font)
        sw = bb2[2] - bb2[0] + 12
        sh = bb2[3] - bb2[1] + 4

        tag_w = max(lw, sw)
        tag_h = lh + sh + 2

        lx = x1
        ly = y1 - tag_h - 4
        if ly < 4:
            ly = y1 + 4

        draw.rectangle([lx, ly, lx + tag_w, ly + tag_h], fill=(15, 20, 30, 240), outline=(*rgb_color, 255), width=1)
        draw.text((lx + 6, ly + 2), label_text, fill=(*rgb_color, 255), font=font)
        draw.text((lx + 6, ly + lh + 1), sub_text, fill=(220, 230, 245, 240), font=small_font)

    composite = Image.alpha_composite(pil_img, overlay).convert("RGB")
    annotated_np = np.array(composite)

    return annotated_np, masks_img


def calculate_summary(
    ring_meta: Dict[str, Any],
    defects: List[Dict[str, Any]]
) -> Dict[str, Any]:
    crack_types = {"major_crack", "thin_crack", "branching_crack"}
    spalling_types = {"edge_spall", "spalling", "edge_deformation"}
    cavity_types = {"cavity", "surface_erosion"}

    crack_count = sum(1 for d in defects if d["defect_type"] in crack_types)
    spalling_count = sum(1 for d in defects if d["defect_type"] in spalling_types)
    cavity_count = sum(1 for d in defects if d["defect_type"] in cavity_types)

    damaged_pct = sum(d["area_percent_of_ring"] for d in defects)
    damaged_pct = min(100.0, round(damaged_pct, 1))
    intact_pct = round(max(0.0, 100.0 - damaged_pct), 1)

    has_critical = any(d["severity"] == "critical" for d in defects)
    has_medium = any(d["severity"] == "medium" for d in defects)

    if has_critical or damaged_pct > 8.0:
        overall_condition = "Аварийное (Критическое) / Требуется замена или ремонт"
        max_severity = "critical"
    elif has_medium or damaged_pct > 3.0:
        overall_condition = "Удовлетворительное / Требуется санация дефектов"
        max_severity = "medium"
    elif len(defects) > 0:
        overall_condition = "Хорошее / Незначительные поверхностные дефекты"
        max_severity = "low"
    else:
        overall_condition = "Отличное / Дефектов не обнаружено"
        max_severity = "normal"

    return {
        "ring_detected": ring_meta.get("ring_detected", True),
        "ring_area_percent_of_photo": ring_meta.get("ring_area_percent", 0.0),
        "total_defects": len(defects),
        "crack_count": crack_count,
        "spalling_count": spalling_count,
        "cavity_count": cavity_count,
        "intact_area_percent": intact_pct,
        "damaged_area_percent": damaged_pct,
        "overall_condition": overall_condition,
        "maximum_severity": max_severity,
    }


def main():
    parser = argparse.ArgumentParser(description="Automated Concrete Ring Defect Analyzer")
    parser.add_argument("--input", "-i", required=True, help="Path to input photo of concrete ring or pipe")
    parser.add_argument("--output-dir", "-o", default="results", help="Directory to save analysis results")
    parser.add_argument("--confidence", "-c", type=float, default=0.35, help="Confidence threshold (default: 0.35)")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    logger.info(f"Loading image from: {args.input}")

    # 1. Load image
    img_bgr = load_image(args.input)

    # 2. Dynamically segment ring
    ring_mask, hole_mask, soil_mask, ring_meta = segment_ring(img_bgr)

    # 3. Detect, isolate & classify defects
    defects, defect_mask = detect_defects(
        image_bgr=img_bgr,
        ring_mask=ring_mask,
        central_hole_mask=hole_mask,
        confidence_threshold=args.confidence
    )

    # 4. Calculate summary metrics
    summary = calculate_summary(ring_meta, defects)

    # 5. Render overlays
    annotated_img, masks_img = render_overlay(img_bgr, ring_mask, defects)

    # 6. Export outputs
    out_dir = Path(args.output_dir)
    annotated_path = out_dir / "annotated_result.png"
    masks_path = out_dir / "masks.png"
    defects_path = out_dir / "defects.json"
    summary_path = out_dir / "summary.json"

    cv2.imwrite(str(annotated_path), cv2.cvtColor(annotated_img, cv2.COLOR_RGB2BGR))
    cv2.imwrite(str(masks_path), cv2.cvtColor(masks_img, cv2.COLOR_RGB2BGR))

    with open(defects_path, "w", encoding="utf-8") as f:
        json.dump(defects, f, ensure_ascii=False, indent=2)

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    logger.success(f"Analysis complete! Saved results to {args.output_dir}/")
    print(f"\n[SUMMARY]: {summary['overall_condition']}")
    print(f"  Total defects: {summary['total_defects']} (Cracks: {summary['crack_count']}, Spalls: {summary['spalling_count']}, Cavities: {summary['cavity_count']})")
    print(f"  Intact area: {summary['intact_area_percent']}% | Damaged: {summary['damaged_area_percent']}%")
    print(f"  Files saved: annotated_result.png, masks.png, defects.json, summary.json\n")


if __name__ == "__main__":
    main()
