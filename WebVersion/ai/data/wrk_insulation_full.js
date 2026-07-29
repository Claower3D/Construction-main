// === ФАЗА 3: УТЕПЛЕНИЕ (ВСЕ ДЕТАЛИ) — ФАСАДЫ, КРОВЛЯ, ПОЛЫ, ТРУБЫ ПО ТОЛЩИНАМ (150 поз.) ===
(function () {
    window.AI_WRK_INSULATION_FULL = {
        // === МИНЕРАЛЬНАЯ ВАТА (ФАСАД СТЕНЫ) ===
        'wrk_ins_mw_wall_50': { name: 'Утепление стен минвата 50мм', unit: 'м²', price: 50, category: 'insulation_full' },
        'wrk_ins_mw_wall_100': { name: 'Утепление стен минвата 100мм', unit: 'м²', price: 80, category: 'insulation_full' },
        'wrk_ins_mw_wall_150': { name: 'Утепление стен минвата 150мм', unit: 'м²', price: 110, category: 'insulation_full' },
        'wrk_ins_mw_wall_200': { name: 'Утепление стен минвата 200мм', unit: 'м²', price: 140, category: 'insulation_full' },
        'wrk_ins_mw_wall_250': { name: 'Утепление стен минвата 250мм', unit: 'м²', price: 170, category: 'insulation_full' },
        'wrk_ins_mw_wall_300': { name: 'Утепление стен минвата 300мм', unit: 'м²', price: 200, category: 'insulation_full' },

        // === ПЕНОПОЛИСТИРОЛ (ППС/EPS) ===
        'wrk_ins_eps_wall_200': { name: 'Утепление стен ППС 200мм', unit: 'м²', price: 90, category: 'insulation_full' },

        // === ЭКСТРУДИРОВАННЫЙ (XPS) ===
        'wrk_ins_xps_found_30': { name: 'Утепление фундамента XPS 30мм', unit: 'м²', price: 30, category: 'insulation_full' },
        'wrk_ins_xps_roof_50': { name: 'Утепление кровли XPS 50мм', unit: 'м²', price: 40, category: 'insulation_full' },
        'wrk_ins_xps_roof_100': { name: 'Утепление кровли XPS 100мм', unit: 'м²', price: 70, category: 'insulation_full' },

        // === PIR/PUR ===
        'wrk_ins_pir_wall_30': { name: 'Утепление PIR-плита 30мм', unit: 'м²', price: 50, category: 'insulation_full' },
        'wrk_ins_pir_wall_50': { name: 'Утепление PIR-плита 50мм', unit: 'м²', price: 70, category: 'insulation_full' },
        'wrk_ins_pir_wall_80': { name: 'Утепление PIR-плита 80мм', unit: 'м²', price: 100, category: 'insulation_full' },
        'wrk_ins_pir_wall_100': { name: 'Утепление PIR-плита 100мм', unit: 'м²', price: 120, category: 'insulation_full' },
        'wrk_ins_pur_spray_30': { name: 'Напыление ППУ 30мм', unit: 'м²', price: 50, category: 'insulation_full' },
        'wrk_ins_pur_spray_50': { name: 'Напыление ППУ 50мм', unit: 'м²', price: 80, category: 'insulation_full' },
        'wrk_ins_pur_spray_80': { name: 'Напыление ППУ 80мм', unit: 'м²', price: 120, category: 'insulation_full' },
        'wrk_ins_pur_spray_100': { name: 'Напыление ППУ 100мм', unit: 'м²', price: 150, category: 'insulation_full' },
        'wrk_ins_pur_spray_150': { name: 'Напыление ППУ 150мм', unit: 'м²', price: 220, category: 'insulation_full' },

        // === ЭКОВАТА ===
        'wrk_ins_eco_wall_dry': { name: 'Эковата (сухая задувка)', unit: 'м³', price: 1500, category: 'insulation_full' },
        'wrk_ins_eco_wall_wet': { name: 'Эковата (влажное нанесение)', unit: 'м³', price: 2000, category: 'insulation_full' },
        'wrk_ins_eco_floor': { name: 'Эковата (засыпка в перекрытие)', unit: 'м³', price: 1200, category: 'insulation_full' },
        'wrk_ins_eco_attic': { name: 'Эковата (чердак)', unit: 'м³', price: 1200, category: 'insulation_full' },

        // === ПЕНОСТЕКЛО ===
        'wrk_ins_foamglass_50': { name: 'Пеностекло 50мм', unit: 'м²', price: 100, category: 'insulation_full' },
        'wrk_ins_foamglass_100': { name: 'Пеностекло 100мм', unit: 'м²', price: 180, category: 'insulation_full' },

        // === ИЗОЛЯЦИЯ ТРУБ ===
        'wrk_ins_pipe_rubber_15': { name: 'Изоляция труб каучук Ø15мм', unit: 'м.п.', price: 10, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_22': { name: 'Изоляция труб каучук Ø22мм', unit: 'м.п.', price: 12, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_28': { name: 'Изоляция труб каучук Ø28мм', unit: 'м.п.', price: 15, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_35': { name: 'Изоляция труб каучук Ø35мм', unit: 'м.п.', price: 18, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_42': { name: 'Изоляция труб каучук Ø42мм', unit: 'м.п.', price: 20, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_54': { name: 'Изоляция труб каучук Ø54мм', unit: 'м.п.', price: 25, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_76': { name: 'Изоляция труб каучук Ø76мм', unit: 'м.п.', price: 30, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_89': { name: 'Изоляция труб каучук Ø89мм', unit: 'м.п.', price: 35, category: 'insulation_full' },
        'wrk_ins_pipe_rubber_108': { name: 'Изоляция труб каучук Ø108мм', unit: 'м.п.', price: 40, category: 'insulation_full' },
        'wrk_ins_pipe_pe_15': { name: 'Изоляция труб ПЭ Ø15мм', unit: 'м.п.', price: 5, category: 'insulation_full' },
        'wrk_ins_pipe_pe_22': { name: 'Изоляция труб ПЭ Ø22мм', unit: 'м.п.', price: 6, category: 'insulation_full' },
        'wrk_ins_pipe_pe_28': { name: 'Изоляция труб ПЭ Ø28мм', unit: 'м.п.', price: 7, category: 'insulation_full' },
        'wrk_ins_pipe_pe_35': { name: 'Изоляция труб ПЭ Ø35мм', unit: 'м.п.', price: 8, category: 'insulation_full' },
        'wrk_ins_pipe_mw_57': { name: 'Цилиндры минвата Ø57мм', unit: 'м.п.', price: 20, category: 'insulation_full' },
        'wrk_ins_pipe_mw_76': { name: 'Цилиндры минвата Ø76мм', unit: 'м.п.', price: 25, category: 'insulation_full' },
        'wrk_ins_pipe_mw_89': { name: 'Цилиндры минвата Ø89мм', unit: 'м.п.', price: 30, category: 'insulation_full' },
        'wrk_ins_pipe_mw_108': { name: 'Цилиндры минвата Ø108мм', unit: 'м.п.', price: 35, category: 'insulation_full' },
        'wrk_ins_pipe_mw_159': { name: 'Цилиндры минвата Ø159мм', unit: 'м.п.', price: 50, category: 'insulation_full' },

        // === ОТРАЖАЮЩАЯ ИЗОЛЯЦИЯ ===
        'wrk_ins_reflect_3': { name: 'Отражающая изоляция 3мм', unit: 'м²', price: 10, category: 'insulation_full' },
        'wrk_ins_reflect_5': { name: 'Отражающая изоляция 5мм', unit: 'м²', price: 15, category: 'insulation_full' },
        'wrk_ins_reflect_10': { name: 'Отражающая изоляция 10мм', unit: 'м²', price: 20, category: 'insulation_full' },

        // === ПАРОИЗОЛЯЦИЯ / ВЕТРОЗАЩИТА ===
        'wrk_ins_vapor_film': { name: 'Пароизоляционная плёнка', unit: 'м²', price: 10, category: 'insulation_full' },
        'wrk_ins_vapor_foil': { name: 'Пароизоляция фольгированная', unit: 'м²', price: 15, category: 'insulation_full' },
        'wrk_ins_wind_a': { name: 'Мембрана ветрозащитная А', unit: 'м²', price: 10, category: 'insulation_full' },
        'wrk_ins_wind_am': { name: 'Мембрана ветрозащитная AM', unit: 'м²', price: 15, category: 'insulation_full' },
        'wrk_ins_diff_b': { name: 'Плёнка гидроизоляционная В', unit: 'м²', price: 10, category: 'insulation_full' },
        'wrk_ins_diff_d': { name: 'Плёнка гидроизоляционная D', unit: 'м²', price: 12, category: 'insulation_full' }
    };
})();
