// === ФАЗА 3: ДВЕРИ, ОКНА, ОСТЕКЛЕНИЕ, ВОРОТА, ОГРАЖДЕНИЯ (250 поз.) ===
(function () {
    // === ДВЕРИ (все виды) ===
    window.AI_WRK_DOORS_EXT = {
        // Межкомнатные двери
        'wrk_dr_int_ecoshpon': { name: 'Дверь межкомнатная экошпон', unit: 'шт', price: 2500, category: 'doors_ext' },
        'wrk_dr_int_shpon': { name: 'Дверь межкомнатная шпон', unit: 'шт', price: 3000, category: 'doors_ext' },
        'wrk_dr_int_massiv': { name: 'Дверь межкомнатная массив', unit: 'шт', price: 5000, category: 'doors_ext' },
        'wrk_dr_int_glass': { name: 'Дверь межкомнатная стекло', unit: 'шт', price: 5000, category: 'doors_ext' },
        'wrk_dr_int_hidden': { name: 'Дверь скрытая (невидимка)', unit: 'шт', price: 5000, category: 'doors_ext' },
        'wrk_dr_int_sliding': { name: 'Дверь-купе (1 створка)', unit: 'шт', price: 4000, category: 'doors_ext' },
        'wrk_dr_int_sliding_double': { name: 'Дверь-купе (2 створки)', unit: 'шт', price: 6000, category: 'doors_ext' },
        'wrk_dr_int_barn': { name: 'Дверь амбарная (на рейке)', unit: 'шт', price: 4000, category: 'doors_ext' },
        'wrk_dr_int_roto': { name: 'Рото-дверь', unit: 'шт', price: 6000, category: 'doors_ext' },
        // Входные двери
        'wrk_dr_front_steel_std': { name: 'Дверь входная стальная (стандарт)', unit: 'шт', price: 3000, category: 'doors_ext' },
        'wrk_dr_front_steel_prem': { name: 'Дверь входная стальная (премиум)', unit: 'шт', price: 8000, category: 'doors_ext' },
        'wrk_dr_front_steel_double': { name: 'Дверь входная двустворчатая', unit: 'шт', price: 12000, category: 'doors_ext' },
        'wrk_dr_front_armor': { name: 'Дверь бронированная', unit: 'шт', price: 20000, category: 'doors_ext' },
        // Технические двери
        'wrk_dr_fire_ei30': { name: 'Дверь противопожарная EI30', unit: 'шт', price: 5000, category: 'doors_ext' },
        'wrk_dr_fire_ei60': { name: 'Дверь противопожарная EI60', unit: 'шт', price: 8000, category: 'doors_ext' },
        'wrk_dr_fire_ei90': { name: 'Дверь противопожарная EI90', unit: 'шт', price: 12000, category: 'doors_ext' },
        'wrk_dr_fire_double': { name: 'Дверь противопожарная двустворчатая', unit: 'шт', price: 12000, category: 'doors_ext' },
        'wrk_dr_tech_steel': { name: 'Дверь техническая стальная', unit: 'шт', price: 3000, category: 'doors_ext' },
        'wrk_dr_sound_rw35': { name: 'Дверь звукоизоляционная Rw35', unit: 'шт', price: 5000, category: 'doors_ext' },
        'wrk_dr_sound_rw40': { name: 'Дверь звукоизоляционная Rw40', unit: 'шт', price: 8000, category: 'doors_ext' },
        // Коробка и фурнитура
        'wrk_dr_frame_wood': { name: 'Дверная коробка (деревянная)', unit: 'шт', price: 500, category: 'doors_ext' },
        'wrk_dr_frame_steel': { name: 'Дверная коробка (стальная)', unit: 'шт', price: 800, category: 'doors_ext' },
        'wrk_dr_frame_telesc': { name: 'Телескопическая коробка', unit: 'шт', price: 600, category: 'doors_ext' },
        'wrk_dr_dobor_10': { name: 'Доборная планка 10см', unit: 'шт', price: 100, category: 'doors_ext' },
        'wrk_dr_dobor_15': { name: 'Доборная планка 15см', unit: 'шт', price: 120, category: 'doors_ext' },
        'wrk_dr_dobor_20': { name: 'Доборная планка 20см', unit: 'шт', price: 150, category: 'doors_ext' },
        'wrk_dr_nalichnik': { name: 'Наличник (комплект)', unit: 'компл.', price: 200, category: 'doors_ext' },
        'wrk_dr_handle_std': { name: 'Ручка дверная (стандарт)', unit: 'шт', price: 50, category: 'doors_ext' },
        'wrk_dr_handle_design': { name: 'Ручка дверная (дизайнерская)', unit: 'шт', price: 200, category: 'doors_ext' },
        'wrk_dr_lock_cyl': { name: 'Замок дверной (цилиндровый)', unit: 'шт', price: 100, category: 'doors_ext' },
        'wrk_dr_lock_magnetic': { name: 'Замок магнитный', unit: 'шт', price: 200, category: 'doors_ext' },
        'wrk_dr_closer': { name: 'Доводчик дверной', unit: 'шт', price: 300, category: 'doors_ext' },
        'wrk_dr_demo': { name: 'Демонтаж двери', unit: 'шт', price: 200, category: 'doors_ext' },
        // Люки
        'wrk_dr_hatch_steel': { name: 'Люк стальной (пол/потолок)', unit: 'шт', price: 1000, category: 'doors_ext' },
        'wrk_dr_hatch_fire': { name: 'Люк противопожарный', unit: 'шт', price: 2000, category: 'doors_ext' },
        'wrk_dr_hatch_attic': { name: 'Чердачная лестница-люк', unit: 'шт', price: 3000, category: 'doors_ext' }
    };

    // === ОКНА И ОСТЕКЛЕНИЕ ===
    window.AI_WRK_WINDOWS_EXT = {
        // ПВХ окна
        'wrk_wn_pvc_1x1': { name: 'Окно ПВХ 1×1м (глухое)', unit: 'шт', price: 3000, category: 'windows_ext' },
        'wrk_wn_pvc_1x1_open': { name: 'Окно ПВХ 1×1м (открывающееся)', unit: 'шт', price: 4000, category: 'windows_ext' },
        'wrk_wn_pvc_1x15': { name: 'Окно ПВХ 1×1.5м', unit: 'шт', price: 5000, category: 'windows_ext' },
        'wrk_wn_pvc_15x15': { name: 'Окно ПВХ 1.5×1.5м', unit: 'шт', price: 6000, category: 'windows_ext' },
        'wrk_wn_pvc_2x15': { name: 'Окно ПВХ 2×1.5м (двустворч.)', unit: 'шт', price: 8000, category: 'windows_ext' },
        'wrk_wn_pvc_3x15': { name: 'Окно ПВХ 3×1.5м (трёхстворч.)', unit: 'шт', price: 12000, category: 'windows_ext' },
        'wrk_wn_pvc_balcony': { name: 'Балконный блок ПВХ', unit: 'шт', price: 10000, category: 'windows_ext' },
        'wrk_wn_pvc_energy': { name: 'Энергосберегающий стеклопакет', unit: 'м²', price: 1000, category: 'windows_ext' },
        'wrk_wn_pvc_triplex': { name: 'Триплекс стеклопакет', unit: 'м²', price: 1500, category: 'windows_ext' },
        'wrk_wn_pvc_multifunc': { name: 'Мультифункциональный стеклопакет', unit: 'м²', price: 1200, category: 'windows_ext' },
        // Алюминиевые
        'wrk_wn_alu_facade': { name: 'Фасадное остекление (алюминий)', unit: 'м²', price: 5000, category: 'windows_ext' },
        // Деревянные
        'wrk_wn_wood_pine': { name: 'Окно деревянное (сосна)', unit: 'м²', price: 4000, category: 'windows_ext' },
        'wrk_wn_wood_oak': { name: 'Окно деревянное (дуб)', unit: 'м²', price: 6000, category: 'windows_ext' },
        'wrk_wn_wood_larch': { name: 'Окно деревянное (лиственница)', unit: 'м²', price: 5000, category: 'windows_ext' },
        // Мансардные
        'wrk_wn_skylight_78x98': { name: 'Мансардное окно 78×98', unit: 'шт', price: 8000, category: 'windows_ext' },
        'wrk_wn_skylight_78x118': { name: 'Мансардное окно 78×118', unit: 'шт', price: 10000, category: 'windows_ext' },
        'wrk_wn_skylight_78x140': { name: 'Мансардное окно 78×140', unit: 'шт', price: 12000, category: 'windows_ext' },
        'wrk_wn_skylight_flashing': { name: 'Оклад мансардного окна', unit: 'шт', price: 2000, category: 'windows_ext' },
        // Витражи
        'wrk_wn_curtain_wall': { name: 'Светопрозрачная фасадная система', unit: 'м²', price: 6000, category: 'windows_ext' },
        'wrk_wn_structure_glazing': { name: 'Структурное остекление', unit: 'м²', price: 8000, category: 'windows_ext' },
        'wrk_wn_spider_glazing': { name: 'Спайдерное остекление', unit: 'м²', price: 7000, category: 'windows_ext' },
        // Подоконники и откосы
        'wrk_wn_slope_pvc': { name: 'Откосы ПВХ-панели', unit: 'м.п.', price: 80, category: 'windows_ext' },
        'wrk_wn_foam_seal': { name: 'Запенивание окна', unit: 'окно', price: 100, category: 'windows_ext' },
        // Балкон / лоджия
        'wrk_wn_balcony_french': { name: 'Французский балкон', unit: 'м²', price: 5000, category: 'windows_ext' },
    };

    // === ВОРОТА / ЗАБОРЫ / ОГРАЖДЕНИЯ ===
    window.AI_WRK_GATES_FENCE = {
        // Ворота
        'wrk_gt_swing_metal': { name: 'Ворота распашные (металл)', unit: 'шт', price: 10000, category: 'gates_fence' },
        'wrk_gt_swing_auto': { name: 'Ворота распашные (автоматические)', unit: 'шт', price: 20000, category: 'gates_fence' },
        'wrk_gt_sliding_manual': { name: 'Ворота откатные (ручные)', unit: 'шт', price: 15000, category: 'gates_fence' },
        'wrk_gt_sliding_auto': { name: 'Ворота откатные (автоматические)', unit: 'шт', price: 25000, category: 'gates_fence' },
        'wrk_gt_sectional': { name: 'Ворота секционные (гараж)', unit: 'шт', price: 15000, category: 'gates_fence' },
        'wrk_gt_sectional_auto': { name: 'Ворота секционные (автоматика)', unit: 'шт', price: 25000, category: 'gates_fence' },
        'wrk_gt_roller': { name: 'Рольставни', unit: 'м²', price: 2000, category: 'gates_fence' },
        'wrk_gt_roller_auto': { name: 'Рольставни (автоматика)', unit: 'м²', price: 3000, category: 'gates_fence' },
        'wrk_gt_wicket': { name: 'Калитка (установка)', unit: 'шт', price: 3000, category: 'gates_fence' },
        // Заборы
        'wrk_gt_fence_profsheet': { name: 'Забор из профнастила', unit: 'м.п.', price: 1000, category: 'gates_fence' },
        'wrk_gt_fence_profsheet_h2': { name: 'Забор из профнастила h=2м', unit: 'м.п.', price: 1200, category: 'gates_fence' },
        'wrk_gt_fence_profsheet_h25': { name: 'Забор из профнастила h=2.5м', unit: 'м.п.', price: 1500, category: 'gates_fence' },
        'wrk_gt_fence_wood': { name: 'Забор деревянный (штакетник)', unit: 'м.п.', price: 800, category: 'gates_fence' },
        'wrk_gt_fence_chain': { name: 'Забор сетка-рабица', unit: 'м.п.', price: 400, category: 'gates_fence' },
        'wrk_gt_fence_3d_mesh': { name: 'Забор 3D сетка', unit: 'м.п.', price: 700, category: 'gates_fence' },
        'wrk_gt_fence_stone': { name: 'Забор каменный', unit: 'м.п.', price: 5000, category: 'gates_fence' },
        'wrk_gt_fence_concrete': { name: 'Забор бетонный (секционный)', unit: 'м.п.', price: 2000, category: 'gates_fence' },
        'wrk_gt_fence_combined': { name: 'Забор комбинированный (кирпич+металл)', unit: 'м.п.', price: 3000, category: 'gates_fence' },
        'wrk_gt_fence_gabion': { name: 'Забор габион', unit: 'м.п.', price: 3000, category: 'gates_fence' },
        // Столбы
        'wrk_gt_post_metal_60': { name: 'Столб металлич. 60×60мм', unit: 'шт', price: 300, category: 'gates_fence' },
        'wrk_gt_post_metal_80': { name: 'Столб металлич. 80×80мм', unit: 'шт', price: 400, category: 'gates_fence' },
        'wrk_gt_post_brick': { name: 'Столб кирпичный', unit: 'шт', price: 2000, category: 'gates_fence' },
        'wrk_gt_post_concrete': { name: 'Бетонирование столба', unit: 'шт', price: 200, category: 'gates_fence' },
        'wrk_gt_post_screw': { name: 'Столб на винтовой свае', unit: 'шт', price: 500, category: 'gates_fence' },
        // Ограждения балконов/террас
        'wrk_gt_balcony_metal': { name: 'Ограждение балкона (металл)', unit: 'м.п.', price: 500, category: 'gates_fence' },
        'wrk_gt_balcony_glass': { name: 'Ограждение балкона (стекло)', unit: 'м.п.', price: 2000, category: 'gates_fence' },
        'wrk_gt_balcony_ss': { name: 'Ограждение нержавейка', unit: 'м.п.', price: 1000, category: 'gates_fence' },
        'wrk_gt_terrace_wood': { name: 'Ограждение террасы (дерево)', unit: 'м.п.', price: 500, category: 'gates_fence' },
        'wrk_gt_terrace_wpc': { name: 'Ограждение ДПК', unit: 'м.п.', price: 600, category: 'gates_fence' }
    };
})();
