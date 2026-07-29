// === КАТАЛОГ РАБОТ: БЕТОННЫЕ РАБОТЫ (60 позиций) ===
(function () {
    window.AI_WORK_CONCRETE_CATALOG = {
        // Фундамент
        'work_found_strip_shallow': { name: 'Устройство ленточного фундамента мелкозагл.', unit: 'м.п.', price: 3000, category: 'work_concrete' },
        'work_found_strip_deep': { name: 'Устройство ленточного фундамента глубокого', unit: 'м.п.', price: 5000, category: 'work_concrete' },
        'work_found_slab': { name: 'Устройство фундаментной плиты (монолит)', unit: 'м²', price: 2500, category: 'work_concrete' },
        'work_found_pile_bore': { name: 'Устройство буронабивных свай', unit: 'шт', price: 2000, category: 'work_concrete' },
        'work_found_pile_screw': { name: 'Устройство винтовых свай', unit: 'шт', price: 1500, category: 'work_concrete' },
        'work_found_grillage': { name: 'Устройство ростверка', unit: 'м.п.', price: 2500, category: 'work_concrete' },
        'work_found_slab_rib': { name: 'Устройство ребристой фунд. плиты (УШП)', unit: 'м²', price: 3500, category: 'work_concrete' },
        // Бетонирование
        'work_concrete_pour_m3': { name: 'Заливка бетона (подача)', unit: 'м³', price: 500, category: 'work_concrete' },
        'work_concrete_pump': { name: 'Подача бетона бетононасосом', unit: 'м³', price: 300, category: 'work_concrete' },
        'work_concrete_vibrate': { name: 'Вибрирование бетона', unit: 'м³', price: 200, category: 'work_concrete' },
        'work_concrete_care': { name: 'Уход за бетоном (поливка, укрытие)', unit: 'м²', price: 50, category: 'work_concrete' },
        // Стяжка пола
        'work_screed_cement_50mm': { name: 'Устройство цементной стяжки 50мм', unit: 'м²', price: 350, category: 'work_concrete' },
        'work_screed_cement_80mm': { name: 'Устройство цементной стяжки 80мм', unit: 'м²', price: 450, category: 'work_concrete' },
        'work_screed_cement_100mm': { name: 'Устройство цементной стяжки 100мм', unit: 'м²', price: 550, category: 'work_concrete' },
        'work_screed_self_level_5mm': { name: 'Устройство наливного пола (5мм)', unit: 'м²', price: 250, category: 'work_concrete' },
        'work_screed_self_level_10mm': { name: 'Устройство наливного пола (10мм)', unit: 'м²', price: 350, category: 'work_concrete' },
        'work_screed_semi_dry': { name: 'Устройство полусухой стяжки', unit: 'м²', price: 400, category: 'work_concrete' },
        'work_screed_dry_knauf': { name: 'Устройство сухой стяжки (Кнауф)', unit: 'м²', price: 500, category: 'work_concrete' },
        'work_screed_beacons': { name: 'Установка маяков для стяжки', unit: 'м²', price: 50, category: 'work_concrete' },
        // Опалубка
        'work_formwork_install': { name: 'Установка опалубки', unit: 'м²', price: 300, category: 'work_concrete' },
        'work_formwork_remove': { name: 'Снятие опалубки', unit: 'м²', price: 100, category: 'work_concrete' },
        'work_formwork_column': { name: 'Установка опалубки колонн', unit: 'м.п.', price: 500, category: 'work_concrete' },
        'work_formwork_stairs': { name: 'Установка опалубки лестниц', unit: 'м²', price: 1000, category: 'work_concrete' },
        // Армирование
        'work_rebar_tie': { name: 'Вязка арматуры', unit: 'т', price: 5000, category: 'work_concrete' },
        'work_rebar_frame': { name: 'Изготовление арматурного каркаса', unit: 'т', price: 8000, category: 'work_concrete' },
        'work_rebar_slab': { name: 'Армирование плиты перекрытия', unit: 'м²', price: 200, category: 'work_concrete' },
        'work_rebar_wall': { name: 'Армирование монолитной стены', unit: 'м²', price: 250, category: 'work_concrete' },
        'work_rebar_column': { name: 'Армирование колонны', unit: 'м.п.', price: 300, category: 'work_concrete' },
        // Монолит
        'work_mono_wall_200': { name: 'Устройство монолитной стены 200мм', unit: 'м²', price: 2000, category: 'work_concrete' },
        'work_mono_wall_300': { name: 'Устройство монолитной стены 300мм', unit: 'м²', price: 2500, category: 'work_concrete' },
        'work_mono_slab_200': { name: 'Устройство монолитного перекрытия 200мм', unit: 'м²', price: 2000, category: 'work_concrete' },
        'work_mono_slab_250': { name: 'Устройство монолитного перекрытия 250мм', unit: 'м²', price: 2500, category: 'work_concrete' },
        'work_mono_stairs': { name: 'Устройство монолитной лестницы', unit: 'м.п.', price: 5000, category: 'work_concrete' },
        'work_mono_column': { name: 'Устройство монолитной колонны', unit: 'м.п.', price: 3000, category: 'work_concrete' },
        'work_mono_beam': { name: 'Устройство монолитной балки', unit: 'м.п.', price: 2500, category: 'work_concrete' },
        // Отмостка / дорожки
        'work_blind_area': { name: 'Устройство отмостки (бетон)', unit: 'м²', price: 800, category: 'work_concrete' },
        'work_walkway_concrete': { name: 'Устройство бетонной дорожки', unit: 'м²', price: 700, category: 'work_concrete' },
        'work_parking_concrete': { name: 'Устройство бетонной площадки (парковка)', unit: 'м²', price: 1000, category: 'work_concrete' },
        // Промышленные полы
        'work_floor_industrial': { name: 'Устройство промышленного пола (бетон)', unit: 'м²', price: 1500, category: 'work_concrete' },
        'work_floor_topping': { name: 'Устройство топпинга на бетонный пол', unit: 'м²', price: 400, category: 'work_concrete' },
        'work_floor_polish': { name: 'Полировка бетонного пола', unit: 'м²', price: 500, category: 'work_concrete' },
        'work_floor_epoxy': { name: 'Устройство эпоксидного покрытия пола', unit: 'м²', price: 800, category: 'work_concrete' },
        // Демонтаж
        'work_demo_concrete_floor': { name: 'Демонтаж бетонного пола', unit: 'м²', price: 500, category: 'work_concrete' },
        'work_demo_concrete_wall': { name: 'Демонтаж бетонной стены', unit: 'м²', price: 1000, category: 'work_concrete' },
        'work_demo_foundation': { name: 'Демонтаж фундамента', unit: 'м³', price: 2000, category: 'work_concrete' },
        'work_demo_screed': { name: 'Демонтаж стяжки пола', unit: 'м²', price: 300, category: 'work_concrete' },
        // Подготовка
        'work_concrete_base_sand': { name: 'Устройство песчаной подушки', unit: 'м³', price: 300, category: 'work_concrete' },
        'work_concrete_base_gravel': { name: 'Устройство щебёночной подушки', unit: 'м³', price: 400, category: 'work_concrete' },
        'work_concrete_geotex': { name: 'Укладка геотекстиля', unit: 'м²', price: 30, category: 'work_concrete' },
        'work_concrete_film': { name: 'Укладка гидроизоляционной плёнки', unit: 'м²', price: 20, category: 'work_concrete' },
        // Бассейн
        'work_pool_concrete': { name: 'Устройство бассейна (бетон, под ключ)', unit: 'м²', price: 5000, category: 'work_concrete' },
        'work_pool_waterproof': { name: 'Гидроизоляция бассейна', unit: 'м²', price: 500, category: 'work_concrete' },
        // Штробление
        'work_chase_concrete': { name: 'Штробление бетона (под провод)', unit: 'м.п.', price: 250, category: 'work_concrete' },
        'work_chase_concrete_deep': { name: 'Штробление бетона (глубокое, под трубу)', unit: 'м.п.', price: 500, category: 'work_concrete' },
        'work_hole_concrete_d50': { name: 'Сверление бетона Ø50мм', unit: 'шт', price: 300, category: 'work_concrete' },
        'work_hole_concrete_d100': { name: 'Сверление бетона Ø100мм', unit: 'шт', price: 500, category: 'work_concrete' },
        'work_hole_concrete_d150': { name: 'Сверление бетона Ø150мм', unit: 'шт', price: 800, category: 'work_concrete' },
        'work_cutting_concrete': { name: 'Алмазная резка бетона', unit: 'м.п.', price: 500, category: 'work_concrete' }
    };
})();
