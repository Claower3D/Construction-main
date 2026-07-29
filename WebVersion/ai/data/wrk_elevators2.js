// === ЛИФТОВОЕ ОБОРУДОВАНИЕ ПОЛН — пассажирские, грузовые, эскалаторы, подъёмники (50 поз.) ===
(function () {
    window.AI_WRK_ELEVATORS2 = {
        // === ПАССАЖИРСКИЕ ЛИФТЫ === 1-10
        'wrk_elv2_pass_400_5': { name: 'Лифт пассажирский 400кг (5 ост.)', unit: 'шт', price: 2500000, category: 'elevators2' },
        'wrk_elv2_pass_400_10': { name: 'Лифт пассажирский 400кг (10 ост.)', unit: 'шт', price: 3500000, category: 'elevators2' },
        'wrk_elv2_pass_630_10': { name: 'Лифт пассажирский 630кг (10 ост.)', unit: 'шт', price: 4500000, category: 'elevators2' },
        'wrk_elv2_pass_630_16': { name: 'Лифт пассажирский 630кг (16 ост.)', unit: 'шт', price: 5500000, category: 'elevators2' },
        'wrk_elv2_pass_1000_10': { name: 'Лифт пассажирский 1000кг (10 ост.)', unit: 'шт', price: 5500000, category: 'elevators2' },
        'wrk_elv2_pass_1000_20': { name: 'Лифт пассажирский 1000кг (20 ост.)', unit: 'шт', price: 8500000, category: 'elevators2' },
        'wrk_elv2_pass_premium': { name: 'Лифт премиум (зеркало/дерево)', unit: 'шт', price: 8500000, category: 'elevators2' },
        'wrk_elv2_pass_panoramic': { name: 'Лифт панорамный (стекло)', unit: 'шт', price: 12000000, category: 'elevators2' },
        'wrk_elv2_pass_cottage': { name: 'Лифт коттеджный (2-3 ост.)', unit: 'шт', price: 1500000, category: 'elevators2' },
        'wrk_elv2_pass_hospital': { name: 'Лифт больничный', unit: 'шт', price: 5500000, category: 'elevators2' },
        // === ГРУЗОВЫЕ ЛИФТЫ === 11-16
        'wrk_elv2_cargo_500': { name: 'Грузовой лифт 500кг', unit: 'шт', price: 2500000, category: 'elevators2' },
        'wrk_elv2_dumbwaiter_100': { name: 'Малый грузовой 100кг', unit: 'шт', price: 850000, category: 'elevators2' },
        'wrk_elv2_dumbwaiter_250': { name: 'Малый грузовой 250кг', unit: 'шт', price: 1200000, category: 'elevators2' },
        // === ШАХТА ЛИФТА === 17-24
        'wrk_elv2_shaft_rc': { name: 'Шахта ж/б (1 этаж)', unit: 'этаж', price: 250000, category: 'elevators2' },
        'wrk_elv2_shaft_steel': { name: 'Шахта металлокаркас (1 этаж)', unit: 'этаж', price: 180000, category: 'elevators2' },
        'wrk_elv2_shaft_glass': { name: 'Шахта стеклянная (1 этаж)', unit: 'этаж', price: 350000, category: 'elevators2' },
        'wrk_elv2_guide_rails': { name: 'Направляющие (1 этаж)', unit: 'этаж', price: 25000, category: 'elevators2' },
        'wrk_elv2_door_landing': { name: 'Дверь шахтная (этажная)', unit: 'шт', price: 55000, category: 'elevators2' },
        'wrk_elv2_buffer': { name: 'Буфер лифтовый', unit: 'компл.', price: 15000, category: 'elevators2' },
        // === ЭСКАЛАТОРЫ / ТРАВОЛАТОРЫ === 25-30
        'wrk_elv2_escalator_3': { name: 'Эскалатор (h до 3м)', unit: 'шт', price: 5500000, category: 'elevators2' },
        'wrk_elv2_escalator_6': { name: 'Эскалатор (h до 6м)', unit: 'шт', price: 8500000, category: 'elevators2' },
        'wrk_elv2_escalator_metro': { name: 'Эскалатор для метро', unit: 'шт', price: 25000000, category: 'elevators2' },
        'wrk_elv2_travelator_10': { name: 'Траволатор (L до 10м)', unit: 'шт', price: 3500000, category: 'elevators2' },
        'wrk_elv2_travelator_30': { name: 'Траволатор (L до 30м)', unit: 'шт', price: 5500000, category: 'elevators2' },
        'wrk_elv2_travelator_incl': { name: 'Траволатор наклонный', unit: 'шт', price: 5500000, category: 'elevators2' },
        // === ПОДЪЁМНИКИ === 31-38
        'wrk_elv2_plat_disabled': { name: 'Подъёмник для инвалидов', unit: 'шт', price: 550000, category: 'elevators2' },
        'wrk_elv2_plat_stair': { name: 'Подъёмник лестничный', unit: 'шт', price: 350000, category: 'elevators2' },
        'wrk_elv2_scissor_500': { name: 'Ножничный подъёмник 500кг', unit: 'шт', price: 350000, category: 'elevators2' },
        'wrk_elv2_scissor_2000': { name: 'Ножничный подъёмник 2000кг', unit: 'шт', price: 850000, category: 'elevators2' },
        'wrk_elv2_car_lift': { name: 'Автомобильный подъёмник', unit: 'шт', price: 2500000, category: 'elevators2' },
        'wrk_elv2_mast_300': { name: 'Мачтовый подъёмник 300кг', unit: 'шт', price: 550000, category: 'elevators2' },
        'wrk_elv2_dock_leveler': { name: 'Доковый уравнитель', unit: 'шт', price: 250000, category: 'elevators2' },
        'wrk_elv2_table_lift': { name: 'Подъёмный стол гидравлический', unit: 'шт', price: 120000, category: 'elevators2' },
        // === МОДЕРНИЗАЦИЯ === 39-44
        'wrk_elv2_mod_control': { name: 'Модернизация СУ лифта', unit: 'шт', price: 550000, category: 'elevators2' },
        'wrk_elv2_mod_doors': { name: 'Замена дверей лифта', unit: 'этаж', price: 55000, category: 'elevators2' },
        'wrk_elv2_mod_cabin': { name: 'Замена кабины', unit: 'шт', price: 350000, category: 'elevators2' },
        'wrk_elv2_mod_drive': { name: 'Замена привода', unit: 'шт', price: 550000, category: 'elevators2' },
        'wrk_elv2_mod_ropes': { name: 'Замена канатов', unit: 'компл.', price: 85000, category: 'elevators2' },
        // === ПНР === 45-50
        'wrk_elv2_commissioning': { name: 'ПНР лифта', unit: 'шт', price: 120000, category: 'elevators2' },
        'wrk_elv2_inspection': { name: 'Техническое освидетельствование', unit: 'шт', price: 55000, category: 'elevators2' },
        'wrk_elv2_load_test': { name: 'Нагрузочные испытания', unit: 'шт', price: 25000, category: 'elevators2' },
        'wrk_elv2_dispatch': { name: 'Диспетчеризация лифтов', unit: 'лифт', price: 55000, category: 'elevators2' },
        'wrk_elv2_intercom': { name: 'Связь в лифте', unit: 'шт', price: 8500, category: 'elevators2' },
        'wrk_elv2_monitoring': { name: 'Мониторинг лифтов (IoT)', unit: 'компл.', price: 120000, category: 'elevators2' }
    };
})();
