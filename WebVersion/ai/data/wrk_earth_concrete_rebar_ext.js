// === ФАЗА 3: РАСШИРЕННЫЕ ЗЕМЛЯНЫЕ, БЕТОННЫЕ, СВАЙНЫЕ, АРМАТУРНЫЕ, ОПАЛУБОЧНЫЕ РАБОТЫ (400 поз.) ===
(function () {
    // === РАСШИРЕННЫЕ ЗЕМЛЯНЫЕ ===
    window.AI_WRK_EARTH_EXT = {
        'wrk_earth_exc_man_1cat': { name: 'Разработка грунта (ручн.) 1 категория', unit: 'м³', price: 300, category: 'earth_ext' },
        'wrk_earth_exc_man_2cat': { name: 'Разработка грунта (ручн.) 2 категория', unit: 'м³', price: 400, category: 'earth_ext' },
        'wrk_earth_exc_man_3cat': { name: 'Разработка грунта (ручн.) 3 категория', unit: 'м³', price: 500, category: 'earth_ext' },
        'wrk_earth_exc_man_4cat': { name: 'Разработка грунта (ручн.) 4 категория', unit: 'м³', price: 700, category: 'earth_ext' },
        'wrk_earth_exc_mech_1cat': { name: 'Разработка грунта (мех.) 1 категория', unit: 'м³', price: 80, category: 'earth_ext' },
        'wrk_earth_exc_mech_2cat': { name: 'Разработка грунта (мех.) 2 категория', unit: 'м³', price: 100, category: 'earth_ext' },
        'wrk_earth_exc_mech_3cat': { name: 'Разработка грунта (мех.) 3 категория', unit: 'м³', price: 130, category: 'earth_ext' },
        'wrk_earth_exc_mech_4cat': { name: 'Разработка грунта (мех.) 4 категория', unit: 'м³', price: 170, category: 'earth_ext' },
        'wrk_earth_pit_1m': { name: 'Котлован 1м глубиной', unit: 'м³', price: 80, category: 'earth_ext' },
        'wrk_earth_pit_2m': { name: 'Котлован 2м глубиной', unit: 'м³', price: 100, category: 'earth_ext' },
        'wrk_earth_pit_3m': { name: 'Котлован 3м глубиной', unit: 'м³', price: 130, category: 'earth_ext' },
        'wrk_earth_pit_5m': { name: 'Котлован 5м глубиной', unit: 'м³', price: 180, category: 'earth_ext' },
        'wrk_earth_backfill_mech': { name: 'Обратная засыпка (механизир.)', unit: 'м³', price: 50, category: 'earth_ext' },
        'wrk_earth_backfill_man': { name: 'Обратная засыпка (ручная)', unit: 'м³', price: 150, category: 'earth_ext' },
        'wrk_earth_compact_plate': { name: 'Уплотнение виброплитой', unit: 'м²', price: 10, category: 'earth_ext' },
        'wrk_earth_compact_roller': { name: 'Уплотнение виброкатком', unit: 'м²', price: 5, category: 'earth_ext' },
        'wrk_earth_compact_frog': { name: 'Уплотнение вибротрамбовкой', unit: 'м²', price: 15, category: 'earth_ext' },
        'wrk_earth_level_laser': { name: 'Планировка по лазеру', unit: 'м²', price: 10, category: 'earth_ext' },
        'wrk_earth_level_bulldozer': { name: 'Планировка бульдозером', unit: 'м²', price: 5, category: 'earth_ext' },
        'wrk_earth_transport_5km': { name: 'Транспортировка грунта до 5км', unit: 'м³', price: 50, category: 'earth_ext' },
        'wrk_earth_transport_10km': { name: 'Транспортировка грунта до 10км', unit: 'м³', price: 80, category: 'earth_ext' },
        'wrk_earth_transport_20km': { name: 'Транспортировка грунта до 20км', unit: 'м³', price: 120, category: 'earth_ext' },
        'wrk_earth_disposal_fee': { name: 'Утилизация грунта (полигон)', unit: 'м³', price: 50, category: 'earth_ext' },
        'wrk_earth_freeze_thaw': { name: 'Разработка мёрзлого грунта', unit: 'м³', price: 500, category: 'earth_ext' },
        'wrk_earth_rock_blast': { name: 'Разработка скального грунта (взрыв.)', unit: 'м³', price: 1000, category: 'earth_ext' },
        'wrk_earth_rock_mech': { name: 'Разработка скального грунта (мех.)', unit: 'м³', price: 500, category: 'earth_ext' },
        'wrk_earth_dewater_open': { name: 'Водопонижение (открытый водоотлив)', unit: 'сутки', price: 5000, category: 'earth_ext' },
        'wrk_earth_dewater_well': { name: 'Водопонижение (иглофильтры)', unit: 'м.п.', price: 1000, category: 'earth_ext' },
        'wrk_earth_sand_bed_5': { name: 'Песчаная подушка 5см', unit: 'м²', price: 10, category: 'earth_ext' },
        'wrk_earth_sand_bed_10': { name: 'Песчаная подушка 10см', unit: 'м²', price: 20, category: 'earth_ext' },
        'wrk_earth_sand_bed_20': { name: 'Песчаная подушка 20см', unit: 'м²', price: 35, category: 'earth_ext' },
        'wrk_earth_sand_bed_30': { name: 'Песчаная подушка 30см', unit: 'м²', price: 50, category: 'earth_ext' },
        'wrk_earth_gravel_bed_10': { name: 'Щебёночная подушка 10см', unit: 'м²', price: 35, category: 'earth_ext' },
        'wrk_earth_gravel_bed_20': { name: 'Щебёночная подушка 20см', unit: 'м²', price: 60, category: 'earth_ext' },
        'wrk_earth_gravel_bed_30': { name: 'Щебёночная подушка 30см', unit: 'м²', price: 90, category: 'earth_ext' }
    };

    // === РАСШИРЕННЫЕ БЕТОННЫЕ РАБОТЫ ===
    window.AI_WRK_CONCRETE_EXT = {
        // Бетонирование по маркам
        'wrk_conc_pour_m100': { name: 'Бетонирование B7.5 (М100)', unit: 'м³', price: 2000, category: 'concrete_ext' },
        'wrk_conc_pour_m150': { name: 'Бетонирование B10 (М150)', unit: 'м³', price: 2200, category: 'concrete_ext' },
        'wrk_conc_pour_m200': { name: 'Бетонирование B15 (М200)', unit: 'м³', price: 2500, category: 'concrete_ext' },
        'wrk_conc_pour_m250': { name: 'Бетонирование B20 (М250)', unit: 'м³', price: 2700, category: 'concrete_ext' },
        'wrk_conc_pour_m300': { name: 'Бетонирование B22.5 (М300)', unit: 'м³', price: 3000, category: 'concrete_ext' },
        'wrk_conc_pour_m350': { name: 'Бетонирование B25 (М350)', unit: 'м³', price: 3300, category: 'concrete_ext' },
        'wrk_conc_pour_m400': { name: 'Бетонирование B30 (М400)', unit: 'м³', price: 3600, category: 'concrete_ext' },
        'wrk_conc_pour_m450': { name: 'Бетонирование B35 (М450)', unit: 'м³', price: 4000, category: 'concrete_ext' },
        'wrk_conc_pour_m500': { name: 'Бетонирование B40 (М500)', unit: 'м³', price: 4500, category: 'concrete_ext' },
        'wrk_conc_pour_pump': { name: 'Подача бетона насосом', unit: 'м³', price: 300, category: 'concrete_ext' },
        'wrk_conc_pour_crane': { name: 'Подача бетона краном (бадья)', unit: 'м³', price: 200, category: 'concrete_ext' },
        // Вибрирование
        'wrk_conc_vibrate_deep': { name: 'Вибрирование глубинное', unit: 'м³', price: 50, category: 'concrete_ext' },
        'wrk_conc_vibrate_surface': { name: 'Вибрирование поверхностное', unit: 'м²', price: 20, category: 'concrete_ext' },
        // Уход за бетоном
        'wrk_conc_cure_compound': { name: 'Уход за бетоном (мембранообразующий)', unit: 'м²', price: 10, category: 'concrete_ext' },
        'wrk_conc_cure_heating': { name: 'Прогрев бетона (электрод)', unit: 'м³', price: 200, category: 'concrete_ext' },
        'wrk_conc_cure_thermos': { name: 'Прогрев бетона (термос)', unit: 'м³', price: 100, category: 'concrete_ext' },
        // Стяжки (расширение)
        'wrk_conc_screed_30': { name: 'Стяжка цементная 30мм', unit: 'м²', price: 80, category: 'concrete_ext' },
        'wrk_conc_screed_40': { name: 'Стяжка цементная 40мм', unit: 'м²', price: 100, category: 'concrete_ext' },
        'wrk_conc_screed_50': { name: 'Стяжка цементная 50мм', unit: 'м²', price: 120, category: 'concrete_ext' },
        'wrk_conc_screed_60': { name: 'Стяжка цементная 60мм', unit: 'м²', price: 140, category: 'concrete_ext' },
        'wrk_conc_screed_80': { name: 'Стяжка цементная 80мм', unit: 'м²', price: 180, category: 'concrete_ext' },
        'wrk_conc_screed_100': { name: 'Стяжка цементная 100мм', unit: 'м²', price: 220, category: 'concrete_ext' },
        'wrk_conc_screed_semi_60': { name: 'Полусухая стяжка 60мм', unit: 'м²', price: 120, category: 'concrete_ext' },
    };

    // === АРМАТУРНЫЕ РАБОТЫ (детально) ===
    window.AI_WRK_REBAR = {
        'wrk_reb_a1_6': { name: 'Армирование Ø6 A-I', unit: 'т', price: 8000, category: 'rebar' },
        'wrk_reb_a1_8': { name: 'Армирование Ø8 A-I', unit: 'т', price: 8000, category: 'rebar' },
        'wrk_reb_a3_8': { name: 'Армирование Ø8 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_10': { name: 'Армирование Ø10 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_12': { name: 'Армирование Ø12 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_14': { name: 'Армирование Ø14 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_16': { name: 'Армирование Ø16 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_18': { name: 'Армирование Ø18 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_20': { name: 'Армирование Ø20 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_22': { name: 'Армирование Ø22 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_25': { name: 'Армирование Ø25 A-III', unit: 'т', price: 9000, category: 'rebar' },
        'wrk_reb_a3_28': { name: 'Армирование Ø28 A-III', unit: 'т', price: 10000, category: 'rebar' },
        'wrk_reb_a3_32': { name: 'Армирование Ø32 A-III', unit: 'т', price: 10000, category: 'rebar' },
        'wrk_reb_a3_36': { name: 'Армирование Ø36 A-III', unit: 'т', price: 10000, category: 'rebar' },
        'wrk_reb_a3_40': { name: 'Армирование Ø40 A-III', unit: 'т', price: 12000, category: 'rebar' },
        'wrk_reb_mesh_3': { name: 'Сетка арматурная Ø3 100×100', unit: 'м²', price: 30, category: 'rebar' },
        'wrk_reb_mesh_4': { name: 'Сетка арматурная Ø4 100×100', unit: 'м²', price: 40, category: 'rebar' },
        'wrk_reb_mesh_5': { name: 'Сетка арматурная Ø5 100×100', unit: 'м²', price: 50, category: 'rebar' },
        'wrk_reb_mesh_6': { name: 'Сетка арматурная Ø6 150×150', unit: 'м²', price: 60, category: 'rebar' },
        'wrk_reb_mesh_8': { name: 'Сетка арматурная Ø8 200×200', unit: 'м²', price: 80, category: 'rebar' },
        'wrk_reb_cage_column': { name: 'Каркас колонны (вязка)', unit: 'шт', price: 500, category: 'rebar' },
        'wrk_reb_cage_beam': { name: 'Каркас балки (вязка)', unit: 'шт', price: 400, category: 'rebar' },
        'wrk_reb_cage_pile': { name: 'Каркас сваи (вязка)', unit: 'шт', price: 300, category: 'rebar' },
        'wrk_reb_spacer': { name: 'Фиксатор защитного слоя', unit: 'шт', price: 1, category: 'rebar' },
        'wrk_reb_coupler_16': { name: 'Муфтовое соединение Ø16мм', unit: 'шт', price: 100, category: 'rebar' },
        'wrk_reb_coupler_20': { name: 'Муфтовое соединение Ø20мм', unit: 'шт', price: 120, category: 'rebar' },
        'wrk_reb_coupler_25': { name: 'Муфтовое соединение Ø25мм', unit: 'шт', price: 150, category: 'rebar' },
        'wrk_reb_coupler_32': { name: 'Муфтовое соединение Ø32мм', unit: 'шт', price: 200, category: 'rebar' }
    };

    // === ОПАЛУБОЧНЫЕ РАБОТЫ (детально) ===
    window.AI_WRK_FORMWORK = {
        // Инвентарная опалубка
        'wrk_frm_wall_peri': { name: 'Опалубка стеновая (Peri)', unit: 'м²', price: 150, category: 'formwork' },
        'wrk_frm_wall_doka': { name: 'Опалубка стеновая (Doka)', unit: 'м²', price: 150, category: 'formwork' },
        'wrk_frm_wall_meva': { name: 'Опалубка стеновая (MEVA)', unit: 'м²', price: 140, category: 'formwork' },
        'wrk_frm_slab_peri': { name: 'Опалубка перекрытия (Peri)', unit: 'м²', price: 100, category: 'formwork' },
        'wrk_frm_slab_doka': { name: 'Опалубка перекрытия (Doka)', unit: 'м²', price: 100, category: 'formwork' },
        'wrk_frm_column_peri': { name: 'Опалубка колонн (Peri)', unit: 'м.п.', price: 300, category: 'formwork' },
        'wrk_frm_column_doka': { name: 'Опалубка колонн (Doka)', unit: 'м.п.', price: 300, category: 'formwork' },
        'wrk_frm_beam_peri': { name: 'Опалубка балок (Peri)', unit: 'м.п.', price: 200, category: 'formwork' },
        // Деревянная обыкновенная
        'wrk_frm_wood_wall': { name: 'Деревянная опалубка стен', unit: 'м²', price: 80, category: 'formwork' },
        'wrk_frm_wood_slab': { name: 'Деревянная опалубка перекрытия', unit: 'м²', price: 60, category: 'formwork' },
        'wrk_frm_wood_found': { name: 'Деревянная опалубка фундамента', unit: 'м²', price: 70, category: 'formwork' },
        // Несъёмная опалубка
        'wrk_frm_perm_eps': { name: 'Несъёмная опалубка EPS', unit: 'м²', price: 200, category: 'formwork' },
        'wrk_frm_perm_cement': { name: 'Несъёмная опалубка ЦСП', unit: 'м²', price: 180, category: 'formwork' },
        'wrk_frm_perm_cob': { name: 'Несъёмная опалубка Вeblock', unit: 'м²', price: 250, category: 'formwork' },
        // Стойки / леса
        'wrk_frm_prop_steel': { name: 'Стойка телескопическая (монтаж)', unit: 'шт', price: 30, category: 'formwork' },
        'wrk_frm_scaffold_frame': { name: 'Леса рамные (монтаж)', unit: 'м²', price: 30, category: 'formwork' },
        'wrk_frm_scaffold_clamp': { name: 'Леса хомутовые (монтаж)', unit: 'м²', price: 40, category: 'formwork' },
        'wrk_frm_scaffold_tower': { name: 'Вышка-тура (монтаж)', unit: 'шт', price: 500, category: 'formwork' },
        'wrk_frm_scaffold_hang': { name: 'Подвесные леса', unit: 'м²', price: 80, category: 'formwork' },
        'wrk_frm_scaffold_net': { name: 'Защитная сетка', unit: 'м²', price: 5, category: 'formwork' }
    };
})();
