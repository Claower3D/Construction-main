// === ФАЗА 3: РЕСТАВРАЦИЯ, РЕМОНТ ФАСАДОВ, УСИЛЕНИЕ КОНСТРУКЦИЙ, ВЫСОТНЫЕ РАБОТЫ (130 поз.) ===
(function () {
    window.AI_WRK_RESTORATION = {
        // === РЕСТАВРАЦИЯ ===
        'wrk_rest_facade_clean_mech': { name: 'Очистка фасада (механическая)', unit: 'м²', price: 50, category: 'restoration' },
        'wrk_rest_facade_clean_hydro': { name: 'Очистка фасада (гидроструйная)', unit: 'м²', price: 40, category: 'restoration' },
        'wrk_rest_facade_clean_sandblast': { name: 'Пескоструйная очистка фасада', unit: 'м²', price: 60, category: 'restoration' },
        'wrk_rest_facade_clean_chemical': { name: 'Химическая очистка фасада', unit: 'м²', price: 50, category: 'restoration' },
        'wrk_rest_facade_patch': { name: 'Ремонтная штукатурка фасада', unit: 'м²', price: 100, category: 'restoration' },
        'wrk_rest_facade_paint': { name: 'Окраска фасада (реставрация)', unit: 'м²', price: 40, category: 'restoration' },
        'wrk_rest_brick_repoint': { name: 'Расшивка швов кладки', unit: 'м²', price: 80, category: 'restoration' },
        'wrk_rest_brick_replace': { name: 'Замена повреждённого кирпича', unit: 'шт', price: 50, category: 'restoration' },
        'wrk_rest_brick_hydrophob': { name: 'Гидрофобизация кладки', unit: 'м²', price: 30, category: 'restoration' },
        'wrk_rest_stone_repair': { name: 'Реставрация камня', unit: 'м²', price: 200, category: 'restoration' },
        'wrk_rest_stucco_deco': { name: 'Восстановление лепнины', unit: 'элемент', price: 500, category: 'restoration' },
        'wrk_rest_stucco_form': { name: 'Изготовление формы для лепнины', unit: 'шт', price: 2000, category: 'restoration' },
        'wrk_rest_stucco_cast': { name: 'Отливка лепн. элемента', unit: 'шт', price: 500, category: 'restoration' },
        'wrk_rest_gilding': { name: 'Золочение (реставрация)', unit: 'м²', price: 5000, category: 'restoration' },
        'wrk_rest_wood_window': { name: 'Реставрация деревянного окна', unit: 'шт', price: 2000, category: 'restoration' },
        'wrk_rest_wood_door': { name: 'Реставрация деревянной двери', unit: 'шт', price: 3000, category: 'restoration' },
        'wrk_rest_cast_iron': { name: 'Реставрация чугунного литья', unit: 'элемент', price: 1000, category: 'restoration' },

        // === УСИЛЕНИЕ КОНСТРУКЦИЙ ===
        'wrk_str_reinf_carbon_strip': { name: 'Усиление углеволокном (ленты)', unit: 'м.п.', price: 500, category: 'restoration' },
        'wrk_str_reinf_carbon_sheet': { name: 'Усиление углеволокном (холст)', unit: 'м²', price: 800, category: 'restoration' },
        'wrk_str_reinf_steel_plate': { name: 'Усиление стальной обоймой', unit: 'м.п.', price: 300, category: 'restoration' },
        'wrk_str_reinf_concrete_jacket': { name: 'Ж/б рубашка (усиление колонны)', unit: 'м.п.', price: 1000, category: 'restoration' },
        'wrk_str_reinf_beam_steel': { name: 'Усиление балки (стальные пластины)', unit: 'м.п.', price: 500, category: 'restoration' },
        'wrk_str_reinf_foundation': { name: 'Усиление фундамента (подливка)', unit: 'м.п.', price: 1000, category: 'restoration' },
        'wrk_str_reinf_underpin': { name: 'Подведение фундамента (underpinning)', unit: 'м.п.', price: 2000, category: 'restoration' },
        'wrk_str_reinf_micropile': { name: 'Микросвая (усиление фундамента)', unit: 'шт', price: 5000, category: 'restoration' },
        'wrk_str_reinf_crack_stitch': { name: 'Скрепление трещин (скобы)', unit: 'шт', price: 200, category: 'restoration' },
        'wrk_str_reinf_wall_tie': { name: 'Анкеровка стен (стяжки)', unit: 'шт', price: 300, category: 'restoration' },
        'wrk_str_reinf_slab_opening': { name: 'Вырез проёма в плите перекрытия', unit: 'м²', price: 1000, category: 'restoration' },
        'wrk_str_reinf_slab_close': { name: 'Заделка проёма в плите', unit: 'м²', price: 800, category: 'restoration' },
        'wrk_str_reinf_lintel': { name: 'Усиление перемычки', unit: 'шт', price: 500, category: 'restoration' },

        // === ВЫСОТНЫЕ И ПРОМЫШЛЕННЫЙ АЛЬПИНИЗМ ===
        'wrk_alp_facade_paint': { name: 'Покраска фасада (альпинизм)', unit: 'м²', price: 80, category: 'restoration' },
        'wrk_alp_facade_repair': { name: 'Ремонт фасада (альпинизм)', unit: 'м²', price: 150, category: 'restoration' },
        'wrk_alp_window_seal': { name: 'Герметизация окон (альпинизм)', unit: 'м.п.', price: 50, category: 'restoration' },
        'wrk_alp_insulation': { name: 'Утепление фасада (альпинизм)', unit: 'м²', price: 200, category: 'restoration' },
        'wrk_alp_ice_removal': { name: 'Удаление наледных образований', unit: 'м.п.', price: 80, category: 'restoration' },
        'wrk_alp_antenna': { name: 'Монтаж антенны (альпинизм)', unit: 'шт', price: 3000, category: 'restoration' },
        'wrk_alp_banner': { name: 'Монтаж баннера (альпинизм)', unit: 'м²', price: 100, category: 'restoration' },
        'wrk_alp_lighting': { name: 'Монтаж подсветки (альпинизм)', unit: 'м.п.', price: 100, category: 'restoration' },
        'wrk_alp_roof_repair': { name: 'Ремонт кровли (альпинизм)', unit: 'м²', price: 200, category: 'restoration' },
        'wrk_alp_gutter': { name: 'Монтаж водостока (альпинизм)', unit: 'м.п.', price: 100, category: 'restoration' },

        // === ОБСЛЕДОВАНИЕ ЗДАНИЙ ===
        'wrk_surv_visual': { name: 'Визуальное обследование', unit: 'объект', price: 5000, category: 'restoration' },
        'wrk_surv_full': { name: 'Техническое обследование (полное)', unit: 'объект', price: 30000, category: 'restoration' },
        'wrk_surv_foundation': { name: 'Обследование фундамента', unit: 'объект', price: 10000, category: 'restoration' },
        'wrk_surv_concrete_test': { name: 'Испытание прочности бетона', unit: 'точка', price: 200, category: 'restoration' },
        'wrk_surv_rebar_scan': { name: 'Поиск арматуры (ферроскан)', unit: 'м²', price: 100, category: 'restoration' },
        'wrk_surv_core_drill': { name: 'Отбор керна (бетон)', unit: 'шт', price: 500, category: 'restoration' },
        'wrk_surv_crack_monitor': { name: 'Мониторинг трещин (маяки)', unit: 'точка', price: 100, category: 'restoration' },
        'wrk_surv_tilt_measure': { name: 'Измерение кренов/прогибов', unit: 'элемент', price: 200, category: 'restoration' },
        'wrk_surv_carbonation': { name: 'Определение карбонизации бетона', unit: 'точка', price: 300, category: 'restoration' }
    };
})();
