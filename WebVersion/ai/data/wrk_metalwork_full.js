// === ФАЗА 3: МЕТАЛЛОКОНСТРУКЦИИ, СВАРКА, КОВКА, РЕШЁТКИ, НАВЕСЫ, КАРКАСЫ (140 поз.) ===
(function () {
    window.AI_WRK_METALWORK_FULL = {
        // === СТАЛЬНЫЕ КАРКАСЫ ===
        'wrk_mtl_frame_column': { name: 'Стальная колонна (монтаж)', unit: 'тонна', price: 5000, category: 'metalwork_full' },
        'wrk_mtl_frame_beam': { name: 'Стальная балка (монтаж)', unit: 'тонна', price: 5000, category: 'metalwork_full' },
        'wrk_mtl_frame_truss': { name: 'Стальная ферма (монтаж)', unit: 'тонна', price: 6000, category: 'metalwork_full' },
        'wrk_mtl_frame_purlin': { name: 'Прогоны (монтаж)', unit: 'тонна', price: 4000, category: 'metalwork_full' },
        'wrk_mtl_frame_brace': { name: 'Связи (монтаж)', unit: 'тонна', price: 4000, category: 'metalwork_full' },
        'wrk_mtl_frame_floor_deck': { name: 'Профнастил несущий (перекрытие)', unit: 'м²', price: 100, category: 'metalwork_full' },
        'wrk_mtl_frame_stud': { name: 'Стенолейк (фахверковые стойки)', unit: 'тонна', price: 4000, category: 'metalwork_full' },
        'wrk_mtl_frame_anchor': { name: 'Закладные детали', unit: 'шт', price: 100, category: 'metalwork_full' },
        'wrk_mtl_frame_anchor_bolt': { name: 'Анкерный болт (фундаментный)', unit: 'шт', price: 50, category: 'metalwork_full' },

        // === СВАРОЧНЫЕ РАБОТЫ ===
        'wrk_mtl_weld_butt_3': { name: 'Сварка стыковая до 3мм', unit: 'м.п.', price: 30, category: 'metalwork_full' },
        'wrk_mtl_weld_butt_5': { name: 'Сварка стыковая 3-5мм', unit: 'м.п.', price: 50, category: 'metalwork_full' },
        'wrk_mtl_weld_butt_8': { name: 'Сварка стыковая 5-8мм', unit: 'м.п.', price: 80, category: 'metalwork_full' },
        'wrk_mtl_weld_butt_12': { name: 'Сварка стыковая 8-12мм', unit: 'м.п.', price: 100, category: 'metalwork_full' },
        'wrk_mtl_weld_fillet_3': { name: 'Сварка угловая до 3мм', unit: 'м.п.', price: 25, category: 'metalwork_full' },
        'wrk_mtl_weld_fillet_5': { name: 'Сварка угловая 3-5мм', unit: 'м.п.', price: 40, category: 'metalwork_full' },
        'wrk_mtl_weld_fillet_8': { name: 'Сварка угловая 5-8мм', unit: 'м.п.', price: 60, category: 'metalwork_full' },
        'wrk_mtl_weld_argon_ss': { name: 'Аргонная сварка нержавейки', unit: 'м.п.', price: 150, category: 'metalwork_full' },
        'wrk_mtl_weld_argon_alu': { name: 'Аргонная сварка алюминия', unit: 'м.п.', price: 200, category: 'metalwork_full' },
        'wrk_mtl_weld_semi_auto': { name: 'Полуавтоматическая сварка', unit: 'м.п.', price: 40, category: 'metalwork_full' },

        // === АНТИКОРРОЗИЙНАЯ ОБРАБОТКА ===
        'wrk_mtl_prime_1': { name: 'Грунтовка металла 1 слой', unit: 'м²', price: 10, category: 'metalwork_full' },
        'wrk_mtl_prime_2': { name: 'Грунтовка металла 2 слоя', unit: 'м²', price: 18, category: 'metalwork_full' },
        'wrk_mtl_sandblast_sa2': { name: 'Пескоструйная очистка Sa2', unit: 'м²', price: 30, category: 'metalwork_full' },
        'wrk_mtl_sandblast_sa25': { name: 'Пескоструйная очистка Sa2.5', unit: 'м²', price: 40, category: 'metalwork_full' },

        // === РЕШЁТКИ / ОГРАЖДЕНИЯ ===
        'wrk_mtl_grille_window': { name: 'Решётка оконная (сварная)', unit: 'м²', price: 500, category: 'metalwork_full' },
        'wrk_mtl_grille_window_art': { name: 'Решётка оконная (художественная)', unit: 'м²', price: 1000, category: 'metalwork_full' },
        'wrk_mtl_grille_vent': { name: 'Решётка вентиляционная (металл)', unit: 'шт', price: 200, category: 'metalwork_full' },
        'wrk_mtl_railing_stair': { name: 'Ограждение лестничное (сварное)', unit: 'м.п.', price: 500, category: 'metalwork_full' },
        'wrk_mtl_railing_balcony': { name: 'Ограждение балконное (сварное)', unit: 'м.п.', price: 500, category: 'metalwork_full' },
        'wrk_mtl_railing_ss_glass': { name: 'Ограждение нерж. + стекло', unit: 'м.п.', price: 2000, category: 'metalwork_full' },

        // === ЛЕСТНИЦЫ МЕТАЛЛИЧЕСКИЕ ===
        'wrk_mtl_stair_frame_straight': { name: 'Каркас лестницы прямой', unit: 'марш', price: 8000, category: 'metalwork_full' },
        'wrk_mtl_stair_frame_l': { name: 'Каркас лестницы Г-образный', unit: 'марш', price: 10000, category: 'metalwork_full' },
        'wrk_mtl_stair_frame_u': { name: 'Каркас лестницы П-образный', unit: 'марш', price: 12000, category: 'metalwork_full' },
        'wrk_mtl_stair_frame_spiral': { name: 'Каркас лестницы винтовой', unit: 'шт', price: 20000, category: 'metalwork_full' },
        'wrk_mtl_stair_kosour_1': { name: 'Лестница на монокосоуре', unit: 'шт', price: 15000, category: 'metalwork_full' },
        'wrk_mtl_stair_kosour_2': { name: 'Лестница на двух косоурах', unit: 'шт', price: 12000, category: 'metalwork_full' },
        'wrk_mtl_stair_fire_ext': { name: 'Пожарная лестница наружная', unit: 'м.п.', price: 2000, category: 'metalwork_full' },
        'wrk_mtl_stair_serv_vert': { name: 'Вертикальная лестница (служебная)', unit: 'м.п.', price: 500, category: 'metalwork_full' },
        'wrk_mtl_stair_serv_cage': { name: 'Лестница с ограждением (клетка)', unit: 'м.п.', price: 800, category: 'metalwork_full' },

        // === ЗАКЛАДНЫЕ / ПЛИТЫ / ОБВЯЗКА ===
        'wrk_mtl_embed_plate': { name: 'Закладная пластина (установка)', unit: 'шт', price: 50, category: 'metalwork_full' },
        'wrk_mtl_base_plate': { name: 'Базовая пластина колонны', unit: 'шт', price: 200, category: 'metalwork_full' },
        'wrk_mtl_gusset': { name: 'Косынка (фасонка)', unit: 'шт', price: 30, category: 'metalwork_full' },
        'wrk_mtl_shear_stud': { name: 'Стад-болт (упор)', unit: 'шт', price: 10, category: 'metalwork_full' },
        'wrk_mtl_high_bolt_m16': { name: 'Болт высокопрочный М16', unit: 'шт', price: 15, category: 'metalwork_full' },
        'wrk_mtl_high_bolt_m20': { name: 'Болт высокопрочный М20', unit: 'шт', price: 20, category: 'metalwork_full' },
        'wrk_mtl_high_bolt_m24': { name: 'Болт высокопрочный М24', unit: 'шт', price: 25, category: 'metalwork_full' },
        'wrk_mtl_chem_anchor_m12': { name: 'Химический анкер М12', unit: 'шт', price: 30, category: 'metalwork_full' },
        'wrk_mtl_chem_anchor_m16': { name: 'Химический анкер М16', unit: 'шт', price: 40, category: 'metalwork_full' },
        'wrk_mtl_chem_anchor_m20': { name: 'Химический анкер М20', unit: 'шт', price: 50, category: 'metalwork_full' },

        // === НАВЕСЫ / КОЗЫРЬКИ ===
        'wrk_mtl_canopy_flat': { name: 'Плоский навес (каркас)', unit: 'м²', price: 300, category: 'metalwork_full' },
        'wrk_mtl_canopy_arch': { name: 'Арочный навес (каркас)', unit: 'м²', price: 400, category: 'metalwork_full' },
        'wrk_mtl_canopy_poly': { name: 'Покрытие поликарбонатом', unit: 'м²', price: 100, category: 'metalwork_full' },
        'wrk_mtl_canopy_profsheet': { name: 'Покрытие профлистом', unit: 'м²', price: 80, category: 'metalwork_full' },
        'wrk_mtl_awning_door': { name: 'Козырёк над входом (каркас)', unit: 'шт', price: 2000, category: 'metalwork_full' },
        'wrk_mtl_carport_1': { name: 'Навес для авто (1 место)', unit: 'шт', price: 10000, category: 'metalwork_full' },
        'wrk_mtl_carport_2': { name: 'Навес для авто (2 места)', unit: 'шт', price: 15000, category: 'metalwork_full' },

        // === ИЗГОТОВЛЕНИЕ МЕТАЛЛОИЗДЕЛИЙ ===
        'wrk_mtl_cut_angle': { name: 'Резка уголка', unit: 'рез', price: 5, category: 'metalwork_full' },
        'wrk_mtl_cut_pipe': { name: 'Резка трубы', unit: 'рез', price: 10, category: 'metalwork_full' },
        'wrk_mtl_cut_plate': { name: 'Резка листа (плазма)', unit: 'м.п.', price: 15, category: 'metalwork_full' },
        'wrk_mtl_bend_plate': { name: 'Гибка листа', unit: 'м.п.', price: 20, category: 'metalwork_full' },
        'wrk_mtl_drill': { name: 'Сверление отверстий (металл)', unit: 'шт', price: 5, category: 'metalwork_full' },
        'wrk_mtl_grind': { name: 'Зачистка/шлифовка металла', unit: 'м²', price: 10, category: 'metalwork_full' }
    };
})();
