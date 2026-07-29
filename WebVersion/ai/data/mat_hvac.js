// === ВЕНТИЛЯЦИЯ И КОНДИЦИОНИРОВАНИЕ (40 позиций) ===
(function () {
    window.AI_MAT_HVAC = {
        // Воздуховоды жёсткие оцинкованные
        'duct_round_100': { name: 'Воздуховод круглый Ø100мм (1м)', unit: 'шт', price: 250, category: 'hvac' },
        'duct_round_125': { name: 'Воздуховод круглый Ø125мм (1м)', unit: 'шт', price: 300, category: 'hvac' },
        'duct_round_150': { name: 'Воздуховод круглый Ø150мм (1м)', unit: 'шт', price: 400, category: 'hvac' },
        'duct_round_200': { name: 'Воздуховод круглый Ø200мм (1м)', unit: 'шт', price: 600, category: 'hvac' },
        'duct_rect_60x120': { name: 'Воздуховод прямоуг. 60×120мм (1м)', unit: 'шт', price: 350, category: 'hvac' },
        'duct_rect_60x204': { name: 'Воздуховод прямоуг. 60×204мм (1м)', unit: 'шт', price: 500, category: 'hvac' },

        // Воздуховоды гибкие
        'duct_flex_100': { name: 'Воздуховод гибкий Ø100мм (7м)', unit: 'шт', price: 1500, category: 'hvac' },
        'duct_flex_125': { name: 'Воздуховод гибкий Ø125мм (7м)', unit: 'шт', price: 1800, category: 'hvac' },
        'duct_flex_150': { name: 'Воздуховод гибкий Ø150мм (7м)', unit: 'шт', price: 2200, category: 'hvac' },
        'duct_flex_insul_125': { name: 'Воздуховод гибкий утепл. Ø125мм (7м)', unit: 'шт', price: 3500, category: 'hvac' },

        // Фасонные элементы
        'duct_elbow_100_90': { name: 'Отвод 90° Ø100мм', unit: 'шт', price: 200, category: 'hvac' },
        'duct_elbow_125_90': { name: 'Отвод 90° Ø125мм', unit: 'шт', price: 250, category: 'hvac' },
        'duct_tee_100': { name: 'Тройник Ø100мм', unit: 'шт', price: 350, category: 'hvac' },
        'duct_tee_125': { name: 'Тройник Ø125мм', unit: 'шт', price: 450, category: 'hvac' },
        'duct_reducer_125_100': { name: 'Переход Ø125→Ø100мм', unit: 'шт', price: 180, category: 'hvac' },
        'duct_reducer_150_125': { name: 'Переход Ø150→Ø125мм', unit: 'шт', price: 220, category: 'hvac' },

        // Вентиляторы
        'fan_exhaust_100': { name: 'Вентилятор вытяжной Ø100мм', unit: 'шт', price: 2500, category: 'hvac' },
        'fan_exhaust_125': { name: 'Вентилятор вытяжной Ø125мм', unit: 'шт', price: 3500, category: 'hvac' },
        'fan_exhaust_150': { name: 'Вентилятор вытяжной Ø150мм', unit: 'шт', price: 4500, category: 'hvac' },
        'fan_exhaust_timer': { name: 'Вентилятор вытяжной с таймером Ø100', unit: 'шт', price: 4000, category: 'hvac' },
        'fan_exhaust_humidity': { name: 'Вентилятор вытяжной с датчиком влажности Ø100', unit: 'шт', price: 5500, category: 'hvac' },
        'fan_channel_125': { name: 'Вентилятор канальный Ø125мм', unit: 'шт', price: 6000, category: 'hvac' },
        'fan_channel_150': { name: 'Вентилятор канальный Ø150мм', unit: 'шт', price: 8000, category: 'hvac' },
        'fan_channel_200': { name: 'Вентилятор канальный Ø200мм', unit: 'шт', price: 12000, category: 'hvac' },

        // Решётки / клапаны
        'grille_150x150': { name: 'Решётка вентиляционная 150×150мм', unit: 'шт', price: 200, category: 'hvac' },
        'grille_200x200': { name: 'Решётка вентиляционная 200×200мм', unit: 'шт', price: 300, category: 'hvac' },
        'grille_250x250': { name: 'Решётка вентиляционная 250×250мм', unit: 'шт', price: 400, category: 'hvac' },
        'valve_check_100': { name: 'Обратный клапан Ø100мм', unit: 'шт', price: 250, category: 'hvac' },
        'valve_check_125': { name: 'Обратный клапан Ø125мм', unit: 'шт', price: 350, category: 'hvac' },
        'diffuser_round_125': { name: 'Диффузор круглый Ø125мм', unit: 'шт', price: 500, category: 'hvac' },
        'diffuser_round_160': { name: 'Диффузор круглый Ø160мм', unit: 'шт', price: 700, category: 'hvac' },

        // Рекуператоры
        'recuperator_wall_150': { name: 'Рекуператор стеновой (до 40м²)', unit: 'шт', price: 35000, category: 'hvac' },
        'recuperator_ahu_300': { name: 'Приточно-вытяжная установка 300м³/ч', unit: 'шт', price: 120000, category: 'hvac' },

        // Кондиционеры
        'ac_split_7': { name: 'Кондиционер сплит 7 (до 20м²)', unit: 'шт', price: 85000, category: 'hvac' },
        'ac_split_9': { name: 'Кондиционер сплит 9 (до 27м²)', unit: 'шт', price: 100000, category: 'hvac' },
        'ac_split_12': { name: 'Кондиционер сплит 12 (до 35м²)', unit: 'шт', price: 130000, category: 'hvac' },
        'ac_split_18': { name: 'Кондиционер сплит 18 (до 50м²)', unit: 'шт', price: 180000, category: 'hvac' },
        'ac_split_24': { name: 'Кондиционер сплит 24 (до 70м²)', unit: 'шт', price: 250000, category: 'hvac' },

        // Монтажные материалы
        'ac_pipe_set_3m': { name: 'Комплект труб для кондиционера (3м)', unit: 'шт', price: 5000, category: 'hvac' },
        'ac_pipe_set_5m': { name: 'Комплект труб для кондиционера (5м)', unit: 'шт', price: 7500, category: 'hvac' },
        'ac_drain_hose': { name: 'Шланг дренажный для кондиционера (1м)', unit: 'м', price: 150, category: 'hvac' }
    };
})();
