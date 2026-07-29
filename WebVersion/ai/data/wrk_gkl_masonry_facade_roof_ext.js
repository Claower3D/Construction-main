// === ФАЗА 3: РАСШИРЕННЫЕ ГКЛ, КЛАДКА, ФАСАДЫ, КРОВЛЯ (доп. 300 поз.) ===
(function () {
    // === РАСШИРЕННЫЙ ГКЛ ===
    window.AI_WRK_GKL_EXT = {
        // Перегородки (детально)
        'wrk_gkl_part_100_1': { name: 'Перегородка ГКЛ 100мм (1+1 лист)', unit: 'м²', price: 350, category: 'gkl_ext' },
        'wrk_gkl_part_100_2': { name: 'Перегородка ГКЛ 100мм (2+2 листа)', unit: 'м²', price: 500, category: 'gkl_ext' },
        'wrk_gkl_part_125_1': { name: 'Перегородка ГКЛ 125мм (1+1)', unit: 'м²', price: 400, category: 'gkl_ext' },
        'wrk_gkl_part_125_2': { name: 'Перегородка ГКЛ 125мм (2+2)', unit: 'м²', price: 550, category: 'gkl_ext' },
        'wrk_gkl_part_150_1': { name: 'Перегородка ГКЛ 150мм (1+1)', unit: 'м²', price: 450, category: 'gkl_ext' },
        'wrk_gkl_part_150_2': { name: 'Перегородка ГКЛ 150мм (2+2)', unit: 'м²', price: 600, category: 'gkl_ext' },
        'wrk_gkl_part_gklv': { name: 'Перегородка ГКЛВ (влагостойкий)', unit: 'м²', price: 400, category: 'gkl_ext' },
        'wrk_gkl_part_gklo': { name: 'Перегородка ГКЛО (огнестойкий)', unit: 'м²', price: 420, category: 'gkl_ext' },
        'wrk_gkl_part_sound': { name: 'Перегородка звукоизоляционная', unit: 'м²', price: 600, category: 'gkl_ext' },
        'wrk_gkl_part_double_frame': { name: 'Перегородка на двойном каркасе', unit: 'м²', price: 700, category: 'gkl_ext' },
        'wrk_gkl_part_curve': { name: 'Криволинейная перегородка ГКЛ', unit: 'м²', price: 600, category: 'gkl_ext' },
        // Обшивка стен
        'wrk_gkl_wall_1layer': { name: 'Обшивка стены ГКЛ (1 слой)', unit: 'м²', price: 200, category: 'gkl_ext' },
        'wrk_gkl_wall_2layer': { name: 'Обшивка стены ГКЛ (2 слоя)', unit: 'м²', price: 300, category: 'gkl_ext' },
        'wrk_gkl_wall_insul_50': { name: 'Обшивка ГКЛ + утеплитель 50мм', unit: 'м²', price: 300, category: 'gkl_ext' },
        'wrk_gkl_wall_insul_100': { name: 'Обшивка ГКЛ + утеплитель 100мм', unit: 'м²', price: 400, category: 'gkl_ext' },
        'wrk_gkl_wall_sound_50': { name: 'Звукоизоляция стены 50мм + ГКЛ', unit: 'м²', price: 350, category: 'gkl_ext' },
        'wrk_gkl_wall_sound_100': { name: 'Звукоизоляция стены 100мм + ГКЛ', unit: 'м²', price: 450, category: 'gkl_ext' },
        // Короба
        'wrk_gkl_box_pipe': { name: 'Короб ГКЛ (для труб)', unit: 'м.п.', price: 200, category: 'gkl_ext' },
        'wrk_gkl_box_vent': { name: 'Короб ГКЛ (вентиляция)', unit: 'м.п.', price: 200, category: 'gkl_ext' },
        'wrk_gkl_box_beam': { name: 'Короб ГКЛ (балка)', unit: 'м.п.', price: 250, category: 'gkl_ext' },
        'wrk_gkl_box_light': { name: 'Световой короб ГКЛ', unit: 'м.п.', price: 300, category: 'gkl_ext' },
        // Люки, ниши
        'wrk_gkl_access_panel': { name: 'Ревизионный люк (установка)', unit: 'шт', price: 500, category: 'gkl_ext' },
        'wrk_gkl_access_hidden': { name: 'Скрытый люк под плитку', unit: 'шт', price: 1000, category: 'gkl_ext' },
        'wrk_gkl_niche_complex': { name: 'Ниша из ГКЛ (сложная)', unit: 'шт', price: 1500, category: 'gkl_ext' },
        // ГВЛ
        'wrk_gkl_gvl_wall': { name: 'Обшивка ГВЛ (стена)', unit: 'м²', price: 250, category: 'gkl_ext' },
        'wrk_gkl_gvl_floor': { name: 'Обшивка ГВЛ (пол)', unit: 'м²', price: 200, category: 'gkl_ext' },
        'wrk_gkl_aquapanel': { name: 'Обшивка аквапанелью', unit: 'м²', price: 400, category: 'gkl_ext' },
        // Каркас
        'wrk_gkl_frame_cd': { name: 'Каркас из CD-60 профиля', unit: 'м²', price: 100, category: 'gkl_ext' },
        'wrk_gkl_frame_cw': { name: 'Каркас из CW профиля', unit: 'м²', price: 120, category: 'gkl_ext' },
        'wrk_gkl_frame_ua': { name: 'Усиленный профиль UA', unit: 'м.п.', price: 50, category: 'gkl_ext' }
    };

    // === РАСШИРЕННАЯ КЛАДКА ===
    window.AI_WRK_MASONRY_EXT = {
        // Газоблок (детально)
        'wrk_ms_gasblock_100': { name: 'Кладка газоблока 100мм', unit: 'м²', price: 200, category: 'masonry_ext' },
        'wrk_ms_gasblock_150': { name: 'Кладка газоблока 150мм', unit: 'м²', price: 250, category: 'masonry_ext' },
        'wrk_ms_gasblock_200': { name: 'Кладка газоблока 200мм', unit: 'м²', price: 300, category: 'masonry_ext' },
        'wrk_ms_gasblock_250': { name: 'Кладка газоблока 250мм', unit: 'м²', price: 350, category: 'masonry_ext' },
        'wrk_ms_gasblock_300': { name: 'Кладка газоблока 300мм', unit: 'м²', price: 400, category: 'masonry_ext' },
        'wrk_ms_gasblock_375': { name: 'Кладка газоблока 375мм', unit: 'м²', price: 480, category: 'masonry_ext' },
        'wrk_ms_gasblock_400': { name: 'Кладка газоблока 400мм', unit: 'м²', price: 500, category: 'masonry_ext' },
        'wrk_ms_gasblock_500': { name: 'Кладка газоблока 500мм', unit: 'м²', price: 600, category: 'masonry_ext' },
        // Керамзитоблок
        'wrk_ms_keramzit_200': { name: 'Кладка керамзитоблока 200мм', unit: 'м²', price: 250, category: 'masonry_ext' },
        'wrk_ms_keramzit_300': { name: 'Кладка керамзитоблока 300мм', unit: 'м²', price: 350, category: 'masonry_ext' },
        'wrk_ms_keramzit_390': { name: 'Кладка керамзитоблока 390мм', unit: 'м²', price: 400, category: 'masonry_ext' },
        // Пеноблок
        'wrk_ms_foam_200': { name: 'Кладка пеноблока 200мм', unit: 'м²', price: 250, category: 'masonry_ext' },
        'wrk_ms_foam_300': { name: 'Кладка пеноблока 300мм', unit: 'м²', price: 350, category: 'masonry_ext' },
        'wrk_ms_foam_400': { name: 'Кладка пеноблока 400мм', unit: 'м²', price: 450, category: 'masonry_ext' },
        // Керамоблок
        'wrk_ms_ceramblock_380': { name: 'Кладка керамоблока 380мм', unit: 'м²', price: 600, category: 'masonry_ext' },
        'wrk_ms_ceramblock_440': { name: 'Кладка керамоблока 440мм', unit: 'м²', price: 700, category: 'masonry_ext' },
        'wrk_ms_ceramblock_510': { name: 'Кладка керамоблока 510мм', unit: 'м²', price: 800, category: 'masonry_ext' },
        // Кирпич (расширение)
        'wrk_ms_brick_half': { name: 'Кладка кирпичная в пол-кирпича', unit: 'м²', price: 300, category: 'masonry_ext' },
        'wrk_ms_brick_one': { name: 'Кладка кирпичная в 1 кирпич', unit: 'м²', price: 500, category: 'masonry_ext' },
        'wrk_ms_brick_one_half': { name: 'Кладка кирпичная в 1.5 кирпича', unit: 'м²', price: 700, category: 'masonry_ext' },
        'wrk_ms_brick_two': { name: 'Кладка кирпичная в 2 кирпича', unit: 'м²', price: 900, category: 'masonry_ext' },
        'wrk_ms_brick_face_half': { name: 'Облицовочная кладка (лицевой)', unit: 'м²', price: 500, category: 'masonry_ext' },
        'wrk_ms_brick_face_clinker': { name: 'Облицовочная кладка (клинкер)', unit: 'м²', price: 700, category: 'masonry_ext' },
        'wrk_ms_brick_bavarsk': { name: 'Баварская кладка', unit: 'м²', price: 600, category: 'masonry_ext' },
        // Армирование кладки
        'wrk_ms_rebar_horiz': { name: 'Горизонтальное армирование кладки', unit: 'м.п.', price: 20, category: 'masonry_ext' },
        'wrk_ms_rebar_mesh': { name: 'Кладочная сетка', unit: 'м²', price: 10, category: 'masonry_ext' },
        'wrk_ms_lintel_conc': { name: 'Перемычка ж/б (монтаж)', unit: 'м.п.', price: 200, category: 'masonry_ext' },
        'wrk_ms_lintel_metal': { name: 'Перемычка металлическая', unit: 'м.п.', price: 150, category: 'masonry_ext' },
        'wrk_ms_belt_armo': { name: 'Армопояс (устройство)', unit: 'м.п.', price: 500, category: 'masonry_ext' }
    };

    // === РАСШИРЕННЫЕ ФАСАДЫ ===
    window.AI_WRK_FACADE_EXT = {
        // Мокрый фасад (EIFS) — детально
        'wrk_fcd_eifs_eps_50': { name: 'Мокрый фасад EPS 50мм', unit: 'м²', price: 500, category: 'facade_ext' },
        'wrk_fcd_eifs_eps_100': { name: 'Мокрый фасад EPS 100мм', unit: 'м²', price: 600, category: 'facade_ext' },
        'wrk_fcd_eifs_eps_150': { name: 'Мокрый фасад EPS 150мм', unit: 'м²', price: 700, category: 'facade_ext' },
        'wrk_fcd_eifs_eps_200': { name: 'Мокрый фасад EPS 200мм', unit: 'м²', price: 800, category: 'facade_ext' },
        'wrk_fcd_eifs_mesh': { name: 'Армирование фасадной сеткой', unit: 'м²', price: 50, category: 'facade_ext' },
        'wrk_fcd_eifs_anchor': { name: 'Дюбель фасадный (монтаж)', unit: 'шт', price: 5, category: 'facade_ext' },
        // Вентфасад
        'wrk_fcd_vent_bracket': { name: 'Подсистема вентфасада (кронштейны)', unit: 'м²', price: 200, category: 'facade_ext' },
        'wrk_fcd_vent_insul_50': { name: 'Утеплитель вентфасада 50мм', unit: 'м²', price: 50, category: 'facade_ext' },
        'wrk_fcd_vent_insul_100': { name: 'Утеплитель вентфасада 100мм', unit: 'м²', price: 80, category: 'facade_ext' },
        'wrk_fcd_vent_insul_150': { name: 'Утеплитель вентфасада 150мм', unit: 'м²', price: 120, category: 'facade_ext' },
        'wrk_fcd_vent_membr': { name: 'Мембрана ветрозащитная', unit: 'м²', price: 15, category: 'facade_ext' },
        'wrk_fcd_vent_porcelain': { name: 'Облицовка керамогранитом (вентфасад)', unit: 'м²', price: 300, category: 'facade_ext' },
        'wrk_fcd_vent_fibro': { name: 'Облицовка фиброцементом', unit: 'м²', price: 250, category: 'facade_ext' },
        'wrk_fcd_vent_alucobond': { name: 'Облицовка алюкобондом', unit: 'м²', price: 350, category: 'facade_ext' },
        'wrk_fcd_vent_hpl': { name: 'Облицовка HPL-панелями', unit: 'м²', price: 400, category: 'facade_ext' },
        'wrk_fcd_vent_stone': { name: 'Облицовка натуральным камнем', unit: 'м²', price: 800, category: 'facade_ext' },
        // Сайдинг
        'wrk_fcd_plank_house': { name: 'Планкен', unit: 'м²', price: 350, category: 'facade_ext' },
        // Отделка фасадов
        'wrk_fcd_paint_facade_1': { name: 'Покраска фасада (1 слой)', unit: 'м²', price: 40, category: 'facade_ext' },
    };

    // === РАСШИРЕННАЯ КРОВЛЯ ===
    window.AI_WRK_ROOF_EXT = {
        // Стропильная система (детально)
        'wrk_rf_rafters_simple': { name: 'Стропильная система (простая)', unit: 'м²', price: 300, category: 'roof_ext' },
        'wrk_rf_rafters_complex': { name: 'Стропильная система (сложная)', unit: 'м²', price: 500, category: 'roof_ext' },
        'wrk_rf_mauerlat': { name: 'Мауэрлат (монтаж)', unit: 'м.п.', price: 100, category: 'roof_ext' },
        'wrk_rf_obreshetka_solid': { name: 'Обрешётка сплошная', unit: 'м²', price: 80, category: 'roof_ext' },
        'wrk_rf_obreshetka_step': { name: 'Обрешётка шаговая', unit: 'м²', price: 50, category: 'roof_ext' },
        'wrk_rf_kontr_lat': { name: 'Контробрешётка', unit: 'м²', price: 30, category: 'roof_ext' },
        // Покрытия (детально)
        'wrk_rf_metal_tile': { name: 'Металлочерепица', unit: 'м²', price: 200, category: 'roof_ext' },
        'wrk_rf_profsheet': { name: 'Профнастил кровельный', unit: 'м²', price: 180, category: 'roof_ext' },
        'wrk_rf_shingle_flex': { name: 'Гибкая черепица', unit: 'м²', price: 250, category: 'roof_ext' },
        'wrk_rf_shingle_ceramic': { name: 'Керамическая черепица', unit: 'м²', price: 500, category: 'roof_ext' },
        'wrk_rf_shingle_cement': { name: 'Цементно-песчаная черепица', unit: 'м²', price: 400, category: 'roof_ext' },
        'wrk_rf_shingle_composite': { name: 'Композитная черепица', unit: 'м²', price: 350, category: 'roof_ext' },
        'wrk_rf_standing_seam': { name: 'Фальцевая кровля', unit: 'м²', price: 400, category: 'roof_ext' },
        'wrk_rf_standing_seam_copper': { name: 'Фальцевая кровля (медь)', unit: 'м²', price: 800, category: 'roof_ext' },
        'wrk_rf_ondulin': { name: 'Ондулин', unit: 'м²', price: 150, category: 'roof_ext' },
        'wrk_rf_slate': { name: 'Шифер', unit: 'м²', price: 100, category: 'roof_ext' },
        // Плоская кровля
        'wrk_rf_flat_roll_1': { name: 'Плоская рулонная кровля (1 слой)', unit: 'м²', price: 100, category: 'roof_ext' },
        'wrk_rf_flat_roll_2': { name: 'Плоская рулонная кровля (2 слоя)', unit: 'м²', price: 180, category: 'roof_ext' },
        'wrk_rf_flat_pvc_membr': { name: 'ПВХ-мембрана кровля', unit: 'м²', price: 250, category: 'roof_ext' },
        'wrk_rf_flat_tpo_membr': { name: 'ТПО-мембрана кровля', unit: 'м²', price: 280, category: 'roof_ext' },
        'wrk_rf_flat_epdm_membr': { name: 'ЭПДМ-мембрана кровля', unit: 'м²', price: 300, category: 'roof_ext' },
        'wrk_rf_flat_ballast': { name: 'Балластная кровля (гравий)', unit: 'м²', price: 100, category: 'roof_ext' },
        'wrk_rf_green_roof': { name: 'Зелёная кровля (озеленение)', unit: 'м²', price: 500, category: 'roof_ext' },
        // Доборные
        'wrk_rf_ridge': { name: 'Конёк кровли', unit: 'м.п.', price: 100, category: 'roof_ext' },
        'wrk_rf_valley': { name: 'Ендова', unit: 'м.п.', price: 150, category: 'roof_ext' },
        'wrk_rf_drip': { name: 'Капельник', unit: 'м.п.', price: 50, category: 'roof_ext' },
        'wrk_rf_wind_board': { name: 'Ветровая планка', unit: 'м.п.', price: 80, category: 'roof_ext' },
        'wrk_rf_flashing_wall': { name: 'Примыкание к стене', unit: 'м.п.', price: 200, category: 'roof_ext' },
        'wrk_rf_flashing_chimney': { name: 'Примыкание к дымоходу', unit: 'шт', price: 1000, category: 'roof_ext' },
        // Водосток
        'wrk_rf_gutter_pvc_125': { name: 'Водосток ПВХ Ø125мм', unit: 'м.п.', price: 100, category: 'roof_ext' },
        'wrk_rf_gutter_metal_125': { name: 'Водосток металл Ø125мм', unit: 'м.п.', price: 150, category: 'roof_ext' },
        'wrk_rf_gutter_metal_150': { name: 'Водосток металл Ø150мм', unit: 'м.п.', price: 200, category: 'roof_ext' },
        'wrk_rf_downpipe_pvc_87': { name: 'Водосточная труба ПВХ Ø87мм', unit: 'м.п.', price: 80, category: 'roof_ext' },
        'wrk_rf_downpipe_metal_100': { name: 'Водосточная труба металл Ø100мм', unit: 'м.п.', price: 120, category: 'roof_ext' },
        'wrk_rf_snow_guard_pipe': { name: 'Снегозадержатель трубчатый', unit: 'м.п.', price: 200, category: 'roof_ext' },
        'wrk_rf_snow_guard_grid': { name: 'Снегозадержатель решётчатый', unit: 'м.п.', price: 250, category: 'roof_ext' },
        'wrk_rf_heating_cable': { name: 'Обогрев кровли/водостока', unit: 'м.п.', price: 100, category: 'roof_ext' }
    };
})();
