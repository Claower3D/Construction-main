// === ФАЗА 3: ФУНДАМЕНТЫ ВСЕ ТИПЫ, СВАИ, ПОДПОРНЫЕ СТЕНЫ, ЦОКОЛЬ (150 поз.) ===
(function () {
    window.AI_WRK_FOUNDATION_FULL = {
        // === ЛЕНТОЧНЫЙ ФУНДАМЕНТ ===
        'wrk_fnd_strip_300x600': { name: 'Лента 300×600мм (бетон)', unit: 'м.п.', price: 600, category: 'foundation_full' },
        'wrk_fnd_strip_300x800': { name: 'Лента 300×800мм (бетон)', unit: 'м.п.', price: 800, category: 'foundation_full' },
        'wrk_fnd_strip_400x800': { name: 'Лента 400×800мм (бетон)', unit: 'м.п.', price: 1000, category: 'foundation_full' },
        'wrk_fnd_strip_400x1000': { name: 'Лента 400×1000мм (бетон)', unit: 'м.п.', price: 1300, category: 'foundation_full' },
        'wrk_fnd_strip_500x1000': { name: 'Лента 500×1000мм (бетон)', unit: 'м.п.', price: 1500, category: 'foundation_full' },
        'wrk_fnd_strip_500x1200': { name: 'Лента 500×1200мм (бетон)', unit: 'м.п.', price: 1800, category: 'foundation_full' },
        'wrk_fnd_strip_600x1200': { name: 'Лента 600×1200мм (бетон)', unit: 'м.п.', price: 2200, category: 'foundation_full' },
        'wrk_fnd_strip_rebar_12': { name: 'Армирование ленты Ø12мм', unit: 'м.п.', price: 100, category: 'foundation_full' },
        'wrk_fnd_strip_rebar_14': { name: 'Армирование ленты Ø14мм', unit: 'м.п.', price: 130, category: 'foundation_full' },
        'wrk_fnd_strip_rebar_16': { name: 'Армирование ленты Ø16мм', unit: 'м.п.', price: 160, category: 'foundation_full' },
        'wrk_fnd_strip_waterproof': { name: 'Гидроизоляция ленты', unit: 'м²', price: 30, category: 'foundation_full' },

        // === ПЛИТНЫЙ ФУНДАМЕНТ ===
        'wrk_fnd_slab_insul_xps_50': { name: 'Утепление плиты XPS 50мм', unit: 'м²', price: 30, category: 'foundation_full' },
        'wrk_fnd_slab_insul_xps_100': { name: 'Утепление плиты XPS 100мм', unit: 'м²', price: 50, category: 'foundation_full' },
        'wrk_fnd_slab_rebar_12_200': { name: 'Армирование плиты Ø12 200×200', unit: 'м²', price: 100, category: 'foundation_full' },
        'wrk_fnd_slab_rebar_14_200': { name: 'Армирование плиты Ø14 200×200', unit: 'м²', price: 130, category: 'foundation_full' },
        'wrk_fnd_slab_rebar_16_200': { name: 'Армирование плиты Ø16 200×200', unit: 'м²', price: 160, category: 'foundation_full' },
        'wrk_fnd_slab_ush': { name: 'УШП (утеплённая шведская плита)', unit: 'м²', price: 700, category: 'foundation_full' },
        'wrk_fnd_slab_finnish': { name: 'Финская плита (утеплённая)', unit: 'м²', price: 600, category: 'foundation_full' },

        // === СВАЙНЫЕ ФУНДАМЕНТЫ ===
        'wrk_fnd_pile_bore_300': { name: 'Буронаб. свая Ø300мм', unit: 'шт', price: 1500, category: 'foundation_full' },
        'wrk_fnd_pile_bore_400': { name: 'Буронаб. свая Ø400мм', unit: 'шт', price: 2500, category: 'foundation_full' },
        'wrk_fnd_pile_bore_500': { name: 'Буронаб. свая Ø500мм', unit: 'шт', price: 4000, category: 'foundation_full' },
        'wrk_fnd_pile_bore_600': { name: 'Буронаб. свая Ø600мм', unit: 'шт', price: 5000, category: 'foundation_full' },
        'wrk_fnd_pile_bore_800': { name: 'Буронаб. свая Ø800мм', unit: 'шт', price: 8000, category: 'foundation_full' },
        'wrk_fnd_pile_bore_1000': { name: 'Буронаб. свая Ø1000мм', unit: 'шт', price: 12000, category: 'foundation_full' },
        'wrk_fnd_pile_screw_57': { name: 'Винтовая свая Ø57мм', unit: 'шт', price: 500, category: 'foundation_full' },
        'wrk_fnd_pile_screw_76': { name: 'Винтовая свая Ø76мм', unit: 'шт', price: 700, category: 'foundation_full' },
        'wrk_fnd_pile_screw_89': { name: 'Винтовая свая Ø89мм', unit: 'шт', price: 900, category: 'foundation_full' },
        'wrk_fnd_pile_screw_108': { name: 'Винтовая свая Ø108мм', unit: 'шт', price: 1200, category: 'foundation_full' },
        'wrk_fnd_pile_screw_133': { name: 'Винтовая свая Ø133мм', unit: 'шт', price: 1500, category: 'foundation_full' },
        'wrk_fnd_pile_screw_159': { name: 'Винтовая свая Ø159мм', unit: 'шт', price: 2000, category: 'foundation_full' },
        'wrk_fnd_pile_screw_219': { name: 'Винтовая свая Ø219мм', unit: 'шт', price: 3000, category: 'foundation_full' },
        'wrk_fnd_pile_driven_300': { name: 'Забивная свая 300×300мм', unit: 'м.п.', price: 600, category: 'foundation_full' },
        'wrk_fnd_pile_driven_350': { name: 'Забивная свая 350×350мм', unit: 'м.п.', price: 800, category: 'foundation_full' },
        'wrk_fnd_pile_driven_400': { name: 'Забивная свая 400×400мм', unit: 'м.п.', price: 1000, category: 'foundation_full' },
        'wrk_fnd_pile_mobilize': { name: 'Мобилизация сваебойной установки', unit: 'объект', price: 30000, category: 'foundation_full' },
        // Ростверк

        // === СТОЛБЧАТЫЙ ФУНДАМЕНТ ===
        'wrk_fnd_col_300': { name: 'Столбчатый фундамент 300×300', unit: 'шт', price: 500, category: 'foundation_full' },
        'wrk_fnd_col_400': { name: 'Столбчатый фундамент 400×400', unit: 'шт', price: 800, category: 'foundation_full' },
        'wrk_fnd_col_500': { name: 'Столбчатый фундамент 500×500', unit: 'шт', price: 1200, category: 'foundation_full' },

        // === ЦОКОЛЬ ===
        'wrk_fnd_pedestal_block': { name: 'Цоколь из блоков ФБС', unit: 'шт', price: 500, category: 'foundation_full' },
        'wrk_fnd_pedestal_brick': { name: 'Цоколь кирпичный', unit: 'м²', price: 500, category: 'foundation_full' },
        'wrk_fnd_pedestal_mono_200': { name: 'Цоколь монолитный 200мм', unit: 'м.п.', price: 600, category: 'foundation_full' },
        'wrk_fnd_pedestal_mono_300': { name: 'Цоколь монолитный 300мм', unit: 'м.п.', price: 800, category: 'foundation_full' },
        'wrk_fnd_pedestal_insul': { name: 'Утепление цоколя XPS', unit: 'м²', price: 50, category: 'foundation_full' },
        'wrk_fnd_pedestal_plaster': { name: 'Отделка цоколя штукатуркой', unit: 'м²', price: 100, category: 'foundation_full' },
        'wrk_fnd_pedestal_stone': { name: 'Отделка цоколя камнем', unit: 'м²', price: 200, category: 'foundation_full' },
        'wrk_fnd_pedestal_tile': { name: 'Отделка цоколя плиткой', unit: 'м²', price: 150, category: 'foundation_full' },
        'wrk_fnd_pedestal_siding': { name: 'Отделка цоколя сайдингом', unit: 'м²', price: 100, category: 'foundation_full' },

        // === ОТМОСТКА ===
        'wrk_fnd_blind_concrete_100': { name: 'Отмостка бетонная 100мм', unit: 'м²', price: 100, category: 'foundation_full' },
        'wrk_fnd_blind_concrete_150': { name: 'Отмостка бетонная 150мм', unit: 'м²', price: 130, category: 'foundation_full' },
        'wrk_fnd_blind_soft': { name: 'Мягкая отмостка (мембрана)', unit: 'м²', price: 80, category: 'foundation_full' },
        'wrk_fnd_blind_insul': { name: 'Утепление отмостки XPS', unit: 'м²', price: 30, category: 'foundation_full' },

        // === ПОДПОРНЫЕ СТЕНЫ ===
        'wrk_fnd_retwall_concrete_200': { name: 'Подпорная стена бетон 200мм', unit: 'м²', price: 500, category: 'foundation_full' },
        'wrk_fnd_retwall_concrete_300': { name: 'Подпорная стена бетон 300мм', unit: 'м²', price: 700, category: 'foundation_full' },
        'wrk_fnd_retwall_concrete_400': { name: 'Подпорная стена бетон 400мм', unit: 'м²', price: 900, category: 'foundation_full' },
        'wrk_fnd_retwall_block': { name: 'Подпорная стена из блоков', unit: 'м²', price: 400, category: 'foundation_full' },
        'wrk_fnd_retwall_gabion': { name: 'Подпорная стена габион', unit: 'м³', price: 2000, category: 'foundation_full' },
        'wrk_fnd_retwall_sheet_pile': { name: 'Шпунтовое ограждение', unit: 'м²', price: 1000, category: 'foundation_full' }
    };
})();
