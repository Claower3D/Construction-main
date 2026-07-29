// === КАТАЛОГ РАБОТ: ПРОТИВОПОЖАРНЫЕ (Фаза 1-3: 120 поз.) ===
(function () {
    window.AI_WRK_FIRE = {
        // Пожарная сигнализация
        'wrk_fire_sensor_smoke': { name: 'Монтаж дымового извещателя', unit: 'шт', price: 300, category: 'fire' },
        'wrk_fire_sensor_heat': { name: 'Монтаж теплового извещателя', unit: 'шт', price: 300, category: 'fire' },
        'wrk_fire_sensor_smoke_heat': { name: 'Монтаж комбинированного извещателя', unit: 'шт', price: 400, category: 'fire' },
        'wrk_fire_sensor_linear': { name: 'Монтаж линейного извещателя', unit: 'шт', price: 1000, category: 'fire' },
        'wrk_fire_sensor_flame': { name: 'Монтаж извещателя пламени', unit: 'шт', price: 800, category: 'fire' },
        'wrk_fire_sensor_manual': { name: 'Монтаж ручного пож. извещателя (ИПР)', unit: 'шт', price: 200, category: 'fire' },
        'wrk_fire_sensor_gas': { name: 'Монтаж газового извещателя', unit: 'шт', price: 500, category: 'fire' },
        'wrk_fire_panel_2zone': { name: 'Монтаж пож. прибора 2 зоны', unit: 'шт', price: 2000, category: 'fire' },
        'wrk_fire_panel_4zone': { name: 'Монтаж пож. прибора 4 зоны', unit: 'шт', price: 3000, category: 'fire' },
        'wrk_fire_panel_8zone': { name: 'Монтаж пож. прибора 8 зон', unit: 'шт', price: 5000, category: 'fire' },
        'wrk_fire_panel_addr': { name: 'Монтаж адресного пож. прибора', unit: 'шт', price: 8000, category: 'fire' },
        'wrk_fire_siren_indoor': { name: 'Монтаж оповещателя (сирена)', unit: 'шт', price: 200, category: 'fire' },
        'wrk_fire_siren_light': { name: 'Монтаж светового оповещателя', unit: 'шт', price: 200, category: 'fire' },
        'wrk_fire_siren_voice': { name: 'Монтаж речевого оповещателя', unit: 'шт', price: 500, category: 'fire' },
        'wrk_fire_cable_1x2x05': { name: 'Прокладка пож. кабеля 1×2×0.5', unit: 'м.п.', price: 15, category: 'fire' },
        'wrk_fire_cable_2x2x05': { name: 'Прокладка пож. кабеля 2×2×0.5', unit: 'м.п.', price: 18, category: 'fire' },
        'wrk_fire_cable_tray': { name: 'Монтаж огнестойкого лотка', unit: 'м.п.', price: 50, category: 'fire' },
        // Системы пожаротушения
        'wrk_fire_sprinkler_wet': { name: 'Монтаж спринклерн. системы (мокрая)', unit: 'спр.', price: 500, category: 'fire' },
        'wrk_fire_sprinkler_dry': { name: 'Монтаж спринклерн. системы (сухая)', unit: 'спр.', price: 600, category: 'fire' },
        'wrk_fire_spray_water': { name: 'Монтаж дренчерной системы', unit: 'спр.', price: 500, category: 'fire' },
        'wrk_fire_pipe_dn25': { name: 'Пожарный трубопровод Ø25мм', unit: 'м.п.', price: 100, category: 'fire' },
        'wrk_fire_pipe_dn32': { name: 'Пожарный трубопровод Ø32мм', unit: 'м.п.', price: 120, category: 'fire' },
        'wrk_fire_pipe_dn50': { name: 'Пожарный трубопровод Ø50мм', unit: 'м.п.', price: 150, category: 'fire' },
        'wrk_fire_pipe_dn80': { name: 'Пожарный трубопровод Ø80мм', unit: 'м.п.', price: 200, category: 'fire' },
        'wrk_fire_pipe_dn100': { name: 'Пожарный трубопровод Ø100мм', unit: 'м.п.', price: 250, category: 'fire' },
        'wrk_fire_pump_station': { name: 'Монтаж пожарной насосной станции', unit: 'шт', price: 30000, category: 'fire' },
        'wrk_fire_tank_install': { name: 'Монтаж пож. резервуара', unit: 'шт', price: 10000, category: 'fire' },
        'wrk_fire_hydrant_int': { name: 'Монтаж пож. крана (внутренний)', unit: 'шт', price: 2000, category: 'fire' },
        'wrk_fire_hydrant_ext': { name: 'Монтаж пож. гидранта (наружный)', unit: 'шт', price: 5000, category: 'fire' },
        // Газовое пожаротушение
        'wrk_fire_gas_hfc227': { name: 'Газовое пожаротушение (ФК-5-1-12)', unit: 'м³', price: 500, category: 'fire' },
        'wrk_fire_gas_co2': { name: 'Газовое пожаротушение (CO₂)', unit: 'м³', price: 400, category: 'fire' },
        'wrk_fire_gas_novec': { name: 'Газовое пожаротушение (Novec)', unit: 'м³', price: 600, category: 'fire' },
        // Порошковое пожаротушение
        'wrk_fire_powder_module': { name: 'Модуль порошкового пожаротушения', unit: 'шт', price: 3000, category: 'fire' },
        // Огнезащита
        'wrk_fire_protect_steel_r45': { name: 'Огнезащита металла R45', unit: 'м²', price: 200, category: 'fire' },
        'wrk_fire_protect_steel_r60': { name: 'Огнезащита металла R60', unit: 'м²', price: 300, category: 'fire' },
        'wrk_fire_protect_steel_r90': { name: 'Огнезащита металла R90', unit: 'м²', price: 400, category: 'fire' },
        'wrk_fire_protect_steel_r120': { name: 'Огнезащита металла R120', unit: 'м²', price: 500, category: 'fire' },
        'wrk_fire_protect_wood_r15': { name: 'Огнезащита дерева R15', unit: 'м²', price: 50, category: 'fire' },
        'wrk_fire_protect_wood_r30': { name: 'Огнезащита дерева R30', unit: 'м²', price: 80, category: 'fire' },
        'wrk_fire_protect_wood_r45': { name: 'Огнезащита дерева R45', unit: 'м²', price: 120, category: 'fire' },
        'wrk_fire_protect_cable': { name: 'Огнезащита кабелей', unit: 'м.п.', price: 30, category: 'fire' },
        'wrk_fire_protect_duct': { name: 'Огнезащита воздуховодов', unit: 'м²', price: 200, category: 'fire' },
        'wrk_fire_seal_wall': { name: 'Огнестойкая заделка проходки (стена)', unit: 'шт', price: 300, category: 'fire' },
        'wrk_fire_seal_floor': { name: 'Огнестойкая заделка проходки (пол)', unit: 'шт', price: 400, category: 'fire' },
        'wrk_fire_damper_install': { name: 'Монтаж огнезадерживающего клапана', unit: 'шт', price: 1500, category: 'fire' },
        // Дымоудаление
        'wrk_fire_smoke_fan': { name: 'Монтаж вентилятора дымоудаления', unit: 'шт', price: 5000, category: 'fire' },
        'wrk_fire_smoke_duct': { name: 'Монтаж воздуховода дымоудаления', unit: 'м²', price: 200, category: 'fire' },
        'wrk_fire_smoke_hatch': { name: 'Монтаж люка дымоудаления', unit: 'шт', price: 3000, category: 'fire' },
        'wrk_fire_smoke_window': { name: 'Привод фрамуги дымоудаления', unit: 'шт', price: 5000, category: 'fire' },
        // ИТМ
        'wrk_fire_project': { name: 'Проект пожарной сигнализации', unit: 'объект', price: 15000, category: 'fire' },
        'wrk_fire_project_ext': { name: 'Проект пожаротушения', unit: 'объект', price: 30000, category: 'fire' },
        'wrk_fire_commissioning': { name: 'Пусконаладка пож. сигнализации', unit: 'объект', price: 5000, category: 'fire' },
        'wrk_fire_service_monthly': { name: 'ТО пожарной сигнализации (месяц)', unit: 'мес.', price: 3000, category: 'fire' },
        'wrk_fire_testing': { name: 'Испытание пожаротушения', unit: 'объект', price: 10000, category: 'fire' }
    };
})();
