// === ДЕРЕВЯННЫЕ КОНСТРУКЦИИ — каркасные дома, бревно, брус, стропила, полы, обшивка (300 поз.) ===
(function () {
    window.AI_WRK_WOODWORKS = {
        // === КАРКАСНОЕ СТРОИТЕЛЬСТВО ===
        'wrk_wd_frame_wall_150': { name: 'Устройство каркасной стены 150мм', unit: 'м²', price: 1500, category: 'woodworks' },
        'wrk_wd_frame_wall_200': { name: 'Устройство каркасной стены 200мм', unit: 'м²', price: 1800, category: 'woodworks' },
        'wrk_wd_frame_floor': { name: 'Устройство каркасного перекрытия', unit: 'м²', price: 1200, category: 'woodworks' },
        'wrk_wd_frame_membrane': { name: 'Монтаж ветрозащитной мембраны', unit: 'м²', price: 100, category: 'woodworks' },
        // === БРУС ===
        'wrk_wd_beam_100x150': { name: 'Строительство из бруса 100×150мм', unit: 'м²', price: 2200, category: 'woodworks' },
        'wrk_wd_beam_150x150': { name: 'Строительство из бруса 150×150мм', unit: 'м²', price: 2800, category: 'woodworks' },
        'wrk_wd_beam_150x200': { name: 'Строительство из бруса 150×200мм', unit: 'м²', price: 3200, category: 'woodworks' },
        'wrk_wd_beam_200x200': { name: 'Строительство из бруса 200×200мм', unit: 'м²', price: 3800, category: 'woodworks' },
        'wrk_wd_beam_profiled_150': { name: 'Строительство из проф. бруса 150мм', unit: 'м²', price: 3500, category: 'woodworks' },
        'wrk_wd_beam_profiled_200': { name: 'Строительство из проф. бруса 200мм', unit: 'м²', price: 4200, category: 'woodworks' },
        'wrk_wd_beam_glulam_150': { name: 'Строительство из клеёного бруса 150мм', unit: 'м²', price: 5500, category: 'woodworks' },
        'wrk_wd_beam_glulam_200': { name: 'Строительство из клеёного бруса 200мм', unit: 'м²', price: 6500, category: 'woodworks' },
        // === БРЕВНО ===
        'wrk_wd_log_round_200': { name: 'Строительство из оцилиндр. бревна Ø200', unit: 'м²', price: 3500, category: 'woodworks' },
        'wrk_wd_log_round_240': { name: 'Строительство из оцилиндр. бревна Ø240', unit: 'м²', price: 4200, category: 'woodworks' },
        'wrk_wd_log_round_280': { name: 'Строительство из оцилиндр. бревна Ø280', unit: 'м²', price: 5000, category: 'woodworks' },
        'wrk_wd_log_hand': { name: 'Строительство из рубленого бревна', unit: 'м²', price: 5500, category: 'woodworks' },
        // === ПОЛЫ ДЕРЕВЯННЫЕ ===
        'wrk_wd_floor_joist': { name: 'Устройство лаг пола', unit: 'м²', price: 550, category: 'woodworks' },
        'wrk_wd_floor_board_28': { name: 'Настил пола доска 28мм', unit: 'м²', price: 650, category: 'woodworks' },
        'wrk_wd_floor_board_36': { name: 'Настил пола доска 36мм', unit: 'м²', price: 800, category: 'woodworks' },
        'wrk_wd_floor_plywood': { name: 'Настил пола фанера 18мм', unit: 'м²', price: 550, category: 'woodworks' },
        'wrk_wd_floor_osb': { name: 'Настил пола OSB 18мм', unit: 'м²', price: 450, category: 'woodworks' },
        // === ОБШИВКА ДЕРЕВОМ ===
        'wrk_wd_cladding_blockhouse': { name: 'Обшивка блок-хаусом', unit: 'м²', price: 850, category: 'woodworks' },
        'wrk_wd_cladding_imitation': { name: 'Обшивка имитацией бруса', unit: 'м²', price: 750, category: 'woodworks' },
        'wrk_wd_cladding_plank': { name: 'Обшивка планкеном', unit: 'м²', price: 1200, category: 'woodworks' },
        // === ТЕРРАСЫ И ВЕРАНДЫ ===
        'wrk_wd_deck_larch': { name: 'Устройство террасы (лиственница)', unit: 'м²', price: 3500, category: 'woodworks' },
        'wrk_wd_deck_wpc': { name: 'Устройство террасы (ДПК)', unit: 'м²', price: 3200, category: 'woodworks' },
        'wrk_wd_deck_tropical': { name: 'Устройство террасы (тропич. дерево)', unit: 'м²', price: 5500, category: 'woodworks' },
        'wrk_wd_deck_subframe': { name: 'Устройство подконструкции террасы', unit: 'м²', price: 1200, category: 'woodworks' },
        'wrk_wd_railing_wood': { name: 'Установка деревянного ограждения', unit: 'м.п.', price: 3500, category: 'woodworks' },
        // === ЛЕСТНИЦЫ ДЕРЕВЯННЫЕ ===
        'wrk_wd_stair_straight': { name: 'Изготовление деревянной лестницы (прямая)', unit: 'шт', price: 85000, category: 'woodworks' },
        'wrk_wd_stair_turn90': { name: 'Изготовление деревянной лестницы (с поворотом 90°)', unit: 'шт', price: 120000, category: 'woodworks' },
        'wrk_wd_stair_turn180': { name: 'Изготовление деревянной лестницы (с поворотом 180°)', unit: 'шт', price: 150000, category: 'woodworks' },
        'wrk_wd_stair_spiral': { name: 'Изготовление винтовой лестницы', unit: 'шт', price: 180000, category: 'woodworks' },
        // === ОБРАБОТКА ДЕРЕВА ===
        'wrk_wd_treat_fireproof': { name: 'Огнезащитная обработка древесины', unit: 'м²', price: 180, category: 'woodworks' },
        'wrk_wd_treat_stain': { name: 'Морилка + лак (2 слоя)', unit: 'м²', price: 350, category: 'woodworks' },
        'wrk_wd_treat_oil': { name: 'Масло для дерева (2 слоя)', unit: 'м²', price: 250, category: 'woodworks' },
        // === БАНИ И САУНЫ ===
        'wrk_wd_sauna_cabin': { name: 'Устройство кабины сауны', unit: 'м²', price: 8500, category: 'woodworks' },
        'wrk_wd_sauna_shelf': { name: 'Устройство полоков сауны', unit: 'м.п.', price: 5500, category: 'woodworks' },
        'wrk_wd_sauna_heater': { name: 'Установка печи-каменки', unit: 'шт', price: 15000, category: 'woodworks' },
        'wrk_wd_sauna_chimney': { name: 'Устройство дымохода (сэндвич)', unit: 'м.п.', price: 5500, category: 'woodworks' },
        'wrk_wd_sauna_foil_barrier': { name: 'Фольгированная пароизоляция (баня)', unit: 'м²', price: 180, category: 'woodworks' }
    };
})();
