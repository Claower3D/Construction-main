// === СОЛНЕЧНАЯ ЭНЕРГЕТИКА И АЛЬТЕРНАТИВНЫЕ ИСТОЧНИКИ (30 позиций) ===
(function () {
    window.AI_MAT_SOLAR = {
        // Солнечные панели
        'solar_panel_mono_400w': { name: 'Панель солнечная монокристалл 400Вт', unit: 'шт', price: 60000, category: 'solar' },
        'solar_panel_mono_550w': { name: 'Панель солнечная монокристалл 550Вт', unit: 'шт', price: 80000, category: 'solar' },
        'solar_panel_poly_300w': { name: 'Панель солнечная поликристалл 300Вт', unit: 'шт', price: 40000, category: 'solar' },
        'solar_panel_flexible_100w': { name: 'Панель солнечная гибкая 100Вт', unit: 'шт', price: 25000, category: 'solar' },

        // Инверторы
        'solar_inverter_3kw': { name: 'Инвертор сетевой 3кВт', unit: 'шт', price: 120000, category: 'solar' },
        'solar_inverter_5kw': { name: 'Инвертор сетевой 5кВт', unit: 'шт', price: 180000, category: 'solar' },
        'solar_inverter_10kw': { name: 'Инвертор сетевой 10кВт', unit: 'шт', price: 300000, category: 'solar' },
        'solar_inverter_hybrid_5kw': { name: 'Инвертор гибридный 5кВт (с АКБ)', unit: 'шт', price: 250000, category: 'solar' },
        'solar_inverter_hybrid_10kw': { name: 'Инвертор гибридный 10кВт (с АКБ)', unit: 'шт', price: 400000, category: 'solar' },

        // Аккумуляторы
        'solar_battery_lifepo4_5kwh': { name: 'АКБ LiFePO4 5кВт·ч', unit: 'шт', price: 200000, category: 'solar' },
        'solar_battery_lifepo4_10kwh': { name: 'АКБ LiFePO4 10кВт·ч', unit: 'шт', price: 380000, category: 'solar' },
        'solar_battery_gel_200ah': { name: 'АКБ гелевый 12В 200Ач', unit: 'шт', price: 40000, category: 'solar' },

        // Крепления
        'solar_mount_roof_set': { name: 'Крепление на крышу (комплект на 1 панель)', unit: 'комплект', price: 5000, category: 'solar' },
        'solar_mount_ground_set': { name: 'Крепление наземное (комплект на 1 панель)', unit: 'комплект', price: 8000, category: 'solar' },
        'solar_rail_41x35_4m': { name: 'Профиль монтажный 41×35мм (4м)', unit: 'шт', price: 3000, category: 'solar' },
        'solar_clamp_end': { name: 'Зажим концевой для панели', unit: 'шт', price: 100, category: 'solar' },
        'solar_clamp_mid': { name: 'Зажим межпанельный', unit: 'шт', price: 80, category: 'solar' },

        // Кабельная продукция
        'solar_cable_4mm_1m': { name: 'Кабель солнечный 4мм² (п.м.)', unit: 'п.м.', price: 120, category: 'solar' },
        'solar_cable_6mm_1m': { name: 'Кабель солнечный 6мм² (п.м.)', unit: 'п.м.', price: 180, category: 'solar' },
        'solar_connector_mc4': { name: 'Коннектор MC4 (пара)', unit: 'пара', price: 200, category: 'solar' },
        'solar_combiner_box_4': { name: 'Коробка присоединения (4 стринга)', unit: 'шт', price: 5000, category: 'solar' },

        // Тепловые насосы
        'heat_pump_air_water_10kw': { name: 'Тепловой насос воздух-вода 10кВт', unit: 'шт', price: 600000, category: 'solar' },
        'heat_pump_air_water_16kw': { name: 'Тепловой насос воздух-вода 16кВт', unit: 'шт', price: 900000, category: 'solar' },
        'heat_pump_ground_10kw': { name: 'Тепловой насос грунт-вода 10кВт', unit: 'шт', price: 800000, category: 'solar' },

        // Солнечные коллекторы (ГВС)
        'solar_collector_flat_2m2': { name: 'Коллектор солнечный плоский 2м²', unit: 'шт', price: 60000, category: 'solar' },
        'solar_collector_vacuum_20': { name: 'Коллектор солнечный вакуумный (20 трубок)', unit: 'шт', price: 45000, category: 'solar' },
        'solar_collector_tank_200l': { name: 'Бак-аккумулятор для солнечной системы 200л', unit: 'шт', price: 80000, category: 'solar' },

        // Ветрогенераторы
        'wind_turbine_1kw': { name: 'Ветрогенератор 1кВт', unit: 'шт', price: 150000, category: 'solar' },
        'wind_turbine_3kw': { name: 'Ветрогенератор 3кВт', unit: 'шт', price: 350000, category: 'solar' },
        'wind_mast_6m': { name: 'Мачта для ветрогенератора (6м)', unit: 'шт', price: 50000, category: 'solar' }
    };
})();
