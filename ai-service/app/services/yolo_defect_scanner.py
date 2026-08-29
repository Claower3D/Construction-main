"""
QazGost AI — YOLO-based Defect Scanner

Uses trained YOLOv8n model for accurate construction defect detection.
Falls back to CV heuristic scanner if model not available.

Model: models/defect_yolov8s_best.pt
Classes: crack, corrosion, spalling, efflorescence, damage, stain
"""

import io
import base64
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont
from loguru import logger


# Paths
MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "defect_yolov8s_best.pt"

# Class mapping (from training)
CLASS_NAMES_RU = {
    0: "Трещина",
    1: "Коррозия / ржавчина",
    2: "Отслоение / сколы",
    3: "Высолы",
    4: "Повреждение",
    5: "Пятно / протечка",
}

# Severity by class
CLASS_SEVERITY = {
    0: "critical",    # crack
    1: "high",        # corrosion
    2: "high",        # spalling
    3: "medium",      # efflorescence
    4: "critical",    # damage
    5: "low",         # stain
}

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

# Global model cache
_model = None
_model_loaded = False


def _load_model():
    """Load YOLO model (cached)."""
    global _model, _model_loaded
    
    if _model_loaded:
        return _model
    
    _model_loaded = True
    
    if not MODEL_PATH.exists():
        logger.warning(f"[YOLO Scanner] Model not found: {MODEL_PATH}")
        return None
    
    try:
        from ultralytics import YOLO
        _model = YOLO(str(MODEL_PATH))
        logger.info(f"[YOLO Scanner] Model loaded: {MODEL_PATH} ({MODEL_PATH.stat().st_size / 1024 / 1024:.1f} MB)")
        return _model
    except Exception as e:
        logger.error(f"[YOLO Scanner] Failed to load model: {e}")
        return None


def scan_defects_yolo(image: np.ndarray, confidence: float = 0.25) -> Optional[Dict[str, Any]]:
    """
    Scan image using trained YOLOv8 model.
    
    Returns None if model unavailable (caller should fall back to CV scanner).
    """
    model = _load_model()
    if model is None:
        return None
    
    h, w = image.shape[:2]
    total_area = h * w
    
    logger.info(f"[YOLO Scanner] Running inference on {w}x{h}, conf={confidence}")
    
    # Run inference
    results = model.predict(
        source=image,
        conf=confidence,
        iou=0.45,
        imgsz=640,
        verbose=False,
    )
    
    if not results or len(results) == 0:
        logger.info("[YOLO Scanner] No results returned")
        return None
    
    result = results[0]
    boxes = result.boxes
    
    if boxes is None or len(boxes) == 0:
        logger.info("[YOLO Scanner] No defects detected")
        return {
            "defects": [],
            "annotated_image": None,
            "severity_summary": {"total": 0, "by_severity": {}, "max_severity": "low"},
        }
    
    # Parse detections with smart filtering
    defects = []
    for i, box in enumerate(boxes):
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        
        bw, bh = x2 - x1, y2 - y1
        area = bw * bh
        area_pct = area / total_area * 100
        
        # --- FILTER 1: Reject too-large detections (>20% of image) ---
        if area_pct > 20:
            logger.debug(f"[YOLO] Rejected box {i}: too large ({area_pct:.1f}%)")
            continue
        
        # --- FILTER 2: Reject too-square for crack class (cracks are elongated) ---
        if cls_id == 0:  # crack
            aspect = max(bw, bh) / max(min(bw, bh), 1)
            if aspect < 1.5 and area_pct > 5:
                logger.debug(f"[YOLO] Rejected box {i}: square crack ({aspect:.1f} aspect, {area_pct:.1f}%)")
                continue
        
        # --- FILTER 3: Reject very dark regions (shadows/holes, not defects) ---
        roi = image[max(0,y1):min(h,y2), max(0,x1):min(w,x2)]
        if roi.size > 0:
            avg_brightness = roi.mean()
            if avg_brightness < 55:
                logger.debug(f"[YOLO] Rejected box {i}: too dark (avg={avg_brightness:.0f})")
                continue
        
        # --- FILTER 4: Reject single-dimension > 50% of image ---
        if bw > w * 0.5 or bh > h * 0.5:
            logger.debug(f"[YOLO] Rejected box {i}: spans >50% of dimension ({bw}x{bh})")
            continue
        
        defect_type = CLASS_NAMES_RU.get(cls_id, f"Дефект #{cls_id}")
        severity = CLASS_SEVERITY.get(cls_id, "medium")
        
        # Adjust severity by size
        if area_pct > 5 and severity == "medium":
            severity = "high"
        if area_pct > 10:
            severity = "critical"
        
        defects.append({
            "id": i + 1,
            "bbox": [x1, y1, x2, y2],
            "type": defect_type,
            "severity": severity,
            "confidence": round(conf, 2),
            "area_percent": round(area_pct, 1),
            "description": f"{defect_type} — область {x2-x1}×{y2-y1}px, {area_pct:.1f}% площади",
        })
    
    # Sort by confidence desc
    defects.sort(key=lambda d: d["confidence"], reverse=True)
    
    # Re-number
    for i, d in enumerate(defects):
        d["id"] = i + 1
    
    # Draw annotations
    annotated = _draw_annotations(image.copy(), defects)
    
    # Encode to base64
    pil_out = Image.fromarray(annotated)
    buf = io.BytesIO()
    pil_out.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode()
    annotated_b64 = f"data:image/jpeg;base64,{b64}"
    
    # Summary
    sev_counts = {}
    for d in defects:
        s = d["severity"]
        sev_counts[s] = sev_counts.get(s, 0) + 1
    
    sev_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    max_sev = max(sev_counts.keys(), key=lambda s: sev_order.get(s, 0)) if sev_counts else "low"
    
    logger.info(f"[YOLO Scanner] Found {len(defects)} defects, max_severity={max_sev}")
    
    return {
        "defects": defects,
        "annotated_image": annotated_b64,
        "severity_summary": {
            "total": len(defects),
            "by_severity": sev_counts,
            "max_severity": max_sev,
        },
    }


def _draw_annotations(image: np.ndarray, defects: list) -> np.ndarray:
    """Draw YOLOv8-style annotations."""
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
        color = SEV_COLORS.get(sev, (255, 190, 0))
        conf = d["confidence"]
        
        # Semi-transparent fill + solid border
        draw.rectangle([x1, y1, x2, y2], fill=(*color, 30), outline=(*color, 220), width=2)
        
        # Corner brackets
        blen = max(10, int(min(x2 - x1, y2 - y1) * 0.12))
        for cx, cy, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
            draw.line([(cx, cy), (cx + dx * blen, cy)], fill=(*color, 255), width=3)
            draw.line([(cx, cy), (cx, cy + dy * blen)], fill=(*color, 255), width=3)
        
        # Label
        label = f"#{d['id']} {d['type']}"
        sev_text = f"{conf*100:.0f}% | {SEV_LABELS_RU.get(sev, sev)}"
        
        lb = draw.textbbox((0, 0), label, font=font)
        lw = lb[2] - lb[0] + 14
        lh = lb[3] - lb[1] + 6
        
        sb = draw.textbbox((0, 0), sev_text, font=small_font)
        sw_text = sb[2] - sb[0] + 14
        sh_text = sb[3] - sb[1] + 4
        
        total_h = lh + sh_text + 2
        box_w = max(lw, sw_text)
        
        lx = x1
        ly = y1 - total_h - 4
        if ly < 2:
            ly = y1 + 4
        
        draw.rectangle([lx, ly, lx + box_w, ly + total_h],
                       fill=(8, 12, 25, 220), outline=(*color, 180), width=1)
        
        draw.text((lx + 7, ly + 2), label, fill=(*color, 255), font=font)
        draw.text((lx + 7, ly + lh), sev_text, fill=(200, 210, 230, 220), font=small_font)
    
    result = Image.alpha_composite(pil_img, overlay).convert("RGB")
    return np.array(result)
