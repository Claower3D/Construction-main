// === КАТАЛОГ ТРУБОПРОВОДОВ — ТОЛЬКО УНИКАЛЬНЫЕ ПОЗИЦИИ (без дублей с mat_plumbing.js) ===
// mat_plumbing.js уже содержит: трубы PPR (20-63) + армированные, фитинги PPR, ПЭ трубы+фитинги,
// м/п трубы (16-32), PEX (16,20), канализация (50,110) + фитинги, наружная канализация,
// краны шаровые (1/2"-2"), обратные клапаны, фильтры грубой/тонкой, счётчики,
// коллекторы (2-4 выхода + шкаф), гибкая подводка, герметизация (фум/лён/нить), клипсы, сифоны
(function () {
    window.AI_MAT_PIPING_CATALOG = {
        // Медные трубы (уникальная категория)
        'pipe_copper_15_5m': { name: 'Труба медная Ø15мм (5м)', unit: 'шт', price: 1000, category: 'piping_catalog' },
        'pipe_copper_18_5m': { name: 'Труба медная Ø18мм (5м)', unit: 'шт', price: 1300, category: 'piping_catalog' },
        'pipe_copper_22_5m': { name: 'Труба медная Ø22мм (5м)', unit: 'шт', price: 1600, category: 'piping_catalog' },
        'pipe_copper_28_5m': { name: 'Труба медная Ø28мм (5м)', unit: 'шт', price: 2500, category: 'piping_catalog' },
        // Фитинги пресс для м/п (уникальная категория)
        'fitting_press_16_elbow': { name: 'Угол пресс м/п Ø16мм', unit: 'шт', price: 50, category: 'piping_catalog' },
        'fitting_press_16_tee': { name: 'Тройник пресс м/п Ø16мм', unit: 'шт', price: 60, category: 'piping_catalog' },
        'fitting_press_16_coupling': { name: 'Муфта пресс м/п Ø16мм', unit: 'шт', price: 40, category: 'piping_catalog' },
        'fitting_press_20_elbow': { name: 'Угол пресс м/п Ø20мм', unit: 'шт', price: 60, category: 'piping_catalog' },
        'fitting_press_20_tee': { name: 'Тройник пресс м/п Ø20мм', unit: 'шт', price: 80, category: 'piping_catalog' },
        'fitting_press_20_coupling': { name: 'Муфта пресс м/п Ø20мм', unit: 'шт', price: 50, category: 'piping_catalog' },
        // PEX-b для тёплого пола — бухты (mat_plumbing: PEX-a по метрам)
        'pipe_pex_b_16_200m': { name: 'Труба PEX-b Ø16мм теплый пол (200м)', unit: 'бухта', price: 3000, category: 'piping_catalog' },
        'pipe_pex_b_20_100m': { name: 'Труба PEX-b Ø20мм теплый пол (100м)', unit: 'бухта', price: 2500, category: 'piping_catalog' },
        // Коллекторы тёплого пола (mat_plumbing содержит общие коллекторы)
        'collector_floor_heat_3': { name: 'Коллектор тёплого пола 3 контура', unit: 'компл.', price: 3000, category: 'piping_catalog' },
        'collector_floor_heat_4': { name: 'Коллектор тёплого пола 4 контура', unit: 'компл.', price: 4000, category: 'piping_catalog' },
        'collector_floor_heat_5': { name: 'Коллектор тёплого пола 5 контуров', unit: 'компл.', price: 5000, category: 'piping_catalog' },
        'collector_floor_heat_6': { name: 'Коллектор тёплого пола 6 контуров', unit: 'компл.', price: 6000, category: 'piping_catalog' },
        // Редукторы давления (уникальная категория)
        'valve_pressure_1_2': { name: 'Редуктор давления 1/2"', unit: 'шт', price: 500, category: 'piping_catalog' },
        'valve_pressure_3_4': { name: 'Редуктор давления 3/4"', unit: 'шт', price: 600, category: 'piping_catalog' },
        'valve_pressure_1': { name: 'Редуктор давления 1"', unit: 'шт', price: 800, category: 'piping_catalog' },
        // Гидроаккумуляторы (уникальная категория)
        'hydro_tank_24l': { name: 'Гидроаккумулятор 24л', unit: 'шт', price: 3000, category: 'piping_catalog' },
        'hydro_tank_50l': { name: 'Гидроаккумулятор 50л', unit: 'шт', price: 5000, category: 'piping_catalog' },
        'hydro_tank_80l': { name: 'Гидроаккумулятор 80л', unit: 'шт', price: 7000, category: 'piping_catalog' },
        'hydro_tank_100l': { name: 'Гидроаккумулятор 100л', unit: 'шт', price: 9000, category: 'piping_catalog' },
        // Насосные станции (уникальная категория)
        'pump_station_auto': { name: 'Насосная станция автоматич. 1.1кВт', unit: 'шт', price: 10000, category: 'piping_catalog' },
        'pump_submersible_well': { name: 'Насос скважинный 4" 1.1кВт', unit: 'шт', price: 15000, category: 'piping_catalog' },
        'pump_drain_clean': { name: 'Насос дренажный для чистой воды', unit: 'шт', price: 3000, category: 'piping_catalog' },
        'pump_drain_dirty': { name: 'Насос дренажный для грязной воды', unit: 'шт', price: 5000, category: 'piping_catalog' },
        // Инструмент для труб (уникальная категория)
        'tool_pp_welder': { name: 'Паяльник для ПП труб', unit: 'шт', price: 2000, category: 'piping_catalog' },
        'tool_pipe_cutter_42': { name: 'Труборез Ø42мм', unit: 'шт', price: 500, category: 'piping_catalog' },
        'tool_press_manual_16_32': { name: 'Пресс-клещи ручные Ø16-32мм', unit: 'шт', price: 5000, category: 'piping_catalog' },
        'tool_pipe_wrench_1': { name: 'Ключ трубный №1', unit: 'шт', price: 500, category: 'piping_catalog' },
        'tool_pipe_wrench_2': { name: 'Ключ трубный №2', unit: 'шт', price: 700, category: 'piping_catalog' },
        // Водонагреватели (уникальная категория)
        'water_heater_50l': { name: 'Водонагреватель накопит. 50л', unit: 'шт', price: 10000, category: 'piping_catalog' },
        'water_heater_80l': { name: 'Водонагреватель накопит. 80л', unit: 'шт', price: 15000, category: 'piping_catalog' },
        'water_heater_100l': { name: 'Водонагреватель накопит. 100л', unit: 'шт', price: 20000, category: 'piping_catalog' },
        'water_heater_inst_5kw': { name: 'Водонагреватель проточный 5кВт', unit: 'шт', price: 5000, category: 'piping_catalog' },
        'water_heater_inst_7kw': { name: 'Водонагреватель проточный 7кВт', unit: 'шт', price: 8000, category: 'piping_catalog' }
    };
})();
