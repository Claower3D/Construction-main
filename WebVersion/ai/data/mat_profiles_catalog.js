// === КАТАЛОГ ПРОФИЛЕЙ И ПОДВЕСНЫХ СИСТЕМ — ОЧИЩЕННЫЙ (без дублей с mat_drywall.js) ===
// mat_drywall.js уже содержит: ГКЛ 9.5/12.5, ГКЛВ 9.5/12.5, ГКЛО 12.5, ГВЛ 10/12.5, ГВЛВ 10,
// профили CW-50/75/100, UW-50/75/100, CD-60, UD-28, подвесы (прямой/пружинный),
// соединители (краб/двухуровневый/удлинитель), саморезы ГКЛ (25/35/45/55 + клоп + заклёпка),
// шпаклёвки (Фугенфюллер/Унифлот), серпянка/бумажная лента, демпферная лента (50/100),
// звукоизоляция (50/100), уголки (металл/ПВХ/арочный), дюбель-бабочка/Молли
(function () {
    window.AI_MAT_PROFILES_CATALOG = {
        // Профили ПН/ПС/ПП — российская маркировка, дублеты с CW/UW/CD отсутствуют
        // Профили UA усиленные (уникальная категория — НЕТ в mat_drywall.js)
        'profile_ua_50_3m': { name: 'Профиль UA усиленный 50мм (3м)', unit: 'шт', price: 400, category: 'profiles_catalog' },
        'profile_ua_75_3m': { name: 'Профиль UA усиленный 75мм (3м)', unit: 'шт', price: 500, category: 'profiles_catalog' },
        'profile_ua_100_3m': { name: 'Профиль UA усиленный 100мм (3м)', unit: 'шт', price: 600, category: 'profiles_catalog' },
        // Профили 4м — доп. длина (НЕТ в mat_drywall.js — там только 3м)
        'profile_pn_27x28_4m': { name: 'Профиль ПН 27×28мм (4м)', unit: 'шт', price: 110, category: 'profiles_catalog' },
        'profile_pp_60x27_4m': { name: 'Профиль ПП 60×27мм (4м)', unit: 'шт', price: 130, category: 'profiles_catalog' },
        'profile_ps_50x50_4m': { name: 'Профиль ПС 50×50мм (4м)', unit: 'шт', price: 160, category: 'profiles_catalog' },
        'profile_pn_50x40_4m': { name: 'Профиль ПН 50×40мм (4м)', unit: 'шт', price: 130, category: 'profiles_catalog' },
        // Подвесы — тяги (уникальная категория)
        'hanger_rod_500mm': { name: 'Тяга подвеса 500мм', unit: 'шт', price: 10, category: 'profiles_catalog' },
        'hanger_rod_1000mm': { name: 'Тяга подвеса 1000мм', unit: 'шт', price: 15, category: 'profiles_catalog' },
        // Маяковые профили (уникальная категория)
        'beacon_profile_6mm_3m': { name: 'Маяковый профиль 6мм (3м)', unit: 'шт', price: 10, category: 'profiles_catalog' },
        'beacon_profile_10mm_3m': { name: 'Маяковый профиль 10мм (3м)', unit: 'шт', price: 12, category: 'profiles_catalog' },
        // Профили для плитки (уникальная категория)
        'tile_trim_8mm_2_5m_alum': { name: 'Профиль для плитки наружный 8мм алюм. (2.5м)', unit: 'шт', price: 100, category: 'profiles_catalog' },
        'tile_trim_10mm_2_5m_alum': { name: 'Профиль для плитки наружный 10мм алюм. (2.5м)', unit: 'шт', price: 120, category: 'profiles_catalog' },
        'tile_trim_12mm_2_5m_alum': { name: 'Профиль для плитки наружный 12мм алюм. (2.5м)', unit: 'шт', price: 140, category: 'profiles_catalog' },
        'tile_trim_inner_10mm': { name: 'Профиль для плитки внутренний 10мм', unit: 'шт', price: 80, category: 'profiles_catalog' },
        'tile_profile_step_2_5m': { name: 'Профиль для ступеней 2.5м', unit: 'шт', price: 200, category: 'profiles_catalog' },
        // Система выравнивания плитки (уникальная категория)
        'tile_level_clip_100': { name: 'Система выравнивания клипсы (100шт)', unit: 'уп.', price: 100, category: 'profiles_catalog' },
        'tile_level_wedge_100': { name: 'Система выравнивания клинья (100шт)', unit: 'уп.', price: 80, category: 'profiles_catalog' },
        'tile_cross_1_5mm_200': { name: 'Крестики для плитки 1.5мм (200шт)', unit: 'уп.', price: 20, category: 'profiles_catalog' },
        'tile_cross_2mm_200': { name: 'Крестики для плитки 2мм (200шт)', unit: 'уп.', price: 20, category: 'profiles_catalog' },
        'tile_cross_3mm_200': { name: 'Крестики для плитки 3мм (200шт)', unit: 'уп.', price: 20, category: 'profiles_catalog' },
        // Пороги / переходные профили (уникальная категория)
        'threshold_alum_30mm_0_9m': { name: 'Порог алюминиевый 30мм (0.9м)', unit: 'шт', price: 50, category: 'profiles_catalog' },
        'threshold_alum_40mm_0_9m': { name: 'Порог алюминиевый 40мм (0.9м)', unit: 'шт', price: 70, category: 'profiles_catalog' },
        'threshold_alum_60mm_0_9m': { name: 'Порог алюминиевый 60мм (0.9м)', unit: 'шт', price: 100, category: 'profiles_catalog' },
        'threshold_t_shape_0_9m': { name: 'Профиль стыковочный Т-образный (0.9м)', unit: 'шт', price: 80, category: 'profiles_catalog' },
        'threshold_multi_0_9m': { name: 'Порог разноуровневый (0.9м)', unit: 'шт', price: 100, category: 'profiles_catalog' },
        // DIN-рейки (уникальная категория)
        'din_rail_ts35_1m': { name: 'DIN-рейка TS35 (1м)', unit: 'шт', price: 50, category: 'profiles_catalog' },
        'din_rail_ts35_2m': { name: 'DIN-рейка TS35 (2м)', unit: 'шт', price: 100, category: 'profiles_catalog' },
        // Кабель-каналы — расшир. размеры (100×40 НЕТ в mat_electrical.js)
        'cable_trunking_100x40_2m': { name: 'Кабель-канал 100×40мм (2м)', unit: 'шт', price: 100, category: 'profiles_catalog' },
        // Монтажные шины / перфолента (уникальная)
        'mount_channel_28x30_2m': { name: 'Монтажный швеллер 28×30мм (2м)', unit: 'шт', price: 200, category: 'profiles_catalog' },
        'mount_channel_41x41_2m': { name: 'Монтажный швеллер 41×41мм (2м)', unit: 'шт', price: 400, category: 'profiles_catalog' },
        'perf_tape_20mm_25m': { name: 'Перфолента 20мм (25м)', unit: 'шт', price: 200, category: 'profiles_catalog' },
        'perf_tape_12mm_25m': { name: 'Перфолента 12мм (25м)', unit: 'шт', price: 150, category: 'profiles_catalog' },
        // Уплотнительная лента (уникальная)
        'seal_tape_profile_30mm': { name: 'Лента уплотнительная для профиля 30мм (30м)', unit: 'шт', price: 50, category: 'profiles_catalog' },
        'seal_tape_profile_50mm': { name: 'Лента уплотнительная для профиля 50мм (30м)', unit: 'шт', price: 70, category: 'profiles_catalog' },
        'seal_tape_profile_70mm': { name: 'Лента уплотнительная для профиля 70мм (30м)', unit: 'шт', price: 90, category: 'profiles_catalog' },
        // Лента Knauf (уникальная — в drywall нет этого бренда)
        'drywall_tape_knauf_25m': { name: 'Лента армирующая Knauf (25м)', unit: 'шт', price: 100, category: 'profiles_catalog' },
        // СМЛ / Аквапанель (уникальные — НЕТ в mat_drywall.js)
        'sml_8mm_1200x2500': { name: 'СМЛ стекломагн. лист 8мм', unit: 'лист', price: 500, category: 'profiles_catalog' },
        'sml_10mm_1200x2500': { name: 'СМЛ стекломагн. лист 10мм', unit: 'лист', price: 600, category: 'profiles_catalog' },
        'aquapanel_12_5mm': { name: 'Аквапанель цементная 12.5мм', unit: 'лист', price: 1200, category: 'profiles_catalog' }
    };
})();
