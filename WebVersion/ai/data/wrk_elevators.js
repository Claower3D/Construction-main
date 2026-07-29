// === ФАЗА 3: ЛИФТЫ, ЭСКАЛАТОРЫ, ПОДЪЁМНОЕ ОБОРУДОВАНИЕ, МУСОРОПРОВОД (110 поз.) ===
(function () {
    window.AI_WRK_ELEVATORS = {
        // === ПАССАЖИРСКИЕ ЛИФТЫ ===
        'wrk_lift_pass_400_5': { name: 'Лифт пассажирский 400кг / 5 остановок', unit: 'шт', price: 600000, category: 'elevators' },
        'wrk_lift_pass_400_9': { name: 'Лифт пассажирский 400кг / 9 остановок', unit: 'шт', price: 800000, category: 'elevators' },
        'wrk_lift_pass_400_16': { name: 'Лифт пассажирский 400кг / 16 остановок', unit: 'шт', price: 1200000, category: 'elevators' },
        'wrk_lift_pass_630_5': { name: 'Лифт пассажирский 630кг / 5 остановок', unit: 'шт', price: 700000, category: 'elevators' },
        'wrk_lift_pass_630_9': { name: 'Лифт пассажирский 630кг / 9 остановок', unit: 'шт', price: 900000, category: 'elevators' },
        'wrk_lift_pass_630_16': { name: 'Лифт пассажирский 630кг / 16 остановок', unit: 'шт', price: 1400000, category: 'elevators' },
        'wrk_lift_pass_1000_5': { name: 'Лифт пассажирский 1000кг / 5 остановок', unit: 'шт', price: 900000, category: 'elevators' },
        'wrk_lift_pass_1000_9': { name: 'Лифт пассажирский 1000кг / 9 остановок', unit: 'шт', price: 1200000, category: 'elevators' },
        'wrk_lift_pass_1000_16': { name: 'Лифт пассажирский 1000кг / 16 остановок', unit: 'шт', price: 1800000, category: 'elevators' },
        'wrk_lift_pass_1000_25': { name: 'Лифт пассажирский 1000кг / 25 остановок', unit: 'шт', price: 2500000, category: 'elevators' },
        // Грузовые лифты
        'wrk_lift_freight_1000': { name: 'Грузовой лифт 1000кг', unit: 'шт', price: 1000000, category: 'elevators' },
        'wrk_lift_freight_2000': { name: 'Грузовой лифт 2000кг', unit: 'шт', price: 1500000, category: 'elevators' },
        'wrk_lift_freight_3000': { name: 'Грузовой лифт 3000кг', unit: 'шт', price: 2000000, category: 'elevators' },
        'wrk_lift_freight_5000': { name: 'Грузовой лифт 5000кг', unit: 'шт', price: 3000000, category: 'elevators' },
        // Грузопассажирские
        'wrk_lift_service_630': { name: 'Грузопассажирский 630кг', unit: 'шт', price: 800000, category: 'elevators' },
        'wrk_lift_service_1000': { name: 'Грузопассажирский 1000кг', unit: 'шт', price: 1000000, category: 'elevators' },
        // Специальные
        'wrk_lift_panoramic': { name: 'Панорамный лифт', unit: 'шт', price: 2000000, category: 'elevators' },
        'wrk_lift_hospital': { name: 'Больничный лифт', unit: 'шт', price: 1500000, category: 'elevators' },
        'wrk_lift_dumbwaiter': { name: 'Кухонный лифт (малый грузовой)', unit: 'шт', price: 200000, category: 'elevators' },
        'wrk_lift_home_hydro': { name: 'Домашний лифт (гидравлический)', unit: 'шт', price: 500000, category: 'elevators' },
        'wrk_lift_home_electric': { name: 'Домашний лифт (электрический)', unit: 'шт', price: 600000, category: 'elevators' },
        'wrk_lift_home_vacuum': { name: 'Пневматический лифт', unit: 'шт', price: 400000, category: 'elevators' },
        // Отделка кабины
        'wrk_lift_cab_std': { name: 'Отделка кабины стандартная', unit: 'шт', price: 50000, category: 'elevators' },
        'wrk_lift_cab_premium': { name: 'Отделка кабины премиум', unit: 'шт', price: 150000, category: 'elevators' },
        'wrk_lift_cab_vip': { name: 'Отделка кабины VIP', unit: 'шт', price: 300000, category: 'elevators' },
        'wrk_lift_door_std': { name: 'Двери лифта стандартные', unit: 'этаж', price: 20000, category: 'elevators' },
        'wrk_lift_door_ss': { name: 'Двери лифта нержавейка', unit: 'этаж', price: 30000, category: 'elevators' },
        'wrk_lift_door_glass': { name: 'Двери лифта стеклянные', unit: 'этаж', price: 50000, category: 'elevators' },
        // Монтажные работы лифта
        'wrk_lift_shaft_constr': { name: 'Устройство шахты лифта', unit: 'этаж', price: 50000, category: 'elevators' },
        'wrk_lift_shaft_metal': { name: 'Металлоконструкция шахты', unit: 'этаж', price: 30000, category: 'elevators' },
        'wrk_lift_pit': { name: 'Приямок лифта', unit: 'шт', price: 20000, category: 'elevators' },
        'wrk_lift_machine_room': { name: 'Машинное помещение', unit: 'шт', price: 30000, category: 'elevators' },
        'wrk_lift_certification': { name: 'Сертификация и ввод в эксплуатацию', unit: 'шт', price: 10000, category: 'elevators' },

        // === ЭСКАЛАТОРЫ ===
        'wrk_esc_standard_3m': { name: 'Эскалатор (подъём 3м)', unit: 'шт', price: 2000000, category: 'elevators' },
        'wrk_esc_standard_6m': { name: 'Эскалатор (подъём 6м)', unit: 'шт', price: 3000000, category: 'elevators' },
        'wrk_esc_standard_9m': { name: 'Эскалатор (подъём 9м)', unit: 'шт', price: 4000000, category: 'elevators' },
        'wrk_esc_travelator_10': { name: 'Траволатор 10м', unit: 'шт', price: 1500000, category: 'elevators' },
        'wrk_esc_travelator_20': { name: 'Траволатор 20м', unit: 'шт', price: 2000000, category: 'elevators' },

        // === ПОДЪЁМНИКИ ДЛЯ ИНВАЛИДОВ ===
        'wrk_lift_disabled_vert': { name: 'Вертикальный подъёмник инвалидный', unit: 'шт', price: 200000, category: 'elevators' },
        'wrk_lift_disabled_incline': { name: 'Наклонный подъёмник инвалидный', unit: 'м.п.', price: 30000, category: 'elevators' },
        'wrk_lift_disabled_ramp': { name: 'Пандус стационарный', unit: 'м.п.', price: 3000, category: 'elevators' },
        'wrk_lift_disabled_ramp_fold': { name: 'Пандус складной', unit: 'шт', price: 5000, category: 'elevators' },
        'wrk_lift_disabled_ramp_rail': { name: 'Перила пандуса', unit: 'м.п.', price: 500, category: 'elevators' },

        // === СТРОИТЕЛЬНЫЕ ПОДЪЁМНИКИ ===
        'wrk_lift_constr_hoist': { name: 'Строительный подъёмник (монтаж)', unit: 'шт', price: 50000, category: 'elevators' },
        'wrk_lift_constr_crane_tower': { name: 'Башенный кран (монтаж)', unit: 'шт', price: 500000, category: 'elevators' },
        'wrk_lift_constr_scissor': { name: 'Ножничный подъёмник', unit: 'смена', price: 5000, category: 'elevators' },
        'wrk_lift_constr_boom': { name: 'Подъёмник стреловой', unit: 'смена', price: 8000, category: 'elevators' },

        // === МУСОРОПРОВОД ===
        'wrk_chute_pipe_400': { name: 'Мусоропровод Ø400мм', unit: 'этаж', price: 10000, category: 'elevators' },
        'wrk_chute_pipe_500': { name: 'Мусоропровод Ø500мм', unit: 'этаж', price: 12000, category: 'elevators' },
        'wrk_chute_door': { name: 'Загрузочный клапан мусоропровода', unit: 'шт', price: 3000, category: 'elevators' },
        'wrk_chute_camera': { name: 'Бункер-накопитель мусоропровода', unit: 'шт', price: 20000, category: 'elevators' },
        'wrk_chute_cleaning': { name: 'Промывочное устройство мусоропровода', unit: 'шт', price: 10000, category: 'elevators' }
    };
})();
