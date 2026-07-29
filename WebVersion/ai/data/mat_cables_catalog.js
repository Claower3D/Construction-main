// === КАТАЛОГ КАБЕЛЬНОЙ ПРОДУКЦИИ — ТОЛЬКО УНИКАЛЬНЫЕ ПОЗИЦИИ (без дублей с mat_electrical.js) ===
// mat_electrical.js уже содержит: ВВГнг-LS (2x1.5–3x16), NYM, ПВС (0.75-4), СИП (2x16, 4x16),
// автоматы, УЗО, дифы, щиты, розетки, выключатели, гофра ПВХ (16-32), кабель-каналы, LED, WAGO, изолента
(function () {
    window.AI_MAT_CABLES_CATALOG = {
        // ВВГнг(А)-LS — сечения/жилы, которых НЕТ в mat_electrical.js
        'cable_vvg_2x2_5_100m': { name: 'ВВГнг(А)-LS 2×2.5мм² (100м)', unit: 'бухта', price: 2200, category: 'cables_catalog' },
        'cable_vvg_4x1_5_100m': { name: 'ВВГнг(А)-LS 4×1.5мм² (100м)', unit: 'бухта', price: 2500, category: 'cables_catalog' },
        'cable_vvg_4x2_5_100m': { name: 'ВВГнг(А)-LS 4×2.5мм² (100м)', unit: 'бухта', price: 4000, category: 'cables_catalog' },
        'cable_vvg_4x4_50m': { name: 'ВВГнг(А)-LS 4×4мм² (50м)', unit: 'бухта', price: 3000, category: 'cables_catalog' },
        'cable_vvg_4x6_50m': { name: 'ВВГнг(А)-LS 4×6мм² (50м)', unit: 'бухта', price: 4500, category: 'cables_catalog' },
        'cable_vvg_5x4_50m': { name: 'ВВГнг(А)-LS 5×4мм² (50м)', unit: 'бухта', price: 3500, category: 'cables_catalog' },
        'cable_vvg_5x6_50m': { name: 'ВВГнг(А)-LS 5×6мм² (50м)', unit: 'бухта', price: 5000, category: 'cables_catalog' },
        'cable_vvg_5x10_30m': { name: 'ВВГнг(А)-LS 5×10мм² (30м)', unit: 'бухта', price: 5000, category: 'cables_catalog' },
        'cable_vvg_5x16_20m': { name: 'ВВГнг(А)-LS 5×16мм² (20м)', unit: 'бухта', price: 5500, category: 'cables_catalog' },
        // СИП — доп. сечение (mat_electrical: 2x16, 4x16)
        'cable_sip_4_4x25_m': { name: 'СИП-4 4×25мм² (м.п.)', unit: 'м.п.', price: 70, category: 'cables_catalog' },
        // КГ (гибкий) — полностью уникальная категория
        'cable_kg_3x1_5_m': { name: 'КГ 3×1.5мм² (м.п.)', unit: 'м.п.', price: 30, category: 'cables_catalog' },
        'cable_kg_3x2_5_m': { name: 'КГ 3×2.5мм² (м.п.)', unit: 'м.п.', price: 45, category: 'cables_catalog' },
        'cable_kg_3x4_m': { name: 'КГ 3×4мм² (м.п.)', unit: 'м.п.', price: 65, category: 'cables_catalog' },
        'cable_kg_4x4_m': { name: 'КГ 4×4мм² (м.п.)', unit: 'м.п.', price: 85, category: 'cables_catalog' },
        // Провод заземления ПВ-3 (уникальная категория)
        'wire_pv3_1x6_green_100m': { name: 'ПВ-3 1×6мм² жёлто-зелёный (100м)', unit: 'бухта', price: 800, category: 'cables_catalog' },
        'wire_pv3_1x10_green_50m': { name: 'ПВ-3 1×10мм² жёлто-зелёный (50м)', unit: 'бухта', price: 800, category: 'cables_catalog' },
        'wire_pv3_1x16_green_50m': { name: 'ПВ-3 1×16мм² жёлто-зелёный (50м)', unit: 'бухта', price: 1200, category: 'cables_catalog' },
        // Гофра Ø40, Ø50 (mat_electrical: 16-32)
        'corrugated_40_25m': { name: 'Гофра ПВХ Ø40мм (25м)', unit: 'бухта', price: 160, category: 'cables_catalog' },
        'corrugated_50_15m': { name: 'Гофра ПВХ Ø50мм (15м)', unit: 'бухта', price: 150, category: 'cables_catalog' },
        // Гофра ПНД негорючая (уникальная)
        'corrugated_16_50m_fr': { name: 'Гофра ПНД Ø16мм негорючая (50м)', unit: 'бухта', price: 150, category: 'cables_catalog' },
        'corrugated_20_50m_fr': { name: 'Гофра ПНД Ø20мм негорючая (50м)', unit: 'бухта', price: 200, category: 'cables_catalog' },
        // Жёсткие трубы (уникальная категория)
        'pipe_rigid_20_3m': { name: 'Труба жёсткая Ø20мм (3м)', unit: 'шт', price: 30, category: 'cables_catalog' },
        'pipe_rigid_25_3m': { name: 'Труба жёсткая Ø25мм (3м)', unit: 'шт', price: 40, category: 'cables_catalog' },
        'pipe_rigid_32_3m': { name: 'Труба жёсткая Ø32мм (3м)', unit: 'шт', price: 50, category: 'cables_catalog' },
        // Стяжки нейлоновые (уникальная категория)
        'cable_tie_100x2_5_100': { name: 'Стяжка нейлоновая 100×2.5мм (100шт)', unit: 'уп.', price: 10, category: 'cables_catalog' },
        'cable_tie_200x3_6_100': { name: 'Стяжка нейлоновая 200×3.6мм (100шт)', unit: 'уп.', price: 20, category: 'cables_catalog' },
        'cable_tie_300x4_8_100': { name: 'Стяжка нейлоновая 300×4.8мм (100шт)', unit: 'уп.', price: 30, category: 'cables_catalog' },
        // Распаечные коробки (уникальная категория)
        'junction_box_80x80x50': { name: 'Коробка распаечная 80×80×50мм', unit: 'шт', price: 15, category: 'cables_catalog' },
        'junction_box_100x100x50': { name: 'Коробка распаечная 100×100×50мм', unit: 'шт', price: 20, category: 'cables_catalog' },
        'junction_box_150x110x70': { name: 'Коробка распаечная 150×110×70мм', unit: 'шт', price: 30, category: 'cables_catalog' },
        'junction_box_ip65_150x110': { name: 'Коробка распаечная IP65 150×110мм', unit: 'шт', price: 50, category: 'cables_catalog' },
        // Клеммные колодки (уникальная категория — mat_electrical содержит только WAGO)
        'terminal_block_3p': { name: 'Клеммная колодка 3-пин', unit: 'шт', price: 5, category: 'cables_catalog' },
        'terminal_block_5p': { name: 'Клеммная колодка 5-пин', unit: 'шт', price: 8, category: 'cables_catalog' },
        'terminal_block_12p': { name: 'Клеммная колодка 12-пин', unit: 'шт', price: 15, category: 'cables_catalog' },
        // Наконечники обжимные (уникальная категория)
        'lug_crimp_1_5_100': { name: 'Наконечник обжимной 1.5мм² (100шт)', unit: 'уп.', price: 30, category: 'cables_catalog' },
        'lug_crimp_2_5_100': { name: 'Наконечник обжимной 2.5мм² (100шт)', unit: 'уп.', price: 40, category: 'cables_catalog' },
        // Клипсы для гофры (уникальная категория)
        'clip_20mm_100': { name: 'Клипса для гофры Ø20мм (100шт)', unit: 'уп.', price: 20, category: 'cables_catalog' },
        'clip_25mm_100': { name: 'Клипса для гофры Ø25мм (100шт)', unit: 'уп.', price: 25, category: 'cables_catalog' },
        'clip_32mm_50': { name: 'Клипса для гофры Ø32мм (50шт)', unit: 'уп.', price: 20, category: 'cables_catalog' }
    };
})();
