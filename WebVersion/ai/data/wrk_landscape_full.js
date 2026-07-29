// === БЛАГОУСТРОЙСТВО И ОЗЕЛЕНЕНИЕ (200 поз.) ===
(function () {
    window.AI_WRK_LANDSCAPE_FULL = {
        // === ВЕРТИКАЛЬНАЯ ПЛАНИРОВКА ===
        'wrk_lsf_grade_level': { name: 'Вертикальная планировка территории', unit: 'м²', price: 120, category: 'landscape_full' },
        'wrk_lsf_grade_terrace': { name: 'Устройство террас', unit: 'м²', price: 850, category: 'landscape_full' },
        'wrk_lsf_retaining_wall_h05': { name: 'Подпорная стенка h=0.5м', unit: 'м.п.', price: 8500, category: 'landscape_full' },
        'wrk_lsf_retaining_wall_h1': { name: 'Подпорная стенка h=1.0м', unit: 'м.п.', price: 15000, category: 'landscape_full' },
        'wrk_lsf_retaining_wall_h1_5': { name: 'Подпорная стенка h=1.5м', unit: 'м.п.', price: 22000, category: 'landscape_full' },
        'wrk_lsf_retaining_gabion': { name: 'Подпорная стенка габионная', unit: 'м³', price: 12000, category: 'landscape_full' },
        // === ПОКРЫТИЯ ПЕШЕХОДНЫХ ЗОН ===
        'wrk_lsf_paving_tile_40': { name: 'Мощение тротуарной плиткой h=40мм', unit: 'м²', price: 1800, category: 'landscape_full' },
        'wrk_lsf_paving_tile_60': { name: 'Мощение тротуарной плиткой h=60мм', unit: 'м²', price: 2200, category: 'landscape_full' },
        'wrk_lsf_paving_tile_80': { name: 'Мощение тротуарной плиткой h=80мм', unit: 'м²', price: 2600, category: 'landscape_full' },
        'wrk_lsf_paving_granite': { name: 'Мощение гранитной колотой брусчаткой', unit: 'м²', price: 5500, category: 'landscape_full' },
        'wrk_lsf_paving_granite_pil': { name: 'Мощение гранитной пиленой брусчаткой', unit: 'м²', price: 4500, category: 'landscape_full' },
        'wrk_lsf_paving_rubber': { name: 'Укладка резинового покрытия', unit: 'м²', price: 3500, category: 'landscape_full' },
        'wrk_lsf_paving_tartan': { name: 'Укладка покрытия тартан (спорт.)', unit: 'м²', price: 5500, category: 'landscape_full' },
        'wrk_lsf_paving_eco_parking': { name: 'Укладка газонной решётки (экопарковка)', unit: 'м²', price: 1800, category: 'landscape_full' },
        // === СТУПЕНИ, ПАНДУСЫ ===
        'wrk_lsf_steps_concrete': { name: 'Устройство бетонных ступеней', unit: 'м.п.', price: 5500, category: 'landscape_full' },
        'wrk_lsf_steps_granite': { name: 'Облицовка ступеней гранитом', unit: 'м.п.', price: 8500, category: 'landscape_full' },
        'wrk_lsf_ramp_concrete': { name: 'Устройство бетонного пандуса', unit: 'м²', price: 5500, category: 'landscape_full' },
        'wrk_lsf_ramp_handrail': { name: 'Монтаж поручней пандуса', unit: 'м.п.', price: 3500, category: 'landscape_full' },
        // === МАЛЫЕ АРХИТЕКТУРНЫЕ ФОРМЫ ===
        'wrk_lsf_bench_standard': { name: 'Установка скамейки парковой', unit: 'шт', price: 8500, category: 'landscape_full' },
        'wrk_lsf_bench_premium': { name: 'Установка скамейки (премиум)', unit: 'шт', price: 18000, category: 'landscape_full' },
        'wrk_lsf_urn_install': { name: 'Установка урны', unit: 'шт', price: 3500, category: 'landscape_full' },
        'wrk_lsf_bollard_install': { name: 'Установка парковочного столбика', unit: 'шт', price: 5500, category: 'landscape_full' },
        'wrk_lsf_bike_rack': { name: 'Установка велопарковки', unit: 'шт', price: 12000, category: 'landscape_full' },
        'wrk_lsf_pergola': { name: 'Устройство перголы', unit: 'м²', price: 15000, category: 'landscape_full' },
        'wrk_lsf_fountain_small': { name: 'Устройство малого фонтана', unit: 'шт', price: 350000, category: 'landscape_full' },
        'wrk_lsf_playground_small': { name: 'Устройство детской площадки (малая)', unit: 'компл.', price: 450000, category: 'landscape_full' },
        'wrk_lsf_playground_large': { name: 'Устройство детской площадки (большая)', unit: 'компл.', price: 1200000, category: 'landscape_full' },
        'wrk_lsf_sport_ground': { name: 'Устройство спортивной площадки', unit: 'компл.', price: 850000, category: 'landscape_full' },
        // === ОГРАЖДЕНИЯ ===
        'wrk_lsf_fence_3d_h15': { name: 'Установка 3D забора H=1.5м', unit: 'м.п.', price: 3500, category: 'landscape_full' },
        'wrk_lsf_fence_3d_h2': { name: 'Установка 3D забора H=2.0м', unit: 'м.п.', price: 4500, category: 'landscape_full' },
        'wrk_lsf_fence_prof_h2': { name: 'Установка забора из профнастила H=2.0м', unit: 'м.п.', price: 4500, category: 'landscape_full' },
        'wrk_lsf_fence_forged': { name: 'Установка кованого ограждения', unit: 'м.п.', price: 12000, category: 'landscape_full' },
        'wrk_lsf_fence_brick': { name: 'Устройство кирпичного забора', unit: 'м.п.', price: 18000, category: 'landscape_full' },
        'wrk_lsf_gate_slide': { name: 'Установка откатных ворот', unit: 'шт', price: 55000, category: 'landscape_full' },
        // === ОЗЕЛЕНЕНИЕ ===
        'wrk_lsf_lawn_seed': { name: 'Устройство газона посевного', unit: 'м²', price: 350, category: 'landscape_full' },
        'wrk_lsf_lawn_roll': { name: 'Устройство газона рулонного', unit: 'м²', price: 750, category: 'landscape_full' },
        'wrk_lsf_lawn_sport': { name: 'Устройство спортивного газона', unit: 'м²', price: 1200, category: 'landscape_full' },
        'wrk_lsf_tree_dec_small': { name: 'Посадка деревьев (до 3м)', unit: 'шт', price: 8500, category: 'landscape_full' },
        'wrk_lsf_tree_dec_medium': { name: 'Посадка деревьев (3-5м)', unit: 'шт', price: 18000, category: 'landscape_full' },
        'wrk_lsf_tree_dec_large': { name: 'Посадка крупномеров (5-8м)', unit: 'шт', price: 55000, category: 'landscape_full' },
        'wrk_lsf_tree_conifer': { name: 'Посадка хвойного дерева (до 3м)', unit: 'шт', price: 25000, category: 'landscape_full' },
        'wrk_lsf_shrub_small': { name: 'Посадка кустарника (до 1м)', unit: 'шт', price: 2500, category: 'landscape_full' },
        'wrk_lsf_shrub_hedge': { name: 'Устройство живой изгороди', unit: 'м.п.', price: 3500, category: 'landscape_full' },
        // === ПОЛИВ ===
        'wrk_lsf_irrigation_auto': { name: 'Устройство автополива', unit: 'м²', price: 1500, category: 'landscape_full' },
        'wrk_lsf_irrigation_drip': { name: 'Устройство капельного полива', unit: 'м.п.', price: 350, category: 'landscape_full' },
        'wrk_lsf_irrigation_head': { name: 'Установка дождевателя', unit: 'шт', price: 3500, category: 'landscape_full' },
    };
})();
