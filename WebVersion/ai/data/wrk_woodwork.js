// === КАТАЛОГ РАБОТ: СТОЛЯРНЫЕ, ДЕРЕВЯННЫЕ КОНСТРУКЦИИ, КАРКАСНЫЙ ДОМ (200 позиций) ===
(function () {
    window.AI_WRK_WOODWORK = {
        // Каркасный дом — стены
        'wrk_wood_frame_wall_150': { name: 'Каркас стены 150мм (доска 50×150)', unit: 'м²', price: 350, category: 'woodwork' },
        'wrk_wood_frame_wall_200': { name: 'Каркас стены 200мм (доска 50×200)', unit: 'м²', price: 400, category: 'woodwork' },
        'wrk_wood_frame_wall_250': { name: 'Каркас стены 250мм', unit: 'м²', price: 450, category: 'woodwork' },
        'wrk_wood_frame_wall_double': { name: 'Каркас стены двойной (перекрёстный)', unit: 'м²', price: 600, category: 'woodwork' },
        // Каркасный дом — перекрытия
        'wrk_wood_frame_floor_200': { name: 'Каркас перекрытия (доска 50×200)', unit: 'м²', price: 400, category: 'woodwork' },
        'wrk_wood_frame_floor_250': { name: 'Каркас перекрытия (доска 50×250)', unit: 'м²', price: 450, category: 'woodwork' },
        'wrk_wood_frame_floor_lvl': { name: 'Каркас перекрытия (LVL балки)', unit: 'м²', price: 500, category: 'woodwork' },
        // Каркасный дом — кровля
        'wrk_wood_frame_roof_rafter': { name: 'Стропильная система каркасн.', unit: 'м²', price: 350, category: 'woodwork' },
        // Обшивка каркасника
        'wrk_wood_frame_sheath_osb_9': { name: 'Обшивка каркаса OSB 9мм', unit: 'м²', price: 100, category: 'woodwork' },
        'wrk_wood_frame_sheath_osb_12': { name: 'Обшивка каркаса OSB 12мм', unit: 'м²', price: 120, category: 'woodwork' },
        'wrk_wood_frame_sheath_izoplat': { name: 'Обшивка каркаса Изоплат', unit: 'м²', price: 130, category: 'woodwork' },
        'wrk_wood_frame_sheath_csb': { name: 'Обшивка каркаса ЦСП', unit: 'м²', price: 150, category: 'woodwork' },
        // Брус / бревно
        'wrk_wood_log_house': { name: 'Сборка сруба из бревна', unit: 'м²', price: 500, category: 'woodwork' },
        'wrk_wood_log_profiled': { name: 'Сборка дома из профил. бруса', unit: 'м²', price: 400, category: 'woodwork' },
        'wrk_wood_log_glulam': { name: 'Сборка дома из клеёного бруса', unit: 'м²', price: 500, category: 'woodwork' },
        'wrk_wood_log_double': { name: 'Сборка стены из двойного бруса', unit: 'м²', price: 600, category: 'woodwork' },
        'wrk_wood_log_caulk': { name: 'Конопатка сруба', unit: 'м.п.', price: 30, category: 'woodwork' },
        'wrk_wood_log_caulk_jute': { name: 'Конопатка джутом (тёплый шов)', unit: 'м.п.', price: 60, category: 'woodwork' },
        // Перегородки деревянные
        'wrk_wood_partition_board': { name: 'Перегородка дощатая', unit: 'м²', price: 200, category: 'woodwork' },
        'wrk_wood_partition_panel': { name: 'Перегородка каркасная (обшивка)', unit: 'м²', price: 300, category: 'woodwork' },
        // Полы деревянные
        'wrk_wood_floor_lags': { name: 'Установка лаг', unit: 'м²', price: 150, category: 'woodwork' },
        'wrk_wood_floor_lags_adjust': { name: 'Регулируемые лаги (на опорах)', unit: 'м²', price: 250, category: 'woodwork' },
        'wrk_wood_floor_board_28': { name: 'Половая доска 28мм (шпунт)', unit: 'м²', price: 200, category: 'woodwork' },
        'wrk_wood_floor_board_36': { name: 'Половая доска 36мм (шпунт)', unit: 'м²', price: 250, category: 'woodwork' },
        'wrk_wood_floor_board_45': { name: 'Половая доска 45мм (шпунт)', unit: 'м²', price: 300, category: 'woodwork' },
        'wrk_wood_floor_plywood_12': { name: 'Настил фанеры 12мм', unit: 'м²', price: 100, category: 'woodwork' },
        'wrk_wood_floor_plywood_18': { name: 'Настил фанеры 18мм', unit: 'м²', price: 130, category: 'woodwork' },
        'wrk_wood_floor_plywood_21': { name: 'Настил фанеры 21мм', unit: 'м²', price: 150, category: 'woodwork' },
        'wrk_wood_floor_osb_15': { name: 'Настил OSB 15мм', unit: 'м²', price: 100, category: 'woodwork' },
        'wrk_wood_floor_osb_18': { name: 'Настил OSB 18мм', unit: 'м²', price: 120, category: 'woodwork' },
        'wrk_wood_floor_osb_22': { name: 'Настил OSB 22мм', unit: 'м²', price: 140, category: 'woodwork' },
        // Потолки деревянные
        'wrk_wood_ceil_board': { name: 'Подшивка потолка доской', unit: 'м²', price: 200, category: 'woodwork' },
        'wrk_wood_ceil_euro_vagonka': { name: 'Подшивка потолка евровагонкой', unit: 'м²', price: 280, category: 'woodwork' },
        'wrk_wood_ceil_imit_brus': { name: 'Подшивка потолка имит. бруса', unit: 'м²', price: 300, category: 'woodwork' },
        // Столярка (окна / двери)
        'wrk_wood_nalichnik_simple': { name: 'Наличники деревянные (простые)', unit: 'м.п.', price: 60, category: 'woodwork' },
        'wrk_wood_nalichnik_carved': { name: 'Наличники резные', unit: 'м.п.', price: 200, category: 'woodwork' },
        'wrk_wood_door_frame': { name: 'Установка деревянной дверной коробки', unit: 'шт', price: 500, category: 'woodwork' },
        'wrk_wood_window_frame': { name: 'Установка деревянной оконной коробки', unit: 'шт', price: 500, category: 'woodwork' },
        // Мебель / встроенные
        'wrk_wood_wardrobe_built': { name: 'Встроенный шкаф-купе (монтаж)', unit: 'м.п.', price: 2000, category: 'woodwork' },
        'wrk_wood_kitchen_install': { name: 'Сборка и монтаж кухни', unit: 'м.п.', price: 1500, category: 'woodwork' },
        'wrk_wood_countertop_wood': { name: 'Столешница деревянная (установка)', unit: 'м.п.', price: 500, category: 'woodwork' },
        'wrk_wood_countertop_stone': { name: 'Столешница камень (установка)', unit: 'м.п.', price: 800, category: 'woodwork' },
        // Баня / сауна
        'wrk_wood_sauna_frame': { name: 'Каркас парилки', unit: 'м²', price: 300, category: 'woodwork' },
        'wrk_wood_sauna_lining_lipa': { name: 'Обшивка парилки вагонкой (липа)', unit: 'м²', price: 400, category: 'woodwork' },
        'wrk_wood_sauna_lining_cedar': { name: 'Обшивка парилки вагонкой (кедр)', unit: 'м²', price: 500, category: 'woodwork' },
        'wrk_wood_sauna_lining_alder': { name: 'Обшивка парилки вагонкой (ольха)', unit: 'м²', price: 380, category: 'woodwork' },
        'wrk_wood_sauna_bench_2tier': { name: 'Полки в парилке (2 яруса)', unit: 'м.п.', price: 800, category: 'woodwork' },
        'wrk_wood_sauna_bench_3tier': { name: 'Полки в парилке (3 яруса)', unit: 'м.п.', price: 1200, category: 'woodwork' },
        'wrk_wood_sauna_door': { name: 'Установка двери сауны (стекло)', unit: 'шт', price: 1500, category: 'woodwork' },
        'wrk_wood_sauna_heater_wood': { name: 'Установка дровяной печи', unit: 'шт', price: 3000, category: 'woodwork' },
        'wrk_wood_sauna_heater_elec': { name: 'Установка электрокаменки', unit: 'шт', price: 2000, category: 'woodwork' },
        'wrk_wood_sauna_chimney': { name: 'Дымоход для бани', unit: 'компл.', price: 5000, category: 'woodwork' },
        'wrk_wood_sauna_ventilation': { name: 'Вентиляция парилки', unit: 'компл.', price: 2000, category: 'woodwork' },
        'wrk_wood_sauna_insul_50': { name: 'Утепление парилки 50мм', unit: 'м²', price: 100, category: 'woodwork' },
        'wrk_wood_sauna_insul_100': { name: 'Утепление парилки 100мм', unit: 'м²', price: 180, category: 'woodwork' },
        // Террасы / беседки
        'wrk_wood_terrace_frame': { name: 'Каркас террасы', unit: 'м²', price: 300, category: 'woodwork' },
        'wrk_wood_terrace_deck': { name: 'Настил террасной доски', unit: 'м²', price: 400, category: 'woodwork' },
        'wrk_wood_gazebo_open': { name: 'Беседка открытая', unit: 'м²', price: 2000, category: 'woodwork' },
        'wrk_wood_gazebo_closed': { name: 'Беседка закрытая', unit: 'м²', price: 3000, category: 'woodwork' },
        // Обработка дерева
        'wrk_wood_fire_retard': { name: 'Огнебиозащита дерева', unit: 'м²', price: 50, category: 'woodwork' },
        'wrk_wood_lacquer': { name: 'Лак для дерева (2 слоя)', unit: 'м²', price: 100, category: 'woodwork' },
        'wrk_wood_paint': { name: 'Покраска дерева (2 слоя)', unit: 'м²', price: 100, category: 'woodwork' },
        'wrk_wood_sand': { name: 'Шлифовка дерева', unit: 'м²', price: 60, category: 'woodwork' },
        // Ремонт деревянных конструкций
        'wrk_wood_repair_beam': { name: 'Замена балки перекрытия', unit: 'шт', price: 2000, category: 'woodwork' },
        'wrk_wood_repair_log': { name: 'Замена венца сруба', unit: 'м.п.', price: 1000, category: 'woodwork' },
        'wrk_wood_repair_floor': { name: 'Замена половой доски', unit: 'м²', price: 200, category: 'woodwork' },
        'wrk_wood_repair_lags': { name: 'Замена лаг пола', unit: 'шт', price: 500, category: 'woodwork' },
        'wrk_wood_lift_house': { name: 'Подъём деревянного дома (домкраты)', unit: 'шт', price: 20000, category: 'woodwork' }
    };
})();
