// === КАТАЛОГ СЫПУЧИХ МАТЕРИАЛОВ И ТОВАРНОГО БЕТОНА (45 позиций) ===
(function () {
    window.AI_MAT_BULKMATERIALS_CATALOG = {
        // Песок
        'sand_river_m3': { name: 'Песок речной (м³)', unit: 'м³', price: 800, category: 'bulk' },
        'sand_career_m3': { name: 'Песок карьерный (м³)', unit: 'м³', price: 500, category: 'bulk' },
        'sand_washed_m3': { name: 'Песок мытый (м³)', unit: 'м³', price: 1000, category: 'bulk' },
        'sand_50kg': { name: 'Песок фасованный (50кг)', unit: 'мешок', price: 100, category: 'bulk' },
        // Щебень
        'gravel_5_20_m3': { name: 'Щебень фракция 5-20мм (м³)', unit: 'м³', price: 1200, category: 'bulk' },
        'gravel_20_40_m3': { name: 'Щебень фракция 20-40мм (м³)', unit: 'м³', price: 1100, category: 'bulk' },
        'gravel_40_70_m3': { name: 'Щебень фракция 40-70мм (м³)', unit: 'м³', price: 1000, category: 'bulk' },
        'gravel_limestone_m3': { name: 'Щебень известняковый (м³)', unit: 'м³', price: 800, category: 'bulk' },
        'gravel_granite_m3': { name: 'Щебень гранитный 5-20мм (м³)', unit: 'м³', price: 1500, category: 'bulk' },
        'gravel_50kg': { name: 'Щебень фасованный (50кг)', unit: 'мешок', price: 150, category: 'bulk' },
        // Гравий
        'pebble_20_40_m3': { name: 'Гравий 20-40мм (м³)', unit: 'м³', price: 1000, category: 'bulk' },
        'pebble_dec_white_25kg': { name: 'Галька декоративная белая (25кг)', unit: 'мешок', price: 500, category: 'bulk' },
        // Отсев
        'screenings_0_5_m3': { name: 'Отсев гранитный 0-5мм (м³)', unit: 'м³', price: 700, category: 'bulk' },
        // Керамзит
        'keramzit_10_20_m3': { name: 'Керамзит 10-20мм (м³)', unit: 'м³', price: 1500, category: 'bulk' },
        'keramzit_0_5_50l': { name: 'Керамзит 0-5мм (50л)', unit: 'мешок', price: 200, category: 'bulk' },
        'keramzit_10_20_50l': { name: 'Керамзит 10-20мм (50л)', unit: 'мешок', price: 250, category: 'bulk' },
        // Вермикулит / перлит
        'vermiculite_100l': { name: 'Вермикулит (100л)', unit: 'мешок', price: 500, category: 'bulk' },
        'perlite_100l': { name: 'Перлит (100л)', unit: 'мешок', price: 400, category: 'bulk' },
        // Товарный бетон — доставка миксером
        'concrete_b15_m3': { name: 'Бетон B15 (М200) товарный (м³)', unit: 'м³', price: 4000, category: 'bulk' },
        'concrete_b20_m3': { name: 'Бетон B20 (М250) товарный (м³)', unit: 'м³', price: 4500, category: 'bulk' },
        'concrete_b25_m3': { name: 'Бетон B25 (М350) товарный (м³)', unit: 'м³', price: 5000, category: 'bulk' },
        'concrete_b30_m3': { name: 'Бетон B30 (М400) товарный (м³)', unit: 'м³', price: 5500, category: 'bulk' },
        'concrete_b7_5_m3': { name: 'Бетон B7.5 (М100) товарный (м³)', unit: 'м³', price: 3000, category: 'bulk' },
        'concrete_pump_service': { name: 'Бетононасос (услуга подачи, час)', unit: 'час', price: 5000, category: 'bulk' },
        // Раствор товарный
        'mortar_m100_m3': { name: 'Раствор М100 (м³)', unit: 'м³', price: 3500, category: 'bulk' },
        'mortar_m150_m3': { name: 'Раствор М150 (м³)', unit: 'м³', price: 4000, category: 'bulk' },
        'mortar_m200_m3': { name: 'Раствор М200 (м³)', unit: 'м³', price: 4500, category: 'bulk' },
        // Грунт / земля
        'soil_top_m3': { name: 'Грунт плодородный (м³)', unit: 'м³', price: 800, category: 'bulk' },
        'soil_removal_m3': { name: 'Вывоз грунта (м³)', unit: 'м³', price: 500, category: 'bulk' },
        // Известь
        'lime_hydrated_30kg': { name: 'Известь гашёная (30кг)', unit: 'мешок', price: 200, category: 'bulk' },
        'lime_quickite_25kg': { name: 'Известь негашёная (25кг)', unit: 'мешок', price: 150, category: 'bulk' },
        // Глина
        'clay_fire_25kg': { name: 'Глина огнеупорная (25кг)', unit: 'мешок', price: 300, category: 'bulk' },
        'clay_expanded_m3': { name: 'Глина расширенная (м³)', unit: 'м³', price: 1000, category: 'bulk' },
        // Гипс строительный
        'gypsum_build_30kg': { name: 'Гипс строительный (30кг)', unit: 'мешок', price: 200, category: 'bulk' },
        'gypsum_high_30kg': { name: 'Гипс высокопрочный Г-16 (30кг)', unit: 'мешок', price: 400, category: 'bulk' },
        // Добавки в бетон
        'additive_plasticizer_5l': { name: 'Пластификатор C-3 (5л)', unit: 'шт', price: 200, category: 'bulk' },
        'additive_plasticizer_10l': { name: 'Пластификатор C-3 (10л)', unit: 'шт', price: 350, category: 'bulk' },
        'additive_antifreeze_10l': { name: 'Противоморозная добавка (10л)', unit: 'шт', price: 300, category: 'bulk' },
        'additive_fiber_pp_0_9kg': { name: 'Фибра полипроп. для бетона (0.9кг)', unit: 'пакет', price: 100, category: 'bulk' },
        'additive_accelerator_5l': { name: 'Ускоритель схватывания (5л)', unit: 'шт', price: 300, category: 'bulk' },
        'additive_waterproof_10l': { name: 'Гидрофобизатор (10л)', unit: 'шт', price: 500, category: 'bulk' }
    };
})();
