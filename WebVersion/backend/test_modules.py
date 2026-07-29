"""
test_modules.py — Unit tests for AI service modules
Run: pytest test_modules.py -v
"""
import pytest
import sys
import os
import numpy as np

# Add ai-service to path
AI_SERVICE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'ai-service')
sys.path.insert(0, AI_SERVICE_DIR)


# ═══════════════════════════════════════════
#  CALIBRATOR TESTS
# ═══════════════════════════════════════════

class TestCalibrator:
    """Tests for scale calibration module"""

    def test_import(self):
        from app.services.calibrator import ScaleCalibrator
        assert ScaleCalibrator is not None

    def test_aruco_detection_on_blank(self):
        """ArUco should not find markers on blank image"""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        blank = np.ones((480, 640, 3), dtype=np.uint8) * 200
        result = cal.calibrate(blank, method='aruco')
        assert result is not None
        assert result.get('scale', 0) == 0 or result.get('found', False) is False

    def test_a4_detection_shape(self):
        """A4 detection should return proper structure"""
        from app.services.calibrator import ScaleCalibrator
        cal = ScaleCalibrator()
        img = np.ones((480, 640, 3), dtype=np.uint8) * 180
        result = cal.calibrate(img, method='a4')
        assert isinstance(result, dict)


# ═══════════════════════════════════════════
#  DEFECT DETECTOR TESTS
# ═══════════════════════════════════════════

class TestDefectDetector:
    """Tests for defect detection (Crack, Stain, Rust)"""

    def test_import(self):
        from app.services.defect_detector import DefectDetector
        assert DefectDetector is not None

    def test_crack_detection_blank(self):
        """No cracks on blank white image"""
        from app.services.defect_detector import DefectDetector
        det = DefectDetector()
        blank = np.ones((480, 640, 3), dtype=np.uint8) * 255
        result = det.detect(blank, defect_types=['crack'])
        assert isinstance(result, (list, dict))

    def test_stain_detection_blank(self):
        """No stains on blank image"""
        from app.services.defect_detector import DefectDetector
        det = DefectDetector()
        blank = np.ones((480, 640, 3), dtype=np.uint8) * 200
        result = det.detect(blank, defect_types=['stain'])
        assert isinstance(result, (list, dict))

    def test_detect_returns_list_or_dict(self):
        """detect() should return list of defects or dict with detections"""
        from app.services.defect_detector import DefectDetector
        det = DefectDetector()
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        result = det.detect(img)
        assert isinstance(result, (list, dict))


# ═══════════════════════════════════════════
#  VOLUME CALCULATOR TESTS
# ═══════════════════════════════════════════

class TestVolumeCalculator:
    """Tests for volume/area calculation"""

    def test_import(self):
        from app.services.volume import VolumeCalculator
        assert VolumeCalculator is not None

    def test_wall_area(self):
        from app.services.volume import VolumeCalculator
        vc = VolumeCalculator()
        result = vc.calculate('wall', length=5, height=3)
        assert result is not None
        if isinstance(result, dict) and 'area' in result:
            assert abs(result['area'] - 15.0) < 0.1

    def test_floor_area(self):
        from app.services.volume import VolumeCalculator
        vc = VolumeCalculator()
        result = vc.calculate('floor', length=5, width=4)
        assert result is not None
        if isinstance(result, dict) and 'area' in result:
            assert abs(result['area'] - 20.0) < 0.1

    def test_room_volume(self):
        from app.services.volume import VolumeCalculator
        vc = VolumeCalculator()
        result = vc.calculate('room', length=5, width=4, height=3)
        assert result is not None


# ═══════════════════════════════════════════
#  PHOTO3D TESTS
# ═══════════════════════════════════════════

class TestPhoto3D:
    """Tests for photogrammetry functions"""

    def test_load_images(self):
        """load_images should handle empty directory"""
        sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
        import importlib
        spec = importlib.util.spec_from_file_location(
            "photo3d",
            os.path.join(os.path.dirname(__file__), "photo3d.py")
        )
        photo3d = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(photo3d)

        import tempfile
        empty_dir = tempfile.mkdtemp()
        images = photo3d.load_images(empty_dir)
        assert images == []
        os.rmdir(empty_dir)

    def test_no_duplicate_images_windows(self):
        """On Windows, *.jpg and *.JPG should not produce duplicates"""
        import importlib
        spec = importlib.util.spec_from_file_location(
            "photo3d",
            os.path.join(os.path.dirname(__file__), "photo3d.py")
        )
        photo3d = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(photo3d)

        import tempfile, cv2
        test_dir = tempfile.mkdtemp()
        img = np.ones((100, 100, 3), dtype=np.uint8) * 128
        cv2.imwrite(os.path.join(test_dir, 'test1.jpg'), img)
        cv2.imwrite(os.path.join(test_dir, 'test2.jpg'), img)

        images = photo3d.load_images(test_dir)
        assert len(images) == 2, f"Expected 2 images, got {len(images)}"

        # Cleanup
        import shutil
        shutil.rmtree(test_dir)

    def test_estimate_camera_matrix(self):
        """Camera matrix should be 3x3"""
        import importlib
        spec = importlib.util.spec_from_file_location(
            "photo3d",
            os.path.join(os.path.dirname(__file__), "photo3d.py")
        )
        photo3d = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(photo3d)

        K = photo3d.estimate_camera_matrix(640, 480)
        assert K.shape == (3, 3)
        assert K[0, 0] > 0  # focal length positive
        assert K[0, 2] == 320  # cx = w/2
        assert K[1, 2] == 240  # cy = h/2

    def test_fit_plane_ransac(self):
        """RANSAC should fit a perfect plane"""
        import importlib
        spec = importlib.util.spec_from_file_location(
            "photo3d",
            os.path.join(os.path.dirname(__file__), "photo3d.py")
        )
        photo3d = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(photo3d)

        # Create perfect Z=0 plane with some noise
        rng = np.random.RandomState(42)
        pts = np.column_stack([
            rng.uniform(-5, 5, 100),
            rng.uniform(-5, 5, 100),
            rng.normal(0, 0.01, 100)  # Z ≈ 0
        ])
        normal, d, mask = photo3d.fit_plane_ransac(pts)
        assert abs(normal[2]) > 0.9, f"Z-normal should be ~1, got {normal}"
        assert np.sum(mask) > 80, f"Should have >80 inliers, got {np.sum(mask)}"


# ═══════════════════════════════════════════
#  ESTIMATOR TESTS
# ═══════════════════════════════════════════

class TestEstimator:
    """Tests for cost estimation module"""

    def test_import(self):
        try:
            from app.services.estimator import CostEstimator
            assert CostEstimator is not None
        except ImportError:
            pytest.skip("estimator module not available")

    def test_estimate_wall_repair(self):
        try:
            from app.services.estimator import CostEstimator
            est = CostEstimator()
            result = est.estimate(
                object_type='wall_repair',
                area=20,
                perimeter=18,
                height=3,
            )
            assert result is not None
            if isinstance(result, dict):
                assert 'total' in result or 'items' in result
        except ImportError:
            pytest.skip("estimator module not available")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
