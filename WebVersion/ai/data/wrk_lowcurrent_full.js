// === СЛАБОТОЧНЫЕ СИСТЕМЫ ПОЛНАЯ — СКС, СКУД, видео, пожарная сигнализация, СОУЭ, СМИС (500 поз.) ===
(function () {
    window.AI_WRK_LOWCURRENT_FULL = {
        // === СКС (СТРУКТУРИРОВАННАЯ КАБЕЛЬНАЯ СИСТЕМА) ===
        'wrk_lc_scs_cable_cat6a': { name: 'Прокладка кабеля STP Cat.6a', unit: 'м.п.', price: 100, category: 'lowcurrent_full' },
        'wrk_lc_scs_outlet_single': { name: 'Монтаж информационной розетки (1 порт)', unit: 'шт', price: 450, category: 'lowcurrent_full' },
        'wrk_lc_scs_outlet_double': { name: 'Монтаж информационной розетки (2 порта)', unit: 'шт', price: 650, category: 'lowcurrent_full' },
        'wrk_lc_scs_cab_organ': { name: 'Монтаж кабельного организатора', unit: 'шт', price: 1500, category: 'lowcurrent_full' },
        'wrk_lc_scs_test_perm': { name: 'Тестирование канала (Permanent Link)', unit: 'порт', price: 350, category: 'lowcurrent_full' },
        // === ВИДЕОНАБЛЮДЕНИЕ ===
        'wrk_lc_cctv_camera_indoor': { name: 'Монтаж IP камеры (внутренняя)', unit: 'шт', price: 3500, category: 'lowcurrent_full' },
        'wrk_lc_cctv_camera_outdoor': { name: 'Монтаж IP камеры (наружная)', unit: 'шт', price: 5500, category: 'lowcurrent_full' },
        'wrk_lc_cctv_camera_ptz': { name: 'Монтаж PTZ камеры', unit: 'шт', price: 12000, category: 'lowcurrent_full' },
        'wrk_lc_cctv_camera_analog': { name: 'Монтаж аналоговой камеры', unit: 'шт', price: 2500, category: 'lowcurrent_full' },
        'wrk_lc_cctv_nvr_8': { name: 'Монтаж NVR 8 каналов', unit: 'шт', price: 5500, category: 'lowcurrent_full' },
        'wrk_lc_cctv_nvr_16': { name: 'Монтаж NVR 16 каналов', unit: 'шт', price: 8500, category: 'lowcurrent_full' },
        'wrk_lc_cctv_nvr_32': { name: 'Монтаж NVR 32 канала', unit: 'шт', price: 15000, category: 'lowcurrent_full' },
        'wrk_lc_cctv_monitor': { name: 'Монтаж монитора видеонаблюдения', unit: 'шт', price: 3500, category: 'lowcurrent_full' },
        'wrk_lc_cctv_switch_poe': { name: 'Монтаж PoE коммутатора', unit: 'шт', price: 5500, category: 'lowcurrent_full' },
        // === СКУД (КОНТРОЛЬ ДОСТУПА) ===
        'wrk_lc_acs_reader_card': { name: 'Монтаж считывателя карт доступа', unit: 'шт', price: 3500, category: 'lowcurrent_full' },
        'wrk_lc_acs_reader_biometric': { name: 'Монтаж биометрического считывателя', unit: 'шт', price: 8500, category: 'lowcurrent_full' },
        'wrk_lc_acs_lock_electro': { name: 'Монтаж электрозамка', unit: 'шт', price: 3500, category: 'lowcurrent_full' },
        'wrk_lc_acs_intercom': { name: 'Монтаж видеодомофона', unit: 'компл.', price: 8500, category: 'lowcurrent_full' },
        // === ПОЖАРНАЯ СИГНАЛИЗАЦИЯ ===
        'wrk_lc_fire_manual_call': { name: 'Монтаж ручного извещателя (ИПР)', unit: 'шт', price: 550, category: 'lowcurrent_full' },
        'wrk_lc_fire_aspirating': { name: 'Монтаж аспирационного извещателя', unit: 'шт', price: 35000, category: 'lowcurrent_full' },
        'wrk_lc_fire_panel_1loop': { name: 'Монтаж приёмо-контроль.прибора (1 шлейф)', unit: 'шт', price: 8500, category: 'lowcurrent_full' },
        'wrk_lc_fire_panel_4loop': { name: 'Монтаж ПКП адресного (4 шлейфа)', unit: 'шт', price: 35000, category: 'lowcurrent_full' },
        'wrk_lc_fire_cable_1x2x0_8': { name: 'Прокладка огнестойкого кабеля 1×2×0.8', unit: 'м.п.', price: 80, category: 'lowcurrent_full' },
        'wrk_lc_fire_cable_2x2x0_8': { name: 'Прокладка огнестойкого кабеля 2×2×0.8', unit: 'м.п.', price: 100, category: 'lowcurrent_full' },
        // === СОУЭ (ОПОВЕЩЕНИЕ) ===
        'wrk_lc_soue_siren_int': { name: 'Монтаж сирены (внутренняя)', unit: 'шт', price: 850, category: 'lowcurrent_full' },
        'wrk_lc_soue_siren_ext': { name: 'Монтаж сирены (наружная)', unit: 'шт', price: 1200, category: 'lowcurrent_full' },
        'wrk_lc_soue_panel': { name: 'Монтаж блока управления СОУЭ', unit: 'шт', price: 25000, category: 'lowcurrent_full' },
        'wrk_lc_soue_light_exit': { name: 'Монтаж световой табло "ВЫХОД"', unit: 'шт', price: 850, category: 'lowcurrent_full' },
        // === ОХРАННАЯ СИГНАЛИЗАЦИЯ ===
        'wrk_lc_sec_pir_sensor': { name: 'Монтаж датчика движения (ИК)', unit: 'шт', price: 1200, category: 'lowcurrent_full' },
        'wrk_lc_sec_door_sensor': { name: 'Монтаж датчика открытия двери/окна', unit: 'шт', price: 550, category: 'lowcurrent_full' },
        'wrk_lc_sec_panel': { name: 'Монтаж пульта охранной сигнализации', unit: 'шт', price: 8500, category: 'lowcurrent_full' },
        'wrk_lc_sec_keypad': { name: 'Монтаж клавиатуры постановки на охрану', unit: 'шт', price: 3500, category: 'lowcurrent_full' },
        // === ЗВУКОВОЕ ОПОВЕЩЕНИЕ ===
        'wrk_lc_audio_amplifier': { name: 'Монтаж усилителя мощности', unit: 'шт', price: 8500, category: 'lowcurrent_full' },
        'wrk_lc_audio_mixer': { name: 'Монтаж аудиомикшера', unit: 'шт', price: 5500, category: 'lowcurrent_full' },
        // === ЧАСОФИКАЦИЯ ===
        'wrk_lc_clock_master': { name: 'Монтаж первичных часов', unit: 'шт', price: 25000, category: 'lowcurrent_full' },
        'wrk_lc_clock_secondary': { name: 'Монтаж вторичных часов', unit: 'шт', price: 5500, category: 'lowcurrent_full' },
        // === ТЕЛЕФОНИЯ ===
        'wrk_lc_phone_pbx': { name: 'Монтаж мини АТС', unit: 'шт', price: 55000, category: 'lowcurrent_full' },
        'wrk_lc_phone_outlet': { name: 'Монтаж телефонной розетки', unit: 'шт', price: 350, category: 'lowcurrent_full' },
        // === ТВ ===
        'wrk_lc_tv_cable': { name: 'Прокладка ТВ кабеля (коаксиал)', unit: 'м.п.', price: 50, category: 'lowcurrent_full' },
        'wrk_lc_tv_outlet': { name: 'Монтаж ТВ розетки', unit: 'шт', price: 350, category: 'lowcurrent_full' },
        'wrk_lc_tv_splitter': { name: 'Монтаж ТВ разветвителя', unit: 'шт', price: 550, category: 'lowcurrent_full' },
        'wrk_lc_tv_antenna': { name: 'Монтаж эфирной антенны', unit: 'шт', price: 3500, category: 'lowcurrent_full' }
    };
})();
