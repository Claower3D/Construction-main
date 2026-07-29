// === ТЕЛЕКОММУНИКАЦИИ, СВЯЗЬ, АНТЕННЫ, РАДИОРЕЛЕЙНЫЕ ЛИНИИ (200 поз.) ===
(function () {
    window.AI_WRK_TELECOM = {
        // === АНТЕННО-МАЧТОВЫЕ СООРУЖЕНИЯ ===
        'wrk_tc_tower_30m': { name: 'Монтаж антенной башни 30м', unit: 'шт', price: 2500000, category: 'telecom' },
        'wrk_tc_tower_50m': { name: 'Монтаж антенной башни 50м', unit: 'шт', price: 4500000, category: 'telecom' },
        'wrk_tc_tower_72m': { name: 'Монтаж антенной башни 72м', unit: 'шт', price: 6500000, category: 'telecom' },
        'wrk_tc_mast_rooftop': { name: 'Монтаж мачты на крышу', unit: 'шт', price: 350000, category: 'telecom' },
        'wrk_tc_antenna_sector': { name: 'Монтаж секторной антенны', unit: 'шт', price: 35000, category: 'telecom' },
        'wrk_tc_antenna_dish_06': { name: 'Монтаж параболической антенны 0.6м', unit: 'шт', price: 25000, category: 'telecom' },
        'wrk_tc_antenna_dish_12': { name: 'Монтаж параболической антенны 1.2м', unit: 'шт', price: 55000, category: 'telecom' },
        'wrk_tc_rru_install': { name: 'Монтаж выносного радиомодуля (RRU)', unit: 'шт', price: 25000, category: 'telecom' },
        'wrk_tc_bts_install': { name: 'Монтаж базовой станции', unit: 'шт', price: 250000, category: 'telecom' },
        'wrk_tc_cabinet_outdoor': { name: 'Монтаж уличного шкафа связи', unit: 'шт', price: 45000, category: 'telecom' },
        // === ВОЛОКОННО-ОПТИЧЕСКИЕ ЛИНИИ СВЯЗИ ===
        'wrk_tc_fiber_aerial': { name: 'Подвеска ВОЛС на опорах (ОКГТ)', unit: 'м.п.', price: 250, category: 'telecom' },
        'wrk_tc_fiber_buried': { name: 'Прокладка ВОЛС в грунте (ЗПТ)', unit: 'м.п.', price: 350, category: 'telecom' },
        'wrk_tc_fiber_duct': { name: 'Прокладка ВОЛС в канализации', unit: 'м.п.', price: 180, category: 'telecom' },
        'wrk_tc_fiber_indoor': { name: 'Прокладка оптического кабеля внутри здания', unit: 'м.п.', price: 120, category: 'telecom' },
        'wrk_tc_fiber_splice_12': { name: 'Сварка оптоволокна (12 волокон)', unit: 'муфта', price: 12000, category: 'telecom' },
        'wrk_tc_fiber_splice_24': { name: 'Сварка оптоволокна (24 волокна)', unit: 'муфта', price: 22000, category: 'telecom' },
        'wrk_tc_fiber_splice_48': { name: 'Сварка оптоволокна (48 волокон)', unit: 'муфта', price: 35000, category: 'telecom' },
        'wrk_tc_fiber_odf_install': { name: 'Монтаж оптической кроссовой (ODF)', unit: 'шт', price: 15000, category: 'telecom' },
        'wrk_tc_fiber_test_otdr': { name: 'Рефлектометрия ВОЛС (OTDR)', unit: 'волокно', price: 1200, category: 'telecom' },
        // === КАБЕЛЬНАЯ КАНАЛИЗАЦИЯ СВЯЗИ ===
        'wrk_tc_duct_1x110': { name: 'Прокладка канализации связи 1×Ø110', unit: 'м.п.', price: 1500, category: 'telecom' },
        'wrk_tc_duct_2x110': { name: 'Прокладка канализации связи 2×Ø110', unit: 'м.п.', price: 2200, category: 'telecom' },
        'wrk_tc_duct_4x110': { name: 'Прокладка канализации связи 4×Ø110', unit: 'м.п.', price: 3500, category: 'telecom' },
        'wrk_tc_well_kk': { name: 'Устройство колодца кабельной канализации', unit: 'шт', price: 85000, category: 'telecom' },
        // === МУЛЬТИСЕРВИСНЫЕ СЕТИ ===
        'wrk_tc_switch_access': { name: 'Монтаж коммутатора доступа', unit: 'шт', price: 15000, category: 'telecom' },
        'wrk_tc_switch_core': { name: 'Монтаж ядра сети', unit: 'шт', price: 85000, category: 'telecom' },
        'wrk_tc_router_install': { name: 'Монтаж маршрутизатора', unit: 'шт', price: 25000, category: 'telecom' },
        'wrk_tc_firewall_install': { name: 'Монтаж межсетевого экрана', unit: 'шт', price: 35000, category: 'telecom' },
        'wrk_tc_server_install': { name: 'Монтаж сервера (в шкаф)', unit: 'шт', price: 15000, category: 'telecom' },
        'wrk_tc_ups_rack': { name: 'Монтаж ИБП для серверной', unit: 'шт', price: 25000, category: 'telecom' },
        'wrk_tc_cooling_precision': { name: 'Монтаж прецизионного кондиционера (серверная)', unit: 'шт', price: 120000, category: 'telecom' }
    };
})();
