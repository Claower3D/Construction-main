// === КАТАЛОГ СОЛНЕЧНОЙ ЭНЕРГЕТИКИ И АЛЬТЕРНАТ. ИСТОЧНИКОВ (35 позиций) ===
(function () {
    window.AI_MAT_SOLAR_CATALOG = {
        // Солнечные панели
        'solar_panel_mono_400w': { name: 'Солнечная панель моно 400Вт', unit: 'шт', price: 25000, category: 'solar_ext' },
        'solar_panel_mono_450w': { name: 'Солнечная панель моно 450Вт', unit: 'шт', price: 30000, category: 'solar_ext' },
        'solar_panel_mono_550w': { name: 'Солнечная панель моно 550Вт', unit: 'шт', price: 35000, category: 'solar_ext' },
        'solar_panel_poly_340w': { name: 'Солнечная панель поли 340Вт', unit: 'шт', price: 20000, category: 'solar_ext' },
        // Инверторы сетевые
        'solar_inverter_3kw': { name: 'Инвертор сетевой 3кВт', unit: 'шт', price: 30000, category: 'solar_ext' },
        'solar_inverter_5kw': { name: 'Инвертор сетевой 5кВт', unit: 'шт', price: 50000, category: 'solar_ext' },
        'solar_inverter_10kw': { name: 'Инвертор сетевой 10кВт', unit: 'шт', price: 80000, category: 'solar_ext' },
        // Гибридные инверторы
        'solar_inverter_hybrid_5kw': { name: 'Инвертор гибридный 5кВт', unit: 'шт', price: 80000, category: 'solar_ext' },
        'solar_inverter_hybrid_10kw': { name: 'Инвертор гибридный 10кВт', unit: 'шт', price: 120000, category: 'solar_ext' },
        // Аккумуляторы
        'solar_battery_lifepo4_5kwh': { name: 'АКБ LiFePO4 5кВт·ч', unit: 'шт', price: 80000, category: 'solar_ext' },
        'solar_battery_lifepo4_10kwh': { name: 'АКБ LiFePO4 10кВт·ч', unit: 'шт', price: 150000, category: 'solar_ext' },
        'solar_battery_gel_200ah': { name: 'АКБ гелевый 12В 200А·ч', unit: 'шт', price: 15000, category: 'solar_ext' },
        'solar_battery_agm_100ah': { name: 'АКБ AGM 12В 100А·ч', unit: 'шт', price: 10000, category: 'solar_ext' },
        // Крепление для панелей
        'solar_mount_roof_set': { name: 'Крепление на крышу (комплект 1 панель)', unit: 'компл.', price: 2000, category: 'solar_ext' },
        'solar_mount_ground_set': { name: 'Крепление наземное (комплект 1 панель)', unit: 'компл.', price: 3000, category: 'solar_ext' },
        'solar_mount_rail_2m': { name: 'Профиль монтажный 2м', unit: 'шт', price: 500, category: 'solar_ext' },
        'solar_mount_clamp_mid': { name: 'Кламмер средний для панели', unit: 'шт', price: 30, category: 'solar_ext' },
        'solar_mount_clamp_end': { name: 'Кламмер крайний для панели', unit: 'шт', price: 40, category: 'solar_ext' },
        // Кабели солнечные
        'solar_cable_4mm2_m': { name: 'Кабель солнечный 4мм² (м.п.)', unit: 'м.п.', price: 30, category: 'solar_ext' },
        'solar_cable_6mm2_m': { name: 'Кабель солнечный 6мм² (м.п.)', unit: 'м.п.', price: 50, category: 'solar_ext' },
        'solar_connector_mc4_pair': { name: 'Коннектор MC4 (пара)', unit: 'пара', price: 30, category: 'solar_ext' },
        'solar_connector_y_branch': { name: 'Разветвитель MC4 Y-образный', unit: 'шт', price: 100, category: 'solar_ext' },
        // Контроллер заряда
        'solar_charge_mppt_30a': { name: 'Контроллер заряда MPPT 30А', unit: 'шт', price: 5000, category: 'solar_ext' },
        'solar_charge_mppt_60a': { name: 'Контроллер заряда MPPT 60А', unit: 'шт', price: 10000, category: 'solar_ext' },
        // Мониторинг
        'solar_monitor_wifi': { name: 'Wi-Fi модуль мониторинга', unit: 'шт', price: 2000, category: 'solar_ext' },
        'solar_meter_energy': { name: 'Счётчик энергии двунаправленный', unit: 'шт', price: 3000, category: 'solar_ext' },
        // Ветрогенераторы
        'wind_turbine_1kw': { name: 'Ветрогенератор 1кВт', unit: 'шт', price: 30000, category: 'solar_ext' },
        'wind_turbine_3kw': { name: 'Ветрогенератор 3кВт', unit: 'шт', price: 80000, category: 'solar_ext' },
        'wind_turbine_mast_6m': { name: 'Мачта для ветрогенератора 6м', unit: 'шт', price: 15000, category: 'solar_ext' },
        // Тепловые насосы
        'heat_pump_air_air_3kw': { name: 'Тепловой насос воздух-воздух 3кВт', unit: 'шт', price: 50000, category: 'solar_ext' },
        'heat_pump_air_water_8kw': { name: 'Тепловой насос воздух-вода 8кВт', unit: 'шт', price: 150000, category: 'solar_ext' },
        'heat_pump_air_water_12kw': { name: 'Тепловой насос воздух-вода 12кВт', unit: 'шт', price: 250000, category: 'solar_ext' },
        // Солнечные коллекторы
        'solar_collector_flat_2m2': { name: 'Солнечный коллектор плоский 2м²', unit: 'шт', price: 15000, category: 'solar_ext' },
        'solar_collector_vacuum_20tube': { name: 'Солнечный коллектор вакуумный 20 труб', unit: 'шт', price: 20000, category: 'solar_ext' }
    };
})();
