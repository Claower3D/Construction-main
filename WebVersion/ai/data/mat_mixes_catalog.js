// === КАТАЛОГ СУХИХ СМЕСЕЙ РАСШИРЕННЫЙ — ОЧИЩЕННЫЙ (без дублей с mat_drymix_catalog.js) ===
// mat_drymix_catalog.js уже содержит: штукатурки (гипсовые стандарт/машинные, цементные стандарт/фасадные/лёгкие/тёплые),
// шпатлёвки (гипс стартовая/финиш, полимер финиш/суперфиниш, цемент фасадная, готовая паста),
// наливные полы (базовый/тонкослойный/финишный/быстротвердеющий/гипсовый/высоконаполненный),
// стяжки (М150-М300, полусухая, с фиброволокном), клей для плитки (C1/C1T/C2/C2TE/C2TES1/белый/бассейн/клинкер),
// клей для утеплителя, клей для газобетона/ПГП, кладочные М50-М200, ЦПС М100-М300, пескобетон,
// гидроизоляция сухая, ремонтные смеси, затирки, монтажный гипсовый клей
(function () {
    window.AI_MAT_MIXES_CATALOG = {
        // Декоративные штукатурки (НЕТ в drymix_catalog, кроме базовых)
        'plaster_decor_bark_25kg': { name: 'Штукатурка декоративная «короед» (25кг)', unit: 'мешок', price: 800, category: 'mixes_catalog' },
        'plaster_decor_lamb_25kg': { name: 'Штукатурка декоративная «барашек» (25кг)', unit: 'мешок', price: 800, category: 'mixes_catalog' },
        'plaster_decor_silk_1kg': { name: 'Штукатурка декоративная «шёлк» (1кг)', unit: 'шт', price: 1000, category: 'mixes_catalog' },
        'plaster_decor_venetian_4kg': { name: 'Штукатурка венецианская (4кг)', unit: 'шт', price: 3000, category: 'mixes_catalog' },
        'plaster_decor_travertine_15kg': { name: 'Штукатурка декор. «травертин» (15кг)', unit: 'шт', price: 4000, category: 'mixes_catalog' },
        'plaster_decor_microcement_20kg': { name: 'Микроцемент декоративный (20кг)', unit: 'шт', price: 5000, category: 'mixes_catalog' },
        // Тонкослойная гипсовая (НЕТ в drymix)
        'plaster_gypsum_thin_25kg': { name: 'Штукатурка гипсовая тонкослойн. (25кг)', unit: 'мешок', price: 550, category: 'mixes_catalog' },
        // Штукатурка известковая (НЕТ в drymix)
        'plaster_cement_lime_25kg': { name: 'Штукатурка цементно-известковая (25кг)', unit: 'мешок', price: 350, category: 'mixes_catalog' },
        // Клеи для плитки — спец. типы (НЕТ в drymix)
        'tile_glue_large_25kg': { name: 'Клей для крупноформатной плитки (25кг)', unit: 'мешок', price: 700, category: 'mixes_catalog' },
        'tile_glue_outdoor_25kg': { name: 'Клей для плитки наружный морозостойкий (25кг)', unit: 'мешок', price: 600, category: 'mixes_catalog' },
        // Клей для утеплителя — специфичные (НЕТ в drymix)
        'insul_glue_eps_25kg': { name: 'Клей для пенополистирола (25кг)', unit: 'мешок', price: 400, category: 'mixes_catalog' },
        'insul_glue_wool_25kg': { name: 'Клей для минваты (25кг)', unit: 'мешок', price: 500, category: 'mixes_catalog' },
        // Кладочные — цветные (НЕТ в drymix)
        'mortar_masonry_white_25kg': { name: 'Раствор кладочный белый (25кг)', unit: 'мешок', price: 400, category: 'mixes_catalog' },
        'mortar_masonry_color_25kg': { name: 'Раствор кладочный цветной (25кг)', unit: 'мешок', price: 500, category: 'mixes_catalog' },
        // Клей для блоков зимний (НЕТ в drymix)
        'mortar_block_glue_winter_25kg': { name: 'Клей для газоблоков зимний (25кг)', unit: 'мешок', price: 400, category: 'mixes_catalog' },
        // Цемент (уникальная категория — в drymix нет цемента)
        'cement_m400_50kg': { name: 'Цемент М400 (50кг)', unit: 'мешок', price: 300, category: 'mixes_catalog' },
        'cement_m500_50kg': { name: 'Цемент М500 (50кг)', unit: 'мешок', price: 400, category: 'mixes_catalog' },
        'cement_white_50kg': { name: 'Цемент белый (50кг)', unit: 'мешок', price: 800, category: 'mixes_catalog' },
        // Затирки эпоксидные (в drymix — только цементные)
        'grout_epoxy_2_5kg': { name: 'Затирка эпоксидная 2.5кг', unit: 'шт', price: 2000, category: 'mixes_catalog' },
        'grout_epoxy_5kg': { name: 'Затирка эпоксидная 5кг', unit: 'шт', price: 3500, category: 'mixes_catalog' },
        // Гидроизоляция проникающая (НЕТ в drymix как 25кг — есть osmotic 25 со своим ключом)
        'hydro_penetrate_5kg': { name: 'Гидроизоляция проникающая (5кг)', unit: 'шт', price: 500, category: 'mixes_catalog' },
        // Гидропломба (НЕТ в drymix)
        'hydro_plug_5kg': { name: 'Быстропломба (гидропломба) (5кг)', unit: 'шт', price: 500, category: 'mixes_catalog' },
        // Ремонтные составы (уникальные типы)
        'repair_mortar_thixo_25kg': { name: 'Ремонтный состав тиксотропный (25кг)', unit: 'мешок', price: 800, category: 'mixes_catalog' },
        'repair_mortar_non_shrink_25kg': { name: 'Безусадочная подливка (25кг)', unit: 'мешок', price: 700, category: 'mixes_catalog' },
        // Грунтовки (уникальная категория — в drymix нет грунтовок)
        'primer_deep_10l': { name: 'Грунтовка глубокого проникн. (10л)', unit: 'шт', price: 400, category: 'mixes_catalog' },
        'primer_concrete_contact_20kg': { name: 'Бетоноконтакт (20кг)', unit: 'ведро', price: 1000, category: 'mixes_catalog' },
        'primer_universal_10l': { name: 'Грунтовка универсальная (10л)', unit: 'шт', price: 300, category: 'mixes_catalog' },
        'primer_anti_mildew_5l': { name: 'Грунтовка антисептическая (5л)', unit: 'шт', price: 500, category: 'mixes_catalog' }
    };
})();
