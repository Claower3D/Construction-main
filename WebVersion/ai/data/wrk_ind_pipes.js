// === ПРОМЫШЛЕННЫЕ ТРУБОПРОВОДЫ — технологические, паровые, хим., нерж. (50 поз.) ===
(function () {
    window.AI_WRK_IND_PIPES = {
        // === СТАЛЬНЫЕ ТРУБОПРОВОДЫ === 1-10
        'wrk_ip_steel_25': { name: 'Трубопровод стальной Ø25', unit: 'м.п.', price: 550, category: 'indpipes' },
        'wrk_ip_steel_50': { name: 'Трубопровод стальной Ø50', unit: 'м.п.', price: 850, category: 'indpipes' },
        'wrk_ip_steel_100': { name: 'Трубопровод стальной Ø100', unit: 'м.п.', price: 1500, category: 'indpipes' },
        'wrk_ip_steel_150': { name: 'Трубопровод стальной Ø150', unit: 'м.п.', price: 2500, category: 'indpipes' },
        'wrk_ip_steel_200': { name: 'Трубопровод стальной Ø200', unit: 'м.п.', price: 3500, category: 'indpipes' },
        'wrk_ip_steel_300': { name: 'Трубопровод стальной Ø300', unit: 'м.п.', price: 5500, category: 'indpipes' },
        'wrk_ip_steel_500': { name: 'Трубопровод стальной Ø500', unit: 'м.п.', price: 12000, category: 'indpipes' },
        'wrk_ip_steel_700': { name: 'Трубопровод стальной Ø700', unit: 'м.п.', price: 18000, category: 'indpipes' },
        'wrk_ip_steel_1000': { name: 'Трубопровод стальной Ø1000', unit: 'м.п.', price: 35000, category: 'indpipes' },
        'wrk_ip_steel_1200': { name: 'Трубопровод стальной Ø1200', unit: 'м.п.', price: 55000, category: 'indpipes' },
        // === НЕРЖАВЕЮЩИЕ === 11-16
        'wrk_ip_ss_25': { name: 'Труб. нержавеющий Ø25', unit: 'м.п.', price: 1500, category: 'indpipes' },
        'wrk_ip_ss_50': { name: 'Труб. нержавеющий Ø50', unit: 'м.п.', price: 2500, category: 'indpipes' },
        'wrk_ip_ss_100': { name: 'Труб. нержавеющий Ø100', unit: 'м.п.', price: 5500, category: 'indpipes' },
        'wrk_ip_ss_150': { name: 'Труб. нержавеющий Ø150', unit: 'м.п.', price: 8500, category: 'indpipes' },
        'wrk_ip_ss_orbital': { name: 'Орбитальная сварка (нерж.)', unit: 'стык', price: 3500, category: 'indpipes' },
        'wrk_ip_ss_polish': { name: 'Полировка нержав. трубы', unit: 'м.п.', price: 850, category: 'indpipes' },
        // === ПАРОВЫЕ === 17-22
        'wrk_ip_steam_25': { name: 'Паропровод Ø25', unit: 'м.п.', price: 1200, category: 'indpipes' },
        'wrk_ip_steam_50': { name: 'Паропровод Ø50', unit: 'м.п.', price: 2500, category: 'indpipes' },
        'wrk_ip_steam_100': { name: 'Паропровод Ø100', unit: 'м.п.', price: 3500, category: 'indpipes' },
        'wrk_ip_steam_200': { name: 'Паропровод Ø200', unit: 'м.п.', price: 8500, category: 'indpipes' },
        'wrk_ip_steam_trap': { name: 'Конденсатоотводчик', unit: 'шт', price: 8500, category: 'indpipes' },
        'wrk_ip_condensate_return': { name: 'Конденсатопровод возвратный', unit: 'м.п.', price: 1500, category: 'indpipes' },
        // === СВАРКА === 23-28
        'wrk_ip_weld_butt_50': { name: 'Стыковая сварка Ø50', unit: 'стык', price: 850, category: 'indpipes' },
        'wrk_ip_weld_butt_100': { name: 'Стыковая сварка Ø100', unit: 'стык', price: 1500, category: 'indpipes' },
        'wrk_ip_weld_butt_200': { name: 'Стыковая сварка Ø200', unit: 'стык', price: 3500, category: 'indpipes' },
        'wrk_ip_weld_butt_500': { name: 'Стыковая сварка Ø500', unit: 'стык', price: 8500, category: 'indpipes' },
        'wrk_ip_xray_weld': { name: 'Рентген сварного стыка', unit: 'стык', price: 1500, category: 'indpipes' },
        'wrk_ip_ultrasonic_weld': { name: 'УЗК сварного стыка', unit: 'стык', price: 850, category: 'indpipes' },
        // === АРМАТУРА === 29-36
        'wrk_ip_valve_gate_50': { name: 'Задвижка Ø50', unit: 'шт', price: 3500, category: 'indpipes' },
        'wrk_ip_valve_gate_100': { name: 'Задвижка Ø100', unit: 'шт', price: 5500, category: 'indpipes' },
        'wrk_ip_valve_gate_200': { name: 'Задвижка Ø200', unit: 'шт', price: 15000, category: 'indpipes' },
        'wrk_ip_valve_ball_50': { name: 'Кран шаровый Ø50', unit: 'шт', price: 1500, category: 'indpipes' },
        'wrk_ip_valve_ball_100': { name: 'Кран шаровый Ø100', unit: 'шт', price: 3500, category: 'indpipes' },
        'wrk_ip_valve_check_50': { name: 'Обратный клапан Ø50', unit: 'шт', price: 1500, category: 'indpipes' },
        'wrk_ip_valve_relief': { name: 'Предохранительный клапан', unit: 'шт', price: 5500, category: 'indpipes' },
        'wrk_ip_expansion_joint': { name: 'Компенсатор сильфонный', unit: 'шт', price: 5500, category: 'indpipes' },
        // === ИЗОЛЯЦИЯ === 37-42
        'wrk_ip_insul_minwool_50': { name: 'Изоляция мин. ватой 50мм', unit: 'м.п.', price: 350, category: 'indpipes' },
        'wrk_ip_insul_minwool_100': { name: 'Изоляция мин. ватой 100мм', unit: 'м.п.', price: 550, category: 'indpipes' },
        'wrk_ip_insul_alu_cover': { name: 'Алюминиевый кожух', unit: 'м.п.', price: 350, category: 'indpipes' },
        'wrk_ip_insul_ppu': { name: 'Изоляция ППУ', unit: 'м.п.', price: 850, category: 'indpipes' },
        'wrk_ip_heat_trace': { name: 'Обогрев трубопровода (кабель)', unit: 'м.п.', price: 550, category: 'indpipes' },
        'wrk_ip_insul_cold': { name: 'Холодная изоляция (K-Flex)', unit: 'м.п.', price: 550, category: 'indpipes' },
        // === ОПОРЫ / ПОДВЕСЫ === 43-48
        'wrk_ip_support_fixed': { name: 'Опора неподвижная', unit: 'шт', price: 1500, category: 'indpipes' },
        'wrk_ip_support_sliding': { name: 'Опора скользящая', unit: 'шт', price: 850, category: 'indpipes' },
        'wrk_ip_support_spring': { name: 'Опора пружинная', unit: 'шт', price: 5500, category: 'indpipes' },
        'wrk_ip_hanger_rod': { name: 'Подвеска стержневая', unit: 'шт', price: 850, category: 'indpipes' },
        'wrk_ip_hanger_spring': { name: 'Подвеска пружинная', unit: 'шт', price: 5500, category: 'indpipes' },
        'wrk_ip_hydro_test': { name: 'Гидроиспытание трубопровода', unit: 'система', price: 25000, category: 'indpipes' }
    };
})();
