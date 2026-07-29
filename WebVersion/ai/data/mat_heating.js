// === ОТОПЛЕНИЕ (70 позиций) ===
(function () {
    window.AI_MAT_HEATING = {
        // Радиаторы алюминиевые (цена за секцию)
        'radiator_alu_350': { name: 'Радиатор алюминиевый 350мм (секция)', unit: 'секция', price: 2500, category: 'heating' },
        'radiator_alu_500': { name: 'Радиатор алюминиевый 500мм (секция)', unit: 'секция', price: 3000, category: 'heating' },

        // Радиаторы биметаллические
        'radiator_bimetal_350': { name: 'Радиатор биметаллический 350мм (секция)', unit: 'секция', price: 3500, category: 'heating' },
        'radiator_bimetal_500': { name: 'Радиатор биметаллический 500мм (секция)', unit: 'секция', price: 4200, category: 'heating' },

        // Радиаторы стальные панельные
        'radiator_steel_22_500_600': { name: 'Радиатор стальной 22 тип 500×600мм', unit: 'шт', price: 12000, category: 'heating' },
        'radiator_steel_22_500_800': { name: 'Радиатор стальной 22 тип 500×800мм', unit: 'шт', price: 15000, category: 'heating' },
        'radiator_steel_22_500_1000': { name: 'Радиатор стальной 22 тип 500×1000мм', unit: 'шт', price: 18000, category: 'heating' },
        'radiator_steel_22_500_1200': { name: 'Радиатор стальной 22 тип 500×1200мм', unit: 'шт', price: 22000, category: 'heating' },
        'radiator_steel_11_500_600': { name: 'Радиатор стальной 11 тип 500×600мм', unit: 'шт', price: 8000, category: 'heating' },

        // Комплектующие радиаторов
        'radiator_kit': { name: 'Комплект подключения радиатора (1/2")', unit: 'комплект', price: 500, category: 'heating' },
        'radiator_bracket': { name: 'Кронштейн для радиатора', unit: 'шт', price: 150, category: 'heating' },
        'radiator_thermohead': { name: 'Термоголовка для радиатора', unit: 'шт', price: 1200, category: 'heating' },
        'radiator_valve_angle': { name: 'Кран радиаторный угловой 1/2"', unit: 'шт', price: 400, category: 'heating' },
        'radiator_valve_straight': { name: 'Кран радиаторный прямой 1/2"', unit: 'шт', price: 400, category: 'heating' },

        // Котлы газовые
        'boiler_gas_wall_24kw': { name: 'Котёл газовый настенный 24кВт', unit: 'шт', price: 180000, category: 'heating' },
        'boiler_gas_wall_28kw': { name: 'Котёл газовый настенный 28кВт', unit: 'шт', price: 220000, category: 'heating' },
        'boiler_gas_wall_35kw': { name: 'Котёл газовый настенный 35кВт', unit: 'шт', price: 280000, category: 'heating' },
        'boiler_gas_floor_40kw': { name: 'Котёл газовый напольный 40кВт', unit: 'шт', price: 250000, category: 'heating' },
        'boiler_gas_condensing_24kw': { name: 'Котёл газовый конденсационный 24кВт', unit: 'шт', price: 350000, category: 'heating' },

        // Котлы электрические
        'boiler_elec_6kw': { name: 'Котёл электрический 6кВт', unit: 'шт', price: 25000, category: 'heating' },
        'boiler_elec_9kw': { name: 'Котёл электрический 9кВт', unit: 'шт', price: 30000, category: 'heating' },
        'boiler_elec_12kw': { name: 'Котёл электрический 12кВт', unit: 'шт', price: 40000, category: 'heating' },
        'boiler_elec_24kw': { name: 'Котёл электрический 24кВт', unit: 'шт', price: 60000, category: 'heating' },

        // Котлы твердотопливные
        'boiler_solid_20kw': { name: 'Котёл твердотопливный 20кВт', unit: 'шт', price: 120000, category: 'heating' },
        'boiler_solid_30kw': { name: 'Котёл твердотопливный 30кВт', unit: 'шт', price: 160000, category: 'heating' },
        'boiler_pellet_25kw': { name: 'Котёл пеллетный 25кВт', unit: 'шт', price: 250000, category: 'heating' },

        // Тёплый пол водяной
        'warm_floor_pipe_16': { name: 'Труба для тёплого пола PEX-a 16мм (бухта 200м)', unit: 'бухта', price: 12000, category: 'heating' },
        'warm_floor_pipe_20': { name: 'Труба для тёплого пола PEX-a 20мм (бухта 100м)', unit: 'бухта', price: 8500, category: 'heating' },
        'warm_floor_mat_insul': { name: 'Мат с бобышками для тёплого пола', unit: 'м²', price: 600, category: 'heating' },
        'warm_floor_collector_3': { name: 'Коллектор тёплого пола 3 контура', unit: 'шт', price: 8000, category: 'heating' },
        'warm_floor_collector_5': { name: 'Коллектор тёплого пола 5 контуров', unit: 'шт', price: 12000, category: 'heating' },
        'warm_floor_collector_8': { name: 'Коллектор тёплого пола 8 контуров', unit: 'шт', price: 18000, category: 'heating' },
        'warm_floor_actuator': { name: 'Сервопривод для коллектора', unit: 'шт', price: 2500, category: 'heating' },
        'warm_floor_thermostat': { name: 'Термостат комнатный для ТП', unit: 'шт', price: 3000, category: 'heating' },

        // Тёплый пол электрический
        'warm_floor_elec_mat_1': { name: 'Мат нагревательный 1м² (150Вт/м²)', unit: 'шт', price: 5000, category: 'heating' },
        'warm_floor_elec_mat_2': { name: 'Мат нагревательный 2м² (150Вт/м²)', unit: 'шт', price: 9000, category: 'heating' },
        'warm_floor_elec_mat_3': { name: 'Мат нагревательный 3м² (150Вт/м²)', unit: 'шт', price: 12000, category: 'heating' },
        'warm_floor_elec_mat_5': { name: 'Мат нагревательный 5м² (150Вт/м²)', unit: 'шт', price: 18000, category: 'heating' },
        'warm_floor_elec_mat_10': { name: 'Мат нагревательный 10м² (150Вт/м²)', unit: 'шт', price: 32000, category: 'heating' },
        'warm_floor_cable_20m': { name: 'Кабель нагревательный 20м (400Вт)', unit: 'шт', price: 6000, category: 'heating' },
        'warm_floor_cable_50m': { name: 'Кабель нагревательный 50м (1000Вт)', unit: 'шт', price: 12000, category: 'heating' },
        'warm_floor_elec_thermostat': { name: 'Терморегулятор для электрического ТП', unit: 'шт', price: 3500, category: 'heating' },
        'warm_floor_ir_film_1': { name: 'Плёночный ТП (инфракрасный) 1м²', unit: 'м²', price: 2500, category: 'heating' },

        // Насосы циркуляционные
        'pump_circ_25_4': { name: 'Насос циркуляционный 25-40', unit: 'шт', price: 8000, category: 'heating' },
        'pump_circ_25_6': { name: 'Насос циркуляционный 25-60', unit: 'шт', price: 10000, category: 'heating' },
        'pump_circ_32_6': { name: 'Насос циркуляционный 32-60', unit: 'шт', price: 14000, category: 'heating' },

        // Расширительные баки
        'expansion_tank_6l': { name: 'Расширительный бак 6л', unit: 'шт', price: 3000, category: 'heating' },
        'expansion_tank_12l': { name: 'Расширительный бак 12л', unit: 'шт', price: 4500, category: 'heating' },
        'expansion_tank_24l': { name: 'Расширительный бак 24л', unit: 'шт', price: 6000, category: 'heating' },
        'expansion_tank_50l': { name: 'Расширительный бак 50л', unit: 'шт', price: 9000, category: 'heating' },

        // Группа безопасности
        'safety_group_1_2': { name: 'Группа безопасности котла 1/2"', unit: 'шт', price: 2500, category: 'heating' },
        'safety_group_1': { name: 'Группа безопасности котла 1"', unit: 'шт', price: 3500, category: 'heating' },

        // Дымоходы коаксиальные
        'chimney_coaxial_60_100': { name: 'Дымоход коаксиальный 60/100 (1м)', unit: 'шт', price: 3500, category: 'heating' },
        'chimney_coaxial_elbow_90': { name: 'Колено коаксиальное 90° 60/100', unit: 'шт', price: 2500, category: 'heating' },
        'chimney_coaxial_terminal': { name: 'Наконечник коаксиальный 60/100', unit: 'шт', price: 2000, category: 'heating' },

        // Дымоходы сэндвич
        'chimney_sandwich_115_200_1m': { name: 'Труба дымохода сэндвич 115/200 (1м)', unit: 'шт', price: 4500, category: 'heating' },
        'chimney_sandwich_elbow_90': { name: 'Отвод дымохода сэндвич 90°', unit: 'шт', price: 3500, category: 'heating' },
        'chimney_sandwich_tee': { name: 'Тройник дымохода сэндвич', unit: 'шт', price: 5000, category: 'heating' },

        // Теплоноситель
        'coolant_antifreeze_20l': { name: 'Теплоноситель антифриз (20л)', unit: 'шт', price: 3500, category: 'heating' },
        'coolant_antifreeze_50l': { name: 'Теплоноситель антифриз (50л)', unit: 'шт', price: 7500, category: 'heating' },

        // Конвекторы
        'convector_electric_1kw': { name: 'Конвектор электрический 1кВт', unit: 'шт', price: 12000, category: 'heating' },
        'convector_electric_2kw': { name: 'Конвектор электрический 2кВт', unit: 'шт', price: 18000, category: 'heating' },
        'convector_floor_built_in': { name: 'Конвектор внутрипольный (1м)', unit: 'шт', price: 35000, category: 'heating' }
    };
})();
