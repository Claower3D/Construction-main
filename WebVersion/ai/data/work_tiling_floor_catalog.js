// === КАТАЛОГ РАБОТ: ПЛИТОЧНЫЕ И НАПОЛЬНЫЕ РАБОТЫ (70 позиций) ===
(function () {
    window.AI_WORK_TILING_FLOOR_CATALOG = {
        // Укладка плитки на стены
        'work_tile_wall_std': { name: 'Укладка настенной плитки (стандарт)', unit: 'м²', price: 800, category: 'work_tiling' },
        'work_tile_wall_large': { name: 'Укладка крупноформатной плитки на стену (>60см)', unit: 'м²', price: 1200, category: 'work_tiling' },
        'work_tile_wall_mosaic': { name: 'Укладка мозаики на стену', unit: 'м²', price: 1500, category: 'work_tiling' },
        'work_tile_wall_diagonal': { name: 'Укладка плитки по диагонали (стена)', unit: 'м²', price: 1000, category: 'work_tiling' },
        'work_tile_wall_pattern': { name: 'Укладка плитки с рисунком/декором', unit: 'м²', price: 1200, category: 'work_tiling' },
        'work_tile_wall_subway': { name: 'Укладка плитки «кабанчик» (со смещением)', unit: 'м²', price: 1000, category: 'work_tiling' },
        'work_tile_wall_herringbone': { name: 'Укладка плитки «ёлочкой»', unit: 'м²', price: 1200, category: 'work_tiling' },
        // Укладка плитки на пол
        'work_tile_floor_std': { name: 'Укладка напольной плитки (стандарт)', unit: 'м²', price: 700, category: 'work_tiling' },
        'work_tile_floor_large': { name: 'Укладка крупноформатной плитки на пол (>60см)', unit: 'м²', price: 1000, category: 'work_tiling' },
        'work_tile_floor_diagonal': { name: 'Укладка напольной плитки по диагонали', unit: 'м²', price: 900, category: 'work_tiling' },
        'work_tile_floor_mosaic': { name: 'Укладка мозаики на пол', unit: 'м²', price: 1300, category: 'work_tiling' },
        'work_tile_floor_outdoor': { name: 'Укладка плитки на улице', unit: 'м²', price: 800, category: 'work_tiling' },
        'work_tile_floor_porcelain': { name: 'Укладка керамогранита напольного', unit: 'м²', price: 800, category: 'work_tiling' },
        // Затирка
        'work_tile_grout_std': { name: 'Затирка швов (стандартная)', unit: 'м²', price: 100, category: 'work_tiling' },
        'work_tile_grout_epoxy': { name: 'Затирка швов (эпоксидная)', unit: 'м²', price: 300, category: 'work_tiling' },
        'work_tile_grout_silicone': { name: 'Герметизация примыканий (силикон)', unit: 'м.п.', price: 100, category: 'work_tiling' },
        // Подготовка
        'work_tile_waterproof': { name: 'Гидроизоляция под плитку', unit: 'м²', price: 250, category: 'work_tiling' },
        'work_tile_level_floor': { name: 'Выравнивание пола под плитку', unit: 'м²', price: 200, category: 'work_tiling' },
        'work_tile_primer': { name: 'Грунтовка поверхности под плитку', unit: 'м²', price: 30, category: 'work_tiling' },
        // Плитка — откосы / ниши / подрезка
        'work_tile_slope': { name: 'Облицовка откосов плиткой', unit: 'м.п.', price: 500, category: 'work_tiling' },
        'work_tile_niche': { name: 'Облицовка ниши плиткой', unit: 'шт', price: 2000, category: 'work_tiling' },
        'work_tile_corner_trim': { name: 'Установка уголка для плитки (тримм)', unit: 'м.п.', price: 100, category: 'work_tiling' },
        'work_tile_hole_drill': { name: 'Сверление отверстий в плитке', unit: 'шт', price: 100, category: 'work_tiling' },
        'work_tile_curb_bath': { name: 'Установка бордюра на ванну', unit: 'м.п.', price: 200, category: 'work_tiling' },
        // Демонтаж плитки
        'work_tile_demo_floor': { name: 'Демонтаж напольной плитки', unit: 'м²', price: 200, category: 'work_tiling' },
        'work_tile_demo_wall': { name: 'Демонтаж настенной плитки', unit: 'м²', price: 200, category: 'work_tiling' },
        // === НАПОЛЬНЫЕ ПОКРЫТИЯ ===
        // Ламинат
        'work_floor_laminate': { name: 'Укладка ламината', unit: 'м²', price: 200, category: 'work_floor' },
        'work_floor_laminate_diag': { name: 'Укладка ламината по диагонали', unit: 'м²', price: 300, category: 'work_floor' },
        'work_floor_laminate_herring': { name: 'Укладка ламината «ёлочкой»', unit: 'м²', price: 350, category: 'work_floor' },
        'work_floor_substrate': { name: 'Укладка подложки под ламинат', unit: 'м²', price: 30, category: 'work_floor' },
        // Паркет
        'work_floor_parquet_board': { name: 'Укладка паркетной доски', unit: 'м²', price: 300, category: 'work_floor' },
        'work_floor_parquet_classic': { name: 'Укладка штучного паркета', unit: 'м²', price: 500, category: 'work_floor' },
        'work_floor_parquet_herring': { name: 'Укладка паркета «ёлочкой»', unit: 'м²', price: 600, category: 'work_floor' },
        'work_floor_parquet_modular': { name: 'Укладка модульного паркета', unit: 'м²', price: 700, category: 'work_floor' },
        'work_floor_parquet_sand': { name: 'Циклёвка паркета', unit: 'м²', price: 200, category: 'work_floor' },
        'work_floor_parquet_lacquer': { name: 'Лакировка паркета', unit: 'м²', price: 150, category: 'work_floor' },
        'work_floor_parquet_oil': { name: 'Покрытие паркета маслом', unit: 'м²', price: 200, category: 'work_floor' },
        // Линолеум / ковролин
        'work_floor_linoleum': { name: 'Укладка линолеума', unit: 'м²', price: 150, category: 'work_floor' },
        'work_floor_linoleum_weld': { name: 'Сварка швов линолеума', unit: 'м.п.', price: 100, category: 'work_floor' },
        'work_floor_carpet': { name: 'Укладка ковролина', unit: 'м²', price: 150, category: 'work_floor' },
        // Виниловая плитка / SPC
        'work_floor_vinyl_click': { name: 'Укладка виниловой плитки (замковая)', unit: 'м²', price: 250, category: 'work_floor' },
        'work_floor_vinyl_glue': { name: 'Укладка виниловой плитки (клеевая)', unit: 'м²', price: 300, category: 'work_floor' },
        'work_floor_spc': { name: 'Укладка SPC-ламината', unit: 'м²', price: 250, category: 'work_floor' },
        // Массивная доска
        'work_floor_massiv': { name: 'Укладка массивной доски', unit: 'м²', price: 400, category: 'work_floor' },
        'work_floor_massiv_sand': { name: 'Шлифовка массивной доски', unit: 'м²', price: 200, category: 'work_floor' },
        // Террасная доска
        'work_floor_terrace': { name: 'Монтаж террасной доски', unit: 'м²', price: 500, category: 'work_floor' },
        'work_floor_terrace_lag': { name: 'Монтаж лаг для террасной доски', unit: 'м²', price: 200, category: 'work_floor' },
        // Плинтус
        'work_floor_skirting_pvc': { name: 'Монтаж плинтуса ПВХ', unit: 'м.п.', price: 50, category: 'work_floor' },
        'work_floor_skirting_mdf': { name: 'Монтаж плинтуса МДФ', unit: 'м.п.', price: 80, category: 'work_floor' },
        'work_floor_skirting_wood': { name: 'Монтаж плинтуса деревянного', unit: 'м.п.', price: 100, category: 'work_floor' },
        'work_floor_skirting_hidden': { name: 'Монтаж скрытого плинтуса (алюминий)', unit: 'м.п.', price: 200, category: 'work_floor' },
        // Прочее
        'work_floor_threshold': { name: 'Установка порожка', unit: 'шт', price: 100, category: 'work_floor' },
        'work_floor_demo_old': { name: 'Демонтаж старого напольного покрытия', unit: 'м²', price: 100, category: 'work_floor' },
        'work_floor_demo_plinth': { name: 'Демонтаж старого плинтуса', unit: 'м.п.', price: 20, category: 'work_floor' },
        // Тротуарная плитка
        'work_paver_install': { name: 'Укладка тротуарной плитки', unit: 'м²', price: 500, category: 'work_tiling' },
        'work_paver_base': { name: 'Подготовка основания под плитку', unit: 'м²', price: 300, category: 'work_tiling' },
        'work_paver_curb': { name: 'Установка бордюра тротуарного', unit: 'м.п.', price: 200, category: 'work_tiling' },
        'work_paver_steps': { name: 'Облицовка ступеней плиткой', unit: 'м.п.', price: 800, category: 'work_tiling' },
        'work_paver_demo': { name: 'Демонтаж тротуарной плитки', unit: 'м²', price: 150, category: 'work_tiling' },
        // Каменная облицовка
        'work_stone_floor': { name: 'Укладка натурального камня (пол)', unit: 'м²', price: 1500, category: 'work_tiling' },
        'work_stone_wall': { name: 'Облицовка натуральным камнем (стена)', unit: 'м²', price: 1800, category: 'work_tiling' },
        'work_stone_facade': { name: 'Облицовка фасада камнем', unit: 'м²', price: 2000, category: 'work_tiling' }
    };
})();
