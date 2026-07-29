// === ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ — молдинги, колонны, карнизы, ниши, потолочные розетки (50 поз.) ===
(function () {
    window.AI_WRK_DECOR_ELEM = {
        // === ПОТОЛОЧНЫЕ ЭЛЕМЕНТЫ === 1-10
        'wrk_de_cornice_pu_50': { name: 'Карниз потолочный ПУ (50мм)', unit: 'м.п.', price: 350, category: 'decorelem' },
        'wrk_de_cornice_pu_100': { name: 'Карниз потолочный ПУ (100мм)', unit: 'м.п.', price: 550, category: 'decorelem' },
        'wrk_de_cornice_pu_150': { name: 'Карниз потолочный ПУ (150мм)', unit: 'м.п.', price: 850, category: 'decorelem' },
        'wrk_de_cornice_pu_200': { name: 'Карниз потолочный ПУ (200мм)', unit: 'м.п.', price: 1200, category: 'decorelem' },
        'wrk_de_cornice_gipsum': { name: 'Карниз гипсовый (по модели)', unit: 'м.п.', price: 2500, category: 'decorelem' },
        'wrk_de_rosette_pu_400': { name: 'Розетка потолочная ПУ Ø400', unit: 'шт', price: 550, category: 'decorelem' },
        'wrk_de_rosette_pu_600': { name: 'Розетка потолочная ПУ Ø600', unit: 'шт', price: 850, category: 'decorelem' },
        'wrk_de_rosette_pu_800': { name: 'Розетка потолочная ПУ Ø800', unit: 'шт', price: 1500, category: 'decorelem' },
        'wrk_de_rosette_gipsum': { name: 'Розетка потолочная гипсовая', unit: 'шт', price: 3500, category: 'decorelem' },
        'wrk_de_beam_decor': { name: 'Декоративная балка (полиуретан)', unit: 'м.п.', price: 1500, category: 'decorelem' },
        // === СТЕНОВЫЕ МОЛДИНГИ === 11-20
        'wrk_de_molding_pu_30': { name: 'Молдинг ПУ (30мм)', unit: 'м.п.', price: 250, category: 'decorelem' },
        'wrk_de_molding_pu_50': { name: 'Молдинг ПУ (50мм)', unit: 'м.п.', price: 350, category: 'decorelem' },
        'wrk_de_molding_pu_80': { name: 'Молдинг ПУ (80мм)', unit: 'м.п.', price: 550, category: 'decorelem' },
        'wrk_de_molding_gipsum': { name: 'Молдинг гипсовый', unit: 'м.п.', price: 1500, category: 'decorelem' },
        'wrk_de_panel_wall_pu': { name: 'Стеновая 3D панель (ПУ)', unit: 'м²', price: 1500, category: 'decorelem' },
        'wrk_de_panel_wall_gips': { name: 'Стеновая 3D панель (гипс)', unit: 'м²', price: 2500, category: 'decorelem' },
        'wrk_de_panel_wall_mdf': { name: 'Стеновая панель (МДФ шпон)', unit: 'м²', price: 3500, category: 'decorelem' },
        'wrk_de_panel_wall_wood': { name: 'Стеновая панель буазери (дерево)', unit: 'м²', price: 8500, category: 'decorelem' },
        'wrk_de_frame_wall': { name: 'Рамка декоративная на стену', unit: 'шт', price: 1500, category: 'decorelem' },
        'wrk_de_niche_gkl': { name: 'Декоративная ниша из ГКЛ', unit: 'шт', price: 5500, category: 'decorelem' },
        // === КОЛОННЫ / ПИЛЯСТРЫ === 21-28
        'wrk_de_column_pu_200': { name: 'Колонна ПУ Ø200', unit: 'м.п.', price: 2500, category: 'decorelem' },
        'wrk_de_column_pu_300': { name: 'Колонна ПУ Ø300', unit: 'м.п.', price: 3500, category: 'decorelem' },
        'wrk_de_column_gipsum': { name: 'Колонна гипсовая', unit: 'м.п.', price: 5500, category: 'decorelem' },
        'wrk_de_column_marble': { name: 'Колонна из натурального камня', unit: 'м.п.', price: 25000, category: 'decorelem' },
        'wrk_de_capital_pu': { name: 'Капитель ПУ', unit: 'шт', price: 1500, category: 'decorelem' },
        'wrk_de_capital_gipsum': { name: 'Капитель гипсовая', unit: 'шт', price: 5500, category: 'decorelem' },
        'wrk_de_pilaster_pu': { name: 'Пилястра ПУ', unit: 'м.п.', price: 1500, category: 'decorelem' },
        'wrk_de_pilaster_gipsum': { name: 'Пилястра гипсовая', unit: 'м.п.', price: 3500, category: 'decorelem' },
        // === ПЛИНТУСА === 29-34
        'wrk_de_baseboard_mdf_60': { name: 'Плинтус напольный МДФ (60мм)', unit: 'м.п.', price: 120, category: 'decorelem' },
        'wrk_de_baseboard_mdf_100': { name: 'Плинтус напольный МДФ (100мм)', unit: 'м.п.', price: 200, category: 'decorelem' },
        'wrk_de_baseboard_mdf_150': { name: 'Плинтус напольный МДФ (150мм)', unit: 'м.п.', price: 350, category: 'decorelem' },
        'wrk_de_baseboard_wood': { name: 'Плинтус деревянный (массив)', unit: 'м.п.', price: 550, category: 'decorelem' },
        'wrk_de_baseboard_alu': { name: 'Плинтус алюминиевый', unit: 'м.п.', price: 350, category: 'decorelem' },
        'wrk_de_baseboard_hidden': { name: 'Плинтус скрытого монтажа', unit: 'м.п.', price: 550, category: 'decorelem' },
        // === ПОТОЛОЧНЫЕ КОНСТРУКЦИИ === 35-40
        'wrk_de_coffer_gkl': { name: 'Кессонный потолок (ГКЛ)', unit: 'м²', price: 3500, category: 'decorelem' },
        'wrk_de_coffer_wood': { name: 'Кессонный потолок (дерево)', unit: 'м²', price: 8500, category: 'decorelem' },
        'wrk_de_coffer_pu': { name: 'Кессонный потолок (ПУ)', unit: 'м²', price: 2500, category: 'decorelem' },
        'wrk_de_stretch_backlit': { name: 'Световой натяжной потолок', unit: 'м²', price: 2500, category: 'decorelem' },
        'wrk_de_stretch_star': { name: 'Натяжной потолок «звёздное небо»', unit: 'м²', price: 3500, category: 'decorelem' },
        'wrk_de_wood_slat_ceil': { name: 'Реечный потолок (деревянные рейки)', unit: 'м²', price: 3500, category: 'decorelem' },
        // === ДЕКОР ФАСАД === 41-46
        'wrk_de_facade_cornice_pu': { name: 'Фасадный карниз (ПУ)', unit: 'м.п.', price: 1500, category: 'decorelem' },
        'wrk_de_facade_cornice_eps': { name: 'Фасадный карниз (EPS + покрытие)', unit: 'м.п.', price: 850, category: 'decorelem' },
        'wrk_de_facade_rustic': { name: 'Руст фасадный', unit: 'м.п.', price: 1200, category: 'decorelem' },
        'wrk_de_facade_keystone': { name: 'Замковый камень', unit: 'шт', price: 1500, category: 'decorelem' },
        'wrk_de_facade_surround': { name: 'Обрамление окна (фасадное)', unit: 'компл.', price: 5500, category: 'decorelem' },
        'wrk_de_facade_balustrade': { name: 'Балюстрада (фасадная)', unit: 'м.п.', price: 5500, category: 'decorelem' },
        // === ОТДЕЛКА === 47-50
        'wrk_de_paint_decor': { name: 'Покраска декоративных элементов', unit: 'м.п.', price: 250, category: 'decorelem' },
        'wrk_de_patina_decor': { name: 'Патинирование элементов', unit: 'м.п.', price: 550, category: 'decorelem' },
        'wrk_de_gold_leaf_decor': { name: 'Золочение элементов', unit: 'дм²', price: 2500, category: 'decorelem' },
        'wrk_de_seal_joint': { name: 'Шпатлёвка стыков декора', unit: 'м.п.', price: 120, category: 'decorelem' }
    };
})();
