// === КАТАЛОГ ВОДОПОДГОТОВКИ И ВОДОСНАБЖЕНИЯ (100 позиций) ===
(function () {
    window.AI_MAT_WATER_CATALOG = {
        // Фильтры магистральные
        'filter_mech_1_2_bb10': { name: 'Фильтр магистральный 1/2" BB10', unit: 'шт', price: 800, category: 'water_catalog' },
        'filter_mech_3_4_bb10': { name: 'Фильтр магистральный 3/4" BB10', unit: 'шт', price: 900, category: 'water_catalog' },
        'filter_mech_1_bb10': { name: 'Фильтр магистральный 1" BB10', unit: 'шт', price: 1000, category: 'water_catalog' },
        'filter_mech_1_bb20': { name: 'Фильтр магистральный 1" BB20', unit: 'шт', price: 1500, category: 'water_catalog' },
        'filter_hot_3_4_bb10': { name: 'Фильтр магистральный горячая 3/4" BB10', unit: 'шт', price: 1200, category: 'water_catalog' },
        // Картриджи
        'cart_pp_5mic_bb10': { name: 'Картридж ПП 5мкм BB10', unit: 'шт', price: 50, category: 'water_catalog' },
        'cart_pp_10mic_bb10': { name: 'Картридж ПП 10мкм BB10', unit: 'шт', price: 50, category: 'water_catalog' },
        'cart_pp_20mic_bb10': { name: 'Картридж ПП 20мкм BB10', unit: 'шт', price: 45, category: 'water_catalog' },
        'cart_pp_5mic_bb20': { name: 'Картридж ПП 5мкм BB20', unit: 'шт', price: 100, category: 'water_catalog' },
        'cart_pp_10mic_bb20': { name: 'Картридж ПП 10мкм BB20', unit: 'шт', price: 100, category: 'water_catalog' },
        'cart_carbon_bb10': { name: 'Картридж угольный BB10', unit: 'шт', price: 200, category: 'water_catalog' },
        'cart_carbon_bb20': { name: 'Картридж угольный BB20', unit: 'шт', price: 350, category: 'water_catalog' },
        'cart_iron_bb10': { name: 'Картридж обезжелезивание BB10', unit: 'шт', price: 300, category: 'water_catalog' },
        'cart_softener_bb10': { name: 'Картридж умягчение BB10', unit: 'шт', price: 350, category: 'water_catalog' },
        'cart_string_5mic_slim10': { name: 'Картридж нитяной 5мкм SL10', unit: 'шт', price: 30, category: 'water_catalog' },
        'cart_carbon_slim10': { name: 'Картридж угольный SL10', unit: 'шт', price: 100, category: 'water_catalog' },
        // Обратный осмос
        'ro_system_5stage': { name: 'Система обратного осмоса 5 ступеней', unit: 'шт', price: 5000, category: 'water_catalog' },
        'ro_system_6stage': { name: 'Система обратного осмоса 6 ступеней с минер.', unit: 'шт', price: 7000, category: 'water_catalog' },
        'ro_membrane_75gpd': { name: 'Мембрана обратного осмоса 75GPD', unit: 'шт', price: 800, category: 'water_catalog' },
        'ro_membrane_100gpd': { name: 'Мембрана обратного осмоса 100GPD', unit: 'шт', price: 1000, category: 'water_catalog' },
        'ro_tank_8l': { name: 'Бак для обратного осмоса 8л', unit: 'шт', price: 800, category: 'water_catalog' },
        'ro_tank_12l': { name: 'Бак для обратного осмоса 12л', unit: 'шт', price: 1200, category: 'water_catalog' },
        'ro_faucet_chrome': { name: 'Кран для питьевой воды хром', unit: 'шт', price: 300, category: 'water_catalog' },
        'ro_cart_set_3pcs': { name: 'Набор предфильтров для осмоса (3шт)', unit: 'компл.', price: 400, category: 'water_catalog' },
        // Фильтры «под мойку»
        'filter_under_3stage': { name: 'Фильтр под мойку 3 ступени', unit: 'шт', price: 2000, category: 'water_catalog' },
        'filter_under_4stage': { name: 'Фильтр под мойку 4 ступени', unit: 'шт', price: 3000, category: 'water_catalog' },
        // Системы умягчения
        'softener_cabinet_25l': { name: 'Умягчитель кабинетный 25л', unit: 'шт', price: 20000, category: 'water_catalog' },
        'softener_cabinet_35l': { name: 'Умягчитель кабинетный 35л', unit: 'шт', price: 30000, category: 'water_catalog' },
        'softener_column_1054': { name: 'Умягчитель колонный 10×54"', unit: 'шт', price: 25000, category: 'water_catalog' },
        'softener_salt_25kg': { name: 'Соль таблетированная (25кг)', unit: 'мешок', price: 400, category: 'water_catalog' },
        // Обезжелезивание
        'iron_filter_1054': { name: 'Фильтр обезжелезивания 10×54"', unit: 'шт', price: 20000, category: 'water_catalog' },
        'iron_filter_1252': { name: 'Фильтр обезжелезивания 12×52"', unit: 'шт', price: 30000, category: 'water_catalog' },
        'iron_media_birm_28l': { name: 'Фильтрующая загрузка Birm (28л)', unit: 'мешок', price: 3000, category: 'water_catalog' },
        // Водонагреватели накопительные
        'boiler_el_30l': { name: 'Водонагреватель накопит. 30л', unit: 'шт', price: 5000, category: 'water_catalog' },
        'boiler_el_50l': { name: 'Водонагреватель накопит. 50л', unit: 'шт', price: 7000, category: 'water_catalog' },
        'boiler_el_80l': { name: 'Водонагреватель накопит. 80л', unit: 'шт', price: 10000, category: 'water_catalog' },
        'boiler_el_100l': { name: 'Водонагреватель накопит. 100л', unit: 'шт', price: 13000, category: 'water_catalog' },
        'boiler_el_150l': { name: 'Водонагреватель накопит. 150л', unit: 'шт', price: 20000, category: 'water_catalog' },
        'boiler_el_200l': { name: 'Водонагреватель накопит. 200л', unit: 'шт', price: 30000, category: 'water_catalog' },
        'boiler_el_flat_50l': { name: 'Водонагреватель плоский 50л', unit: 'шт', price: 10000, category: 'water_catalog' },
        'boiler_el_flat_80l': { name: 'Водонагреватель плоский 80л', unit: 'шт', price: 14000, category: 'water_catalog' },
        'boiler_el_flat_100l': { name: 'Водонагреватель плоский 100л', unit: 'шт', price: 18000, category: 'water_catalog' },
        // Водонагреватели проточные
        'heater_flow_3_5kw': { name: 'Водонагреватель проточный 3.5кВт', unit: 'шт', price: 2000, category: 'water_catalog' },
        'heater_flow_5kw': { name: 'Водонагреватель проточный 5кВт', unit: 'шт', price: 3000, category: 'water_catalog' },
        'heater_flow_8kw': { name: 'Водонагреватель проточный 8кВт', unit: 'шт', price: 5000, category: 'water_catalog' },
        // Газовые колонки
        'gas_heater_10l': { name: 'Газовая колонка 10л/мин', unit: 'шт', price: 8000, category: 'water_catalog' },
        'gas_heater_12l': { name: 'Газовая колонка 12л/мин', unit: 'шт', price: 10000, category: 'water_catalog' },
        'gas_heater_14l': { name: 'Газовая колонка 14л/мин', unit: 'шт', price: 13000, category: 'water_catalog' },
        // Бойлеры косвенного нагрева
        'boiler_indirect_100l': { name: 'Бойлер косвенного нагрева 100л', unit: 'шт', price: 25000, category: 'water_catalog' },
        'boiler_indirect_150l': { name: 'Бойлер косвенного нагрева 150л', unit: 'шт', price: 35000, category: 'water_catalog' },
        'boiler_indirect_200l': { name: 'Бойлер косвенного нагрева 200л', unit: 'шт', price: 45000, category: 'water_catalog' },
        'boiler_indirect_300l': { name: 'Бойлер косвенного нагрева 300л', unit: 'шт', price: 60000, category: 'water_catalog' },
        // Полотенцесушители
        'towel_rail_lad_500x700': { name: 'Полотенцесушитель водяной 500×700мм', unit: 'шт', price: 3000, category: 'water_catalog' },
        'towel_rail_lad_500x900': { name: 'Полотенцесушитель водяной 500×900мм', unit: 'шт', price: 4000, category: 'water_catalog' },
        'towel_rail_lad_500x1200': { name: 'Полотенцесушитель водяной 500×1200мм', unit: 'шт', price: 5000, category: 'water_catalog' },
        'towel_rail_electric_600': { name: 'Полотенцесушитель электрический 600мм', unit: 'шт', price: 4000, category: 'water_catalog' },
        'towel_rail_electric_900': { name: 'Полотенцесушитель электрический 900мм', unit: 'шт', price: 6000, category: 'water_catalog' },
        // Счётчики воды
        'water_meter_cold_1_2': { name: 'Счётчик воды холодной 1/2"', unit: 'шт', price: 400, category: 'water_catalog' },
        'water_meter_hot_1_2': { name: 'Счётчик воды горячей 1/2"', unit: 'шт', price: 500, category: 'water_catalog' },
        'water_meter_cold_3_4': { name: 'Счётчик воды холодной 3/4"', unit: 'шт', price: 600, category: 'water_catalog' },
        'water_meter_hot_3_4': { name: 'Счётчик воды горячей 3/4"', unit: 'шт', price: 700, category: 'water_catalog' },
        // Запорная арматура
        'ball_valve_1_2': { name: 'Кран шаровый 1/2"', unit: 'шт', price: 80, category: 'water_catalog' },
        'ball_valve_3_4': { name: 'Кран шаровый 3/4"', unit: 'шт', price: 100, category: 'water_catalog' },
        'ball_valve_1': { name: 'Кран шаровый 1"', unit: 'шт', price: 150, category: 'water_catalog' },
        'ball_valve_1_1_4': { name: 'Кран шаровый 1-1/4"', unit: 'шт', price: 200, category: 'water_catalog' },
        'ball_valve_1_1_2': { name: 'Кран шаровый 1-1/2"', unit: 'шт', price: 300, category: 'water_catalog' },
        'ball_valve_2': { name: 'Кран шаровый 2"', unit: 'шт', price: 400, category: 'water_catalog' },
        'check_valve_1_2': { name: 'Обратный клапан 1/2"', unit: 'шт', price: 80, category: 'water_catalog' },
        'check_valve_3_4': { name: 'Обратный клапан 3/4"', unit: 'шт', price: 100, category: 'water_catalog' },
        'check_valve_1': { name: 'Обратный клапан 1"', unit: 'шт', price: 150, category: 'water_catalog' },
        'pressure_reducer_1_2': { name: 'Редуктор давления 1/2"', unit: 'шт', price: 500, category: 'water_catalog' },
        'pressure_reducer_3_4': { name: 'Редуктор давления 3/4"', unit: 'шт', price: 600, category: 'water_catalog' },
        'pressure_reducer_1': { name: 'Редуктор давления 1"', unit: 'шт', price: 800, category: 'water_catalog' },
        // Расширительные баки
        'expansion_tank_8l': { name: 'Расширительный бак отопления 8л', unit: 'шт', price: 800, category: 'water_catalog' },
        'expansion_tank_12l': { name: 'Расширительный бак отопления 12л', unit: 'шт', price: 1200, category: 'water_catalog' },
        'expansion_tank_24l': { name: 'Расширительный бак отопления 24л', unit: 'шт', price: 2000, category: 'water_catalog' },
        'expansion_tank_50l': { name: 'Расширительный бак отопления 50л', unit: 'шт', price: 3500, category: 'water_catalog' },
        // Манометры / предохранительные клапаны
        'manometer_6bar': { name: 'Манометр 0-6бар', unit: 'шт', price: 100, category: 'water_catalog' },
        'manometer_10bar': { name: 'Манометр 0-10бар', unit: 'шт', price: 120, category: 'water_catalog' },
        'safety_valve_1_2_3bar': { name: 'Клапан предохранительный 1/2" 3бар', unit: 'шт', price: 100, category: 'water_catalog' },
        'safety_valve_3_4_6bar': { name: 'Клапан предохранительный 3/4" 6бар', unit: 'шт', price: 150, category: 'water_catalog' },
        'air_vent_auto_1_2': { name: 'Воздухоотводчик автоматический 1/2"', unit: 'шт', price: 100, category: 'water_catalog' },
        'air_vent_manual': { name: 'Кран Маевского', unit: 'шт', price: 20, category: 'water_catalog' },
        // Теплоносители
        'antifreeze_10l': { name: 'Теплоноситель -30°C (10л)', unit: 'шт', price: 500, category: 'water_catalog' },
        'antifreeze_20l': { name: 'Теплоноситель -30°C (20л)', unit: 'шт', price: 900, category: 'water_catalog' },
        'antifreeze_50l': { name: 'Теплоноситель -30°C (50л)', unit: 'шт', price: 2000, category: 'water_catalog' }
    };
})();
