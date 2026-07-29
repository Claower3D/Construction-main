// === КЛАДОЧНЫЕ МАТЕРИАЛЫ (60 позиций) ===
(function () {
    window.AI_MAT_MASONRY = {
        // Кирпич керамический
        'brick_ceramic_single': { name: 'Кирпич керамический одинарный М100', unit: 'шт', price: 35, category: 'masonry' },
        'brick_ceramic_single_m125': { name: 'Кирпич керамический одинарный М125', unit: 'шт', price: 40, category: 'masonry' },
        'brick_ceramic_single_m150': { name: 'Кирпич керамический одинарный М150', unit: 'шт', price: 45, category: 'masonry' },
        'brick_ceramic_1_5': { name: 'Кирпич керамический полуторный М100', unit: 'шт', price: 48, category: 'masonry' },
        'brick_ceramic_1_5_m125': { name: 'Кирпич керамический полуторный М125', unit: 'шт', price: 52, category: 'masonry' },
        'brick_ceramic_double': { name: 'Кирпич керамический двойной М150', unit: 'шт', price: 85, category: 'masonry' },
        'brick_ceramic_hollow': { name: 'Кирпич керамический пустотелый М100', unit: 'шт', price: 30, category: 'masonry' },
        'brick_ceramic_face': { name: 'Кирпич облицовочный керамический', unit: 'шт', price: 55, category: 'masonry' },
        'brick_ceramic_face_color': { name: 'Кирпич облицовочный цветной', unit: 'шт', price: 70, category: 'masonry' },

        // Кирпич силикатный
        'brick_silicate_single': { name: 'Кирпич силикатный одинарный М150', unit: 'шт', price: 22, category: 'masonry' },
        'brick_silicate_1_5': { name: 'Кирпич силикатный полуторный М150', unit: 'шт', price: 32, category: 'masonry' },
        'brick_silicate_double': { name: 'Кирпич силикатный двойной М150', unit: 'шт', price: 55, category: 'masonry' },
        'brick_silicate_face': { name: 'Кирпич силикатный облицовочный', unit: 'шт', price: 38, category: 'masonry' },

        // Кирпич огнеупорный
        'brick_fire_sha5': { name: 'Кирпич шамотный ША-5', unit: 'шт', price: 120, category: 'masonry' },
        'brick_fire_sha8': { name: 'Кирпич шамотный ША-8', unit: 'шт', price: 140, category: 'masonry' },

        // Газобетонные блоки
        'block_gas_d400_200': { name: 'Газоблок D400 200×300×600', unit: 'м³', price: 22000, category: 'masonry' },
        'block_gas_d400_250': { name: 'Газоблок D400 250×300×600', unit: 'м³', price: 22000, category: 'masonry' },
        'block_gas_d500_200': { name: 'Газоблок D500 200×300×600', unit: 'м³', price: 24000, category: 'masonry' },
        'block_gas_d500_250': { name: 'Газоблок D500 250×300×600', unit: 'м³', price: 24000, category: 'masonry' },
        'block_gas_d500_300': { name: 'Газоблок D500 300×300×600', unit: 'м³', price: 24500, category: 'masonry' },
        'block_gas_d500_375': { name: 'Газоблок D500 375×250×600', unit: 'м³', price: 25000, category: 'masonry' },
        'block_gas_d600_200': { name: 'Газоблок D600 200×300×600', unit: 'м³', price: 26000, category: 'masonry' },

        // Пенобетонные блоки
        'block_peno_d600_200': { name: 'Пеноблок D600 200×300×600', unit: 'м³', price: 18000, category: 'masonry' },
        'block_peno_d600_300': { name: 'Пеноблок D600 300×300×600', unit: 'м³', price: 18500, category: 'masonry' },
        'block_peno_d800_200': { name: 'Пеноблок D800 200×300×600', unit: 'м³', price: 20000, category: 'masonry' },

        // Керамзитобетонные блоки
        'block_keramzit_390_190': { name: 'Керамзитоблок 390×190×190 полнотелый', unit: 'шт', price: 80, category: 'masonry' },
        'block_keramzit_390_190_hollow': { name: 'Керамзитоблок 390×190×190 пустотелый', unit: 'шт', price: 65, category: 'masonry' },
        'block_keramzit_partition': { name: 'Керамзитоблок перегородочный 390×90×190', unit: 'шт', price: 45, category: 'masonry' },

        // Шлакоблок
        'block_slag_full': { name: 'Шлакоблок полнотелый 390×190×190', unit: 'шт', price: 55, category: 'masonry' },
        'block_slag_hollow': { name: 'Шлакоблок пустотелый 390×190×190', unit: 'шт', price: 45, category: 'masonry' },

        // Керамические поризованные блоки
        'block_porized_250': { name: 'Блок поризованный Porotherm 250мм', unit: 'шт', price: 180, category: 'masonry' },
        'block_porized_380': { name: 'Блок поризованный Porotherm 380мм', unit: 'шт', price: 280, category: 'masonry' },
        'block_porized_440': { name: 'Блок поризованный Porotherm 440мм', unit: 'шт', price: 350, category: 'masonry' },

        // ФБС (фундаментные блоки)
        'fbs_24_4_6': { name: 'ФБС 24.4.6', unit: 'шт', price: 8000, category: 'masonry' },
        'fbs_24_5_6': { name: 'ФБС 24.5.6', unit: 'шт', price: 10000, category: 'masonry' },
        'fbs_24_6_6': { name: 'ФБС 24.6.6', unit: 'шт', price: 12000, category: 'masonry' },
        'fbs_12_4_6': { name: 'ФБС 12.4.6', unit: 'шт', price: 4500, category: 'masonry' },
        'fbs_12_5_6': { name: 'ФБС 12.5.6', unit: 'шт', price: 5500, category: 'masonry' },
        'fbs_12_6_6': { name: 'ФБС 12.6.6', unit: 'шт', price: 6500, category: 'masonry' },
        'fbs_9_4_6': { name: 'ФБС 9.4.6', unit: 'шт', price: 3500, category: 'masonry' },
        'fl_10_12': { name: 'Фундаментная подушка ФЛ 10.12', unit: 'шт', price: 4000, category: 'masonry' },
        'fl_14_12': { name: 'Фундаментная подушка ФЛ 14.12', unit: 'шт', price: 6000, category: 'masonry' },

        // Перемычки
        'lintel_pb_13_1': { name: 'Перемычка ПБ 13-1', unit: 'шт', price: 1200, category: 'masonry' },
        'lintel_pb_16_1': { name: 'Перемычка ПБ 16-2', unit: 'шт', price: 1500, category: 'masonry' },
        'lintel_pb_22_3': { name: 'Перемычка ПБ 22-3', unit: 'шт', price: 2200, category: 'masonry' },
        'lintel_pb_29_4': { name: 'Перемычка ПБ 29-4', unit: 'шт', price: 3200, category: 'masonry' },

        // Клей для блоков
        'glue_gas_block_winter': { name: 'Клей для газоблока зимний (25кг)', unit: 'мешок', price: 1800, category: 'masonry' },
        'glue_gas_block_summer': { name: 'Клей для газоблока летний (25кг)', unit: 'мешок', price: 1500, category: 'masonry' },
        'glue_gas_block_thin': { name: 'Клей для газоблока тонкошовный (25кг)', unit: 'мешок', price: 2000, category: 'masonry' },
        'foam_glue_gas_block': { name: 'Клей-пена для газоблока (баллон)', unit: 'шт', price: 1200, category: 'masonry' },

        // Кладочная смесь
        'mortar_mix_m100_50': { name: 'Смесь кладочная М100 (50кг)', unit: 'мешок', price: 1100, category: 'masonry' },
        'mortar_mix_m150_50': { name: 'Смесь кладочная М150 (50кг)', unit: 'мешок', price: 1300, category: 'masonry' },
        'mortar_mix_m200_50': { name: 'Смесь кладочная М200 (50кг)', unit: 'мешок', price: 1500, category: 'masonry' },

        // Доборные элементы
        'ublock_gas_200': { name: 'U-блок газобетонный 200мм', unit: 'шт', price: 350, category: 'masonry' },
        'ublock_gas_300': { name: 'U-блок газобетонный 300мм', unit: 'шт', price: 450, category: 'masonry' },

        // Гибкие связи
        'tie_flexible_200': { name: 'Гибкая связь 200мм (для кладки)', unit: 'шт', price: 12, category: 'masonry' },
        'tie_flexible_250': { name: 'Гибкая связь 250мм (для кладки)', unit: 'шт', price: 15, category: 'masonry' }
    };
})();
