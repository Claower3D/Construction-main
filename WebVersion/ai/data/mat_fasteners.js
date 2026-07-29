// === КРЕПЁЖ И МЕТИЗЫ (40 позиций) ===
(function () {
    window.AI_MAT_FASTENERS = {
        // Дюбели
        'dowel_6x30': { name: 'Дюбель пластиковый 6×30мм (100шт)', unit: 'уп.', price: 80, category: 'fasteners' },
        'dowel_6x40': { name: 'Дюбель пластиковый 6×40мм (100шт)', unit: 'уп.', price: 100, category: 'fasteners' },
        'dowel_8x40': { name: 'Дюбель пластиковый 8×40мм (100шт)', unit: 'уп.', price: 120, category: 'fasteners' },
        'dowel_8x60': { name: 'Дюбель пластиковый 8×60мм (100шт)', unit: 'уп.', price: 150, category: 'fasteners' },
        'dowel_10x50': { name: 'Дюбель пластиковый 10×50мм (50шт)', unit: 'уп.', price: 100, category: 'fasteners' },
        'dowel_10x80': { name: 'Дюбель пластиковый 10×80мм (50шт)', unit: 'уп.', price: 130, category: 'fasteners' },
        'dowel_12x60': { name: 'Дюбель пластиковый 12×60мм (50шт)', unit: 'уп.', price: 120, category: 'fasteners' },

        // Саморезы универсальные
        'screw_3_5x16_pz': { name: 'Саморез универсальный 3.5×16мм (200шт)', unit: 'уп.', price: 100, category: 'fasteners' },
        'screw_3_5x25_pz': { name: 'Саморез универсальный 3.5×25мм (200шт)', unit: 'уп.', price: 120, category: 'fasteners' },
        'screw_3_5x35_pz': { name: 'Саморез универсальный 3.5×35мм (200шт)', unit: 'уп.', price: 140, category: 'fasteners' },
        'screw_4x50_pz': { name: 'Саморез универсальный 4×50мм (200шт)', unit: 'уп.', price: 180, category: 'fasteners' },
        'screw_4_5x60_pz': { name: 'Саморез универсальный 4.5×60мм (100шт)', unit: 'уп.', price: 150, category: 'fasteners' },
        'screw_5x70_pz': { name: 'Саморез универсальный 5×70мм (100шт)', unit: 'уп.', price: 200, category: 'fasteners' },
        'screw_5x100_pz': { name: 'Саморез универсальный 5×100мм (100шт)', unit: 'уп.', price: 300, category: 'fasteners' },
        'screw_6x120_pz': { name: 'Саморез универсальный 6×120мм (50шт)', unit: 'уп.', price: 280, category: 'fasteners' },

        // Гвозди
        'nail_50': { name: 'Гвоздь строительный 50мм (1кг)', unit: 'кг', price: 500, category: 'fasteners' },
        'nail_70': { name: 'Гвоздь строительный 70мм (1кг)', unit: 'кг', price: 500, category: 'fasteners' },
        'nail_100': { name: 'Гвоздь строительный 100мм (1кг)', unit: 'кг', price: 500, category: 'fasteners' },
        'nail_120': { name: 'Гвоздь строительный 120мм (1кг)', unit: 'кг', price: 500, category: 'fasteners' },

        // Анкеры
        'anchor_wedge_8x60': { name: 'Анкер клиновой 8×60мм (50шт)', unit: 'уп.', price: 500, category: 'fasteners' },
        'anchor_wedge_10x80': { name: 'Анкер клиновой 10×80мм (25шт)', unit: 'уп.', price: 400, category: 'fasteners' },
        'anchor_wedge_12x100': { name: 'Анкер клиновой 12×100мм (25шт)', unit: 'уп.', price: 500, category: 'fasteners' },
        'anchor_chemical_300': { name: 'Анкер химический (картридж 300мл)', unit: 'шт', price: 2500, category: 'fasteners' },
        'anchor_bolt_m10': { name: 'Анкерный болт М10×100', unit: 'шт', price: 40, category: 'fasteners' },
        'anchor_bolt_m12': { name: 'Анкерный болт М12×120', unit: 'шт', price: 60, category: 'fasteners' },

        // Шпильки
        'stud_m8x1m': { name: 'Шпилька резьбовая M8 (1м)', unit: 'шт', price: 80, category: 'fasteners' },
        'stud_m10x1m': { name: 'Шпилька резьбовая M10 (1м)', unit: 'шт', price: 120, category: 'fasteners' },
        'stud_m12x1m': { name: 'Шпилька резьбовая M12 (1м)', unit: 'шт', price: 180, category: 'fasteners' },

        // Перфорированный крепёж
        'bracket_90x90x40': { name: 'Уголок усиленный 90×90×40', unit: 'шт', price: 45, category: 'fasteners' },
        'bracket_105x105x90': { name: 'Уголок усиленный 105×105×90', unit: 'шт', price: 80, category: 'fasteners' },
        'truss_plate_100x200': { name: 'Пластина перфорированная 100×200', unit: 'шт', price: 40, category: 'fasteners' },
        'truss_plate_60x160': { name: 'Пластина перфорированная 60×160', unit: 'шт', price: 25, category: 'fasteners' },
        'joist_hanger_50': { name: 'Опора бруса 50×100', unit: 'шт', price: 100, category: 'fasteners' },
        'joist_hanger_100': { name: 'Опора бруса 100×150', unit: 'шт', price: 200, category: 'fasteners' },
        'nail_plate_100x60': { name: 'Гвоздевая пластина 100×60', unit: 'шт', price: 15, category: 'fasteners' },

        // Монтажная пена / герметики
        'foam_pu_750': { name: 'Пена монтажная 750мл', unit: 'шт', price: 500, category: 'fasteners' },
        'foam_pu_fire': { name: 'Пена монтажная огнестойкая 750мл', unit: 'шт', price: 800, category: 'fasteners' },
        'sealant_silicone_280': { name: 'Герметик силиконовый 280мл', unit: 'шт', price: 250, category: 'fasteners' },
        'sealant_acrylic_280': { name: 'Герметик акриловый 280мл', unit: 'шт', price: 180, category: 'fasteners' },
        'glue_liquid_nails_400': { name: 'Жидкие гвозди 400г', unit: 'шт', price: 250, category: 'fasteners' }
    };
})();
