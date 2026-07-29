// === ПОЛЫ ПРОМЫШЛЕННЫЕ И НАЛИВНЫЕ, СТЯЖКИ, ТОППИНГ, ЭПОКСИД, ПОЛИМОЧЕВИНА (300 поз.) ===
(function () {
    window.AI_WRK_INDFLOOR = {
        // === СТЯЖКИ ===
        'wrk_if_screed_wet_30': { name: 'Стяжка цементно-песчаная 30мм', unit: 'м²', price: 450, category: 'indfloor' },
        'wrk_if_screed_wet_50': { name: 'Стяжка цементно-песчаная 50мм', unit: 'м²', price: 650, category: 'indfloor' },
        'wrk_if_screed_wet_80': { name: 'Стяжка цементно-песчаная 80мм', unit: 'м²', price: 950, category: 'indfloor' },
        'wrk_if_screed_wet_100': { name: 'Стяжка цементно-песчаная 100мм', unit: 'м²', price: 1200, category: 'indfloor' },
        'wrk_if_screed_wet_120': { name: 'Стяжка цементно-песчаная 120мм', unit: 'м²', price: 1450, category: 'indfloor' },
        'wrk_if_screed_wet_150': { name: 'Стяжка цементно-песчаная 150мм', unit: 'м²', price: 1800, category: 'indfloor' },
        'wrk_if_screed_semi_dry_120': { name: 'Полусухая стяжка 120мм', unit: 'м²', price: 1250, category: 'indfloor' },
        'wrk_if_screed_dry_gvl': { name: 'Сухая стяжка (ГВЛ + керамзит)', unit: 'м²', price: 850, category: 'indfloor' },
        'wrk_if_screed_leveling_3': { name: 'Наливной пол (самовыравн.) 3мм', unit: 'м²', price: 350, category: 'indfloor' },
        'wrk_if_screed_leveling_5': { name: 'Наливной пол (самовыравн.) 5мм', unit: 'м²', price: 500, category: 'indfloor' },
        'wrk_if_screed_leveling_10': { name: 'Наливной пол (самовыравн.) 10мм', unit: 'м²', price: 850, category: 'indfloor' },
        'wrk_if_screed_leveling_20': { name: 'Наливной пол (самовыравн.) 20мм', unit: 'м²', price: 1500, category: 'indfloor' },
        'wrk_if_screed_reinforced': { name: 'Армирование стяжки сеткой 4Вр1', unit: 'м²', price: 250, category: 'indfloor' },
        'wrk_if_screed_film_pe': { name: 'Укладка плёнки ПЭ под стяжку', unit: 'м²', price: 50, category: 'indfloor' },
        'wrk_if_screed_tape': { name: 'Монтаж демпферной ленты', unit: 'м.п.', price: 50, category: 'indfloor' },
        // === ПРОМЫШЛЕННЫЕ ПОЛЫ ===
        'wrk_if_slab_150_bf_20': { name: 'Бетонный пол 150мм с топпингом (Bf20)', unit: 'м²', price: 2500, category: 'indfloor' },
        'wrk_if_slab_200_bf_30': { name: 'Бетонный пол 200мм с топпингом (Bf30)', unit: 'м²', price: 3500, category: 'indfloor' },
        'wrk_if_slab_250_bf_40': { name: 'Бетонный пол 250мм с топпингом (Bf40)', unit: 'м²', price: 4500, category: 'indfloor' },
        'wrk_if_slab_300_bf_50': { name: 'Бетонный пол 300мм с топпингом (Bf50)', unit: 'м²', price: 5500, category: 'indfloor' },
        'wrk_if_topping_3kg': { name: 'Топпинг (упрочнитель) 3кг/м²', unit: 'м²', price: 350, category: 'indfloor' },
        'wrk_if_topping_5kg': { name: 'Топпинг (упрочнитель) 5кг/м²', unit: 'м²', price: 550, category: 'indfloor' },
        'wrk_if_topping_7kg': { name: 'Топпинг (упрочнитель) 7кг/м²', unit: 'м²', price: 750, category: 'indfloor' },
        'wrk_if_joint_fill': { name: 'Заполнение швов герметиком', unit: 'м.п.', price: 250, category: 'indfloor' },
        'wrk_if_joint_fill_pu': { name: 'Заполнение швов полиуретановым герметиком', unit: 'м.п.', price: 350, category: 'indfloor' },
        'wrk_if_polishing_1pass': { name: 'Шлифовка бетонного пола (1 проход)', unit: 'м²', price: 350, category: 'indfloor' },
        'wrk_if_polishing_multi': { name: 'Полировка бетонного пола (многопроходная)', unit: 'м²', price: 1200, category: 'indfloor' },
        'wrk_if_diamond_grind': { name: 'Алмазная шлифовка бетона', unit: 'м²', price: 550, category: 'indfloor' },
        'wrk_if_cure_compound': { name: 'Нанесение кюринга (уход за бетоном)', unit: 'м²', price: 80, category: 'indfloor' },
        // === ПОЛИМЕРНЫЕ ПОЛЫ ===
        'wrk_if_epoxy_thin': { name: 'Эпоксидное покрытие (тонкослойное 0.3мм)', unit: 'м²', price: 550, category: 'indfloor' },
        'wrk_if_epoxy_self_1': { name: 'Эпоксидный наливной пол 1мм', unit: 'м²', price: 1200, category: 'indfloor' },
        'wrk_if_epoxy_self_2': { name: 'Эпоксидный наливной пол 2мм', unit: 'м²', price: 1800, category: 'indfloor' },
        'wrk_if_epoxy_self_3': { name: 'Эпоксидный наливной пол 3мм', unit: 'м²', price: 2500, category: 'indfloor' },
        'wrk_if_epoxy_self_5': { name: 'Эпоксидный наливной пол 5мм', unit: 'м²', price: 3500, category: 'indfloor' },
        'wrk_if_epoxy_quartz': { name: 'Кварцнаполненный эпоксидный пол', unit: 'м²', price: 2500, category: 'indfloor' },
        'wrk_if_pu_self_2': { name: 'Полиуретановый наливной пол 2мм', unit: 'м²', price: 2200, category: 'indfloor' },
        'wrk_if_pu_self_4': { name: 'Полиуретановый наливной пол 4мм', unit: 'м²', price: 3500, category: 'indfloor' },
        'wrk_if_pu_elastic': { name: 'Полиуретановый эластичный пол', unit: 'м²', price: 3000, category: 'indfloor' },
        'wrk_if_polyurea_coating': { name: 'Покрытие полимочевиной', unit: 'м²', price: 3500, category: 'indfloor' },
        'wrk_if_epoxy_primer': { name: 'Эпоксидная грунтовка пола', unit: 'м²', price: 350, category: 'indfloor' },
        'wrk_if_pu_primer': { name: 'Полиуретановая грунтовка пола', unit: 'м²', price: 350, category: 'indfloor' },
        // === ДЕКОРАТИВНЫЕ ПОЛЫ ===
        'wrk_if_3d_floor': { name: 'Устройство 3D пола', unit: 'м²', price: 5500, category: 'indfloor' },
        'wrk_if_flake_floor': { name: 'Чипсовый (флоковый) пол', unit: 'м²', price: 2500, category: 'indfloor' },
        'wrk_if_terrazzo_poly': { name: 'Полимерный терраццо', unit: 'м²', price: 5500, category: 'indfloor' },
        'wrk_if_terrazzo_cement': { name: 'Цементный терраццо', unit: 'м²', price: 3500, category: 'indfloor' },
        'wrk_if_exposed_aggregate': { name: 'Мытый бетон', unit: 'м²', price: 2000, category: 'indfloor' },
        // === ПОДГОТОВКА ОСНОВАНИЯ ===
        'wrk_if_shotblast': { name: 'Дробеструйная обработка пола', unit: 'м²', price: 450, category: 'indfloor' },
        'wrk_if_scarify': { name: 'Фрезерование бетонного пола', unit: 'м²', price: 650, category: 'indfloor' },
        'wrk_if_crack_repair': { name: 'Ремонт трещин в бетонном полу', unit: 'м.п.', price: 550, category: 'indfloor' },
        'wrk_if_hole_repair': { name: 'Ремонт сколов/каверн в бетонном полу', unit: 'м²', price: 1200, category: 'indfloor' }
    };
})();
