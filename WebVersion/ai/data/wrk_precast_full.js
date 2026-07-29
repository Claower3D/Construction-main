// === ФАЗА 3: МОНТАЖ ЖБ ИЗДЕЛИЙ — ПЛИТЫ, ЛЕСТНИЦЫ, КОЛОДЦЫ, ПЕРЕМЫЧКИ, БАЛКИ, СБОРНЫЙ КАРКАС (120 поз.) ===
(function () {
    window.AI_WRK_PRECAST_FULL = {
        // === ПЛИТЫ ПЕРЕКРЫТИЯ ===
        'wrk_pc_slab_pk_4_2': { name: 'Плита ПК 4.2м (монтаж)', unit: 'шт', price: 500, category: 'precast_full' },
        'wrk_pc_slab_pk_5_4': { name: 'Плита ПК 5.4м (монтаж)', unit: 'шт', price: 600, category: 'precast_full' },
        'wrk_pc_slab_pk_6_0': { name: 'Плита ПК 6.0м (монтаж)', unit: 'шт', price: 700, category: 'precast_full' },
        'wrk_pc_slab_pk_7_2': { name: 'Плита ПК 7.2м (монтаж)', unit: 'шт', price: 800, category: 'precast_full' },
        'wrk_pc_slab_pk_9_0': { name: 'Плита ПК 9.0м (монтаж)', unit: 'шт', price: 1000, category: 'precast_full' },
        'wrk_pc_slab_pno_4_2': { name: 'Плита ПНО 4.2м (безопалубочн.)', unit: 'шт', price: 550, category: 'precast_full' },
        'wrk_pc_slab_pno_6_0': { name: 'Плита ПНО 6.0м (безопалубочн.)', unit: 'шт', price: 750, category: 'precast_full' },
        'wrk_pc_slab_pno_9_0': { name: 'Плита ПНО 9.0м (безопалубочн.)', unit: 'шт', price: 1100, category: 'precast_full' },
        'wrk_pc_slab_pno_12_0': { name: 'Плита ПНО 12.0м (безопалубочн.)', unit: 'шт', price: 1500, category: 'precast_full' },
        'wrk_pc_slab_rebryst_6': { name: 'Ребристая плита 6.0м', unit: 'шт', price: 800, category: 'precast_full' },
        'wrk_pc_slab_rebryst_12': { name: 'Ребристая плита 12.0м', unit: 'шт', price: 1500, category: 'precast_full' },
        'wrk_pc_slab_grout': { name: 'Замоноличивание стыков плит', unit: 'м.п.', price: 20, category: 'precast_full' },

        // === ЛЕСТНИЧНЫЕ МАРШИ ===
        'wrk_pc_stair_lm_2700': { name: 'Марш ЛМ 2700мм', unit: 'шт', price: 1000, category: 'precast_full' },
        'wrk_pc_stair_lm_3000': { name: 'Марш ЛМ 3000мм', unit: 'шт', price: 1200, category: 'precast_full' },
        'wrk_pc_stair_lm_3300': { name: 'Марш ЛМ 3300мм', unit: 'шт', price: 1400, category: 'precast_full' },
        'wrk_pc_stair_platform': { name: 'Площадка лестничная', unit: 'шт', price: 800, category: 'precast_full' },
        'wrk_pc_stair_half': { name: 'Полуплощадка лестничная', unit: 'шт', price: 600, category: 'precast_full' },

        // === ФУНДАМЕНТНЫЕ БЛОКИ ===
        'wrk_pc_fbs_400': { name: 'Блок ФБС 400мм (монтаж)', unit: 'шт', price: 100, category: 'precast_full' },
        'wrk_pc_fbs_500': { name: 'Блок ФБС 500мм (монтаж)', unit: 'шт', price: 120, category: 'precast_full' },
        'wrk_pc_fbs_600': { name: 'Блок ФБС 600мм (монтаж)', unit: 'шт', price: 150, category: 'precast_full' },
        'wrk_pc_fbs_2380': { name: 'Блок ФБС 2380мм (монтаж)', unit: 'шт', price: 200, category: 'precast_full' },
        'wrk_pc_fl': { name: 'Подушка фундаментная ФЛ', unit: 'шт', price: 200, category: 'precast_full' },
        'wrk_pc_fbs_grout': { name: 'Замоноличивание ФБС (шов)', unit: 'м.п.', price: 15, category: 'precast_full' },

        // === КОЛОДЦЫ ===
        'wrk_pc_well_ring_1000': { name: 'Кольцо КС 10.9 (Ø1000мм)', unit: 'шт', price: 300, category: 'precast_full' },
        'wrk_pc_well_ring_1500': { name: 'Кольцо КС 15.9 (Ø1500мм)', unit: 'шт', price: 500, category: 'precast_full' },
        'wrk_pc_well_ring_2000': { name: 'Кольцо КС 20.9 (Ø2000мм)', unit: 'шт', price: 800, category: 'precast_full' },
        'wrk_pc_well_bottom': { name: 'Днище колодца ПН', unit: 'шт', price: 300, category: 'precast_full' },
        'wrk_pc_well_lid': { name: 'Крышка колодца ПП', unit: 'шт', price: 200, category: 'precast_full' },
        'wrk_pc_well_hatch': { name: 'Люк канализационный', unit: 'шт', price: 300, category: 'precast_full' },
        'wrk_pc_well_hatch_heavy': { name: 'Люк тяжёлый (автодорожный)', unit: 'шт', price: 500, category: 'precast_full' },
        'wrk_pc_well_seal': { name: 'Герметизация колец', unit: 'шт', price: 100, category: 'precast_full' },

        // === ПЕРЕМЫЧКИ ЖБ ===
        'wrk_pc_lintel_2pb17': { name: 'Перемычка 2ПБ17 (монтаж)', unit: 'шт', price: 100, category: 'precast_full' },
        'wrk_pc_lintel_2pb19': { name: 'Перемычка 2ПБ19 (монтаж)', unit: 'шт', price: 120, category: 'precast_full' },
        'wrk_pc_lintel_2pb22': { name: 'Перемычка 2ПБ22 (монтаж)', unit: 'шт', price: 150, category: 'precast_full' },
        'wrk_pc_lintel_2pb25': { name: 'Перемычка 2ПБ25 (монтаж)', unit: 'шт', price: 180, category: 'precast_full' },
        'wrk_pc_lintel_2pb29': { name: 'Перемычка 2ПБ29 (монтаж)', unit: 'шт', price: 200, category: 'precast_full' },
        'wrk_pc_lintel_3pb18': { name: 'Перемычка 3ПБ18 (монтаж)', unit: 'шт', price: 200, category: 'precast_full' },
        'wrk_pc_lintel_3pb25': { name: 'Перемычка 3ПБ25 (монтаж)', unit: 'шт', price: 250, category: 'precast_full' },
        'wrk_pc_lintel_3pb34': { name: 'Перемычка 3ПБ34 (монтаж)', unit: 'шт', price: 300, category: 'precast_full' },
        'wrk_pc_lintel_5pb27': { name: 'Перемычка 5ПБ27 (монтаж)', unit: 'шт', price: 400, category: 'precast_full' },
        'wrk_pc_lintel_5pb36': { name: 'Перемычка 5ПБ36 (монтаж)', unit: 'шт', price: 500, category: 'precast_full' },

        // === СБОРНЫЙ Ж/Б КАРКАС ===
        'wrk_pc_column_300': { name: 'Колонна ж/б 300×300', unit: 'шт', price: 1000, category: 'precast_full' },
        'wrk_pc_column_400': { name: 'Колонна ж/б 400×400', unit: 'шт', price: 1500, category: 'precast_full' },
        'wrk_pc_column_500': { name: 'Колонна ж/б 500×500', unit: 'шт', price: 2000, category: 'precast_full' },
        'wrk_pc_beam_rect': { name: 'Балка ж/б (ригель) прямоуг.', unit: 'шт', price: 1000, category: 'precast_full' },
        'wrk_pc_beam_t': { name: 'Балка ж/б Т-образная', unit: 'шт', price: 1500, category: 'precast_full' },
        'wrk_pc_panel_wall_150': { name: 'Стеновая панель 150мм', unit: 'м²', price: 200, category: 'precast_full' },
        'wrk_pc_panel_wall_200': { name: 'Стеновая панель 200мм', unit: 'м²', price: 250, category: 'precast_full' },
        'wrk_pc_panel_wall_300': { name: 'Стеновая панель 300мм', unit: 'м²', price: 300, category: 'precast_full' },
        'wrk_pc_panel_facade': { name: 'Панель навесная фасадная', unit: 'м²', price: 300, category: 'precast_full' },
        'wrk_pc_weld_embed': { name: 'Сварка закладных (сборный ж/б)', unit: 'стык', price: 50, category: 'precast_full' },

        // === ДОРОЖНЫЕ ПЛИТЫ ===
        'wrk_pc_road_slab_1p': { name: 'Дорожная плита 1П (3×1.75м)', unit: 'шт', price: 500, category: 'precast_full' },
        'wrk_pc_road_slab_2p': { name: 'Дорожная плита 2П (6×2м)', unit: 'шт', price: 800, category: 'precast_full' },
        'wrk_pc_road_slab_pag14': { name: 'Аэродромная плита ПАГ-14', unit: 'шт', price: 1000, category: 'precast_full' },
        'wrk_pc_road_slab_pag18': { name: 'Аэродромная плита ПАГ-18', unit: 'шт', price: 1500, category: 'precast_full' },
        'wrk_pc_road_slab_pdp': { name: 'Плита для переездов ПДП', unit: 'шт', price: 800, category: 'precast_full' }
    };
})();
