// === СПОРТИВНЫЕ ОБЪЕКТЫ ПОЛН — покрытия, оборудование, трибуны, площадки (50 поз.) ===
(function () {
    window.AI_WRK_SPORTS2 = {
        // === ПОКРЫТИЯ === 1-12
        'wrk_sp2_turf_natural': { name: 'Натуральный газон (спортивный)', unit: 'м²', price: 850, category: 'sports2' },
        'wrk_sp2_turf_art_40': { name: 'Искусственный газон 40мм', unit: 'м²', price: 1500, category: 'sports2' },
        'wrk_sp2_turf_art_60': { name: 'Искусственный газон 60мм', unit: 'м²', price: 2200, category: 'sports2' },
        'wrk_sp2_turf_fill_rubber': { name: 'Засыпка резиновым гранулятом', unit: 'м²', price: 350, category: 'sports2' },
        'wrk_sp2_tartan': { name: 'Тартановое покрытие (беговая дорожка)', unit: 'м²', price: 2500, category: 'sports2' },
        'wrk_sp2_rubber_seamless': { name: 'Бесшовное резиновое покрытие', unit: 'м²', price: 1800, category: 'sports2' },
        'wrk_sp2_rubber_tile': { name: 'Резиновая плитка', unit: 'м²', price: 1200, category: 'sports2' },
        'wrk_sp2_acrylic_court': { name: 'Акриловое покрытие (корт)', unit: 'м²', price: 1800, category: 'sports2' },
        'wrk_sp2_sand_court': { name: 'Песчаная площадка (пляжный волейбол)', unit: 'м²', price: 550, category: 'sports2' },
        'wrk_sp2_epdm_playground': { name: 'EPDM покрытие площадки', unit: 'м²', price: 2500, category: 'sports2' },
        // === РАЗМЕТКА === 13-18
        'wrk_sp2_mark_football': { name: 'Разметка футбольного поля', unit: 'компл.', price: 25000, category: 'sports2' },
        'wrk_sp2_mark_basketball': { name: 'Разметка баскетбольной площадки', unit: 'компл.', price: 12000, category: 'sports2' },
        'wrk_sp2_mark_tennis': { name: 'Разметка теннисного корта', unit: 'компл.', price: 8500, category: 'sports2' },
        'wrk_sp2_mark_volleyball': { name: 'Разметка волейбольной площадки', unit: 'компл.', price: 5500, category: 'sports2' },
        'wrk_sp2_mark_track': { name: 'Разметка беговых дорожек', unit: 'компл.', price: 25000, category: 'sports2' },
        'wrk_sp2_mark_multi': { name: 'Разметка мультиспортивной площадки', unit: 'компл.', price: 15000, category: 'sports2' },
        // === ОБОРУДОВАНИЕ === 19-32
        'wrk_sp2_goal_football': { name: 'Футбольные ворота', unit: 'компл.', price: 25000, category: 'sports2' },
        'wrk_sp2_basket_wall': { name: 'Баскетбольный щит (стена)', unit: 'шт', price: 8500, category: 'sports2' },
        'wrk_sp2_volleyball_set': { name: 'Волейбольные стойки с сеткой', unit: 'компл.', price: 15000, category: 'sports2' },
        'wrk_sp2_tennis_set': { name: 'Теннисная сетка и стойки', unit: 'компл.', price: 25000, category: 'sports2' },
        'wrk_sp2_tribune_metal': { name: 'Металлическая трибуна', unit: 'место', price: 5500, category: 'sports2' },
        'wrk_sp2_tribune_seat': { name: 'Пластиковое сиденье трибуны', unit: 'шт', price: 550, category: 'sports2' },
        'wrk_sp2_scoreboard': { name: 'LED табло', unit: 'шт', price: 250000, category: 'sports2' },
        'wrk_sp2_floodlight_pole': { name: 'Мачта освещения (стадион)', unit: 'шт', price: 250000, category: 'sports2' },
        'wrk_sp2_floodlight': { name: 'LED прожектор (спортивный)', unit: 'шт', price: 25000, category: 'sports2' },
        'wrk_sp2_fence_4m': { name: 'Ограждение площадки h=4м', unit: 'м.п.', price: 3500, category: 'sports2' },
        'wrk_sp2_fence_6m': { name: 'Ограждение площадки h=6м', unit: 'м.п.', price: 5500, category: 'sports2' },
        'wrk_sp2_climbing_wall': { name: 'Скалодром', unit: 'м²', price: 8500, category: 'sports2' },
        // === ФИТНЕС === 33-36
        'wrk_sp2_gym_rubber': { name: 'Покрытие тренажёрного зала', unit: 'м²', price: 1500, category: 'sports2' },
        'wrk_sp2_gym_mirror': { name: 'Зеркальная стена (спорт)', unit: 'м²', price: 2500, category: 'sports2' },
        'wrk_sp2_gym_tatami': { name: 'Татами', unit: 'м²', price: 1200, category: 'sports2' },
        'wrk_sp2_gym_boxing': { name: 'Боксёрский ринг', unit: 'шт', price: 250000, category: 'sports2' },
        // === ДРЕНАЖ/ИНЖЕНЕРИЯ ПОЛЯ === 37-40
        'wrk_sp2_drain_field': { name: 'Дренаж спортивного поля', unit: 'м.п.', price: 850, category: 'sports2' },
        'wrk_sp2_irrig_field': { name: 'Система полива поля', unit: 'м²', price: 550, category: 'sports2' },
        'wrk_sp2_heat_field': { name: 'Обогрев поля', unit: 'м²', price: 2500, category: 'sports2' },
        'wrk_sp2_drain_base': { name: 'Дренирующее основание', unit: 'м²', price: 350, category: 'sports2' },
        // === ДЕТСКИЕ === 41-48
        'wrk_sp2_play_swing': { name: 'Качели', unit: 'шт', price: 25000, category: 'sports2' },
    };
})();
