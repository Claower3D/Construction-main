// === ФАЗА 3: КРОВЕЛЬНЫЕ РАБОТЫ — ВСЕ ПОКРЫТИЯ, ВОДОСТОК, МАНСАРДА, МОЛНИЕЗАЩИТА (150 поз.) ===
(function () {
    window.AI_WRK_ROOFING_FULL = {
        // === МЕТАЛЛОЧЕРЕПИЦА ===
        'wrk_rf_metaltile_045': { name: 'Металлочерепица 0.45мм (монтаж)', unit: 'м²', price: 100, category: 'roofing_full' },
        'wrk_rf_metaltile_05': { name: 'Металлочерепица 0.5мм (монтаж)', unit: 'м²', price: 120, category: 'roofing_full' },
        'wrk_rf_metaltile_055': { name: 'Металлочерепица 0.55мм (монтаж)', unit: 'м²', price: 140, category: 'roofing_full' },

        // === ПРОФНАСТИЛ КРОВЕЛЬНЫЙ ===
        'wrk_rf_profsheet_c21': { name: 'Профнастил С21 (монтаж)', unit: 'м²', price: 80, category: 'roofing_full' },
        'wrk_rf_profsheet_h35': { name: 'Профнастил HC35 (монтаж)', unit: 'м²', price: 100, category: 'roofing_full' },
        'wrk_rf_profsheet_h60': { name: 'Профнастил Н60 (монтаж)', unit: 'м²', price: 120, category: 'roofing_full' },
        'wrk_rf_profsheet_h75': { name: 'Профнастил Н75 (монтаж)', unit: 'м²', price: 140, category: 'roofing_full' },

        // === МЯГКАЯ КРОВЛЯ/БИТУМНАЯ ЧЕРЕПИЦА ===
        'wrk_rf_shingle_1layer': { name: 'Битумная черепица (однослойная)', unit: 'м²', price: 100, category: 'roofing_full' },
        'wrk_rf_shingle_2layer': { name: 'Битумная черепица (двуслойная)', unit: 'м²', price: 130, category: 'roofing_full' },
        'wrk_rf_shingle_3layer': { name: 'Битумная черепица (трёхслойная)', unit: 'м²', price: 170, category: 'roofing_full' },
        'wrk_rf_shingle_osb': { name: 'Основание OSB под гибкую черепицу', unit: 'м²', price: 80, category: 'roofing_full' },
        'wrk_rf_shingle_carpet': { name: 'Подкладочный ковёр', unit: 'м²', price: 20, category: 'roofing_full' },

        // === ФАЛЬЦЕВАЯ КРОВЛЯ ===
        'wrk_rf_seam_steel_04': { name: 'Фальцевая кровля (сталь 0.4мм)', unit: 'м²', price: 200, category: 'roofing_full' },
        'wrk_rf_seam_steel_05': { name: 'Фальцевая кровля (сталь 0.5мм)', unit: 'м²', price: 250, category: 'roofing_full' },
        'wrk_rf_seam_alu': { name: 'Фальцевая кровля (алюминий)', unit: 'м²', price: 350, category: 'roofing_full' },

        // === НАТУРАЛЬНАЯ ЧЕРЕПИЦА ===
        'wrk_rf_clay_tile': { name: 'Керамическая (глиняная) черепица', unit: 'м²', price: 300, category: 'roofing_full' },
        'wrk_rf_slate_natural': { name: 'Сланцевая кровля', unit: 'м²', price: 500, category: 'roofing_full' },

        // === КОМПОЗИТНАЯ ЧЕРЕПИЦА ===

        // === ПЛОСКАЯ КРОВЛЯ ===
        'wrk_rf_flat_pvc_membr': { name: 'ПВХ-мембрана (кровля)', unit: 'м²', price: 80, category: 'roofing_full' },
        'wrk_rf_flat_tpo_membr': { name: 'ТПО-мембрана (кровля)', unit: 'м²', price: 90, category: 'roofing_full' },
        'wrk_rf_flat_epdm': { name: 'EPDM-мембрана (кровля)', unit: 'м²', price: 100, category: 'roofing_full' },
        'wrk_rf_flat_liquid': { name: 'Жидкая кровля (полиуретан)', unit: 'м²', price: 100, category: 'roofing_full' },
        'wrk_rf_flat_parapets': { name: 'Парапеты (примыкание)', unit: 'м.п.', price: 50, category: 'roofing_full' },
        'wrk_rf_flat_drain_int': { name: 'Внутренний водоотвод (воронка)', unit: 'шт', price: 500, category: 'roofing_full' },
        'wrk_rf_green_ext': { name: 'Зелёная кровля (экстенсивная)', unit: 'м²', price: 200, category: 'roofing_full' },
        'wrk_rf_green_int': { name: 'Зелёная кровля (интенсивная)', unit: 'м²', price: 400, category: 'roofing_full' },

        // === СТРОПИЛЬНАЯ СИСТЕМА ===
        'wrk_rf_rafter_hip': { name: 'Стропила вальмовой кровли', unit: 'м²', price: 300, category: 'roofing_full' },
        'wrk_rf_rafter_mansard': { name: 'Стропила мансардной кровли', unit: 'м²', price: 350, category: 'roofing_full' },
        'wrk_rf_crate_lap': { name: 'Обрешётка (доска)', unit: 'м²', price: 30, category: 'roofing_full' },
        'wrk_rf_crate_solid': { name: 'Сплошная обрешётка (OSB)', unit: 'м²', price: 80, category: 'roofing_full' },
        'wrk_rf_crate_solid_plywood': { name: 'Сплошная обрешётка (фанера)', unit: 'м²', price: 90, category: 'roofing_full' },
        // Мауэрлат
        'wrk_rf_mauerlat_150': { name: 'Мауэрлат 150×150мм', unit: 'м.п.', price: 30, category: 'roofing_full' },
        'wrk_rf_mauerlat_200': { name: 'Мауэрлат 200×200мм', unit: 'м.п.', price: 40, category: 'roofing_full' },

        // === УТЕПЛЕНИЕ КРОВЛИ ===
        'wrk_rf_insul_pir': { name: 'Утепление кровли PIR-плита', unit: 'м²', price: 150, category: 'roofing_full' },
        'wrk_rf_vapor': { name: 'Пароизоляция кровли', unit: 'м²', price: 10, category: 'roofing_full' },
        'wrk_rf_wind': { name: 'Ветрозащитная мембрана (кровля)', unit: 'м²', price: 15, category: 'roofing_full' },
        'wrk_rf_diff_membr': { name: 'Диффузионная мембрана', unit: 'м²', price: 20, category: 'roofing_full' },
        'wrk_rf_superdiff_membr': { name: 'Супердиффузионная мембрана', unit: 'м²', price: 30, category: 'roofing_full' },

        // === ДОБОРНЫЕ ЭЛЕМЕНТЫ ===
        'wrk_rf_drip_edge': { name: 'Карнизная планка', unit: 'м.п.', price: 20, category: 'roofing_full' },
        'wrk_rf_wind_edge': { name: 'Ветровая планка (торцевая)', unit: 'м.п.', price: 25, category: 'roofing_full' },
        'wrk_rf_wall_adj': { name: 'Планка примыкания к стене', unit: 'м.п.', price: 30, category: 'roofing_full' },
        'wrk_rf_chimney_pass': { name: 'Проход через кровлю (дымоход)', unit: 'шт', price: 500, category: 'roofing_full' },
        'wrk_rf_vent_pass': { name: 'Проход через кровлю (вентиляция)', unit: 'шт', price: 300, category: 'roofing_full' },
        'wrk_rf_skylight_mount': { name: 'Мансардное окно (монтаж)', unit: 'шт', price: 2000, category: 'roofing_full' },
        'wrk_rf_hatch': { name: 'Люк кровельный', unit: 'шт', price: 500, category: 'roofing_full' },
        'wrk_rf_snow_guard_plank': { name: 'Снегозадержатель планочный', unit: 'м.п.', price: 30, category: 'roofing_full' },
        'wrk_rf_snow_guard_hook': { name: 'Снегостопор (крюк)', unit: 'шт', price: 10, category: 'roofing_full' },

        // === ВОДОСТОЧНАЯ СИСТЕМА ===
        'wrk_rf_gutter_125': { name: 'Водосточный жёлоб Ø125мм', unit: 'м.п.', price: 50, category: 'roofing_full' },
        'wrk_rf_gutter_150': { name: 'Водосточный жёлоб Ø150мм', unit: 'м.п.', price: 60, category: 'roofing_full' },
        'wrk_rf_gutter_180': { name: 'Водосточный жёлоб Ø180мм', unit: 'м.п.', price: 70, category: 'roofing_full' },
        'wrk_rf_pipe_87': { name: 'Водосточная труба Ø87мм', unit: 'м.п.', price: 40, category: 'roofing_full' },
        'wrk_rf_pipe_100': { name: 'Водосточная труба Ø100мм', unit: 'м.п.', price: 50, category: 'roofing_full' },
        'wrk_rf_pipe_125': { name: 'Водосточная труба Ø125мм', unit: 'м.п.', price: 60, category: 'roofing_full' },
        'wrk_rf_funnel': { name: 'Водосточная воронка', unit: 'шт', price: 50, category: 'roofing_full' },
        'wrk_rf_bend': { name: 'Колено водосточной трубы', unit: 'шт', price: 30, category: 'roofing_full' },
        'wrk_rf_gutter_bracket': { name: 'Кронштейн жёлоба', unit: 'шт', price: 10, category: 'roofing_full' },
        'wrk_rf_gutter_guard': { name: 'Сетка-листоуловитель', unit: 'м.п.', price: 20, category: 'roofing_full' },
        'wrk_rf_gutter_heating': { name: 'Обогрев водостоков (кабель)', unit: 'м.п.', price: 50, category: 'roofing_full' },

        // === ПОДШИВКА СВЕСОВ ===
        'wrk_rf_soffit_pvc': { name: 'Софит ПВХ', unit: 'м²', price: 100, category: 'roofing_full' },
        'wrk_rf_soffit_metal': { name: 'Софит металлический', unit: 'м²', price: 120, category: 'roofing_full' },
        'wrk_rf_soffit_wood': { name: 'Подшивка свеса (дерево)', unit: 'м²', price: 150, category: 'roofing_full' },
        'wrk_rf_fascia': { name: 'Лобовая доска (монтаж)', unit: 'м.п.', price: 30, category: 'roofing_full' }
    };
})();
