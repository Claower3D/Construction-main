// === ФАЗА 3: ГКЛ СИСТЕМЫ — ВСЕ ТИПЫ ПЕРЕГОРОДОК, ПОТОЛКОВ, ОБШИВОК, ПРОФИЛЕЙ (140 поз.) ===
(function () {
    window.AI_WRK_GKL_FULL = {
        // === ГКЛ ПЕРЕГОРОДКИ (по типу) ===
        'wrk_gkl_c111_75': { name: 'Перегородка С111 75мм (1 лист)', unit: 'м²', price: 150, category: 'gkl_full' },
        'wrk_gkl_c111_100': { name: 'Перегородка С111 100мм (1 лист)', unit: 'м²', price: 170, category: 'gkl_full' },
        'wrk_gkl_c112_75': { name: 'Перегородка С112 75мм (2 листа)', unit: 'м²', price: 200, category: 'gkl_full' },
        'wrk_gkl_c112_100': { name: 'Перегородка С112 100мм (2 листа)', unit: 'м²', price: 220, category: 'gkl_full' },
        'wrk_gkl_c112_125': { name: 'Перегородка С112 125мм (2 листа)', unit: 'м²', price: 250, category: 'gkl_full' },
        'wrk_gkl_c112_150': { name: 'Перегородка С112 150мм (2 листа)', unit: 'м²', price: 280, category: 'gkl_full' },
        'wrk_gkl_c113': { name: 'Перегородка С113 (3 листа)', unit: 'м²', price: 350, category: 'gkl_full' },
        'wrk_gkl_c115': { name: 'Перегородка С115 (двойной каркас)', unit: 'м²', price: 400, category: 'gkl_full' },
        'wrk_gkl_c116': { name: 'Перегородка С116 (двойной + утепл.)', unit: 'м²', price: 450, category: 'gkl_full' },

        // === ТИПЫ ГКЛ ===
        'wrk_gkl_std_9_5': { name: 'ГКЛ стандартный 9.5мм', unit: 'м²', price: 50, category: 'gkl_full' },
        'wrk_gkl_std_12_5': { name: 'ГКЛ стандартный 12.5мм', unit: 'м²', price: 55, category: 'gkl_full' },
        'wrk_gkl_moisture_9_5': { name: 'ГКЛВ влагостойкий 9.5мм', unit: 'м²', price: 65, category: 'gkl_full' },
        'wrk_gkl_moisture_12_5': { name: 'ГКЛВ влагостойкий 12.5мм', unit: 'м²', price: 70, category: 'gkl_full' },
        'wrk_gkl_fire_12_5': { name: 'ГКЛО огнестойкий 12.5мм', unit: 'м²', price: 80, category: 'gkl_full' },
        'wrk_gkl_fire_moist_12_5': { name: 'ГКЛВО огнестойкий влагостойкий', unit: 'м²', price: 90, category: 'gkl_full' },
        'wrk_gkl_acoustic': { name: 'ГКЛ акустический (Silentboard)', unit: 'м²', price: 200, category: 'gkl_full' },
        'wrk_gkl_impact': { name: 'ГКЛ ударопрочный', unit: 'м²', price: 120, category: 'gkl_full' },
        'wrk_gkl_gvl_10': { name: 'ГВЛ 10мм', unit: 'м²', price: 80, category: 'gkl_full' },
        'wrk_gkl_gvl_12_5': { name: 'ГВЛ 12.5мм', unit: 'м²', price: 90, category: 'gkl_full' },
        'wrk_gkl_aquapanel': { name: 'Аквапанель (цементная плита)', unit: 'м²', price: 150, category: 'gkl_full' },

        // === ОБШИВКА СТЕН ===
        'wrk_gkl_wall_1layer': { name: 'Обшивка стены ГКЛ 1 слой', unit: 'м²', price: 80, category: 'gkl_full' },
        'wrk_gkl_wall_2layer': { name: 'Обшивка стены ГКЛ 2 слоя', unit: 'м²', price: 120, category: 'gkl_full' },
        'wrk_gkl_wall_glue': { name: 'ГКЛ на клей (Perlix)', unit: 'м²', price: 80, category: 'gkl_full' },
        'wrk_gkl_wall_cd_direct': { name: 'Обшивка ГКЛ на прямой подвес', unit: 'м²', price: 100, category: 'gkl_full' },

        // === ПОТОЛКИ ====
        'wrk_gkl_ceil_1layer': { name: 'Потолок ГКЛ 1 слой', unit: 'м²', price: 120, category: 'gkl_full' },
        'wrk_gkl_ceil_2layer': { name: 'Потолок ГКЛ 2 слоя', unit: 'м²', price: 160, category: 'gkl_full' },
        'wrk_gkl_ceil_fire': { name: 'Потолок ГКЛО (огнестойкий)', unit: 'м²', price: 180, category: 'gkl_full' },
        'wrk_gkl_ceil_box': { name: 'Короб из ГКЛ (потолок)', unit: 'м.п.', price: 100, category: 'gkl_full' },
        'wrk_gkl_ceil_niche': { name: 'Ниша с подсветкой (ГКЛ)', unit: 'м.п.', price: 150, category: 'gkl_full' },
        'wrk_gkl_ceil_multi_2': { name: 'Двухуровневый потолок ГКЛ', unit: 'м²', price: 250, category: 'gkl_full' },
        'wrk_gkl_ceil_multi_3': { name: 'Трёхуровневый потолок ГКЛ', unit: 'м²', price: 350, category: 'gkl_full' },
        'wrk_gkl_ceil_curved': { name: 'Криволинейный элемент (ГКЛ)', unit: 'м.п.', price: 200, category: 'gkl_full' },

        // === ПРОФИЛИ ===
        'wrk_gkl_prof_ud27': { name: 'Профиль UD 27×28мм', unit: 'м.п.', price: 5, category: 'gkl_full' },
        'wrk_gkl_prof_cd60': { name: 'Профиль CD 60×27мм', unit: 'м.п.', price: 6, category: 'gkl_full' },
        'wrk_gkl_prof_uw_50': { name: 'Профиль UW 50×40мм', unit: 'м.п.', price: 6, category: 'gkl_full' },
        'wrk_gkl_prof_uw_75': { name: 'Профиль UW 75×40мм', unit: 'м.п.', price: 7, category: 'gkl_full' },
        'wrk_gkl_prof_uw_100': { name: 'Профиль UW 100×40мм', unit: 'м.п.', price: 8, category: 'gkl_full' },
        'wrk_gkl_prof_cw_50': { name: 'Профиль CW 50×50мм', unit: 'м.п.', price: 7, category: 'gkl_full' },
        'wrk_gkl_prof_cw_75': { name: 'Профиль CW 75×50мм', unit: 'м.п.', price: 8, category: 'gkl_full' },
        'wrk_gkl_prof_cw_100': { name: 'Профиль CW 100×50мм', unit: 'м.п.', price: 9, category: 'gkl_full' },
        'wrk_gkl_hanger_direct': { name: 'Прямой подвес', unit: 'шт', price: 2, category: 'gkl_full' },
        'wrk_gkl_hanger_spring': { name: 'Анкерный подвес (пружинный)', unit: 'шт', price: 5, category: 'gkl_full' },
        'wrk_gkl_hanger_noniuss': { name: 'Подвес Нониус', unit: 'шт', price: 8, category: 'gkl_full' },
        'wrk_gkl_connector_1': { name: 'Соединитель одноуровневый (краб)', unit: 'шт', price: 3, category: 'gkl_full' },
        'wrk_gkl_connector_2': { name: 'Соединитель двухуровневый', unit: 'шт', price: 5, category: 'gkl_full' },
        'wrk_gkl_tape': { name: 'Лента уплотнительная (демпферная)', unit: 'м.п.', price: 2, category: 'gkl_full' },
        'wrk_gkl_tape_paper': { name: 'Бумажная лента для стыков', unit: 'м.п.', price: 1, category: 'gkl_full' },
        'wrk_gkl_tape_serpyanka': { name: 'Серпянка (лента-сетка)', unit: 'м.п.', price: 1, category: 'gkl_full' },

        // === ЗВУКОИЗОЛЯЦИЯ ===
        'wrk_gkl_sound_mw_50': { name: 'Звукоизоляция минвата 50мм', unit: 'м²', price: 30, category: 'gkl_full' },
        'wrk_gkl_sound_mw_100': { name: 'Звукоизоляция минвата 100мм', unit: 'м²', price: 50, category: 'gkl_full' },
        'wrk_gkl_sound_texound': { name: 'Звукоизоляция Tecsound', unit: 'м²', price: 80, category: 'gkl_full' },
        'wrk_gkl_sound_isoplaat': { name: 'Звукоизоляция Isoplaat', unit: 'м²', price: 60, category: 'gkl_full' },
        'wrk_gkl_sound_vibrofix': { name: 'Виброподвес', unit: 'шт', price: 15, category: 'gkl_full' },
        'wrk_gkl_sound_full_floor': { name: 'Звукоизоляция пола (плавающая)', unit: 'м²', price: 100, category: 'gkl_full' },
        'wrk_gkl_sound_full_wall': { name: 'Звукоизоляция стены (каркас)', unit: 'м²', price: 150, category: 'gkl_full' },
        'wrk_gkl_sound_full_ceil': { name: 'Звукоизоляция потолка (каркас)', unit: 'м²', price: 200, category: 'gkl_full' }
    };
})();
