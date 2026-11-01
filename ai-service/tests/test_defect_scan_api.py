"""
QazGost AI — /api/v1/defect-scan: контракт ответа, обученная YOLO-модель, fallback.

Тесты с реальной моделью пропускаются, если нет ultralytics или весов models/defect_*.pt.
"""

import glob
import io
import os
import sys

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VAL_IMAGES = sorted(glob.glob(os.path.join(ROOT, "dataset", "merged", "images", "val", "*")))

CONTRACT_KEYS = {
    "success", "defectType", "severity", "snipCode", "fixMethod", "estimatedCost", "workDays",
    "defect_annotated_image", "defect_severity_summary", "defects", "detector", "is_mock", "fallback",
}
ITEM_KEYS = {"id", "type", "class", "severity", "confidence", "bbox", "model"}


@pytest.fixture(scope="module")
def client():
    from app.main import app
    from app.api.v1 import metrics

    metrics._rate_counts.clear()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def yolo():
    pytest.importorskip("ultralytics")
    from app.services.yolo_defect_scanner import get_yolo_defect_detector

    det = get_yolo_defect_detector()
    if not det.available:
        pytest.skip(f"defect model unavailable: {det.error}")
    return det


def _jpeg(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def _gt_count(img_path: str) -> int:
    lbl = img_path.replace(os.sep + "images" + os.sep, os.sep + "labels" + os.sep).rsplit(".", 1)[0] + ".txt"
    if not os.path.exists(lbl):
        return 0
    return sum(1 for line in open(lbl) if line.strip())


def test_conf_from_sensitivity_monotonic():
    from app.services.defect_scan import conf_from_sensitivity

    base = 0.5
    assert conf_from_sensitivity(0.5, base) == base == conf_from_sensitivity(0.65, base)
    assert conf_from_sensitivity(1.0, base) < base < conf_from_sensitivity(0.1, base)
    assert 0.05 <= conf_from_sensitivity(1.0, base) and conf_from_sensitivity(0.1, base) <= 0.95


def test_defect_catalog_covers_model_classes():
    from app.services import defect_catalog as cat

    for cls in ("crack", "corrosion", "spalling", "efflorescence", "damage", "stain"):
        assert cat.normalize_class(cls) == cls
        assert cat.fix_method(cls) and cat.snip_code(cls) and cat.class_ru(cls)
    items = [{"class": "corrosion", "severity": "high"}, {"class": "stain", "severity": "low"}]
    cost = cat.estimate_cost(items)
    assert 0 < cost["min_kzt"] < cost["max_kzt"]
    assert cat.work_days(items) >= 1


def test_defect_scan_contract_on_val_images(client, yolo):
    if not VAL_IMAGES:
        pytest.skip("dataset/merged/images/val not present")
    found = 0
    for path in [p for p in VAL_IMAGES if _gt_count(p) > 0][:5]:
        with open(path, "rb") as f:
            r = client.post("/api/v1/defect-scan", files={"file": (os.path.basename(path), f, "image/jpeg")})
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert CONTRACT_KEYS <= set(d), CONTRACT_KEYS - set(d)
        assert d["success"] is True and d["is_mock"] is False and d["fallback"] is False
        assert d["detector"]["engine"] == "yolo"
        assert d["detector"]["name"].startswith("YOLO")
        assert d["detector"]["model_file"].startswith("defect_")
        assert d["defect_annotated_image"].startswith("data:image/jpeg;base64,")
        assert d["defects"]["total"] == len(d["defects"]["items"])
        w, h = Image.open(path).size
        for it in d["defects"]["items"]:
            assert ITEM_KEYS <= set(it)
            assert it["model"] == "yolo"
            assert it["severity"] in ("critical", "high", "medium", "low")
            x1, y1, x2, y2 = it["bbox"]
            assert 0 <= x1 < x2 <= w and 0 <= y1 < y2 <= h
        found += d["defects"]["total"] > 0
    assert found >= 3, "модель должна находить трещины на большинстве размеченных val-фото"


def test_bbox_in_original_pixels_after_downscale(client, yolo):
    if not VAL_IMAGES:
        pytest.skip("no val images")
    path = next(p for p in VAL_IMAGES if _gt_count(p) > 0)
    small = Image.open(path).convert("RGB")
    big = small.resize((small.width * 5, small.height * 5))       # 2080px > 1600 → сервис уменьшает
    d_small = client.post("/api/v1/defect-scan", files={"file": ("s.jpg", _jpeg(small), "image/jpeg")}).json()
    d_big = client.post("/api/v1/defect-scan", files={"file": ("b.jpg", _jpeg(big), "image/jpeg")}).json()
    assert d_big["image"]["width"] == big.width and d_big["image"]["processed_width"] <= 1600
    if d_small["defects"]["items"] and d_big["defects"]["items"]:
        bs, bb = d_small["defects"]["items"][0]["bbox"], d_big["defects"]["items"][0]["bbox"]
        # та же трещина: координаты на большом фото ≈ ×5 (допуск — разные пиксели после ресайза)
        assert abs(bb[2] - bb[0] - 5 * (bs[2] - bs[0])) <= 0.2 * 5 * (bs[2] - bs[0]) + 10


def test_no_defects_on_flat_image(client, yolo):
    img = Image.new("RGB", (640, 480), (150, 150, 150))
    d = client.post("/api/v1/defect-scan", files={"file": ("g.jpg", _jpeg(img), "image/jpeg")}).json()
    assert d["defects"]["total"] == 0
    assert d["defectType"] == "Дефектов не обнаружено"
    assert d["estimatedCost"] == "0 ₸"


def test_fallback_to_cv_when_model_missing(client, monkeypatch):
    from app.config import settings
    from app.services import yolo_defect_scanner as yds

    monkeypatch.setattr(settings, "DEFECT_MODEL_PATH", "models/does_not_exist.pt")
    yds.reset_yolo_defect_detector()
    try:
        import cv2
        arr = np.full((480, 640, 3), 150, np.uint8)
        cv2.line(arr, (320, 100), (320, 400), (20, 20, 20), 3)
        r = client.post("/api/v1/defect-scan", files={"file": ("c.jpg", _jpeg(Image.fromarray(arr)), "image/jpeg")})
        assert r.status_code == 200  # раньше — 500 (fillPoly по bool-маске)
        d = r.json()
        assert d["fallback"] is True and d["detector"]["engine"] in ("cv", "roboflow")
        assert d["warnings"]
        for it in d["defects"]["items"]:
            assert ITEM_KEYS <= set(it)
    finally:
        monkeypatch.undo()
        yds.reset_yolo_defect_detector()
