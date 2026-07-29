// === ФАЗА 3: ГИДРОИЗОЛЯЦИЯ ДЕТАЛЬНО — ФУНДАМЕНТЫ, ВАННЫЕ, КРОВЛЯ, ПОДВАЛЫ (90 поз.) ===
(function () {
    window.AI_WRK_WATERPROOFING_FULL = {
        // === ОБМАЗОЧНАЯ ===
        'wrk_wp_coat_bitumen_1': { name: 'Обмазочная битумная (1 слой)', unit: 'м²', price: 10, category: 'waterproofing_full' },
        'wrk_wp_coat_bitumen_2': { name: 'Обмазочная битумная (2 слоя)', unit: 'м²', price: 18, category: 'waterproofing_full' },
        'wrk_wp_coat_polymer_1': { name: 'Обмазочная полимерная (1 слой)', unit: 'м²', price: 15, category: 'waterproofing_full' },
        'wrk_wp_coat_polymer_2': { name: 'Обмазочная полимерная (2 слоя)', unit: 'м²', price: 25, category: 'waterproofing_full' },
        'wrk_wp_coat_cement_1': { name: 'Цементная гидроизоляция (1 слой)', unit: 'м²', price: 12, category: 'waterproofing_full' },
        'wrk_wp_coat_cement_2': { name: 'Цементная гидроизоляция (2 слоя)', unit: 'м²', price: 20, category: 'waterproofing_full' },
        'wrk_wp_coat_elastomer': { name: 'Эластичная гидроизоляция', unit: 'м²', price: 20, category: 'waterproofing_full' },

        // === ОКЛЕЕЧНАЯ ===
        'wrk_wp_roll_technoelast_1': { name: 'Техноэласт (1 слой)', unit: 'м²', price: 20, category: 'waterproofing_full' },
        'wrk_wp_roll_technoelast_2': { name: 'Техноэласт (2 слоя)', unit: 'м²', price: 35, category: 'waterproofing_full' },
        'wrk_wp_roll_bikrost_1': { name: 'Бикрост (1 слой)', unit: 'м²', price: 12, category: 'waterproofing_full' },
        'wrk_wp_roll_bikrost_2': { name: 'Бикрост (2 слоя)', unit: 'м²', price: 20, category: 'waterproofing_full' },
        'wrk_wp_roll_uniflex': { name: 'Унифлекс (наплавление)', unit: 'м²', price: 15, category: 'waterproofing_full' },
        'wrk_wp_roll_self_adhesive': { name: 'Самоклеющаяся мембрана', unit: 'м²', price: 20, category: 'waterproofing_full' },

        // === МЕМБРАННАЯ ===
        'wrk_wp_memb_pvc_2_0': { name: 'ПВХ мембрана 2.0мм', unit: 'м²', price: 40, category: 'waterproofing_full' },
        'wrk_wp_memb_tpo_1_2': { name: 'ТПО мембрана 1.2мм', unit: 'м²', price: 30, category: 'waterproofing_full' },
        'wrk_wp_memb_tpo_1_5': { name: 'ТПО мембрана 1.5мм', unit: 'м²', price: 35, category: 'waterproofing_full' },
        'wrk_wp_memb_epdm_1_2': { name: 'EPDM мембрана 1.2мм', unit: 'м²', price: 30, category: 'waterproofing_full' },
        'wrk_wp_memb_epdm_1_5': { name: 'EPDM мембрана 1.5мм', unit: 'м²', price: 35, category: 'waterproofing_full' },

        // === ПРОНИКАЮЩАЯ ===
        'wrk_wp_penetr_paint': { name: 'Проникающая гидроизоляция (обмазка)', unit: 'м²', price: 20, category: 'waterproofing_full' },
        'wrk_wp_penetr_crystallize': { name: 'Кристаллизующая гидроизоляция', unit: 'м²', price: 25, category: 'waterproofing_full' },

        // === ПРИМЕНЕНИЕ ПО ЗОНАМ ===
        // Фундамент
        'wrk_wp_found_vert_bitmast': { name: 'Г/и фундамента (мастика вертик.)', unit: 'м²', price: 15, category: 'waterproofing_full' },
        'wrk_wp_found_vert_roll': { name: 'Г/и фундамента (оклеечная вертик.)', unit: 'м²', price: 25, category: 'waterproofing_full' },
        'wrk_wp_found_horiz': { name: 'Г/и фундамента (горизонтальная)', unit: 'м²', price: 15, category: 'waterproofing_full' },
        'wrk_wp_found_slab': { name: 'Г/и фунд. плиты', unit: 'м²', price: 20, category: 'waterproofing_full' },
        // Санузлы
        'wrk_wp_bath_floor': { name: 'Г/и пола санузла', unit: 'м²', price: 20, category: 'waterproofing_full' },
        'wrk_wp_bath_wall': { name: 'Г/и стен санузла (мокрая зона)', unit: 'м²', price: 15, category: 'waterproofing_full' },
        'wrk_wp_bath_tape': { name: 'Лента гидроизоляционная (швы)', unit: 'м.п.', price: 5, category: 'waterproofing_full' },
        'wrk_wp_bath_corner': { name: 'Уголок гидроизоляционный', unit: 'шт', price: 5, category: 'waterproofing_full' },
        'wrk_wp_bath_manchette': { name: 'Манжета гидроизоляционная', unit: 'шт', price: 10, category: 'waterproofing_full' },
        // Подвал
        'wrk_wp_basement_int': { name: 'Г/и подвала (изнутри)', unit: 'м²', price: 25, category: 'waterproofing_full' },
        'wrk_wp_basement_ext': { name: 'Г/и подвала (снаружи)', unit: 'м²', price: 30, category: 'waterproofing_full' },
        'wrk_wp_basement_inject': { name: 'Инъекционная г/и подвала', unit: 'м.п.', price: 150, category: 'waterproofing_full' },
        // Кровля
        'wrk_wp_roof_flat_1': { name: 'Г/и плоской кровли (1 слой)', unit: 'м²', price: 20, category: 'waterproofing_full' },
        'wrk_wp_roof_flat_2': { name: 'Г/и плоской кровли (2 слоя)', unit: 'м²', price: 35, category: 'waterproofing_full' },
        'wrk_wp_roof_green': { name: 'Г/и эксплуатируемой кровли', unit: 'м²', price: 40, category: 'waterproofing_full' },
        // Бассейн
        'wrk_wp_pool_int': { name: 'Г/и бассейна (внутр.)', unit: 'м²', price: 30, category: 'waterproofing_full' },
        'wrk_wp_pool_ext': { name: 'Г/и бассейна (наруж.)', unit: 'м²', price: 25, category: 'waterproofing_full' },
        'wrk_wp_pool_mastic': { name: 'Эластичная г/и бассейна', unit: 'м²', price: 35, category: 'waterproofing_full' },
        // Балкон / терраса
        'wrk_wp_balcony': { name: 'Г/и балкона', unit: 'м²', price: 25, category: 'waterproofing_full' },
        'wrk_wp_terrace': { name: 'Г/и террасы', unit: 'м²', price: 25, category: 'waterproofing_full' }
    };
})();
