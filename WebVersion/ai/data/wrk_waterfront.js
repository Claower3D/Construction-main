// === ПРИЧАЛЫ И БЕРЕГОУКРЕПЛЕНИЕ — набережные, пирсы, волноломы, берегоукрепление (48 поз.) ===
(function () {
    window.AI_WRK_WATERFRONT = {
        // === БЕРЕГОУКРЕПЛЕНИЕ === 1-10
        'wrk_wf_sheet_pile_vl': { name: 'Шпунтовая стенка Ларсена (берег)', unit: 'м²', price: 8500, category: 'waterfront' },
        'wrk_wf_sheet_pile_vinyl': { name: 'Шпунт ПВХ (берег)', unit: 'м²', price: 5500, category: 'waterfront' },
        'wrk_wf_gabion_wall': { name: 'Габионная стенка (берег)', unit: 'м³', price: 3500, category: 'waterfront' },
        'wrk_wf_gabion_mattress': { name: 'Матрац Рено (откос)', unit: 'м²', price: 850, category: 'waterfront' },
        'wrk_wf_riprap': { name: 'Каменная наброска (откос)', unit: 'м³', price: 1500, category: 'waterfront' },
        'wrk_wf_geotube': { name: 'Геотуба (берегоукрепление)', unit: 'м.п.', price: 8500, category: 'waterfront' },
        'wrk_wf_rc_wall': { name: 'Подпорная стенка ж/б (набережная)', unit: 'м³', price: 15000, category: 'waterfront' },
        'wrk_wf_slope_geomat': { name: 'Геомат противоэрозийный (откос)', unit: 'м²', price: 150, category: 'waterfront' },
        'wrk_wf_slope_seed': { name: 'Гидропосев (откос)', unit: 'м²', price: 120, category: 'waterfront' },
        'wrk_wf_slope_geocell': { name: 'Геоячейки (откос)', unit: 'м²', price: 350, category: 'waterfront' },
        // === НАБЕРЕЖНЫЕ === 11-18
        'wrk_wf_promenade_tile': { name: 'Мощение набережной (гранит)', unit: 'м²', price: 3500, category: 'waterfront' },
        'wrk_wf_promenade_deck': { name: 'Террасная доска (набережная)', unit: 'м²', price: 2500, category: 'waterfront' },
        'wrk_wf_railing_ss': { name: 'Перила набережной (нержав.)', unit: 'м.п.', price: 8500, category: 'waterfront' },
        'wrk_wf_railing_cast': { name: 'Перила набережной (литые)', unit: 'м.п.', price: 12000, category: 'waterfront' },
        'wrk_wf_bollard_mooring': { name: 'Швартовная тумба', unit: 'шт', price: 15000, category: 'waterfront' },
        'wrk_wf_fender': { name: 'Отбойное устройство (кранец)', unit: 'шт', price: 8500, category: 'waterfront' },
        'wrk_wf_ladder_water': { name: 'Лестница спуска к воде', unit: 'шт', price: 15000, category: 'waterfront' },
        'wrk_wf_lighting_promenade': { name: 'Освещение набережной', unit: 'опора', price: 25000, category: 'waterfront' },
        // === ПИРСЫ === 19-26
        'wrk_wf_pier_rc': { name: 'Пирс ж/б (стационарный)', unit: 'м²', price: 15000, category: 'waterfront' },
        'wrk_wf_pier_steel': { name: 'Пирс стальной', unit: 'м²', price: 12000, category: 'waterfront' },
        'wrk_wf_pier_wood': { name: 'Пирс деревянный', unit: 'м²', price: 8500, category: 'waterfront' },
        'wrk_wf_pier_floating': { name: 'Понтонный причал (модульный)', unit: 'м²', price: 8500, category: 'waterfront' },
        'wrk_wf_pier_pile_steel': { name: 'Свая стальная (морская)', unit: 'м.п.', price: 8500, category: 'waterfront' },
        'wrk_wf_pier_pile_rc': { name: 'Свая ж/б (морская)', unit: 'м.п.', price: 12000, category: 'waterfront' },
        'wrk_wf_pier_deck': { name: 'Настил пирса (дерево)', unit: 'м²', price: 3500, category: 'waterfront' },
        'wrk_wf_pier_deck_composite': { name: 'Настил пирса (ДПК)', unit: 'м²', price: 3500, category: 'waterfront' },
        // === ДНОУГЛУБЛЕНИЕ / ДРЕНАЖ === 27-32
        'wrk_wf_dredge_mechanical': { name: 'Дноуглубление (механическое)', unit: 'м³', price: 550, category: 'waterfront' },
        'wrk_wf_dredge_hydraulic': { name: 'Дноуглубление (гидравлическое)', unit: 'м³', price: 350, category: 'waterfront' },
        'wrk_wf_channel_cut': { name: 'Устройство канала', unit: 'м³', price: 550, category: 'waterfront' },
        'wrk_wf_dam_earth': { name: 'Земляная дамба', unit: 'м³', price: 250, category: 'waterfront' },
        'wrk_wf_dam_rc': { name: 'Дамба ж/б (малая)', unit: 'м³', price: 12000, category: 'waterfront' },
        'wrk_wf_weir': { name: 'Водосливная плотина (водослив)', unit: 'м.п.', price: 55000, category: 'waterfront' },
        // === МАРИНЫ (для яхт) === 33-40
        'wrk_wf_marina_finger': { name: 'Пальцевый причал (finger pier)', unit: 'место', price: 120000, category: 'waterfront' },
        'wrk_wf_marina_cleat': { name: 'Утка швартовная', unit: 'шт', price: 1500, category: 'waterfront' },
        'wrk_wf_marina_electric': { name: 'Колонка электроснабжения (марина)', unit: 'шт', price: 55000, category: 'waterfront' },
        'wrk_wf_marina_water': { name: 'Колонка водоснабжения (марина)', unit: 'шт', price: 25000, category: 'waterfront' },
        'wrk_wf_marina_fuel': { name: 'Заправочная станция (марина)', unit: 'компл.', price: 2500000, category: 'waterfront' },
        'wrk_wf_marina_pump_out': { name: 'Станция откачки сточных', unit: 'шт', price: 250000, category: 'waterfront' },
        'wrk_wf_marina_crane': { name: 'Кран для яхт (travel lift)', unit: 'шт', price: 5500000, category: 'waterfront' },
        'wrk_wf_marina_slipway': { name: 'Слип для спуска лодок', unit: 'шт', price: 550000, category: 'waterfront' },
        // === ЗАЩИТНЫЕ === 41-46
        'wrk_wf_breakwater': { name: 'Волнолом (бетонные блоки)', unit: 'м.п.', price: 120000, category: 'waterfront' },
        'wrk_wf_groyne': { name: 'Буна (поперечное сооружение)', unit: 'шт', price: 250000, category: 'waterfront' },
        'wrk_wf_seawall': { name: 'Волноотбойная стенка', unit: 'м.п.', price: 55000, category: 'waterfront' },
        'wrk_wf_revetment': { name: 'Каменное покрытие откоса', unit: 'м²', price: 2500, category: 'waterfront' },
        'wrk_wf_nav_buoy': { name: 'Навигационный буй', unit: 'шт', price: 55000, category: 'waterfront' },
        'wrk_wf_nav_light': { name: 'Навигационный огонь', unit: 'шт', price: 25000, category: 'waterfront' },
        // === ДОПЫ === 47-48
        'wrk_wf_survey_bathy': { name: 'Батиметрическая съёмка', unit: 'га', price: 25000, category: 'waterfront' },
        'wrk_wf_environ_assess': { name: 'Экологическая оценка (водный)', unit: 'объект', price: 250000, category: 'waterfront' }
    };
})();
