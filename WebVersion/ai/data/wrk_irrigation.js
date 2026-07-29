// === ИРРИГАЦИЯ / ПОЛИВ — автополив, капельный, дождевание, управление (48 поз.) ===
(function () {
    window.AI_WRK_IRRIGATION = {
        // === СПРИНКЛЕРНЫЙ ПОЛИВ === 1-10
        'wrk_irr_rotor_sm': { name: 'Ротор (до 10м)', unit: 'шт', price: 1200, category: 'irrigation' },
        'wrk_irr_rotor_md': { name: 'Ротор (до 15м)', unit: 'шт', price: 1500, category: 'irrigation' },
        'wrk_irr_rotor_lg': { name: 'Ротор (до 20м)', unit: 'шт', price: 2500, category: 'irrigation' },
        'wrk_irr_spray_90': { name: 'Спрей (90°)', unit: 'шт', price: 550, category: 'irrigation' },
        'wrk_irr_spray_180': { name: 'Спрей (180°)', unit: 'шт', price: 550, category: 'irrigation' },
        'wrk_irr_spray_360': { name: 'Спрей (360°)', unit: 'шт', price: 550, category: 'irrigation' },
        'wrk_irr_mp_rotor': { name: 'MP-ротатор', unit: 'шт', price: 850, category: 'irrigation' },
        'wrk_irr_popup_body': { name: 'Корпус выдвижного спринклера', unit: 'шт', price: 350, category: 'irrigation' },
        'wrk_irr_valve_24v': { name: 'Электромагнитный клапан 24В', unit: 'шт', price: 2500, category: 'irrigation' },
        'wrk_irr_valve_9v': { name: 'Электромагнитный клапан 9В (автоном.)', unit: 'шт', price: 3500, category: 'irrigation' },
        // === КАПЕЛЬНЫЙ ПОЛИВ === 11-18
        'wrk_irr_drip_tape_16': { name: 'Капельная лента 16мм', unit: 'м.п.', price: 12, category: 'irrigation' },
        'wrk_irr_drip_tube_16': { name: 'Капельная трубка 16мм', unit: 'м.п.', price: 25, category: 'irrigation' },
        'wrk_irr_drip_emitter': { name: 'Капельница компенсированная', unit: 'шт', price: 15, category: 'irrigation' },
        'wrk_irr_drip_microjet': { name: 'Микроразбрызгиватель', unit: 'шт', price: 35, category: 'irrigation' },
        'wrk_irr_drip_filter': { name: 'Фильтр капельного полива', unit: 'шт', price: 1500, category: 'irrigation' },
        'wrk_irr_drip_pressure_reg': { name: 'Регулятор давления', unit: 'шт', price: 850, category: 'irrigation' },
        'wrk_irr_drip_manifold': { name: 'Распределительный коллектор', unit: 'шт', price: 2500, category: 'irrigation' },
        'wrk_irr_drip_fertigation': { name: 'Узел фертигации (удобрение)', unit: 'компл.', price: 25000, category: 'irrigation' },
        // === ТРУБОПРОВОДЫ === 19-26
        'wrk_irr_pipe_pnd_25': { name: 'Труба ПНД Ø25', unit: 'м.п.', price: 35, category: 'irrigation' },
        'wrk_irr_pipe_pnd_32': { name: 'Труба ПНД Ø32', unit: 'м.п.', price: 55, category: 'irrigation' },
        'wrk_irr_pipe_pnd_40': { name: 'Труба ПНД Ø40', unit: 'м.п.', price: 85, category: 'irrigation' },
        'wrk_irr_pipe_pnd_50': { name: 'Труба ПНД Ø50', unit: 'м.п.', price: 120, category: 'irrigation' },
        'wrk_irr_pipe_pnd_63': { name: 'Труба ПНД Ø63', unit: 'м.п.', price: 150, category: 'irrigation' },
        'wrk_irr_trench': { name: 'Траншея под полив', unit: 'м.п.', price: 250, category: 'irrigation' },
        'wrk_irr_fitting_comp': { name: 'Компрессионный фитинг', unit: 'шт', price: 120, category: 'irrigation' },
        'wrk_irr_valve_box': { name: 'Клапанный бокс (колодец)', unit: 'шт', price: 550, category: 'irrigation' },
        // === УПРАВЛЕНИЕ === 27-34
        'wrk_irr_controller_4': { name: 'Контроллер полива (4 зоны)', unit: 'шт', price: 5500, category: 'irrigation' },
        'wrk_irr_controller_8': { name: 'Контроллер полива (8 зон)', unit: 'шт', price: 8500, category: 'irrigation' },
        'wrk_irr_controller_12': { name: 'Контроллер полива (12 зон)', unit: 'шт', price: 12000, category: 'irrigation' },
        'wrk_irr_controller_wifi': { name: 'Контроллер Wi-Fi (смартфон)', unit: 'шт', price: 15000, category: 'irrigation' },
        'wrk_irr_flow_sensor': { name: 'Датчик потока (утечки)', unit: 'шт', price: 3500, category: 'irrigation' },
        'wrk_irr_weather_station': { name: 'Метеостанция (автополив)', unit: 'шт', price: 8500, category: 'irrigation' },
        // === НАСОСНОЕ === 35-40
        'wrk_irr_pump_surface': { name: 'Насос поверхностный (полив)', unit: 'шт', price: 8500, category: 'irrigation' },
        'wrk_irr_pump_well': { name: 'Скважинный насос (полив)', unit: 'шт', price: 25000, category: 'irrigation' },
        'wrk_irr_pump_station': { name: 'Насосная станция (авто)', unit: 'компл.', price: 35000, category: 'irrigation' },
        'wrk_irr_tank_1000': { name: 'Накопительная ёмкость 1м³', unit: 'шт', price: 12000, category: 'irrigation' },
        'wrk_irr_tank_5000': { name: 'Накопительная ёмкость 5м³', unit: 'шт', price: 35000, category: 'irrigation' },
        'wrk_irr_rainwater': { name: 'Система сбора дождевой воды', unit: 'компл.', price: 55000, category: 'irrigation' },
        // === ДОПЫ === 41-48
        'wrk_irr_turf_sprinkler': { name: 'Полив газона (зона до 100м²)', unit: 'зона', price: 8500, category: 'irrigation' },
        'wrk_irr_bed_drip': { name: 'Капельный полив грядок (100м²)', unit: 'компл.', price: 5500, category: 'irrigation' },
        'wrk_irr_tree_bubbler': { name: 'Полив деревьев (баблер)', unit: 'дерево', price: 850, category: 'irrigation' },
        'wrk_irr_hedge_drip': { name: 'Полив живой изгороди', unit: 'м.п.', price: 120, category: 'irrigation' },
        'wrk_irr_winterize': { name: 'Консервация системы (продувка)', unit: 'компл.', price: 5500, category: 'irrigation' },
        'wrk_irr_startup': { name: 'Расконсервация (весенний запуск)', unit: 'компл.', price: 3500, category: 'irrigation' },
        'wrk_irr_commissioning': { name: 'ПНР системы автополива', unit: 'компл.', price: 8500, category: 'irrigation' }
    };
})();
