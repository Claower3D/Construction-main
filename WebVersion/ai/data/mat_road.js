// === ДОРОЖНОЕ СТРОИТЕЛЬСТВО (35 позиций) ===
(function () {
    window.AI_MAT_ROAD = {
        // Асфальт
        'asphalt_hot_bnd': { name: 'Асфальтобетон горячий мелкозернистый (т)', unit: 'т', price: 12000, category: 'road' },
        'asphalt_hot_coarse': { name: 'Асфальтобетон горячий крупнозернистый (т)', unit: 'т', price: 10000, category: 'road' },
        'asphalt_cold_patch': { name: 'Асфальт холодный (ямочный ремонт, 25кг)', unit: 'мешок', price: 2500, category: 'road' },
        'asphalt_emulsion': { name: 'Битумная эмульсия (проливка, 200л)', unit: 'бочка', price: 15000, category: 'road' },

        // Щебень фракционный
        'crushed_stone_5_20_road': { name: 'Щебень фр. 5-20мм (для основания)', unit: 'м³', price: 3500, category: 'road' },
        'crushed_stone_20_40_road': { name: 'Щебень фр. 20-40мм (для подоснования)', unit: 'м³', price: 3000, category: 'road' },
        'crushed_stone_40_70_road': { name: 'Щебень фр. 40-70мм (для насыпи)', unit: 'м³', price: 2500, category: 'road' },

        // Бордюры дорожные
        'curb_road_1000x300x150': { name: 'Бордюр дорожный БР 100.30.15', unit: 'шт', price: 350, category: 'road' },
        'curb_road_1000x300x180': { name: 'Бордюр дорожный БР 100.30.18', unit: 'шт', price: 450, category: 'road' },
        'curb_road_1000x450x180': { name: 'Бордюр магистральный БР 100.45.18', unit: 'шт', price: 700, category: 'road' },

        // Плитка тротуарная профессиональная
        'paving_vibro_40': { name: 'Плитка тротуарная вибропресс 40мм', unit: 'м²', price: 1500, category: 'road' },
        'paving_vibro_60': { name: 'Плитка тротуарная вибропресс 60мм', unit: 'м²', price: 2000, category: 'road' },
        'paving_vibro_80': { name: 'Плитка тротуарная вибропресс 80мм', unit: 'м²', price: 2800, category: 'road' },
        'paving_clinker_60': { name: 'Клинкерная брусчатка 200×100×60', unit: 'м²', price: 4000, category: 'road' },
        'paving_granite_100': { name: 'Брусчатка гранитная 100×100×100', unit: 'м²', price: 5000, category: 'road' },

        // Люки и решётки
        'manhole_cast_type_t': { name: 'Люк чугунный тяжёлый (25т)', unit: 'шт', price: 8000, category: 'road' },
        'manhole_cast_type_l': { name: 'Люк чугунный лёгкий (1.5т)', unit: 'шт', price: 4000, category: 'road' },
        'manhole_composite': { name: 'Люк полимерный композитный', unit: 'шт', price: 3000, category: 'road' },

        // Ливневая канализация дорожная
        'storm_channel_dn100_1m': { name: 'Лоток бетонный DN100 (1м)', unit: 'шт', price: 1200, category: 'road' },
        'storm_channel_dn200_1m': { name: 'Лоток бетонный DN200 (1м)', unit: 'шт', price: 2000, category: 'road' },
        'storm_channel_dn300_1m': { name: 'Лоток бетонный DN300 (1м)', unit: 'шт', price: 3500, category: 'road' },
        'storm_grate_dn100': { name: 'Решётка чугунная для лотка DN100', unit: 'шт', price: 800, category: 'road' },
        'storm_grate_dn200': { name: 'Решётка чугунная для лотка DN200', unit: 'шт', price: 1200, category: 'road' },

        // Дорожная разметка
        'road_paint_white_25': { name: 'Краска дорожная белая (25кг)', unit: 'ведро', price: 5000, category: 'road' },
        'road_paint_yellow_25': { name: 'Краска дорожная жёлтая (25кг)', unit: 'ведро', price: 5500, category: 'road' },
        'road_thermoplast_25': { name: 'Термопластик дорожный (25кг)', unit: 'мешок', price: 8000, category: 'road' },

        // Ограждения дорожные
        'road_barrier_w_beam_4m': { name: 'Барьерное ограждение W-балка (4м)', unit: 'шт', price: 3500, category: 'road' },
        'road_bollard_steel': { name: 'Столбик ограничительный (стальной)', unit: 'шт', price: 2000, category: 'road' },
        'road_bollard_plastic': { name: 'Столбик сигнальный (гибкий)', unit: 'шт', price: 500, category: 'road' },
        'road_speed_bump_50': { name: 'Лежачий полицейский (секция 50см)', unit: 'шт', price: 2500, category: 'road' },
        'road_cone': { name: 'Конус дорожный 750мм', unit: 'шт', price: 500, category: 'road' },

        // Георешётка
        'geogrid_50mm': { name: 'Георешётка 50мм (м²)', unit: 'м²', price: 200, category: 'road' },
        'geogrid_100mm': { name: 'Георешётка 100мм (м²)', unit: 'м²', price: 350, category: 'road' },
        'geogrid_150mm': { name: 'Георешётка 150мм (м²)', unit: 'м²', price: 500, category: 'road' },
        'geogrid_biaxial': { name: 'Геосетка двуосная (м²)', unit: 'м²', price: 120, category: 'road' }
    };
})();
