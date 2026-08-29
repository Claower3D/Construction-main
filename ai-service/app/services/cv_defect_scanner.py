"""
QazGost AI — CV-based Defect Scanner v2

Improved defect detection focused on REAL construction defects:
  - Cracks: thin elongated high-contrast lines
  - Dark damage: deep holes, water damage
  - Rust/stains: color anomalies
  
Fixes from v1:
  - Higher thresholds → fewer false positives
  - Filters out huge regions (>8% area = probably not a defect)
  - Filters out image-border regions
  - Better crack detection using line-like shape analysis
  - Tighter bounding boxes
"""

import io
import base64
import numpy as np
from typing import List, Dict, Any, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from loguru import logger


# Severity colors (RGBA for overlay)
SEV_COLORS = {
    "critical": (255, 30, 30),
    "high":     (255, 100, 20),
    "medium":   (255, 190, 0),
    "low":      (80, 200, 80),
}

SEV_LABELS_RU = {
    "critical": "КРИТИЧЕСКИЙ",
    "high":     "ВЫСОКИЙ",
    "medium":   "СРЕДНИЙ",
    "low":      "НИЗКИЙ",
}


def _grayscale(img: np.ndarray) -> np.ndarray:
    return np.dot(img[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)


def _detect_cracks(gray: np.ndarray, threshold: int = 55) -> np.ndarray:
    """
    Detect cracks using TWO methods:
    1. Morphological: blur background subtraction → dark thin lines
    2. Sobel gradients: strong local contrast edges → visible cracks
    """
    h, w = gray.shape
    
    # === Method 1: Morphological (dark lines on lighter background) ===
    from PIL import Image as PILImage
    scale = 8
    bg_pil = PILImage.fromarray(gray).resize((w // scale, h // scale), PILImage.BILINEAR)
    bg_pil = bg_pil.filter(ImageFilter.GaussianBlur(radius=5))
    bg_pil = bg_pil.resize((w, h), PILImage.BILINEAR)
    background = np.array(bg_pil).astype(np.float32)
    
    diff = background - gray.astype(np.float32)
    morph_mask = (diff > threshold).astype(np.uint8)
    
    # === Method 2: Sobel edges (high gradient = crack edges) ===
    gf = gray.astype(np.float32)
    # Sobel X
    sx = np.zeros_like(gf)
    sx[:, 1:-1] = gf[:, 2:] - gf[:, :-2]
    # Sobel Y
    sy = np.zeros_like(gf)
    sy[1:-1, :] = gf[2:, :] - gf[:-2, :]
    # Gradient magnitude
    gradient = np.sqrt(sx * sx + sy * sy)
    # High threshold for sobel (only strong edges = real cracks, not texture)
    sobel_thresh = max(80, 150 - threshold)
    sobel_mask = (gradient > sobel_thresh).astype(np.uint8)
    
    # Combine both methods
    combined = np.maximum(morph_mask, sobel_mask)
    
    return combined


def _detect_stains(img: np.ndarray) -> np.ndarray:
    """Detect rust/water stains by color deviation."""
    r, g, b = img[:, :, 0].astype(np.float32), img[:, :, 1].astype(np.float32), img[:, :, 2].astype(np.float32)
    
    # Rust: high red, low blue, medium green
    rust = ((r - b) > 60) & (r > 100) & (g < r - 20)
    
    # Water/dark stains: very dark regions
    gray = _grayscale(img)
    dark = gray < 45
    
    # Green/mold: greenish tint
    mold = (g > r + 15) & (g > b + 15) & (g > 80)
    
    combined = (rust | dark | mold).astype(np.uint8)
    return combined


def _find_regions(binary: np.ndarray, min_area: int, max_area: int) -> List[Tuple[int, int, int, int, int]]:
    """
    Connected components with area filtering.
    Returns (x1, y1, x2, y2, pixel_count).
    """
    h, w = binary.shape
    
    # Downsample 2x for speed
    sc = 2
    small = binary[::sc, ::sc]
    sh, sw = small.shape
    
    visited = np.zeros((sh, sw), dtype=bool)
    regions = []
    
    for sy in range(1, sh - 1):
        for sx in range(1, sw - 1):
            if small[sy, sx] == 0 or visited[sy, sx]:
                continue
            
            # BFS
            stack = [(sy, sx)]
            visited[sy, sx] = True
            pixels = []
            
            while stack and len(pixels) < 8000:
                cy, cx = stack.pop()
                pixels.append((cx, cy))
                
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < sh and 0 <= nx < sw and not visited[ny, nx] and small[ny, nx] > 0:
                        visited[ny, nx] = True
                        stack.append((ny, nx))
            
            if not pixels:
                continue
                
            xs = [p[0] for p in pixels]
            ys = [p[1] for p in pixels]
            
            real_area = len(pixels) * sc * sc
            x1 = min(xs) * sc
            y1 = min(ys) * sc
            x2 = min(max(xs) * sc + sc, w)
            y2 = min(max(ys) * sc + sc, h)
            
            if min_area <= real_area <= max_area:
                # Filter: skip regions touching image border heavily
                border_margin = int(min(w, h) * 0.02)
                if x1 < border_margin and x2 > w - border_margin:
                    continue  # spans full width = not a defect
                if y1 < border_margin and y2 > h - border_margin:
                    continue  # spans full height
                    
                regions.append((x1, y1, x2, y2, real_area))
    
    return regions


def _classify_region(img: np.ndarray, x1: int, y1: int, x2: int, y2: int, area: int, total_area: int) -> Dict[str, Any]:
    """Classify a detected region."""
    bw = x2 - x1
    bh = y2 - y1
    aspect = max(bw, bh) / max(min(bw, bh), 1)
    area_ratio = area / total_area
    fill_ratio = area / max(bw * bh, 1)  # how much of bbox is filled
    
    region = img[y1:y2, x1:x2]
    mean_val = region.mean(axis=(0, 1)) if region.size > 0 else [128, 128, 128]
    brightness = sum(mean_val[:3]) / 3 / 255
    
    r_mean = mean_val[0] if len(mean_val) >= 3 else 128
    b_mean = mean_val[2] if len(mean_val) >= 3 else 128
    
    # Classification logic
    if aspect > 2.5 and fill_ratio < 0.4:
        # Elongated + sparse fill = CRACK
        defect_type = "Трещина"
        if aspect > 5 or area_ratio > 0.03:
            severity = "critical"
        elif area_ratio > 0.01:
            severity = "high"
        else:
            severity = "medium"
    elif brightness < 0.2:
        defect_type = "Глубокое повреждение"
        severity = "critical" if area_ratio > 0.02 else "high"
    elif r_mean > b_mean + 40 and r_mean > 120:
        defect_type = "Коррозия / ржавчина"
        severity = "high" if area_ratio > 0.02 else "medium"
    elif area_ratio > 0.04:
        defect_type = "Отслоение / сколы"
        severity = "high" if area_ratio > 0.08 else "medium"
    else:
        defect_type = "Дефект поверхности"
        severity = "low"
    
    confidence = min(0.97, 0.45 + area_ratio * 8 + (0.15 if aspect > 3 else 0))
    
    return {
        "type": defect_type,
        "severity": severity,
        "confidence": round(confidence, 2),
    }


def scan_defects(image: np.ndarray, sensitivity: float = 0.5) -> Dict[str, Any]:
    """
    Scan image for construction defects.
    
    Returns dict with defects list, annotated image (base64), severity summary.
    """
    h, w = image.shape[:2]
    total_area = h * w
    
    logger.info(f"[CV Scanner v2] Scanning {w}x{h}, sensitivity={sensitivity}")
    
    gray = _grayscale(image)
    
    # 1. Detect cracks (thin dark lines against background)
    crack_thresh = int(85 - sensitivity * 25)  # 60-85 range (higher = fewer false positives)
    crack_mask = _detect_cracks(gray, threshold=crack_thresh)
    
    # 2. Detect stains/damage
    stain_mask = _detect_stains(image)
    
    # 3. Find regions — separate for cracks and stains
    min_area = int(max(200, total_area * 0.002))   # Min 0.2%
    max_area = int(total_area * 0.05)               # Max 5% per region
    
    crack_regions = _find_regions(crack_mask, min_area=min_area, max_area=max_area)
    stain_regions = _find_regions(stain_mask, min_area=min_area * 2, max_area=max_area)
    
    # Merge all regions
    all_regions = crack_regions + stain_regions
    
    # Filter by bbox dimensions: reject square blobs >40% but allow elongated cracks
    filtered = []
    for (x1, y1, x2, y2, a) in all_regions:
        bw, bh = x2 - x1, y2 - y1
        aspect = max(bw, bh) / max(min(bw, bh), 1)
        
        if aspect > 2.5:
            # Elongated (crack-like): allow up to 60% in one dimension if narrow
            narrow = min(bw, bh)
            if narrow < min(w, h) * 0.15:
                filtered.append((x1, y1, x2, y2, a))
                continue
        
        # Square-ish regions: limit to 35% of image
        if bw < w * 0.35 and bh < h * 0.35:
            filtered.append((x1, y1, x2, y2, a))
    
    all_regions = filtered
    
    # Deduplicate overlapping
    all_regions = _deduplicate(all_regions)
    
    # Sort by area descending, keep top 6
    all_regions = sorted(all_regions, key=lambda r: r[4], reverse=True)[:6]
    
    # 4. Classify each
    defects = []
    for i, (x1, y1, x2, y2, area) in enumerate(all_regions):
        # Add small padding
        pad = max(4, int(min(x2 - x1, y2 - y1) * 0.05))
        px1 = max(0, x1 - pad)
        py1 = max(0, y1 - pad)
        px2 = min(w, x2 + pad)
        py2 = min(h, y2 + pad)
        
        info = _classify_region(image, px1, py1, px2, py2, area, total_area)
        
        defects.append({
            "id": i + 1,
            "bbox": [px1, py1, px2, py2],
            "type": info["type"],
            "severity": info["severity"],
            "confidence": info["confidence"],
            "area_percent": round(area / total_area * 100, 1),
            "description": f"{info['type']} — область {px2-px1}×{py2-py1}px, {area / total_area * 100:.1f}% площади",
        })
    
    # 5. Draw annotations
    annotated = _draw_annotations(image.copy(), defects)
    
    # 6. Encode
    pil_out = Image.fromarray(annotated)
    buf = io.BytesIO()
    pil_out.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode()
    annotated_b64 = f"data:image/jpeg;base64,{b64}"
    
    # 7. Summary
    sev_counts = {}
    for d in defects:
        s = d["severity"]
        sev_counts[s] = sev_counts.get(s, 0) + 1
    
    max_sev = "low"
    sev_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    if sev_counts:
        max_sev = max(sev_counts.keys(), key=lambda s: sev_order.get(s, 0))
    
    logger.info(f"[CV Scanner v2] Found {len(defects)} defects, max_severity={max_sev}")
    
    return {
        "defects": defects,
        "annotated_image": annotated_b64,
        "severity_summary": {
            "total": len(defects),
            "by_severity": sev_counts,
            "max_severity": max_sev,
        },
    }


def _deduplicate(regions: List[Tuple], iou_thresh: float = 0.3) -> List[Tuple]:
    """Remove overlapping regions (keep larger)."""
    if len(regions) <= 1:
        return regions
    
    regions = sorted(regions, key=lambda r: r[4], reverse=True)
    keep = []
    
    for i, (x1, y1, x2, y2, area) in enumerate(regions):
        overlaps = False
        for kx1, ky1, kx2, ky2, _ in keep:
            # Intersection
            ix1, iy1 = max(x1, kx1), max(y1, ky1)
            ix2, iy2 = min(x2, kx2), min(y2, ky2)
            if ix1 < ix2 and iy1 < iy2:
                inter = (ix2 - ix1) * (iy2 - iy1)
                smaller = min((x2 - x1) * (y2 - y1), (kx2 - kx1) * (ky2 - ky1))
                if smaller > 0 and inter / smaller > iou_thresh:
                    overlaps = True
                    break
        if not overlaps:
            keep.append((x1, y1, x2, y2, area))
    
    return keep


def _draw_annotations(image: np.ndarray, defects: List[Dict]) -> np.ndarray:
    """Draw clean, precise annotations on the image."""
    pil_img = Image.fromarray(image).convert("RGBA")
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    h, w = image.shape[:2]
    font_size = max(13, int(min(w, h) * 0.02))
    small_size = max(11, int(font_size * 0.8))
    
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
        color = SEV_COLORS.get(sev, (255, 190, 0))
        
        # Thin semi-transparent fill + solid border
        draw.rectangle([x1, y1, x2, y2], fill=(*color, 35), outline=(*color, 200), width=2)
        
        # Corner brackets (L-shaped markers at corners)
        blen = max(8, int(min(x2 - x1, y2 - y1) * 0.15))
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            draw.line([(cx, cy), (cx + dx * blen, cy)], fill=(*color, 255), width=3)
            draw.line([(cx, cy), (cx, cy + dy * blen)], fill=(*color, 255), width=3)
        
        # Label background
        label = f"#{d['id']} {d['type']}"
        sev_text = f"{d['confidence']*100:.0f}% | {SEV_LABELS_RU.get(sev, sev)}"
        
        lb = draw.textbbox((0, 0), label, font=font)
        lw = lb[2] - lb[0] + 14
        lh = lb[3] - lb[1] + 6
        
        sb = draw.textbbox((0, 0), sev_text, font=small_font)
        sw_text = sb[2] - sb[0] + 14
        sh_text = sb[3] - sb[1] + 4
        
        total_h = lh + sh_text + 2
        box_w = max(lw, sw_text)
        
        # Position: above bbox, or inside if no space
        lx = x1
        ly = y1 - total_h - 4
        if ly < 2:
            ly = y1 + 4
        
        # Dark background for text
        draw.rectangle([lx, ly, lx + box_w, ly + total_h],
                       fill=(8, 12, 25, 220), outline=(*color, 180), width=1)
        
        # Text
        draw.text((lx + 7, ly + 2), label, fill=(*color, 255), font=font)
        draw.text((lx + 7, ly + lh), sev_text, fill=(200, 210, 230, 220), font=small_font)
        
        # Severity indicator dot in top-right corner of bbox
        dot_r = max(4, int(min(x2 - x1, y2 - y1) * 0.04))
        dot_x = x2 - dot_r - 4
        dot_y = y1 + dot_r + 4
        draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
                     fill=(*color, 220), outline=(255, 255, 255, 180), width=1)
    
    result = Image.alpha_composite(pil_img, overlay).convert("RGB")
    return np.array(result)
