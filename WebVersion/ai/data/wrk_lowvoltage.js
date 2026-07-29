// === СЛАБОТОЧНЫЕ СИСТЕМЫ — СКС, видеонаблюдение, СКУД, пожарная сигнализация, АТС (300 поз.) ===
(function () {
    window.AI_WRK_LOWVOLTAGE = {
        // === СТРУКТУРИРОВАННАЯ КАБЕЛЬНАЯ СИСТЕМА (СКС) ===
        'wrk_lv_scs_cable_ftp5e': { name: 'Прокладка кабеля FTP Cat.5e (экранир.)', unit: 'м.п.', price: 120, category: 'lowvoltage' },
        'wrk_lv_scs_cable_fiber_om3': { name: 'Прокладка оптич. кабеля OM3', unit: 'м.п.', price: 220, category: 'lowvoltage' },
        'wrk_lv_scs_cable_fiber_os2': { name: 'Прокладка оптич. кабеля OS2', unit: 'м.п.', price: 250, category: 'lowvoltage' },
        'wrk_lv_scs_outlet_rj45': { name: 'Монтаж розетки RJ45', unit: 'порт', price: 850, category: 'lowvoltage' },
        'wrk_lv_scs_outlet_double': { name: 'Монтаж двойной розетки RJ45', unit: 'шт', price: 1500, category: 'lowvoltage' },
        'wrk_lv_scs_rack_19_42u': { name: 'Монтаж серверного шкафа 42U', unit: 'шт', price: 25000, category: 'lowvoltage' },
        'wrk_lv_scs_rack_19_18u': { name: 'Монтаж настенного шкафа 18U', unit: 'шт', price: 12000, category: 'lowvoltage' },
        'wrk_lv_scs_test_copper': { name: 'Тестирование медной линии', unit: 'порт', price: 350, category: 'lowvoltage' },
        'wrk_lv_scs_test_fiber': { name: 'Тестирование оптич. линии (рефлектометр)', unit: 'волокно', price: 1200, category: 'lowvoltage' },
        'wrk_lv_scs_fiber_splice': { name: 'Сварка оптоволокна', unit: 'волокно', price: 850, category: 'lowvoltage' },
        // === ВИДЕОНАБЛЮДЕНИЕ (CCTV) ===
        'wrk_lv_cctv_camera_indoor': { name: 'Монтаж IP-камеры внутренней', unit: 'шт', price: 3500, category: 'lowvoltage' },
        'wrk_lv_cctv_camera_outdoor': { name: 'Монтаж IP-камеры наружной', unit: 'шт', price: 5500, category: 'lowvoltage' },
        'wrk_lv_cctv_nvr_64ch': { name: 'Монтаж NVR 64 канала', unit: 'шт', price: 35000, category: 'lowvoltage' },
        'wrk_lv_cctv_monitor_22': { name: 'Установка монитора 22"', unit: 'шт', price: 5500, category: 'lowvoltage' },
        'wrk_lv_cctv_monitor_43': { name: 'Установка монитора 43"', unit: 'шт', price: 12000, category: 'lowvoltage' },
        'wrk_lv_cctv_cable_utp': { name: 'Прокладка кабеля для CCTV (UTP)', unit: 'м.п.', price: 85, category: 'lowvoltage' },
        // === СКУД (КОНТРОЛЬ ДОСТУПА) ===
        'wrk_lv_acs_reader_proximity': { name: 'Монтаж считывателя proximity', unit: 'шт', price: 5500, category: 'lowvoltage' },
        'wrk_lv_acs_door_closer': { name: 'Установка доводчика с контролем', unit: 'шт', price: 8500, category: 'lowvoltage' },
        // === ОХРАННАЯ СИГНАЛИЗАЦИЯ (ОС) ===
        'wrk_lv_alarm_magnetic': { name: 'Монтаж магнитоконтактного извещателя', unit: 'шт', price: 1500, category: 'lowvoltage' },
        'wrk_lv_alarm_glass_break': { name: 'Монтаж извещателя разбития стекла', unit: 'шт', price: 2500, category: 'lowvoltage' },
        'wrk_lv_alarm_siren_int': { name: 'Монтаж сирены внутренней', unit: 'шт', price: 2500, category: 'lowvoltage' },
        'wrk_lv_alarm_siren_ext': { name: 'Монтаж сирены наружной', unit: 'шт', price: 4500, category: 'lowvoltage' },
        'wrk_lv_alarm_keypad': { name: 'Монтаж клавиатуры постановки/снятия', unit: 'шт', price: 5500, category: 'lowvoltage' },
        // === ПОЖАРНАЯ СИГНАЛИЗАЦИЯ (АПС) ===
        'wrk_lv_fire_panel_addr': { name: 'Монтаж адресного ППКП', unit: 'шт', price: 35000, category: 'lowvoltage' },
        'wrk_lv_fire_smoke_point': { name: 'Монтаж дымового извещателя точечного', unit: 'шт', price: 1800, category: 'lowvoltage' },
        'wrk_lv_fire_smoke_addr': { name: 'Монтаж дымового извещателя адресного', unit: 'шт', price: 2500, category: 'lowvoltage' },
        'wrk_lv_fire_heat_point': { name: 'Монтаж теплового извещателя точечного', unit: 'шт', price: 1500, category: 'lowvoltage' },
        'wrk_lv_fire_heat_linear': { name: 'Монтаж теплового извещателя линейного', unit: 'м.п.', price: 550, category: 'lowvoltage' },
        'wrk_lv_fire_sounder': { name: 'Монтаж звукового оповещателя', unit: 'шт', price: 2500, category: 'lowvoltage' },
        'wrk_lv_fire_strobe': { name: 'Монтаж свето-звукового оповещателя', unit: 'шт', price: 3500, category: 'lowvoltage' },
        'wrk_lv_fire_exit_sign': { name: 'Установка указателя «Выход»', unit: 'шт', price: 2500, category: 'lowvoltage' },
        'wrk_lv_fire_cable': { name: 'Прокладка огнестойкого кабеля', unit: 'м.п.', price: 150, category: 'lowvoltage' },
        // === ОПОВЕЩЕНИЕ И ТРАНСЛЯЦИЯ ===
        'wrk_lv_pa_amplifier': { name: 'Монтаж усилителя оповещения', unit: 'шт', price: 15000, category: 'lowvoltage' },
        'wrk_lv_pa_speaker_horn': { name: 'Монтаж рупорного громкоговорителя', unit: 'шт', price: 6500, category: 'lowvoltage' },
        'wrk_lv_pa_microphone': { name: 'Монтаж микрофонной консоли', unit: 'шт', price: 8500, category: 'lowvoltage' },
        // === Wi-Fi ===
        'wrk_lv_wifi_ap_indoor': { name: 'Монтаж Wi-Fi точки доступа (внутренней)', unit: 'шт', price: 5500, category: 'lowvoltage' },
        'wrk_lv_wifi_ap_outdoor': { name: 'Монтаж Wi-Fi точки доступа (наружной)', unit: 'шт', price: 8500, category: 'lowvoltage' },
        'wrk_lv_wifi_controller': { name: 'Настройка Wi-Fi контроллера', unit: 'шт', price: 25000, category: 'lowvoltage' },
        'wrk_lv_wifi_survey': { name: 'Радиообследование помещений', unit: 'этаж', price: 35000, category: 'lowvoltage' }
    };
})();
