"""
QAZGOST AI - Scenario Builder Service

Generates 3 cost scenarios (economy / standard / premium) from estimate items.
Server-side replacement for frontend smartEstimate.js scenario logic.
"""

from typing import List, Dict, Any, Tuple
from loguru import logger


# Scenario coefficients relative to standard price
SCENARIO_COEFFICIENTS = {
    "economy": {
        "price_factor": 0.80,
        "label": "Эконом",
        "icon": "💰",
        "description": "Бюджетные материалы, минимальная отделка",
        "material_quality": "Эконом-класс",
    },
    "standard": {
        "price_factor": 1.00,
        "label": "Стандарт",
        "icon": "⭐",
        "description": "Качественные материалы, стандартная технология",
        "material_quality": "Средний класс",
    },
    "premium": {
        "price_factor": 1.35,
        "label": "Премиум",
        "icon": "👑",
        "description": "Премиум материалы, усиленная технология",
        "material_quality": "Премиум-класс",
    },
}


class ScenarioBuilder:
    """
    Generates 3 cost scenarios from estimate items.
    """

    def build(
        self,
        estimate_items: List[Dict],
        estimate_total: float,
        estimate_confidence: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Build 3 scenarios from estimate items.

        Args:
            estimate_items: list of {work_code, work_name, unit, quantity, unit_price, total_price, ...}
            estimate_total: sum of total_price
            estimate_confidence: average confidence

        Returns:
            {
                economy:  {total, items, diff_pct, label, icon, description},
                standard: {total, items, diff_pct, label, icon, description},
                premium:  {total, items, diff_pct, label, icon, description},
            }
        """
        scenarios = {}

        for key, cfg in SCENARIO_COEFFICIENTS.items():
            factor = cfg["price_factor"]

            scenario_items = []
            for item in estimate_items:
                s_item = item.copy()
                s_item["unit_price"] = round(item["unit_price"] * factor, 2)
                s_item["total_price"] = round(item["total_price"] * factor, 2)
                scenario_items.append(s_item)

            total = round(estimate_total * factor, 2)
            diff_pct = round((factor - 1.0) * 100)

            scenarios[key] = {
                "total": total,
                "items": scenario_items,
                "item_count": len(scenario_items),
                "diff_pct": f"{'+' if diff_pct > 0 else ''}{diff_pct}%",
                "label": cfg["label"],
                "icon": cfg["icon"],
                "description": cfg["description"],
                "material_quality": cfg["material_quality"],
                "confidence": estimate_confidence,
            }

        logger.info(
            f"[Scenarios] Built: economy={scenarios['economy']['total']:,.0f}, "
            f"standard={scenarios['standard']['total']:,.0f}, "
            f"premium={scenarios['premium']['total']:,.0f} KZT"
        )

        return scenarios

    def build_with_tax(
        self,
        estimate_items: List[Dict],
        estimate_total: float,
        estimate_confidence: float = 0.5,
        margin_pct: float = 15.0,
        tax_pct: float = 12.0,
    ) -> Dict[str, Any]:
        """
        Build scenarios with contractor margin and VAT included.
        """
        scenarios = self.build(estimate_items, estimate_total, estimate_confidence)

        for key, scenario in scenarios.items():
            subtotal = scenario["total"]
            margin = subtotal * margin_pct / 100.0
            subtotal_with_margin = subtotal + margin
            tax = subtotal_with_margin * tax_pct / 100.0
            grand_total = subtotal_with_margin + tax

            scenario["subtotal"] = round(subtotal, 2)
            scenario["margin_pct"] = margin_pct
            scenario["margin"] = round(margin, 2)
            scenario["tax_pct"] = tax_pct
            scenario["tax"] = round(tax, 2)
            scenario["grand_total"] = round(grand_total, 2)

        return scenarios
