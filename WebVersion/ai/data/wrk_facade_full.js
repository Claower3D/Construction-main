// === ФАЗА 3: ФАСАДНЫЕ СИСТЕМЫ — ШТУКАТУРНЫЕ, ВЕНТФАСАДЫ, КЛИНКЕР, КАМЕНЬ, ПАНЕЛИ (130 поз.) ===
(function () {
    window.AI_WRK_FACADE_FULL = {
        // === МОКРЫЙ ФАСАД (СФТК) ===
        'wrk_fac_wet_eps_50': { name: 'Мокрый фасад ППС 50мм', unit: 'м²', price: 200, category: 'facade_full' },
        'wrk_fac_wet_eps_100': { name: 'Мокрый фасад ППС 100мм', unit: 'м²', price: 250, category: 'facade_full' },
        'wrk_fac_wet_eps_150': { name: 'Мокрый фасад ППС 150мм', unit: 'м²', price: 300, category: 'facade_full' },
        'wrk_fac_wet_eps_200': { name: 'Мокрый фасад ППС 200мм', unit: 'м²', price: 350, category: 'facade_full' },
        'wrk_fac_wet_mw_50': { name: 'Мокрый фасад минвата 50мм', unit: 'м²', price: 250, category: 'facade_full' },
        'wrk_fac_wet_mw_100': { name: 'Мокрый фасад минвата 100мм', unit: 'м²', price: 300, category: 'facade_full' },
        'wrk_fac_wet_mw_150': { name: 'Мокрый фасад минвата 150мм', unit: 'м²', price: 350, category: 'facade_full' },
        'wrk_fac_wet_mw_200': { name: 'Мокрый фасад минвата 200мм', unit: 'м²', price: 400, category: 'facade_full' },
        'wrk_fac_wet_mesh': { name: 'Армирующий слой (клей + сетка)', unit: 'м²', price: 60, category: 'facade_full' },
        'wrk_fac_wet_primer': { name: 'Грунтовка фасада', unit: 'м²', price: 10, category: 'facade_full' },
        'wrk_fac_wet_finish_koroed': { name: 'Декоративная штукатурка фасада (короед)', unit: 'м²', price: 80, category: 'facade_full' },
        'wrk_fac_wet_finish_barashek': { name: 'Декоративная штукатурка фасада (барашек)', unit: 'м²', price: 80, category: 'facade_full' },
        'wrk_fac_wet_finish_kameshk': { name: 'Декоративная штукатурка (камешковая)', unit: 'м²', price: 100, category: 'facade_full' },
        'wrk_fac_wet_paint': { name: 'Покраска фасада (силиконовая)', unit: 'м²', price: 30, category: 'facade_full' },
        'wrk_fac_wet_anchor_eps': { name: 'Тарельчатый дюбель (ППС)', unit: 'шт', price: 3, category: 'facade_full' },
        'wrk_fac_wet_anchor_mw': { name: 'Тарельчатый дюбель (мин. вата.)', unit: 'шт', price: 5, category: 'facade_full' },
        'wrk_fac_wet_windowsill': { name: 'Отлив фасадный (подоконник)', unit: 'м.п.', price: 30, category: 'facade_full' },

        // === ВЕНТИЛИРУЕМЫЙ ФАСАД ===
        'wrk_fac_vent_bracket': { name: 'Подсистема (кронштейны, профили)', unit: 'м²', price: 150, category: 'facade_full' },
        'wrk_fac_vent_insul_mw_50': { name: 'Утепление вентфасада 50мм', unit: 'м²', price: 50, category: 'facade_full' },
        'wrk_fac_vent_insul_mw_100': { name: 'Утепление вентфасада 100мм', unit: 'м²', price: 80, category: 'facade_full' },
        'wrk_fac_vent_insul_mw_150': { name: 'Утепление вентфасада 150мм', unit: 'м²', price: 110, category: 'facade_full' },
        'wrk_fac_vent_insul_mw_200': { name: 'Утепление вентфасада 200мм', unit: 'м²', price: 140, category: 'facade_full' },
        'wrk_fac_vent_wind_membr': { name: 'Ветрозащита вентфасада', unit: 'м²', price: 15, category: 'facade_full' },
        // Облицовка
        'wrk_fac_vent_keramo_gran': { name: 'Керамогранит (вентфасад)', unit: 'м²', price: 200, category: 'facade_full' },
        'wrk_fac_vent_alucobond': { name: 'Алюкобонд (композит)', unit: 'м²', price: 300, category: 'facade_full' },
        'wrk_fac_vent_hpl': { name: 'HPL-панели', unit: 'м²', price: 300, category: 'facade_full' },
        'wrk_fac_vent_fibro_cement': { name: 'Фиброцементные панели', unit: 'м²', price: 250, category: 'facade_full' },
        'wrk_fac_vent_terracotta': { name: 'Терракотовые панели', unit: 'м²', price: 400, category: 'facade_full' },
        'wrk_fac_vent_metal_cassette': { name: 'Металлические кассеты', unit: 'м²', price: 200, category: 'facade_full' },
        'wrk_fac_vent_nat_stone': { name: 'Натуральный камень (вентфасад)', unit: 'м²', price: 500, category: 'facade_full' },
        'wrk_fac_vent_clinker_tile': { name: 'Клинкерная плитка (вентфасад)', unit: 'м²', price: 350, category: 'facade_full' },

        // === САЙДИНГ ===
        'wrk_fac_siding_vinyl': { name: 'Сайдинг виниловый', unit: 'м²', price: 80, category: 'facade_full' },
        'wrk_fac_siding_metal': { name: 'Сайдинг металлический', unit: 'м²', price: 120, category: 'facade_full' },
        'wrk_fac_siding_fiber_cement': { name: 'Сайдинг фиброцементный', unit: 'м²', price: 200, category: 'facade_full' },
        'wrk_fac_siding_wood': { name: 'Сайдинг деревянный', unit: 'м²', price: 200, category: 'facade_full' },
        'wrk_fac_siding_dpk': { name: 'Сайдинг ДПК (композит)', unit: 'м²', price: 250, category: 'facade_full' },
        'wrk_fac_siding_j_trim': { name: 'J-профиль (сайдинг)', unit: 'м.п.', price: 10, category: 'facade_full' },
        'wrk_fac_siding_corner_ext': { name: 'Угол наружный (сайдинг)', unit: 'м.п.', price: 20, category: 'facade_full' },
        'wrk_fac_siding_corner_int': { name: 'Угол внутренний (сайдинг)', unit: 'м.п.', price: 15, category: 'facade_full' },
        'wrk_fac_siding_starter': { name: 'Стартовая планка (сайдинг)', unit: 'м.п.', price: 10, category: 'facade_full' },
        'wrk_fac_siding_finish': { name: 'Финишная планка (сайдинг)', unit: 'м.п.', price: 10, category: 'facade_full' },

        // === КЛИНКЕР / КИРПИЧ ФАСАДНЫЙ ===
        'wrk_fac_clinker_wall': { name: 'Облицовка клинкерным кирпичом', unit: 'м²', price: 500, category: 'facade_full' },
        'wrk_fac_clinker_tile_glue': { name: 'Клинкерная плитка (на клей)', unit: 'м²', price: 300, category: 'facade_full' },
        'wrk_fac_clinker_thermopanel': { name: 'Клинкерные термопанели', unit: 'м²', price: 400, category: 'facade_full' },

        // === ФАСАДНЫЕ ПАНЕЛИ ===
        'wrk_fac_panel_sandwich_50': { name: 'Сэндвич-панель 50мм (фасад)', unit: 'м²', price: 250, category: 'facade_full' },
        'wrk_fac_panel_sandwich_80': { name: 'Сэндвич-панель 80мм (фасад)', unit: 'м²', price: 300, category: 'facade_full' },
        'wrk_fac_panel_sandwich_100': { name: 'Сэндвич-панель 100мм (фасад)', unit: 'м²', price: 350, category: 'facade_full' },
        'wrk_fac_panel_sandwich_150': { name: 'Сэндвич-панель 150мм (фасад)', unit: 'м²', price: 400, category: 'facade_full' },
        'wrk_fac_panel_profsheet_c8': { name: 'Профлист С8 (фасад)', unit: 'м²', price: 80, category: 'facade_full' },
        'wrk_fac_panel_profsheet_c21': { name: 'Профлист С21 (фасад)', unit: 'м²', price: 100, category: 'facade_full' },

        // === ЦОКОЛЬНЫЕ ПАНЕЛИ ===
        'wrk_fac_base_panel': { name: 'Цокольные фасадные панели', unit: 'м²', price: 150, category: 'facade_full' },
        'wrk_fac_base_stone_art': { name: 'Искусственный камень (цоколь)', unit: 'м²', price: 200, category: 'facade_full' },

        // === ФАСАДНОЕ ОСТЕКЛЕНИЕ ===
        'wrk_fac_curtain_std': { name: 'Фасадное остекление стоечно-ригельное', unit: 'м²', price: 1000, category: 'facade_full' },
        'wrk_fac_curtain_semi': { name: 'Полуструктурное остекление', unit: 'м²', price: 1200, category: 'facade_full' },

        // === ДЕКОР ФАСАДА ===
        'wrk_fac_deco_eps_cornice': { name: 'Карниз из пенопласта (фасадный)', unit: 'м.п.', price: 50, category: 'facade_full' },
        'wrk_fac_deco_eps_pilaster': { name: 'Пилястра из пенопласта', unit: 'м.п.', price: 100, category: 'facade_full' },
        'wrk_fac_deco_eps_frame': { name: 'Обрамление окна (пенопласт)', unit: 'м.п.', price: 40, category: 'facade_full' },
        'wrk_fac_deco_eps_rust': { name: 'Русты из пенопласта', unit: 'м.п.', price: 30, category: 'facade_full' },
        'wrk_fac_deco_grp_cornice': { name: 'Карниз из стеклофибробетона', unit: 'м.п.', price: 200, category: 'facade_full' },
        'wrk_fac_deco_grp_column': { name: 'Колонна из стеклофибробетона', unit: 'м.п.', price: 500, category: 'facade_full' }
    };
})();
