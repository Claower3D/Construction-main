// === ФАЗА 3: СТРОИТЕЛЬНЫЕ ЛЕСА, СПЕЦТЕХНИКА, ВРЕМЕННЫЕ СООРУЖЕНИЯ, МЕХАНИЗАЦИЯ (100 поз.) ===
(function () {
    window.AI_WRK_MECHANIZATION = {
        // === СТРОИТЕЛЬНЫЕ ЛЕСА ===
        'wrk_mech_scaffold_frame_2': { name: 'Леса рамные до 2м', unit: 'м²', price: 10, category: 'mechanization' },
        'wrk_mech_scaffold_frame_6': { name: 'Леса рамные до 6м', unit: 'м²', price: 15, category: 'mechanization' },
        'wrk_mech_scaffold_frame_12': { name: 'Леса рамные до 12м', unit: 'м²', price: 20, category: 'mechanization' },
        'wrk_mech_scaffold_frame_20': { name: 'Леса рамные до 20м', unit: 'м²', price: 25, category: 'mechanization' },
        'wrk_mech_scaffold_frame_40': { name: 'Леса рамные до 40м', unit: 'м²', price: 35, category: 'mechanization' },
        'wrk_mech_scaffold_clamp_12': { name: 'Леса хомутовые до 12м', unit: 'м²', price: 25, category: 'mechanization' },
        'wrk_mech_scaffold_clamp_30': { name: 'Леса хомутовые до 30м', unit: 'м²', price: 35, category: 'mechanization' },
        'wrk_mech_scaffold_clamp_60': { name: 'Леса хомутовые до 60м', unit: 'м²', price: 50, category: 'mechanization' },
        'wrk_mech_scaffold_tower_4': { name: 'Вышка-тура до 4м', unit: 'смена', price: 100, category: 'mechanization' },
        'wrk_mech_scaffold_tower_8': { name: 'Вышка-тура до 8м', unit: 'смена', price: 150, category: 'mechanization' },
        'wrk_mech_scaffold_tower_12': { name: 'Вышка-тура до 12м', unit: 'смена', price: 200, category: 'mechanization' },
        'wrk_mech_scaffold_suspended': { name: 'Подвесные люльки', unit: 'м.п.', price: 50, category: 'mechanization' },
        'wrk_mech_scaffold_install': { name: 'Монтаж/демонтаж лесов', unit: 'м²', price: 10, category: 'mechanization' },
        'wrk_mech_scaffold_net': { name: 'Защитная сетка на леса', unit: 'м²', price: 5, category: 'mechanization' },

        // === ПОДЪЁМНАЯ ТЕХНИКА ===
        'wrk_mech_crane_auto_25': { name: 'Автокран 25т (аренда)', unit: 'смена', price: 10000, category: 'mechanization' },
        'wrk_mech_crane_auto_50': { name: 'Автокран 50т (аренда)', unit: 'смена', price: 15000, category: 'mechanization' },
        'wrk_mech_crane_auto_100': { name: 'Автокран 100т (аренда)', unit: 'смена', price: 25000, category: 'mechanization' },
        'wrk_mech_crane_auto_200': { name: 'Автокран 200т (аренда)', unit: 'смена', price: 50000, category: 'mechanization' },
        'wrk_mech_crane_tower_63': { name: 'Башенный кран КБ-63 (аренда)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_crane_tower_160': { name: 'Башенный кран КБ-160 (аренда)', unit: 'смена', price: 8000, category: 'mechanization' },
        'wrk_mech_crane_tower_405': { name: 'Башенный кран КБ-405 (аренда)', unit: 'смена', price: 12000, category: 'mechanization' },
        'wrk_mech_lift_scissor_6': { name: 'Ножничный подъёмник 6м', unit: 'смена', price: 2000, category: 'mechanization' },
        'wrk_mech_lift_scissor_12': { name: 'Ножничный подъёмник 12м', unit: 'смена', price: 3000, category: 'mechanization' },
        'wrk_mech_lift_boom_15': { name: 'Коленчатый подъёмник 15м', unit: 'смена', price: 4000, category: 'mechanization' },
        'wrk_mech_lift_boom_25': { name: 'Коленчатый подъёмник 25м', unit: 'смена', price: 6000, category: 'mechanization' },
        'wrk_mech_lift_boom_35': { name: 'Коленчатый подъёмник 35м', unit: 'смена', price: 10000, category: 'mechanization' },
        'wrk_mech_telehandler_7': { name: 'Телескопический погрузчик 7м', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_telehandler_12': { name: 'Телескопический погрузчик 12м', unit: 'смена', price: 7000, category: 'mechanization' },

        // === ЗЕМЛЕРОЙНАЯ ТЕХНИКА ===
        'wrk_mech_excavator_mini': { name: 'Мини-экскаватор (аренда)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_excavator_14t': { name: 'Экскаватор 14т (аренда)', unit: 'смена', price: 8000, category: 'mechanization' },
        'wrk_mech_excavator_20t': { name: 'Экскаватор 20т (аренда)', unit: 'смена', price: 10000, category: 'mechanization' },
        'wrk_mech_excavator_30t': { name: 'Экскаватор 30т (аренда)', unit: 'смена', price: 15000, category: 'mechanization' },
        'wrk_mech_bulldozer_d5': { name: 'Бульдозер D5 (аренда)', unit: 'смена', price: 10000, category: 'mechanization' },
        'wrk_mech_bulldozer_d9': { name: 'Бульдозер D9 (аренда)', unit: 'смена', price: 20000, category: 'mechanization' },
        'wrk_mech_loader_3t': { name: 'Фронтальный погрузчик 3т', unit: 'смена', price: 6000, category: 'mechanization' },
        'wrk_mech_loader_5t': { name: 'Фронтальный погрузчик 5т', unit: 'смена', price: 8000, category: 'mechanization' },
        'wrk_mech_bobcat': { name: 'Мини-погрузчик (Bobcat)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_grader': { name: 'Грейдер (аренда)', unit: 'смена', price: 10000, category: 'mechanization' },
        'wrk_mech_roller_5t': { name: 'Каток 5т (аренда)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_roller_10t': { name: 'Каток 10т (аренда)', unit: 'смена', price: 8000, category: 'mechanization' },

        // === ТРАНСПОРТ ===
        'wrk_mech_dump_10m3': { name: 'Самосвал 10м³ (аренда)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_dump_20m3': { name: 'Самосвал 20м³ (аренда)', unit: 'смена', price: 7000, category: 'mechanization' },
        'wrk_mech_dump_30m3': { name: 'Самосвал 30м³ (аренда)', unit: 'смена', price: 10000, category: 'mechanization' },
        'wrk_mech_truck_10t': { name: 'Бортовой грузовик 10т', unit: 'рейс', price: 3000, category: 'mechanization' },
        'wrk_mech_truck_20t': { name: 'Бортовой грузовик 20т', unit: 'рейс', price: 5000, category: 'mechanization' },
        'wrk_mech_lowbed': { name: 'Тралл (перевозка техники)', unit: 'рейс', price: 10000, category: 'mechanization' },
        'wrk_mech_manipulator_5t': { name: 'Манипулятор 5т (аренда)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_manipulator_10t': { name: 'Манипулятор 10т (аренда)', unit: 'смена', price: 8000, category: 'mechanization' },

        // === ЭЛЕКТРОСНАБЖЕНИЕ СТРОЙПЛОЩАДКИ ===
        'wrk_mech_gen_30kva': { name: 'Генератор 30кВА (аренда)', unit: 'смена', price: 2000, category: 'mechanization' },
        'wrk_mech_gen_60kva': { name: 'Генератор 60кВА (аренда)', unit: 'смена', price: 3000, category: 'mechanization' },
        'wrk_mech_gen_100kva': { name: 'Генератор 100кВА (аренда)', unit: 'смена', price: 5000, category: 'mechanization' },
        'wrk_mech_gen_200kva': { name: 'Генератор 200кВА (аренда)', unit: 'смена', price: 8000, category: 'mechanization' },
        'wrk_mech_gen_500kva': { name: 'Генератор 500кВА (аренда)', unit: 'смена', price: 15000, category: 'mechanization' },
        'wrk_mech_temp_power': { name: 'Времянка электроснабжения', unit: 'объект', price: 10000, category: 'mechanization' },
        'wrk_mech_temp_water': { name: 'Времянка водоснабжения', unit: 'объект', price: 5000, category: 'mechanization' },
        'wrk_mech_temp_fence': { name: 'Временное ограждение стройки', unit: 'м.п.', price: 50, category: 'mechanization' },
        'wrk_mech_temp_road': { name: 'Временная стройдорога', unit: 'м²', price: 30, category: 'mechanization' },
        'wrk_mech_mob_demob': { name: 'Мобилизация/демобилизация', unit: 'объект', price: 20000, category: 'mechanization' },
        'wrk_mech_geodesy': { name: 'Геодезическая разбивка', unit: 'объект', price: 5000, category: 'mechanization' },
    };
})();
