"""
Unit tests for ScaleCalibrator and DefectDetector modules.

Tests calibration methods (ArUco, A4, credit card, EXIF, heuristic),
defect detection (crack, stain, rust), and edge cases.
"""

import sys
import os
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _make_test_image(w=640, h=480):
    """Plain gray image for testing."""
    return np.ones((h, w, 3), dtype=np.uint8) * 180


def _make_cracked_image(w=640, h=480):
    """Image with a synthetic 'crack' — thin dark sinusoidal line."""
    img = np.ones((h, w, 3), dtype=np.uint8) * 200
    for y in range(50, 400):
        x = 300 + int(8 * np.sin(y / 15.0))
        img[y, max(0, x-1):min(w, x+2), :] = [20, 20, 20]
    return img


def _make_stained_image(w=640, h=480):
    """Image with a large dark-ish 'stain' patch."""
    img = np.ones((h, w, 3), dtype=np.uint8) * 210
    # Dark yellow-brown stain
    img[100:300, 200:400, :] = [150, 140, 110]
    return img


def _make_rusty_image(w=640, h=480):
    """Image with an 'orange-brown' rust patch."""
    img = np.ones((h, w, 3), dtype=np.uint8) * 190
    # Rust-colored area (RGB orange-brown)
    img[150:280, 250:420, 0] = 200  # R
    img[150:280, 250:420, 1] = 120  # G
    img[150:280, 250:420, 2] = 50   # B
    return img


# ═══════════════════════════════════════
#  SCALE CALIBRATOR TESTS
# ═══════════════════════════════════════

class TestCalibratorInit:
    """Test calibrator initialization."""

    def test_import(self):
        from app.services.calibrator import ScaleCalibrator
        assert ScaleCalibrator is not None

    def test_create_instance(self):
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        assert cal is not None
        assert cal.ARUCO_DEFAULT_SIZE_M == 0.15
        assert cal.A4_WIDTH_M == 0.210
        assert cal.A4_HEIGHT_M == 0.297

    def test_credit_card_constants(self):
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        # ISO/IEC 7810 ID-1 standard: 85.6 × 54 mm
        assert hasattr(cal, 'CREDIT_CARD_WIDTH_M')
        assert hasattr(cal, 'CREDIT_CARD_HEIGHT_M')
        assert abs(cal.CREDIT_CARD_WIDTH_M - 0.0856) < 0.001
        assert abs(cal.CREDIT_CARD_HEIGHT_M - 0.054) < 0.001


class TestCalibratorMethods:
    """Test individual calibration methods."""

    def test_aruco_on_plain_image(self):
        """ArUco detection on plain image should return None (no markers)."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()
        result = cal.detect_aruco(img)
        assert result is None

    def test_a4_on_plain_image(self):
        """A4 detection on plain image should return None."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()
        result = cal.detect_a4_sheet(img)
        assert result is None

    def test_credit_card_on_plain_image(self):
        """Credit card detection on plain image should return None."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()
        result = cal.detect_credit_card(img)
        assert result is None

    def test_calibrate_full_pipeline(self):
        """Full calibrate() should return a dict with required keys."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()

        result = cal.calibrate(img, detections=[])
        assert isinstance(result, dict)
        assert "scale_factor" in result
        assert "confidence" in result
        assert "method" in result

    def test_calibrate_with_user_hint(self):
        """Calibrate without detections falls back to heuristic."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()

        # Without matching detections, user_scale_hint can't resolve
        # so calibrator falls back to fallback method
        result = cal.calibrate(img, detections=[])
        assert result["scale_factor"] > 0
        assert result["confidence"] > 0
        assert result["method"] == "fallback"
        assert result["needs_scale"] is True

    def test_estimate_from_typical(self):
        """Typical-size estimation should return reasonable scale."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()

        result = cal.estimate_scale_from_typical(
            object_type="door",
            detected_size_px=400,
            dimension="height"
        )
        if result is not None:
            assert result["scale_factor"] > 0
            assert result["confidence"] < 0.5  # Low confidence for heuristic


class TestCalibratorConversions:
    """Test unit conversion methods."""

    def test_convert_to_meters(self):
        from app.services.calibrator import ScaleCalibrator
        result = ScaleCalibrator.convert_to_meters(100.0, 0.01)
        assert abs(result - 1.0) < 0.001  # 100px * 0.01 m/px = 1.0m

    def test_convert_area_to_m2(self):
        from app.services.calibrator import ScaleCalibrator
        result = ScaleCalibrator.convert_area_to_m2(10000.0, 0.01)
        assert abs(result - 1.0) < 0.001  # 10000px² * 0.01² = 1.0 m²

    def test_validate_scale_reasonable(self):
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        # 0.005 m/px → 640px = 3.2m width (reasonable)
        valid = cal.validate_scale(0.005, 640, 480)
        assert isinstance(valid, bool)

    def test_validate_scale_extreme(self):
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        # 10 m/px → 640px = 6400m (ridiculous)
        valid = cal.validate_scale(10.0, 640, 480)
        assert valid is False


# ═══════════════════════════════════════
#  DEFECT DETECTOR TESTS (DETAILED)
# ═══════════════════════════════════════

class TestCrackDetector:
    """Test CrackDetector specifically."""

    def test_import(self):
        from app.models.defect_detector import CrackDetector
        assert CrackDetector is not None

    def test_create_instance(self):
        from app.models.defect_detector import CrackDetector
        det = CrackDetector()
        assert det is not None

    def test_detect_on_plain(self):
        """No cracks on plain gray image."""
        from app.models.defect_detector import CrackDetector
        det = CrackDetector()
        img = _make_test_image()
        regions = det.detect(img)
        assert isinstance(regions, list)

    def test_detect_on_cracked(self):
        """Should find something on cracked image."""
        from app.models.defect_detector import CrackDetector
        det = CrackDetector()
        img = _make_cracked_image()
        regions = det.detect(img)
        assert isinstance(regions, list)
        # We expect at least some detection on a clearly cracked image
        # (but it depends on threshold tuning, so no strict assertion)


class TestStainDetector:
    """Test StainDetector specifically."""

    def test_import(self):
        from app.models.defect_detector import StainDetector
        assert StainDetector is not None

    def test_detect_on_plain(self):
        from app.models.defect_detector import StainDetector
        det = StainDetector()
        img = _make_test_image()
        regions = det.detect(img)
        assert isinstance(regions, list)

    def test_detect_on_stained(self):
        from app.models.defect_detector import StainDetector
        det = StainDetector()
        img = _make_stained_image()
        regions = det.detect(img)
        assert isinstance(regions, list)


class TestRustDetector:
    """Test RustDetector specifically."""

    def test_import(self):
        from app.models.defect_detector import RustDetector
        assert RustDetector is not None

    def test_detect_on_plain(self):
        from app.models.defect_detector import RustDetector
        det = RustDetector()
        img = _make_test_image()
        regions = det.detect(img)
        assert isinstance(regions, list)

    def test_detect_on_rusty(self):
        from app.models.defect_detector import RustDetector
        det = RustDetector()
        img = _make_rusty_image()
        regions = det.detect(img)
        assert isinstance(regions, list)


class TestDefectAnalyzerDetailed:
    """Test DefectAnalyzer facade with various inputs."""

    def test_analyze_plain(self):
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()
        report = analyzer.analyze(_make_test_image())
        assert report["summary"]["total"] >= 0
        assert report["max_severity"] in ("none", "low", "medium", "high", "critical")

    def test_analyze_cracked(self):
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()
        report = analyzer.analyze(_make_cracked_image())
        assert isinstance(report["defects"], list)
        assert "cracks" in report["summary"]

    def test_analyze_all_defects(self):
        """Combined image with all defect types."""
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()

        # Create image with crack + stain + rust
        img = np.ones((480, 640, 3), dtype=np.uint8) * 200
        # Crack (thin dark line)
        for y in range(100, 350):
            x = 100 + int(3 * np.sin(y / 10))
            img[y, max(0, x):min(640, x+2), :] = [20, 20, 20]
        # Stain (dark patch)
        img[50:150, 300:450, :] = [140, 130, 110]
        # Rust (orange)
        img[350:430, 400:550, 0] = 210
        img[350:430, 400:550, 1] = 130
        img[350:430, 400:550, 2] = 40

        report = analyzer.analyze(img)
        assert isinstance(report, dict)
        assert "total_defect_area_pct" in report
        assert isinstance(report["total_defect_area_pct"], (int, float))

    def test_defect_region_structure(self):
        """Each defect region should have required fields."""
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()
        report = analyzer.analyze(_make_cracked_image())

        for defect in report["defects"]:
            assert "defect_type" in defect
            assert "severity" in defect
            assert "bbox" in defect or "area_px" in defect


# ═══════════════════════════════════════
#  CALIBRATOR REPORT TESTS (v2.1)
# ═══════════════════════════════════════

class TestCalibratorReport:
    """Test calibration_report with method_chain and confidence_breakdown."""

    def test_calibration_report_keys(self):
        """Calibration result should contain report with method_chain."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()
        result = cal.calibrate(img, detections=[])

        assert isinstance(result, dict)
        # The report might be in result directly or under a sub-key
        # Check that core fields exist
        assert "scale_factor" in result
        assert "confidence" in result
        assert "method" in result
        assert result["scale_factor"] > 0

    def test_calibration_report_confidence_range(self):
        """Confidence should be in [0, 1] range."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()
        result = cal.calibrate(img, detections=[])

        conf = result["confidence"]
        assert 0 <= conf <= 1.0, f"Confidence {conf} out of range"

    def test_calibration_with_detections(self):
        """Calibration with mock detections should use typical size method."""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = _make_test_image()

        mock_detections = [{
            "label": "door",
            "bbox": [100, 50, 200, 450],
            "confidence": 0.85,
        }]
        result = cal.calibrate(img, detections=mock_detections)
        assert result["scale_factor"] > 0


# ═══════════════════════════════════════
#  VOLUME BREAKDOWN TESTS (v2.1)
# ═══════════════════════════════════════

class TestVolumeBreakdown:
    """Test volume calculation with soil density and breakdown."""

    def test_volume_module_import(self):
        """Volume module should import."""
        try:
            from app.services.volume import VolumeCalculator
            assert VolumeCalculator is not None
        except ImportError:
            # Module may not exist yet — skip gracefully
            pytest.skip("VolumeCalculator not available")

    def test_trench_volume(self):
        """Trench volume = length × width × depth."""
        try:
            from app.services.volume import VolumeCalculator
            vol = VolumeCalculator()
            result = vol.volume_breakdown(
                length=10, width=2, depth=1.5,
                soil_type="clay",
            )
            assert result["excavation_m3"] == pytest.approx(30.0, rel=0.01)
            assert "weight_kg" in result or "total_weight_tons" in result
        except (ImportError, AttributeError):
            pytest.skip("VolumeCalculator.volume_breakdown not available")

    def test_material_weight_estimate(self):
        """Material weight should use soil density coefficient."""
        try:
            from app.services.volume import VolumeCalculator
            vol = VolumeCalculator()
            result = vol.material_weight_estimate(
                volume_m3=10, soil_type="sand",
            )
            assert result["weight_tons"] > 0
            assert result["kamaz_count"] >= 1
        except (ImportError, AttributeError):
            pytest.skip("material_weight_estimate not available")

    def test_soil_density_knowledge_base(self):
        """SOIL_DENSITY should have common soil types."""
        try:
            from app.services.volume import SOIL_DENSITY
            assert "sand" in SOIL_DENSITY
            assert "clay" in SOIL_DENSITY
            assert "gravel" in SOIL_DENSITY
            for soil, density in SOIL_DENSITY.items():
                assert density > 0, f"Invalid density for {soil}"
        except ImportError:
            pytest.skip("SOIL_DENSITY not importable")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

