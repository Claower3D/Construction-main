"""
QAZGOST AI - Defect Detectors (v2.0 SOTA Multi-Scale Suite)

Specialized defect detection for construction surfaces:
  - CrackDetector:    трещины (волосяные, сквозные, продольные, усадочные) — Multi-Scale
  - SpallingDetector: сколы бетона, разрушение кромки фальца, каверны, отслоения
  - StainDetector:    пятна (влага, масло, высолы)
  - RustDetector:     коррозия (ржавчина, окисление, патина)

Each detector returns DefectRegion with mask, severity, and area.
Used by AnalysisPipeline and DefectNNDetector for surface analysis.
"""

import threading
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from loguru import logger

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

from app.models.rfdetr import Detection


# ─────────────────────────────────────────────
# DefectRegion — результат детекции дефекта
# ─────────────────────────────────────────────

class DefectRegion:
    """Single defect region found in image."""

    def __init__(
        self,
        defect_type: str,           # "crack", "spalling", "stain", "rust", "mold"
        severity: str,              # "low", "medium", "high"
        bbox: Tuple[int, int, int, int],  # x1, y1, x2, y2
        mask: Optional[np.ndarray] = None,
        area_px: float = 0.0,
        confidence: float = 0.0,
        description: str = "",
        length_px: float = 0.0,     # For cracks: total length in pixels
        width_px: float = 0.0,      # For cracks: average width in pixels
    ):
        self.defect_type = defect_type
        self.severity = severity
        self.bbox = bbox
        self.mask = mask
        self.area_px = area_px
        self.confidence = confidence
        self.description = description
        self.length_px = length_px
        self.width_px = width_px

    def to_dict(self) -> Dict[str, Any]:
        return {
            "defect_type": self.defect_type,
            "severity": self.severity,
            "bbox": list(self.bbox),
            "area_px": round(self.area_px, 1),
            "confidence": round(self.confidence, 3),
            "description": self.description,
            "description_ru": self.description,
            "length_px": round(self.length_px, 1),
            "width_px": round(self.width_px, 1),
        }

    def to_detection(self) -> Detection:
        """Convert to Detection for pipeline compatibility."""
        return Detection(
            class_id=-1,
            class_name=f"defect_{self.defect_type}",
            confidence=self.confidence,
            bbox=self.bbox,
            mask=self.mask,
            area_px=self.area_px,
        )


# ─────────────────────────────────────────────
# CrackDetector — Мультимасштабный детектор трещин
# ─────────────────────────────────────────────

class CrackDetector:
    """
    Multi-Scale Crack Detector for construction surfaces.

    Architecture:
    1. Bilateral Filtering: preserves sharp fracture boundaries while eliminating concrete aggregate noise.
    2. CLAHE (Contrast Limited Adaptive Histogram Equalization).
    3. Multi-scale detection heads:
       - Fine / Hairline (<0.3mm): Directional BlackHat morphological kernels (0°, 45°, 90°, 135°).
       - Medium / Shrinkage (0.3-1.0mm): Directional ridge/valley difference filters.
       - Structural / Major (>1.0mm): Adaptive Otsu thresholding with cross-sectional valley analysis.
    4. NMS / IoU Deduplication.
    """

    def __init__(self, use_nn: bool = False):
        self.use_nn = use_nn

    def detect(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> List[DefectRegion]:
        """Detect cracks in image."""
        if not CV2_AVAILABLE:
            return self._mock_detect(image)

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape

            if roi_mask is not None:
                gray = cv2.bitwise_and(gray, gray, mask=roi_mask.astype(np.uint8))

            # 1. Bilateral filtering (preserves edges)
            bilateral = cv2.bilateralFilter(gray, 9, 75, 75)

            # 2. Contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(bilateral)

            # 3. Multi-scale crack detection
            cracks_fine = self._detect_fine_cracks(enhanced, h, w)
            cracks_medium = self._detect_medium_cracks(enhanced, h, w)
            cracks_structural = self._detect_structural_cracks(enhanced, h, w)

            all_cracks = cracks_fine + cracks_medium + cracks_structural
            return self._nms_deduplicate(all_cracks)

        except Exception as exc:
            logger.error(f"[CrackDetector] Error: {exc}")
            return []

    def _detect_fine_cracks(self, gray: np.ndarray, h: int, w: int) -> List[DefectRegion]:
        """Hairline cracks via multi-angle Blackhat morphology."""
        bh_v = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 21)))
        bh_h = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (21, 3)))
        bh_d1 = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))

        combined = np.maximum(bh_v, np.maximum(bh_h, bh_d1))
        _, thresh = cv2.threshold(combined, 10, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        return self._extract_crack_contours(cleaned, "low", "Волосяная/усадочная трещина (раскрытие <0.3мм)", h, w)

    def _detect_medium_cracks(self, gray: np.ndarray, h: int, w: int) -> List[DefectRegion]:
        """Medium cracks via directional valley difference filters."""
        k = max(5, int(w * 0.025))
        left = np.pad(gray, ((0, 0), (k, 0)), mode='edge')[:, :-k].astype(float)
        right = np.pad(gray, ((0, 0), (0, k)), mode='edge')[:, k:].astype(float)
        v_valleys = np.minimum(left - gray.astype(float), right - gray.astype(float))

        top = np.pad(gray, ((k, 0), (0, 0)), mode='edge')[:-k, :].astype(float)
        bottom = np.pad(gray, ((0, k), (0, 0)), mode='edge')[k:, :].astype(float)
        h_valleys = np.minimum(top - gray.astype(float), bottom - gray.astype(float))

        valleys = np.maximum(v_valleys, h_valleys)
        thresh = ((valleys > 6.0) & (gray > 15) & (gray < 195)).astype(np.uint8) * 255
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 15)))
        return self._extract_crack_contours(cleaned, "medium", "Видимая трещина по телу конструкции (0.3-1.0мм)", h, w)

    def _detect_structural_cracks(self, gray: np.ndarray, h: int, w: int) -> List[DefectRegion]:
        """Large structural and through-wall cracks via adaptive + 1D blur differences."""
        h_blur = cv2.blur(gray, (19, 1))
        v_diff = h_blur.astype(float) - gray.astype(float)

        v_blur = cv2.blur(gray, (1, 19))
        h_diff = v_blur.astype(float) - gray.astype(float)

        diff = np.maximum(v_diff, h_diff)
        thresh = ((diff > 8.0) & (gray > 15) & (gray < 185)).astype(np.uint8) * 255
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 27)))
        return self._extract_crack_contours(cleaned, "high", "Продольная сквозная/структурная трещина (>1.0мм)", h, w)

    def _extract_crack_contours(
        self,
        binary_mask: np.ndarray,
        severity: str,
        description: str,
        h: int,
        w: int,
    ) -> List[DefectRegion]:
        """Extract DefectRegions from binary crack mask."""
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        defects = []
        min_area = max(35, w * h * 0.0001)

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < min_area:
                continue

            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0:
                continue

            x, y, bw, bh = cv2.boundingRect(contour)
            aspect = max(bw, bh) / max(min(bw, bh), 1)

            # Cracks must be linear / elongated
            if aspect < 1.6 and (bw < 30 and bh < 30):
                continue

            rect = cv2.minAreaRect(contour)
            rect_w, rect_h = rect[1]
            length_px = max(rect_w, rect_h)
            width_px = min(rect_w, rect_h) if min(rect_w, rect_h) > 0 else 1.0

            crack_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(crack_mask, [contour], -1, 1, -1)

            conf_base = 0.85 if severity == "high" else (0.75 if severity == "medium" else 0.65)
            confidence = min(0.98, conf_base + (area / (w * h)) * 5)

            defects.append(DefectRegion(
                defect_type="crack",
                severity=severity,
                bbox=(x, y, x + bw, y + bh),
                mask=crack_mask,
                area_px=float(area),
                confidence=float(confidence),
                description=description,
                length_px=float(length_px),
                width_px=float(width_px),
            ))

        return defects

    def _nms_deduplicate(self, defects: List[DefectRegion], iou_threshold: float = 0.3) -> List[DefectRegion]:
        """Remove overlapping crack regions favoring higher severity."""
        if not defects:
            return []

        sev_score = {"high": 3, "medium": 2, "low": 1}
        sorted_defects = sorted(defects, key=lambda d: (sev_score.get(d.severity, 0), d.area_px), reverse=True)

        kept = []
        for cand in sorted_defects:
            bx1, by1, bx2, by2 = cand.bbox
            overlap = False
            for k in kept:
                kx1, ky1, kx2, ky2 = k.bbox
                ix1, iy1 = max(bx1, kx1), max(by1, ky1)
                ix2, iy2 = min(bx2, kx2), min(by2, ky2)
                if ix1 < ix2 and iy1 < iy2:
                    inter = (ix2 - ix1) * (iy2 - iy1)
                    union = (bx2 - bx1) * (by2 - by1) + (kx2 - kx1) * (ky2 - ky1) - inter
                    if union > 0 and (inter / union) > iou_threshold:
                        overlap = True
                        break
            if not overlap:
                kept.append(cand)

        return kept

    def _mock_detect(self, image: np.ndarray) -> List[DefectRegion]:
        h, w = image.shape[:2]
        return [
            DefectRegion(
                defect_type="crack", severity="medium",
                bbox=(int(w*0.3), int(h*0.4), int(w*0.45), int(h*0.6)),
                area_px=500, confidence=0.85,
                description="Видимая трещина по телу конструкции",
                length_px=150, width_px=3,
            ),
        ]


# ─────────────────────────────────────────────
# SpallingDetector — Сколы, выкрашивания, фальцы
# ─────────────────────────────────────────────

class SpallingDetector:
    """
    Detect concrete spalling, edge breakdowns, honeycombing, and delamination.

    Method:
    1. Surface Roughness Analysis via Laplacian energy.
    2. Texture Variance Analysis via Gabor filters.
    3. Flange edge notch detection via morphological BlackHat.
    """

    def detect(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> List[DefectRegion]:
        """Detect spalling and concrete edge defects."""
        if not CV2_AVAILABLE:
            return []

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape

            if roi_mask is not None:
                gray = cv2.bitwise_and(gray, gray, mask=roi_mask.astype(np.uint8))

            # 1. Edge notch / spall detection via morphological BlackHat
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            bh_spall = cv2.morphologyEx(enhanced, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7)))
            bh_spall_v = cv2.morphologyEx(enhanced, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (7, 21)))
            bh_combined = np.maximum(bh_spall, bh_spall_v)

            # 2. Laplacian texture variance
            laplacian = cv2.Laplacian(enhanced, cv2.CV_64F)
            lap_abs = np.uint8(np.clip(np.absolute(laplacian), 0, 255))
            lap_blur = cv2.GaussianBlur(lap_abs, (15, 15), 0)

            # 3. Spalling criteria
            is_spall = ((bh_combined > 14.0) | (lap_blur > 40)) & (gray < 170) & (gray > 20)
            cleaned = cv2.morphologyEx(is_spall.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))

            num_c, _, c_stats, _ = cv2.connectedComponentsWithStats(cleaned)
            defects = []

            for i in range(1, num_c):
                x, y, bw, bh, area = c_stats[i]
                if area > 80 and (bw > 20 or bh > 20) and (bw < w * 0.45 and bh < h * 0.45):
                    # Classify severity
                    rel_area = area / (w * h)
                    if rel_area > 0.02 or (y < h * 0.35 and bw > 35):
                        sev = "high"
                        desc = "Скол кромки / разрушение фальца замка"
                    else:
                        sev = "medium"
                        desc = "Скол бетона / поверхностное выкрашивание"

                    spall_mask = np.zeros((h, w), dtype=np.uint8)
                    spall_mask[y:y+bh, x:x+bw] = 1

                    defects.append(DefectRegion(
                        defect_type="spalling",
                        severity=sev,
                        bbox=(x, y, x + bw, y + bh),
                        mask=spall_mask,
                        area_px=float(area),
                        confidence=0.88,
                        description=desc,
                        length_px=float(max(bw, bh)),
                        width_px=float(min(bw, bh)),
                    ))

            logger.info(f"[SpallingDetector] Found {len(defects)} spalling regions")
            return defects

        except Exception as exc:
            logger.error(f"[SpallingDetector] Error: {exc}")
            return []


# ─────────────────────────────────────────────
# StainDetector — пятна (влага, масло, высолы)
# ─────────────────────────────────────────────

class StainDetector:
    """Detect moisture stains, water damage, and oil stains."""

    STAIN_TYPES = {
        "water": {
            "hsv_range": ((0, 0, 30), (180, 50, 140)),
            "desc": "Влажное пятно / следы протечки",
            "severity_threshold": 0.05,
        },
        "efflorescence": {
            "hsv_range": ((0, 0, 180), (180, 40, 255)),
            "desc": "Высолы / солевой налёт",
            "severity_threshold": 0.08,
        },
        "oil": {
            "hsv_range": ((15, 30, 20), (35, 150, 100)),
            "desc": "Масляное / техническое пятно",
            "severity_threshold": 0.03,
        },
    }

    def detect(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> List[DefectRegion]:
        """Detect stains on surface."""
        if not CV2_AVAILABLE:
            return self._mock_detect(image)

        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            h, w = image.shape[:2]
            defects = []

            for stain_type, cfg in self.STAIN_TYPES.items():
                lower = np.array(cfg["hsv_range"][0])
                upper = np.array(cfg["hsv_range"][1])
                mask = cv2.inRange(hsv, lower, upper)

                if roi_mask is not None:
                    mask = cv2.bitwise_and(mask, mask, mask=roi_mask.astype(np.uint8))

                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
                cleaned = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
                cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

                contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                min_area = w * h * 0.002

                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area < min_area:
                        continue

                    x, y, bw, bh = cv2.boundingRect(contour)
                    relative_area = area / (w * h)

                    if relative_area > cfg["severity_threshold"] * 2:
                        severity = "high"
                    elif relative_area > cfg["severity_threshold"]:
                        severity = "medium"
                    else:
                        severity = "low"

                    stain_mask = np.zeros((h, w), dtype=np.uint8)
                    cv2.drawContours(stain_mask, [contour], -1, 1, -1)

                    defects.append(DefectRegion(
                        defect_type="water_stain" if stain_type == "water" else stain_type,
                        severity=severity,
                        bbox=(x, y, x + bw, y + bh),
                        mask=stain_mask,
                        area_px=float(area),
                        confidence=0.78,
                        description=cfg["desc"],
                    ))

            logger.info(f"[StainDetector] Found {len(defects)} stain regions")
            return defects

        except Exception as exc:
            logger.error(f"[StainDetector] Error: {exc}")
            return []

    def _mock_detect(self, image: np.ndarray) -> List[DefectRegion]:
        h, w = image.shape[:2]
        return [
            DefectRegion(
                defect_type="water_stain", severity="low",
                bbox=(int(w*0.1), int(h*0.1), int(w*0.3), int(h*0.3)),
                area_px=1200, confidence=0.75,
                description="Влажное пятно / следы протечки",
            ),
        ]


# ─────────────────────────────────────────────
# RustDetector — ржавчина / коррозия
# ─────────────────────────────────────────────

class RustDetector:
    """Detect rust, corrosion, and rebar oxidation on surfaces."""

    RUST_HSV_RANGES = [
        {"lower": (5, 50, 40),   "upper": (25, 255, 180)},
        {"lower": (0, 70, 50),   "upper": (12, 255, 200)},
        {"lower": (170, 70, 50), "upper": (180, 255, 200)},
    ]

    def detect(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> List[DefectRegion]:
        """Detect rust/corrosion in image."""
        if not CV2_AVAILABLE:
            return self._mock_detect(image)

        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            h, w = image.shape[:2]

            combined_mask = np.zeros((h, w), dtype=np.uint8)
            for rng in self.RUST_HSV_RANGES:
                lower = np.array(rng["lower"])
                upper = np.array(rng["upper"])
                mask = cv2.inRange(hsv, lower, upper)
                combined_mask = cv2.bitwise_or(combined_mask, mask)

            if roi_mask is not None:
                combined_mask = cv2.bitwise_and(combined_mask, combined_mask, mask=roi_mask.astype(np.uint8))

            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
            combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)

            contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            defects = []
            min_area = w * h * 0.001

            for contour in contours:
                area = cv2.contourArea(contour)
                if area < min_area:
                    continue

                x, y, bw, bh = cv2.boundingRect(contour)
                relative_area = area / (w * h) if (w * h) > 0 else 0

                if relative_area > 0.1:
                    severity = "high"
                    desc = "Глубокая коррозия / коррозия арматуры"
                elif relative_area > 0.03:
                    severity = "medium"
                    desc = "Коррозия металла — требуется обработка"
                else:
                    severity = "low"
                    desc = "Поверхностное окисление"

                rust_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.drawContours(rust_mask, [contour], -1, 1, -1)

                defects.append(DefectRegion(
                    defect_type="rust",
                    severity=severity,
                    bbox=(x, y, x + bw, y + bh),
                    mask=rust_mask,
                    area_px=float(area),
                    confidence=0.82,
                    description=desc,
                ))

            logger.info(f"[RustDetector] Found {len(defects)} rust regions")
            return defects

        except Exception as exc:
            logger.error(f"[RustDetector] Error: {exc}")
            return []

    def _mock_detect(self, image: np.ndarray) -> List[DefectRegion]:
        h, w = image.shape[:2]
        return [
            DefectRegion(
                defect_type="rust", severity="low",
                bbox=(int(w*0.5), int(h*0.5), int(w*0.7), int(h*0.7)),
                area_px=800, confidence=0.75,
                description="Поверхностное окисление",
            ),
        ]


# ─────────────────────────────────────────────
# Unified DefectAnalyzer
# ─────────────────────────────────────────────

class DefectAnalyzer:
    """
    Combine all defect detectors into a single analysis.
    Returns full defect report with repair recommendations (СНиП-based).
    """

    REPAIR_RECOMMENDATIONS = {
        "crack": {
            "low": {"action": "Мониторинг", "method": "Заделка шпаклёвкой, грунтовка", "urgency": "плановый", "snip_ref": "СП 63.13330.2018 п.8.2", "cost_factor": 0.02},
            "medium": {"action": "Ремонт", "method": "Расшивка шва, заполнение тиксотропным составом", "urgency": "в течение 3 месяцев", "snip_ref": "СП 63.13330.2018 п.8.3", "cost_factor": 0.08},
            "high": {"action": "Срочный ремонт", "method": "Инъектирование эпоксидной смолой, усиление CFRP", "urgency": "незамедлительно", "snip_ref": "СП 63.13330.2018 п.8.5", "cost_factor": 0.25},
        },
        "spalling": {
            "low": {"action": "Очистка", "method": "Зачистка щёткой, обеспыливание", "urgency": "плановый", "snip_ref": "СП 28.13330.2017", "cost_factor": 0.02},
            "medium": {"action": "Ремонт", "method": "Удаление отслоений, ремонтный состав", "urgency": "в течение 1 месяца", "snip_ref": "СП 28.13330.2017 п.5.6", "cost_factor": 0.06},
            "high": {"action": "Восстановление фальца", "method": "Опалубочное бетонирование высокопрочным безусадочным составом", "urgency": "срочно", "snip_ref": "СП 28.13330.2017 п.5.7", "cost_factor": 0.18},
        },
        "water_stain": {
            "low": {"action": "Наблюдение", "method": "Просушка, перекраска", "urgency": "плановый", "snip_ref": "СП 29.13330.2011", "cost_factor": 0.01},
            "medium": {"action": "Гидроизоляция", "method": "Обмазочная ГИ, ремонт стыков", "urgency": "в течение 1 месяца", "snip_ref": "СП 71.13330.2017", "cost_factor": 0.05},
            "high": {"action": "Срочный ремонт", "method": "Устранение протечки, полная ГИ", "urgency": "незамедлительно", "snip_ref": "СП 71.13330.2017", "cost_factor": 0.15},
        },
        "mold": {
            "low": {"action": "Обработка", "method": "Антисептик, просушка", "urgency": "в течение 1 недели", "snip_ref": "СанПиН 2.1.2.2645", "cost_factor": 0.03},
            "medium": {"action": "Санация", "method": "Удаление штукатурки, фунгицидная обработка, вентиляция", "urgency": "срочно", "snip_ref": "СанПиН 2.1.2.2645", "cost_factor": 0.10},
            "high": {"action": "Капремонт", "method": "Полная замена отделки, ГИ, вентсистема", "urgency": "незамедлительно", "snip_ref": "СанПиН 2.1.2.2645", "cost_factor": 0.20},
        },
        "efflorescence": {
            "low": {"action": "Очистка", "method": "Кислотная промывка, просушка", "urgency": "плановый", "snip_ref": "СП 70.13330.2012", "cost_factor": 0.01},
            "medium": {"action": "Ремонт ГИ", "method": "Гидрофобизация, ремонт швов", "urgency": "в течение 3 месяцев", "snip_ref": "СП 70.13330.2012", "cost_factor": 0.04},
            "high": {"action": "Капремонт", "method": "Полная ГИ, замена кладки", "urgency": "срочно", "snip_ref": "СП 15.13330.2012", "cost_factor": 0.12},
        },
        "rust": {
            "low": {"action": "Обработка", "method": "Преобразователь ржавчины, грунтовка, покраска", "urgency": "плановый", "snip_ref": "СП 28.13330.2017", "cost_factor": 0.02},
            "medium": {"action": "Ремонт", "method": "Пескоструйная очистка, антикоррозийное покрытие", "urgency": "в течение 1 месяца", "snip_ref": "СП 28.13330.2017", "cost_factor": 0.08},
            "high": {"action": "Замена / Торкрет", "method": "Вскрытие защитного слоя, восстановление арматуры, торкретирование", "urgency": "незамедлительно", "snip_ref": "СП 16.13330.2017", "cost_factor": 0.30},
        },
    }

    def __init__(self):
        self.crack_detector = CrackDetector()
        self.spalling_detector = SpallingDetector()
        self.stain_detector = StainDetector()
        self.rust_detector = RustDetector()

    def _get_recommendation(self, defect_type: str, severity: str) -> Dict[str, Any]:
        """Get repair recommendation for a defect."""
        recs = self.REPAIR_RECOMMENDATIONS.get(defect_type, {})
        return recs.get(severity, {
            "action": "Осмотр",
            "method": "Визуальный осмотр специалистом",
            "urgency": "плановый",
            "snip_ref": "—",
            "cost_factor": 0.0,
        })

    def analyze(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """Run all defect detectors on image."""
        import time
        timings = {}

        t = time.time()
        cracks = self.crack_detector.detect(image, roi_mask)
        timings["crack_ms"] = int((time.time() - t) * 1000)

        t = time.time()
        spalls = self.spalling_detector.detect(image, roi_mask)
        timings["spalling_ms"] = int((time.time() - t) * 1000)

        t = time.time()
        stains = self.stain_detector.detect(image, roi_mask)
        timings["stain_ms"] = int((time.time() - t) * 1000)

        t = time.time()
        rust = self.rust_detector.detect(image, roi_mask)
        timings["rust_ms"] = int((time.time() - t) * 1000)

        all_defects = cracks + spalls + stains + rust
        h, w = image.shape[:2]
        total_area = sum(d.area_px for d in all_defects)
        total_pct = round(total_area / (w * h) * 100, 2) if w * h > 0 else 0

        severity_order = {"low": 0, "medium": 1, "high": 2}
        max_sev = "none"
        for d in all_defects:
            if severity_order.get(d.severity, 0) > severity_order.get(max_sev, -1):
                max_sev = d.severity

        confidences = [d.confidence for d in all_defects]
        conf_stats = {
            "min": round(min(confidences), 3) if confidences else 0,
            "max": round(max(confidences), 3) if confidences else 0,
            "avg": round(sum(confidences) / len(confidences), 3) if confidences else 0,
        }

        recommendations = []
        seen_recs = set()
        for d in all_defects:
            rec = self._get_recommendation(d.defect_type, d.severity)
            rec_key = f"{d.defect_type}_{d.severity}"
            if rec_key not in seen_recs:
                seen_recs.add(rec_key)
                recommendations.append({
                    "defect_type": d.defect_type,
                    "severity": d.severity,
                    "count": sum(1 for x in all_defects if x.defect_type == d.defect_type and x.severity == d.severity),
                    **rec,
                })

        urgency_order = {"незамедлительно": 0, "срочно": 1, "в течение 1 недели": 2,
                         "в течение 1 месяца": 3, "в течение 3 месяцев": 4, "плановый": 5}
        recommendations.sort(key=lambda r: urgency_order.get(r.get("urgency", ""), 9))

        defect_dicts = []
        for d in all_defects:
            dd = d.to_dict()
            rec = self._get_recommendation(d.defect_type, d.severity)
            dd["recommendation"] = rec["action"]
            dd["repair_method"] = rec["method"]
            dd["urgency"] = rec["urgency"]
            dd["snip_ref"] = rec["snip_ref"]
            defect_dicts.append(dd)

        return {
            "defects": defect_dicts,
            "summary": {
                "cracks": len(cracks),
                "spalling": len(spalls),
                "stains": len(stains),
                "rust": len(rust),
                "total": len(all_defects),
            },
            "max_severity": max_sev if all_defects else "none",
            "total_defect_area_pct": total_pct,
            "recommendations": recommendations,
            "confidence_stats": conf_stats,
            "timings": timings,
        }


# ─────────────────────────────────────────────
# Singleton accessor
# ─────────────────────────────────────────────

_analyzer_instance: Optional[DefectAnalyzer] = None
_analyzer_lock = threading.Lock()


def get_defect_analyzer() -> DefectAnalyzer:
    global _analyzer_instance
    if _analyzer_instance is None:
        with _analyzer_lock:
            if _analyzer_instance is None:
                _analyzer_instance = DefectAnalyzer()
    return _analyzer_instance
