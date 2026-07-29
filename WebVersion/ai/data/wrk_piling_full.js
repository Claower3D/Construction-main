// === СВАЙНЫЕ РАБОТЫ, ШПУНТ, УКРЕПЛЕНИЕ ГРУНТОВ, БЕРЕГОУКРЕПЛЕНИЕ (300 поз.) ===
(function () {
    window.AI_WRK_PILING_FULL = {
        // === ЗАБИВНЫЕ СВАИ ===
        'wrk_pl_driven_300x300_6': { name: 'Забивка ж/б сваи 300×300 L=6м', unit: 'шт', price: 18000, category: 'piling_full' },
        'wrk_pl_driven_300x300_8': { name: 'Забивка ж/б сваи 300×300 L=8м', unit: 'шт', price: 25000, category: 'piling_full' },
        'wrk_pl_driven_300x300_10': { name: 'Забивка ж/б сваи 300×300 L=10м', unit: 'шт', price: 32000, category: 'piling_full' },
        'wrk_pl_driven_300x300_12': { name: 'Забивка ж/б сваи 300×300 L=12м', unit: 'шт', price: 38000, category: 'piling_full' },
        'wrk_pl_driven_350x350_6': { name: 'Забивка ж/б сваи 350×350 L=6м', unit: 'шт', price: 22000, category: 'piling_full' },
        'wrk_pl_driven_350x350_8': { name: 'Забивка ж/б сваи 350×350 L=8м', unit: 'шт', price: 30000, category: 'piling_full' },
        'wrk_pl_driven_350x350_10': { name: 'Забивка ж/б сваи 350×350 L=10м', unit: 'шт', price: 38000, category: 'piling_full' },
        'wrk_pl_driven_350x350_12': { name: 'Забивка ж/б сваи 350×350 L=12м', unit: 'шт', price: 45000, category: 'piling_full' },
        'wrk_pl_driven_400x400_8': { name: 'Забивка ж/б сваи 400×400 L=8м', unit: 'шт', price: 38000, category: 'piling_full' },
        'wrk_pl_driven_400x400_12': { name: 'Забивка ж/б сваи 400×400 L=12м', unit: 'шт', price: 55000, category: 'piling_full' },
        'wrk_pl_driven_400x400_16': { name: 'Забивка ж/б сваи 400×400 L=16м', unit: 'шт', price: 75000, category: 'piling_full' },
        'wrk_pl_driven_splice': { name: 'Стыковка составных свай', unit: 'стык', price: 5500, category: 'piling_full' },
        'wrk_pl_driven_cap_cut': { name: 'Срубка головы сваи', unit: 'шт', price: 3500, category: 'piling_full' },
        // === БУРОНАБИВНЫЕ СВАИ ===
        'wrk_pl_bored_300_6': { name: 'Буронабивная свая Ø300 L=6м', unit: 'шт', price: 15000, category: 'piling_full' },
        'wrk_pl_bored_300_10': { name: 'Буронабивная свая Ø300 L=10м', unit: 'шт', price: 22000, category: 'piling_full' },
        'wrk_pl_bored_casing': { name: 'Бурение в обсадной трубе', unit: 'м.п.', price: 5500, category: 'piling_full' },
        // === ВИНТОВЫЕ СВАИ ===
        'wrk_pl_screw_89_2000': { name: 'Винтовая свая Ø89 L=2м', unit: 'шт', price: 3500, category: 'piling_full' },
        'wrk_pl_screw_108_2500': { name: 'Винтовая свая Ø108 L=2.5м', unit: 'шт', price: 4500, category: 'piling_full' },
        'wrk_pl_screw_133_3000': { name: 'Винтовая свая Ø133 L=3м', unit: 'шт', price: 5500, category: 'piling_full' },
        'wrk_pl_screw_159_3000': { name: 'Винтовая свая Ø159 L=3м', unit: 'шт', price: 8500, category: 'piling_full' },
        'wrk_pl_screw_219_3000': { name: 'Винтовая свая Ø219 L=3м', unit: 'шт', price: 12000, category: 'piling_full' },
        // === ШПУНТ ===
        'wrk_pl_sheet_pile_larsen_5': { name: 'Погружение шпунта Ларсена Л5', unit: 'м²', price: 5500, category: 'piling_full' },
        'wrk_pl_sheet_pile_larsen_5u': { name: 'Погружение шпунта Ларсена Л5-У', unit: 'м²', price: 6500, category: 'piling_full' },
        'wrk_pl_sheet_pile_vibro': { name: 'Вибропогружение шпунта', unit: 'м²', price: 4500, category: 'piling_full' },
        // === УКРЕПЛЕНИЕ ГРУНТОВ ===
        'wrk_pl_jet_grouting_600': { name: 'Струйная цементация (jet grouting) Ø600', unit: 'м.п.', price: 12000, category: 'piling_full' },
        'wrk_pl_jet_grouting_1000': { name: 'Струйная цементация (jet grouting) Ø1000', unit: 'м.п.', price: 18000, category: 'piling_full' },
        'wrk_pl_soil_cement_col': { name: 'Устройство грунтоцементной колонны', unit: 'м.п.', price: 5500, category: 'piling_full' },
        'wrk_pl_ground_anchor': { name: 'Устройство грунтового анкера', unit: 'шт', price: 35000, category: 'piling_full' },
        'wrk_pl_micropile': { name: 'Устройство микросваи', unit: 'м.п.', price: 5500, category: 'piling_full' },
        // === РОСТВЕРКИ ===
        'wrk_pl_pile_cap': { name: 'Устройство ж/б ростверка', unit: 'м³', price: 12000, category: 'piling_full' },
        'wrk_pl_pile_cap_steel': { name: 'Монтаж стального ростверка', unit: 'т', price: 25000, category: 'piling_full' },
        // === ИСПЫТАНИЯ ===
        'wrk_pl_test_integrity': { name: 'Испытание целостности свай (PIT)', unit: 'шт', price: 5500, category: 'piling_full' }
    };
})();
