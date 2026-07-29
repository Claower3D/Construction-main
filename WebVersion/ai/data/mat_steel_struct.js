// === СЭНДВИЧ-ПАНЕЛИ, МЕТАЛЛОКОНСТРУКЦИИ (45 позиций) ===
(function () {
    window.AI_MAT_STEEL_STRUCT = {
        // Сэндвич-панели стеновые
        'sand_wall_50_ral': { name: 'Сэндвич-панель стеновая 50мм (мин.вата)', unit: 'м²', price: 3500, category: 'steel_struct' },
        'sand_wall_80_ral': { name: 'Сэндвич-панель стеновая 80мм (мин.вата)', unit: 'м²', price: 4200, category: 'steel_struct' },
        'sand_wall_100_ral': { name: 'Сэндвич-панель стеновая 100мм (мин.вата)', unit: 'м²', price: 4800, category: 'steel_struct' },
        'sand_wall_120_ral': { name: 'Сэндвич-панель стеновая 120мм (мин.вата)', unit: 'м²', price: 5500, category: 'steel_struct' },
        'sand_wall_150_ral': { name: 'Сэндвич-панель стеновая 150мм (мин.вата)', unit: 'м²', price: 6200, category: 'steel_struct' },
        'sand_wall_200_ral': { name: 'Сэндвич-панель стеновая 200мм (мин.вата)', unit: 'м²', price: 7500, category: 'steel_struct' },
        'sand_wall_50_pir': { name: 'Сэндвич-панель стеновая 50мм (PIR)', unit: 'м²', price: 4500, category: 'steel_struct' },
        'sand_wall_80_pir': { name: 'Сэндвич-панель стеновая 80мм (PIR)', unit: 'м²', price: 5500, category: 'steel_struct' },
        'sand_wall_100_pir': { name: 'Сэндвич-панель стеновая 100мм (PIR)', unit: 'м²', price: 6500, category: 'steel_struct' },

        // Сэндвич-панели кровельные
        'sand_roof_50': { name: 'Сэндвич-панель кровельная 50мм', unit: 'м²', price: 3800, category: 'steel_struct' },
        'sand_roof_80': { name: 'Сэндвич-панель кровельная 80мм', unit: 'м²', price: 4500, category: 'steel_struct' },
        'sand_roof_100': { name: 'Сэндвич-панель кровельная 100мм', unit: 'м²', price: 5200, category: 'steel_struct' },
        'sand_roof_150': { name: 'Сэндвич-панель кровельная 150мм', unit: 'м²', price: 6800, category: 'steel_struct' },

        // Доборные элементы сэндвич
        'sand_corner_ext': { name: 'Нащельник угловой наружный (2м)', unit: 'шт', price: 600, category: 'steel_struct' },
        'sand_corner_int': { name: 'Нащельник угловой внутренний (2м)', unit: 'шт', price: 500, category: 'steel_struct' },
        'sand_drain': { name: 'Водоотливная планка для сэндвича (2м)', unit: 'шт', price: 450, category: 'steel_struct' },
        'sand_ridge': { name: 'Конёк для сэндвич-кровли (2м)', unit: 'шт', price: 1200, category: 'steel_struct' },
        'sand_sealant_butyl': { name: 'Герметик бутиловый для сэндвича (рулон)', unit: 'шт', price: 1500, category: 'steel_struct' },

        // Профнастил несущий
        'profsheet_h57_07': { name: 'Профнастил несущий Н-57 0.7мм', unit: 'м²', price: 2800, category: 'steel_struct' },
        'profsheet_h60_08': { name: 'Профнастил несущий Н-60 0.8мм', unit: 'м²', price: 3500, category: 'steel_struct' },
        'profsheet_h75_08': { name: 'Профнастил несущий Н-75 0.8мм', unit: 'м²', price: 4000, category: 'steel_struct' },
        'profsheet_h114_08': { name: 'Профнастил несущий Н-114 0.8мм', unit: 'м²', price: 5000, category: 'steel_struct' },

        // Колонны / фермы стальные
        'steel_column_hn_20': { name: 'Колонна стальная (двутавр 20Б, 6м)', unit: 'шт', price: 25000, category: 'steel_struct' },
        'steel_column_hn_30': { name: 'Колонна стальная (двутавр 30Б, 6м)', unit: 'шт', price: 40000, category: 'steel_struct' },
        'steel_truss_6m': { name: 'Ферма стропильная 6м (заводская)', unit: 'шт', price: 35000, category: 'steel_struct' },
        'steel_truss_9m': { name: 'Ферма стропильная 9м (заводская)', unit: 'шт', price: 55000, category: 'steel_struct' },
        'steel_truss_12m': { name: 'Ферма стропильная 12м (заводская)', unit: 'шт', price: 80000, category: 'steel_struct' },
        'steel_purlin_z200': { name: 'Прогон Z-профиль 200мм (6м)', unit: 'шт', price: 3500, category: 'steel_struct' },
        'steel_purlin_c200': { name: 'Прогон С-профиль 200мм (6м)', unit: 'шт', price: 3200, category: 'steel_struct' },

        // Крепёж для металлоконструкций
        'bolt_hv_m16x50': { name: 'Болт высокопрочный М16×50 (кл. 10.9)', unit: 'шт', price: 25, category: 'steel_struct' },
        'bolt_hv_m20x60': { name: 'Болт высокопрочный М20×60 (кл. 10.9)', unit: 'шт', price: 40, category: 'steel_struct' },
        'bolt_hv_m24x80': { name: 'Болт высокопрочный М24×80 (кл. 10.9)', unit: 'шт', price: 70, category: 'steel_struct' },
        'anchor_foundation_m20': { name: 'Анкерный болт фундаментный М20×600', unit: 'шт', price: 200, category: 'steel_struct' },
        'anchor_foundation_m24': { name: 'Анкерный болт фундаментный М24×800', unit: 'шт', price: 350, category: 'steel_struct' },

        // Закладные / опорные плиты
        'base_plate_200x200x10': { name: 'Опорная пластина 200×200×10мм', unit: 'шт', price: 250, category: 'steel_struct' },
        'base_plate_300x300x12': { name: 'Опорная пластина 300×300×12мм', unit: 'шт', price: 500, category: 'steel_struct' },
        'base_plate_400x400x16': { name: 'Опорная пластина 400×400×16мм', unit: 'шт', price: 1000, category: 'steel_struct' },

        // Профнастил перекрытий
        'profsheet_deck_h60': { name: 'Профнастил для ж/б перекрытий Н-60', unit: 'м²', price: 3200, category: 'steel_struct' },
        'profsheet_deck_h75': { name: 'Профнастил для ж/б перекрытий Н-75', unit: 'м²', price: 4000, category: 'steel_struct' },

        // ЛСТК (лёгкие стальные конструкции)
        'lstk_profile_150': { name: 'ЛСТК профиль стоечный 150мм (3м)', unit: 'шт', price: 800, category: 'steel_struct' },
        'lstk_profile_200': { name: 'ЛСТК профиль стоечный 200мм (3м)', unit: 'шт', price: 1000, category: 'steel_struct' },
        'lstk_track_150': { name: 'ЛСТК профиль направляющий 150мм (3м)', unit: 'шт', price: 700, category: 'steel_struct' },
        'lstk_track_200': { name: 'ЛСТК профиль направляющий 200мм (3м)', unit: 'шт', price: 900, category: 'steel_struct' },
        'lstk_screw_5_5x25': { name: 'Самосверлящий винт для ЛСТК 5.5×25', unit: 'шт', price: 3, category: 'steel_struct' }
    };
})();
