// === УМНЫЙ ДОМ (40 позиций) ===
(function () {
    window.AI_MAT_SMART_HOME = {
        // Освещение умное
        'smart_bulb_e27_rgb': { name: 'Лампа умная E27 RGB Wi-Fi', unit: 'шт', price: 2500, category: 'smart_home' },
        'smart_bulb_gu10': { name: 'Лампа умная GU10 Wi-Fi', unit: 'шт', price: 2000, category: 'smart_home' },
        'smart_strip_5m': { name: 'LED лента умная RGBW 5м (Wi-Fi)', unit: 'шт', price: 5000, category: 'smart_home' },
        'smart_switch_1g': { name: 'Выключатель умный 1-клавишный Wi-Fi', unit: 'шт', price: 3000, category: 'smart_home' },
        'smart_switch_2g': { name: 'Выключатель умный 2-клавишный Wi-Fi', unit: 'шт', price: 4000, category: 'smart_home' },
        'smart_dimmer': { name: 'Диммер умный Wi-Fi', unit: 'шт', price: 4500, category: 'smart_home' },

        // Розетки умные
        'smart_socket_wifi': { name: 'Розетка умная Wi-Fi (встраиваемая)', unit: 'шт', price: 3500, category: 'smart_home' },
        'smart_socket_plug': { name: 'Розетка умная Wi-Fi (адаптер)', unit: 'шт', price: 2000, category: 'smart_home' },
        'smart_socket_outdoor': { name: 'Розетка умная уличная IP55', unit: 'шт', price: 3500, category: 'smart_home' },

        // Датчики
        'smart_sensor_motion': { name: 'Датчик движения умный (Zigbee)', unit: 'шт', price: 2000, category: 'smart_home' },
        'smart_sensor_door': { name: 'Датчик открытия двери (Zigbee)', unit: 'шт', price: 1500, category: 'smart_home' },
        'smart_sensor_temp': { name: 'Датчик температуры/влажности (Zigbee)', unit: 'шт', price: 1800, category: 'smart_home' },
        'smart_sensor_leak': { name: 'Датчик протечки воды (Wi-Fi)', unit: 'шт', price: 2500, category: 'smart_home' },
        'smart_sensor_smoke': { name: 'Датчик дыма умный (Wi-Fi)', unit: 'шт', price: 3000, category: 'smart_home' },
        'smart_sensor_gas': { name: 'Датчик газа умный (Wi-Fi)', unit: 'шт', price: 3500, category: 'smart_home' },
        'smart_sensor_co': { name: 'Датчик CO (угарный газ) умный', unit: 'шт', price: 3000, category: 'smart_home' },

        // Хабы / контроллеры
        'smart_hub_zigbee': { name: 'Хаб умного дома (Zigbee + Wi-Fi)', unit: 'шт', price: 5000, category: 'smart_home' },
        'smart_hub_premium': { name: 'Контроллер умного дома (премиум)', unit: 'шт', price: 15000, category: 'smart_home' },

        // Замки умные
        'smart_lock_code': { name: 'Замок умный кодовый (Wi-Fi)', unit: 'шт', price: 25000, category: 'smart_home' },
        'smart_lock_fingerprint': { name: 'Замок умный с отпечатком пальца', unit: 'шт', price: 35000, category: 'smart_home' },
        'smart_lock_cylinder': { name: 'Умный цилиндр (для существующего замка)', unit: 'шт', price: 15000, category: 'smart_home' },

        // Термостаты умные
        'smart_thermostat_batt': { name: 'Термостат умный (батарейка, Wi-Fi)', unit: 'шт', price: 8000, category: 'smart_home' },
        'smart_thermostat_wired': { name: 'Термостат умный (проводной)', unit: 'шт', price: 10000, category: 'smart_home' },
        'smart_trv_radiator': { name: 'Терморегулятор умный для радиатора', unit: 'шт', price: 6000, category: 'smart_home' },

        // Шторы / карнизы умные
        'smart_curtain_motor': { name: 'Мотор для штор (Wi-Fi, до 4м)', unit: 'шт', price: 12000, category: 'smart_home' },
        'smart_curtain_track_3m': { name: 'Карниз электрический (3м)', unit: 'шт', price: 8000, category: 'smart_home' },
        'smart_roller_blind': { name: 'Рулонная штора с электроприводом (1.5м)', unit: 'шт', price: 15000, category: 'smart_home' },

        // Управление водой
        'smart_valve_water': { name: 'Водяной кран с электроприводом 1/2"', unit: 'шт', price: 5000, category: 'smart_home' },
        'smart_valve_gas': { name: 'Газовый кран с электроприводом', unit: 'шт', price: 8000, category: 'smart_home' },
        'smart_leak_system': { name: 'Система защиты от протечек (2 крана + 3 датчика)', unit: 'комплект', price: 15000, category: 'smart_home' },

        // Мультимедиа
        'smart_speaker': { name: 'Умная колонка (голосовой помощник)', unit: 'шт', price: 8000, category: 'smart_home' },
        'smart_ir_blaster': { name: 'ИК пульт умный (для кондиционера/ТВ)', unit: 'шт', price: 2000, category: 'smart_home' },

        // Камеры умные
        'smart_camera_indoor': { name: 'Камера умная внутренняя (Wi-Fi 2МП)', unit: 'шт', price: 5000, category: 'smart_home' },
        'smart_camera_outdoor': { name: 'Камера умная уличная (Wi-Fi 4МП)', unit: 'шт', price: 10000, category: 'smart_home' },
        'smart_doorbell': { name: 'Видеозвонок умный (Wi-Fi)', unit: 'шт', price: 12000, category: 'smart_home' },

        // Автоматика ворот
        'gate_motor_sliding': { name: 'Привод для откатных ворот (до 600кг)', unit: 'шт', price: 30000, category: 'smart_home' },
        'gate_motor_swing': { name: 'Привод для распашных ворот (2 створки)', unit: 'комплект', price: 35000, category: 'smart_home' },
        'gate_remote_set': { name: 'Пульт для ворот (2шт)', unit: 'комплект', price: 2000, category: 'smart_home' },

        // Автоматический полив
        'smart_irrigation_controller': { name: 'Контроллер автополива (6 зон)', unit: 'шт', price: 8000, category: 'smart_home' },
        'smart_soil_sensor': { name: 'Датчик влажности почвы', unit: 'шт', price: 2000, category: 'smart_home' }
    };
})();
