"""QazGost AI - Full Integration Test Suite"""
import sys, json, time, requests
from datetime import datetime

BASE = "http://localhost:8001"
PASSED = 0
FAILED = 0

def test(name, fn):
    global PASSED, FAILED
    try:
        ok, detail = fn()
        if ok:
            PASSED += 1
            print(f"  PASS  {name} -- {detail}")
        else:
            FAILED += 1
            print(f"  FAIL  {name} -- {detail}")
    except Exception as e:
        FAILED += 1
        print(f"  FAIL  {name} -- {e}")

# === TESTS ===

def t_root():
    r = requests.get(f"{BASE}/", timeout=5)
    d = r.json()
    return r.status_code == 200, f"service={d.get('name','?')}"

def t_health():
    r = requests.get(f"{BASE}/api/v1/health", timeout=5)
    return r.status_code == 200, f"status={r.json().get('status','?')}"

def t_health_detailed():
    r = requests.get(f"{BASE}/api/v1/health/detailed", timeout=5)
    d = r.json()
    return r.status_code == 200, f"models={list(d.get('models',{}).keys())[:3]}"

def t_docs():
    r = requests.get(f"{BASE}/docs", timeout=5)
    return r.status_code == 200 and "swagger" in r.text.lower(), "Swagger UI ok"

def t_classes():
    r = requests.get(f"{BASE}/api/v1/classes", timeout=5)
    d = r.json()
    cnt = len(d) if isinstance(d, list) else len(d.get("classes", []))
    return r.status_code == 200, f"{cnt} classes"

def t_sewage():
    r = requests.post(f"{BASE}/api/v1/engineering/sewage", json={"area_m2": 100, "city": "almaty"}, timeout=10)
    return r.status_code == 200, f"keys={list(r.json().keys())[:4]}"

def t_water():
    r = requests.post(f"{BASE}/api/v1/engineering/water", json={"area_m2": 80, "city": "astana", "hot_water": True}, timeout=10)
    return r.status_code == 200, f"keys={list(r.json().keys())[:4]}"

def t_electrical():
    r = requests.post(f"{BASE}/api/v1/engineering/electrical", json={"area_m2": 120, "city": "almaty", "sockets": 20, "switches": 10}, timeout=10)
    return r.status_code == 200, f"keys={list(r.json().keys())[:4]}"

def t_full_estimate():
    r = requests.post(f"{BASE}/api/v1/engineering/full", json={
        "area_m2": 150, "city": "almaty",
        "systems": ["sewage", "water_supply", "electrical"],
        "hot_water": True, "sockets": 25, "switches": 12
    }, timeout=10)
    d = r.json()
    total = d.get("grand_total", 0)
    return r.status_code == 200 and total > 0, f"grand_total={total:,.0f} tenge"

def t_pdf_report():
    r = requests.post(f"{BASE}/api/v1/engineering/report/pdf", json={
        "area_m2": 100, "city": "almaty",
        "systems": ["sewage", "electrical"],
        "hot_water": False, "sockets": 10, "switches": 5
    }, timeout=15)
    is_pdf = r.content[:5] == b"%PDF-"
    return r.status_code == 200 and is_pdf, f"size={len(r.content):,} bytes"

def t_excel_report():
    r = requests.post(f"{BASE}/api/v1/engineering/report/excel", json={
        "area_m2": 100, "city": "almaty",
        "systems": ["sewage", "water_supply"],
        "hot_water": True, "sockets": 0, "switches": 0
    }, timeout=15)
    is_xlsx = r.content[:2] == b"PK"
    return r.status_code == 200 and is_xlsx, f"size={len(r.content):,} bytes"

def t_price_search():
    r = requests.get(f"{BASE}/api/v1/prices/search?q=бетон", timeout=10)
    d = r.json()
    cnt = len(d.get("results", d if isinstance(d, list) else []))
    return r.status_code == 200, f"{cnt} results for 'бетон'"

def t_price_stats():
    r = requests.get(f"{BASE}/api/v1/prices/stats", timeout=5)
    return r.status_code == 200, f"data={list(r.json().keys())[:4]}"

def t_metrics():
    r = requests.get(f"{BASE}/metrics", timeout=5)
    return r.status_code == 200, f"prometheus metrics ({len(r.text)} chars)"

def t_metrics_json():
    r = requests.get(f"{BASE}/api/v1/metrics/json", timeout=5)
    return r.status_code == 200, f"keys={list(r.json().keys())[:4]}"

def t_edge_zero():
    r = requests.post(f"{BASE}/api/v1/engineering/sewage", json={"area_m2": 0, "city": "almaty"}, timeout=5)
    return r.status_code in [200, 422], f"status={r.status_code} (no crash)"

def t_edge_huge():
    r = requests.post(f"{BASE}/api/v1/engineering/full", json={
        "area_m2": 999999, "city": "almaty",
        "systems": ["sewage","water_supply","electrical"],
        "hot_water": True, "sockets": 1000, "switches": 500
    }, timeout=10)
    if r.status_code == 200:
        return True, f"grand_total={r.json().get('grand_total',0):,.0f} tenge"
    return False, f"status={r.status_code}"

def t_edge_bad_city():
    r = requests.post(f"{BASE}/api/v1/engineering/sewage", json={"area_m2": 50, "city": "fake_city_123"}, timeout=5)
    return r.status_code in [200, 422], f"status={r.status_code} (no crash)"

def t_lidar_no_file():
    r = requests.post(f"{BASE}/api/v1/lidar/analyze", timeout=5)
    return r.status_code == 422, f"status={r.status_code} (validation error)"

def t_analyze_no_file():
    r = requests.post(f"{BASE}/api/v1/analyze", timeout=5)
    return r.status_code == 422, f"status={r.status_code} (validation error)"


if __name__ == "__main__":
    print("=" * 60)
    print(f"QazGost AI Integration Tests")
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Server: {BASE}")
    print("=" * 60)

    # Wait for server
    for i in range(10):
        try:
            requests.get(f"{BASE}/", timeout=2)
            print(f"Server UP (attempt {i+1})")
            break
        except:
            time.sleep(2)
    else:
        print("Server not available")
        sys.exit(1)

    print()
    print("-- Core --")
    test("Root /", t_root)
    test("Health", t_health)
    test("Health Detailed", t_health_detailed)
    test("Swagger Docs", t_docs)
    test("Classes List", t_classes)

    print()
    print("-- Engineering Calculator --")
    test("Sewage Calc", t_sewage)
    test("Water Calc", t_water)
    test("Electrical Calc", t_electrical)
    test("Full Estimate", t_full_estimate)

    print()
    print("-- Reports --")
    test("PDF Report", t_pdf_report)
    test("Excel Report", t_excel_report)

    print()
    print("-- Price Database --")
    test("Price Search", t_price_search)
    test("Price Stats", t_price_stats)

    print()
    print("-- Monitoring --")
    test("Prometheus /metrics", t_metrics)
    test("JSON Metrics", t_metrics_json)

    print()
    print("-- Edge Cases --")
    test("Zero Area", t_edge_zero)
    test("Huge Area 999999m2", t_edge_huge)
    test("Invalid City", t_edge_bad_city)
    test("LiDAR No File", t_lidar_no_file)
    test("Analyze No File", t_analyze_no_file)

    print()
    print("=" * 60)
    total = PASSED + FAILED
    rate = (PASSED / total * 100) if total > 0 else 0
    print(f"Results: {PASSED}/{total} passed ({rate:.0f}%)")
    if FAILED == 0:
        print("ALL TESTS PASSED!")
    else:
        print(f"{FAILED} test(s) FAILED")
    print("=" * 60)
    sys.exit(0 if FAILED == 0 else 1)
