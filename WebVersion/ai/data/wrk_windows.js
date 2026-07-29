// === КАТАЛОГ РАБОТ: ОКНА, ДВЕРИ, ОСТЕКЛЕНИЕ (Фаза 1-3: 200 поз.) ===
(function () {
    window.AI_WRK_WINDOWS = {
        // Окна ПВХ
        'wrk_win_pvc_1st_600x600': { name: 'Окно ПВХ 1 створка 600×600мм', unit: 'шт', price: 2000, category: 'windows' },
        'wrk_win_pvc_1st_600x900': { name: 'Окно ПВХ 1 створка 600×900мм', unit: 'шт', price: 2500, category: 'windows' },
        'wrk_win_pvc_1st_600x1200': { name: 'Окно ПВХ 1 створка 600×1200мм', unit: 'шт', price: 3000, category: 'windows' },
        'wrk_win_pvc_2st_1200x1200': { name: 'Окно ПВХ 2 створки 1200×1200мм', unit: 'шт', price: 3500, category: 'windows' },
        'wrk_win_pvc_2st_1300x1400': { name: 'Окно ПВХ 2 створки 1300×1400мм', unit: 'шт', price: 4000, category: 'windows' },
        'wrk_win_pvc_2st_1500x1400': { name: 'Окно ПВХ 2 створки 1500×1400мм', unit: 'шт', price: 4500, category: 'windows' },
        'wrk_win_pvc_3st_1800x1400': { name: 'Окно ПВХ 3 створки 1800×1400мм', unit: 'шт', price: 5500, category: 'windows' },
        'wrk_win_pvc_3st_2100x1400': { name: 'Окно ПВХ 3 створки 2100×1400мм', unit: 'шт', price: 6000, category: 'windows' },
        'wrk_win_pvc_balkon_door': { name: 'Балконный блок ПВХ (дверь+окно)', unit: 'шт', price: 5000, category: 'windows' },
        'wrk_win_pvc_3cam': { name: 'Окно ПВХ 3-камерн. профиль', unit: 'м²', price: 2000, category: 'windows' },
        'wrk_win_pvc_5cam': { name: 'Окно ПВХ 5-камерн. профиль', unit: 'м²', price: 2500, category: 'windows' },
        'wrk_win_pvc_7cam': { name: 'Окно ПВХ 7-камерн. профиль', unit: 'м²', price: 3000, category: 'windows' },
        'wrk_win_pvc_energy': { name: 'Окно ПВХ энергосберегающее', unit: 'м²', price: 3500, category: 'windows' },
        // Монтаж окон
        'wrk_win_install_std': { name: 'Монтаж окна ПВХ (стандарт)', unit: 'шт', price: 2000, category: 'windows' },
        'wrk_win_install_gost': { name: 'Монтаж окна по ГОСТ', unit: 'шт', price: 3000, category: 'windows' },
        'wrk_win_install_warm': { name: 'Монтаж окна с тёплым монтажом', unit: 'шт', price: 4000, category: 'windows' },
        'wrk_win_install_high': { name: 'Монтаж окна на высоте', unit: 'шт', price: 5000, category: 'windows' },
        'wrk_win_demo': { name: 'Демонтаж старого окна', unit: 'шт', price: 1000, category: 'windows' },
        'wrk_win_demo_careful': { name: 'Демонтаж окна (аккуратный)', unit: 'шт', price: 1500, category: 'windows' },
        // Алюминиевые окна
        'wrk_win_alu_facade': { name: 'Фасадное алюминиевое остекление', unit: 'м²', price: 6000, category: 'windows' },
        // Деревянные окна
        'wrk_win_wood_euro': { name: 'Деревянное окно (евро)', unit: 'м²', price: 5000, category: 'windows' },
        'wrk_win_wood_premium': { name: 'Деревянное окно (премиум)', unit: 'м²', price: 8000, category: 'windows' },
        'wrk_win_wood_alu_clad': { name: 'Дерево-алюминиевое окно', unit: 'м²', price: 7000, category: 'windows' },
        // Мансардные окна
        // Откосы
        'wrk_win_slope_plast': { name: 'Откосы пластиковые', unit: 'м.п.', price: 200, category: 'windows' },
        'wrk_win_slope_sandwich': { name: 'Откосы сэндвич-панель', unit: 'м.п.', price: 250, category: 'windows' },
        'wrk_win_slope_wood': { name: 'Откосы деревянные', unit: 'м.п.', price: 400, category: 'windows' },
        'wrk_win_slope_stone': { name: 'Откосы из камня', unit: 'м.п.', price: 600, category: 'windows' },
        // Подоконники
        'wrk_win_sill_pvc_150': { name: 'Подоконник ПВХ шир. 150мм', unit: 'м.п.', price: 200, category: 'windows' },
        'wrk_win_sill_pvc_250': { name: 'Подоконник ПВХ шир. 250мм', unit: 'м.п.', price: 300, category: 'windows' },
        'wrk_win_sill_pvc_400': { name: 'Подоконник ПВХ шир. 400мм', unit: 'м.п.', price: 400, category: 'windows' },
        'wrk_win_sill_pvc_600': { name: 'Подоконник ПВХ шир. 600мм', unit: 'м.п.', price: 600, category: 'windows' },
        'wrk_win_sill_stone': { name: 'Подоконник из искусств. камня', unit: 'м.п.', price: 1500, category: 'windows' },
        'wrk_win_sill_granite': { name: 'Подоконник из гранита', unit: 'м.п.', price: 2000, category: 'windows' },
        // Отливы
        'wrk_win_drip_steel': { name: 'Отлив оцинкованный', unit: 'м.п.', price: 100, category: 'windows' },
        'wrk_win_drip_alu': { name: 'Отлив алюминиевый', unit: 'м.п.', price: 200, category: 'windows' },
        // Балконное остекление
        'wrk_win_balc_cold_alu': { name: 'Остекление балкона алюм. (холодное)', unit: 'м²', price: 2000, category: 'windows' },
        'wrk_win_balc_warm_pvc': { name: 'Остекление балкона ПВХ (тёплое)', unit: 'м²', price: 3000, category: 'windows' },
        'wrk_win_balc_panoramic': { name: 'Панорамное остекление балкона', unit: 'м²', price: 5000, category: 'windows' },
        'wrk_win_balc_slide': { name: 'Раздвижное остекление балкона', unit: 'м²', price: 3500, category: 'windows' },
        // === ДВЕРИ ===
        'wrk_door_inter_install': { name: 'Монтаж межкомнатной двери', unit: 'шт', price: 2000, category: 'windows' },
        'wrk_door_inter_premium': { name: 'Монтаж межкомнатной двери (премиум)', unit: 'шт', price: 3000, category: 'windows' },
        'wrk_door_inter_barn': { name: 'Монтаж двери-амбар (лофт)', unit: 'шт', price: 3500, category: 'windows' },
        'wrk_door_inter_fold': { name: 'Монтаж складной двери (гармошка)', unit: 'шт', price: 3000, category: 'windows' },
        'wrk_door_inter_double': { name: 'Монтаж двустворчатой двери', unit: 'шт', price: 3500, category: 'windows' },
        'wrk_door_inter_arch': { name: 'Монтаж арочной двери', unit: 'шт', price: 5000, category: 'windows' },
        'wrk_door_inter_box_std': { name: 'Запил коробки (прямой)', unit: 'шт', price: 500, category: 'windows' },
        'wrk_door_inter_box_45': { name: 'Запил коробки (под 45°)', unit: 'шт', price: 700, category: 'windows' },
        'wrk_door_inter_transom': { name: 'Монтаж добора дверного', unit: 'м.п.', price: 150, category: 'windows' },
        'wrk_door_inter_casing': { name: 'Монтаж наличника дверного', unit: 'м.п.', price: 80, category: 'windows' },
        // Входные двери
        'wrk_door_entry_steel': { name: 'Монтаж входной стальной двери', unit: 'шт', price: 3000, category: 'windows' },
        'wrk_door_entry_premium': { name: 'Монтаж входной премиум двери', unit: 'шт', price: 5000, category: 'windows' },
        'wrk_door_entry_therma': { name: 'Монтаж термо-двери (дом)', unit: 'шт', price: 4000, category: 'windows' },
        // Противопожарные двери
        'wrk_door_fire_ei30': { name: 'Монтаж противопожарной двери EI-30', unit: 'шт', price: 3000, category: 'windows' },
        'wrk_door_fire_ei60': { name: 'Монтаж противопожарной двери EI-60', unit: 'шт', price: 4000, category: 'windows' },
        'wrk_door_fire_ei90': { name: 'Монтаж противопожарной двери EI-90', unit: 'шт', price: 5000, category: 'windows' },
        // Ворота
        'wrk_door_garage_sectional': { name: 'Монтаж секционных ворот', unit: 'шт', price: 8000, category: 'windows' },
        'wrk_door_garage_roller': { name: 'Монтаж рольставен ворот', unit: 'шт', price: 5000, category: 'windows' },
        'wrk_door_garage_automatic': { name: 'Монтаж автоматики ворот', unit: 'шт', price: 5000, category: 'windows' },
        // Рольставни / жалюзи
        'wrk_win_roller_install': { name: 'Монтаж рольставни оконной', unit: 'шт', price: 2000, category: 'windows' },
        'wrk_win_blinds_horiz': { name: 'Монтаж жалюзи горизонтальных', unit: 'шт', price: 300, category: 'windows' },
        'wrk_win_blinds_vert': { name: 'Монтаж жалюзи вертикальных', unit: 'шт', price: 400, category: 'windows' },
        'wrk_win_blinds_roll': { name: 'Монтаж рулонных штор', unit: 'шт', price: 300, category: 'windows' },
        'wrk_win_blinds_plisse': { name: 'Монтаж штор-плиссе', unit: 'шт', price: 400, category: 'windows' },
        // Витражи
        'wrk_win_vitrage_simple': { name: 'Витражное остекление (простое)', unit: 'м²', price: 5000, category: 'windows' },
        'wrk_win_vitrage_tiffany': { name: 'Витраж тиффани', unit: 'м²', price: 15000, category: 'windows' },
        // Стеклопакеты
        'wrk_win_glass_1cam': { name: 'Стеклопакет 1-камерный (замена)', unit: 'м²', price: 1000, category: 'windows' },
        'wrk_win_glass_2cam': { name: 'Стеклопакет 2-камерный (замена)', unit: 'м²', price: 1500, category: 'windows' },
        'wrk_win_glass_triplex': { name: 'Стеклопакет триплекс', unit: 'м²', price: 2500, category: 'windows' },
        'wrk_win_glass_tinted': { name: 'Тонирование стёкол плёнкой', unit: 'м²', price: 500, category: 'windows' },
        // Сервис окон
        'wrk_win_adjust': { name: 'Регулировка окна ПВХ', unit: 'шт', price: 300, category: 'windows' },
        'wrk_win_seal_replace': { name: 'Замена уплотнителя окна', unit: 'м.п.', price: 50, category: 'windows' },
        'wrk_win_handle_replace': { name: 'Замена ручки окна', unit: 'шт', price: 200, category: 'windows' },
        'wrk_win_foam_seal': { name: 'Утепление монтажного шва', unit: 'м.п.', price: 80, category: 'windows' }
    };
})();
