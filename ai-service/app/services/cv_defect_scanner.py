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
    Detect cracks using THREE methods:
    1. Morphological: blur background subtraction → dark thin lines
    2. Sobel gradients: strong local contrast edges → visible cracks
    3. Adaptive threshold: catches dark cracks on variable background
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
    # Lower threshold to catch more edges
    sobel_thresh = max(50, 120 - threshold)
    sobel_mask = (gradient > sobel_thresh).astype(np.uint8)
    
    # === Method 3: Adaptive local threshold ===
    # Compare each pixel to local mean (dark lines in any context)
    local_size = max(w, h) // 16  # ~40-100px block
    if local_size % 2 == 0:
        local_size += 1
    local_size = max(3, local_size)
    
    # Compute local mean using box filter (sliding window average)
    # Simple approach: resize down then up
    small_scale = max(2, local_size // 4)
    local_bg = PILImage.fromarray(gray).resize((w // small_scale, h // small_scale), PILImage.BILINEAR)
    local_bg = local_bg.filter(ImageFilter.GaussianBlur(radius=3))
    local_bg = local_bg.resize((w, h), PILImage.BILINEAR)
    local_mean = np.array(local_bg).astype(np.float32)
    
    # Pixels significantly darker than local mean = potential crack
    local_diff = local_mean - gray.astype(np.float32)
    adapt_thresh = max(25, threshold - 15)
    adapt_mask = (local_diff > adapt_thresh).astype(np.uint8)
    
    # === Method 4: Strong edges via double-threshold (pseudo-Canny) ===
    # Find pixels with VERY strong gradient (definite edges)
    strong_thresh = max(80, sobel_thresh * 1.5)
    strong_edges = (gradient > strong_thresh).astype(np.uint8)
    
    # Dilate strong edges to connect nearby fragments
    # Simple 3x3 dilation
    dilated = np.zeros_like(strong_edges)
    dilated[1:, :] |= strong_edges[:-1, :]
    dilated[:-1, :] |= strong_edges[1:, :]
    dilated[:, 1:] |= strong_edges[:, :-1]
    dilated[:, :-1] |= strong_edges[:, 1:]
    dilated |= strong_edges
    
    # Combine all methods
    combined = np.maximum(np.maximum(morph_mask, sobel_mask), np.maximum(adapt_mask, dilated))
    
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


def _is_earth_region(img: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> bool:
    """
    Check if region is predominantly earth/soil/dirt (not concrete).
    Earth is brown/orange/tan with warm tones and high color variance.
    """
    region = img[y1:y2, x1:x2]
    if region.size == 0:
        return False
    
    r = region[:, :, 0].astype(np.float32)
    g = region[:, :, 1].astype(np.float32)
    b = region[:, :, 2].astype(np.float32)
    
    r_mean, g_mean, b_mean = r.mean(), g.mean(), b.mean()
    
    # Earth characteristics: warm colors (R > B), brownish
    is_warm = r_mean > b_mean + 15
    is_brownish = r_mean > 80 and g_mean > 50 and b_mean < r_mean - 10
    
    # Earth has high color variance (texture of dirt/stones)
    color_var = r.std() + g.std() + b.std()
    high_variance = color_var > 60
    
    # Concrete is gray: R ≈ G ≈ B with low saturation
    max_diff = max(abs(r_mean - g_mean), abs(r_mean - b_mean), abs(g_mean - b_mean))
    is_gray = max_diff < 25
    
    # If it's warm+brownish+varied → earth
    if is_warm and is_brownish and high_variance and not is_gray:
        return True
    
    return False


def _is_uniform_concrete(img: np.ndarray, gray: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> bool:
    """
    Check if region is smooth uniform concrete with no actual defect.
    Uniform concrete has low gradient variance and grayish tone.
    """
    g_region = gray[y1:y2, x1:x2].astype(np.float32)
    if g_region.size < 100:
        return False
    
    # Low standard deviation = uniform surface
    if g_region.std() < 15:
        return True
    
    # Check if region has no strong edges (all pixels similar brightness)
    edge_count = 0
    total_pixels = g_region.shape[0] * g_region.shape[1]
    # Simple check: count pixels that differ a lot from their neighbors
    if g_region.shape[0] > 2 and g_region.shape[1] > 2:
        diff_v = np.abs(g_region[1:, :] - g_region[:-1, :])
        diff_h = np.abs(g_region[:, 1:] - g_region[:, :-1])
        edge_count = (diff_v > 30).sum() + (diff_h > 30).sum()
        edge_ratio = edge_count / max(total_pixels, 1)
        if edge_ratio < 0.02:
            return True
    
    return False


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
    g_mean = mean_val[1] if len(mean_val) >= 3 else 128
    b_mean = mean_val[2] if len(mean_val) >= 3 else 128
    
    # Classification logic
    if aspect > 2.0 and fill_ratio < 0.5:
        # Elongated + sparse fill = CRACK
        defect_type = "Трещина"
        if aspect > 4 or area_ratio > 0.02:
            severity = "critical"
        elif area_ratio > 0.005:
            severity = "high"
        else:
            severity = "medium"
    elif brightness < 0.2:
        defect_type = "Глубокое повреждение"
        severity = "critical" if area_ratio > 0.01 else "high"
    elif r_mean > b_mean + 40 and r_mean > 120:
        # Check if this is actual rust vs just earth
        if r_mean > b_mean + 60 and g_mean < r_mean - 30:
            defect_type = "Коррозия / ржавчина"
        else:
            defect_type = "Повреждение бетона"
        severity = "high" if area_ratio > 0.02 else "medium"
    elif area_ratio > 0.03:
        defect_type = "Отслоение / сколы"
        severity = "high" if area_ratio > 0.06 else "medium"
    else:
        defect_type = "Дефект поверхности"
        severity = "medium" if area_ratio > 0.005 else "low"
    
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
    
    # Contrast enhancement: stretch histogram for better crack visibility
    g_min, g_max = float(gray.min()), float(gray.max())
    if g_max - g_min > 10:
        enhanced = ((gray.astype(np.float32) - g_min) / (g_max - g_min) * 255).astype(np.uint8)
    else:
        enhanced = gray
    
    # 1. Detect cracks (thin dark lines against background)
    crack_thresh = int(70 - sensitivity * 30)  # 40-70 range (lower = more sensitive)
    crack_mask = _detect_cracks(enhanced, threshold=crack_thresh)
    
    # 2. Detect stains/damage
    stain_mask = _detect_stains(image)
    
    # 3. Find regions — separate for cracks and stains
    min_area = int(max(80, total_area * 0.0005))    # Min 0.05% (was 0.2%)
    max_area = int(total_area * 0.10)                # Max 10% (was 5%)
    
    crack_regions = _find_regions(crack_mask, min_area=min_area, max_area=max_area)
    stain_regions = _find_regions(stain_mask, min_area=min_area * 2, max_area=max_area)
    
    # Also detect on original gray (not enhanced) for robustness
    if enhanced is not gray:
        crack_mask_orig = _detect_cracks(gray, threshold=crack_thresh + 10)
        crack_regions_orig = _find_regions(crack_mask_orig, min_area=min_area, max_area=max_area)
        crack_regions = crack_regions + crack_regions_orig
    
    # Merge all regions
    all_regions = crack_regions + stain_regions
    
    # Filter by bbox dimensions: reject square blobs >40% but allow elongated cracks
    filtered = []
    for (x1, y1, x2, y2, a) in all_regions:
        bw, bh = x2 - x1, y2 - y1
        aspect = max(bw, bh) / max(min(bw, bh), 1)
        
        if aspect > 2.0:
            # Elongated (crack-like): allow up to 60% in one dimension if narrow
            narrow = min(bw, bh)
            if narrow < min(w, h) * 0.20:
                filtered.append((x1, y1, x2, y2, a))
                continue
        
        # Square-ish regions: limit to 40% of image
        if bw < w * 0.40 and bh < h * 0.40:
            filtered.append((x1, y1, x2, y2, a))
    
    all_regions = filtered
    
    # Deduplicate overlapping
    all_regions = _deduplicate(all_regions)
    
    # Sort by area descending, keep top 10 (was 6)
    all_regions = sorted(all_regions, key=lambda r: r[4], reverse=True)[:10]
    
    # 4. Classify each (with filters for false positives)
    defects = []
    gray_for_filter = gray
    for i, (x1, y1, x2, y2, area) in enumerate(all_regions):
        # Add small padding
        pad = max(4, int(min(x2 - x1, y2 - y1) * 0.05))
        px1 = max(0, x1 - pad)
        py1 = max(0, y1 - pad)
        px2 = min(w, x2 + pad)
        py2 = min(h, y2 + pad)
        
        # --- FILTER: Skip earth/soil regions (not construction defects) ---
        if _is_earth_region(image, px1, py1, px2, py2):
            logger.debug(f"[CV Scanner] Skipped region {i}: earth/soil")
            continue
        
        # --- FILTER: Skip uniform concrete (no actual damage) ---
        if _is_uniform_concrete(image, gray_for_filter, px1, py1, px2, py2):
            logger.debug(f"[CV Scanner] Skipped region {i}: uniform concrete")
            continue
        
        info = _classify_region(image, px1, py1, px2, py2, area, total_area)
        
        defects.append({
            "id": len(defects) + 1,
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
