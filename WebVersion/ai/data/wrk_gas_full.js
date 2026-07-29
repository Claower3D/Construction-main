// === ФАЗА 3: ВНУТРЕННЕЕ ГАЗОСНАБЖЕНИЕ, ДЕТЕКТОРЫ, СЧЁТЧИКИ, КОТЕЛЬНАЯ (90 поз.) ===
(function () {
    window.AI_WRK_GAS_FULL = {
        // === ГАЗОВЫЕ ТРУБЫ (внутренние) ===
        'wrk_gas_steel_15': { name: 'Газопровод стальной Ø15мм (внутр.)', unit: 'м.п.', price: 60, category: 'gas_full' },
        'wrk_gas_steel_20': { name: 'Газопровод стальной Ø20мм (внутр.)', unit: 'м.п.', price: 70, category: 'gas_full' },
        'wrk_gas_steel_25': { name: 'Газопровод стальной Ø25мм (внутр.)', unit: 'м.п.', price: 80, category: 'gas_full' },
        'wrk_gas_steel_32': { name: 'Газопровод стальной Ø32мм (внутр.)', unit: 'м.п.', price: 100, category: 'gas_full' },
        'wrk_gas_steel_40': { name: 'Газопровод стальной Ø40мм (внутр.)', unit: 'м.п.', price: 120, category: 'gas_full' },
        'wrk_gas_steel_50': { name: 'Газопровод стальной Ø50мм (внутр.)', unit: 'м.п.', price: 150, category: 'gas_full' },
        'wrk_gas_flex_15': { name: 'Гибкая подводка газовая Ø15мм', unit: 'шт', price: 50, category: 'gas_full' },
        'wrk_gas_flex_20': { name: 'Гибкая подводка газовая Ø20мм', unit: 'шт', price: 70, category: 'gas_full' },
        'wrk_gas_csst_15': { name: 'Гофра нерж. газовая Ø15мм', unit: 'м.п.', price: 50, category: 'gas_full' },
        'wrk_gas_csst_20': { name: 'Гофра нерж. газовая Ø20мм', unit: 'м.п.', price: 60, category: 'gas_full' },
        'wrk_gas_csst_25': { name: 'Гофра нерж. газовая Ø25мм', unit: 'м.п.', price: 70, category: 'gas_full' },

        // === ГАЗОВАЯ АРМАТУРА ===
        'wrk_gas_valve_therm': { name: 'Термозапорный клапан', unit: 'шт', price: 100, category: 'gas_full' },
        'wrk_gas_valve_solenoid': { name: 'Электромагнитный клапан (газ)', unit: 'шт', price: 200, category: 'gas_full' },
        'wrk_gas_filter': { name: 'Фильтр газовый', unit: 'шт', price: 100, category: 'gas_full' },
        'wrk_gas_dielectric': { name: 'Диэлектрическая муфта', unit: 'шт', price: 30, category: 'gas_full' },

        // === ГАЗОВЫЕ СЧЁТЧИКИ ===
        'wrk_gas_meter_g4': { name: 'Счётчик газа G4 (бытовой)', unit: 'шт', price: 300, category: 'gas_full' },
        'wrk_gas_meter_g6': { name: 'Счётчик газа G6', unit: 'шт', price: 400, category: 'gas_full' },
        'wrk_gas_meter_g10': { name: 'Счётчик газа G10', unit: 'шт', price: 600, category: 'gas_full' },
        'wrk_gas_meter_g16': { name: 'Счётчик газа G16', unit: 'шт', price: 1000, category: 'gas_full' },
        'wrk_gas_meter_g25': { name: 'Счётчик газа G25', unit: 'шт', price: 1500, category: 'gas_full' },
        'wrk_gas_meter_rotary_g25': { name: 'Счётчик газа ротационный G25', unit: 'шт', price: 3000, category: 'gas_full' },
        'wrk_gas_meter_turbine': { name: 'Счётчик газа турбинный', unit: 'шт', price: 5000, category: 'gas_full' },
        'wrk_gas_meter_corr': { name: 'Корректор объёма газа', unit: 'шт', price: 3000, category: 'gas_full' },

        // === ГАЗОВЫЕ ДЕТЕКТОРЫ ===
        'wrk_gas_detect_ch4': { name: 'Сигнализатор метана (CH₄)', unit: 'шт', price: 100, category: 'gas_full' },
        'wrk_gas_detect_co': { name: 'Сигнализатор угарного газа (CO)', unit: 'шт', price: 100, category: 'gas_full' },
        'wrk_gas_detect_combo': { name: 'Сигнализатор CH₄+CO', unit: 'шт', price: 150, category: 'gas_full' },
        'wrk_gas_detect_lpg': { name: 'Сигнализатор пропан-бутан (LPG)', unit: 'шт', price: 100, category: 'gas_full' },
        'wrk_gas_detect_panel': { name: 'Приёмная панель (газоанализатор)', unit: 'шт', price: 500, category: 'gas_full' },

        // === ГАЗОВЫЕ ПРИБОРЫ (подключение) ===
        'wrk_gas_stove_4': { name: 'Газовая плита 4 конфорки (подключ.)', unit: 'шт', price: 300, category: 'gas_full' },
        'wrk_gas_stove_5': { name: 'Газовая плита 5 конфорок (подключ.)', unit: 'шт', price: 400, category: 'gas_full' },
        'wrk_gas_hob_4': { name: 'Варочная панель газовая 4 конф.', unit: 'шт', price: 300, category: 'gas_full' },
        'wrk_gas_hob_5': { name: 'Варочная панель газовая 5 конф.', unit: 'шт', price: 400, category: 'gas_full' },
        'wrk_gas_water_heater': { name: 'Газовая колонка (подключение)', unit: 'шт', price: 1000, category: 'gas_full' },
        'wrk_gas_boiler_wall_24': { name: 'Газовый котёл настенный 24кВт (подключ.)', unit: 'шт', price: 3000, category: 'gas_full' },
        'wrk_gas_boiler_wall_32': { name: 'Газовый котёл настенный 32кВт (подключ.)', unit: 'шт', price: 3500, category: 'gas_full' },
        'wrk_gas_boiler_floor_50': { name: 'Газовый котёл напольный 50кВт (подключ.)', unit: 'шт', price: 5000, category: 'gas_full' },
        'wrk_gas_fireplace': { name: 'Газовый камин (подключение)', unit: 'шт', price: 3000, category: 'gas_full' },
        'wrk_gas_grill': { name: 'Газовый гриль (подключение)', unit: 'шт', price: 500, category: 'gas_full' },

        // === ГАЗИФИКАЦИЯ (процедуры) ===
        'wrk_gas_project': { name: 'Проект газификации', unit: 'объект', price: 10000, category: 'gas_full' },
        'wrk_gas_tu': { name: 'Технические условия (газ)', unit: 'объект', price: 5000, category: 'gas_full' },
        'wrk_gas_commissioning': { name: 'Пуско-наладка газового оборудования', unit: 'объект', price: 5000, category: 'gas_full' },
        'wrk_gas_boiler_room_equip': { name: 'Обвязка газовой котельной', unit: 'объект', price: 15000, category: 'gas_full' }
    };
})();
