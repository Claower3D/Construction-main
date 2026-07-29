// === ПОДГОТОВКА ОСНОВАНИЙ: СТЯЖКИ, КЛЕИ, СМ (40 позиций) ===
(function () {
    window.AI_MAT_SCREED = {
        // Сухие стяжки
        'screed_cement_m150_25': { name: 'Стяжка цементная М-150 (25кг)', unit: 'мешок', price: 800, category: 'screed', consumption: 20, consumptionUnit: 'кг/м² при 10мм' },
        'screed_cement_m200_25': { name: 'Стяжка цементная М-200 (25кг)', unit: 'мешок', price: 1000, category: 'screed', consumption: 20, consumptionUnit: 'кг/м² при 10мм' },
        'screed_cement_fiber': { name: 'Стяжка цементная армированная (25кг)', unit: 'мешок', price: 1200, category: 'screed', consumption: 19, consumptionUnit: 'кг/м² при 10мм' },
        'screed_gypsum_25': { name: 'Стяжка гипсовая самовыравнивающаяся (25кг)', unit: 'мешок', price: 1500, category: 'screed', consumption: 15, consumptionUnit: 'кг/м² при 10мм' },

        // Наливные полы (дубликаты в plaster есть, здесь спец.)
        'floor_self_level_universal': { name: 'Ровнитель универсальный 5-50мм (25кг)', unit: 'мешок', price: 1400, category: 'screed', consumption: 16, consumptionUnit: 'кг/м² при 10мм' },
        'floor_self_level_finish': { name: 'Ровнитель финишный 2-10мм (25кг)', unit: 'мешок', price: 2000, category: 'screed', consumption: 14, consumptionUnit: 'кг/м² при 10мм' },
        'floor_primer_concrete': { name: 'Грунтовка для бетонного пола (10л)', unit: 'шт', price: 2500, category: 'screed' },

        // Сухая стяжка (Кнауф-стиль)
        'dry_screed_gvl_20': { name: 'Элемент пола ГВЛ 20мм (1200×600)', unit: 'лист', price: 450, category: 'screed' },
        'dry_screed_keramzit': { name: 'Засыпка керамзитовая (мешок 40л)', unit: 'мешок', price: 250, category: 'screed' },
        'dry_screed_pe_film': { name: 'Плёнка ПЭ разделительная (3×10м)', unit: 'шт', price: 200, category: 'screed' },
        'dry_screed_profile_guide': { name: 'Профиль направляющий для сухой стяжки', unit: 'шт', price: 100, category: 'screed' },

        // Кладочные смеси
        'mix_masonry_m100_25': { name: 'Смесь кладочная М-100 (25кг)', unit: 'мешок', price: 600, category: 'screed', consumption: 20, consumptionUnit: 'кг/м² кладки' },
        'mix_masonry_m150_25': { name: 'Смесь кладочная М-150 (25кг)', unit: 'мешок', price: 700, category: 'screed', consumption: 20, consumptionUnit: 'кг/м² кладки' },
        'mix_masonry_m200_25': { name: 'Смесь кладочная М-200 (25кг)', unit: 'мешок', price: 800, category: 'screed', consumption: 20, consumptionUnit: 'кг/м² кладки' },

        // Клеи для блоков
        'glue_block_gas_25': { name: 'Клей для газобетона (25кг)', unit: 'мешок', price: 1200, category: 'screed', consumption: 5, consumptionUnit: 'кг/м² кладки' },
        'glue_block_gas_winter': { name: 'Клей для газобетона зимний (25кг)', unit: 'мешок', price: 1500, category: 'screed' },
        'glue_block_foam_25': { name: 'Клей для пеноблоков (25кг)', unit: 'мешок', price: 1200, category: 'screed' },

        // Монтажный клей-пена для блоков
        'foam_glue_block_750': { name: 'Клей-пена монтажная для блоков (750мл)', unit: 'шт', price: 800, category: 'screed' },

        // Затирка швов кладки
        'grout_masonry_25': { name: 'Затирка для кладки (25кг)', unit: 'мешок', price: 1500, category: 'screed' },

        // Эпоксидные полы
        'floor_epoxy_2comp_20': { name: 'Пол эпоксидный 2-компонентный (20кг)', unit: 'комплект', price: 12000, category: 'screed' },
        'floor_pu_2comp_20': { name: 'Пол полиуретановый 2-комп. (20кг)', unit: 'комплект', price: 15000, category: 'screed' },

        // Ремонтные составы
        'repair_compound_5': { name: 'Ремонтная смесь быстротвердеющая (5кг)', unit: 'шт', price: 600, category: 'screed' },
        'repair_compound_25': { name: 'Ремонтная смесь для бетона (25кг)', unit: 'мешок', price: 1500, category: 'screed' },
        'concrete_contact_primer': { name: 'Грунтовка «бетоноконтакт» (14кг)', unit: 'ведро', price: 3500, category: 'screed' },

        // Смеси для тёплого пола
        'screed_warm_floor_25': { name: 'Стяжка для тёплого пола (25кг)', unit: 'мешок', price: 1200, category: 'screed' },
        'plastifier_warm': { name: 'Пластификатор для тёплого пола (10л)', unit: 'шт', price: 1500, category: 'screed' },

        // Противоморозные добавки
        'antifreeze_additive_5': { name: 'Добавка противоморозная (5л)', unit: 'шт', price: 800, category: 'screed' },
        'antifreeze_additive_10': { name: 'Добавка противоморозная (10л)', unit: 'шт', price: 1400, category: 'screed' },

        // Фибра для стяжки
        'fiber_pp_600g': { name: 'Фибра полипропиленовая (600г)', unit: 'шт', price: 200, category: 'screed' },
        'fiber_basalt_1kg': { name: 'Фибра базальтовая (1кг)', unit: 'шт', price: 500, category: 'screed' },
        'fiber_steel_25kg': { name: 'Фибра стальная (25кг)', unit: 'мешок', price: 12000, category: 'screed' },

        // Полиэтилен / подготовка
        'pe_film_200mkr_3x10': { name: 'Плёнка ПЭ 200мкр (3×10м)', unit: 'шт', price: 500, category: 'screed' },
        'pe_film_150mkr_3x10': { name: 'Плёнка ПЭ 150мкр (3×10м)', unit: 'шт', price: 350, category: 'screed' },
        'demper_tape_floor': { name: 'Лента демпферная для стяжки (10мм×150мм)', unit: 'рулон 30м', price: 800, category: 'screed' },

        // Маяки для стяжки
        'beacon_floor_10mm': { name: 'Маяк для стяжки 10мм (3м)', unit: 'шт', price: 70, category: 'screed' },

        // Армирование стяжки
        'mesh_road_100x100_5': { name: 'Сетка кладочная 100×100×5мм (1×2м)', unit: 'лист', price: 400, category: 'screed' },
        'mesh_road_50x50_4': { name: 'Сетка кладочная 50×50×4мм (1×2м)', unit: 'лист', price: 500, category: 'screed' },

        // Упрочнитель (топпинг)
        'topping_25': { name: 'Топпинг (упрочнитель бетонного пола, 25кг)', unit: 'мешок', price: 1500, category: 'screed' },
        'concrete_lacquer_10': { name: 'Лак по бетону (10л)', unit: 'шт', price: 4000, category: 'screed' }
    };
})();
