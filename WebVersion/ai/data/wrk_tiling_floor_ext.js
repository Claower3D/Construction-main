// === ПЛИТОЧНЫЕ И НАПОЛЬНЫЕ РАБОТЫ — керамика, керамогранит, ламинат, паркет, наливные полы (200 поз.) ===
(function () {
    window.AI_WRK_TILING_FLOOR_EXT = {
        // === ПОДГОТОВКА ОСНОВАНИЯ ===
        'wrk_tf_screed_sand_30': { name: 'Стяжка ЦПС h=30мм', unit: 'м²', price: 450, category: 'tiling_floor' },
        'wrk_tf_screed_sand_50': { name: 'Стяжка ЦПС h=50мм', unit: 'м²', price: 650, category: 'tiling_floor' },
        'wrk_tf_screed_sand_70': { name: 'Стяжка ЦПС h=70мм', unit: 'м²', price: 850, category: 'tiling_floor' },
        'wrk_tf_screed_sand_100': { name: 'Стяжка ЦПС h=100мм', unit: 'м²', price: 1100, category: 'tiling_floor' },
        'wrk_tf_screed_semi_dry': { name: 'Полусухая стяжка механизир. h=50мм', unit: 'м²', price: 550, category: 'tiling_floor' },
        'wrk_tf_screed_semi_dry_80': { name: 'Полусухая стяжка механизир. h=80мм', unit: 'м²', price: 750, category: 'tiling_floor' },
        'wrk_tf_selfleveling_3mm': { name: 'Наливной пол самонивелир. 3мм', unit: 'м²', price: 350, category: 'tiling_floor' },
        'wrk_tf_selfleveling_5mm': { name: 'Наливной пол самонивелир. 5мм', unit: 'м²', price: 500, category: 'tiling_floor' },
        'wrk_tf_selfleveling_10mm': { name: 'Наливной пол самонивелир. 10мм', unit: 'м²', price: 750, category: 'tiling_floor' },
        'wrk_tf_selfleveling_20mm': { name: 'Наливной пол самонивелир. 20мм', unit: 'м²', price: 1200, category: 'tiling_floor' },
        'wrk_tf_waterproof_bath_floor': { name: 'Гидроизоляция пола санузла', unit: 'м²', price: 550, category: 'tiling_floor' },
        'wrk_tf_waterproof_bath_wall': { name: 'Гидроизоляция стен санузла (мокрая зона)', unit: 'м²', price: 450, category: 'tiling_floor' },
        // === УКЛАДКА ПЛИТКИ ===
        'wrk_tf_tile_floor_300x300': { name: 'Укладка напольной плитки 300×300', unit: 'м²', price: 1200, category: 'tiling_floor' },
        'wrk_tf_tile_floor_450x450': { name: 'Укладка напольной плитки 450×450', unit: 'м²', price: 1200, category: 'tiling_floor' },
        'wrk_tf_tile_floor_600x600': { name: 'Укладка напольной плитки 600×600', unit: 'м²', price: 1400, category: 'tiling_floor' },
        'wrk_tf_tile_floor_600x1200': { name: 'Укладка керамогранита 600×1200', unit: 'м²', price: 1800, category: 'tiling_floor' },
        'wrk_tf_tile_floor_1200x1200': { name: 'Укладка керамогранита 1200×1200', unit: 'м²', price: 2200, category: 'tiling_floor' },
        'wrk_tf_tile_wall_200x300': { name: 'Укладка настенной плитки 200×300', unit: 'м²', price: 1200, category: 'tiling_floor' },
        'wrk_tf_tile_wall_250x400': { name: 'Укладка настенной плитки 250×400', unit: 'м²', price: 1200, category: 'tiling_floor' },
        'wrk_tf_tile_wall_300x600': { name: 'Укладка настенной плитки 300×600', unit: 'м²', price: 1400, category: 'tiling_floor' },
        'wrk_tf_tile_wall_600x1200': { name: 'Укладка крупноформатной плитки стены', unit: 'м²', price: 2200, category: 'tiling_floor' },
        'wrk_tf_tile_mosaic_glass': { name: 'Укладка стеклянной мозаики', unit: 'м²', price: 4500, category: 'tiling_floor' },
        'wrk_tf_tile_grout': { name: 'Затирка швов (цементная)', unit: 'м²', price: 250, category: 'tiling_floor' },
        'wrk_tf_tile_cut': { name: 'Подрезка плитки (сложный рез)', unit: 'м.п.', price: 350, category: 'tiling_floor' },
        'wrk_tf_tile_drilling': { name: 'Сверление отверстий в плитке', unit: 'шт', price: 350, category: 'tiling_floor' },
        // === ЛАМИНАТ ===
        'wrk_tf_laminate_standard': { name: 'Укладка ламината', unit: 'м²', price: 450, category: 'tiling_floor' },
        'wrk_tf_laminate_herringbone': { name: 'Укладка ламината «ёлочкой»', unit: 'м²', price: 750, category: 'tiling_floor' },
        // === ПАРКЕТ ===
        'wrk_tf_parquet_board': { name: 'Укладка паркетной доски (плавающая)', unit: 'м²', price: 650, category: 'tiling_floor' },
        'wrk_tf_parquet_board_glue': { name: 'Укладка паркетной доски на клей', unit: 'м²', price: 850, category: 'tiling_floor' },
        'wrk_tf_parquet_sand': { name: 'Шлифовка паркета', unit: 'м²', price: 350, category: 'tiling_floor' },
        'wrk_tf_parquet_oil': { name: 'Масло для паркета (2 слоя)', unit: 'м²', price: 550, category: 'tiling_floor' },
        // === ВИНИЛОВЫЙ ПОЛ ===
        'wrk_tf_vinyl_click': { name: 'Укладка виниловой плитки (замковая)', unit: 'м²', price: 450, category: 'tiling_floor' },
        'wrk_tf_vinyl_glue': { name: 'Укладка виниловой плитки (клеевая)', unit: 'м²', price: 550, category: 'tiling_floor' },
        'wrk_tf_lvt_click': { name: 'Укладка кварц-виниловой плитки (SPC)', unit: 'м²', price: 500, category: 'tiling_floor' },
        // === ЛИНОЛЕУМ ===
        'wrk_tf_linoleum_glue': { name: 'Укладка линолеума (на клей)', unit: 'м²', price: 350, category: 'tiling_floor' },
        'wrk_tf_linoleum_loose': { name: 'Укладка линолеума (свободная)', unit: 'м²', price: 250, category: 'tiling_floor' },
        // === КОВРОЛИН ===
        'wrk_tf_carpet_glue': { name: 'Укладка ковролина (на клей)', unit: 'м²', price: 350, category: 'tiling_floor' },
        'wrk_tf_carpet_stretch': { name: 'Укладка ковролина (стретчинг)', unit: 'м²', price: 450, category: 'tiling_floor' },
        'wrk_tf_carpet_tile': { name: 'Укладка ковровой плитки', unit: 'м²', price: 350, category: 'tiling_floor' },
        // === НАЛИВНЫЕ ПОЛИМЕРНЫЕ ПОЛЫ ===
        'wrk_tf_epoxy_floor_2mm': { name: 'Наливной эпоксидный пол 2мм', unit: 'м²', price: 2500, category: 'tiling_floor' },
        'wrk_tf_epoxy_floor_3mm': { name: 'Наливной эпоксидный пол 3мм', unit: 'м²', price: 3500, category: 'tiling_floor' },
        'wrk_tf_polyurethane_floor_2mm': { name: 'Наливной полиуретановый пол 2мм', unit: 'м²', price: 2200, category: 'tiling_floor' },
        'wrk_tf_3d_floor': { name: 'Наливной 3D пол', unit: 'м²', price: 8500, category: 'tiling_floor' },
        'wrk_tf_microcement_floor': { name: 'Пол из микроцемента', unit: 'м²', price: 4500, category: 'tiling_floor' },
        'wrk_tf_terrazzo_floor': { name: 'Пол терраццо', unit: 'м²', price: 5500, category: 'tiling_floor' }
    };
})();
