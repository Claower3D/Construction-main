// === ОХРАННЫЕ СИСТЕМЫ — СКУД, видеонаблюдение, ОПС, периметр, домофоны (52 поз.) ===
(function () {
    window.AI_WRK_SECURITY = {
        // === ВИДЕОНАБЛЮДЕНИЕ === 1-12
        'wrk_sec_cam_bullet_2mp': { name: 'Монтаж камеры уличной (bullet, 2Мп)', unit: 'шт', price: 3500, category: 'security' },
        'wrk_sec_cam_bullet_5mp': { name: 'Монтаж камеры уличной (bullet, 5Мп)', unit: 'шт', price: 5500, category: 'security' },
        'wrk_sec_cam_dome_2mp': { name: 'Монтаж камеры купольной 2Мп', unit: 'шт', price: 3500, category: 'security' },
        'wrk_sec_cam_dome_5mp': { name: 'Монтаж камеры купольной 5Мп', unit: 'шт', price: 5500, category: 'security' },
        'wrk_sec_cam_fisheye': { name: 'Монтаж панорамной камеры (fisheye)', unit: 'шт', price: 8500, category: 'security' },
        'wrk_sec_cam_thermal': { name: 'Монтаж тепловизионной камеры', unit: 'шт', price: 85000, category: 'security' },
        'wrk_sec_nvr_8': { name: 'Монтаж NVR на 8 каналов', unit: 'шт', price: 8500, category: 'security' },
        'wrk_sec_nvr_16': { name: 'Монтаж NVR на 16 каналов', unit: 'шт', price: 12000, category: 'security' },
        'wrk_sec_nvr_32': { name: 'Монтаж NVR на 32 канала', unit: 'шт', price: 18000, category: 'security' },
        'wrk_sec_monitor': { name: 'Монтаж монитора оператора', unit: 'шт', price: 5500, category: 'security' },
        // === СКУД === 13-22
        'wrk_sec_acs_reader_card': { name: 'Считыватель карт (proximity)', unit: 'шт', price: 3500, category: 'security' },
        'wrk_sec_acs_lock_motor': { name: 'Электромеханический замок', unit: 'шт', price: 5500, category: 'security' },
        'wrk_sec_acs_barrier': { name: 'Шлагбаум (СКУД)', unit: 'шт', price: 55000, category: 'security' },
        'wrk_sec_acs_server': { name: 'Сервер СКУД + ПО', unit: 'компл.', price: 120000, category: 'security' },
        // === ОПС (пожарная+охранная) === 23-32
        'wrk_sec_ops_smoke': { name: 'Извещатель дымовой', unit: 'шт', price: 550, category: 'security' },
        'wrk_sec_ops_heat': { name: 'Извещатель тепловой', unit: 'шт', price: 550, category: 'security' },
        'wrk_sec_ops_manual': { name: 'Извещатель пожарный ручной (ИПР)', unit: 'шт', price: 550, category: 'security' },
        'wrk_sec_ops_gas_co': { name: 'Извещатель CO', unit: 'шт', price: 1500, category: 'security' },
        'wrk_sec_ops_panel_4': { name: 'Прибор приёмно-контрольный (4 шлейфа)', unit: 'шт', price: 5500, category: 'security' },
        'wrk_sec_ops_panel_16': { name: 'Прибор приёмно-контрольный (16 шлейфов)', unit: 'шт', price: 15000, category: 'security' },
        'wrk_sec_ops_siren': { name: 'Оповещатель звуковой', unit: 'шт', price: 550, category: 'security' },
        'wrk_sec_ops_strobe': { name: 'Оповещатель световой', unit: 'шт', price: 550, category: 'security' },
        'wrk_sec_ops_voice': { name: 'Система оповещения (речевая)', unit: 'компл.', price: 120000, category: 'security' },
        // === ПЕРИМЕТР === 33-38
        'wrk_sec_fence_sensor': { name: 'Вибрационный датчик ограждения', unit: 'м.п.', price: 550, category: 'security' },
        'wrk_sec_ir_beam_indoor': { name: 'ИК-барьер (внутренний)', unit: 'шт', price: 3500, category: 'security' },
        'wrk_sec_ir_beam_outdoor': { name: 'ИК-барьер (периметр)', unit: 'шт', price: 8500, category: 'security' },
        'wrk_sec_radar': { name: 'Радарный датчик периметра', unit: 'шт', price: 55000, category: 'security' },
        'wrk_sec_electric_fence': { name: 'Монтаж электрозаграждения', unit: 'м.п.', price: 850, category: 'security' },
        'wrk_sec_light_perimeter': { name: 'Охранное освещение периметра', unit: 'опора', price: 12000, category: 'security' },
        // === ДОМОФОНЫ === 39-44
        'wrk_sec_intercom_audio': { name: 'Аудиодомофон', unit: 'шт', price: 3500, category: 'security' },
        'wrk_sec_intercom_video': { name: 'Видеодомофон', unit: 'шт', price: 8500, category: 'security' },
        'wrk_sec_intercom_ip': { name: 'IP-видеодомофон', unit: 'шт', price: 15000, category: 'security' },
        'wrk_sec_intercom_panel': { name: 'Вызывная панель подъездная', unit: 'шт', price: 25000, category: 'security' },
        'wrk_sec_intercom_gate': { name: 'Вызывная панель (ворота)', unit: 'шт', price: 12000, category: 'security' },
        'wrk_sec_intercom_switch': { name: 'Коммутатор подъездного домофона', unit: 'шт', price: 5500, category: 'security' },
        // === КАБЕЛЬНАЯ ИНФРАСТРУКТУРА === 45-50
        'wrk_sec_cable_utp': { name: 'Прокладка кабеля UTP Cat5e', unit: 'м.п.', price: 35, category: 'security' },
        'wrk_sec_cable_alarm': { name: 'Прокладка кабеля КСПВ', unit: 'м.п.', price: 25, category: 'security' },
        'wrk_sec_cable_shielded': { name: 'Прокладка экранированного кабеля', unit: 'м.п.', price: 55, category: 'security' },
        'wrk_sec_switch_poe_8': { name: 'Коммутатор PoE (8 портов)', unit: 'шт', price: 8500, category: 'security' },
        'wrk_sec_ups_rack': { name: 'ИБП для системы безопасности', unit: 'шт', price: 12000, category: 'security' }
    };
})();
