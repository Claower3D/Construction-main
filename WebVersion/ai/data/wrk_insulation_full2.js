// === ГИДРОИЗОЛЯЦИЯ И ТЕПЛОИЗОЛЯЦИЯ ПОЛНАЯ ДЕТАЛИЗАЦИЯ ===
(function () {
    window.AI_WRK_INSULATION_FULL2 = {
        // === ГИДРОИЗОЛЯЦИЯ ФУНДАМЕНТА ===
        'wrk_ins2_gi_found_bitumen_2': { name: 'Обмазочная ГИ битумом (2 слоя)', unit: 'м²', price: 250, category: 'insulation_full2' },
        'wrk_ins2_gi_found_mastic_2': { name: 'Обмазочная ГИ мастикой (2 слоя)', unit: 'м²', price: 350, category: 'insulation_full2' },
        'wrk_ins2_gi_found_roll_2': { name: 'Рулонная ГИ фундамента (2 слоя)', unit: 'м²', price: 650, category: 'insulation_full2' },
        'wrk_ins2_gi_found_membrane': { name: 'Профилированная мембрана', unit: 'м²', price: 200, category: 'insulation_full2' },
        'wrk_ins2_gi_found_liquid': { name: 'Жидкая резина (фундамент)', unit: 'м²', price: 650, category: 'insulation_full2' },
        'wrk_ins2_gi_found_penetrate': { name: 'Проникающая ГИ (Пенетрон)', unit: 'м²', price: 550, category: 'insulation_full2' },
        'wrk_ins2_gi_found_inject': { name: 'Инъекционная ГИ', unit: 'м.п.', price: 3500, category: 'insulation_full2' },
        // === ГИ МОКРЫХ ЗОН ===
        'wrk_ins2_gi_bath_coat': { name: 'Обмазочная ГИ ванной (2 слоя)', unit: 'м²', price: 400, category: 'insulation_full2' },
        'wrk_ins2_gi_bath_roll': { name: 'Рулонная ГИ ванной', unit: 'м²', price: 350, category: 'insulation_full2' },
        'wrk_ins2_gi_shower': { name: 'ГИ душевого поддона', unit: 'шт', price: 5500, category: 'insulation_full2' },
        'wrk_ins2_gi_pool': { name: 'ГИ бассейна', unit: 'м²', price: 850, category: 'insulation_full2' },
        // === ГИ ШВОВ ===
        'wrk_ins2_gi_joint_expand': { name: 'Герметизация деформационного шва', unit: 'м.п.', price: 550, category: 'insulation_full2' },
        'wrk_ins2_gi_bentonite': { name: 'Бентонитовый шнур', unit: 'м.п.', price: 350, category: 'insulation_full2' },
        'wrk_ins2_gi_waterstop': { name: 'Водоотсечная лента (waterstop)', unit: 'м.п.', price: 650, category: 'insulation_full2' },
        // === ТИ ФАСАДА ===
        'wrk_ins2_ti_facade_mw_50': { name: 'Утепление фасада минватой 50мм', unit: 'м²', price: 550, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_mw_100': { name: 'Утепление фасада минватой 100мм', unit: 'м²', price: 850, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_mw_150': { name: 'Утепление фасада минватой 150мм', unit: 'м²', price: 1100, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_mw_200': { name: 'Утепление фасада минватой 200мм', unit: 'м²', price: 1350, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_eps_50': { name: 'Утепление фасада ППС 50мм', unit: 'м²', price: 450, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_eps_100': { name: 'Утепление фасада ППС 100мм', unit: 'м²', price: 700, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_eps_150': { name: 'Утепление фасада ППС 150мм', unit: 'м²', price: 950, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_dowel': { name: 'Крепление утеплителя дюбелями', unit: 'шт', price: 30, category: 'insulation_full2' },
        'wrk_ins2_ti_facade_mesh': { name: 'Армирующий слой (сетка + клей)', unit: 'м²', price: 350, category: 'insulation_full2' },
        // === ТИ ФУНДАМЕНТА ===
        // === ТИ СТЕН ИЗНУТРИ ===
        'wrk_ins2_ti_wall_mw_50': { name: 'Утепление стены изнутри минватой 50мм', unit: 'м²', price: 350, category: 'insulation_full2' },
        'wrk_ins2_ti_wall_mw_100': { name: 'Утепление стены изнутри минватой 100мм', unit: 'м²', price: 550, category: 'insulation_full2' },
        // === ТИ ПЕРЕКРЫТИЙ ===
        'wrk_ins2_ti_attic_mw_200': { name: 'Утепление чердака минватой 200мм', unit: 'м²', price: 500, category: 'insulation_full2' },
        'wrk_ins2_ti_attic_mw_300': { name: 'Утепление чердака минватой 300мм', unit: 'м²', price: 700, category: 'insulation_full2' },
        // === ТИ ТРУБОПРОВОДОВ ===
        'wrk_ins2_ti_pipe_mw_50': { name: 'Изоляция труб минватой Ø50', unit: 'м.п.', price: 300, category: 'insulation_full2' },
        'wrk_ins2_ti_pipe_mw_100': { name: 'Изоляция труб минватой Ø100', unit: 'м.п.', price: 450, category: 'insulation_full2' },
        'wrk_ins2_ti_pipe_mw_200': { name: 'Изоляция труб минватой Ø200', unit: 'м.п.', price: 750, category: 'insulation_full2' },
        'wrk_ins2_ti_pipe_cladding': { name: 'Покровный слой (оцинковка)', unit: 'м²', price: 350, category: 'insulation_full2' },
        // === НАПЫЛЯЕМАЯ ===
        'wrk_ins2_ti_spray_pu_50': { name: 'Напыляемая ППУ 50мм', unit: 'м²', price: 650, category: 'insulation_full2' },
        'wrk_ins2_ti_spray_pu_100': { name: 'Напыляемая ППУ 100мм', unit: 'м²', price: 1200, category: 'insulation_full2' },
        'wrk_ins2_ti_ecowool': { name: 'Эковата (задувка)', unit: 'м³', price: 2500, category: 'insulation_full2' }
    };
})();
