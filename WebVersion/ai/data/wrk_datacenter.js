// === СЕРВЕРНЫЕ / ДАТА-ЦЕНТРЫ — стойки, охлаждение, электроснабжение, СКС (50 поз.) ===
(function () {
    window.AI_WRK_DATACENTER = {
        // === СТОЙКИ / ШКАФЫ === 1-8
        'wrk_dc_rack_42u': { name: 'Монтаж стойки 42U', unit: 'шт', price: 12000, category: 'datacenter' },
        'wrk_dc_rack_47u': { name: 'Монтаж стойки 47U', unit: 'шт', price: 15000, category: 'datacenter' },
        'wrk_dc_rack_open_42u': { name: 'Открытая стойка 42U', unit: 'шт', price: 8500, category: 'datacenter' },
        'wrk_dc_rack_wall_15u': { name: 'Настенный шкаф 15U', unit: 'шт', price: 5500, category: 'datacenter' },
        'wrk_dc_rack_pdu_basic': { name: 'PDU базовый (вертикальный)', unit: 'шт', price: 5500, category: 'datacenter' },
        'wrk_dc_rack_pdu_managed': { name: 'PDU управляемый', unit: 'шт', price: 25000, category: 'datacenter' },
        'wrk_dc_rack_shelf': { name: 'Полка в стойку', unit: 'шт', price: 1500, category: 'datacenter' },
        'wrk_dc_rack_patch_panel': { name: 'Патч-панель 24 порта', unit: 'шт', price: 3500, category: 'datacenter' },
        // === ФАЛЬШПОЛ === 9-14
        'wrk_dc_floor_600': { name: 'Фальшпол 600×600 (сталь)', unit: 'м²', price: 3500, category: 'datacenter' },
        'wrk_dc_floor_600_perf': { name: 'Фальшпол перфорированный', unit: 'м²', price: 5500, category: 'datacenter' },
        'wrk_dc_floor_stringer': { name: 'Стрингер фальшпола', unit: 'м.п.', price: 550, category: 'datacenter' },
        'wrk_dc_floor_pedestal': { name: 'Стойка фальшпола', unit: 'шт', price: 250, category: 'datacenter' },
        'wrk_dc_floor_ramp': { name: 'Рампа фальшпола', unit: 'компл.', price: 12000, category: 'datacenter' },
        'wrk_dc_floor_grille': { name: 'Вентиляционная решётка фальшпола', unit: 'шт', price: 3500, category: 'datacenter' },
        // === ОХЛАЖДЕНИЕ === 15-24
        'wrk_dc_ac_precision_10': { name: 'Прецизионный кондиционер 10кВт', unit: 'шт', price: 550000, category: 'datacenter' },
        'wrk_dc_ac_precision_30': { name: 'Прецизионный кондиционер 30кВт', unit: 'шт', price: 1200000, category: 'datacenter' },
        'wrk_dc_ac_precision_60': { name: 'Прецизионный кондиционер 60кВт', unit: 'шт', price: 2500000, category: 'datacenter' },
        'wrk_dc_ac_inrow': { name: 'Внутрирядный кондиционер', unit: 'шт', price: 850000, category: 'datacenter' },
        'wrk_dc_ac_chiller': { name: 'Чиллер для ДЦ', unit: 'шт', price: 5500000, category: 'datacenter' },
        'wrk_dc_ac_dry_cooler': { name: 'Драйкулер', unit: 'шт', price: 550000, category: 'datacenter' },
        'wrk_dc_containment_hot': { name: 'Изоляция горячего коридора', unit: 'м.п.', price: 8500, category: 'datacenter' },
        'wrk_dc_containment_cold': { name: 'Изоляция холодного коридора', unit: 'м.п.', price: 8500, category: 'datacenter' },
        'wrk_dc_pipe_chilled': { name: 'Трубопровод хладоносителя', unit: 'м.п.', price: 2500, category: 'datacenter' },
        'wrk_dc_humid_control': { name: 'Увлажнитель воздуха (ДЦ)', unit: 'шт', price: 120000, category: 'datacenter' },
        // === ЭЛЕКТРОСНАБЖЕНИЕ === 25-34
        'wrk_dc_ups_10': { name: 'ИБП 10кВА', unit: 'шт', price: 250000, category: 'datacenter' },
        'wrk_dc_ups_30': { name: 'ИБП 30кВА', unit: 'шт', price: 550000, category: 'datacenter' },
        'wrk_dc_ups_60': { name: 'ИБП 60кВА', unit: 'шт', price: 1200000, category: 'datacenter' },
        'wrk_dc_ups_100': { name: 'ИБП 100кВА', unit: 'шт', price: 2500000, category: 'datacenter' },
        'wrk_dc_ups_200': { name: 'ИБП 200кВА', unit: 'шт', price: 5500000, category: 'datacenter' },
        'wrk_dc_battery_rack': { name: 'Стеллаж АКБ', unit: 'шт', price: 15000, category: 'datacenter' },
        'wrk_dc_battery_agm': { name: 'АКБ AGM (модуль)', unit: 'шт', price: 25000, category: 'datacenter' },
        'wrk_dc_battery_liion': { name: 'АКБ Li-Ion (модуль)', unit: 'шт', price: 85000, category: 'datacenter' },
        'wrk_dc_diesel_gen': { name: 'ДГУ для ДЦ', unit: 'шт', price: 2500000, category: 'datacenter' },
        'wrk_dc_ats': { name: 'АВР (автоматич. ввод резерва)', unit: 'шт', price: 120000, category: 'datacenter' },
        // === СКС / СЕТЬ === 35-42
        'wrk_dc_cable_cat6a': { name: 'Кабель UTP Cat6a', unit: 'м.п.', price: 55, category: 'datacenter' },
        'wrk_dc_cable_om3': { name: 'Оптоволокно OM3', unit: 'м.п.', price: 85, category: 'datacenter' },
        'wrk_dc_cable_om4': { name: 'Оптоволокно OM4', unit: 'м.п.', price: 120, category: 'datacenter' },
        'wrk_dc_cable_os2': { name: 'Оптоволокно OS2 (одномод)', unit: 'м.п.', price: 55, category: 'datacenter' },
        'wrk_dc_cable_tray_200': { name: 'Кабельный лоток 200мм', unit: 'м.п.', price: 850, category: 'datacenter' },
        'wrk_dc_cable_tray_400': { name: 'Кабельный лоток 400мм', unit: 'м.п.', price: 1200, category: 'datacenter' },
        'wrk_dc_splice': { name: 'Сварка оптоволокна (стык)', unit: 'стык', price: 350, category: 'datacenter' },
        'wrk_dc_test_certify': { name: 'Сертификация СКС (порт)', unit: 'порт', price: 250, category: 'datacenter' },
        // === БЕЗОПАСНОСТЬ / МОНИТОРИНГ === 43-50
        'wrk_dc_fire_gas': { name: 'Газовое пожаротушение (серв.)', unit: 'компл.', price: 550000, category: 'datacenter' },
        'wrk_dc_fire_vesda': { name: 'Система раннего обнаружения (VESDA)', unit: 'шт', price: 120000, category: 'datacenter' },
        'wrk_dc_access_biometric': { name: 'Биометрический СКУД (серв.)', unit: 'шт', price: 55000, category: 'datacenter' },
        'wrk_dc_dcim': { name: 'Система DCIM (мониторинг ДЦ)', unit: 'компл.', price: 550000, category: 'datacenter' },
        'wrk_dc_env_sensor': { name: 'Датчик среды (температура/влажность)', unit: 'шт', price: 5500, category: 'datacenter' },
        'wrk_dc_cctv': { name: 'Видеонаблюдение серверной', unit: 'камера', price: 8500, category: 'datacenter' },
        'wrk_dc_commissioning': { name: 'ПНР серверной/ДЦ', unit: 'компл.', price: 250000, category: 'datacenter' }
    };
})();
