// === ФАЗА 3: ГИДРОИЗОЛЯЦИЯ, ПОЖАРНАЯ БЕЗОПАСНОСТЬ, ДЕМОНТАЖНЫЕ РАБОТЫ, УБОРКА (200 поз.) ===
(function () {
    // === ГИДРОИЗОЛЯЦИЯ (все виды) ===
    window.AI_WRK_WATERPROOFING = {
        // Обмазочная
        'wrk_wp_coat_bitum_1': { name: 'Гидроизоляция битумная 1 слой', unit: 'м²', price: 30, category: 'waterproofing' },
        'wrk_wp_coat_bitum_2': { name: 'Гидроизоляция битумная 2 слоя', unit: 'м²', price: 50, category: 'waterproofing' },
        'wrk_wp_coat_bitum_poly_1': { name: 'Гидроизоляция битумно-полимерная 1сл', unit: 'м²', price: 50, category: 'waterproofing' },
        'wrk_wp_coat_bitum_poly_2': { name: 'Гидроизоляция битумно-полимерная 2сл', unit: 'м²', price: 80, category: 'waterproofing' },
        'wrk_wp_coat_cement_flex': { name: 'Цементная гидроизоляция (эластичная)', unit: 'м²', price: 50, category: 'waterproofing' },
        'wrk_wp_coat_cement_rigid': { name: 'Цементная гидроизоляция (жёсткая)', unit: 'м²', price: 40, category: 'waterproofing' },
        'wrk_wp_coat_polyur': { name: 'Полиуретановая гидроизоляция', unit: 'м²', price: 100, category: 'waterproofing' },
        'wrk_wp_coat_polyur_2': { name: 'Полиуретановая гидроизоляция 2сл', unit: 'м²', price: 150, category: 'waterproofing' },
        'wrk_wp_coat_acrylic': { name: 'Акриловая гидроизоляция', unit: 'м²', price: 40, category: 'waterproofing' },
        // Рулонная
        'wrk_wp_roll_tkp': { name: 'Наплавляемая ТКП (верхний)', unit: 'м²', price: 50, category: 'waterproofing' },
        'wrk_wp_roll_hpp': { name: 'Наплавляемая ХПП (нижний)', unit: 'м²', price: 40, category: 'waterproofing' },
        'wrk_wp_roll_sbs': { name: 'Гидроизоляция SBS-модифиц.', unit: 'м²', price: 80, category: 'waterproofing' },
        // Мембранная
        'wrk_wp_membr_pvc': { name: 'ПВХ-мембрана', unit: 'м²', price: 100, category: 'waterproofing' },
        'wrk_wp_membr_epdm': { name: 'ЭПДМ-мембрана', unit: 'м²', price: 130, category: 'waterproofing' },
        'wrk_wp_membr_profil': { name: 'Профилированная мембрана (плита)', unit: 'м²', price: 30, category: 'waterproofing' },
        // Проникающая
        'wrk_wp_penetr_coat': { name: 'Проникающая гидроизоляция (нанесение)', unit: 'м²', price: 50, category: 'waterproofing' },
        // Специфические
        'wrk_wp_bentonite_mat': { name: 'Бентонитовый мат', unit: 'м²', price: 80, category: 'waterproofing' },
        'wrk_wp_water_stop': { name: 'Гидрошпонка (установка)', unit: 'м.п.', price: 100, category: 'waterproofing' },
        'wrk_wp_shower_tray': { name: 'Гидроизоляция душевого поддона', unit: 'шт', price: 500, category: 'waterproofing' },
        'wrk_wp_bathroom_floor': { name: 'Гидроизоляция пола ванной', unit: 'м²', price: 50, category: 'waterproofing' },
        'wrk_wp_bathroom_walls': { name: 'Гидроизоляция стен ванной', unit: 'м²', price: 40, category: 'waterproofing' },
        'wrk_wp_drain_board': { name: 'Дренажная мембрана', unit: 'м²', price: 30, category: 'waterproofing' }
    };

    // === ПОЖАРНАЯ БЕЗОПАСНОСТЬ ===
    window.AI_WRK_FIRE_SAFETY = {
        // Пожарная сигнализация
        'wrk_fire_detector_smoke_addr': { name: 'Извещатель дымовой адресный', unit: 'шт', price: 500, category: 'fire_safety' },
        'wrk_fire_detector_smoke_conv': { name: 'Извещатель дымовой обычный', unit: 'шт', price: 200, category: 'fire_safety' },
        'wrk_fire_detector_combo': { name: 'Извещатель комбинированный (дым+тепло)', unit: 'шт', price: 600, category: 'fire_safety' },
        'wrk_fire_detector_linear': { name: 'Линейный извещатель', unit: 'шт', price: 3000, category: 'fire_safety' },
        'wrk_fire_panel_conv_4': { name: 'Панель ОПС (4 шлейфа)', unit: 'шт', price: 3000, category: 'fire_safety' },
        'wrk_fire_panel_conv_8': { name: 'Панель ОПС (8 шлейфов)', unit: 'шт', price: 5000, category: 'fire_safety' },
        'wrk_fire_panel_addr': { name: 'Панель ОПС адресная', unit: 'шт', price: 10000, category: 'fire_safety' },
        'wrk_fire_siren_beacon': { name: 'Оповещатель свето-звуковой', unit: 'шт', price: 300, category: 'fire_safety' },
        'wrk_fire_exit_sign': { name: 'Табличка «Выход» (светящаяся)', unit: 'шт', price: 300, category: 'fire_safety' },
        'wrk_fire_cable_fr': { name: 'Кабель огнестойкий (ОПС)', unit: 'м.п.', price: 15, category: 'fire_safety' },
        // Пожаротушение
        'wrk_fire_sprinkler': { name: 'Спринклер (монтаж)', unit: 'шт', price: 300, category: 'fire_safety' },
        'wrk_fire_sprinkler_dry': { name: 'Спринклер сухого типа', unit: 'шт', price: 500, category: 'fire_safety' },
        'wrk_fire_drench': { name: 'Дренчер (монтаж)', unit: 'шт', price: 400, category: 'fire_safety' },
        'wrk_fire_pipe_25': { name: 'Трубопровод пожаротушения Ø25мм', unit: 'м.п.', price: 50, category: 'fire_safety' },
        'wrk_fire_pipe_32': { name: 'Трубопровод пожаротушения Ø32мм', unit: 'м.п.', price: 60, category: 'fire_safety' },
        'wrk_fire_pipe_50': { name: 'Трубопровод пожаротушения Ø50мм', unit: 'м.п.', price: 80, category: 'fire_safety' },
        'wrk_fire_pipe_100': { name: 'Трубопровод пожаротушения Ø100мм', unit: 'м.п.', price: 150, category: 'fire_safety' },
        'wrk_fire_pump_station': { name: 'Насосная станция пожаротушения', unit: 'шт', price: 100000, category: 'fire_safety' },
        'wrk_fire_hydrant_int': { name: 'Пожарный кран (внутренний)', unit: 'шт', price: 2000, category: 'fire_safety' },
        'wrk_fire_exting_co2': { name: 'Огнетушитель CO₂ (зарядка/размещ.)', unit: 'шт', price: 200, category: 'fire_safety' },
        'wrk_fire_exting_powder': { name: 'Огнетушитель порошковый', unit: 'шт', price: 100, category: 'fire_safety' },
        'wrk_fire_gas_system': { name: 'Газовое пожаротушение (система)', unit: 'м³', price: 1000, category: 'fire_safety' },
        'wrk_fire_aerosol_system': { name: 'Аэрозольное пожаротушение', unit: 'м³', price: 500, category: 'fire_safety' }
    };

    // === ДЕМОНТАЖНЫЕ РАБОТЫ ===
    window.AI_WRK_DEMOLITION = {
        'wrk_demo_wall_brick_half': { name: 'Демонтаж кирпичной стены (полкирпича)', unit: 'м²', price: 100, category: 'demolition' },
        'wrk_demo_wall_brick_one': { name: 'Демонтаж кирпичной стены (1 кирпич)', unit: 'м²', price: 200, category: 'demolition' },
        'wrk_demo_wall_concrete': { name: 'Демонтаж бетонной стены', unit: 'м²', price: 300, category: 'demolition' },
        'wrk_demo_plaster': { name: 'Демонтаж штукатурки', unit: 'м²', price: 40, category: 'demolition' },
        'wrk_demo_paint': { name: 'Снятие краски', unit: 'м²', price: 20, category: 'demolition' },
        'wrk_demo_pipe_water': { name: 'Демонтаж водопровода', unit: 'м.п.', price: 20, category: 'demolition' },
        'wrk_demo_pipe_heating': { name: 'Демонтаж отопления', unit: 'м.п.', price: 25, category: 'demolition' },
        'wrk_demo_electric': { name: 'Демонтаж электрики', unit: 'точка', price: 30, category: 'demolition' },
        'wrk_demo_rubble_manual': { name: 'Вынос строит. мусора (ручной)', unit: 'м³', price: 300, category: 'demolition' },
        'wrk_demo_rubble_container': { name: 'Контейнер для мусора 8м³', unit: 'шт', price: 5000, category: 'demolition' },
        'wrk_demo_rubble_container_27': { name: 'Контейнер для мусора 27м³', unit: 'шт', price: 10000, category: 'demolition' },
        'wrk_demo_chute': { name: 'Мусоропровод строительный (рукав)', unit: 'этаж', price: 500, category: 'demolition' },
        'wrk_demo_disposal_permit': { name: 'Талон на утилизацию', unit: 'рейс', price: 1000, category: 'demolition' }
    };

    // === УБОРКА И ПОДГОТОВКА ===
    window.AI_WRK_CLEANING = {
        'wrk_cln_rough': { name: 'Уборка после черн. работ', unit: 'м²', price: 15, category: 'cleaning' },
        'wrk_cln_post_construction': { name: 'Генеральная послестроительная уборка', unit: 'м²', price: 30, category: 'cleaning' },
        'wrk_cln_window': { name: 'Мойка окон (послестроит.)', unit: 'м²', price: 30, category: 'cleaning' },
        'wrk_cln_facade': { name: 'Мойка фасада (послестроит.)', unit: 'м²', price: 30, category: 'cleaning' },
        'wrk_cln_protection_floor': { name: 'Защита пола (плёнка/картон)', unit: 'м²', price: 5, category: 'cleaning' },
        'wrk_cln_protection_door': { name: 'Защита двери/окна (плёнка)', unit: 'шт', price: 30, category: 'cleaning' },
        'wrk_cln_protection_stairs': { name: 'Защита лестницы', unit: 'марш', price: 300, category: 'cleaning' }
    };
})();
