// === ТРУБЫ, ФИТИНГИ, ЗАПОРНАЯ АРМАТУРА (100 позиций) ===
(function () {
    window.AI_MAT_PLUMBING = {
        // Трубы PPR (полипропилен)
        'ppr_20': { name: 'Труба PPR Ø20мм (PN20)', unit: 'п.м.', price: 60, category: 'plumbing' },
        'ppr_25': { name: 'Труба PPR Ø25мм (PN20)', unit: 'п.м.', price: 85, category: 'plumbing' },
        'ppr_32': { name: 'Труба PPR Ø32мм (PN20)', unit: 'п.м.', price: 120, category: 'plumbing' },
        'ppr_40': { name: 'Труба PPR Ø40мм (PN20)', unit: 'п.м.', price: 180, category: 'plumbing' },
        'ppr_50': { name: 'Труба PPR Ø50мм (PN20)', unit: 'п.м.', price: 280, category: 'plumbing' },
        'ppr_63': { name: 'Труба PPR Ø63мм (PN20)', unit: 'п.м.', price: 400, category: 'plumbing' },
        'ppr_20_fb': { name: 'Труба PPR армированная Ø20мм (стекловол.)', unit: 'п.м.', price: 90, category: 'plumbing' },
        'ppr_25_fb': { name: 'Труба PPR армированная Ø25мм (стекловол.)', unit: 'п.м.', price: 130, category: 'plumbing' },
        'ppr_32_fb': { name: 'Труба PPR армированная Ø32мм (стекловол.)', unit: 'п.м.', price: 180, category: 'plumbing' },

        // Фитинги PPR
        'ppr_coupling_20': { name: 'Муфта PPR Ø20', unit: 'шт', price: 12, category: 'plumbing' },
        'ppr_coupling_25': { name: 'Муфта PPR Ø25', unit: 'шт', price: 18, category: 'plumbing' },
        'ppr_coupling_32': { name: 'Муфта PPR Ø32', unit: 'шт', price: 28, category: 'plumbing' },
        'ppr_elbow_20_90': { name: 'Угол PPR 90° Ø20', unit: 'шт', price: 15, category: 'plumbing' },
        'ppr_elbow_25_90': { name: 'Угол PPR 90° Ø25', unit: 'шт', price: 22, category: 'plumbing' },
        'ppr_elbow_32_90': { name: 'Угол PPR 90° Ø32', unit: 'шт', price: 35, category: 'plumbing' },
        'ppr_tee_20': { name: 'Тройник PPR Ø20', unit: 'шт', price: 18, category: 'plumbing' },
        'ppr_tee_25': { name: 'Тройник PPR Ø25', unit: 'шт', price: 28, category: 'plumbing' },
        'ppr_tee_32': { name: 'Тройник PPR Ø32', unit: 'шт', price: 42, category: 'plumbing' },
        'ppr_mre_20_1_2': { name: 'Муфта комбинированная PPR 20×1/2" НР', unit: 'шт', price: 80, category: 'plumbing' },
        'ppr_mre_25_3_4': { name: 'Муфта комбинированная PPR 25×3/4" НР', unit: 'шт', price: 120, category: 'plumbing' },
        'ppr_valve_20': { name: 'Кран шаровый PPR Ø20', unit: 'шт', price: 250, category: 'plumbing' },
        'ppr_valve_25': { name: 'Кран шаровый PPR Ø25', unit: 'шт', price: 350, category: 'plumbing' },

        // Трубы ПЭ (полиэтилен) для водоснабжения
        'pe_25_pn10': { name: 'Труба ПЭ-100 Ø25мм SDR17', unit: 'п.м.', price: 40, category: 'plumbing' },
        'pe_32_pn10': { name: 'Труба ПЭ-100 Ø32мм SDR17', unit: 'п.м.', price: 55, category: 'plumbing' },
        'pe_40_pn10': { name: 'Труба ПЭ-100 Ø40мм SDR17', unit: 'п.м.', price: 80, category: 'plumbing' },
        'pe_50_pn10': { name: 'Труба ПЭ-100 Ø50мм SDR17', unit: 'п.м.', price: 120, category: 'plumbing' },
        'pe_63_pn10': { name: 'Труба ПЭ-100 Ø63мм SDR17', unit: 'п.м.', price: 160, category: 'plumbing' },
        'pe_110_pn10': { name: 'Труба ПЭ-100 Ø110мм SDR17', unit: 'п.м.', price: 350, category: 'plumbing' },

        // Фитинги ПЭ компрессионные
        'pe_coupling_32': { name: 'Муфта ПЭ компрессионная Ø32', unit: 'шт', price: 120, category: 'plumbing' },
        'pe_elbow_32': { name: 'Угол ПЭ компрессионный 90° Ø32', unit: 'шт', price: 150, category: 'plumbing' },
        'pe_tee_32': { name: 'Тройник ПЭ компрессионный Ø32', unit: 'шт', price: 200, category: 'plumbing' },

        // Металлопластик
        'mlp_16': { name: 'Труба металлопластиковая Ø16мм', unit: 'п.м.', price: 55, category: 'plumbing' },
        'mlp_20': { name: 'Труба металлопластиковая Ø20мм', unit: 'п.м.', price: 75, category: 'plumbing' },
        'mlp_26': { name: 'Труба металлопластиковая Ø26мм', unit: 'п.м.', price: 100, category: 'plumbing' },
        'mlp_32': { name: 'Труба металлопластиковая Ø32мм', unit: 'п.м.', price: 150, category: 'plumbing' },

        // Сшитый полиэтилен (PEX)
        'pex_16': { name: 'Труба PEX-a Ø16мм (для тёпл. пола)', unit: 'п.м.', price: 50, category: 'plumbing' },
        'pex_20': { name: 'Труба PEX-a Ø20мм', unit: 'п.м.', price: 70, category: 'plumbing' },

        // Канализация ПВХ внутренняя
        'sewer_50_1m': { name: 'Труба канализационная ПВХ Ø50мм (1м)', unit: 'шт', price: 120, category: 'plumbing' },
        'sewer_50_2m': { name: 'Труба канализационная ПВХ Ø50мм (2м)', unit: 'шт', price: 200, category: 'plumbing' },
        'sewer_110_1m': { name: 'Труба канализационная ПВХ Ø110мм (1м)', unit: 'шт', price: 250, category: 'plumbing' },
        'sewer_110_2m': { name: 'Труба канализационная ПВХ Ø110мм (2м)', unit: 'шт', price: 450, category: 'plumbing' },
        'sewer_110_3m': { name: 'Труба канализационная ПВХ Ø110мм (3м)', unit: 'шт', price: 650, category: 'plumbing' },
        'sewer_50_elbow_90': { name: 'Отвод ПВХ 90° Ø50', unit: 'шт', price: 40, category: 'plumbing' },
        'sewer_50_elbow_45': { name: 'Отвод ПВХ 45° Ø50', unit: 'шт', price: 35, category: 'plumbing' },
        'sewer_110_elbow_90': { name: 'Отвод ПВХ 90° Ø110', unit: 'шт', price: 80, category: 'plumbing' },
        'sewer_110_elbow_45': { name: 'Отвод ПВХ 45° Ø110', unit: 'шт', price: 70, category: 'plumbing' },
        'sewer_110_tee': { name: 'Тройник ПВХ Ø110×110 90°', unit: 'шт', price: 120, category: 'plumbing' },
        'sewer_110_50_tee': { name: 'Тройник ПВХ Ø110×50 90°', unit: 'шт', price: 100, category: 'plumbing' },
        'sewer_110_50_reducer': { name: 'Переход ПВХ Ø110×50', unit: 'шт', price: 50, category: 'plumbing' },
        'sewer_50_revision': { name: 'Ревизия ПВХ Ø50', unit: 'шт', price: 80, category: 'plumbing' },
        'sewer_110_revision': { name: 'Ревизия ПВХ Ø110', unit: 'шт', price: 150, category: 'plumbing' },
        'sewer_110_plug': { name: 'Заглушка ПВХ Ø110', unit: 'шт', price: 30, category: 'plumbing' },

        // Канализация ПВХ наружная (рыжая)
        'sewer_ext_110_1m': { name: 'Труба канализ. наружная Ø110мм (1м)', unit: 'шт', price: 350, category: 'plumbing' },
        'sewer_ext_110_3m': { name: 'Труба канализ. наружная Ø110мм (3м)', unit: 'шт', price: 900, category: 'plumbing' },
        'sewer_ext_160_3m': { name: 'Труба канализ. наружная Ø160мм (3м)', unit: 'шт', price: 1500, category: 'plumbing' },

        // Запорная арматура (латунь)
        'valve_ball_1_2': { name: 'Кран шаровый 1/2" (латунь)', unit: 'шт', price: 350, category: 'plumbing' },
        'valve_ball_3_4': { name: 'Кран шаровый 3/4" (латунь)', unit: 'шт', price: 500, category: 'plumbing' },
        'valve_ball_1': { name: 'Кран шаровый 1" (латунь)', unit: 'шт', price: 750, category: 'plumbing' },
        'valve_ball_1_1_4': { name: 'Кран шаровый 1 1/4" (латунь)', unit: 'шт', price: 1100, category: 'plumbing' },
        'valve_ball_1_1_2': { name: 'Кран шаровы 1 1/2" (латунь)', unit: 'шт', price: 1500, category: 'plumbing' },
        'valve_ball_2': { name: 'Кран шаровый 2" (латунь)', unit: 'шт', price: 2200, category: 'plumbing' },

        // Обратные клапаны
        'check_valve_1_2': { name: 'Клапан обратный 1/2"', unit: 'шт', price: 350, category: 'plumbing' },
        'check_valve_3_4': { name: 'Клапан обратный 3/4"', unit: 'шт', price: 500, category: 'plumbing' },
        'check_valve_1': { name: 'Клапан обратный 1"', unit: 'шт', price: 700, category: 'plumbing' },

        // Фильтры / счётчики
        'filter_coarse_1_2': { name: 'Фильтр грубой очистки 1/2"', unit: 'шт', price: 300, category: 'plumbing' },
        'filter_coarse_3_4': { name: 'Фильтр грубой очистки 3/4"', unit: 'шт', price: 400, category: 'plumbing' },
        'filter_fine_10': { name: 'Фильтр тонкой очистки (10")', unit: 'шт', price: 2500, category: 'plumbing' },
        'meter_water_cold_1_2': { name: 'Счётчик воды холодной 1/2"', unit: 'шт', price: 3500, category: 'plumbing' },
        'meter_water_hot_1_2': { name: 'Счётчик воды горячей 1/2"', unit: 'шт', price: 4000, category: 'plumbing' },

        // Коллекторы
        'collector_2_out': { name: 'Коллектор с запорн. клапанами 2 отвода', unit: 'шт', price: 1800, category: 'plumbing' },
        'collector_3_out': { name: 'Коллектор с запорн. клапанами 3 отвода', unit: 'шт', price: 2500, category: 'plumbing' },
        'collector_4_out': { name: 'Коллектор с запорн. клапанами 4 отвода', unit: 'шт', price: 3200, category: 'plumbing' },
        'collector_box_600': { name: 'Шкаф коллекторный встраиваемый 600мм', unit: 'шт', price: 5000, category: 'plumbing' },

        // Гибкая подводка
        'flex_hose_1_2_50': { name: 'Подводка гибкая 1/2" (50см)', unit: 'шт', price: 150, category: 'plumbing' },
        'flex_hose_1_2_80': { name: 'Подводка гибкая 1/2" (80см)', unit: 'шт', price: 180, category: 'plumbing' },
        'flex_hose_1_2_100': { name: 'Подводка гибкая 1/2" (100см)', unit: 'шт', price: 200, category: 'plumbing' },

        // Герметизация
        'fum_tape': { name: 'ФУМ-лента 19мм×15м', unit: 'шт', price: 60, category: 'plumbing' },
        'hemp_thread': { name: 'Лён сантехнический (100г)', unit: 'шт', price: 120, category: 'plumbing' },
        'sealant_thread': { name: 'Нить сантехническая (50м)', unit: 'шт', price: 350, category: 'plumbing' },
        'paste_sealant': { name: 'Паста сантехническая (25г)', unit: 'шт', price: 180, category: 'plumbing' },

        // Крепёж для труб
        'pipe_clip_20': { name: 'Клипса для трубы Ø20мм', unit: 'шт', price: 5, category: 'plumbing' },
        'pipe_clip_25': { name: 'Клипса для трубы Ø25мм', unit: 'шт', price: 6, category: 'plumbing' },
        'pipe_clip_32': { name: 'Клипса для трубы Ø32мм', unit: 'шт', price: 8, category: 'plumbing' },
        'pipe_clamp_metal_1_2': { name: 'Хомут крепёжный 1/2"', unit: 'шт', price: 15, category: 'plumbing' },
        'pipe_clamp_metal_3_4': { name: 'Хомут крепёжный 3/4"', unit: 'шт', price: 20, category: 'plumbing' },

        // Канализационные аксессуары
        'siphon_bottle_40': { name: 'Сифон бутылочный 1 1/4"', unit: 'шт', price: 500, category: 'plumbing' },
        'siphon_floor_50': { name: 'Трап (сифон) напольный 50мм', unit: 'шт', price: 800, category: 'plumbing' },
        'sewer_corrugated_40': { name: 'Гофра для сифона Ø40мм', unit: 'шт', price: 150, category: 'plumbing' },
        'wc_corrugated_110': { name: 'Гофра для унитаза Ø110мм', unit: 'шт', price: 350, category: 'plumbing' },
        'manhole_cover_110': { name: 'Ревизионный люк канализации Ø110', unit: 'шт', price: 250, category: 'plumbing' }
    };
})();
