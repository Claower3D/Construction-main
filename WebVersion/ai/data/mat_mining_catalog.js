// === ГОРНОДОБЫЧА — крепёж, буры, конвейеры, вентиляция, взрывчатка (300 поз.) ===
(function () {
    window.AI_MAT_MINING = {
        // === КРЕПЁЖ ГОРНЫХ ВЫРАБОТОК ===
        'mat_mn_anchor_bolt_2m': { name: 'Анкер стальной L=2м Ø20', unit: 'шт', price: 1500, category: 'mining' },
        'mat_mn_anchor_bolt_2_4m': { name: 'Анкер стальной L=2.4м Ø22', unit: 'шт', price: 1800, category: 'mining' },
        'mat_mn_anchor_resin': { name: 'Ампула химическая для анкера', unit: 'шт', price: 350, category: 'mining' },
        'mat_mn_mesh_weld_4x100': { name: 'Сетка сварная для шахт 4×100×100', unit: 'м²', price: 550, category: 'mining' },
        'mat_mn_mesh_chain': { name: 'Сетка плетёная шахтная', unit: 'м²', price: 350, category: 'mining' },
        'mat_mn_arch_svp22': { name: 'Арка СВП-22 (комплект)', unit: 'комп.', price: 18000, category: 'mining' },
        'mat_mn_arch_svp27': { name: 'Арка СВП-27 (комплект)', unit: 'комп.', price: 22000, category: 'mining' },
        'mat_mn_arch_svp33': { name: 'Арка СВП-33 (комплект)', unit: 'комп.', price: 28000, category: 'mining' },
        'mat_mn_timber_stull': { name: 'Стойка крепёжная деревянная 2.5м', unit: 'шт', price: 2500, category: 'mining' },
        'mat_mn_timber_cap': { name: 'Верхняк деревянный 3м', unit: 'шт', price: 3500, category: 'mining' },
        'mat_mn_shotcrete_mix': { name: 'Смесь для торкретбетона (25кг)', unit: 'мешок', price: 850, category: 'mining' },
        'mat_mn_shotcrete_fiber': { name: 'Фибра стальная для торкрета (25кг)', unit: 'мешок', price: 4500, category: 'mining' },
        'mat_mn_shotcrete_accel': { name: 'Ускоритель твердения торкрета (25кг)', unit: 'канистра', price: 8500, category: 'mining' },
        // === БУРОВОЕ ОБОРУДОВАНИЕ ===
        'mat_mn_drill_bit_36': { name: 'Коронка буровая Ø36мм', unit: 'шт', price: 2500, category: 'mining' },
        'mat_mn_drill_bit_42': { name: 'Коронка буровая Ø42мм', unit: 'шт', price: 3200, category: 'mining' },
        'mat_mn_drill_bit_76': { name: 'Коронка буровая Ø76мм', unit: 'шт', price: 8500, category: 'mining' },
        'mat_mn_drill_bit_112': { name: 'Коронка буровая Ø112мм', unit: 'шт', price: 15000, category: 'mining' },
        'mat_mn_drill_rod_1_5m': { name: 'Штанга буровая 1.5м Ø32', unit: 'шт', price: 5500, category: 'mining' },
        'mat_mn_drill_rod_3m': { name: 'Штанга буровая 3м Ø36', unit: 'шт', price: 8500, category: 'mining' },
        'mat_mn_drill_coupling': { name: 'Муфта соединительная буровая', unit: 'шт', price: 2200, category: 'mining' },
        'mat_mn_pick_conical': { name: 'Резец конический для комбайна', unit: 'шт', price: 3500, category: 'mining' },
        'mat_mn_pick_radial': { name: 'Резец радиальный для комбайна', unit: 'шт', price: 4500, category: 'mining' },
        // === КОНВЕЙЕРЫ ===
        'mat_mn_belt_800_ep300': { name: 'Лента конвейерная 800мм EP-300', unit: 'м.п.', price: 8500, category: 'mining' },
        'mat_mn_belt_1000_ep400': { name: 'Лента конвейерная 1000мм EP-400', unit: 'м.п.', price: 12000, category: 'mining' },
        'mat_mn_belt_1200_ep500': { name: 'Лента конвейерная 1200мм EP-500', unit: 'м.п.', price: 16000, category: 'mining' },
        'mat_mn_belt_1400_ep630': { name: 'Лента конвейерная 1400мм EP-630', unit: 'м.п.', price: 22000, category: 'mining' },
        'mat_mn_roller_upper_d89': { name: 'Ролик верхний Ø89 L=380', unit: 'шт', price: 2500, category: 'mining' },
        'mat_mn_roller_upper_d108': { name: 'Ролик верхний Ø108 L=465', unit: 'шт', price: 3200, category: 'mining' },
        'mat_mn_roller_lower_d89': { name: 'Ролик нижний Ø89 L=600', unit: 'шт', price: 2200, category: 'mining' },
        'mat_mn_roller_impact': { name: 'Ролик амортизирующий (резина)', unit: 'шт', price: 4500, category: 'mining' },
        'mat_mn_roller_bracket_3': { name: 'Опора роликовая 3-роликовая', unit: 'шт', price: 3500, category: 'mining' },
        'mat_mn_conveyor_drum_drive': { name: 'Барабан приводной Ø500 L=800', unit: 'шт', price: 85000, category: 'mining' },
        'mat_mn_conveyor_drum_tail': { name: 'Барабан натяжной Ø400 L=800', unit: 'шт', price: 55000, category: 'mining' },
        'mat_mn_belt_cleaner': { name: 'Скребок очистной для ленты', unit: 'шт', price: 25000, category: 'mining' },
        // === ВЕНТИЛЯЦИЯ ШАХТНАЯ ===
        'mat_mn_fan_local_11': { name: 'Вентилятор местный ВМЭ-6 11кВт', unit: 'шт', price: 250000, category: 'mining' },
        'mat_mn_fan_local_30': { name: 'Вентилятор местный ВМЭ-8 30кВт', unit: 'шт', price: 450000, category: 'mining' },
        'mat_mn_duct_flex_600': { name: 'Труба вентиляционная гибкая Ø600', unit: 'м.п.', price: 2500, category: 'mining' },
        'mat_mn_duct_flex_800': { name: 'Труба вентиляционная гибкая Ø800', unit: 'м.п.', price: 3500, category: 'mining' },
        'mat_mn_duct_flex_1000': { name: 'Труба вентиляционная гибкая Ø1000', unit: 'м.п.', price: 4500, category: 'mining' },
        'mat_mn_duct_metal_600': { name: 'Труба вентиляционная металл. Ø600', unit: 'м.п.', price: 5500, category: 'mining' },
        // === ОСВЕЩЕНИЕ ШАХТНОЕ ===
        'mat_mn_lamp_head': { name: 'Светильник шахтный головной', unit: 'шт', price: 8500, category: 'mining' },
        'mat_mn_lamp_fixture': { name: 'Светильник шахтный РВ 2×36Вт', unit: 'шт', price: 15000, category: 'mining' },
        'mat_mn_lamp_led_rv': { name: 'Светильник шахтный LED РВ 50Вт', unit: 'шт', price: 25000, category: 'mining' },
        'mat_mn_cable_rv_3x16': { name: 'Кабель шахтный КГЭШ 3×16+1×6', unit: 'м.п.', price: 1800, category: 'mining' },
        'mat_mn_cable_rv_3x50': { name: 'Кабель шахтный КГЭШ 3×50+1×10', unit: 'м.п.', price: 3500, category: 'mining' },
        // === РЕЛЬСОВЫЙ ПУТЬ (ШАХТНЫЙ) ===
        'mat_mn_rail_p24': { name: 'Рельс шахтный Р24 (8м)', unit: 'шт', price: 25000, category: 'mining' },
        'mat_mn_rail_p33': { name: 'Рельс шахтный Р33 (8м)', unit: 'шт', price: 35000, category: 'mining' },
        'mat_mn_sleeper_mine': { name: 'Шпала шахтная деревянная', unit: 'шт', price: 2200, category: 'mining' },
        'mat_mn_turnout_mine': { name: 'Стрелочный перевод шахтный', unit: 'комп.', price: 350000, category: 'mining' },
        // === ВОДООТЛИВ ===
        'mat_mn_pump_cnsk_60': { name: 'Насос шахтный ЦНС 60-330', unit: 'шт', price: 850000, category: 'mining' },
        'mat_mn_pump_cnsk_180': { name: 'Насос шахтный ЦНС 180-425', unit: 'шт', price: 1500000, category: 'mining' },
        'mat_mn_pipe_water_100': { name: 'Труба водоотливная Ду100 (шахт.)', unit: 'м.п.', price: 3500, category: 'mining' },
        'mat_mn_pipe_water_150': { name: 'Труба водоотливная Ду150 (шахт.)', unit: 'м.п.', price: 5500, category: 'mining' }
    };
})();
