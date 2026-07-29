"""
QAZGOST AI - Scale Calibration Service V2

Determine pixel-to-meter ratio using multiple detection methods:
  1. ArUco marker detection (OpenCV ArUco module)
  2. A4 sheet detection (210×297mm)
  3. Credit card detection (85.6×54mm)  
  4. EXIF focal length extraction
  5. Known object sizes (person, door, brick)
  6. Manual user input (fallback)

Priority: ArUco > A4 > Credit card > EXIF > Known objects > User input
"""

import math
from typing import List, Optional, Tuple, Dict, Any
from loguru import logger
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from PIL import Image as PILImage
    from PIL.ExifTags import TAGS
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class ScaleCalibrator:
    """
    Multi-method scale calibration for construction photos.

    Returns scale_factor (meters per pixel) and confidence level.
    """

    # ── Known reference sizes ────────────────────────────────────────────────

    # ArUco marker — user prints at known size
    ARUCO_DEFAULT_SIZE_M = 0.15  # 15cm marker side

    # Standard document/card sizes
    A4_WIDTH_M = 0.210
    A4_HEIGHT_M = 0.297

    CREDIT_CARD_WIDTH_M = 0.0856
    CREDIT_CARD_HEIGHT_M = 0.0540

    # Known object typical sizes (used as fallback)
    REFERENCE_SIZES = {
        "measuring_tape": {"size": 1.0, "dimension": "height", "confidence": 0.90},
        "person":         {"size": 1.75, "dimension": "height", "confidence": 0.70},
        "door":           {"size": 2.0,  "dimension": "height", "confidence": 0.75},
        "brick":          {"size": 0.25, "dimension": "width",  "confidence": 0.80},
        "concrete_block": {"size": 0.40, "dimension": "width",  "confidence": 0.80},
        "car":            {"size": 4.50, "dimension": "width",  "confidence": 0.50},
        "excavator_bucket":{"size": 1.20,"dimension": "width",  "confidence": 0.60},
        "A4 paper":       {"size": 0.297,"dimension": "height", "confidence": 0.85},
        "credit card":    {"size": 0.0856,"dimension":"width",  "confidence": 0.85},
    }

    # Typical sensor sizes for EXIF-based estimation (mm)
    SENSOR_SIZES = {
        "1/3.06": (4.25, 3.19),   # iPhone 14 main
        "1/2.55": (5.64, 4.23),   # Samsung S23 main
        "1/2.3":  (6.17, 4.55),   # Smartphone (common)
        "1/1.76": (7.82, 5.87),   # Xiaomi 14 Ultra
        "1/1.7":  (7.60, 5.70),   # Compact
        "1/1.56": (8.60, 6.45),   # Huawei P60 Pro
        "1/1.3":  (9.80, 7.30),   # Samsung S24 Ultra
        "1":      (13.2, 8.80),   # Premium compact / Sony RX100
        "M4/3":   (17.3, 13.0),   # Micro four thirds
        "APS-C":  (23.5, 15.6),   # DSLR crop
        "FF":     (36.0, 24.0),   # Full frame
    }

    # Typical photo distances by construction context (meters)
    TYPICAL_DISTANCES = {
        "close":  1.5,   # Close-up detail (cracks, joints)
        "medium": 3.0,   # Standard room-scale photo
        "wide":   6.0,   # Building exterior, foundations
    }

    def __init__(self):
        self._aruco_dict = None
        self._aruco_params = None
        if CV2_AVAILABLE:
            try:
                self._aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_250)
                self._aruco_params = cv2.aruco.DetectorParameters()
            except Exception:
                logger.warning("[Calibrator] ArUco module not available in OpenCV build")

    # ═══════════════════════════════════════════════════════════════════════════
    # 1. ArUco Marker Detection
    # ═══════════════════════════════════════════════════════════════════════════

    def detect_aruco(
        self,
        image: np.ndarray,
        marker_size_m: float = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Detect ArUco markers in image.

        Args:
            image:         RGB numpy array
            marker_size_m: Physical marker side length (meters)

        Returns:
            {"scale_factor": float, "confidence": float, "method": "aruco",
             "marker_ids": list, "corners": list} or None
        """
        if not CV2_AVAILABLE or self._aruco_dict is None:
            return None

        marker_size = marker_size_m or self.ARUCO_DEFAULT_SIZE_M

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            detector = cv2.aruco.ArucoDetector(self._aruco_dict, self._aruco_params)
            corners, ids, rejected = detector.detectMarkers(gray)

            if ids is None or len(ids) == 0:
                return None

            # Calculate scale from detected marker(s)
            scales = []
            for i, corner in enumerate(corners):
                pts = corner[0]  # 4 corner points
                # Average side length in pixels
                side_lengths = [
                    np.linalg.norm(pts[j] - pts[(j + 1) % 4])
                    for j in range(4)
                ]
                avg_side_px = np.mean(side_lengths)
                if avg_side_px > 0:
                    scales.append(marker_size / avg_side_px)

            if not scales:
                return None

            scale_factor = np.mean(scales)
            confidence = min(0.95, 0.80 + len(scales) * 0.05)

            logger.info(
                f"[Calibrator] ArUco: {len(ids)} markers, "
                f"scale={scale_factor:.6f} m/px, conf={confidence:.2f}"
            )

            return {
                "scale_factor": float(scale_factor),
                "confidence": confidence,
                "method": "aruco",
                "marker_ids": ids.flatten().tolist(),
                "marker_count": len(ids),
            }

        except Exception as exc:
            logger.warning(f"[Calibrator] ArUco detection failed: {exc}")
            return None

    # ═══════════════════════════════════════════════════════════════════════════
    # 2. A4 Sheet Detection
    # ═══════════════════════════════════════════════════════════════════════════

    def detect_a4_sheet(self, image: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Detect A4 paper sheet in image for scale reference.

        Uses contour detection to find rectangular objects with A4 aspect ratio.
        """
        if not CV2_AVAILABLE:
            return None

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape

            # Adaptive threshold for paper detection
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )

            # Find contours
            contours, _ = cv2.findContours(
                thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            a4_ratio = self.A4_HEIGHT_M / self.A4_WIDTH_M  # ~1.414
            best_match = None
            best_score = 0

            for contour in contours:
                area = cv2.contourArea(contour)
                if area < (w * h * 0.005):  # Too small
                    continue
                if area > (w * h * 0.5):    # Too large
                    continue

                # Approximate polygon
                peri = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

                # Must be quadrilateral
                if len(approx) != 4:
                    continue

                # Check aspect ratio matches A4
                rect = cv2.minAreaRect(contour)
                rect_w, rect_h = rect[1]
                if rect_w == 0 or rect_h == 0:
                    continue

                ratio = max(rect_w, rect_h) / min(rect_w, rect_h)
                ratio_match = 1.0 - abs(ratio - a4_ratio) / a4_ratio

                if ratio_match > 0.85 and ratio_match > best_score:
                    best_score = ratio_match
                    long_side_px = max(rect_w, rect_h)
                    short_side_px = min(rect_w, rect_h)

                    # Scale from longer side
                    scale_from_long = self.A4_HEIGHT_M / long_side_px
                    scale_from_short = self.A4_WIDTH_M / short_side_px
                    scale_factor = (scale_from_long + scale_from_short) / 2

                    best_match = {
                        "scale_factor": float(scale_factor),
                        "confidence": 0.80 * ratio_match,
                        "method": "a4_sheet",
                        "detected_ratio": round(ratio, 3),
                    }

            if best_match:
                logger.info(
                    f"[Calibrator] A4 sheet detected: scale={best_match['scale_factor']:.6f} m/px"
                )
            return best_match

        except Exception as exc:
            logger.warning(f"[Calibrator] A4 detection failed: {exc}")
            return None

    # ═══════════════════════════════════════════════════════════════════════════
    # 3. Credit Card Detection
    # ═══════════════════════════════════════════════════════════════════════════

    def detect_credit_card(self, image: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Detect credit/bank card in image.
        All standard cards are 85.6×54mm (ISO/IEC 7810 ID-1).
        """
        if not CV2_AVAILABLE:
            return None

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            h, w = gray.shape

            # Edge detection
            edges = cv2.Canny(gray, 50, 150)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            edges = cv2.dilate(edges, kernel, iterations=1)

            contours, _ = cv2.findContours(
                edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            card_ratio = self.CREDIT_CARD_WIDTH_M / self.CREDIT_CARD_HEIGHT_M  # ~1.586

            for contour in contours:
                area = cv2.contourArea(contour)
                if area < 1000 or area > (w * h * 0.3):
                    continue

                peri = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

                if len(approx) != 4:
                    continue

                rect = cv2.minAreaRect(contour)
                rect_w, rect_h = rect[1]
                if min(rect_w, rect_h) == 0:
                    continue

                ratio = max(rect_w, rect_h) / min(rect_w, rect_h)
                if abs(ratio - card_ratio) < 0.20:  # Wider tolerance for perspective distortion
                    long_side_px = max(rect_w, rect_h)
                    scale_factor = self.CREDIT_CARD_WIDTH_M / long_side_px

                    logger.info(f"[Calibrator] Credit card detected: scale={scale_factor:.6f}")
                    return {
                        "scale_factor": float(scale_factor),
                        "confidence": 0.80,
                        "method": "credit_card",
                    }

            return None

        except Exception as exc:
            logger.warning(f"[Calibrator] Credit card detection failed: {exc}")
            return None

    # ═══════════════════════════════════════════════════════════════════════════
    # 4. EXIF Focal Length Extraction
    # ═══════════════════════════════════════════════════════════════════════════

    def extract_scale_from_exif(
        self,
        image_path: str,
        distance_to_object_m: Optional[float] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Estimate scale from EXIF focal length and sensor size.

        If distance_to_object is known, calculates precise GSD (ground sampling distance).
        Otherwise returns estimated GSD based on typical smartphone distances.
        """
        if not PIL_AVAILABLE:
            return None

        try:
            pil_img = PILImage.open(image_path)
            exif_data = pil_img._getexif()

            if not exif_data:
                return None

            # Extract relevant EXIF tags
            focal_length = None
            focal_length_35mm = None
            img_width = pil_img.width
            img_height = pil_img.height

            for tag_id, value in exif_data.items():
                tag_name = TAGS.get(tag_id, tag_id)
                if tag_name == "FocalLength":
                    focal_length = float(value)
                elif tag_name == "FocalLengthIn35mmFilm":
                    focal_length_35mm = float(value)

            if focal_length is None and focal_length_35mm is None:
                return None

            # Estimate sensor width
            if focal_length and focal_length_35mm and focal_length_35mm > 0:
                # Crop factor = 35mm equivalent / actual focal length
                crop_factor = focal_length_35mm / focal_length
                sensor_width_mm = 36.0 / crop_factor  # Full frame is 36mm wide
            else:
                # Assume smartphone sensor (~1/2.3")
                sensor_width_mm = 6.17

            # GSD = (sensor_width × distance) / (focal_length × image_width)
            focal_mm = focal_length or (focal_length_35mm * sensor_width_mm / 36.0)

            if distance_to_object_m:
                distance_m = distance_to_object_m
            else:
                # Heuristic: typical photo distance 2-5m for construction
                distance_m = 3.0

            sensor_width_m = sensor_width_mm / 1000.0
            gsd = (sensor_width_m * distance_m) / (focal_mm / 1000.0 * img_width)

            confidence = 0.60 if distance_to_object_m else 0.40

            logger.info(
                f"[Calibrator] EXIF: focal={focal_mm}mm, "
                f"dist={distance_m}m, GSD={gsd:.6f} m/px, conf={confidence}"
            )

            return {
                "scale_factor": float(gsd),
                "confidence": confidence,
                "method": "exif",
                "focal_length_mm": focal_mm,
                "estimated_distance_m": distance_m,
            }

        except Exception as exc:
            logger.warning(f"[Calibrator] EXIF extraction failed: {exc}")
            return None

    # ═══════════════════════════════════════════════════════════════════════════
    # 5. Calibration from detected objects (person, door, brick)
    # ═══════════════════════════════════════════════════════════════════════════

    def calibrate_from_detections(
        self,
        detections: List,
        reference_type: Optional[str] = None,
        known_size: Optional[float] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate scale from known-size objects detected in image.

        Args:
            detections:      List of Detection objects
            reference_type:  Specific reference to use, or auto-detect
            known_size:      Override known size in meters
        """
        if not detections:
            return None

        # Priority order for auto-detection
        priority = ["measuring_tape", "brick", "concrete_block", "door", "person", "car"]

        if reference_type:
            priority = [reference_type] + priority

        for ref_name in priority:
            ref_info = self.REFERENCE_SIZES.get(ref_name)
            if not ref_info:
                continue

            for det in detections:
                if det.class_name != ref_name:
                    continue

                size_m = known_size or ref_info["size"]
                dim = ref_info["dimension"]
                size_px = det.height if dim == "height" else det.width

                if size_px <= 0:
                    continue

                scale_factor = size_m / size_px

                logger.info(
                    f"[Calibrator] Using {ref_name}: "
                    f"{size_m}m / {size_px}px = {scale_factor:.6f} m/px"
                )

                return {
                    "scale_factor": float(scale_factor),
                    "confidence": ref_info["confidence"],
                    "method": "reference_object",
                    "reference_object": ref_name,
                }

        return None

    # ═══════════════════════════════════════════════════════════════════════════
    # 6. Fallback: estimate from typical object sizes
    # ═══════════════════════════════════════════════════════════════════════════

    def estimate_scale_from_typical(
        self,
        object_type: str,
        detected_size_px: int,
        dimension: str = "width",
    ) -> Optional[Dict[str, Any]]:
        """
        Estimate scale from typical sizes of detected construction objects.
        Low confidence — used only as last resort.
        """
        TYPICAL_SIZES = {
            "trench":     {"width": 0.8, "height": 10.0},
            "pit":        {"width": 3.0, "height": 4.0},
            "foundation": {"width": 0.4, "height": 8.0},
            "pipe_pvc":   {"width": 0.1, "height": 6.0},
            "manhole":    {"width": 1.0, "height": 1.0},
            "wall":       {"width": 4.0, "height": 3.0},
            "floor":      {"width": 5.0, "height": 5.0},
            "slab":       {"width": 6.0, "height": 6.0},
        }

        if object_type not in TYPICAL_SIZES or detected_size_px <= 0:
            return None

        typical = TYPICAL_SIZES[object_type]
        typical_size = typical.get(dimension, 1.0)
        scale_factor = typical_size / detected_size_px

        logger.warning(
            f"[Calibrator] Estimated from typical {object_type}: "
            f"{typical_size}m / {detected_size_px}px = {scale_factor:.6f} m/px"
        )

        return {
            "scale_factor": float(scale_factor),
            "confidence": 0.30,
            "method": "typical_size_estimate",
            "object_type": object_type,
            "needs_scale": True,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # Master calibration: try all methods in priority order
    # ═══════════════════════════════════════════════════════════════════════════

    def calibrate(
        self,
        image: np.ndarray,
        detections: List = None,
        image_path: Optional[str] = None,
        user_scale_hint: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Try all calibration methods in priority order.
        Returns result with full calibration_report showing all tried methods.
        """
        import time
        method_chain: List[Dict[str, Any]] = []
        confidence_breakdown: Dict[str, float] = {}

        # Helper to record tried method
        def _try(name, fn, *args, min_conf=0.3, **kwargs):
            t = time.time()
            res = fn(*args, **kwargs)
            ms = int((time.time() - t) * 1000)
            if res:
                confidence_breakdown[name] = res["confidence"]
                method_chain.append({"method": name, "status": "ok", "confidence": res["confidence"], "ms": ms})
            else:
                confidence_breakdown[name] = 0.0
                method_chain.append({"method": name, "status": "not_found", "confidence": 0, "ms": ms})
            return res

        def _finalize(result):
            result["calibration_report"] = {
                "method_chain": method_chain,
                "confidence_breakdown": confidence_breakdown,
                "methods_tried": len(method_chain),
                "winning_method": result["method"],
            }
            return result

        # 1. ArUco markers (highest priority)
        result = _try("aruco", self.detect_aruco, image)
        if result and result["confidence"] > 0.7:
            result["needs_scale"] = False
            return _finalize(result)

        # 2. A4 sheet
        result = _try("a4_sheet", self.detect_a4_sheet, image)
        if result and result["confidence"] > 0.6:
            result["needs_scale"] = False
            return _finalize(result)

        # 3. Credit card
        result = _try("credit_card", self.detect_credit_card, image)
        if result and result["confidence"] > 0.6:
            result["needs_scale"] = False
            return _finalize(result)

        # 4. EXIF focal length
        if image_path:
            result = _try("exif", self.extract_scale_from_exif, image_path)
            if result and result["confidence"] > 0.3:
                result["needs_scale"] = True
                return _finalize(result)
        else:
            method_chain.append({"method": "exif", "status": "skipped", "confidence": 0, "ms": 0})

        # 5. Known reference objects in detections
        if detections:
            result = _try("reference_object", self.calibrate_from_detections, detections)
            if result:
                result["needs_scale"] = False
                return _finalize(result)
        else:
            method_chain.append({"method": "reference_object", "status": "skipped", "confidence": 0, "ms": 0})

        # 6. User manual hint
        if user_scale_hint:
            obj_name = user_scale_hint.get("object_name", "")
            size_m = user_scale_hint.get("size_m", 1.0)
            if detections:
                for det in detections:
                    if det.class_name == obj_name:
                        dim_px = max(det.width, det.height)
                        if dim_px > 0:
                            r = {
                                "scale_factor": size_m / dim_px,
                                "confidence": 0.75,
                                "method": "user_input",
                                "needs_scale": False,
                            }
                            method_chain.append({"method": "user_input", "status": "ok", "confidence": 0.75, "ms": 0})
                            return _finalize(r)

        # 7. Fallback — estimate from image diagonal (very rough)
        h, w = image.shape[:2]
        fallback_scale = 5.0 / w
        logger.warning(f"[Calibrator] No scale found — using fallback {fallback_scale:.6f} m/px")

        r = {
            "scale_factor": float(fallback_scale),
            "confidence": 0.15,
            "method": "fallback",
            "needs_scale": True,
        }
        method_chain.append({"method": "fallback", "status": "used", "confidence": 0.15, "ms": 0})
        return _finalize(r)

    # ═══════════════════════════════════════════════════════════════════════════
    # Utility: convert measurements
    # ═══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def convert_to_meters(value_px: float, scale_factor: float) -> float:
        return value_px * scale_factor

    @staticmethod
    def convert_area_to_m2(area_px: float, scale_factor: float) -> float:
        return area_px * scale_factor * scale_factor

    @staticmethod
    def validate_scale(scale_factor: float, image_width: int, image_height: int) -> bool:
        """Check that scale produces reasonable real-world dimensions."""
        width_m = image_width * scale_factor
        height_m = image_height * scale_factor
        return (0.5 < width_m < 200.0) and (0.3 < height_m < 100.0)
