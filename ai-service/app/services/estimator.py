"""
QAZGOST AI - Auto-Estimation Service

Automatically generate estimate items from detected objects.
Uses real price database (~24000 items) exported from frontend.
"""

import json
import os
import threading
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger


# ═══════════════════════════════════════════════════════════════════════
# Price Database Loader (singleton)
# ═══════════════════════════════════════════════════════════════════════
_price_db: Optional[Dict] = None
_price_db_lock = threading.Lock()

def _load_price_db() -> Dict:
    """Load price_db.json (works + materials + equipment) once."""
    global _price_db
    if _price_db is not None:
        return _price_db
    with _price_db_lock:
        if _price_db is not None:
            return _price_db

    db_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "price_db.json"
    )
    db_path = os.path.normpath(db_path)

    if not os.path.exists(db_path):
        logger.warning(f"[PriceDB] File not found: {db_path}")
        _price_db = {"works": {}, "materials": {}, "equipment": {}, "regional_coefficients": {}}
        return _price_db

    try:
        with open(db_path, "r", encoding="utf-8") as f:
            _price_db = json.load(f)
        w = len(_price_db.get("works", {}))
        m = len(_price_db.get("materials", {}))
        e = len(_price_db.get("equipment", {}))
        logger.info(f"[PriceDB] Loaded: {w} works, {m} materials, {e} equipment = {w+m+e} total")
    except Exception as exc:
        logger.error(f"[PriceDB] Failed to load: {exc}")
        _price_db = {"works": {}, "materials": {}, "equipment": {}, "regional_coefficients": {}}

    return _price_db


def search_items(query: str, item_type: str = "all", limit: int = 10) -> List[Dict]:
    """
    Fuzzy search across price database.
    item_type: 'works' | 'materials' | 'equipment' | 'all'
    Returns list of {code, name, unit, price, category, type, score}.
    """
    db = _load_price_db()
    query_lower = query.lower().strip()
    if not query_lower:
        return []

    results = []
    sections = []
    if item_type in ("works", "all"):
        sections.append(("works", db.get("works", {})))
    if item_type in ("materials", "all"):
        sections.append(("materials", db.get("materials", {})))
    if item_type in ("equipment", "all"):
        sections.append(("equipment", db.get("equipment", {})))

    query_words = query_lower.split()

    for section_name, section_data in sections:
        for code, item in section_data.items():
            name_lower = item.get("name", "").lower()
            # Score: count how many query words match
            score = 0
            for w in query_words:
                if w in name_lower:
                    score += 1
                elif w in code.lower():
                    score += 0.5
            if score > 0:
                results.append({
                    "code": code,
                    "name": item.get("name", ""),
                    "unit": item.get("unit", ""),
                    "price": item.get("price", 0),
                    "category": item.get("category", ""),
                    "type": section_name,
                    "score": score / len(query_words) if query_words else 0,
                })

    # Sort by score descending, then by name
    results.sort(key=lambda x: (-x["score"], x["name"]))
    return results[:limit]


def get_price(code: str) -> Optional[Dict]:
    """Get item by exact code from any section."""
    db = _load_price_db()
    for section in ("works", "materials", "equipment"):
        items = db.get(section, {})
        if code in items:
            return {**items[code], "code": code, "type": section}
    return None


class AutoEstimator:
    """
    Generate construction estimates from detected objects.
    
    Maps detected objects to work items and materials,
    applies regional pricing coefficients.
    """
    
    # Mapping: object_type -> list of work items
    # Includes both CV detection classes and VLM objectTypes
    WORK_MAPPINGS = {
        # === CV Detection Classes ===
        "trench": [
            {"code": "WORK-TRENCH-DIG", "name": "Рытье траншеи механизированным способом", "unit": "m3", "multiplier": 1.0, "base_price": 3500},
            {"code": "WORK-BACKFILL", "name": "Обратная засыпка грунта", "unit": "m3", "multiplier": 0.8, "base_price": 1500},
        ],
        "pit": [
            {"code": "WORK-EXCAVATION", "name": "Разработка котлована", "unit": "m3", "multiplier": 1.0, "base_price": 4000},
            {"code": "WORK-SLOPE-REINFORCE", "name": "Укрепление откосов", "unit": "m2", "multiplier": 0.5, "base_price": 2500},
        ],
        "foundation": [
            {"code": "WORK-FORMWORK", "name": "Устройство опалубки", "unit": "m2", "multiplier": 2.0, "base_price": 1800},
            {"code": "WORK-REBAR", "name": "Армирование", "unit": "kg", "multiplier": 100, "base_price": 150},
            {"code": "WORK-CONCRETE-POUR", "name": "Заливка бетона", "unit": "m3", "multiplier": 1.0, "base_price": 8000},
        ],
        "pipe_pvc": [
            {"code": "WORK-PIPE-LAY", "name": "Укладка ПВХ трубы", "unit": "m", "multiplier": 1.0, "base_price": 800},
            {"code": "WORK-PIPE-JOIN", "name": "Соединение труб", "unit": "pcs", "multiplier": 0.2, "base_price": 500},
            {"code": "MAT-SAND-BED", "name": "Песчаная подушка под трубу", "unit": "m3", "multiplier": 0.1, "base_price": 8000},
        ],
        "pipe_hdpe": [
            {"code": "WORK-PIPE-LAY", "name": "Укладка ПНД трубы", "unit": "m", "multiplier": 1.0, "base_price": 900},
            {"code": "WORK-PIPE-FUSION", "name": "Сварка ПНД", "unit": "pcs", "multiplier": 0.15, "base_price": 800},
        ],
        "pipe_metal": [
            {"code": "WORK-PIPE-LAY", "name": "Укладка металлической трубы", "unit": "m", "multiplier": 1.0, "base_price": 1200},
            {"code": "WORK-PIPE-WELD", "name": "Сварка стыков", "unit": "pcs", "multiplier": 0.1, "base_price": 1500},
        ],
        "manhole": [
            {"code": "WORK-MANHOLE-INSTALL", "name": "Установка колодца", "unit": "pcs", "multiplier": 1.0, "base_price": 45000},
            {"code": "WORK-MANHOLE-CONNECT", "name": "Подключение труб к колодцу", "unit": "pcs", "multiplier": 2.0, "base_price": 5000},
        ],
        "gravel_bed": [
            {"code": "WORK-BEDDING", "name": "Устройство щебёночного основания", "unit": "m3", "multiplier": 1.0, "base_price": 2500},
            {"code": "WORK-COMPACTION", "name": "Уплотнение основания", "unit": "m2", "multiplier": 1.0, "base_price": 800},
        ],
        "sand_bed": [
            {"code": "WORK-BEDDING", "name": "Устройство песчаного основания", "unit": "m3", "multiplier": 1.0, "base_price": 2000},
            {"code": "WORK-COMPACTION", "name": "Уплотнение основания", "unit": "m2", "multiplier": 1.0, "base_price": 600},
        ],
        "rebar": [
            {"code": "WORK-REBAR-INSTALL", "name": "Установка арматуры", "unit": "kg", "multiplier": 1.0, "base_price": 120},
        ],
        "waterproofing": [
            {"code": "WORK-WATERPROOF", "name": "Гидроизоляция", "unit": "m2", "multiplier": 1.0, "base_price": 1500},
        ],
        "insulation": [
            {"code": "WORK-INSULATION", "name": "Теплоизоляция", "unit": "m2", "multiplier": 1.0, "base_price": 1200},
        ],
        "formwork": [
            {"code": "WORK-FORMWORK", "name": "Устройство опалубки", "unit": "m2", "multiplier": 1.0, "base_price": 1800},
        ],
        # === VLM ObjectTypes (from Qwen analysis) ===
        "foundation_strip": [
            {"code": "WORK-STRIP-EXCAVATION", "name": "Рытье траншеи под ленточный фундамент", "unit": "m3", "multiplier": 1.2, "base_price": 3500},
            {"code": "WORK-STRIP-FORMWORK", "name": "Устройство опалубки ленточного фундамента", "unit": "m2", "multiplier": 2.5, "base_price": 1800},
            {"code": "WORK-STRIP-REBAR", "name": "Армирование ленточного фундамента", "unit": "kg", "multiplier": 120, "base_price": 150},
            {"code": "WORK-STRIP-CONCRETE", "name": "Заливка бетона М300", "unit": "m3", "multiplier": 1.0, "base_price": 9500},
            {"code": "WORK-STRIP-WATERPROOF", "name": "Гидроизоляция фундамента", "unit": "m2", "multiplier": 2.0, "base_price": 1500},
        ],
        "foundation_slab": [
            {"code": "WORK-SLAB-EXCAVATION", "name": "Разработка котлована под плитный фундамент", "unit": "m3", "multiplier": 0.5, "base_price": 4000},
            {"code": "WORK-SLAB-BEDDING", "name": "Устройство щебёночной подушки", "unit": "m3", "multiplier": 0.3, "base_price": 2500},
            {"code": "WORK-SLAB-FORMWORK", "name": "Устройство опалубки плиты", "unit": "m2", "multiplier": 1.5, "base_price": 1800},
            {"code": "WORK-SLAB-REBAR", "name": "Армирование плитного фундамента (2 сетки)", "unit": "kg", "multiplier": 200, "base_price": 150},
            {"code": "WORK-SLAB-CONCRETE", "name": "Заливка бетона М350", "unit": "m3", "multiplier": 1.0, "base_price": 10500},
        ],
        "foundation_pile": [
            {"code": "WORK-PILE-DRILL", "name": "Бурение скважин под сваи", "unit": "m", "multiplier": 6.0, "base_price": 3000},
            {"code": "WORK-PILE-REBAR", "name": "Армирование свай", "unit": "kg", "multiplier": 80, "base_price": 150},
            {"code": "WORK-PILE-CONCRETE", "name": "Заливка свай бетоном", "unit": "m3", "multiplier": 0.5, "base_price": 9000},
            {"code": "WORK-PILE-ROST", "name": "Устройство ростверка", "unit": "m3", "multiplier": 0.8, "base_price": 11000},
        ],
        "wall_brick": [
            {"code": "WORK-BRICK-MASONRY", "name": "Кирпичная кладка", "unit": "m3", "multiplier": 1.0, "base_price": 12000},
            {"code": "MAT-BRICK", "name": "Кирпич керамический", "unit": "pcs", "multiplier": 400, "base_price": 45},
            {"code": "MAT-MORTAR", "name": "Раствор кладочный", "unit": "m3", "multiplier": 0.25, "base_price": 6000},
        ],
        "wall_block": [
            {"code": "WORK-BLOCK-MASONRY", "name": "Кладка из блоков", "unit": "m3", "multiplier": 1.0, "base_price": 8000},
            {"code": "MAT-BLOCK", "name": "Блоки стеновые", "unit": "pcs", "multiplier": 30, "base_price": 500},
            {"code": "MAT-ADHESIVE", "name": "Клей для блоков", "unit": "kg", "multiplier": 15, "base_price": 200},
        ],
        "roof_flat": [
            {"code": "WORK-ROOF-FLAT", "name": "Устройство плоской кровли", "unit": "m2", "multiplier": 1.0, "base_price": 3500},
            {"code": "WORK-ROOF-WATERPROOF", "name": "Гидроизоляция кровли", "unit": "m2", "multiplier": 1.0, "base_price": 2000},
            {"code": "WORK-ROOF-INSULATE", "name": "Теплоизоляция кровли", "unit": "m2", "multiplier": 1.0, "base_price": 1800},
        ],
        "roof_gable": [
            {"code": "WORK-ROOF-FRAME", "name": "Устройство стропильной системы", "unit": "m2", "multiplier": 1.0, "base_price": 5000},
            {"code": "WORK-ROOF-COVER", "name": "Покрытие кровли профнастилом", "unit": "m2", "multiplier": 1.15, "base_price": 2500},
            {"code": "WORK-ROOF-INSULATE", "name": "Утепление кровли минватой", "unit": "m2", "multiplier": 1.0, "base_price": 1800},
        ],
        "slab": [
            {"code": "WORK-SLAB-FORMWORK", "name": "Опалубка перекрытия", "unit": "m2", "multiplier": 1.0, "base_price": 2500},
            {"code": "WORK-SLAB-REBAR", "name": "Армирование перекрытия", "unit": "kg", "multiplier": 150, "base_price": 150},
            {"code": "WORK-SLAB-CONCRETE", "name": "Заливка плиты перекрытия М300", "unit": "m3", "multiplier": 0.2, "base_price": 9500},
        ],
        "floor_screed": [
            {"code": "WORK-SCREED", "name": "Устройство цементной стяжки", "unit": "m2", "multiplier": 1.0, "base_price": 1500},
            {"code": "MAT-SCREED-MIX", "name": "Сухая смесь для стяжки", "unit": "kg", "multiplier": 20, "base_price": 60},
        ],
        "concrete_slab": [
            {"code": "WORK-SLAB-INSTALL", "name": "Монтаж ж/б плит", "unit": "pcs", "multiplier": 1.0, "base_price": 15000},
            {"code": "WORK-SLAB-GROUT", "name": "Заделка швов плит", "unit": "m", "multiplier": 3.0, "base_price": 800},
        ],
        "pile": [
            {"code": "WORK-PILE-INSTALL", "name": "Установка сваи", "unit": "pcs", "multiplier": 1.0, "base_price": 25000},
        ],
        # === Defect types (repair cost estimation) ===
        "crack": [
            {"code": "WORK-CRACK-REPAIR", "name": "Ремонт трещин (инъектирование)", "unit": "m", "multiplier": 1.0, "base_price": 3000},
        ],
        "defect": [
            {"code": "WORK-DEFECT-REPAIR", "name": "Устранение дефектов", "unit": "m2", "multiplier": 1.0, "base_price": 2500},
        ],
        "crack_minor": [
            {"code": "WORK-CRACK-SEAL", "name": "Расшивка и герметизация трещин", "unit": "m", "multiplier": 1.0, "base_price": 1500},
        ],
        "crack_severe": [
            {"code": "WORK-CRACK-INJECT", "name": "Инъектирование трещин эпоксидным составом", "unit": "m", "multiplier": 1.0, "base_price": 5000},
            {"code": "WORK-CRACK-REINFORCE", "name": "Усиление карбоновыми ламелями", "unit": "m", "multiplier": 1.0, "base_price": 8000},
        ],
        "stain_water": [
            {"code": "WORK-STAIN-DRY", "name": "Просушка, устранение протечки", "unit": "m2", "multiplier": 1.0, "base_price": 2000},
            {"code": "WORK-STAIN-REPAINT", "name": "Очистка и перекраска поверхности", "unit": "m2", "multiplier": 1.0, "base_price": 1200},
        ],
        "stain_mold": [
            {"code": "WORK-MOLD-TREAT", "name": "Противогрибковая обработка", "unit": "m2", "multiplier": 1.0, "base_price": 3500},
            {"code": "WORK-MOLD-REMOVE", "name": "Удаление плесени и грибка", "unit": "m2", "multiplier": 1.0, "base_price": 2500},
        ],
        "stain_oil": [
            {"code": "WORK-OIL-CLEAN", "name": "Обезжиривание и очистка поверхности", "unit": "m2", "multiplier": 1.0, "base_price": 1800},
        ],
        "rust_surface": [
            {"code": "WORK-RUST-CLEAN", "name": "Пескоструйная очистка от ржавчины", "unit": "m2", "multiplier": 1.0, "base_price": 2500},
            {"code": "WORK-RUST-PRIME", "name": "Антикоррозийное покрытие (2 слоя)", "unit": "m2", "multiplier": 1.0, "base_price": 1500},
        ],
        "rust_deep": [
            {"code": "WORK-RUST-REPLACE", "name": "Замена корродированных элементов", "unit": "m2", "multiplier": 1.0, "base_price": 8000},
            {"code": "WORK-ANTICOR", "name": "Антикоррозийная защита", "unit": "m2", "multiplier": 1.0, "base_price": 2000},
        ],
        "efflorescence": [
            {"code": "WORK-EFFLOR-CLEAN", "name": "Удаление высолов кислотным раствором", "unit": "m2", "multiplier": 1.0, "base_price": 1500},
            {"code": "WORK-EFFLOR-PROTECT", "name": "Гидрофобизация поверхности", "unit": "m2", "multiplier": 1.0, "base_price": 1200},
        ],
    }
    
    # Regional price coefficients
    REGIONAL_COEFFICIENTS = {
        "almaty": 1.0,
        "astana": 1.15,
        "shymkent": 0.95,
        "karaganda": 1.05,
        "aktobe": 1.10,
        "aktau": 1.25,
        "atyrau": 1.30,
        "ust-kamenogorsk": 1.08,
        "pavlodar": 1.05,
        "kostanay": 1.02,
        "petropavl": 1.03,
        "taraz": 0.98,
        "semey": 1.02,
        "kyzylorda": 1.15,
        "oral": 1.12,
        "taldykorgan": 1.05,
        "turkestan": 1.00,
    }
    
    # Seasonal coefficients
    SEASONAL_COEFFICIENTS = {
        1: 1.20,   # January - winter
        2: 1.20,   # February - winter
        3: 1.10,   # March - early spring
        4: 1.05,   # April - spring
        5: 1.00,   # May - spring
        6: 1.00,   # June - summer
        7: 1.00,   # July - summer
        8: 1.00,   # August - summer
        9: 1.05,   # September - autumn
        10: 1.10,  # October - autumn
        11: 1.15,  # November - late autumn
        12: 1.20,  # December - winter
    }
    
    def __init__(
        self,
        region: str = "almaty",
        apply_seasonal: bool = True
    ):
        self.region = region.lower()
        self.apply_seasonal = apply_seasonal
        
        # Load real price database
        self.price_db = _load_price_db()
        self.db_works = self.price_db.get("works", {})
        self.db_materials = self.price_db.get("materials", {})
        self.db_equipment = self.price_db.get("equipment", {})
        self.db_total = len(self.db_works) + len(self.db_materials) + len(self.db_equipment)
        
        # Get regional coefficient (prefer DB, fallback to hardcoded)
        db_regions = self.price_db.get("regional_coefficients", {})
        # Map Russian region names to codes
        region_name_map = {
            "almaty": "Алматы", "astana": "Астана", "shymkent": "Шымкент",
            "karaganda": "Караганда", "aktobe": "Актобе", "atyrau": "Атырау",
            "pavlodar": "Павлодар", "kostanay": "Костанай", "semey": "Семей",
            "taraz": "Тараз", "ust-kamenogorsk": "Усть-Каменогорск",
        }
        ru_name = region_name_map.get(self.region, "")
        if ru_name and ru_name in db_regions:
            self.regional_coef = db_regions[ru_name]
        else:
            self.regional_coef = self.REGIONAL_COEFFICIENTS.get(self.region, 1.0)
        
        # Get seasonal coefficient (current month)
        if apply_seasonal:
            from datetime import datetime
            month = datetime.now().month
            self.seasonal_coef = self.SEASONAL_COEFFICIENTS.get(month, 1.0)
        else:
            self.seasonal_coef = 1.0
        
        self.total_coefficient = self.regional_coef * self.seasonal_coef
        
        logger.info(
            f"Estimator initialized: region={self.region} "
            f"(coef={self.regional_coef}), seasonal={self.seasonal_coef}, "
            f"price_db={self.db_total} items"
        )
    
    def enrich_with_real_prices(self, items: List[Dict]) -> List[Dict]:
        """
        Enrich estimate items with real prices from price_db.json.
        
        For each item, search the database for matching work/material
        and replace base_price with the real price if found.
        """
        if not self.db_total:
            return items
        
        enriched = []
        for item in items:
            work_name = item.get("work_name", "")
            
            # Search for matching work in database
            matches = search_items(work_name, item_type="works", limit=3)
            
            if matches and matches[0]["score"] >= 0.5:
                best = matches[0]
                # Use real price from database
                real_price = best["price"] * self.total_coefficient
                old_total = item["total_price"]
                new_total = item["quantity"] * real_price
                
                enriched_item = {
                    **item,
                    "unit_price": round(real_price, 2),
                    "total_price": round(new_total, 2),
                    "db_code": best["code"],
                    "db_name": best["name"],
                    "db_unit": best["unit"],
                    "db_base_price": best["price"],
                    "price_source": "database",
                }
                enriched.append(enriched_item)
                
                if abs(old_total - new_total) > 100:
                    logger.debug(
                        f"  Price updated: '{work_name}' → '{best['name']}' "
                        f"({old_total:,.0f} → {new_total:,.0f} KZT)"
                    )
            else:
                # Keep original hardcoded price
                enriched.append({**item, "price_source": "hardcoded"})
        
        return enriched
    

    def generate(
        self,
        detections: List,  # List of DetectionResult from API
        measurements: Dict[str, Any]
    ) -> Tuple[List[Dict], float, float]:
        """
        Generate estimate from detections.
        
        Args:
            detections: List of detected objects with measurements
            measurements: Aggregated measurements by class
        
        Returns:
            Tuple of:
            - List of estimate items
            - Total price
            - Average confidence
        """
        items = []
        total_confidence = 0
        
        for det in detections:
            class_name = det.class_name
            
            # Skip reference objects
            if class_name in ["measuring_tape", "person", "excavator_bucket"]:
                continue
            
            # Get work mappings for this class
            mappings = self.WORK_MAPPINGS.get(class_name)
            if not mappings:
                logger.debug(f"No work mapping for: {class_name}")
                continue
            
            # Calculate quantities based on measurements
            for mapping in mappings:
                unit = mapping["unit"]
                multiplier = mapping["multiplier"]
                base_price = mapping["base_price"]
                
                # Determine quantity based on unit
                quantity = self._calculate_quantity(det, unit, multiplier)
                
                if quantity <= 0:
                    continue
                
                # Apply coefficients to price
                unit_price = base_price * self.total_coefficient
                total = quantity * unit_price
                
                item = {
                    "work_code": mapping["code"],
                    "work_name": mapping["name"],
                    "unit": unit,
                    "quantity": round(quantity, 2),
                    "unit_price": round(unit_price, 2),
                    "total_price": round(total, 2),
                    "confidence": det.confidence,
                    "source_object": class_name
                }
                items.append(item)
                total_confidence += det.confidence
        
        # Merge duplicate items
        items = self._merge_items(items)
        
        # Enrich with real prices from database (replace hardcoded)
        items = self.enrich_with_real_prices(items)
        
        # Calculate totals
        total_price = sum(item["total_price"] for item in items)
        avg_confidence = total_confidence / len(detections) if detections else 0
        
        db_count = sum(1 for i in items if i.get("price_source") == "database")
        logger.info(
            f"Generated estimate: {len(items)} items, "
            f"total={total_price:,.0f} KZT, confidence={avg_confidence:.2f}, "
            f"db_prices={db_count}/{len(items)}"
        )
        
        return items, round(total_price, 2), round(avg_confidence, 2)

    
    def _calculate_quantity(
        self,
        detection,
        unit: str,
        multiplier: float
    ) -> float:
        """Calculate quantity based on unit type and detection measurements."""
        
        if unit == "m3":
            # Volume
            if detection.volume_m3:
                return detection.volume_m3 * multiplier
            elif detection.area_m2 and detection.depth_m:
                return detection.area_m2 * detection.depth_m * multiplier
            elif detection.area_m2:
                return detection.area_m2 * 1.0 * multiplier  # Assume 1m depth
            else:
                return 1.0 * multiplier  # Fallback
        
        elif unit == "m2":
            # Area
            if detection.area_m2:
                return detection.area_m2 * multiplier
            elif detection.width_m and detection.height_m:
                return detection.width_m * detection.height_m * multiplier
            else:
                return 1.0 * multiplier
        
        elif unit == "m":
            # Length (use max of width/height)
            if detection.width_m or detection.height_m:
                return max(detection.width_m or 0, detection.height_m or 0) * multiplier
            else:
                return 1.0 * multiplier
        
        elif unit == "kg":
            # Weight (typically for rebar, based on volume)
            if detection.volume_m3:
                return detection.volume_m3 * multiplier  # multiplier = kg/m3
            else:
                return 10.0 * multiplier  # Fallback
        
        elif unit == "pcs":
            # Pieces (count)
            return 1.0 * multiplier
        
        else:
            return 1.0 * multiplier
    
    def _merge_items(self, items: List[Dict]) -> List[Dict]:
        """Merge items with same work code."""
        merged = {}
        merge_counts = {}  # track count for proper confidence averaging
        
        for item in items:
            code = item["work_code"]
            
            if code in merged:
                # Add quantities
                merged[code]["quantity"] += item["quantity"]
                merged[code]["total_price"] += item["total_price"]
                # Track confidence sum for proper averaging
                merge_counts[code] += 1
                merged[code]["_conf_sum"] += item["confidence"]
                merged[code]["confidence"] = round(
                    merged[code]["_conf_sum"] / merge_counts[code], 3
                )
            else:
                merged[code] = item.copy()
                merged[code]["_conf_sum"] = item["confidence"]
                merge_counts[code] = 1
        
        # Clean up internal tracking field
        for v in merged.values():
            v.pop("_conf_sum", None)
        
        return list(merged.values())
    
    def apply_coefficient(
        self,
        base_price: float,
        complexity: str = "normal"
    ) -> float:
        """Apply all coefficients to base price."""
        complexity_coefs = {
            "simple": 0.9,
            "normal": 1.0,
            "complex": 1.2,
            "very_complex": 1.5
        }
        complexity_coef = complexity_coefs.get(complexity, 1.0)
        total_coef = self.total_coefficient * complexity_coef
        return base_price * total_coef

    # ═══════════════════════════════════════════════════════════════════════
    # Defect repair estimation
    # ═══════════════════════════════════════════════════════════════════════

    def estimate_defect_repair(
        self,
        defect_report: Dict[str, Any],
    ) -> Tuple[List[Dict], float]:
        """
        Generate repair estimate from pipeline defect_report.

        Args:
            defect_report: dict from DefectAnalyzer.analyze()  
                           with keys: defects[], summary, recommendations[]

        Returns:
            (repair_items, total_repair_cost)
        """
        items: List[Dict] = []
        if not defect_report:
            return items, 0.0

        defects = defect_report.get("defects", [])

        # Map defect_type + severity → WORK_MAPPINGS key
        DEFECT_KEY_MAP = {
            ("crack", "low"):    "crack_minor",
            ("crack", "medium"): "crack",
            ("crack", "high"):   "crack_severe",
            ("stain_water", "low"): "stain_water",
            ("stain_water", "medium"): "stain_water",
            ("stain_water", "high"): "stain_water",
            ("stain_mold", "low"): "stain_mold",
            ("stain_mold", "medium"): "stain_mold",
            ("stain_mold", "high"): "stain_mold",
            ("stain_oil", "low"): "stain_oil",
            ("stain_oil", "medium"): "stain_oil",
            ("stain_oil", "high"): "stain_oil",
            ("rust", "low"): "rust_surface",
            ("rust", "medium"): "rust_surface",
            ("rust", "high"): "rust_deep",
            ("efflorescence", "low"): "efflorescence",
            ("efflorescence", "medium"): "efflorescence",
            ("efflorescence", "high"): "efflorescence",
        }

        for d in defects:
            dtype = d.get("type", "defect")
            severity = d.get("severity", "medium")
            area_m2 = d.get("area_pct", 1.0) / 100.0  # rough conversion
            length_m = d.get("length_px", 100) * 0.005  # assume ~5mm/px

            key = DEFECT_KEY_MAP.get((dtype, severity),
                   DEFECT_KEY_MAP.get((dtype.split("_")[0], severity), "defect"))

            mappings = self.WORK_MAPPINGS.get(key, self.WORK_MAPPINGS.get("defect", []))

            for mapping in mappings:
                unit = mapping["unit"]
                base = mapping["base_price"]
                mult = mapping["multiplier"]

                if unit == "m":
                    qty = max(0.5, length_m) * mult
                elif unit == "m2":
                    qty = max(0.1, area_m2) * mult
                else:
                    qty = 1.0 * mult

                price = base * self.total_coefficient
                total = qty * price

                items.append({
                    "work_code": mapping["code"],
                    "work_name": mapping["name"],
                    "unit": unit,
                    "quantity": round(qty, 2),
                    "unit_price": round(price, 2),
                    "total_price": round(total, 2),
                    "source_defect": dtype,
                    "severity": severity,
                })

        items = self._merge_items(items)
        total_cost = sum(i["total_price"] for i in items)

        logger.info(
            f"Defect repair estimate: {len(items)} items, "
            f"total={total_cost:,.0f} KZT"
        )
        return items, round(total_cost, 2)

    def calculate_tax_and_margin(
        self,
        subtotal: float,
        margin_pct: float = 15.0,
        tax_pct: float = 12.0,
    ) -> Dict[str, float]:
        """
        Calculate total with contractor margin and VAT (НДС).

        Returns:
            {subtotal, margin, tax, grand_total}
        """
        margin = subtotal * margin_pct / 100
        subtotal_with_margin = subtotal + margin
        tax = subtotal_with_margin * tax_pct / 100
        grand_total = subtotal_with_margin + tax

        return {
            "subtotal": round(subtotal, 2),
            "margin_pct": margin_pct,
            "margin": round(margin, 2),
            "tax_pct": tax_pct,
            "tax": round(tax, 2),
            "grand_total": round(grand_total, 2),
        }


