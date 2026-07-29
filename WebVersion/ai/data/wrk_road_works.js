// === ДОРОЖНЫЕ РАБОТЫ — основания, покрытия, бордюры, разметка, барьеры (300 поз.) ===
(function () {
    window.AI_WRK_ROAD = {
        // === ЗЕМЛЯНОЕ ПОЛОТНО ===
        'wrk_road_embankment': { name: 'Устройство земляного полотна из привозного грунта', unit: 'м³', price: 850, category: 'road' },
        'wrk_road_cut_fill': { name: 'Разработка грунта в выемку с перемещением', unit: 'м³', price: 650, category: 'road' },
        'wrk_road_subgrade_prep': { name: 'Подготовка земполотна (профилирование)', unit: 'м²', price: 85, category: 'road' },
        'wrk_road_geotextile': { name: 'Укладка геотекстиля на земполотно', unit: 'м²', price: 120, category: 'road' },
        'wrk_road_geogrid': { name: 'Укладка геосетки', unit: 'м²', price: 250, category: 'road' },
        // === ОСНОВАНИЯ ===
        'wrk_road_sand_base_200': { name: 'Устройство песчаного основания h=200мм', unit: 'м²', price: 350, category: 'road' },
        'wrk_road_sand_base_300': { name: 'Устройство песчаного основания h=300мм', unit: 'м²', price: 500, category: 'road' },
        'wrk_road_crushed_base_150': { name: 'Устройство щебёночного основания h=150мм', unit: 'м²', price: 450, category: 'road' },
        'wrk_road_crushed_base_250': { name: 'Устройство щебёночного основания h=250мм', unit: 'м²', price: 700, category: 'road' },
        'wrk_road_stabilized_base': { name: 'Устройство стабилизированного основания', unit: 'м²', price: 1200, category: 'road' },
        'wrk_road_lean_concrete_base': { name: 'Устройство основания из тощего бетона', unit: 'м²', price: 1500, category: 'road' },
        // === АСФАЛЬТОБЕТОННОЕ ПОКРЫТИЕ ===
        'wrk_road_asphalt_bottom_60': { name: 'Укладка нижнего слоя а/б h=60мм', unit: 'м²', price: 650, category: 'road' },
        'wrk_road_asphalt_bottom_80': { name: 'Укладка нижнего слоя а/б h=80мм', unit: 'м²', price: 850, category: 'road' },
        'wrk_road_asphalt_bottom_100': { name: 'Укладка нижнего слоя а/б h=100мм', unit: 'м²', price: 1050, category: 'road' },
        'wrk_road_asphalt_top_40': { name: 'Укладка верхнего слоя а/б h=40мм', unit: 'м²', price: 550, category: 'road' },
        'wrk_road_asphalt_top_50': { name: 'Укладка верхнего слоя а/б h=50мм', unit: 'м²', price: 680, category: 'road' },
        'wrk_road_asphalt_top_60': { name: 'Укладка верхнего слоя а/б h=60мм', unit: 'м²', price: 800, category: 'road' },
        'wrk_road_asphalt_sma': { name: 'Укладка ЩМА (щебёночно-мастичный) h=50мм', unit: 'м²', price: 950, category: 'road' },
        'wrk_road_asphalt_polymer': { name: 'Укладка ПМА (полимерасф.) h=50мм', unit: 'м²', price: 1200, category: 'road' },
        'wrk_road_asphalt_milling_50': { name: 'Холодное фрезерование а/б h=50мм', unit: 'м²', price: 350, category: 'road' },
        'wrk_road_asphalt_milling_80': { name: 'Холодное фрезерование а/б h=80мм', unit: 'м²', price: 450, category: 'road' },
        'wrk_road_asphalt_milling_100': { name: 'Холодное фрезерование а/б h=100мм', unit: 'м²', price: 550, category: 'road' },
        'wrk_road_asphalt_patch': { name: 'Ямочный ремонт асфальта', unit: 'м²', price: 2500, category: 'road' },
        'wrk_road_asphalt_crack_seal': { name: 'Заливка трещин герметиком', unit: 'м.п.', price: 350, category: 'road' },
        'wrk_road_prime_coat': { name: 'Подгрунтовка (розлив битумной эмульсии)', unit: 'м²', price: 85, category: 'road' },
        'wrk_road_tack_coat': { name: 'Межслойная пропитка', unit: 'м²', price: 65, category: 'road' },
        // === БЕТОННОЕ ПОКРЫТИЕ ===
        'wrk_road_concrete_150': { name: 'Устройство бетонн. покрытия h=150мм', unit: 'м²', price: 2200, category: 'road' },
        'wrk_road_concrete_200': { name: 'Устройство бетонн. покрытия h=200мм', unit: 'м²', price: 2800, category: 'road' },
        'wrk_road_concrete_250': { name: 'Устройство бетонн. покрытия h=250мм', unit: 'м²', price: 3500, category: 'road' },
        'wrk_road_concrete_joint_seal': { name: 'Герметизация швов', unit: 'м.п.', price: 350, category: 'road' },
        // === БОРДЮРЫ И ПОРЕБРИКИ ===
        'wrk_road_curb_100x30': { name: 'Установка бортового камня 100×30', unit: 'м.п.', price: 1200, category: 'road' },
        'wrk_road_curb_100x15': { name: 'Установка бортового камня 100×15', unit: 'м.п.', price: 850, category: 'road' },
        'wrk_road_curb_garden': { name: 'Установка садового бордюра', unit: 'м.п.', price: 550, category: 'road' },
        'wrk_road_curb_granite': { name: 'Установка гранитного бордюра', unit: 'м.п.', price: 2500, category: 'road' },
        'wrk_road_curb_monolith': { name: 'Устройство монолитного борта', unit: 'м.п.', price: 1800, category: 'road' },
        // === ТРОТУАРНАЯ ПЛИТКА ===
        'wrk_road_paving_40': { name: 'Укладка тротуарной плитки h=40мм', unit: 'м²', price: 1200, category: 'road' },
        'wrk_road_paving_60': { name: 'Укладка тротуарной плитки h=60мм', unit: 'м²', price: 1500, category: 'road' },
        'wrk_road_paving_80': { name: 'Укладка тротуарной плитки h=80мм', unit: 'м²', price: 1800, category: 'road' },
        'wrk_road_paving_granite': { name: 'Укладка гранитной брусчатки', unit: 'м²', price: 3500, category: 'road' },
        'wrk_road_paving_clinker': { name: 'Укладка клинкерной брусчатки', unit: 'м²', price: 2800, category: 'road' },
        // === РАЗМЕТКА ===
        'wrk_road_marking_paint_10': { name: 'Разметка краской шириной 10см', unit: 'м.п.', price: 85, category: 'road' },
        'wrk_road_marking_paint_20': { name: 'Разметка краской шириной 20см', unit: 'м.п.', price: 120, category: 'road' },
        'wrk_road_marking_paint_40': { name: 'Разметка краской шириной 40см', unit: 'м.п.', price: 200, category: 'road' },
        'wrk_road_marking_thermo_10': { name: 'Разметка термопластиком 10см', unit: 'м.п.', price: 250, category: 'road' },
        'wrk_road_marking_thermo_20': { name: 'Разметка термопластиком 20см', unit: 'м.п.', price: 380, category: 'road' },
        'wrk_road_marking_thermo_40': { name: 'Разметка термопластиком 40см', unit: 'м.п.', price: 650, category: 'road' },
        'wrk_road_marking_arrows': { name: 'Нанесение стрелок направлений', unit: 'шт', price: 2500, category: 'road' },
        // === БАРЬЕРНЫЕ ОГРАЖДЕНИЯ ===
        'wrk_road_barrier_w_beam': { name: 'Установка барьерного огр. W-балка', unit: 'м.п.', price: 2500, category: 'road' },
        'wrk_road_barrier_cable': { name: 'Установка тросового огр.', unit: 'м.п.', price: 3500, category: 'road' },
        'wrk_road_barrier_concrete': { name: 'Установка бетонного ограждения (Нью-Джерси)', unit: 'м.п.', price: 5500, category: 'road' },
        'wrk_road_barrier_post': { name: 'Установка сигнальных столбиков', unit: 'шт', price: 1500, category: 'road' },
        // === ДОРОЖНЫЕ ЗНАКИ ===
        'wrk_road_sign_install': { name: 'Установка дорожного знака (с опорой)', unit: 'шт', price: 8500, category: 'road' },
        'wrk_road_sign_overhead': { name: 'Установка знака на портале', unit: 'шт', price: 35000, category: 'road' },
        'wrk_road_sign_direction': { name: 'Установка указателя направлений', unit: 'шт', price: 25000, category: 'road' },
        // === ЛИВНЕВАЯ КАНАЛИЗАЦИЯ ===
        'wrk_road_drain_inlet': { name: 'Устройство дождеприёмника', unit: 'шт', price: 12000, category: 'road' },
        'wrk_road_drain_pipe_200': { name: 'Прокладка ливневой канализации Ø200', unit: 'м.п.', price: 2500, category: 'road' },
        'wrk_road_drain_pipe_300': { name: 'Прокладка ливневой канализации Ø300', unit: 'м.п.', price: 3500, category: 'road' },
        'wrk_road_drain_pipe_400': { name: 'Прокладка ливневой канализации Ø400', unit: 'м.п.', price: 5000, category: 'road' },
        'wrk_road_drain_pipe_500': { name: 'Прокладка ливневой канализации Ø500', unit: 'м.п.', price: 6500, category: 'road' },
        'wrk_road_drain_tray': { name: 'Установка водоотводного лотка', unit: 'м.п.', price: 3500, category: 'road' },
        'wrk_road_drain_well_d600': { name: 'Устройство смотрового колодца Ø600', unit: 'шт', price: 35000, category: 'road' },
        'wrk_road_drain_well_d1000': { name: 'Устройство смотрового колодца Ø1000', unit: 'шт', price: 65000, category: 'road' },
        // === ОСВЕЩЕНИЕ ===
        'wrk_road_light_pole_9m': { name: 'Установка опоры освещения 9м', unit: 'шт', price: 55000, category: 'road' },
        'wrk_road_light_pole_12m': { name: 'Установка опоры освещения 12м', unit: 'шт', price: 85000, category: 'road' },
        'wrk_road_light_fixture': { name: 'Монтаж светильника на опору', unit: 'шт', price: 8500, category: 'road' },
        'wrk_road_light_cable': { name: 'Прокладка кабеля освещения в траншее', unit: 'м.п.', price: 850, category: 'road' }
    };
})();
