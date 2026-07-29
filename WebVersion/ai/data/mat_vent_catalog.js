// === КАТАЛОГ БЫТОВОЙ ВЕНТИЛЯЦИИ И КЛИМАТА — ОЧИЩЕННЫЙ (без дублей с mat_hvac.js и mat_kitchen.js) ===
// mat_hvac.js содержит: оцинков. воздуховоды (круглые/прямоуг.), гибкие воздуховоды, фасонные элементы,
// вентиляторы (вытяжные Ø100-150 вкл. с таймером/влажн., канальные Ø125-200),
// решётки (150-250), клапаны, диффузоры, рекуператоры, кондиционеры (сплит 7-24), монтажные трубы
// mat_kitchen.js содержит: вытяжки (плоская/купольная 60/встраив./островная)
(function () {
    window.AI_MAT_VENT_CATALOG = {
        // Вентиляторы — тихие и с гигростатом (в mat_hvac только стандарт/таймер/влажность)
        'fan_exhaust_100_silent': { name: 'Вентилятор вытяжной Ø100мм тихий (26дБ)', unit: 'шт', price: 1000, category: 'vent_catalog' },
        'fan_exhaust_120_std': { name: 'Вентилятор вытяжной Ø120мм стандарт', unit: 'шт', price: 600, category: 'vent_catalog' },
        'fan_exhaust_120_silent': { name: 'Вентилятор вытяжной Ø120мм тихий', unit: 'шт', price: 1200, category: 'vent_catalog' },
        'fan_exhaust_150_silent': { name: 'Вентилятор вытяжной Ø150мм тихий', unit: 'шт', price: 1500, category: 'vent_catalog' },
        // Канальный Ø250 (в mat_hvac нет)
        'fan_duct_250_inline': { name: 'Вентилятор канальный Ø250мм', unit: 'шт', price: 5000, category: 'vent_catalog' },
        // Рекуператоры бытовые — детализация (mat_hvac: стеновой до 40м², ПВУ 300м³/ч)
        'recuperator_wall_60': { name: 'Рекуператор стеновой 60м³/ч', unit: 'шт', price: 10000, category: 'vent_catalog' },
        'recuperator_wall_100': { name: 'Рекуператор стеновой 100м³/ч', unit: 'шт', price: 15000, category: 'vent_catalog' },
        'recuperator_decentralized': { name: 'Рекуператор децентрализов. реверсивный', unit: 'шт', price: 20000, category: 'vent_catalog' },
        // Бризеры / приточные клапаны (уникальная категория)
        'breezer_100_basic': { name: 'Бризер 100м³/ч (базовый)', unit: 'шт', price: 15000, category: 'vent_catalog' },
        'breezer_100_hepa': { name: 'Бризер 100м³/ч с HEPA', unit: 'шт', price: 25000, category: 'vent_catalog' },
        'breezer_140_premium': { name: 'Бризер 140м³/ч премиум', unit: 'шт', price: 40000, category: 'vent_catalog' },
        'supply_valve_wall_15': { name: 'Приточный клапан стеновой Ø125мм', unit: 'шт', price: 500, category: 'vent_catalog' },
        'supply_valve_wall_40': { name: 'Приточный клапан стеновой регулируемый', unit: 'шт', price: 1000, category: 'vent_catalog' },
        // Вытяжки — только уникальные модели (нет в mat_kitchen/mat_hvac)
        'hood_flat_500': { name: 'Вытяжка плоская 500мм', unit: 'шт', price: 5000, category: 'vent_catalog' },
        'hood_dome_900': { name: 'Вытяжка купольная 900мм', unit: 'шт', price: 15000, category: 'vent_catalog' },
        'hood_telescopic_600': { name: 'Вытяжка встраиваемая телескоп. 600мм', unit: 'шт', price: 8000, category: 'vent_catalog' },
        'hood_inclined_600': { name: 'Вытяжка наклонная 600мм', unit: 'шт', price: 12000, category: 'vent_catalog' },
        'hood_inclined_900': { name: 'Вытяжка наклонная 900мм', unit: 'шт', price: 18000, category: 'vent_catalog' },
        // Инверторные сплит-системы (mat_hvac содержит только стандартные)
        'ac_split_inv_9000btu': { name: 'Сплит-система инверторная 9000BTU', unit: 'шт', price: 50000, category: 'vent_catalog' },
        'ac_split_inv_12000btu': { name: 'Сплит-система инверторная 12000BTU', unit: 'шт', price: 65000, category: 'vent_catalog' },
        'ac_split_inv_18000btu': { name: 'Сплит-система инверторная 18000BTU', unit: 'шт', price: 85000, category: 'vent_catalog' },
        'ac_split_inv_24000btu': { name: 'Сплит-система инверторная 24000BTU', unit: 'шт', price: 110000, category: 'vent_catalog' },
        // Мобильные кондиционеры (уникальная категория)
        'ac_mobile_9000btu': { name: 'Кондиционер мобильный 9000BTU', unit: 'шт', price: 20000, category: 'vent_catalog' },
        'ac_mobile_12000btu': { name: 'Кондиционер мобильный 12000BTU', unit: 'шт', price: 30000, category: 'vent_catalog' },
        // Мульти-сплит (уникальная категория)
        'ac_multi_2_out': { name: 'Мульти-сплит наружный блок на 2', unit: 'шт', price: 80000, category: 'vent_catalog' },
        'ac_multi_3_out': { name: 'Мульти-сплит наружный блок на 3', unit: 'шт', price: 120000, category: 'vent_catalog' },
        'ac_multi_inner_wall_9k': { name: 'Мульти-сплит внутр. блок настенный 9000BTU', unit: 'шт', price: 20000, category: 'vent_catalog' },
        // Монтажные комплектующие кондиционеров — детализация
        'ac_pipe_1_4_3m': { name: 'Трубка медная 1/4" (3м)', unit: 'шт', price: 300, category: 'vent_catalog' },
        'ac_pipe_3_8_3m': { name: 'Трубка медная 3/8" (3м)', unit: 'шт', price: 400, category: 'vent_catalog' },
        'ac_pipe_1_2_3m': { name: 'Трубка медная 1/2" (3м)', unit: 'шт', price: 500, category: 'vent_catalog' },
        'ac_pipe_insul_1_4': { name: 'Изоляция для трубки 1/4" (2м)', unit: 'шт', price: 50, category: 'vent_catalog' },
        'ac_pipe_insul_3_8': { name: 'Изоляция для трубки 3/8" (2м)', unit: 'шт', price: 60, category: 'vent_catalog' },
        'ac_drain_16x20_25m': { name: 'Дренаж для кондиционера 16×20мм (25м)', unit: 'бухта', price: 300, category: 'vent_catalog' },
        'ac_bracket_450': { name: 'Кронштейн для наружного блока 450мм', unit: 'компл.', price: 500, category: 'vent_catalog' },
        'ac_bracket_600': { name: 'Кронштейн для наружного блока 600мм', unit: 'компл.', price: 700, category: 'vent_catalog' },
        // ПВХ воздуховоды бытовые (mat_hvac — оцинковка промышленная, разные ценовые категории)
        'duct_pvc_round_100_1m': { name: 'Воздуховод ПВХ круглый Ø100мм (1м)', unit: 'шт', price: 50, category: 'vent_catalog' },
        'duct_pvc_round_125_1m': { name: 'Воздуховод ПВХ круглый Ø125мм (1м)', unit: 'шт', price: 70, category: 'vent_catalog' },
        'duct_pvc_flat_60x120_1m': { name: 'Воздуховод ПВХ плоский 60×120мм (1м)', unit: 'шт', price: 100, category: 'vent_catalog' },
        'duct_pvc_flat_60x204_1m': { name: 'Воздуховод ПВХ плоский 60×204мм (1м)', unit: 'шт', price: 150, category: 'vent_catalog' },
        // Колпаки наружные (уникальная)
        'grille_wall_cap_100': { name: 'Колпак наружный стеновой Ø100мм', unit: 'шт', price: 100, category: 'vent_catalog' },
        'grille_wall_cap_150': { name: 'Колпак наружный стеновой Ø150мм', unit: 'шт', price: 150, category: 'vent_catalog' }
    };
})();
