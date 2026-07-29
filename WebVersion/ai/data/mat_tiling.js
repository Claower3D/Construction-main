// === ПЛИТКА, КЕРАМОГРАНИТ, КЛЕЙ, ЗАТИРКА (50 позиций) ===
(function () {
    window.AI_MAT_TILING = {
        // Керамическая плитка стеновая
        'tile_wall_20x30': { name: 'Плитка настенная 20×30см (стандарт)', unit: 'м²', price: 2500, category: 'tiling' },
        'tile_wall_25x40': { name: 'Плитка настенная 25×40см', unit: 'м²', price: 3000, category: 'tiling' },
        'tile_wall_20x60': { name: 'Плитка настенная 20×60см', unit: 'м²', price: 3500, category: 'tiling' },
        'tile_wall_25x75': { name: 'Плитка настенная 25×75см', unit: 'м²', price: 4000, category: 'tiling' },
        'tile_wall_30x90': { name: 'Плитка настенная 30×90см', unit: 'м²', price: 5000, category: 'tiling' },

        // Керамическая плитка напольная
        'tile_floor_30x30': { name: 'Плитка напольная 30×30см', unit: 'м²', price: 2800, category: 'tiling' },
        'tile_floor_33x33': { name: 'Плитка напольная 33×33см', unit: 'м²', price: 3200, category: 'tiling' },
        'tile_floor_45x45': { name: 'Плитка напольная 45×45см', unit: 'м²', price: 3800, category: 'tiling' },

        // Керамогранит
        'kgranit_30x30': { name: 'Керамогранит 30×30см (стандарт)', unit: 'м²', price: 3000, category: 'tiling' },
        'kgranit_40x40': { name: 'Керамогранит 40×40см', unit: 'м²', price: 3500, category: 'tiling' },
        'kgranit_60x60': { name: 'Керамогранит 60×60см', unit: 'м²', price: 4500, category: 'tiling' },
        'kgranit_30x60': { name: 'Керамогранит 30×60см', unit: 'м²', price: 4200, category: 'tiling' },
        'kgranit_60x120': { name: 'Керамогранит 60×120см (крупноформат)', unit: 'м²', price: 7000, category: 'tiling' },
        'kgranit_80x80': { name: 'Керамогранит 80×80см', unit: 'м²', price: 5500, category: 'tiling' },
        'kgranit_wood_20x120': { name: 'Керамогранит «под дерево» 20×120см', unit: 'м²', price: 5000, category: 'tiling' },
        'kgranit_marble_60x60': { name: 'Керамогранит «под мрамор» 60×60см', unit: 'м²', price: 6000, category: 'tiling' },

        // Мозаика
        'mosaic_ceramic_30x30': { name: 'Мозаика керамическая 30×30см (на сетке)', unit: 'лист', price: 800, category: 'tiling' },
        'mosaic_glass_30x30': { name: 'Мозаика стеклянная 30×30см (на сетке)', unit: 'лист', price: 1200, category: 'tiling' },
        'mosaic_natural_stone': { name: 'Мозаика из натурального камня', unit: 'лист', price: 2000, category: 'tiling' },

        // Клей плиточный
        'glue_tile_cm11_25': { name: 'Клей плиточный CM-11 (25кг)', unit: 'мешок', price: 1200, category: 'tiling', consumption: 4, consumptionUnit: 'кг/м²' },
        'glue_tile_cm14_25': { name: 'Клей плиточный CM-14 Extra (25кг)', unit: 'мешок', price: 1800, category: 'tiling', consumption: 4.5, consumptionUnit: 'кг/м²' },
        'glue_tile_cm16_25': { name: 'Клей плиточный CM-16 Flex (25кг)', unit: 'мешок', price: 2500, category: 'tiling', consumption: 4, consumptionUnit: 'кг/м²' },
        'glue_tile_cm17_25': { name: 'Клей плиточный CM-17 (25кг)', unit: 'мешок', price: 2800, category: 'tiling', consumption: 4, consumptionUnit: 'кг/м²' },
        'glue_tile_gres_25': { name: 'Клей для керамогранита (25кг)', unit: 'мешок', price: 2200, category: 'tiling', consumption: 5, consumptionUnit: 'кг/м²' },
        'glue_tile_white_25': { name: 'Клей плиточный белый (25кг)', unit: 'мешок', price: 2000, category: 'tiling', consumption: 4, consumptionUnit: 'кг/м²' },
        'glue_tile_fast_25': { name: 'Клей плиточный быстротвердеющий (25кг)', unit: 'мешок', price: 2600, category: 'tiling', consumption: 4, consumptionUnit: 'кг/м²' },
        'glue_tile_outdoor_25': { name: 'Клей для наружных работ (25кг)', unit: 'мешок', price: 2400, category: 'tiling', consumption: 5, consumptionUnit: 'кг/м²' },

        // Затирка
        'grout_cement_2kg': { name: 'Затирка цементная (2кг)', unit: 'шт', price: 500, category: 'tiling' },
        'grout_cement_5kg': { name: 'Затирка цементная (5кг)', unit: 'шт', price: 1100, category: 'tiling' },
        'grout_epoxy_1kg': { name: 'Затирка эпоксидная (1кг)', unit: 'шт', price: 2500, category: 'tiling' },
        'grout_epoxy_2_5kg': { name: 'Затирка эпоксидная (2.5кг)', unit: 'шт', price: 5500, category: 'tiling' },
        'grout_silicone_310ml': { name: 'Затирка-герметик силиконовая (310мл)', unit: 'шт', price: 450, category: 'tiling' },

        // СВП (система выравнивания плитки)
        'svp_clip_1mm': { name: 'СВП зажим 1мм (100шт)', unit: 'уп.', price: 350, category: 'tiling' },
        'svp_clip_1_5mm': { name: 'СВП зажим 1.5мм (100шт)', unit: 'уп.', price: 350, category: 'tiling' },
        'svp_clip_2mm': { name: 'СВП зажим 2мм (100шт)', unit: 'уп.', price: 350, category: 'tiling' },
        'svp_wedge': { name: 'СВП клин (100шт)', unit: 'уп.', price: 400, category: 'tiling' },

        // Крестики
        'cross_tile_1_5mm': { name: 'Крестики для плитки 1.5мм (200шт)', unit: 'уп.', price: 100, category: 'tiling' },
        'cross_tile_2mm': { name: 'Крестики для плитки 2мм (200шт)', unit: 'уп.', price: 100, category: 'tiling' },
        'cross_tile_3mm': { name: 'Крестики для плитки 3мм (200шт)', unit: 'уп.', price: 100, category: 'tiling' },

        // Профили для плитки
        'profile_tile_inner': { name: 'Профиль для плитки внутренний угол (2.5м)', unit: 'шт', price: 350, category: 'tiling' },
        'profile_tile_outer': { name: 'Профиль для плитки наружный угол (2.5м)', unit: 'шт', price: 400, category: 'tiling' },
        'profile_tile_step': { name: 'Профиль для ступеней (2.5м)', unit: 'шт', price: 600, category: 'tiling' },

        // Гидроизоляция под плитку
        'hydro_tile_paste_7kg': { name: 'Гидроизоляция обмазочная для ванной (7кг)', unit: 'ведро', price: 3500, category: 'tiling' },
        'hydro_tile_paste_14kg': { name: 'Гидроизоляция обмазочная для ванной (14кг)', unit: 'ведро', price: 6000, category: 'tiling' },
        'hydro_tape_120mm': { name: 'Лента гидроизоляционная для углов (10м)', unit: 'шт', price: 1500, category: 'tiling' },

        // Бордюры / декоры
        'tile_border_5x30': { name: 'Бордюр керамический 5×30см', unit: 'шт', price: 250, category: 'tiling' },
        'tile_decor_25x40': { name: 'Декор керамический 25×40см', unit: 'шт', price: 600, category: 'tiling' }
    };
})();
