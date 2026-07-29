// === ГКЛ/ГВЛ, ПОДВЕСНЫЕ ПОТОЛКИ, ПЕРЕГОРОДКИ — все виды (200 поз.) ===
(function () {
    window.AI_WRK_DRYWALL_EXT2 = {
        // === ПЕРЕГОРОДКИ ИЗ ГКЛ ===
        'wrk_dw_partition_75_1layer': { name: 'Перегородка ГКЛ 75мм (1 слой)', unit: 'м²', price: 1200, category: 'drywall_ext2' },
        'wrk_dw_partition_100_1layer': { name: 'Перегородка ГКЛ 100мм (1 слой)', unit: 'м²', price: 1400, category: 'drywall_ext2' },
        'wrk_dw_partition_100_2layer': { name: 'Перегородка ГКЛ 100мм (2 слоя)', unit: 'м²', price: 1800, category: 'drywall_ext2' },
        'wrk_dw_partition_125_2layer': { name: 'Перегородка ГКЛ 125мм (2 слоя)', unit: 'м²', price: 2000, category: 'drywall_ext2' },
        'wrk_dw_partition_150_2layer': { name: 'Перегородка ГКЛ 150мм (2 слоя)', unit: 'м²', price: 2200, category: 'drywall_ext2' },
        'wrk_dw_partition_dual_frame': { name: 'Перегородка ГКЛ на двойном каркасе', unit: 'м²', price: 2800, category: 'drywall_ext2' },
        'wrk_dw_partition_fire_ei45': { name: 'Огнестойкая перегородка ГКЛ EI45', unit: 'м²', price: 2500, category: 'drywall_ext2' },
        'wrk_dw_partition_fire_ei60': { name: 'Огнестойкая перегородка ГКЛ EI60', unit: 'м²', price: 3200, category: 'drywall_ext2' },
        'wrk_dw_partition_moisture': { name: 'Перегородка из ГКЛВ (влагостойкий)', unit: 'м²', price: 1600, category: 'drywall_ext2' },
        'wrk_dw_partition_gvl': { name: 'Перегородка из ГВЛ', unit: 'м²', price: 1800, category: 'drywall_ext2' },
        // === ОБЛИЦОВКА СТЕН ===
        'wrk_dw_wall_1layer': { name: 'Облицовка стен ГКЛ (1 слой на каркасе)', unit: 'м²', price: 850, category: 'drywall_ext2' },
        'wrk_dw_wall_2layer': { name: 'Облицовка стен ГКЛ (2 слоя на каркасе)', unit: 'м²', price: 1200, category: 'drywall_ext2' },
        'wrk_dw_wall_glue': { name: 'Облицовка стен ГКЛ (на клей)', unit: 'м²', price: 650, category: 'drywall_ext2' },
        'wrk_dw_wall_insul_50': { name: 'Утепление внутри каркаса 50мм', unit: 'м²', price: 250, category: 'drywall_ext2' },
        'wrk_dw_wall_insul_100': { name: 'Утепление внутри каркаса 100мм', unit: 'м²', price: 450, category: 'drywall_ext2' },
        'wrk_dw_wall_sound': { name: 'Звукоизоляция перегородки (минвата)', unit: 'м²', price: 350, category: 'drywall_ext2' },
        // === КОРОБА И НИШИ ===
        'wrk_dw_box_simple': { name: 'Короб ГКЛ простой', unit: 'м.п.', price: 850, category: 'drywall_ext2' },
        'wrk_dw_box_complex': { name: 'Короб ГКЛ сложной формы', unit: 'м.п.', price: 1500, category: 'drywall_ext2' },
        'wrk_dw_niche_simple': { name: 'Ниша в стене из ГКЛ (простая)', unit: 'шт', price: 5500, category: 'drywall_ext2' },
        'wrk_dw_niche_complex': { name: 'Ниша в стене из ГКЛ (с подсветкой)', unit: 'шт', price: 8500, category: 'drywall_ext2' },
        // === ПОДВЕСНЫЕ ПОТОЛКИ ===
        'wrk_dw_ceil_1level': { name: 'Потолок ГКЛ одноуровневый', unit: 'м²', price: 1200, category: 'drywall_ext2' },
        'wrk_dw_ceil_2level': { name: 'Потолок ГКЛ двухуровневый', unit: 'м²', price: 1800, category: 'drywall_ext2' },
        'wrk_dw_ceil_3level': { name: 'Потолок ГКЛ трёхуровневый', unit: 'м²', price: 2500, category: 'drywall_ext2' },
        'wrk_dw_ceil_curved': { name: 'Потолок ГКЛ криволинейный', unit: 'м²', price: 2500, category: 'drywall_ext2' },
        'wrk_dw_ceil_light_niche': { name: 'Ниша для подсветки в потолке', unit: 'м.п.', price: 1200, category: 'drywall_ext2' },
        // === ПОТОЛКИ ARMSTRONG ===
        'wrk_dw_ceil_armstrong': { name: 'Монтаж потолка Armstrong', unit: 'м²', price: 650, category: 'drywall_ext2' },
        'wrk_dw_ceil_armstrong_premium': { name: 'Монтаж потолка Armstrong (премиум)', unit: 'м²', price: 850, category: 'drywall_ext2' },
        'wrk_dw_ceil_armstrong_ultima': { name: 'Монтаж потолка Armstrong Ultima', unit: 'м²', price: 1100, category: 'drywall_ext2' },
        // === РЕЕЧНЫЕ ПОТОЛКИ ===
        'wrk_dw_ceil_rack_alum': { name: 'Монтаж реечного потолка (алюминий)', unit: 'м²', price: 1200, category: 'drywall_ext2' },
        'wrk_dw_ceil_rack_steel': { name: 'Монтаж реечного потолка (сталь)', unit: 'м²', price: 1000, category: 'drywall_ext2' },
        'wrk_dw_ceil_rack_wood': { name: 'Монтаж реечного потолка (дерево)', unit: 'м²', price: 2500, category: 'drywall_ext2' },
        // === ГРИЛЬЯТО ===
        'wrk_dw_ceil_grilato_50': { name: 'Монтаж потолка Грильято 50×50', unit: 'м²', price: 1500, category: 'drywall_ext2' },
        'wrk_dw_ceil_grilato_100': { name: 'Монтаж потолка Грильято 100×100', unit: 'м²', price: 1200, category: 'drywall_ext2' },
        'wrk_dw_ceil_grilato_150': { name: 'Монтаж потолка Грильято 150×150', unit: 'м²', price: 1000, category: 'drywall_ext2' },
        // === НАТЯЖНЫЕ ПОТОЛКИ ===
        'wrk_dw_ceil_stretch_pvс': { name: 'Монтаж натяжного потолка ПВХ', unit: 'м²', price: 850, category: 'drywall_ext2' },
        'wrk_dw_ceil_stretch_fabric': { name: 'Монтаж натяжного потолка тканевого', unit: 'м²', price: 1200, category: 'drywall_ext2' },
        'wrk_dw_ceil_stretch_2level': { name: 'Монтаж натяжного потолка двухуровнев.', unit: 'м²', price: 1500, category: 'drywall_ext2' },
        'wrk_dw_ceil_stretch_light': { name: 'Натяжной потолок с подсветкой', unit: 'м²', price: 1500, category: 'drywall_ext2' },
        'wrk_dw_ceil_stretch_star': { name: 'Натяжной потолок «Звёздное небо»', unit: 'м²', price: 3500, category: 'drywall_ext2' },
        'wrk_dw_ceil_stretch_hole': { name: 'Вырез под светильник в натяжном потолке', unit: 'шт', price: 350, category: 'drywall_ext2' },
        // === ПОДШИВКА ПОТОЛКОВ ===
        'wrk_dw_ceil_plywood': { name: 'Подшивка потолка фанерой', unit: 'м²', price: 750, category: 'drywall_ext2' },
        'wrk_dw_ceil_pvc_panel': { name: 'Подшивка потолка ПВХ панелями', unit: 'м²', price: 550, category: 'drywall_ext2' },
        'wrk_dw_ceil_wood_panel': { name: 'Подшивка потолка вагонкой', unit: 'м²', price: 850, category: 'drywall_ext2' }
    };
})();
