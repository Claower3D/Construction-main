// === КАТАЛОГ МЕТИЗОВ РАСШИРЕННЫЙ — ОЧИЩЕННЫЙ (без дублей с mat_fasteners.js) ===
// mat_fasteners.js уже содержит: дюбели пластик (6x30–12x60), саморезы универс. (3.5x16–6x120),
// гвозди строит. (50-120мм), анкеры клиновые (8x60–12x100) + химический + болты (М10/М12),
// шпильки (М8-М12), перфорированный крепёж (уголки/пластины/опоры/гвоздевая пластина),
// пена, герметик силик/акрил, жидкие гвозди
(function () {
    window.AI_MAT_METIZ_CATALOG = {
        // Болты DIN933 (уникальная категория — в mat_fasteners.js НЕТ болтов)
        'bolt_hex_m6x30_100': { name: 'Болт М6×30мм DIN933 (100шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        'bolt_hex_m8x40_50': { name: 'Болт М8×40мм DIN933 (50шт)', unit: 'уп.', price: 80, category: 'metiz_catalog' },
        'bolt_hex_m8x60_50': { name: 'Болт М8×60мм DIN933 (50шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        'bolt_hex_m10x50_50': { name: 'Болт М10×50мм DIN933 (50шт)', unit: 'уп.', price: 120, category: 'metiz_catalog' },
        'bolt_hex_m10x80_25': { name: 'Болт М10×80мм DIN933 (25шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        'bolt_hex_m10x100_25': { name: 'Болт М10×100мм DIN933 (25шт)', unit: 'уп.', price: 120, category: 'metiz_catalog' },
        'bolt_hex_m12x60_25': { name: 'Болт М12×60мм DIN933 (25шт)', unit: 'уп.', price: 120, category: 'metiz_catalog' },
        'bolt_hex_m12x80_25': { name: 'Болт М12×80мм DIN933 (25шт)', unit: 'уп.', price: 150, category: 'metiz_catalog' },
        'bolt_hex_m12x100_10': { name: 'Болт М12×100мм DIN933 (10шт)', unit: 'уп.', price: 80, category: 'metiz_catalog' },
        'bolt_hex_m16x80_10': { name: 'Болт М16×80мм DIN933 (10шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        'bolt_hex_m16x120_10': { name: 'Болт М16×120мм DIN933 (10шт)', unit: 'уп.', price: 130, category: 'metiz_catalog' },
        'bolt_hex_m20x100_5': { name: 'Болт М20×100мм DIN933 (5шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        // Гайки DIN934 (уникальная категория — в mat_fasteners.js НЕТ гаек)
        'nut_hex_m6_100': { name: 'Гайка М6 DIN934 (100шт)', unit: 'уп.', price: 30, category: 'metiz_catalog' },
        'nut_hex_m8_100': { name: 'Гайка М8 DIN934 (100шт)', unit: 'уп.', price: 40, category: 'metiz_catalog' },
        'nut_hex_m10_50': { name: 'Гайка М10 DIN934 (50шт)', unit: 'уп.', price: 30, category: 'metiz_catalog' },
        'nut_hex_m12_50': { name: 'Гайка М12 DIN934 (50шт)', unit: 'уп.', price: 40, category: 'metiz_catalog' },
        'nut_hex_m16_25': { name: 'Гайка М16 DIN934 (25шт)', unit: 'уп.', price: 40, category: 'metiz_catalog' },
        'nut_hex_m20_10': { name: 'Гайка М20 DIN934 (10шт)', unit: 'уп.', price: 30, category: 'metiz_catalog' },
        'nut_lock_m8_50': { name: 'Гайка самоконтрящаяся М8 (50шт)', unit: 'уп.', price: 50, category: 'metiz_catalog' },
        'nut_lock_m10_50': { name: 'Гайка самоконтрящаяся М10 (50шт)', unit: 'уп.', price: 60, category: 'metiz_catalog' },
        // Шайбы (уникальная категория — НЕТ в mat_fasteners.js)
        'washer_flat_m6_100': { name: 'Шайба плоская М6 (100шт)', unit: 'уп.', price: 15, category: 'metiz_catalog' },
        'washer_flat_m8_100': { name: 'Шайба плоская М8 (100шт)', unit: 'уп.', price: 20, category: 'metiz_catalog' },
        'washer_flat_m10_100': { name: 'Шайба плоская М10 (100шт)', unit: 'уп.', price: 25, category: 'metiz_catalog' },
        'washer_flat_m12_50': { name: 'Шайба плоская М12 (50шт)', unit: 'уп.', price: 20, category: 'metiz_catalog' },
        'washer_spring_m8_100': { name: 'Шайба пружинная (гровер) М8 (100шт)', unit: 'уп.', price: 20, category: 'metiz_catalog' },
        'washer_spring_m10_100': { name: 'Шайба пружинная (гровер) М10 (100шт)', unit: 'уп.', price: 25, category: 'metiz_catalog' },
        'washer_spring_m12_50': { name: 'Шайба пружинная (гровер) М12 (50шт)', unit: 'уп.', price: 20, category: 'metiz_catalog' },
        // Шпилька М16 (НЕТ в mat_fasteners.js — там только М8-М12)
        'stud_m16_1m': { name: 'Шпилька резьбовая М16 (1м)', unit: 'шт', price: 60, category: 'metiz_catalog' },
        // Анкеры — М16 + гильзы + сетчатые гильзы (НЕТ в mat_fasteners.js)
        'anchor_wedge_16x120': { name: 'Анкер клиновой 16×120мм', unit: 'шт', price: 30, category: 'metiz_catalog' },
        'anchor_sleeve_8x40': { name: 'Анкер-гильза 8×40мм', unit: 'шт', price: 5, category: 'metiz_catalog' },
        'anchor_sleeve_10x60': { name: 'Анкер-гильза 10×60мм', unit: 'шт', price: 8, category: 'metiz_catalog' },
        'anchor_sleeve_12x100': { name: 'Анкер-гильза 12×100мм', unit: 'шт', price: 15, category: 'metiz_catalog' },
        'anchor_chem_400ml': { name: 'Химический анкер 400мл', unit: 'шт', price: 700, category: 'metiz_catalog' },
        'anchor_chem_screen_m12': { name: 'Сетчатая гильза для хим. анкера М12', unit: 'шт', price: 50, category: 'metiz_catalog' },
        // Дюбели — уник. типы (Driva, бабочка фасовкой)
        'dowel_nylon_14x70_25': { name: 'Дюбель нейлоновый 14×70мм (25шт)', unit: 'уп.', price: 25, category: 'metiz_catalog' },
        'dowel_gkl_driva_100': { name: 'Дюбель для ГКЛ Driva (100шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        // Дюбель-гвозди (уникальная категория)
        'dowel_nail_6x40_200': { name: 'Дюбель-гвоздь 6×40мм (200шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        'dowel_nail_6x60_200': { name: 'Дюбель-гвоздь 6×60мм (200шт)', unit: 'уп.', price: 120, category: 'metiz_catalog' },
        'dowel_nail_6x80_100': { name: 'Дюбель-гвоздь 6×80мм (100шт)', unit: 'уп.', price: 80, category: 'metiz_catalog' },
        'dowel_nail_8x60_100': { name: 'Дюбель-гвоздь 8×60мм (100шт)', unit: 'уп.', price: 80, category: 'metiz_catalog' },
        'dowel_nail_8x80_100': { name: 'Дюбель-гвоздь 8×80мм (100шт)', unit: 'уп.', price: 100, category: 'metiz_catalog' },
        'dowel_nail_8x100_50': { name: 'Дюбель-гвоздь 8×100мм (50шт)', unit: 'уп.', price: 60, category: 'metiz_catalog' },
        // Кровельные саморезы (уникальные фасовки крупные — mat_roofing.js поштучно)
        'screw_roof_4_8x29_250': { name: 'Саморез кровельный 4.8×29мм (250шт)', unit: 'уп.', price: 200, category: 'metiz_catalog' },
        'screw_roof_4_8x35_250': { name: 'Саморез кровельный 4.8×35мм (250шт)', unit: 'уп.', price: 220, category: 'metiz_catalog' },
        'screw_roof_4_8x50_200': { name: 'Саморез кровельный 4.8×50мм (200шт)', unit: 'уп.', price: 200, category: 'metiz_catalog' },
        'screw_roof_4_8x70_100': { name: 'Саморез кровельный 4.8×70мм (100шт)', unit: 'уп.', price: 150, category: 'metiz_catalog' },
        // Гвозди — ершёные/финишные (НЕТ в mat_fasteners.js)
        'nail_ring_3_4x80_5kg': { name: 'Гвозди ершёные 3.4×80мм (5кг)', unit: 'уп.', price: 400, category: 'metiz_catalog' },
        'nail_ring_3_4x90_5kg': { name: 'Гвозди ершёные 3.4×90мм (5кг)', unit: 'уп.', price: 400, category: 'metiz_catalog' },
        'nail_finish_1_4x25_100': { name: 'Гвозди финишные 1.4×25мм (100шт)', unit: 'уп.', price: 30, category: 'metiz_catalog' },
        // Крепёж для дерева — опоры/конн. (уникальная специализация)
        'wood_connector_joist': { name: 'Опора балки раскрытая OBR', unit: 'шт', price: 30, category: 'metiz_catalog' },
        'wood_connector_joist_cl': { name: 'Опора балки закрытая OBZ', unit: 'шт', price: 40, category: 'metiz_catalog' },
        'wood_screw_8x80_100': { name: 'Шуруп по дереву 8×80мм (100шт)', unit: 'уп.', price: 200, category: 'metiz_catalog' },
        'wood_screw_10x100_50': { name: 'Шуруп по дереву 10×100мм (50шт)', unit: 'уп.', price: 150, category: 'metiz_catalog' },
        'wood_screw_10x120_50': { name: 'Шуруп по дереву 10×120мм (50шт)', unit: 'уп.', price: 180, category: 'metiz_catalog' }
    };
})();
