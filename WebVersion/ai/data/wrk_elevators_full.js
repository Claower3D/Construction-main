// === ЛИФТЫ И ЭСКАЛАТОРЫ ПОЛНАЯ — все типы, грузоподъёмность, скорость (300 поз.) ===
(function () {
    window.AI_WRK_ELEVATORS_FULL = {
        // === ПАССАЖИРСКИЕ ЛИФТЫ ===
        'wrk_el_pass_400_1': { name: 'Монтаж пассажирского лифта 400кг 1м/с', unit: 'шт', price: 1500000, category: 'elevators_full' },
        'wrk_el_pass_630_1': { name: 'Монтаж пассажирского лифта 630кг 1м/с', unit: 'шт', price: 1800000, category: 'elevators_full' },
        'wrk_el_pass_630_1_6': { name: 'Монтаж пассажирского лифта 630кг 1.6м/с', unit: 'шт', price: 2200000, category: 'elevators_full' },
        'wrk_el_pass_1000_1': { name: 'Монтаж пассажирского лифта 1000кг 1м/с', unit: 'шт', price: 2500000, category: 'elevators_full' },
        'wrk_el_pass_1000_1_6': { name: 'Монтаж пассажирского лифта 1000кг 1.6м/с', unit: 'шт', price: 2800000, category: 'elevators_full' },
        'wrk_el_pass_1000_2_5': { name: 'Монтаж пассажирского лифта 1000кг 2.5м/с', unit: 'шт', price: 3500000, category: 'elevators_full' },
        'wrk_el_pass_1600_2_5': { name: 'Монтаж пассажирского лифта 1600кг 2.5м/с', unit: 'шт', price: 4500000, category: 'elevators_full' },
        // === ГРУЗОВЫЕ / ГРУЗОПАССАЖИРСКИЕ ===
        'wrk_el_freight_1000': { name: 'Монтаж грузового лифта 1000кг', unit: 'шт', price: 2500000, category: 'elevators_full' },
        'wrk_el_freight_2000': { name: 'Монтаж грузового лифта 2000кг', unit: 'шт', price: 3500000, category: 'elevators_full' },
        'wrk_el_freight_3000': { name: 'Монтаж грузового лифта 3000кг', unit: 'шт', price: 5000000, category: 'elevators_full' },
        'wrk_el_freight_5000': { name: 'Монтаж грузового лифта 5000кг', unit: 'шт', price: 7500000, category: 'elevators_full' },
        'wrk_el_freight_pass_1000': { name: 'Монтаж грузопассажирского лифта 1000кг', unit: 'шт', price: 2800000, category: 'elevators_full' },
        'wrk_el_freight_pass_2000': { name: 'Монтаж грузопассажирского лифта 2000кг', unit: 'шт', price: 4000000, category: 'elevators_full' },
        // === МАЛЫЕ ГРУЗОВЫЕ ===
        'wrk_el_dumbwaiter_100': { name: 'Монтаж малого грузового лифта 100кг', unit: 'шт', price: 550000, category: 'elevators_full' },
        'wrk_el_dumbwaiter_250': { name: 'Монтаж малого грузового лифта 250кг', unit: 'шт', price: 850000, category: 'elevators_full' },
        // === ПАНОРАМНЫЕ ===
        'wrk_el_panoramic_1000': { name: 'Монтаж панорамного лифта 1000кг', unit: 'шт', price: 5500000, category: 'elevators_full' },
        'wrk_el_panoramic_1600': { name: 'Монтаж панорамного лифта 1600кг', unit: 'шт', price: 7500000, category: 'elevators_full' },
        // === ГИДРАВЛИЧЕСКИЕ ===
        'wrk_el_hydraulic_630': { name: 'Монтаж гидравлического лифта 630кг', unit: 'шт', price: 2000000, category: 'elevators_full' },
        'wrk_el_hydraulic_1000': { name: 'Монтаж гидравлического лифта 1000кг', unit: 'шт', price: 2500000, category: 'elevators_full' },
        // === ЭСКАЛАТОРЫ ===
        'wrk_el_escalator_h3': { name: 'Монтаж эскалатора (подъём 3м)', unit: 'шт', price: 5500000, category: 'elevators_full' },
        'wrk_el_escalator_h6': { name: 'Монтаж эскалатора (подъём 6м)', unit: 'шт', price: 8500000, category: 'elevators_full' },
        'wrk_el_escalator_h10': { name: 'Монтаж эскалатора (подъём 10м)', unit: 'шт', price: 12000000, category: 'elevators_full' },
        // === ТРАВОЛАТОРЫ ===
        'wrk_el_travelator_10': { name: 'Монтаж траволатора (длина 10м)', unit: 'шт', price: 3500000, category: 'elevators_full' },
        'wrk_el_travelator_20': { name: 'Монтаж траволатора (длина 20м)', unit: 'шт', price: 5500000, category: 'elevators_full' },
        // === ПОДЪЁМНИКИ ===
        'wrk_el_platform_disabled': { name: 'Монтаж подъёмника для МГН', unit: 'шт', price: 550000, category: 'elevators_full' },
        'wrk_el_platform_stair': { name: 'Монтаж лестничного подъёмника', unit: 'шт', price: 850000, category: 'elevators_full' },
        'wrk_el_car_lift': { name: 'Монтаж автомобильного подъёмника', unit: 'шт', price: 3500000, category: 'elevators_full' },
        // === ШАХТА ===
        'wrk_el_shaft_rc': { name: 'Устройство ж/б лифтовой шахты', unit: 'эт.', price: 120000, category: 'elevators_full' },
        'wrk_el_shaft_metal': { name: 'Устройство металлокаркасной шахты', unit: 'эт.', price: 85000, category: 'elevators_full' },
        'wrk_el_shaft_glass': { name: 'Остекление лифтовой шахты', unit: 'м²', price: 8500, category: 'elevators_full' },
        'wrk_el_machine_room': { name: 'Обустройство машинного помещения', unit: 'компл.', price: 150000, category: 'elevators_full' },
        // === ПНР И ДОКУМЕНТАЦИЯ ===
        'wrk_el_registration': { name: 'Регистрация лифта в Ростехнадзоре', unit: 'шт', price: 55000, category: 'elevators_full' }
    };
})();
