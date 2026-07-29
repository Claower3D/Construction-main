// === ФАЗА 3: ОВиК — ВЕНТИЛЯЦИЯ, КОНДИЦИОНИРОВАНИЕ, ПРОМЫШЛЕННЫЕ СИСТЕМЫ, ВОЗДУХОВОДЫ (130 поз.) ===
(function () {
    window.AI_WRK_HVAC_FULL = {
        // === ПРИТОЧНАЯ ВЕНТИЛЯЦИЯ ===
        'wrk_hv_supply_2000': { name: 'Приточная установка 2000 м³/ч', unit: 'шт', price: 12000, category: 'hvac_full' },
        'wrk_hv_supply_3000': { name: 'Приточная установка 3000 м³/ч', unit: 'шт', price: 18000, category: 'hvac_full' },
        'wrk_hv_supply_5000': { name: 'Приточная установка 5000 м³/ч', unit: 'шт', price: 30000, category: 'hvac_full' },
        'wrk_hv_supply_10000': { name: 'Приточная установка 10000 м³/ч', unit: 'шт', price: 50000, category: 'hvac_full' },
        // Приточно-вытяжная с рекуперацией
        'wrk_hv_ahu_500': { name: 'ПВУ с рекуператором 500 м³/ч', unit: 'шт', price: 10000, category: 'hvac_full' },
        'wrk_hv_ahu_1000': { name: 'ПВУ с рекуператором 1000 м³/ч', unit: 'шт', price: 15000, category: 'hvac_full' },
        'wrk_hv_ahu_2000': { name: 'ПВУ с рекуператором 2000 м³/ч', unit: 'шт', price: 25000, category: 'hvac_full' },
        'wrk_hv_ahu_3000': { name: 'ПВУ с рекуператором 3000 м³/ч', unit: 'шт', price: 35000, category: 'hvac_full' },
        'wrk_hv_ahu_5000': { name: 'ПВУ с рекуператором 5000 м³/ч', unit: 'шт', price: 50000, category: 'hvac_full' },
        // Бытовая приточная
        'wrk_hv_breeze_100': { name: 'Бризер 100 м³/ч', unit: 'шт', price: 2000, category: 'hvac_full' },
        'wrk_hv_breeze_150': { name: 'Бризер 150 м³/ч', unit: 'шт', price: 3000, category: 'hvac_full' },
        'wrk_hv_klap_priv': { name: 'Приточный клапан стеновой', unit: 'шт', price: 500, category: 'hvac_full' },
        'wrk_hv_klap_priv_window': { name: 'Приточный клапан оконный', unit: 'шт', price: 200, category: 'hvac_full' },

        // === ВЫТЯЖНАЯ ВЕНТИЛЯЦИЯ ===
        'wrk_hv_exhaust_fan_100': { name: 'Вентилятор вытяжной Ø100мм', unit: 'шт', price: 100, category: 'hvac_full' },
        'wrk_hv_exhaust_fan_125': { name: 'Вентилятор вытяжной Ø125мм', unit: 'шт', price: 150, category: 'hvac_full' },
        'wrk_hv_exhaust_fan_150': { name: 'Вентилятор вытяжной Ø150мм', unit: 'шт', price: 200, category: 'hvac_full' },
        'wrk_hv_exhaust_fan_canal': { name: 'Канальный вентилятор', unit: 'шт', price: 500, category: 'hvac_full' },
        'wrk_hv_exhaust_fan_roof': { name: 'Крышный вентилятор', unit: 'шт', price: 3000, category: 'hvac_full' },
        'wrk_hv_exhaust_fan_centrifugal': { name: 'Центробежный вентилятор', unit: 'шт', price: 2000, category: 'hvac_full' },

        // === ВОЗДУХОВОДЫ ===
        'wrk_hv_duct_round_100': { name: 'Воздуховод круглый Ø100мм', unit: 'м.п.', price: 20, category: 'hvac_full' },
        'wrk_hv_duct_round_125': { name: 'Воздуховод круглый Ø125мм', unit: 'м.п.', price: 25, category: 'hvac_full' },
        'wrk_hv_duct_round_150': { name: 'Воздуховод круглый Ø150мм', unit: 'м.п.', price: 30, category: 'hvac_full' },
        'wrk_hv_duct_round_200': { name: 'Воздуховод круглый Ø200мм', unit: 'м.п.', price: 40, category: 'hvac_full' },
        'wrk_hv_duct_round_250': { name: 'Воздуховод круглый Ø250мм', unit: 'м.п.', price: 50, category: 'hvac_full' },
        'wrk_hv_duct_round_315': { name: 'Воздуховод круглый Ø315мм', unit: 'м.п.', price: 60, category: 'hvac_full' },
        'wrk_hv_duct_round_400': { name: 'Воздуховод круглый Ø400мм', unit: 'м.п.', price: 80, category: 'hvac_full' },
        'wrk_hv_duct_rect_200x100': { name: 'Воздуховод прямоуг. 200×100мм', unit: 'м.п.', price: 30, category: 'hvac_full' },
        'wrk_hv_duct_rect_300x150': { name: 'Воздуховод прямоуг. 300×150мм', unit: 'м.п.', price: 40, category: 'hvac_full' },
        'wrk_hv_duct_rect_400x200': { name: 'Воздуховод прямоуг. 400×200мм', unit: 'м.п.', price: 60, category: 'hvac_full' },
        'wrk_hv_duct_rect_500x250': { name: 'Воздуховод прямоуг. 500×250мм', unit: 'м.п.', price: 80, category: 'hvac_full' },
        'wrk_hv_duct_rect_600x300': { name: 'Воздуховод прямоуг. 600×300мм', unit: 'м.п.', price: 100, category: 'hvac_full' },
        'wrk_hv_duct_fire_damper': { name: 'Противопожарный клапан', unit: 'шт', price: 1000, category: 'hvac_full' },
        'wrk_hv_duct_check_valve': { name: 'Обратный клапан', unit: 'шт', price: 50, category: 'hvac_full' },
        'wrk_hv_duct_damper': { name: 'Воздушный клапан (заслонка)', unit: 'шт', price: 100, category: 'hvac_full' },
        'wrk_hv_duct_silencer': { name: 'Шумоглушитель', unit: 'шт', price: 500, category: 'hvac_full' },
        'wrk_hv_duct_filter': { name: 'Фильтр воздушный (замена)', unit: 'шт', price: 100, category: 'hvac_full' },

        // === РЕШЁТКИ И ДИФФУЗОРЫ ===
        'wrk_hv_grille_supply': { name: 'Решётка приточная 200×200', unit: 'шт', price: 30, category: 'hvac_full' },
        'wrk_hv_grille_exhaust': { name: 'Решётка вытяжная 200×200', unit: 'шт', price: 30, category: 'hvac_full' },
        'wrk_hv_grille_transfer': { name: 'Решётка переточная', unit: 'шт', price: 20, category: 'hvac_full' },
        'wrk_hv_diffuser_round': { name: 'Диффузор круглый', unit: 'шт', price: 50, category: 'hvac_full' },
        'wrk_hv_diffuser_square': { name: 'Диффузор квадратный', unit: 'шт', price: 60, category: 'hvac_full' },
        'wrk_hv_diffuser_slot': { name: 'Щелевой диффузор', unit: 'м.п.', price: 100, category: 'hvac_full' },
        'wrk_hv_diffuser_floor': { name: 'Напольная решётка', unit: 'шт', price: 80, category: 'hvac_full' },

        // === КОНДИЦИОНИРОВАНИЕ (промышленное) ===
        'wrk_hv_split_07': { name: 'Сплит-система 2.1кВт (7)', unit: 'шт', price: 3000, category: 'hvac_full' },
        'wrk_hv_split_09': { name: 'Сплит-система 2.6кВт (9)', unit: 'шт', price: 3500, category: 'hvac_full' },
        'wrk_hv_split_12': { name: 'Сплит-система 3.5кВт (12)', unit: 'шт', price: 4000, category: 'hvac_full' },
        'wrk_hv_split_18': { name: 'Сплит-система 5.3кВт (18)', unit: 'шт', price: 5000, category: 'hvac_full' },
        'wrk_hv_split_24': { name: 'Сплит-система 7кВт (24)', unit: 'шт', price: 6000, category: 'hvac_full' },
        'wrk_hv_split_36': { name: 'Сплит-система 10.5кВт (36)', unit: 'шт', price: 8000, category: 'hvac_full' },
        'wrk_hv_multi_2': { name: 'Мульти-сплит (2 блока)', unit: 'шт', price: 8000, category: 'hvac_full' },
        'wrk_hv_multi_3': { name: 'Мульти-сплит (3 блока)', unit: 'шт', price: 12000, category: 'hvac_full' },
        'wrk_hv_multi_4': { name: 'Мульти-сплит (4 блока)', unit: 'шт', price: 16000, category: 'hvac_full' },
        'wrk_hv_cassette': { name: 'Кассетный кондиционер', unit: 'шт', price: 8000, category: 'hvac_full' },
        'wrk_hv_channel': { name: 'Канальный кондиционер', unit: 'шт', price: 7000, category: 'hvac_full' },
        'wrk_hv_column': { name: 'Колонный кондиционер', unit: 'шт', price: 10000, category: 'hvac_full' },
        'wrk_hv_vrf_outdoor': { name: 'VRF наружный блок', unit: 'шт', price: 30000, category: 'hvac_full' },
        'wrk_hv_vrf_indoor': { name: 'VRF внутренний блок', unit: 'шт', price: 5000, category: 'hvac_full' },
        'wrk_hv_chiller': { name: 'Чиллер', unit: 'шт', price: 100000, category: 'hvac_full' },
        'wrk_hv_fancoil': { name: 'Фанкойл', unit: 'шт', price: 5000, category: 'hvac_full' },
        'wrk_hv_freon_pipe': { name: 'Фреоновая трасса', unit: 'м.п.', price: 50, category: 'hvac_full' },
        'wrk_hv_freon_charge': { name: 'Заправка фреоном', unit: 'шт', price: 500, category: 'hvac_full' },
        'wrk_hv_drain_pump': { name: 'Дренажная помпа (конденсат)', unit: 'шт', price: 300, category: 'hvac_full' },
    };
})();
