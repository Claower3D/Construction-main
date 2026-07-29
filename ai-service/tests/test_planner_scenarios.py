"""
QAZGOST AI - Planner & Scenarios Tests

Tests for ConstructionPlanner and ScenarioBuilder.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.planner import ConstructionPlanner, PHASE_TEMPLATES, SNIP_RULES
from app.services.scenarios import ScenarioBuilder, SCENARIO_COEFFICIENTS


# ═══════════════════════════════════════════════════════════════════════
#  ConstructionPlanner tests
# ═══════════════════════════════════════════════════════════════════════

class TestPlannerBasics:
    """Basic planner functionality."""

    @pytest.fixture
    def planner(self):
        return ConstructionPlanner()

    def test_make_plan_returns_dict(self, planner):
        """Plan has required top-level keys."""
        plan = planner.make_plan("foundation_strip", {"area_m2": 20, "depth_m": 1.2})
        assert isinstance(plan, dict)
        for key in ("object_type", "work_items", "phases", "warnings", "required_inputs", "explanation"):
            assert key in plan, f"Missing key: {key}"

    def test_plan_has_phases(self, planner):
        """Plan should have prep/main/finish phases."""
        plan = planner.make_plan("foundation_strip", {"area_m2": 20})
        phase_ids = [p["id"] for p in plan["phases"]]
        assert "prep" in phase_ids
        assert "main" in phase_ids
        assert "finish" in phase_ids

    def test_plan_has_work_items(self, planner):
        """Plan should generate WBS work items."""
        plan = planner.make_plan("foundation_strip", {"area_m2": 20})
        assert len(plan["work_items"]) > 0
        for item in plan["work_items"]:
            assert "wbs" in item
            assert "name" in item
            assert "unit" in item
            assert "norm_hours" in item

    def test_unknown_type_falls_back_to_generic(self, planner):
        """Unknown object type should fall back to 'generic'."""
        plan = planner.make_plan("unknown_xyz_type", {})
        assert plan["object_type"] == "generic"

    def test_none_type_falls_back_to_generic(self, planner):
        """None object type should fall back to 'generic'."""
        plan = planner.make_plan(None, {})
        assert plan["object_type"] == "generic"


class TestPlannerObjectTypes:
    """Planner covers all known object types."""

    @pytest.fixture
    def planner(self):
        return ConstructionPlanner()

    @pytest.mark.parametrize("obj_type", list(PHASE_TEMPLATES.keys()))
    def test_all_object_types_produce_plan(self, planner, obj_type):
        """Each template object type produces a valid plan."""
        plan = planner.make_plan(obj_type, {"area_m2": 50, "depth_m": 1.0, "height_m": 3.0})
        assert plan["object_type"] == obj_type
        assert len(plan["phases"]) >= 2
        assert len(plan["work_items"]) >= 1


class TestSNiPWarnings:
    """SNiP rule warnings."""

    @pytest.fixture
    def planner(self):
        return ConstructionPlanner()

    def test_shallow_foundation_warning(self, planner):
        """Foundation depth < 0.5m triggers SNiP warning."""
        plan = planner.make_plan("foundation_strip", {"depth_m": 0.3})
        codes = [w["code"] for w in plan["warnings"]]
        assert "SNIP-FOUNDATION-DEPTH" in codes

    def test_deep_foundation_no_warning(self, planner):
        """Foundation depth >= 0.5m should NOT trigger warning."""
        plan = planner.make_plan("foundation_strip", {"depth_m": 1.2})
        codes = [w["code"] for w in plan["warnings"]]
        assert "SNIP-FOUNDATION-DEPTH" not in codes

    def test_tall_brick_wall_warning(self, planner):
        """Brick wall > 3.5m triggers армопояс warning."""
        plan = planner.make_plan("wall_brick", {"height_m": 4.0})
        codes = [w["code"] for w in plan["warnings"]]
        assert "SNIP-WALL-HEIGHT" in codes

    def test_thick_screed_warning(self, planner):
        """Screed > 100mm triggers армирование warning."""
        plan = planner.make_plan("floor_screed", {"depth_m": 0.15})
        codes = [w["code"] for w in plan["warnings"]]
        assert "SNIP-SCREED-THICKNESS" in codes

    def test_large_roof_warning(self, planner):
        """Roof area > 200m² triggers деформационные швы warning."""
        plan = planner.make_plan("roof_flat", {"area_m2": 250})
        codes = [w["code"] for w in plan["warnings"]]
        assert "SNIP-ROOF-AREA" in codes


class TestPlannerRequiredInputs:
    """Required inputs detection."""

    @pytest.fixture
    def planner(self):
        return ConstructionPlanner()

    def test_missing_area_for_floor(self, planner):
        """Floor screed without area should ask for it."""
        plan = planner.make_plan("floor_screed", {})
        input_keys = [i["key"] for i in plan["required_inputs"]]
        assert "area_m2" in input_keys

    def test_missing_wall_length(self, planner):
        """Wall without area should ask for wall length."""
        plan = planner.make_plan("wall_brick", {})
        input_keys = [i["key"] for i in plan["required_inputs"]]
        assert "wall_length" in input_keys

    def test_missing_screed_thickness(self, planner):
        """Screed without depth asks for thickness."""
        plan = planner.make_plan("floor_screed", {})
        input_keys = [i["key"] for i in plan["required_inputs"]]
        assert "screed_thickness_mm" in input_keys

    def test_complete_data_no_inputs(self, planner):
        """Full measurements should require no inputs."""
        plan = planner.make_plan("foundation_strip", {
            "area_m2": 30, "depth_m": 1.2, "width_m": 0.4, "height_m": 1.2
        })
        assert len(plan["required_inputs"]) == 0


class TestPlannerExplanation:
    """Explanation generation."""

    @pytest.fixture
    def planner(self):
        return ConstructionPlanner()

    def test_explanation_contains_type(self, planner):
        """Explanation mentions the object type."""
        plan = planner.make_plan("wall_brick", {"area_m2": 10})
        assert "кирпичная кладка" in plan["explanation"].lower()

    def test_explanation_with_area(self, planner):
        """Explanation includes area if provided."""
        plan = planner.make_plan("roof_flat", {"area_m2": 120.5})
        assert "120.5" in plan["explanation"]

    def test_explanation_with_qwen(self, planner):
        """Explanation includes scene description from Qwen."""
        qwen = {"scene_description": "Строительная площадка с котлованом"}
        plan = planner.make_plan("foundation_slab", {"area_m2": 50}, qwen_result=qwen)
        assert "котлованом" in plan["explanation"]


# ═══════════════════════════════════════════════════════════════════════
#  ScenarioBuilder tests
# ═══════════════════════════════════════════════════════════════════════

class TestScenarioBuilder:
    """Scenario generation tests."""

    @pytest.fixture
    def builder(self):
        return ScenarioBuilder()

    @pytest.fixture
    def sample_items(self):
        return [
            {"work_code": "W1", "work_name": "Работа 1", "unit": "m2",
             "quantity": 10, "unit_price": 1000, "total_price": 10000},
            {"work_code": "W2", "work_name": "Работа 2", "unit": "m3",
             "quantity": 5, "unit_price": 2000, "total_price": 10000},
        ]

    def test_build_returns_3_scenarios(self, builder, sample_items):
        """build() returns economy, standard, premium."""
        scenarios = builder.build(sample_items, 20000)
        assert "economy" in scenarios
        assert "standard" in scenarios
        assert "premium" in scenarios

    def test_economy_cheaper_than_standard(self, builder, sample_items):
        """Economy total should be less than standard."""
        scenarios = builder.build(sample_items, 20000)
        assert scenarios["economy"]["total"] < scenarios["standard"]["total"]

    def test_premium_more_than_standard(self, builder, sample_items):
        """Premium total should be more than standard."""
        scenarios = builder.build(sample_items, 20000)
        assert scenarios["premium"]["total"] > scenarios["standard"]["total"]

    def test_standard_equals_original(self, builder, sample_items):
        """Standard total should equal original total."""
        scenarios = builder.build(sample_items, 20000)
        assert scenarios["standard"]["total"] == 20000.0

    def test_economy_factor(self, builder, sample_items):
        """Economy = 80% of standard."""
        scenarios = builder.build(sample_items, 20000)
        assert scenarios["economy"]["total"] == 16000.0

    def test_premium_factor(self, builder, sample_items):
        """Premium = 135% of standard."""
        scenarios = builder.build(sample_items, 20000)
        assert scenarios["premium"]["total"] == 27000.0

    def test_items_preserved(self, builder, sample_items):
        """Each scenario should have same number of items."""
        scenarios = builder.build(sample_items, 20000)
        for key in ("economy", "standard", "premium"):
            assert scenarios[key]["item_count"] == 2

    def test_item_prices_scaled(self, builder, sample_items):
        """Economy item prices should be 80% of original."""
        scenarios = builder.build(sample_items, 20000)
        original = sample_items[0]["unit_price"]
        economy = scenarios["economy"]["items"][0]["unit_price"]
        assert economy == round(original * 0.80, 2)

    def test_scenario_metadata(self, builder, sample_items):
        """Each scenario has label, icon, description."""
        scenarios = builder.build(sample_items, 20000)
        for key in ("economy", "standard", "premium"):
            s = scenarios[key]
            assert "label" in s
            assert "icon" in s
            assert "description" in s
            assert "diff_pct" in s
            assert "material_quality" in s

    def test_empty_items(self, builder):
        """Empty items produce valid scenarios."""
        scenarios = builder.build([], 0)
        for key in ("economy", "standard", "premium"):
            assert scenarios[key]["total"] == 0
            assert scenarios[key]["item_count"] == 0


class TestScenarioWithTax:
    """Scenario with tax + margin."""

    @pytest.fixture
    def builder(self):
        return ScenarioBuilder()

    @pytest.fixture
    def sample_items(self):
        return [
            {"work_code": "W1", "work_name": "Работа 1", "unit": "m2",
             "quantity": 10, "unit_price": 1000, "total_price": 10000},
        ]

    def test_build_with_tax_adds_fields(self, builder, sample_items):
        """build_with_tax adds subtotal, margin, tax, grand_total."""
        scenarios = builder.build_with_tax(sample_items, 10000)
        for key in ("economy", "standard", "premium"):
            s = scenarios[key]
            assert "subtotal" in s
            assert "margin" in s
            assert "margin_pct" in s
            assert "tax" in s
            assert "tax_pct" in s
            assert "grand_total" in s

    def test_standard_tax_calculation(self, builder, sample_items):
        """Standard: 10000 + 15% margin + 12% VAT."""
        scenarios = builder.build_with_tax(sample_items, 10000, margin_pct=15.0, tax_pct=12.0)
        s = scenarios["standard"]
        assert s["subtotal"] == 10000.0
        assert s["margin"] == 1500.0  # 15% of 10000
        assert s["tax"] == 1380.0     # 12% of 11500
        assert s["grand_total"] == 12880.0  # 10000 + 1500 + 1380

    def test_grand_total_ordering(self, builder, sample_items):
        """Grand totals: economy < standard < premium."""
        scenarios = builder.build_with_tax(sample_items, 10000)
        assert scenarios["economy"]["grand_total"] < scenarios["standard"]["grand_total"]
        assert scenarios["standard"]["grand_total"] < scenarios["premium"]["grand_total"]

    def test_custom_margin(self, builder, sample_items):
        """Custom margin percentage works."""
        scenarios = builder.build_with_tax(sample_items, 10000, margin_pct=20.0, tax_pct=0)
        s = scenarios["standard"]
        assert s["margin"] == 2000.0
        assert s["tax"] == 0.0
        assert s["grand_total"] == 12000.0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
