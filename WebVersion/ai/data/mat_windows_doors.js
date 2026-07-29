// === РАСШ. КАТАЛОГ ОКОН И ДВЕРЕЙ (150 позиций) ===
(function () {
    window.AI_MAT_WINDOWS_DOORS = {
        // Окна ПВХ (3-камерный профиль, одностворчатое)
        'win_pvc_3cam_600x600': { name: 'Окно ПВХ 3-кам. 600×600мм глухое', unit: 'шт', price: 4000, category: 'windows_doors' },
        'win_pvc_3cam_600x900': { name: 'Окно ПВХ 3-кам. 600×900мм поворотное', unit: 'шт', price: 5500, category: 'windows_doors' },
        'win_pvc_3cam_600x1200': { name: 'Окно ПВХ 3-кам. 600×1200мм п/о', unit: 'шт', price: 7000, category: 'windows_doors' },
        'win_pvc_3cam_900x1200': { name: 'Окно ПВХ 3-кам. 900×1200мм п/о', unit: 'шт', price: 8000, category: 'windows_doors' },
        'win_pvc_3cam_900x1400': { name: 'Окно ПВХ 3-кам. 900×1400мм п/о', unit: 'шт', price: 9000, category: 'windows_doors' },
        // 5-камерный профиль
        'win_pvc_5cam_600x600': { name: 'Окно ПВХ 5-кам. 600×600мм глухое', unit: 'шт', price: 5000, category: 'windows_doors' },
        'win_pvc_5cam_600x900': { name: 'Окно ПВХ 5-кам. 600×900мм п/о', unit: 'шт', price: 7000, category: 'windows_doors' },
        'win_pvc_5cam_900x1200': { name: 'Окно ПВХ 5-кам. 900×1200мм п/о', unit: 'шт', price: 10000, category: 'windows_doors' },
        'win_pvc_5cam_900x1400': { name: 'Окно ПВХ 5-кам. 900×1400мм п/о', unit: 'шт', price: 11500, category: 'windows_doors' },
        // Двустворчатые
        'win_pvc_3cam_1200x1200': { name: 'Окно ПВХ 3-кам. 1200×1200мм (2 ств.)', unit: 'шт', price: 10000, category: 'windows_doors' },
        'win_pvc_3cam_1200x1400': { name: 'Окно ПВХ 3-кам. 1200×1400мм (2 ств.)', unit: 'шт', price: 12000, category: 'windows_doors' },
        'win_pvc_5cam_1200x1200': { name: 'Окно ПВХ 5-кам. 1200×1200мм (2 ств.)', unit: 'шт', price: 13000, category: 'windows_doors' },
        'win_pvc_5cam_1200x1400': { name: 'Окно ПВХ 5-кам. 1200×1400мм (2 ств.)', unit: 'шт', price: 15000, category: 'windows_doors' },
        'win_pvc_5cam_1300x1400': { name: 'Окно ПВХ 5-кам. 1300×1400мм (2 ств.)', unit: 'шт', price: 16000, category: 'windows_doors' },
        // Трёхстворчатые
        'win_pvc_3cam_1800x1200': { name: 'Окно ПВХ 3-кам. 1800×1200мм (3 ств.)', unit: 'шт', price: 16000, category: 'windows_doors' },
        'win_pvc_3cam_1800x1400': { name: 'Окно ПВХ 3-кам. 1800×1400мм (3 ств.)', unit: 'шт', price: 18000, category: 'windows_doors' },
        'win_pvc_5cam_1800x1200': { name: 'Окно ПВХ 5-кам. 1800×1200мм (3 ств.)', unit: 'шт', price: 20000, category: 'windows_doors' },
        'win_pvc_5cam_1800x1400': { name: 'Окно ПВХ 5-кам. 1800×1400мм (3 ств.)', unit: 'шт', price: 22000, category: 'windows_doors' },
        'win_pvc_5cam_2100x1400': { name: 'Окно ПВХ 5-кам. 2100×1400мм (3 ств.)', unit: 'шт', price: 26000, category: 'windows_doors' },
        // Балконная дверь
        'win_pvc_balcony_700x2100_3cam': { name: 'Дверь балконная ПВХ 3-кам. 700×2100мм', unit: 'шт', price: 10000, category: 'windows_doors' },
        'win_pvc_balcony_700x2100_5cam': { name: 'Дверь балконная ПВХ 5-кам. 700×2100мм', unit: 'шт', price: 13000, category: 'windows_doors' },
        'win_pvc_balcony_block_3cam': { name: 'Балконный блок ПВХ 3-кам. (окно+дверь)', unit: 'шт', price: 18000, category: 'windows_doors' },
        'win_pvc_balcony_block_5cam': { name: 'Балконный блок ПВХ 5-кам. (окно+дверь)', unit: 'шт', price: 22000, category: 'windows_doors' },
        // Стеклопакеты
        'glazing_single': { name: 'Стеклопакет однокамерный (м²)', unit: 'м²', price: 1500, category: 'windows_doors' },
        'glazing_double': { name: 'Стеклопакет двухкамерный (м²)', unit: 'м²', price: 2500, category: 'windows_doors' },
        'glazing_double_energy': { name: 'Стеклопакет 2-кам. энергосберег. (м²)', unit: 'м²', price: 3500, category: 'windows_doors' },
        'glazing_double_multif': { name: 'Стеклопакет 2-кам. мультифункц. (м²)', unit: 'м²', price: 4000, category: 'windows_doors' },
        // Подоконники ПВХ
        'sill_pvc_150x1500_white': { name: 'Подоконник ПВХ 150мм белый (1.5м)', unit: 'шт', price: 350, category: 'windows_doors' },
        'sill_pvc_200x1500_white': { name: 'Подоконник ПВХ 200мм белый (1.5м)', unit: 'шт', price: 450, category: 'windows_doors' },
        'sill_pvc_250x1500_white': { name: 'Подоконник ПВХ 250мм белый (1.5м)', unit: 'шт', price: 550, category: 'windows_doors' },
        'sill_pvc_300x1500_white': { name: 'Подоконник ПВХ 300мм белый (1.5м)', unit: 'шт', price: 650, category: 'windows_doors' },
        'sill_pvc_350x1500_white': { name: 'Подоконник ПВХ 350мм белый (1.5м)', unit: 'шт', price: 750, category: 'windows_doors' },
        'sill_pvc_400x1500_white': { name: 'Подоконник ПВХ 400мм белый (1.5м)', unit: 'шт', price: 850, category: 'windows_doors' },
        'sill_pvc_450x1500_white': { name: 'Подоконник ПВХ 450мм белый (1.5м)', unit: 'шт', price: 950, category: 'windows_doors' },
        'sill_pvc_500x1500_white': { name: 'Подоконник ПВХ 500мм белый (1.5м)', unit: 'шт', price: 1100, category: 'windows_doors' },
        'sill_pvc_600x1500_white': { name: 'Подоконник ПВХ 600мм белый (1.5м)', unit: 'шт', price: 1300, category: 'windows_doors' },
        // Подоконник под дерево/камень
        'sill_pvc_300x1500_oak': { name: 'Подоконник ПВХ 300мм дуб (1.5м)', unit: 'шт', price: 800, category: 'windows_doors' },
        'sill_pvc_300x1500_walnut': { name: 'Подоконник ПВХ 300мм орех (1.5м)', unit: 'шт', price: 800, category: 'windows_doors' },
        'sill_stone_acrylic_300': { name: 'Подоконник искусств. камень 300мм (п.м.)', unit: 'п.м.', price: 3000, category: 'windows_doors' },
        // Откосы
        'slope_pvc_250x2200': { name: 'Откос ПВХ 250мм (2.2м)', unit: 'шт', price: 200, category: 'windows_doors' },
        'slope_pvc_300x2200': { name: 'Откос ПВХ 300мм (2.2м)', unit: 'шт', price: 250, category: 'windows_doors' },
        'slope_pvc_400x2200': { name: 'Откос ПВХ 400мм (2.2м)', unit: 'шт', price: 300, category: 'windows_doors' },
        'slope_pvc_500x2200': { name: 'Откос ПВХ 500мм (2.2м)', unit: 'шт', price: 400, category: 'windows_doors' },
        'slope_sandwich_8mm': { name: 'Сэндвич-панель для откосов 8мм (1.5×3м)', unit: 'лист', price: 1200, category: 'windows_doors' },
        'slope_sandwich_10mm': { name: 'Сэндвич-панель для откосов 10мм (1.5×3м)', unit: 'лист', price: 1500, category: 'windows_doors' },
        'slope_f_profile_3m': { name: 'F-профиль для откоса (3м)', unit: 'шт', price: 50, category: 'windows_doors' },
        'slope_start_profile_3m': { name: 'Стартовый профиль для откоса (3м)', unit: 'шт', price: 30, category: 'windows_doors' },
        // Отливы
        'drip_galv_150x2000': { name: 'Отлив оцинков. 150мм (2м)', unit: 'шт', price: 200, category: 'windows_doors' },
        'drip_galv_200x2000': { name: 'Отлив оцинков. 200мм (2м)', unit: 'шт', price: 250, category: 'windows_doors' },
        'drip_galv_250x2000': { name: 'Отлив оцинков. 250мм (2м)', unit: 'шт', price: 300, category: 'windows_doors' },
        'drip_color_150x2000': { name: 'Отлив полимерный 150мм (2м)', unit: 'шт', price: 350, category: 'windows_doors' },
        'drip_color_250x2000': { name: 'Отлив полимерный 250мм (2м)', unit: 'шт', price: 450, category: 'windows_doors' },
        // Двери межкомнатные
        'door_inter_eco_600': { name: 'Дверь межкомн. эконом 600мм (глухая)', unit: 'шт', price: 3000, category: 'windows_doors' },
        'door_inter_eco_700': { name: 'Дверь межкомн. эконом 700мм (глухая)', unit: 'шт', price: 3200, category: 'windows_doors' },
        'door_inter_eco_800': { name: 'Дверь межкомн. эконом 800мм (глухая)', unit: 'шт', price: 3500, category: 'windows_doors' },
        'door_inter_eco_900': { name: 'Дверь межкомн. эконом 900мм (глухая)', unit: 'шт', price: 3800, category: 'windows_doors' },
        'door_inter_std_600_glass': { name: 'Дверь межкомн. стандарт 600мм (со стеклом)', unit: 'шт', price: 5000, category: 'windows_doors' },
        'door_inter_std_700_glass': { name: 'Дверь межкомн. стандарт 700мм (со стеклом)', unit: 'шт', price: 5500, category: 'windows_doors' },
        'door_inter_std_800_glass': { name: 'Дверь межкомн. стандарт 800мм (со стеклом)', unit: 'шт', price: 6000, category: 'windows_doors' },
        'door_inter_std_800_solid': { name: 'Дверь межкомн. стандарт 800мм (глухая)', unit: 'шт', price: 5000, category: 'windows_doors' },
        'door_inter_premium_800_oak': { name: 'Дверь межкомн. премиум 800мм шпон дуб', unit: 'шт', price: 12000, category: 'windows_doors' },
        'door_inter_premium_800_ash': { name: 'Дверь межкомн. премиум 800мм шпон ясень', unit: 'шт', price: 14000, category: 'windows_doors' },
        'door_inter_premium_800_glass': { name: 'Дверь межкомн. премиум 800мм со стеклом', unit: 'шт', price: 15000, category: 'windows_doors' },
        'door_inter_solid_oak_800': { name: 'Дверь массив дуба 800мм', unit: 'шт', price: 25000, category: 'windows_doors' },
        // Двери скрытого монтажа
        'door_hidden_800_white': { name: 'Дверь скрытого монтажа 800мм белая', unit: 'шт', price: 20000, category: 'windows_doors' },
        'door_hidden_800_under_paint': { name: 'Дверь скрытого монтажа 800мм под покраску', unit: 'шт', price: 18000, category: 'windows_doors' },
        // Раздвижные двери
        'door_slide_800_eco': { name: 'Дверь раздвижная 800мм эконом', unit: 'шт', price: 6000, category: 'windows_doors' },
        'door_slide_800_std': { name: 'Дверь раздвижная 800мм стандарт', unit: 'шт', price: 10000, category: 'windows_doors' },
        'door_slide_mechanism': { name: 'Механизм для раздвижной двери', unit: 'компл.', price: 3000, category: 'windows_doors' },
        // Двери-купе
        'door_wardrobe_2200x900_mirror': { name: 'Дверь-купе зеркальная 2200×900мм', unit: 'шт', price: 5000, category: 'windows_doors' },
        'door_wardrobe_2200x900_panel': { name: 'Дверь-купе ЛДСП 2200×900мм', unit: 'шт', price: 3500, category: 'windows_doors' },
        'door_wardrobe_track_2m': { name: 'Направляющая для купе (2м)', unit: 'шт', price: 500, category: 'windows_doors' },
        // Двери стеклянные
        'door_glass_800_clear_8mm': { name: 'Дверь стеклянная 800мм прозр. 8мм', unit: 'шт', price: 15000, category: 'windows_doors' },
        'door_glass_800_frosted_8mm': { name: 'Дверь стеклянная 800мм матовая 8мм', unit: 'шт', price: 18000, category: 'windows_doors' },
        // Двери входные
        'door_entry_metal_eco': { name: 'Дверь входная металлич. эконом', unit: 'шт', price: 12000, category: 'windows_doors' },
        'door_entry_metal_std': { name: 'Дверь входная металлич. стандарт', unit: 'шт', price: 20000, category: 'windows_doors' },
        'door_entry_metal_premium': { name: 'Дверь входная металлич. премиум', unit: 'шт', price: 35000, category: 'windows_doors' },
        'door_entry_metal_termo': { name: 'Дверь входная металлич. с терморазрывом', unit: 'шт', price: 45000, category: 'windows_doors' },
        'door_entry_metal_double': { name: 'Дверь входная металлич. двупольная', unit: 'шт', price: 30000, category: 'windows_doors' },
        // Дверные коробки / фурнитура
        'door_frame_70mm_white': { name: 'Коробка дверная 70мм белая (компл.)', unit: 'компл.', price: 500, category: 'windows_doors' },
        'door_frame_70mm_oak': { name: 'Коробка дверная 70мм дуб (компл.)', unit: 'компл.', price: 600, category: 'windows_doors' },
        'door_frame_100mm_white': { name: 'Коробка дверная 100мм белая (компл.)', unit: 'компл.', price: 700, category: 'windows_doors' },
        'door_hinge_std': { name: 'Петля дверная стандартная (пара)', unit: 'пара', price: 100, category: 'windows_doors' },
        'door_hinge_hidden': { name: 'Петля дверная скрытая', unit: 'шт', price: 1500, category: 'windows_doors' },
        'door_handle_L_eco': { name: 'Ручка дверная на розетке эконом', unit: 'компл.', price: 300, category: 'windows_doors' },
        'door_handle_L_std': { name: 'Ручка дверная на розетке стандарт', unit: 'компл.', price: 600, category: 'windows_doors' },
        'door_handle_L_premium': { name: 'Ручка дверная на розетке премиум', unit: 'компл.', price: 1500, category: 'windows_doors' },
        'door_handle_knob': { name: 'Ручка-кноб (шар) с замком', unit: 'шт', price: 500, category: 'windows_doors' },
        'door_lock_magnetic': { name: 'Замок дверной магнитный', unit: 'шт', price: 800, category: 'windows_doors' },
        'door_lock_wc': { name: 'Замок дверной WC (ванная)', unit: 'шт', price: 300, category: 'windows_doors' },
        'door_lock_key': { name: 'Замок дверной с ключом', unit: 'шт', price: 400, category: 'windows_doors' },
        'door_closer_std': { name: 'Доводчик дверной стандарт', unit: 'шт', price: 1500, category: 'windows_doors' },
        'door_closer_heavy': { name: 'Доводчик дверной усиленный', unit: 'шт', price: 2500, category: 'windows_doors' },
        'door_stopper_floor': { name: 'Упор дверной напольный', unit: 'шт', price: 80, category: 'windows_doors' },
        'door_stopper_magnet': { name: 'Упор дверной магнитный', unit: 'шт', price: 200, category: 'windows_doors' },
        // Ворота / калитки
        'gate_swing_3m': { name: 'Ворота распашные 3м (метал. + профлист)', unit: 'шт', price: 25000, category: 'windows_doors' },
        'gate_swing_4m': { name: 'Ворота распашные 4м (метал. + профлист)', unit: 'шт', price: 30000, category: 'windows_doors' },
        'gate_slide_4m': { name: 'Ворота откатные 4м (метал. + профлист)', unit: 'шт', price: 40000, category: 'windows_doors' },
        'gate_slide_5m': { name: 'Ворота откатные 5м (метал. + профлист)', unit: 'шт', price: 50000, category: 'windows_doors' },
        'gate_sectional_2_5x2_1': { name: 'Ворота секционные гаражные 2.5×2.1м', unit: 'шт', price: 35000, category: 'windows_doors' },
        'gate_sectional_3x2_5': { name: 'Ворота секционные гаражные 3×2.5м', unit: 'шт', price: 40000, category: 'windows_doors' },
        'gate_automation': { name: 'Автоматика для ворот (откат./распашн.)', unit: 'компл.', price: 25000, category: 'windows_doors' },
        'wicket_metal_1m': { name: 'Калитка металлическая 1м', unit: 'шт', price: 8000, category: 'windows_doors' },
        // Окна мансардные
        'win_mansard_55x78': { name: 'Окно мансардное 55×78см', unit: 'шт', price: 15000, category: 'windows_doors' },
        'win_mansard_66x118': { name: 'Окно мансардное 66×118см', unit: 'шт', price: 22000, category: 'windows_doors' },
        'win_mansard_78x118': { name: 'Окно мансардное 78×118см', unit: 'шт', price: 28000, category: 'windows_doors' },
        'win_mansard_78x140': { name: 'Окно мансардное 78×140см', unit: 'шт', price: 32000, category: 'windows_doors' },
        'win_mansard_flashing': { name: 'Оклад для мансардного окна', unit: 'шт', price: 5000, category: 'windows_doors' },
        // Люки чердачные
        'hatch_attic_60x120': { name: 'Люк чердачный утеплённый 60×120см', unit: 'шт', price: 8000, category: 'windows_doors' },
        'hatch_attic_70x120': { name: 'Люк чердачный утеплённый 70×120см', unit: 'шт', price: 10000, category: 'windows_doors' },
        // Фурнитура окон
        'mosquito_net_custom': { name: 'Москитная сетка на заказ (м²)', unit: 'м²', price: 800, category: 'windows_doors' },
        'window_handle_white': { name: 'Ручка оконная белая', unit: 'шт', price: 100, category: 'windows_doors' },
        'window_handle_key': { name: 'Ручка оконная с ключом (детская)', unit: 'шт', price: 300, category: 'windows_doors' }
    };
})();
