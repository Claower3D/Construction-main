// === МОНТАЖ СБОРНОГО Ж/Б — плиты, перемычки, лестницы, колонны, балки, ФБС (200 поз.) ===
(function () {
    window.AI_WRK_PRECAST = {
        // === ФУНДАМЕНТНЫЕ БЛОКИ ===
        'wrk_pc_fbs_24_4_6': { name: 'Монтаж ФБС 24.4.6', unit: 'шт', price: 3500, category: 'precast' },
        'wrk_pc_fbs_24_5_6': { name: 'Монтаж ФБС 24.5.6', unit: 'шт', price: 4200, category: 'precast' },
        'wrk_pc_fbs_24_6_6': { name: 'Монтаж ФБС 24.6.6', unit: 'шт', price: 5000, category: 'precast' },
        'wrk_pc_fbs_12_4_6': { name: 'Монтаж ФБС 12.4.6', unit: 'шт', price: 2500, category: 'precast' },
        'wrk_pc_fbs_12_5_6': { name: 'Монтаж ФБС 12.5.6', unit: 'шт', price: 3000, category: 'precast' },
        'wrk_pc_fbs_12_6_6': { name: 'Монтаж ФБС 12.6.6', unit: 'шт', price: 3500, category: 'precast' },
        'wrk_pc_fbs_9_4_6': { name: 'Монтаж ФБС 9.4.6', unit: 'шт', price: 2200, category: 'precast' },
        'wrk_pc_fbs_9_6_6': { name: 'Монтаж ФБС 9.6.6', unit: 'шт', price: 3000, category: 'precast' },
        'wrk_pc_fl_10_24': { name: 'Монтаж подушки ФЛ 10.24', unit: 'шт', price: 3500, category: 'precast' },
        'wrk_pc_fl_14_24': { name: 'Монтаж подушки ФЛ 14.24', unit: 'шт', price: 4500, category: 'precast' },
        'wrk_pc_fl_16_24': { name: 'Монтаж подушки ФЛ 16.24', unit: 'шт', price: 5500, category: 'precast' },
        // === ПЛИТЫ ПЕРЕКРЫТИЯ ===
        'wrk_pc_slab_pk_48_12': { name: 'Монтаж плиты ПК 48.12', unit: 'шт', price: 5500, category: 'precast' },
        'wrk_pc_slab_pk_48_15': { name: 'Монтаж плиты ПК 48.15', unit: 'шт', price: 6500, category: 'precast' },
        'wrk_pc_slab_pk_60_12': { name: 'Монтаж плиты ПК 60.12', unit: 'шт', price: 7000, category: 'precast' },
        'wrk_pc_slab_pk_60_15': { name: 'Монтаж плиты ПК 60.15', unit: 'шт', price: 8000, category: 'precast' },
        'wrk_pc_slab_pk_63_12': { name: 'Монтаж плиты ПК 63.12', unit: 'шт', price: 7500, category: 'precast' },
        'wrk_pc_slab_pk_63_15': { name: 'Монтаж плиты ПК 63.15', unit: 'шт', price: 8500, category: 'precast' },
        'wrk_pc_slab_pk_72_12': { name: 'Монтаж плиты ПК 72.12', unit: 'шт', price: 9000, category: 'precast' },
        'wrk_pc_slab_pk_72_15': { name: 'Монтаж плиты ПК 72.15', unit: 'шт', price: 10000, category: 'precast' },
        'wrk_pc_slab_hollow_220': { name: 'Монтаж пустотной плиты h=220мм', unit: 'шт', price: 6500, category: 'precast' },
        'wrk_pc_slab_hollow_300': { name: 'Монтаж пустотной плиты h=300мм', unit: 'шт', price: 8500, category: 'precast' },
        'wrk_pc_slab_ribbed_1_5x6': { name: 'Монтаж ребристой плиты 1.5×6м', unit: 'шт', price: 8500, category: 'precast' },
        'wrk_pc_slab_ribbed_3x6': { name: 'Монтаж ребристой плиты 3×6м', unit: 'шт', price: 12000, category: 'precast' },
        'wrk_pc_slab_ribbed_3x12': { name: 'Монтаж ребристой плиты 3×12м', unit: 'шт', price: 18000, category: 'precast' },
        // === ПЕРЕМЫЧКИ ===
        'wrk_pc_lintel_1pb': { name: 'Монтаж перемычки 1ПБ (брусковая)', unit: 'шт', price: 1200, category: 'precast' },
        'wrk_pc_lintel_2pb': { name: 'Монтаж перемычки 2ПБ', unit: 'шт', price: 1500, category: 'precast' },
        'wrk_pc_lintel_3pb': { name: 'Монтаж перемычки 3ПБ', unit: 'шт', price: 1800, category: 'precast' },
        'wrk_pc_lintel_5pb': { name: 'Монтаж перемычки 5ПБ', unit: 'шт', price: 2500, category: 'precast' },
        'wrk_pc_lintel_1pp': { name: 'Монтаж перемычки 1ПП (плитная)', unit: 'шт', price: 2500, category: 'precast' },
        'wrk_pc_lintel_2pp': { name: 'Монтаж перемычки 2ПП', unit: 'шт', price: 3200, category: 'precast' },
        // === ЛЕСТНИЧНЫЕ КОНСТРУКЦИИ ===
        'wrk_pc_stair_march_lm1': { name: 'Монтаж лестничного марша ЛМ', unit: 'шт', price: 12000, category: 'precast' },
        'wrk_pc_stair_march_lmp': { name: 'Монтаж лестничного марша ЛМП (с площадкой)', unit: 'шт', price: 18000, category: 'precast' },
        'wrk_pc_stair_landing_lp': { name: 'Монтаж лестничной площадки ЛП', unit: 'шт', price: 8500, category: 'precast' },
        'wrk_pc_stair_landing_1lp': { name: 'Монтаж лестничной площадки 1ЛП', unit: 'шт', price: 10000, category: 'precast' },
        // === КОЛОННЫ И БАЛКИ ===
        'wrk_pc_column_1_light': { name: 'Монтаж ж/б колонны до 2т', unit: 'шт', price: 12000, category: 'precast' },
        'wrk_pc_column_1_medium': { name: 'Монтаж ж/б колонны 2-5т', unit: 'шт', price: 18000, category: 'precast' },
        'wrk_pc_column_1_heavy': { name: 'Монтаж ж/б колонны более 5т', unit: 'шт', price: 25000, category: 'precast' },
        'wrk_pc_beam_1_light': { name: 'Монтаж ж/б балки до 1т', unit: 'шт', price: 8500, category: 'precast' },
        'wrk_pc_beam_1_medium': { name: 'Монтаж ж/б балки 1-3т', unit: 'шт', price: 12000, category: 'precast' },
        'wrk_pc_beam_1_heavy': { name: 'Монтаж ж/б балки более 3т', unit: 'шт', price: 18000, category: 'precast' },
        'wrk_pc_girder_light': { name: 'Монтаж ж/б ригеля до 3т', unit: 'шт', price: 15000, category: 'precast' },
        'wrk_pc_girder_heavy': { name: 'Монтаж ж/б ригеля более 3т', unit: 'шт', price: 22000, category: 'precast' },
        // === СТЕНОВЫЕ ПАНЕЛИ ===
        'wrk_pc_wall_panel_ext': { name: 'Монтаж наружной стеновой панели', unit: 'шт', price: 15000, category: 'precast' },
        'wrk_pc_wall_panel_int': { name: 'Монтаж внутренней стеновой панели', unit: 'шт', price: 10000, category: 'precast' },
        'wrk_pc_wall_panel_3layer': { name: 'Монтаж трёхслойной панели', unit: 'шт', price: 18000, category: 'precast' },
        // === КОЛЬЦА ЖБИ ===
        'wrk_pc_ring_kc10_9': { name: 'Монтаж кольца КС 10.9', unit: 'шт', price: 5500, category: 'precast' },
        'wrk_pc_ring_kc15_9': { name: 'Монтаж кольца КС 15.9', unit: 'шт', price: 7500, category: 'precast' },
        'wrk_pc_ring_kc20_9': { name: 'Монтаж кольца КС 20.9', unit: 'шт', price: 10000, category: 'precast' },
        'wrk_pc_ring_bottom': { name: 'Установка днища ПН (плита низа)', unit: 'шт', price: 5500, category: 'precast' },
        'wrk_pc_ring_cover': { name: 'Установка перекрытия ПП', unit: 'шт', price: 4500, category: 'precast' },
        // === ЗАМОНОЛИЧИВАНИЕ ===
        'wrk_pc_joint_weld': { name: 'Сварка закладных деталей', unit: 'стык', price: 1200, category: 'precast' },
        'wrk_pc_joint_grout': { name: 'Замоноличивание стыков', unit: 'стык', price: 1500, category: 'precast' },
        'wrk_pc_joint_sealant': { name: 'Герметизация межпанельных швов', unit: 'м.п.', price: 550, category: 'precast' }
    };
})();
