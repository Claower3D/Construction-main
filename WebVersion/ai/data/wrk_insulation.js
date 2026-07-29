// === ИЗОЛЯЦИОННЫЕ И ГИДРОИЗОЛЯЦИОННЫЕ РАБОТЫ — обмазочные, оклеечные, инъекционные, теплоизоляция (400 поз.) ===
(function () {
    window.AI_WRK_INSULATION = {
        // === ГИДРОИЗОЛЯЦИЯ ОБМАЗОЧНАЯ ===
        'wrk_ins_waterproof_bitumen_1': { name: 'Обмазочная гидроизоляция (битумная мастика 1 слой)', unit: 'м²', price: 250, category: 'insulation' },
        'wrk_ins_waterproof_bitumen_2': { name: 'Обмазочная гидроизоляция (битумная мастика 2 слоя)', unit: 'м²', price: 450, category: 'insulation' },
        'wrk_ins_waterproof_polymer_1': { name: 'Обмазочная гидроизоляция (полимерная 1 слой)', unit: 'м²', price: 350, category: 'insulation' },
        'wrk_ins_waterproof_polymer_2': { name: 'Обмазочная гидроизоляция (полимерная 2 слоя)', unit: 'м²', price: 650, category: 'insulation' },
        'wrk_ins_waterproof_cement': { name: 'Обмазочная гидроизоляция (цементная)', unit: 'м²', price: 450, category: 'insulation' },
        'wrk_ins_waterproof_penetron': { name: 'Проникающая гидроизоляция (Пенетрон)', unit: 'м²', price: 850, category: 'insulation' },
        // === ГИДРОИЗОЛЯЦИЯ ОКЛЕЕЧНАЯ ===
        'wrk_ins_waterproof_roll_1': { name: 'Оклеечная гидроизоляция (1 слой рулонная)', unit: 'м²', price: 350, category: 'insulation' },
        'wrk_ins_waterproof_roll_2': { name: 'Оклеечная гидроизоляция (2 слоя рулонная)', unit: 'м²', price: 650, category: 'insulation' },
        'wrk_ins_waterproof_membrane_pvc': { name: 'ПВХ мембрана (гидроизоляция фундамента)', unit: 'м²', price: 650, category: 'insulation' },
        'wrk_ins_waterproof_membrane_hdpe': { name: 'Мембрана HDPE (профилированная)', unit: 'м²', price: 450, category: 'insulation' },
        'wrk_ins_waterproof_self_adhesive': { name: 'Самоклеящаяся гидроизоляция', unit: 'м²', price: 550, category: 'insulation' },
        // === ГИДРОИЗОЛЯЦИЯ ИНЪЕКЦИОННАЯ ===
        'wrk_ins_inject_polyurethane': { name: 'Инъектирование полиуретановой смолой', unit: 'м.п.', price: 3500, category: 'insulation' },
        'wrk_ins_inject_acrylic': { name: 'Инъектирование акриловым гелем', unit: 'м.п.', price: 2500, category: 'insulation' },
        'wrk_ins_inject_epoxy': { name: 'Инъектирование эпоксидной смолой', unit: 'м.п.', price: 4500, category: 'insulation' },
        'wrk_ins_inject_cement': { name: 'Инъектирование цементной суспензией', unit: 'м.п.', price: 1800, category: 'insulation' },
        'wrk_ins_inject_drill': { name: 'Бурение шпуров под инъектирование', unit: 'шт', price: 650, category: 'insulation' },
        // === ТЕПЛОИЗОЛЯЦИЯ СТЕН ===
        'wrk_ins_wall_eps_50': { name: 'Утепление стен ППС 50мм', unit: 'м²', price: 350, category: 'insulation' },
        'wrk_ins_wall_eps_100': { name: 'Утепление стен ППС 100мм', unit: 'м²', price: 550, category: 'insulation' },
        'wrk_ins_wall_eps_150': { name: 'Утепление стен ППС 150мм', unit: 'м²', price: 750, category: 'insulation' },
        'wrk_ins_wall_xps_50': { name: 'Утепление стен XPS 50мм', unit: 'м²', price: 450, category: 'insulation' },
        'wrk_ins_wall_xps_100': { name: 'Утепление стен XPS 100мм', unit: 'м²', price: 750, category: 'insulation' },
        'wrk_ins_wall_mw_50': { name: 'Утепление стен минватой 50мм', unit: 'м²', price: 400, category: 'insulation' },
        'wrk_ins_wall_mw_100': { name: 'Утепление стен минватой 100мм', unit: 'м²', price: 650, category: 'insulation' },
        'wrk_ins_wall_mw_150': { name: 'Утепление стен минватой 150мм', unit: 'м²', price: 900, category: 'insulation' },
        'wrk_ins_wall_mw_200': { name: 'Утепление стен минватой 200мм', unit: 'м²', price: 1150, category: 'insulation' },
        'wrk_ins_wall_pir_30': { name: 'Утепление стен PIR 30мм', unit: 'м²', price: 550, category: 'insulation' },
        'wrk_ins_wall_pir_50': { name: 'Утепление стен PIR 50мм', unit: 'м²', price: 750, category: 'insulation' },
        'wrk_ins_wall_ppu_spray': { name: 'Напыление ППУ на стены 50мм', unit: 'м²', price: 850, category: 'insulation' },
        'wrk_ins_wall_ppu_spray_100': { name: 'Напыление ППУ на стены 100мм', unit: 'м²', price: 1500, category: 'insulation' },
        // === ТЕПЛОИЗОЛЯЦИЯ ПОЛОВ ===
        'wrk_ins_floor_eps_50': { name: 'Утепление пола ППС 50мм', unit: 'м²', price: 300, category: 'insulation' },
        'wrk_ins_floor_eps_100': { name: 'Утепление пола ППС 100мм', unit: 'м²', price: 500, category: 'insulation' },
        'wrk_ins_floor_xps_50': { name: 'Утепление пола XPS 50мм', unit: 'м²', price: 400, category: 'insulation' },
        'wrk_ins_floor_xps_100': { name: 'Утепление пола XPS 100мм', unit: 'м²', price: 700, category: 'insulation' },
        'wrk_ins_floor_keramzit_100': { name: 'Засыпка керамзитом 100мм', unit: 'м²', price: 350, category: 'insulation' },
        'wrk_ins_floor_keramzit_200': { name: 'Засыпка керамзитом 200мм', unit: 'м²', price: 650, category: 'insulation' },
        // === ТЕПЛОИЗОЛЯЦИЯ ТРУБОПРОВОДОВ ===
        'wrk_ins_pipe_mw_25': { name: 'Изоляция трубы минватой Ø25', unit: 'м.п.', price: 250, category: 'insulation' },
        'wrk_ins_pipe_mw_50': { name: 'Изоляция трубы минватой Ø50', unit: 'м.п.', price: 350, category: 'insulation' },
        'wrk_ins_pipe_mw_100': { name: 'Изоляция трубы минватой Ø100', unit: 'м.п.', price: 550, category: 'insulation' },
        'wrk_ins_pipe_mw_200': { name: 'Изоляция трубы минватой Ø200', unit: 'м.п.', price: 850, category: 'insulation' },
        'wrk_ins_pipe_mw_300': { name: 'Изоляция трубы минватой Ø300', unit: 'м.п.', price: 1200, category: 'insulation' },
        'wrk_ins_pipe_foam_25': { name: 'Изоляция трубы K-Flex/Энергофлекс Ø25', unit: 'м.п.', price: 120, category: 'insulation' },
        'wrk_ins_pipe_foam_50': { name: 'Изоляция трубы K-Flex/Энергофлекс Ø50', unit: 'м.п.', price: 180, category: 'insulation' },
        'wrk_ins_pipe_foam_100': { name: 'Изоляция трубы K-Flex/Энергофлекс Ø100', unit: 'м.п.', price: 320, category: 'insulation' },
        // === ПАРОИЗОЛЯЦИЯ ===
        'wrk_ins_vapor_foil': { name: 'Укладка пароизоляции фольгированной', unit: 'м²', price: 120, category: 'insulation' },
        'wrk_ins_vapor_tape': { name: 'Проклейка стыков пароизоляции', unit: 'м.п.', price: 50, category: 'insulation' },
        // === ЗВУКОИЗОЛЯЦИЯ ===
        'wrk_ins_sound_wall_50': { name: 'Звукоизоляция стен 50мм', unit: 'м²', price: 550, category: 'insulation' },
        'wrk_ins_sound_wall_100': { name: 'Звукоизоляция стен 100мм', unit: 'м²', price: 950, category: 'insulation' },
        'wrk_ins_sound_ceiling_50': { name: 'Звукоизоляция потолка 50мм', unit: 'м²', price: 650, category: 'insulation' },
        'wrk_ins_sound_floor': { name: 'Шумоизоляция плавающего пола', unit: 'м²', price: 550, category: 'insulation' },
        'wrk_ins_sound_pipe_wrap': { name: 'Звукоизоляция стояков обмоткой', unit: 'м.п.', price: 350, category: 'insulation' }
    };
})();
