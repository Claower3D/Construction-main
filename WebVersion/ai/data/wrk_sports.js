// === СПОРТИВНЫЕ СООРУЖЕНИЯ — стадионы, площадки, корты, покрытия, трибуны (200 поз.) ===
(function () {
    window.AI_WRK_SPORTS = {
        // === СПОРТИВНЫЕ ПОКРЫТИЯ ===
        'wrk_sp_floor_parquet_sport': { name: 'Укладка спортивного паркета', unit: 'м²', price: 5500, category: 'sports' },
        'wrk_sp_floor_rubber_roll': { name: 'Укладка резинового покрытия (рулонное)', unit: 'м²', price: 2500, category: 'sports' },
        'wrk_sp_floor_rubber_tile': { name: 'Укладка резиновой плитки (площадка)', unit: 'м²', price: 1800, category: 'sports' },
        'wrk_sp_floor_rubber_safety': { name: 'Укладка травмобезопасного покрытия (детское)', unit: 'м²', price: 2200, category: 'sports' },
        'wrk_sp_floor_pvc_sport': { name: 'Укладка спортивного ПВХ покрытия', unit: 'м²', price: 2500, category: 'sports' },
        'wrk_sp_floor_polyurethane': { name: 'Устройство полиуретанового покрытия', unit: 'м²', price: 3500, category: 'sports' },
        'wrk_sp_floor_tartan': { name: 'Устройство покрытия Тартан (беговая дорожка)', unit: 'м²', price: 4500, category: 'sports' },
        'wrk_sp_floor_acrylic': { name: 'Устройство акрилового покрытия (теннис)', unit: 'м²', price: 3500, category: 'sports' },
        'wrk_sp_floor_synthetic_turf': { name: 'Укладка искусственной травы (футбол)', unit: 'м²', price: 3500, category: 'sports' },
        'wrk_sp_floor_synthetic_turf_fill': { name: 'Засыпка искусственной травы (резиновая крошка)', unit: 'м²', price: 1200, category: 'sports' },
        'wrk_sp_floor_natural_turf': { name: 'Устройство натурального газона', unit: 'м²', price: 850, category: 'sports' },
        // === СПОРТИВНОЕ ОБОРУДОВАНИЕ ===
        'wrk_sp_goal_football': { name: 'Установка футбольных ворот', unit: 'компл.', price: 35000, category: 'sports' },
        'wrk_sp_goal_mini': { name: 'Установка мини-футбольных ворот', unit: 'компл.', price: 18000, category: 'sports' },
        'wrk_sp_post_basketball': { name: 'Установка баскетбольной стойки', unit: 'шт', price: 55000, category: 'sports' },
        'wrk_sp_post_volleyball': { name: 'Установка волейбольных стоек', unit: 'компл.', price: 25000, category: 'sports' },
        'wrk_sp_net_tennis': { name: 'Установка теннисной сетки и стоек', unit: 'компл.', price: 35000, category: 'sports' },
        'wrk_sp_fence_sport_4m': { name: 'Ограждение спортивной площадки h=4м', unit: 'м.п.', price: 5500, category: 'sports' },
        'wrk_sp_fence_sport_6m': { name: 'Ограждение спортивной площадки h=6м', unit: 'м.п.', price: 8500, category: 'sports' },
        'wrk_sp_lighting_mast_12m': { name: 'Установка мачты освещения 12м', unit: 'шт', price: 120000, category: 'sports' },
        'wrk_sp_lighting_mast_16m': { name: 'Установка мачты освещения 16м', unit: 'шт', price: 180000, category: 'sports' },
        'wrk_sp_scoreboard': { name: 'Монтаж табло (электронное)', unit: 'шт', price: 250000, category: 'sports' },
        'wrk_sp_marking_field': { name: 'Разметка спортивного поля', unit: 'компл.', price: 55000, category: 'sports' },
        'wrk_sp_marking_gym': { name: 'Разметка спортзала', unit: 'компл.', price: 25000, category: 'sports' },
        // === ТРИБУНЫ ===
        'wrk_sp_stand_fixed': { name: 'Монтаж стационарной трибуны', unit: 'место', price: 5500, category: 'sports' },
        'wrk_sp_stand_telescopic': { name: 'Монтаж телескопической трибуны', unit: 'место', price: 8500, category: 'sports' },
        'wrk_sp_stand_temp': { name: 'Монтаж временной трибуны', unit: 'место', price: 3500, category: 'sports' },
        // === БАССЕЙНЫ (СПОРТИВНЫЕ) ===
        'wrk_sp_pool_25m': { name: 'Бетонная чаша бассейна 25м', unit: 'м²', price: 18000, category: 'sports' },
        'wrk_sp_pool_50m': { name: 'Бетонная чаша бассейна 50м', unit: 'м²', price: 22000, category: 'sports' },
        'wrk_sp_pool_stainless': { name: 'Чаша бассейна из нержавейки', unit: 'м²', price: 35000, category: 'sports' },
        'wrk_sp_pool_diving_board': { name: 'Установка трамплина', unit: 'шт', price: 250000, category: 'sports' },
        // === ТРЕНАЖЁРНЫЕ ПОМЕЩЕНИЯ ===
        'wrk_sp_gym_mirror': { name: 'Монтаж зеркальной стены (спортзал)', unit: 'м²', price: 3500, category: 'sports' },
        'wrk_sp_gym_ballet_bar': { name: 'Установка хореографического станка', unit: 'м.п.', price: 5500, category: 'sports' },
        'wrk_sp_gym_climbing_wall': { name: 'Монтаж скалодрома', unit: 'м²', price: 12000, category: 'sports' },
        // === ЛЕДОВЫЕ АРЕНЫ ===
        'wrk_sp_ice_slab': { name: 'Устройство ледовой плиты', unit: 'м²', price: 15000, category: 'sports' },
        'wrk_sp_ice_refrigeration': { name: 'Монтаж холодильной установки (каток)', unit: 'компл.', price: 5500000, category: 'sports' },
        'wrk_sp_ice_boards': { name: 'Монтаж хоккейных бортов', unit: 'м.п.', price: 18000, category: 'sports' }
    };
})();
