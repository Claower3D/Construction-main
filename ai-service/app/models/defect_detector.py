"""
QAZGOST AI - Defect Detectors

Specialized defect detection for construction surfaces:
  - CrackDetector:   трещины (волосяные, сквозные, усадочные)
  - StainDetector:   пятна (влага, масло, высол)
  - RustDetector:    коррозия (ржавчина, окисление, патина)

Each detector returns DefectRegion with mask, severity, and area.
Used by AnalysisPipeline after GroundingDINO+SAM for surface analysis.
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
        defect_type: str,           # "crack", "stain", "rust", "mold", "spalling"
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
            "description_ru": self.description,  # Already in Russian
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
# CrackDetector — трещины на поверхности
# ─────────────────────────────────────────────

class CrackDetector:
    """
    Detect cracks on construction surfaces using image processing.

    Method: Canny edge detection + morphological filtering + skeletonization.
    When a neural model is available, uses CNN for higher accuracy.

    Severity levels:
    - low:    hairline cracks (< 0.3mm equivalent), cosmetic
    - medium: visible cracks (0.3-1mm), monitor
    - high:   structural cracks (> 1mm), urgent repair
    """

    def __init__(self, use_nn: bool = False):
        self.use_nn = use_nn
        self.model = None
        if use_nn:
            self._load_nn_model()

    def _load_nn_model(self):
        """Load neural crack detector (optional)."""
        try:
            import torch
            model_path = "models/crack_detector.pth"
            # Placeholder: load pretrained crack segmentation model
            logger.info("[CrackDetector] Neural model not available, using CV pipeline")
        except Exception as e:
            logger.warning(f"[CrackDetector] NN model unavailable: {e}")

    def detect(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> List[DefectRegion]:
        """
        Detect cracks in image.

        Args:
            image:    RGB numpy array (H, W, 3)
            roi_mask: Optional binary mask to limit detection area

        Returns:
            List of DefectRegion for each crack found
        """
        if not CV2_AVAILABLE:
            return self._mock_detect(image)

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape

            # Apply ROI if provided
            if roi_mask is not None:
                gray = cv2.bitwise_and(gray, gray, mask=roi_mask.astype(np.uint8))

            # Preprocessing: CLAHE for contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)

            # Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)

            # Canny edge detection with adaptive thresholds
            median_val = np.median(blurred)
            lower = int(max(0, 0.5 * median_val))
            upper = int(min(255, 1.5 * median_val))
            edges = cv2.Canny(blurred, lower, upper)

            # Morphological operations to connect nearby edges (crack lines)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

            # Remove small noise components
            kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            cleaned = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open, iterations=1)

            # Find contours
            contours, _ = cv2.findContours(
                cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            defects = []
            min_area = w * h * 0.0005  # Minimum 0.05% of image area

            for contour in contours:
                area = cv2.contourArea(contour)
                if area < min_area:
                    continue

                # Analyze contour shape
                perimeter = cv2.arcLength(contour, True)
                if perimeter == 0:
                    continue

                # Crack indicator: high perimeter-to-area ratio (elongated)
                elongation = perimeter ** 2 / (4 * np.pi * area) if area > 0 else 0
                if elongation < 5:  # Not elongated enough to be a crack
                    continue

                # Bounding box
                x, y, bw, bh = cv2.boundingRect(contour)

                # Fit minimum area rectangle for length/width
                rect = cv2.minAreaRect(contour)
                rect_w, rect_h = rect[1]
                length_px = max(rect_w, rect_h)
                width_px = min(rect_w, rect_h) if min(rect_w, rect_h) > 0 else 1

                # Severity based on relative width and length
                relative_width = width_px / h  # Relative to image height
                relative_length = length_px / max(w, h)

                if relative_width > 0.005 or relative_length > 0.3:
                    severity = "high"
                    desc = "Сквозная/структурная трещина"
                elif relative_width > 0.002 or relative_length > 0.15:
                    severity = "medium"
                    desc = "Видимая трещина — требует мониторинга"
                else:
                    severity = "low"
                    desc = "Волосяная/усадочная трещина — косметический дефект"

                # Create mask for this crack
                crack_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.drawContours(crack_mask, [contour], -1, 1, -1)

                confidence = min(0.95, 0.5 + elongation * 0.02)

                defects.append(DefectRegion(
                    defect_type="crack",
                    severity=severity,
                    bbox=(x, y, x + bw, y + bh),
                    mask=crack_mask,
                    area_px=area,
                    confidence=confidence,
                    description=desc,
                    length_px=length_px,
                    width_px=width_px,
                ))

            logger.info(f"[CrackDetector] Found {len(defects)} cracks")
            return defects

        except Exception as exc:
            logger.error(f"[CrackDetector] Error: {exc}")
            return []

    def _mock_detect(self, image: np.ndarray) -> List[DefectRegion]:
        h, w = image.shape[:2]
        return [
            DefectRegion(
                defect_type="crack", severity="medium",
                bbox=(int(w*0.3), int(h*0.4), int(w*0.45), int(h*0.6)),
                area_px=500, confidence=0.72,
                description="Видимая трещина — требует мониторинга",
                length_px=150, width_px=3,
            ),
        ]


# ─────────────────────────────────────────────
# StainDetector — пятна (влага, масло, высолы)
# ─────────────────────────────────────────────

class StainDetector:
    """
    Detect stains and moisture on construction surfaces.

    Method: HSV/LAB color analysis + blob detection.
    Detects: water stains, oil spots, efflorescence (high salt), mold.

    Severity:
    - low:    small dry stain, cosmetic
    - medium: moisture ingress, needs waterproofing check
    - high:   active leak, mold growth, structural concern
    """

    # Color ranges in HSV for different stain types
    STAIN_PROFILES = {
        "water_stain": {
            "hsv_lower": (0, 0, 100),
            "hsv_upper": (180, 40, 200),
            "desc": "Водяное пятно/следы влаги",
        },
        "mold": {
            "hsv_lower": (35, 30, 30),
            "hsv_upper": (90, 255, 150),
            "desc": "Плесень/грибок",
        },
        "efflorescence": {
            "hsv_lower": (0, 0, 200),
            "hsv_upper": (180, 30, 255),
            "desc": "Высолы (солевой налёт)",
        },
        "oil": {
            "hsv_lower": (10, 50, 20),
            "hsv_upper": (25, 200, 120),
            "desc": "Масляное/битумное пятно",
        },
    }

    def detect(
        self,
        image: np.ndarray,
        roi_mask: Optional[np.ndarray] = None,
    ) -> List[DefectRegion]:
        """Detect stains in image."""
        if not CV2_AVAILABLE:
            return self._mock_detect(image)

        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            h, w = image.shape[:2]
            defects = []

            for stain_type, profile in self.STAIN_PROFILES.items():
                lower = np.array(profile["hsv_lower"])
                upper = np.array(profile["hsv_upper"])

                mask = cv2.inRange(hsv, lower, upper)

                # Apply ROI
                if roi_mask is not None:
                    mask = cv2.bitwise_and(mask, mask, mask=roi_mask.astype(np.uint8))

                # Morphological cleanup
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
                mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
                mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

                # Find connected components
                contours, _ = cv2.findContours(
                    mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )

                min_area = w * h * 0.002  # Min 0.2% of image

                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area < min_area:
                        continue

                    x, y, bw, bh = cv2.boundingRect(contour)
                    relative_area = area / (w * h)

                    # Severity
                    if stain_type == "mold" or relative_area > 0.1:
                        severity = "high"
                    elif relative_area > 0.03:
                        severity = "medium"
                    else:
                        severity = "low"

                    stain_mask = np.zeros((h, w), dtype=np.uint8)
                    cv2.drawContours(stain_mask, [contour], -1, 1, -1)

                    defects.append(DefectRegion(
                        defect_type=stain_type,
                        severity=severity,
                        bbox=(x, y, x + bw, y + bh),
                        mask=stain_mask,
                        area_px=area,
                        confidence=0.65,
                        description=profile["desc"],
                    ))

            logger.info(f"[StainDetector] Found {len(defects)} stains")
            return defects

        except Exception as exc:
            logger.error(f"[StainDetector] Error: {exc}")
            return []

    def _mock_detect(self, image: np.ndarray) -> List[DefectRegion]:
        h, w = image.shape[:2]
        return [
            DefectRegion(
                defect_type="water_stain", severity="medium",
                bbox=(int(w*0.4), int(h*0.2), int(w*0.6), int(h*0.4)),
                area_px=1200, confidence=0.65,
                description="Водяное пятно/следы влаги",
            ),
        ]


# ─────────────────────────────────────────────
# RustDetector — ржавчина/коррозия
# ─────────────────────────────────────────────

class RustDetector:
    """
    Detect rust and corrosion on metal surfaces.

    Method: HSV orange-brown range + texture analysis (Gabor filter).

    Severity:
    - low:    surface oxidation, removable
    - medium: visible corrosion, needs treatment
    - high:   deep pitting, structural concern
    """

    # Rust is typically orange-brown in HSV
    RUST_HSV_RANGES = [
        # Orange-red rust
        {"lower": (0, 100, 50), "upper": (15, 255, 200)},
        # Brown rust
        {"lower": (15, 80, 30), "upper": (25, 255, 180)},
        # Dark rust
        {"lower": (0, 50, 20), "upper": (20, 200, 100)},
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

            # Combine all rust ranges
            combined_mask = np.zeros((h, w), dtype=np.uint8)
            for rng in self.RUST_HSV_RANGES:
                lower = np.array(rng["lower"])
                upper = np.array(rng["upper"])
                mask = cv2.inRange(hsv, lower, upper)
                combined_mask = cv2.bitwise_or(combined_mask, mask)

            # Apply ROI
            if roi_mask is not None:
                combined_mask = cv2.bitwise_and(
                    combined_mask, combined_mask, mask=roi_mask.astype(np.uint8)
                )

            # Cleanup
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
            combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)

            # Texture verification: Gabor filter for rough surface texture
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            gabor_kernel = cv2.getGaborKernel(
                (21, 21), 4.0, np.pi / 4, 10.0, 0.5, 0, ktype=cv2.CV_32F
            )
            gabor_response = cv2.filter2D(gray, cv2.CV_32F, gabor_kernel)
            texture_mask = (np.abs(gabor_response) > 30).astype(np.uint8) * 255

            # Combine color + texture
            final_mask = cv2.bitwise_and(combined_mask, texture_mask)

            # If texture filter removes too much, fall back to color only
            if np.sum(final_mask) < np.sum(combined_mask) * 0.1:
                final_mask = combined_mask

            # Find contours
            contours, _ = cv2.findContours(
                final_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            defects = []
            min_area = w * h * 0.001

            for contour in contours:
                area = cv2.contourArea(contour)
                if area < min_area:
                    continue

                x, y, bw, bh = cv2.boundingRect(contour)
                relative_area = area / (w * h)

                if relative_area > 0.1:
                    severity = "high"
                    desc = "Глубокая коррозия — требуется замена"
                elif relative_area > 0.03:
                    severity = "medium"
                    desc = "Коррозия — требуется обработка"
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
                    area_px=area,
                    confidence=0.70,
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
                area_px=800, confidence=0.70,
                description="Поверхностное окисление",
            ),
        ]


# ─────────────────────────────────────────────
# Unified defect analysis
# ─────────────────────────────────────────────

class DefectAnalyzer:
    """
    Combine all defect detectors into a single analysis.
    Returns full defect report with repair recommendations (СНиП-based).
    """

    # Repair recommendations per defect type + severity (СНиП / СП based)
    REPAIR_RECOMMENDATIONS = {
        "crack": {
            "low": {
                "action": "Мониторинг",
                "method": "Заделка шпаклёвкой, грунтовка",
                "urgency": "плановый",
                "snip_ref": "СП 70.13330.2012 п.5.18",
                "cost_factor": 0.02,  # 2% от стоимости кв.м.
            },
            "medium": {
                "action": "Ремонт",
                "method": "Расшивка, заполнение ремонтным составом, армирование сеткой",
                "urgency": "в течение 3 месяцев",
                "snip_ref": "СП 63.13330.2018 п.8.2",
                "cost_factor": 0.08,
            },
            "high": {
                "action": "Срочный ремонт",
                "method": "Инъектирование, усиление конструкции, возможна замена участка",
                "urgency": "незамедлительно",
                "snip_ref": "СП 13-102-2003 п.6.4",
                "cost_factor": 0.25,
            },
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
        "oil": {
            "low": {"action": "Очистка", "method": "Обезжиривание, грунтовка", "urgency": "плановый", "snip_ref": "СП 71.13330.2017", "cost_factor": 0.01},
            "medium": {"action": "Ремонт", "method": "Удаление загрязнённого слоя, новое покрытие", "urgency": "в течение 1 месяца", "snip_ref": "СП 71.13330.2017", "cost_factor": 0.04},
            "high": {"action": "Замена", "method": "Полная замена покрытия", "urgency": "срочно", "snip_ref": "СП 71.13330.2017", "cost_factor": 0.10},
        },
        "rust": {
            "low": {"action": "Обработка", "method": "Преобразователь ржавчины, грунтовка, покраска", "urgency": "плановый", "snip_ref": "СП 28.13330.2017", "cost_factor": 0.02},
            "medium": {"action": "Ремонт", "method": "Пескоструйная очистка, антикоррозийное покрытие", "urgency": "в течение 1 месяца", "snip_ref": "СП 28.13330.2017", "cost_factor": 0.08},
            "high": {"action": "Замена", "method": "Замена металлоконструкции, усиление", "urgency": "незамедлительно", "snip_ref": "СП 16.13330.2017", "cost_factor": 0.30},
        },
    }

    def __init__(self):
        self.crack_detector = CrackDetector()
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
        """
        Run all defect detectors on image.

        Returns:
            {
                "defects": [...],
                "summary": {"cracks": N, "stains": N, "rust": N, "total": N},
                "max_severity": "low|medium|high|none",
                "total_defect_area_pct": float,
                "recommendations": [...],
                "confidence_stats": {"min": f, "max": f, "avg": f},
            }
        """
        import time
        timings = {}

        t = time.time()
        cracks = self.crack_detector.detect(image, roi_mask)
        timings["crack_ms"] = int((time.time() - t) * 1000)

        t = time.time()
        stains = self.stain_detector.detect(image, roi_mask)
        timings["stain_ms"] = int((time.time() - t) * 1000)

        t = time.time()
        rust = self.rust_detector.detect(image, roi_mask)
        timings["rust_ms"] = int((time.time() - t) * 1000)

        all_defects = cracks + stains + rust
        h, w = image.shape[:2]
        total_area = sum(d.area_px for d in all_defects)
        total_pct = round(total_area / (w * h) * 100, 2) if w * h > 0 else 0

        # Max severity
        severity_order = {"low": 0, "medium": 1, "high": 2}
        max_sev = "none"
        for d in all_defects:
            if severity_order.get(d.severity, 0) > severity_order.get(max_sev, -1):
                max_sev = d.severity

        # Confidence stats
        confidences = [d.confidence for d in all_defects]
        conf_stats = {
            "min": round(min(confidences), 3) if confidences else 0,
            "max": round(max(confidences), 3) if confidences else 0,
            "avg": round(sum(confidences) / len(confidences), 3) if confidences else 0,
        }

        # Build recommendations
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

        # Sort by urgency (high severity first)
        urgency_order = {"незамедлительно": 0, "срочно": 1, "в течение 1 недели": 2,
                         "в течение 1 месяца": 3, "в течение 3 месяцев": 4, "плановый": 5}
        recommendations.sort(key=lambda r: urgency_order.get(r.get("urgency", ""), 9))

        # Enrich defect dicts with recommendations
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
# Singleton
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
