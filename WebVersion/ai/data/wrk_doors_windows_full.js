// === ФАЗА 3: ДВЕРИ ВСЕ ВИДЫ, ОКНА ДЕТАЛЬНО, ВОРОТА ПРОМЫШЛЕННЫЕ (120 поз.) ===
(function () {
    window.AI_WRK_DOORS_WINDOWS_FULL = {
        // === ВХОДНЫЕ ДВЕРИ ===
        'wrk_dw_door_entry_steel': { name: 'Дверь входная стальная (монтаж)', unit: 'шт', price: 1000, category: 'doors_windows_full' },
        'wrk_dw_door_entry_premium': { name: 'Дверь входная (премиум)', unit: 'шт', price: 3000, category: 'doors_windows_full' },
        'wrk_dw_door_entry_termo': { name: 'Дверь входная термо', unit: 'шт', price: 2000, category: 'doors_windows_full' },
        'wrk_dw_door_entry_double': { name: 'Дверь входная двухстворчатая', unit: 'шт', price: 2000, category: 'doors_windows_full' },

        // === МЕЖКОМНАТНЫЕ ДВЕРИ ===
        'wrk_dw_door_int_lam': { name: 'Дверь межкомнатная ламинат', unit: 'шт', price: 500, category: 'doors_windows_full' },
        'wrk_dw_door_int_ecoshpon': { name: 'Дверь межкомн. экошпон', unit: 'шт', price: 600, category: 'doors_windows_full' },
        'wrk_dw_door_int_shpon': { name: 'Дверь межкомн. натуральный шпон', unit: 'шт', price: 1000, category: 'doors_windows_full' },
        'wrk_dw_door_int_massiv': { name: 'Дверь межкомн. массив', unit: 'шт', price: 2000, category: 'doors_windows_full' },
        'wrk_dw_door_int_glass': { name: 'Дверь межкомн. стеклянная', unit: 'шт', price: 1500, category: 'doors_windows_full' },
        'wrk_dw_door_int_hidden': { name: 'Дверь скрытого монтажа', unit: 'шт', price: 2000, category: 'doors_windows_full' },
        'wrk_dw_door_int_slide': { name: 'Дверь раздвижная', unit: 'шт', price: 1500, category: 'doors_windows_full' },
        'wrk_dw_door_int_barn': { name: 'Дверь амбарная (на рельсе)', unit: 'шт', price: 2000, category: 'doors_windows_full' },
        'wrk_dw_door_int_pocket': { name: 'Дверь пенал (в стену)', unit: 'шт', price: 2500, category: 'doors_windows_full' },
        'wrk_dw_door_int_fold': { name: 'Дверь складная (книжка)', unit: 'шт', price: 1200, category: 'doors_windows_full' },
        'wrk_dw_door_frame_steel': { name: 'Коробка дверная (стальная)', unit: 'шт', price: 100, category: 'doors_windows_full' },
        'wrk_dw_door_frame_wood': { name: 'Коробка дверная (деревянная)', unit: 'шт', price: 200, category: 'doors_windows_full' },
        'wrk_dw_door_trim': { name: 'Наличник (комплект на дверь)', unit: 'комплект', price: 100, category: 'doors_windows_full' },
        'wrk_dw_door_handle': { name: 'Фурнитура дверная (ручка+петли)', unit: 'комплект', price: 100, category: 'doors_windows_full' },
        'wrk_dw_door_lock': { name: 'Замок (врезной)', unit: 'шт', price: 100, category: 'doors_windows_full' },
        'wrk_dw_door_lock_smart': { name: 'Умный замок', unit: 'шт', price: 500, category: 'doors_windows_full' },

        // === ПВХ ОКНА (ДЕТАЛЬНО) ===
        'wrk_dw_win_pvh_500x500': { name: 'Окно ПВХ 500×500мм', unit: 'шт', price: 300, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_600x600': { name: 'Окно ПВХ 600×600мм', unit: 'шт', price: 350, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_900x600': { name: 'Окно ПВХ 900×600мм', unit: 'шт', price: 400, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_1200x600': { name: 'Окно ПВХ 1200×600мм', unit: 'шт', price: 500, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_1200x900': { name: 'Окно ПВХ 1200×900мм', unit: 'шт', price: 600, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_1200x1200': { name: 'Окно ПВХ 1200×1200мм', unit: 'шт', price: 700, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_1500x1200': { name: 'Окно ПВХ 1500×1200мм', unit: 'шт', price: 800, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_1500x1500': { name: 'Окно ПВХ 1500×1500мм', unit: 'шт', price: 900, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_2000x1200': { name: 'Окно ПВХ 2000×1200мм (2-ств.)', unit: 'шт', price: 1000, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_2000x1500': { name: 'Окно ПВХ 2000×1500мм (2-ств.)', unit: 'шт', price: 1200, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_2100x1500': { name: 'Окно ПВХ 2100×1500мм (3-ств.)', unit: 'шт', price: 1500, category: 'doors_windows_full' },
        'wrk_dw_win_pvh_3000x1500': { name: 'Окно ПВХ 3000×1500мм (3-ств.)', unit: 'шт', price: 2000, category: 'doors_windows_full' },

        // === АЛЮМИНИЕВЫЕ ОКНА / ФАСАДНОЕ ОСТЕКЛЕНИЕ ===
        'wrk_dw_win_alu_warm': { name: 'Окно алюминиевое (тёплое)', unit: 'м²', price: 600, category: 'doors_windows_full' },
        'wrk_dw_win_alu_cold': { name: 'Окно алюминиевое (холодное)', unit: 'м²', price: 300, category: 'doors_windows_full' },
        'wrk_dw_win_alu_slide': { name: 'Раздвижное алюм. остекление', unit: 'м²', price: 500, category: 'doors_windows_full' },
        'wrk_dw_win_panoramic': { name: 'Панорамное остекление', unit: 'м²', price: 800, category: 'doors_windows_full' },

        // === БАЛКОННОЕ ОСТЕКЛЕНИЕ ===
        'wrk_dw_balcony_cold': { name: 'Остекление балкона (холодное)', unit: 'м²', price: 200, category: 'doors_windows_full' },
        'wrk_dw_balcony_warm': { name: 'Остекление балкона (тёплое)', unit: 'м²', price: 400, category: 'doors_windows_full' },
        'wrk_dw_balcony_frameless': { name: 'Безрамное остекление', unit: 'м²', price: 600, category: 'doors_windows_full' },
        'wrk_dw_balcony_door': { name: 'Балконная дверь ПВХ', unit: 'шт', price: 500, category: 'doors_windows_full' },
        'wrk_dw_balcony_portaldoor': { name: 'Портальная дверь (PSK)', unit: 'шт', price: 3000, category: 'doors_windows_full' },

        // === СЛУХОВЫЕ / МАНСАРДНЫЕ ОКНА ===
        'wrk_dw_roof_win_55x78': { name: 'Мансардное окно 55×78см', unit: 'шт', price: 1000, category: 'doors_windows_full' },
        'wrk_dw_roof_win_66x98': { name: 'Мансардное окно 66×98см', unit: 'шт', price: 1200, category: 'doors_windows_full' },
        'wrk_dw_roof_win_78x118': { name: 'Мансардное окно 78×118см', unit: 'шт', price: 1500, category: 'doors_windows_full' },
        'wrk_dw_roof_win_78x140': { name: 'Мансардное окно 78×140см', unit: 'шт', price: 1800, category: 'doors_windows_full' },
        'wrk_dw_roof_win_114x140': { name: 'Мансардное окно 114×140см', unit: 'шт', price: 2500, category: 'doors_windows_full' },

        // === ПОДОКОННИКИ / ОТКОСЫ ===
        'wrk_dw_sill_pvh_200': { name: 'Подоконник ПВХ 200мм', unit: 'м.п.', price: 20, category: 'doors_windows_full' },
        'wrk_dw_sill_pvh_300': { name: 'Подоконник ПВХ 300мм', unit: 'м.п.', price: 25, category: 'doors_windows_full' },
        'wrk_dw_sill_pvh_400': { name: 'Подоконник ПВХ 400мм', unit: 'м.п.', price: 30, category: 'doors_windows_full' },
        'wrk_dw_sill_pvh_500': { name: 'Подоконник ПВХ 500мм', unit: 'м.п.', price: 40, category: 'doors_windows_full' },
        'wrk_dw_sill_stone': { name: 'Подоконник из камня', unit: 'м.п.', price: 200, category: 'doors_windows_full' },
        'wrk_dw_slope_plaster': { name: 'Откосы штукатурные', unit: 'м.п.', price: 30, category: 'doors_windows_full' },
        'wrk_dw_slope_pvh': { name: 'Откосы ПВХ (сэндвич)', unit: 'м.п.', price: 40, category: 'doors_windows_full' },
        'wrk_dw_slope_gkl': { name: 'Откосы ГКЛ', unit: 'м.п.', price: 40, category: 'doors_windows_full' },

        // === ВОРОТА ===
        'wrk_dw_gate_swing_3m': { name: 'Ворота распашные 3м', unit: 'шт', price: 3000, category: 'doors_windows_full' },
        'wrk_dw_gate_swing_4m': { name: 'Ворота распашные 4м', unit: 'шт', price: 4000, category: 'doors_windows_full' },
        'wrk_dw_gate_slide_4m': { name: 'Ворота откатные 4м', unit: 'шт', price: 5000, category: 'doors_windows_full' },
        'wrk_dw_gate_slide_5m': { name: 'Ворота откатные 5м', unit: 'шт', price: 6000, category: 'doors_windows_full' },
        'wrk_dw_gate_slide_6m': { name: 'Ворота откатные 6м', unit: 'шт', price: 7000, category: 'doors_windows_full' },
        'wrk_dw_gate_auto_swing': { name: 'Автоматика для распашных ворот', unit: 'комплект', price: 3000, category: 'doors_windows_full' },
        'wrk_dw_gate_auto_slide': { name: 'Автоматика для откатных ворот', unit: 'комплект', price: 3000, category: 'doors_windows_full' },
        'wrk_dw_gate_section_3x2': { name: 'Ворота секционные 3×2м', unit: 'шт', price: 5000, category: 'doors_windows_full' },
        'wrk_dw_gate_section_3x3': { name: 'Ворота секционные 3×3м', unit: 'шт', price: 6000, category: 'doors_windows_full' },
        'wrk_dw_gate_section_4x4': { name: 'Ворота секционные 4×4м', unit: 'шт', price: 8000, category: 'doors_windows_full' },
        'wrk_dw_gate_roller': { name: 'Рольставни/роллеты', unit: 'м²', price: 200, category: 'doors_windows_full' },
        'wrk_dw_wicket': { name: 'Калитка', unit: 'шт', price: 1000, category: 'doors_windows_full' },
        'wrk_dw_wicket_auto': { name: 'Калитка с автоматикой', unit: 'шт', price: 2000, category: 'doors_windows_full' },

        // === ЗАБОР ===
        'wrk_dw_fence_profn_1_5': { name: 'Забор из профнастила 1.5м', unit: 'м.п.', price: 100, category: 'doors_windows_full' },
        'wrk_dw_fence_profn_2_0': { name: 'Забор из профнастила 2.0м', unit: 'м.п.', price: 120, category: 'doors_windows_full' },
        'wrk_dw_fence_profn_2_5': { name: 'Забор из профнастила 2.5м', unit: 'м.п.', price: 150, category: 'doors_windows_full' },
        'wrk_dw_fence_3d_mesh': { name: 'Забор 3D сетка (гиттер)', unit: 'м.п.', price: 100, category: 'doors_windows_full' },
        'wrk_dw_fence_rabitz': { name: 'Забор из рабицы', unit: 'м.п.', price: 50, category: 'doors_windows_full' },
        'wrk_dw_fence_wood': { name: 'Забор деревянный', unit: 'м.п.', price: 150, category: 'doors_windows_full' },
        'wrk_dw_fence_brick': { name: 'Забор кирпичный', unit: 'м.п.', price: 500, category: 'doors_windows_full' },
        'wrk_dw_fence_gabion': { name: 'Забор из габионов', unit: 'м.п.', price: 400, category: 'doors_windows_full' },
        'wrk_dw_fence_forged': { name: 'Забор кованый', unit: 'м.п.', price: 500, category: 'doors_windows_full' },
        'wrk_dw_fence_post_concrete': { name: 'Столб бетонный (забор)', unit: 'шт', price: 100, category: 'doors_windows_full' },
        'wrk_dw_fence_post_metal': { name: 'Столб металлический (забор)', unit: 'шт', price: 50, category: 'doors_windows_full' },
        'wrk_dw_fence_foundation': { name: 'Ленточный фундамент забора', unit: 'м.п.', price: 100, category: 'doors_windows_full' }
    };
})();
