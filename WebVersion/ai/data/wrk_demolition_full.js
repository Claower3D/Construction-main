// === ФАЗА 3: ДЕМОНТАЖНЫЕ РАБОТЫ ДЕТАЛЬНО — СТЕНЫ, ПОЛЫ, КРОВЛЯ, СИСТЕМЫ (100 поз.) ===
(function () {
    window.AI_WRK_DEMOLITION_FULL = {
        // === ДЕМОНТАЖ СТЕН ===
        'wrk_dem_wall_brick_120': { name: 'Демонтаж кирпичн. стены 120мм', unit: 'м²', price: 30, category: 'demolition_full' },
        'wrk_dem_wall_brick_250': { name: 'Демонтаж кирпичн. стены 250мм', unit: 'м²', price: 50, category: 'demolition_full' },
        'wrk_dem_wall_brick_380': { name: 'Демонтаж кирпичн. стены 380мм', unit: 'м²', price: 80, category: 'demolition_full' },
        'wrk_dem_wall_brick_510': { name: 'Демонтаж кирпичн. стены 510мм', unit: 'м²', price: 100, category: 'demolition_full' },
        'wrk_dem_wall_concrete_100': { name: 'Демонтаж бетонной стены 100мм', unit: 'м²', price: 80, category: 'demolition_full' },
        'wrk_dem_wall_concrete_150': { name: 'Демонтаж бетонной стены 150мм', unit: 'м²', price: 120, category: 'demolition_full' },
        'wrk_dem_wall_concrete_200': { name: 'Демонтаж бетонной стены 200мм', unit: 'м²', price: 150, category: 'demolition_full' },
        'wrk_dem_wall_gasblock': { name: 'Демонтаж стены из газоблока', unit: 'м²', price: 20, category: 'demolition_full' },
        'wrk_dem_opening_brick': { name: 'Проём в кирпичной стене', unit: 'м²', price: 100, category: 'demolition_full' },
        'wrk_dem_opening_concrete': { name: 'Проём в бетонной стене', unit: 'м²', price: 200, category: 'demolition_full' },
        'wrk_dem_wall_plaster': { name: 'Снятие штукатурки со стен', unit: 'м²', price: 10, category: 'demolition_full' },
        'wrk_dem_wall_tile': { name: 'Снятие плитки со стен', unit: 'м²', price: 15, category: 'demolition_full' },

        // === ДЕМОНТАЖ ПОЛОВ ===
        'wrk_dem_floor_tile': { name: 'Демонтаж плитки пола', unit: 'м²', price: 15, category: 'demolition_full' },
        'wrk_dem_floor_screed_30': { name: 'Демонтаж стяжки 30мм', unit: 'м²', price: 20, category: 'demolition_full' },
        'wrk_dem_floor_screed_50': { name: 'Демонтаж стяжки 50мм', unit: 'м²', price: 30, category: 'demolition_full' },
        'wrk_dem_floor_screed_100': { name: 'Демонтаж стяжки 100мм', unit: 'м²', price: 50, category: 'demolition_full' },
        'wrk_dem_floor_wood': { name: 'Демонтаж деревянного пола', unit: 'м²', price: 15, category: 'demolition_full' },
        'wrk_dem_floor_lags': { name: 'Демонтаж лаг', unit: 'м²', price: 10, category: 'demolition_full' },

        // === ДЕМОНТАЖ ПОТОЛКОВ ===
        'wrk_dem_ceil_plaster': { name: 'Снятие штукатурки с потолка', unit: 'м²', price: 15, category: 'demolition_full' },
        'wrk_dem_ceil_paneling': { name: 'Демонтаж обшивки потолка', unit: 'м²', price: 8, category: 'demolition_full' },

        // === ДЕМОНТАЖ ДВЕРЕЙ/ОКОН ===
        'wrk_dem_door': { name: 'Демонтаж двери (с коробкой)', unit: 'шт', price: 50, category: 'demolition_full' },
        'wrk_dem_door_metal': { name: 'Демонтаж металлической двери', unit: 'шт', price: 100, category: 'demolition_full' },
        'wrk_dem_window': { name: 'Демонтаж окна', unit: 'шт', price: 80, category: 'demolition_full' },
        'wrk_dem_window_balcony': { name: 'Демонтаж балконного блока', unit: 'шт', price: 100, category: 'demolition_full' },

        // === ДЕМОНТАЖ ИНЖЕНЕРНЫХ СИСТЕМ ===
        'wrk_dem_plumbing_pipe': { name: 'Демонтаж труб водоснабжения', unit: 'м.п.', price: 10, category: 'demolition_full' },
        'wrk_dem_sewer_pipe': { name: 'Демонтаж канализации', unit: 'м.п.', price: 10, category: 'demolition_full' },
        'wrk_dem_electrical_panel': { name: 'Демонтаж щита электрического', unit: 'шт', price: 100, category: 'demolition_full' },

        // === ДЕМОНТАЖ КРОВЛИ ===
        'wrk_dem_roof_shingles': { name: 'Демонтаж мягкой черепицы', unit: 'м²', price: 10, category: 'demolition_full' },
        'wrk_dem_roof_metal': { name: 'Демонтаж металлочерепицы', unit: 'м²', price: 10, category: 'demolition_full' },
        'wrk_dem_roof_profn': { name: 'Демонтаж профнастила', unit: 'м²', price: 8, category: 'demolition_full' },
        'wrk_dem_roof_flat': { name: 'Демонтаж плоской кровли', unit: 'м²', price: 15, category: 'demolition_full' },
        'wrk_dem_roof_rafter': { name: 'Демонтаж стропильной системы', unit: 'м²', price: 20, category: 'demolition_full' },
        'wrk_dem_gutter': { name: 'Демонтаж водосточной системы', unit: 'м.п.', price: 5, category: 'demolition_full' },

        // === ВЫВОЗ МУСОРА ===
        'wrk_dem_trash_container_8': { name: 'Контейнер 8м³ (мусор)', unit: 'шт', price: 1000, category: 'demolition_full' },
        'wrk_dem_trash_container_20': { name: 'Контейнер 20м³ (мусор)', unit: 'шт', price: 2000, category: 'demolition_full' },
        'wrk_dem_trash_container_27': { name: 'Контейнер 27м³ (мусор)', unit: 'шт', price: 2500, category: 'demolition_full' },
        'wrk_dem_trash_elevator': { name: 'Мусоропровод (рукав)', unit: 'м.п.', price: 20, category: 'demolition_full' }
    };
})();
