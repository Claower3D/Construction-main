"""
QazGost AI - Neural Network Defect Detector (v2.0 SOTA YOLO11-seg Support)

Trained segmentation model for detecting 14 types of construction defects.
Uses Ultralytics YOLO11-seg engine with custom-trained weights.

Falls back to OpenCV-based DefectAnalyzer if trained weights are not available.

Classes (14 defect categories):
  0: crack_hairline     — Волосяная трещина (< 0.3 мм)
  1: crack_structural   — Конструктивная трещина (> 1 мм, опасная)
  2: crack_shrinkage    — Усадочная трещина (сетчатые, паутина)
  3: crack_longitudinal — Продольная сквозная трещина (по телу конструкции)
  4: spalling           — Скол / отслоение бетона / штукатурки
  5: spalling_edge      — Скол кромки / разрушение фальца
  6: water_stain        — Влажное пятно / протечка
  7: mold               — Плесень / грибок
  8: efflorescence      — Высол (белый налёт на кирпиче/бетоне)
  9: rust_surface       — Поверхностная коррозия
 10: rust_deep          — Глубокая коррозия / коррозия арматуры
 11: rebar_exposed      — Оголённая арматура
 12: delamination       — Расслоение бетона
 13: honeycombing       — Раковины и каверны в бетоне
"""

import threading
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_SEG_AVAILABLE = True
except ImportError:
    YOLO_SEG_AVAILABLE = False
    logger.warning("ultralytics not installed. DefectNNDetector will use fallback mode.")

from app.config import settings


# ─────────────────────────────────────────────
# СНиП/СП mapping for 14 defect classes
# ─────────────────────────────────────────────

DEFECT_CLASSES = [
    "crack_hairline", "crack_structural", "crack_shrinkage", "crack_longitudinal",
    "spalling", "spalling_edge", "water_stain", "mold",
    "efflorescence", "rust_surface", "rust_deep", "rebar_exposed",
    "delamination", "honeycombing",
]

SNIP_MAPPING: Dict[str, Dict[str, Any]] = {
    "crack_hairline": {
        "snip_code": "СП 63.13330.2018 п.8.2",
        "severity": "low",
        "risk_class": "1 класс — Допустимый",
        "fix_method": "Герметизация полимерным составом, шпаклёвка финишная",
        "cost_per_m2": 3500,  # ₸ за м²
        "timeline_days": 1,
    },
    "crack_structural": {
        "snip_code": "СП 63.13330.2018 п.8.5, СНиП РК 5.03-37",
        "severity": "high",
        "risk_class": "4 класс — Аварийный",
        "fix_method": "Инъектирование эпоксидной смолой, усиление углепластиком (CFRP), контроль маяками",
        "cost_per_m2": 18000,
        "timeline_days": 5,
    },
    "crack_shrinkage": {
        "snip_code": "СП 63.13330.2018 п.8.3",
        "severity": "low",
        "risk_class": "2 класс — Допустимый",
        "fix_method": "Расшивка, грунтовка, армированная шпаклёвка",
        "cost_per_m2": 4500,
        "timeline_days": 2,
    },
    "crack_longitudinal": {
        "snip_code": "СП 63.13330.2018 п.8.4, ГОСТ 8020-2016",
        "severity": "high",
        "risk_class": "4 класс — Аварийный",
        "fix_method": "Глубокая расшивка шва, инъектирование полиуретановым компаундом, бандажирование",
        "cost_per_m2": 15000,
        "timeline_days": 4,
    },
    "spalling": {
        "snip_code": "СП 28.13330.2017 п.5.6",
        "severity": "medium",
        "risk_class": "3 класс — Требует устранения",
        "fix_method": "Удаление отслоившегося слоя, грунтовка, ремонтный состав, выравнивание",
        "cost_per_m2": 7500,
        "timeline_days": 3,
    },
    "spalling_edge": {
        "snip_code": "СП 28.13330.2017 п.5.7, ГОСТ 8020-2016",
        "severity": "medium",
        "risk_class": "3 класс — Требует устранения",
        "fix_method": "Опалубочное восстановление фальца высокопрочным безусадочным тиксотропным составом",
        "cost_per_m2": 6500,
        "timeline_days": 2,
    },
    "water_stain": {
        "snip_code": "СП 71.13330.2017, СанПиН 2.1.2.2645",
        "severity": "medium",
        "risk_class": "3 класс — Требует устранения",
        "fix_method": "Найти и устранить источник протечки, просушка, гидроизоляция, восстановление отделки",
        "cost_per_m2": 12000,
        "timeline_days": 4,
    },
    "mold": {
        "snip_code": "СанПиН 2.1.2.2645-10, СП 50.13330.2012",
        "severity": "high",
        "risk_class": "4 класс — Аварийный (здоровье)",
        "fix_method": "Фунгицидная обработка, удаление поражённого слоя, антисептик, гидроизоляция, вентиляция",
        "cost_per_m2": 9500,
        "timeline_days": 3,
    },
    "efflorescence": {
        "snip_code": "СП 15.13330.2020",
        "severity": "low",
        "risk_class": "2 класс — Косметический",
        "fix_method": "Обработка кислотным очистителем, гидрофобизация поверхности",
        "cost_per_m2": 2500,
        "timeline_days": 1,
    },
    "rust_surface": {
        "snip_code": "СП 28.13330.2017 п.5.2",
        "severity": "medium",
        "risk_class": "3 класс — Требует устранения",
        "fix_method": "Механическая очистка (пескоструй), преобразователь ржавчины, антикоррозийное покрытие",
        "cost_per_m2": 8500,
        "timeline_days": 2,
    },
    "rust_deep": {
        "snip_code": "СП 28.13330.2017 п.5.4, СНиП РК 5.03-37",
        "severity": "high",
        "risk_class": "4 класс — Аварийный",
        "fix_method": "Вскрытие защитного слоя, пескоструй арматуры, обработка ингибитором, восстановление сечения, торкретирование",
        "cost_per_m2": 25000,
        "timeline_days": 7,
    },
    "rebar_exposed": {
        "snip_code": "СП 63.13330.2018 п.10.3",
        "severity": "high",
        "risk_class": "4 класс — Аварийный",
        "fix_method": "Антикоррозийная обработка, восстановление защитного слоя бетона, торкретирование",
        "cost_per_m2": 22000,
        "timeline_days": 5,
    },
    "delamination": {
        "snip_code": "СП 28.13330.2017 п.5.8",
        "severity": "high",
        "risk_class": "3 класс — Требует устранения",
        "fix_method": "Удаление отслоившегося бетона до плотного основания, нанесение адгезионного слоя, восстановление ремонтным бетоном",
        "cost_per_m2": 14000,
        "timeline_days": 4,
    },
    "honeycombing": {
        "snip_code": "СП 63.13330.2018 п.8.6",
        "severity": "medium",
        "risk_class": "2 класс — Дефект бетонирования",
        "fix_method": "Очистка каверн от непрочного бетона, промывка водой под давлением, зачеканка мелкозернистым безусадочным составом",
        "cost_per_m2": 8000,
        "timeline_days": 2,
    },
}


# ─────────────────────────────────────────────
# DefectNNDetector — main class
# ─────────────────────────────────────────────

class DefectNNDetector:
    """
    QazGost AI neural network defect detector.

    Loads custom-trained YOLO11-seg segmentation model for 14 defect classes.
    Returns list of defect regions with masks, severity, SNiP codes, and repair costs.
    
    Falls back to OpenCV DefectAnalyzer if weights not found.
    """

    _instance = None
    _lock = threading.Lock()

    WEIGHTS_FILE_V2 = "qazgost_defects_v2.pt"  # YOLO11-seg model
    WEIGHTS_FILE_V1 = "qazgost_defects_v1.pt"  # YOLOv8-seg fallback

    @classmethod
    def get(cls) -> "DefectNNDetector":
        """Get singleton instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.model_version = None
        self.device = settings.get_device()
        self._load_model()

    def _load_model(self):
        """Load QazGost AI defect segmentation model (YOLO11-seg or YOLOv8-seg)."""
        if not YOLO_SEG_AVAILABLE:
            logger.warning("[DefectNN] Ultralytics not available — fallback mode")
            return

        # Check v2 weights first, then v1
        for w_file, ver in [(self.WEIGHTS_FILE_V2, "v2 (YOLO11-seg)"), (self.WEIGHTS_FILE_V1, "v1 (YOLOv8-seg)")]:
            weights_path = settings.get_model_path(w_file)
            if weights_path.exists():
                try:
                    self.model = YOLO(str(weights_path))
                    self.model.to(self.device)
                    self.model_loaded = True
                    self.model_version = ver
                    logger.success(f"[DefectNN] ✅ QazGost AI defect model {ver} loaded: {weights_path} on {self.device}")
                    return
                except Exception as e:
                    logger.error(f"[DefectNN] Failed to load {weights_path}: {e}")

        logger.warning(f"[DefectNN] No trained weights found in models/ — using OpenCV multi-scale pipeline")

    def detect(
        self,
        image: np.ndarray,
        confidence: float = 0.25,
        iou: float = 0.45,
    ) -> List[Dict[str, Any]]:
        """
        Detect defects in construction photo.

        Args:
            image: BGR numpy array (OpenCV format)
            confidence: min confidence threshold
            iou: NMS IoU threshold

        Returns:
            List of defect dicts with keys:
              - defect_type: str (e.g. "crack_structural")
              - confidence: float
              - severity: str ("low"/"medium"/"high")
              - risk_class: str
              - snip_code: str
              - fix_method: str
              - bbox: [x1, y1, x2, y2]
              - mask: np.ndarray (binary mask, same size as image)
              - area_px: float (defect area in pixels)
              - cost_per_m2: float (repair cost in ₸)
              - timeline_days: int
        """
        if not self.model_loaded:
            return self._fallback_detect(image)

        try:
            results = self.model.predict(
                image,
                conf=confidence,
                iou=iou,
                verbose=False,
                retina_masks=True,
            )

            defects = []
            for result in results:
                if result.masks is None:
                    continue

                for i, box in enumerate(result.boxes):
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    cls_name = DEFECT_CLASSES[cls_id] if cls_id < len(DEFECT_CLASSES) else f"unknown_{cls_id}"

                    # Get bounding box
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

                    # Get segmentation mask
                    mask = result.masks.data[i].cpu().numpy()
                    # Resize mask to original image size
                    if mask.shape[:2] != image.shape[:2]:
                        import cv2
                        mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
                    mask = (mask > 0.5).astype(np.uint8)

                    area_px = float(np.sum(mask))

                    # Get SNiP mapping
                    snip = SNIP_MAPPING.get(cls_name, {})

                    defects.append({
                        "defect_type": cls_name,
                        "confidence": round(conf, 3),
                        "severity": snip.get("severity", "medium"),
                        "risk_class": snip.get("risk_class", "Требует осмотра"),
                        "snip_code": snip.get("snip_code", ""),
                        "fix_method": snip.get("fix_method", "Требуется экспертиза"),
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "mask": mask,
                        "area_px": area_px,
                        "cost_per_m2": snip.get("cost_per_m2", 10000),
                        "timeline_days": snip.get("timeline_days", 3),
                    })

            # Sort by severity (high first)
            severity_order = {"high": 0, "medium": 1, "low": 2}
            defects.sort(key=lambda d: severity_order.get(d["severity"], 1))

            logger.info(f"[DefectNN] Found {len(defects)} defects (confidence >= {confidence})")
            return defects

        except Exception as e:
            logger.error(f"[DefectNN] Inference error: {e}")
            return self._fallback_detect(image)

    def _fallback_detect(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Fallback to OpenCV multi-scale defect detection."""
        try:
            from app.models.defect_detector import get_defect_analyzer
            analyzer = get_defect_analyzer()
            report = analyzer.analyze(image)
            raw_items = report.get("defects", [])

            defects = []
            for item in raw_items:
                cls_name = item.get("defect_type", "crack")
                sev = item.get("severity", "medium")
                desc = item.get("description", "")
                
                # Map simple class name to specific defect class
                if cls_name == "crack":
                    cls_name = "crack_structural" if sev == "high" else "crack_hairline"
                elif cls_name == "spall" or cls_name == "spalling":
                    cls_name = "spalling_edge" if "кромк" in desc.lower() or "фальц" in desc.lower() else "spalling"
                
                snip = SNIP_MAPPING.get(cls_name, SNIP_MAPPING.get("crack_hairline", {}))
                defects.append({
                    "defect_type": cls_name,
                    "confidence": item.get("confidence", 0.8),
                    "severity": sev,
                    "risk_class": snip.get("risk_class", "Требует осмотра"),
                    "snip_code": snip.get("snip_code", ""),
                    "fix_method": snip.get("fix_method", ""),
                    "bbox": item.get("bbox", [0, 0, 1, 1]),
                    "mask": item.get("mask"),
                    "area_px": item.get("area_px", 0.0),
                    "cost_per_m2": snip.get("cost_per_m2", 10000),
                    "timeline_days": snip.get("timeline_days", 3),
                })
            return defects
        except Exception as e:
            logger.error(f"[DefectNN] Fallback also failed: {e}")
            return []

    @property
    def is_nn_mode(self) -> bool:
        """Check if neural network model is loaded (vs OpenCV fallback)."""
        return self.model_loaded


# ─────────────────────────────────────────────
# Singleton accessor
# ─────────────────────────────────────────────

def get_defect_nn() -> DefectNNDetector:
    """Get singleton DefectNNDetector instance."""
    return DefectNNDetector.get()
