// === ОКНА, ДВЕРИ, ФУРНИТУРА (60 позиций) ===
(function () {
    window.AI_MAT_WINDOWS = {
        // Окна ПВХ (типовые размеры)
        'window_pvc_600x600': { name: 'Окно ПВХ 600×600мм (глухое)', unit: 'шт', price: 12000, category: 'windows' },
        'window_pvc_900x600': { name: 'Окно ПВХ 900×600мм (откидное)', unit: 'шт', price: 16000, category: 'windows' },
        'window_pvc_1200x1200': { name: 'Окно ПВХ 1200×1200мм (поворотно-откидное)', unit: 'шт', price: 25000, category: 'windows' },
        'window_pvc_1300x1400': { name: 'Окно ПВХ 1300×1400мм (стандарт)', unit: 'шт', price: 32000, category: 'windows' },
        'window_pvc_1500x1200': { name: 'Окно ПВХ 1500×1200мм (2 створки)', unit: 'шт', price: 38000, category: 'windows' },
        'window_pvc_1800x1400': { name: 'Окно ПВХ 1800×1400мм (3 створки)', unit: 'шт', price: 52000, category: 'windows' },
        'window_pvc_2100x1400': { name: 'Окно ПВХ 2100×1400мм (3 створки)', unit: 'шт', price: 62000, category: 'windows' },

        // Окна ПВХ (улучшенные)
        'window_pvc_energy_1300x1400': { name: 'Окно ПВХ 1300×1400 (энергосберегающее)', unit: 'шт', price: 42000, category: 'windows' },
        'window_pvc_3cam_1300x1400': { name: 'Окно ПВХ 1300×1400 (5-камерный профиль)', unit: 'шт', price: 48000, category: 'windows' },

        // Окна алюминиевые
        'window_alu_cold_1000x1000': { name: 'Окно алюминиевое холодное 1000×1000', unit: 'шт', price: 15000, category: 'windows' },
        'window_alu_warm_1300x1400': { name: 'Окно алюминиевое тёплое 1300×1400', unit: 'шт', price: 55000, category: 'windows' },

        // Балконные двери
        'door_balcony_700x2100': { name: 'Дверь балконная ПВХ 700×2100', unit: 'шт', price: 25000, category: 'windows' },
        'door_balcony_block': { name: 'Балконный блок (окно+дверь)', unit: 'шт', price: 55000, category: 'windows' },

        // Двери входные
        'door_entry_metal_eco': { name: 'Дверь входная металлическая (эконом)', unit: 'шт', price: 35000, category: 'windows' },
        'door_entry_metal_std': { name: 'Дверь входная металлическая (стандарт)', unit: 'шт', price: 65000, category: 'windows' },
        'door_entry_metal_premium': { name: 'Дверь входная металлическая (премиум)', unit: 'шт', price: 120000, category: 'windows' },
        'door_entry_thermal': { name: 'Дверь входная с терморазрывом', unit: 'шт', price: 85000, category: 'windows' },

        // Двери межкомнатные
        'door_interior_lam_600': { name: 'Дверь межкомнатная ламинированная 600мм', unit: 'шт', price: 8000, category: 'windows' },
        'door_interior_lam_700': { name: 'Дверь межкомнатная ламинированная 700мм', unit: 'шт', price: 8500, category: 'windows' },
        'door_interior_lam_800': { name: 'Дверь межкомнатная ламинированная 800мм', unit: 'шт', price: 9000, category: 'windows' },
        'door_interior_lam_900': { name: 'Дверь межкомнатная ламинированная 900мм', unit: 'шт', price: 9500, category: 'windows' },
        'door_interior_eco_700': { name: 'Дверь межкомнатная экошпон 700мм', unit: 'шт', price: 14000, category: 'windows' },
        'door_interior_eco_800': { name: 'Дверь межкомнатная экошпон 800мм', unit: 'шт', price: 15000, category: 'windows' },
        'door_interior_shpon_800': { name: 'Дверь межкомнатная шпон натуральный 800мм', unit: 'шт', price: 25000, category: 'windows' },
        'door_interior_glass': { name: 'Дверь межкомнатная со стеклом', unit: 'шт', price: 18000, category: 'windows' },
        'door_interior_sliding': { name: 'Дверь межкомнатная раздвижная', unit: 'шт', price: 22000, category: 'windows' },

        // Дверная коробка / наличники
        'door_frame_lam': { name: 'Коробка дверная ламинированная (комплект)', unit: 'шт', price: 2500, category: 'windows' },
        'door_frame_eco': { name: 'Коробка дверная экошпон (комплект)', unit: 'шт', price: 4000, category: 'windows' },
        'door_trim_lam': { name: 'Наличник ламинированный (комплект 5шт)', unit: 'комплект', price: 1200, category: 'windows' },
        'door_trim_eco': { name: 'Наличник экошпон (комплект 5шт)', unit: 'комплект', price: 2500, category: 'windows' },
        'door_dobornik_100': { name: 'Доборник 100мм', unit: 'шт', price: 600, category: 'windows' },
        'door_dobornik_150': { name: 'Доборник 150мм', unit: 'шт', price: 800, category: 'windows' },

        // Фурнитура дверная
        'handle_lever_economy': { name: 'Ручка дверная на розетке (эконом)', unit: 'шт', price: 1200, category: 'windows' },
        'handle_lever_standard': { name: 'Ручка дверная на розетке (стандарт)', unit: 'шт', price: 2500, category: 'windows' },
        'handle_lever_premium': { name: 'Ручка дверная на розетке (премиум)', unit: 'шт', price: 5000, category: 'windows' },
        'lock_mortise': { name: 'Замок врезной (магнитный)', unit: 'шт', price: 2000, category: 'windows' },
        'lock_cylinder': { name: 'Замок цилиндровый (с ключами)', unit: 'шт', price: 2500, category: 'windows' },
        'hinge_door_100': { name: 'Петля дверная 100мм', unit: 'шт', price: 200, category: 'windows' },
        'hinge_door_hidden': { name: 'Петля дверная скрытая', unit: 'шт', price: 1500, category: 'windows' },
        'doorcloser_60kg': { name: 'Доводчик дверной (до 60кг)', unit: 'шт', price: 2500, category: 'windows' },
        'doorcloser_100kg': { name: 'Доводчик дверной (до 100кг)', unit: 'шт', price: 4500, category: 'windows' },

        // Подоконники
        'sill_pvc_150': { name: 'Подоконник ПВХ 150мм (п.м.)', unit: 'п.м.', price: 400, category: 'windows' },
        'sill_pvc_200': { name: 'Подоконник ПВХ 200мм (п.м.)', unit: 'п.м.', price: 500, category: 'windows' },
        'sill_pvc_300': { name: 'Подоконник ПВХ 300мм (п.м.)', unit: 'п.м.', price: 700, category: 'windows' },
        'sill_pvc_400': { name: 'Подоконник ПВХ 400мм (п.м.)', unit: 'п.м.', price: 900, category: 'windows' },
        'sill_pvc_500': { name: 'Подоконник ПВХ 500мм (п.м.)', unit: 'п.м.', price: 1100, category: 'windows' },
        'sill_stone': { name: 'Подоконник искусственный камень (п.м.)', unit: 'п.м.', price: 5000, category: 'windows' },

        // Отливы
        'sill_ext_150': { name: 'Отлив оконный 150мм (п.м.)', unit: 'п.м.', price: 250, category: 'windows' },
        'sill_ext_200': { name: 'Отлив оконный 200мм (п.м.)', unit: 'п.м.', price: 300, category: 'windows' },
        'sill_ext_300': { name: 'Отлив оконный 300мм (п.м.)', unit: 'п.м.', price: 400, category: 'windows' },

        // Москитные сетки
        'mosquito_frame_1200x1400': { name: 'Москитная сетка рамочная (до 1.2×1.4)', unit: 'шт', price: 3000, category: 'windows' },
        'mosquito_roll': { name: 'Москитная сетка рулонная', unit: 'шт', price: 8000, category: 'windows' },

        // Раздвижные системы
        'sliding_system_2m': { name: 'Система раздвижная для двери (до 2м)', unit: 'комплект', price: 8000, category: 'windows' },
        'sliding_glass_partition': { name: 'Раздвижная стеклянная перегородка (м²)', unit: 'м²', price: 25000, category: 'windows' },

        // Фурнитура оконная
        'handle_window_standard': { name: 'Ручка оконная (стандарт)', unit: 'шт', price: 200, category: 'windows' },
        'handle_window_lock': { name: 'Ручка оконная с ключом', unit: 'шт', price: 600, category: 'windows' },
        'ventilation_valve': { name: 'Приточный клапан на окно', unit: 'шт', price: 3000, category: 'windows' }
    };
})();
