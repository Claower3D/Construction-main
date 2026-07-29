// === ФАЗА 3: АВТОМАТИЗАЦИЯ, УМНЫЙ ДОМ, БЕЗОПАСНОСТЬ, ТЕЛЕКОМ (200 поз.) ===
(function () {
    // === УМНЫЙ ДОМ (детально) ===
    window.AI_WRK_SMART_HOME = {
        // Системы управления
        'wrk_sh_controller_hub': { name: 'Контроллер умного дома (установка)', unit: 'шт', price: 5000, category: 'smart_home' },
        'wrk_sh_controller_knx': { name: 'KNX контроллер', unit: 'шт', price: 10000, category: 'smart_home' },
        'wrk_sh_panel_touch_7': { name: 'Сенсорная панель 7"', unit: 'шт', price: 5000, category: 'smart_home' },
        'wrk_sh_panel_touch_10': { name: 'Сенсорная панель 10"', unit: 'шт', price: 8000, category: 'smart_home' },
        // Освещение
        'wrk_sh_light_dimmer': { name: 'Диммер умный (KNX/Z-Wave)', unit: 'шт', price: 500, category: 'smart_home' },
        'wrk_sh_light_switch_1': { name: 'Выключатель умный 1-кан.', unit: 'шт', price: 300, category: 'smart_home' },
        'wrk_sh_light_switch_2': { name: 'Выключатель умный 2-кан.', unit: 'шт', price: 400, category: 'smart_home' },
        'wrk_sh_light_switch_4': { name: 'Выключатель умный 4-кан.', unit: 'шт', price: 600, category: 'smart_home' },
        'wrk_sh_light_scene': { name: 'Настройка световых сценариев', unit: 'шт', price: 500, category: 'smart_home' },
        'wrk_sh_light_rgb_strip': { name: 'RGB LED-лента управляемая', unit: 'м.п.', price: 150, category: 'smart_home' },
        'wrk_sh_light_rgbw_ctrl': { name: 'RGBW контроллер', unit: 'шт', price: 500, category: 'smart_home' },
        // Шторы/жалюзи
        'wrk_sh_curtain_motor': { name: 'Электрокарниз', unit: 'шт', price: 3000, category: 'smart_home' },
        'wrk_sh_blind_motor': { name: 'Электропривод жалюзи', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_roller_motor': { name: 'Электропривод рольставни', unit: 'шт', price: 2500, category: 'smart_home' },
        // Климат
        'wrk_sh_thermostat': { name: 'Термостат умный (Wi-Fi)', unit: 'шт', price: 1000, category: 'smart_home' },
        'wrk_sh_thermostat_knx': { name: 'KNX-термостат', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_valve_zone': { name: 'Зональный клапан (умный)', unit: 'шт', price: 500, category: 'smart_home' },
        'wrk_sh_sensor_temp': { name: 'Датчик температуры (умный)', unit: 'шт', price: 200, category: 'smart_home' },
        'wrk_sh_sensor_humid': { name: 'Датчик влажности (умный)', unit: 'шт', price: 200, category: 'smart_home' },
        'wrk_sh_sensor_co2': { name: 'Датчик CO₂', unit: 'шт', price: 500, category: 'smart_home' },
        'wrk_sh_sensor_air': { name: 'Датчик качества воздуха', unit: 'шт', price: 500, category: 'smart_home' },
        // Мультимедиа
        'wrk_sh_speaker_ceiling': { name: 'Потолочная АС (встроенная)', unit: 'шт', price: 1000, category: 'smart_home' },
        'wrk_sh_speaker_wall': { name: 'Настенная АС (встроенная)', unit: 'шт', price: 800, category: 'smart_home' },
        'wrk_sh_speaker_sub': { name: 'Сабвуфер (встроенный)', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_amplifier': { name: 'Мультирумный усилитель', unit: 'шт', price: 5000, category: 'smart_home' },
        'wrk_sh_media_server': { name: 'Медиа-сервер (установка)', unit: 'шт', price: 5000, category: 'smart_home' },
        'wrk_sh_projector_mount': { name: 'Монтаж проектора', unit: 'шт', price: 1000, category: 'smart_home' },
        'wrk_sh_projector_screen': { name: 'Экран проектора (монтаж)', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_tv_mount': { name: 'Монтаж ТВ на стену', unit: 'шт', price: 500, category: 'smart_home' },
        'wrk_sh_tv_mount_motorized': { name: 'Моторизованный кронштейн ТВ', unit: 'шт', price: 3000, category: 'smart_home' },
        'wrk_sh_hdmi_cable_wall': { name: 'HDMI кабель в стене', unit: 'м.п.', price: 50, category: 'smart_home' },
        // Безопасность (умный дом)
        'wrk_sh_lock_smart': { name: 'Умный замок (установка)', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_lock_fingerprint': { name: 'Замок с отпечатком пальца', unit: 'шт', price: 3000, category: 'smart_home' },
        'wrk_sh_doorbell_video': { name: 'Видеодомофон умный', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_sensor_door': { name: 'Датчик открытия двери/окна', unit: 'шт', price: 100, category: 'smart_home' },
        'wrk_sh_sensor_motion': { name: 'Датчик движения (умный)', unit: 'шт', price: 200, category: 'smart_home' },
        'wrk_sh_sensor_smoke': { name: 'Датчик дыма (умный)', unit: 'шт', price: 300, category: 'smart_home' },
        'wrk_sh_sensor_flood': { name: 'Датчик протечки (умный)', unit: 'шт', price: 200, category: 'smart_home' },
        'wrk_sh_sensor_gas': { name: 'Датчик утечки газа (умный)', unit: 'шт', price: 300, category: 'smart_home' },
        'wrk_sh_siren': { name: 'Умная сирена', unit: 'шт', price: 300, category: 'smart_home' },
        // KNX шина
        'wrk_sh_knx_cable': { name: 'KNX-кабель (прокладка)', unit: 'м.п.', price: 20, category: 'smart_home' },
        'wrk_sh_knx_power_supply': { name: 'KNX блок питания', unit: 'шт', price: 2000, category: 'smart_home' },
        'wrk_sh_knx_actuator_8': { name: 'KNX актуатор 8-канальный', unit: 'шт', price: 3000, category: 'smart_home' },
        'wrk_sh_knx_dimmer_4': { name: 'KNX диммер 4-канальный', unit: 'шт', price: 4000, category: 'smart_home' },
        'wrk_sh_knx_programming': { name: 'Программирование KNX', unit: 'точка', price: 200, category: 'smart_home' },
        // Розетки умные
        'wrk_sh_socket_smart': { name: 'Умная розетка (Wi-Fi)', unit: 'шт', price: 250, category: 'smart_home' },
        'wrk_sh_socket_meter': { name: 'Умная розетка с энергомонитором', unit: 'шт', price: 400, category: 'smart_home' }
    };

    // === ВИДЕОНАБЛЮДЕНИЕ (детально) ===
    window.AI_WRK_CCTV = {
        'wrk_cctv_cam_dome_2mp': { name: 'IP-камера купольная 2МП', unit: 'шт', price: 1000, category: 'cctv' },
        'wrk_cctv_cam_dome_4mp': { name: 'IP-камера купольная 4МП', unit: 'шт', price: 1500, category: 'cctv' },
        'wrk_cctv_cam_dome_8mp': { name: 'IP-камера купольная 8МП', unit: 'шт', price: 2500, category: 'cctv' },
        'wrk_cctv_cam_bullet_2mp': { name: 'IP-камера цилиндр. 2МП', unit: 'шт', price: 1000, category: 'cctv' },
        'wrk_cctv_cam_bullet_4mp': { name: 'IP-камера цилиндр. 4МП', unit: 'шт', price: 1500, category: 'cctv' },
        'wrk_cctv_cam_bullet_8mp': { name: 'IP-камера цилиндр. 8МП', unit: 'шт', price: 2500, category: 'cctv' },
        'wrk_cctv_cam_ptz_2mp': { name: 'PTZ-камера 2МП', unit: 'шт', price: 5000, category: 'cctv' },
        'wrk_cctv_cam_ptz_4mp': { name: 'PTZ-камера 4МП', unit: 'шт', price: 8000, category: 'cctv' },
        'wrk_cctv_cam_fisheye': { name: 'Камера fisheye 360°', unit: 'шт', price: 3000, category: 'cctv' },
        'wrk_cctv_cam_anpr': { name: 'Камера распознавания номеров (ANPR)', unit: 'шт', price: 10000, category: 'cctv' },
        'wrk_cctv_nvr_4ch': { name: 'NVR видеорег. 4 канала', unit: 'шт', price: 3000, category: 'cctv' },
        'wrk_cctv_nvr_8ch': { name: 'NVR видеорег. 8 каналов', unit: 'шт', price: 5000, category: 'cctv' },
        'wrk_cctv_nvr_16ch': { name: 'NVR видеорег. 16 каналов', unit: 'шт', price: 8000, category: 'cctv' },
        'wrk_cctv_nvr_32ch': { name: 'NVR видеорег. 32 канала', unit: 'шт', price: 12000, category: 'cctv' },
        'wrk_cctv_nvr_64ch': { name: 'NVR видеорег. 64 канала', unit: 'шт', price: 20000, category: 'cctv' },
        'wrk_cctv_monitor_43': { name: 'Монитор наблюдения 43"', unit: 'шт', price: 6000, category: 'cctv' },
        'wrk_cctv_hdd_2tb': { name: 'HDD 2ТБ (surveillance)', unit: 'шт', price: 500, category: 'cctv' },
        'wrk_cctv_hdd_4tb': { name: 'HDD 4ТБ (surveillance)', unit: 'шт', price: 800, category: 'cctv' },
        'wrk_cctv_hdd_8tb': { name: 'HDD 8ТБ (surveillance)', unit: 'шт', price: 1500, category: 'cctv' },
        'wrk_cctv_cable_utp': { name: 'Кабель UTP Cat5e (CCTV)', unit: 'м.п.', price: 10, category: 'cctv' },
        'wrk_cctv_cable_utp_6': { name: 'Кабель UTP Cat6 (CCTV)', unit: 'м.п.', price: 15, category: 'cctv' },
        'wrk_cctv_config_basic': { name: 'Настройка камеры (базовая)', unit: 'шт', price: 200, category: 'cctv' },
        'wrk_cctv_config_analytics': { name: 'Настройка видеоаналитики', unit: 'шт', price: 500, category: 'cctv' }
    };

    // === СКУД (КОНТРОЛЬ ДОСТУПА) ===
    window.AI_WRK_ACCESS = {
        'wrk_acc_reader_card': { name: 'Считыватель карт (СКУД)', unit: 'шт', price: 1000, category: 'access' },
        'wrk_acc_reader_finger': { name: 'Считыватель отпечатков', unit: 'шт', price: 2000, category: 'access' },
        'wrk_acc_reader_face': { name: 'Считыватель распознавания лица', unit: 'шт', price: 5000, category: 'access' },
        'wrk_acc_controller_1': { name: 'Контроллер СКУД 1 дверь', unit: 'шт', price: 3000, category: 'access' },
        'wrk_acc_controller_2': { name: 'Контроллер СКУД 2 двери', unit: 'шт', price: 5000, category: 'access' },
        'wrk_acc_controller_4': { name: 'Контроллер СКУД 4 двери', unit: 'шт', price: 8000, category: 'access' },
        'wrk_acc_lock_bolt': { name: 'Электроригельный замок', unit: 'шт', price: 600, category: 'access' },
        'wrk_acc_power_supply': { name: 'Бесперебойный БП (СКУД)', unit: 'шт', price: 1000, category: 'access' },
        'wrk_acc_software': { name: 'ПО управления СКУД', unit: 'лицензия', price: 5000, category: 'access' },
        'wrk_acc_card_issue': { name: 'Выпуск карт доступа', unit: 'шт', price: 20, category: 'access' }
    };

    // === ТЕЛЕКОММУНИКАЦИИ (Дополнения) ===
    window.AI_WRK_TELECOM = {
        // Структурированная кабельная система
        'wrk_tel_rack_9u': { name: 'Шкаф телекоммуникационный 9U', unit: 'шт', price: 3000, category: 'telecom' },
        'wrk_tel_rack_18u': { name: 'Шкаф телекоммуникационный 18U', unit: 'шт', price: 5000, category: 'telecom' },
        'wrk_tel_rack_42u': { name: 'Шкаф телекоммуникационный 42U', unit: 'шт', price: 10000, category: 'telecom' },
        'wrk_tel_rj45_term_5e': { name: 'Терминация RJ45 Cat5e', unit: 'шт', price: 50, category: 'telecom' },
        'wrk_tel_rj45_term_6': { name: 'Терминация RJ45 Cat6', unit: 'шт', price: 70, category: 'telecom' },
        'wrk_tel_rj45_term_6a': { name: 'Терминация RJ45 Cat6a', unit: 'шт', price: 100, category: 'telecom' },
        'wrk_tel_fiber_term_sc': { name: 'Терминация оптического волокна (SC)', unit: 'шт', price: 100, category: 'telecom' },
        'wrk_tel_fiber_term_lc': { name: 'Терминация оптического волокна (LC)', unit: 'шт', price: 100, category: 'telecom' },
        'wrk_tel_fiber_splice': { name: 'Сварка оптического волокна', unit: 'стык', price: 200, category: 'telecom' },
        'wrk_tel_test_fluke': { name: 'Тестирование СКС (Fluke)', unit: 'линк', price: 50, category: 'telecom' },
        // Wi-Fi
        'wrk_tel_wifi_ap_indoor': { name: 'Wi-Fi точка доступа (indoor)', unit: 'шт', price: 2000, category: 'telecom' },
        'wrk_tel_wifi_ap_outdoor': { name: 'Wi-Fi точка доступа (outdoor)', unit: 'шт', price: 3000, category: 'telecom' },
        'wrk_tel_wifi_controller': { name: 'Wi-Fi контроллер', unit: 'шт', price: 10000, category: 'telecom' },
        'wrk_tel_wifi_survey': { name: 'Wi-Fi обследование', unit: 'объект', price: 5000, category: 'telecom' }
    };
})();
