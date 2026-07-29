// === Ж/Д СТРОИТЕЛЬСТВО — рельсы, шпалы, стрелки, контактная сеть, сигнализация (300 поз.) ===
(function () {
    window.AI_MAT_RAILWAY = {
        // === РЕЛЬСЫ ===
        'mat_rw_rail_r50': { name: 'Рельс Р50 (12.5м)', unit: 'шт', price: 85000, category: 'railway' },
        'mat_rw_rail_r65': { name: 'Рельс Р65 (12.5м)', unit: 'шт', price: 110000, category: 'railway' },
        'mat_rw_rail_r65_25m': { name: 'Рельс Р65 (25м)', unit: 'шт', price: 215000, category: 'railway' },
        'mat_rw_rail_r75': { name: 'Рельс Р75 (12.5м)', unit: 'шт', price: 135000, category: 'railway' },
        'mat_rw_rail_crane_kr70': { name: 'Рельс крановый КР-70', unit: 'м.п.', price: 12000, category: 'railway' },
        'mat_rw_rail_crane_kr80': { name: 'Рельс крановый КР-80', unit: 'м.п.', price: 15000, category: 'railway' },
        'mat_rw_rail_crane_kr100': { name: 'Рельс крановый КР-100', unit: 'м.п.', price: 18000, category: 'railway' },
        'mat_rw_rail_crane_kr120': { name: 'Рельс крановый КР-120', unit: 'м.п.', price: 22000, category: 'railway' },
        // === ШПАЛЫ ===
        'mat_rw_sleeper_wood_1': { name: 'Шпала деревянная тип I (пропит.)', unit: 'шт', price: 8500, category: 'railway' },
        'mat_rw_sleeper_wood_2': { name: 'Шпала деревянная тип II (пропит.)', unit: 'шт', price: 7500, category: 'railway' },
        'mat_rw_sleeper_concrete_sh1': { name: 'Шпала ж/б Ш1-1 (для Р65)', unit: 'шт', price: 12000, category: 'railway' },
        'mat_rw_sleeper_concrete_sh3': { name: 'Шпала ж/б Ш3 (для Р50)', unit: 'шт', price: 10500, category: 'railway' },
        'mat_rw_sleeper_half': { name: 'Полушпалок ж/б', unit: 'шт', price: 5500, category: 'railway' },
        'mat_rw_sleeper_bridge': { name: 'Шпала мостовая деревянная 200×240×3250', unit: 'шт', price: 15000, category: 'railway' },
        // === СКРЕПЛЕНИЯ ===
        'mat_rw_fastener_kb65': { name: 'Скрепление КБ-65 (комплект)', unit: 'комп.', price: 1200, category: 'railway' },
        'mat_rw_fastener_d0': { name: 'Скрепление Д0 (комплект)', unit: 'комп.', price: 850, category: 'railway' },
        'mat_rw_pad_rubber': { name: 'Подкладка резиновая под рельс', unit: 'шт', price: 150, category: 'railway' },
        'mat_rw_pad_metal_kd65': { name: 'Подкладка КД65 металлическая', unit: 'шт', price: 450, category: 'railway' },
        'mat_rw_bolt_clamp_m22': { name: 'Болт клеммный М22×175', unit: 'шт', price: 120, category: 'railway' },
        'mat_rw_bolt_rail_m24': { name: 'Болт путевой М24×150', unit: 'шт', price: 150, category: 'railway' },
        'mat_rw_bolt_rail_m27': { name: 'Болт путевой М27×160', unit: 'шт', price: 180, category: 'railway' },
        'mat_rw_spike_do': { name: 'Костыль путевой ДО', unit: 'шт', price: 65, category: 'railway' },
        'mat_rw_nut_m22': { name: 'Гайка путевая М22', unit: 'шт', price: 35, category: 'railway' },
        'mat_rw_nut_m24': { name: 'Гайка путевая М24', unit: 'шт', price: 40, category: 'railway' },
        'mat_rw_washer_spring': { name: 'Шайба пружинная путевая М22', unit: 'шт', price: 25, category: 'railway' },
        // === СТРЕЛОЧНЫЕ ПЕРЕВОДЫ ===
        'mat_rw_switch_r65_1_9': { name: 'Стрелочный перевод Р65 1/9', unit: 'комп.', price: 1200000, category: 'railway' },
        'mat_rw_switch_r65_1_11': { name: 'Стрелочный перевод Р65 1/11', unit: 'комп.', price: 1500000, category: 'railway' },
        'mat_rw_switch_r50_1_9': { name: 'Стрелочный перевод Р50 1/9', unit: 'комп.', price: 950000, category: 'railway' },
        'mat_rw_switch_crossover': { name: 'Глухое пересечение Р65', unit: 'шт', price: 650000, category: 'railway' },
        'mat_rw_switch_mechanism': { name: 'Электропривод стрелочный СП-6М', unit: 'шт', price: 280000, category: 'railway' },
        // === БАЛЛАСТ ===
        'mat_rw_ballast_crushed': { name: 'Щебень балластный фр. 25-60', unit: 'м³', price: 5500, category: 'railway' },
        'mat_rw_ballast_sand': { name: 'Песок для подбалластного слоя', unit: 'м³', price: 2000, category: 'railway' },
        'mat_rw_geotextile': { name: 'Геотекстиль разделительный 300г/м²', unit: 'м²', price: 120, category: 'railway' },
        // === КОНТАКТНАЯ СЕТЬ ===
        'mat_rw_contact_wire_mf85': { name: 'Провод контактный МФ-85', unit: 'м.п.', price: 1200, category: 'railway' },
        'mat_rw_contact_wire_mf100': { name: 'Провод контактный МФ-100', unit: 'м.п.', price: 1400, category: 'railway' },
        'mat_rw_catenary_m120': { name: 'Трос несущий М-120', unit: 'м.п.', price: 450, category: 'railway' },
        'mat_rw_catenary_mbgt95': { name: 'Трос несущий МБГТ-95', unit: 'м.п.', price: 550, category: 'railway' },
        'mat_rw_ct_pole_metal': { name: 'Опора контактной сети метал. 12м', unit: 'шт', price: 280000, category: 'railway' },
        'mat_rw_ct_pole_concrete': { name: 'Опора контактной сети ж/б', unit: 'шт', price: 85000, category: 'railway' },
        'mat_rw_ct_bracket': { name: 'Консоль контактной сети', unit: 'шт', price: 45000, category: 'railway' },
        'mat_rw_ct_insulator_sus': { name: 'Изолятор подвесной для КС', unit: 'шт', price: 5500, category: 'railway' },
        // === СИГНАЛИЗАЦИЯ И СВЯЗЬ ===
        'mat_rw_signal_light_2': { name: 'Светофор двухзначный', unit: 'шт', price: 120000, category: 'railway' },
        'mat_rw_signal_light_3': { name: 'Светофор трёхзначный', unit: 'шт', price: 165000, category: 'railway' },
        'mat_rw_signal_light_5': { name: 'Светофор пятизначный', unit: 'шт', price: 220000, category: 'railway' },
        'mat_rw_signal_mast': { name: 'Мачта светофорная 8м', unit: 'шт', price: 45000, category: 'railway' },
        'mat_rw_track_circuit_relay': { name: 'Реле путевое ДСШ-16', unit: 'шт', price: 85000, category: 'railway' },
        'mat_rw_junction_box': { name: 'Кабельная муфта путевая', unit: 'шт', price: 12000, category: 'railway' },
        'mat_rw_cable_tppp_10': { name: 'Кабель связи ТППБ 10×2×0.5', unit: 'м.п.', price: 250, category: 'railway' },
        'mat_rw_cable_tppp_30': { name: 'Кабель связи ТППБ 30×2×0.5', unit: 'м.п.', price: 550, category: 'railway' },
        // === ПЕРЕЕЗДЫ ===
        'mat_rw_crossing_rubber': { name: 'Настил переездный резиновый (1м)', unit: 'м.п.', price: 85000, category: 'railway' },
        'mat_rw_crossing_concrete': { name: 'Плита переездная ж/б', unit: 'шт', price: 25000, category: 'railway' },
        'mat_rw_barrier_auto': { name: 'Шлагбаум автоматический', unit: 'шт', price: 650000, category: 'railway' },
        'mat_rw_barrier_manual': { name: 'Шлагбаум ручной', unit: 'шт', price: 120000, category: 'railway' },
        // === ПУТЕВЫЕ ЗНАКИ ===
        'mat_rw_sign_km': { name: 'Километровый столбик', unit: 'шт', price: 8500, category: 'railway' },
        'mat_rw_sign_pk': { name: 'Пикетный столбик', unit: 'шт', price: 4500, category: 'railway' },
        'mat_rw_sign_gradient': { name: 'Знак уклоноуказательный', unit: 'шт', price: 5500, category: 'railway' },
        'mat_rw_sign_whistle': { name: 'Знак "С" (свисток)', unit: 'шт', price: 3500, category: 'railway' },
        'mat_rw_sign_speed': { name: 'Знак ограничения скорости', unit: 'шт', price: 6500, category: 'railway' },
        // === ВОДООТВЕДЕНИЕ ===
        'mat_rw_culvert_d500': { name: 'Труба водопропускная Ø500 ж/б', unit: 'м.п.', price: 18000, category: 'railway' },
        'mat_rw_culvert_d1000': { name: 'Труба водопропускная Ø1000 ж/б', unit: 'м.п.', price: 35000, category: 'railway' },
        'mat_rw_drain_channel': { name: 'Лоток водоотводный ж/б', unit: 'м.п.', price: 5500, category: 'railway' }
    };
})();
