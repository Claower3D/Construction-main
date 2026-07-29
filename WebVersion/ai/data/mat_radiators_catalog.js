// === КАТАЛОГ РАДИАТОРОВ — ТОЛЬКО УНИКАЛЬНЫЕ ПОЗИЦИИ (без дублей с mat_heating.js) ===
// mat_heating.js уже содержит: радиаторы (alu/bimetal секционные), стальные панельные 22/11, котлы,
// тёплый пол водяной+электрический, насосы, расш.баки, безопасность, дымоходы, теплоноситель, конвекторы
(function () {
    window.AI_MAT_RADIATORS_CATALOG = {
        // Радиаторы биметаллические — готовые сборки (в mat_heating только секции)
        'radiator_bimetal_350_4s': { name: 'Радиатор биметалл. 350мм 4 секции (готовый)', unit: 'шт', price: 2500, category: 'radiators_catalog' },
        'radiator_bimetal_350_6s': { name: 'Радиатор биметалл. 350мм 6 секций (готовый)', unit: 'шт', price: 3500, category: 'radiators_catalog' },
        'radiator_bimetal_350_8s': { name: 'Радиатор биметалл. 350мм 8 секций (готовый)', unit: 'шт', price: 4500, category: 'radiators_catalog' },
        'radiator_bimetal_500_14s': { name: 'Радиатор биметалл. 500мм 14 секций (готовый)', unit: 'шт', price: 10500, category: 'radiators_catalog' },
        // Радиаторы стальные 33 тип (mat_heating не содержит тип 33)
        'radiator_steel_33_500x1000': { name: 'Радиатор стальной тип 33 500×1000мм', unit: 'шт', price: 12000, category: 'radiators_catalog' },
        'radiator_steel_33_500x1200': { name: 'Радиатор стальной тип 33 500×1200мм', unit: 'шт', price: 15000, category: 'radiators_catalog' },
        // Конвекторы напольные (mat_heating содержит электрические и внутрипольный)
        'convector_floor_1000': { name: 'Конвектор напольный водяной 1000мм', unit: 'шт', price: 8000, category: 'radiators_catalog' },
        'convector_floor_1500': { name: 'Конвектор напольный водяной 1500мм', unit: 'шт', price: 12000, category: 'radiators_catalog' },
        'convector_infl_1500': { name: 'Конвектор внутрипольный 1500мм', unit: 'шт', price: 22000, category: 'radiators_catalog' },
        'convector_infl_2000': { name: 'Конвектор внутрипольный 2000мм', unit: 'шт', price: 30000, category: 'radiators_catalog' },
        // Полотенцесушители (уникальная категория)
        'towel_rail_ladder_500x800': { name: 'Полотенцесушитель «лесенка» 500×800мм', unit: 'шт', price: 3000, category: 'radiators_catalog' },
        'towel_rail_ladder_500x1000': { name: 'Полотенцесушитель «лесенка» 500×1000мм', unit: 'шт', price: 4000, category: 'radiators_catalog' },
        'towel_rail_mshape': { name: 'Полотенцесушитель М-образный', unit: 'шт', price: 2000, category: 'radiators_catalog' },
        'towel_rail_ushape': { name: 'Полотенцесушитель П-образный', unit: 'шт', price: 1500, category: 'radiators_catalog' },
        'towel_rail_electric_500x800': { name: 'Полотенцесушитель электрический 500×800мм', unit: 'шт', price: 5000, category: 'radiators_catalog' },
        // Обогреватели (уникальная категория — mat_heating не содержит)
        'heater_infrared_1kw': { name: 'Обогреватель инфракрасный 1кВт', unit: 'шт', price: 2000, category: 'radiators_catalog' },
        'heater_infrared_2kw': { name: 'Обогреватель инфракрасный 2кВт', unit: 'шт', price: 4000, category: 'radiators_catalog' },
        'heater_oil_2kw': { name: 'Обогреватель масляный 2кВт', unit: 'шт', price: 3000, category: 'radiators_catalog' },
        'heater_ceramic_wall': { name: 'Обогреватель керамический настенный', unit: 'шт', price: 5000, category: 'radiators_catalog' },
        'heater_fan_2kw': { name: 'Тепловентилятор 2кВт', unit: 'шт', price: 1500, category: 'radiators_catalog' },
        'heater_curtain_6kw': { name: 'Тепловая завеса 6кВт (0.9м)', unit: 'шт', price: 8000, category: 'radiators_catalog' },
        'heater_curtain_9kw': { name: 'Тепловая завеса 9кВт (1.2м)', unit: 'шт', price: 12000, category: 'radiators_catalog' },
        // Терморегулятор Wi-Fi (mat_heating содержит механ. и програм.)
        'floor_heat_thermostat_wifi': { name: 'Терморегулятор для тёплого пола Wi-Fi', unit: 'шт', price: 3000, category: 'radiators_catalog' },
        // Доп. комплектующие (уникальные)
        'radiator_valve_therm_1_2': { name: 'Клапан терморегулирующий 1/2"', unit: 'шт', price: 200, category: 'radiators_catalog' },
        'radiator_valve_bottom': { name: 'Узел нижнего подключения', unit: 'компл.', price: 500, category: 'radiators_catalog' },
        'radiator_bracket_angle': { name: 'Кронштейн для радиатора угловой', unit: 'шт', price: 30, category: 'radiators_catalog' }
    };
})();
