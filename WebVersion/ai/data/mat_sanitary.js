// === САНТЕХНИКА ПРИБОРЫ (60 позиций) ===
(function () {
    window.AI_MAT_SANITARY = {
        // Унитазы
        'wc_floor_economy': { name: 'Унитаз напольный (эконом)', unit: 'шт', price: 18000, category: 'sanitary' },
        'wc_floor_standard': { name: 'Унитаз напольный (стандарт)', unit: 'шт', price: 35000, category: 'sanitary' },
        'wc_floor_premium': { name: 'Унитаз напольный (премиум)', unit: 'шт', price: 65000, category: 'sanitary' },
        'wc_wall_hung': { name: 'Унитаз подвесной', unit: 'шт', price: 45000, category: 'sanitary' },
        'wc_wall_hung_premium': { name: 'Унитаз подвесной (премиум)', unit: 'шт', price: 90000, category: 'sanitary' },
        'installation_wc': { name: 'Инсталляция для подвесного унитаза', unit: 'шт', price: 35000, category: 'sanitary' },
        'installation_wc_premium': { name: 'Инсталляция (премиум, тихий смыв)', unit: 'шт', price: 60000, category: 'sanitary' },
        'flush_button_std': { name: 'Кнопка смыва (стандарт)', unit: 'шт', price: 5000, category: 'sanitary' },
        'flush_button_premium': { name: 'Кнопка смыва (дизайнерская)', unit: 'шт', price: 15000, category: 'sanitary' },
        'bidet_floor': { name: 'Биде напольное', unit: 'шт', price: 30000, category: 'sanitary' },

        // Раковины
        'sink_50cm': { name: 'Раковина 50см (эконом)', unit: 'шт', price: 6000, category: 'sanitary' },
        'sink_60cm': { name: 'Раковина 60см (стандарт)', unit: 'шт', price: 10000, category: 'sanitary' },
        'sink_60cm_premium': { name: 'Раковина 60см (премиум)', unit: 'шт', price: 25000, category: 'sanitary' },
        'sink_70cm': { name: 'Раковина 70см', unit: 'шт', price: 15000, category: 'sanitary' },
        'sink_pedestal': { name: 'Пьедестал для раковины', unit: 'шт', price: 4000, category: 'sanitary' },
        'sink_semi_ped': { name: 'Полупьедестал для раковины', unit: 'шт', price: 3000, category: 'sanitary' },
        'sink_countertop': { name: 'Раковина накладная (чаша)', unit: 'шт', price: 12000, category: 'sanitary' },
        'sink_undercounter': { name: 'Раковина врезная снизу', unit: 'шт', price: 15000, category: 'sanitary' },

        // Ванны
        'bath_steel_150': { name: 'Ванна стальная 150×70', unit: 'шт', price: 18000, category: 'sanitary' },
        'bath_steel_170': { name: 'Ванна стальная 170×70', unit: 'шт', price: 22000, category: 'sanitary' },
        'bath_acrylic_150': { name: 'Ванна акриловая 150×70', unit: 'шт', price: 30000, category: 'sanitary' },
        'bath_acrylic_170': { name: 'Ванна акриловая 170×70', unit: 'шт', price: 40000, category: 'sanitary' },
        'bath_acrylic_corner': { name: 'Ванна акриловая угловая', unit: 'шт', price: 55000, category: 'sanitary' },
        'bath_cast_iron_150': { name: 'Ванна чугунная 150×70', unit: 'шт', price: 45000, category: 'sanitary' },
        'bath_cast_iron_170': { name: 'Ванна чугунная 170×70', unit: 'шт', price: 55000, category: 'sanitary' },
        'bath_legs': { name: 'Ножки для ванны (комплект)', unit: 'шт', price: 3000, category: 'sanitary' },
        'bath_screen_150': { name: 'Экран для ванны 150см', unit: 'шт', price: 5000, category: 'sanitary' },
        'bath_screen_170': { name: 'Экран для ванны 170см', unit: 'шт', price: 6000, category: 'sanitary' },

        // Душевые
        'shower_tray_80x80': { name: 'Поддон душевой 80×80 (низкий)', unit: 'шт', price: 12000, category: 'sanitary' },
        'shower_tray_90x90': { name: 'Поддон душевой 90×90 (низкий)', unit: 'шт', price: 15000, category: 'sanitary' },
        'shower_tray_100x80': { name: 'Поддон душевой 100×80 (прямоуг.)', unit: 'шт', price: 18000, category: 'sanitary' },
        'shower_cabin_90x90': { name: 'Душевая кабина 90×90 (стекло)', unit: 'шт', price: 45000, category: 'sanitary' },
        'shower_door_90': { name: 'Дверь  душевая стеклянная 90см', unit: 'шт', price: 25000, category: 'sanitary' },
        'shower_panel_fixed': { name: 'Стекло душевое неподвижное', unit: 'шт', price: 18000, category: 'sanitary' },

        // Смесители
        'faucet_sink_economy': { name: 'Смеситель для раковины (эконом)', unit: 'шт', price: 4000, category: 'sanitary' },
        'faucet_sink_standard': { name: 'Смеситель для раковины (стандарт)', unit: 'шт', price: 8000, category: 'sanitary' },
        'faucet_sink_premium': { name: 'Смеситель для раковины (премиум)', unit: 'шт', price: 18000, category: 'sanitary' },
        'faucet_bath_economy': { name: 'Смеситель для ванны (эконом)', unit: 'шт', price: 5000, category: 'sanitary' },
        'faucet_bath_standard': { name: 'Смеситель для ванны (стандарт)', unit: 'шт', price: 12000, category: 'sanitary' },
        'faucet_bath_premium': { name: 'Смеситель для ванны (премиум)', unit: 'шт', price: 25000, category: 'sanitary' },
        'faucet_shower_thermo': { name: 'Смеситель душевой термостатический', unit: 'шт', price: 22000, category: 'sanitary' },
        'faucet_kitchen_economy': { name: 'Смеситель для кухни (эконом)', unit: 'шт', price: 4000, category: 'sanitary' },
        'faucet_kitchen_standard': { name: 'Смеситель для кухни (стандарт)', unit: 'шт', price: 8000, category: 'sanitary' },
        'faucet_kitchen_extractable': { name: 'Смеситель для кухни с выдвижным изливом', unit: 'шт', price: 15000, category: 'sanitary' },

        // Душевые лейки / штанги
        'shower_head_standard': { name: 'Лейка душевая (стандарт)', unit: 'шт', price: 2000, category: 'sanitary' },
        'shower_head_rain_25': { name: 'Верхний душ «тропический» 25см', unit: 'шт', price: 8000, category: 'sanitary' },
        'shower_bar_set': { name: 'Штанга душевая с лейкой (комплект)', unit: 'шт', price: 5000, category: 'sanitary' },
        'shower_hose_150': { name: 'Шланг душевой 150см', unit: 'шт', price: 800, category: 'sanitary' },

        // Водонагреватели
        'boiler_electric_50l': { name: 'Водонагреватель электрический 50л', unit: 'шт', price: 35000, category: 'sanitary' },
        'boiler_electric_80l': { name: 'Водонагреватель электрический 80л', unit: 'шт', price: 45000, category: 'sanitary' },
        'boiler_electric_100l': { name: 'Водонагреватель электрический 100л', unit: 'шт', price: 55000, category: 'sanitary' },
        'boiler_electric_flat_50l': { name: 'Водонагреватель плоский 50л', unit: 'шт', price: 45000, category: 'sanitary' },
        'boiler_gas_instant': { name: 'Газовая колонка проточная', unit: 'шт', price: 40000, category: 'sanitary' },

        // Полотенцесушители
        'towel_rail_water_500': { name: 'Полотенцесушитель водяной 500мм', unit: 'шт', price: 8000, category: 'sanitary' },
        'towel_rail_water_800': { name: 'Полотенцесушитель водяной 800мм', unit: 'шт', price: 12000, category: 'sanitary' },
        'towel_rail_electric_500': { name: 'Полотенцесушитель электрический 500мм', unit: 'шт', price: 10000, category: 'sanitary' },

        // Сифоны
        'siphon_sink_bottle': { name: 'Сифон для раковины бутылочный', unit: 'шт', price: 600, category: 'sanitary' },
        'siphon_bath_auto': { name: 'Сифон для ванны полуавтомат', unit: 'шт', price: 2500, category: 'sanitary' },
        'siphon_shower_low': { name: 'Сифон для душевого поддона (низкий)', unit: 'шт', price: 1500, category: 'sanitary' }
    };
})();
