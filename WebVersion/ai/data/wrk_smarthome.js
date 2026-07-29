// === УМНЫЙ ДОМ РАСШИРЕННЫЙ — KNX, Zigbee, освещение, шторы, мультирум, панели (50 поз.) ===
(function () {
    window.AI_WRK_SMARTHOME = {
        // === ЦЕНТРАЛЬНОЕ УПРАВЛЕНИЕ === 1-6
        'wrk_sh_server_knx': { name: 'Сервер умного дома KNX', unit: 'шт', price: 120000, category: 'smarthome' },
        'wrk_sh_server_zigbee': { name: 'Хаб Zigbee/Z-Wave', unit: 'шт', price: 15000, category: 'smarthome' },
        'wrk_sh_server_crestron': { name: 'Процессор Crestron/Control4', unit: 'шт', price: 350000, category: 'smarthome' },
        'wrk_sh_touchpanel_7': { name: 'Настенная панель управления 7"', unit: 'шт', price: 55000, category: 'smarthome' },
        'wrk_sh_touchpanel_10': { name: 'Настенная панель управления 10"', unit: 'шт', price: 85000, category: 'smarthome' },
        'wrk_sh_ipad_mount': { name: 'Встроенный держатель iPad', unit: 'шт', price: 12000, category: 'smarthome' },
        // === ОСВЕЩЕНИЕ === 7-16
        'wrk_sh_switch_knx_1': { name: 'KNX выключатель 1-клавишный', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_switch_knx_2': { name: 'KNX выключатель 2-клавишный', unit: 'шт', price: 12000, category: 'smarthome' },
        'wrk_sh_switch_knx_4': { name: 'KNX выключатель 4-клавишный', unit: 'шт', price: 15000, category: 'smarthome' },
        'wrk_sh_dimmer_knx': { name: 'KNX диммер', unit: 'шт', price: 12000, category: 'smarthome' },
        'wrk_sh_dimmer_dali': { name: 'DALI драйвер/диммер', unit: 'шт', price: 5500, category: 'smarthome' },
        'wrk_sh_switch_zigbee': { name: 'Zigbee выключатель', unit: 'шт', price: 3500, category: 'smarthome' },
        'wrk_sh_led_rgbw': { name: 'LED RGBW контроллер', unit: 'шт', price: 3500, category: 'smarthome' },
        'wrk_sh_led_strip_prog': { name: 'LED лента программируемая', unit: 'м.п.', price: 1500, category: 'smarthome' },
        'wrk_sh_motion_sensor': { name: 'Датчик движения/присутствия (KNX)', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_light_scenario': { name: 'Программирование сценариев света', unit: 'сценарий', price: 3500, category: 'smarthome' },
        // === ШТОРЫ / ЖАЛЮЗИ === 17-22
        'wrk_sh_curtain_motor': { name: 'Электропривод штор', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_curtain_rail': { name: 'Карниз с электроприводом', unit: 'м.п.', price: 3500, category: 'smarthome' },
        'wrk_sh_blind_motor': { name: 'Электропривод жалюзи/рольштор', unit: 'шт', price: 5500, category: 'smarthome' },
        'wrk_sh_blind_knx': { name: 'KNX актуатор жалюзи', unit: 'шт', price: 5500, category: 'smarthome' },
        'wrk_sh_wind_sensor': { name: 'Датчик ветра (фасадные жалюзи)', unit: 'шт', price: 5500, category: 'smarthome' },
        // === КЛИМАТ === 23-28
        'wrk_sh_thermostat_knx': { name: 'KNX термостат', unit: 'шт', price: 12000, category: 'smarthome' },
        'wrk_sh_thermostat_zigbee': { name: 'Zigbee термостат', unit: 'шт', price: 3500, category: 'smarthome' },
        'wrk_sh_valve_actuator': { name: 'Сервопривод радиатора (KNX)', unit: 'шт', price: 5500, category: 'smarthome' },
        'wrk_sh_hvac_knx_gw': { name: 'KNX шлюз для кондиционера', unit: 'шт', price: 15000, category: 'smarthome' },
        'wrk_sh_weather_station': { name: 'Метеостанция (KNX)', unit: 'шт', price: 25000, category: 'smarthome' },
        // === МУЛЬТИРУМ / АУДИО-ВИДЕО === 29-36
        'wrk_sh_speaker_ceil': { name: 'Потолочный динамик (встроенный)', unit: 'шт', price: 5500, category: 'smarthome' },
        'wrk_sh_speaker_wall': { name: 'Настенный динамик', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_amplifier_zone': { name: 'Зонный усилитель', unit: 'зона', price: 25000, category: 'smarthome' },
        'wrk_sh_media_player': { name: 'Сетевой медиаплеер', unit: 'шт', price: 15000, category: 'smarthome' },
        'wrk_sh_tv_mount_fixed': { name: 'Монтаж ТВ (фиксированный)', unit: 'шт', price: 3500, category: 'smarthome' },
        'wrk_sh_tv_mount_motorized': { name: 'Моторизированный лифт ТВ', unit: 'шт', price: 55000, category: 'smarthome' },
        'wrk_sh_projector_mount': { name: 'Монтаж проектора (потолок)', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_screen_motorized': { name: 'Моторизированный экран', unit: 'шт', price: 25000, category: 'smarthome' },
        // === БЕЗОПАСНОСТЬ === 37-42
        'wrk_sh_lock_smart': { name: 'Умный замок (отпечаток/код)', unit: 'шт', price: 15000, category: 'smarthome' },
        'wrk_sh_doorbell_video': { name: 'Видеозвонок (умный)', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_camera_indoor': { name: 'Камера внутренняя (Wi-Fi)', unit: 'шт', price: 5500, category: 'smarthome' },
        'wrk_sh_camera_outdoor': { name: 'Камера наружная (Wi-Fi)', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_alarm_sensor': { name: 'Датчик открытия/вторжения', unit: 'шт', price: 1500, category: 'smarthome' },
        'wrk_sh_smoke_smart': { name: 'Умный извещатель дыма', unit: 'шт', price: 3500, category: 'smarthome' },
        // === СЕТЬ / ИНФРАСТРУКТУРА === 43-48
        'wrk_sh_wifi_ap': { name: 'Wi-Fi точка доступа (потолочная)', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_switch_poe': { name: 'Коммутатор PoE (умный дом)', unit: 'шт', price: 12000, category: 'smarthome' },
        'wrk_sh_knx_bus': { name: 'Кабель KNX (шина)', unit: 'м.п.', price: 55, category: 'smarthome' },
        'wrk_sh_knx_power': { name: 'Блок питания KNX', unit: 'шт', price: 8500, category: 'smarthome' },
        'wrk_sh_knx_usb_gw': { name: 'KNX/IP шлюз', unit: 'шт', price: 15000, category: 'smarthome' },
        'wrk_sh_programming': { name: 'Программирование умного дома', unit: 'час', price: 5500, category: 'smarthome' }
    };
})();
