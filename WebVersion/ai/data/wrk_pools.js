// === БАССЕЙНЫ И АКВАПАРКИ — чаши, оборудование, водоподготовка, отделка (50 поз.) ===
(function () {
    window.AI_WRK_POOLS = {
        // === ЧАША БАССЕЙНА === 1-10
        'wrk_pool_excavation': { name: 'Выемка котлована бассейна', unit: 'м³', price: 650, category: 'pools' },
        'wrk_pool_slab_bottom': { name: 'Устройство ж/б дна бассейна', unit: 'м²', price: 5500, category: 'pools' },
        'wrk_pool_wall_rc': { name: 'Устройство ж/б стены бассейна', unit: 'м²', price: 8500, category: 'pools' },
        'wrk_pool_waterproof_inner': { name: 'Внутренняя гидроизоляция чаши', unit: 'м²', price: 850, category: 'pools' },
        'wrk_pool_waterproof_outer': { name: 'Наружная гидроизоляция чаши', unit: 'м²', price: 550, category: 'pools' },
        'wrk_pool_tile_ceramic': { name: 'Облицовка бассейна керамикой', unit: 'м²', price: 3500, category: 'pools' },
        'wrk_pool_pvс_membrane': { name: 'ПВХ мембрана бассейна', unit: 'м²', price: 1500, category: 'pools' },
        'wrk_pool_overflow_gutter': { name: 'Устройство переливного лотка', unit: 'м.п.', price: 3500, category: 'pools' },
        'wrk_pool_skimmer_niche': { name: 'Устройство ниши скиммера', unit: 'шт', price: 5500, category: 'pools' },
        // === ОБОРУДОВАНИЕ === 11-25
        'wrk_pool_filter_sand_sm': { name: 'Монтаж фильтра песочного (до 25м³/ч)', unit: 'шт', price: 15000, category: 'pools' },
        'wrk_pool_filter_sand_md': { name: 'Монтаж фильтра песочного (до 50м³/ч)', unit: 'шт', price: 35000, category: 'pools' },
        'wrk_pool_filter_sand_lg': { name: 'Монтаж фильтра песочного (до 100м³/ч)', unit: 'шт', price: 55000, category: 'pools' },
        'wrk_pool_pump_circ_sm': { name: 'Монтаж циркуляционного насоса (до 25м³/ч)', unit: 'шт', price: 12000, category: 'pools' },
        'wrk_pool_pump_circ_md': { name: 'Монтаж циркуляционного насоса (до 50м³/ч)', unit: 'шт', price: 25000, category: 'pools' },
        'wrk_pool_pump_circ_lg': { name: 'Монтаж циркуляционного насоса (до 100м³/ч)', unit: 'шт', price: 55000, category: 'pools' },
        'wrk_pool_heater_electric': { name: 'Монтаж электронагревателя бассейна', unit: 'шт', price: 8500, category: 'pools' },
        'wrk_pool_heater_heatx': { name: 'Монтаж теплообменника бассейна', unit: 'шт', price: 15000, category: 'pools' },
        'wrk_pool_heat_pump': { name: 'Монтаж теплового насоса бассейна', unit: 'шт', price: 55000, category: 'pools' },
        'wrk_pool_dehumidifier': { name: 'Монтаж осушителя воздуха бассейна', unit: 'шт', price: 55000, category: 'pools' },
        'wrk_pool_dosing_cl': { name: 'Монтаж станции дозирования (хлор)', unit: 'шт', price: 55000, category: 'pools' },
        'wrk_pool_dosing_ph': { name: 'Монтаж станции контроля pH', unit: 'шт', price: 25000, category: 'pools' },
        'wrk_pool_uv_system': { name: 'Монтаж УФ-установки бассейна', unit: 'шт', price: 35000, category: 'pools' },
        'wrk_pool_ozone': { name: 'Монтаж озонатора бассейна', unit: 'шт', price: 85000, category: 'pools' },
        'wrk_pool_counterflow': { name: 'Монтаж противотока', unit: 'шт', price: 55000, category: 'pools' },
        // === ТРУБОПРОВОДЫ БАССЕЙНА === 26-30
        'wrk_pool_pipe_50': { name: 'Трубопровод бассейна Ø50', unit: 'м.п.', price: 550, category: 'pools' },
        'wrk_pool_pipe_63': { name: 'Трубопровод бассейна Ø63', unit: 'м.п.', price: 650, category: 'pools' },
        'wrk_pool_pipe_90': { name: 'Трубопровод бассейна Ø90', unit: 'м.п.', price: 850, category: 'pools' },
        'wrk_pool_pipe_110': { name: 'Трубопровод бассейна Ø110', unit: 'м.п.', price: 1050, category: 'pools' },
        'wrk_pool_pipe_160': { name: 'Трубопровод бассейна Ø160', unit: 'м.п.', price: 1500, category: 'pools' },
        // === ЗАКЛАДНЫЕ ЭЛЕМЕНТЫ === 31-38
        'wrk_pool_inlet': { name: 'Монтаж форсунки подачи воды', unit: 'шт', price: 1500, category: 'pools' },
        'wrk_pool_drain_main': { name: 'Монтаж донного слива', unit: 'шт', price: 3500, category: 'pools' },
        'wrk_pool_light_led': { name: 'Монтаж подводного LED прожектора', unit: 'шт', price: 8500, category: 'pools' },
        'wrk_pool_ladder': { name: 'Монтаж лестницы бассейна', unit: 'шт', price: 5500, category: 'pools' },
        'wrk_pool_overflow_grate': { name: 'Монтаж переливной решётки', unit: 'м.п.', price: 1500, category: 'pools' },
        'wrk_pool_cover_auto': { name: 'Автоматическое покрытие бассейна', unit: 'м²', price: 8500, category: 'pools' },
        'wrk_pool_cover_bubble': { name: 'Пузырьковое покрытие бассейна', unit: 'м²', price: 550, category: 'pools' },
        // === ОБХОДНАЯ ДОРОЖКА === 39-42
        'wrk_pool_deck_tile': { name: 'Обходная дорожка (керамогранит)', unit: 'м²', price: 3500, category: 'pools' },
        'wrk_pool_deck_stone': { name: 'Обходная дорожка (натуральный камень)', unit: 'м²', price: 5500, category: 'pools' },
        'wrk_pool_deck_wpc': { name: 'Обходная дорожка (ДПК)', unit: 'м²', price: 2500, category: 'pools' },
        'wrk_pool_deck_drain': { name: 'Душевой трап (обходная)', unit: 'шт', price: 3500, category: 'pools' },
        // === АКВАПАРК === 43-48
        'wrk_pool_slide_small': { name: 'Монтаж детской горки', unit: 'шт', price: 550000, category: 'pools' },
        'wrk_pool_slide_medium': { name: 'Монтаж горки средней', unit: 'шт', price: 2500000, category: 'pools' },
        'wrk_pool_slide_large': { name: 'Монтаж горки высотной', unit: 'шт', price: 5500000, category: 'pools' },
        'wrk_pool_wave_machine': { name: 'Монтаж волнообразователя', unit: 'компл.', price: 8500000, category: 'pools' },
        'wrk_pool_lazy_river': { name: 'Устройство ленивой реки', unit: 'м.п.', price: 250000, category: 'pools' },
        'wrk_pool_jacuzzi': { name: 'Монтаж джакузи', unit: 'шт', price: 350000, category: 'pools' }
    };
})();
