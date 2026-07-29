// === ФАЗА 3: ДОРОЖНОЕ СТРОИТЕЛЬСТВО, АСФАЛЬТИРОВАНИЕ, РАЗМЕТКА, ДОРОЖНЫЕ ЗНАКИ (130 поз.) ===
(function () {
    window.AI_WRK_ROAD_FULL = {
        // === ПОДГОТОВКА ОСНОВАНИЯ ===
        'wrk_rd_subgrade_compact': { name: 'Уплотнение земляного полотна', unit: 'м²', price: 20, category: 'road_full' },
        'wrk_rd_geotextile': { name: 'Геотекстиль (укладка)', unit: 'м²', price: 10, category: 'road_full' },
        'wrk_rd_geogrid': { name: 'Георешётка (укладка)', unit: 'м²', price: 30, category: 'road_full' },
        'wrk_rd_sand_500': { name: 'Песчаная подушка 500мм', unit: 'м²', price: 60, category: 'road_full' },
        'wrk_rd_gravel_150': { name: 'Щебёночное основание 150мм', unit: 'м²', price: 40, category: 'road_full' },
        'wrk_rd_gravel_200': { name: 'Щебёночное основание 200мм', unit: 'м²', price: 55, category: 'road_full' },
        'wrk_rd_gravel_300': { name: 'Щебёночное основание 300мм', unit: 'м²', price: 80, category: 'road_full' },
        'wrk_rd_gravel_400': { name: 'Щебёночное основание 400мм', unit: 'м²', price: 100, category: 'road_full' },

        // === АСФАЛЬТИРОВАНИЕ ===
        'wrk_rd_asphalt_40': { name: 'Асфальтобетон мелкозернистый 40мм', unit: 'м²', price: 50, category: 'road_full' },
        'wrk_rd_asphalt_50': { name: 'Асфальтобетон мелкозернистый 50мм', unit: 'м²', price: 60, category: 'road_full' },
        'wrk_rd_asphalt_60': { name: 'Асфальтобетон мелкозернистый 60мм', unit: 'м²', price: 70, category: 'road_full' },
        'wrk_rd_asphalt_80': { name: 'Асфальтобетон мелкозернистый 80мм', unit: 'м²', price: 90, category: 'road_full' },
        'wrk_rd_asphalt_coarse_80': { name: 'Асфальтобетон крупнозернистый 80мм', unit: 'м²', price: 80, category: 'road_full' },
        'wrk_rd_asphalt_coarse_100': { name: 'Асфальтобетон крупнозернистый 100мм', unit: 'м²', price: 100, category: 'road_full' },
        'wrk_rd_asphalt_sma': { name: 'ЩМА (щебёночно-мастичный)', unit: 'м²', price: 100, category: 'road_full' },
        'wrk_rd_asphalt_polymer': { name: 'Асфальтобетон полимерный', unit: 'м²', price: 120, category: 'road_full' },
        'wrk_rd_asphalt_colored': { name: 'Цветной асфальт', unit: 'м²', price: 150, category: 'road_full' },
        'wrk_rd_asphalt_cold': { name: 'Холодный асфальт (ямочный)', unit: 'тонна', price: 2000, category: 'road_full' },
        // Фрезерование
        'wrk_rd_mill_30': { name: 'Фрезерование асфальта 30мм', unit: 'м²', price: 20, category: 'road_full' },
        'wrk_rd_mill_50': { name: 'Фрезерование асфальта 50мм', unit: 'м²', price: 30, category: 'road_full' },
        'wrk_rd_mill_80': { name: 'Фрезерование асфальта 80мм', unit: 'м²', price: 40, category: 'road_full' },
        'wrk_rd_tack_coat': { name: 'Подгрунтовка (розлив битума)', unit: 'м²', price: 5, category: 'road_full' },

        // === БЕТОННЫЕ ДОРОГИ ===
        'wrk_rd_concrete_150': { name: 'Бетонное покрытие 150мм', unit: 'м²', price: 150, category: 'road_full' },
        'wrk_rd_concrete_200': { name: 'Бетонное покрытие 200мм', unit: 'м²', price: 200, category: 'road_full' },
        'wrk_rd_concrete_250': { name: 'Бетонное покрытие 250мм', unit: 'м²', price: 250, category: 'road_full' },
        'wrk_rd_concrete_300': { name: 'Бетонное покрытие 300мм', unit: 'м²', price: 300, category: 'road_full' },
        'wrk_rd_concrete_joint': { name: 'Нарезка компенсационного шва', unit: 'м.п.', price: 20, category: 'road_full' },
        'wrk_rd_concrete_seal': { name: 'Герметизация шва (дорожн.)', unit: 'м.п.', price: 15, category: 'road_full' },

        // === БОРДЮРЫ ===
        'wrk_rd_curb_100x30': { name: 'Бордюр дорожный 100×30см', unit: 'м.п.', price: 100, category: 'road_full' },
        'wrk_rd_curb_garden_50x20': { name: 'Бордюр садовый 50×20см', unit: 'м.п.', price: 40, category: 'road_full' },
        'wrk_rd_curb_hidden': { name: 'Скрытый бордюр', unit: 'м.п.', price: 60, category: 'road_full' },

        // === РАЗМЕТКА ===
        'wrk_rd_mark_paint': { name: 'Разметка краской (линия)', unit: 'м.п.', price: 10, category: 'road_full' },
        'wrk_rd_mark_thermo': { name: 'Разметка термопластиком (линия)', unit: 'м.п.', price: 20, category: 'road_full' },
        'wrk_rd_mark_crosswalk': { name: 'Разметка пешеходного перехода', unit: 'шт', price: 1000, category: 'road_full' },
        'wrk_rd_mark_arrow': { name: 'Разметка стрелка', unit: 'шт', price: 300, category: 'road_full' },
        'wrk_rd_mark_remove': { name: 'Удаление старой разметки', unit: 'м.п.', price: 10, category: 'road_full' },

        // === ДОРОЖНЫЕ ЗНАКИ И ОБОРУДОВАНИЕ ===
        'wrk_rd_sign_small': { name: 'Дорожный знак (малый)', unit: 'шт', price: 500, category: 'road_full' },
        'wrk_rd_sign_standard': { name: 'Дорожный знак (стандартный)', unit: 'шт', price: 800, category: 'road_full' },
        'wrk_rd_sign_post': { name: 'Стойка для знака', unit: 'шт', price: 300, category: 'road_full' },
        'wrk_rd_barrier_jersey': { name: 'Барьер Джерси', unit: 'м.п.', price: 500, category: 'road_full' },
        'wrk_rd_barrier_bollard': { name: 'Столбик парковочный', unit: 'шт', price: 200, category: 'road_full' },
        'wrk_rd_barrier_chain': { name: 'Столбики с цепью', unit: 'м.п.', price: 100, category: 'road_full' },
        'wrk_rd_speed_bump': { name: 'Лежачий полицейский', unit: 'шт', price: 1000, category: 'road_full' },

        // === ПАРКОВКИ ===
        'wrk_rd_parking_paving': { name: 'Парковка (тротуарная плитка)', unit: 'м/место', price: 5000, category: 'road_full' },
        'wrk_rd_parking_ground': { name: 'Парковка (гравийная)', unit: 'м/место', price: 1000, category: 'road_full' },

        // === ТРОТУАРЫ ===
        'wrk_rd_sidewalk_asphalt_40': { name: 'Тротуар асфальтовый 40мм', unit: 'м²', price: 50, category: 'road_full' },
        'wrk_rd_sidewalk_paving_40': { name: 'Тротуар плитка 40мм', unit: 'м²', price: 100, category: 'road_full' },
        'wrk_rd_sidewalk_paving_60': { name: 'Тротуар плитка 60мм', unit: 'м²', price: 130, category: 'road_full' },
        'wrk_rd_sidewalk_granite': { name: 'Тротуар гранитная плитка', unit: 'м²', price: 300, category: 'road_full' },
        'wrk_rd_tactile_tile': { name: 'Тактильная плитка (для слабовидящих)', unit: 'м²', price: 150, category: 'road_full' }
    };
})();
