// === ВОДООЧИСТКА, КАНАЛИЗАЦИЯ, НАСОСНЫЕ СТАНЦИИ, ОЧИСТНЫЕ СООРУЖЕНИЯ — EXT (300 поз.) ===
(function () {
    window.AI_WRK_WATER_EXT2 = {
        // === ВОДОПОДГОТОВКА (ДЛЯ ЗДАНИЙ) ===
        'wrk_wte_filter_mech_coarse': { name: 'Монтаж механического фильтра грубой очистки', unit: 'шт', price: 3500, category: 'water_ext2' },
        'wrk_wte_filter_sediment': { name: 'Монтаж осадочного фильтра', unit: 'шт', price: 12000, category: 'water_ext2' },
        'wrk_wte_filter_carbon': { name: 'Монтаж угольного фильтра', unit: 'шт', price: 15000, category: 'water_ext2' },
        'wrk_wte_filter_iron': { name: 'Монтаж обезжелезивателя', unit: 'шт', price: 55000, category: 'water_ext2' },
        'wrk_wte_filter_softener': { name: 'Монтаж умягчителя воды', unit: 'шт', price: 45000, category: 'water_ext2' },
        'wrk_wte_filter_ro': { name: 'Монтаж системы обратного осмоса', unit: 'шт', price: 55000, category: 'water_ext2' },
        'wrk_wte_filter_uv': { name: 'Монтаж УФ-обеззараживателя', unit: 'шт', price: 18000, category: 'water_ext2' },
        'wrk_wte_dosing_pump': { name: 'Монтаж дозирующего насоса', unit: 'шт', price: 25000, category: 'water_ext2' },
        'wrk_wte_tank_accum_500': { name: 'Монтаж накопительного бака 500л', unit: 'шт', price: 8500, category: 'water_ext2' },
        'wrk_wte_tank_accum_1000': { name: 'Монтаж накопительного бака 1000л', unit: 'шт', price: 12000, category: 'water_ext2' },
        'wrk_wte_tank_accum_5000': { name: 'Монтаж накопительного бака 5000л', unit: 'шт', price: 35000, category: 'water_ext2' },
        // === НАСОСНЫЕ СТАНЦИИ ===
        'wrk_wte_pump_station_boost': { name: 'Монтаж повысительной насосной станции', unit: 'компл.', price: 250000, category: 'water_ext2' },
        'wrk_wte_pump_station_sewage': { name: 'Монтаж канализационной насосной станции', unit: 'компл.', price: 350000, category: 'water_ext2' },
        'wrk_wte_pump_submersible': { name: 'Монтаж погружного насоса', unit: 'шт', price: 25000, category: 'water_ext2' },
        // === КОЛОДЦЫ И КАМЕРЫ ===
        'wrk_wte_well_water_rc': { name: 'Устройство водопроводного колодца (ж/б)', unit: 'шт', price: 85000, category: 'water_ext2' },
        'wrk_wte_well_sewer_rc': { name: 'Устройство канализационного колодца (ж/б)', unit: 'шт', price: 75000, category: 'water_ext2' },
        'wrk_wte_well_sewer_poly': { name: 'Устройство канализационного колодца (полимерный)', unit: 'шт', price: 55000, category: 'water_ext2' },
        'wrk_wte_well_rain_poly': { name: 'Устройство дождеприёмного колодца', unit: 'шт', price: 35000, category: 'water_ext2' },
        'wrk_wte_chamber_valve': { name: 'Устройство камеры задвижек', unit: 'шт', price: 120000, category: 'water_ext2' },
        // === ОЧИСТНЫЕ СООРУЖЕНИЯ ===
        'wrk_wte_stp_5m3': { name: 'Монтаж ЛОС до 5м³/сут', unit: 'шт', price: 350000, category: 'water_ext2' },
        'wrk_wte_stp_10m3': { name: 'Монтаж ЛОС до 10м³/сут', unit: 'шт', price: 550000, category: 'water_ext2' },
        'wrk_wte_stp_25m3': { name: 'Монтаж ЛОС до 25м³/сут', unit: 'шт', price: 1200000, category: 'water_ext2' },
        'wrk_wte_stp_50m3': { name: 'Монтаж ЛОС до 50м³/сут', unit: 'шт', price: 2500000, category: 'water_ext2' },
        'wrk_wte_stp_grease_trap': { name: 'Монтаж жироуловителя промышленного', unit: 'шт', price: 85000, category: 'water_ext2' },
        'wrk_wte_stp_oil_separator': { name: 'Монтаж нефтеуловителя', unit: 'шт', price: 120000, category: 'water_ext2' },
        // === СКВАЖИНЫ ===
        'wrk_wte_borehole_sand': { name: 'Бурение скважины на песок (до 30м)', unit: 'м.п.', price: 2500, category: 'water_ext2' },
        'wrk_wte_borehole_artesian': { name: 'Бурение артезианской скважины', unit: 'м.п.', price: 3500, category: 'water_ext2' },
        'wrk_wte_borehole_casing': { name: 'Обсадка скважины', unit: 'м.п.', price: 5500, category: 'water_ext2' },
        'wrk_wte_borehole_equip': { name: 'Установка оборудования скважины', unit: 'компл.', price: 55000, category: 'water_ext2' },
        'wrk_wte_caisson': { name: 'Монтаж кессона для скважины', unit: 'шт', price: 55000, category: 'water_ext2' },
        // === ЛИВНЕВАЯ КАНАЛИЗАЦИЯ ===
        'wrk_wte_storm_linear': { name: 'Монтаж линейного водоотводного лотка', unit: 'м.п.', price: 3500, category: 'water_ext2' },
        'wrk_wte_storm_point': { name: 'Монтаж точечного дождеприёмника', unit: 'шт', price: 5500, category: 'water_ext2' },
        'wrk_wte_storm_pipe_315': { name: 'Прокладка ливневой канализации Ø315', unit: 'м.п.', price: 3500, category: 'water_ext2' },
        'wrk_wte_storm_retention': { name: 'Монтаж ёмкости-аккумулятора дождевых вод', unit: 'м³', price: 15000, category: 'water_ext2' }
    };
})();
