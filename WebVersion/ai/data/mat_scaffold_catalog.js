// === КАТАЛОГ СТРОИТЕЛЬНЫХ ЛЕСОВ И ПОДМОСТЕЙ (40 позиций) ===
(function () {
    window.AI_MAT_SCAFFOLD_CATALOG = {
        // Леса рамные (аренда/покупка)
        'scaffold_frame_2x1_m': { name: 'Рама лесов 2×1м (высота 2м)', unit: 'шт', price: 2000, category: 'scaffold_catalog' },
        'scaffold_frame_3x1_m': { name: 'Рама лесов 3×1м (высота 2м)', unit: 'шт', price: 2500, category: 'scaffold_catalog' },
        'scaffold_crossbar_1m': { name: 'Горизонталь лесов 1м', unit: 'шт', price: 400, category: 'scaffold_catalog' },
        'scaffold_crossbar_2m': { name: 'Горизонталь лесов 2м', unit: 'шт', price: 600, category: 'scaffold_catalog' },
        'scaffold_crossbar_3m': { name: 'Горизонталь лесов 3м', unit: 'шт', price: 800, category: 'scaffold_catalog' },
        'scaffold_diagonal_2m': { name: 'Диагональ лесов 2м', unit: 'шт', price: 500, category: 'scaffold_catalog' },
        'scaffold_diagonal_3m': { name: 'Диагональ лесов 3м', unit: 'шт', price: 700, category: 'scaffold_catalog' },
        'scaffold_deck_wood_2m': { name: 'Настил деревянный для лесов 2м', unit: 'шт', price: 500, category: 'scaffold_catalog' },
        'scaffold_deck_wood_3m': { name: 'Настил деревянный для лесов 3м', unit: 'шт', price: 700, category: 'scaffold_catalog' },
        'scaffold_deck_steel_3m': { name: 'Настил стальной для лесов 3м', unit: 'шт', price: 1500, category: 'scaffold_catalog' },
        'scaffold_base_jack': { name: 'Винтовая опора (пятка) лесов', unit: 'шт', price: 300, category: 'scaffold_catalog' },
        'scaffold_caster_wheel': { name: 'Колесо для тура-вышки', unit: 'шт', price: 500, category: 'scaffold_catalog' },
        // Туры-вышки
        'tower_scaffold_3m': { name: 'Тура-вышка раб. высота 3м', unit: 'компл.', price: 12000, category: 'scaffold_catalog' },
        'tower_scaffold_5m': { name: 'Тура-вышка раб. высота 5м', unit: 'компл.', price: 18000, category: 'scaffold_catalog' },
        'tower_scaffold_7m': { name: 'Тура-вышка раб. высота 7м', unit: 'компл.', price: 25000, category: 'scaffold_catalog' },
        // Подмости
        'platform_folding_2m': { name: 'Подмости складные h=0.5-0.8м (2м)', unit: 'шт', price: 3000, category: 'scaffold_catalog' },
        'platform_folding_3m': { name: 'Подмости складные h=0.5-1.3м (3м)', unit: 'шт', price: 5000, category: 'scaffold_catalog' },
        // Лестницы
        'ladder_alum_5step': { name: 'Стремянка алюминиевая 5 ступеней', unit: 'шт', price: 3000, category: 'scaffold_catalog' },
        'ladder_alum_7step': { name: 'Стремянка алюминиевая 7 ступеней', unit: 'шт', price: 4500, category: 'scaffold_catalog' },
        'ladder_alum_9step': { name: 'Стремянка алюминиевая 9 ступеней', unit: 'шт', price: 6000, category: 'scaffold_catalog' },
        'ladder_ext_2x7': { name: 'Лестница раздвижная 2×7 ступеней', unit: 'шт', price: 5000, category: 'scaffold_catalog' },
        'ladder_ext_2x9': { name: 'Лестница раздвижная 2×9 ступеней', unit: 'шт', price: 7000, category: 'scaffold_catalog' },
        'ladder_ext_2x11': { name: 'Лестница раздвижная 2×11 ступеней', unit: 'шт', price: 9000, category: 'scaffold_catalog' },
        'ladder_ext_3x7': { name: 'Лестница 3-секционная 3×7 ступеней', unit: 'шт', price: 8000, category: 'scaffold_catalog' },
        'ladder_ext_3x9': { name: 'Лестница 3-секционная 3×9 ступеней', unit: 'шт', price: 11000, category: 'scaffold_catalog' },
        'ladder_ext_3x11': { name: 'Лестница 3-секционная 3×11 ступеней', unit: 'шт', price: 14000, category: 'scaffold_catalog' },
        'ladder_ext_3x14': { name: 'Лестница 3-секционная 3×14 ступеней', unit: 'шт', price: 20000, category: 'scaffold_catalog' },
        'ladder_telescopic_3_2m': { name: 'Лестница телескопическая 3.2м', unit: 'шт', price: 8000, category: 'scaffold_catalog' },
        'ladder_telescopic_3_8m': { name: 'Лестница телескопическая 3.8м', unit: 'шт', price: 10000, category: 'scaffold_catalog' },
        // СИЗ для высотных работ
        'harness_full_body': { name: 'Привязь страховочная (полная)', unit: 'шт', price: 5000, category: 'scaffold_catalog' },
        'lanyard_2m_absorber': { name: 'Строп с амортизатором 2м', unit: 'шт', price: 2000, category: 'scaffold_catalog' },
        'carabiner_steel_25kn': { name: 'Карабин стальной 25кН', unit: 'шт', price: 300, category: 'scaffold_catalog' },
        'retractable_lifeline_3m': { name: 'Блок-ролик страховочный 3м', unit: 'шт', price: 5000, category: 'scaffold_catalog' },
        'helmet_with_visor': { name: 'Каска строительная с козырьком', unit: 'шт', price: 500, category: 'scaffold_catalog' },
        // Клиновые леса (хомутовые)
        'scaffold_cuplock_std_3m': { name: 'Стойка клиновых лесов 3м', unit: 'шт', price: 1200, category: 'scaffold_catalog' },
        'scaffold_cuplock_ledger_2m': { name: 'Ригель клиновых лесов 2м', unit: 'шт', price: 600, category: 'scaffold_catalog' },
        'scaffold_cuplock_ledger_3m': { name: 'Ригель клиновых лесов 3м', unit: 'шт', price: 800, category: 'scaffold_catalog' },
        // Опалубочные стойки
        'prop_steel_2_5_4m': { name: 'Стойка телескопическая 2.5-4м', unit: 'шт', price: 800, category: 'scaffold_catalog' },
        'prop_steel_3_5_5m': { name: 'Стойка телескопическая 3.5-5м', unit: 'шт', price: 1000, category: 'scaffold_catalog' }
    };
})();
