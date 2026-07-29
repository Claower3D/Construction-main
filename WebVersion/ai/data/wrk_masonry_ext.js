// === КАМЕННЫЕ РАБОТЫ — кладка кирпичная, блочная, перегородки, облицовка (200 поз.) ===
(function () {
    window.AI_WRK_MASONRY_EXT = {
        // === КИРПИЧНАЯ КЛАДКА ===
        'wrk_ms_brick_120_simple': { name: 'Кладка стен кирпич 120мм (в полкирпича)', unit: 'м²', price: 1200, category: 'masonry_ext' },
        'wrk_ms_brick_250_simple': { name: 'Кладка стен кирпич 250мм (в один)', unit: 'м²', price: 2200, category: 'masonry_ext' },
        'wrk_ms_brick_380_simple': { name: 'Кладка стен кирпич 380мм (в полтора)', unit: 'м²', price: 3200, category: 'masonry_ext' },
        'wrk_ms_brick_510_simple': { name: 'Кладка стен кирпич 510мм (в два)', unit: 'м²', price: 4200, category: 'masonry_ext' },
        'wrk_ms_brick_640_simple': { name: 'Кладка стен кирпич 640мм (в два с пол.)', unit: 'м²', price: 5200, category: 'masonry_ext' },
        'wrk_ms_brick_face_120': { name: 'Облицовочная кладка 120мм', unit: 'м²', price: 1800, category: 'masonry_ext' },
        'wrk_ms_brick_face_with_insul': { name: 'Облицовочная кладка с утеплителем', unit: 'м²', price: 2500, category: 'masonry_ext' },
        'wrk_ms_brick_clinker': { name: 'Кладка из клинкерного кирпича', unit: 'м²', price: 3500, category: 'masonry_ext' },
        'wrk_ms_brick_arch': { name: 'Кладка арочных элементов', unit: 'м.п.', price: 5500, category: 'masonry_ext' },
        'wrk_ms_brick_column': { name: 'Кладка кирпичных столбов', unit: 'м.п.', price: 3500, category: 'masonry_ext' },
        'wrk_ms_brick_chimney': { name: 'Кладка дымоходов из кирпича', unit: 'м.п.', price: 5500, category: 'masonry_ext' },
        // === БЛОЧНАЯ КЛАДКА ===
        'wrk_ms_block_gas_100': { name: 'Кладка газобетон 100мм', unit: 'м²', price: 850, category: 'masonry_ext' },
        'wrk_ms_block_gas_150': { name: 'Кладка газобетон 150мм', unit: 'м²', price: 1100, category: 'masonry_ext' },
        'wrk_ms_block_gas_200': { name: 'Кладка газобетон 200мм', unit: 'м²', price: 1400, category: 'masonry_ext' },
        'wrk_ms_block_gas_250': { name: 'Кладка газобетон 250мм', unit: 'м²', price: 1700, category: 'masonry_ext' },
        'wrk_ms_block_gas_300': { name: 'Кладка газобетон 300мм', unit: 'м²', price: 2000, category: 'masonry_ext' },
        'wrk_ms_block_gas_375': { name: 'Кладка газобетон 375мм', unit: 'м²', price: 2400, category: 'masonry_ext' },
        'wrk_ms_block_gas_400': { name: 'Кладка газобетон 400мм', unit: 'м²', price: 2600, category: 'masonry_ext' },
        'wrk_ms_block_gas_500': { name: 'Кладка газобетон 500мм', unit: 'м²', price: 3200, category: 'masonry_ext' },
        'wrk_ms_block_ceramic_250': { name: 'Кладка керамоблоков 250мм', unit: 'м²', price: 2200, category: 'masonry_ext' },
        'wrk_ms_block_ceramic_380': { name: 'Кладка керамоблоков 380мм', unit: 'м²', price: 3000, category: 'masonry_ext' },
        'wrk_ms_block_ceramic_440': { name: 'Кладка керамоблоков 440мм', unit: 'м²', price: 3500, category: 'masonry_ext' },
        'wrk_ms_block_ceramic_510': { name: 'Кладка керамоблоков 510мм', unit: 'м²', price: 4000, category: 'masonry_ext' },
        'wrk_ms_block_cinder_190': { name: 'Кладка шлакоблоков 190мм', unit: 'м²', price: 1000, category: 'masonry_ext' },
        'wrk_ms_block_cinder_390': { name: 'Кладка шлакоблоков 390мм', unit: 'м²', price: 1800, category: 'masonry_ext' },
        // === ПЕРЕГОРОДКИ ===
        'wrk_ms_partition_brick_120': { name: 'Перегородка кирпичная 120мм', unit: 'м²', price: 1500, category: 'masonry_ext' },
        'wrk_ms_partition_gas_100': { name: 'Перегородка газобетонная 100мм', unit: 'м²', price: 1000, category: 'masonry_ext' },
        'wrk_ms_partition_gas_150': { name: 'Перегородка газобетонная 150мм', unit: 'м²', price: 1300, category: 'masonry_ext' },
        'wrk_ms_partition_gas_200': { name: 'Перегородка газобетонная 200мм', unit: 'м²', price: 1600, category: 'masonry_ext' },
        'wrk_ms_partition_gypsum_80': { name: 'Перегородка из пазогребневых плит 80мм', unit: 'м²', price: 1200, category: 'masonry_ext' },
        'wrk_ms_partition_gypsum_100': { name: 'Перегородка из пазогребневых плит 100мм', unit: 'м²', price: 1400, category: 'masonry_ext' },
        // === АРМИРОВАНИЕ КЛАДКИ ===
        'wrk_ms_armature_row': { name: 'Армирование кладки (каждые 4 ряда)', unit: 'м.п.', price: 250, category: 'masonry_ext' },
        'wrk_ms_armature_mesh': { name: 'Армирование кладочной сеткой', unit: 'м²', price: 180, category: 'masonry_ext' },
        'wrk_ms_belt_mono': { name: 'Устройство монолитного армопояса', unit: 'м.п.', price: 3500, category: 'masonry_ext' },
        'wrk_ms_lintel_install': { name: 'Установка перемычки (сборная)', unit: 'шт', price: 1500, category: 'masonry_ext' },
        'wrk_ms_lintel_mono': { name: 'Устройство монолитной перемычки', unit: 'м.п.', price: 2500, category: 'masonry_ext' },
        // === ОБЛИЦОВКА КАМНЕМ ===
        'wrk_ms_stone_natural_wall': { name: 'Облицовка натуральным камнем (стены)', unit: 'м²', price: 5500, category: 'masonry_ext' },
        'wrk_ms_stone_natural_floor': { name: 'Облицовка натуральным камнем (пол)', unit: 'м²', price: 4500, category: 'masonry_ext' },
        'wrk_ms_stone_granite_floor': { name: 'Облицовка гранитом (пол)', unit: 'м²', price: 6500, category: 'masonry_ext' },
        'wrk_ms_stone_granite_stairs': { name: 'Облицовка гранитом (ступени)', unit: 'м.п.', price: 8500, category: 'masonry_ext' },
        'wrk_ms_stone_marble_wall': { name: 'Облицовка мрамором (стены)', unit: 'м²', price: 8500, category: 'masonry_ext' },
        'wrk_ms_stone_marble_floor': { name: 'Облицовка мрамором (пол)', unit: 'м²', price: 7500, category: 'masonry_ext' },
        'wrk_ms_stone_decor_facade': { name: 'Облицовка фасада декоративным камнем', unit: 'м²', price: 3500, category: 'masonry_ext' },
        'wrk_ms_stone_decor_interior': { name: 'Облицовка декоративным камнем (интерьер)', unit: 'м²', price: 2500, category: 'masonry_ext' }
    };
})();
