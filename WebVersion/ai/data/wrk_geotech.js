// === ГЕОТЕХНИКА — шпунт, анкеры, jet-grouting, замораживание, геосинтетика (50 поз.) ===
(function () {
    window.AI_WRK_GEOTECH = {
        // === ШПУНТОВОЕ ОГРАЖДЕНИЕ === 1-8
        'wrk_gt_sheet_pile_larsen': { name: 'Погружение шпунта Ларсена', unit: 'м²', price: 5500, category: 'geotech' },
        'wrk_gt_sheet_pile_extract': { name: 'Извлечение шпунта Ларсена', unit: 'м²', price: 3500, category: 'geotech' },
        'wrk_gt_secant_pile_600': { name: 'Буросекущие сваи Ø600', unit: 'м.п.', price: 12000, category: 'geotech' },
        'wrk_gt_secant_pile_800': { name: 'Буросекущие сваи Ø800', unit: 'м.п.', price: 18000, category: 'geotech' },
        'wrk_gt_secant_pile_1000': { name: 'Буросекущие сваи Ø1000', unit: 'м.п.', price: 25000, category: 'geotech' },
        'wrk_gt_diaphragm_wall_600': { name: 'Стена в грунте 600мм', unit: 'м²', price: 12000, category: 'geotech' },
        'wrk_gt_diaphragm_wall_800': { name: 'Стена в грунте 800мм', unit: 'м²', price: 15000, category: 'geotech' },
        'wrk_gt_diaphragm_wall_1000': { name: 'Стена в грунте 1000мм', unit: 'м²', price: 18000, category: 'geotech' },
        // === ГРУНТОВЫЕ АНКЕРЫ === 9-14
        'wrk_gt_anchor_temp_10': { name: 'Анкер временный (до 10т)', unit: 'шт', price: 25000, category: 'geotech' },
        'wrk_gt_anchor_temp_30': { name: 'Анкер временный (до 30т)', unit: 'шт', price: 55000, category: 'geotech' },
        'wrk_gt_anchor_perm_30': { name: 'Анкер постоянный (до 30т)', unit: 'шт', price: 85000, category: 'geotech' },
        'wrk_gt_anchor_perm_60': { name: 'Анкер постоянный (до 60т)', unit: 'шт', price: 120000, category: 'geotech' },
        'wrk_gt_anchor_test': { name: 'Испытание грунтового анкера', unit: 'шт', price: 15000, category: 'geotech' },
        'wrk_gt_nail_soil': { name: 'Грунтовый нагель (soil nailing)', unit: 'шт', price: 8500, category: 'geotech' },
        // === JET-GROUTING === 15-20
        'wrk_gt_jet_grout_600': { name: 'Jet-grouting Ø600', unit: 'м.п.', price: 8500, category: 'geotech' },
        'wrk_gt_jet_grout_800': { name: 'Jet-grouting Ø800', unit: 'м.п.', price: 12000, category: 'geotech' },
        'wrk_gt_jet_grout_1200': { name: 'Jet-grouting Ø1200', unit: 'м.п.', price: 18000, category: 'geotech' },
        'wrk_gt_jet_grout_1500': { name: 'Jet-grouting Ø1500', unit: 'м.п.', price: 25000, category: 'geotech' },
        'wrk_gt_jet_grout_2000': { name: 'Jet-grouting Ø2000', unit: 'м.п.', price: 35000, category: 'geotech' },
        'wrk_gt_cement_grout': { name: 'Цементация грунта (инъекция)', unit: 'м.п.', price: 5500, category: 'geotech' },
        // === УКРЕПЛЕНИЕ ГРУНТОВ === 21-28
        'wrk_gt_vibroflot': { name: 'Виброфлотация (уплотнение)', unit: 'м.п.', price: 3500, category: 'geotech' },
        'wrk_gt_stone_column': { name: 'Щебёночная колонна', unit: 'м.п.', price: 5500, category: 'geotech' },
        'wrk_gt_dynamic_compact': { name: 'Динамическое уплотнение', unit: 'м²', price: 550, category: 'geotech' },
        'wrk_gt_preload_surcharge': { name: 'Пригрузка (предварит. нагружение)', unit: 'м³', price: 350, category: 'geotech' },
        'wrk_gt_wick_drain': { name: 'Вертикальная дрена (PVD)', unit: 'м.п.', price: 250, category: 'geotech' },
        'wrk_gt_deep_mixing': { name: 'Глубинное перемешивание (DMM)', unit: 'м.п.', price: 8500, category: 'geotech' },
        'wrk_gt_chemical_inject': { name: 'Химическое закрепление грунта', unit: 'м.п.', price: 5500, category: 'geotech' },
        'wrk_gt_electroosmosis': { name: 'Электроосмос (водопонижение)', unit: 'компл.', price: 250000, category: 'geotech' },
        // === ВОДОПОНИЖЕНИЕ === 29-34
        'wrk_gt_deep_well': { name: 'Глубинный насос (водопонижение)', unit: 'скважина', price: 55000, category: 'geotech' },
        'wrk_gt_sump_pump': { name: 'Открытый водоотлив (зумпф)', unit: 'компл.', price: 25000, category: 'geotech' },
        'wrk_gt_cutoff_wall': { name: 'Противофильтрационная завеса', unit: 'м²', price: 5500, category: 'geotech' },
        'wrk_gt_freeze_ground': { name: 'Замораживание грунта (AGF)', unit: 'м.п.', price: 25000, category: 'geotech' },
        'wrk_gt_freeze_station': { name: 'Замораживающая станция', unit: 'компл.', price: 2500000, category: 'geotech' },
        // === ГЕОСИНТЕТИКА === 35-42
        'wrk_gt_geotextile': { name: 'Укладка геотекстиля', unit: 'м²', price: 55, category: 'geotech' },
        'wrk_gt_geogrid_biaxial': { name: 'Георешётка двухосная', unit: 'м²', price: 120, category: 'geotech' },
        'wrk_gt_geogrid_uniaxial': { name: 'Георешётка одноосная', unit: 'м²', price: 150, category: 'geotech' },
        'wrk_gt_geocell': { name: 'Геоячейка (объёмная)', unit: 'м²', price: 250, category: 'geotech' },
        'wrk_gt_geomembrane': { name: 'Геомембрана HDPE', unit: 'м²', price: 350, category: 'geotech' },
        'wrk_gt_geodrain': { name: 'Геодрен (плоский)', unit: 'м²', price: 120, category: 'geotech' },
        'wrk_gt_geomat': { name: 'Геомат (противоэрозийный)', unit: 'м²', price: 120, category: 'geotech' },
        'wrk_gt_gabion_mattress': { name: 'Матрац Рено (габион)', unit: 'м²', price: 850, category: 'geotech' },
        // === МОНИТОРИНГ === 43-48
        'wrk_gt_inclinometer_install': { name: 'Установка инклинометрической скважины', unit: 'скважина', price: 55000, category: 'geotech' },
        'wrk_gt_piezometer_install': { name: 'Установка пьезометра', unit: 'скважина', price: 35000, category: 'geotech' },
        'wrk_gt_settlement_plate': { name: 'Марка осадочная', unit: 'шт', price: 1500, category: 'geotech' },
        'wrk_gt_load_cell': { name: 'Тензодатчик в анкер/распорку', unit: 'шт', price: 25000, category: 'geotech' },
        'wrk_gt_report_geotech': { name: 'Геотехнический отчёт', unit: 'объект', price: 120000, category: 'geotech' }
    };
})();
