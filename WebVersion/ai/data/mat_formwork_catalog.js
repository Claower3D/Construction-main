// === КАТАЛОГ ОПАЛУБКИ, ЛЕСОВ И ВСПОМОГАТЕЛЬНОГО ОБОРУДОВАНИЯ (90 позиций) ===
(function () {
    window.AI_MAT_FORMWORK_CATALOG = {
        // Опалубка стеновая мелкощитовая
        'formwork_panel_300x900': { name: 'Щит опалубки 300×900мм', unit: 'шт', price: 1500, category: 'formwork_catalog' },
        'formwork_panel_300x1200': { name: 'Щит опалубки 300×1200мм', unit: 'шт', price: 2000, category: 'formwork_catalog' },
        'formwork_panel_450x1200': { name: 'Щит опалубки 450×1200мм', unit: 'шт', price: 2500, category: 'formwork_catalog' },
        'formwork_panel_600x1200': { name: 'Щит опалубки 600×1200мм', unit: 'шт', price: 3000, category: 'formwork_catalog' },
        'formwork_panel_600x1500': { name: 'Щит опалубки 600×1500мм', unit: 'шт', price: 3500, category: 'formwork_catalog' },
        'formwork_panel_900x1500': { name: 'Щит опалубки 900×1500мм', unit: 'шт', price: 4500, category: 'formwork_catalog' },
        'formwork_clamp_flat': { name: 'Замок клиновой для опалубки', unit: 'шт', price: 100, category: 'formwork_catalog' },
        'formwork_clamp_wedge': { name: 'Замок «барабашка» ригельный', unit: 'шт', price: 80, category: 'formwork_catalog' },
        'formwork_tie_rod_500': { name: 'Стяжной винт 500мм', unit: 'шт', price: 50, category: 'formwork_catalog' },
        'formwork_tie_rod_700': { name: 'Стяжной винт 700мм', unit: 'шт', price: 70, category: 'formwork_catalog' },
        'formwork_tie_rod_1000': { name: 'Стяжной винт 1000мм', unit: 'шт', price: 100, category: 'formwork_catalog' },
        'formwork_tube_cone': { name: 'Трубка-конус для стяжки', unit: 'шт', price: 5, category: 'formwork_catalog' },
        'formwork_wing_nut': { name: 'Гайка барашковая для стяжки', unit: 'шт', price: 15, category: 'formwork_catalog' },
        // Опалубка перекрытий
        'formwork_prop_2_3m': { name: 'Стойка телескопическая 2-3м', unit: 'шт', price: 600, category: 'formwork_catalog' },
        'formwork_prop_2_5_3_7m': { name: 'Стойка телескопическая 2.5-3.7м', unit: 'шт', price: 800, category: 'formwork_catalog' },
        'formwork_prop_3_5_5m': { name: 'Стойка телескопическая 3.5-5м', unit: 'шт', price: 1200, category: 'formwork_catalog' },
        'formwork_tripod': { name: 'Тренога для стойки', unit: 'шт', price: 200, category: 'formwork_catalog' },
        'formwork_unijoint': { name: 'Унивилка для стойки', unit: 'шт', price: 100, category: 'formwork_catalog' },
        'formwork_beam_h20_3m': { name: 'Балка двутавровая H20 (3м)', unit: 'шт', price: 500, category: 'formwork_catalog' },
        'formwork_beam_h20_4m': { name: 'Балка двутавровая H20 (4м)', unit: 'шт', price: 650, category: 'formwork_catalog' },
        'formwork_beam_h20_5m': { name: 'Балка двутавровая H20 (5м)', unit: 'шт', price: 800, category: 'formwork_catalog' },
        // Фанера опалубочная
        'formwork_plywood_18mm': { name: 'Фанера ФСФ 18мм ламинированная', unit: 'лист', price: 2500, category: 'formwork_catalog' },
        'formwork_plywood_21mm': { name: 'Фанера ФСФ 21мм ламинированная', unit: 'лист', price: 3000, category: 'formwork_catalog' },
        // Несъёмная опалубка
        'formwork_eps_1200x300x250': { name: 'Блок несъёмной опалубки ППС 1200×300×250', unit: 'шт', price: 300, category: 'formwork_catalog' },
        'formwork_eps_1200x300x300': { name: 'Блок несъёмной опалубки ППС 1200×300×300', unit: 'шт', price: 350, category: 'formwork_catalog' },
        'formwork_dsp_3200_1200_35': { name: 'Плита ЦСП 3200×1200×35мм (опалубка)', unit: 'лист', price: 1200, category: 'formwork_catalog' },
        // Опалубка фундамента
        'formwork_found_panel_600': { name: 'Щит фундаментный 600мм', unit: 'шт', price: 2000, category: 'formwork_catalog' },
        'formwork_corner_int_90': { name: 'Угол опалубки внутренний 90°', unit: 'шт', price: 1000, category: 'formwork_catalog' },
        'formwork_corner_ext_90': { name: 'Угол опалубки наружный 90°', unit: 'шт', price: 1200, category: 'formwork_catalog' },
        // Строительные леса рамные
        'scaffold_frame_1_0m': { name: 'Рама лесов 1.0м', unit: 'шт', price: 600, category: 'formwork_catalog' },
        'scaffold_frame_1_5m': { name: 'Рама лесов 1.5м', unit: 'шт', price: 800, category: 'formwork_catalog' },
        'scaffold_frame_2_0m': { name: 'Рама лесов 2.0м', unit: 'шт', price: 1000, category: 'formwork_catalog' },
        'scaffold_diag_1_0m': { name: 'Диагональ лесов 1.0м', unit: 'шт', price: 200, category: 'formwork_catalog' },
        'scaffold_diag_2_0m': { name: 'Диагональ лесов 2.0м', unit: 'шт', price: 300, category: 'formwork_catalog' },
        'scaffold_horiz_3_0m': { name: 'Горизонталь лесов 3.0м', unit: 'шт', price: 300, category: 'formwork_catalog' },
        'scaffold_deck_3_0m': { name: 'Настил деревянный 3.0м', unit: 'шт', price: 500, category: 'formwork_catalog' },
        'scaffold_deck_metal_3_0m': { name: 'Настил металлический 3.0м', unit: 'шт', price: 800, category: 'formwork_catalog' },
        'scaffold_base_fixed': { name: 'Пята (опора) лесов фиксированная', unit: 'шт', price: 50, category: 'formwork_catalog' },
        'scaffold_base_adjustable': { name: 'Пята (опора) лесов регулируемая', unit: 'шт', price: 100, category: 'formwork_catalog' },
        'scaffold_castor': { name: 'Колесо для лесов Ø200мм', unit: 'шт', price: 300, category: 'formwork_catalog' },
        'scaffold_clamp_swivel': { name: 'Хомут поворотный для лесов', unit: 'шт', price: 50, category: 'formwork_catalog' },
        'scaffold_clamp_fixed': { name: 'Хомут неповоротный для лесов', unit: 'шт', price: 40, category: 'formwork_catalog' },
        // Леса клиновые
        'scaffold_wedge_frame_2m': { name: 'Стойка клиновых лесов 2м', unit: 'шт', price: 500, category: 'formwork_catalog' },
        'scaffold_wedge_frame_3m': { name: 'Стойка клиновых лесов 3м', unit: 'шт', price: 700, category: 'formwork_catalog' },
        'scaffold_wedge_ledger_1_5m': { name: 'Ригель клиновых лесов 1.5м', unit: 'шт', price: 300, category: 'formwork_catalog' },
        'scaffold_wedge_ledger_2m': { name: 'Ригель клиновых лесов 2м', unit: 'шт', price: 400, category: 'formwork_catalog' },
        'scaffold_wedge_ledger_3m': { name: 'Ригель клиновых лесов 3м', unit: 'шт', price: 500, category: 'formwork_catalog' },
        // Подмости / вышки-туры
        'tower_scaffold_1_2x2_0_6m': { name: 'Вышка-тура 1.2×2.0м h=6м', unit: 'компл.', price: 15000, category: 'formwork_catalog' },
        'tower_scaffold_1_2x2_0_10m': { name: 'Вышка-тура 1.2×2.0м h=10м', unit: 'компл.', price: 25000, category: 'formwork_catalog' },
        'tower_scaffold_0_7x1_6_4m': { name: 'Вышка-тура 0.7×1.6м h=4м', unit: 'компл.', price: 8000, category: 'formwork_catalog' },
        'platform_folding': { name: 'Подмость складной 0.8×1.8м', unit: 'шт', price: 3000, category: 'formwork_catalog' },
        'platform_mini': { name: 'Подмость-столик 0.5×0.9м', unit: 'шт', price: 1500, category: 'formwork_catalog' },
        // Защитные сетки
        'scaffold_net_3x10m': { name: 'Сетка защитная фасадная (3×10м)', unit: 'шт', price: 300, category: 'formwork_catalog' },
        'scaffold_net_3x50m': { name: 'Сетка защитная фасадная (3×50м)', unit: 'рулон', price: 1200, category: 'formwork_catalog' },
        // Оборудование для бетонных работ
        'vibrator_needle_1_5kw': { name: 'Вибратор глубинный 1.5кВт', unit: 'шт', price: 5000, category: 'formwork_catalog' },
        'vibrator_needle_2_2kw': { name: 'Вибратор глубинный 2.2кВт', unit: 'шт', price: 8000, category: 'formwork_catalog' },
        'vibrator_surface_220v': { name: 'Виброрейка поверхностная 220В', unit: 'шт', price: 6000, category: 'formwork_catalog' },
        'vibrator_surface_petrol': { name: 'Виброрейка бензиновая', unit: 'шт', price: 15000, category: 'formwork_catalog' },
        'vibroplate_60kg': { name: 'Виброплита 60кг', unit: 'шт', price: 15000, category: 'formwork_catalog' },
        'vibroplate_90kg': { name: 'Виброплита 90кг', unit: 'шт', price: 20000, category: 'formwork_catalog' },
        'vibroplate_130kg': { name: 'Виброплита 130кг реверсивная', unit: 'шт', price: 35000, category: 'formwork_catalog' },
        'concrete_mixer_120l': { name: 'Бетономешалка 120л', unit: 'шт', price: 15000, category: 'formwork_catalog' },
        'concrete_mixer_180l': { name: 'Бетономешалка 180л', unit: 'шт', price: 20000, category: 'formwork_catalog' },
        'concrete_mixer_260l': { name: 'Бетономешалка 260л', unit: 'шт', price: 30000, category: 'formwork_catalog' },
        // Смазка для опалубки
        'formwork_release_agent_20l': { name: 'Смазка для опалубки (20л)', unit: 'шт', price: 1500, category: 'formwork_catalog' },
        // Генераторы
        'generator_2_5kw': { name: 'Генератор бензиновый 2.5кВт', unit: 'шт', price: 20000, category: 'formwork_catalog' },
        'generator_5kw': { name: 'Генератор бензиновый 5кВт', unit: 'шт', price: 35000, category: 'formwork_catalog' },
        'generator_7kw': { name: 'Генератор бензиновый 7кВт', unit: 'шт', price: 50000, category: 'formwork_catalog' },
        'generator_10kw_diesel': { name: 'Генератор дизельный 10кВт', unit: 'шт', price: 100000, category: 'formwork_catalog' },
        // Тачки / носилки
        'wheelbarrow_65l': { name: 'Тачка строительная 65л', unit: 'шт', price: 2000, category: 'formwork_catalog' },
        'wheelbarrow_85l': { name: 'Тачка строительная 85л', unit: 'шт', price: 3000, category: 'formwork_catalog' },
        'wheelbarrow_100l_2w': { name: 'Тачка строительная 100л 2-колёсная', unit: 'шт', price: 5000, category: 'formwork_catalog' },
        'bucket_20l': { name: 'Ведро строительное 20л', unit: 'шт', price: 50, category: 'formwork_catalog' },
        'bucket_16l_mortar': { name: 'Ведро для раствора 16л', unit: 'шт', price: 60, category: 'formwork_catalog' }
    };
})();
