// === ХОЛОДИЛЬНОЕ ОБОРУДОВАНИЕ — камеры, рефрижерация, ледовые арены (48 поз.) ===
(function () {
    window.AI_WRK_REFRIGERATION = {
        // === ХОЛОДИЛЬНЫЕ КАМЕРЫ === 1-10
        'wrk_ref_panel_80': { name: 'Сэндвич-панель 80мм (0..+5°С)', unit: 'м²', price: 2500, category: 'refrigeration' },
        'wrk_ref_panel_100': { name: 'Сэндвич-панель 100мм (-18°С)', unit: 'м²', price: 3500, category: 'refrigeration' },
        'wrk_ref_panel_150': { name: 'Сэндвич-панель 150мм (-25°С)', unit: 'м²', price: 5500, category: 'refrigeration' },
        'wrk_ref_panel_200': { name: 'Сэндвич-панель 200мм (-40°С)', unit: 'м²', price: 8500, category: 'refrigeration' },
        'wrk_ref_door_sliding': { name: 'Дверь откатная (холодильная)', unit: 'шт', price: 55000, category: 'refrigeration' },
        'wrk_ref_door_hinged': { name: 'Дверь распашная (холодильная)', unit: 'шт', price: 35000, category: 'refrigeration' },
        'wrk_ref_door_strip': { name: 'ПВХ-завеса (штора)', unit: 'м²', price: 1500, category: 'refrigeration' },
        'wrk_ref_door_rapid': { name: 'Скоростные ворота (холод)', unit: 'шт', price: 250000, category: 'refrigeration' },
        'wrk_ref_floor_heater': { name: 'Электрообогрев пола (анти-мороз)', unit: 'м²', price: 1200, category: 'refrigeration' },
        'wrk_ref_vapor_barrier': { name: 'Пароизоляция (холод. камера)', unit: 'м²', price: 250, category: 'refrigeration' },
        // === ХОЛОДИЛЬНОЕ ОБОРУДОВАНИЕ === 11-20
        'wrk_ref_unit_monoblock_5': { name: 'Моноблок 5кВт (+5°С)', unit: 'шт', price: 55000, category: 'refrigeration' },
        'wrk_ref_unit_monoblock_10': { name: 'Моноблок 10кВт (+5°С)', unit: 'шт', price: 85000, category: 'refrigeration' },
        'wrk_ref_unit_split_10': { name: 'Сплит-система 10кВт (+5°С)', unit: 'компл.', price: 120000, category: 'refrigeration' },
        'wrk_ref_unit_split_20': { name: 'Сплит-система 20кВт (+5°С)', unit: 'компл.', price: 250000, category: 'refrigeration' },
        'wrk_ref_unit_freeze_10': { name: 'Агрегат морозильный 10кВт', unit: 'шт', price: 250000, category: 'refrigeration' },
        'wrk_ref_unit_freeze_30': { name: 'Агрегат морозильный 30кВт', unit: 'шт', price: 550000, category: 'refrigeration' },
        'wrk_ref_condenser_remote': { name: 'Выносной конденсатор', unit: 'шт', price: 120000, category: 'refrigeration' },
        'wrk_ref_evaporator': { name: 'Воздухоохладитель', unit: 'шт', price: 55000, category: 'refrigeration' },
        'wrk_ref_compressor_rack': { name: 'Компрессорный агрегат (стойка)', unit: 'шт', price: 550000, category: 'refrigeration' },
        'wrk_ref_pipe_cu_freon': { name: 'Фреоновая магистраль (медь)', unit: 'м.п.', price: 850, category: 'refrigeration' },
        // === ПРОМЫШЛЕННЫЙ ХОЛОД === 21-28
        'wrk_ref_chiller_air_50': { name: 'Чиллер воздушный 50кВт', unit: 'шт', price: 550000, category: 'refrigeration' },
        'wrk_ref_chiller_air_200': { name: 'Чиллер воздушный 200кВт', unit: 'шт', price: 2500000, category: 'refrigeration' },
        'wrk_ref_chiller_water_200': { name: 'Чиллер водяной 200кВт', unit: 'шт', price: 2500000, category: 'refrigeration' },
        'wrk_ref_chiller_water_500': { name: 'Чиллер водяной 500кВт', unit: 'шт', price: 5500000, category: 'refrigeration' },
        'wrk_ref_glycol_pipe': { name: 'Трубопровод гликоля', unit: 'м.п.', price: 1200, category: 'refrigeration' },
        'wrk_ref_pump_station': { name: 'Насосная станция гликоля', unit: 'компл.', price: 250000, category: 'refrigeration' },
        'wrk_ref_cooling_tower': { name: 'Градирня', unit: 'шт', price: 550000, category: 'refrigeration' },
        // === ЛЕДОВЫЕ АРЕНЫ === 29-36
        'wrk_ref_ice_pipe_pe': { name: 'Трубная система ледового поля', unit: 'м²', price: 2500, category: 'refrigeration' },
        'wrk_ref_ice_slab': { name: 'Основание ледового поля (бетон)', unit: 'м²', price: 2500, category: 'refrigeration' },
        'wrk_ref_ice_insul': { name: 'Теплоизоляция ледового поля', unit: 'м²', price: 850, category: 'refrigeration' },
        'wrk_ref_ice_barrier': { name: 'Бортик ледовой арены', unit: 'м.п.', price: 8500, category: 'refrigeration' },
        'wrk_ref_ice_resurfacer': { name: 'Ледозаливочная машина', unit: 'шт', price: 8500000, category: 'refrigeration' },
        'wrk_ref_ice_dehumid': { name: 'Осушитель воздуха (арена)', unit: 'шт', price: 250000, category: 'refrigeration' },
        'wrk_ref_ice_chiller_300': { name: 'Холодильная машина 300кВт (лёд)', unit: 'шт', price: 5500000, category: 'refrigeration' },
        'wrk_ref_ice_zamboni_area': { name: 'Площадка Zamboni', unit: 'компл.', price: 550000, category: 'refrigeration' },
        // === АВТОМАТИКА === 37-42
        'wrk_ref_controller': { name: 'Контроллер холодильной камеры', unit: 'шт', price: 8500, category: 'refrigeration' },
        'wrk_ref_sensor_temp': { name: 'Датчик температуры (щуп)', unit: 'шт', price: 850, category: 'refrigeration' },
        'wrk_ref_sensor_defrost': { name: 'Датчик оттайки', unit: 'шт', price: 550, category: 'refrigeration' },
        'wrk_ref_alarm': { name: 'Система аварийной сигнализации', unit: 'компл.', price: 12000, category: 'refrigeration' },
        'wrk_ref_monitoring': { name: 'Мониторинг температуры (облако)', unit: 'камера', price: 5500, category: 'refrigeration' },
        'wrk_ref_control_panel': { name: 'Шкаф управления (холод)', unit: 'шт', price: 55000, category: 'refrigeration' },
        // === ДОПЫ === 43-48
        'wrk_ref_shelving': { name: 'Стеллажи для хол. камеры', unit: 'м.п.', price: 3500, category: 'refrigeration' },
        'wrk_ref_dock_shelter': { name: 'Докшелтер (герметизатор)', unit: 'шт', price: 120000, category: 'refrigeration' },
        'wrk_ref_dock_leveler': { name: 'Перегрузочная площадка', unit: 'шт', price: 250000, category: 'refrigeration' },
        'wrk_ref_vacuum_test': { name: 'Вакуумирование системы', unit: 'компл.', price: 5500, category: 'refrigeration' },
        'wrk_ref_commissioning': { name: 'ПНР холодильной установки', unit: 'компл.', price: 55000, category: 'refrigeration' }
    };
})();
