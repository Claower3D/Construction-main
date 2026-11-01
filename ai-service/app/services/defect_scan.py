"""
QazGost AI — оркестрация сканирования дефектов для POST /api/v1/defect-scan.

Порядок детекторов:
  1. YOLO — обученная модель (основной);
  2. Roboflow — только если YOLO недоступна и задан ROBOFLOW_API_KEY;
  3. CV-эвристика (cv_defect_scanner) — последний fallback.

Функция run_defect_scan() синхронная и тяжёлая — вызывать через run_in_threadpool.
"""

import base64
import io
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from loguru import logger
from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.services import defect_catalog as cat
from app.services.fonts import find_cyrillic_font

SEV_COLORS = {
    "critical": (235, 35, 35),
    "high": (245, 120, 20),
    "medium": (235, 190, 25),
    "low": (60, 200, 90),
}
SEV_LABELS_RU = {"critical": "КРИТИЧЕСКИЙ", "high": "ВЫСОКИЙ", "medium": "СРЕДНИЙ", "low": "НИЗКИЙ"}

NO_DEFECTS_FIX = "Дефекты не обнаружены — ремонт не требуется, рекомендуется плановый осмотр."


# ── threshold ──────────────────────────────────────────────────────────

def conf_from_sensitivity(sensitivity: float, base: Optional[float] = None) -> float:
    """
    Map request sensitivity (0.1…1.0) to a confidence threshold.

    0.5…0.65 (значения по умолчанию у фронта и API) → откалиброванный порог base (max F1);
    выше → линейно до 0.15 при 1.0 (больше находок, recall≈0.79);
    ниже → линейно до 0.80 при 0.1 (только уверенные находки).
    """
    if base is None:
        from app.services.yolo_defect_scanner import get_yolo_defect_detector
        base = get_yolo_defect_detector().conf_threshold
    s = float(min(1.0, max(0.1, sensitivity)))
    if 0.5 <= s <= 0.65:
        conf = base
    elif s > 0.65:
        conf = base + (0.15 - base) * (s - 0.65) / 0.35
    else:
        conf = base + (0.80 - base) * (0.5 - s) / 0.4
    return round(float(min(0.95, max(0.05, conf))), 3)


# ── drawing ────────────────────────────────────────────────────────────

def _font(size: int, bold: bool = False):
    path = find_cyrillic_font(bold=bold)
    if path:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def annotate(image_rgb: np.ndarray, items: List[Dict[str, Any]], bbox_key: str = "_bbox_proc") -> np.ndarray:
    """Draw boxes + Russian labels on the (processed) image."""
    pil = Image.fromarray(image_rgb).convert("RGBA")
    overlay = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = pil.size
    fsize = max(13, int(min(w, h) * 0.024))
    font, small = _font(fsize, bold=True), _font(max(11, int(fsize * 0.8)))

    if not items:
        msg = "Дефекты не обнаружены"
        tb = draw.textbbox((0, 0), msg, font=font)
        draw.rectangle([8, 8, 8 + tb[2] - tb[0] + 16, 8 + tb[3] - tb[1] + 12], fill=(10, 60, 30, 210))
        draw.text((16, 12), msg, fill=(170, 255, 190, 255), font=font)

    for d in items:
        x1, y1, x2, y2 = [int(round(v)) for v in d[bbox_key]]
        color = SEV_COLORS.get(d.get("severity", "medium"), SEV_COLORS["medium"])
        draw.rectangle([x1, y1, x2, y2], fill=(*color, 35), outline=(*color, 235), width=max(2, fsize // 6))
        label = f"#{d['id']} {d['type']}"
        sub = f"{d['confidence'] * 100:.0f}% · {SEV_LABELS_RU.get(d.get('severity'), '')}"
        lb, sb = draw.textbbox((0, 0), label, font=font), draw.textbbox((0, 0), sub, font=small)
        bw = max(lb[2] - lb[0], sb[2] - sb[0]) + 14
        bh = (lb[3] - lb[1]) + (sb[3] - sb[1]) + 14
        lx = max(0, min(w - bw, x1))
        ly = y1 - bh - 3 if y1 - bh - 3 >= 0 else min(h - bh, y2 + 3)
        draw.rectangle([lx, ly, lx + bw, ly + bh], fill=(8, 12, 25, 215), outline=(*color, 200), width=1)
        draw.text((lx + 7, ly + 3), label, fill=(*color, 255), font=font)
        draw.text((lx + 7, ly + 6 + lb[3] - lb[1]), sub, fill=(215, 222, 235, 235), font=small)

    return np.array(Image.alpha_composite(pil, overlay).convert("RGB"))


def to_data_url(image_rgb: np.ndarray, quality: int = 88) -> str:
    buf = io.BytesIO()
    Image.fromarray(image_rgb).save(buf, format="JPEG", quality=quality)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


# ── detectors ──────────────────────────────────────────────────────────

def _scale_box(b, sx: float, sy: float) -> List[int]:
    return [int(round(b[0] * sx)), int(round(b[1] * sy)), int(round(b[2] * sx)), int(round(b[3] * sy))]


def _from_external(raw: List[Dict[str, Any]], model: str, total_px: float, max_side: float = 0) -> List[Dict[str, Any]]:
    """Normalize Roboflow / CV items to the unified format (bbox still in processed pixels)."""
    out = []
    for d in raw:
        bbox = [float(v) for v in d.get("bbox", [0, 0, 0, 0])]
        cls = cat.normalize_class(d.get("defect_type") or d.get("type"))
        area_pct = float(d.get("area_percent") or ((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) / total_px * 100))
        conf = float(d.get("confidence", 0.5))
        item = {
            "class": cls,
            "class_raw": d.get("defect_type") or d.get("type"),
            "type": cat.class_ru(cls),
            "subtype": d.get("type"),
            "confidence": round(conf, 3),
            "bbox": bbox,
            "area_percent": round(area_pct, 2),
            # единое правило серьёзности для всех детекторов (см. defect_catalog.severity_for)
            "severity": cat.severity_for(
                cls, area_pct, conf,
                extent=(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) / max_side) if max_side else None,
            ),
            "model": model,
        }
        for k in ("polygon", "length_mm", "opening_mm", "orientation_deg", "analytics"):
            if d.get(k) is not None:
                item[k] = d[k]
        out.append(item)
    return out


def _run_yolo(image: np.ndarray, conf: float) -> Tuple[Optional[List[Dict[str, Any]]], Dict[str, Any], Optional[str]]:
    from app.services.yolo_defect_scanner import get_yolo_defect_detector

    det = get_yolo_defect_detector()
    if not det.available:
        return None, det.info(), det.error
    try:
        return det.detect(image, conf=conf), det.info(), None
    except Exception as exc:  # inference failure → fallback
        logger.exception(f"[DefectScan] YOLO inference failed: {exc}")
        return None, det.info(), f"inference failed: {exc}"


# ── main entry ─────────────────────────────────────────────────────────

def run_defect_scan(
    image: np.ndarray,
    orig_size: Tuple[int, int],
    sensitivity: float = 0.65,
    prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Args:
        image: RGB array (already downscaled to <= 1600 px on the long side)
        orig_size: (width, height) of the uploaded image — bbox are returned in these pixels
    """
    t0 = time.time()
    ph, pw = image.shape[:2]
    ow, oh = orig_size
    sx, sy = ow / pw, oh / ph
    total_px = float(pw * ph)
    warnings: List[str] = []
    conf = conf_from_sensitivity(sensitivity)  # base = calibrated threshold of the loaded model

    items: Optional[List[Dict[str, Any]]] = None
    extra: Dict[str, Any] = {}
    fallback = False

    # 1. YOLO
    items, yolo_info, yolo_err = _run_yolo(image, conf)
    detector: Dict[str, Any] = {
        "name": yolo_info["name"],               # реальная архитектура: YOLO26n / YOLOv8n
        "engine": "yolo",
        "model_file": yolo_info["model_file"],
        "classes": yolo_info["classes"],
        "validated_classes": yolo_info["validated_classes"],
        "conf_threshold": conf,
        "base_conf_threshold": yolo_info["conf_threshold"],
        "imgsz": yolo_info["imgsz"],
        "sensitivity": sensitivity,
    }
    if items is not None:
        not_validated = [c for c in yolo_info["classes"] if c not in yolo_info["validated_classes"]]
        if not_validated:
            detector["note"] = (
                "Обучающая разметка содержит только: " + ", ".join(yolo_info["validated_classes"])
                + ". Классы " + ", ".join(not_validated) + " моделью не валидированы."
            )

    # 2. Roboflow (only when YOLO is unavailable)
    if items is None:
        fallback = True
        warnings.append(f"Модель дефектов недоступна ({yolo_err}).")
        from app.models.roboflow_detector import get_roboflow_detector

        rf = get_roboflow_detector()
        if rf.is_configured():
            raw = rf.infer(image, confidence=conf, prompt=prompt)
            if raw:
                items = _from_external(raw, "roboflow", total_px, max(pw, ph))
                detector = {"name": "roboflow", "engine": "roboflow", "model_file": rf.model_id, "classes": [],
                            "conf_threshold": conf, "sensitivity": sensitivity}
                warnings.append("Использован внешний детектор Roboflow (изображение отправлено третьей стороне).")

    # 3. CV heuristic fallback
    if items is None:
        from app.services.cv_defect_scanner import scan_defects

        cv_res = scan_defects(image, sensitivity=sensitivity)
        items = _from_external(cv_res.get("defects", []), "cv", total_px, max(pw, ph))
        extra = {
            "stress_heatmap_image": cv_res.get("stress_heatmap_image"),
            "skeleton_image": cv_res.get("skeleton_image"),
            "structure_zones": cv_res.get("structure_zones", []),
        }
        detector = {"name": "cv-heuristic", "engine": "cv", "model_file": None, "classes": ["crack", "spalling"],
                    "conf_threshold": None, "sensitivity": sensitivity}
        warnings.append("Использован эвристический CV-сканер (без нейросети) — возможны ложные срабатывания.")

    # Order, ids, original-pixel bboxes
    items = cat.sort_defects(items)
    for i, d in enumerate(items, 1):
        d["id"] = i
        d["_bbox_proc"] = d["bbox"]
        d["bbox"] = _scale_box(d["bbox"], sx, sy)
        if d.get("polygon"):
            d["polygon"] = [[int(round(x * sx)), int(round(y * sy))] for x, y in d["polygon"]]
        d["description"] = (
            f"{d['type']}: уверенность {d['confidence'] * 100:.0f}%, "
            f"{d['area_percent']:.1f}% площади кадра ({d['model']})"
        )

    annotated = to_data_url(annotate(image, items))
    for d in items:
        d.pop("_bbox_proc", None)

    sev_counts: Dict[str, int] = {}
    by_class: Dict[str, int] = {}
    for d in items:
        sev_counts[d["severity"]] = sev_counts.get(d["severity"], 0) + 1
        by_class[d["class"]] = by_class.get(d["class"], 0) + 1
    max_sev = max(sev_counts, key=lambda s: cat.SEVERITY_RANK[s]) if sev_counts else "low"

    cost = cat.estimate_cost(items)
    if items:
        primary = items[0]
        defect_type = primary["type"]
        severity_text = cat.SEVERITY_TEXT_RU.get(primary["severity"], cat.SEVERITY_TEXT_RU["medium"])
        snip = cat.snip_code(primary["class"])
        fix = cat.fix_method(primary["class"])
    else:
        defect_type, severity_text, snip, fix = "Дефектов не обнаружено", "Норма", cat.GENERIC_SNIP, NO_DEFECTS_FIX

    response = {
        "success": True,
        "defectType": defect_type,
        "severity": severity_text,
        "snipCode": snip,
        "fixMethod": fix,
        "fixMethods": cat.fix_methods_by_class(items),
        "estimatedCost": cost["text"],
        "estimatedCostKzt": {"min": cost["min_kzt"], "max": cost["max_kzt"], "by_class": cost["by_class"]},
        "workDays": cat.work_days(items),
        "defect_annotated_image": annotated,
        "stress_heatmap_image": extra.get("stress_heatmap_image"),
        "skeleton_image": extra.get("skeleton_image"),
        "defect_severity_summary": {
            "total": len(items), "by_severity": sev_counts, "max_severity": max_sev, "by_class": by_class,
        },
        "structure_zones": extra.get("structure_zones", []),
        "defects": {"items": items, "total": len(items)},
        "detector": detector,
        "is_mock": False,
        "fallback": fallback,
        "warnings": warnings,
        "image": {"width": ow, "height": oh, "processed_width": pw, "processed_height": ph},
        "processing_time_ms": int((time.time() - t0) * 1000),
    }
    logger.info(
        f"[DefectScan] detector={detector['name']} conf={conf} found={len(items)} "
        f"max_severity={max_sev} in {response['processing_time_ms']}ms"
    )
    return _sanitize(response)


def _sanitize(o):
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, np.floating):
        return float(o)
    if isinstance(o, (np.ndarray, list, tuple)):
        return [_sanitize(x) for x in o]
    if isinstance(o, dict):
        return {k: _sanitize(v) for k, v in o.items()}
    return o
