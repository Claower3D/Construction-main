// === ПОДГОТОВИТЕЛЬНЫЕ РАБОТЫ — расчистка, планировка, временные сооружения, ограждение (200 поз.) ===
(function () {
    window.AI_WRK_PREP = {
        // === РАСЧИСТКА ТЕРРИТОРИИ ===
        'wrk_prep_clear_bush_manual': { name: 'Расчистка территории от кустарника вручную', unit: 'м²', price: 150, category: 'prep' },
        'wrk_prep_clear_bush_mech': { name: 'Расчистка территории от кустарника механизир.', unit: 'м²', price: 80, category: 'prep' },
        'wrk_prep_clear_trees_d20': { name: 'Валка деревьев Ø до 20см', unit: 'шт', price: 5000, category: 'prep' },
        'wrk_prep_clear_trees_d40': { name: 'Валка деревьев Ø до 40см', unit: 'шт', price: 12000, category: 'prep' },
        'wrk_prep_clear_trees_d60': { name: 'Валка деревьев Ø до 60см', unit: 'шт', price: 22000, category: 'prep' },
        'wrk_prep_stump_d20': { name: 'Корчёвка пней Ø до 20см', unit: 'шт', price: 3500, category: 'prep' },
        'wrk_prep_stump_d40': { name: 'Корчёвка пней Ø до 40см', unit: 'шт', price: 8000, category: 'prep' },
        'wrk_prep_stump_d60': { name: 'Корчёвка пней Ø до 60см', unit: 'шт', price: 15000, category: 'prep' },
        'wrk_prep_clear_debris': { name: 'Расчистка от строительного мусора', unit: 'м²', price: 250, category: 'prep' },
        'wrk_prep_clear_vegetation': { name: 'Снятие растительного слоя h=200мм мех.', unit: 'м²', price: 120, category: 'prep' },
        'wrk_prep_clear_vegetation_300': { name: 'Снятие растительного слоя h=300мм мех.', unit: 'м²', price: 160, category: 'prep' },
        'wrk_prep_topsoil_stockpile': { name: 'Складирование растительного грунта в отвал', unit: 'м³', price: 350, category: 'prep' },
        // === ПЛАНИРОВКА ===
        'wrk_prep_grading_rough': { name: 'Грубая планировка территории бульдозером', unit: 'м²', price: 85, category: 'prep' },
        'wrk_prep_grading_fine': { name: 'Чистовая планировка территории', unit: 'м²', price: 120, category: 'prep' },
        'wrk_prep_compaction_mech': { name: 'Уплотнение грунта виброкатком', unit: 'м²', price: 65, category: 'prep' },
        'wrk_prep_compaction_plate': { name: 'Уплотнение грунта виброплитой', unit: 'м²', price: 85, category: 'prep' },
        'wrk_prep_fill_sand_layer': { name: 'Устройство песчаной подушки h=200мм', unit: 'м²', price: 350, category: 'prep' },
        'wrk_prep_fill_crushed_layer': { name: 'Устройство щебёночного основания h=200мм', unit: 'м²', price: 550, category: 'prep' },
        'wrk_prep_fill_crushed_300': { name: 'Устройство щебёночного основания h=300мм', unit: 'м²', price: 750, category: 'prep' },
        // === ОГРАЖДЕНИЕ СТРОЙПЛОЩАДКИ ===
        'wrk_prep_fence_temp_h2': { name: 'Временное ограждение H=2м', unit: 'м.п.', price: 1200, category: 'prep' },
        'wrk_prep_fence_temp_h2_5': { name: 'Временное ограждение H=2.5м', unit: 'м.п.', price: 1500, category: 'prep' },
        'wrk_prep_fence_profnastil': { name: 'Ограждение из профнастила H=2м', unit: 'м.п.', price: 2500, category: 'prep' },
        'wrk_prep_gate_temp': { name: 'Устройство временных ворот 4м', unit: 'шт', price: 35000, category: 'prep' },
        'wrk_prep_gate_temp_6m': { name: 'Устройство временных ворот 6м', unit: 'шт', price: 50000, category: 'prep' },
        'wrk_prep_sign_info': { name: 'Установка информационного щита', unit: 'шт', price: 25000, category: 'prep' },
        'wrk_prep_sign_safety': { name: 'Установка знаков ОТ и ТБ', unit: 'комп.', price: 15000, category: 'prep' },
        // === ВРЕМЕННЫЕ ДОРОГИ ===
        'wrk_prep_road_temp_sand': { name: 'Устройство временной дороги из песка', unit: 'м²', price: 450, category: 'prep' },
        'wrk_prep_road_temp_crushed': { name: 'Устройство временной дороги из щебня', unit: 'м²', price: 750, category: 'prep' },
        'wrk_prep_road_temp_slabs': { name: 'Устройство временной дороги из ж/б плит', unit: 'м²', price: 2500, category: 'prep' },
        'wrk_prep_road_temp_remove': { name: 'Демонтаж временной дороги', unit: 'м²', price: 350, category: 'prep' },
        'wrk_prep_parking_temp': { name: 'Устройство временной стоянки', unit: 'м²', price: 650, category: 'prep' },
        // === ВРЕМЕННЫЕ ЗДАНИЯ/СООРУЖЕНИЯ ===
        'wrk_prep_trailer_install': { name: 'Установка бытовки (вагончика)', unit: 'шт', price: 15000, category: 'prep' },
        'wrk_prep_trailer_remove': { name: 'Демонтаж и вывоз бытовки', unit: 'шт', price: 12000, category: 'prep' },
        'wrk_prep_warehouse_temp': { name: 'Устройство временного склада', unit: 'м²', price: 3500, category: 'prep' },
        'wrk_prep_canopy_temp': { name: 'Устройство временного навеса', unit: 'м²', price: 2500, category: 'prep' },
        // === ВРЕМЕННЫЕ ИНЖЕНЕРНЫЕ СЕТИ ===
        'wrk_prep_power_temp': { name: 'Временное электроснабжение площадки', unit: 'компл.', price: 85000, category: 'prep' },
        'wrk_prep_water_temp': { name: 'Временное водоснабжение площадки', unit: 'компл.', price: 45000, category: 'prep' },
        'wrk_prep_lighting_temp': { name: 'Временное освещение площадки', unit: 'компл.', price: 55000, category: 'prep' },
        'wrk_prep_drain_temp': { name: 'Временный водоотвод', unit: 'м.п.', price: 850, category: 'prep' },
        // === ГЕОДЕЗИЧЕСКИЕ РАБОТЫ ===
        'wrk_prep_geodesy_topo': { name: 'Топографическая съёмка М1:500', unit: 'га', price: 120000, category: 'prep' },
        'wrk_prep_geodesy_benchmark': { name: 'Вынос реперов и высотных отметок', unit: 'шт', price: 5000, category: 'prep' },
        'wrk_prep_geodesy_survey': { name: 'Геодезический контроль (за месяц)', unit: 'мес.', price: 250000, category: 'prep' },
        'wrk_prep_geodesy_exec': { name: 'Исполнительная съёмка фундаментов', unit: 'шт', price: 35000, category: 'prep' },
        'wrk_prep_geodesy_exec_networks': { name: 'Исполнительная съёмка сетей', unit: 'м.п.', price: 150, category: 'prep' },
        // === РАЗВЕДОЧНЫЕ РАБОТЫ ===
        'wrk_prep_geotech_borehole_5m': { name: 'Бурение разведочной скважины до 5м', unit: 'м.п.', price: 8000, category: 'prep' },
        'wrk_prep_geotech_borehole_10m': { name: 'Бурение разведочной скважины до 10м', unit: 'м.п.', price: 12000, category: 'prep' },
        'wrk_prep_geotech_borehole_20m': { name: 'Бурение разведочной скважины до 20м', unit: 'м.п.', price: 18000, category: 'prep' },
        'wrk_prep_geotech_pit': { name: 'Отрывка шурфа', unit: 'шт', price: 25000, category: 'prep' },
        'wrk_prep_geotech_static_load': { name: 'Статическое зондирование', unit: 'точка', price: 12000, category: 'prep' },
        // === ВОДОПОНИЖЕНИЕ ===
        'wrk_prep_dewater_open': { name: 'Открытый водоотлив из котлована', unit: 'смена', price: 25000, category: 'prep' },
        'wrk_prep_dewater_wellpoint': { name: 'Устройство иглофильтровых установок', unit: 'м.п.', price: 5500, category: 'prep' },
        'wrk_prep_dewater_deep_well': { name: 'Устройство глубинного водопонижения', unit: 'скважина', price: 180000, category: 'prep' },
        'wrk_prep_dewater_pump_rent': { name: 'Аренда насоса водоотлива (сутки)', unit: 'сут.', price: 8000, category: 'prep' },
        // === ШПУНТОВОЕ ОГРАЖДЕНИЕ ===
        'wrk_prep_sheetpile_drive': { name: 'Погружение шпунта Ларсена (вибро)', unit: 'м²', price: 3500, category: 'prep' },
        'wrk_prep_secant_pile_wall': { name: 'Устройство стены из буросекущих свай', unit: 'м²', price: 18000, category: 'prep' },
        'wrk_prep_diaphragm_wall': { name: 'Устройство «стены в грунте»', unit: 'м²', price: 25000, category: 'prep' },
        // === ЗАЩИТА СУЩЕСТВУЮЩИХ КОНСТРУКЦИЙ ===
        'wrk_prep_protect_utility': { name: 'Защита существующих коммуникаций', unit: 'м.п.', price: 2500, category: 'prep' },
        'wrk_prep_protect_building': { name: 'Защита фасада смежного здания', unit: 'м²', price: 850, category: 'prep' },
        'wrk_prep_protect_trees': { name: 'Защита зелёных насаждений (щитами)', unit: 'шт', price: 5000, category: 'prep' },
        'wrk_prep_relocate_utility': { name: 'Перенос/перекладка коммуникаций', unit: 'м.п.', price: 8500, category: 'prep' },
        // === МОНТАЖ/ДЕМОНТАЖ ЛЕСОВ ===
        'wrk_prep_scaffold_frame_h10': { name: 'Монтаж рамных лесов до 10м', unit: 'м²', price: 350, category: 'prep' },
        'wrk_prep_scaffold_frame_h20': { name: 'Монтаж рамных лесов до 20м', unit: 'м²', price: 450, category: 'prep' },
        'wrk_prep_scaffold_frame_h30': { name: 'Монтаж рамных лесов до 30м', unit: 'м²', price: 600, category: 'prep' },
        'wrk_prep_scaffold_tube_h10': { name: 'Монтаж хомутовых лесов до 10м', unit: 'м²', price: 450, category: 'prep' },
        'wrk_prep_scaffold_tube_h20': { name: 'Монтаж хомутовых лесов до 20м', unit: 'м²', price: 600, category: 'prep' },
        'wrk_prep_scaffold_dismantle_10': { name: 'Демонтаж лесов до 10м', unit: 'м²', price: 200, category: 'prep' },
        'wrk_prep_scaffold_dismantle_20': { name: 'Демонтаж лесов до 20м', unit: 'м²', price: 280, category: 'prep' },
        'wrk_prep_scaffold_dismantle_30': { name: 'Демонтаж лесов до 30м', unit: 'м²', price: 380, category: 'prep' },
        // === УКРЕПЛЕНИЕ ОТКОСОВ ===
        'wrk_prep_slope_geotex': { name: 'Укрепление откоса геотекстилем', unit: 'м²', price: 250, category: 'prep' },
        'wrk_prep_slope_geogrid': { name: 'Укрепление откоса георешёткой', unit: 'м²', price: 650, category: 'prep' },
        'wrk_prep_slope_seed': { name: 'Укрепление откоса посевом трав', unit: 'м²', price: 180, category: 'prep' },
        'wrk_prep_slope_gabion': { name: 'Укрепление откоса габионами', unit: 'м³', price: 12000, category: 'prep' }
    };
})();
