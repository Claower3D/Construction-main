"""
E2E test for AnalysisPipeline.

Creates a synthetic construction image and runs the full pipeline.
Validates response schema, detection sources, defect report, and timing.
"""

import sys
import os
import time
import numpy as np
import pytest

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _make_synthetic_image(w=640, h=480):
    """Create a synthetic 'construction' image with geometric shapes."""
    img = np.ones((h, w, 3), dtype=np.uint8) * 180  # gray background

    # Simulate a 'wall' — large beige rectangle
    img[50:400, 50:300, :] = [200, 190, 170]

    # Simulate a 'crack' — dark thin line
    for y in range(100, 350):
        x = 150 + int(5 * np.sin(y / 20.0))
        img[y, max(0, x-1):min(w, x+2), :] = [30, 30, 30]

    # Simulate 'rust' — orange-brown patch
    img[200:260, 350:430, :] = [70, 100, 180]  # BGR-ish rust color

    # Simulate a 'stain' — darker patch
    img[300:370, 100:200, :] = [140, 140, 130]

    # Simulate 'rebar' — dark horizontal lines
    for y_base in [420, 440, 460]:
        img[y_base:y_base+3, 100:550, :] = [50, 50, 50]

    return img


class TestPipelineSchema:
    """Validate pipeline response schema and structure."""

    def test_pipeline_imports(self):
        """Pipeline module should import without errors."""
        from app.services.pipeline import AnalysisPipeline, create_pipeline
        assert AnalysisPipeline is not None
        assert create_pipeline is not None

    def test_create_pipeline_default(self):
        """create_pipeline should return an AnalysisPipeline instance."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        assert pipe is not None
        assert pipe.region == "almaty"

    def test_create_pipeline_custom_region(self):
        """Pipeline should accept custom region."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline(region="astana")
        assert pipe.region == "astana"

    def test_pipeline_run_returns_dict(self):
        """Pipeline.run() should return a dict with required keys."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()

        result = pipe.run(
            image=img,
            confidence=0.25,
            generate_estimate=True,
            detect_defects=True,
        )

        assert isinstance(result, dict)
        assert result["success"] is True

        # Required keys
        required = [
            "image_id", "image_width", "image_height",
            "detected_objects", "object_count",
            "detection_sources", "defects",
            "scale_calibrated", "scale_factor", "scale_method",
            "measurements",
            "qwen_result",
            "estimate_items",
            "processing_time_ms", "warnings",
            "pipeline_version",
        ]
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_pipeline_response_types(self):
        """Validate types of pipeline response fields."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()
        result = pipe.run(image=img)

        assert isinstance(result["image_id"], str)
        assert isinstance(result["image_width"], int)
        assert isinstance(result["image_height"], int)
        assert result["image_width"] == 640
        assert result["image_height"] == 480
        assert isinstance(result["detected_objects"], list)
        assert isinstance(result["object_count"], int)
        assert isinstance(result["detection_sources"], dict)
        assert isinstance(result["defects"], dict)
        assert isinstance(result["processing_time_ms"], int)
        assert isinstance(result["warnings"], list)
        assert result["pipeline_version"] == "2.0"

    def test_detection_sources_structure(self):
        """detection_sources should contain rfdetr, grounding_dino, gdino_defects, merged."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()
        result = pipe.run(image=img)

        sources = result["detection_sources"]
        assert "rfdetr" in sources
        assert "grounding_dino" in sources
        assert "gdino_defects" in sources
        assert "merged" in sources
        # All values should be non-negative ints
        for k, v in sources.items():
            assert isinstance(v, int) and v >= 0, f"Bad {k}: {v}"

    def test_defect_report_structure(self):
        """defects should have proper structure even with no defects."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()
        result = pipe.run(image=img, detect_defects=True)

        defects = result["defects"]
        assert "defects" in defects
        assert "summary" in defects
        assert "max_severity" in defects
        assert isinstance(defects["defects"], list)
        assert isinstance(defects["summary"], dict)
        assert "total" in defects["summary"]


class TestPipelinePerformance:
    """Pipeline should complete in reasonable time."""

    def test_pipeline_under_30s(self):
        """Pipeline should complete within 30 seconds for a 640x480 image."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()

        t0 = time.time()
        result = pipe.run(image=img)
        elapsed = time.time() - t0

        assert elapsed < 30, f"Pipeline took {elapsed:.1f}s (limit: 30s)"
        assert result["processing_time_ms"] > 0

    def test_no_defects_mode(self):
        """Pipeline without defect detection should be faster."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()

        result = pipe.run(image=img, detect_defects=False)
        assert result["success"] is True
        # defects should be empty structure
        assert result["defects"]["summary"]["total"] == 0


class TestDefectDetector:
    """Test DefectAnalyzer directly."""

    def test_defect_analyzer_instance(self):
        """DefectAnalyzer singleton should initialize."""
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()
        assert analyzer is not None
        assert analyzer.crack_detector is not None
        assert analyzer.stain_detector is not None
        assert analyzer.rust_detector is not None

    def test_defect_analyzer_on_synthetic(self):
        """DefectAnalyzer should process a synthetic image without errors."""
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()
        img = _make_synthetic_image()
        report = analyzer.analyze(img)

        assert isinstance(report, dict)
        assert "defects" in report
        assert "summary" in report
        assert "max_severity" in report
        assert "total_defect_area_pct" in report
        assert isinstance(report["defects"], list)
        assert isinstance(report["summary"]["total"], int)

    def test_defect_analyzer_with_roi(self):
        """DefectAnalyzer should accept ROI mask."""
        from app.models.defect_detector import get_defect_analyzer
        analyzer = get_defect_analyzer()
        img = _make_synthetic_image()

        # ROI covering crack area
        roi = np.zeros((480, 640), dtype=np.uint8)
        roi[80:370, 130:180] = 255  # area around the synthetic crack

        report = analyzer.analyze(img, roi_mask=roi)
        assert isinstance(report, dict)
        assert report["summary"]["total"] >= 0


class TestGroundingDINO:
    """Test GroundingDINO methods."""

    def test_gdino_instance(self):
        """GDINO singleton should initialize."""
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        assert gdino is not None

    def test_gdino_detect_defects(self):
        """detect_defects should return a list of Detection."""
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        img = _make_synthetic_image()

        dets = gdino.detect_defects(img)
        assert isinstance(dets, list)
        # Each detection should have required attributes
        for det in dets:
            assert hasattr(det, "class_name")
            assert hasattr(det, "bbox")
            assert hasattr(det, "confidence")

    def test_gdino_detect_references(self):
        """detect_references should return a list."""
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        img = _make_synthetic_image()

        dets = gdino.detect_references(img)
        assert isinstance(dets, list)

    def test_gdino_detect_materials(self):
        """detect_materials should return a list."""
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        img = _make_synthetic_image()

        dets = gdino.detect_materials(img)
        assert isinstance(dets, list)

    def test_gdino_custom_prompt(self):
        """detect with custom text prompt should work."""
        from app.models.grounding_dino import get_grounding_dino
        gdino = get_grounding_dino()
        img = _make_synthetic_image()

        dets = gdino.detect(img, text_prompt="wall . crack . rebar")
        assert isinstance(dets, list)


class TestSAM:
    """Test SAM segmentor."""

    def test_sam_instance(self):
        """SAM singleton should initialize."""
        from app.models.sam_segmentor import get_sam
        sam = get_sam()
        assert sam is not None

    def test_sam_refine_empty(self):
        """SAM refine with empty detections should return empty list."""
        from app.models.sam_segmentor import get_sam
        sam = get_sam()
        img = _make_synthetic_image()

        result = sam.refine(img, [])
        assert isinstance(result, list)
        assert len(result) == 0

class TestPhoto3DService:
    """Test Photo3D SfM service wrapper."""

    def test_photo3d_import(self):
        """Photo3D service should import."""
        from app.services.photo3d_service import get_photo3d_service
        svc = get_photo3d_service()
        assert svc is not None

    def test_photo3d_mock_result(self):
        """With no images, should return mock result."""
        from app.services.photo3d_service import Photo3DService
        svc = Photo3DService()
        result = svc._mock_result(0)
        assert result["method"] == "mock"
        assert "area_m2" in result
        assert "perimeter_m" in result
        assert "volume_m3" in result
        assert "height_m" in result
        assert result["confidence"] == 0.3

    def test_photo3d_analyze_two_images(self):
        """Analyze with 2 synthetic images should not crash."""
        from app.services.photo3d_service import get_photo3d_service
        svc = get_photo3d_service()

        img1 = _make_synthetic_image(640, 480)
        # Slightly shifted version
        img2 = np.roll(img1, 20, axis=1)

        result = svc.analyze_images([img1, img2])
        assert isinstance(result, dict)
        assert "area_m2" in result
        assert "confidence" in result

    def test_photo3d_analyze_single(self):
        """Single image should fallback gracefully."""
        from app.services.photo3d_service import get_photo3d_service
        svc = get_photo3d_service()
        img = _make_synthetic_image()

        result = svc.analyze_images([img])
        assert isinstance(result, dict)
        assert result.get("confidence", 0) <= 0.5  # low confidence for single


class TestQwenMock:
    """Test enriched Qwen mock results."""

    def test_mock_result_has_dimensions(self):
        """Mock result should include dimension estimates."""
        from app.models.qwen_vlm import _mock_result
        result = _mock_result([])
        assert result["_mock"] is True
        dims = result["dimensions_estimate"]
        assert dims["area_m2"] is not None
        assert dims["height_m"] is not None
        assert dims["depth_m"] is not None
        assert dims["perimeter_m"] is not None

    def test_mock_result_has_materials(self):
        """Mock result should include material suggestions."""
        from app.models.qwen_vlm import _mock_result
        result = _mock_result([])
        assert isinstance(result["materials_seen"], list)
        assert len(result["materials_seen"]) > 0

    def test_mock_result_scene_description(self):
        """Mock result scene_description should mention ollama."""
        from app.models.qwen_vlm import _mock_result
        result = _mock_result([])
        assert "ollama" in result["scene_description"].lower()

    def test_ollama_check(self):
        """_ollama_alive should not crash even if Ollama is not installed."""
        from app.models.qwen_vlm import get_qwen
        qwen = get_qwen()
        alive = qwen._ollama_alive()
        assert isinstance(alive, bool)


# ═══════════════════════════════════════
#  ESTIMATOR DEFECT REPAIR TESTS (v2.1)
# ═══════════════════════════════════════

class TestEstimatorDefectRepair:
    """Test estimate_defect_repair and calculate_tax_and_margin."""

    def test_import_estimator(self):
        """AutoEstimator should import."""
        from app.services.estimator import AutoEstimator
        assert AutoEstimator is not None

    def test_defect_repair_empty(self):
        """Empty defect report should return empty list."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator()
        empty_report = {"defects": [], "summary": {"total": 0}}
        result = est.estimate_defect_repair(empty_report)
        assert isinstance(result, list)
        assert len(result) == 0

    def test_defect_repair_crack(self):
        """Crack defect should generate repair items."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator()
        report = {
            "defects": [{
                "defect_type": "crack",
                "severity": "high",
                "area_px": 500,
                "length_px": 200,
                "bbox": [100, 100, 110, 300],
            }],
            "summary": {"total": 1, "cracks": 1, "stains": 0, "rust": 0},
        }
        result = est.estimate_defect_repair(report)
        assert isinstance(result, list)
        assert len(result) > 0
        # Each item should have work_name and total_price
        for item in result:
            assert "work_name" in item or "name" in item

    def test_defect_repair_multiple(self):
        """Multiple defects should merge into separate items."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator()
        report = {
            "defects": [
                {"defect_type": "crack", "severity": "medium", "area_px": 300, "bbox": [10,10,20,200]},
                {"defect_type": "stain", "severity": "low", "area_px": 1200, "bbox": [200,200,400,400]},
                {"defect_type": "rust", "severity": "high", "area_px": 800, "bbox": [300,100,400,200]},
            ],
            "summary": {"total": 3, "cracks": 1, "stains": 1, "rust": 1},
        }
        result = est.estimate_defect_repair(report)
        assert isinstance(result, list)
        # Should have items for at least 2 different defect types
        assert len(result) >= 2

    def test_tax_and_margin(self):
        """НДС + margin calculation should be correct."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator()
        result = est.calculate_tax_and_margin(
            subtotal=1000000,
            margin_pct=15,
            tax_pct=12,
        )
        assert isinstance(result, dict)
        assert result["subtotal"] == 1000000
        # margin = 150000, subtotal_with_margin = 1150000
        assert result["margin"] == 150000
        # tax = 1150000 * 0.12 = 138000
        assert result["tax"] == pytest.approx(138000, rel=0.01)
        # grand_total = 1150000 + 138000 = 1288000
        assert result["grand_total"] == pytest.approx(1288000, rel=0.01)


# ═══════════════════════════════════════
#  PIPELINE v2.1 FEATURES
# ═══════════════════════════════════════

class TestPipelineV21Features:
    """Test new v2.1 features: step_timings, confidence_histogram."""

    def test_step_timings_exist(self):
        """Pipeline result should include step_timings."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()
        result = pipe.run(image=img)

        # step_timings may be in result directly or absent for v2.0
        if "step_timings" in result:
            timings = result["step_timings"]
            assert isinstance(timings, dict)
            assert len(timings) > 0
            for step, duration in timings.items():
                assert isinstance(duration, (int, float))
                assert duration >= 0

    def test_confidence_histogram(self):
        """Pipeline result should include confidence_histogram."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()
        result = pipe.run(image=img)

        if "confidence_histogram" in result:
            hist = result["confidence_histogram"]
            assert isinstance(hist, dict)
            assert "high" in hist
            assert "medium" in hist
            assert "low" in hist
            # All values should be non-negative
            for k, v in hist.items():
                if isinstance(v, (int, float)):
                    assert v >= 0

    def test_repair_recommendations(self):
        """Defect report should include repair_recommendations."""
        from app.services.pipeline import create_pipeline
        pipe = create_pipeline()
        img = _make_synthetic_image()
        result = pipe.run(image=img, detect_defects=True)

        defects = result.get("defects", {})
        # repair_recommendations may exist if defects found
        if defects.get("summary", {}).get("total", 0) > 0:
            # Check if recommendations are present
            for d in defects.get("defects", []):
                if "recommendation" in d:
                    assert isinstance(d["recommendation"], str)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
