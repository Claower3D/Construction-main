// === ФАЗА 3: ВОДОСНАБЖЕНИЕ И КАНАЛИЗАЦИЯ ВНУТРЕННИЕ — ТРУБЫ, ФИТИНГИ, КОЛЛЕКТОРЫ (110 поз.) ===
(function () {
    window.AI_WRK_PIPING_FULL = {
        // === ТРУБЫ ПП (ПОЛИПРОПИЛЕН) ===
        'wrk_pip_pp_20_cold': { name: 'Труба ПП Ø20мм (ХВС)', unit: 'м.п.', price: 15, category: 'piping_full' },
        'wrk_pip_pp_25_cold': { name: 'Труба ПП Ø25мм (ХВС)', unit: 'м.п.', price: 18, category: 'piping_full' },
        'wrk_pip_pp_32_cold': { name: 'Труба ПП Ø32мм (ХВС)', unit: 'м.п.', price: 22, category: 'piping_full' },
        'wrk_pip_pp_20_hot': { name: 'Труба ПП Ø20мм (ГВС, армиров.)', unit: 'м.п.', price: 20, category: 'piping_full' },
        'wrk_pip_pp_25_hot': { name: 'Труба ПП Ø25мм (ГВС, армиров.)', unit: 'м.п.', price: 25, category: 'piping_full' },
        'wrk_pip_pp_32_hot': { name: 'Труба ПП Ø32мм (ГВС, армиров.)', unit: 'м.п.', price: 30, category: 'piping_full' },
        'wrk_pip_pp_40_hot': { name: 'Труба ПП Ø40мм (ГВС, армиров.)', unit: 'м.п.', price: 40, category: 'piping_full' },
        'wrk_pip_pp_50_hot': { name: 'Труба ПП Ø50мм (ГВС, армиров.)', unit: 'м.п.', price: 60, category: 'piping_full' },

        // === ТРУБЫ МЕТАЛЛОПЛАСТИК ===
        'wrk_pip_mp_16': { name: 'Металлопласт Ø16мм', unit: 'м.п.', price: 15, category: 'piping_full' },
        'wrk_pip_mp_20': { name: 'Металлопласт Ø20мм', unit: 'м.п.', price: 20, category: 'piping_full' },
        'wrk_pip_mp_26': { name: 'Металлопласт Ø26мм', unit: 'м.п.', price: 25, category: 'piping_full' },
        'wrk_pip_mp_32': { name: 'Металлопласт Ø32мм', unit: 'м.п.', price: 35, category: 'piping_full' },

        // === ТРУБЫ СШИТЫЙ ПОЛИЭТИЛЕН (PEX) ===
        'wrk_pip_pex_16': { name: 'PEX-a/b Ø16мм', unit: 'м.п.', price: 15, category: 'piping_full' },
        'wrk_pip_pex_20': { name: 'PEX-a/b Ø20мм', unit: 'м.п.', price: 20, category: 'piping_full' },
        'wrk_pip_pex_25': { name: 'PEX-a/b Ø25мм', unit: 'м.п.', price: 25, category: 'piping_full' },
        'wrk_pip_pex_32': { name: 'PEX-a/b Ø32мм', unit: 'м.п.', price: 35, category: 'piping_full' },

        // === ТРУБЫ МЕДЬ ===
        'wrk_pip_cu_15': { name: 'Медная труба Ø15мм', unit: 'м.п.', price: 40, category: 'piping_full' },
        'wrk_pip_cu_18': { name: 'Медная труба Ø18мм', unit: 'м.п.', price: 50, category: 'piping_full' },
        'wrk_pip_cu_22': { name: 'Медная труба Ø22мм', unit: 'м.п.', price: 60, category: 'piping_full' },
        'wrk_pip_cu_28': { name: 'Медная труба Ø28мм', unit: 'м.п.', price: 80, category: 'piping_full' },
        'wrk_pip_cu_35': { name: 'Медная труба Ø35мм', unit: 'м.п.', price: 100, category: 'piping_full' },

        // === ТРУБЫ СТАЛЬНЫЕ ===
        'wrk_pip_steel_15': { name: 'Стальная труба Ø15мм', unit: 'м.п.', price: 30, category: 'piping_full' },
        'wrk_pip_steel_20': { name: 'Стальная труба Ø20мм', unit: 'м.п.', price: 35, category: 'piping_full' },
        'wrk_pip_steel_25': { name: 'Стальная труба Ø25мм', unit: 'м.п.', price: 40, category: 'piping_full' },
        'wrk_pip_steel_32': { name: 'Стальная труба Ø32мм', unit: 'м.п.', price: 50, category: 'piping_full' },
        'wrk_pip_steel_40': { name: 'Стальная труба Ø40мм', unit: 'м.п.', price: 60, category: 'piping_full' },
        'wrk_pip_steel_50': { name: 'Стальная труба Ø50мм', unit: 'м.п.', price: 80, category: 'piping_full' },

        // === КАНАЛИЗАЦИЯ ВНУТРЕННЯЯ ===
        'wrk_pip_sewer_50': { name: 'Канализация Ø50мм (внутр.)', unit: 'м.п.', price: 15, category: 'piping_full' },
        'wrk_pip_sewer_75': { name: 'Канализация Ø75мм (внутр.)', unit: 'м.п.', price: 20, category: 'piping_full' },
        'wrk_pip_sewer_110': { name: 'Канализация Ø110мм (внутр.)', unit: 'м.п.', price: 25, category: 'piping_full' },
        'wrk_pip_sewer_160': { name: 'Канализация Ø160мм (внутр.)', unit: 'м.п.', price: 40, category: 'piping_full' },
        'wrk_pip_sewer_200': { name: 'Канализация Ø200мм (внутр.)', unit: 'м.п.', price: 60, category: 'piping_full' },
        'wrk_pip_sewer_silent_50': { name: 'Бесшумная канализация Ø50мм', unit: 'м.п.', price: 30, category: 'piping_full' },
        'wrk_pip_sewer_silent_110': { name: 'Бесшумная канализация Ø110мм', unit: 'м.п.', price: 50, category: 'piping_full' },

        // === КАНАЛИЗАЦИЯ НАРУЖНАЯ ===
        'wrk_pip_sewer_ext_110': { name: 'Канализация наружная Ø110мм', unit: 'м.п.', price: 25, category: 'piping_full' },
        'wrk_pip_sewer_ext_160': { name: 'Канализация наружная Ø160мм', unit: 'м.п.', price: 40, category: 'piping_full' },
        'wrk_pip_sewer_ext_200': { name: 'Канализация наружная Ø200мм', unit: 'м.п.', price: 60, category: 'piping_full' },
        'wrk_pip_sewer_ext_250': { name: 'Канализация наружная Ø250мм', unit: 'м.п.', price: 80, category: 'piping_full' },
        'wrk_pip_sewer_ext_315': { name: 'Канализация наружная Ø315мм', unit: 'м.п.', price: 120, category: 'piping_full' },

        // === КОЛЛЕКТОРЫ / РАСПРЕДЕЛЕНИЕ ===
        'wrk_pip_manifold_2': { name: 'Коллектор 2 выхода', unit: 'шт', price: 100, category: 'piping_full' },
        'wrk_pip_manifold_3': { name: 'Коллектор 3 выхода', unit: 'шт', price: 130, category: 'piping_full' },
        'wrk_pip_manifold_4': { name: 'Коллектор 4 выхода', unit: 'шт', price: 160, category: 'piping_full' },
        'wrk_pip_manifold_5': { name: 'Коллектор 5 выходов', unit: 'шт', price: 200, category: 'piping_full' },
        'wrk_pip_manifold_6': { name: 'Коллектор 6 выходов', unit: 'шт', price: 240, category: 'piping_full' },
        'wrk_pip_manifold_box': { name: 'Коллекторный шкаф', unit: 'шт', price: 200, category: 'piping_full' },
        'wrk_pip_reducer': { name: 'Редуктор давления', unit: 'шт', price: 100, category: 'piping_full' },
        'wrk_pip_filter_coarse': { name: 'Фильтр грубой очистки', unit: 'шт', price: 50, category: 'piping_full' },
        'wrk_pip_filter_fine': { name: 'Фильтр тонкой очистки', unit: 'шт', price: 100, category: 'piping_full' },

        // === ТЁПЛЫЙ ПОЛ (водяной/электрический) ===
        'wrk_pip_uf_water_pipe': { name: 'Тёплый пол водяной (труба PEX)', unit: 'м²', price: 50, category: 'piping_full' },
        'wrk_pip_uf_water_manifold': { name: 'Коллектор тёплого пола', unit: 'контур', price: 200, category: 'piping_full' },
        'wrk_pip_uf_water_pump': { name: 'Насосно-смесительный узел (ТП)', unit: 'шт', price: 3000, category: 'piping_full' },
        'wrk_pip_uf_water_plate': { name: 'Теплоразпределительная пластина', unit: 'м²', price: 30, category: 'piping_full' },
        'wrk_pip_uf_elec_cable': { name: 'Тёплый пол (кабель в стяжку)', unit: 'м²', price: 30, category: 'piping_full' },
        'wrk_pip_uf_elec_mat_150': { name: 'Тёплый пол (мат 150Вт/м²)', unit: 'м²', price: 30, category: 'piping_full' },
        'wrk_pip_uf_elec_mat_200': { name: 'Тёплый пол (мат 200Вт/м²)', unit: 'м²', price: 40, category: 'piping_full' },
        'wrk_pip_uf_elec_film': { name: 'Тёплый пол (плёночный ИК)', unit: 'м²', price: 25, category: 'piping_full' },
        'wrk_pip_uf_elec_carbon': { name: 'Тёплый пол (карбоновые стержни)', unit: 'м²', price: 50, category: 'piping_full' },
        'wrk_pip_uf_thermostat_mech': { name: 'Терморегулятор (механический)', unit: 'шт', price: 50, category: 'piping_full' },
        'wrk_pip_uf_thermostat_prog': { name: 'Терморегулятор (программируемый)', unit: 'шт', price: 100, category: 'piping_full' },
        'wrk_pip_uf_thermostat_wifi': { name: 'Терморегулятор (Wi-Fi)', unit: 'шт', price: 200, category: 'piping_full' },

        // === ВОДОМЕРЫ ===
        'wrk_pip_meter_cold_15': { name: 'Счётчик ХВС Ø15мм', unit: 'шт', price: 100, category: 'piping_full' },
        'wrk_pip_meter_cold_20': { name: 'Счётчик ХВС Ø20мм', unit: 'шт', price: 150, category: 'piping_full' },
        'wrk_pip_meter_hot_15': { name: 'Счётчик ГВС Ø15мм', unit: 'шт', price: 120, category: 'piping_full' },
        'wrk_pip_meter_hot_20': { name: 'Счётчик ГВС Ø20мм', unit: 'шт', price: 170, category: 'piping_full' },
        'wrk_pip_meter_node': { name: 'Узел учёта воды (комплект)', unit: 'шт', price: 500, category: 'piping_full' },
        'wrk_pip_leak_valve': { name: 'Электрокран (защита от протечек)', unit: 'шт', price: 200, category: 'piping_full' },
        'wrk_pip_leak_system': { name: 'Система защиты от протечек', unit: 'комплект', price: 1000, category: 'piping_full' }
    };
})();
