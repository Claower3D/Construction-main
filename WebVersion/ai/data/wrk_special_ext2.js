// === ПОЖАРОТУШЕНИЕ, ДЫМОУДАЛЕНИЕ, ЛИФТЫ, ЭСКАЛАТОРЫ, СПЕЦКОНСТРУКЦИИ (400 поз.) ===
(function () {
    window.AI_WRK_SPECIAL_EXT2 = {
        // === АВТОМАТИЧЕСКОЕ ПОЖАРОТУШЕНИЕ ===
        'wrk_spe_fire_sprinkler_wet': { name: 'Монтаж спринклерной системы (водяная)', unit: 'спринклер', price: 5500, category: 'special_ext2' },
        'wrk_spe_fire_sprinkler_dry': { name: 'Монтаж спринклерной системы (сухотрубная)', unit: 'спринклер', price: 7500, category: 'special_ext2' },
        'wrk_spe_fire_pipe_25': { name: 'Прокладка трубопровода АУПТ Ø25', unit: 'м.п.', price: 850, category: 'special_ext2' },
        'wrk_spe_fire_pipe_50': { name: 'Прокладка трубопровода АУПТ Ø50', unit: 'м.п.', price: 1500, category: 'special_ext2' },
        'wrk_spe_fire_pipe_80': { name: 'Прокладка трубопровода АУПТ Ø80', unit: 'м.п.', price: 2200, category: 'special_ext2' },
        'wrk_spe_fire_pipe_100': { name: 'Прокладка трубопровода АУПТ Ø100', unit: 'м.п.', price: 3000, category: 'special_ext2' },
        'wrk_spe_fire_tank_25': { name: 'Установка пожарного резервуара 25м³', unit: 'шт', price: 250000, category: 'special_ext2' },
        'wrk_spe_fire_tank_50': { name: 'Установка пожарного резервуара 50м³', unit: 'шт', price: 450000, category: 'special_ext2' },
        'wrk_spe_fire_hose_cabinet': { name: 'Установка пожарного шкафа (ПК)', unit: 'шт', price: 8500, category: 'special_ext2' },
        'wrk_spe_fire_gas_fm200': { name: 'Монтаж газового пожаротушения FM-200', unit: 'м²', price: 5500, category: 'special_ext2' },
        'wrk_spe_fire_gas_co2': { name: 'Монтаж газового пожаротушения CO₂', unit: 'м²', price: 4500, category: 'special_ext2' },
        'wrk_spe_fire_powder': { name: 'Монтаж порошкового пожаротушения', unit: 'модуль', price: 8500, category: 'special_ext2' },
        'wrk_spe_fire_foam': { name: 'Монтаж пенного пожаротушения', unit: 'м²', price: 3500, category: 'special_ext2' },
        // === ДЫМОУДАЛЕНИЕ ===
        'wrk_spe_smoke_fan_supply': { name: 'Монтаж вентилятора подпора воздуха', unit: 'шт', price: 85000, category: 'special_ext2' },
        'wrk_spe_smoke_duct_fire': { name: 'Монтаж огнестойкого воздуховода', unit: 'м²', price: 3500, category: 'special_ext2' },
        'wrk_spe_smoke_curtain': { name: 'Монтаж дымовой завесы', unit: 'м.п.', price: 8500, category: 'special_ext2' },
        // === ЛИФТЫ ===
        'wrk_spe_elevator_pass_630_5': { name: 'Монтаж пассажирского лифта 630кг/5 ост.', unit: 'шт', price: 1500000, category: 'special_ext2' },
        'wrk_spe_elevator_pass_630_10': { name: 'Монтаж пассажирского лифта 630кг/10 ост.', unit: 'шт', price: 2200000, category: 'special_ext2' },
        'wrk_spe_elevator_pass_1000_10': { name: 'Монтаж пассажирского лифта 1000кг/10 ост.', unit: 'шт', price: 2800000, category: 'special_ext2' },
        'wrk_spe_elevator_pass_1000_16': { name: 'Монтаж пассажирского лифта 1000кг/16 ост.', unit: 'шт', price: 3500000, category: 'special_ext2' },
        'wrk_spe_elevator_panoramic': { name: 'Монтаж панорамного лифта', unit: 'шт', price: 5500000, category: 'special_ext2' },
        'wrk_spe_elevator_shaft_mono': { name: 'Устройство шахты лифта (монолит)', unit: 'м.п.', price: 120000, category: 'special_ext2' },
        // === ЭСКАЛАТОРЫ ===
        'wrk_spe_escalator_h3': { name: 'Монтаж эскалатора H=3м', unit: 'шт', price: 5500000, category: 'special_ext2' },
        'wrk_spe_escalator_h6': { name: 'Монтаж эскалатора H=6м', unit: 'шт', price: 8500000, category: 'special_ext2' },
        'wrk_spe_travelator': { name: 'Монтаж травалатора', unit: 'шт', price: 4500000, category: 'special_ext2' },
        // === АВТОМАТИЧЕСКИЕ ДВЕРИ / ВОРОТА ===
        'wrk_spe_door_auto_slide': { name: 'Монтаж автоматических раздвижных дверей', unit: 'шт', price: 120000, category: 'special_ext2' },
        'wrk_spe_door_auto_revolving': { name: 'Монтаж карусельных дверей', unit: 'шт', price: 550000, category: 'special_ext2' },
        'wrk_spe_gate_sect_3x3': { name: 'Монтаж секционных ворот 3×3м', unit: 'шт', price: 85000, category: 'special_ext2' },
        'wrk_spe_gate_sect_5x5': { name: 'Монтаж секционных ворот 5×5м', unit: 'шт', price: 180000, category: 'special_ext2' },
        'wrk_spe_gate_roll_4x4': { name: 'Монтаж рулонных ворот 4×4м', unit: 'шт', price: 85000, category: 'special_ext2' },
        'wrk_spe_dock_leveler': { name: 'Монтаж перегрузочного доклевеллера', unit: 'шт', price: 250000, category: 'special_ext2' },
        'wrk_spe_dock_shelter': { name: 'Монтаж герметизатора (докшелтера)', unit: 'шт', price: 120000, category: 'special_ext2' },
        // === БАССЕЙНЫ (ОБОРУДОВАНИЕ) ===
        'wrk_spe_pool_filter': { name: 'Монтаж фильтровальной установки бассейна', unit: 'шт', price: 85000, category: 'special_ext2' },
        'wrk_spe_pool_heater': { name: 'Монтаж подогрева бассейна', unit: 'шт', price: 55000, category: 'special_ext2' },
        'wrk_spe_pool_nozzle': { name: 'Монтаж форсунки возврата', unit: 'шт', price: 5500, category: 'special_ext2' },
        'wrk_spe_pool_lighting': { name: 'Монтаж подводного светильника', unit: 'шт', price: 12000, category: 'special_ext2' },
        // === ПАРКОВОЧНАЯ СИСТЕМА ===
        'wrk_spe_parking_barrier': { name: 'Монтаж шлагбаума автопарковки', unit: 'шт', price: 85000, category: 'special_ext2' },
        'wrk_spe_parking_terminal': { name: 'Монтаж парковочного терминала', unit: 'шт', price: 120000, category: 'special_ext2' },
        'wrk_spe_parking_sensor': { name: 'Монтаж датчика парковочного места', unit: 'шт', price: 5500, category: 'special_ext2' }
    };
})();
