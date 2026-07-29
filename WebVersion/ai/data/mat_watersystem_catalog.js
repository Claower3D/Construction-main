// === КАТАЛОГ СИСТЕМ ВОДОСНАБЖЕНИЯ И КАНАЛИЗАЦИИ (50 позиций) ===
(function () {
    window.AI_MAT_WATERSYSTEM_CATALOG = {
        // Трубы ППР (полипропилен)
        'pipe_ppr_20_pn20_m': { name: 'Труба PPR Ø20 PN20 (м.п.)', unit: 'м.п.', price: 20, category: 'watersystem' },
        'pipe_ppr_25_pn20_m': { name: 'Труба PPR Ø25 PN20 (м.п.)', unit: 'м.п.', price: 30, category: 'watersystem' },
        'pipe_ppr_32_pn20_m': { name: 'Труба PPR Ø32 PN20 (м.п.)', unit: 'м.п.', price: 50, category: 'watersystem' },
        'pipe_ppr_20_pn25_arm_m': { name: 'Труба PPR Ø20 PN25 армир. (м.п.)', unit: 'м.п.', price: 40, category: 'watersystem' },
        'pipe_ppr_25_pn25_arm_m': { name: 'Труба PPR Ø25 PN25 армир. (м.п.)', unit: 'м.п.', price: 55, category: 'watersystem' },
        'pipe_ppr_32_pn25_arm_m': { name: 'Труба PPR Ø32 PN25 армир. (м.п.)', unit: 'м.п.', price: 80, category: 'watersystem' },
        // Фитинги ППР
        'fit_ppr_coupling_20': { name: 'Муфта PPR Ø20', unit: 'шт', price: 5, category: 'watersystem' },
        'fit_ppr_coupling_25': { name: 'Муфта PPR Ø25', unit: 'шт', price: 8, category: 'watersystem' },
        'fit_ppr_elbow_20_90': { name: 'Угольник PPR Ø20 90°', unit: 'шт', price: 8, category: 'watersystem' },
        'fit_ppr_elbow_25_90': { name: 'Угольник PPR Ø25 90°', unit: 'шт', price: 12, category: 'watersystem' },
        'fit_ppr_tee_20': { name: 'Тройник PPR Ø20', unit: 'шт', price: 10, category: 'watersystem' },
        'fit_ppr_tee_25': { name: 'Тройник PPR Ø25', unit: 'шт', price: 15, category: 'watersystem' },
        'fit_ppr_valve_20': { name: 'Кран шаровый PPR Ø20', unit: 'шт', price: 50, category: 'watersystem' },
        'fit_ppr_valve_25': { name: 'Кран шаровый PPR Ø25', unit: 'шт', price: 70, category: 'watersystem' },
        'fit_ppr_mf_20x1_2': { name: 'Переход PPR Ø20×1/2" нар. резьба', unit: 'шт', price: 20, category: 'watersystem' },
        'fit_ppr_ff_20x1_2': { name: 'Переход PPR Ø20×1/2" вн. резьба', unit: 'шт', price: 20, category: 'watersystem' },
        // Канализация внутренняя
        'pipe_kan_50_1m': { name: 'Труба канализ. Ø50 (1м)', unit: 'шт', price: 50, category: 'watersystem' },
        'pipe_kan_50_2m': { name: 'Труба канализ. Ø50 (2м)', unit: 'шт', price: 90, category: 'watersystem' },
        'pipe_kan_110_1m': { name: 'Труба канализ. Ø110 (1м)', unit: 'шт', price: 100, category: 'watersystem' },
        'pipe_kan_110_2m': { name: 'Труба канализ. Ø110 (2м)', unit: 'шт', price: 180, category: 'watersystem' },
        'pipe_kan_110_3m': { name: 'Труба канализ. Ø110 (3м)', unit: 'шт', price: 260, category: 'watersystem' },
        'fit_kan_elbow_50_45': { name: 'Отвод канализ. Ø50 45°', unit: 'шт', price: 15, category: 'watersystem' },
        'fit_kan_elbow_50_90': { name: 'Отвод канализ. Ø50 90°', unit: 'шт', price: 20, category: 'watersystem' },
        'fit_kan_elbow_110_45': { name: 'Отвод канализ. Ø110 45°', unit: 'шт', price: 30, category: 'watersystem' },
        'fit_kan_elbow_110_90': { name: 'Отвод канализ. Ø110 90°', unit: 'шт', price: 40, category: 'watersystem' },
        'fit_kan_tee_110x50': { name: 'Тройник канализ. Ø110×50', unit: 'шт', price: 40, category: 'watersystem' },
        'fit_kan_tee_110x110': { name: 'Тройник канализ. Ø110×110', unit: 'шт', price: 60, category: 'watersystem' },
        'fit_kan_reducer_110x50': { name: 'Переход канализ. Ø110×50', unit: 'шт', price: 30, category: 'watersystem' },
        'fit_kan_revision_110': { name: 'Ревизия канализ. Ø110', unit: 'шт', price: 80, category: 'watersystem' },
        'fit_kan_plug_110': { name: 'Заглушка канализ. Ø110', unit: 'шт', price: 20, category: 'watersystem' },
        // Канализация наружная (рыжая)
        'pipe_kan_out_110_1m': { name: 'Труба наружной канал. Ø110 (1м)', unit: 'шт', price: 150, category: 'watersystem' },
        'pipe_kan_out_110_3m': { name: 'Труба наружной канал. Ø110 (3м)', unit: 'шт', price: 400, category: 'watersystem' },
        'pipe_kan_out_160_3m': { name: 'Труба наружной канал. Ø160 (3м)', unit: 'шт', price: 600, category: 'watersystem' },
        // Сифоны
        'siphon_sink_bottle': { name: 'Сифон для раковины бутылочный', unit: 'шт', price: 200, category: 'watersystem' },
        'siphon_bath_semi_auto': { name: 'Сифон для ванны полуавтомат', unit: 'шт', price: 500, category: 'watersystem' },
        'siphon_shower_low': { name: 'Сифон для душевого поддона (низкий)', unit: 'шт', price: 300, category: 'watersystem' },
        'siphon_washing_machine': { name: 'Сифон для стиральной машины', unit: 'шт', price: 200, category: 'watersystem' },
        // Краны шаровые (латунь)
        'valve_ball_1_2': { name: 'Кран шаровый 1/2"', unit: 'шт', price: 100, category: 'watersystem' },
        'valve_ball_3_4': { name: 'Кран шаровый 3/4"', unit: 'шт', price: 150, category: 'watersystem' },
        'valve_ball_1': { name: 'Кран шаровый 1"', unit: 'шт', price: 250, category: 'watersystem' },
        // Фильтры
        'filter_coarse_1_2': { name: 'Фильтр грубой очистки 1/2"', unit: 'шт', price: 100, category: 'watersystem' },
        'filter_coarse_3_4': { name: 'Фильтр грубой очистки 3/4"', unit: 'шт', price: 150, category: 'watersystem' },
        'filter_cartridge_10': { name: 'Фильтр магистральный 10"', unit: 'шт', price: 500, category: 'watersystem' },
        'filter_cartridge_pp_10': { name: 'Картридж полипропиленовый 10"', unit: 'шт', price: 50, category: 'watersystem' },
        // Счётчики воды
        'water_meter_cold_dn15': { name: 'Счётчик воды холодной DN15', unit: 'шт', price: 500, category: 'watersystem' },
        'water_meter_hot_dn15': { name: 'Счётчик воды горячей DN15', unit: 'шт', price: 600, category: 'watersystem' },
        // Гибкая подводка
        'flex_hose_1_2_50cm': { name: 'Гибкая подводка 1/2" (50см)', unit: 'шт', price: 50, category: 'watersystem' },
        'flex_hose_1_2_80cm': { name: 'Гибкая подводка 1/2" (80см)', unit: 'шт', price: 70, category: 'watersystem' },
        'flex_hose_1_2_100cm': { name: 'Гибкая подводка 1/2" (100см)', unit: 'шт', price: 80, category: 'watersystem' }
    };
})();
