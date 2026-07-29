// === КАТАЛОГ РАБОТ: СЛАБОТОЧНЫЕ СИСТЕМЫ — ВИДЕОНАБЛЮДЕНИЕ, СКУД, СКС, ДОМОФОН (Фаза 1-3: 120 поз.) ===
(function () {
    window.AI_WRK_LOW_VOLTAGE = {
        // СКС — структурированная кабельная система
        'wrk_lv_sks_utp_cat5e': { name: 'Прокладка кабеля UTP Cat.5e', unit: 'м.п.', price: 15, category: 'low_voltage' },
        'wrk_lv_sks_utp_cat6': { name: 'Прокладка кабеля UTP Cat.6', unit: 'м.п.', price: 18, category: 'low_voltage' },
        'wrk_lv_sks_utp_cat6a': { name: 'Прокладка кабеля UTP Cat.6a', unit: 'м.п.', price: 25, category: 'low_voltage' },
        'wrk_lv_sks_ftp_cat6': { name: 'Прокладка кабеля FTP Cat.6', unit: 'м.п.', price: 20, category: 'low_voltage' },
        'wrk_lv_sks_fiber_sm': { name: 'Прокладка оптоволокна SM', unit: 'м.п.', price: 50, category: 'low_voltage' },
        'wrk_lv_sks_fiber_mm': { name: 'Прокладка оптоволокна MM', unit: 'м.п.', price: 40, category: 'low_voltage' },
        'wrk_lv_sks_socket_rj45': { name: 'Монтаж розетки RJ-45', unit: 'шт', price: 200, category: 'low_voltage' },
        'wrk_lv_sks_socket_rj45_2': { name: 'Монтаж розетки RJ-45 (двойная)', unit: 'шт', price: 300, category: 'low_voltage' },
        'wrk_lv_sks_patch_panel_24': { name: 'Монтаж патч-панели 24 порта', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_sks_patch_panel_48': { name: 'Монтаж патч-панели 48 портов', unit: 'шт', price: 1500, category: 'low_voltage' },
        'wrk_lv_sks_rack_6u': { name: 'Монтаж шкафа 6U', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_sks_rack_12u': { name: 'Монтаж шкафа 12U', unit: 'шт', price: 1500, category: 'low_voltage' },
        'wrk_lv_sks_rack_22u': { name: 'Монтаж шкафа 22U', unit: 'шт', price: 2500, category: 'low_voltage' },
        'wrk_lv_sks_rack_42u': { name: 'Монтаж шкафа 42U', unit: 'шт', price: 4000, category: 'low_voltage' },
        'wrk_lv_sks_switch_mount': { name: 'Монтаж/настройка коммутатора', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_sks_router_mount': { name: 'Монтаж/настройка маршрутизатора', unit: 'шт', price: 1500, category: 'low_voltage' },
        'wrk_lv_sks_wifi_ap': { name: 'Монтаж точки доступа Wi-Fi', unit: 'шт', price: 500, category: 'low_voltage' },
        'wrk_lv_sks_test_cert': { name: 'Тестирование/сертификация линии', unit: 'линия', price: 200, category: 'low_voltage' },
        // Видеонаблюдение
        'wrk_lv_cctv_camera_int': { name: 'Монтаж камеры (внутренняя)', unit: 'шт', price: 800, category: 'low_voltage' },
        'wrk_lv_cctv_camera_ext': { name: 'Монтаж камеры (уличная)', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_cctv_camera_ptz': { name: 'Монтаж PTZ-камеры', unit: 'шт', price: 2000, category: 'low_voltage' },
        'wrk_lv_cctv_camera_dome': { name: 'Монтаж купольной камеры', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_cctv_dvr_install': { name: 'Настройка видеорегистратора', unit: 'шт', price: 1500, category: 'low_voltage' },
        'wrk_lv_cctv_nvr_install': { name: 'Настройка NVR', unit: 'шт', price: 2000, category: 'low_voltage' },
        'wrk_lv_cctv_poe_switch': { name: 'Монтаж PoE-коммутатора', unit: 'шт', price: 500, category: 'low_voltage' },
        'wrk_lv_cctv_hdd_install': { name: 'Установка HDD в регистратор', unit: 'шт', price: 200, category: 'low_voltage' },
        'wrk_lv_cctv_bracket': { name: 'Монтаж кронштейна камеры', unit: 'шт', price: 200, category: 'low_voltage' },
        'wrk_lv_cctv_cable_coax': { name: 'Прокладка коаксиального кабеля', unit: 'м.п.', price: 15, category: 'low_voltage' },
        'wrk_lv_cctv_remote_access': { name: 'Настройка удалённого доступа', unit: 'шт', price: 1000, category: 'low_voltage' },
        // СКУД
        'wrk_lv_skud_reader': { name: 'Монтаж считывателя СКУД', unit: 'шт', price: 500, category: 'low_voltage' },
        'wrk_lv_skud_controller': { name: 'Монтаж контроллера СКУД', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_skud_lock_mag': { name: 'Монтаж электромагнитного замка', unit: 'шт', price: 500, category: 'low_voltage' },
        'wrk_lv_skud_lock_elec': { name: 'Монтаж электромеханического замка', unit: 'шт', price: 600, category: 'low_voltage' },
        'wrk_lv_skud_turnstile': { name: 'Монтаж турникета', unit: 'шт', price: 3000, category: 'low_voltage' },
        'wrk_lv_skud_barrier': { name: 'Монтаж шлагбаума', unit: 'шт', price: 5000, category: 'low_voltage' },
        'wrk_lv_skud_button': { name: 'Монтаж кнопки выхода', unit: 'шт', price: 100, category: 'low_voltage' },
        'wrk_lv_skud_setup': { name: 'Настройка ПО СКУД', unit: 'объект', price: 3000, category: 'low_voltage' },
        // Домофония
        'wrk_lv_intercom_audio': { name: 'Монтаж аудиодомофона', unit: 'компл.', price: 1000, category: 'low_voltage' },
        'wrk_lv_intercom_video_4': { name: 'Монтаж видеодомофона 4"', unit: 'компл.', price: 1500, category: 'low_voltage' },
        'wrk_lv_intercom_video_7': { name: 'Монтаж видеодомофона 7"', unit: 'компл.', price: 2000, category: 'low_voltage' },
        'wrk_lv_intercom_video_10': { name: 'Монтаж видеодомофона 10"', unit: 'компл.', price: 2500, category: 'low_voltage' },
        'wrk_lv_intercom_ip': { name: 'Монтаж IP-домофона', unit: 'компл.', price: 3000, category: 'low_voltage' },
        'wrk_lv_intercom_multi': { name: 'Монтаж многоабон. домофона', unit: 'абонент', price: 500, category: 'low_voltage' },
        // Системы оповещения
        'wrk_lv_pa_speaker_wall': { name: 'Монтаж настенного громкоговорителя', unit: 'шт', price: 300, category: 'low_voltage' },
        'wrk_lv_pa_speaker_ceil': { name: 'Монтаж потолочного громкоговорителя', unit: 'шт', price: 300, category: 'low_voltage' },
        'wrk_lv_pa_amplifier': { name: 'Монтаж усилителя', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_pa_cable': { name: 'Прокладка акустич. кабеля', unit: 'м.п.', price: 10, category: 'low_voltage' },
        // Охранная сигнализация
        'wrk_lv_alarm_panel': { name: 'Монтаж охранной панели', unit: 'шт', price: 1500, category: 'low_voltage' },
        'wrk_lv_alarm_pir': { name: 'Монтаж ИК-датчика движения', unit: 'шт', price: 300, category: 'low_voltage' },
        'wrk_lv_alarm_magnet': { name: 'Монтаж магнитоконтактного датчика', unit: 'шт', price: 200, category: 'low_voltage' },
        'wrk_lv_alarm_glass': { name: 'Монтаж датчика разбития стекла', unit: 'шт', price: 300, category: 'low_voltage' },
        'wrk_lv_alarm_siren': { name: 'Монтаж охранной сирены', unit: 'шт', price: 200, category: 'low_voltage' },
        'wrk_lv_alarm_keypad': { name: 'Монтаж клавиатуры охранной', unit: 'шт', price: 500, category: 'low_voltage' },
        'wrk_lv_alarm_gsm': { name: 'Настройка GSM-модуля', unit: 'шт', price: 500, category: 'low_voltage' },
        // ТВ / спутник
        'wrk_lv_tv_antenna': { name: 'Монтаж ТВ-антенны', unit: 'шт', price: 1000, category: 'low_voltage' },
        'wrk_lv_tv_satellite': { name: 'Монтаж спутниковой антенны', unit: 'шт', price: 2000, category: 'low_voltage' },
        'wrk_lv_tv_socket': { name: 'Монтаж ТВ-розетки', unit: 'шт', price: 150, category: 'low_voltage' }
    };
})();
