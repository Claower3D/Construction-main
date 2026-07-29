"""
QAZGOST AI - Price Database Tests

Tests for price_db.json loading, search, and enrichment.
"""

import os
import json
import pytest
from unittest.mock import patch, MagicMock

# Ensure we can import app modules
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestPriceDBLoading:
    """Test price_db.json loading."""

    def test_load_price_db_returns_dict(self):
        """_load_price_db returns a dict with required keys."""
        from app.services.estimator import _load_price_db
        db = _load_price_db()
        assert isinstance(db, dict)
        assert "works" in db
        assert "materials" in db
        assert "equipment" in db

    def test_load_price_db_has_items(self):
        """Database should have items if price_db.json exists."""
        from app.services.estimator import _load_price_db
        db = _load_price_db()
        total = len(db.get("works", {})) + len(db.get("materials", {})) + len(db.get("equipment", {}))
        # If price_db.json exists, should have > 0 items
        db_path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "price_db.json")
        if os.path.exists(db_path):
            assert total > 0, f"Price DB file exists but has {total} items"
            print(f"✅ PriceDB loaded: {total} items (works={len(db.get('works', {}))}, materials={len(db.get('materials', {}))}, equipment={len(db.get('equipment', {}))})")
        else:
            print(f"⚠️ price_db.json not found at {db_path}, skipping count check")

    def test_load_price_db_singleton(self):
        """_load_price_db should return same object on repeated calls."""
        from app.services import estimator
        # Reset singleton
        estimator._price_db = None
        db1 = estimator._load_price_db()
        db2 = estimator._load_price_db()
        assert db1 is db2, "Should return cached instance"
        # Reset
        estimator._price_db = None


class TestSearchItems:
    """Test search_items function."""

    def test_search_empty_query(self):
        """Empty query returns empty list."""
        from app.services.estimator import search_items
        results = search_items("")
        assert results == []

    def test_search_returns_list(self):
        """search_items returns a list."""
        from app.services.estimator import search_items
        results = search_items("бетон")
        assert isinstance(results, list)

    def test_search_result_structure(self):
        """Each result has required keys."""
        from app.services.estimator import search_items
        results = search_items("бетон", limit=3)
        for r in results:
            assert "code" in r
            assert "name" in r
            assert "unit" in r
            assert "price" in r
            assert "type" in r
            assert "score" in r

    def test_search_by_type_works(self):
        """Search filtered by type='works' returns only works."""
        from app.services.estimator import search_items
        results = search_items("бетон", item_type="works", limit=5)
        for r in results:
            assert r["type"] == "works"

    def test_search_by_type_materials(self):
        """Search filtered by type='materials' returns only materials."""
        from app.services.estimator import search_items
        results = search_items("бетон", item_type="materials", limit=5)
        for r in results:
            assert r["type"] == "materials"

    def test_search_limit(self):
        """Results should not exceed limit."""
        from app.services.estimator import search_items
        results = search_items("бетон", limit=3)
        assert len(results) <= 3

    def test_search_sorted_by_score(self):
        """Results should be sorted by score descending."""
        from app.services.estimator import search_items
        results = search_items("бетон заливка", limit=10)
        for i in range(len(results) - 1):
            assert results[i]["score"] >= results[i + 1]["score"]


class TestGetPrice:
    """Test get_price function."""

    def test_get_price_nonexistent(self):
        """Non-existent code returns None."""
        from app.services.estimator import get_price
        result = get_price("NONEXISTENT_CODE_12345")
        assert result is None

    def test_get_price_returns_dict(self):
        """If code exists, returns dict with required keys."""
        from app.services.estimator import get_price, _load_price_db
        db = _load_price_db()
        # Get first available code
        for section in ("works", "materials", "equipment"):
            codes = list(db.get(section, {}).keys())
            if codes:
                code = codes[0]
                result = get_price(code)
                assert result is not None
                assert "code" in result
                assert "type" in result
                assert result["code"] == code
                print(f"✅ get_price('{code}') = {result['name'][:40]}...")
                return
        print("⚠️ No items in DB to test get_price")


class TestAutoEstimatorWithDB:
    """Test AutoEstimator integration with PriceDB."""

    def test_init_loads_db(self):
        """AutoEstimator.__init__ loads price DB."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator(region="almaty", apply_seasonal=False)
        assert est.db_total >= 0
        assert isinstance(est.db_works, dict)
        assert isinstance(est.db_materials, dict)
        assert isinstance(est.db_equipment, dict)

    def test_enrich_with_real_prices(self):
        """enrich_with_real_prices adds price_source field."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator(region="almaty", apply_seasonal=False)
        
        test_items = [
            {
                "work_code": "TEST-001",
                "work_name": "Заливка бетона",
                "unit": "m3",
                "quantity": 10,
                "unit_price": 8000,
                "total_price": 80000,
            }
        ]
        
        enriched = est.enrich_with_real_prices(test_items)
        assert len(enriched) == 1
        assert "price_source" in enriched[0]
        assert enriched[0]["price_source"] in ("database", "hardcoded")
        print(f"✅ enriched[0] price_source={enriched[0]['price_source']}")

    def test_generate_includes_price_source(self):
        """generate() should return items with price_source."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator(region="almaty", apply_seasonal=False)
        
        # Create mock detection
        class MockDet:
            class_name = "foundation"
            confidence = 0.85
            area_m2 = 20.0
            width_m = 5.0
            height_m = 4.0
            depth_m = 0.5
            volume_m3 = 10.0
        
        items, total, conf = est.generate(
            detections=[MockDet()],
            measurements={}
        )
        
        assert len(items) > 0
        for item in items:
            assert "price_source" in item
        
        db_count = sum(1 for i in items if i["price_source"] == "database")
        hc_count = sum(1 for i in items if i["price_source"] == "hardcoded")
        print(f"✅ generate(): {len(items)} items, db={db_count}, hardcoded={hc_count}, total={total:,.0f} KZT")


class TestRegionalCoefficients:
    """Test regional coefficient loading from DB."""

    def test_almaty_coefficient(self):
        """Almaty should have coefficient ~1.0."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator(region="almaty", apply_seasonal=False)
        assert 0.9 <= est.regional_coef <= 1.1

    def test_atyrau_coefficient(self):
        """Atyrau should have higher coefficient."""
        from app.services.estimator import AutoEstimator
        est = AutoEstimator(region="atyrau", apply_seasonal=False)
        assert est.regional_coef >= 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
