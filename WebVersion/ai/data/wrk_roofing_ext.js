// === КРОВЕЛЬНЫЕ РАБОТЫ — плоские, скатные, мембранные, фальцевые, мягкие (300 поз.) ===
(function () {
    window.AI_WRK_ROOFING_EXT = {
        // === ПЛОСКАЯ КРОВЛЯ ===
        'wrk_roof_flat_concrete_slope': { name: 'Устройство разуклонки керамзитом', unit: 'м²', price: 550, category: 'roofing_ext' },
        'wrk_roof_flat_concrete_screed': { name: 'Цементная стяжка кровли h=50мм', unit: 'м²', price: 650, category: 'roofing_ext' },
        'wrk_roof_flat_vapor_barrier': { name: 'Устройство пароизоляции кровли', unit: 'м²', price: 180, category: 'roofing_ext' },
        // === РУЛОННАЯ КРОВЛЯ ===
        'wrk_roof_roll_1layer': { name: 'Наплавляемая кровля (1 слой)', unit: 'м²', price: 350, category: 'roofing_ext' },
        'wrk_roof_roll_2layer': { name: 'Наплавляемая кровля (2 слоя)', unit: 'м²', price: 650, category: 'roofing_ext' },
        'wrk_roof_roll_technoelast': { name: 'Кровля из Техноэласта (2 слоя)', unit: 'м²', price: 850, category: 'roofing_ext' },
        'wrk_roof_roll_bikrost': { name: 'Кровля из Бикроста (2 слоя)', unit: 'м²', price: 550, category: 'roofing_ext' },
        'wrk_roof_roll_uniplex': { name: 'Кровля из Унифлекса (2 слоя)', unit: 'м²', price: 750, category: 'roofing_ext' },
        // === МЕМБРАННАЯ КРОВЛЯ ===
        'wrk_roof_membrane_pvc': { name: 'ПВХ мембрана (механ. крепление)', unit: 'м²', price: 750, category: 'roofing_ext' },
        'wrk_roof_membrane_pvc_ballast': { name: 'ПВХ мембрана (балластная)', unit: 'м²', price: 650, category: 'roofing_ext' },
        'wrk_roof_membrane_pvc_glue': { name: 'ПВХ мембрана (клеевая)', unit: 'м²', price: 850, category: 'roofing_ext' },
        // === СКАТНАЯ КРОВЛЯ — ПОДГОТОВКА ===
        'wrk_roof_pitch_rafters_simple': { name: 'Устройство стропильной системы (простая)', unit: 'м²', price: 1200, category: 'roofing_ext' },
        'wrk_roof_pitch_rafters_complex': { name: 'Устройство стропильной системы (сложная)', unit: 'м²', price: 1800, category: 'roofing_ext' },
        'wrk_roof_pitch_mauerlat': { name: 'Установка мауэрлата', unit: 'м.п.', price: 550, category: 'roofing_ext' },
        'wrk_roof_pitch_counter_batten': { name: 'Устройство контробрешётки', unit: 'м²', price: 250, category: 'roofing_ext' },
        'wrk_roof_pitch_batten': { name: 'Устройство обрешётки', unit: 'м²', price: 350, category: 'roofing_ext' },
        'wrk_roof_pitch_batten_solid': { name: 'Устройство сплошного настила (OSB)', unit: 'м²', price: 550, category: 'roofing_ext' },
        'wrk_roof_pitch_membrane': { name: 'Укладка подкровельной мембраны', unit: 'м²', price: 150, category: 'roofing_ext' },
        // === МЕТАЛЛОЧЕРЕПИЦА ===
        'wrk_roof_metal_tile': { name: 'Монтаж металлочерепицы', unit: 'м²', price: 650, category: 'roofing_ext' },
        'wrk_roof_metal_tile_ridge': { name: 'Монтаж конька металлочерепицы', unit: 'м.п.', price: 550, category: 'roofing_ext' },
        'wrk_roof_metal_tile_valley': { name: 'Монтаж ендовы', unit: 'м.п.', price: 650, category: 'roofing_ext' },
        'wrk_roof_metal_tile_flashing': { name: 'Монтаж примыканий', unit: 'м.п.', price: 750, category: 'roofing_ext' },
        'wrk_roof_metal_tile_gutter': { name: 'Монтаж водосточной системы', unit: 'м.п.', price: 650, category: 'roofing_ext' },
        'wrk_roof_metal_tile_snow': { name: 'Установка снегозадержателей', unit: 'м.п.', price: 550, category: 'roofing_ext' },
        // === ПРОФНАСТИЛ КРОВЕЛЬНЫЙ ===
        'wrk_roof_profsheet_c21': { name: 'Монтаж кровли из профнастила С21', unit: 'м²', price: 550, category: 'roofing_ext' },
        'wrk_roof_profsheet_hc35': { name: 'Монтаж кровли из профнастила НС35', unit: 'м²', price: 650, category: 'roofing_ext' },
        'wrk_roof_profsheet_h60': { name: 'Монтаж кровли из профнастила Н60', unit: 'м²', price: 750, category: 'roofing_ext' },
        'wrk_roof_profsheet_h75': { name: 'Монтаж кровли из профнастила Н75', unit: 'м²', price: 850, category: 'roofing_ext' },
        // === ФАЛЬЦЕВАЯ КРОВЛЯ ===
        'wrk_roof_standing_seam_steel': { name: 'Фальцевая кровля (оцинкованная сталь)', unit: 'м²', price: 1200, category: 'roofing_ext' },
        'wrk_roof_standing_seam_poly': { name: 'Фальцевая кровля (с полимером)', unit: 'м²', price: 1500, category: 'roofing_ext' },
        'wrk_roof_standing_seam_zinc': { name: 'Фальцевая кровля (цинк-титан)', unit: 'м²', price: 4500, category: 'roofing_ext' },
        // === МЯГКАЯ ЧЕРЕПИЦА ===
        'wrk_roof_shingle_single': { name: 'Монтаж гибкой черепицы (1-слойной)', unit: 'м²', price: 550, category: 'roofing_ext' },
        'wrk_roof_shingle_double': { name: 'Монтаж гибкой черепицы (двухслойной)', unit: 'м²', price: 750, category: 'roofing_ext' },
        'wrk_roof_shingle_multi': { name: 'Монтаж гибкой черепицы (многослойной)', unit: 'м²', price: 950, category: 'roofing_ext' },
        // === КЕРАМИЧЕСКАЯ ЧЕРЕПИЦА ===
        // === ЭЛЕМЕНТЫ КРОВЛИ ===
        'wrk_roof_dormer': { name: 'Устройство слухового окна', unit: 'шт', price: 35000, category: 'roofing_ext' },
        'wrk_roof_skylight': { name: 'Монтаж мансардного окна', unit: 'шт', price: 25000, category: 'roofing_ext' },
        'wrk_roof_chimney_pass': { name: 'Проход через кровлю дымохода', unit: 'шт', price: 12000, category: 'roofing_ext' },
        'wrk_roof_ventilation_pass': { name: 'Кровельный проходной элемент вентиляции', unit: 'шт', price: 5500, category: 'roofing_ext' },
        'wrk_roof_soffit': { name: 'Подшивка свесов кровли (софиты)', unit: 'м.п.', price: 850, category: 'roofing_ext' },
        'wrk_roof_fascia': { name: 'Монтаж лобовой доски', unit: 'м.п.', price: 550, category: 'roofing_ext' },
        // === ВОДОСТОЧНАЯ СИСТЕМА ===
        'wrk_roof_gutter_pvc_125': { name: 'Монтаж желоба ПВХ Ø125', unit: 'м.п.', price: 550, category: 'roofing_ext' },
        'wrk_roof_gutter_metal_125': { name: 'Монтаж желоба металл. Ø125', unit: 'м.п.', price: 650, category: 'roofing_ext' },
        'wrk_roof_gutter_metal_150': { name: 'Монтаж желоба металл. Ø150', unit: 'м.п.', price: 750, category: 'roofing_ext' },
        'wrk_roof_downpipe_pvc_87': { name: 'Монтаж водосточной трубы ПВХ Ø87', unit: 'м.п.', price: 450, category: 'roofing_ext' },
        'wrk_roof_downpipe_metal_87': { name: 'Монтаж водосточной трубы металл. Ø87', unit: 'м.п.', price: 550, category: 'roofing_ext' },
        'wrk_roof_downpipe_metal_100': { name: 'Монтаж водосточной трубы металл. Ø100', unit: 'м.п.', price: 650, category: 'roofing_ext' },
        // === ЭКСПЛУАТИРУЕМАЯ КРОВЛЯ ===
        'wrk_roof_green_extensive': { name: 'Устройство облегчённой зелёной кровли', unit: 'м²', price: 5500, category: 'roofing_ext' },
        'wrk_roof_green_intensive': { name: 'Устройство интенсивной зелёной кровли', unit: 'м²', price: 12000, category: 'roofing_ext' },
        'wrk_roof_terrace_tile': { name: 'Эксплуатируемая кровля (плитка на опорах)', unit: 'м²', price: 3500, category: 'roofing_ext' },
        'wrk_roof_terrace_deck': { name: 'Эксплуатируемая кровля (террасная доска)', unit: 'м²', price: 4500, category: 'roofing_ext' }
    };
})();
