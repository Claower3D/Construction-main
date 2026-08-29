"""
QazGost AI - Defect Visualizer

Draws bounding boxes, severity labels, and heat zones on images
to show where defects are and how critical they are.
"""

import io
import math
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from loguru import logger

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

from PIL import Image, ImageDraw, ImageFont


# Severity color mapping (BGR for cv2, RGB for PIL)
SEVERITY_COLORS = {
    "critical": {"rgb": (255, 40, 40), "label": "🔴 КРИТИЧЕСКИЙ", "class": 5},
    "high":     {"rgb": (255, 120, 30), "label": "🟠 ВЫСОКИЙ", "class": 4},
    "medium":   {"rgb": (255, 200, 0), "label": "🟡 СРЕДНИЙ", "class": 3},
    "low":      {"rgb": (80, 200, 80), "label": "🟢 НИЗКИЙ", "class": 2},
    "info":     {"rgb": (100, 160, 255), "label": "🔵 ИНФО", "class": 1},
}

# Defect type → default severity
DEFECT_SEVERITY_MAP = {
    "crack": "high",
    "deep_crack": "critical",
    "spalling": "high",
    "corrosion": "critical",
    "rust": "medium",
    "mold": "high",
    "stain": "low",
    "efflorescence": "medium",
    "delamination": "high",
    "water_damage": "critical",
    "settlement_crack": "critical",
    "plaster_defect": "medium",
    "paint_peeling": "low",
    "joint_defect": "medium",
}


def get_severity(defect_type: str, area_ratio: float = 0.0) -> str:
    """Determine severity based on defect type and relative area."""
    base = DEFECT_SEVERITY_MAP.get(defect_type.lower().replace(" ", "_"), "medium")
    
    # Upgrade severity if defect covers large area
    if area_ratio > 0.15:
        levels = ["info", "low", "medium", "high", "critical"]
        idx = levels.index(base) if base in levels else 2
        base = levels[min(idx + 1, 4)]
    
    return base


def annotate_defects_pil(
    image: np.ndarray,
    defects: List[Dict[str, Any]],
    show_labels: bool = True,
    show_confidence: bool = True,
    opacity: float = 0.35,
) -> np.ndarray:
    """
    Draw defect annotations on image using PIL (works without cv2).
    
    Each defect dict should have:
      - bbox: [x1, y1, x2, y2]
      - type/class_name: str
      - severity: str (optional)
      - confidence: float (optional)
      - description: str (optional)
    
    Returns annotated image as numpy array.
    """
    pil_img = Image.fromarray(image.astype(np.uint8)).convert("RGBA")
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    h, w = image.shape[:2]
    
    # Try to load a font
    font_size = max(14, int(min(w, h) * 0.018))
    small_font_size = max(11, int(font_size * 0.75))
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
        small_font = ImageFont.truetype("arial.ttf", small_font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", small_font_size)
        except:
            font = ImageFont.load_default()
            small_font = font
    
    for i, defect in enumerate(defects):
        bbox = defect.get("bbox", defect.get("bounding_box", []))
        if not bbox or len(bbox) < 4:
            continue
        
        x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
        
        # Get defect info
        defect_type = defect.get("type", defect.get("class_name", defect.get("defect_type", "defect")))
        confidence = defect.get("confidence", defect.get("score", 0.0))
        
        # Calculate area ratio
        defect_area = (x2 - x1) * (y2 - y1)
        total_area = w * h
        area_ratio = defect_area / total_area if total_area > 0 else 0
        
        # Get severity
        severity = defect.get("severity", get_severity(defect_type, area_ratio))
        sev_info = SEVERITY_COLORS.get(severity, SEVERITY_COLORS["medium"])
        color = sev_info["rgb"]
        alpha = int(opacity * 255)
        
        # Draw semi-transparent filled rectangle
        draw.rectangle([x1, y1, x2, y2], fill=(*color, alpha), outline=(*color, 220), width=3)
        
        # Draw corner brackets for emphasis
        bracket_len = max(15, int(min(x2 - x1, y2 - y1) * 0.2))
        bw = 3
        for corner in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            cx, cy, dx, dy = corner
            draw.line([(cx, cy), (cx + dx * bracket_len, cy)], fill=(*color, 255), width=bw)
            draw.line([(cx, cy), (cx, cy + dy * bracket_len)], fill=(*color, 255), width=bw)
        
        if show_labels:
            # Build label text
            label_parts = [f"#{i+1} {defect_type}"]
            if show_confidence and confidence > 0:
                label_parts.append(f"{confidence*100:.0f}%")
            label = " ".join(label_parts)
            
            severity_label = sev_info["label"]
            desc = defect.get("description", "")
            
            # Calculate label background
            label_bbox = draw.textbbox((0, 0), label, font=font)
            lw = label_bbox[2] - label_bbox[0] + 16
            lh = label_bbox[3] - label_bbox[1] + 8
            
            sev_bbox = draw.textbbox((0, 0), severity_label, font=small_font)
            sw = sev_bbox[2] - sev_bbox[0] + 16
            sh = sev_bbox[3] - sev_bbox[1] + 6
            
            total_h = lh + sh + 4
            
            # Position label (above bbox, or inside if no room)
            lx = x1
            ly = y1 - total_h - 4
            if ly < 0:
                ly = y1 + 4
            
            # Main label background
            draw.rectangle([lx, ly, lx + max(lw, sw), ly + total_h], 
                         fill=(20, 20, 30, 210))
            
            # Main label text
            draw.text((lx + 8, ly + 4), label, fill=(*color, 255), font=font)
            
            # Severity badge
            badge_y = ly + lh + 2
            draw.rectangle([lx, badge_y, lx + sw, badge_y + sh],
                         fill=(*color, 40))
            draw.text((lx + 8, badge_y + 2), severity_label, fill=(*color, 255), font=small_font)
        
        # Draw severity indicator dot (pulsing effect via size)
        dot_radius = max(6, int(min(x2 - x1, y2 - y1) * 0.06))
        dot_x = x2 - dot_radius - 8
        dot_y = y1 + dot_radius + 8
        draw.ellipse([dot_x - dot_radius, dot_y - dot_radius, 
                      dot_x + dot_radius, dot_y + dot_radius],
                     fill=(*color, 200), outline=(255, 255, 255, 180), width=2)
    
    # Composite
    result = Image.alpha_composite(pil_img, overlay).convert("RGB")
    return np.array(result)


def create_defect_summary_image(
    image: np.ndarray,
    defects: List[Dict[str, Any]],
) -> np.ndarray:
    """
    Create a summary view: annotated image with a severity legend panel on the right.
    """
    annotated = annotate_defects_pil(image, defects)
    
    h, w = annotated.shape[:2]
    panel_w = max(280, int(w * 0.25))
    
    # Create panel
    panel = Image.new("RGB", (panel_w, h), (15, 22, 40))
    draw = ImageDraw.Draw(panel)
    
    try:
        font = ImageFont.truetype("arial.ttf", 16)
        small = ImageFont.truetype("arial.ttf", 13)
        title_font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
        small = font
        title_font = font
    
    y_pos = 20
    draw.text((15, y_pos), "DEFECT REPORT", fill=(255, 255, 255), font=title_font)
    y_pos += 35
    
    # Stats
    total = len(defects)
    critical = sum(1 for d in defects if get_severity(d.get("type", d.get("class_name", ""))) in ["critical", "high"])
    draw.text((15, y_pos), f"Found: {total} defects", fill=(200, 200, 200), font=font)
    y_pos += 25
    draw.text((15, y_pos), f"Critical: {critical}", fill=(255, 80, 80), font=font)
    y_pos += 35
    
    # Separator
    draw.line([(15, y_pos), (panel_w - 15, y_pos)], fill=(60, 70, 90), width=1)
    y_pos += 15
    
    # Legend
    draw.text((15, y_pos), "SEVERITY LEGEND", fill=(180, 180, 180), font=small)
    y_pos += 25
    
    for sev_key, sev_val in SEVERITY_COLORS.items():
        color = sev_val["rgb"]
        draw.rectangle([15, y_pos, 30, y_pos + 15], fill=color)
        draw.text((40, y_pos), f"{sev_val['label']}", fill=(200, 200, 200), font=small)
        y_pos += 25
    
    y_pos += 15
    draw.line([(15, y_pos), (panel_w - 15, y_pos)], fill=(60, 70, 90), width=1)
    y_pos += 15
    
    # Per-defect list
    draw.text((15, y_pos), "DEFECTS LIST", fill=(180, 180, 180), font=small)
    y_pos += 25
    
    for i, defect in enumerate(defects):
        if y_pos > h - 40:
            draw.text((15, y_pos), f"... +{len(defects) - i} more", fill=(150, 150, 150), font=small)
            break
        
        defect_type = defect.get("type", defect.get("class_name", "defect"))
        severity = defect.get("severity", get_severity(defect_type))
        sev_info = SEVERITY_COLORS.get(severity, SEVERITY_COLORS["medium"])
        
        # Defect number and dot
        draw.ellipse([15, y_pos + 2, 25, y_pos + 12], fill=sev_info["rgb"])
        draw.text((32, y_pos), f"#{i+1} {defect_type}", fill=(220, 220, 220), font=small)
        y_pos += 20
        
        conf = defect.get("confidence", 0)
        if conf > 0:
            draw.text((32, y_pos), f"  conf: {conf*100:.0f}%  {sev_info['label']}", 
                      fill=sev_info["rgb"], font=small)
            y_pos += 22
        y_pos += 5
    
    # Combine annotated image + panel
    panel_np = np.array(panel)
    combined = np.concatenate([annotated, panel_np], axis=1)
    
    return combined


def image_to_base64(image: np.ndarray, format: str = "JPEG", quality: int = 85) -> str:
    """Convert numpy image to base64 data URL."""
    import base64
    pil_img = Image.fromarray(image.astype(np.uint8))
    buffer = io.BytesIO()
    pil_img.save(buffer, format=format, quality=quality)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime = "image/jpeg" if format == "JPEG" else "image/png"
    return f"data:{mime};base64,{b64}"
