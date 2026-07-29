// === ЛИНИИ ЭЛЕКТРОПЕРЕДАЧИ — ВЛ, КЛ, опоры, подстанции, молниезащита (300 поз.) ===
(function () {
    window.AI_WRK_POWERLINES = {
        // === ВОЗДУШНЫЕ ЛИНИИ 0.4кВ ===
        'wrk_pw_vl_04_pole_concrete': { name: 'Установка опоры ВЛ 0.4кВ ж/б', unit: 'шт', price: 35000, category: 'powerlines' },
        'wrk_pw_vl_04_pole_wood': { name: 'Установка опоры ВЛ 0.4кВ дерев.', unit: 'шт', price: 15000, category: 'powerlines' },
        'wrk_pw_vl_04_sip_2x16': { name: 'Монтаж СИП 2×16 (ВЛ 0.4кВ)', unit: 'м.п.', price: 120, category: 'powerlines' },
        'wrk_pw_vl_04_sip_4x16': { name: 'Монтаж СИП 4×16 (ВЛ 0.4кВ)', unit: 'м.п.', price: 180, category: 'powerlines' },
        'wrk_pw_vl_04_sip_4x25': { name: 'Монтаж СИП 4×25 (ВЛ 0.4кВ)', unit: 'м.п.', price: 220, category: 'powerlines' },
        'wrk_pw_vl_04_sip_4x50': { name: 'Монтаж СИП 4×50 (ВЛ 0.4кВ)', unit: 'м.п.', price: 350, category: 'powerlines' },
        'wrk_pw_vl_04_sip_4x95': { name: 'Монтаж СИП 4×95 (ВЛ 0.4кВ)', unit: 'м.п.', price: 550, category: 'powerlines' },
        'wrk_pw_vl_04_sip_4x120': { name: 'Монтаж СИП 4×120 (ВЛ 0.4кВ)', unit: 'м.п.', price: 650, category: 'powerlines' },
        // === ВОЗДУШНЫЕ ЛИНИИ 10кВ ===
        'wrk_pw_vl_10_pole_concrete': { name: 'Установка опоры ВЛ 10кВ ж/б', unit: 'шт', price: 55000, category: 'powerlines' },
        'wrk_pw_vl_10_pole_metal': { name: 'Установка опоры ВЛ 10кВ метал.', unit: 'шт', price: 85000, category: 'powerlines' },
        'wrk_pw_vl_10_wire_a50': { name: 'Монтаж провода А-50 (ВЛ 10кВ)', unit: 'м.п.', price: 80, category: 'powerlines' },
        'wrk_pw_vl_10_wire_a70': { name: 'Монтаж провода А-70 (ВЛ 10кВ)', unit: 'м.п.', price: 100, category: 'powerlines' },
        'wrk_pw_vl_10_wire_a95': { name: 'Монтаж провода А-95 (ВЛ 10кВ)', unit: 'м.п.', price: 130, category: 'powerlines' },
        'wrk_pw_vl_10_sip3_50': { name: 'Монтаж СИП-3 1×50 (ВЛЗ 10кВ)', unit: 'м.п.', price: 180, category: 'powerlines' },
        'wrk_pw_vl_10_sip3_70': { name: 'Монтаж СИП-3 1×70 (ВЛЗ 10кВ)', unit: 'м.п.', price: 220, category: 'powerlines' },
        'wrk_pw_vl_10_insulator': { name: 'Монтаж изолятора 10кВ', unit: 'шт', price: 1200, category: 'powerlines' },
        'wrk_pw_vl_10_disconn': { name: 'Монтаж разъединителя 10кВ', unit: 'шт', price: 35000, category: 'powerlines' },
        'wrk_pw_vl_10_recloser': { name: 'Монтаж реклоузера 10кВ', unit: 'шт', price: 250000, category: 'powerlines' },
        // === ВОЗДУШНЫЕ ЛИНИИ 35-110кВ ===
        'wrk_pw_vl_110_tower': { name: 'Установка опоры ВЛ 110кВ (решётчатая)', unit: 'шт', price: 850000, category: 'powerlines' },
        'wrk_pw_vl_35_wire_as120': { name: 'Монтаж провода АС-120 (ВЛ 35кВ)', unit: 'м.п.', price: 250, category: 'powerlines' },
        'wrk_pw_vl_110_wire_as185': { name: 'Монтаж провода АС-185 (ВЛ 110кВ)', unit: 'м.п.', price: 450, category: 'powerlines' },
        'wrk_pw_vl_110_wire_as240': { name: 'Монтаж провода АС-240 (ВЛ 110кВ)', unit: 'м.п.', price: 550, category: 'powerlines' },
        'wrk_pw_vl_ground_wire': { name: 'Монтаж грозозащитного троса', unit: 'м.п.', price: 80, category: 'powerlines' },
        'wrk_pw_vl_opgw': { name: 'Монтаж ОКГТ (OPGW)', unit: 'м.п.', price: 350, category: 'powerlines' },
        // === КАБЕЛЬНЫЕ ЛИНИИ (РАСШИРЕННЫЕ) ===
        'wrk_pw_kl_trench_1cable': { name: 'Рытьё траншеи (1 кабель)', unit: 'м.п.', price: 550, category: 'powerlines' },
        'wrk_pw_kl_trench_2cable': { name: 'Рытьё траншеи (2 кабеля)', unit: 'м.п.', price: 750, category: 'powerlines' },
        'wrk_pw_kl_sand_bed': { name: 'Устройство постели и присыпка', unit: 'м.п.', price: 250, category: 'powerlines' },
        'wrk_pw_kl_warning_tape': { name: 'Укладка сигнальной ленты', unit: 'м.п.', price: 20, category: 'powerlines' },
        'wrk_pw_kl_protection_slab': { name: 'Укладка защитных плит', unit: 'м.п.', price: 150, category: 'powerlines' },
        'wrk_pw_kl_boring_hor': { name: 'ГНБ (горизонтальное бурение) для кабеля', unit: 'м.п.', price: 5500, category: 'powerlines' },
        // === ПОДСТАНЦИИ (РАСШИРЕННЫЕ) ===
        'wrk_pw_tp_ktpn_250': { name: 'Монтаж КТПН 250кВА', unit: 'шт', price: 450000, category: 'powerlines' },
        'wrk_pw_tp_ktpn_400': { name: 'Монтаж КТПН 400кВА', unit: 'шт', price: 550000, category: 'powerlines' },
        'wrk_pw_tp_ktpn_630': { name: 'Монтаж КТПН 630кВА', unit: 'шт', price: 750000, category: 'powerlines' },
        'wrk_pw_tp_ktpn_1000': { name: 'Монтаж КТПН 1000кВА', unit: 'шт', price: 1200000, category: 'powerlines' },
        'wrk_pw_tp_rp_10kv': { name: 'Монтаж РП 10кВ (распред.пункт)', unit: 'шт', price: 2500000, category: 'powerlines' },
        'wrk_pw_tp_gps_35': { name: 'Монтаж ГПП 35кВ', unit: 'компл.', price: 15000000, category: 'powerlines' },
        // === МОЛНИЕЗАЩИТА / ЗАЗЕМЛЕНИЕ ===
        'wrk_pw_lightning_rod': { name: 'Монтаж молниеприёмника (стержневой)', unit: 'шт', price: 5500, category: 'powerlines' },
        'wrk_pw_lightning_cable': { name: 'Монтаж токоотвода', unit: 'м.п.', price: 250, category: 'powerlines' },
        'wrk_pw_ground_strip': { name: 'Прокладка заземляющей полосы 40×4', unit: 'м.п.', price: 250, category: 'powerlines' },
        'wrk_pw_ground_test': { name: 'Испытание контура заземления', unit: 'компл.', price: 5500, category: 'powerlines' },
        // === СОЛНЕЧНАЯ ЭНЕРГЕТИКА ===
        'wrk_pw_solar_panel_mono': { name: 'Монтаж солнечной панели (моно 400Вт)', unit: 'шт', price: 3500, category: 'powerlines' },
        'wrk_pw_solar_panel_poly': { name: 'Монтаж солнечной панели (поли 350Вт)', unit: 'шт', price: 2800, category: 'powerlines' },
        'wrk_pw_solar_inverter_5': { name: 'Монтаж инвертора 5кВт', unit: 'шт', price: 25000, category: 'powerlines' },
        'wrk_pw_solar_inverter_10': { name: 'Монтаж инвертора 10кВт', unit: 'шт', price: 45000, category: 'powerlines' },
        'wrk_pw_solar_inverter_30': { name: 'Монтаж инвертора 30кВт', unit: 'шт', price: 120000, category: 'powerlines' },
        'wrk_pw_solar_mounting_roof': { name: 'Монтаж крепления СЭС (крыша)', unit: 'шт', price: 1500, category: 'powerlines' },
        'wrk_pw_solar_mounting_ground': { name: 'Монтаж крепления СЭС (земля)', unit: 'шт', price: 2500, category: 'powerlines' },
        'wrk_pw_solar_battery_5': { name: 'Монтаж АКБ 5кВт·ч', unit: 'шт', price: 15000, category: 'powerlines' },
        'wrk_pw_solar_battery_10': { name: 'Монтаж АКБ 10кВт·ч', unit: 'шт', price: 25000, category: 'powerlines' },
        // === ДИЗЕЛЬ-ГЕНЕРАТОРЫ ===
        'wrk_pw_dg_30': { name: 'Монтаж ДГУ 30кВА', unit: 'шт', price: 55000, category: 'powerlines' },
        'wrk_pw_dg_1000': { name: 'Монтаж ДГУ 1000кВА', unit: 'шт', price: 850000, category: 'powerlines' },
        'wrk_pw_ats': { name: 'Монтаж щита АВР', unit: 'шт', price: 85000, category: 'powerlines' }
    };
})();
