// === КАТАЛОГ ЭЛЕКТРО- И РУЧНОГО ИНСТРУМЕНТА (60 позиций) ===
(function () {
    window.AI_MAT_POWERTOOLS_CATALOG = {
        // Перфораторы
        'tool_hammer_drill_800w': { name: 'Перфоратор SDS+ 800Вт (2.5Дж)', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_hammer_drill_1100w': { name: 'Перфоратор SDS+ 1100Вт (3.5Дж)', unit: 'шт', price: 8000, category: 'powertools_catalog' },
        'tool_hammer_drill_1500w': { name: 'Перфоратор SDS-Max 1500Вт (8Дж)', unit: 'шт', price: 15000, category: 'powertools_catalog' },
        // Дрели / шуруповёрты
        'tool_drill_800w': { name: 'Дрель ударная 800Вт', unit: 'шт', price: 3000, category: 'powertools_catalog' },
        'tool_screwdriver_18v': { name: 'Шуруповёрт акк. 18В 2Ач', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_screwdriver_18v_pro': { name: 'Шуруповёрт акк. 18В 4Ач профи', unit: 'шт', price: 10000, category: 'powertools_catalog' },
        'tool_impact_driver_18v': { name: 'Гайковёрт ударный акк. 18В', unit: 'шт', price: 8000, category: 'powertools_catalog' },
        // Болгарки (УШМ)
        'tool_grinder_125_800w': { name: 'УШМ (болгарка) 125мм 800Вт', unit: 'шт', price: 3000, category: 'powertools_catalog' },
        'tool_grinder_125_1200w': { name: 'УШМ (болгарка) 125мм 1200Вт', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_grinder_230_2200w': { name: 'УШМ (болгарка) 230мм 2200Вт', unit: 'шт', price: 8000, category: 'powertools_catalog' },
        // Пилы
        'tool_jigsaw_700w': { name: 'Лобзик электрический 700Вт', unit: 'шт', price: 3000, category: 'powertools_catalog' },
        'tool_circular_190mm': { name: 'Пила дисковая 190мм 1500Вт', unit: 'шт', price: 6000, category: 'powertools_catalog' },
        'tool_recipro_saw_1100w': { name: 'Пила сабельная 1100Вт', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_miter_saw_255mm': { name: 'Торцовочная пила 255мм', unit: 'шт', price: 12000, category: 'powertools_catalog' },
        'tool_table_saw_250mm': { name: 'Станок распиловочный 250мм', unit: 'шт', price: 15000, category: 'powertools_catalog' },
        // Шлифмашины
        'tool_sander_orbital': { name: 'Шлифмашина эксцентриковая 125мм', unit: 'шт', price: 4000, category: 'powertools_catalog' },
        'tool_sander_belt': { name: 'Шлифмашина ленточная 76×457мм', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_polisher_180mm': { name: 'Полировальная машина 180мм', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        // Плиткорез
        'tool_tile_cutter_600mm': { name: 'Плиткорез ручной 600мм', unit: 'шт', price: 3000, category: 'powertools_catalog' },
        'tool_tile_cutter_900mm': { name: 'Плиткорез ручной 900мм', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_tile_wetsaw_180mm': { name: 'Плиткорез электрический 180мм', unit: 'шт', price: 8000, category: 'powertools_catalog' },
        // Фен / пылесос / штроборез
        'tool_heat_gun_2000w': { name: 'Фен строительный 2000Вт', unit: 'шт', price: 2000, category: 'powertools_catalog' },
        'tool_vacuum_constr_30l': { name: 'Пылесос строительный 30л', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_vacuum_constr_50l': { name: 'Пылесос строительный 50л', unit: 'шт', price: 8000, category: 'powertools_catalog' },
        'tool_wall_chaser_2x150mm': { name: 'Штроборез 2×150мм 2500Вт', unit: 'шт', price: 10000, category: 'powertools_catalog' },
        // Бетономешалки / миксеры
        'tool_mixer_120l': { name: 'Бетономешалка 120л', unit: 'шт', price: 10000, category: 'powertools_catalog' },
        'tool_mixer_180l': { name: 'Бетономешалка 180л', unit: 'шт', price: 15000, category: 'powertools_catalog' },
        'tool_mixer_hand_1400w': { name: 'Миксер строительный 1400Вт', unit: 'шт', price: 4000, category: 'powertools_catalog' },
        // Виброплита
        'tool_plate_compactor_60kg': { name: 'Виброплита 60кг (бензин)', unit: 'шт', price: 25000, category: 'powertools_catalog' },
        'tool_plate_compactor_90kg': { name: 'Виброплита 90кг (бензин)', unit: 'шт', price: 35000, category: 'powertools_catalog' },
        // Уровни / измерения
        'tool_level_800mm': { name: 'Уровень пузырьковый 800мм', unit: 'шт', price: 500, category: 'powertools_catalog' },
        'tool_level_1200mm': { name: 'Уровень пузырьковый 1200мм', unit: 'шт', price: 700, category: 'powertools_catalog' },
        'tool_level_2000mm': { name: 'Уровень пузырьковый 2000мм', unit: 'шт', price: 1000, category: 'powertools_catalog' },
        'tool_level_laser_2line': { name: 'Уровень лазерный 2 линии', unit: 'шт', price: 5000, category: 'powertools_catalog' },
        'tool_level_laser_3d': { name: 'Уровень лазерный 3D (12 линий)', unit: 'шт', price: 10000, category: 'powertools_catalog' },
        'tool_tape_5m': { name: 'Рулетка 5м', unit: 'шт', price: 200, category: 'powertools_catalog' },
        'tool_tape_8m': { name: 'Рулетка 8м', unit: 'шт', price: 300, category: 'powertools_catalog' },
        'tool_rangefinder_laser': { name: 'Дальномер лазерный 50м', unit: 'шт', price: 3000, category: 'powertools_catalog' },
        // Штукатурный инструмент
        'tool_spatula_100mm': { name: 'Шпатель 100мм', unit: 'шт', price: 50, category: 'powertools_catalog' },
        'tool_spatula_200mm': { name: 'Шпатель 200мм', unit: 'шт', price: 80, category: 'powertools_catalog' },
        'tool_spatula_350mm': { name: 'Шпатель 350мм', unit: 'шт', price: 150, category: 'powertools_catalog' },
        'tool_spatula_600mm': { name: 'Шпатель 600мм', unit: 'шт', price: 250, category: 'powertools_catalog' },
        'tool_trowel_notched_6mm': { name: 'Кельма зубчатая 6×6мм', unit: 'шт', price: 100, category: 'powertools_catalog' },
        'tool_trowel_notched_10mm': { name: 'Кельма зубчатая 10×10мм', unit: 'шт', price: 130, category: 'powertools_catalog' },
        'tool_trowel_mason': { name: 'Кельма каменщика', unit: 'шт', price: 200, category: 'powertools_catalog' },
        'tool_float_sponge': { name: 'Тёрка губчатая для затирки', unit: 'шт', price: 150, category: 'powertools_catalog' },
        'tool_rule_1_5m': { name: 'Правило алюминиевое 1.5м', unit: 'шт', price: 500, category: 'powertools_catalog' },
        'tool_rule_2m': { name: 'Правило алюминиевое 2м', unit: 'шт', price: 700, category: 'powertools_catalog' },
        'tool_rule_2_5m': { name: 'Правило алюминиевое 2.5м', unit: 'шт', price: 900, category: 'powertools_catalog' },
        // Валики / кисти
        'tool_roller_250mm_velour': { name: 'Валик велюровый 250мм', unit: 'шт', price: 100, category: 'powertools_catalog' },
        'tool_roller_250mm_fiber': { name: 'Валик полиакриловый 250мм', unit: 'шт', price: 80, category: 'powertools_catalog' },
        'tool_roller_tray': { name: 'Ванночка для краски', unit: 'шт', price: 50, category: 'powertools_catalog' },
        // Молотки
        'tool_hammer_500g': { name: 'Молоток слесарный 500г', unit: 'шт', price: 300, category: 'powertools_catalog' },
        'tool_hammer_1000g': { name: 'Молоток слесарный 1000г', unit: 'шт', price: 500, category: 'powertools_catalog' },
        'tool_rubber_mallet_500g': { name: 'Киянка резиновая 500г', unit: 'шт', price: 200, category: 'powertools_catalog' },
        // Оснастка для перфоратора
        'bit_sds_6x160': { name: 'Бур SDS+ Ø6×160мм', unit: 'шт', price: 80, category: 'powertools_catalog' },
        'bit_sds_8x160': { name: 'Бур SDS+ Ø8×160мм', unit: 'шт', price: 100, category: 'powertools_catalog' },
        'bit_sds_10x210': { name: 'Бур SDS+ Ø10×210мм', unit: 'шт', price: 120, category: 'powertools_catalog' },
        'bit_sds_12x260': { name: 'Бур SDS+ Ø12×260мм', unit: 'шт', price: 150, category: 'powertools_catalog' },
        'bit_core_68mm': { name: 'Коронка Ø68мм (подрозетник)', unit: 'шт', price: 200, category: 'powertools_catalog' },
        'bit_core_82mm': { name: 'Коронка Ø82мм', unit: 'шт', price: 300, category: 'powertools_catalog' }
    };
})();
