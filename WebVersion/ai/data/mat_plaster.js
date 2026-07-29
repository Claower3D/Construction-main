// === ШТУКАТУРКИ, ШПАКЛЁВКИ, ГРУНТОВКИ (60 позиций) ===
(function () {
    window.AI_MAT_PLASTER = {
        // Штукатурки гипсовые
        'plaster_gips_start': { name: 'Штукатурка гипсовая стартовая (30кг)', unit: 'мешок', price: 2200, category: 'plaster', consumption: 10, consumptionUnit: 'кг/м² при 10мм' },
        'plaster_rotband': { name: 'Штукатурка Ротбанд (30кг)', unit: 'мешок', price: 3200, category: 'plaster', consumption: 8.5, consumptionUnit: 'кг/м² при 10мм' },
        'plaster_gips_machine': { name: 'Штукатурка гипсовая машинная (30кг)', unit: 'мешок', price: 2000, category: 'plaster', consumption: 10, consumptionUnit: 'кг/м² при 10мм' },
        'plaster_gips_thin': { name: 'Штукатурка гипсовая тонкослойная (25кг)', unit: 'мешок', price: 2500, category: 'plaster', consumption: 8, consumptionUnit: 'кг/м² при 10мм' },

        // Штукатурки цементные
        'plaster_cement_universal': { name: 'Штукатурка цементная универсальная (25кг)', unit: 'мешок', price: 1200, category: 'plaster', consumption: 16, consumptionUnit: 'кг/м² при 10мм' },
        'plaster_cement_facade': { name: 'Штукатурка цементная фасадная (25кг)', unit: 'мешок', price: 1400, category: 'plaster', consumption: 15, consumptionUnit: 'кг/м² при 10мм' },
        'plaster_cement_machine': { name: 'Штукатурка цементная машинная (30кг)', unit: 'мешок', price: 1500, category: 'plaster', consumption: 14, consumptionUnit: 'кг/м² при 10мм' },
        'plaster_cement_light': { name: 'Штукатурка цементная лёгкая (25кг)', unit: 'мешок', price: 1800, category: 'plaster', consumption: 11, consumptionUnit: 'кг/м² при 10мм' },

        // Штукатурки известковые
        'plaster_lime_cement': { name: 'Штукатурка известково-цементная (25кг)', unit: 'мешок', price: 1000, category: 'plaster', consumption: 15, consumptionUnit: 'кг/м² при 10мм' },

        // Декоративные штукатурки
        'plaster_decor_bark': { name: 'Штукатурка декоративная «короед» (25кг)', unit: 'мешок', price: 2800, category: 'plaster', consumption: 3, consumptionUnit: 'кг/м²' },
        'plaster_decor_lamb': { name: 'Штукатурка декоративная «шуба» (25кг)', unit: 'мешок', price: 2500, category: 'plaster', consumption: 3.5, consumptionUnit: 'кг/м²' },
        'plaster_decor_silk': { name: 'Штукатурка шёлковая декоративная (1кг)', unit: 'шт', price: 4500, category: 'plaster', consumption: 0.3, consumptionUnit: 'кг/м²' },
        'plaster_decor_venetian': { name: 'Штукатурка венецианская (15кг)', unit: 'ведро', price: 12000, category: 'plaster', consumption: 0.5, consumptionUnit: 'кг/м²' },
        'plaster_decor_travertine': { name: 'Штукатурка декоративная травертин (25кг)', unit: 'мешок', price: 3500, category: 'plaster', consumption: 2, consumptionUnit: 'кг/м²' },

        // Шпаклёвки гипсовые
        'putty_gips_start': { name: 'Шпаклёвка гипсовая стартовая (25кг)', unit: 'мешок', price: 1800, category: 'plaster', consumption: 1.2, consumptionUnit: 'кг/м² при 1мм' },
        'putty_gips_finish': { name: 'Шпаклёвка гипсовая финишная (25кг)', unit: 'мешок', price: 2200, category: 'plaster', consumption: 0.8, consumptionUnit: 'кг/м² при 1мм' },
        'putty_gips_multi': { name: 'Шпаклёвка гипсовая мульти-финиш (25кг)', unit: 'мешок', price: 2500, category: 'plaster', consumption: 1, consumptionUnit: 'кг/м² при 1мм' },

        // Шпаклёвки полимерные
        'putty_polymer_lr': { name: 'Шпаклёвка полимерная LR+ (25кг)', unit: 'мешок', price: 3500, category: 'plaster', consumption: 1.2, consumptionUnit: 'кг/м² при 1мм' },
        'putty_polymer_kr': { name: 'Шпаклёвка полимерная KR (25кг)', unit: 'мешок', price: 3200, category: 'plaster', consumption: 1, consumptionUnit: 'кг/м² при 1мм' },
        'putty_polymer_paste': { name: 'Шпаклёвка полимерная готовая (28кг)', unit: 'ведро', price: 5500, category: 'plaster', consumption: 0.8, consumptionUnit: 'кг/м² при 1мм' },

        // Шпаклёвки цементные
        'putty_cement_facade': { name: 'Шпаклёвка цементная фасадная (25кг)', unit: 'мешок', price: 1400, category: 'plaster', consumption: 1.5, consumptionUnit: 'кг/м² при 1мм' },
        'putty_cement_grey': { name: 'Шпаклёвка цементная серая (25кг)', unit: 'мешок', price: 1100, category: 'plaster', consumption: 1.3, consumptionUnit: 'кг/м² при 1мм' },
        'putty_cement_white': { name: 'Шпаклёвка цементная белая (25кг)', unit: 'мешок', price: 1600, category: 'plaster', consumption: 1.3, consumptionUnit: 'кг/м² при 1мм' },

        // Грунтовки
        'primer_deep_5': { name: 'Грунтовка глубокого проникновения (5л)', unit: 'шт', price: 1200, category: 'plaster' },
        'primer_deep_10': { name: 'Грунтовка глубокого проникновения (10л)', unit: 'шт', price: 2000, category: 'plaster' },
        'primer_contact_14': { name: 'Бетоноконтакт (14кг)', unit: 'ведро', price: 3500, category: 'plaster' },
        'primer_contact_20': { name: 'Бетоноконтакт (20кг)', unit: 'ведро', price: 4800, category: 'plaster' },
        'primer_acrylic_5': { name: 'Грунтовка акриловая универсальная (5л)', unit: 'шт', price: 1000, category: 'plaster' },
        'primer_acrylic_10': { name: 'Грунтовка акриловая универсальная (10л)', unit: 'шт', price: 1700, category: 'plaster' },
        'primer_consolidating': { name: 'Грунтовка укрепляющая (10л)', unit: 'шт', price: 2500, category: 'plaster' },
        'primer_antifungal': { name: 'Грунтовка антигрибковая (5л)', unit: 'шт', price: 2200, category: 'plaster' },
        'primer_quartz_10': { name: 'Грунтовка кварцевая (10л)', unit: 'шт', price: 3000, category: 'plaster' },
        'primer_facade_10': { name: 'Грунтовка фасадная силиконовая (10л)', unit: 'шт', price: 3500, category: 'plaster' },

        // Наливной пол
        'floor_self_level_thin': { name: 'Наливной пол тонкослойный 2-10мм (25кг)', unit: 'мешок', price: 1800, category: 'plaster', consumption: 15, consumptionUnit: 'кг/м² при 10мм' },
        'floor_self_level_thick': { name: 'Наливной пол толстослойный 10-80мм (25кг)', unit: 'мешок', price: 1200, category: 'plaster', consumption: 17, consumptionUnit: 'кг/м² при 10мм' },
        'floor_self_level_gips': { name: 'Наливной пол гипсовый (25кг)', unit: 'мешок', price: 1500, category: 'plaster', consumption: 14, consumptionUnit: 'кг/м² при 10мм' },
        'floor_self_level_fast': { name: 'Наливной пол быстротвердеющий (25кг)', unit: 'мешок', price: 2200, category: 'plaster', consumption: 15, consumptionUnit: 'кг/м² при 10мм' },

        // Цемент
        'cement_m400_50': { name: 'Цемент ПЦ-400 (50кг)', unit: 'мешок', price: 1800, category: 'plaster' },
        'cement_m500_50': { name: 'Цемент ПЦ-500 (50кг)', unit: 'мешок', price: 2200, category: 'plaster' },
        'cement_white_50': { name: 'Цемент белый (50кг)', unit: 'мешок', price: 4500, category: 'plaster' },

        // Известь / гипс строительный
        'lime_hydrated_30': { name: 'Известь гашёная (30кг)', unit: 'мешок', price: 800, category: 'plaster' },
        'gypsum_build_30': { name: 'Гипс строительный Г-5 (30кг)', unit: 'мешок', price: 600, category: 'plaster' },
        'gypsum_alabaster_25': { name: 'Алебастр (25кг)', unit: 'мешок', price: 500, category: 'plaster' },

        // Маяки
        'beacon_6mm_3m': { name: 'Маяк штукатурный 6мм (3м)', unit: 'шт', price: 60, category: 'plaster' },
        'beacon_10mm_3m': { name: 'Маяк штукатурный 10мм (3м)', unit: 'шт', price: 70, category: 'plaster' },

        // Сетка штукатурная
        'mesh_fiberglass_5x5': { name: 'Сетка стеклотканевая 5×5мм (50м²)', unit: 'рулон', price: 2500, category: 'plaster' },
        'mesh_fiberglass_facade': { name: 'Сетка фасадная армирующая 5×5мм (50м²)', unit: 'рулон', price: 3500, category: 'plaster' },
        'mesh_metal_plaster': { name: 'Сетка металлическая штукатурная (1×10м)', unit: 'рулон', price: 2000, category: 'plaster' },

        // Уголки штукатурные
        'corner_plaster_metal': { name: 'Уголок штукатурный с сеткой (3м)', unit: 'шт', price: 120, category: 'plaster' },
        'corner_plaster_pvc': { name: 'Уголок ПВХ с сеткой (3м)', unit: 'шт', price: 80, category: 'plaster' },

        // Добавки
        'additive_plaster_retard': { name: 'Замедлитель схватывания гипса (1кг)', unit: 'шт', price: 350, category: 'plaster' },
        'additive_plaster_fiber': { name: 'Фибра полипропиленовая для штукатурки (600г)', unit: 'шт', price: 300, category: 'plaster' }
    };
})();
