// === КАТАЛОГ: ДЕКОРАТИВНЫЕ РАБОТЫ, БАССЕЙНЫ/САУНЫ, УБОРКА, ГЕОДЕЗИЯ, ВРЕМЯНКИ (Фаза 1: 5 файлов в 1) ===
(function () {
    // === wrk_decorative — Декоративные работы (30 поз.) ===
    window.AI_WRK_DECORATIVE = {
        'wrk_dec_niche_gkl': { name: 'Ниша из ГКЛ (простая)', unit: 'шт', price: 1000, category: 'decorative' },
        'wrk_dec_niche_gkl_light': { name: 'Ниша из ГКЛ с подсветкой', unit: 'шт', price: 1500, category: 'decorative' },
        'wrk_dec_arch_gkl': { name: 'Арка из ГКЛ', unit: 'шт', price: 2000, category: 'decorative' },
        'wrk_dec_arch_brick': { name: 'Арка кирпичная', unit: 'шт', price: 3000, category: 'decorative' },
        'wrk_dec_column_gkl': { name: 'Колонна из ГКЛ', unit: 'шт', price: 2000, category: 'decorative' },
        'wrk_dec_column_stone': { name: 'Колонна из камня', unit: 'шт', price: 5000, category: 'decorative' },
        'wrk_dec_fireplace_portal': { name: 'Портал камина (декоративный)', unit: 'шт', price: 5000, category: 'decorative' },
        'wrk_dec_wall_panel_wood': { name: 'Стеновые панели из шпона', unit: 'м²', price: 500, category: 'decorative' },
        'wrk_dec_wall_panel_leather': { name: 'Стеновые панели из экокожи', unit: 'м²', price: 800, category: 'decorative' },
        'wrk_dec_wall_panel_fabric': { name: 'Стеновые панели тканевые', unit: 'м²', price: 600, category: 'decorative' },
        'wrk_dec_ceiling_rosette': { name: 'Монтаж потолочной розетки', unit: 'шт', price: 300, category: 'decorative' },
        'wrk_dec_ceiling_cornice': { name: 'Монтаж лепного карниза', unit: 'м.п.', price: 150, category: 'decorative' },
        'wrk_dec_ceiling_medallion': { name: 'Монтаж потолочного медальона', unit: 'шт', price: 500, category: 'decorative' },
        'wrk_dec_accent_wall': { name: 'Акцентная стена (комплекс)', unit: 'м²', price: 500, category: 'decorative' },
        'wrk_dec_shelf_hidden': { name: 'Скрытые полки (монтаж)', unit: 'шт', price: 500, category: 'decorative' },
        'wrk_dec_led_strip_instal': { name: 'Монтаж LED-ленты (линейная)', unit: 'м.п.', price: 100, category: 'decorative' },
        'wrk_dec_led_profile': { name: 'LED профиль в стене/потолке', unit: 'м.п.', price: 200, category: 'decorative' },
        'wrk_dec_light_line_ceiling': { name: 'Световые линии на потолке', unit: 'м.п.', price: 400, category: 'decorative' },
        'wrk_dec_resin_table': { name: 'Столешница из эпоксидной смолы', unit: 'шт', price: 5000, category: 'decorative' },
        'wrk_dec_resin_floor': { name: 'Пол из эпоксидной смолы (арт)', unit: 'м²', price: 2000, category: 'decorative' }
    };

    // === wrk_pool — Бассейны, сауны (30 поз.) ===
    window.AI_WRK_POOL = {
        'wrk_pool_excav': { name: 'Котлован под бассейн', unit: 'м³', price: 300, category: 'pool' },
        'wrk_pool_concrete_bowl': { name: 'Бетонирование чаши бассейна', unit: 'м³', price: 3000, category: 'pool' },
        'wrk_pool_waterproof': { name: 'Гидроизоляция бассейна', unit: 'м²', price: 500, category: 'pool' },
        'wrk_pool_tile': { name: 'Облицовка бассейна плиткой', unit: 'м²', price: 800, category: 'pool' },
        'wrk_pool_mosaic': { name: 'Облицовка бассейна мозаикой', unit: 'м²', price: 1200, category: 'pool' },
        'wrk_pool_film_pvc': { name: 'ПВХ-плёнка бассейна', unit: 'м²', price: 500, category: 'pool' },
        'wrk_pool_pump_install': { name: 'Монтаж насосного оборудования', unit: 'компл.', price: 5000, category: 'pool' },
        'wrk_pool_filter_sand': { name: 'Установка песчаного фильтра', unit: 'шт', price: 3000, category: 'pool' },
        'wrk_pool_heater': { name: 'Установка подогрева бассейна', unit: 'шт', price: 5000, category: 'pool' },
        'wrk_pool_lighting': { name: 'Подсветка бассейна', unit: 'точка', price: 2000, category: 'pool' },
        'wrk_pool_cover': { name: 'Монтаж покрывала бассейна', unit: 'м²', price: 500, category: 'pool' },
        'wrk_pool_cover_auto': { name: 'Авто-покрывало бассейна', unit: 'компл.', price: 30000, category: 'pool' },
        'wrk_pool_overflow': { name: 'Переливной лоток', unit: 'м.п.', price: 1000, category: 'pool' },
        'wrk_pool_skimmer': { name: 'Монтаж скиммера', unit: 'шт', price: 1500, category: 'pool' },
        'wrk_pool_pipe': { name: 'Обвязка бассейна (трубы)', unit: 'м.п.', price: 100, category: 'pool' },
        // Сауна / баня
        'wrk_sauna_frame': { name: 'Каркас сауны', unit: 'м²', price: 500, category: 'pool' },
        'wrk_sauna_insul': { name: 'Утепление сауны (фольга)', unit: 'м²', price: 150, category: 'pool' },
        'wrk_sauna_lining_alder': { name: 'Обшивка сауны ольхой', unit: 'м²', price: 400, category: 'pool' },
        'wrk_sauna_lining_cedar': { name: 'Обшивка сауны кедром', unit: 'м²', price: 600, category: 'pool' },
        'wrk_sauna_lining_abash': { name: 'Обшивка сауны абашем', unit: 'м²', price: 500, category: 'pool' },
        'wrk_sauna_bench_2lvl': { name: 'Полок 2-уровневый', unit: 'м.п.', price: 800, category: 'pool' },
        'wrk_sauna_bench_3lvl': { name: 'Полок 3-уровневый', unit: 'м.п.', price: 1200, category: 'pool' },
        'wrk_sauna_heater_elec': { name: 'Монтаж электрокаменки', unit: 'шт', price: 2000, category: 'pool' },
        'wrk_sauna_heater_wood': { name: 'Монтаж дровяной печи для бани', unit: 'шт', price: 5000, category: 'pool' },
        'wrk_sauna_door': { name: 'Установка стеклянной двери сауны', unit: 'шт', price: 2000, category: 'pool' },
        'wrk_sauna_floor_tile': { name: 'Плитка на полу сауны', unit: 'м²', price: 600, category: 'pool' },
        'wrk_sauna_drain': { name: 'Трап / слив в сауне', unit: 'шт', price: 500, category: 'pool' },
        'wrk_hammam_bench': { name: 'Лежак хамама', unit: 'шт', price: 10000, category: 'pool' },
        'wrk_hammam_steam_gen': { name: 'Парогенератор хамама (монтаж)', unit: 'шт', price: 5000, category: 'pool' },
        'wrk_hammam_tile': { name: 'Облицовка хамама мозаикой', unit: 'м²', price: 1500, category: 'pool' }
    };

    // === wrk_cleaning — Уборка, подготовка (20 поз.) ===
    window.AI_WRK_CLEANING = {
        'wrk_clean_rough': { name: 'Уборка после черновых работ', unit: 'м²', price: 30, category: 'cleaning' },
        'wrk_clean_finish': { name: 'Уборка после чистовых работ', unit: 'м²', price: 50, category: 'cleaning' },
        'wrk_clean_final': { name: 'Генеральная уборка после ремонта', unit: 'м²', price: 80, category: 'cleaning' },
        'wrk_clean_window': { name: 'Мойка окон после ремонта', unit: 'шт', price: 200, category: 'cleaning' },
        'wrk_clean_floor_wash': { name: 'Мытьё полов', unit: 'м²', price: 10, category: 'cleaning' },
        'wrk_clean_facade_wash': { name: 'Мойка фасада', unit: 'м²', price: 50, category: 'cleaning' },
        'wrk_clean_debris_bag': { name: 'Вынос мусора (мешки)', unit: 'мешок', price: 50, category: 'cleaning' },
        'wrk_clean_debris_container': { name: 'Вывоз мусора (контейнер 8м³)', unit: 'рейс', price: 5000, category: 'cleaning' },
        'wrk_clean_debris_truck': { name: 'Вывоз мусора (самосвал)', unit: 'рейс', price: 8000, category: 'cleaning' },
        'wrk_clean_dust_removal': { name: 'Обеспыливание помещения', unit: 'м²', price: 10, category: 'cleaning' },
        'wrk_clean_protect_floor': { name: 'Защита пола плёнкой/картоном', unit: 'м²', price: 15, category: 'cleaning' },
        'wrk_clean_protect_furniture': { name: 'Укрытие мебели плёнкой', unit: 'шт', price: 100, category: 'cleaning' },
        'wrk_clean_furniture_move': { name: 'Перемещение мебели', unit: 'шт', price: 200, category: 'cleaning' }
    };

    // === wrk_geodetic — Геодезия (15 поз.) ===
    window.AI_WRK_GEODETIC = {
        'wrk_geo_survey_flat': { name: 'Замер квартиры', unit: 'объект', price: 2000, category: 'geodetic' },
        'wrk_geo_survey_house': { name: 'Замер частного дома', unit: 'объект', price: 5000, category: 'geodetic' },
        'wrk_geo_survey_plot': { name: 'Топографическая съёмка участка (до 10 сот.)', unit: 'объект', price: 10000, category: 'geodetic' },
        'wrk_geo_survey_plot_lg': { name: 'Топографическая съёмка (10-50 сот.)', unit: 'объект', price: 20000, category: 'geodetic' },
        'wrk_geo_layout_axes': { name: 'Разбивка осей здания', unit: 'объект', price: 5000, category: 'geodetic' },
        'wrk_geo_layout_foundation': { name: 'Геодезическая разбивка фундамента', unit: 'объект', price: 3000, category: 'geodetic' },
        'wrk_geo_level_check': { name: 'Проверка нивелиром (отметки)', unit: 'объект', price: 2000, category: 'geodetic' },
        'wrk_geo_as_built': { name: 'Исполнительная съёмка', unit: 'объект', price: 5000, category: 'geodetic' },
        'wrk_geo_monitoring': { name: 'Геодезический мониторинг', unit: 'мес.', price: 10000, category: 'geodetic' },
        'wrk_geo_boundary': { name: 'Вынос границ участка', unit: 'точка', price: 1000, category: 'geodetic' },
        'wrk_geo_cadastral': { name: 'Кадастровые работы', unit: 'объект', price: 15000, category: 'geodetic' },
        'wrk_geo_soil_test': { name: 'Геология (инж.-геологические изыскания)', unit: 'объект', price: 25000, category: 'geodetic' }
    };

    // === wrk_temp — Временные сооружения (20 поз.) ===
    window.AI_WRK_TEMP = {
        'wrk_temp_fence_install': { name: 'Временное ограждение стройплощадки', unit: 'м.п.', price: 150, category: 'temp' },
        'wrk_temp_fence_demo': { name: 'Демонтаж временного ограждения', unit: 'м.п.', price: 50, category: 'temp' },
        'wrk_temp_road': { name: 'Временная подъездная дорога', unit: 'м²', price: 200, category: 'temp' },
        'wrk_temp_power_connect': { name: 'Временное электроснабжение (подключение)', unit: 'объект', price: 5000, category: 'temp' },
        'wrk_temp_water_connect': { name: 'Временное водоснабжение', unit: 'объект', price: 3000, category: 'temp' },
        'wrk_temp_toilet': { name: 'Установка биотуалета', unit: 'шт', price: 2000, category: 'temp' },
        'wrk_temp_cabin': { name: 'Установка бытовки', unit: 'шт', price: 5000, category: 'temp' },
        'wrk_temp_container': { name: 'Установка контейнера', unit: 'шт', price: 5000, category: 'temp' },
        'wrk_temp_scaffold_rent': { name: 'Аренда лесов (месяц)', unit: 'м²/мес.', price: 30, category: 'temp' },
        'wrk_temp_tower_rent': { name: 'Аренда вышки-туры (месяц)', unit: 'шт/мес.', price: 3000, category: 'temp' },
        'wrk_temp_crane_rent': { name: 'Аренда автокрана (смена)', unit: 'смена', price: 20000, category: 'temp' },
        'wrk_temp_excavator_rent': { name: 'Аренда экскаватора (смена)', unit: 'смена', price: 15000, category: 'temp' },
        'wrk_temp_manipulator_rent': { name: 'Аренда манипулятора (рейс)', unit: 'рейс', price: 8000, category: 'temp' },
        'wrk_temp_generator_rent': { name: 'Аренда генератора (сутки)', unit: 'сутки', price: 1000, category: 'temp' },
        'wrk_temp_pump_rent': { name: 'Аренда насоса (сутки)', unit: 'сутки', price: 500, category: 'temp' },
        'wrk_temp_delivery_city': { name: 'Доставка материала (город)', unit: 'рейс', price: 3000, category: 'temp' },
        'wrk_temp_delivery_suburb': { name: 'Доставка материала (пригород)', unit: 'рейс', price: 5000, category: 'temp' },
        'wrk_temp_lifting_manual': { name: 'Подъём материала вручную (этаж)', unit: 'этаж', price: 500, category: 'temp' },
        'wrk_temp_lifting_elevator': { name: 'Подъём материала на подъёмнике', unit: 'тонна', price: 1000, category: 'temp' }
    };
})();
