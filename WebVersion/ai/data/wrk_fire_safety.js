// === ПОЖАРНАЯ БЕЗОПАСНОСТЬ — АУПТ, спринклеры, дренчеры, дымоудаление, огнезащита (50 поз.) ===
(function () {
    window.AI_WRK_FIRE_SAFETY = {
        // === СПРИНКЛЕРНОЕ === 1-8
        'wrk_fs_sprinkler_pendent': { name: 'Спринклер пендентный (потолочный)', unit: 'шт', price: 550, category: 'firesafety' },
        'wrk_fs_sprinkler_upright': { name: 'Спринклер стоячий', unit: 'шт', price: 550, category: 'firesafety' },
        'wrk_fs_sprinkler_sidewall': { name: 'Спринклер настенный', unit: 'шт', price: 850, category: 'firesafety' },
        'wrk_fs_sprinkler_concealed': { name: 'Спринклер скрытый (декоративный)', unit: 'шт', price: 1200, category: 'firesafety' },
        'wrk_fs_sprinkler_esfr': { name: 'Спринклер ESFR (склад)', unit: 'шт', price: 2500, category: 'firesafety' },
        'wrk_fs_pipe_spr_25': { name: 'Трубопровод спринкл. Ø25', unit: 'м.п.', price: 350, category: 'firesafety' },
        'wrk_fs_pipe_spr_50': { name: 'Трубопровод спринкл. Ø50', unit: 'м.п.', price: 550, category: 'firesafety' },
        'wrk_fs_pipe_spr_100': { name: 'Трубопровод спринкл. Ø100', unit: 'м.п.', price: 1200, category: 'firesafety' },
        // === ДРЕНЧЕРНОЕ === 9-14
        'wrk_fs_drench_head': { name: 'Дренчерный ороситель', unit: 'шт', price: 550, category: 'firesafety' },
        'wrk_fs_drench_valve': { name: 'Дренчерный клапан (секция)', unit: 'шт', price: 25000, category: 'firesafety' },
        'wrk_fs_drench_curtain': { name: 'Дренчерная завеса', unit: 'м.п.', price: 1500, category: 'firesafety' },
        'wrk_fs_alarm_valve': { name: 'Узел управления спринклерный', unit: 'шт', price: 25000, category: 'firesafety' },
        'wrk_fs_pump_jockey': { name: 'Жокей-насос', unit: 'шт', price: 25000, category: 'firesafety' },
        'wrk_fs_pump_main': { name: 'Насос пожарный основной', unit: 'шт', price: 120000, category: 'firesafety' },
        // === ГАЗОВОЕ ПОЖАРОТУШЕНИЕ === 15-20
        'wrk_fs_gas_fm200': { name: 'Система газовая FM200 (хладон)', unit: 'компл.', price: 550000, category: 'firesafety' },
        'wrk_fs_gas_novec': { name: 'Система газовая Novec 1230', unit: 'компл.', price: 850000, category: 'firesafety' },
        'wrk_fs_gas_co2': { name: 'Система газовая CO₂', unit: 'компл.', price: 350000, category: 'firesafety' },
        'wrk_fs_gas_inert': { name: 'Система инертного газа (N₂/Ar)', unit: 'компл.', price: 550000, category: 'firesafety' },
        'wrk_fs_gas_nozzle': { name: 'Насадок газового тушения', unit: 'шт', price: 3500, category: 'firesafety' },
        'wrk_fs_gas_cylinder': { name: 'Баллон (модуль газового)', unit: 'шт', price: 55000, category: 'firesafety' },
        // === ПОРОШКОВОЕ / АЭРОЗОЛЬНОЕ === 21-24
        'wrk_fs_powder_module': { name: 'Модуль порошкового тушения', unit: 'шт', price: 8500, category: 'firesafety' },
        'wrk_fs_aerosol_module': { name: 'Модуль аэрозольного тушения', unit: 'шт', price: 5500, category: 'firesafety' },
        'wrk_fs_foam_chamber': { name: 'Генератор пены (пенокамера)', unit: 'шт', price: 12000, category: 'firesafety' },
        'wrk_fs_foam_tank': { name: 'Бак-пенообразователь', unit: 'шт', price: 55000, category: 'firesafety' },
        // === ДЫМОУДАЛЕНИЕ === 25-32
        'wrk_fs_smoke_fan_supply': { name: 'Вентилятор подпора воздуха', unit: 'шт', price: 120000, category: 'firesafety' },
        'wrk_fs_smoke_fan_exhaust': { name: 'Вентилятор дымоудаления', unit: 'шт', price: 150000, category: 'firesafety' },
        'wrk_fs_smoke_duct': { name: 'Воздуховод дымоудаления (EI)', unit: 'м²', price: 2500, category: 'firesafety' },
        'wrk_fs_smoke_damper': { name: 'Клапан дымоудаления (КДМ)', unit: 'шт', price: 8500, category: 'firesafety' },
        'wrk_fs_fire_damper': { name: 'Огнезадерживающий клапан (КОЗ)', unit: 'шт', price: 5500, category: 'firesafety' },
        'wrk_fs_smoke_hatch': { name: 'Люк дымоудаления (кровельный)', unit: 'шт', price: 85000, category: 'firesafety' },
        'wrk_fs_pressurize_stair': { name: 'Подпор воздуха в лестничную клетку', unit: 'компл.', price: 250000, category: 'firesafety' },
        'wrk_fs_pressurize_lift': { name: 'Подпор воздуха в лифтовую шахту', unit: 'компл.', price: 250000, category: 'firesafety' },
        // === ВОДОПРОВОД ПОЖАРНЫЙ === 33-38
        'wrk_fs_hydrant_indoor': { name: 'Пожарный кран (ПК)', unit: 'шт', price: 8500, category: 'firesafety' },
        'wrk_fs_hydrant_outdoor': { name: 'Пожарный гидрант (наружный)', unit: 'шт', price: 25000, category: 'firesafety' },
        'wrk_fs_pipe_fire_50': { name: 'Трубопровод пожарный Ø50', unit: 'м.п.', price: 550, category: 'firesafety' },
        'wrk_fs_pipe_fire_100': { name: 'Трубопровод пожарный Ø100', unit: 'м.п.', price: 1200, category: 'firesafety' },
        'wrk_fs_pipe_fire_150': { name: 'Трубопровод пожарный Ø150', unit: 'м.п.', price: 1800, category: 'firesafety' },
        'wrk_fs_tank_fire': { name: 'Бак водяного пожаротушения', unit: 'м³', price: 5500, category: 'firesafety' },
        // === ОГНЕЗАЩИТА === 39-44
        'wrk_fs_coat_steel_r45': { name: 'Огнезащита стали R45 (краска)', unit: 'м²', price: 350, category: 'firesafety' },
        'wrk_fs_coat_steel_r90': { name: 'Огнезащита стали R90 (краска)', unit: 'м²', price: 550, category: 'firesafety' },
        'wrk_fs_coat_steel_r120': { name: 'Огнезащита стали R120 (краска)', unit: 'м²', price: 850, category: 'firesafety' },
        'wrk_fs_wrap_steel': { name: 'Огнезащита стали (штукатурка)', unit: 'м²', price: 1200, category: 'firesafety' },
        'wrk_fs_coat_wood': { name: 'Огнезащита дерева (пропитка)', unit: 'м²', price: 250, category: 'firesafety' },
        'wrk_fs_coat_cable': { name: 'Огнезащита кабелей (краска)', unit: 'м.п.', price: 120, category: 'firesafety' },
        // === ДОПЫ === 45-50
        'wrk_fs_exit_sign': { name: 'Табло «ВЫХОД» (LED)', unit: 'шт', price: 550, category: 'firesafety' },
        'wrk_fs_emergency_light': { name: 'Аварийное освещение (LED)', unit: 'шт', price: 1500, category: 'firesafety' },
        'wrk_fs_extinguisher_mount': { name: 'Кронштейн огнетушителя', unit: 'шт', price: 250, category: 'firesafety' },
        'wrk_fs_firestop_seal': { name: 'Огнестойкая заделка проходки', unit: 'шт', price: 850, category: 'firesafety' },
        'wrk_fs_fire_door': { name: 'Противопожарная дверь EI60', unit: 'шт', price: 25000, category: 'firesafety' },
        'wrk_fs_commissioning': { name: 'ПНР системы пожаротушения', unit: 'компл.', price: 120000, category: 'firesafety' }
    };
})();
