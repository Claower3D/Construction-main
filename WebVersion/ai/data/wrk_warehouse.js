// === СКЛАДСКОЕ ОБОРУДОВАНИЕ — стеллажи, ворота, рампы, конвейеры (48 поз.) ===
(function () {
    window.AI_WRK_WAREHOUSE = {
        // === СТЕЛЛАЖИ === 1-12
        'wrk_wh_rack_pallet_3': { name: 'Стеллаж паллетный (3 яруса)', unit: 'секция', price: 8500, category: 'warehouse' },
        'wrk_wh_rack_pallet_5': { name: 'Стеллаж паллетный (5 ярусов)', unit: 'секция', price: 12000, category: 'warehouse' },
        'wrk_wh_rack_pallet_7': { name: 'Стеллаж паллетный (7 ярусов)', unit: 'секция', price: 18000, category: 'warehouse' },
        'wrk_wh_rack_gravity': { name: 'Стеллаж гравитационный', unit: 'секция', price: 25000, category: 'warehouse' },
        'wrk_wh_rack_shuttle': { name: 'Стеллаж шаттл', unit: 'секция', price: 35000, category: 'warehouse' },
        'wrk_wh_rack_shelf': { name: 'Стеллаж полочный', unit: 'секция', price: 3500, category: 'warehouse' },
        'wrk_wh_rack_mezzanine': { name: 'Мезонин (2-й уровень)', unit: 'м²', price: 5500, category: 'warehouse' },
        'wrk_wh_rack_mobile': { name: 'Стеллаж передвижной', unit: 'секция', price: 25000, category: 'warehouse' },
        'wrk_wh_rack_asrs': { name: 'Автоматизированный стеллаж (ASRS)', unit: 'секция', price: 250000, category: 'warehouse' },
        'wrk_wh_rack_protector': { name: 'Защита стойки стеллажа', unit: 'шт', price: 550, category: 'warehouse' },
        // === ВОРОТА === 13-20
        'wrk_wh_door_sectional_5x5': { name: 'Ворота секционные 5×5м', unit: 'шт', price: 120000, category: 'warehouse' },
        'wrk_wh_door_rolling': { name: 'Ворота рулонные', unit: 'шт', price: 55000, category: 'warehouse' },
        'wrk_wh_door_rapid': { name: 'Ворота скоростные', unit: 'шт', price: 250000, category: 'warehouse' },
        'wrk_wh_door_strip': { name: 'ПВХ-завеса', unit: 'м²', price: 1500, category: 'warehouse' },
        'wrk_wh_door_fire': { name: 'Ворота противопожарные', unit: 'шт', price: 120000, category: 'warehouse' },
        // === РАМПЫ === 21-26
        'wrk_wh_dock_leveler_mech': { name: 'Уравнитель механический', unit: 'шт', price: 120000, category: 'warehouse' },
        'wrk_wh_dock_leveler_hydr': { name: 'Уравнитель гидравлический', unit: 'шт', price: 250000, category: 'warehouse' },
        'wrk_wh_dock_bumper': { name: 'Отбойник (докбампер)', unit: 'шт', price: 3500, category: 'warehouse' },
        'wrk_wh_ramp_mobile': { name: 'Рампа мобильная', unit: 'шт', price: 120000, category: 'warehouse' },
        'wrk_wh_ramp_stationary': { name: 'Рампа стационарная', unit: 'м.п.', price: 25000, category: 'warehouse' },
        // === КОНВЕЙЕРЫ === 27-32
        'wrk_wh_conveyor_roller': { name: 'Роликовый конвейер', unit: 'м.п.', price: 8500, category: 'warehouse' },
        'wrk_wh_conveyor_belt': { name: 'Ленточный конвейер', unit: 'м.п.', price: 12000, category: 'warehouse' },
        'wrk_wh_conveyor_chain': { name: 'Цепной конвейер', unit: 'м.п.', price: 15000, category: 'warehouse' },
        'wrk_wh_conveyor_spiral': { name: 'Спиральный конвейер', unit: 'шт', price: 550000, category: 'warehouse' },
        'wrk_wh_sorter': { name: 'Сортировочная система', unit: 'компл.', price: 2500000, category: 'warehouse' },
        'wrk_wh_turntable': { name: 'Поворотный стол (конвейер)', unit: 'шт', price: 55000, category: 'warehouse' },
        // === НАПОЛЬНОЕ === 33-38
        'wrk_wh_floor_marking': { name: 'Разметка пола склада', unit: 'м.п.', price: 55, category: 'warehouse' },
        'wrk_wh_barrier_flex': { name: 'Барьер гибкий', unit: 'м.п.', price: 3500, category: 'warehouse' },
        'wrk_wh_barrier_steel': { name: 'Барьер стальной', unit: 'м.п.', price: 2500, category: 'warehouse' },
        'wrk_wh_charger_ev': { name: 'Зарядная станция погрузчиков', unit: 'шт', price: 55000, category: 'warehouse' },
        'wrk_wh_pallet_wrap': { name: 'Паллетоупаковщик', unit: 'шт', price: 250000, category: 'warehouse' },
        // === ИНЖЕНЕРИЯ СКЛАДА === 39-44
        'wrk_wh_light_led_hl': { name: 'Промышленный LED светильник', unit: 'шт', price: 5500, category: 'warehouse' },
        'wrk_wh_fan_hvls': { name: 'Вентилятор HVLS (потолочный)', unit: 'шт', price: 250000, category: 'warehouse' },
        'wrk_wh_heater_infrared': { name: 'Инфракрасный обогреватель', unit: 'шт', price: 15000, category: 'warehouse' },
        'wrk_wh_air_curtain': { name: 'Тепловая завеса', unit: 'шт', price: 15000, category: 'warehouse' },
        'wrk_wh_dehumidifier': { name: 'Промышленный осушитель', unit: 'шт', price: 55000, category: 'warehouse' },
        'wrk_wh_sprinkler_zone': { name: 'Зона спринклерного тушения', unit: 'м²', price: 250, category: 'warehouse' },
        // === WMS === 45-48
        'wrk_wh_wms_license': { name: 'WMS-система (лицензия)', unit: 'пользователь', price: 25000, category: 'warehouse' },
        'wrk_wh_barcode_printer': { name: 'Принтер этикеток', unit: 'шт', price: 15000, category: 'warehouse' },
        'wrk_wh_scanner': { name: 'Сканер штрихкодов (ТСД)', unit: 'шт', price: 25000, category: 'warehouse' },
        'wrk_wh_rfid_gate': { name: 'RFID-ворота (инвентаризация)', unit: 'шт', price: 120000, category: 'warehouse' }
    };
})();
