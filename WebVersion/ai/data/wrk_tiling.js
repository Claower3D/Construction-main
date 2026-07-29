// === КАТАЛОГ РАБОТ: ПЛИТКА, ПОЛЫ, НАПОЛЬНЫЕ ПОКРЫТИЯ (250 позиций) ===
(function () {
    window.AI_WRK_TILING = {
        // Плитка стены
        'wrk_tile_wall_std': { name: 'Укладка плитки стены (стандарт 20×30)', unit: 'м²', price: 600, category: 'tiling' },
        'wrk_tile_wall_large_30x60': { name: 'Укладка плитки стены 30×60', unit: 'м²', price: 700, category: 'tiling' },
        'wrk_tile_wall_large_60x60': { name: 'Укладка плитки стены 60×60', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_wall_large_60x120': { name: 'Укладка плитки стены 60×120', unit: 'м²', price: 1000, category: 'tiling' },
        'wrk_tile_wall_large_120x120': { name: 'Укладка плитки стены 120×120', unit: 'м²', price: 1200, category: 'tiling' },
        'wrk_tile_wall_large_120x260': { name: 'Укладка крупноформатной плитки 120×260', unit: 'м²', price: 1500, category: 'tiling' },
        'wrk_tile_wall_small_10x10': { name: 'Укладка плитки стены 10×10', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_wall_metro': { name: 'Укладка плитки «кабанчик» (метро)', unit: 'м²', price: 700, category: 'tiling' },
        'wrk_tile_wall_herring': { name: 'Укладка плитки «ёлочка»', unit: 'м²', price: 900, category: 'tiling' },
        'wrk_tile_wall_diagonal': { name: 'Укладка плитки по диагонали', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_wall_pattern': { name: 'Укладка плитки сложный рисунок', unit: 'м²', price: 1000, category: 'tiling' },
        'wrk_tile_wall_mixed': { name: 'Укладка плитки со вставками/бордюрами', unit: 'м²', price: 900, category: 'tiling' },
        'wrk_tile_wall_3d': { name: 'Укладка 3D-плитки', unit: 'м²', price: 1000, category: 'tiling' },
        // Плитка пол
        'wrk_tile_floor_std': { name: 'Укладка плитки пол (стандарт 30×30)', unit: 'м²', price: 600, category: 'tiling' },
        'wrk_tile_floor_30x60': { name: 'Укладка плитки пол 30×60', unit: 'м²', price: 650, category: 'tiling' },
        'wrk_tile_floor_45x45': { name: 'Укладка плитки пол 45×45', unit: 'м²', price: 650, category: 'tiling' },
        'wrk_tile_floor_60x60': { name: 'Укладка плитки пол 60×60', unit: 'м²', price: 700, category: 'tiling' },
        'wrk_tile_floor_60x120': { name: 'Укладка плитки пол 60×120', unit: 'м²', price: 900, category: 'tiling' },
        'wrk_tile_floor_80x80': { name: 'Укладка плитки пол 80×80', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_floor_120x120': { name: 'Укладка плитки пол 120×120', unit: 'м²', price: 1100, category: 'tiling' },
        'wrk_tile_floor_diagonal': { name: 'Укладка плитки пол по диагонали', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_floor_herring': { name: 'Укладка плитки пол «ёлочка»', unit: 'м²', price: 900, category: 'tiling' },
        'wrk_tile_floor_modular': { name: 'Укладка плитки пол (модульная раскладка)', unit: 'м²', price: 1000, category: 'tiling' },
        'wrk_tile_floor_versaille': { name: 'Укладка плитки «Версаль»', unit: 'м²', price: 1200, category: 'tiling' },
        // Керамогранит
        'wrk_tile_granite_floor_60x60': { name: 'Укладка керамогранита 60×60 (пол)', unit: 'м²', price: 700, category: 'tiling' },
        'wrk_tile_granite_floor_60x120': { name: 'Укладка керамогранита 60×120 (пол)', unit: 'м²', price: 900, category: 'tiling' },
        'wrk_tile_granite_wall_60x120': { name: 'Укладка керамогранита 60×120 (стена)', unit: 'м²', price: 1000, category: 'tiling' },
        'wrk_tile_granite_outdoor': { name: 'Укладка керамогранита уличного', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_granite_anti_slip': { name: 'Укладка проплескользящего керамогранита', unit: 'м²', price: 750, category: 'tiling' },
        // Мозаика
        'wrk_tile_mosaic_ceramic': { name: 'Укладка мозаики керамической', unit: 'м²', price: 1200, category: 'tiling' },
        'wrk_tile_mosaic_glass': { name: 'Укладка мозаики стеклянной', unit: 'м²', price: 1500, category: 'tiling' },
        'wrk_tile_mosaic_stone': { name: 'Укладка мозаики каменной', unit: 'м²', price: 1800, category: 'tiling' },
        'wrk_tile_mosaic_metal': { name: 'Укладка мозаики металлической', unit: 'м²', price: 2000, category: 'tiling' },
        'wrk_tile_mosaic_pattern': { name: 'Укладка мозаичного панно', unit: 'м²', price: 2500, category: 'tiling' },
        // Натуральный камень
        'wrk_tile_marble_floor': { name: 'Укладка мрамора (пол)', unit: 'м²', price: 1200, category: 'tiling' },
        'wrk_tile_marble_wall': { name: 'Укладка мрамора (стена)', unit: 'м²', price: 1500, category: 'tiling' },
        'wrk_tile_granite_nat_floor': { name: 'Укладка гранита (пол)', unit: 'м²', price: 1200, category: 'tiling' },
        'wrk_tile_travertine_floor': { name: 'Укладка травертина (пол)', unit: 'м²', price: 1100, category: 'tiling' },
        'wrk_tile_slate_floor': { name: 'Укладка сланца', unit: 'м²', price: 1000, category: 'tiling' },
        'wrk_tile_onyx': { name: 'Укладка оникса', unit: 'м²', price: 3000, category: 'tiling' },
        // Затирка
        'wrk_tile_grout_cement': { name: 'Затирка швов цементная', unit: 'м²', price: 80, category: 'tiling' },
        'wrk_tile_grout_epoxy': { name: 'Затирка швов эпоксидная', unit: 'м²', price: 200, category: 'tiling' },
        'wrk_tile_grout_polyurethane': { name: 'Затирка швов полиуретановая', unit: 'м²', price: 150, category: 'tiling' },
        'wrk_tile_grout_silicone': { name: 'Затирка силиконовая (примыкания)', unit: 'м.п.', price: 30, category: 'tiling' },
        'wrk_tile_grout_regrout': { name: 'Обновление затирки', unit: 'м²', price: 150, category: 'tiling' },
        // Подготовка
        'wrk_tile_waterproof_1': { name: 'ГИ под плитку (обмазочная 1 слой)', unit: 'м²', price: 150, category: 'tiling' },
        'wrk_tile_waterproof_2': { name: 'ГИ под плитку (обмазочная 2 слоя)', unit: 'м²', price: 250, category: 'tiling' },
        'wrk_tile_waterproof_band': { name: 'Гидроизоляционная лента (углы)', unit: 'м.п.', price: 30, category: 'tiling' },
        'wrk_tile_primer': { name: 'Грунтовка под плитку', unit: 'м²', price: 20, category: 'tiling' },
        'wrk_tile_leveling': { name: 'Выравнивание стены под плитку', unit: 'м²', price: 200, category: 'tiling' },
        'wrk_tile_cut_standard': { name: 'Резка плитки (прямая)', unit: 'м.п.', price: 20, category: 'tiling' },
        'wrk_tile_cut_round': { name: 'Выпил отверстия (розетка/труба)', unit: 'шт', price: 50, category: 'tiling' },
        'wrk_tile_cut_45': { name: 'Заусовка плитки под 45°', unit: 'м.п.', price: 100, category: 'tiling' },
        'wrk_tile_trim_pvc': { name: 'Установка ПВХ уголка', unit: 'м.п.', price: 30, category: 'tiling' },
        'wrk_tile_trim_metal': { name: 'Установка металлического уголка', unit: 'м.п.', price: 50, category: 'tiling' },
        // Ступени из плитки
        'wrk_tile_step_floor': { name: 'Облицовка ступеней (проступь)', unit: 'м.п.', price: 500, category: 'tiling' },
        'wrk_tile_step_riser': { name: 'Облицовка подступёнка', unit: 'м.п.', price: 400, category: 'tiling' },
        'wrk_tile_step_full': { name: 'Облицовка ступени полная', unit: 'м.п.', price: 800, category: 'tiling' },
        'wrk_tile_sill': { name: 'Облицовка подоконника плиткой', unit: 'м.п.', price: 400, category: 'tiling' },
        // Клинкер наружный
        'wrk_tile_clinker_socle': { name: 'Облицовка цоколя клинкерной плиткой', unit: 'м²', price: 1000, category: 'tiling' },
        'wrk_tile_clinker_step': { name: 'Облицовка ступеней клинкером', unit: 'м.п.', price: 600, category: 'tiling' },
        // === НАПОЛЬНЫЕ ПОКРЫТИЯ ===
        // Ламинат
        'wrk_floor_laminate_economy': { name: 'Укладка ламината (эконом 31кл)', unit: 'м²', price: 150, category: 'flooring' },
        'wrk_floor_laminate_standard': { name: 'Укладка ламината (стандарт 32кл)', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_laminate_premium': { name: 'Укладка ламината (премиум 33кл)', unit: 'м²', price: 250, category: 'flooring' },
        'wrk_floor_laminate_34': { name: 'Укладка ламината (коммерч 34кл)', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_laminate_diagonal': { name: 'Укладка ламината по диагонали', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_laminate_herring': { name: 'Укладка ламината «ёлочка»', unit: 'м²', price: 350, category: 'flooring' },
        'wrk_floor_substrate_pe': { name: 'Укладка подложки ПЭ', unit: 'м²', price: 15, category: 'flooring' },
        'wrk_floor_substrate_xps': { name: 'Укладка подложки XPS', unit: 'м²', price: 25, category: 'flooring' },
        'wrk_floor_substrate_cork': { name: 'Укладка подложки пробковой', unit: 'м²', price: 40, category: 'flooring' },
        'wrk_floor_substrate_quiiet': { name: 'Укладка подложки шумоизоляционной', unit: 'м²', price: 50, category: 'flooring' },
        // Паркетная доска
        'wrk_floor_parquet_board': { name: 'Укладка паркетной доски (замковая)', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_parquet_board_glue': { name: 'Укладка паркетной доски (клеевая)', unit: 'м²', price: 400, category: 'flooring' },
        'wrk_floor_parquet_board_oil': { name: 'Покрытие паркетной доски маслом', unit: 'м²', price: 150, category: 'flooring' },
        // Массивная доска
        'wrk_floor_solid_board': { name: 'Укладка массивной доски', unit: 'м²', price: 500, category: 'flooring' },
        'wrk_floor_solid_board_glue': { name: 'Укладка массивной доски на клей', unit: 'м²', price: 600, category: 'flooring' },
        // Штучный паркет
        'wrk_floor_parquet_piece': { name: 'Укладка штучного паркета (палуба)', unit: 'м²', price: 600, category: 'flooring' },
        'wrk_floor_parquet_herring': { name: 'Укладка штучного паркета «ёлочка»', unit: 'м²', price: 800, category: 'flooring' },
        'wrk_floor_parquet_plait': { name: 'Укладка штучного паркета «плетёнка»', unit: 'м²', price: 1000, category: 'flooring' },
        'wrk_floor_parquet_versaille': { name: 'Укладка паркета «Версаль»', unit: 'м²', price: 1200, category: 'flooring' },
        'wrk_floor_parquet_art': { name: 'Укладка художественного паркета', unit: 'м²', price: 2000, category: 'flooring' },
        // Циклёвка
        'wrk_floor_parquet_oil': { name: 'Покрытие паркета маслом', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_parquet_putty': { name: 'Шпаклёвка щелей паркета', unit: 'м²', price: 100, category: 'flooring' },
        // SPC / виниловая плитка
        'wrk_floor_spc_click': { name: 'Укладка SPC-плитки (замковая)', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_spc_glue': { name: 'Укладка SPC-плитки (клеевая)', unit: 'м²', price: 250, category: 'flooring' },
        'wrk_floor_lvt_click': { name: 'Укладка LVT (замковая)', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_lvt_glue': { name: 'Укладка LVT (клеевая)', unit: 'м²', price: 250, category: 'flooring' },
        'wrk_floor_quartz_vinyl': { name: 'Укладка кварц-виниловой плитки', unit: 'м²', price: 200, category: 'flooring' },
        // Линолеум
        'wrk_floor_lino_domestic': { name: 'Укладка линолеума бытового', unit: 'м²', price: 80, category: 'flooring' },
        'wrk_floor_lino_semcomm': { name: 'Укладка линолеума полукоммерческого', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_lino_commercial': { name: 'Укладка линолеума коммерческого', unit: 'м²', price: 120, category: 'flooring' },
        'wrk_floor_lino_glue': { name: 'Укладка линолеума на клей', unit: 'м²', price: 120, category: 'flooring' },
        'wrk_floor_lino_weld_cold': { name: 'Сварка линолеума (холодная)', unit: 'м.п.', price: 30, category: 'flooring' },
        'wrk_floor_lino_weld_hot': { name: 'Сварка линолеума (горячая)', unit: 'м.п.', price: 50, category: 'flooring' },
        // Ковролин
        'wrk_floor_carpet_loose': { name: 'Укладка ковролина свободная', unit: 'м²', price: 60, category: 'flooring' },
        'wrk_floor_carpet_stretch': { name: 'Укладка ковролина стретчинг', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_carpet_glue': { name: 'Укладка ковролина на клей', unit: 'м²', price: 100, category: 'flooring' },
        // Террасная доска / ДПК
        'wrk_floor_decking_wpc': { name: 'Укладка террасной доски ДПК', unit: 'м²', price: 500, category: 'flooring' },
        'wrk_floor_decking_wood': { name: 'Укладка террасной доски (дерево)', unit: 'м²', price: 500, category: 'flooring' },
        'wrk_floor_decking_frame': { name: 'Устройство лаг/каркаса под террасу', unit: 'м²', price: 200, category: 'flooring' },
        // Плинтуса
        'wrk_floor_plinth_hidden': { name: 'Установка скрытого плинтуса', unit: 'м.п.', price: 150, category: 'flooring' },
        'wrk_floor_plinth_tile': { name: 'Установка плинтуса из плитки', unit: 'м.п.', price: 100, category: 'flooring' },
        // Порожки
        'wrk_floor_threshold_alu': { name: 'Установка порожка алюминиевого', unit: 'шт', price: 100, category: 'flooring' },
        'wrk_floor_threshold_hidden': { name: 'Установка скрытого стыковочного профиля', unit: 'м.п.', price: 200, category: 'flooring' },
        // Тротуарная плитка
        'wrk_tile_paver_simple': { name: 'Укладка трот. плитки (простая)', unit: 'м²', price: 400, category: 'tiling' },
        'wrk_tile_paver_figur': { name: 'Укладка трот. плитки (фигурная)', unit: 'м²', price: 500, category: 'tiling' },
        'wrk_tile_paver_granite': { name: 'Укладка брусчатки (гранитная)', unit: 'м²', price: 800, category: 'tiling' },
        'wrk_tile_paver_concrete': { name: 'Укладка бетонной плитки', unit: 'м²', price: 400, category: 'tiling' },
        'wrk_tile_paver_base': { name: 'Подготовка основания (трот. плитка)', unit: 'м²', price: 200, category: 'tiling' },
        'wrk_tile_curb_large': { name: 'Установка дорожного бордюра', unit: 'м.п.', price: 200, category: 'tiling' },
        // Пробковый пол
        'wrk_floor_cork_click': { name: 'Укладка пробкового пола (замковый)', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_cork_glue': { name: 'Укладка пробкового пола (клеевой)', unit: 'м²', price: 400, category: 'flooring' },
        // Наливные полы (декоративные)
        'wrk_floor_epoxy_1color': { name: 'Эпоксидный наливной пол (1 цвет)', unit: 'м²', price: 800, category: 'flooring' },
        'wrk_floor_epoxy_3d': { name: 'Эпоксидный 3D-пол', unit: 'м²', price: 2000, category: 'flooring' },
        'wrk_floor_epoxy_flake': { name: 'Эпоксидный пол с чипсами', unit: 'м²', price: 1000, category: 'flooring' },
    };
})();
