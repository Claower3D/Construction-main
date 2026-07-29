// === ОЗЕЛЕНЕНИЕ И ИРРИГАЦИЯ ПОЛНАЯ — деревья, газоны, автополив, дренаж, рекультивация ===
(function () {
    window.AI_WRK_GREENERY = {
        // === ПОДГОТОВКА ТЕРРИТОРИИ ===
        'wrk_gr_topsoil_strip': { name: 'Срезка растительного слоя', unit: 'м²', price: 100, category: 'greenery' },
        'wrk_gr_topsoil_import': { name: 'Завоз растительного грунта', unit: 'м³', price: 850, category: 'greenery' },
        'wrk_gr_topsoil_spread': { name: 'Планировка растительного грунта', unit: 'м²', price: 100, category: 'greenery' },
        'wrk_gr_topsoil_plow': { name: 'Вспашка грунта', unit: 'м²', price: 80, category: 'greenery' },
        'wrk_gr_topsoil_grade': { name: 'Чистовая планировка (ручная)', unit: 'м²', price: 120, category: 'greenery' },
        'wrk_gr_soil_test': { name: 'Анализ почвы (комплексный)', unit: 'проба', price: 5500, category: 'greenery' },
        // === ГАЗОНЫ ===
        'wrk_gr_lawn_seed_sport': { name: 'Газон спортивный (посев)', unit: 'м²', price: 350, category: 'greenery' },
        'wrk_gr_lawn_seed_park': { name: 'Газон парковый (посев)', unit: 'м²', price: 200, category: 'greenery' },
        'wrk_gr_lawn_seed_shade': { name: 'Газон теневыносливый (посев)', unit: 'м²', price: 250, category: 'greenery' },
        'wrk_gr_lawn_seed_drought': { name: 'Газон засухоустойчивый (посев)', unit: 'м²', price: 250, category: 'greenery' },
        'wrk_gr_lawn_roll_std': { name: 'Рулонный газон (стандарт)', unit: 'м²', price: 450, category: 'greenery' },
        'wrk_gr_lawn_roll_sport': { name: 'Рулонный газон (спортивный)', unit: 'м²', price: 650, category: 'greenery' },
        'wrk_gr_lawn_roll_premium': { name: 'Рулонный газон (премиум)', unit: 'м²', price: 850, category: 'greenery' },
        'wrk_gr_lawn_hydroseed': { name: 'Гидропосев', unit: 'м²', price: 150, category: 'greenery' },
        'wrk_gr_lawn_repair': { name: 'Ремонт газона (подсев)', unit: 'м²', price: 150, category: 'greenery' },
        // === ДЕРЕВЬЯ ===
        'wrk_gr_tree_leaf_sm': { name: 'Посадка лиственного дерева (h 1-2м)', unit: 'шт', price: 3500, category: 'greenery' },
        'wrk_gr_tree_leaf_md': { name: 'Посадка лиственного дерева (h 2-3м)', unit: 'шт', price: 5500, category: 'greenery' },
        'wrk_gr_tree_leaf_lg': { name: 'Посадка лиственного дерева (h 3-5м)', unit: 'шт', price: 12000, category: 'greenery' },
        'wrk_gr_tree_conifer_sm': { name: 'Посадка хвойного дерева (h 1-2м)', unit: 'шт', price: 5500, category: 'greenery' },
        'wrk_gr_tree_conifer_md': { name: 'Посадка хвойного дерева (h 2-3м)', unit: 'шт', price: 12000, category: 'greenery' },
        'wrk_gr_tree_conifer_lg': { name: 'Посадка хвойного дерева (h 3-5м)', unit: 'шт', price: 25000, category: 'greenery' },
        'wrk_gr_tree_large_6': { name: 'Посадка крупномера (h 5-8м)', unit: 'шт', price: 55000, category: 'greenery' },
        'wrk_gr_tree_large_10': { name: 'Посадка крупномера (h 8-12м)', unit: 'шт', price: 120000, category: 'greenery' },
        'wrk_gr_tree_fruit': { name: 'Посадка плодового дерева', unit: 'шт', price: 3500, category: 'greenery' },
        'wrk_gr_tree_palm': { name: 'Посадка пальмы (декоративная)', unit: 'шт', price: 35000, category: 'greenery' },
        'wrk_gr_tree_staking': { name: 'Установка растяжек/опор для дерева', unit: 'шт', price: 1200, category: 'greenery' },
        // === КУСТАРНИКИ ===
        'wrk_gr_shrub_leaf_sm': { name: 'Посадка лиственного кустарника (h до 0.5м)', unit: 'шт', price: 550, category: 'greenery' },
        'wrk_gr_shrub_leaf_md': { name: 'Посадка лиственного кустарника (h 0.5-1м)', unit: 'шт', price: 1200, category: 'greenery' },
        'wrk_gr_shrub_leaf_lg': { name: 'Посадка лиственного кустарника (h 1-2м)', unit: 'шт', price: 2500, category: 'greenery' },
        'wrk_gr_shrub_conifer': { name: 'Посадка хвойного кустарника', unit: 'шт', price: 3500, category: 'greenery' },
        'wrk_gr_shrub_rose': { name: 'Посадка розы', unit: 'шт', price: 550, category: 'greenery' },
        'wrk_gr_hedge_form': { name: 'Устройство формованной живой изгороди', unit: 'м.п.', price: 2500, category: 'greenery' },
        'wrk_gr_hedge_free': { name: 'Устройство свободнорастущей живой изгороди', unit: 'м.п.', price: 1500, category: 'greenery' },
        // === ЦВЕТНИКИ ===
        'wrk_gr_flower_annual': { name: 'Высадка однолетних цветов', unit: 'м²', price: 850, category: 'greenery' },
        'wrk_gr_flower_perennial': { name: 'Высадка многолетних цветов', unit: 'м²', price: 1500, category: 'greenery' },
        'wrk_gr_flower_bulb': { name: 'Высадка луковичных', unit: 'м²', price: 1200, category: 'greenery' },
        'wrk_gr_flower_alpine': { name: 'Устройство альпийской горки', unit: 'м²', price: 3500, category: 'greenery' },
        'wrk_gr_flower_border_mix': { name: 'Устройство миксбордера', unit: 'м.п.', price: 2500, category: 'greenery' },
        // === АВТОПОЛИВ ===
        'wrk_gr_irrig_head_spray': { name: 'Монтаж спринклера (статический)', unit: 'шт', price: 550, category: 'greenery' },
        'wrk_gr_irrig_head_rotor': { name: 'Монтаж ротора', unit: 'шт', price: 1200, category: 'greenery' },
        'wrk_gr_irrig_drip': { name: 'Монтаж капельного полива', unit: 'м.п.', price: 150, category: 'greenery' },
        'wrk_gr_irrig_pipe_25': { name: 'Прокладка трубы автополива Ø25', unit: 'м.п.', price: 150, category: 'greenery' },
        'wrk_gr_irrig_pipe_32': { name: 'Прокладка трубы автополива Ø32', unit: 'м.п.', price: 200, category: 'greenery' },
        'wrk_gr_irrig_pipe_40': { name: 'Прокладка трубы автополива Ø40', unit: 'м.п.', price: 250, category: 'greenery' },
        'wrk_gr_irrig_valve': { name: 'Монтаж электромагнитного клапана', unit: 'шт', price: 2500, category: 'greenery' },
        'wrk_gr_irrig_controller': { name: 'Монтаж контроллера автополива', unit: 'шт', price: 8500, category: 'greenery' },
        'wrk_gr_irrig_rain_sensor': { name: 'Монтаж датчика дождя', unit: 'шт', price: 3500, category: 'greenery' },
        'wrk_gr_irrig_pump': { name: 'Монтаж насоса для автополива', unit: 'шт', price: 12000, category: 'greenery' },
        // === ДРЕНАЖ УЧАСТКА ===
        'wrk_gr_drain_pipe_110': { name: 'Дренажная труба Ø110 (с геотекстилем)', unit: 'м.п.', price: 650, category: 'greenery' },
        'wrk_gr_drain_pipe_160': { name: 'Дренажная труба Ø160 (с геотекстилем)', unit: 'м.п.', price: 850, category: 'greenery' },
        'wrk_gr_drain_pipe_200': { name: 'Дренажная труба Ø200 (с геотекстилем)', unit: 'м.п.', price: 1200, category: 'greenery' },
        'wrk_gr_drain_well_sm': { name: 'Устройство дренажного колодца Ø315', unit: 'шт', price: 5500, category: 'greenery' },
        'wrk_gr_drain_well_lg': { name: 'Устройство дренажного колодца Ø500', unit: 'шт', price: 12000, category: 'greenery' },
        'wrk_gr_drain_surface': { name: 'Устройство поверхностного дренажа (лотки)', unit: 'м.п.', price: 2500, category: 'greenery' },
        // === МУЛЬЧИРОВАНИЕ / ОТСЫПКА ===
        'wrk_gr_mulch_bark': { name: 'Мульчирование корой', unit: 'м²', price: 350, category: 'greenery' },
        'wrk_gr_mulch_chip': { name: 'Мульчирование щепой', unit: 'м²', price: 250, category: 'greenery' },
        'wrk_gr_mulch_gravel_dec': { name: 'Декоративная отсыпка (щебень/галька)', unit: 'м²', price: 550, category: 'greenery' },
        'wrk_gr_mulch_white_marble': { name: 'Отсыпка мраморной крошкой', unit: 'м²', price: 850, category: 'greenery' },
        'wrk_gr_geotextile_under': { name: 'Геотекстиль под отсыпку', unit: 'м²', price: 80, category: 'greenery' },
        // === РЕКУЛЬТИВАЦИЯ ===
        'wrk_gr_recult_tech': { name: 'Техническая рекультивация', unit: 'м²', price: 250, category: 'greenery' },
        'wrk_gr_recult_bio': { name: 'Биологическая рекультивация', unit: 'м²', price: 350, category: 'greenery' }
    };
})();
