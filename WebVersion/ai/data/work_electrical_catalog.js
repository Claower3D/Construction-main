// === КАТАЛОГ РАБОТ: ЭЛЕКТРОМОНТАЖНЫЕ РАБОТЫ (80 позиций) ===
(function () {
    window.AI_WORK_ELECTRICAL_CATALOG = {
        // Прокладка кабеля
        'work_elec_cable_wall': { name: 'Прокладка кабеля по стене (открыто)', unit: 'м.п.', price: 50, category: 'work_electrical' },
        'work_elec_cable_ceiling': { name: 'Прокладка кабеля по потолку', unit: 'м.п.', price: 60, category: 'work_electrical' },
        'work_elec_cable_shtrab': { name: 'Прокладка кабеля в штробе', unit: 'м.п.', price: 100, category: 'work_electrical' },
        'work_elec_cable_corrugation': { name: 'Прокладка кабеля в гофре', unit: 'м.п.', price: 80, category: 'work_electrical' },
        'work_elec_cable_tray': { name: 'Прокладка кабеля в лотке', unit: 'м.п.', price: 70, category: 'work_electrical' },
        'work_elec_cable_channel': { name: 'Прокладка кабеля в кабель-канале', unit: 'м.п.', price: 60, category: 'work_electrical' },
        'work_elec_cable_floor': { name: 'Прокладка кабеля в полу', unit: 'м.п.', price: 100, category: 'work_electrical' },
        'work_elec_cable_ground': { name: 'Прокладка кабеля в земле', unit: 'м.п.', price: 200, category: 'work_electrical' },
        // Штробление
        'work_elec_chase_brick': { name: 'Штробление кирпича (под кабель)', unit: 'м.п.', price: 150, category: 'work_electrical' },
        'work_elec_chase_concrete': { name: 'Штробление бетона (под кабель)', unit: 'м.п.', price: 250, category: 'work_electrical' },
        'work_elec_chase_gasblock': { name: 'Штробление газобетона (под кабель)', unit: 'м.п.', price: 100, category: 'work_electrical' },
        'work_elec_chase_plaster': { name: 'Штробление штукатурки (под кабель)', unit: 'м.п.', price: 80, category: 'work_electrical' },
        // Установка розеток / выключателей
        'work_elec_socket_install': { name: 'Установка розетки (скрытой)', unit: 'шт', price: 200, category: 'work_electrical' },
        'work_elec_socket_open': { name: 'Установка розетки (наружной)', unit: 'шт', price: 150, category: 'work_electrical' },
        'work_elec_socket_floor': { name: 'Установка розетки напольной', unit: 'шт', price: 300, category: 'work_electrical' },
        'work_elec_switch_install': { name: 'Установка выключателя (скрытого)', unit: 'шт', price: 200, category: 'work_electrical' },
        'work_elec_switch_open': { name: 'Установка выключателя (наружного)', unit: 'шт', price: 150, category: 'work_electrical' },
        'work_elec_dimmer_install': { name: 'Установка диммера', unit: 'шт', price: 250, category: 'work_electrical' },
        'work_elec_box_flush': { name: 'Установка подрозетника (скрытого)', unit: 'шт', price: 100, category: 'work_electrical' },
        'work_elec_box_drill_brick': { name: 'Высверливание подрозетника (кирпич)', unit: 'шт', price: 150, category: 'work_electrical' },
        'work_elec_box_drill_concrete': { name: 'Высверливание подрозетника (бетон)', unit: 'шт', price: 250, category: 'work_electrical' },
        // Щитовое оборудование
        'work_elec_panel_install': { name: 'Монтаж электрощита (встраиваемого)', unit: 'шт', price: 1500, category: 'work_electrical' },
        'work_elec_panel_wall': { name: 'Монтаж электрощита (навесного)', unit: 'шт', price: 1000, category: 'work_electrical' },
        'work_elec_panel_assemble': { name: 'Сборка электрощита (модульное оборудование)', unit: 'шт', price: 3000, category: 'work_electrical' },
        'work_elec_breaker_install': { name: 'Установка автомата / УЗО', unit: 'шт', price: 200, category: 'work_electrical' },
        'work_elec_meter_install': { name: 'Установка электросчётчика', unit: 'шт', price: 1000, category: 'work_electrical' },
        'work_elec_ups_install': { name: 'Установка ИБП (UPS)', unit: 'шт', price: 2000, category: 'work_electrical' },
        'work_elec_stab_install': { name: 'Установка стабилизатора напряжения', unit: 'шт', price: 1500, category: 'work_electrical' },
        // Освещение
        'work_elec_light_ceiling': { name: 'Установка потолочного светильника', unit: 'шт', price: 300, category: 'work_electrical' },
        'work_elec_light_wall': { name: 'Установка настенного бра', unit: 'шт', price: 250, category: 'work_electrical' },
        'work_elec_chandelier': { name: 'Монтаж люстры', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_chandelier_heavy': { name: 'Монтаж тяжёлой люстры (>5кг)', unit: 'шт', price: 1000, category: 'work_electrical' },
        'work_elec_spot_install': { name: 'Установка точечного светильника', unit: 'шт', price: 200, category: 'work_electrical' },
        'work_elec_led_strip': { name: 'Монтаж светодиодной ленты', unit: 'м.п.', price: 100, category: 'work_electrical' },
        'work_elec_led_profile': { name: 'Монтаж LED-профиля с лентой', unit: 'м.п.', price: 200, category: 'work_electrical' },
        'work_elec_track_light': { name: 'Монтаж трекового светильника', unit: 'шт', price: 300, category: 'work_electrical' },
        'work_elec_track_rail': { name: 'Монтаж трековой шины', unit: 'м.п.', price: 300, category: 'work_electrical' },
        'work_elec_outdoor_light': { name: 'Установка уличного светильника', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_garden_light': { name: 'Установка ландшафтного светильника', unit: 'шт', price: 300, category: 'work_electrical' },
        // Слаботочные системы
        'work_elec_internet_point': { name: 'Установка интернет-розетки', unit: 'шт', price: 300, category: 'work_electrical' },
        'work_elec_tv_point': { name: 'Установка ТВ-розетки', unit: 'шт', price: 300, category: 'work_electrical' },
        'work_elec_phone_point': { name: 'Установка телефонной розетки', unit: 'шт', price: 200, category: 'work_electrical' },
        'work_elec_lan_patch_panel': { name: 'Монтаж патч-панели', unit: 'шт', price: 1500, category: 'work_electrical' },
        'work_elec_intercom_install': { name: 'Установка домофона (видео)', unit: 'шт', price: 3000, category: 'work_electrical' },
        'work_elec_camera_install': { name: 'Установка камеры видеонаблюдения', unit: 'шт', price: 1000, category: 'work_electrical' },
        'work_elec_alarm_point': { name: 'Установка датчика охранной сигнализации', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_alarm_panel': { name: 'Монтаж пульта охранной сигнализации', unit: 'шт', price: 3000, category: 'work_electrical' },
        // Заземление / молниезащита
        'work_elec_ground_rod': { name: 'Установка заземляющего электрода', unit: 'шт', price: 1000, category: 'work_electrical' },
        'work_elec_ground_loop': { name: 'Устройство контура заземления', unit: 'компл.', price: 5000, category: 'work_electrical' },
        'work_elec_lightning_rod': { name: 'Установка молниеотвода', unit: 'шт', price: 5000, category: 'work_electrical' },
        'work_elec_lightning_wire': { name: 'Прокладка токоотвода', unit: 'м.п.', price: 100, category: 'work_electrical' },
        // Тёплый пол электрический
        'work_elec_heatfloor_cable': { name: 'Монтаж кабельного тёплого пола', unit: 'м²', price: 300, category: 'work_electrical' },
        'work_elec_heatfloor_mat': { name: 'Монтаж матового тёплого пола', unit: 'м²', price: 250, category: 'work_electrical' },
        'work_elec_heatfloor_film': { name: 'Монтаж плёночного тёплого пола', unit: 'м²', price: 200, category: 'work_electrical' },
        'work_elec_thermostat_install': { name: 'Установка терморегулятора тёплого пола', unit: 'шт', price: 500, category: 'work_electrical' },
        // Подключение техники
        'work_elec_stove_connect': { name: 'Подключение электроплиты', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_boiler_connect': { name: 'Подключение бойлера', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_wash_connect': { name: 'Подключение стиральной машины (электрика)', unit: 'шт', price: 300, category: 'work_electrical' },
        'work_elec_conditioner_connect': { name: 'Подключение кондиционера (электрика)', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_generator_connect': { name: 'Подключение генератора с АВР', unit: 'шт', price: 5000, category: 'work_electrical' },
        // Проектирование / испытания
        'work_elec_project': { name: 'Проект электроснабжения (квартира)', unit: 'шт', price: 10000, category: 'work_electrical' },
        'work_elec_project_house': { name: 'Проект электроснабжения (дом)', unit: 'шт', price: 20000, category: 'work_electrical' },
        'work_elec_testing': { name: 'Электроизмерения и протоколы', unit: 'компл.', price: 5000, category: 'work_electrical' },
        // Демонтаж
        'work_elec_demo_wiring': { name: 'Демонтаж старой проводки', unit: 'м.п.', price: 30, category: 'work_electrical' },
        'work_elec_demo_panel': { name: 'Демонтаж электрощита', unit: 'шт', price: 500, category: 'work_electrical' },
        'work_elec_demo_socket': { name: 'Демонтаж розетки / выключателя', unit: 'шт', price: 50, category: 'work_electrical' },
        'work_elec_demo_light': { name: 'Демонтаж светильника / люстры', unit: 'шт', price: 100, category: 'work_electrical' }
    };
})();
