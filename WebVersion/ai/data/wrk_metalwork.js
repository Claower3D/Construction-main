// === КАТАЛОГ РАБОТ: МЕТАЛЛОКОНСТРУКЦИИ, СВАРКА, КОВКА (200 позиций) ===
(function () {
    window.AI_WRK_METALWORK = {
        // Металлокаркас здания
        'wrk_metal_frame_column': { name: 'Монтаж стальной колонны', unit: 'т', price: 10000, category: 'metalwork' },
        'wrk_metal_frame_beam': { name: 'Монтаж стальной балки', unit: 'т', price: 10000, category: 'metalwork' },
        'wrk_metal_frame_truss': { name: 'Монтаж стальной фермы', unit: 'т', price: 12000, category: 'metalwork' },
        'wrk_metal_frame_purlin': { name: 'Монтаж прогонов', unit: 'т', price: 8000, category: 'metalwork' },
        'wrk_metal_frame_brace': { name: 'Монтаж связей/раскосов', unit: 'т', price: 8000, category: 'metalwork' },
        // Каркас лёгких конструкций
        'wrk_metal_lgs_wall': { name: 'Каркас ЛСТК (стена)', unit: 'м²', price: 300, category: 'metalwork' },
        'wrk_metal_lgs_floor': { name: 'Каркас ЛСТК (перекрытие)', unit: 'м²', price: 350, category: 'metalwork' },
        'wrk_metal_lgs_roof': { name: 'Каркас ЛСТК (кровля)', unit: 'м²', price: 350, category: 'metalwork' },
        // Сварка
        'wrk_metal_weld_manual': { name: 'Ручная дуговая сварка (MMA)', unit: 'м.п.', price: 80, category: 'metalwork' },
        'wrk_metal_weld_semi': { name: 'Полуавтоматическая сварка (MIG/MAG)', unit: 'м.п.', price: 100, category: 'metalwork' },
        'wrk_metal_weld_tig': { name: 'Аргонодуговая сварка (TIG)', unit: 'м.п.', price: 200, category: 'metalwork' },
        'wrk_metal_weld_stainless': { name: 'Сварка нержавейки', unit: 'м.п.', price: 300, category: 'metalwork' },
        'wrk_metal_weld_aluminum': { name: 'Сварка алюминия', unit: 'м.п.', price: 300, category: 'metalwork' },
        'wrk_metal_weld_copper': { name: 'Сварка меди', unit: 'м.п.', price: 400, category: 'metalwork' },
        'wrk_metal_weld_pipe_15': { name: 'Сварка трубы Ø15мм (стык)', unit: 'стык', price: 100, category: 'metalwork' },
        'wrk_metal_weld_pipe_25': { name: 'Сварка трубы Ø25мм (стык)', unit: 'стык', price: 150, category: 'metalwork' },
        'wrk_metal_weld_pipe_32': { name: 'Сварка трубы Ø32мм (стык)', unit: 'стык', price: 200, category: 'metalwork' },
        'wrk_metal_weld_pipe_50': { name: 'Сварка трубы Ø50мм (стык)', unit: 'стык', price: 300, category: 'metalwork' },
        'wrk_metal_weld_pipe_76': { name: 'Сварка трубы Ø76мм (стык)', unit: 'стык', price: 400, category: 'metalwork' },
        'wrk_metal_weld_pipe_100': { name: 'Сварка трубы Ø100мм (стык)', unit: 'стык', price: 500, category: 'metalwork' },
        // Резка металла
        'wrk_metal_cut_bolt': { name: 'Резка болгаркой', unit: 'м.п.', price: 30, category: 'metalwork' },
        'wrk_metal_cut_plasma': { name: 'Плазменная резка', unit: 'м.п.', price: 50, category: 'metalwork' },
        'wrk_metal_cut_gas': { name: 'Газовая резка', unit: 'м.п.', price: 40, category: 'metalwork' },
        'wrk_metal_cut_laser': { name: 'Лазерная резка', unit: 'м.п.', price: 100, category: 'metalwork' },
        'wrk_metal_drill': { name: 'Сверление отверстий в металле', unit: 'шт', price: 20, category: 'metalwork' },
        // Перила / ограждения
        'wrk_metal_railing_simple': { name: 'Перила из профтрубы', unit: 'м.п.', price: 400, category: 'metalwork' },
        'wrk_metal_railing_stainless': { name: 'Перила из нержавейки', unit: 'м.п.', price: 800, category: 'metalwork' },
        'wrk_metal_railing_glass': { name: 'Перила со стеклянным заполнением', unit: 'м.п.', price: 1200, category: 'metalwork' },
        'wrk_metal_railing_cable': { name: 'Перила с тросовым заполнением', unit: 'м.п.', price: 600, category: 'metalwork' },
        'wrk_metal_railing_balcony': { name: 'Ограждение балкона', unit: 'м.п.', price: 500, category: 'metalwork' },
        'wrk_metal_railing_terrace': { name: 'Ограждение террасы', unit: 'м.п.', price: 500, category: 'metalwork' },
        // Лестницы металл
        'wrk_metal_stair_straight_kosour': { name: 'Метал. лестница на косоурах (прямая)', unit: 'шт', price: 25000, category: 'metalwork' },
        'wrk_metal_stair_l_kosour': { name: 'Метал. лестница на косоурах (Г)', unit: 'шт', price: 35000, category: 'metalwork' },
        'wrk_metal_stair_u_kosour': { name: 'Метал. лестница на косоурах (П)', unit: 'шт', price: 45000, category: 'metalwork' },
        'wrk_metal_stair_spiral': { name: 'Винтовая металл. лестница', unit: 'шт', price: 45000, category: 'metalwork' },
        'wrk_metal_stair_string': { name: 'Лестница на тетивах', unit: 'шт', price: 30000, category: 'metalwork' },
        'wrk_metal_stair_bolts': { name: 'Лестница на больцах', unit: 'шт', price: 40000, category: 'metalwork' },
        'wrk_metal_stair_fire': { name: 'Пожарная лестница', unit: 'шт', price: 15000, category: 'metalwork' },
        'wrk_metal_stair_vertical': { name: 'Вертикальная (стеновая) лестница', unit: 'шт', price: 5000, category: 'metalwork' },
        // Навесы / козырьки
        'wrk_metal_canopy_profnast': { name: 'Навес из профнастила', unit: 'м²', price: 500, category: 'metalwork' },
        'wrk_metal_canopy_glass': { name: 'Навес со стеклом', unit: 'м²', price: 1500, category: 'metalwork' },
        'wrk_metal_canopy_car_1': { name: 'Навес для 1 авто', unit: 'шт', price: 15000, category: 'metalwork' },
        'wrk_metal_canopy_car_2': { name: 'Навес для 2 авто', unit: 'шт', price: 25000, category: 'metalwork' },
        'wrk_metal_visor_entrance': { name: 'Козырёк над входом', unit: 'шт', price: 5000, category: 'metalwork' },
        'wrk_metal_visor_balcony': { name: 'Козырёк над балконом', unit: 'шт', price: 4000, category: 'metalwork' },
        // Ворота / калитки
        'wrk_metal_gate_swing_3m': { name: 'Распашные ворота 3м', unit: 'шт', price: 10000, category: 'metalwork' },
        'wrk_metal_gate_swing_4m': { name: 'Распашные ворота 4м', unit: 'шт', price: 12000, category: 'metalwork' },
        'wrk_metal_gate_slide_4m': { name: 'Откатные ворота 4м', unit: 'шт', price: 15000, category: 'metalwork' },
        'wrk_metal_gate_slide_5m': { name: 'Откатные ворота 5м', unit: 'шт', price: 18000, category: 'metalwork' },
        'wrk_metal_gate_slide_6m': { name: 'Откатные ворота 6м', unit: 'шт', price: 22000, category: 'metalwork' },
        'wrk_metal_wicket': { name: 'Калитка металлическая', unit: 'шт', price: 3000, category: 'metalwork' },
        // Ковка
        'wrk_metal_forge_element': { name: 'Кованый элемент (завиток/лист)', unit: 'шт', price: 100, category: 'metalwork' },
        'wrk_metal_forge_balcony': { name: 'Кованое ограждение балкона', unit: 'м.п.', price: 2000, category: 'metalwork' },
        'wrk_metal_forge_window_grill': { name: 'Кованая решётка на окно', unit: 'шт', price: 3000, category: 'metalwork' },
        // Решётки / защита
        'wrk_metal_grill_window': { name: 'Решётка оконная (простая)', unit: 'шт', price: 1000, category: 'metalwork' },
        'wrk_metal_grill_window_dec': { name: 'Решётка оконная (декоративная)', unit: 'шт', price: 2000, category: 'metalwork' },
        'wrk_metal_grill_door': { name: 'Решётка дверная', unit: 'шт', price: 2000, category: 'metalwork' },
        'wrk_metal_roller_shutter': { name: 'Роллеты на окна', unit: 'шт', price: 3000, category: 'metalwork' },
        // Закладные
        'wrk_metal_embed_plate': { name: 'Закладная пластина (в бетон)', unit: 'шт', price: 100, category: 'metalwork' },
        'wrk_metal_embed_anchor': { name: 'Анкерный болт (установка)', unit: 'шт', price: 30, category: 'metalwork' },
        'wrk_metal_embed_chemical': { name: 'Химический анкер', unit: 'шт', price: 100, category: 'metalwork' },
        // Антикоррозийная обработка
        'wrk_metal_paint_primer': { name: 'Грунтовка металла', unit: 'м²', price: 50, category: 'metalwork' },
        'wrk_metal_paint_1': { name: 'Покраска металла 1 слой', unit: 'м²', price: 50, category: 'metalwork' },
        'wrk_metal_paint_2': { name: 'Покраска металла 2 слоя', unit: 'м²', price: 80, category: 'metalwork' },
        'wrk_metal_paint_fire': { name: 'Огнезащита металлоконструкций', unit: 'м²', price: 200, category: 'metalwork' },
        'wrk_metal_galvanize': { name: 'Горячая оцинковка', unit: 'кг', price: 5, category: 'metalwork' },
        'wrk_metal_sandblast': { name: 'Пескоструйная очистка', unit: 'м²', price: 100, category: 'metalwork' },
        // Изделия из нержавейки
        'wrk_metal_inox_shelf': { name: 'Полка из нержавейки', unit: 'м.п.', price: 500, category: 'metalwork' },
        'wrk_metal_inox_hood': { name: 'Зонт вытяжной из нержавейки', unit: 'шт', price: 5000, category: 'metalwork' },
        // Контейнеры / модули
        'wrk_metal_container_20': { name: 'Установка морского контейнера 20 фут', unit: 'шт', price: 5000, category: 'metalwork' },
        'wrk_metal_container_40': { name: 'Установка морского контейнера 40 фут', unit: 'шт', price: 8000, category: 'metalwork' },
        'wrk_metal_modular_block': { name: 'Модульный блок-контейнер (монтаж)', unit: 'шт', price: 5000, category: 'metalwork' }
    };
})();
