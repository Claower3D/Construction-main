// === ФАЗА 3: СТЯЖКИ, НАЛИВНЫЕ ПОЛЫ, ПОДГОТОВКА ОСНОВАНИЙ, ВСЕ ТИПЫ СТЯЖЕК (130 поз.) ===
(function () {
    window.AI_WRK_SCREED_LEVELING = {
        // === МОКРАЯ СТЯЖКА ===
        'wrk_scr_wet_30': { name: 'Стяжка ЦПС мокрая 30мм', unit: 'м²', price: 80, category: 'screed_leveling' },
        'wrk_scr_wet_40': { name: 'Стяжка ЦПС мокрая 40мм', unit: 'м²', price: 100, category: 'screed_leveling' },
        'wrk_scr_wet_50': { name: 'Стяжка ЦПС мокрая 50мм', unit: 'м²', price: 120, category: 'screed_leveling' },
        'wrk_scr_wet_60': { name: 'Стяжка ЦПС мокрая 60мм', unit: 'м²', price: 140, category: 'screed_leveling' },
        'wrk_scr_wet_70': { name: 'Стяжка ЦПС мокрая 70мм', unit: 'м²', price: 160, category: 'screed_leveling' },
        'wrk_scr_wet_80': { name: 'Стяжка ЦПС мокрая 80мм', unit: 'м²', price: 180, category: 'screed_leveling' },
        'wrk_scr_wet_100': { name: 'Стяжка ЦПС мокрая 100мм', unit: 'м²', price: 220, category: 'screed_leveling' },
        // Полусухая стяжка
        'wrk_scr_semidry_fiber': { name: 'Полусухая стяжка (с фиброй)', unit: 'м²', price: 130, category: 'screed_leveling' },
        // Сухая стяжка
        'wrk_scr_dry_knauf_20': { name: 'Сухая стяжка Knauf 20мм керамзит', unit: 'м²', price: 100, category: 'screed_leveling' },
        'wrk_scr_dry_knauf_40': { name: 'Сухая стяжка Knauf 40мм керамзит', unit: 'м²', price: 120, category: 'screed_leveling' },
        'wrk_scr_dry_knauf_60': { name: 'Сухая стяжка Knauf 60мм керамзит', unit: 'м²', price: 150, category: 'screed_leveling' },
        'wrk_scr_dry_knauf_80': { name: 'Сухая стяжка Knauf 80мм керамзит', unit: 'м²', price: 180, category: 'screed_leveling' },
        'wrk_scr_dry_gvl_2': { name: 'Сухая стяжка ГВЛ (2 листа)', unit: 'м²', price: 80, category: 'screed_leveling' },
        // Наливные полы
        'wrk_scr_selfleveling_3': { name: 'Наливной пол самовыравнив. 3мм', unit: 'м²', price: 50, category: 'screed_leveling' },
        'wrk_scr_selfleveling_5': { name: 'Наливной пол самовыравнив. 5мм', unit: 'м²', price: 70, category: 'screed_leveling' },
        'wrk_scr_selfleveling_10': { name: 'Наливной пол самовыравнив. 10мм', unit: 'м²', price: 100, category: 'screed_leveling' },
        'wrk_scr_selfleveling_20': { name: 'Наливной пол самовыравнив. 20мм', unit: 'м²', price: 150, category: 'screed_leveling' },
        'wrk_scr_selfleveling_30': { name: 'Наливной пол самовыравнив. 30мм', unit: 'м²', price: 200, category: 'screed_leveling' },
        'wrk_scr_selfleveling_thick_30': { name: 'Толстослойный ровнитель 30мм', unit: 'м²', price: 120, category: 'screed_leveling' },
        'wrk_scr_selfleveling_thick_50': { name: 'Толстослойный ровнитель 50мм', unit: 'м²', price: 180, category: 'screed_leveling' },
        'wrk_scr_selfleveling_thick_80': { name: 'Толстослойный ровнитель 80мм', unit: 'м²', price: 250, category: 'screed_leveling' },
        // Керамзит
        'wrk_scr_keramzit_50': { name: 'Засыпка керамзитом 50мм', unit: 'м²', price: 30, category: 'screed_leveling' },
        // Армирование стяжки
        'wrk_scr_mesh_100x100_3': { name: 'Армосетка 100×100 Ø3мм', unit: 'м²', price: 10, category: 'screed_leveling' },
        'wrk_scr_mesh_100x100_4': { name: 'Армосетка 100×100 Ø4мм', unit: 'м²', price: 15, category: 'screed_leveling' },
        'wrk_scr_mesh_150x150_5': { name: 'Армосетка 150×150 Ø5мм', unit: 'м²', price: 20, category: 'screed_leveling' },
        'wrk_scr_fiber': { name: 'Фиброволокно (добавка)', unit: 'м²', price: 5, category: 'screed_leveling' },
        'wrk_scr_film_pe': { name: 'ПЭ плёнка (разделительный слой)', unit: 'м²', price: 3, category: 'screed_leveling' },
        // Тёплый пол (в стяжку)
        'wrk_scr_tp_water_pipe': { name: 'Труба тёплого пола (водяной)', unit: 'м.п.', price: 15, category: 'screed_leveling' },
        'wrk_scr_tp_water_box': { name: 'Шкаф коллекторный ТП', unit: 'шт', price: 500, category: 'screed_leveling' },
        'wrk_scr_tp_elec_cable': { name: 'Электрический тёплый пол (кабель)', unit: 'м²', price: 100, category: 'screed_leveling' },
        'wrk_scr_tp_elec_mat': { name: 'Электрический тёплый пол (мат)', unit: 'м²', price: 120, category: 'screed_leveling' },
        'wrk_scr_tp_ir_film': { name: 'ИК-плёнка тёплый пол', unit: 'м²', price: 100, category: 'screed_leveling' },
        'wrk_scr_tp_thermostat': { name: 'Терморегулятор тёплого пола', unit: 'шт', price: 300, category: 'screed_leveling' },
        'wrk_scr_tp_thermostat_wi': { name: 'Терморегулятор Wi-Fi', unit: 'шт', price: 500, category: 'screed_leveling' },
        // Гидроизоляция под стяжку
        'wrk_scr_hydr_bitum': { name: 'Гидроизоляция под стяжку (битум)', unit: 'м²', price: 30, category: 'screed_leveling' },
        'wrk_scr_hydr_poly': { name: 'Гидроизоляция под стяжку (полимер)', unit: 'м²', price: 50, category: 'screed_leveling' },
        // Звукоизоляция под стяжку
        'wrk_scr_sound_pe_5': { name: 'Звукоизоляция ПЭ 5мм (под стяжку)', unit: 'м²', price: 10, category: 'screed_leveling' },
        'wrk_scr_sound_pe_10': { name: 'Звукоизоляция ПЭ 10мм (под стяжку)', unit: 'м²', price: 15, category: 'screed_leveling' },
        'wrk_scr_sound_mw_20': { name: 'Звукоизоляция минвата 20мм (под стяж.)', unit: 'м²', price: 20, category: 'screed_leveling' },
        'wrk_scr_sound_mw_30': { name: 'Звукоизоляция минвата 30мм (под стяж.)', unit: 'м²', price: 30, category: 'screed_leveling' }
    };
})();
