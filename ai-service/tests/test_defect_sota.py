import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import cv2

from app.models.defect_detector import CrackDetector, SpallingDetector, StainDetector, RustDetector, get_defect_analyzer
from app.models.defect_nn import get_defect_nn, DEFECT_CLASSES, SNIP_MAPPING
from app.services.defect_precision import get_precision_defect_pipeline
from app.services.cv_defect_scanner import scan_defects
from app.services.pipeline import create_pipeline

P = F = 0

def check(name, fn):
    global P, F
    try:
        ok, msg = fn()
        if ok:
            P += 1
            print(f"  ✅ PASS: {name} -- {msg}")
        else:
            F += 1
            print(f"  ❌ FAIL: {name} -- {msg}")
    except Exception as e:
        F += 1
        print(f"  ❌ ERROR: {name} -- {e}")

print("\n" + "="*60)
print("  QAZGOST AI - DEFECT DETECTION SOTA TEST SUITE")
print("="*60)

# 1. Test SNiP Mapping & Classes
def test_snip():
    assert len(DEFECT_CLASSES) == 14, f"Expected 14 defect classes, got {len(DEFECT_CLASSES)}"
    for cls in DEFECT_CLASSES:
        assert cls in SNIP_MAPPING, f"Missing SNIP mapping for {cls}"
        assert "snip_code" in SNIP_MAPPING[cls]
        assert "cost_per_m2" in SNIP_MAPPING[cls]
    return True, f"14 defect classes with full SNiP/SP codes verified"

check("SNiP 14 Classes Mapping", test_snip)

# 2. Test CrackDetector Multi-Scale
def test_crack_detector():
    img = np.ones((400, 400, 3), dtype=np.uint8) * 180
    # Draw vertical structural crack
    cv2.line(img, (200, 50), (200, 350), (30, 30, 30), 4)
    # Draw fine hairline crack
    cv2.line(img, (100, 100), (120, 250), (60, 60, 60), 1)

    cd = CrackDetector()
    defects = cd.detect(img)
    assert len(defects) >= 1, f"Expected at least 1 crack detected, got {len(defects)}"
    has_high = any(d.severity in ["high", "medium"] for d in defects)
    assert has_high, "Expected structural crack with high/medium severity"
    return True, f"Found {len(defects)} crack(s) with multi-scale severity"

check("CrackDetector Multi-Scale", test_crack_detector)

# 3. Test SpallingDetector
def test_spalling_detector():
    img = np.ones((400, 400, 3), dtype=np.uint8) * 180
    # Draw rough textured spall region
    cv2.rectangle(img, (50, 50), (120, 120), (50, 50, 50), -1)
    # Add noise to simulate spall texture
    noise = np.random.randint(0, 80, (70, 70, 3), dtype=np.uint8)
    img[50:120, 50:120] = np.clip(img[50:120, 50:120] + noise, 0, 255)

    sd = SpallingDetector()
    defects = sd.detect(img)
    assert len(defects) >= 1, f"Expected spalling detected, got {len(defects)}"
    return True, f"Found {len(defects)} spall defect(s)"

check("SpallingDetector Roughness/Notch", test_spalling_detector)

# 4. Test DefectAnalyzer Integration
def test_defect_analyzer():
    img = np.ones((500, 500, 3), dtype=np.uint8) * 160
    cv2.line(img, (250, 50), (250, 450), (20, 20, 20), 3)
    analyzer = get_defect_analyzer()
    res = analyzer.analyze(img)
    assert "summary" in res
    assert "recommendations" in res
    assert res["summary"]["total"] >= 1
    return True, f"Full defect report generated (total={res['summary']['total']}, recs={len(res['recommendations'])})"

check("DefectAnalyzer Summary & Recommendations", test_defect_analyzer)

# 5. Test Two-Stage Precision Defect Pipeline
def test_precision_pipeline():
    img = np.ones((400, 400, 3), dtype=np.uint8) * 170
    cv2.line(img, (200, 50), (200, 350), (25, 25, 25), 3)
    pipe = get_precision_defect_pipeline()
    defects = pipe.detect_and_refine(img, confidence=0.25)
    assert isinstance(defects, list)
    return True, f"Precision pipeline executed ({len(defects)} defects found)"

check("Two-Stage Precision Pipeline (YOLO+SAM)", test_precision_pipeline)

# 6. Test CV Defect Scanner (Well Rings & Pipes)
def test_cv_defect_scanner():
    img = np.ones((480, 640, 3), dtype=np.uint8) * 150
    # Simulate pipe concrete with vertical fissure
    cv2.line(img, (320, 100), (320, 400), (20, 20, 20), 3)
    res = scan_defects(img, sensitivity=0.65)
    assert "defects" in res
    assert "annotated_image" in res
    assert len(res["defects"]) >= 1
    d0 = res["defects"][0]
    assert "opening_mm" in d0
    assert "confidence" in d0
    return True, f"Detected #{d0['id']} {d0['type']} (conf={d0['confidence']}, opening={d0['opening_mm']}mm)"

check("CV Defect Scanner Autonomous Run", test_cv_defect_scanner)

# 7. Test Pipeline LRU Caching
def test_pipeline_caching():
    pipeline = create_pipeline(region="almaty")
    img = np.ones((200, 200, 3), dtype=np.uint8) * 150
    res1 = pipeline.run(img, generate_estimate=False, detect_defects=False)
    res2 = pipeline.run(img, generate_estimate=False, detect_defects=False)
    assert res2.get("from_cache") is True, "Expected second run to hit LRU cache"
    return True, "Pipeline LRU caching verified (100% cache hit on duplicate image)"

check("Pipeline LRU Caching", test_pipeline_caching)

print("\n" + "="*60)
print(f"RESULTS: {P}/{P+F} tests passed ({P*100//(P+F) if P+F else 0}%)")
if F == 0:
    print("🎯 ALL DEFECT SOTA TESTS PASSED!")
else:
    print(f"⚠️ {F} test(s) failed.")
    sys.exit(1)
