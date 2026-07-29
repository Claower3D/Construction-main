// === ВОДОСНАБЖЕНИЕ / СКВАЖИНА / НАСОСЫ (35 позиций) ===
(function () {
    window.AI_MAT_WATER_SUPPLY = {
        // Скважинные насосы
        'pump_submersible_3inch_075kw': { name: 'Насос скважинный 3" 0.75кВт (50м)', unit: 'шт', price: 25000, category: 'water_supply' },
        'pump_submersible_4inch_1_1kw': { name: 'Насос скважинный 4" 1.1кВт (80м)', unit: 'шт', price: 40000, category: 'water_supply' },
        'pump_submersible_4inch_1_5kw': { name: 'Насос скважинный 4" 1.5кВт (120м)', unit: 'шт', price: 55000, category: 'water_supply' },
        'pump_submersible_4inch_2_2kw': { name: 'Насос скважинный 4" 2.2кВт (150м)', unit: 'шт', price: 70000, category: 'water_supply' },

        // Поверхностные насосы
        'pump_surface_jet': { name: 'Насос поверхностный самовсасывающий 0.75кВт', unit: 'шт', price: 15000, category: 'water_supply' },
        'pump_station_auto': { name: 'Станция водоснабжения автоматическая (24л)', unit: 'шт', price: 25000, category: 'water_supply' },
        'pump_station_auto_50l': { name: 'Станция водоснабжения автоматическая (50л)', unit: 'шт', price: 35000, category: 'water_supply' },

        // Гидроаккумуляторы
        'hydro_tank_24l': { name: 'Гидроаккумулятор 24л', unit: 'шт', price: 5000, category: 'water_supply' },
        'hydro_tank_50l': { name: 'Гидроаккумулятор 50л', unit: 'шт', price: 8000, category: 'water_supply' },
        'hydro_tank_80l': { name: 'Гидроаккумулятор 80л', unit: 'шт', price: 12000, category: 'water_supply' },
        'hydro_tank_100l': { name: 'Гидроаккумулятор 100л', unit: 'шт', price: 15000, category: 'water_supply' },

        // Автоматика
        'pressure_switch': { name: 'Реле давления (автоматика)', unit: 'шт', price: 2000, category: 'water_supply' },
        'pressure_gauge': { name: 'Манометр 0-6 бар', unit: 'шт', price: 300, category: 'water_supply' },
        'flow_switch': { name: 'Реле потока (защита от сухого хода)', unit: 'шт', price: 3000, category: 'water_supply' },
        'freq_drive_1_5kw': { name: 'Частотный регулятор 1.5кВт (для насоса)', unit: 'шт', price: 15000, category: 'water_supply' },

        // Трубы для скважины
        'casing_pipe_125_pvc': { name: 'Труба обсадная ПВХ Ø125мм (3м)', unit: 'шт', price: 2000, category: 'water_supply' },
        'casing_pipe_160_pvc': { name: 'Труба обсадная ПВХ Ø160мм (3м)', unit: 'шт', price: 3000, category: 'water_supply' },
        'casing_pipe_133_steel': { name: 'Труба обсадная стальная Ø133мм (6м)', unit: 'шт', price: 6000, category: 'water_supply' },

        // Фильтры
        'filter_mech_10inch': { name: 'Фильтр механический 10" (колба)', unit: 'шт', price: 1500, category: 'water_supply' },
        'filter_mech_20inch': { name: 'Фильтр механический 20" BigBlue (колба)', unit: 'шт', price: 3000, category: 'water_supply' },
        'filter_cartridge_5mk': { name: 'Картридж полипропиленовый 5мкм', unit: 'шт', price: 200, category: 'water_supply' },
        'filter_cartridge_carbon': { name: 'Картридж угольный (10")', unit: 'шт', price: 400, category: 'water_supply' },
        'filter_iron_removal': { name: 'Фильтр обезжелезивания (1.5м³/ч)', unit: 'шт', price: 45000, category: 'water_supply' },
        'filter_softener': { name: 'Умягчитель воды (1.5м³/ч)', unit: 'шт', price: 40000, category: 'water_supply' },
        'filter_ro_5stage': { name: 'Фильтр обратного осмоса 5-ступ.', unit: 'шт', price: 15000, category: 'water_supply' },
        'filter_uv_sterilizer': { name: 'УФ стерилизатор воды (1м³/ч)', unit: 'шт', price: 8000, category: 'water_supply' },
        'filter_salt_bag_25': { name: 'Таблетированная соль для умягчителя (25кг)', unit: 'мешок', price: 1500, category: 'water_supply' },

        // Накопительные ёмкости
        'tank_water_500l': { name: 'Ёмкость пластиковая 500л', unit: 'шт', price: 8000, category: 'water_supply' },
        'tank_water_1000l': { name: 'Ёмкость пластиковая 1000л', unit: 'шт', price: 12000, category: 'water_supply' },
        'tank_water_2000l': { name: 'Ёмкость пластиковая 2000л', unit: 'шт', price: 25000, category: 'water_supply' },
        'tank_water_3000l': { name: 'Ёмкость пластиковая 3000л', unit: 'шт', price: 35000, category: 'water_supply' },

        // Адаптер для скважины
        'well_adapter_1inch': { name: 'Адаптер скважинный 1"', unit: 'шт', price: 3000, category: 'water_supply' },
        'well_adapter_1_25inch': { name: 'Адаптер скважинный 1 1/4"', unit: 'шт', price: 4000, category: 'water_supply' },
        'well_head_130': { name: 'Оголовок для скважины Ø130', unit: 'шт', price: 2500, category: 'water_supply' },

        // Кессон
        'caisson_plastic_1m': { name: 'Кессон пластиковый Ø1м (высота 2м)', unit: 'шт', price: 30000, category: 'water_supply' },
        'caisson_plastic_1_2m': { name: 'Кессон пластиковый Ø1.2м (высота 2м)', unit: 'шт', price: 40000, category: 'water_supply' }
    };
})();
