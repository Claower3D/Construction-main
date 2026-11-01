"""
QAZGOST AI — Defect detection SOTA tests (pytest).

Раньше файл выполнял проверки при импорте и вызывал sys.exit(1), что обрывало весь сбор pytest.
Теперь это обычные тест-функции.
"""

import os
import sys

import cv2
import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def test_snip_14_classes_mapping():
    from app.models.defect_nn import DEFECT_CLASSES, SNIP_MAPPING

    assert len(DEFECT_CLASSES) == 14, f"Expected 14 defect classes, got {len(DEFECT_CLASSES)}"
    for cls in DEFECT_CLASSES:
        assert cls in SNIP_MAPPING, f"Missing SNIP mapping for {cls}"
        assert "snip_code" in SNIP_MAPPING[cls]
        assert "cost_per_m2" in SNIP_MAPPING[cls]


def test_crack_detector_multiscale():
    from app.models.defect_detector import CrackDetector

    img = np.ones((400, 400, 3), dtype=np.uint8) * 180
    cv2.line(img, (200, 50), (200, 350), (30, 30, 30), 4)      # structural crack
    cv2.line(img, (100, 100), (120, 250), (60, 60, 60), 1)     # hairline crack
    defects = CrackDetector().detect(img)
    assert len(defects) >= 1
    assert any(d.severity in ["high", "medium"] for d in defects)


def test_spalling_detector():
    from app.models.defect_detector import SpallingDetector

    rng = np.random.default_rng(0)
    img = np.ones((400, 400, 3), dtype=np.uint8) * 180
    cv2.rectangle(img, (50, 50), (120, 120), (50, 50, 50), -1)
    noise = rng.integers(0, 80, (70, 70, 3), dtype=np.uint8)
    img[50:120, 50:120] = np.clip(img[50:120, 50:120] + noise, 0, 255)
    assert len(SpallingDetector().detect(img)) >= 1


def test_defect_analyzer_summary():
    from app.models.defect_detector import get_defect_analyzer

    img = np.ones((500, 500, 3), dtype=np.uint8) * 160
    cv2.line(img, (250, 50), (250, 450), (20, 20, 20), 3)
    res = get_defect_analyzer().analyze(img)
    assert "summary" in res and "recommendations" in res
    assert res["summary"]["total"] >= 1


def test_precision_pipeline_runs():
    from app.services.defect_precision import get_precision_defect_pipeline

    img = np.ones((400, 400, 3), dtype=np.uint8) * 170
    cv2.line(img, (200, 50), (200, 350), (25, 25, 25), 3)
    res = get_precision_defect_pipeline().detect_and_refine(img, confidence=0.25)
    assert isinstance(res, dict) and isinstance(res["defects"], list)
    assert len(res["defects"]) >= 1


def test_cv_defect_scanner_finds_crack_without_crash():
    """Regression: claimed_mask был bool → cv2.fillPoly падал на любом найденном дефекте."""
    from app.services.cv_defect_scanner import scan_defects

    img = np.ones((480, 640, 3), dtype=np.uint8) * 150
    cv2.line(img, (320, 100), (320, 400), (20, 20, 20), 3)
    res = scan_defects(img, sensitivity=0.65)
    assert "defects" in res and "annotated_image" in res
    assert len(res["defects"]) >= 1
    d0 = res["defects"][0]
    assert "opening_mm" in d0 and "confidence" in d0


def test_pipeline_lru_cache():
    from app.services.pipeline import create_pipeline

    pipeline = create_pipeline(region="almaty")
    img = np.ones((200, 200, 3), dtype=np.uint8) * 150
    pipeline.run(img, generate_estimate=False, detect_defects=False)
    res2 = pipeline.run(img, generate_estimate=False, detect_defects=False)
    assert res2.get("from_cache") is True
