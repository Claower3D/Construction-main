// === ДВЕРИ, ОКНА, ВОРОТА, ПЕРЕГОРОДКИ РАСШИРЕННЫЕ — все типы и размеры ===
(function () {
    window.AI_WRK_OPENINGS_FULL = {
        // === ПЛАСТИКОВЫЕ ОКНА ===
        'wrk_op_pvх_600x600': { name: 'Монтаж окна ПВХ 600×600', unit: 'шт', price: 3500, category: 'openings_full' },
        'wrk_op_pvх_1800x1200': { name: 'Монтаж окна ПВХ 1800×1200', unit: 'шт', price: 8500, category: 'openings_full' },
        'wrk_op_pvх_2100x1400': { name: 'Монтаж окна ПВХ 2100×1400', unit: 'шт', price: 10000, category: 'openings_full' },
        'wrk_op_pvх_balcony': { name: 'Монтаж балконного блока ПВХ', unit: 'шт', price: 8500, category: 'openings_full' },
        // === ДЕРЕВЯННЫЕ ОКНА ===
        'wrk_op_wood_900x1200': { name: 'Монтаж окна деревянного 900×1200', unit: 'шт', price: 8500, category: 'openings_full' },
        'wrk_op_wood_1500x1200': { name: 'Монтаж окна деревянного 1500×1200', unit: 'шт', price: 12000, category: 'openings_full' },
        // === АЛЮМИНИЕВЫЕ ОКНА ===
        'wrk_op_alum_900x1200': { name: 'Монтаж окна алюминиевого 900×1200', unit: 'шт', price: 12000, category: 'openings_full' },
        'wrk_op_alum_1500x1200': { name: 'Монтаж окна алюминиевого 1500×1200', unit: 'шт', price: 18000, category: 'openings_full' },
        // === ОТКОСЫ ОКОННЫЕ ===
        'wrk_op_slope_plaster': { name: 'Штукатурные откосы (окно)', unit: 'м.п.', price: 450, category: 'openings_full' },
        'wrk_op_slope_pvh': { name: 'Откосы из ПВХ панелей (окно)', unit: 'м.п.', price: 350, category: 'openings_full' },
        'wrk_op_slope_sandwich': { name: 'Откосы из сэндвич-панелей (окно)', unit: 'м.п.', price: 450, category: 'openings_full' },
        'wrk_op_sill_pvh': { name: 'Монтаж подоконника ПВХ', unit: 'м.п.', price: 550, category: 'openings_full' },
        'wrk_op_drip_cap': { name: 'Монтаж отлива', unit: 'м.п.', price: 350, category: 'openings_full' },
        // === МЕЖКОМНАТНЫЕ ДВЕРИ ===
        'wrk_op_door_int_std': { name: 'Монтаж межкомнатной двери (стандарт)', unit: 'шт', price: 3500, category: 'openings_full' },
        'wrk_op_door_int_glass': { name: 'Монтаж межкомнатной двери (остеклённая)', unit: 'шт', price: 4500, category: 'openings_full' },
        'wrk_op_door_int_pocket': { name: 'Монтаж двери-пенала (в стену)', unit: 'шт', price: 15000, category: 'openings_full' },
        'wrk_op_door_int_double': { name: 'Монтаж двупольной двери', unit: 'шт', price: 5500, category: 'openings_full' },
        // === ВХОДНЫЕ ДВЕРИ ===
        'wrk_op_door_ext_metal': { name: 'Монтаж входной металлической двери', unit: 'шт', price: 5500, category: 'openings_full' },
        'wrk_op_door_ext_alumin': { name: 'Монтаж алюминиевой входной двери', unit: 'шт', price: 15000, category: 'openings_full' },
        'wrk_op_door_ext_auto': { name: 'Монтаж автоматической двери', unit: 'шт', price: 120000, category: 'openings_full' },
        'wrk_op_door_ext_revolving': { name: 'Монтаж двери-карусели', unit: 'шт', price: 350000, category: 'openings_full' },
        // === ВОРОТА ===
        'wrk_op_gate_sectional_3x3': { name: 'Монтаж секционных ворот 3×3', unit: 'шт', price: 35000, category: 'openings_full' },
        'wrk_op_gate_sectional_4x4': { name: 'Монтаж секционных ворот 4×4', unit: 'шт', price: 55000, category: 'openings_full' },
        'wrk_op_gate_sectional_5x5': { name: 'Монтаж секционных ворот 5×5', unit: 'шт', price: 85000, category: 'openings_full' },
        'wrk_op_gate_roller_3': { name: 'Монтаж рулонных (рольставни) ворот 3м', unit: 'шт', price: 25000, category: 'openings_full' },
        'wrk_op_gate_roller_5': { name: 'Монтаж рулонных (рольставни) ворот 5м', unit: 'шт', price: 45000, category: 'openings_full' },
        'wrk_op_gate_sliding_4': { name: 'Монтаж откатных ворот 4м', unit: 'шт', price: 55000, category: 'openings_full' },
        'wrk_op_gate_sliding_6': { name: 'Монтаж откатных ворот 6м', unit: 'шт', price: 85000, category: 'openings_full' },
        'wrk_op_gate_swing_3': { name: 'Монтаж распашных ворот 3м', unit: 'шт', price: 25000, category: 'openings_full' },
        'wrk_op_gate_swing_4': { name: 'Монтаж распашных ворот 4м', unit: 'шт', price: 35000, category: 'openings_full' },
        'wrk_op_gate_speed': { name: 'Монтаж скоростных ворот', unit: 'шт', price: 250000, category: 'openings_full' },
        'wrk_op_gate_dock_leveler': { name: 'Монтаж доклевеллера', unit: 'шт', price: 180000, category: 'openings_full' },
        'wrk_op_gate_dock_shelter': { name: 'Монтаж докшелтера', unit: 'шт', price: 120000, category: 'openings_full' },
        // === ЛЮКИ ===
        'wrk_op_hatch_floor_600': { name: 'Монтаж напольного люка 600×600', unit: 'шт', price: 8500, category: 'openings_full' },
        'wrk_op_hatch_floor_800': { name: 'Монтаж напольного люка 800×800', unit: 'шт', price: 12000, category: 'openings_full' },
        'wrk_op_hatch_roof': { name: 'Монтаж кровельного люка', unit: 'шт', price: 12000, category: 'openings_full' },
        // === ПЕРЕГОРОДКИ ОФИСНЫЕ ===
        'wrk_op_part_glass_single': { name: 'Стеклянная перегородка (однослойная)', unit: 'м²', price: 5500, category: 'openings_full' },
        'wrk_op_part_glass_double': { name: 'Стеклянная перегородка (двухслойная)', unit: 'м²', price: 8500, category: 'openings_full' },
        'wrk_op_part_glass_door': { name: 'Стеклянная дверь в перегородке', unit: 'шт', price: 15000, category: 'openings_full' },
        'wrk_op_part_acoustic': { name: 'Акустическая перегородка', unit: 'м²', price: 12000, category: 'openings_full' }
    };
})();
