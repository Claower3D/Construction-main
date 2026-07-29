// === КАТАЛОГ РАБОТ: КЛАДКА — ПОЛНЫЙ ЦИКЛ (200 позиций) ===
(function () {
    window.AI_WRK_MASONRY = {
        // Кладка керамического кирпича
        'wrk_msnr_brick_cer_half_m100': { name: 'Кладка кирпича керам. в полкирпича М100', unit: 'м²', price: 700, category: 'masonry' },
        'wrk_msnr_brick_cer_half_m150': { name: 'Кладка кирпича керам. в полкирпича М150', unit: 'м²', price: 750, category: 'masonry' },
        'wrk_msnr_brick_cer_1_m100': { name: 'Кладка кирпича керам. в 1 кирпич М100', unit: 'м²', price: 1100, category: 'masonry' },
        'wrk_msnr_brick_cer_1_m150': { name: 'Кладка кирпича керам. в 1 кирпич М150', unit: 'м²', price: 1200, category: 'masonry' },
        'wrk_msnr_brick_cer_15_m100': { name: 'Кладка кирпича керам. в 1.5 кирпича М100', unit: 'м²', price: 1500, category: 'masonry' },
        'wrk_msnr_brick_cer_15_m150': { name: 'Кладка кирпича керам. в 1.5 кирпича М150', unit: 'м²', price: 1600, category: 'masonry' },
        'wrk_msnr_brick_cer_2_m100': { name: 'Кладка кирпича керам. в 2 кирпича М100', unit: 'м²', price: 1900, category: 'masonry' },
        'wrk_msnr_brick_cer_2_m150': { name: 'Кладка кирпича керам. в 2 кирпича М150', unit: 'м²', price: 2000, category: 'masonry' },
        'wrk_msnr_brick_cer_25': { name: 'Кладка кирпича керам. в 2.5 кирпича', unit: 'м²', price: 2400, category: 'masonry' },
        // Кладка полнотелого кирпича (несущие стены)
        'wrk_msnr_brick_full_1_m200': { name: 'Кладка полнотелого в 1 кирпич М200', unit: 'м²', price: 1400, category: 'masonry' },
        'wrk_msnr_brick_full_15_m200': { name: 'Кладка полнотелого в 1.5 кирпича М200', unit: 'м²', price: 1800, category: 'masonry' },
        'wrk_msnr_brick_full_2_m200': { name: 'Кладка полнотелого в 2 кирпича М200', unit: 'м²', price: 2200, category: 'masonry' },
        'wrk_msnr_brick_full_2_m250': { name: 'Кладка полнотелого в 2 кирпича М250', unit: 'м²', price: 2400, category: 'masonry' },
        // Кладка силикатного кирпича
        'wrk_msnr_brick_sil_half': { name: 'Кладка кирпича силик. в полкирпича', unit: 'м²', price: 600, category: 'masonry' },
        'wrk_msnr_brick_sil_1': { name: 'Кладка кирпича силик. в 1 кирпич', unit: 'м²', price: 1000, category: 'masonry' },
        'wrk_msnr_brick_sil_15': { name: 'Кладка кирпича силик. в 1.5 кирпича', unit: 'м²', price: 1300, category: 'masonry' },
        'wrk_msnr_brick_sil_2': { name: 'Кладка кирпича силик. в 2 кирпича', unit: 'м²', price: 1700, category: 'masonry' },
        // Кладка облицовочного кирпича
        'wrk_msnr_face_brick_half': { name: 'Кладка облицовочного в полкирпича', unit: 'м²', price: 1000, category: 'masonry' },
        'wrk_msnr_face_brick_1': { name: 'Кладка облицовочного в 1 кирпич', unit: 'м²', price: 1500, category: 'masonry' },
        'wrk_msnr_face_brick_15_utor': { name: 'Кладка облицов. полуторного', unit: 'м²', price: 900, category: 'masonry' },
        'wrk_msnr_face_brick_aged': { name: 'Кладка кирпича ручной формовки', unit: 'м²', price: 1300, category: 'masonry' },
        // Кладка клинкерного кирпича
        'wrk_msnr_clinker_half': { name: 'Кладка клинкера в полкирпича', unit: 'м²', price: 1200, category: 'masonry' },
        'wrk_msnr_clinker_1': { name: 'Кладка клинкера в 1 кирпич', unit: 'м²', price: 1800, category: 'masonry' },
        // Кладка шамотного кирпича
        'wrk_msnr_fire_brick_stove': { name: 'Кладка огнеуп. кирпича (печь/камин)', unit: 'м²', price: 2000, category: 'masonry' },
        'wrk_msnr_fire_brick_chimney': { name: 'Кладка огнеуп. кирпича (дымоход)', unit: 'м.п.', price: 2500, category: 'masonry' },
        'wrk_msnr_fire_brick_furnace': { name: 'Кладка огнеуп. кирпича (промышл. печь)', unit: 'м²', price: 3000, category: 'masonry' },
        // Газоблоки
        'wrk_msnr_gas_100': { name: 'Кладка газоблоков 100мм (перегородка)', unit: 'м²', price: 400, category: 'masonry' },
        'wrk_msnr_gas_150': { name: 'Кладка газоблоков 150мм (перегородка)', unit: 'м²', price: 500, category: 'masonry' },
        'wrk_msnr_gas_200': { name: 'Кладка газоблоков 200мм', unit: 'м²', price: 600, category: 'masonry' },
        'wrk_msnr_gas_250': { name: 'Кладка газоблоков 250мм', unit: 'м²', price: 700, category: 'masonry' },
        'wrk_msnr_gas_300': { name: 'Кладка газоблоков 300мм', unit: 'м²', price: 800, category: 'masonry' },
        'wrk_msnr_gas_375': { name: 'Кладка газоблоков 375мм', unit: 'м²', price: 900, category: 'masonry' },
        'wrk_msnr_gas_400': { name: 'Кладка газоблоков 400мм', unit: 'м²', price: 1000, category: 'masonry' },
        'wrk_msnr_gas_500': { name: 'Кладка газоблоков 500мм', unit: 'м²', price: 1200, category: 'masonry' },
        'wrk_msnr_gas_d300': { name: 'Кладка газоблоков D300 (теплоизоляция)', unit: 'м²', price: 700, category: 'masonry' },
        'wrk_msnr_gas_d400': { name: 'Кладка газоблоков D400', unit: 'м²', price: 750, category: 'masonry' },
        'wrk_msnr_gas_d500': { name: 'Кладка газоблоков D500', unit: 'м²', price: 800, category: 'masonry' },
        'wrk_msnr_gas_d600': { name: 'Кладка газоблоков D600', unit: 'м²', price: 850, category: 'masonry' },
        'wrk_msnr_gas_glue': { name: 'Кладка газоблоков на клей', unit: 'м²', price: 50, category: 'masonry' },
        'wrk_msnr_gas_foam': { name: 'Кладка газоблоков на клей-пену', unit: 'м²', price: 30, category: 'masonry' },
        // Пеноблоки
        'wrk_msnr_foam_200': { name: 'Кладка пеноблоков 200мм', unit: 'м²', price: 550, category: 'masonry' },
        'wrk_msnr_foam_300': { name: 'Кладка пеноблоков 300мм', unit: 'м²', price: 700, category: 'masonry' },
        'wrk_msnr_foam_400': { name: 'Кладка пеноблоков 400мм', unit: 'м²', price: 850, category: 'masonry' },
        // Керамзитоблоки
        'wrk_msnr_keramzit_190': { name: 'Кладка керамзитоблоков 190мм', unit: 'м²', price: 500, category: 'masonry' },
        'wrk_msnr_keramzit_390': { name: 'Кладка керамзитоблоков 390мм', unit: 'м²', price: 800, category: 'masonry' },
        'wrk_msnr_keramzit_90': { name: 'Кладка керамзитоблоков перегор. 90мм', unit: 'м²', price: 400, category: 'masonry' },
        // Тёплая керамика
        'wrk_msnr_warm_250': { name: 'Кладка тёплой керамики 250мм', unit: 'м²', price: 1000, category: 'masonry' },
        'wrk_msnr_warm_380': { name: 'Кладка тёплой керамики 380мм', unit: 'м²', price: 1300, category: 'masonry' },
        'wrk_msnr_warm_440': { name: 'Кладка тёплой керамики 440мм', unit: 'м²', price: 1500, category: 'masonry' },
        'wrk_msnr_warm_510': { name: 'Кладка тёплой керамики 510мм', unit: 'м²', price: 1800, category: 'masonry' },
        // Полистиролбетон
        'wrk_msnr_polyst_200': { name: 'Кладка полистиролбетонных бл. 200мм', unit: 'м²', price: 500, category: 'masonry' },
        'wrk_msnr_polyst_300': { name: 'Кладка полистиролбетонных бл. 300мм', unit: 'м²', price: 650, category: 'masonry' },
        'wrk_msnr_polyst_400': { name: 'Кладка полистиролбет. бл. 400мм', unit: 'м²', price: 800, category: 'masonry' },
        // ПГП
        'wrk_msnr_pgp_80': { name: 'Кладка ПГП 80мм', unit: 'м²', price: 400, category: 'masonry' },
        'wrk_msnr_pgp_100': { name: 'Кладка ПГП 100мм', unit: 'м²', price: 450, category: 'masonry' },
        'wrk_msnr_pgp_80_moisture': { name: 'Кладка ПГП влагост. 80мм', unit: 'м²', price: 450, category: 'masonry' },
        'wrk_msnr_pgp_100_moisture': { name: 'Кладка ПГП влагост. 100мм', unit: 'м²', price: 500, category: 'masonry' },
        'wrk_msnr_pgp_double': { name: 'Кладка двойной ПГП перегородки', unit: 'м²', price: 700, category: 'masonry' },
        // Стеклоблоки
        'wrk_msnr_glass_block': { name: 'Кладка стеклоблоков', unit: 'м²', price: 1500, category: 'masonry' },
        // Перемычки
        'wrk_msnr_lintel_jb_install': { name: 'Монтаж ж/б перемычки', unit: 'шт', price: 300, category: 'masonry' },
        'wrk_msnr_lintel_jb_heavy': { name: 'Монтаж ж/б перемычки (>100кг)', unit: 'шт', price: 500, category: 'masonry' },
        'wrk_msnr_lintel_gas_install': { name: 'Монтаж газобетонной перемычки', unit: 'шт', price: 300, category: 'masonry' },
        'wrk_msnr_lintel_brick': { name: 'Устройство кирпичной перемычки', unit: 'м.п.', price: 1000, category: 'masonry' },
        'wrk_msnr_lintel_steel': { name: 'Устройство стальной перемычки (уголок)', unit: 'м.п.', price: 500, category: 'masonry' },
        'wrk_msnr_lintel_u_block': { name: 'Устройство перемычки в U-блоках', unit: 'м.п.', price: 800, category: 'masonry' },
        // Армопояс
        'wrk_msnr_armo_u_block': { name: 'Армопояс в U-блоках', unit: 'м.п.', price: 1000, category: 'masonry' },
        'wrk_msnr_armo_formwork': { name: 'Армопояс в опалубке', unit: 'м.п.', price: 1200, category: 'masonry' },
        'wrk_msnr_armo_200': { name: 'Армопояс 200мм', unit: 'м.п.', price: 800, category: 'masonry' },
        'wrk_msnr_armo_300': { name: 'Армопояс 300мм', unit: 'м.п.', price: 1000, category: 'masonry' },
        // Кладочная сетка
        'wrk_msnr_mesh_50x50': { name: 'Укладка кладочной сетки 50×50', unit: 'м²', price: 20, category: 'masonry' },
        'wrk_msnr_rebar_groove': { name: 'Армирование штрабы (газобетон)', unit: 'м.п.', price: 50, category: 'masonry' },
        // Расшивка швов
        'wrk_msnr_joint_concave': { name: 'Расшивка швов (вогнутая)', unit: 'м²', price: 150, category: 'masonry' },
        'wrk_msnr_joint_flush': { name: 'Расшивка швов (впод резку)', unit: 'м²', price: 200, category: 'masonry' },
        'wrk_msnr_joint_color': { name: 'Расшивка швов цветная', unit: 'м²', price: 250, category: 'masonry' },
        'wrk_msnr_repointing': { name: 'Перетирка швов (реставрация)', unit: 'м²', price: 400, category: 'masonry' },
        // Арки и фигурная кладка
        'wrk_msnr_arch_simple': { name: 'Кирпичная арка (простая)', unit: 'шт', price: 3000, category: 'masonry' },
        'wrk_msnr_arch_complex': { name: 'Кирпичная арка (сложная)', unit: 'шт', price: 5000, category: 'masonry' },
        'wrk_msnr_column_brick_250': { name: 'Кирпичный столб 250×250мм', unit: 'м.п.', price: 1500, category: 'masonry' },
        'wrk_msnr_column_brick_380': { name: 'Кирпичный столб 380×380мм', unit: 'м.п.', price: 2000, category: 'masonry' },
        'wrk_msnr_column_brick_510': { name: 'Кирпичный столб 510×510мм', unit: 'м.п.', price: 2500, category: 'masonry' },
        'wrk_msnr_corbel': { name: 'Устройство кирпичного карниза', unit: 'м.п.', price: 1000, category: 'masonry' },
        'wrk_msnr_pilaster': { name: 'Устройство пилястры', unit: 'м.п.', price: 1200, category: 'masonry' },
        // Печи / камины
        'wrk_msnr_stove_simple': { name: 'Кладка простой отопит. печи', unit: 'шт', price: 25000, category: 'masonry' },
        'wrk_msnr_stove_complex': { name: 'Кладка сложной отопит. печи', unit: 'шт', price: 50000, category: 'masonry' },
        'wrk_msnr_stove_cooking': { name: 'Кладка варочной печи', unit: 'шт', price: 30000, category: 'masonry' },
        'wrk_msnr_fireplace_closed': { name: 'Кладка камина (закрытая топка)', unit: 'шт', price: 30000, category: 'masonry' },
        'wrk_msnr_fireplace_open': { name: 'Кладка камина (открытая топка)', unit: 'шт', price: 40000, category: 'masonry' },
        'wrk_msnr_fireplace_portal': { name: 'Облицовка каминного портала', unit: 'шт', price: 15000, category: 'masonry' },
        'wrk_msnr_chimney_brick': { name: 'Кладка дымохода кирпичного', unit: 'м.п.', price: 2500, category: 'masonry' },
        'wrk_msnr_bbq': { name: 'Кладка мангала / барбекю', unit: 'шт', price: 15000, category: 'masonry' },
        'wrk_msnr_tandoor': { name: 'Устройство тандыра', unit: 'шт', price: 20000, category: 'masonry' },
        // Монтаж ЖБИ
        'wrk_msnr_fbs_install': { name: 'Монтаж блоков ФБС', unit: 'шт', price: 300, category: 'masonry' },
        'wrk_msnr_slab_install_pk': { name: 'Монтаж плит перекрытия ПК', unit: 'шт', price: 500, category: 'masonry' },
        'wrk_msnr_slab_install_pb': { name: 'Монтаж плит перекрытия ПБ', unit: 'шт', price: 500, category: 'masonry' },
        'wrk_msnr_stair_lm_install': { name: 'Монтаж лестничного марша', unit: 'шт', price: 2000, category: 'masonry' },
        'wrk_msnr_stair_lp_install': { name: 'Монтаж лестничной площадки', unit: 'шт', price: 1500, category: 'masonry' },
        'wrk_msnr_beam_jb_install': { name: 'Монтаж ж/б балки', unit: 'шт', price: 500, category: 'masonry' },
        'wrk_msnr_column_jb_install': { name: 'Монтаж ж/б колонны', unit: 'шт', price: 1000, category: 'masonry' },
        'wrk_msnr_ring_install': { name: 'Монтаж колодезного кольца', unit: 'шт', price: 800, category: 'masonry' },
        'wrk_msnr_curb_install': { name: 'Установка бордюров', unit: 'м.п.', price: 150, category: 'masonry' },
        'wrk_msnr_road_slab_install': { name: 'Укладка дорожных плит', unit: 'шт', price: 700, category: 'masonry' },
        // Забор из кирпича / блоков
        'wrk_msnr_fence_column_brick': { name: 'Столб забора из кирпича', unit: 'шт', price: 3000, category: 'masonry' },
        'wrk_msnr_fence_span_brick': { name: 'Простенок забора из кирпича', unit: 'м²', price: 1200, category: 'masonry' },
        'wrk_msnr_fence_column_block': { name: 'Столб забора из блоков', unit: 'шт', price: 2000, category: 'masonry' },
        'wrk_msnr_fence_cap': { name: 'Установка колпака на столб', unit: 'шт', price: 200, category: 'masonry' },
        // Демонтаж кладки
        'wrk_msnr_demo_brick_half': { name: 'Демонтаж кладки в полкирпича', unit: 'м²', price: 250, category: 'masonry' },
        'wrk_msnr_demo_brick_1': { name: 'Демонтаж кладки в 1 кирпич', unit: 'м²', price: 400, category: 'masonry' },
        'wrk_msnr_demo_brick_15': { name: 'Демонтаж кладки в 1.5 кирпича', unit: 'м²', price: 550, category: 'masonry' },
        'wrk_msnr_demo_brick_2': { name: 'Демонтаж кладки в 2 кирпича', unit: 'м²', price: 700, category: 'masonry' },
        // Проёмы
        'wrk_msnr_opening_brick': { name: 'Устройство проёма в кирпичной стене', unit: 'шт', price: 3000, category: 'masonry' },
        'wrk_msnr_opening_close_brick': { name: 'Закладка проёма кирпичом', unit: 'м²', price: 1000, category: 'masonry' },
        'wrk_msnr_opening_close_gas': { name: 'Закладка проёма газоблоками', unit: 'м²', price: 700, category: 'masonry' },
        // Вентканалы
        'wrk_msnr_ventchannel_1': { name: 'Кладка вентканала (1 канал)', unit: 'м.п.', price: 1000, category: 'masonry' },
        'wrk_msnr_ventchannel_2': { name: 'Кладка вентканала (2 канала)', unit: 'м.п.', price: 1500, category: 'masonry' },
        'wrk_msnr_ventchannel_3': { name: 'Кладка вентканала (3 канала)', unit: 'м.п.', price: 2000, category: 'masonry' },
        // Подмости / леса
        'wrk_msnr_scaffold_tube': { name: 'Установка трубчатых лесов', unit: 'м²', price: 40, category: 'masonry' },
        'wrk_msnr_scaffold_frame': { name: 'Установка рамных лесов', unit: 'м²', price: 50, category: 'masonry' },
        'wrk_msnr_scaffold_trestle': { name: 'Установка малых подмостей', unit: 'компл.', price: 500, category: 'masonry' },
        // Усиление кладки
        'wrk_msnr_reinforce_belt': { name: 'Усиление кладки стальным поясом', unit: 'м.п.', price: 1000, category: 'masonry' },
        'wrk_msnr_reinforce_inject': { name: 'Инъектирование кладки', unit: 'м.п.', price: 1500, category: 'masonry' },
        'wrk_msnr_reinforce_carbon': { name: 'Усиление кладки углепластиком', unit: 'м.п.', price: 2000, category: 'masonry' },
        // Гидроизоляция кладки
        'wrk_msnr_waterproof_cut': { name: 'Отсечная ГИ кладки (горизонтальная)', unit: 'м.п.', price: 200, category: 'masonry' },
        'wrk_msnr_waterproof_cream': { name: 'Инъекционная ГИ кладки (крем)', unit: 'м.п.', price: 300, category: 'masonry' }
    };
})();
