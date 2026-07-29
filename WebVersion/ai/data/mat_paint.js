// === КРАСКИ, ЛАКИ, ОБОИ (60 позиций) ===
(function () {
    window.AI_MAT_PAINT = {
        // Водоэмульсионные краски
        'paint_water_interior_3l': { name: 'Краска водоэмульсионная интерьерная (3л)', unit: 'шт', price: 1500, category: 'paint' },
        'paint_water_interior_10l': { name: 'Краска водоэмульсионная интерьерная (10л)', unit: 'шт', price: 4000, category: 'paint' },
        'paint_water_ceiling_10l': { name: 'Краска для потолков (10л)', unit: 'шт', price: 3200, category: 'paint' },
        'paint_water_kitchen_9l': { name: 'Краска для кухни/ванной влагостойкая (9л)', unit: 'шт', price: 5500, category: 'paint' },

        // Акриловые краски
        'paint_acrylic_white_3l': { name: 'Краска акриловая белая (3л)', unit: 'шт', price: 2200, category: 'paint' },
        'paint_acrylic_white_10l': { name: 'Краска акриловая белая (10л)', unit: 'шт', price: 5500, category: 'paint' },
        'paint_acrylic_color_3l': { name: 'Краска акриловая колерованная (3л)', unit: 'шт', price: 2800, category: 'paint' },
        'paint_acrylic_washable_9l': { name: 'Краска акриловая моющаяся (9л)', unit: 'шт', price: 6500, category: 'paint' },

        // Фасадные краски
        'paint_facade_acrylic_10l': { name: 'Краска фасадная акриловая (10л)', unit: 'шт', price: 6000, category: 'paint' },
        'paint_facade_silicone_10l': { name: 'Краска фасадная силиконовая (10л)', unit: 'шт', price: 8500, category: 'paint' },
        'paint_facade_silicate_10l': { name: 'Краска фасадная силикатная (10л)', unit: 'шт', price: 7500, category: 'paint' },

        // Эмали
        'enamel_pf115_09l': { name: 'Эмаль ПФ-115 (0.9кг)', unit: 'шт', price: 750, category: 'paint' },
        'enamel_pf115_2_7l': { name: 'Эмаль ПФ-115 (2.7кг)', unit: 'шт', price: 1800, category: 'paint' },
        'enamel_acrylic_09l': { name: 'Эмаль акриловая универсальная (0.9л)', unit: 'шт', price: 1200, category: 'paint' },
        'enamel_radiator_06l': { name: 'Эмаль для радиаторов (0.6л)', unit: 'шт', price: 900, category: 'paint' },

        // Краски по металлу
        'paint_metal_3in1_2l': { name: 'Краска по металлу 3в1 (грунт-эмаль, 2л)', unit: 'шт', price: 2500, category: 'paint' },
        'paint_anticorr_primer_1l': { name: 'Грунт антикоррозийный ГФ-021 (1кг)', unit: 'шт', price: 500, category: 'paint' },
        'paint_anticorr_primer_3l': { name: 'Грунт антикоррозийный ГФ-021 (3кг)', unit: 'шт', price: 1200, category: 'paint' },
        'paint_hammer_08l': { name: 'Краска молотковая (0.8л)', unit: 'шт', price: 1800, category: 'paint' },

        // Краски для пола
        'paint_floor_acrylic_3l': { name: 'Краска для пола акриловая (3л)', unit: 'шт', price: 2200, category: 'paint' },
        'paint_floor_epoxy_3l': { name: 'Краска для пола эпоксидная (3кг)', unit: 'шт', price: 4500, category: 'paint' },

        // Лаки
        'lacquer_acrylic_parquet_3l': { name: 'Лак паркетный акриловый (3л)', unit: 'шт', price: 3500, category: 'paint' },
        'lacquer_pu_parquet_5l': { name: 'Лак паркетный полиуретановый (5л)', unit: 'шт', price: 8000, category: 'paint' },
        'lacquer_yacht_09l': { name: 'Лак яхтный (0.9л)', unit: 'шт', price: 1200, category: 'paint' },
        'lacquer_yacht_2_5l': { name: 'Лак яхтный (2.5л)', unit: 'шт', price: 2800, category: 'paint' },
        'lacquer_wood_acrylic_09l': { name: 'Лак для дерева акриловый (0.9л)', unit: 'шт', price: 900, category: 'paint' },
        'lacquer_wood_alkyd_2_5l': { name: 'Лак для дерева алкидный (2.5л)', unit: 'шт', price: 2200, category: 'paint' },

        // Морилки
        'stain_wood_water_1l': { name: 'Морилка на водной основе (1л)', unit: 'шт', price: 400, category: 'paint' },
        'stain_wood_spirit_1l': { name: 'Морилка на спиртовой основе (1л)', unit: 'шт', price: 600, category: 'paint' },

        // Масла для дерева
        'oil_wood_1l': { name: 'Масло для дерева (1л)', unit: 'шт', price: 1500, category: 'paint' },
        'oil_decking_2_5l': { name: 'Масло для террас (2.5л)', unit: 'шт', price: 4500, category: 'paint' },

        // Колеры
        'colorant_universal_100ml': { name: 'Колер универсальный (100мл)', unit: 'шт', price: 200, category: 'paint' },
        'colorant_paste_250ml': { name: 'Колеровочная паста (250мл)', unit: 'шт', price: 450, category: 'paint' },

        // Обои виниловые
        'wallpaper_vinyl_standard': { name: 'Обои виниловые на флизелине (рулон 10м)', unit: 'рулон', price: 2500, category: 'paint' },
        'wallpaper_vinyl_premium': { name: 'Обои виниловые горячего тиснения (рулон)', unit: 'рулон', price: 4500, category: 'paint' },

        // Обои флизелиновые (под покраску)
        'wallpaper_fliz_paint': { name: 'Обои флизелиновые под покраску (рулон)', unit: 'рулон', price: 1800, category: 'paint' },
        'wallpaper_fliz_premium': { name: 'Обои флизелиновые премиум (рулон)', unit: 'рулон', price: 5000, category: 'paint' },

        // Обои бумажные
        'wallpaper_paper_simplex': { name: 'Обои бумажные (симплекс, рулон)', unit: 'рулон', price: 800, category: 'paint' },
        'wallpaper_paper_duplex': { name: 'Обои бумажные (дуплекс, рулон)', unit: 'рулон', price: 1200, category: 'paint' },

        // Обои текстильные
        'wallpaper_textile': { name: 'Обои текстильные (рулон)', unit: 'рулон', price: 8000, category: 'paint' },

        // Фотообои
        'wallpaper_photo_m2': { name: 'Фотообои (за м²)', unit: 'м²', price: 1500, category: 'paint' },

        // Стеклообои
        'wallpaper_glass': { name: 'Стеклообои (рулон 25м²)', unit: 'рулон', price: 3500, category: 'paint' },

        // Жидкие обои
        'wallpaper_liquid_1kg': { name: 'Жидкие обои (1кг, на 3-4м²)', unit: 'кг', price: 2000, category: 'paint' },

        // Обойный клей
        'glue_wallpaper_fliz': { name: 'Клей обойный для флизелиновых (250г)', unit: 'шт', price: 600, category: 'paint' },
        'glue_wallpaper_vinyl': { name: 'Клей обойный для виниловых (250г)', unit: 'шт', price: 550, category: 'paint' },
        'glue_wallpaper_heavy': { name: 'Клей обойный для тяжёлых обоев (500г)', unit: 'шт', price: 1000, category: 'paint' },
        'glue_wallpaper_ready': { name: 'Клей обойный готовый (5кг)', unit: 'ведро', price: 2500, category: 'paint' },

        // Растворители
        'solvent_646_1l': { name: 'Растворитель 646 (1л)', unit: 'шт', price: 350, category: 'paint' },
        'solvent_white_spirit_1l': { name: 'Уайт-спирит (1л)', unit: 'шт', price: 400, category: 'paint' },
        'solvent_acetone_1l': { name: 'Ацетон (1л)', unit: 'шт', price: 500, category: 'paint' },

        // Малярный скотч / плёнка
        'tape_masking_48mm': { name: 'Малярный скотч 48мм×50м', unit: 'шт', price: 200, category: 'paint' },
        'tape_masking_24mm': { name: 'Малярный скотч 24мм×50м', unit: 'шт', price: 120, category: 'paint' },
        'film_protect_2x10': { name: 'Плёнка защитная 2×10м', unit: 'шт', price: 150, category: 'paint' },

        // Антисептик для стен
        'antiseptic_wall_1l': { name: 'Антиплесень / антигрибок (1л)', unit: 'шт', price: 600, category: 'paint' },
        'antiseptic_wall_5l': { name: 'Антиплесень / антигрибок (5л)', unit: 'шт', price: 2500, category: 'paint' }
    };
})();
