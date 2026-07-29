// === ФАЗА 3: ЭЛЕКТРОСНАБЖЕНИЕ — КТП, РП, ЛИНИИ 0.4-10кВ, ЗАЗЕМЛЕНИЕ, МОЛНИЕЗАЩИТА (130 поз.) ===
(function () {
    window.AI_WRK_POWER_SUPPLY = {
        // === ТРАНСФОРМАТОРНЫЕ ПОДСТАНЦИИ ===
        'wrk_ps_ktp_100': { name: 'КТП 100кВА (монтаж)', unit: 'шт', price: 50000, category: 'power_supply' },
        'wrk_ps_ktp_160': { name: 'КТП 160кВА (монтаж)', unit: 'шт', price: 60000, category: 'power_supply' },
        'wrk_ps_ktp_1600': { name: 'КТП 1600кВА (монтаж)', unit: 'шт', price: 250000, category: 'power_supply' },
        'wrk_ps_ktp_2500': { name: 'КТП 2500кВА (монтаж)', unit: 'шт', price: 350000, category: 'power_supply' },

        // === РАСПРЕДЕЛИТЕЛЬНЫЕ УСТРОЙСТВА ===
        'wrk_ps_ru_04_100a': { name: 'РУ-0.4кВ 100А', unit: 'шт', price: 5000, category: 'power_supply' },
        'wrk_ps_ru_04_250a': { name: 'РУ-0.4кВ 250А', unit: 'шт', price: 8000, category: 'power_supply' },
        'wrk_ps_ru_04_400a': { name: 'РУ-0.4кВ 400А', unit: 'шт', price: 12000, category: 'power_supply' },
        'wrk_ps_ru_04_630a': { name: 'РУ-0.4кВ 630А', unit: 'шт', price: 18000, category: 'power_supply' },
        'wrk_ps_ru_04_1000a': { name: 'РУ-0.4кВ 1000А', unit: 'шт', price: 25000, category: 'power_supply' },
        'wrk_ps_ru_04_1600a': { name: 'РУ-0.4кВ 1600А', unit: 'шт', price: 35000, category: 'power_supply' },
        'wrk_ps_ru_10_cell': { name: 'Ячейка РУ-10кВ (КСО/КРУ)', unit: 'шт', price: 30000, category: 'power_supply' },
        'wrk_ps_ats_100a': { name: 'АВР (АТС) 100А', unit: 'шт', price: 5000, category: 'power_supply' },
        'wrk_ps_ats_250a': { name: 'АВР (АТС) 250А', unit: 'шт', price: 8000, category: 'power_supply' },
        'wrk_ps_ats_400a': { name: 'АВР (АТС) 400А', unit: 'шт', price: 12000, category: 'power_supply' },
        'wrk_ps_ats_630a': { name: 'АВР (АТС) 630А', unit: 'шт', price: 18000, category: 'power_supply' },

        // === КАБЕЛЬНЫЕ ЛИНИИ 0.4кВ ===
        'wrk_ps_cable_avvg_4x50': { name: 'АВВГ 4×50 (прокладка)', unit: 'м.п.', price: 50, category: 'power_supply' },
        'wrk_ps_cable_avvg_4x70': { name: 'АВВГ 4×70 (прокладка)', unit: 'м.п.', price: 60, category: 'power_supply' },
        'wrk_ps_cable_avvg_4x95': { name: 'АВВГ 4×95 (прокладка)', unit: 'м.п.', price: 80, category: 'power_supply' },
        'wrk_ps_cable_avvg_4x120': { name: 'АВВГ 4×120 (прокладка)', unit: 'м.п.', price: 100, category: 'power_supply' },
        'wrk_ps_cable_avvg_4x150': { name: 'АВВГ 4×150 (прокладка)', unit: 'м.п.', price: 120, category: 'power_supply' },
        'wrk_ps_cable_avvg_4x185': { name: 'АВВГ 4×185 (прокладка)', unit: 'м.п.', price: 150, category: 'power_supply' },
        'wrk_ps_cable_avvg_4x240': { name: 'АВВГ 4×240 (прокладка)', unit: 'м.п.', price: 200, category: 'power_supply' },
        'wrk_ps_cable_vvg_4x50': { name: 'ВВГнг 4×50 (прокладка)', unit: 'м.п.', price: 80, category: 'power_supply' },
        'wrk_ps_cable_vvg_4x70': { name: 'ВВГнг 4×70 (прокладка)', unit: 'м.п.', price: 100, category: 'power_supply' },
        'wrk_ps_cable_vvg_4x95': { name: 'ВВГнг 4×95 (прокладка)', unit: 'м.п.', price: 120, category: 'power_supply' },
        'wrk_ps_cable_vvg_4x120': { name: 'ВВГнг 4×120 (прокладка)', unit: 'м.п.', price: 150, category: 'power_supply' },

        // === КАБЕЛЬНЫЕ ЛИНИИ 10кВ ===
        'wrk_ps_cable_10kv_50': { name: 'Кабель 10кВ 3×50 (прокладка)', unit: 'м.п.', price: 150, category: 'power_supply' },
        'wrk_ps_cable_10kv_70': { name: 'Кабель 10кВ 3×70 (прокладка)', unit: 'м.п.', price: 200, category: 'power_supply' },
        'wrk_ps_cable_10kv_95': { name: 'Кабель 10кВ 3×95 (прокладка)', unit: 'м.п.', price: 250, category: 'power_supply' },
        'wrk_ps_cable_10kv_120': { name: 'Кабель 10кВ 3×120 (прокладка)', unit: 'м.п.', price: 300, category: 'power_supply' },
        'wrk_ps_cable_10kv_150': { name: 'Кабель 10кВ 3×150 (прокладка)', unit: 'м.п.', price: 350, category: 'power_supply' },
        'wrk_ps_cable_10kv_240': { name: 'Кабель 10кВ 3×240 (прокладка)', unit: 'м.п.', price: 500, category: 'power_supply' },
        'wrk_ps_term_10kv_int': { name: 'Концевая муфта 10кВ (внутр.)', unit: 'шт', price: 3000, category: 'power_supply' },
        'wrk_ps_term_10kv_ext': { name: 'Концевая муфта 10кВ (наруж.)', unit: 'шт', price: 5000, category: 'power_supply' },
        'wrk_ps_splice_10kv': { name: 'Соединительная муфта 10кВ', unit: 'шт', price: 5000, category: 'power_supply' },

        // === ВОЗДУШНЫЕ ЛИНИИ ===
        'wrk_ps_vl_sip_2x16': { name: 'ВЛ СИП 2×16 (монтаж)', unit: 'м.п.', price: 30, category: 'power_supply' },
        'wrk_ps_vl_sip_4x16': { name: 'ВЛ СИП 4×16 (монтаж)', unit: 'м.п.', price: 40, category: 'power_supply' },
        'wrk_ps_vl_sip_4x25': { name: 'ВЛ СИП 4×25 (монтаж)', unit: 'м.п.', price: 50, category: 'power_supply' },
        'wrk_ps_vl_sip_4x35': { name: 'ВЛ СИП 4×35 (монтаж)', unit: 'м.п.', price: 60, category: 'power_supply' },
        'wrk_ps_vl_sip_4x50': { name: 'ВЛ СИП 4×50 (монтаж)', unit: 'м.п.', price: 80, category: 'power_supply' },
        'wrk_ps_vl_sip_4x95': { name: 'ВЛ СИП 4×95 (монтаж)', unit: 'м.п.', price: 120, category: 'power_supply' },
        'wrk_ps_pole_wood_9': { name: 'Деревянная опора 9м', unit: 'шт', price: 2000, category: 'power_supply' },
        'wrk_ps_pole_wood_11': { name: 'Деревянная опора 11м', unit: 'шт', price: 3000, category: 'power_supply' },
        'wrk_ps_pole_rc_9': { name: 'Ж/Б опора 9.5м', unit: 'шт', price: 5000, category: 'power_supply' },
        'wrk_ps_pole_rc_11': { name: 'Ж/Б опора 11м', unit: 'шт', price: 7000, category: 'power_supply' },
        'wrk_ps_pole_steel': { name: 'Стальная опора освещения', unit: 'шт', price: 3000, category: 'power_supply' },

        // === ЗАЗЕМЛЕНИЕ ===
        'wrk_ps_ground_vert_3m': { name: 'Вертикальный заземлитель 3м', unit: 'шт', price: 200, category: 'power_supply' },
        'wrk_ps_ground_vert_5m': { name: 'Вертикальный заземлитель 5м', unit: 'шт', price: 300, category: 'power_supply' },
        'wrk_ps_ground_horiz': { name: 'Горизонтальный заземлитель (полоса)', unit: 'м.п.', price: 20, category: 'power_supply' },
        'wrk_ps_ground_modular_15m': { name: 'Модульное заземление 15м', unit: 'комплект', price: 3000, category: 'power_supply' },
        'wrk_ps_ground_modular_30m': { name: 'Модульное заземление 30м', unit: 'комплект', price: 5000, category: 'power_supply' },
        'wrk_ps_ground_mesh': { name: 'Заземляющая сетка (контур)', unit: 'м²', price: 30, category: 'power_supply' },

        // === МОЛНИЕЗАЩИТА ===
        'wrk_ps_lightning_rod_1_5': { name: 'Молниеприёмник 1.5м', unit: 'шт', price: 500, category: 'power_supply' },
        'wrk_ps_lightning_rod_3': { name: 'Молниеприёмник 3м', unit: 'шт', price: 800, category: 'power_supply' },
        'wrk_ps_lightning_rod_6': { name: 'Молниеприёмник 6м', unit: 'шт', price: 1500, category: 'power_supply' },
        'wrk_ps_lightning_wire': { name: 'Токоотвод (проволока)', unit: 'м.п.', price: 10, category: 'power_supply' },
        'wrk_ps_lightning_holder': { name: 'Держатель токоотвода', unit: 'шт', price: 5, category: 'power_supply' },
        'wrk_ps_lightning_mesh': { name: 'Молниеприёмная сетка (кровля)', unit: 'м²', price: 20, category: 'power_supply' },
        'wrk_ps_lightning_counter': { name: 'Счётчик ударов молнии', unit: 'шт', price: 1000, category: 'power_supply' },
        'wrk_ps_spd_1': { name: 'УЗИП I класса (SPD)', unit: 'шт', price: 1000, category: 'power_supply' },
        'wrk_ps_spd_2': { name: 'УЗИП II класса (SPD)', unit: 'шт', price: 500, category: 'power_supply' },
        'wrk_ps_spd_3': { name: 'УЗИП III класса (SPD)', unit: 'шт', price: 200, category: 'power_supply' },

        // === КАБЕЛЬНЫЕ КОНСТРУКЦИИ ===
        'wrk_ps_tray_600': { name: 'Кабельный лоток 600мм', unit: 'м.п.', price: 70, category: 'power_supply' },
        'wrk_ps_busbar_250a': { name: 'Шинопровод 250А', unit: 'м.п.', price: 200, category: 'power_supply' },
        'wrk_ps_busbar_400a': { name: 'Шинопровод 400А', unit: 'м.п.', price: 300, category: 'power_supply' },
        'wrk_ps_busbar_630a': { name: 'Шинопровод 630А', unit: 'м.п.', price: 500, category: 'power_supply' },
        'wrk_ps_busbar_1000a': { name: 'Шинопровод 1000А', unit: 'м.п.', price: 800, category: 'power_supply' },
        'wrk_ps_busbar_1600a': { name: 'Шинопровод 1600А', unit: 'м.п.', price: 1200, category: 'power_supply' }
    };
})();
