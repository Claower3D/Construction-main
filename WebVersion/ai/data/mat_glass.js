// === СТЕКЛО, ПОЛИКАРБОНАТ, ЗЕРКАЛА (35 позиций) ===
(function () {
    window.AI_MAT_GLASS = {
        // Стекло листовое
        'glass_clear_3mm': { name: 'Стекло прозрачное 3мм (м²)', unit: 'м²', price: 800, category: 'glass' },
        'glass_clear_4mm': { name: 'Стекло прозрачное 4мм (м²)', unit: 'м²', price: 1000, category: 'glass' },
        'glass_clear_5mm': { name: 'Стекло прозрачное 5мм (м²)', unit: 'м²', price: 1200, category: 'glass' },
        'glass_clear_6mm': { name: 'Стекло прозрачное 6мм (м²)', unit: 'м²', price: 1500, category: 'glass' },
        'glass_clear_8mm': { name: 'Стекло прозрачное 8мм (м²)', unit: 'м²', price: 2000, category: 'glass' },
        'glass_clear_10mm': { name: 'Стекло прозрачное 10мм (м²)', unit: 'м²', price: 2500, category: 'glass' },

        // Закалённое стекло
        'glass_tempered_6mm': { name: 'Стекло закалённое 6мм (м²)', unit: 'м²', price: 3000, category: 'glass' },
        'glass_tempered_8mm': { name: 'Стекло закалённое 8мм (м²)', unit: 'м²', price: 4000, category: 'glass' },
        'glass_tempered_10mm': { name: 'Стекло закалённое 10мм (м²)', unit: 'м²', price: 5000, category: 'glass' },

        // Триплекс
        'glass_triplex_6mm': { name: 'Триплекс 6мм (3+3, м²)', unit: 'м²', price: 4500, category: 'glass' },
        'glass_triplex_8mm': { name: 'Триплекс 8мм (4+4, м²)', unit: 'м²', price: 6000, category: 'glass' },

        // Стекло тонированное
        'glass_tinted_6mm': { name: 'Стекло тонированное 6мм (м²)', unit: 'м²', price: 2200, category: 'glass' },
        'glass_matte_6mm': { name: 'Стекло матовое (сатинат) 6мм (м²)', unit: 'м²', price: 2500, category: 'glass' },

        // Стекло энергосберегающее
        'glass_lowE_4mm': { name: 'Стекло энергосберегающее Low-E 4мм (м²)', unit: 'м²', price: 1800, category: 'glass' },
        'glass_lowE_6mm': { name: 'Стекло энергосберегающее Low-E 6мм (м²)', unit: 'м²', price: 2500, category: 'glass' },

        // Стеклопакеты
        'dgu_4_16_4': { name: 'Стеклопакет однокамерный 4-16-4 (м²)', unit: 'м²', price: 2500, category: 'glass' },
        'dgu_4_12_4_12_4': { name: 'Стеклопакет двухкамерный 4-12-4-12-4 (м²)', unit: 'м²', price: 3500, category: 'glass' },
        'dgu_energy_2kam': { name: 'Стеклопакет 2-камерн. энергосберег. (м²)', unit: 'м²', price: 4500, category: 'glass' },

        // Стеклоблоки
        'glass_block_190x190_clear': { name: 'Стеклоблок 190×190×80мм (прозрачный)', unit: 'шт', price: 600, category: 'glass' },
        'glass_block_190x190_color': { name: 'Стеклоблок 190×190×80мм (цветной)', unit: 'шт', price: 800, category: 'glass' },
        'glass_block_190x190_matte': { name: 'Стеклоблок 190×190×80мм (матовый)', unit: 'шт', price: 700, category: 'glass' },

        // Поликарбонат сотовый
        'polycarb_4mm': { name: 'Поликарбонат сотовый 4мм (2100×6000)', unit: 'лист', price: 3000, category: 'glass' },
        'polycarb_6mm': { name: 'Поликарбонат сотовый 6мм (2100×6000)', unit: 'лист', price: 4200, category: 'glass' },
        'polycarb_8mm': { name: 'Поликарбонат сотовый 8мм (2100×6000)', unit: 'лист', price: 5500, category: 'glass' },
        'polycarb_10mm': { name: 'Поликарбонат сотовый 10мм (2100×6000)', unit: 'лист', price: 7000, category: 'glass' },
        'polycarb_16mm': { name: 'Поликарбонат сотовый 16мм (2100×6000)', unit: 'лист', price: 10000, category: 'glass' },

        // Поликарбонат монолитный
        'polycarb_mono_3mm': { name: 'Поликарбонат монолитный 3мм (м²)', unit: 'м²', price: 2500, category: 'glass' },
        'polycarb_mono_4mm': { name: 'Поликарбонат монолитный 4мм (м²)', unit: 'м²', price: 3500, category: 'glass' },
        'polycarb_mono_6mm': { name: 'Поликарбонат монолитный 6мм (м²)', unit: 'м²', price: 5000, category: 'glass' },

        // Профили для поликарбоната
        'polycarb_profile_h_4_10': { name: 'Профиль соединительный H 4-10мм (6м)', unit: 'шт', price: 400, category: 'glass' },
        'polycarb_profile_u_4_10': { name: 'Профиль торцевой U 4-10мм (2.1м)', unit: 'шт', price: 120, category: 'glass' },
        'polycarb_washer_thermo': { name: 'Термошайба для поликарбоната (50шт)', unit: 'уп.', price: 500, category: 'glass' },

        // Зеркала
        'mirror_4mm_m2': { name: 'Зеркало серебряное 4мм (м²)', unit: 'м²', price: 2000, category: 'glass' },
        'mirror_5mm_m2': { name: 'Зеркало серебряное 5мм (м²)', unit: 'м²', price: 2500, category: 'glass' },
        'mirror_tinted_4mm': { name: 'Зеркало тонированное (бронза) 4мм (м²)', unit: 'м²', price: 3000, category: 'glass' }
    };
})();
