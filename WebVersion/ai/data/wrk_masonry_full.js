// === ФАЗА 3: КЛАДОЧНЫЕ РАБОТЫ — ВСЕ ТИПЫ БЛОКОВ, КИРПИЧА, ПЕРЕМЫЧКИ, АРМОПОЯС (150 поз.) ===
(function () {
    window.AI_WRK_MASONRY_FULL = {
        // === КИРПИЧНАЯ КЛАДКА ===
        'wrk_mry_brick_120_solid': { name: 'Кладка кирпич полнотелый 120мм', unit: 'м²', price: 300, category: 'masonry_full' },
        'wrk_mry_brick_120_hollow': { name: 'Кладка кирпич пустотелый 120мм', unit: 'м²', price: 280, category: 'masonry_full' },
        'wrk_mry_brick_250_solid': { name: 'Кладка кирпич полнотелый 250мм', unit: 'м²', price: 500, category: 'masonry_full' },
        'wrk_mry_brick_250_hollow': { name: 'Кладка кирпич пустотелый 250мм', unit: 'м²', price: 450, category: 'masonry_full' },
        'wrk_mry_brick_380': { name: 'Кладка кирпич 380мм (1.5 кирпича)', unit: 'м²', price: 700, category: 'masonry_full' },
        'wrk_mry_brick_510': { name: 'Кладка кирпич 510мм (2 кирпича)', unit: 'м²', price: 900, category: 'masonry_full' },
        'wrk_mry_brick_face_120': { name: 'Облицовочный кирпич 120мм', unit: 'м²', price: 400, category: 'masonry_full' },
        'wrk_mry_brick_face_bavarsky': { name: 'Облицовочный кирпич Баварская кладка', unit: 'м²', price: 500, category: 'masonry_full' },
        'wrk_mry_brick_clinker': { name: 'Клинкерный кирпич (кладка)', unit: 'м²', price: 600, category: 'masonry_full' },
        'wrk_mry_brick_fire': { name: 'Огнеупорный (шамотный) кирпич', unit: 'м²', price: 600, category: 'masonry_full' },

        // === ГАЗОБЕТОН ===
        'wrk_mry_gas_200': { name: 'Газобетон D400 200мм', unit: 'м²', price: 200, category: 'masonry_full' },
        'wrk_mry_gas_250': { name: 'Газобетон D400 250мм', unit: 'м²', price: 250, category: 'masonry_full' },
        'wrk_mry_gas_300': { name: 'Газобетон D400 300мм', unit: 'м²', price: 300, category: 'masonry_full' },
        'wrk_mry_gas_375': { name: 'Газобетон D400 375мм', unit: 'м²', price: 350, category: 'masonry_full' },
        'wrk_mry_gas_400': { name: 'Газобетон D400 400мм', unit: 'м²', price: 400, category: 'masonry_full' },
        'wrk_mry_gas_500': { name: 'Газобетон D400 500мм', unit: 'м²', price: 500, category: 'masonry_full' },
        'wrk_mry_gas_d500_200': { name: 'Газобетон D500 200мм', unit: 'м²', price: 220, category: 'masonry_full' },
        'wrk_mry_gas_d500_300': { name: 'Газобетон D500 300мм', unit: 'м²', price: 320, category: 'masonry_full' },
        'wrk_mry_gas_d500_400': { name: 'Газобетон D500 400мм', unit: 'м²', price: 420, category: 'masonry_full' },
        'wrk_mry_gas_d600_200': { name: 'Газобетон D600 200мм', unit: 'м²', price: 250, category: 'masonry_full' },
        'wrk_mry_gas_d600_300': { name: 'Газобетон D600 300мм', unit: 'м²', price: 350, category: 'masonry_full' },
        'wrk_mry_gas_d600_400': { name: 'Газобетон D600 400мм', unit: 'м²', price: 450, category: 'masonry_full' },
        'wrk_mry_gas_utip': { name: 'U-блок газобетонный (лоток)', unit: 'шт', price: 100, category: 'masonry_full' },

        // === ПЕНОБЕТОН ===
        'wrk_mry_foam_200': { name: 'Пенобетон D600 200мм', unit: 'м²', price: 180, category: 'masonry_full' },
        'wrk_mry_foam_300': { name: 'Пенобетон D600 300мм', unit: 'м²', price: 270, category: 'masonry_full' },
        'wrk_mry_foam_400': { name: 'Пенобетон D600 400мм', unit: 'м²', price: 360, category: 'masonry_full' },

        // === КЕРАМИЧЕСКИЕ БЛОКИ ===
        'wrk_mry_ceramic_250': { name: 'Керамический блок 250мм', unit: 'м²', price: 350, category: 'masonry_full' },
        'wrk_mry_ceramic_300': { name: 'Керамический блок 300мм', unit: 'м²', price: 400, category: 'masonry_full' },
        'wrk_mry_ceramic_380': { name: 'Керамический блок 380мм', unit: 'м²', price: 500, category: 'masonry_full' },
        'wrk_mry_ceramic_440': { name: 'Керамический блок 440мм', unit: 'м²', price: 600, category: 'masonry_full' },
        'wrk_mry_ceramic_510': { name: 'Керамический блок 510мм', unit: 'м²', price: 700, category: 'masonry_full' },

        // === КЕРАМЗИТОБЕТОН ===
        'wrk_mry_keramzit_190': { name: 'Керамзитобетонный блок 190мм', unit: 'м²', price: 180, category: 'masonry_full' },
        'wrk_mry_keramzit_390': { name: 'Керамзитобетонный блок 390мм', unit: 'м²', price: 350, category: 'masonry_full' },
        'wrk_mry_keramzit_190_full': { name: 'Керамзитобетон полнотелый 190мм', unit: 'м²', price: 220, category: 'masonry_full' },

        // === ШЛАКОБЛОК ===
        'wrk_mry_slag_190': { name: 'Шлакоблок 190мм', unit: 'м²', price: 150, category: 'masonry_full' },
        'wrk_mry_slag_390': { name: 'Шлакоблок 390мм', unit: 'м²', price: 280, category: 'masonry_full' },

        // === ПОЛИСТИРОЛБЕТОН ===
        'wrk_mry_polystyr_200': { name: 'Полистиролбетон 200мм', unit: 'м²', price: 200, category: 'masonry_full' },
        'wrk_mry_polystyr_300': { name: 'Полистиролбетон 300мм', unit: 'м²', price: 300, category: 'masonry_full' },
        'wrk_mry_polystyr_400': { name: 'Полистиролбетон 400мм', unit: 'м²', price: 400, category: 'masonry_full' },

        // === КЛАДОЧНЫЕ РАСТВОРЫ ===
        'wrk_mry_mortar_m100': { name: 'Раствор кладочный М100', unit: 'м³', price: 2000, category: 'masonry_full' },
        'wrk_mry_mortar_m150': { name: 'Раствор кладочный М150', unit: 'м³', price: 2500, category: 'masonry_full' },
        'wrk_mry_mortar_m200': { name: 'Раствор кладочный М200', unit: 'м³', price: 3000, category: 'masonry_full' },
        'wrk_mry_glue_gas': { name: 'Клей для газобетона (кладка)', unit: 'мешок', price: 50, category: 'masonry_full' },
        'wrk_mry_glue_ceramic': { name: 'Клей для керамич. блоков', unit: 'мешок', price: 60, category: 'masonry_full' },
        'wrk_mry_foam_glue': { name: 'Клей-пена для кладки', unit: 'баллон', price: 30, category: 'masonry_full' },

        // === ПЕРЕМЫЧКИ ===
        'wrk_mry_lintel_concrete_120': { name: 'Перемычка ж/б 120×140мм', unit: 'шт', price: 200, category: 'masonry_full' },
        'wrk_mry_lintel_concrete_250': { name: 'Перемычка ж/б 250×140мм', unit: 'шт', price: 300, category: 'masonry_full' },
        'wrk_mry_lintel_gas': { name: 'Перемычка газобетонная', unit: 'шт', price: 200, category: 'masonry_full' },
        'wrk_mry_lintel_ublock': { name: 'Перемычка из U-блоков', unit: 'м.п.', price: 200, category: 'masonry_full' },
        'wrk_mry_lintel_steel': { name: 'Перемычка стальная (уголок)', unit: 'шт', price: 300, category: 'masonry_full' },
        'wrk_mry_lintel_brick': { name: 'Перемычка кирпичная (арочная)', unit: 'шт', price: 500, category: 'masonry_full' },

        // === АРМОПОЯС ===
        'wrk_mry_belt_300x200': { name: 'Армопояс 300×200мм', unit: 'м.п.', price: 400, category: 'masonry_full' },
        'wrk_mry_belt_400x200': { name: 'Армопояс 400×200мм', unit: 'м.п.', price: 500, category: 'masonry_full' },
        'wrk_mry_belt_rebar': { name: 'Армирование пояса (каркас)', unit: 'м.п.', price: 100, category: 'masonry_full' },

        // Кладочная арматура
        'wrk_mry_mesh_50x50_3': { name: 'Кладочная сетка 50×50 Ø3мм', unit: 'м²', price: 10, category: 'masonry_full' },
        'wrk_mry_mesh_50x50_4': { name: 'Кладочная сетка 50×50 Ø4мм', unit: 'м²', price: 15, category: 'masonry_full' },
        'wrk_mry_rebar_8': { name: 'Кладочная арматура Ø8мм', unit: 'м.п.', price: 5, category: 'masonry_full' },
        'wrk_mry_rebar_10': { name: 'Кладочная арматура Ø10мм', unit: 'м.п.', price: 7, category: 'masonry_full' },

        // === ПЕРЕГОРОДКИ ===
        'wrk_mry_part_brick_65': { name: 'Перегородка кирпич на ребро', unit: 'м²', price: 250, category: 'masonry_full' },
        'wrk_mry_part_brick_120': { name: 'Перегородка кирпич 120мм', unit: 'м²', price: 300, category: 'masonry_full' },
        'wrk_mry_part_gas_75': { name: 'Перегородка газобетон 75мм', unit: 'м²', price: 120, category: 'masonry_full' },
        'wrk_mry_part_gas_100': { name: 'Перегородка газобетон 100мм', unit: 'м²', price: 150, category: 'masonry_full' },
        'wrk_mry_part_gas_150': { name: 'Перегородка газобетон 150мм', unit: 'м²', price: 200, category: 'masonry_full' },
        'wrk_mry_part_gas_200': { name: 'Перегородка газобетон 200мм', unit: 'м²', price: 250, category: 'masonry_full' },
        'wrk_mry_part_pzgp_80': { name: 'Перегородка пазогребн. ПГП 80мм', unit: 'м²', price: 150, category: 'masonry_full' },
        'wrk_mry_part_pzgp_100': { name: 'Перегородка пазогребн. ПГП 100мм', unit: 'м²', price: 180, category: 'masonry_full' },
        'wrk_mry_part_glass_block': { name: 'Перегородка из стеклоблоков', unit: 'м²', price: 500, category: 'masonry_full' }
    };
})();
