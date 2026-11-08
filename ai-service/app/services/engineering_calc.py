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

import math
from typing import Dict, Any, List, Optional
from loguru import logger


# ─────────────────────────────────────────────
# Региональные коэффициенты
# ─────────────────────────────────────────────

# Города, которые есть в app/data/price_db.json → "regional_coefficients" (общая таблица с Go-бэкендом),
# должны совпадать с ней один в один; остальные (актау, кызылорда, петропавловск, туркестан) — только здесь.
REGIONAL_COEFF = {
    "алматы": 1.0,
    "астана": 1.15,
    "шымкент": 0.95,
    "караганда": 1.05,
    "атырау": 1.25,   # Нефтяной регион — дороже
    "актау": 1.30,
    "актобе": 1.10,
    "павлодар": 1.08,
    "усть-каменогорск": 1.12,
    "семей": 1.00,
    "тараз": 0.90,
    "кызылорда": 1.10,
    "костанай": 1.05,
    "петропавловск": 1.00,
    "туркестан": 0.90,
}

# Латинские / альтернативные написания → ключ REGIONAL_COEFF
CITY_ALIASES = {
    "almaty": "алматы", "alma-ata": "алматы", "алма-ата": "алматы",
    "astana": "астана", "nur-sultan": "астана", "нур-султан": "астана",
    "shymkent": "шымкент", "chimkent": "шымкент",
    "karaganda": "караганда", "karagandy": "караганда", "қарағанды": "караганда",
    "atyrau": "атырау",
    "aktau": "актау", "ақтау": "актау",
    "aktobe": "актобе", "ақтөбе": "актобе",
    "pavlodar": "павлодар",
    "ust-kamenogorsk": "усть-каменогорск", "oskemen": "усть-каменогорск", "өскемен": "усть-каменогорск",
    "semey": "семей", "semei": "семей",
    "taraz": "тараз",
    "kyzylorda": "кызылорда", "қызылорда": "кызылорда",
    "kostanay": "костанай", "qostanay": "костанай",
    "petropavlovsk": "петропавловск", "petropavl": "петропавловск",
    "turkestan": "туркестан", "türkistan": "туркестан",
}

SUPPORTED_SYSTEMS = ("sewage", "water_supply", "electrical")

# Геометрия траншеи канализации (для объёма обратной засыпки)
SEWAGE_TRENCH_WIDTH_M = 0.5      # ширина траншеи по дну, м (принятая в калькуляторе)
SEWAGE_SAND_BED_M = 0.2          # толщина песчаного основания (см. sand_bed «200мм»), м
# Наружный диаметр трубы, м — вычитается из объёма засыпки
SEWAGE_PIPE_OD_M = {
    "pipe_pvc_110": 0.110,
    "pipe_pvc_50": 0.050,
    "pipe_cast_iron_100": 0.118,  # чугун ДУ100 — наружный ∅118 мм
}


def normalize_city(name: Optional[str]) -> Optional[str]:
    """Return the REGIONAL_COEFF key for a city name (Cyrillic/Latin, any case) or None if unknown."""
    if not name:
        return None
    key = " ".join(str(name).strip().lower().replace("ё", "е").split())
    key = key.replace("г. ", "").replace("город ", "").strip()
    if key in REGIONAL_COEFF:
        return key
    return CITY_ALIASES.get(key)


def round_half_up(x: float) -> int:
    """Commercial rounding (0.5 → up), same as Excel ROUND(x, 0) — Python's round() is banker's."""
    from decimal import Decimal, ROUND_HALF_UP
    return int(Decimal(str(x)).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def make_item(norm: Dict[str, Any], volume: float, coeff: float, decimals: int = 1) -> Dict[str, Any]:
    """
    One bill-of-quantities line.

    unit_price = (материал + работа) × коэффициент, округление до тенге;
    total = ROUND(volume × unit_price) — ровно то, что считает формула в Excel;
    materials/works — доля материала и работы в total по нормативу.
    """
    vol = round(float(volume), decimals) if decimals else int(volume)
    unit_price = round_half_up((norm["price"] + norm["labor"]) * coeff)
    total = round_half_up(vol * unit_price) if decimals else int(vol) * unit_price
    denom = norm["price"] + norm["labor"]
    materials = round_half_up(total * norm["price"] / denom) if denom else 0
    return {
        "name": norm["name"],
        "volume": vol,
        "unit": norm["unit"],
        "unit_price": unit_price,
        "total": total,
        "materials": materials,
        "works": total - materials,
    }


def _summary(items: List[Dict[str, Any]]) -> Dict[str, int]:
    total = sum(i["total"] for i in items)
    materials = sum(i["materials"] for i in items)
    return {"works_cost": total - materials, "materials_cost": materials, "total_cost": total}


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

    @staticmethod
    def _coeff(city: str) -> float:
        key = normalize_city(city)
        return REGIONAL_COEFF[key] if key else 1.0

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
            pipe_diameter: Тип трубы (ключ SEWAGE_NORMS)
            manholes: Количество колодцев
            city: Город для регионального коэффициента

        Цена позиции уже включает материал и работу, поэтому итог = сумма позиций
        (раньше сверху добавлялось ещё 45% «материалов» — двойной счёт).
        """
        coeff = self._coeff(city)
        pipe_key = pipe_diameter if pipe_diameter in SEWAGE_NORMS else "pipe_pvc_110"
        pipe = SEWAGE_NORMS[pipe_key]
        trench = SEWAGE_NORMS["trench_1_5m" if depth_m >= 1.3 else "trench_1m"]
        # Засыпка = объём траншеи − песчаное основание − объём трубы (раньше — фиксированные 80% объёма,
        # без учёта глубины и диаметра трубы).
        w = SEWAGE_TRENCH_WIDTH_M
        pipe_od = SEWAGE_PIPE_OD_M.get(pipe_key, 0.110)
        pipe_area = math.pi * (pipe_od / 2) ** 2
        backfill_vol = length_m * max(0.0, w * depth_m - w * SEWAGE_SAND_BED_M - pipe_area)

        items = [
            make_item(pipe, length_m * 1.05, coeff),               # +5% запас
            make_item(trench, length_m, coeff),
            make_item(SEWAGE_NORMS["sand_bed"], length_m, coeff),
            make_item(SEWAGE_NORMS["backfill"], backfill_vol, coeff),
        ]
        if manholes > 0:
            items.append(make_item(SEWAGE_NORMS["manhole_d1000"], manholes, coeff, decimals=0))

        return {
            "system": "Канализация",
            # СНиП РК 4.01-02-2009 — это «Водоснабжение. Наружные сети», не канализация
            "snip_code": "СП РК 4.01-103-2013",
            "items": items,
            **_summary(items),
            "timeline_days": max(3, round_half_up(length_m / 10)),
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
        coeff = self._coeff(city)
        k = 2 if hot_water else 1

        pipe = dict(WATER_SUPPLY_NORMS["pipe_pp_25"])
        pipe["name"] = pipe["name"] + (" (ХВС+ГВС)" if hot_water else " (ХВС)")
        items = [
            make_item(pipe, pipe_length_m * k * 1.1, coeff),        # +10% запас
            make_item(WATER_SUPPLY_NORMS["valve_25"], points_count * k, coeff, decimals=0),
            make_item(WATER_SUPPLY_NORMS["meter_water"], k, coeff, decimals=0),
            make_item(WATER_SUPPLY_NORMS["filter_coarse"], 1, coeff, decimals=0),
        ]

        return {
            "system": "Водоснабжение",
            # Внутренний водопровод (точки, краны, счётчики), а не наружные сети
            "snip_code": "СП РК 4.01-101-2012",
            "items": items,
            **_summary(items),
            "timeline_days": max(2, round_half_up(pipe_length_m / 15)),
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
        coeff = self._coeff(city)

        # Авторасчёт если не указано
        if sockets == 0:
            sockets = max(6, round_half_up(area_m2 / 4))   # 1 розетка на 4 м²
        if switches == 0:
            switches = max(3, round_half_up(area_m2 / 12))  # 1 выключатель на 12 м²
        n_breakers = max(6, round_half_up(sockets / 3))

        items = [
            make_item(ELECTRICAL_NORMS["wire_vvg_3x2_5"], area_m2 * 5, coeff),  # ~5 п.м. кабеля на м²
            make_item(ELECTRICAL_NORMS["socket_install"], sockets, coeff, decimals=0),
            make_item(ELECTRICAL_NORMS["switch_install"], switches, coeff, decimals=0),
            make_item(ELECTRICAL_NORMS["panel_12" if area_m2 < 80 else "panel_24"], 1, coeff, decimals=0),
            make_item(ELECTRICAL_NORMS["breaker_16a"], n_breakers, coeff, decimals=0),
            make_item(ELECTRICAL_NORMS["rcd_40a"], 1, coeff, decimals=0),
        ]

        return {
            "system": "Электрика",
            "snip_code": "ПУЭ РК, СП РК 4.04-106-2013",
            "items": items,
            **_summary(items),
            "timeline_days": max(3, round_half_up(area_m2 / 15)),
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
            systems = list(SUPPORTED_SYSTEMS)

        results = []
        grand_total = 0

        if "sewage" in systems:
            r = self.calculate_sewage(
                length_m=kwargs.get("sewage_length_m", max(10, area_m2 * 0.3)),
                depth_m=kwargs.get("sewage_depth_m", 1.2),
                pipe_diameter=kwargs.get("pipe_type", "pipe_pvc_110"),
                manholes=kwargs.get("manholes", max(1, round_half_up(area_m2 / 50))),
                city=city,
            )
            results.append(r)
            grand_total += r["total_cost"]

        if "water_supply" in systems:
            r = self.calculate_water_supply(
                points_count=kwargs.get("water_points", max(4, round_half_up(area_m2 / 8))),
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
            "regional_coeff": self._coeff(city),
            "timeline_days": max(r["timeline_days"] for r in results) if results else 0,
        }


# Singleton
_calculator = None

def get_engineering_calculator() -> EngineeringCalculator:
    global _calculator
    if _calculator is None:
        _calculator = EngineeringCalculator()
    return _calculator
