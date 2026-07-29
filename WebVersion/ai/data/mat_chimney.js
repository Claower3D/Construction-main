// === КАМИНЫ, ПЕЧИ, ДЫМОХОДЫ (35 позиций) ===
(function () {
    window.AI_MAT_CHIMNEY = {
        // Печи-камины
        'stove_cast_iron_8kw': { name: 'Печь-камин чугунная 8кВт', unit: 'шт', price: 120000, category: 'chimney' },
        'stove_cast_iron_12kw': { name: 'Печь-камин чугунная 12кВт', unit: 'шт', price: 180000, category: 'chimney' },
        'stove_steel_6kw': { name: 'Печь-камин стальная 6кВт', unit: 'шт', price: 60000, category: 'chimney' },
        'stove_steel_10kw': { name: 'Печь-камин стальная 10кВт', unit: 'шт', price: 100000, category: 'chimney' },
        'fireplace_insert_12kw': { name: 'Каминная топка 12кВт (стекло)', unit: 'шт', price: 150000, category: 'chimney' },
        'fireplace_insert_18kw': { name: 'Каминная топка 18кВт (стекло)', unit: 'шт', price: 250000, category: 'chimney' },

        // Электрокамины
        'fireplace_electric_insert': { name: 'Электрокамин встраиваемый (очаг 800мм)', unit: 'шт', price: 40000, category: 'chimney' },
        'fireplace_electric_wall': { name: 'Электрокамин настенный (1000мм)', unit: 'шт', price: 35000, category: 'chimney' },

        // Биокамины
        'biofireplace_table': { name: 'Биокамин настольный', unit: 'шт', price: 15000, category: 'chimney' },
        'biofireplace_wall': { name: 'Биокамин встраиваемый 700мм', unit: 'шт', price: 50000, category: 'chimney' },

        // Банные печи
        'stove_sauna_steel_8kw': { name: 'Печь банная стальная 8кВт (12м³)', unit: 'шт', price: 30000, category: 'chimney' },
        'stove_sauna_steel_14kw': { name: 'Печь банная стальная 14кВт (20м³)', unit: 'шт', price: 45000, category: 'chimney' },
        'stove_sauna_cast_16kw': { name: 'Печь банная чугунная 16кВт (24м³)', unit: 'шт', price: 80000, category: 'chimney' },
        'stove_sauna_electric_6kw': { name: 'Электрокаменка 6кВт (8м³)', unit: 'шт', price: 25000, category: 'chimney' },
        'stove_sauna_electric_9kw': { name: 'Электрокаменка 9кВт (14м³)', unit: 'шт', price: 40000, category: 'chimney' },
        'sauna_stones_20kg': { name: 'Камни для бани (20кг, жадеит)', unit: 'коробка', price: 5000, category: 'chimney' },
        'sauna_stones_talc_20': { name: 'Камни для бани (20кг, талькохлорит)', unit: 'коробка', price: 3500, category: 'chimney' },

        // Дымоходы керамические
        'chimney_ceramic_160_1m': { name: 'Дымоход керамический Ø160мм (1м)', unit: 'шт', price: 8000, category: 'chimney' },
        'chimney_ceramic_200_1m': { name: 'Дымоход керамический Ø200мм (1м)', unit: 'шт', price: 10000, category: 'chimney' },
        'chimney_ceramic_block': { name: 'Блок дымохода керамический (1м)', unit: 'шт', price: 5000, category: 'chimney' },
        'chimney_ceramic_tee': { name: 'Тройник дымохода керамический', unit: 'шт', price: 6000, category: 'chimney' },

        // Дымоходы из нержавеющей стали (одностенные)
        'chimney_ss_115_1m': { name: 'Труба дымохода нерж. Ø115мм (1м)', unit: 'шт', price: 1500, category: 'chimney' },
        'chimney_ss_150_1m': { name: 'Труба дымохода нерж. Ø150мм (1м)', unit: 'шт', price: 2000, category: 'chimney' },
        'chimney_ss_200_1m': { name: 'Труба дымохода нерж. Ø200мм (1м)', unit: 'шт', price: 3000, category: 'chimney' },

        // Печное литьё
        'stove_door_250x280': { name: 'Дверца печная 250×280мм (чугун)', unit: 'шт', price: 3000, category: 'chimney' },
        'stove_door_370x330': { name: 'Дверца печная со стеклом 370×330мм', unit: 'шт', price: 8000, category: 'chimney' },
        'stove_plate_2burner': { name: 'Плита чугунная 2-конфорочная', unit: 'шт', price: 5000, category: 'chimney' },
        'stove_grate_250x250': { name: 'Колосник чугунный 250×250мм', unit: 'шт', price: 1500, category: 'chimney' },
        'stove_damper_250x130': { name: 'Шибер (задвижка) дымохода 250×130мм', unit: 'шт', price: 1200, category: 'chimney' },

        // Огнеупорные материалы
        'firebrick_sha_8': { name: 'Кирпич огнеупорный ША-8 (шт)', unit: 'шт', price: 80, category: 'chimney' },
        'fireclay_mortar_25': { name: 'Раствор огнеупорный (шамотный, 25кг)', unit: 'мешок', price: 1200, category: 'chimney' },
        'fireproof_board_1000x600': { name: 'Плита огнеупорная 1000×600×30мм', unit: 'шт', price: 2500, category: 'chimney' },

        // Порталы каминные
        'portal_marble': { name: 'Портал каминный мраморный', unit: 'шт', price: 120000, category: 'chimney' },
        'portal_gypsum': { name: 'Портал каминный гипсовый', unit: 'шт', price: 30000, category: 'chimney' },
        'portal_wood': { name: 'Портал каминный деревянный', unit: 'шт', price: 45000, category: 'chimney' }
    };
})();
