// === ЛИФТЫ И ПОДЪЁМНИКИ (20 позиций) ===
(function () {
    window.AI_MAT_ELEVATOR = {
        // Пассажирские лифты
        'elevator_pass_400kg_5fl': { name: 'Лифт пассажирский 400кг (5 этажей)', unit: 'шт', price: 3500000, category: 'elevator' },
        'elevator_pass_630kg_9fl': { name: 'Лифт пассажирский 630кг (9 этажей)', unit: 'шт', price: 5000000, category: 'elevator' },
        'elevator_pass_1000kg_16fl': { name: 'Лифт пассажирский 1000кг (16 этажей)', unit: 'шт', price: 8000000, category: 'elevator' },
        'elevator_pass_630_mrl': { name: 'Лифт безмашинный 630кг (MRL)', unit: 'шт', price: 6000000, category: 'elevator' },

        // Грузовые лифты
        'elevator_cargo_1000kg_5fl': { name: 'Лифт грузовой 1000кг (5 этажей)', unit: 'шт', price: 5000000, category: 'elevator' },
        'elevator_cargo_2000kg_5fl': { name: 'Лифт грузовой 2000кг (5 этажей)', unit: 'шт', price: 7000000, category: 'elevator' },

        // Грузовые подъёмники (мачтовые)
        'lift_mast_500kg': { name: 'Подъёмник мачтовый 500кг (12м)', unit: 'шт', price: 1500000, category: 'elevator' },
        'lift_mast_1000kg': { name: 'Подъёмник мачтовый 1000кг (24м)', unit: 'шт', price: 2500000, category: 'elevator' },

        // Подъёмники для инвалидов
        'lift_disabled_vertical': { name: 'Подъёмник для инвалидов вертикальный (3м)', unit: 'шт', price: 800000, category: 'elevator' },
        'lift_disabled_incline': { name: 'Подъёмник для инвалидов наклонный', unit: 'шт', price: 600000, category: 'elevator' },

        // Эскалаторы
        'escalator_3m': { name: 'Эскалатор (подъём 3м)', unit: 'шт', price: 8000000, category: 'elevator' },
        'escalator_6m': { name: 'Эскалатор (подъём 6м)', unit: 'шт', price: 12000000, category: 'elevator' },

        // Траволаторы
        'travelator_10m': { name: 'Траволатор горизонтальный (10м)', unit: 'шт', price: 5000000, category: 'elevator' },

        // Мини-лифты / сервисные
        'dumbwaiter_50kg': { name: 'Сервисный лифт (кухонный, 50кг)', unit: 'шт', price: 500000, category: 'elevator' },

        // Гидравлические подъёмники
        'lift_scissor_1t': { name: 'Подъёмник ножничный 1т (высота 3м)', unit: 'шт', price: 400000, category: 'elevator' },
        'lift_scissor_3t': { name: 'Подъёмник ножничный 3т (высота 1.5м)', unit: 'шт', price: 600000, category: 'elevator' },

        // Домашний лифт / коттедж
        'elevator_home_300kg_3fl': { name: 'Лифт коттеджный 300кг (3 этажа)', unit: 'шт', price: 2500000, category: 'elevator' },
        'elevator_home_vacuum': { name: 'Лифт пневматический (вакуумный, 2 этажа)', unit: 'шт', price: 3000000, category: 'elevator' },

        // Шахта лифта (комплектующие)
        'elevator_shaft_door': { name: 'Дверь шахтная (1 этаж)', unit: 'шт', price: 150000, category: 'elevator' },
        'elevator_guide_rail_5m': { name: 'Направляющая шахты лифта (5м)', unit: 'шт', price: 30000, category: 'elevator' }
    };
})();
