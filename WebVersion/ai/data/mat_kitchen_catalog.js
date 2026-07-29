// === КАТАЛОГ КУХОНЬ И МЕБЕЛЬНОЙ ФУРНИТУРЫ — ОЧИЩЕННЫЙ (без дублей с mat_kitchen.js) ===
// mat_kitchen.js уже содержит: столешницы (ламинат/камень/кварц/гранит), мойки, вытяжки (4 вида),
// варочные панели, духовки, СВЧ, посудомойки, холодильник, фартук (плитка/стекло),
// модули кухонные (верхний/нижний/угловой), плинтус кухонный, ручка, петля с доводчиком,
// направляющие 400/500мм, фильтр для воды
(function () {
    window.AI_MAT_KITCHEN_CATALOG = {
        // Столешницы — виды, которых НЕТ в mat_kitchen.js
        'countertop_hpl_28mm_m': { name: 'Столешница HPL 28мм (м.п.)', unit: 'м.п.', price: 1500, category: 'kitchen_catalog' },
        'countertop_hpl_38mm_m': { name: 'Столешница HPL 38мм (м.п.)', unit: 'м.п.', price: 2000, category: 'kitchen_catalog' },
        'countertop_wood_oak_m': { name: 'Столешница массив дуб (м.п.)', unit: 'м.п.', price: 5000, category: 'kitchen_catalog' },
        'countertop_wood_beech_m': { name: 'Столешница массив бук (м.п.)', unit: 'м.п.', price: 4000, category: 'kitchen_catalog' },
        'countertop_stainless_m': { name: 'Столешница нержавеющая (м.п.)', unit: 'м.п.', price: 8000, category: 'kitchen_catalog' },
        'countertop_joint_strip': { name: 'Планка соединительная столешницы', unit: 'шт', price: 100, category: 'kitchen_catalog' },
        'countertop_endcap_strip': { name: 'Планка торцевая столешницы', unit: 'шт', price: 80, category: 'kitchen_catalog' },
        'countertop_edge_strip_3m': { name: 'Кромка для столешницы (3м)', unit: 'шт', price: 50, category: 'kitchen_catalog' },
        // Фартук — виды, которых НЕТ в mat_kitchen.js (там только плитка и скинали)
        'backsplash_hpl_m2': { name: 'Фартук HPL-панель (м²)', unit: 'м²', price: 1500, category: 'kitchen_catalog' },
        'backsplash_mdf_m2': { name: 'Фартук МДФ с фотопечатью (м²)', unit: 'м²', price: 800, category: 'kitchen_catalog' },
        'backsplash_mosaic_m2': { name: 'Фартук мозаика (м²)', unit: 'м²', price: 2000, category: 'kitchen_catalog' },
        // Петли — расширенный ассортимент (mat_kitchen: только с доводчиком)
        'hinge_cabinet_90deg': { name: 'Петля мебельная 90°', unit: 'шт', price: 30, category: 'kitchen_catalog' },
        'hinge_cabinet_110deg': { name: 'Петля мебельная 110°', unit: 'шт', price: 40, category: 'kitchen_catalog' },
        'hinge_cabinet_165deg': { name: 'Петля мебельная 165° (полунакладная)', unit: 'шт', price: 60, category: 'kitchen_catalog' },
        'hinge_cabinet_insrt': { name: 'Петля мебельная вкладная', unit: 'шт', price: 50, category: 'kitchen_catalog' },
        // Направляющие — размеры кроме 400/500мм
        'drawer_slide_ball_250': { name: 'Направляющие шар. 250мм (пара)', unit: 'компл.', price: 100, category: 'kitchen_catalog' },
        'drawer_slide_ball_300': { name: 'Направляющие шар. 300мм (пара)', unit: 'компл.', price: 120, category: 'kitchen_catalog' },
        'drawer_slide_ball_350': { name: 'Направляющие шар. 350мм (пара)', unit: 'компл.', price: 130, category: 'kitchen_catalog' },
        'drawer_slide_ball_450': { name: 'Направляющие шар. 450мм (пара)', unit: 'компл.', price: 170, category: 'kitchen_catalog' },
        'drawer_slide_soft_300': { name: 'Направляющие с доводч. 300мм (пара)', unit: 'компл.', price: 250, category: 'kitchen_catalog' },
        'drawer_slide_soft_400': { name: 'Направляющие с доводч. 400мм (пара)', unit: 'компл.', price: 300, category: 'kitchen_catalog' },
        'drawer_slide_soft_500': { name: 'Направляющие с доводч. 500мм (пара)', unit: 'компл.', price: 350, category: 'kitchen_catalog' },
        // Системы тандембокс (уникальная)
        'drawer_system_tandem_300': { name: 'Тандембокс 300мм', unit: 'компл.', price: 500, category: 'kitchen_catalog' },
        'drawer_system_tandem_400': { name: 'Тандембокс 400мм', unit: 'компл.', price: 600, category: 'kitchen_catalog' },
        'drawer_system_tandem_500': { name: 'Тандембокс 500мм', unit: 'компл.', price: 700, category: 'kitchen_catalog' },
        'drawer_system_inner_org': { name: 'Лоток-органайзер для ящика', unit: 'шт', price: 200, category: 'kitchen_catalog' },
        // Газлифты / подъёмники (уникальная категория)
        'gas_lift_60n': { name: 'Газлифт мебельный 60N', unit: 'шт', price: 100, category: 'kitchen_catalog' },
        'gas_lift_80n': { name: 'Газлифт мебельный 80N', unit: 'шт', price: 120, category: 'kitchen_catalog' },
        'gas_lift_100n': { name: 'Газлифт мебельный 100N', unit: 'шт', price: 140, category: 'kitchen_catalog' },
        'gas_lift_120n': { name: 'Газлифт мебельный 120N', unit: 'шт', price: 160, category: 'kitchen_catalog' },
        'flap_stay_aventos_hf': { name: 'Подъёмный механизм Aventos HF', unit: 'компл.', price: 2000, category: 'kitchen_catalog' },
        'flap_stay_aventos_hk': { name: 'Подъёмный механизм Aventos HK', unit: 'компл.', price: 1500, category: 'kitchen_catalog' },
        // Ручки — расширенные (mat_kitchen: только 1 «современная»)
        'handle_cabinet_96mm_chrome': { name: 'Ручка мебельная 96мм хром', unit: 'шт', price: 30, category: 'kitchen_catalog' },
        'handle_cabinet_128mm_chrome': { name: 'Ручка мебельная 128мм хром', unit: 'шт', price: 40, category: 'kitchen_catalog' },
        'handle_cabinet_160mm_chrome': { name: 'Ручка мебельная 160мм хром', unit: 'шт', price: 50, category: 'kitchen_catalog' },
        'handle_cabinet_256mm_black': { name: 'Ручка мебельная 256мм чёрная', unit: 'шт', price: 60, category: 'kitchen_catalog' },
        'handle_cabinet_knob_chrome': { name: 'Ручка-кнопка хром', unit: 'шт', price: 20, category: 'kitchen_catalog' },
        'handle_profile_edge_m': { name: 'Ручка-профиль кромочная (м.п.)', unit: 'м.п.', price: 200, category: 'kitchen_catalog' },
        'handle_push_open': { name: 'Система push-to-open (толкатель)', unit: 'шт', price: 50, category: 'kitchen_catalog' },
        // Кромка ABS (уникальная категория)
        'edge_abs_0_4x19_50m': { name: 'Кромка ABS 0.4×19мм (50м)', unit: 'рулон', price: 100, category: 'kitchen_catalog' },
        'edge_abs_2x19_50m': { name: 'Кромка ABS 2×19мм (50м)', unit: 'рулон', price: 300, category: 'kitchen_catalog' },
        'edge_abs_0_4x42_50m': { name: 'Кромка ABS 0.4×42мм (50м)', unit: 'рулон', price: 200, category: 'kitchen_catalog' },
        'edge_abs_2x42_50m': { name: 'Кромка ABS 2×42мм (50м)', unit: 'рулон', price: 500, category: 'kitchen_catalog' },
        'edge_glue_1kg': { name: 'Клей для кромки (1кг)', unit: 'шт', price: 200, category: 'kitchen_catalog' },
        // Ножки / опоры (уникальная)
        'leg_adj_100mm': { name: 'Ножка регулируемая 100мм', unit: 'шт', price: 10, category: 'kitchen_catalog' },
        'leg_adj_150mm': { name: 'Ножка регулируемая 150мм', unit: 'шт', price: 15, category: 'kitchen_catalog' },
        'plinth_clip_kitchen': { name: 'Клипса для кухонного цоколя', unit: 'шт', price: 5, category: 'kitchen_catalog' },
        'plinth_kitchen_alum_3m': { name: 'Цоколь кухонный алюминий (3м)', unit: 'шт', price: 200, category: 'kitchen_catalog' },
        // Конфирматы / стяжки (уникальная категория)
        'confirmat_6_5x50_100': { name: 'Конфирмат 6.5×50мм (100шт)', unit: 'уп.', price: 50, category: 'kitchen_catalog' },
        'confirmat_7x70_100': { name: 'Конфирмат 7×70мм (100шт)', unit: 'уп.', price: 60, category: 'kitchen_catalog' },
        'cam_lock_15mm_20': { name: 'Стяжка эксцентриковая 15мм (20шт)', unit: 'уп.', price: 50, category: 'kitchen_catalog' },
        'dowel_wood_8x35_100': { name: 'Шкант деревянный 8×35мм (100шт)', unit: 'уп.', price: 20, category: 'kitchen_catalog' },
        'shelf_support_5mm_20': { name: 'Полкодержатель 5мм (20шт)', unit: 'уп.', price: 20, category: 'kitchen_catalog' },
        // Сушки / карго / рейлинги (уникальная)
        'dish_dryer_600mm': { name: 'Сушка для посуды 600мм', unit: 'шт', price: 500, category: 'kitchen_catalog' },
        'dish_dryer_800mm': { name: 'Сушка для посуды 800мм', unit: 'шт', price: 700, category: 'kitchen_catalog' },
        'cargo_150mm': { name: 'Карго бутылочница 150мм', unit: 'шт', price: 1000, category: 'kitchen_catalog' },
        'cargo_200mm': { name: 'Карго бутылочница 200мм', unit: 'шт', price: 1200, category: 'kitchen_catalog' },
        'carousel_600mm': { name: 'Карусель для углового шкафа 600мм', unit: 'шт', price: 2000, category: 'kitchen_catalog' },
        'carousel_800mm': { name: 'Карусель для углового шкафа 800мм', unit: 'шт', price: 3000, category: 'kitchen_catalog' },
        'railing_chrome_600mm': { name: 'Рейлинг кухонный 600мм хром', unit: 'шт', price: 200, category: 'kitchen_catalog' },
        'railing_chrome_1000mm': { name: 'Рейлинг кухонный 1000мм хром', unit: 'шт', price: 300, category: 'kitchen_catalog' },
        // Мусорные системы (уникальная)
        'waste_bin_single_15l': { name: 'Ведро встраиваемое 15л', unit: 'шт', price: 500, category: 'kitchen_catalog' },
        'waste_bin_double_20l': { name: 'Ведро встраиваемое двойное 2×10л', unit: 'шт', price: 1000, category: 'kitchen_catalog' },
        'waste_bin_pull_30l': { name: 'Система выдвижная для мусора 30л', unit: 'шт', price: 2000, category: 'kitchen_catalog' },
        // LED подсветка кухни (уникальная)
        'led_strip_kitchen_1m': { name: 'LED лента для кухни (1м)', unit: 'шт', price: 200, category: 'kitchen_catalog' },
        'led_strip_kitchen_driver': { name: 'Блок питания LED 12В 60Вт', unit: 'шт', price: 300, category: 'kitchen_catalog' },
        'led_sensor_switch': { name: 'Сенсорный выключатель для LED', unit: 'шт', price: 100, category: 'kitchen_catalog' },
        'spot_led_cabinet_3w': { name: 'Точечный светильник для шкафа 3Вт', unit: 'шт', price: 200, category: 'kitchen_catalog' }
    };
})();
