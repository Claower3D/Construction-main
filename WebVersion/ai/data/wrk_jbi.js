// === ЖБИ — КОНСТРУКЦИОННЫЕ ИЗДЕЛИЯ, МОНТАЖ ЖБИ, МОНТАЖ КОНСТРУКЦИЙ (400 поз.) ===
(function () {
    window.AI_WRK_JBI = {
        // === ДОРОЖНЫЕ ЖБИ ===
        'wrk_jbi_slab_pag14': { name: 'Укладка плиты аэродромной ПАГ-14', unit: 'шт', price: 8500, category: 'jbi' },
        'wrk_jbi_slab_pag18': { name: 'Укладка плиты аэродромной ПАГ-18', unit: 'шт', price: 12000, category: 'jbi' },
        'wrk_jbi_slab_pdp': { name: 'Укладка плиты дорожной ПДП 3×1.75', unit: 'шт', price: 5500, category: 'jbi' },
        'wrk_jbi_slab_pdn': { name: 'Укладка плиты дорожной ПДН 6×2', unit: 'шт', price: 12000, category: 'jbi' },
        'wrk_jbi_slab_p_20_15': { name: 'Укладка плиты тротуарной 2×1.5', unit: 'шт', price: 3500, category: 'jbi' },
        'wrk_jbi_curb_br100': { name: 'Монтаж бортового камня БР 100.30.15', unit: 'шт', price: 550, category: 'jbi' },
        'wrk_jbi_curb_br100_18': { name: 'Монтаж бортового камня БР 100.30.18', unit: 'шт', price: 650, category: 'jbi' },
        // === ТРУБЫ ЖБИ ===
        'wrk_jbi_pipe_t300': { name: 'Укладка трубы ж/б Ø300', unit: 'м.п.', price: 3500, category: 'jbi' },
        'wrk_jbi_pipe_t400': { name: 'Укладка трубы ж/б Ø400', unit: 'м.п.', price: 4500, category: 'jbi' },
        'wrk_jbi_pipe_t500': { name: 'Укладка трубы ж/б Ø500', unit: 'м.п.', price: 5500, category: 'jbi' },
        'wrk_jbi_pipe_t600': { name: 'Укладка трубы ж/б Ø600', unit: 'м.п.', price: 7000, category: 'jbi' },
        'wrk_jbi_pipe_t800': { name: 'Укладка трубы ж/б Ø800', unit: 'м.п.', price: 9500, category: 'jbi' },
        'wrk_jbi_pipe_t1000': { name: 'Укладка трубы ж/б Ø1000', unit: 'м.п.', price: 13000, category: 'jbi' },
        'wrk_jbi_pipe_t1200': { name: 'Укладка трубы ж/б Ø1200', unit: 'м.п.', price: 18000, category: 'jbi' },
        'wrk_jbi_pipe_t1500': { name: 'Укладка трубы ж/б Ø1500', unit: 'м.п.', price: 25000, category: 'jbi' },
        // === ЛОТКИ ТЕПЛОТРАСС ===
        'wrk_jbi_tray_l4_8': { name: 'Монтаж лотка Л4-8 (теплотрасса)', unit: 'шт', price: 5500, category: 'jbi' },
        'wrk_jbi_tray_l6_8': { name: 'Монтаж лотка Л6-8', unit: 'шт', price: 7500, category: 'jbi' },
        'wrk_jbi_tray_l10_8': { name: 'Монтаж лотка Л10-8', unit: 'шт', price: 10000, category: 'jbi' },
        'wrk_jbi_tray_cover': { name: 'Монтаж крышки лотка', unit: 'шт', price: 3500, category: 'jbi' },
        // === КОЛЬЦА И КОЛОДЦЫ ===
        'wrk_jbi_ring_kc7_9': { name: 'Монтаж кольца КС 7.9', unit: 'шт', price: 4500, category: 'jbi' },
        'wrk_jbi_ring_kc7_3': { name: 'Монтаж кольца КС 7.3', unit: 'шт', price: 2500, category: 'jbi' },
        'wrk_jbi_ring_kc10_3': { name: 'Монтаж кольца КС 10.3', unit: 'шт', price: 3500, category: 'jbi' },
        'wrk_jbi_ring_kc10_6': { name: 'Монтаж кольца КС 10.6', unit: 'шт', price: 4500, category: 'jbi' },
        'wrk_jbi_ring_kc15_3': { name: 'Монтаж кольца КС 15.3', unit: 'шт', price: 4500, category: 'jbi' },
        'wrk_jbi_ring_kc15_6': { name: 'Монтаж кольца КС 15.6', unit: 'шт', price: 6000, category: 'jbi' },
        'wrk_jbi_ring_kc20_6': { name: 'Монтаж кольца КС 20.6', unit: 'шт', price: 8000, category: 'jbi' },
        'wrk_jbi_ring_kc25_12': { name: 'Монтаж кольца КС 25.12', unit: 'шт', price: 15000, category: 'jbi' },
        'wrk_jbi_bottom_kcd7': { name: 'Монтаж днища КЦД-7', unit: 'шт', price: 4000, category: 'jbi' },
        'wrk_jbi_bottom_kcd10': { name: 'Монтаж днища КЦД-10', unit: 'шт', price: 5500, category: 'jbi' },
        'wrk_jbi_bottom_kcd15': { name: 'Монтаж днища КЦД-15', unit: 'шт', price: 7500, category: 'jbi' },
        'wrk_jbi_bottom_kcd20': { name: 'Монтаж днища КЦД-20', unit: 'шт', price: 10000, category: 'jbi' },
        'wrk_jbi_cover_1pp10': { name: 'Монтаж плиты перекрытия 1ПП10', unit: 'шт', price: 3500, category: 'jbi' },
        'wrk_jbi_cover_1pp15': { name: 'Монтаж плиты перекрытия 1ПП15', unit: 'шт', price: 5000, category: 'jbi' },
        'wrk_jbi_cover_1pp20': { name: 'Монтаж плиты перекрытия 1ПП20', unit: 'шт', price: 6500, category: 'jbi' },
        'wrk_jbi_hatch_t': { name: 'Установка люка чугунного Т (тяжёлый)', unit: 'шт', price: 5500, category: 'jbi' },
        'wrk_jbi_hatch_l': { name: 'Установка люка чугунного Л (лёгкий)', unit: 'шт', price: 3500, category: 'jbi' },
        'wrk_jbi_hatch_polymer': { name: 'Установка люка полимерного', unit: 'шт', price: 2500, category: 'jbi' },
        // === ОГРАЖДЕНИЯ ЖБИ ===
        'wrk_jbi_fence_panel_p6v': { name: 'Монтаж ж/б забора П-6В', unit: 'шт', price: 3500, category: 'jbi' },
        'wrk_jbi_fence_post': { name: 'Монтаж стоек забора ж/б', unit: 'шт', price: 5500, category: 'jbi' },
        // === ВЕНТИЛЯЦИОННЫЕ БЛОКИ ===
        'wrk_jbi_vent_block': { name: 'Монтаж вентиляционного блока', unit: 'шт', price: 5500, category: 'jbi' },
        // === СВАИ ЗАБИВНЫЕ ===
        'wrk_jbi_pile_sc30_3': { name: 'Забивка сваи СЦ 30×30 L=3м', unit: 'шт', price: 18000, category: 'jbi' },
        'wrk_jbi_pile_sc30_4': { name: 'Забивка сваи СЦ 30×30 L=4м', unit: 'шт', price: 22000, category: 'jbi' },
        'wrk_jbi_pile_sc30_5': { name: 'Забивка сваи СЦ 30×30 L=5м', unit: 'шт', price: 28000, category: 'jbi' },
        'wrk_jbi_pile_sc35_6': { name: 'Забивка сваи СЦ 35×35 L=6м', unit: 'шт', price: 38000, category: 'jbi' },
        'wrk_jbi_pile_sc35_8': { name: 'Забивка сваи СЦ 35×35 L=8м', unit: 'шт', price: 48000, category: 'jbi' },
        'wrk_jbi_pile_sc40_10': { name: 'Забивка сваи СЦ 40×40 L=10м', unit: 'шт', price: 65000, category: 'jbi' },
        'wrk_jbi_pile_sc40_12': { name: 'Забивка сваи СЦ 40×40 L=12м', unit: 'шт', price: 80000, category: 'jbi' },
        'wrk_jbi_pile_sc40_14': { name: 'Забивка сваи СЦ 40×40 L=14м', unit: 'шт', price: 95000, category: 'jbi' },
        'wrk_jbi_pile_sc40_16': { name: 'Забивка сваи СЦ 40×40 L=16м', unit: 'шт', price: 110000, category: 'jbi' },
        // === ПЕРЕМЫЧКИ ДОПОЛНИТЕЛЬНЫЕ ===
        'wrk_jbi_lintel_8pb': { name: 'Монтаж перемычки 8ПБ', unit: 'шт', price: 3500, category: 'jbi' },
        'wrk_jbi_lintel_9pb': { name: 'Монтаж перемычки 9ПБ', unit: 'шт', price: 4500, category: 'jbi' },
        'wrk_jbi_lintel_3pp': { name: 'Монтаж перемычки 3ПП (плитная)', unit: 'шт', price: 4000, category: 'jbi' },
        // === БАЛКИ ПОКРЫТИЙ ===
        'wrk_jbi_beam_bsp12': { name: 'Монтаж ж/б балки покрытия L=12м', unit: 'шт', price: 35000, category: 'jbi' },
        'wrk_jbi_beam_bsp18': { name: 'Монтаж ж/б балки покрытия L=18м', unit: 'шт', price: 55000, category: 'jbi' },
        'wrk_jbi_beam_bsp24': { name: 'Монтаж ж/б балки покрытия L=24м', unit: 'шт', price: 85000, category: 'jbi' },
        'wrk_jbi_truss_rc_18': { name: 'Монтаж ж/б фермы L=18м', unit: 'шт', price: 75000, category: 'jbi' },
        'wrk_jbi_truss_rc_24': { name: 'Монтаж ж/б фермы L=24м', unit: 'шт', price: 120000, category: 'jbi' }
    };
})();
