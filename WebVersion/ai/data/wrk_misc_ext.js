// === РЕСТАВРАЦИЯ, МАЛОЭТАЖНОЕ СТРОИТЕЛЬСТВО, МОДУЛЬНЫЕ ЗДАНИЯ, ВРЕМЕННЫЕ СООРУЖЕНИЯ (300 поз.) ===
(function () {
    window.AI_WRK_MISC_EXT = {
        // === РЕСТАВРАЦИЯ ===
        'wrk_ms_rest_brick_repair': { name: 'Реставрация кирпичной кладки', unit: 'м²', price: 5500, category: 'misc_ext' },
        'wrk_ms_rest_stone_repair': { name: 'Реставрация каменной кладки', unit: 'м²', price: 8500, category: 'misc_ext' },
        'wrk_ms_rest_plaster_repair': { name: 'Реставрация лепного декора', unit: 'м²', price: 12000, category: 'misc_ext' },
        'wrk_ms_rest_stucco_molding': { name: 'Воссоздание лепнины', unit: 'м.п.', price: 8500, category: 'misc_ext' },
        'wrk_ms_rest_fresco': { name: 'Реставрация фрески/росписи', unit: 'м²', price: 25000, category: 'misc_ext' },
        'wrk_ms_rest_facade_wash': { name: 'Очистка фасада (мягкий бластинг)', unit: 'м²', price: 550, category: 'misc_ext' },
        'wrk_ms_rest_wood_element': { name: 'Реставрация деревянного элемента', unit: 'шт', price: 15000, category: 'misc_ext' },
        'wrk_ms_rest_metalwork': { name: 'Реставрация кованого элемента', unit: 'шт', price: 12000, category: 'misc_ext' },
        // === МОДУЛЬНЫЕ ЗДАНИЯ ===
        'wrk_ms_modular_container_20': { name: 'Монтаж блок-контейнера 20 фут', unit: 'шт', price: 35000, category: 'misc_ext' },
        'wrk_ms_modular_container_40': { name: 'Монтаж блок-контейнера 40 фут', unit: 'шт', price: 55000, category: 'misc_ext' },
        'wrk_ms_modular_office': { name: 'Монтаж модульного офиса', unit: 'м²', price: 8500, category: 'misc_ext' },
        'wrk_ms_modular_dormitory': { name: 'Монтаж модульного общежития', unit: 'место', price: 55000, category: 'misc_ext' },
        'wrk_ms_modular_checkpoint': { name: 'Монтаж модульного КПП', unit: 'шт', price: 250000, category: 'misc_ext' },
        'wrk_ms_modular_medical': { name: 'Монтаж модульного медпункта', unit: 'шт', price: 550000, category: 'misc_ext' },
        'wrk_ms_prefab_sip_wall': { name: 'Монтаж SIP-панели (стена)', unit: 'м²', price: 1800, category: 'misc_ext' },
        'wrk_ms_prefab_sip_roof': { name: 'Монтаж SIP-панели (кровля)', unit: 'м²', price: 2200, category: 'misc_ext' },
        'wrk_ms_prefab_clt_wall': { name: 'Монтаж CLT-панели', unit: 'м²', price: 5500, category: 'misc_ext' },
        // === ВРЕМЕННЫЕ СООРУЖЕНИЯ ===
        'wrk_ms_temp_fence_2m': { name: 'Установка временного ограждения 2м', unit: 'м.п.', price: 350, category: 'misc_ext' },
        'wrk_ms_temp_road': { name: 'Устройство временной дороги (ж/б плиты)', unit: 'м²', price: 2500, category: 'misc_ext' },
        'wrk_ms_temp_road_crushed': { name: 'Устройство временной дороги (щебень)', unit: 'м²', price: 850, category: 'misc_ext' },
        'wrk_ms_temp_power': { name: 'Временное электроснабжение стройплощадки', unit: 'компл.', price: 120000, category: 'misc_ext' },
        'wrk_ms_temp_water': { name: 'Временное водоснабжение стройплощадки', unit: 'компл.', price: 85000, category: 'misc_ext' },
        'wrk_ms_scaffold_frame': { name: 'Монтаж рамных лесов', unit: 'м²', price: 250, category: 'misc_ext' },
        'wrk_ms_scaffold_modular': { name: 'Монтаж хомутовых лесов', unit: 'м²', price: 350, category: 'misc_ext' },
        'wrk_ms_scaffold_hanging': { name: 'Монтаж подвесных лесов', unit: 'м²', price: 450, category: 'misc_ext' },
        'wrk_ms_scaffold_tower': { name: 'Установка вышки-туры', unit: 'шт', price: 5500, category: 'misc_ext' },
        // === КАМИНЫИПЕЧИ ===
        'wrk_ms_fireplace_brick': { name: 'Кладка кирпичного камина', unit: 'шт', price: 120000, category: 'misc_ext' },
        'wrk_ms_stove_heating': { name: 'Кладка отопительной печи', unit: 'шт', price: 85000, category: 'misc_ext' },
        'wrk_ms_bbq_zone': { name: 'Строительство зоны барбекю', unit: 'шт', price: 120000, category: 'misc_ext' },
        // === ЗАБОРЫ И ОГРАЖДЕНИЯ (РАСШИРЕННЫЕ) ===
        'wrk_ms_fence_3d_panel': { name: 'Забор 3D (сварная сетка)', unit: 'м.п.', price: 2800, category: 'misc_ext' },
        'wrk_ms_fence_chain_link': { name: 'Забор из сетки-рабицы', unit: 'м.п.', price: 1500, category: 'misc_ext' },
        'wrk_ms_fence_brick': { name: 'Забор кирпичный на фундаменте', unit: 'м.п.', price: 12000, category: 'misc_ext' },
        'wrk_ms_fence_euro_stakes': { name: 'Забор из евроштакетника', unit: 'м.п.', price: 2500, category: 'misc_ext' },
        'wrk_ms_fence_post_concrete': { name: 'Бетонирование столба забора', unit: 'шт', price: 1500, category: 'misc_ext' },
        // === МАЛЫЕ АРХИТЕКТУРНЫЕ ФОРМЫ ===
        'wrk_ms_maf_bench': { name: 'Установка скамейки', unit: 'шт', price: 5500, category: 'misc_ext' },
        'wrk_ms_maf_pergola': { name: 'Строительство перголы', unit: 'шт', price: 85000, category: 'misc_ext' },
        'wrk_ms_maf_gazebo': { name: 'Строительство беседки', unit: 'шт', price: 120000, category: 'misc_ext' },
        'wrk_ms_maf_playground': { name: 'Монтаж детской площадки (комплекс)', unit: 'компл.', price: 550000, category: 'misc_ext' },
        'wrk_ms_maf_fountain': { name: 'Устройство фонтана', unit: 'шт', price: 350000, category: 'misc_ext' },
        'wrk_ms_maf_flagpole': { name: 'Установка флагштока', unit: 'шт', price: 25000, category: 'misc_ext' }
    };
})();
