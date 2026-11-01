"""
QazGost AI — справочник классов дефектов.

Единый источник для всех детекторов (YOLO / Roboflow / CV):
  - русское название класса;
  - базовая серьёзность и правила её корректировки (площадь, уверенность);
  - нормативная ссылка, метод устранения, ориентировочная стоимость и сроки.

Классы обученной модели (models/defect_yolov8s_best.pt):
  0 crack, 1 corrosion, 2 spalling, 3 efflorescence, 4 damage, 5 stain
"""

import math
from typing import Any, Dict, List, Optional

SEVERITY_LEVELS = ["low", "medium", "high", "critical"]
SEVERITY_RANK = {s: i for i, s in enumerate(SEVERITY_LEVELS)}

SEVERITY_TEXT_RU = {
    "critical": "5 класс — КРИТИЧЕСКИЙ (аварийный)",
    "high": "4 класс — Высокий риск",
    "medium": "3 класс — Требует устранения",
    "low": "2 класс — Незначительный",
}

GENERIC_SNIP = "ГОСТ 31937-2011 (обследование технического состояния)"

DEFECT_CLASSES: Dict[str, Dict[str, Any]] = {
    "crack": {
        "ru": "Трещина",
        "base_severity": "medium",
        "snip": "ГОСТ 31937-2011; EN 1504 (ремонт бетонных конструкций)",
        "fix": (
            "Расшивка трещины на глубину 10–20 мм, обеспыливание, грунтовка глубокого проникновения; "
            "при раскрытии > 0,3 мм — инъектирование эпоксидным/полиуретановым составом через пакеры, "
            "затем зачеканка безусадочной ремонтной смесью и армирование серпянкой."
        ),
        "cost_kzt": 30000, "days": 2,
    },
    "corrosion": {
        "ru": "Коррозия / ржавчина",
        "base_severity": "high",
        "snip": "ГОСТ 31937-2011; ГОСТ 9.402-2004 (подготовка металла под окраску)",
        "fix": (
            "Зачистка коррозии до чистого металла (Sa 2½ / St 3), обработка преобразователем ржавчины, "
            "антикоррозионный грунт и защитное покрытие; при оголении арматуры — вскрытие защитного слоя, "
            "ингибитор коррозии и восстановление ремонтным составом."
        ),
        "cost_kzt": 36000, "days": 3,
    },
    "spalling": {
        "ru": "Отслоение / скол бетона",
        "base_severity": "high",
        "snip": "ГОСТ 31937-2011; EN 1504-3 (конструкционный ремонт)",
        "fix": (
            "Удаление отслоившегося и ослабленного бетона до прочного основания, очистка арматуры, "
            "контактная грунтовка (бетон-контакт), восстановление сечения тиксотропной ремонтной смесью R3/R4."
        ),
        "cost_kzt": 33000, "days": 2,
    },
    "efflorescence": {
        "ru": "Высолы",
        "base_severity": "medium",
        "snip": "ГОСТ 31937-2011",
        "fix": (
            "Сухая очистка жёсткой щёткой, промывка специальным очистителем высолов, просушка; "
            "устранение источника влаги (гидроизоляция, отвод воды) и гидрофобизация поверхности."
        ),
        "cost_kzt": 18000, "days": 1,
    },
    "damage": {
        "ru": "Механическое повреждение",
        "base_severity": "high",
        "snip": "ГОСТ 31937-2011; EN 1504-3",
        "fix": (
            "Демонтаж повреждённого участка, при необходимости восстановление армокаркаса, "
            "заливка/набрасывание ремонтного состава повышенной прочности; оценка несущей способности инженером."
        ),
        "cost_kzt": 40000, "days": 3,
    },
    "stain": {
        "ru": "Пятно / протечка",
        "base_severity": "low",
        "snip": "ГОСТ 31937-2011",
        "fix": (
            "Выявление и устранение источника протечки, просушка конструкции, обработка антисептиком/фунгицидом, "
            "грунтовка и восстановление отделки."
        ),
        "cost_kzt": 15000, "days": 1,
    },
    "defect": {
        "ru": "Дефект поверхности",
        "base_severity": "medium",
        "snip": GENERIC_SNIP,
        "fix": "Локальный ремонт с применением сертифицированных ремонтных смесей после детального осмотра.",
        "cost_kzt": 25000, "days": 2,
    },
}

# Множители стоимости по серьёзности (от базовой стоимости класса)
_SEVERITY_COST_MULT = {"low": 0.5, "medium": 1.0, "high": 1.7, "critical": 2.7}


def normalize_class(name: Optional[str]) -> str:
    """Map any detector label (YOLO / Roboflow / CV) to a catalog class key."""
    n = (name or "").lower()
    if n in DEFECT_CLASSES:
        return n
    if "crack" in n or "fractur" in n or "fissure" in n or "трещин" in n or "разлом" in n:
        return "crack"
    if "corros" in n or "rust" in n or "ржав" in n or "корроз" in n:
        return "corrosion"
    if "spall" in n or "chip" in n or "скол" in n or "отслоен" in n or "delamin" in n:
        return "spalling"
    if "efflor" in n or "высол" in n:
        return "efflorescence"
    if "stain" in n or "leak" in n or "mold" in n or "mould" in n or "пятн" in n or "протеч" in n:
        return "stain"
    if "damage" in n or "hole" in n or "cavity" in n or "повреж" in n or "exposed" in n or "rebar" in n:
        return "damage"
    return "defect"


def class_ru(cls: str) -> str:
    return DEFECT_CLASSES.get(cls, DEFECT_CLASSES["defect"])["ru"]


def severity_for(cls: str, area_percent: float, confidence: float, extent: Optional[float] = None) -> str:
    """
    Severity by class, adjusted by size and confidence.

      площадные дефекты: base (по классу) → +1 уровень, если рамка >= 10% кадра, ещё +1 при >= 30%;
      трещины: рамка тонкой диагональной трещины огромна, поэтому используется протяжённость
               extent = длинная сторона рамки / длинная сторона кадра: +1 уровень при extent >= 0.5.
               Раскрытие трещины по фото без масштаба не измерить, поэтому одна трещина не бывает
               «critical» (аварийной) — максимум «high», дальше нужен осмотр/замер;
      −1 уровень, если уверенность < 0.35 (сомнительная детекция).
    Масштаба (мм/пиксель) на фото нет — это относительная оценка, а не замер раскрытия.
    """
    base = DEFECT_CLASSES.get(cls, DEFECT_CLASSES["defect"])["base_severity"]
    lvl = SEVERITY_RANK[base]
    if cls == "crack":
        if extent is not None and extent >= 0.5:
            lvl += 1
        if confidence < 0.35:
            lvl -= 1
        return SEVERITY_LEVELS[max(0, min(SEVERITY_RANK["high"], lvl))]
    else:
        if area_percent >= 10:
            lvl += 1
        if area_percent >= 30:
            lvl += 1
    if confidence < 0.35:
        lvl -= 1
    lvl = max(0, min(len(SEVERITY_LEVELS) - 1, lvl))
    return SEVERITY_LEVELS[lvl]


def sort_defects(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Most severe first, then most confident."""
    return sorted(items, key=lambda d: (-SEVERITY_RANK.get(d.get("severity", "medium"), 1), -float(d.get("confidence", 0))))


def fix_method(cls: str) -> str:
    return DEFECT_CLASSES.get(cls, DEFECT_CLASSES["defect"])["fix"]


def snip_code(cls: str) -> str:
    return DEFECT_CLASSES.get(cls, DEFECT_CLASSES["defect"])["snip"]


def _fmt_kzt(v: float) -> str:
    return f"{int(round(v)):,}".replace(",", " ")


def estimate_cost(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Ориентировочная стоимость ремонта: сумма по дефектам (класс × серьёзность), диапазон −20%…+30%."""
    if not items:
        return {"min_kzt": 0, "max_kzt": 0, "text": "0 ₸", "by_class": {}}
    base = 0.0
    by_class: Dict[str, float] = {}
    for d in items:
        cls = d.get("class") or "defect"
        c = DEFECT_CLASSES.get(cls, DEFECT_CLASSES["defect"])["cost_kzt"] * _SEVERITY_COST_MULT.get(d.get("severity", "medium"), 1.0)
        base += c
        by_class[cls] = by_class.get(cls, 0.0) + c
    lo, hi = base * 0.8, base * 1.3
    return {
        "min_kzt": int(round(lo)),
        "max_kzt": int(round(hi)),
        "text": f"{_fmt_kzt(lo)} – {_fmt_kzt(hi)} ₸",
        "by_class": {k: int(round(v)) for k, v in by_class.items()},
    }


def work_days(items: List[Dict[str, Any]]) -> int:
    """Срок: самая длительная работа + по полдня на каждый дополнительный дефект (не больше 30)."""
    if not items:
        return 0
    days = [DEFECT_CLASSES.get(d.get("class") or "defect", DEFECT_CLASSES["defect"])["days"] for d in items]
    return int(min(30, max(1, math.ceil(max(days) + 0.5 * (len(items) - 1)))))


def fix_methods_by_class(items: List[Dict[str, Any]]) -> Dict[str, Dict[str, str]]:
    """Методы устранения для каждого найденного класса (для подробного отчёта)."""
    out: Dict[str, Dict[str, str]] = {}
    for d in items:
        cls = d.get("class") or "defect"
        if cls not in out:
            out[cls] = {"type": class_ru(cls), "fixMethod": fix_method(cls), "snipCode": snip_code(cls)}
    return out
