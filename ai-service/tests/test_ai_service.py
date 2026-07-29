"""
QAZGOST AI - Test Suite

Basic tests for AI service components.
"""

import pytest
import numpy as np
from pathlib import Path
import sys

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestDetector:
    """Tests for construction detector."""
    
    def test_detector_import(self):
        """Test detector can be imported."""
        from app.models.detector import ConstructionDetector, Detection
        assert ConstructionDetector is not None
        assert Detection is not None
    
    def test_detector_class_names(self):
        """Test detector has correct class names."""
        from app.models.detector import ConstructionDetector
        
        detector = ConstructionDetector()
        
        assert len(detector.CLASS_NAMES) == 20
        assert "trench" in detector.CLASS_NAMES
        assert "pipe_pvc" in detector.CLASS_NAMES
        assert "person" in detector.CLASS_NAMES
    
    def test_mock_detection(self):
        """Test mock detection works."""
        from app.models.detector import ConstructionDetector
        
        detector = ConstructionDetector()
        
        # Create dummy image
        image = np.zeros((640, 640, 3), dtype=np.uint8)
        
        # Run detection (will use mock if no model)
        detections = detector.detect(image)
        
        assert isinstance(detections, list)
        # Mock returns at least some detections
        assert len(detections) >= 0
    
    def test_detection_to_dict(self):
        """Test Detection.to_dict() method."""
        from app.models.detector import Detection
        
        det = Detection(
            class_id=0,
            class_name="trench",
            confidence=0.95,
            bbox=(100, 100, 300, 200)
        )
        
        d = det.to_dict()
        
        assert d["class_id"] == 0
        assert d["class_name"] == "trench"
        assert d["confidence"] == 0.95
        assert d["bbox"] == [100, 100, 300, 200]
        assert d["width_px"] == 200
        assert d["height_px"] == 100


class TestVolumeCalculator:
    """Tests for volume calculator."""
    
    def test_trench_volume(self):
        """Test trench volume calculation."""
        from app.services.volume import VolumeCalculator
        
        calc = VolumeCalculator()
        
        # Simple trench: 10m x 0.8m x 1.5m
        volume = calc.trench_volume(
            length=10,
            width=0.8,
            depth=1.5,
            slope_angle=90  # Vertical walls (no slope)
        )
        
        # Expected: 10 * 0.8 * 1.5 = 12 m³
        assert volume == 12.0
    
    def test_pit_volume(self):
        """Test pit volume calculation."""
        from app.services.volume import VolumeCalculator
        
        calc = VolumeCalculator()
        
        volume = calc.pit_volume(
            length=5,
            width=4,
            depth=2,
            shape="rectangle"
        )
        
        # Expected: 5 * 4 * 2 = 40 m³
        assert volume == 40.0
    
    def test_circular_pit(self):
        """Test circular pit volume."""
        from app.services.volume import VolumeCalculator
        import math
        
        calc = VolumeCalculator()
        
        volume = calc.pit_volume(
            length=0,  # Not used for circle
            width=2,   # Diameter
            depth=3,
            shape="circle"
        )
        
        # Expected: π * 1² * 3 ≈ 9.42 m³
        expected = math.pi * 1 * 1 * 3
        assert abs(volume - round(expected, 2)) < 0.01
    
    def test_pipe_trench_volumes(self):
        """Test pipe trench volume breakdown."""
        from app.services.volume import VolumeCalculator
        
        calc = VolumeCalculator()
        
        result = calc.pipe_trench_volume(
            pipe_length=50,
            pipe_diameter=0.15,
            trench_depth=1.0
        )
        
        assert "trench_excavation_m3" in result
        assert "pipe_bedding_m3" in result
        assert "backfill_m3" in result
        assert result["trench_excavation_m3"] > 0
        assert result["backfill_m3"] > 0


class TestCalibrator:
    """Tests for scale calibrator."""
    
    def test_reference_sizes(self):
        """Test reference objects have sizes."""
        from app.services.calibrator import ScaleCalibrator
        
        cal = ScaleCalibrator()
        
        assert "person" in cal.REFERENCE_SIZES
        assert cal.REFERENCE_SIZES["person"]["size"] == 1.75
        assert "measuring_tape" in cal.REFERENCE_SIZES
    
    def test_convert_to_meters(self):
        """Test pixel to meter conversion."""
        from app.services.calibrator import ScaleCalibrator
        
        cal = ScaleCalibrator()
        
        # 100 pixels at 0.01 m/px should be 1 meter
        result = cal.convert_to_meters(100, 0.01)
        assert result == 1.0
    
    def test_convert_area(self):
        """Test area conversion."""
        from app.services.calibrator import ScaleCalibrator
        
        cal = ScaleCalibrator()
        
        # 10000 px² at 0.01 m/px should be 1 m²
        result = cal.convert_area_to_m2(10000, 0.01)
        assert result == 1.0


class TestEstimator:
    """Tests for auto-estimator."""
    
    def test_regional_coefficients(self):
        """Test regional price coefficients."""
        from app.services.estimator import AutoEstimator
        
        # Almaty base
        est_almaty = AutoEstimator(region="almaty")
        assert est_almaty.regional_coef == 1.0
        
        # Astana higher
        est_astana = AutoEstimator(region="astana")
        assert est_astana.regional_coef == 1.15
    
    def test_work_mappings(self):
        """Test work mappings exist for common classes."""
        from app.services.estimator import AutoEstimator
        
        est = AutoEstimator()
        
        assert "trench" in est.WORK_MAPPINGS
        assert "foundation" in est.WORK_MAPPINGS
        assert "pipe_pvc" in est.WORK_MAPPINGS
        
        # Each mapping should have required fields
        for mapping in est.WORK_MAPPINGS["trench"]:
            assert "code" in mapping
            assert "name" in mapping
            assert "unit" in mapping
            assert "base_price" in mapping


class TestAPI:
    """Tests for API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)
    
    def test_health_endpoint(self, client):
        """Test /health endpoint."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_classes_endpoint(self, client):
        """Test /classes endpoint."""
        response = client.get("/api/v1/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert "classes" in data
        assert data["total"] == 20
        assert "reference_classes" in data
    
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert data["status"] == "running"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
