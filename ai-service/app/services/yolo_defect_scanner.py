"""
QazGost AI — детектор дефектов на обученной YOLO-модели (Ultralytics YOLO26 / YOLOv8).

Выбор весов (первый существующий и успешно загруженный):
  env DEFECT_MODEL_PATH (путь или список через запятую)  →  иначе settings.DEFECT_MODEL_CANDIDATES:
    models/defect_yolo26_best.pt, models/defect_yolov8s_best.pt
Если ни одни веса не загрузились — /defect-scan уходит в fallback (Roboflow → CV).

Метаданные модели (<веса>.meta.json, пишет scripts/eval_defects.py --write-meta):
  метрики на val и откалиброванный порог conf (max F1). DEFECT_CONF_THRESHOLD из env имеет приоритет.

ВАЖНО: разметка dataset/merged содержит только класс 0 (crack). Остальные 5 классов
(corrosion, spalling, efflorescence, damage, stain) есть в голове модели, но не обучены/не валидированы.

Модель грузится один раз, лениво, потокобезопасно. Инференс синхронный — вызывать из threadpool.
"""

import json
import re
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from loguru import logger

from app.config import settings, BASE_DIR
from app.services.defect_catalog import class_ru, normalize_class, severity_for

DEFAULT_CLASSES = ["crack", "corrosion", "spalling", "efflorescence", "damage", "stain"]
FALLBACK_CONF = 0.25


def _resolve(p: str) -> Path:
    path = Path(p.strip())
    return path if path.is_absolute() else (BASE_DIR / path).resolve()


def meta_path(weights: Path) -> Path:
    return weights.with_suffix(".meta.json")


def _read_meta(weights: Path) -> Dict[str, Any]:
    try:
        mp = meta_path(weights)
        return json.loads(mp.read_text(encoding="utf-8")) if mp.is_file() else {}
    except Exception:
        return {}


def model_candidates() -> List[Path]:
    """
    Ordered list of weights to try.

    DEFECT_MODEL_PATH задан → ровно этот порядок (явный выбор).
    Иначе DEFECT_MODEL_CANDIDATES (YOLO26 первым); при DEFECT_MODEL_SELECT=best_map существующие файлы
    сортируются по mAP50-95 из <веса>.meta.json (по убыванию; без meta — после, в порядке списка).
    """
    raw = settings.DEFECT_MODEL_PATH
    if raw:
        return [_resolve(x) for x in raw.split(",") if x.strip()]
    paths = [_resolve(x) for x in settings.DEFECT_MODEL_CANDIDATES]
    if (settings.DEFECT_MODEL_SELECT or "").lower() == "best_map":
        order = {p: i for i, p in enumerate(paths)}
        score = {p: float(_read_meta(p).get("mAP50-95", -1)) if p.is_file() else -2.0 for p in paths}
        paths = sorted(paths, key=lambda p: (-score[p], order[p]))
    return paths


def arch_name(ckpt: Dict[str, Any], model=None) -> str:
    """Human-readable architecture (YOLO26n / YOLOv8n / …) taken from the checkpoint, not the file name."""
    cand = []
    yaml = getattr(getattr(model, "model", None), "yaml", None)
    if isinstance(yaml, dict) and yaml.get("yaml_file"):
        cand.append(str(yaml["yaml_file"]))
    ta = (ckpt or {}).get("train_args") or {}
    if ta.get("model"):
        cand.append(str(ta["model"]))
    for c in cand:
        m = re.search(r"yolo(v?\d+)([nslmx])?", Path(c).stem.lower())
        if m:
            return f"YOLO{m.group(1)}{m.group(2) or ''}"
    return "YOLO"


class YoloDefectDetector:
    """Lazy, thread-safe singleton wrapper around the trained ultralytics model."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._infer_lock = threading.Lock()
        self._model = None
        self._tried = False
        self.error: Optional[str] = None
        self.candidates = model_candidates()
        self.model_path: Optional[Path] = None
        self.names: Dict[int, str] = {}
        self.arch: Optional[str] = None
        self.n_params: Optional[int] = None
        self.train_imgsz: Optional[int] = None
        self.meta: Dict[str, Any] = {}
        self.load_time_s: Optional[float] = None

    # ── loading ─────────────────────────────────────────────────
    def _load(self) -> None:
        if self._tried:
            return
        with self._lock:
            if self._tried:
                return
            self._tried = True
            try:
                from ultralytics import YOLO
            except Exception as exc:  # ultralytics/torch not installed
                self.error = f"ultralytics unavailable: {exc}"
                logger.warning(f"[DefectYOLO] ultralytics недоступен ({exc}) — будет использован fallback")
                return
            errors = []
            for path in self.candidates:
                if not path.is_file():
                    errors.append(f"{path.name}: not found")
                    continue
                try:
                    t0 = time.time()
                    model = YOLO(str(path))
                    ckpt = getattr(model, "ckpt", None) or {}
                    ta = ckpt.get("train_args") or {}
                    self.names = {int(k): str(v) for k, v in model.names.items()}
                    self.arch = arch_name(ckpt, model)
                    self.n_params = int(sum(p.numel() for p in model.model.parameters()))
                    self.train_imgsz = int(ta.get("imgsz") or 640)
                    self.meta = _read_meta(path)
                    # warm-up: first call builds/fuses the graph
                    model.predict(np.zeros((64, 64, 3), dtype=np.uint8), imgsz=self.imgsz, conf=0.9, verbose=False)
                    self._model, self.model_path = model, path
                    self.load_time_s = round(time.time() - t0, 2)
                    self.error = None
                    logger.info(
                        f"[DefectYOLO] ✅ {self.arch} загружена: {path.name} "
                        f"({path.stat().st_size / 1024 / 1024:.1f} MB, {self.n_params / 1e6:.1f}M params) "
                        f"за {self.load_time_s}s; imgsz={self.imgsz}, conf={self.conf_threshold:.3f}, "
                        f"классы={list(self.names.values())}"
                    )
                    return
                except Exception as exc:
                    errors.append(f"{path.name}: {exc}")
                    logger.error(f"[DefectYOLO] Не удалось загрузить {path}: {exc}")
            self.error = "; ".join(errors) or "no candidates"
            logger.warning(f"[DefectYOLO] Модель дефектов недоступна ({self.error}) — будет использован fallback")

    @property
    def available(self) -> bool:
        self._load()
        return self._model is not None

    @property
    def conf_threshold(self) -> float:
        if settings.DEFECT_CONF_THRESHOLD is not None:
            return float(settings.DEFECT_CONF_THRESHOLD)
        return float(self.meta.get("best_conf_by_f1") or FALLBACK_CONF)

    @property
    def imgsz(self) -> int:
        return int(settings.DEFECT_IMGSZ or self.train_imgsz or 640)

    @property
    def validated_classes(self) -> List[str]:
        counts = self.meta.get("val_label_class_counts") or {}
        return sorted(counts) if counts else ["crack"]

    def info(self, load: bool = False) -> Dict[str, Any]:
        """Detector metadata (does not force model loading unless load=True)."""
        if load:
            self._load()
        return {
            "name": self.arch or "YOLO",
            "engine": "ultralytics",
            "model_file": self.model_path.name if self.model_path else None,
            "candidates": [p.name for p in self.candidates],
            "selection": "explicit (DEFECT_MODEL_PATH)" if settings.DEFECT_MODEL_PATH else settings.DEFECT_MODEL_SELECT,
            "loaded": self._model is not None,
            "error": self.error,
            "params": self.n_params,
            "classes": list(self.names.values()) if self.names else DEFAULT_CLASSES,
            "validated_classes": self.validated_classes,
            "conf_threshold": round(self.conf_threshold, 3),
            "imgsz": self.imgsz,
            "validation": {k: self.meta[k] for k in ("P", "R", "mAP50", "mAP50-95", "best_f1", "best_conf_by_f1",
                                                     "val_images", "speed_ms_per_img") if k in self.meta} or None,
            "load_time_s": self.load_time_s,
        }

    # ── inference ───────────────────────────────────────────────
    def detect(self, image_rgb: np.ndarray, conf: float) -> List[Dict[str, Any]]:
        """
        Run the model on an RGB image. Returns items with bbox in THIS image's pixels.
        Raises RuntimeError if the model is unavailable.
        """
        if not self.available:
            raise RuntimeError(self.error or "defect model unavailable")
        h, w = image_rgb.shape[:2]
        total = float(h * w)
        validated = set(self.validated_classes)
        # ultralytics трактует numpy-массив как BGR (конвенция OpenCV)
        image_bgr = np.ascontiguousarray(image_rgb[:, :, ::-1])
        with self._infer_lock:
            results = self._model.predict(
                source=image_bgr, conf=conf, iou=settings.DEFECT_IOU, imgsz=self.imgsz,
                verbose=False, max_det=100,
            )
        items: List[Dict[str, Any]] = []
        if not results or results[0].boxes is None or len(results[0].boxes) == 0:
            return items
        boxes = results[0].boxes
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        clss = boxes.cls.cpu().numpy().astype(int)
        for (x1, y1, x2, y2), c, k in zip(xyxy, confs, clss):
            x1, y1 = max(0.0, float(x1)), max(0.0, float(y1))
            x2, y2 = min(float(w), float(x2)), min(float(h), float(y2))
            if x2 <= x1 or y2 <= y1:
                continue
            en = self.names.get(int(k), str(k))
            cls = normalize_class(en)
            area_pct = (x2 - x1) * (y2 - y1) / total * 100.0
            extent = max(x2 - x1, y2 - y1) / float(max(w, h))
            items.append({
                "class": cls,
                "class_raw": en,
                "type": class_ru(cls),
                "confidence": round(float(c), 3),
                "bbox": [x1, y1, x2, y2],
                "area_percent": round(area_pct, 2),
                "extent": round(extent, 3),
                "severity": severity_for(cls, area_pct, float(c), extent=extent),
                "model": "yolo",
                "validated_class": cls in validated,
            })
        return items


_detector: Optional[YoloDefectDetector] = None
_detector_lock = threading.Lock()


def get_yolo_defect_detector() -> YoloDefectDetector:
    global _detector
    if _detector is None:
        with _detector_lock:
            if _detector is None:
                _detector = YoloDefectDetector()
    return _detector


def reset_yolo_defect_detector() -> None:
    """Drop the singleton (tests / switching DEFECT_MODEL_PATH at runtime)."""
    global _detector
    with _detector_lock:
        _detector = None


def scan_defects_yolo(image: np.ndarray, confidence: float = None) -> Optional[Dict[str, Any]]:
    """Backward-compatible helper: returns {'defects': [...]} or None if the model is unavailable."""
    det = get_yolo_defect_detector()
    if not det.available:
        return None
    items = det.detect(image, conf=confidence or det.conf_threshold)
    return {"defects": items}
