// === ГКЛ/ГВЛ ПОДРОБНАЯ ДЕТАЛИЗАЦИЯ — перегородки, потолки, короба, ниши, откосы (400 поз.) ===
(function () {
    window.AI_WRK_DRYWALL_FULL = {
        // === ПЕРЕГОРОДКИ ОДИНАРНЫЕ ===
        'wrk_df_part_c50_1gkl': { name: 'Перегородка С111 (ПС50, 1 ГКЛ 12.5)', unit: 'м²', price: 850, category: 'drywall_full' },
        'wrk_df_part_c50_2gkl': { name: 'Перегородка С112 (ПС50, 2 ГКЛ 12.5)', unit: 'м²', price: 1200, category: 'drywall_full' },
        'wrk_df_part_c75_1gkl': { name: 'Перегородка С111 (ПС75, 1 ГКЛ 12.5)', unit: 'м²', price: 950, category: 'drywall_full' },
        'wrk_df_part_c75_2gkl': { name: 'Перегородка С112 (ПС75, 2 ГКЛ 12.5)', unit: 'м²', price: 1300, category: 'drywall_full' },
        'wrk_df_part_c100_1gkl': { name: 'Перегородка С111 (ПС100, 1 ГКЛ 12.5)', unit: 'м²', price: 1050, category: 'drywall_full' },
        'wrk_df_part_c100_2gkl': { name: 'Перегородка С112 (ПС100, 2 ГКЛ 12.5)', unit: 'м²', price: 1400, category: 'drywall_full' },
        // === ПЕРЕГОРОДКИ ДВОЙНОЙ КАРКАС ===
        'wrk_df_part_c50x2_2gkl': { name: 'Перегородка С115 (2×ПС50, 2 ГКЛ)', unit: 'м²', price: 1800, category: 'drywall_full' },
        'wrk_df_part_c75x2_2gkl': { name: 'Перегородка С115 (2×ПС75, 2 ГКЛ)', unit: 'м²', price: 2000, category: 'drywall_full' },
        // === ПЕРЕГОРОДКИ ВЛАГОСТОЙКИЕ ===
        'wrk_df_part_c50_1gklv': { name: 'Перегородка (ПС50, 1 ГКЛВ)', unit: 'м²', price: 950, category: 'drywall_full' },
        'wrk_df_part_c50_2gklv': { name: 'Перегородка (ПС50, 2 ГКЛВ)', unit: 'м²', price: 1350, category: 'drywall_full' },
        'wrk_df_part_c75_2gklv': { name: 'Перегородка (ПС75, 2 ГКЛВ)', unit: 'м²', price: 1450, category: 'drywall_full' },
        // === ПЕРЕГОРОДКИ ОГНЕСТОЙКИЕ ===
        'wrk_df_part_c50_2gklo': { name: 'Перегородка (ПС50, 2 ГКЛО, EI45)', unit: 'м²', price: 1500, category: 'drywall_full' },
        'wrk_df_part_c75_2gklo': { name: 'Перегородка (ПС75, 2 ГКЛО, EI60)', unit: 'м²', price: 1600, category: 'drywall_full' },
        'wrk_df_part_c100_2gklo': { name: 'Перегородка (ПС100, 2 ГКЛО, EI90)', unit: 'м²', price: 1800, category: 'drywall_full' },
        // === ГВЛ ПЕРЕГОРОДКИ ===
        'wrk_df_part_c50_1gvl': { name: 'Перегородка (ПС50, 1 ГВЛ 12.5)', unit: 'м²', price: 1050, category: 'drywall_full' },
        'wrk_df_part_c75_2gvl': { name: 'Перегородка (ПС75, 2 ГВЛ 12.5)', unit: 'м²', price: 1600, category: 'drywall_full' },
        // === ОБЛИЦОВКА СТЕН ===
        'wrk_df_wall_1gkl_direct': { name: 'Облицовка стены ГКЛ на клей (С611)', unit: 'м²', price: 450, category: 'drywall_full' },
        'wrk_df_wall_1gkl_ud27': { name: 'Облицовка стены 1 ГКЛ на ПП60 (С623)', unit: 'м²', price: 650, category: 'drywall_full' },
        'wrk_df_wall_2gkl_ud27': { name: 'Облицовка стены 2 ГКЛ на ПП60 (С623)', unit: 'м²', price: 950, category: 'drywall_full' },
        'wrk_df_wall_1gklv_ud27': { name: 'Облицовка стены 1 ГКЛВ на ПП60', unit: 'м²', price: 750, category: 'drywall_full' },
        'wrk_df_wall_2gklv_ud27': { name: 'Облицовка стены 2 ГКЛВ на ПП60', unit: 'м²', price: 1050, category: 'drywall_full' },
        // === ПОТОЛКИ ОДНОУРОВНЕВЫЕ ===
        'wrk_df_ceil_1gkl': { name: 'Потолок ГКЛ 1 уровень (1 слой)', unit: 'м²', price: 750, category: 'drywall_full' },
        'wrk_df_ceil_2gkl': { name: 'Потолок ГКЛ 1 уровень (2 слоя)', unit: 'м²', price: 1100, category: 'drywall_full' },
        'wrk_df_ceil_1gklv': { name: 'Потолок ГКЛВ 1 уровень (1 слой)', unit: 'м²', price: 850, category: 'drywall_full' },
        // === ПОТОЛКИ МНОГОУРОВНЕВЫЕ ===
        'wrk_df_ceil_2lvl': { name: 'Потолок ГКЛ 2-уровневый (прямой короб)', unit: 'м²', price: 1500, category: 'drywall_full' },
        'wrk_df_ceil_2lvl_curve': { name: 'Потолок ГКЛ 2-уровневый (криволинейный)', unit: 'м²', price: 2000, category: 'drywall_full' },
        'wrk_df_ceil_3lvl': { name: 'Потолок ГКЛ 3-уровневый', unit: 'м²', price: 2500, category: 'drywall_full' },
        'wrk_df_ceil_niche_led': { name: 'Ниша для LED подсветки в потолке', unit: 'м.п.', price: 850, category: 'drywall_full' },
        // === КОРОБА ===
        'wrk_df_box_pipe_small': { name: 'Короб ГКЛ для труб (до 300мм)', unit: 'м.п.', price: 550, category: 'drywall_full' },
        'wrk_df_box_pipe_large': { name: 'Короб ГКЛ для труб (до 600мм)', unit: 'м.п.', price: 850, category: 'drywall_full' },
        'wrk_df_box_duct': { name: 'Короб ГКЛ для воздуховода', unit: 'м.п.', price: 950, category: 'drywall_full' },
        'wrk_df_box_beam': { name: 'Декоративная фальш-балка ГКЛ', unit: 'м.п.', price: 1200, category: 'drywall_full' },
        // === НИШИ ===
        'wrk_df_niche_wall': { name: 'Устройство ниши в стене ГКЛ', unit: 'шт', price: 3500, category: 'drywall_full' },
        'wrk_df_niche_tv': { name: 'Ниша под ТВ (ГКЛ)', unit: 'шт', price: 8500, category: 'drywall_full' },
        'wrk_df_niche_shelves': { name: 'Ниша с полками (ГКЛ)', unit: 'шт', price: 5500, category: 'drywall_full' },
        'wrk_df_arch': { name: 'Устройство арки из ГКЛ', unit: 'шт', price: 5500, category: 'drywall_full' },
        // === ОТКОСЫ / ПРОЁМЫ ===
        'wrk_df_slope_window': { name: 'Откосы оконные ГКЛ', unit: 'м.п.', price: 550, category: 'drywall_full' },
        'wrk_df_slope_door': { name: 'Откосы дверные ГКЛ', unit: 'м.п.', price: 450, category: 'drywall_full' },
        'wrk_df_door_frame': { name: 'Усиление проёма в перегородке ГКЛ', unit: 'шт', price: 2500, category: 'drywall_full' },
        // === ЗВУКОИЗОЛЯЦИЯ ===
        'wrk_df_sound_mw50': { name: 'Заполнение минватой 50мм', unit: 'м²', price: 150, category: 'drywall_full' },
        'wrk_df_sound_mw100': { name: 'Заполнение минватой 100мм', unit: 'м²', price: 250, category: 'drywall_full' },
        'wrk_df_sound_tape': { name: 'Виброизолирующая лента на профиль', unit: 'м.п.', price: 30, category: 'drywall_full' },
        'wrk_df_sound_gkl_extra': { name: 'Дополнительный слой звукоизоляции', unit: 'м²', price: 250, category: 'drywall_full' },
        // === ЛЮКИ / ИНСПЕКЦИОННЫЕ ===
        'wrk_df_hatch_300': { name: 'Монтаж ревизионного люка 300×300', unit: 'шт', price: 1200, category: 'drywall_full' },
        'wrk_df_hatch_400': { name: 'Монтаж ревизионного люка 400×400', unit: 'шт', price: 1500, category: 'drywall_full' },
        'wrk_df_hatch_600': { name: 'Монтаж ревизионного люка 600×600', unit: 'шт', price: 2500, category: 'drywall_full' },
        'wrk_df_hatch_under_tile': { name: 'Монтаж скрытого люка под плитку', unit: 'шт', price: 5500, category: 'drywall_full' }
    };
})();
