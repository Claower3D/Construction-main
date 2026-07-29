// === ЗАЗЕМЛЕНИЕ, МОЛНИЕЗАЩИТА (30 позиций) ===
(function () {
    window.AI_MAT_EARTHING = {
        // Заземление
        'earth_rod_copper_1_5m': { name: 'Стержень заземления медн. Ø14мм (1.5м)', unit: 'шт', price: 3000, category: 'earthing' },
        'earth_rod_copper_3m': { name: 'Стержень заземления медн. Ø14мм (3м)', unit: 'шт', price: 5500, category: 'earthing' },
        'earth_rod_steel_galv_3m': { name: 'Стержень заземления оцинк. Ø16мм (3м)', unit: 'шт', price: 2000, category: 'earthing' },
        'earth_coupling': { name: 'Муфта соединительная для заземления', unit: 'шт', price: 500, category: 'earthing' },
        'earth_clamp_rod': { name: 'Зажим для стержня заземления', unit: 'шт', price: 350, category: 'earthing' },
        'earth_clamp_cross': { name: 'Зажим крестовой (полоса+полоса)', unit: 'шт', price: 300, category: 'earthing' },
        'earth_strip_4x40_galv': { name: 'Полоса заземления оцинк. 4×40мм (п.м.)', unit: 'п.м.', price: 150, category: 'earthing' },
        'earth_strip_4x40_cu': { name: 'Полоса заземления медная 4×40мм (п.м.)', unit: 'п.м.', price: 500, category: 'earthing' },
        'earth_wire_6mm_yellow': { name: 'Провод заземления ПВ3 6мм² (жёлто-зелёный)', unit: 'м', price: 40, category: 'earthing' },
        'earth_wire_10mm_yellow': { name: 'Провод заземления ПВ3 10мм² (жёлто-зелёный)', unit: 'м', price: 65, category: 'earthing' },
        'earth_wire_16mm_yellow': { name: 'Провод заземления ПВ3 16мм² (жёлто-зелёный)', unit: 'м', price: 100, category: 'earthing' },
        'earth_pe_bus_12': { name: 'Шина заземления PE (12 подключений)', unit: 'шт', price: 350, category: 'earthing' },
        'earth_box_testing': { name: 'Коробка проверки заземления', unit: 'шт', price: 800, category: 'earthing' },
        'earth_modular_kit': { name: 'Комплект модульного заземления (6м)', unit: 'комплект', price: 12000, category: 'earthing' },

        // Молниезащита
        'lightning_rod_1_5m': { name: 'Молниеприёмник (стержень 1.5м)', unit: 'шт', price: 3000, category: 'earthing' },
        'lightning_rod_3m': { name: 'Молниеприёмник (стержень 3м)', unit: 'шт', price: 5000, category: 'earthing' },
        'lightning_mast_6m': { name: 'Мачта молниеприёмная (6м)', unit: 'шт', price: 15000, category: 'earthing' },
        'lightning_wire_8mm': { name: 'Проволока оцинк. Ø8мм для молниезащиты (п.м.)', unit: 'п.м.', price: 80, category: 'earthing' },
        'lightning_clamp_roof': { name: 'Держатель проводника на кровле', unit: 'шт', price: 30, category: 'earthing' },
        'lightning_clamp_wall': { name: 'Держатель проводника на стене', unit: 'шт', price: 25, category: 'earthing' },
        'lightning_connector_bolt': { name: 'Соединитель молниепроводника', unit: 'шт', price: 200, category: 'earthing' },
        'lightning_counter_strike': { name: 'Счётчик ударов молнии', unit: 'шт', price: 5000, category: 'earthing' },

        // УЗИП (устройства защиты от импульсных перенапряжений)
        'spd_type1_1p': { name: 'УЗИП Класс I 1P (до 50кА)', unit: 'шт', price: 8000, category: 'earthing' },
        'spd_type2_1p': { name: 'УЗИП Класс II 1P (до 40кА)', unit: 'шт', price: 3000, category: 'earthing' },
        'spd_type2_3p': { name: 'УЗИП Класс II 3P+N (до 40кА)', unit: 'шт', price: 8000, category: 'earthing' },
        'spd_type3_1p': { name: 'УЗИП Класс III 1P (розеточный)', unit: 'шт', price: 1500, category: 'earthing' },
        'spd_data_rj45': { name: 'УЗИП для линий связи (RJ-45)', unit: 'шт', price: 2000, category: 'earthing' },
        'spd_tv_coax': { name: 'УЗИП для ТВ (коаксиал)', unit: 'шт', price: 1500, category: 'earthing' },

        // Выравнивание потенциалов
        'eq_bus_bath': { name: 'Шина уравнивания потенциалов для ванной', unit: 'шт', price: 500, category: 'earthing' },
        'eq_clamp_pipe': { name: 'Хомут уравнивания потенциалов на трубу', unit: 'шт', price: 200, category: 'earthing' }
    };
})();
