// === ФАЗА 3: БЫТОВАЯ ТЕХНИКА (УСТАНОВКА), ЭЛЕКТРОПРИБОРЫ, КУХОННАЯ ТЕХНИКА (150 поз.) ===
(function () {
    window.AI_WRK_APPLIANCES = {
        // === КРУПНАЯ БЫТОВАЯ ТЕХНИКА ===
        'wrk_app_fridge_std': { name: 'Холодильник отдельностоящий (подключение)', unit: 'шт', price: 300, category: 'appliances' },
        'wrk_app_fridge_builtin': { name: 'Холодильник встраиваемый (монтаж)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_fridge_sidebyside': { name: 'Холодильник Side-by-Side', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_washer_std': { name: 'Стиральная машина (подключение)', unit: 'шт', price: 300, category: 'appliances' },
        'wrk_app_washer_builtin': { name: 'Стиральная машина встраив.', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_dryer_std': { name: 'Сушильная машина (подключение)', unit: 'шт', price: 300, category: 'appliances' },
        'wrk_app_washer_dryer': { name: 'Стирально-сушильная (подключение)', unit: 'шт', price: 400, category: 'appliances' },
        'wrk_app_dishwasher_full': { name: 'Посудомоечная машина 60см (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_dishwasher_45': { name: 'Посудомоечная машина 45см (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_dishwasher_compact': { name: 'Посудомоечная настольная', unit: 'шт', price: 200, category: 'appliances' },

        // === КУХОННАЯ ТЕХНИКА ===
        'wrk_app_hob_gas_4': { name: 'Панель газовая 4 конф. (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_hob_gas_5': { name: 'Панель газовая 5 конф. (подключ.)', unit: 'шт', price: 600, category: 'appliances' },
        'wrk_app_hob_electric': { name: 'Панель электрическая (подключ.)', unit: 'шт', price: 400, category: 'appliances' },
        'wrk_app_hob_induction': { name: 'Панель индукционная (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_hob_combo': { name: 'Панель комбинированная (газ+эл.)', unit: 'шт', price: 600, category: 'appliances' },
        'wrk_app_oven_electric': { name: 'Духовой шкаф электрический (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_oven_gas': { name: 'Духовой шкаф газовый (подключ.)', unit: 'шт', price: 600, category: 'appliances' },
        'wrk_app_oven_steam': { name: 'Пароварка встраиваемая (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_oven_microwave_bi': { name: 'СВЧ встраиваемая (подключ.)', unit: 'шт', price: 300, category: 'appliances' },
        'wrk_app_oven_coffee_bi': { name: 'Кофемашина встраиваемая (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_hood_flat': { name: 'Вытяжка плоская (монтаж)', unit: 'шт', price: 300, category: 'appliances' },
        'wrk_app_hood_dome': { name: 'Вытяжка купольная (монтаж)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_hood_island': { name: 'Вытяжка островная (монтаж)', unit: 'шт', price: 800, category: 'appliances' },
        'wrk_app_hood_builtin': { name: 'Вытяжка встраиваемая (монтаж)', unit: 'шт', price: 400, category: 'appliances' },
        'wrk_app_hood_downdraft': { name: 'Вытяжка нисходящая (монтаж)', unit: 'шт', price: 1000, category: 'appliances' },
        'wrk_app_hood_duct_alu': { name: 'Воздуховод вытяжки (алюминий)', unit: 'м.п.', price: 30, category: 'appliances' },
        'wrk_app_hood_duct_pvc': { name: 'Воздуховод вытяжки (ПВХ)', unit: 'м.п.', price: 20, category: 'appliances' },
        'wrk_app_hood_outlet': { name: 'Вентиляционная решётка (вытяжка)', unit: 'шт', price: 100, category: 'appliances' },
        'wrk_app_disposal': { name: 'Измельчитель пищевых отходов', unit: 'шт', price: 500, category: 'appliances' },

        // === ВОДОНАГРЕВАТЕЛИ ===
        'wrk_app_boiler_50': { name: 'Бойлер 50л (установка)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_boiler_80': { name: 'Бойлер 80л (установка)', unit: 'шт', price: 600, category: 'appliances' },
        'wrk_app_boiler_100': { name: 'Бойлер 100л (установка)', unit: 'шт', price: 700, category: 'appliances' },
        'wrk_app_boiler_150': { name: 'Бойлер 150л (установка)', unit: 'шт', price: 800, category: 'appliances' },
        'wrk_app_boiler_200': { name: 'Бойлер 200л (установка)', unit: 'шт', price: 1000, category: 'appliances' },
        'wrk_app_boiler_300': { name: 'Бойлер 300л (установка)', unit: 'шт', price: 1500, category: 'appliances' },
        'wrk_app_boiler_flat_50': { name: 'Бойлер плоский 50л (установка)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_boiler_flat_80': { name: 'Бойлер плоский 80л (установка)', unit: 'шт', price: 600, category: 'appliances' },
        'wrk_app_water_heater_gas': { name: 'Газовая колонка (установка)', unit: 'шт', price: 1000, category: 'appliances' },
        'wrk_app_water_heater_inst': { name: 'Проточный эл. нагреватель', unit: 'шт', price: 300, category: 'appliances' },

        // === КОНДИЦИОНЕРЫ БЫТОВЫЕ ===
        'wrk_app_ac_window': { name: 'Кондиционер оконный (монтаж)', unit: 'шт', price: 2000, category: 'appliances' },
        'wrk_app_ac_portable': { name: 'Кондиционер мобильный (подключ.)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_humidifier': { name: 'Увлажнитель воздуха (подключ.)', unit: 'шт', price: 100, category: 'appliances' },
        'wrk_app_dehumidifier': { name: 'Осушитель воздуха (подключ.)', unit: 'шт', price: 200, category: 'appliances' },
        'wrk_app_air_purifier': { name: 'Очиститель воздуха (подключ.)', unit: 'шт', price: 100, category: 'appliances' },

        // === ЭЛЕКТРООБОРУДОВАНИЕ ДОМА ===
        'wrk_app_generator_3': { name: 'Генератор 3кВт (подключение)', unit: 'шт', price: 2000, category: 'appliances' },
        'wrk_app_generator_5': { name: 'Генератор 5кВт (подключение)', unit: 'шт', price: 3000, category: 'appliances' },
        'wrk_app_generator_10': { name: 'Генератор 10кВт (подключение)', unit: 'шт', price: 5000, category: 'appliances' },
        'wrk_app_ats': { name: 'АВР (автопереключатель)', unit: 'шт', price: 3000, category: 'appliances' },
        'wrk_app_stab_5': { name: 'Стабилизатор напряжения 5кВт', unit: 'шт', price: 1000, category: 'appliances' },
        'wrk_app_stab_10': { name: 'Стабилизатор напряжения 10кВт', unit: 'шт', price: 2000, category: 'appliances' },
        'wrk_app_stab_15': { name: 'Стабилизатор напряжения 15кВт', unit: 'шт', price: 3000, category: 'appliances' },
        'wrk_app_ups_1': { name: 'ИБП 1кВт', unit: 'шт', price: 1000, category: 'appliances' },
        'wrk_app_ups_3': { name: 'ИБП 3кВт', unit: 'шт', price: 2000, category: 'appliances' },
        'wrk_app_ups_5': { name: 'ИБП 5кВт', unit: 'шт', price: 3000, category: 'appliances' },
        'wrk_app_ev_charger_7': { name: 'Зарядная станция EV 7кВт', unit: 'шт', price: 5000, category: 'appliances' },
        'wrk_app_ev_charger_22': { name: 'Зарядная станция EV 22кВт', unit: 'шт', price: 10000, category: 'appliances' },

        // === СОЛНЕЧНЫЕ БАТАРЕИ (БЫТОВЫЕ) ===
        'wrk_app_solar_panel_300': { name: 'Солнечная панель 300Вт (монтаж)', unit: 'шт', price: 2000, category: 'appliances' },
        'wrk_app_solar_panel_400': { name: 'Солнечная панель 400Вт (монтаж)', unit: 'шт', price: 2500, category: 'appliances' },
        'wrk_app_solar_panel_500': { name: 'Солнечная панель 500Вт (монтаж)', unit: 'шт', price: 3000, category: 'appliances' },
        'wrk_app_solar_inverter_3': { name: 'Инвертор солнечный 3кВт', unit: 'шт', price: 5000, category: 'appliances' },
        'wrk_app_solar_inverter_5': { name: 'Инвертор солнечный 5кВт', unit: 'шт', price: 8000, category: 'appliances' },
        'wrk_app_solar_inverter_10': { name: 'Инвертор солнечный 10кВт', unit: 'шт', price: 15000, category: 'appliances' },
        'wrk_app_solar_battery_5': { name: 'Аккумулятор 5кВт·ч', unit: 'шт', price: 10000, category: 'appliances' },
        'wrk_app_solar_battery_10': { name: 'Аккумулятор 10кВт·ч', unit: 'шт', price: 18000, category: 'appliances' },
        'wrk_app_solar_mount_roof': { name: 'Крепление панелей (кровля)', unit: 'шт', price: 500, category: 'appliances' },
        'wrk_app_solar_mount_ground': { name: 'Крепление панелей (на грунт)', unit: 'шт', price: 800, category: 'appliances' }
    };
})();
