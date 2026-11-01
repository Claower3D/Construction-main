"""
QazGost AI — integration tests (in-process, FastAPI TestClient; живой сервер не нужен).

Раньше это был скрипт, который ходил на localhost:8001, а pytest собирал его хелпер `test(name, fn)`
как тест (ошибка "fixture 'name' not found"). Тела запросов тоже устарели (sewage без length_m → 422).
"""

import io
import json
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="module")
def client():
    from app.main import app
    from app.api.v1 import metrics

    metrics._rate_counts.clear()
    with TestClient(app) as c:
        yield c
    metrics._rate_counts.clear()


# ── Core ────────────────────────────────────────────────────────────────

def test_root_and_health(client):
    assert client.get("/").status_code == 200
    r = client.get("/health")  # ожидается Go-прокси и docker healthcheck
    assert r.status_code == 200 and r.json()["status"] == "healthy"
    assert client.get("/api/v1/health").status_code == 200
    assert client.get("/docs").status_code == 200


def test_health_detailed_reports_defect_model(client):
    r = client.get("/api/v1/health/detailed")
    assert r.status_code == 200
    dm = r.json()["components"]["defect_model"]
    assert "loaded" in dm and "classes" in dm and "conf_threshold" in dm


# ── Engineering ─────────────────────────────────────────────────────────

def test_sewage_total_equals_sum_of_items(client):
    r = client.post("/api/v1/engineering/sewage", json={"length_m": 100, "depth_m": 1.2, "manholes": 2, "city": "алматы"})
    assert r.status_code == 200
    d = r.json()
    items_sum = sum(i["total"] for i in d["items"])
    assert d["total_cost"] == items_sum            # раньше total = 1.45 × сумма (двойной счёт материалов)
    assert d["works_cost"] + d["materials_cost"] == d["total_cost"]
    for i in d["items"]:
        assert i["total"] == pytest.approx(i["volume"] * i["unit_price"], abs=1)


@pytest.mark.parametrize("path,body", [
    ("/api/v1/engineering/water", {"points_count": 10, "pipe_length_m": 50, "city": "астана"}),
    ("/api/v1/engineering/electrical", {"area_m2": 120, "city": "almaty", "sockets": 20, "switches": 10}),
])
def test_water_electrical_ok(client, path, body):
    r = client.post(path, json=body)
    assert r.status_code == 200
    d = r.json()
    assert d["total_cost"] == sum(i["total"] for i in d["items"])


def test_city_aliases_and_coefficients(client):
    r = client.post("/api/v1/engineering/sewage", json={"length_m": 10, "city": "Astana"})
    assert r.status_code == 200 and r.json()["regional_coeff"] == 1.15
    r = client.post("/api/v1/engineering/sewage", json={"length_m": 10, "city": "Атырау"})
    assert r.json()["regional_coeff"] == 1.35


@pytest.mark.parametrize("body", [
    {"length_m": -100},
    {"length_m": 0},
    {"length_m": 1e300},
    {"length_m": 10, "manholes": -5},
    {"length_m": 10, "city": "Нью-Йорк"},
    {"length_m": 10, "pipe_type": "../../etc/passwd"},
    {},
])
def test_sewage_validation_422(client, body):
    assert client.post("/api/v1/engineering/sewage", json=body).status_code == 422


@pytest.mark.parametrize("raw", ['{"length_m": NaN}', '{"length_m": Infinity}'])
def test_nan_infinity_422_not_500(client, raw):
    r = client.post("/api/v1/engineering/sewage", content=raw, headers={"Content-Type": "application/json"})
    assert r.status_code == 422
    json.loads(r.text)  # тело ответа — валидный JSON


@pytest.mark.parametrize("body", [
    {"area_m2": 100, "systems": ["heating"]},
    {"area_m2": 100, "systems": []},
    {"area_m2": -500},
    {"area_m2": 1e308},
])
def test_full_validation_422(client, body):
    assert client.post("/api/v1/engineering/full", json=body).status_code == 422


# ── Reports ─────────────────────────────────────────────────────────────

CITIES = ["алматы", "астана", "шымкент", "караганда", "атырау", "актау", "актобе", "павлодар",
          "усть-каменогорск", "семей", "тараз", "кызылорда", "костанай", "петропавловск", "туркестан"]


@pytest.mark.parametrize("city", CITIES)
def test_pdf_for_every_ui_city(client, city):
    r = client.post("/api/v1/engineering/report/pdf", json={"area_m2": 100, "city": city})
    assert r.status_code == 200, r.text[:200]
    assert r.content[:5] == b"%PDF-"
    cd = r.headers["content-disposition"]
    cd.encode("latin-1")  # заголовок кодируется
    assert "filename*=UTF-8''" in cd


def test_content_disposition_no_injection(client):
    r = client.post("/api/v1/engineering/report/pdf",
                    json={"area_m2": 100, "city": 'x"; filename=evil.exe; a="'})
    assert r.status_code == 422  # неизвестный город отклоняется до формирования заголовка


def test_pdf_has_cyrillic_text_and_vat(client):
    pypdf = pytest.importorskip("pypdf")
    from app.config import settings
    from app.services.fonts import find_cyrillic_font

    if not find_cyrillic_font():
        pytest.skip("no Cyrillic TTF font on this machine")
    body = {"area_m2": 100, "city": "алматы", "sewage_length_m": 50, "water_pipe_m": 500}
    r = client.post("/api/v1/engineering/report/pdf", json=body)
    text = "".join(p.extract_text() for p in pypdf.PdfReader(io.BytesIO(r.content)).pages)
    assert "Канализация" in text and "СМЕТА" in text
    full = client.post("/api/v1/engineering/full", json=body).json()
    grand = full["grand_total"]
    assert f"{grand:,.0f}" in text                    # water_pipe_m учтён в PDF так же, как в /full
    assert f"НДС ({settings.VAT_RATE * 100:g}%)" in text


def test_excel_formulas_reconcile(client):
    openpyxl = pytest.importorskip("openpyxl")
    body = {"area_m2": 100, "city": "астана", "water_pipe_m": 50}
    full = client.post("/api/v1/engineering/full", json=body).json()
    r = client.post("/api/v1/engineering/report/excel", json=body)
    assert r.status_code == 200
    ws = openpyxl.load_workbook(io.BytesIO(r.content)).active

    # Evaluate the simple formulas we write: =ROUND(Cn*En,0), =SUM(Fa:Fb), =SUM(F1,F2,...)
    def val(ref):
        v = ws[ref].value
        if isinstance(v, str) and v.startswith("=ROUND("):
            inner = v[len("=ROUND("):].split(",")[0]
            a, b = inner.split("*")
            from decimal import Decimal, ROUND_HALF_UP
            return int(Decimal(str(ws[a].value * ws[b].value)).quantize(Decimal(1), rounding=ROUND_HALF_UP))
        if isinstance(v, str) and v.startswith("=SUM("):
            args = v[5:-1]
            if ":" in args:
                a, b = args.split(":")
                return sum(val(f"F{i}") for i in range(int(a[1:]), int(b[1:]) + 1))
            return sum(val(x) for x in args.split(","))
        return v

    grand_row = next(row[0].row for row in ws.iter_rows(min_col=1, max_col=1) if row[0].value == "Итого без НДС:")
    assert val(f"F{grand_row}") == full["grand_total"]


# ── Prices / metrics ────────────────────────────────────────────────────

def test_prices(client):
    r = client.get("/api/v1/prices/search", params={"q": "бетон", "limit": 2})
    assert r.status_code == 200 and "results" in r.json()
    assert client.get("/api/v1/prices/stats").status_code == 200


def test_metrics_use_route_templates_and_escape(client):
    client.get("/api/v1/prices/item/x%22%7D%201%0Afake_metric%7Ba%3D%22")
    for i in range(5):
        client.get(f"/api/v1/prices/item/random{i}")
    text = client.get("/metrics").text
    assert "fake_metric" not in text                    # сырой путь больше не попадает в метки
    assert 'path="/api/v1/prices/item/{code}"' in text
    assert "random3" not in text                       # кардинальность ограничена шаблоном маршрута
    for line in text.splitlines():
        assert not line.startswith("fake_metric")


# ── Uploads / images ────────────────────────────────────────────────────

def test_non_image_is_400(client):
    for path in ("/api/v1/defect-scan", "/api/v1/detect"):
        r = client.post(path, files={"file": ("x.jpg", b"definitely not an image", "image/jpeg")})
        assert r.status_code == 400, (path, r.status_code)


def test_upload_size_limit_413(client):
    from app.config import settings
    big = b"\xff\xd8\xff\xe0" + b"0" * (settings.MAX_UPLOAD_IMAGE_SIZE + 2 * 1024 * 1024)
    r = client.post("/api/v1/defect-scan", files={"file": ("big.jpg", big, "image/jpeg")})
    assert r.status_code == 413


def test_pixel_bomb_413(client):
    from PIL import Image
    buf = io.BytesIO()
    Image.new("L", (9000, 9000), 128).save(buf, format="PNG")  # 81 Мпикс, файл ~80 КБ
    r = client.post("/api/v1/defect-scan", files={"file": ("bomb.png", buf.getvalue(), "image/png")})
    assert r.status_code == 413


def test_detect_mock_is_flagged(client):
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (320, 240), (150, 150, 150)).save(buf, format="JPEG")
    r = client.post("/api/v1/detect", files={"file": ("g.jpg", buf.getvalue(), "image/jpeg")})
    assert r.status_code == 200
    d = r.json()
    assert "is_mock" in d
    if d["is_mock"]:
        assert d["warnings"] and all(o.get("mock") for o in d["objects"])


def test_analyze_requires_token(client):
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (320, 240), (150, 150, 150)).save(buf, format="JPEG")
    assert client.post("/api/v1/analyze", files={"file": ("g.jpg", buf.getvalue(), "image/jpeg")}).status_code == 401


def test_analyze_intent_for_bot(client):
    from PIL import Image
    assert client.post("/api/v1/analyze/intent", json={"description": "фундамент"}).status_code == 422
    buf = io.BytesIO()
    Image.new("RGB", (320, 240), (150, 150, 150)).save(buf, format="JPEG")
    r = client.post("/api/v1/analyze/intent", files={"file": ("p.jpg", buf.getvalue(), "image/jpeg")},
                    data={"description": "фундамент", "category": "foundation", "region": "almaty"})
    assert r.status_code == 200
    d = r.json()
    for k in ("detections", "estimate_items", "estimate_total", "confidence", "region", "is_mock"):
        assert k in d


# ── LiDAR ───────────────────────────────────────────────────────────────

def _xyz(points) -> bytes:
    return "\n".join(" ".join(f"{v:.5f}" for v in p) for p in points).encode()


@pytest.fixture(scope="module")
def lidar_ok():
    from app.services.lidar import get_lidar
    if not get_lidar().available:
        pytest.skip("open3d not installed")


@pytest.mark.parametrize("content", [b"", b"hello world\nnot numbers\n", b"nan 0 0\n" * 200 + b"1 2 3\n" * 10])
def test_lidar_bad_files_400(client, lidar_ok, content):
    r = client.post("/api/v1/lidar/analyze", files={"file": ("scan.xyz", content, "text/plain")})
    assert r.status_code == 400, r.text


def test_lidar_room_and_floor(client, lidar_ok):
    rng = np.random.default_rng(0)
    L, W, H = 5.0, 4.0, 3.0
    pts = []
    for _ in range(3000):
        f = rng.integers(0, 6)
        u, v = rng.random(2)
        pts.append([(u * L, v * W, 0), (u * L, v * W, H), (0, u * W, v * H), (L, u * W, v * H),
                    (u * L, 0, v * H), (u * L, W, v * H)][f])
    r = client.post("/api/v1/lidar/analyze", files={"file": ("room.xyz", _xyz(pts), "text/plain")})
    assert r.status_code == 200
    d = r.json()
    assert d["scan_type"] == "room" and d["file"] == "room.xyz"
    assert d["dimensions"]["volume_m3"] == pytest.approx(60, rel=0.02)
    assert d["deviations"]["p95_deviation_mm"] < 3  # идеальная комната — не «критическое отклонение»

    floor = np.c_[rng.random((1500, 2)) * 3, rng.normal(0, 0.002, 1500)]
    r = client.post("/api/v1/lidar/analyze", files={"file": ("floor.xyz", _xyz(floor), "text/plain")})
    assert r.status_code == 200 and r.json()["scan_type"] == "surface"


def test_lidar_extension_whitelist(client, lidar_ok):
    r = client.post("/api/v1/lidar/deviations", files={"file": ("scan", b"1 2 3\n", "text/plain")})
    assert r.status_code == 400


# ── Estimates CSV ───────────────────────────────────────────────────────

def test_estimates_csv_escaping(client):
    import csv
    from app.api.v1.jwt_auth import create_token

    tok = create_token({"uid": "tg_test", "role": "customer"}, 600, "access")
    h = {"Authorization": f"Bearer {tok}"}
    body = {
        "client_name": '=HYPERLINK("http://evil.example","Open")',
        "client_address": 'ул. Абая 1","injected',
        "estimate_items": [{"work_name": "=1+1", "qty": 1, "unit_price": 100}],
        "estimate_total": 100,
    }
    r = client.post("/api/v1/estimates", json=body, headers=h)
    assert r.status_code == 201
    eid = r.json()["id"]
    try:
        csv_text = client.get(f"/api/v1/estimates/export/{eid}", headers=h).text.lstrip("﻿")
        rows = list(csv.reader(io.StringIO(csv_text)))
        flat = {row[0]: row[1:] for row in rows if row}
        assert flat["Клиент"] == ["'" + body["client_name"]]       # формула нейтрализована
        assert flat["Адрес"] == [body["client_address"]]           # кавычки экранированы, колонка одна
        assert any(row[2:3] == ["'=1+1"] for row in rows)
    finally:
        client.delete(f"/api/v1/estimates/{eid}", headers=h)


def test_estimates_pagination_bounds(client):
    from app.api.v1.jwt_auth import create_token
    tok = create_token({"uid": "tg_test", "role": "customer"}, 600, "access")
    r = client.get("/api/v1/estimates?per_page=-1&page=-5", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 422
