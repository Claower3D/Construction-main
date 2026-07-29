// === ФАЗА 3: ЖКХ, ТЕХОБСЛУЖИВАНИЕ, СЕРВИС, АВАРИЙНЫЕ РАБОТЫ, ДИАГНОСТИКА (100 поз.) ===
(function () {
    window.AI_WRK_MAINTENANCE = {
        // === ТЕХОБСЛУЖИВАНИЕ ИНЖЕНЕРНЫХ СИСТЕМ ===
        'wrk_mnt_boiler_annual': { name: 'ТО котла (ежегодное)', unit: 'шт', price: 1000, category: 'maintenance' },
        'wrk_mnt_boiler_flush': { name: 'Промывка теплообменника котла', unit: 'шт', price: 500, category: 'maintenance' },
        'wrk_mnt_heating_flush': { name: 'Промывка системы отопления', unit: 'объект', price: 3000, category: 'maintenance' },
        'wrk_mnt_heating_balance': { name: 'Балансировка системы отопления', unit: 'объект', price: 2000, category: 'maintenance' },
        'wrk_mnt_heating_pressure': { name: 'Опрессовка отопления', unit: 'объект', price: 2000, category: 'maintenance' },
        'wrk_mnt_ac_service': { name: 'ТО кондиционера (сплит)', unit: 'шт', price: 500, category: 'maintenance' },
        'wrk_mnt_ac_refill': { name: 'Дозаправка фреоном', unit: 'шт', price: 500, category: 'maintenance' },
        'wrk_mnt_ac_clean': { name: 'Чистка кондиционера (глубокая)', unit: 'шт', price: 300, category: 'maintenance' },
        'wrk_mnt_vent_filter': { name: 'Замена фильтров вентиляции', unit: 'шт', price: 200, category: 'maintenance' },
        'wrk_mnt_vent_clean_duct': { name: 'Чистка воздуховодов', unit: 'м²', price: 30, category: 'maintenance' },
        'wrk_mnt_vent_disinfect': { name: 'Дезинфекция вентиляции', unit: 'м²', price: 20, category: 'maintenance' },
        'wrk_mnt_elev_annual': { name: 'ТО лифта (ежемес.)', unit: 'мес', price: 3000, category: 'maintenance' },
        'wrk_mnt_elev_modernize': { name: 'Модернизация лифта', unit: 'шт', price: 50000, category: 'maintenance' },
        'wrk_mnt_fire_alarm_annual': { name: 'ТО пожарной сигнализации', unit: 'объект', price: 3000, category: 'maintenance' },
        'wrk_mnt_fire_extinguish_annual': { name: 'ТО пожаротушения (годовое)', unit: 'объект', price: 5000, category: 'maintenance' },

        // === АВАРИЙНЫЕ РАБОТЫ ===
        'wrk_mnt_pipe_leak_small': { name: 'Устранение течи (малый Ø)', unit: 'шт', price: 300, category: 'maintenance' },
        'wrk_mnt_pipe_leak_large': { name: 'Устранение течи (большой Ø)', unit: 'шт', price: 800, category: 'maintenance' },
        'wrk_mnt_pipe_burst': { name: 'Замена повреждённого участка трубы', unit: 'м.п.', price: 200, category: 'maintenance' },
        'wrk_mnt_sewer_clean': { name: 'Прочистка канализации (трос)', unit: 'шт', price: 200, category: 'maintenance' },
        'wrk_mnt_sewer_hydro': { name: 'Прочистка канализации (гидрод.)', unit: 'м.п.', price: 30, category: 'maintenance' },
        'wrk_mnt_elec_short': { name: 'Устранение КЗ (поиск+ремонт)', unit: 'шт', price: 500, category: 'maintenance' },
        'wrk_mnt_elec_outlet_repair': { name: 'Замена розетки/выключателя', unit: 'шт', price: 50, category: 'maintenance' },
        'wrk_mnt_elec_breaker_replace': { name: 'Замена автомата в щите', unit: 'шт', price: 100, category: 'maintenance' },
        'wrk_mnt_roof_leak': { name: 'Ремонт протечки кровли', unit: 'м²', price: 100, category: 'maintenance' },
        'wrk_mnt_roof_patch': { name: 'Латка кровли (локальная)', unit: 'шт', price: 500, category: 'maintenance' },
        'wrk_mnt_glass_replace': { name: 'Замена стеклопакета', unit: 'шт', price: 500, category: 'maintenance' },

        // === ДИАГНОСТИКА ===
        'wrk_mnt_elec_phase': { name: 'Замер фаз (баланс)', unit: 'объект', price: 500, category: 'maintenance' },
        'wrk_mnt_air_test': { name: 'Аэродинамические испытания', unit: 'объект', price: 3000, category: 'maintenance' },
        'wrk_mnt_water_test': { name: 'Анализ воды', unit: 'проба', price: 500, category: 'maintenance' },
        'wrk_mnt_sound_test': { name: 'Замер уровня шума', unit: 'точка', price: 200, category: 'maintenance' },
        'wrk_mnt_radon_test': { name: 'Замер радона', unit: 'точка', price: 500, category: 'maintenance' },
        'wrk_mnt_air_quality': { name: 'Анализ качества воздуха', unit: 'точка', price: 300, category: 'maintenance' },

        // === КЛИНИНГ (профессиональный) ===
        'wrk_mnt_clean_post_constr': { name: 'Уборка после строительства', unit: 'м²', price: 20, category: 'maintenance' },
        'wrk_mnt_clean_post_repair': { name: 'Уборка после ремонта', unit: 'м²', price: 15, category: 'maintenance' },
        'wrk_mnt_clean_window_ext': { name: 'Мойка окон (наружная)', unit: 'м²', price: 30, category: 'maintenance' },
        'wrk_mnt_clean_gutter': { name: 'Чистка водостоков', unit: 'м.п.', price: 10, category: 'maintenance' },

        // === СЕЗОННЫЕ РАБОТЫ ===
        'wrk_mnt_winterize': { name: 'Консервация на зиму', unit: 'объект', price: 3000, category: 'maintenance' },
        'wrk_mnt_deseason': { name: 'Расконсервация (весна)', unit: 'объект', price: 2000, category: 'maintenance' },
        'wrk_mnt_gutter_clean_fall': { name: 'Чистка водостоков (осень)', unit: 'м.п.', price: 15, category: 'maintenance' },
        'wrk_mnt_lawn_mowing': { name: 'Кошение газона', unit: 'м²', price: 3, category: 'maintenance' },
        'wrk_mnt_tree_pruning': { name: 'Обрезка деревьев', unit: 'шт', price: 500, category: 'maintenance' },
        'wrk_mnt_tree_removal': { name: 'Удаление дерева (спиливание)', unit: 'шт', price: 2000, category: 'maintenance' },
        'wrk_mnt_snow_removal': { name: 'Уборка снега (территория)', unit: 'м²', price: 5, category: 'maintenance' },
        'wrk_mnt_anti_ice': { name: 'Обработка противогололёдным', unit: 'м²', price: 3, category: 'maintenance' }
    };
})();
