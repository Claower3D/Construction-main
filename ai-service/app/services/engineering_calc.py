"""
QazGost AI — Engineering Cost Calculator

Расчёт стоимости инженерных коммуникаций по нормативам РК:
  - Канализация (самотёчная, напорная)
  - Водопровод (холодный, горячий)
  - Отопление (радиаторы, тёплый пол)
  - Электрика (проводка, щитки, розетки)
  - Вентиляция (приточно-вытяжная)

Все цены — Казахстан 2026 (₸), с региональным коэффициентом.
"""

from typing import Dict, Any, List, Optional
from loguru import logger


# ─────────────────────────────────────────────
# Региональные коэффициенты
# ─────────────────────────────────────────────

REGIONAL_COEFF = {
    "алматы": 1.0,
    "астана": 1.15,
    "шымкент": 0.90,
    "караганда": 1.05,
    "атырау": 1.35,   # Нефтяной регион — дороже
    "актау": 1.30,
    "актобе": 1.05,
    "павлодар": 1.00,
    "усть-каменогорск": 1.05,
    "семей": 0.95,
    "тараз": 0.90,
    "кызылорда": 1.10,
    "костанай": 1.00,
    "петропавловск": 1.00,
    "туркестан": 0.90,
}


# ─────────────────────────────────────────────
# Нормативы по типам коммуникаций
# ─────────────────────────────────────────────

SEWAGE_NORMS = {
    "pipe_pvc_110": {"name": "Труба ПВХ ∅110мм", "unit": "п.м.", "price": 2800, "labor": 4500},
    "pipe_pvc_50": {"name": "Труба ПВХ ∅50мм", "unit": "п.м.", "price": 1500, "labor": 3200},
    "pipe_cast_iron_100": {"name": "Труба чугунная ∅100мм", "unit": "п.м.", "price": 8500, "labor": 7500},
    "manhole_d1000": {"name": "Колодец ∅1000мм", "unit": "шт.", "price": 85000, "labor": 45000},
    "manhole_d700": {"name": "Колодец ∅700мм", "unit": "шт.", "price": 55000, "labor": 35000},
    "trench_1m": {"name": "Траншея глубиной 1м", "unit": "п.м.", "price": 0, "labor": 12000},
    "trench_1_5m": {"name": "Траншея глубиной 1.5м", "unit": "п.м.", "price": 0, "labor": 18000},
    "backfill": {"name": "Обратная засыпка", "unit": "м³", "price": 3500, "labor": 4000},
    "sand_bed": {"name": "Песчаное основание 200мм", "unit": "п.м.", "price": 2200, "labor": 2500},
}

WATER_SUPPLY_NORMS = {
    "pipe_pp_25": {"name": "Труба ПП ∅25мм", "unit": "п.м.", "price": 950, "labor": 2800},
    "pipe_pp_32": {"name": "Труба ПП ∅32мм", "unit": "п.м.", "price": 1400, "labor": 3200},
    "pipe_pp_50": {"name": "Труба ПП ∅50мм (стояк)", "unit": "п.м.", "price": 2200, "labor": 3800},
    "valve_25": {"name": "Кран шаровый ∅25мм", "unit": "шт.", "price": 4500, "labor": 2500},
    "filter_coarse": {"name": "Фильтр грубой очистки", "unit": "шт.", "price": 8500, "labor": 3000},
    "meter_water": {"name": "Счётчик воды", "unit": "шт.", "price": 12000, "labor": 5000},
    "boiler_install": {"name": "Монтаж бойлера", "unit": "шт.", "price": 0, "labor": 25000},
}

HEATING_NORMS = {
    "pipe_pp_25_hot": {"name": "Труба ПП армированная ∅25мм", "unit": "п.м.", "price": 1800, "labor": 3500},
    "radiator_section": {"name": "Радиатор (секция)", "unit": "шт.", "price": 5500, "labor": 3000},
    "radiator_install": {"name": "Монтаж радиатора", "unit": "шт.", "price": 0, "labor": 12000},
    "warm_floor_m2": {"name": "Тёплый пол (водяной)", "unit": "м²", "price": 8500, "labor": 6000},
    "warm_floor_electric": {"name": "Тёплый пол (электрический)", "unit": "м²", "price": 12000, "labor": 4500},
    "manifold": {"name": "Коллектор тёплого пола", "unit": "шт.", "price": 35000, "labor": 15000},
}

ELECTRICAL_NORMS = {
    "wire_vvg_3x2_5": {"name": "Кабель ВВГ 3×2.5мм²", "unit": "п.м.", "price": 450, "labor": 1200},
    "wire_vvg_3x4": {"name": "Кабель ВВГ 3×4мм²", "unit": "п.м.", "price": 750, "labor": 1500},
    "socket_install": {"name": "Установка розетки", "unit": "шт.", "price": 2500, "labor": 3500},
    "switch_install": {"name": "Установка выключателя", "unit": "шт.", "price": 2000, "labor": 3000},
    "panel_12": {"name": "Щиток 12 модулей", "unit": "шт.", "price": 18000, "labor": 12000},
    "panel_24": {"name": "Щиток 24 модуля", "unit": "шт.", "price": 28000, "labor": 15000},
    "breaker_16a": {"name": "Автомат 16А", "unit": "шт.", "price": 3500, "labor": 1500},
    "rcd_40a": {"name": "УЗО 40А", "unit": "шт.", "price": 12000, "labor": 2500},
    "grounding": {"name": "Контур заземления", "unit": "комп.", "price": 35000, "labor": 25000},
}

VENTILATION_NORMS = {
    "duct_round_125": {"name": "Воздуховод ∅125мм", "unit": "п.м.", "price": 2800, "labor": 3500},
    "duct_round_200": {"name": "Воздуховод ∅200мм", "unit": "п.м.", "price": 4500, "labor": 4500},
    "duct_rect_200x100": {"name": "Воздуховод 200×100мм", "unit": "п.м.", "price": 3800, "labor": 4000},
    "fan_exhaust": {"name": "Вентилятор вытяжной", "unit": "шт.", "price": 15000, "labor": 8000},
    "fan_supply": {"name": "Приточная установка", "unit": "шт.", "price": 85000, "labor": 25000},
    "grille": {"name": "Решётка вентиляционная", "unit": "шт.", "price": 3500, "labor": 2000},
    "recuperator": {"name": "Рекуператор", "unit": "шт.", "price": 120000, "labor": 35000},
}

ALL_NORMS = {
    "sewage": SEWAGE_NORMS,
    "water_supply": WATER_SUPPLY_NORMS,
    "heating": HEATING_NORMS,
    "electrical": ELECTRICAL_NORMS,
    "ventilation": VENTILATION_NORMS,
}


class EngineeringCalculator:
    """
    QazGost AI engineering cost calculator.

    Calculates bill of quantities (BQ) for engineering systems
    based on room dimensions and project type.
    """

    def calculate_sewage(
        self,
        length_m: float,
        depth_m: float = 1.2,
        pipe_diameter: str = "pipe_pvc_110",
        manholes: int = 0,
        city: str = "алматы",
    ) -> Dict[str, Any]:
        """
        Рассчитать стоимость канализации.

        Args:
            length_m: Длина трассы в метрах
            depth_m: Глубина заложения
            pipe_diameter: Тип трубы
            manholes: Количество колодцев
            city: Город для регионального коэффициента
        """
        coeff = REGIONAL_COEFF.get(city.lower(), 1.0)
        items = []

        # Трубы
        pipe = SEWAGE_NORMS.get(pipe_diameter, SEWAGE_NORMS["pipe_pvc_110"])
        items.append({
            "name": pipe["name"],
            "volume": round(length_m * 1.05, 1),  # +5% запас
            "unit": pipe["unit"],
            "unit_price": round((pipe["price"] + pipe["labor"]) * coeff),
            "total": round(length_m * 1.05 * (pipe["price"] + pipe["labor"]) * coeff),
        })

        # Траншея
        trench_key = "trench_1_5m" if depth_m >= 1.3 else "trench_1m"
        trench = SEWAGE_NORMS[trench_key]
        items.append({
            "name": trench["name"],
            "volume": round(length_m, 1),
            "unit": trench["unit"],
            "unit_price": round(trench["labor"] * coeff),
            "total": round(length_m * trench["labor"] * coeff),
        })

        # Песчаное основание
        bed = SEWAGE_NORMS["sand_bed"]
        items.append({
            "name": bed["name"],
            "volume": round(length_m, 1),
            "unit": bed["unit"],
            "unit_price": round((bed["price"] + bed["labor"]) * coeff),
            "total": round(length_m * (bed["price"] + bed["labor"]) * coeff),
        })

        # Обратная засыпка
        backfill_vol = length_m * 0.5 * depth_m * 0.8  # 80% заполнение
        bf = SEWAGE_NORMS["backfill"]
        items.append({
            "name": bf["name"],
            "volume": round(backfill_vol, 1),
            "unit": bf["unit"],
            "unit_price": round((bf["price"] + bf["labor"]) * coeff),
            "total": round(backfill_vol * (bf["price"] + bf["labor"]) * coeff),
        })

        # Колодцы
        if manholes > 0:
            mh = SEWAGE_NORMS["manhole_d1000"]
            items.append({
                "name": mh["name"],
                "volume": manholes,
                "unit": mh["unit"],
                "unit_price": round((mh["price"] + mh["labor"]) * coeff),
                "total": round(manholes * (mh["price"] + mh["labor"]) * coeff),
            })

        works_cost = sum(i["total"] for i in items)
        materials_cost = round(works_cost * 0.45)
        total = works_cost + materials_cost

        return {
            "system": "Канализация",
            "snip_code": "СНиП РК 4.01-02-2009",
            "items": items,
            "works_cost": works_cost,
            "materials_cost": materials_cost,
            "total_cost": total,
            "timeline_days": max(3, round(length_m / 10)),
            "city": city,
            "regional_coeff": coeff,
        }

    def calculate_water_supply(
        self,
        points_count: int,
        pipe_length_m: float,
        hot_water: bool = True,
        city: str = "алматы",
    ) -> Dict[str, Any]:
        """Рассчитать стоимость водоснабжения."""
        coeff = REGIONAL_COEFF.get(city.lower(), 1.0)
        items = []

        # Трубы ПП
        pipe = WATER_SUPPLY_NORMS["pipe_pp_25"]
        total_length = pipe_length_m * (2 if hot_water else 1) * 1.1
        items.append({
            "name": pipe["name"] + (" (ХВС+ГВС)" if hot_water else " (ХВС)"),
            "volume": round(total_length, 1),
            "unit": pipe["unit"],
            "unit_price": round((pipe["price"] + pipe["labor"]) * coeff),
            "total": round(total_length * (pipe["price"] + pipe["labor"]) * coeff),
        })

        # Краны по точкам
        valve = WATER_SUPPLY_NORMS["valve_25"]
        items.append({
            "name": valve["name"],
            "volume": points_count * (2 if hot_water else 1),
            "unit": valve["unit"],
            "unit_price": round((valve["price"] + valve["labor"]) * coeff),
            "total": round(points_count * (2 if hot_water else 1) * (valve["price"] + valve["labor"]) * coeff),
        })

        # Счётчики
        meter = WATER_SUPPLY_NORMS["meter_water"]
        n_meters = 2 if hot_water else 1
        items.append({
            "name": meter["name"],
            "volume": n_meters,
            "unit": meter["unit"],
            "unit_price": round((meter["price"] + meter["labor"]) * coeff),
            "total": round(n_meters * (meter["price"] + meter["labor"]) * coeff),
        })

        # Фильтр
        filt = WATER_SUPPLY_NORMS["filter_coarse"]
        items.append({
            "name": filt["name"],
            "volume": 1,
            "unit": filt["unit"],
            "unit_price": round((filt["price"] + filt["labor"]) * coeff),
            "total": round((filt["price"] + filt["labor"]) * coeff),
        })

        works_cost = sum(i["total"] for i in items)
        total = works_cost

        return {
            "system": "Водоснабжение",
            "snip_code": "СНиП РК 4.01-02-2009",
            "items": items,
            "works_cost": round(works_cost * 0.55),
            "materials_cost": round(works_cost * 0.45),
            "total_cost": total,
            "timeline_days": max(2, round(pipe_length_m / 15)),
            "city": city,
            "regional_coeff": coeff,
        }

    def calculate_electrical(
        self,
        area_m2: float,
        sockets: int = 0,
        switches: int = 0,
        city: str = "алматы",
    ) -> Dict[str, Any]:
        """Рассчитать стоимость электрики."""
        coeff = REGIONAL_COEFF.get(city.lower(), 1.0)
        items = []

        # Авторасчёт если не указано
        if sockets == 0:
            sockets = max(6, round(area_m2 / 4))  # 1 розетка на 4м²
        if switches == 0:
            switches = max(3, round(area_m2 / 12))  # 1 выключатель на 12м²

        # Кабель: ~5 п.м. на м² площади
        wire_length = round(area_m2 * 5, 1)
        wire = ELECTRICAL_NORMS["wire_vvg_3x2_5"]
        items.append({
            "name": wire["name"],
            "volume": wire_length,
            "unit": wire["unit"],
            "unit_price": round((wire["price"] + wire["labor"]) * coeff),
            "total": round(wire_length * (wire["price"] + wire["labor"]) * coeff),
        })

        # Розетки
        sock = ELECTRICAL_NORMS["socket_install"]
        items.append({
            "name": sock["name"],
            "volume": sockets,
            "unit": sock["unit"],
            "unit_price": round((sock["price"] + sock["labor"]) * coeff),
            "total": round(sockets * (sock["price"] + sock["labor"]) * coeff),
        })

        # Выключатели
        sw = ELECTRICAL_NORMS["switch_install"]
        items.append({
            "name": sw["name"],
            "volume": switches,
            "unit": sw["unit"],
            "unit_price": round((sw["price"] + sw["labor"]) * coeff),
            "total": round(switches * (sw["price"] + sw["labor"]) * coeff),
        })

        # Щиток
        panel = ELECTRICAL_NORMS["panel_12"] if area_m2 < 80 else ELECTRICAL_NORMS["panel_24"]
        items.append({
            "name": panel["name"],
            "volume": 1,
            "unit": panel["unit"],
            "unit_price": round((panel["price"] + panel["labor"]) * coeff),
            "total": round((panel["price"] + panel["labor"]) * coeff),
        })

        # Автоматы
        n_breakers = max(6, round(sockets / 3))
        br = ELECTRICAL_NORMS["breaker_16a"]
        items.append({
            "name": br["name"],
            "volume": n_breakers,
            "unit": br["unit"],
            "unit_price": round((br["price"] + br["labor"]) * coeff),
            "total": round(n_breakers * (br["price"] + br["labor"]) * coeff),
        })

        # УЗО
        rcd = ELECTRICAL_NORMS["rcd_40a"]
        items.append({
            "name": rcd["name"],
            "volume": 1,
            "unit": rcd["unit"],
            "unit_price": round((rcd["price"] + rcd["labor"]) * coeff),
            "total": round((rcd["price"] + rcd["labor"]) * coeff),
        })

        works_cost = sum(i["total"] for i in items)

        return {
            "system": "Электрика",
            "snip_code": "ПУЭ 7-е изд., СНиП РК 4.04-05-2008",
            "items": items,
            "works_cost": round(works_cost * 0.55),
            "materials_cost": round(works_cost * 0.45),
            "total_cost": works_cost,
            "timeline_days": max(3, round(area_m2 / 15)),
            "city": city,
            "regional_coeff": coeff,
        }

    def calculate_full_estimate(
        self,
        area_m2: float,
        systems: List[str] = None,
        city: str = "алматы",
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Полная смета по всем инженерным системам.

        Args:
            area_m2: Площадь объекта
            systems: Список систем (None = все)
            city: Город
        """
        if systems is None:
            systems = ["sewage", "water_supply", "electrical"]

        results = []
        grand_total = 0

        if "sewage" in systems:
            r = self.calculate_sewage(
                length_m=kwargs.get("sewage_length_m", max(10, area_m2 * 0.3)),
                depth_m=kwargs.get("sewage_depth_m", 1.2),
                manholes=kwargs.get("manholes", max(1, round(area_m2 / 50))),
                city=city,
            )
            results.append(r)
            grand_total += r["total_cost"]

        if "water_supply" in systems:
            r = self.calculate_water_supply(
                points_count=kwargs.get("water_points", max(4, round(area_m2 / 8))),
                pipe_length_m=kwargs.get("water_pipe_m", max(15, area_m2 * 0.4)),
                hot_water=kwargs.get("hot_water", True),
                city=city,
            )
            results.append(r)
            grand_total += r["total_cost"]

        if "electrical" in systems:
            r = self.calculate_electrical(
                area_m2=area_m2,
                sockets=kwargs.get("sockets", 0),
                switches=kwargs.get("switches", 0),
                city=city,
            )
            results.append(r)
            grand_total += r["total_cost"]

        return {
            "systems": results,
            "grand_total": grand_total,
            "area_m2": area_m2,
            "city": city,
            "timeline_days": max(r["timeline_days"] for r in results) if results else 0,
        }


# Singleton
_calculator = None

def get_engineering_calculator() -> EngineeringCalculator:
    global _calculator
    if _calculator is None:
        _calculator = EngineeringCalculator()
    return _calculator
