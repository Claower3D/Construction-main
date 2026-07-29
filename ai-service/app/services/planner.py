"""
QAZGOST AI - Construction Planner Service

Generates work plans (WBS) from detected objects + Qwen VLM analysis.
Server-side replacement for frontend constructionPlanner.js.

Pipeline: detections + qwen_result → work_items → phases → warnings
"""

from typing import List, Dict, Any, Optional
from loguru import logger


# ─────────────────────────────────────────────────────────────
# Work phase templates per objectType
# ─────────────────────────────────────────────────────────────

PHASE_TEMPLATES = {
    "foundation_strip": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Геодезическая разметка", "unit": "m2", "norm_hours": 0.5},
            {"wbs": "01.02", "name": "Расчистка территории", "unit": "m2", "norm_hours": 0.3},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Рытье траншеи", "unit": "m3", "norm_hours": 1.5},
            {"wbs": "02.02", "name": "Устройство песчаной подушки", "unit": "m3", "norm_hours": 0.8},
            {"wbs": "02.03", "name": "Монтаж опалубки", "unit": "m2", "norm_hours": 1.2},
            {"wbs": "02.04", "name": "Армирование", "unit": "kg", "norm_hours": 0.05},
            {"wbs": "02.05", "name": "Заливка бетона М300", "unit": "m3", "norm_hours": 2.0},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Снятие опалубки", "unit": "m2", "norm_hours": 0.4},
            {"wbs": "03.02", "name": "Гидроизоляция", "unit": "m2", "norm_hours": 0.6},
            {"wbs": "03.03", "name": "Обратная засыпка", "unit": "m3", "norm_hours": 0.5},
        ]},
    ],
    "foundation_slab": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Геодезическая разметка", "unit": "m2", "norm_hours": 0.5},
            {"wbs": "01.02", "name": "Разработка котлована", "unit": "m3", "norm_hours": 1.8},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Щебёночная подушка", "unit": "m3", "norm_hours": 0.8},
            {"wbs": "02.02", "name": "Гидроизоляция подстилающего слоя", "unit": "m2", "norm_hours": 0.3},
            {"wbs": "02.03", "name": "Монтаж опалубки", "unit": "m2", "norm_hours": 1.0},
            {"wbs": "02.04", "name": "Армирование (2 сетки)", "unit": "kg", "norm_hours": 0.05},
            {"wbs": "02.05", "name": "Заливка бетона М350", "unit": "m3", "norm_hours": 2.5},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Уход за бетоном", "unit": "m2", "norm_hours": 0.1},
        ]},
    ],
    "wall_brick": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Подготовка основания", "unit": "m2", "norm_hours": 0.3},
            {"wbs": "01.02", "name": "Разметка рядов", "unit": "m", "norm_hours": 0.2},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Кирпичная кладка", "unit": "m3", "norm_hours": 4.0},
            {"wbs": "02.02", "name": "Армирование кладки", "unit": "m", "norm_hours": 0.3},
            {"wbs": "02.03", "name": "Устройство перемычек", "unit": "pcs", "norm_hours": 2.0},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Расшивка швов", "unit": "m2", "norm_hours": 0.5},
        ]},
    ],
    "wall_block": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Подготовка основания", "unit": "m2", "norm_hours": 0.3},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Кладка блоков на клей", "unit": "m3", "norm_hours": 3.0},
            {"wbs": "02.02", "name": "Армирование рядов", "unit": "m", "norm_hours": 0.2},
            {"wbs": "02.03", "name": "Устройство армопояса", "unit": "m", "norm_hours": 1.5},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Оштукатуривание", "unit": "m2", "norm_hours": 0.8},
        ]},
    ],
    "floor_screed": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Подготовка основания, грунтование", "unit": "m2", "norm_hours": 0.2},
            {"wbs": "01.02", "name": "Установка маяков", "unit": "m2", "norm_hours": 0.3},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Устройство стяжки", "unit": "m2", "norm_hours": 0.5},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Шлифовка поверхности", "unit": "m2", "norm_hours": 0.2},
        ]},
    ],
    "roof_flat": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Подготовка основания кровли", "unit": "m2", "norm_hours": 0.3},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Пароизоляция", "unit": "m2", "norm_hours": 0.2},
            {"wbs": "02.02", "name": "Утепление (мин. 100мм)", "unit": "m2", "norm_hours": 0.4},
            {"wbs": "02.03", "name": "Стяжка по утеплителю", "unit": "m2", "norm_hours": 0.5},
            {"wbs": "02.04", "name": "Гидроизоляция (2 слоя)", "unit": "m2", "norm_hours": 0.6},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Устройство водоотвода", "unit": "m", "norm_hours": 0.8},
        ]},
    ],
    "roof_gable": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Устройство мауэрлата", "unit": "m", "norm_hours": 1.0},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Монтаж стропильной системы", "unit": "m2", "norm_hours": 1.5},
            {"wbs": "02.02", "name": "Устройство обрешётки", "unit": "m2", "norm_hours": 0.6},
            {"wbs": "02.03", "name": "Утепление кровли", "unit": "m2", "norm_hours": 0.4},
            {"wbs": "02.04", "name": "Монтаж кровельного покрытия", "unit": "m2", "norm_hours": 0.8},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Монтаж водосточной системы", "unit": "m", "norm_hours": 0.5},
            {"wbs": "03.02", "name": "Подшивка свесов", "unit": "m", "norm_hours": 0.6},
        ]},
    ],
    "generic": [
        {"phase": "prep", "name": "Подготовительные работы", "items": [
            {"wbs": "01.01", "name": "Подготовка рабочей зоны", "unit": "m2", "norm_hours": 0.3},
        ]},
        {"phase": "main", "name": "Основные работы", "items": [
            {"wbs": "02.01", "name": "Общестроительные работы", "unit": "m2", "norm_hours": 1.0},
        ]},
        {"phase": "finish", "name": "Завершающие работы", "items": [
            {"wbs": "03.01", "name": "Уборка и вывоз мусора", "unit": "m3", "norm_hours": 0.5},
        ]},
    ],
}

# СНиП rules for warnings
SNIP_RULES = [
    {
        "condition": lambda ot, dims: ot.startswith("foundation") and (dims.get("depth_m") or 0) < 0.5,
        "warning": "СНиП: Глубина заложения фундамента менее 0.5м — проверьте глубину промерзания грунта",
        "code": "SNIP-FOUNDATION-DEPTH",
    },
    {
        "condition": lambda ot, dims: ot == "wall_brick" and (dims.get("height_m") or 0) > 3.5,
        "warning": "СНиП: Высота кирпичной стены >3.5м — требуется армопояс",
        "code": "SNIP-WALL-HEIGHT",
    },
    {
        "condition": lambda ot, dims: ot == "floor_screed" and (dims.get("depth_m") or 0) > 0.1,
        "warning": "СНиП: Толщина стяжки >100мм — используйте армирование",
        "code": "SNIP-SCREED-THICKNESS",
    },
    {
        "condition": lambda ot, dims: ot.startswith("roof") and (dims.get("area_m2") or 0) > 200,
        "warning": "СНиП: Площадь кровли >200м² — предусмотрите деформационные швы",
        "code": "SNIP-ROOF-AREA",
    },
]


class ConstructionPlanner:
    """
    Server-side construction plan generator.
    Maps object types → work phases → WBS items.
    """

    def make_plan(
        self,
        object_type: str,
        dimensions: Dict[str, Any],
        qwen_result: Optional[Dict] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate construction plan.

        Args:
            object_type: detected type (foundation_strip, wall_brick, etc.)
            dimensions:  {area_m2, width_m, height_m, depth_m, volume_m3}
            qwen_result: Qwen VLM analysis result
            description: user text description

        Returns:
            {work_items, phases, warnings, required_inputs, explanation}
        """
        # Normalize object type
        obj = object_type or "generic"
        if obj not in PHASE_TEMPLATES:
            obj = "generic"

        phases_template = PHASE_TEMPLATES[obj]

        # Build phases
        phases = []
        all_items = []

        for phase_tmpl in phases_template:
            phase_items = []
            for item in phase_tmpl["items"]:
                phase_items.append({
                    "wbs": item["wbs"],
                    "name": item["name"],
                    "unit": item["unit"],
                    "norm_hours": item["norm_hours"],
                })
                all_items.append({
                    "wbs": item["wbs"],
                    "name": item["name"],
                    "unit": item["unit"],
                    "norm_hours": item["norm_hours"],
                    "phase": phase_tmpl["phase"],
                })

            phases.append({
                "id": phase_tmpl["phase"],
                "name": phase_tmpl["name"],
                "items": phase_items,
                "count": len(phase_items),
            })

        # Check SNiP rules
        warnings = []
        for rule in SNIP_RULES:
            try:
                if rule["condition"](obj, dimensions):
                    warnings.append({
                        "code": rule["code"],
                        "text": rule["warning"],
                    })
            except Exception:
                pass

        # Required inputs (what we don't know)
        required_inputs = self._get_required_inputs(obj, dimensions, qwen_result)

        # Explanation
        explanation = self._build_explanation(obj, dimensions, qwen_result, description)

        logger.info(
            f"[Planner] Plan for {obj}: "
            f"{len(all_items)} items, {len(phases)} phases, "
            f"{len(warnings)} warnings"
        )

        return {
            "object_type": obj,
            "work_items": all_items,
            "phases": phases,
            "warnings": warnings,
            "required_inputs": required_inputs,
            "explanation": explanation,
        }

    def _get_required_inputs(
        self,
        object_type: str,
        dimensions: Dict,
        qwen_result: Optional[Dict],
    ) -> List[Dict]:
        """Determine what parameters are still needed for exact calculations."""
        inputs = []

        # Check if we have area
        if not dimensions.get("area_m2"):
            if object_type in ("floor_screed", "roof_flat", "roof_gable", "slab"):
                inputs.append({
                    "key": "area_m2",
                    "type": "number",
                    "label": "Площадь (м²)",
                    "why": "Для расчёта объёмов материалов",
                })
            elif object_type.startswith("wall"):
                inputs.append({
                    "key": "wall_length",
                    "type": "number",
                    "label": "Длина стены (м)",
                    "why": "Для расчёта объёма кладки",
                })
                if not dimensions.get("height_m"):
                    inputs.append({
                        "key": "wall_height",
                        "type": "number",
                        "label": "Высота стены (м)",
                        "why": "Для расчёта объёма кладки",
                    })

        # Thickness-specific inputs
        if object_type == "floor_screed" and not dimensions.get("depth_m"):
            inputs.append({
                "key": "screed_thickness_mm",
                "type": "select",
                "label": "Толщина стяжки (мм)",
                "options": [30, 50, 70, 100],
                "default": 50,
                "why": "Для расчёта расхода смеси",
            })

        if object_type.startswith("wall") and not dimensions.get("depth_m"):
            inputs.append({
                "key": "wall_thickness_mm",
                "type": "select",
                "label": "Толщина стены (мм)",
                "options": [120, 250, 380, 510],
                "default": 250,
                "why": "Для расчёта объёма кладки",
            })

        return inputs

    def _build_explanation(
        self,
        object_type: str,
        dimensions: Dict,
        qwen_result: Optional[Dict],
        description: Optional[str],
    ) -> str:
        """Generate human-readable explanation of the plan."""
        lines = []

        TYPE_LABELS = {
            "foundation_strip": "ленточный фундамент",
            "foundation_slab": "плитный фундамент",
            "foundation_pile": "свайный фундамент",
            "wall_brick": "кирпичная кладка",
            "wall_block": "блочная кладка",
            "floor_screed": "стяжка пола",
            "slab": "перекрытие",
            "roof_flat": "плоская кровля",
            "roof_gable": "скатная кровля",
            "generic": "общестроительные работы",
        }

        label = TYPE_LABELS.get(object_type, object_type)
        lines.append(f"Тип работ: {label}.")

        if dimensions.get("area_m2"):
            lines.append(f"Площадь: {dimensions['area_m2']:.1f} м².")
        if dimensions.get("volume_m3"):
            lines.append(f"Объём: {dimensions['volume_m3']:.2f} м³.")
        if dimensions.get("width_m") and dimensions.get("height_m"):
            lines.append(f"Размеры: {dimensions['width_m']:.1f} × {dimensions['height_m']:.1f} м.")

        if qwen_result and qwen_result.get("scene_description"):
            lines.append(f"AI описание: {qwen_result['scene_description']}")

        return " ".join(lines)
