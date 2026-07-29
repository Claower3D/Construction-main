// === ФАСАДНЫЕ МАТЕРИАЛЫ (50 позиций) ===
(function () {
    window.AI_MAT_FACADE = {
        // Сайдинг виниловый
        'siding_vinyl_std': { name: 'Сайдинг виниловый (стандарт)', unit: 'м²', price: 800, category: 'facade' },
        'siding_vinyl_premium': { name: 'Сайдинг виниловый (премиум)', unit: 'м²', price: 1200, category: 'facade' },
        'siding_vinyl_block_house': { name: 'Сайдинг «блок-хаус» виниловый', unit: 'м²', price: 1000, category: 'facade' },
        'siding_vinyl_ship': { name: 'Сайдинг «корабельная доска» виниловый', unit: 'м²', price: 900, category: 'facade' },

        // Сайдинг металлический
        'siding_metal_std': { name: 'Сайдинг металлический (стандарт)', unit: 'м²', price: 1200, category: 'facade' },
        'siding_metal_woodgrain': { name: 'Сайдинг метал. «под дерево» (Printech)', unit: 'м²', price: 1800, category: 'facade' },
        'siding_metal_block_house': { name: 'Сайдинг метал. «блок-хаус»', unit: 'м²', price: 1500, category: 'facade' },

        // Фасадные панели (цокольный сайдинг)
        'panel_facade_stone': { name: 'Панель фасадная «камень» (ПВХ)', unit: 'шт', price: 800, category: 'facade' },
        'panel_facade_brick': { name: 'Панель фасадная «кирпич» (ПВХ)', unit: 'шт', price: 750, category: 'facade' },

        // Фиброцементные панели
        'panel_fibrocement_8mm': { name: 'Панель фиброцементная 8мм', unit: 'м²', price: 2500, category: 'facade' },
        'panel_fibrocement_12mm': { name: 'Панель фиброцементная 12мм', unit: 'м²', price: 3500, category: 'facade' },

        // Керамогранит фасадный
        'kgranit_facade_600x600': { name: 'Керамогранит фасадный 600×600мм', unit: 'м²', price: 3000, category: 'facade' },

        // Термопанели
        'thermopanel_50_clinker': { name: 'Термопанель с клинкерной плиткой 50мм', unit: 'м²', price: 4500, category: 'facade' },
        'thermopanel_80_clinker': { name: 'Термопанель с клинкерной плиткой 80мм', unit: 'м²', price: 5500, category: 'facade' },
        'thermopanel_100_clinker': { name: 'Термопанель с клинкерной плиткой 100мм', unit: 'м²', price: 6500, category: 'facade' },

        // HPL панели
        'hpl_panel_6mm': { name: 'HPL панель фасадная 6мм', unit: 'м²', price: 5000, category: 'facade' },
        'hpl_panel_8mm': { name: 'HPL панель фасадная 8мм', unit: 'м²', price: 6500, category: 'facade' },

        // Подсистема (вентфасад)
        'subsystem_bracket_100': { name: 'Кронштейн фасадный (вылет 100мм)', unit: 'шт', price: 120, category: 'facade' },
        'subsystem_bracket_150': { name: 'Кронштейн фасадный (вылет 150мм)', unit: 'шт', price: 160, category: 'facade' },
        'subsystem_bracket_200': { name: 'Кронштейн фасадный (вылет 200мм)', unit: 'шт', price: 200, category: 'facade' },
        'subsystem_profile_t': { name: 'Профиль Т-образный для вентфасада (3м)', unit: 'шт', price: 800, category: 'facade' },
        'subsystem_profile_l': { name: 'Профиль Г-образный для вентфасада (3м)', unit: 'шт', price: 600, category: 'facade' },
        'subsystem_clip': { name: 'Кляммер (зажим для керамогранита)', unit: 'шт', price: 25, category: 'facade' },
        'paronit_gasket': { name: 'Паронитовая прокладка (терморазрыв)', unit: 'шт', price: 15, category: 'facade' },

        // «Мокрый фасад»
        'facade_glue_mesh_25': { name: 'Клей армирующий фасадный (25кг)', unit: 'мешок', price: 2000, category: 'facade' },
        'facade_mesh_160': { name: 'Сетка фасадная 160 г/м² (50м²)', unit: 'рулон', price: 3500, category: 'facade' },
        'facade_decor_bark_25': { name: 'Декоративная штукатурка фасадная «короед» (25кг)', unit: 'мешок', price: 3000, category: 'facade' },
        'facade_decor_lamb_25': { name: 'Декоративная штукатурка фасадная «шуба» (25кг)', unit: 'мешок', price: 2800, category: 'facade' },
        'facade_primer_silicone': { name: 'Грунтовка фасадная силиконовая (10л)', unit: 'шт', price: 4000, category: 'facade' },
        'facade_paint_silicone': { name: 'Краска фасадная силиконовая (10л)', unit: 'шт', price: 8000, category: 'facade' },
        'facade_profile_start': { name: 'Профиль цокольный стартовый 50мм (2.5м)', unit: 'шт', price: 350, category: 'facade' },
        'facade_profile_start_100': { name: 'Профиль цокольный стартовый 100мм (2.5м)', unit: 'шт', price: 500, category: 'facade' },
        'facade_corner_pvc': { name: 'Профиль угловой ПВХ с сеткой (2.5м)', unit: 'шт', price: 200, category: 'facade' },
        'facade_drop_cap': { name: 'Профиль капельник (2.5м)', unit: 'шт', price: 250, category: 'facade' },

        // Клинкерная плитка
        'clinker_tile_facade': { name: 'Плитка клинкерная фасадная (м²)', unit: 'м²', price: 3500, category: 'facade' },
        'clinker_corner': { name: 'Угловая клинкерная плитка (п.м.)', unit: 'п.м.', price: 800, category: 'facade' },

        // Декоративные элементы фасада
        'facade_molding_eps': { name: 'Молдинг фасадный (пенополистирол, п.м.)', unit: 'п.м.', price: 500, category: 'facade' },
        'facade_cornice_eps': { name: 'Карниз фасадный (пенополистирол, п.м.)', unit: 'п.м.', price: 800, category: 'facade' },
        'facade_rustic_eps': { name: 'Рустовый камень (пенополистирол)', unit: 'шт', price: 600, category: 'facade' },

        // Планкен (фасадная доска)
        'planken_larch': { name: 'Планкен лиственница (фасадная доска)', unit: 'м²', price: 3000, category: 'facade' },
        'planken_dpk': { name: 'Планкен ДПК (фасадная доска)', unit: 'м²', price: 2500, category: 'facade' },

        // Доборные элементы сайдинга
        'siding_j_trim': { name: 'J-профиль (3м)', unit: 'шт', price: 200, category: 'facade' },
        'siding_h_trim': { name: 'H-профиль соединительный (3м)', unit: 'шт', price: 350, category: 'facade' },
        'siding_corner_ext': { name: 'Угол наружный (3м)', unit: 'шт', price: 450, category: 'facade' },
        'siding_corner_int': { name: 'Угол внутренний (3м)', unit: 'шт', price: 400, category: 'facade' },
        'siding_starter': { name: 'Стартовая планка (3м)', unit: 'шт', price: 180, category: 'facade' },
        'siding_finish': { name: 'Финишная планка (3м)', unit: 'шт', price: 180, category: 'facade' }
    };
})();
