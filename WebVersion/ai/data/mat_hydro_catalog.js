// === ГИДРОТЕХНИКА — шпунт, бентонит, геотекстиль, затворы, плотины (300 поз.) ===
(function () {
    window.AI_MAT_HYDRO = {
        // === ШПУНТ ===
        'mat_hy_sheetpile_l4': { name: 'Шпунт Ларсена Л4 (12м)', unit: 'т', price: 650000, category: 'hydro' },
        'mat_hy_sheetpile_l5': { name: 'Шпунт Ларсена Л5 (12м)', unit: 'т', price: 680000, category: 'hydro' },
        'mat_hy_sheetpile_l5um': { name: 'Шпунт Ларсена Л5-УМ (12м)', unit: 'т', price: 720000, category: 'hydro' },
        'mat_hy_sheetpile_vinyl': { name: 'Шпунт ПВХ (виниловый)', unit: 'м²', price: 8500, category: 'hydro' },
        'mat_hy_sheetpile_wood': { name: 'Шпунт деревянный', unit: 'м²', price: 3500, category: 'hydro' },
        'mat_hy_sheetpile_lock': { name: 'Замок шпунтовый (ремонтный)', unit: 'м.п.', price: 1500, category: 'hydro' },
        // === БЕНТОНИТ И ТАМПОНАЖ ===
        'mat_hy_bentonite_powder': { name: 'Бентонитовый порошок (25кг)', unit: 'мешок', price: 1200, category: 'hydro' },
        'mat_hy_bentonite_granule': { name: 'Бентонит гранулированный (25кг)', unit: 'мешок', price: 1500, category: 'hydro' },
        'mat_hy_bentonite_mat': { name: 'Бентонитовый мат ГБМ (5мм)', unit: 'м²', price: 850, category: 'hydro' },
        'mat_hy_bentonite_cord': { name: 'Бентонитовый шнур 20×25мм', unit: 'м.п.', price: 350, category: 'hydro' },
        'mat_hy_cement_grout': { name: 'Тампонажный цемент ПЦТ (50кг)', unit: 'мешок', price: 1800, category: 'hydro' },
        'mat_hy_polymer_grout': { name: 'Полимерная инъекция (25кг)', unit: 'канистра', price: 15000, category: 'hydro' },
        'mat_hy_waterstop_pvc_200': { name: 'Гидрошпонка ПВХ 200мм', unit: 'м.п.', price: 1500, category: 'hydro' },
        'mat_hy_waterstop_pvc_250': { name: 'Гидрошпонка ПВХ 250мм', unit: 'м.п.', price: 2000, category: 'hydro' },
        'mat_hy_waterstop_pvc_320': { name: 'Гидрошпонка ПВХ 320мм', unit: 'м.п.', price: 2800, category: 'hydro' },
        'mat_hy_waterstop_rubber': { name: 'Гидрошпонка резиновая 250мм', unit: 'м.п.', price: 2500, category: 'hydro' },
        'mat_hy_waterstop_metal': { name: 'Гидрошпонка металлическая 200мм', unit: 'м.п.', price: 1200, category: 'hydro' },
        // === ГЕОСИНТЕТИКА ===
        'mat_hy_geotextile_150': { name: 'Геотекстиль 150г/м²', unit: 'м²', price: 45, category: 'hydro' },
        'mat_hy_geotextile_200': { name: 'Геотекстиль 200г/м²', unit: 'м²', price: 60, category: 'hydro' },
        'mat_hy_geotextile_300': { name: 'Геотекстиль 300г/м²', unit: 'м²', price: 85, category: 'hydro' },
        'mat_hy_geotextile_400': { name: 'Геотекстиль 400г/м²', unit: 'м²', price: 110, category: 'hydro' },
        'mat_hy_geotextile_500': { name: 'Геотекстиль 500г/м²', unit: 'м²', price: 140, category: 'hydro' },
        'mat_hy_geomembrane_1mm': { name: 'Геомембрана ПЭВП 1мм', unit: 'м²', price: 250, category: 'hydro' },
        'mat_hy_geomembrane_1_5mm': { name: 'Геомембрана ПЭВП 1.5мм', unit: 'м²', price: 350, category: 'hydro' },
        'mat_hy_geomembrane_2mm': { name: 'Геомембрана ПЭВП 2мм', unit: 'м²', price: 450, category: 'hydro' },
        'mat_hy_geomembrane_2_5mm': { name: 'Геомембрана ПЭВП 2.5мм', unit: 'м²', price: 550, category: 'hydro' },
        'mat_hy_geogrid_40': { name: 'Георешётка 40кН/м', unit: 'м²', price: 180, category: 'hydro' },
        'mat_hy_geogrid_80': { name: 'Георешётка 80кН/м', unit: 'м²', price: 320, category: 'hydro' },
        'mat_hy_geocell_100': { name: 'Геоячейка H=100мм', unit: 'м²', price: 450, category: 'hydro' },
        'mat_hy_geocell_200': { name: 'Геоячейка H=200мм', unit: 'м²', price: 650, category: 'hydro' },
        'mat_hy_geodrain_mat': { name: 'Дренажный мат (геокомпозит)', unit: 'м²', price: 550, category: 'hydro' },
        // === ЗАТВОРЫ И ЗАДВИЖКИ ===
        'mat_hy_sluice_gate_500': { name: 'Затвор плоский 500×500мм', unit: 'шт', price: 250000, category: 'hydro' },
        'mat_hy_sluice_gate_800': { name: 'Затвор плоский 800×800мм', unit: 'шт', price: 450000, category: 'hydro' },
        'mat_hy_sluice_gate_1000': { name: 'Затвор плоский 1000×1000мм', unit: 'шт', price: 650000, category: 'hydro' },
        'mat_hy_sluice_gate_1500': { name: 'Затвор плоский 1500×1500мм', unit: 'шт', price: 1200000, category: 'hydro' },
        'mat_hy_sluice_radial': { name: 'Затвор секторный (радиальный)', unit: 'шт', price: 2500000, category: 'hydro' },
        'mat_hy_penstock_d500': { name: 'Трубопровод напорный Ø500 (ГЭС)', unit: 'м.п.', price: 35000, category: 'hydro' },
        'mat_hy_penstock_d800': { name: 'Трубопровод напорный Ø800 (ГЭС)', unit: 'м.п.', price: 65000, category: 'hydro' },
        // === ГАБИОНЫ И КАМЕННАЯ НАБРОСКА ===
        'mat_hy_gabion_2x1x0_5': { name: 'Габион 2×1×0.5м (сетка)', unit: 'шт', price: 5500, category: 'hydro' },
        'mat_hy_gabion_2x1x1': { name: 'Габион 2×1×1м (сетка)', unit: 'шт', price: 8500, category: 'hydro' },
        'mat_hy_gabion_3x1x1': { name: 'Габион 3×1×1м (сетка)', unit: 'шт', price: 12000, category: 'hydro' },
        'mat_hy_reno_mattress_2x1x0_17': { name: 'Матрас Рено 2×1×0.17м', unit: 'шт', price: 3500, category: 'hydro' },
        'mat_hy_reno_mattress_2x1x0_3': { name: 'Матрас Рено 2×1×0.30м', unit: 'шт', price: 4500, category: 'hydro' },
        'mat_hy_riprap_150_300': { name: 'Камень бутовый фр. 150-300мм', unit: 'м³', price: 3500, category: 'hydro' },
        'mat_hy_riprap_300_500': { name: 'Камень бутовый фр. 300-500мм', unit: 'м³', price: 4500, category: 'hydro' },
        // === БЕТОН ГИДРОТЕХНИЧЕСКИЙ ===
        'mat_hy_concrete_w6': { name: 'Бетон B25 W6 F200 (гидротехн.)', unit: 'м³', price: 28000, category: 'hydro' },
        'mat_hy_concrete_w8': { name: 'Бетон B30 W8 F300 (гидротехн.)', unit: 'м³', price: 32000, category: 'hydro' },
        'mat_hy_concrete_w10': { name: 'Бетон B35 W10 F300 (гидротехн.)', unit: 'м³', price: 38000, category: 'hydro' },
        'mat_hy_concrete_w12': { name: 'Бетон B40 W12 F400 (гидротехн.)', unit: 'м³', price: 45000, category: 'hydro' }
    };
})();
