// === БЕТОН, РАСТВОР, ДОБАВКИ (40 позиций) ===
(function () {
    window.AI_MAT_CONCRETE = {
        // Тяжёлый бетон по маркам
        'concrete_m100': { name: 'Бетон М100 (В7.5)', unit: 'м³', price: 20000, category: 'concrete' },
        'concrete_m150': { name: 'Бетон М150 (В10)', unit: 'м³', price: 22000, category: 'concrete' },
        'concrete_m200': { name: 'Бетон М200 (В15)', unit: 'м³', price: 24000, category: 'concrete' },
        'concrete_m250': { name: 'Бетон М250 (В20)', unit: 'м³', price: 26000, category: 'concrete' },
        'concrete_m300': { name: 'Бетон М300 (В22.5)', unit: 'м³', price: 28000, category: 'concrete' },
        'concrete_m350': { name: 'Бетон М350 (В25)', unit: 'м³', price: 30000, category: 'concrete' },
        'concrete_m400': { name: 'Бетон М400 (В30)', unit: 'м³', price: 33000, category: 'concrete' },
        'concrete_m450': { name: 'Бетон М450 (В35)', unit: 'м³', price: 36000, category: 'concrete' },
        'concrete_m500': { name: 'Бетон М500 (В40)', unit: 'м³', price: 40000, category: 'concrete' },
        'concrete_m600': { name: 'Бетон М600 (В45)', unit: 'м³', price: 45000, category: 'concrete' },

        // Лёгкие бетоны
        'concrete_keramzit_m150': { name: 'Керамзитобетон М150', unit: 'м³', price: 18000, category: 'concrete' },
        'concrete_keramzit_m200': { name: 'Керамзитобетон М200', unit: 'м³', price: 20000, category: 'concrete' },
        'concrete_penobeton_d600': { name: 'Пенобетон D600', unit: 'м³', price: 16000, category: 'concrete' },

        // Мелкозернистый бетон
        'concrete_fine_m200': { name: 'Мелкозернистый бетон М200', unit: 'м³', price: 25000, category: 'concrete' },
        'concrete_fine_m300': { name: 'Мелкозернистый бетон М300', unit: 'м³', price: 29000, category: 'concrete' },

        // Пескобетон
        'peskobeton_m200': { name: 'Пескобетон М200 (50кг)', unit: 'мешок', price: 1200, category: 'concrete' },
        'peskobeton_m300': { name: 'Пескобетон М300 (50кг)', unit: 'мешок', price: 1400, category: 'concrete' },

        // Растворы
        'mortar_m50': { name: 'Раствор кладочный М50', unit: 'м³', price: 14000, category: 'concrete' },
        'mortar_m75': { name: 'Раствор кладочный М75', unit: 'м³', price: 15500, category: 'concrete' },
        'mortar_m100': { name: 'Раствор кладочный М100', unit: 'м³', price: 17000, category: 'concrete' },
        'mortar_m150': { name: 'Раствор кладочный М150', unit: 'м³', price: 19000, category: 'concrete' },
        'mortar_m200': { name: 'Раствор кладочный М200', unit: 'м³', price: 21000, category: 'concrete' },
        'mortar_plaster_m50': { name: 'Раствор штукатурный М50', unit: 'м³', price: 13000, category: 'concrete' },
        'mortar_plaster_m100': { name: 'Раствор штукатурный М100', unit: 'м³', price: 16000, category: 'concrete' },

        // Добавки в бетон
        'additive_plasticizer': { name: 'Пластификатор С-3 (25кг)', unit: 'кг', price: 280, category: 'concrete' },
        'additive_antifreeze': { name: 'Противоморозная добавка (25кг)', unit: 'кг', price: 180, category: 'concrete' },
        'additive_accelerator': { name: 'Ускоритель твердения (25кг)', unit: 'кг', price: 350, category: 'concrete' },
        'additive_fiber_pp': { name: 'Фибра полипропиленовая (12мм)', unit: 'кг', price: 800, category: 'concrete' },
        'additive_fiber_steel': { name: 'Фибра стальная анкерная', unit: 'кг', price: 450, category: 'concrete' },
        'additive_waterproof': { name: 'Гидрофобизирующая добавка', unit: 'кг', price: 320, category: 'concrete' },

        // Сухие смеси на основе цемента
        'mix_universal_m150': { name: 'Сухая смесь М150 универсальная (50кг)', unit: 'мешок', price: 900, category: 'concrete' },
        'mix_universal_m200': { name: 'Сухая смесь М200 универсальная (50кг)', unit: 'мешок', price: 1050, category: 'concrete' },
        'mix_floor_m300': { name: 'Смесь для стяжки М300 (50кг)', unit: 'мешок', price: 1300, category: 'concrete' },

        // Бетон с насосной подачей
        'concrete_m200_pump': { name: 'Бетон М200 (с подачей насосом)', unit: 'м³', price: 27000, category: 'concrete' },
        'concrete_m300_pump': { name: 'Бетон М300 (с подачей насосом)', unit: 'м³', price: 31000, category: 'concrete' },

        // Товарный бетон специальный
        'concrete_sulfate_m300': { name: 'Бетон сульфатостойкий М300', unit: 'м³', price: 34000, category: 'concrete' },
        'concrete_hydro_m400': { name: 'Бетон гидротехнический М400', unit: 'м³', price: 42000, category: 'concrete' },
        'concrete_fast_m300': { name: 'Бетон быстротвердеющий М300', unit: 'м³', price: 35000, category: 'concrete' },

        // Цементное молочко / контактный слой
        'cement_milk': { name: 'Цементное молочко', unit: 'л', price: 50, category: 'concrete' },
        'concrete_contact': { name: 'Бетоноконтакт (20кг)', unit: 'ведро', price: 3500, category: 'concrete' }
    };
})();
