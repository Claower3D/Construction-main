// === КАТАЛОГ РАБОТ: ФУНДАМЕНТЫ И СВАИ (200 позиций) ===
(function () {
    window.AI_WRK_FOUNDATION = {
        // Ленточный фундамент мелкозаглублённый
        'wrk_found_strip_30x50': { name: 'Ленточный фундамент 300×500мм', unit: 'м.п.', price: 2000, category: 'foundation' },
        'wrk_found_strip_30x60': { name: 'Ленточный фундамент 300×600мм', unit: 'м.п.', price: 2500, category: 'foundation' },
        'wrk_found_strip_40x60': { name: 'Ленточный фундамент 400×600мм', unit: 'м.п.', price: 3000, category: 'foundation' },
        'wrk_found_strip_40x80': { name: 'Ленточный фундамент 400×800мм', unit: 'м.п.', price: 3800, category: 'foundation' },
        'wrk_found_strip_50x80': { name: 'Ленточный фундамент 500×800мм', unit: 'м.п.', price: 4500, category: 'foundation' },
        'wrk_found_strip_50x100': { name: 'Ленточный фундамент 500×1000мм', unit: 'м.п.', price: 5500, category: 'foundation' },
        'wrk_found_strip_60x100': { name: 'Ленточный фундамент 600×1000мм', unit: 'м.п.', price: 6500, category: 'foundation' },
        // Ленточный фундамент глубокого заложения
        'wrk_found_strip_deep_30x120': { name: 'Лент. фунд. глубокий 300×1200мм', unit: 'м.п.', price: 5000, category: 'foundation' },
        'wrk_found_strip_deep_40x150': { name: 'Лент. фунд. глубокий 400×1500мм', unit: 'м.п.', price: 7000, category: 'foundation' },
        'wrk_found_strip_deep_50x180': { name: 'Лент. фунд. глубокий 500×1800мм', unit: 'м.п.', price: 9000, category: 'foundation' },
        'wrk_found_strip_deep_60x200': { name: 'Лент. фунд. глубокий 600×2000мм', unit: 'м.п.', price: 12000, category: 'foundation' },
        // Плитный фундамент
        'wrk_found_slab_200': { name: 'Фундаментная плита 200мм', unit: 'м²', price: 2000, category: 'foundation' },
        'wrk_found_slab_250': { name: 'Фундаментная плита 250мм', unit: 'м²', price: 2400, category: 'foundation' },
        'wrk_found_slab_300': { name: 'Фундаментная плита 300мм', unit: 'м²', price: 2800, category: 'foundation' },
        'wrk_found_slab_350': { name: 'Фундаментная плита 350мм', unit: 'м²', price: 3200, category: 'foundation' },
        'wrk_found_slab_400': { name: 'Фундаментная плита 400мм', unit: 'м²', price: 3600, category: 'foundation' },
        'wrk_found_slab_500': { name: 'Фундаментная плита 500мм', unit: 'м²', price: 4500, category: 'foundation' },
        // УШП (Утеплённая шведская плита)
        'wrk_found_ushp_200': { name: 'УШП (утеплённая шведская плита) 200мм', unit: 'м²', price: 3500, category: 'foundation' },
        'wrk_found_ushp_250': { name: 'УШП (утеплённая шведская плита) 250мм', unit: 'м²', price: 4000, category: 'foundation' },
        'wrk_found_ushp_300': { name: 'УШП (утеплённая шведская плита) 300мм', unit: 'м²', price: 4500, category: 'foundation' },
        // УФФ (Утеплённый финский фундамент)
        'wrk_found_uff': { name: 'УФФ (утеплённый финский фундамент)', unit: 'м.п.', price: 5000, category: 'foundation' },
        // Столбчатый фундамент
        'wrk_found_column_200x200': { name: 'Столб фундаментный 200×200мм', unit: 'шт', price: 500, category: 'foundation' },
        'wrk_found_column_300x300': { name: 'Столб фундаментный 300×300мм', unit: 'шт', price: 800, category: 'foundation' },
        'wrk_found_column_400x400': { name: 'Столб фундаментный 400×400мм', unit: 'шт', price: 1200, category: 'foundation' },
        'wrk_found_column_500x500': { name: 'Столб фундаментный 500×500мм', unit: 'шт', price: 1800, category: 'foundation' },
        'wrk_found_column_d200': { name: 'Столб фундаментный Ø200мм', unit: 'шт', price: 400, category: 'foundation' },
        'wrk_found_column_d300': { name: 'Столб фундаментный Ø300мм', unit: 'шт', price: 700, category: 'foundation' },
        // Буронабивные сваи
        'wrk_found_bore_d150_1m': { name: 'Буронабивная свая Ø150мм, L=1м', unit: 'шт', price: 800, category: 'foundation' },
        'wrk_found_bore_d150_2m': { name: 'Буронабивная свая Ø150мм, L=2м', unit: 'шт', price: 1200, category: 'foundation' },
        'wrk_found_bore_d200_2m': { name: 'Буронабивная свая Ø200мм, L=2м', unit: 'шт', price: 1500, category: 'foundation' },
        'wrk_found_bore_d200_3m': { name: 'Буронабивная свая Ø200мм, L=3м', unit: 'шт', price: 2000, category: 'foundation' },
        'wrk_found_bore_d250_3m': { name: 'Буронабивная свая Ø250мм, L=3м', unit: 'шт', price: 2500, category: 'foundation' },
        'wrk_found_bore_d300_3m': { name: 'Буронабивная свая Ø300мм, L=3м', unit: 'шт', price: 3000, category: 'foundation' },
        'wrk_found_bore_d300_4m': { name: 'Буронабивная свая Ø300мм, L=4м', unit: 'шт', price: 3800, category: 'foundation' },
        'wrk_found_bore_d400_4m': { name: 'Буронабивная свая Ø400мм, L=4м', unit: 'шт', price: 5000, category: 'foundation' },
        'wrk_found_bore_d400_6m': { name: 'Буронабивная свая Ø400мм, L=6м', unit: 'шт', price: 7000, category: 'foundation' },
        'wrk_found_bore_d500_6m': { name: 'Буронабивная свая Ø500мм, L=6м', unit: 'шт', price: 9000, category: 'foundation' },
        'wrk_found_bore_d600_8m': { name: 'Буронабивная свая Ø600мм, L=8м', unit: 'шт', price: 12000, category: 'foundation' },
        'wrk_found_bore_d800_10m': { name: 'Буронабивная свая Ø800мм, L=10м', unit: 'шт', price: 18000, category: 'foundation' },
        'wrk_found_bore_d1000_12m': { name: 'Буронабивная свая Ø1000мм, L=12м', unit: 'шт', price: 25000, category: 'foundation' },
        // Винтовые сваи
        'wrk_found_screw_d57_1500': { name: 'Винтовая свая Ø57мм, L=1.5м', unit: 'шт', price: 800, category: 'foundation' },
        'wrk_found_screw_d76_2000': { name: 'Винтовая свая Ø76мм, L=2м', unit: 'шт', price: 1200, category: 'foundation' },
        'wrk_found_screw_d89_2000': { name: 'Винтовая свая Ø89мм, L=2м', unit: 'шт', price: 1500, category: 'foundation' },
        'wrk_found_screw_d89_2500': { name: 'Винтовая свая Ø89мм, L=2.5м', unit: 'шт', price: 1800, category: 'foundation' },
        'wrk_found_screw_d108_2500': { name: 'Винтовая свая Ø108мм, L=2.5м', unit: 'шт', price: 2000, category: 'foundation' },
        'wrk_found_screw_d108_3000': { name: 'Винтовая свая Ø108мм, L=3м', unit: 'шт', price: 2500, category: 'foundation' },
        'wrk_found_screw_d133_3000': { name: 'Винтовая свая Ø133мм, L=3м', unit: 'шт', price: 3000, category: 'foundation' },
        'wrk_found_screw_d133_4000': { name: 'Винтовая свая Ø133мм, L=4м', unit: 'шт', price: 3500, category: 'foundation' },
        'wrk_found_screw_d159_3000': { name: 'Винтовая свая Ø159мм, L=3м', unit: 'шт', price: 3500, category: 'foundation' },
        'wrk_found_screw_d159_4000': { name: 'Винтовая свая Ø159мм, L=4м', unit: 'шт', price: 4500, category: 'foundation' },
        'wrk_found_screw_d219_4000': { name: 'Винтовая свая Ø219мм, L=4м', unit: 'шт', price: 6000, category: 'foundation' },
        // Забивные сваи ж/б
        'wrk_found_driven_150x150_3m': { name: 'Забивная свая ж/б 150×150мм, L=3м', unit: 'шт', price: 2000, category: 'foundation' },
        'wrk_found_driven_200x200_4m': { name: 'Забивная свая ж/б 200×200мм, L=4м', unit: 'шт', price: 3000, category: 'foundation' },
        'wrk_found_driven_250x250_5m': { name: 'Забивная свая ж/б 250×250мм, L=5м', unit: 'шт', price: 4000, category: 'foundation' },
        'wrk_found_driven_300x300_6m': { name: 'Забивная свая ж/б 300×300мм, L=6м', unit: 'шт', price: 5000, category: 'foundation' },
        'wrk_found_driven_300x300_8m': { name: 'Забивная свая ж/б 300×300мм, L=8м', unit: 'шт', price: 7000, category: 'foundation' },
        'wrk_found_driven_350x350_8m': { name: 'Забивная свая ж/б 350×350мм, L=8м', unit: 'шт', price: 8000, category: 'foundation' },
        'wrk_found_driven_350x350_10m': { name: 'Забивная свая ж/б 350×350мм, L=10м', unit: 'шт', price: 10000, category: 'foundation' },
        'wrk_found_driven_400x400_10m': { name: 'Забивная свая ж/б 400×400мм, L=10м', unit: 'шт', price: 12000, category: 'foundation' },
        'wrk_found_driven_400x400_12m': { name: 'Забивная свая ж/б 400×400мм, L=12м', unit: 'шт', price: 15000, category: 'foundation' },
        // Вдавливаемые сваи
        'wrk_found_pressed_300x300_6m': { name: 'Вдавливаемая свая 300×300мм, L=6м', unit: 'шт', price: 6000, category: 'foundation' },
        'wrk_found_pressed_300x300_8m': { name: 'Вдавливаемая свая 300×300мм, L=8м', unit: 'шт', price: 8000, category: 'foundation' },
        'wrk_found_pressed_350x350_10m': { name: 'Вдавливаемая свая 350×350мм, L=10м', unit: 'шт', price: 12000, category: 'foundation' },
        // Ростверк
        'wrk_found_grillage_300x400': { name: 'Ростверк 300×400мм', unit: 'м.п.', price: 2000, category: 'foundation' },
        'wrk_found_grillage_400x500': { name: 'Ростверк 400×500мм', unit: 'м.п.', price: 2800, category: 'foundation' },
        'wrk_found_grillage_400x600': { name: 'Ростверк 400×600мм', unit: 'м.п.', price: 3500, category: 'foundation' },
        'wrk_found_grillage_500x700': { name: 'Ростверк 500×700мм', unit: 'м.п.', price: 4500, category: 'foundation' },
        'wrk_found_grillage_600x800': { name: 'Ростверк 600×800мм', unit: 'м.п.', price: 6000, category: 'foundation' },
        // Фундаменты стаканного типа
        'wrk_found_socket_08': { name: 'Фундамент стаканный (до 0.8т)', unit: 'шт', price: 5000, category: 'foundation' },
        'wrk_found_socket_15': { name: 'Фундамент стаканный (до 1.5т)', unit: 'шт', price: 8000, category: 'foundation' },
        'wrk_found_socket_25': { name: 'Фундамент стаканный (до 2.5т)', unit: 'шт', price: 12000, category: 'foundation' },
        // Фундаменты из ФБС
        'wrk_found_fbs_1row': { name: 'Фундамент из ФБС (1 ряд)', unit: 'м.п.', price: 1500, category: 'foundation' },
        'wrk_found_fbs_2row': { name: 'Фундамент из ФБС (2 ряда)', unit: 'м.п.', price: 2800, category: 'foundation' },
        'wrk_found_fbs_3row': { name: 'Фундамент из ФБС (3 ряда)', unit: 'м.п.', price: 4000, category: 'foundation' },
        'wrk_found_fbs_4row': { name: 'Фундамент из ФБС (4 ряда)', unit: 'м.п.', price: 5200, category: 'foundation' },
        'wrk_found_fbs_5row': { name: 'Фундамент из ФБС (5 рядов)', unit: 'м.п.', price: 6500, category: 'foundation' },
        'wrk_found_fbs_6row': { name: 'Фундамент из ФБС (6 рядов)', unit: 'м.п.', price: 7800, category: 'foundation' },
        // Монтаж ФЛ (фундаментные подушки)
        'wrk_found_fl_install': { name: 'Монтаж плит ФЛ', unit: 'шт', price: 500, category: 'foundation' },
        // Армирование фундаментов
        'wrk_found_rebar_strip': { name: 'Армирование лент. фундамента', unit: 'м.п.', price: 300, category: 'foundation' },
        'wrk_found_rebar_slab': { name: 'Армирование плитного фундамента', unit: 'м²', price: 200, category: 'foundation' },
        'wrk_found_rebar_cage_pile': { name: 'Арматурный каркас сваи', unit: 'шт', price: 500, category: 'foundation' },
        'wrk_found_rebar_grillage': { name: 'Армирование ростверка', unit: 'м.п.', price: 250, category: 'foundation' },
        // Опалубка фундаментов
        'wrk_found_formwork_slab': { name: 'Опалубка плитного фундамента (борта)', unit: 'м.п.', price: 200, category: 'foundation' },
        'wrk_found_formwork_column': { name: 'Опалубка столбчатого фундамента', unit: 'шт', price: 300, category: 'foundation' },
        'wrk_found_formwork_perm': { name: 'Несъёмная опалубка (ЭППС)', unit: 'м²', price: 400, category: 'foundation' },
        'wrk_found_formwork_perm_dsc': { name: 'Несъёмная опалубка (ДСК/фибролит)', unit: 'м²', price: 350, category: 'foundation' },
        // Бетонирование фундаментов
        'wrk_found_pour_m200': { name: 'Заливка фундамента бетоном М200', unit: 'м³', price: 500, category: 'foundation' },
        'wrk_found_pour_m250': { name: 'Заливка фундамента бетоном М250', unit: 'м³', price: 550, category: 'foundation' },
        'wrk_found_pour_m300': { name: 'Заливка фундамента бетоном М300', unit: 'м³', price: 600, category: 'foundation' },
        'wrk_found_pour_m350': { name: 'Заливка фундамента бетоном М350', unit: 'м³', price: 650, category: 'foundation' },
        'wrk_found_pour_m400': { name: 'Заливка фундамента бетоном М400', unit: 'м³', price: 700, category: 'foundation' },
        // Гидроизоляция фундамента
        'wrk_found_waterproof_bitumen': { name: 'ГИ фундамента обмазочная (битум)', unit: 'м²', price: 100, category: 'foundation' },
        'wrk_found_waterproof_polymer': { name: 'ГИ фундамента обмазочная (полимерная)', unit: 'м²', price: 200, category: 'foundation' },
        'wrk_found_waterproof_roll': { name: 'ГИ фундамента оклеечная (рулонная)', unit: 'м²', price: 250, category: 'foundation' },
        'wrk_found_waterproof_membrane': { name: 'ГИ фундамента мембранная (ПВХ)', unit: 'м²', price: 300, category: 'foundation' },
        'wrk_found_waterproof_penetrating': { name: 'ГИ фундамента проникающая (Пенетрон)', unit: 'м²', price: 350, category: 'foundation' },
        'wrk_found_waterproof_cutoff': { name: 'Отсечная ГИ (горизонтальная)', unit: 'м.п.', price: 200, category: 'foundation' },
        // Утепление фундамента
        'wrk_found_insul_xps_50': { name: 'Утепление фунд. ЭППС 50мм', unit: 'м²', price: 200, category: 'foundation' },
        'wrk_found_insul_xps_100': { name: 'Утепление фунд. ЭППС 100мм', unit: 'м²', price: 300, category: 'foundation' },
        'wrk_found_insul_xps_150': { name: 'Утепление фунд. ЭППС 150мм', unit: 'м²', price: 400, category: 'foundation' },
        'wrk_found_insul_hor_100': { name: 'Утепление отмостки горизонт. ЭППС 100мм', unit: 'м²', price: 250, category: 'foundation' },
        // Отмостка
        'wrk_found_blind_area_concrete': { name: 'Бетонная отмостка', unit: 'м²', price: 800, category: 'foundation' },
        'wrk_found_blind_area_soft': { name: 'Мягкая отмостка (мембрана + щебень)', unit: 'м²', price: 500, category: 'foundation' },
        'wrk_found_blind_area_paver': { name: 'Отмостка из тротуарной плитки', unit: 'м²', price: 1000, category: 'foundation' },
        // Цокольный этаж / подвал
        'wrk_found_basement_wall_concrete': { name: 'Стены подвала (монолит, 200мм)', unit: 'м²', price: 2500, category: 'foundation' },
        'wrk_found_basement_wall_fbs': { name: 'Стены подвала из ФБС', unit: 'м²', price: 2000, category: 'foundation' },
        'wrk_found_basement_wall_brick': { name: 'Стены подвала из кирпича', unit: 'м²', price: 1800, category: 'foundation' },
        'wrk_found_basement_floor': { name: 'Устройство пола подвала (бетон)', unit: 'м²', price: 1500, category: 'foundation' },
        'wrk_found_basement_waterproof': { name: 'ГИ подвала комплексная', unit: 'м²', price: 500, category: 'foundation' },
        'wrk_found_basement_drain': { name: 'Пристенный дренаж подвала', unit: 'м.п.', price: 600, category: 'foundation' },
        'wrk_found_basement_vent': { name: 'Вентиляция подвала / продухи', unit: 'шт', price: 500, category: 'foundation' },
        // Испытания свай
        'wrk_found_pile_test_static': { name: 'Статические испытания свай', unit: 'шт', price: 20000, category: 'foundation' },
        'wrk_found_pile_test_dynamic': { name: 'Динамические испытания свай', unit: 'шт', price: 5000, category: 'foundation' },
        'wrk_found_pile_test_integrity': { name: 'Проверка сплошности свай', unit: 'шт', price: 2000, category: 'foundation' },
        // Усиление фундаментов
        'wrk_found_reinforce_underpin': { name: 'Усиление фундамента подведением', unit: 'м.п.', price: 5000, category: 'foundation' },
        'wrk_found_reinforce_inject': { name: 'Усиление фундамента инъекцией', unit: 'м.п.', price: 3000, category: 'foundation' },
        'wrk_found_reinforce_micropile': { name: 'Усиление микросваями', unit: 'шт', price: 5000, category: 'foundation' },
        'wrk_found_reinforce_jacket': { name: 'Усиление фундамента обоймой', unit: 'м.п.', price: 4000, category: 'foundation' },
        'wrk_found_reinforce_widen': { name: 'Уширение подошвы фундамента', unit: 'м.п.', price: 5000, category: 'foundation' },
        // Демонтаж фундаментов
        'wrk_found_demo_pile_cut': { name: 'Срубка оголовков свай', unit: 'шт', price: 500, category: 'foundation' },
        'wrk_found_demo_pile_extract': { name: 'Извлечение свай', unit: 'шт', price: 3000, category: 'foundation' },
        // Подпорные стенки
        'wrk_found_retaining_concrete': { name: 'Подпорная стенка из бетона', unit: 'м³', price: 5000, category: 'foundation' },
        'wrk_found_retaining_gabion': { name: 'Подпорная стенка из габионов', unit: 'м³', price: 3000, category: 'foundation' },
        'wrk_found_retaining_block': { name: 'Подпорная стенка из блоков', unit: 'м³', price: 4000, category: 'foundation' },
        // Специальные фундаменты
        'wrk_found_mat': { name: 'Плитно-коробчатый фундамент', unit: 'м²', price: 5000, category: 'foundation' },
        'wrk_found_caisson': { name: 'Кессонный фундамент', unit: 'шт', price: 50000, category: 'foundation' },
        'wrk_found_anchor': { name: 'Грунтовые анкера', unit: 'шт', price: 3000, category: 'foundation' },
        // Армопояс
        'wrk_found_armo_200x200': { name: 'Армопояс 200×200мм', unit: 'м.п.', price: 800, category: 'foundation' },
        'wrk_found_armo_200x300': { name: 'Армопояс 200×300мм', unit: 'м.п.', price: 1000, category: 'foundation' },
        'wrk_found_armo_300x300': { name: 'Армопояс 300×300мм', unit: 'м.п.', price: 1200, category: 'foundation' },
        'wrk_found_armo_400x300': { name: 'Армопояс 400×300мм', unit: 'м.п.', price: 1500, category: 'foundation' },
        // Обследование / проектирование
        'wrk_found_geotech_survey': { name: 'Геотехническое обследование', unit: 'шт', price: 20000, category: 'foundation' },
        'wrk_found_soil_test': { name: 'Геология участка (бурение + отчёт)', unit: 'шт', price: 30000, category: 'foundation' },
        'wrk_found_project_house': { name: 'Проект фундамента (дом)', unit: 'шт', price: 15000, category: 'foundation' },
        'wrk_found_project_commercial': { name: 'Проект фундамента (промышл.)', unit: 'шт', price: 50000, category: 'foundation' }
    };
})();
