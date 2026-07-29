// === КАТАЛОГ СВАРОЧНЫХ МАТЕРИАЛОВ И ОБОРУДОВАНИЯ (50 позиций) ===
(function () {
    window.AI_MAT_WELDING_CATALOG = {
        // Электроды
        'electrode_mr3_3mm_5kg': { name: 'Электроды МР-3 Ø3мм (5кг)', unit: 'пачка', price: 500, category: 'welding_catalog' },
        'electrode_mr3_4mm_5kg': { name: 'Электроды МР-3 Ø4мм (5кг)', unit: 'пачка', price: 500, category: 'welding_catalog' },
        'electrode_uoni_3mm_5kg': { name: 'Электроды УОНИ 13/55 Ø3мм (5кг)', unit: 'пачка', price: 600, category: 'welding_catalog' },
        'electrode_uoni_4mm_5kg': { name: 'Электроды УОНИ 13/55 Ø4мм (5кг)', unit: 'пачка', price: 600, category: 'welding_catalog' },
        'electrode_ano_21_3mm_5kg': { name: 'Электроды АНО-21 Ø3мм (5кг)', unit: 'пачка', price: 450, category: 'welding_catalog' },
        'electrode_lb52_3mm_5kg': { name: 'Электроды LB-52U Ø3мм (5кг)', unit: 'пачка', price: 1200, category: 'welding_catalog' },
        'electrode_ok46_3mm_5kg': { name: 'Электроды ОК 46.00 Ø3мм (5кг)', unit: 'пачка', price: 800, category: 'welding_catalog' },
        'electrode_cast_iron_3mm_1kg': { name: 'Электроды по чугуну Ø3мм (1кг)', unit: 'пачка', price: 500, category: 'welding_catalog' },
        'electrode_stainless_3mm_1kg': { name: 'Электроды по нержавейке Ø3мм (1кг)', unit: 'пачка', price: 800, category: 'welding_catalog' },
        // Сварочная проволока
        'wire_mig_08_5kg': { name: 'Проволока MIG 0.8мм (5кг)', unit: 'катушка', price: 600, category: 'welding_catalog' },
        'wire_mig_1_0_5kg': { name: 'Проволока MIG 1.0мм (5кг)', unit: 'катушка', price: 650, category: 'welding_catalog' },
        'wire_mig_08_15kg': { name: 'Проволока MIG 0.8мм (15кг)', unit: 'катушка', price: 1500, category: 'welding_catalog' },
        'wire_flux_08_1kg': { name: 'Проволока порошковая 0.8мм (1кг)', unit: 'катушка', price: 500, category: 'welding_catalog' },
        'wire_tig_1_6_5kg': { name: 'Присадка TIG 1.6мм нерж. (5кг)', unit: 'пачка', price: 2500, category: 'welding_catalog' },
        // Газы
        'gas_co2_10l': { name: 'Баллон CO₂ (10л)', unit: 'шт', price: 2000, category: 'welding_catalog' },
        'gas_argon_10l': { name: 'Баллон аргон (10л)', unit: 'шт', price: 3000, category: 'welding_catalog' },
        'gas_mix_ar_co2_10l': { name: 'Баллон Ar/CO₂ смесь (10л)', unit: 'шт', price: 3500, category: 'welding_catalog' },
        'gas_propane_50l': { name: 'Баллон пропан 50л', unit: 'шт', price: 4000, category: 'welding_catalog' },
        'gas_oxygen_40l': { name: 'Баллон кислород 40л', unit: 'шт', price: 3500, category: 'welding_catalog' },
        // Сварочные аппараты
        'welder_mma_200a': { name: 'Сварочный аппарат MMA 200A инвертор', unit: 'шт', price: 8000, category: 'welding_catalog' },
        'welder_mma_250a': { name: 'Сварочный аппарат MMA 250A инвертор', unit: 'шт', price: 12000, category: 'welding_catalog' },
        'welder_mig_200a': { name: 'Сварочный полуавтомат MIG 200A', unit: 'шт', price: 15000, category: 'welding_catalog' },
        'welder_mig_250a': { name: 'Сварочный полуавтомат MIG 250A', unit: 'шт', price: 25000, category: 'welding_catalog' },
        'welder_tig_200a': { name: 'Сварочный аппарат TIG/MMA 200A', unit: 'шт', price: 20000, category: 'welding_catalog' },
        // Горелки и резаки
        'torch_mig_3m': { name: 'Горелка MIG 3м (до 200A)', unit: 'шт', price: 2000, category: 'welding_catalog' },
        'torch_tig_4m': { name: 'Горелка TIG 4м (вентиль)', unit: 'шт', price: 3000, category: 'welding_catalog' },
        'torch_gas_cutter': { name: 'Резак газовый пропан/кислород', unit: 'шт', price: 2500, category: 'welding_catalog' },
        'torch_gas_burner': { name: 'Горелка газовая кровельная', unit: 'шт', price: 1500, category: 'welding_catalog' },
        // СИЗ сварщика
        'mask_welding_auto': { name: 'Маска сварщика «хамелеон»', unit: 'шт', price: 2000, category: 'welding_catalog' },
        'mask_welding_auto_pro': { name: 'Маска сварщика «хамелеон» профессион.', unit: 'шт', price: 5000, category: 'welding_catalog' },
        'gloves_welding_leather': { name: 'Краги сварщика кожаные', unit: 'пара', price: 500, category: 'welding_catalog' },
        'apron_welding_leather': { name: 'Фартук сварщика спилковый', unit: 'шт', price: 800, category: 'welding_catalog' },
        'glass_welding_c5': { name: 'Стекло защитное затемн. С5 (90×110)', unit: 'шт', price: 30, category: 'welding_catalog' },
        // Расходники
        'tip_mig_08_10pcs': { name: 'Наконечник токовый MIG 0.8мм (10шт)', unit: 'уп.', price: 100, category: 'welding_catalog' },
        'tip_mig_10_10pcs': { name: 'Наконечник токовый MIG 1.0мм (10шт)', unit: 'уп.', price: 100, category: 'welding_catalog' },
        'nozzle_mig_std': { name: 'Сопло MIG стандартное', unit: 'шт', price: 50, category: 'welding_catalog' },
        'diffuser_mig': { name: 'Диффузор MIG', unit: 'шт', price: 80, category: 'welding_catalog' },
        'tig_tungsten_1_6_10': { name: 'Вольфрамовый электрод TIG 1.6мм (10шт)', unit: 'уп.', price: 200, category: 'welding_catalog' },
        'tig_tungsten_2_4_10': { name: 'Вольфрамовый электрод TIG 2.4мм (10шт)', unit: 'уп.', price: 250, category: 'welding_catalog' },
        'spray_antispatter_400ml': { name: 'Антибрызг спрей (400мл)', unit: 'шт', price: 200, category: 'welding_catalog' },
        // Принадлежности
        'clamp_ground_300a': { name: 'Зажим заземления 300А', unit: 'шт', price: 100, category: 'welding_catalog' },
        'clamp_electrode_300a': { name: 'Электрододержатель 300А', unit: 'шт', price: 200, category: 'welding_catalog' },
        'cable_welding_1x16_m': { name: 'Кабель сварочный КГ 1×16мм² (м.п.)', unit: 'м.п.', price: 50, category: 'welding_catalog' },
        'cable_welding_1x25_m': { name: 'Кабель сварочный КГ 1×25мм² (м.п.)', unit: 'м.п.', price: 80, category: 'welding_catalog' },
        'magnet_welding_25kg': { name: 'Магнитный угольник 25кг', unit: 'шт', price: 300, category: 'welding_catalog' },
        'magnet_welding_50kg': { name: 'Магнитный угольник 50кг', unit: 'шт', price: 500, category: 'welding_catalog' },
        // Отрезные/зачистные круги
        'disc_cut_125x1_metal': { name: 'Диск отрезной по металлу 125×1мм', unit: 'шт', price: 30, category: 'welding_catalog' },
        'disc_cut_125x1_6_metal': { name: 'Диск отрезной по металлу 125×1.6мм', unit: 'шт', price: 25, category: 'welding_catalog' },
        'disc_cut_230x2_metal': { name: 'Диск отрезной по металлу 230×2мм', unit: 'шт', price: 60, category: 'welding_catalog' },
        'disc_grind_125x6_metal': { name: 'Диск зачистной по металлу 125×6мм', unit: 'шт', price: 40, category: 'welding_catalog' },
        'disc_flap_125_p60': { name: 'Круг лепестковый 125мм P60', unit: 'шт', price: 50, category: 'welding_catalog' }
    };
})();
