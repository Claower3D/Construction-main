// === ТЕЛЕКОММУНИКАЦИИ ПОЛНЫЕ — ВОЛС, радио, АМС, серверные, ЦОД (52 поз.) ===
(function () {
    window.AI_WRK_TELECOM2 = {
        // === ВОЛС === 1-14
        'wrk_tc2_fiber_4': { name: 'Прокладка ОК 4 волокна', unit: 'м.п.', price: 80, category: 'telecom2' },
        'wrk_tc2_fiber_8': { name: 'Прокладка ОК 8 волокон', unit: 'м.п.', price: 100, category: 'telecom2' },
        'wrk_tc2_fiber_12': { name: 'Прокладка ОК 12 волокон', unit: 'м.п.', price: 120, category: 'telecom2' },
        'wrk_tc2_fiber_24': { name: 'Прокладка ОК 24 волокна', unit: 'м.п.', price: 150, category: 'telecom2' },
        'wrk_tc2_fiber_48': { name: 'Прокладка ОК 48 волокон', unit: 'м.п.', price: 200, category: 'telecom2' },
        'wrk_tc2_fiber_96': { name: 'Прокладка ОК 96 волокон', unit: 'м.п.', price: 350, category: 'telecom2' },
        'wrk_tc2_fiber_muft_16': { name: 'Оптическая муфта 16 волокон', unit: 'шт', price: 3500, category: 'telecom2' },
        'wrk_tc2_fiber_muft_48': { name: 'Оптическая муфта 48 волокон', unit: 'шт', price: 5500, category: 'telecom2' },
        'wrk_tc2_fiber_otdr': { name: 'Рефлектометрия OTDR', unit: 'волокно', price: 250, category: 'telecom2' },
        'wrk_tc2_fiber_cross': { name: 'Оптическая кроссовая панель', unit: 'шт', price: 5500, category: 'telecom2' },
        'wrk_tc2_fiber_pigtail': { name: 'Пигтейл', unit: 'шт', price: 250, category: 'telecom2' },
        'wrk_tc2_fiber_drop': { name: 'Абонентский дроп-кабель', unit: 'м.п.', price: 50, category: 'telecom2' },
        'wrk_tc2_fiber_ont': { name: 'ONT абонентский терминал', unit: 'шт', price: 1500, category: 'telecom2' },
        // === КАНАЛИЗАЦИЯ СВЯЗИ === 15-20
        'wrk_tc2_duct_1x100': { name: 'Кабельная канализация 1×100', unit: 'м.п.', price: 850, category: 'telecom2' },
        'wrk_tc2_duct_2x100': { name: 'Кабельная канализация 2×100', unit: 'м.п.', price: 1200, category: 'telecom2' },
        'wrk_tc2_duct_4x100': { name: 'Кабельная канализация 4×100', unit: 'м.п.', price: 1800, category: 'telecom2' },
        'wrk_tc2_duct_micro': { name: 'Микротрубка', unit: 'м.п.', price: 80, category: 'telecom2' },
        'wrk_tc2_manhole_2': { name: 'Колодец ККС-2', unit: 'шт', price: 25000, category: 'telecom2' },
        'wrk_tc2_manhole_5': { name: 'Колодец ККС-5', unit: 'шт', price: 55000, category: 'telecom2' },
        // === АМС === 21-28
        'wrk_tc2_tower_30': { name: 'Башня связи 30м', unit: 'шт', price: 1500000, category: 'telecom2' },
        'wrk_tc2_tower_45': { name: 'Башня связи 45м', unit: 'шт', price: 2500000, category: 'telecom2' },
        'wrk_tc2_tower_60': { name: 'Башня связи 60м', unit: 'шт', price: 3500000, category: 'telecom2' },
        'wrk_tc2_mast_roof': { name: 'Мачта на крыше', unit: 'шт', price: 120000, category: 'telecom2' },
        'wrk_tc2_antenna_sector': { name: 'Секторная антенна', unit: 'шт', price: 8500, category: 'telecom2' },
        'wrk_tc2_antenna_dish': { name: 'Параболическая антенна', unit: 'шт', price: 12000, category: 'telecom2' },
        'wrk_tc2_rru': { name: 'RRU (выносной радиоблок)', unit: 'шт', price: 15000, category: 'telecom2' },
        'wrk_tc2_bbu': { name: 'BBU (базовый блок)', unit: 'шт', price: 25000, category: 'telecom2' },
        // === СЕРВЕРНЫЕ / ЦОД === 29-42
        'wrk_tc2_prec_ac_5': { name: 'Прецизионный кондиционер 5кВт', unit: 'шт', price: 55000, category: 'telecom2' },
        'wrk_tc2_prec_ac_20': { name: 'Прецизионный кондиционер 20кВт', unit: 'шт', price: 120000, category: 'telecom2' },
        'wrk_tc2_prec_ac_50': { name: 'Прецизионный кондиционер 50кВт', unit: 'шт', price: 250000, category: 'telecom2' },
        'wrk_tc2_ups_3': { name: 'ИБП 3кВА', unit: 'шт', price: 8500, category: 'telecom2' },
        'wrk_tc2_pdu': { name: 'PDU', unit: 'шт', price: 5500, category: 'telecom2' },
        'wrk_tc2_cable_mgmt': { name: 'Кабельная организация в шкафу', unit: 'шкаф', price: 8500, category: 'telecom2' },
        'wrk_tc2_fire_novec': { name: 'Газовое ПТ серверной (Novec)', unit: 'компл.', price: 350000, category: 'telecom2' },
        // === РАДИО === 43-48
        'wrk_tc2_radio_uhf': { name: 'УКВ-радиостанция', unit: 'шт', price: 5500, category: 'telecom2' },
        'wrk_tc2_radio_repeater': { name: 'Ретранслятор', unit: 'шт', price: 55000, category: 'telecom2' },
        'wrk_tc2_radio_antenna': { name: 'Антенна УКВ', unit: 'шт', price: 5500, category: 'telecom2' },
        'wrk_tc2_radio_feeder': { name: 'Фидер', unit: 'м.п.', price: 350, category: 'telecom2' },
        'wrk_tc2_radio_tetra': { name: 'Базовая станция TETRA', unit: 'шт', price: 550000, category: 'telecom2' },
        'wrk_tc2_radio_dmr': { name: 'Базовая станция DMR', unit: 'шт', price: 250000, category: 'telecom2' },
        // === ПНР === 49-52
        'wrk_tc2_pnr_fiber': { name: 'ПНР ВОЛС', unit: 'волокно', price: 550, category: 'telecom2' },
        'wrk_tc2_pnr_radio': { name: 'ПНР радиосвязи', unit: 'компл.', price: 25000, category: 'telecom2' },
        'wrk_tc2_pnr_dc': { name: 'ПНР серверной/ЦОД', unit: 'компл.', price: 85000, category: 'telecom2' },
        'wrk_tc2_pnr_doc': { name: 'Исполнительная документация', unit: 'компл.', price: 35000, category: 'telecom2' }
    };
})();
