// === КАМИНЫ, ПЕЧИ, ДЫМОХОДЫ — кирпичные, стальные, газовые, биокамины (50 поз.) ===
(function () {
    window.AI_WRK_FIREPLACES = {
        // === КИРПИЧНЫЕ КАМИНЫ/ПЕЧИ === 1-10
        'wrk_fp_brick_fireplace_sm': { name: 'Кладка камина кирпичного (малый)', unit: 'шт', price: 120000, category: 'fireplaces' },
        'wrk_fp_brick_fireplace_md': { name: 'Кладка камина кирпичного (средний)', unit: 'шт', price: 250000, category: 'fireplaces' },
        'wrk_fp_brick_fireplace_lg': { name: 'Кладка камина кирпичного (большой)', unit: 'шт', price: 450000, category: 'fireplaces' },
        'wrk_fp_brick_stove_russian': { name: 'Кладка русской печи', unit: 'шт', price: 350000, category: 'fireplaces' },
        'wrk_fp_brick_stove_dutch': { name: 'Кладка голландской печи', unit: 'шт', price: 120000, category: 'fireplaces' },
        'wrk_fp_brick_stove_swedish': { name: 'Кладка шведской печи', unit: 'шт', price: 150000, category: 'fireplaces' },
        'wrk_fp_brick_bbq': { name: 'Кладка барбекю-комплекса', unit: 'шт', price: 250000, category: 'fireplaces' },
        'wrk_fp_brick_tandyr': { name: 'Установка тандыра', unit: 'шт', price: 55000, category: 'fireplaces' },
        'wrk_fp_brick_facing_tile': { name: 'Облицовка камина изразцами', unit: 'м²', price: 8500, category: 'fireplaces' },
        'wrk_fp_brick_facing_stone': { name: 'Облицовка камина камнем', unit: 'м²', price: 5500, category: 'fireplaces' },
        // === МЕТАЛЛИЧЕСКИЕ КАМИНЫ/ПЕЧИ === 11-18
        'wrk_fp_steel_insert': { name: 'Монтаж каминной топки', unit: 'шт', price: 25000, category: 'fireplaces' },
        'wrk_fp_steel_insert_water': { name: 'Монтаж каминной топки с водяным контуром', unit: 'шт', price: 55000, category: 'fireplaces' },
        'wrk_fp_steel_stove_5': { name: 'Установка печи-камина 5кВт', unit: 'шт', price: 12000, category: 'fireplaces' },
        'wrk_fp_steel_stove_10': { name: 'Установка печи-камина 10кВт', unit: 'шт', price: 15000, category: 'fireplaces' },
        'wrk_fp_steel_stove_15': { name: 'Установка печи-камина 15кВт', unit: 'шт', price: 18000, category: 'fireplaces' },
        'wrk_fp_steel_sauna_elect': { name: 'Установка электрокаменки (сауна)', unit: 'шт', price: 12000, category: 'fireplaces' },
        'wrk_fp_steel_sauna_wood': { name: 'Установка банной печи (дровяная)', unit: 'шт', price: 18000, category: 'fireplaces' },
        'wrk_fp_steel_sauna_gas': { name: 'Установка банной печи (газовая)', unit: 'шт', price: 25000, category: 'fireplaces' },
        // === ГАЗОВЫЕ КАМИНЫ === 19-22
        'wrk_fp_gas_builtin': { name: 'Монтаж газового камина (встроенный)', unit: 'шт', price: 35000, category: 'fireplaces' },
        'wrk_fp_gas_freestand': { name: 'Монтаж газового камина (отдельностоящий)', unit: 'шт', price: 25000, category: 'fireplaces' },
        'wrk_fp_gas_connect': { name: 'Подключение газового камина', unit: 'шт', price: 8500, category: 'fireplaces' },
        'wrk_fp_gas_vent': { name: 'Устройство вентканала для газ. камина', unit: 'м.п.', price: 3500, category: 'fireplaces' },
        // === БИОКАМИНЫ / ЭЛЕКТРОКАМИНЫ === 23-28
        'wrk_fp_bio_wall': { name: 'Монтаж биокамина настенного', unit: 'шт', price: 5500, category: 'fireplaces' },
        'wrk_fp_bio_builtin': { name: 'Монтаж биокамина встроенного', unit: 'шт', price: 12000, category: 'fireplaces' },
        'wrk_fp_bio_island': { name: 'Монтаж биокамина островного', unit: 'шт', price: 15000, category: 'fireplaces' },
        'wrk_fp_electric_wall': { name: 'Монтаж электрокамина настенного', unit: 'шт', price: 5500, category: 'fireplaces' },
        'wrk_fp_electric_builtin': { name: 'Монтаж электрокамина встроенного', unit: 'шт', price: 12000, category: 'fireplaces' },
        'wrk_fp_electric_3d': { name: 'Монтаж электрокамина с 3D-пламенем', unit: 'шт', price: 15000, category: 'fireplaces' },
        // === ДЫМОХОДЫ === 29-40
        'wrk_fp_chimney_brick': { name: 'Кладка кирпичного дымохода', unit: 'м.п.', price: 8500, category: 'fireplaces' },
        'wrk_fp_chimney_ss_115': { name: 'Монтаж дымохода сэндвич Ø115/200', unit: 'м.п.', price: 2500, category: 'fireplaces' },
        'wrk_fp_chimney_ss_150': { name: 'Монтаж дымохода сэндвич Ø150/230', unit: 'м.п.', price: 3500, category: 'fireplaces' },
        'wrk_fp_chimney_ss_200': { name: 'Монтаж дымохода сэндвич Ø200/280', unit: 'м.п.', price: 5500, category: 'fireplaces' },
        'wrk_fp_chimney_ceramic': { name: 'Монтаж керамического дымохода', unit: 'м.п.', price: 8500, category: 'fireplaces' },
        'wrk_fp_chimney_liner': { name: 'Гильзовка кирпичного дымохода', unit: 'м.п.', price: 3500, category: 'fireplaces' },
        'wrk_fp_chimney_cap': { name: 'Установка дефлектора/оголовка', unit: 'шт', price: 5500, category: 'fireplaces' },
        'wrk_fp_chimney_flash_roof': { name: 'Устройство примыкания к кровле', unit: 'шт', price: 8500, category: 'fireplaces' },
        'wrk_fp_chimney_flash_wall': { name: 'Проход через стену', unit: 'шт', price: 3500, category: 'fireplaces' },
        'wrk_fp_chimney_flash_floor': { name: 'Проход через перекрытие', unit: 'шт', price: 3500, category: 'fireplaces' },
        'wrk_fp_chimney_clean': { name: 'Чистка дымохода', unit: 'шт', price: 3500, category: 'fireplaces' },
        // === ПОРТАЛ / КОРОБ === 41-46
        'wrk_fp_portal_gkl': { name: 'Устройство портала из ГКЛ', unit: 'шт', price: 25000, category: 'fireplaces' },
        'wrk_fp_portal_marble': { name: 'Установка мраморного портала', unit: 'шт', price: 55000, category: 'fireplaces' },
        'wrk_fp_portal_granite': { name: 'Установка гранитного портала', unit: 'шт', price: 85000, category: 'fireplaces' },
        'wrk_fp_portal_cast_iron': { name: 'Установка чугунного портала', unit: 'шт', price: 35000, category: 'fireplaces' },
        'wrk_fp_portal_wood': { name: 'Установка деревянного портала', unit: 'шт', price: 25000, category: 'fireplaces' },
        'wrk_fp_heat_duct': { name: 'Устройство тепловоздуховода камина', unit: 'м.п.', price: 1500, category: 'fireplaces' },
        // === ОСНОВАНИЕ / ДОПЫ === 47-50
        'wrk_fp_base_rc': { name: 'Устройство основания под камин (ж/б)', unit: 'шт', price: 15000, category: 'fireplaces' },
        'wrk_fp_hearth_stone': { name: 'Устройство каменной подтопочной плиты', unit: 'шт', price: 8500, category: 'fireplaces' },
        'wrk_fp_fire_screen': { name: 'Установка каминного экрана', unit: 'шт', price: 5500, category: 'fireplaces' },
        'wrk_fp_woodstore': { name: 'Устройство дровницы', unit: 'шт', price: 5500, category: 'fireplaces' }
    };
})();
