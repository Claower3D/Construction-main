// === ЛЕСТНИЦЫ ВНУТРЕННИЕ, ДЕКОР, ЖБ-ИЗДЕЛИЯ (40 позиций) ===
(function () {
    window.AI_MAT_SPECIAL = {
        // Лестницы интерьерные
        'stair_wood_step': { name: 'Ступень деревянная дуб (1200×300×40)', unit: 'шт', price: 6000, category: 'special' },
        'stair_wood_riser': { name: 'Подступенок деревянный (1200×200)', unit: 'шт', price: 2000, category: 'special' },
        'stair_wood_baluster': { name: 'Балясина деревянная', unit: 'шт', price: 1200, category: 'special' },
        'stair_wood_handrail': { name: 'Поручень деревянный (п.м.)', unit: 'п.м.', price: 2000, category: 'special' },
        'stair_wood_newel': { name: 'Столб опорный деревянный', unit: 'шт', price: 3500, category: 'special' },
        'stair_metal_baluster': { name: 'Балясина металлическая (нерж.)', unit: 'шт', price: 1500, category: 'special' },
        'stair_metal_handrail': { name: 'Поручень нержавеющий (п.м.)', unit: 'п.м.', price: 3000, category: 'special' },
        'stair_glass_panel': { name: 'Ограждение стеклянное для лестницы (м²)', unit: 'м²', price: 12000, category: 'special' },
        'stair_ready_module': { name: 'Лестница модульная (на 3м, комплект)', unit: 'комплект', price: 120000, category: 'special' },
        'stair_spiral_metal': { name: 'Лестница винтовая металлическая (Ø1.4м)', unit: 'шт', price: 80000, category: 'special' },

        // ЖБИ
        'slab_pk_63_12': { name: 'Плита перекрытия ПК 63.12-8', unit: 'шт', price: 35000, category: 'special' },
        'slab_pk_48_12': { name: 'Плита перекрытия ПК 48.12-8', unit: 'шт', price: 28000, category: 'special' },
        'slab_pk_36_12': { name: 'Плита перекрытия ПК 36.12-8', unit: 'шт', price: 22000, category: 'special' },
        'slab_pk_24_12': { name: 'Плита перекрытия ПК 24.12-8', unit: 'шт', price: 16000, category: 'special' },
        'pile_sn_30_300': { name: 'Свая ж/б С-30.300-3 (3м)', unit: 'шт', price: 4000, category: 'special' },
        'pile_sn_40_300': { name: 'Свая ж/б С-40.300-4 (4м)', unit: 'шт', price: 6000, category: 'special' },
        'pile_sn_60_300': { name: 'Свая ж/б С-60.300-6 (6м)', unit: 'шт', price: 10000, category: 'special' },
        'stair_march_28': { name: 'Марш лестничный ЛМ 28 (2800мм)', unit: 'шт', price: 25000, category: 'special' },
        'stair_platform': { name: 'Площадка лестничная ЛП', unit: 'шт', price: 15000, category: 'special' },
        'lintel_pb_16': { name: 'Перемычка ж/б ПБ 16 (1550мм)', unit: 'шт', price: 800, category: 'special' },
        'lintel_pb_21': { name: 'Перемычка ж/б ПБ 21 (2070мм)', unit: 'шт', price: 1200, category: 'special' },
        'lintel_pb_27': { name: 'Перемычка ж/б ПБ 27 (2720мм)', unit: 'шт', price: 1800, category: 'special' },

        // Декоративные элементы
        'decor_plinth_mdf_80': { name: 'Молдинг декоративный МДФ 80мм (2.4м)', unit: 'шт', price: 600, category: 'special' },
        'decor_panel_3d': { name: 'Панель стеновая 3D гипсовая (50×50)', unit: 'шт', price: 800, category: 'special' },
        'decor_panel_mdf': { name: 'Панель стеновая МДФ рейки (м²)', unit: 'м²', price: 3000, category: 'special' },
        'decor_brick_gypsum': { name: 'Декоративный камень / кирпич (гипс, м²)', unit: 'м²', price: 1500, category: 'special' },
        'decor_stone_natural': { name: 'Камень натуральный облицовочный (м²)', unit: 'м²', price: 5000, category: 'special' },

        // Защита / СИЗ (строительная)
        'helmet_safety': { name: 'Каска строительная', unit: 'шт', price: 500, category: 'special' },
        'vest_signal': { name: 'Жилет сигнальный', unit: 'шт', price: 300, category: 'special' },
        'gloves_work': { name: 'Перчатки рабочие (12 пар)', unit: 'уп.', price: 600, category: 'special' },
        'glasses_safety': { name: 'Очки защитные', unit: 'шт', price: 350, category: 'special' },
        'respirator_ffp2': { name: 'Респиратор FFP2', unit: 'шт', price: 200, category: 'special' },
        'earplugs': { name: 'Беруши (уп. 50 пар)', unit: 'уп.', price: 800, category: 'special' },
        'harness_full_body': { name: 'Страховочная привязь (полная)', unit: 'шт', price: 8000, category: 'special' },
        'safety_rope_10m': { name: 'Строп страховочный (10м)', unit: 'шт', price: 3000, category: 'special' },

        // Клеи специальные
        'glue_epoxy_2comp': { name: 'Клей эпоксидный 2-компонентный (1кг)', unit: 'шт', price: 1500, category: 'special' },
        'glue_construction_375': { name: 'Клей строительный универсальный (375г)', unit: 'шт', price: 300, category: 'special' },
        'glue_mirror': { name: 'Клей для зеркал (310мл)', unit: 'шт', price: 350, category: 'special' },
        'glue_pvc_pipe_500': { name: 'Клей для ПВХ труб (500г)', unit: 'шт', price: 800, category: 'special' }
    };
})();
