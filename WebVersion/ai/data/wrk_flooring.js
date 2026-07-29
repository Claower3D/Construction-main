// === КАТАЛОГ РАБОТ: ПОЛЫ — СТЯЖКИ, НАЛИВНЫЕ, ПОКРЫТИЯ (Фаза 1-3: 250 поз.) ===
(function () {
    window.AI_WRK_FLOORING = {
        // Стяжки цементно-песчаные
        'wrk_floor_screed_30': { name: 'Стяжка ц/п 30мм', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_screed_40': { name: 'Стяжка ц/п 40мм', unit: 'м²', price: 250, category: 'flooring' },
        'wrk_floor_screed_50': { name: 'Стяжка ц/п 50мм', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_screed_60': { name: 'Стяжка ц/п 60мм', unit: 'м²', price: 350, category: 'flooring' },
        'wrk_floor_screed_70': { name: 'Стяжка ц/п 70мм', unit: 'м²', price: 400, category: 'flooring' },
        'wrk_floor_screed_80': { name: 'Стяжка ц/п 80мм', unit: 'м²', price: 450, category: 'flooring' },
        'wrk_floor_screed_100': { name: 'Стяжка ц/п 100мм', unit: 'м²', price: 550, category: 'flooring' },
        'wrk_floor_screed_mesh': { name: 'Армирование стяжки сеткой', unit: 'м²', price: 30, category: 'flooring' },
        'wrk_floor_screed_fiber': { name: 'Фиброармирование стяжки', unit: 'м²', price: 15, category: 'flooring' },
        'wrk_floor_screed_beacon': { name: 'Установка маяков (стяжка)', unit: 'м²', price: 30, category: 'flooring' },
        // Полусухая стяжка
        'wrk_floor_semi_dry_70': { name: 'Полусухая стяжка 70мм', unit: 'м²', price: 350, category: 'flooring' },
        'wrk_floor_semi_dry_mech': { name: 'Полусухая стяжка (механизир.)', unit: 'м²', price: 200, category: 'flooring' },
        // Сухая стяжка
        'wrk_floor_dry_knauf_20': { name: 'Сухая стяжка Кнауф 20мм', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_dry_knauf_40': { name: 'Сухая стяжка Кнауф 40мм', unit: 'м²', price: 400, category: 'flooring' },
        'wrk_floor_dry_knauf_60': { name: 'Сухая стяжка Кнауф 60мм', unit: 'м²', price: 500, category: 'flooring' },
        'wrk_floor_dry_knauf_80': { name: 'Сухая стяжка Кнауф 80мм', unit: 'м²', price: 600, category: 'flooring' },
        'wrk_floor_dry_gvl_2layer': { name: 'Элемент пола ГВЛ (2 слоя)', unit: 'м²', price: 200, category: 'flooring' },
        // Наливной пол
        'wrk_floor_selflevl_2': { name: 'Наливной пол 2мм', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_selflevl_fast': { name: 'Быстротвердеющий наливной пол', unit: 'м²', price: 200, category: 'flooring' },
        // Промышленный пол
        'wrk_floor_ind_epoxy_thin': { name: 'Промышл. пол эпоксидный тонкослойн.', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_ind_epoxy_thick': { name: 'Промышл. пол эпоксидный наливной', unit: 'м²', price: 600, category: 'flooring' },
        'wrk_floor_ind_polyur': { name: 'Промышл. пол полиуретановый', unit: 'м²', price: 500, category: 'flooring' },
        'wrk_floor_ind_metilmeta': { name: 'Промышл. пол метилметакрилатн.', unit: 'м²', price: 700, category: 'flooring' },
        'wrk_floor_ind_toplayer': { name: 'Топпинг для бетонного пола', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_ind_polish': { name: 'Полировка бетонного пола', unit: 'м²', price: 150, category: 'flooring' },
        'wrk_floor_ind_impregnation': { name: 'Пропитка бетонного пола', unit: 'м²', price: 80, category: 'flooring' },
        'wrk_floor_ind_quartz': { name: 'Кварцевое покрытие пола', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_ind_3d': { name: '3D наливной пол с рисунком', unit: 'м²', price: 1500, category: 'flooring' },
        // Ламинат
        'wrk_floor_lam_31': { name: 'Ламинат 31 класс (укладка)', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_lam_32': { name: 'Ламинат 32 класс (укладка)', unit: 'м²', price: 120, category: 'flooring' },
        'wrk_floor_lam_33': { name: 'Ламинат 33 класс (укладка)', unit: 'м²', price: 140, category: 'flooring' },
        'wrk_floor_lam_34': { name: 'Ламинат 34 класс (укладка)', unit: 'м²', price: 160, category: 'flooring' },
        'wrk_floor_lam_vinyl_spc': { name: 'SPC ламинат (кварцвиниловый)', unit: 'м²', price: 150, category: 'flooring' },
        'wrk_floor_lam_substrate': { name: 'Укладка подложки', unit: 'м²', price: 20, category: 'flooring' },
        'wrk_floor_lam_diag': { name: 'Ламинат по диагонали', unit: 'м²', price: 180, category: 'flooring' },
        'wrk_floor_lam_herring': { name: 'Ламинат «ёлочка»', unit: 'м²', price: 200, category: 'flooring' },
        // Паркет
        'wrk_floor_parquet_strip': { name: 'Паркет штучный (укладка)', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_parquet_board': { name: 'Паркетная доска (укладка)', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_parquet_mosaic': { name: 'Модульный паркет', unit: 'м²', price: 500, category: 'flooring' },
        'wrk_floor_parquet_herring': { name: 'Паркет «ёлочка»', unit: 'м²', price: 400, category: 'flooring' },
        'wrk_floor_parquet_versail': { name: 'Паркет «версаль»', unit: 'м²', price: 600, category: 'flooring' },
        'wrk_floor_parquet_sand': { name: 'Циклёвка паркета', unit: 'м²', price: 150, category: 'flooring' },
        'wrk_floor_parquet_sand_3': { name: 'Шлифовка паркета (3 прохода)', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_parquet_lacquer_3': { name: 'Лакировка паркета (3 слоя)', unit: 'м²', price: 150, category: 'flooring' },
        'wrk_floor_parquet_oil': { name: 'Масло-воск по паркету', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_parquet_repair': { name: 'Реставрация паркета', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_eng_board': { name: 'Инженерная доска (укладка)', unit: 'м²', price: 250, category: 'flooring' },
        // Линолеум
        'wrk_floor_lino_comm': { name: 'Линолеум коммерческий (укладка)', unit: 'м²', price: 80, category: 'flooring' },
        'wrk_floor_lino_semi': { name: 'Линолеум полукоммерч. (укладка)', unit: 'м²', price: 60, category: 'flooring' },
        'wrk_floor_lino_home': { name: 'Линолеум бытовой (укладка)', unit: 'м²', price: 50, category: 'flooring' },
        'wrk_floor_lino_natural': { name: 'Мармолеум (укладка)', unit: 'м²', price: 120, category: 'flooring' },
        'wrk_floor_lino_weld': { name: 'Сварка швов линолеума', unit: 'м.п.', price: 30, category: 'flooring' },
        // Кварцвинил / LVT / ПВХ плитка
        'wrk_floor_lvt_click': { name: 'Кварцвинил замковый (LVT)', unit: 'м²', price: 150, category: 'flooring' },
        'wrk_floor_lvt_glue': { name: 'Кварцвинил клеевой', unit: 'м²', price: 180, category: 'flooring' },
        'wrk_floor_lvt_loose': { name: 'Кварцвинил свободнолежащий', unit: 'м²', price: 120, category: 'flooring' },
        'wrk_floor_pvc_tile': { name: 'ПВХ плитка (замковая)', unit: 'м²', price: 100, category: 'flooring' },
        // Ковролин
        'wrk_floor_carpet_stretch': { name: 'Ковролин стретчинг', unit: 'м²', price: 80, category: 'flooring' },
        'wrk_floor_carpet_glue': { name: 'Ковролин на клей', unit: 'м²', price: 100, category: 'flooring' },
        'wrk_floor_carpet_tile': { name: 'Ковровая плитка (укладка)', unit: 'м²', price: 120, category: 'flooring' },
        // Пробка
        'wrk_floor_cork_click': { name: 'Пробковый пол замковый', unit: 'м²', price: 200, category: 'flooring' },
        'wrk_floor_cork_glue': { name: 'Пробковый пол клеевой', unit: 'м²', price: 250, category: 'flooring' },
        // Массивная доска
        'wrk_floor_massif_oak': { name: 'Массивная доска дуб (укладка)', unit: 'м²', price: 350, category: 'flooring' },
        'wrk_floor_massif_ash': { name: 'Массивная доска ясень', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_massif_larch': { name: 'Массивная доска лиственница', unit: 'м²', price: 250, category: 'flooring' },
        // Террасная доска
        'wrk_floor_deck_dpk': { name: 'Террасная доска ДПК', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_deck_wood': { name: 'Террасная доска дерево', unit: 'м²', price: 350, category: 'flooring' },
        'wrk_floor_deck_thermo': { name: 'Термодоска террасная', unit: 'м²', price: 400, category: 'flooring' },
        'wrk_floor_deck_lags': { name: 'Лаги для террасы', unit: 'м.п.', price: 80, category: 'flooring' },
        // Плинтусы
        'wrk_floor_baseboard_pvc': { name: 'Плинтус ПВХ напольный', unit: 'м.п.', price: 30, category: 'flooring' },
        'wrk_floor_baseboard_mdf': { name: 'Плинтус МДФ напольный', unit: 'м.п.', price: 40, category: 'flooring' },
        'wrk_floor_baseboard_wood': { name: 'Плинтус деревянный напольный', unit: 'м.п.', price: 60, category: 'flooring' },
        'wrk_floor_baseboard_poly': { name: 'Плинтус полиуретановый напольный', unit: 'м.п.', price: 50, category: 'flooring' },
        'wrk_floor_baseboard_alu': { name: 'Плинтус алюминиевый напольный', unit: 'м.п.', price: 80, category: 'flooring' },
        'wrk_floor_baseboard_hidden': { name: 'Скрытый плинтус (утопленный)', unit: 'м.п.', price: 120, category: 'flooring' },
        // Пороги / профили
        'wrk_floor_threshold': { name: 'Стыковочный порожек (установка)', unit: 'шт', price: 80, category: 'flooring' },
        'wrk_floor_threshold_t': { name: 'Т-образный профиль', unit: 'м.п.', price: 50, category: 'flooring' },
        'wrk_floor_threshold_z': { name: 'Z-образный профиль', unit: 'м.п.', price: 40, category: 'flooring' },
        // Демонтаж полов
        'wrk_floor_demo_board': { name: 'Демонтаж дощатого пола', unit: 'м²', price: 40, category: 'flooring' },
        // Подготовка
        'wrk_floor_prep_clean': { name: 'Очистка основания пола', unit: 'м²', price: 15, category: 'flooring' },
        'wrk_floor_prep_grind': { name: 'Шлифовка бетонного основания', unit: 'м²', price: 50, category: 'flooring' },
        'wrk_floor_prep_primer': { name: 'Грунтовка основания пола', unit: 'м²', price: 20, category: 'flooring' },
        'wrk_floor_prep_film': { name: 'Укладка плёнки ПЭ', unit: 'м²', price: 10, category: 'flooring' },
        // Спортивные покрытия
        'wrk_floor_sport_pvc': { name: 'Спортивное ПВХ покрытие', unit: 'м²', price: 300, category: 'flooring' },
        'wrk_floor_sport_parquet': { name: 'Спортивный паркет', unit: 'м²', price: 600, category: 'flooring' },
        'wrk_floor_sport_playground': { name: 'Резиновое покрытие (детская площадка)', unit: 'м²', price: 350, category: 'flooring' },
        'wrk_floor_sport_tartan': { name: 'Тартановое покрытие (стадион)', unit: 'м²', price: 500, category: 'flooring' }
    };
})();
