"""
QazGost AI — CV-based Defect Scanner

Simple computer vision defect detection using PIL + numpy only.
No GPU, no ML models needed. Finds cracks, stains, damage by:
  1. Edge detection (Sobel-like gradient)
  2. Color anomaly detection
  3. Contour grouping into bounding boxes
"""

import io
import base64
import numpy as np
from typing import List, Dict, Any, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from loguru import logger


# Severity colors (RGB)
SEV_COLORS = {
    "critical": (255, 40, 40),
    "high":     (255, 120, 30),
    "medium":   (255, 200, 0),
    "low":      (80, 200, 80),
}

SEV_LABELS = {
    "critical": "КРИТИЧЕСКИЙ",
    "high":     "ВЫСОКИЙ",
    "medium":   "СРЕДНИЙ",
    "low":      "НИЗКИЙ",
}


def _to_grayscale(img: np.ndarray) -> np.ndarray:
    """Convert RGB to grayscale."""
    return np.dot(img[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)


def _sobel_edges(gray: np.ndarray, threshold: int = 40) -> np.ndarray:
    """Simple Sobel-like edge detection without OpenCV."""
    # Horizontal and vertical gradients
    gx = np.zeros_like(gray, dtype=np.float32)
    gy = np.zeros_like(gray, dtype=np.float32)
    
    gx[:, 1:-1] = gray[:, 2:].astype(np.float32) - gray[:, :-2].astype(np.float32)
    gy[1:-1, :] = gray[2:, :].astype(np.float32) - gray[:-2, :].astype(np.float32)
    
    magnitude = np.sqrt(gx**2 + gy**2)
    edges = (magnitude > threshold).astype(np.uint8)
    return edges


def _find_connected_regions(binary: np.ndarray, min_area: int = 200) -> List[Tuple[int, int, int, int, int]]:
    """
    Simple flood-fill connected component labeling.
    Returns list of (x1, y1, x2, y2, area) bounding boxes.
    Uses downsampled image for speed.
    """
    h, w = binary.shape
    
    # Downsample for speed (4x)
    scale = 4
    small = binary[::scale, ::scale]
    sh, sw = small.shape
    
    visited = np.zeros_like(small, dtype=bool)
    regions = []
    
    for y in range(1, sh - 1):
        for x in range(1, sw - 1):
            if small[y, x] == 0 or visited[y, x]:
                continue
            
            # BFS flood fill
            stack = [(y, x)]
            visited[y, x] = True
            min_x, min_y = x, y
            max_x, max_y = x, y
            area = 0
            
            while stack and area < 5000:  # cap to avoid giant regions
                cy, cx = stack.pop()
                area += 1
                min_x = min(min_x, cx)
                min_y = min(min_y, cy)
                max_x = max(max_x, cx)
                max_y = max(max_y, cy)
                
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < sh and 0 <= nx < sw and not visited[ny, nx] and small[ny, nx] > 0:
                        visited[ny, nx] = True
                        stack.append((ny, nx))
            
            real_area = area * scale * scale
            if real_area >= min_area:
                regions.append((
                    min_x * scale,
                    min_y * scale,
                    min(max_x * scale + scale, w),
                    min(max_y * scale + scale, h),
                    real_area,
                ))
    
    return regions


def _merge_overlapping(regions: List[Tuple], overlap_thresh: float = 0.3) -> List[Tuple]:
    """Merge overlapping bounding boxes."""
    if not regions:
        return []
    
    # Sort by area descending
    regions = sorted(regions, key=lambda r: r[4], reverse=True)
    merged = []
    used = set()
    
    for i, (x1, y1, x2, y2, area) in enumerate(regions):
        if i in used:
            continue
        
        mx1, my1, mx2, my2, m_area = x1, y1, x2, y2, area
        
        for j in range(i + 1, len(regions)):
            if j in used:
                continue
            
            jx1, jy1, jx2, jy2, j_area = regions[j]
            
            # Check overlap
            ox1 = max(mx1, jx1)
            oy1 = max(my1, jy1)
            ox2 = min(mx2, jx2)
            oy2 = min(my2, jy2)
            
            if ox1 < ox2 and oy1 < oy2:
                overlap = (ox2 - ox1) * (oy2 - oy1)
                min_area = min((mx2 - mx1) * (my2 - my1), (jx2 - jx1) * (jy2 - jy1))
                
                if min_area > 0 and overlap / min_area > overlap_thresh:
                    mx1 = min(mx1, jx1)
                    my1 = min(my1, jy1)
                    mx2 = max(mx2, jx2)
                    my2 = max(my2, jy2)
                    m_area += j_area
                    used.add(j)
        
        merged.append((mx1, my1, mx2, my2, m_area))
    
    return merged


def _classify_defect(region_img: np.ndarray, area_ratio: float) -> Dict[str, Any]:
    """Classify defect type based on region properties."""
    h, w = region_img.shape[:2]
    aspect = w / max(h, 1)
    
    # Color analysis
    mean_color = region_img.mean(axis=(0, 1))
    darkness = mean_color.mean() / 255.0
    
    # Detect type based on shape and color
    if aspect > 3.0 or aspect < 0.33:
        # Long narrow = crack
        defect_type = "Трещина"
        if area_ratio > 0.05:
            severity = "critical"
        elif area_ratio > 0.02:
            severity = "high"
        else:
            severity = "medium"
    elif darkness < 0.3:
        # Very dark region = deep damage / hole
        defect_type = "Глубокое повреждение"
        severity = "critical" if area_ratio > 0.03 else "high"
    elif mean_color[0] > mean_color[2] * 1.3 and mean_color[1] < 120:
        # Reddish = rust/corrosion
        defect_type = "Коррозия / ржавчина"
        severity = "high" if area_ratio > 0.02 else "medium"
    elif abs(mean_color[1] - mean_color[0]) > 30 and mean_color[1] > 100:
        # Greenish tint = mold/biological
        defect_type = "Биопоражение / плесень"
        severity = "high"
    elif area_ratio > 0.08:
        # Large area = spalling/delamination
        defect_type = "Отслоение / сколы"
        severity = "high" if area_ratio > 0.15 else "medium"
    else:
        defect_type = "Дефект поверхности"
        severity = "medium" if area_ratio > 0.01 else "low"
    
    return {"type": defect_type, "severity": severity}


def scan_defects(image: np.ndarray, sensitivity: float = 0.5) -> Dict[str, Any]:
    """
    Scan image for defects using computer vision.
    
    Args:
        image: RGB numpy array
        sensitivity: 0.0 (less detections) to 1.0 (more detections)
    
    Returns:
        Dict with defects list, annotated image base64, severity summary
    """
    h, w = image.shape[:2]
    total_area = h * w
    
    logger.info(f"[CV Scanner] Scanning {w}x{h} image, sensitivity={sensitivity}")
    
    # 1. Edge detection
    gray = _to_grayscale(image)
    threshold = int(60 - sensitivity * 30)  # 30-60
    edges = _sobel_edges(gray, threshold=threshold)
    
    # 2. Also detect dark spots (damage/holes)
    dark_mask = (gray < 60).astype(np.uint8)
    
    # 3. Detect color anomalies (stains, rust)
    r, g, b = image[:, :, 0], image[:, :, 1], image[:, :, 2]
    
    # Rust detection (high red, low blue)
    rust_mask = ((r.astype(int) - b.astype(int)) > 50).astype(np.uint8)
    
    # Combine all masks
    combined = np.clip(edges + dark_mask + rust_mask, 0, 1).astype(np.uint8)
    
    # 4. Find connected regions
    min_area = int(max(200, total_area * 0.002 * (1.5 - sensitivity)))
    regions = _find_connected_regions(combined, min_area=min_area)
    
    # 5. Merge overlapping
    regions = _merge_overlapping(regions)
    
    # 6. Filter: keep top 8 largest
    regions = sorted(regions, key=lambda r: r[4], reverse=True)[:8]
    
    # 7. Classify each defect
    defects = []
    for i, (x1, y1, x2, y2, area) in enumerate(regions):
        # Pad bbox slightly
        pad = int(min(x2 - x1, y2 - y1) * 0.1)
        bx1 = max(0, x1 - pad)
        by1 = max(0, y1 - pad)
        bx2 = min(w, x2 + pad)
        by2 = min(h, y2 + pad)
        
        region_img = image[by1:by2, bx1:bx2]
        area_ratio = area / total_area
        
        info = _classify_defect(region_img, area_ratio)
        
        defects.append({
            "id": i + 1,
            "bbox": [bx1, by1, bx2, by2],
            "type": info["type"],
            "severity": info["severity"],
            "confidence": round(min(0.95, 0.5 + area_ratio * 5), 2),
            "area_percent": round(area_ratio * 100, 1),
            "description": f"{info['type']} — область {(bx2-bx1)}×{(by2-by1)}px, {area_ratio*100:.1f}% площади",
        })
    
    # 8. Draw annotations on image
    annotated = _draw_annotations(image.copy(), defects)
    
    # 9. Convert to base64
    pil_out = Image.fromarray(annotated)
    buf = io.BytesIO()
    pil_out.save(buf, format="JPEG", quality=88)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    annotated_b64 = f"data:image/jpeg;base64,{b64}"
    
    # 10. Severity summary
    sev_counts = {}
    for d in defects:
        s = d["severity"]
        sev_counts[s] = sev_counts.get(s, 0) + 1
    
    max_sev = "low"
    if sev_counts:
        max_sev = max(sev_counts.keys(),
                      key=lambda s: {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(s, 0))
    
    logger.info(f"[CV Scanner] Found {len(defects)} defects, max_severity={max_sev}")
    
    return {
        "defects": defects,
        "annotated_image": annotated_b64,
        "severity_summary": {
            "total": len(defects),
            "by_severity": sev_counts,
            "max_severity": max_sev,
        },
    }


def _draw_annotations(image: np.ndarray, defects: List[Dict]) -> np.ndarray:
    """Draw colored bounding boxes and labels on image."""
    pil_img = Image.fromarray(image).convert("RGBA")
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    h, w = image.shape[:2]
    font_size = max(14, int(min(w, h) * 0.022))
    small_size = max(11, int(font_size * 0.75))
    
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
        small_font = ImageFont.truetype("arial.ttf", small_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", small_size)
        except:
            font = ImageFont.load_default()
            small_font = font
    
    for d in defects:
        x1, y1, x2, y2 = d["bbox"]
        sev = d["severity"]
        color = SEV_COLORS.get(sev, (255, 200, 0))
        alpha = 70
        
        # Semi-transparent fill
        draw.rectangle([x1, y1, x2, y2], fill=(*color, alpha), outline=(*color, 220), width=3)
        
        # Corner brackets
        blen = max(12, int(min(x2 - x1, y2 - y1) * 0.2))
        bw = 3
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            draw.line([(cx, cy), (cx + dx * blen, cy)], fill=(*color, 255), width=bw)
            draw.line([(cx, cy), (cx, cy + dy * blen)], fill=(*color, 255), width=bw)
        
        # Label
        label = f"#{d['id']} {d['type']}"
        conf_text = f"{d['confidence']*100:.0f}% | {SEV_LABELS.get(sev, sev)}"
        
        lb = draw.textbbox((0, 0), label, font=font)
        lw, lh = lb[2] - lb[0] + 16, lb[3] - lb[1] + 8
        cb = draw.textbbox((0, 0), conf_text, font=small_font)
        cw, ch = cb[2] - cb[0] + 16, cb[3] - cb[1] + 6
        
        total_h = lh + ch + 4
        box_w = max(lw, cw)
        
        # Position above bbox
        lx = x1
        ly = y1 - total_h - 6
        if ly < 0:
            ly = y1 + 4
        
        # Background
        draw.rectangle([lx, ly, lx + box_w, ly + total_h], fill=(10, 15, 30, 210))
        
        # Main label
        draw.text((lx + 8, ly + 3), label, fill=(*color, 255), font=font)
        
        # Severity + confidence
        draw.rectangle([lx, ly + lh + 2, lx + box_w, ly + total_h], fill=(*color, 50))
        draw.text((lx + 8, ly + lh + 4), conf_text, fill=(*color, 255), font=small_font)
        
        # Severity dot
        dot_r = max(5, int(min(x2 - x1, y2 - y1) * 0.05))
        dot_x, dot_y = x2 - dot_r - 6, y1 + dot_r + 6
        draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
                     fill=(*color, 200), outline=(255, 255, 255, 180), width=2)
    
    result = Image.alpha_composite(pil_img, overlay).convert("RGB")
    return np.array(result)
