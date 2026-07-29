// === КАТАЛОГ ГЕРМЕТИКОВ И КЛЕЁВ — ОЧИЩЕННЫЙ (без дублей с mat_fasteners.js) ===
// mat_fasteners.js уже содержит: пена монтажная (стандарт + огнестойкая),
// герметик силиконовый 280мл, герметик акриловый 280мл, жидкие гвозди 400г
(function () {
    window.AI_MAT_SEALANTS_CATALOG = {
        // Силиконовые — специализированные (mat_fasteners: только 1 базовый)
        'sealant_silicone_transp_280': { name: 'Герметик силиконовый прозрачный (280мл)', unit: 'шт', price: 100, category: 'sealants_catalog' },
        'sealant_silicone_sanit_280': { name: 'Герметик силиконовый санитарный (280мл)', unit: 'шт', price: 150, category: 'sealants_catalog' },
        'sealant_silicone_neutral_280': { name: 'Герметик силиконовый нейтральный (280мл)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'sealant_silicone_hi_temp_280': { name: 'Герметик силиконовый жаростойкий (280мл)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'sealant_silicone_aquarium': { name: 'Герметик силиконовый аквариумный (280мл)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        // Акриловый паркетный (уникальная специализация)
        'sealant_acrylic_parquet_280': { name: 'Герметик акриловый паркетный (280мл)', unit: 'шт', price: 120, category: 'sealants_catalog' },
        // Полиуретановые (уникальная категория)
        'sealant_pu_gray_600': { name: 'Герметик полиуретановый серый (600мл)', unit: 'шт', price: 400, category: 'sealants_catalog' },
        'sealant_pu_black_600': { name: 'Герметик полиуретановый чёрный (600мл)', unit: 'шт', price: 400, category: 'sealants_catalog' },
        'sealant_pu_white_310': { name: 'Герметик полиуретановый белый (310мл)', unit: 'шт', price: 300, category: 'sealants_catalog' },
        // MS-полимерный (уникальная категория)
        'sealant_ms_white_290': { name: 'Герметик MS-полимер белый (290мл)', unit: 'шт', price: 300, category: 'sealants_catalog' },
        'sealant_ms_transp_290': { name: 'Герметик MS-полимер прозрачный (290мл)', unit: 'шт', price: 350, category: 'sealants_catalog' },
        'sealant_ms_gray_290': { name: 'Герметик MS-полимер серый (290мл)', unit: 'шт', price: 300, category: 'sealants_catalog' },
        // Бутиловая лента (уникальная)
        'sealant_butyl_tape_15mm': { name: 'Лента бутиловая 15мм×10м', unit: 'шт', price: 100, category: 'sealants_catalog' },
        'sealant_butyl_tape_20mm': { name: 'Лента бутиловая 20мм×10м', unit: 'шт', price: 130, category: 'sealants_catalog' },
        // Пена — виды, которых НЕТ в mat_fasteners.js (зимняя, низкого расширения)
        'foam_pro_winter_750ml': { name: 'Пена монтажная зимняя (750мл)', unit: 'шт', price: 350, category: 'sealants_catalog' },
        'foam_low_expansion_750ml': { name: 'Пена монтажная низкого расшир. (750мл)', unit: 'шт', price: 350, category: 'sealants_catalog' },
        'foam_gun_pro': { name: 'Пистолет для монтажной пены', unit: 'шт', price: 300, category: 'sealants_catalog' },
        'foam_cleaner_500ml': { name: 'Очиститель монтажной пены (500мл)', unit: 'шт', price: 100, category: 'sealants_catalog' },
        // Пистолеты для герметика (уникальная)
        'caulk_gun_standard': { name: 'Пистолет для герметика стандарт', unit: 'шт', price: 50, category: 'sealants_catalog' },
        'caulk_gun_pro': { name: 'Пистолет для герметика усиленный', unit: 'шт', price: 150, category: 'sealants_catalog' },
        'caulk_gun_600ml': { name: 'Пистолет для колбас 600мл', unit: 'шт', price: 200, category: 'sealants_catalog' },
        // Жидкие гвозди — специализированные (mat_fasteners: только 1 вид)
        'liquid_nails_heavy_310': { name: 'Жидкие гвозди сверхсильные (310мл)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'liquid_nails_mirror_310': { name: 'Жидкие гвозди для зеркал (310мл)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'liquid_nails_wood_310': { name: 'Жидкие гвозди для дерева (310мл)', unit: 'шт', price: 180, category: 'sealants_catalog' },
        // Клеи строительные (уникальная категория)
        'glue_pva_d3_1kg': { name: 'Клей ПВА D3 (1кг)', unit: 'шт', price: 100, category: 'sealants_catalog' },
        'glue_pva_d3_5kg': { name: 'Клей ПВА D3 (5кг)', unit: 'шт', price: 400, category: 'sealants_catalog' },
        'glue_contact_1l': { name: 'Клей контактный (1л)', unit: 'шт', price: 300, category: 'sealants_catalog' },
        'glue_super_20g': { name: 'Суперклей 20г', unit: 'шт', price: 50, category: 'sealants_catalog' },
        'glue_epoxy_2comp_250g': { name: 'Клей эпоксидный 2-компон. (250г)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'glue_epoxy_2comp_1kg': { name: 'Клей эпоксидный 2-компон. (1кг)', unit: 'шт', price: 500, category: 'sealants_catalog' },
        'glue_hot_melt_sticks_1kg': { name: 'Стержни для клеевого пистолета (1кг)', unit: 'уп.', price: 100, category: 'sealants_catalog' },
        'glue_gun_40w': { name: 'Клеевой пистолет 40Вт', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'glue_gun_80w': { name: 'Клеевой пистолет 80Вт', unit: 'шт', price: 500, category: 'sealants_catalog' },
        // Клей для напольных покрытий (уникальная)
        'floor_glue_linoleum_14kg': { name: 'Клей для линолеума (14кг)', unit: 'ведро', price: 500, category: 'sealants_catalog' },
        'floor_glue_parquet_16kg': { name: 'Клей для паркета (16кг)', unit: 'ведро', price: 1500, category: 'sealants_catalog' },
        'floor_glue_carpet_14kg': { name: 'Клей для ковровых покрытий (14кг)', unit: 'ведро', price: 500, category: 'sealants_catalog' },
        'floor_glue_pvctile_14kg': { name: 'Клей для ПВХ-плитки (14кг)', unit: 'ведро', price: 700, category: 'sealants_catalog' },
        'floor_tape_ds_50mm': { name: 'Лента двусторонняя для пола 50мм (25м)', unit: 'шт', price: 300, category: 'sealants_catalog' },
        // Гидроизоляция жидкая (уникальная)
        'hydro_liquid_5kg': { name: 'Гидроизоляция мастичная обмазочная (5кг)', unit: 'ведро', price: 500, category: 'sealants_catalog' },
        'hydro_liquid_14kg': { name: 'Гидроизоляция мастичная обмазочная (14кг)', unit: 'ведро', price: 1200, category: 'sealants_catalog' },
        'hydro_liquid_20kg': { name: 'Гидроизоляция мастичная обмазочная (20кг)', unit: 'ведро', price: 1800, category: 'sealants_catalog' },
        'hydro_tape_100mm_10m': { name: 'Лента гидроизоляционная 100мм (10м)', unit: 'шт', price: 200, category: 'sealants_catalog' },
        'hydro_corner_inner': { name: 'Манжета гидроизоляц. угол внутренний', unit: 'шт', price: 30, category: 'sealants_catalog' },
        'hydro_corner_outer': { name: 'Манжета гидроизоляц. угол наружный', unit: 'шт', price: 30, category: 'sealants_catalog' },
        'hydro_pipe_sleeve_50': { name: 'Манжета гидроизоляц. для трубы Ø50', unit: 'шт', price: 50, category: 'sealants_catalog' },
        // Антисептики / пропитки (уникальная)
        'antiseptic_wood_5l': { name: 'Антисептик для древесины (5л)', unit: 'шт', price: 500, category: 'sealants_catalog' },
        'antiseptic_wood_10l': { name: 'Антисептик для древесины (10л)', unit: 'шт', price: 900, category: 'sealants_catalog' },
        'fire_retardant_wood_10l': { name: 'Огнебиозащита для дерева (10л)', unit: 'шт', price: 1000, category: 'sealants_catalog' },
        'fire_retardant_wood_20l': { name: 'Огнебиозащита для дерева (20л)', unit: 'шт', price: 1800, category: 'sealants_catalog' },
        'wood_stain_oil_1l': { name: 'Масло для дерева тонирующее (1л)', unit: 'шт', price: 500, category: 'sealants_catalog' },
        'wood_wax_1l': { name: 'Воск для дерева (1л)', unit: 'шт', price: 600, category: 'sealants_catalog' }
    };
})();
