// === ФАЗА 3: ПРОМЫШЛЕННЫЕ ОБЪЕКТЫ — ЗЕРНОХРАНИЛИЩА, ХОЛОДИЛЬНИКИ, ЧИСТЫЕ КОМНАТЫ (130 поз.) ===
(function () {
    window.AI_WRK_INDUSTRIAL_SPEC = {
        // === ПРОМЫШЛЕННЫЕ ПОЛЫ (допол.) ===
        'wrk_ind_floor_magnesite': { name: 'Магнезитовый пол (промышл.)', unit: 'м²', price: 150, category: 'industrial_spec' },
        'wrk_ind_floor_acid_res': { name: 'Кислотостойкий пол', unit: 'м²', price: 200, category: 'industrial_spec' },
        'wrk_ind_floor_antistatic': { name: 'Антистатический пол', unit: 'м²', price: 180, category: 'industrial_spec' },
        'wrk_ind_floor_joint_armor': { name: 'Бронированный шов (промышл. пол)', unit: 'м.п.', price: 30, category: 'industrial_spec' },

        // === ХОЛОДИЛЬНЫЕ КАМЕРЫ ===
        'wrk_ind_cold_panel_80': { name: 'Сэндвич-панель холод. 80мм', unit: 'м²', price: 200, category: 'industrial_spec' },
        'wrk_ind_cold_panel_100': { name: 'Сэндвич-панель холод. 100мм', unit: 'м²', price: 250, category: 'industrial_spec' },
        'wrk_ind_cold_panel_120': { name: 'Сэндвич-панель холод. 120мм', unit: 'м²', price: 300, category: 'industrial_spec' },
        'wrk_ind_cold_panel_150': { name: 'Сэндвич-панель холод. 150мм', unit: 'м²', price: 350, category: 'industrial_spec' },
        'wrk_ind_cold_panel_200': { name: 'Сэндвич-панель холод. 200мм', unit: 'м²', price: 450, category: 'industrial_spec' },
        'wrk_ind_cold_door_pivot': { name: 'Дверь холодильной камеры (распашная)', unit: 'шт', price: 3000, category: 'industrial_spec' },
        'wrk_ind_cold_door_slide': { name: 'Дверь холодильной камеры (откатная)', unit: 'шт', price: 5000, category: 'industrial_spec' },
        'wrk_ind_cold_unit_mono': { name: 'Моноблок холодильный', unit: 'шт', price: 5000, category: 'industrial_spec' },
        'wrk_ind_cold_unit_split': { name: 'Сплит-система холодильная', unit: 'шт', price: 8000, category: 'industrial_spec' },
        'wrk_ind_cold_unit_centr': { name: 'Центральная холодильная установка', unit: 'шт', price: 50000, category: 'industrial_spec' },
        'wrk_ind_cold_curtain': { name: 'Воздушная завеса (холод. камера)', unit: 'шт', price: 3000, category: 'industrial_spec' },
        'wrk_ind_cold_floor_heat': { name: 'Обогрев пола холодил. камеры', unit: 'м²', price: 100, category: 'industrial_spec' },

        // === ЧИСТЫЕ КОМНАТЫ ===
        'wrk_ind_clean_iso7': { name: 'Чистая комната ISO 7 (класс 10000)', unit: 'м²', price: 3000, category: 'industrial_spec' },
        'wrk_ind_clean_iso6': { name: 'Чистая комната ISO 6 (класс 1000)', unit: 'м²', price: 5000, category: 'industrial_spec' },
        'wrk_ind_clean_iso5': { name: 'Чистая комната ISO 5 (класс 100)', unit: 'м²', price: 8000, category: 'industrial_spec' },
        'wrk_ind_clean_hepa': { name: 'Фильтр HEPA H13 (монтаж)', unit: 'шт', price: 500, category: 'industrial_spec' },
        'wrk_ind_clean_hepa14': { name: 'Фильтр HEPA H14 (монтаж)', unit: 'шт', price: 800, category: 'industrial_spec' },
        'wrk_ind_clean_ulpa': { name: 'Фильтр ULPA (монтаж)', unit: 'шт', price: 1500, category: 'industrial_spec' },
        'wrk_ind_clean_ffu': { name: 'FFU (вентиляционный модуль)', unit: 'шт', price: 2000, category: 'industrial_spec' },
        'wrk_ind_clean_airlock': { name: 'Шлюзовая камера', unit: 'шт', price: 10000, category: 'industrial_spec' },
        'wrk_ind_clean_airshower': { name: 'Воздушный душ', unit: 'шт', price: 5000, category: 'industrial_spec' },
        'wrk_ind_clean_passbox': { name: 'Передаточное окно', unit: 'шт', price: 3000, category: 'industrial_spec' },

        // === СКЛАДСКИЕ СИСТЕМЫ ===
        'wrk_ind_rack_pallet_1t': { name: 'Стеллаж паллетный 1т/ярус', unit: 'секция', price: 2000, category: 'industrial_spec' },
        'wrk_ind_rack_pallet_2t': { name: 'Стеллаж паллетный 2т/ярус', unit: 'секция', price: 3000, category: 'industrial_spec' },
        'wrk_ind_rack_shelf_300': { name: 'Стеллаж полочный 300кг/полка', unit: 'секция', price: 500, category: 'industrial_spec' },
        'wrk_ind_rack_mezzanine': { name: 'Мезонин (антресольные площадки)', unit: 'м²', price: 1000, category: 'industrial_spec' },
        'wrk_ind_rack_drive_in': { name: 'Стеллаж набивной (drive-in)', unit: 'секция', price: 5000, category: 'industrial_spec' },
        'wrk_ind_rack_cantilever': { name: 'Стеллаж консольный', unit: 'секция', price: 3000, category: 'industrial_spec' },
        'wrk_ind_dock_leveler': { name: 'Перегрузочный мост (докшелтер)', unit: 'шт', price: 20000, category: 'industrial_spec' },
        'wrk_ind_dock_shelter': { name: 'Герметизатор проёма', unit: 'шт', price: 10000, category: 'industrial_spec' },
        'wrk_ind_dock_gate_sect': { name: 'Секционные ворота промышленные', unit: 'шт', price: 15000, category: 'industrial_spec' },
        'wrk_ind_dock_gate_roll': { name: 'Рулонные скоростные ворота', unit: 'шт', price: 20000, category: 'industrial_spec' },

        // === ЗЕРНОХРАНИЛИЩА ===
        'wrk_ind_silo_100t': { name: 'Силос зерновой 100т', unit: 'шт', price: 50000, category: 'industrial_spec' },
        'wrk_ind_silo_200t': { name: 'Силос зерновой 200т', unit: 'шт', price: 80000, category: 'industrial_spec' },
        'wrk_ind_silo_500t': { name: 'Силос зерновой 500т', unit: 'шт', price: 150000, category: 'industrial_spec' },
        'wrk_ind_silo_1000t': { name: 'Силос зерновой 1000т', unit: 'шт', price: 250000, category: 'industrial_spec' },
        'wrk_ind_grain_conveyor': { name: 'Зерновой конвейер (ленточный)', unit: 'м.п.', price: 2000, category: 'industrial_spec' },
        'wrk_ind_grain_elevator': { name: 'Нория (зерновой элеватор)', unit: 'шт', price: 30000, category: 'industrial_spec' },
        'wrk_ind_grain_aeration': { name: 'Система аэрации силоса', unit: 'шт', price: 5000, category: 'industrial_spec' },
        'wrk_ind_grain_dryer': { name: 'Зерносушилка', unit: 'шт', price: 100000, category: 'industrial_spec' },
        'wrk_ind_grain_cleaner': { name: 'Зерноочистительная машина', unit: 'шт', price: 50000, category: 'industrial_spec' },

        // === КРАНОВЫЕ СИСТЕМЫ ===
        'wrk_ind_crane_bridge_5t': { name: 'Мостовой кран 5т (монтаж)', unit: 'шт', price: 30000, category: 'industrial_spec' },
        'wrk_ind_crane_bridge_10t': { name: 'Мостовой кран 10т (монтаж)', unit: 'шт', price: 50000, category: 'industrial_spec' },
        'wrk_ind_crane_bridge_20t': { name: 'Мостовой кран 20т (монтаж)', unit: 'шт', price: 80000, category: 'industrial_spec' },
        'wrk_ind_crane_bridge_50t': { name: 'Мостовой кран 50т (монтаж)', unit: 'шт', price: 150000, category: 'industrial_spec' },
        'wrk_ind_crane_gantry_5t': { name: 'Козловой кран 5т', unit: 'шт', price: 40000, category: 'industrial_spec' },
        'wrk_ind_crane_gantry_10t': { name: 'Козловой кран 10т', unit: 'шт', price: 60000, category: 'industrial_spec' },
        'wrk_ind_crane_jib_1t': { name: 'Кран-балка 1т', unit: 'шт', price: 10000, category: 'industrial_spec' },
        'wrk_ind_crane_jib_2t': { name: 'Кран-балка 2т', unit: 'шт', price: 15000, category: 'industrial_spec' },
        'wrk_ind_crane_jib_5t': { name: 'Кран-балка 5т', unit: 'шт', price: 25000, category: 'industrial_spec' },

        // === РЕЗЕРВУАРЫ ===
        'wrk_ind_tank_steel_5': { name: 'Стальной резервуар 5м³', unit: 'шт', price: 10000, category: 'industrial_spec' },
        'wrk_ind_tank_steel_10': { name: 'Стальной резервуар 10м³', unit: 'шт', price: 18000, category: 'industrial_spec' },
        'wrk_ind_tank_steel_25': { name: 'Стальной резервуар 25м³', unit: 'шт', price: 35000, category: 'industrial_spec' },
        'wrk_ind_tank_steel_50': { name: 'Стальной резервуар 50м³', unit: 'шт', price: 60000, category: 'industrial_spec' },
        'wrk_ind_tank_rvs_100': { name: 'РВС 100м³', unit: 'шт', price: 100000, category: 'industrial_spec' },
        'wrk_ind_tank_rvs_500': { name: 'РВС 500м³', unit: 'шт', price: 300000, category: 'industrial_spec' },
        'wrk_ind_tank_rvs_1000': { name: 'РВС 1000м³', unit: 'шт', price: 500000, category: 'industrial_spec' },
        'wrk_ind_tank_pe_1': { name: 'Пластиковый резервуар 1м³', unit: 'шт', price: 1000, category: 'industrial_spec' },
        'wrk_ind_tank_pe_3': { name: 'Пластиковый резервуар 3м³', unit: 'шт', price: 2000, category: 'industrial_spec' },
        'wrk_ind_tank_pe_5': { name: 'Пластиковый резервуар 5м³', unit: 'шт', price: 3000, category: 'industrial_spec' },
        'wrk_ind_tank_pe_10': { name: 'Пластиковый резервуар 10м³', unit: 'шт', price: 5000, category: 'industrial_spec' }
    };
})();
