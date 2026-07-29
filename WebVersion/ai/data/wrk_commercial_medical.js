// === ФАЗА 3: КОММЕРЧЕСКОЕ СТРОИТЕЛЬСТВО, МЕДИЦИНСКИЕ ПОМЕЩЕНИЯ, ЧИСТЫЕ КОМНАТЫ, СКЛАДЫ (200 поз.) ===
(function () {
    // === КОММЕРЧЕСКОЕ СТРОИТЕЛЬСТВО ===
    window.AI_WRK_COMMERCIAL = {
        // Перегородки коммерческие
        'wrk_com_partition_glass_single': { name: 'Стеклянная перегородка офис (одинарн.)', unit: 'м²', price: 3000, category: 'commercial' },
        'wrk_com_partition_glass_double': { name: 'Стеклянная перегородка офис (двойная)', unit: 'м²', price: 5000, category: 'commercial' },
        'wrk_com_partition_alu': { name: 'Алюминиевая перегородка', unit: 'м²', price: 3500, category: 'commercial' },
        'wrk_com_partition_mobile': { name: 'Перегородка трансформируемая', unit: 'м²', price: 5000, category: 'commercial' },
        'wrk_com_partition_modular': { name: 'Модульная перегородка', unit: 'м²', price: 2500, category: 'commercial' },
        // Подвесные потолки комм.
        'wrk_com_ceil_grid_t24': { name: 'Потолок Grid T24 (подвесной)', unit: 'м²', price: 200, category: 'commercial' },
        'wrk_com_ceil_metal_tegular': { name: 'Потолок металлический Tegular', unit: 'м²', price: 350, category: 'commercial' },
        'wrk_com_ceil_acoustic_a': { name: 'Акустический потолок класс A', unit: 'м²', price: 400, category: 'commercial' },
        'wrk_com_ceil_acoustic_b': { name: 'Акустический потолок класс B', unit: 'м²', price: 300, category: 'commercial' },
        'wrk_com_ceil_baffle_lin': { name: 'Баффл линейный', unit: 'м.п.', price: 200, category: 'commercial' },
        'wrk_com_ceil_cloud': { name: 'Потолочный island/cloud', unit: 'шт', price: 3000, category: 'commercial' },
        // Фальшпол
        'wrk_com_raised_floor_600': { name: 'Фальшпол 600×600 (стандарт)', unit: 'м²', price: 300, category: 'commercial' },
        'wrk_com_raised_floor_hpl': { name: 'Фальшпол HPL покрытие', unit: 'м²', price: 400, category: 'commercial' },
        'wrk_com_raised_floor_carpet': { name: 'Фальшпол + ковровое покрытие', unit: 'м²', price: 450, category: 'commercial' },
        'wrk_com_raised_floor_tile': { name: 'Фальшпол + виниловая плитка', unit: 'м²', price: 450, category: 'commercial' },
        // Торговые помещения
        'wrk_com_retail_shopfront': { name: 'Витрина торговая (монтаж)', unit: 'м²', price: 5000, category: 'commercial' },
        'wrk_com_retail_counter': { name: 'Торговая стойка/ресепшн', unit: 'м.п.', price: 3000, category: 'commercial' },
        'wrk_com_retail_signage_int': { name: 'Интерьерная вывеска', unit: 'шт', price: 5000, category: 'commercial' },
        'wrk_com_retail_signage_ext': { name: 'Наружная вывеска', unit: 'шт', price: 10000, category: 'commercial' },
        'wrk_com_retail_signage_led': { name: 'LED-вывеска', unit: 'шт', price: 15000, category: 'commercial' },
        // Ресторан / общепит
        'wrk_com_food_hood': { name: 'Промышленная вытяжка (кухня)', unit: 'шт', price: 10000, category: 'commercial' },
        'wrk_com_food_cold_room': { name: 'Холодильная камера (монтаж)', unit: 'шт', price: 20000, category: 'commercial' },
        'wrk_com_food_kitchen_steel': { name: 'Обшивка кухни нержавейкой', unit: 'м²', price: 800, category: 'commercial' },
        'wrk_com_food_floor_drain': { name: 'Лоток водосброса (кухня)', unit: 'м.п.', price: 500, category: 'commercial' },
        // Складские
        'wrk_com_warehouse_rack': { name: 'Стеллаж паллетный (монтаж)', unit: 'секция', price: 3000, category: 'commercial' },
        'wrk_com_warehouse_mezzanine': { name: 'Антресольный этаж (мезонин)', unit: 'м²', price: 2000, category: 'commercial' },
        'wrk_com_warehouse_dock': { name: 'Доклевеллер (погрузочная рампа)', unit: 'шт', price: 30000, category: 'commercial' },
        'wrk_com_warehouse_door_sect': { name: 'Секционные ворота (склад)', unit: 'шт', price: 15000, category: 'commercial' },
        'wrk_com_warehouse_floor_epoxy': { name: 'Пол складской (эпоксид)', unit: 'м²', price: 400, category: 'commercial' },
        'wrk_com_warehouse_floor_top': { name: 'Пол складской (топпинг)', unit: 'м²', price: 100, category: 'commercial' },
        // Парковки
        'wrk_com_parking_marking': { name: 'Разметка парковки', unit: 'место', price: 300, category: 'commercial' },
        'wrk_com_parking_barrier': { name: 'Парковочный столбик/барьер', unit: 'шт', price: 500, category: 'commercial' },
        'wrk_com_parking_speed_bump': { name: 'Лежачий полицейский (парковка)', unit: 'шт', price: 2000, category: 'commercial' },
        'wrk_com_parking_sign': { name: 'Навигационный знак (парковка)', unit: 'шт', price: 500, category: 'commercial' }
    };

    // === МЕДИЦИНСКИЕ ПОМЕЩЕНИЯ ===
    window.AI_WRK_MEDICAL = {
        'wrk_med_wall_panel_hpl': { name: 'Стеновая панель HPL (медицинская)', unit: 'м²', price: 500, category: 'medical' },
        'wrk_med_wall_clean_paint': { name: 'Покраска стен (антибактериальная)', unit: 'м²', price: 80, category: 'medical' },
        'wrk_med_floor_pvc_conduct': { name: 'Антистатический пол ПВХ', unit: 'м²', price: 400, category: 'medical' },
        'wrk_med_floor_linoleum_med': { name: 'Линолеум медицинский', unit: 'м²', price: 200, category: 'medical' },
        'wrk_med_ceil_clean': { name: 'Потолок чистой комнаты', unit: 'м²', price: 500, category: 'medical' },
        'wrk_med_door_hermet': { name: 'Дверь герметичная (медицинская)', unit: 'шт', price: 10000, category: 'medical' },
        'wrk_med_door_auto': { name: 'Автоматическая дверь (медицинская)', unit: 'шт', price: 15000, category: 'medical' },
        'wrk_med_air_hepa': { name: 'HEPA-фильтр приточный (монтаж)', unit: 'шт', price: 5000, category: 'medical' },
        'wrk_med_air_laminar': { name: 'Ламинарный поток (монтаж)', unit: 'шт', price: 20000, category: 'medical' },
        'wrk_med_gas_oxygen': { name: 'Медицинский газопровод O₂', unit: 'м.п.', price: 500, category: 'medical' },
        'wrk_med_gas_vacuum': { name: 'Медицинский вакуум', unit: 'м.п.', price: 500, category: 'medical' },
        'wrk_med_gas_air': { name: 'Медицинский сжатый воздух', unit: 'м.п.', price: 500, category: 'medical' },
        'wrk_med_gas_outlet': { name: 'Точка забора мед. газа', unit: 'шт', price: 2000, category: 'medical' },
        'wrk_med_gas_station': { name: 'Станция мед. газов', unit: 'шт', price: 100000, category: 'medical' },
        'wrk_med_cove_base': { name: 'Плинтус скругл. (медицинский)', unit: 'м.п.', price: 100, category: 'medical' },
        'wrk_med_corner_protect': { name: 'Отбойник/угловая защита', unit: 'м.п.', price: 80, category: 'medical' },
        'wrk_med_handrail': { name: 'Поручень медицинский', unit: 'м.п.', price: 200, category: 'medical' },
        'wrk_med_curtain_rail': { name: 'Потолочная шторная рейка (палата)', unit: 'м.п.', price: 100, category: 'medical' },
        'wrk_med_scrub_sink': { name: 'Хирургическая мойка (установка)', unit: 'шт', price: 5000, category: 'medical' }
    };

    // === ЧИСТЫЕ КОМНАТЫ / СЕРВЕРНЫЕ ===
    window.AI_WRK_CLEANROOM = {
        'wrk_cr_wall_panel': { name: 'Сэндвич-панель чистой комнаты', unit: 'м²', price: 1000, category: 'cleanroom' },
        'wrk_cr_ceil_panel': { name: 'Потолочная панель чистой комнаты', unit: 'м²', price: 1200, category: 'cleanroom' },
        'wrk_cr_floor_epoxy_esd': { name: 'ESD-пол (антистатич. эпоксидный)', unit: 'м²', price: 600, category: 'cleanroom' },
        'wrk_cr_floor_vinyl_esd': { name: 'ESD-пол (антистатич. виниловый)', unit: 'м²', price: 500, category: 'cleanroom' },
        'wrk_cr_air_ahu': { name: 'Приточная установка (чистая комната)', unit: 'шт', price: 50000, category: 'cleanroom' },
        'wrk_cr_air_ffu': { name: 'FFU (Fan Filter Unit)', unit: 'шт', price: 10000, category: 'cleanroom' },
        'wrk_cr_air_hepa_h13': { name: 'HEPA фильтр H13', unit: 'шт', price: 3000, category: 'cleanroom' },
        'wrk_cr_air_hepa_h14': { name: 'HEPA фильтр H14', unit: 'шт', price: 5000, category: 'cleanroom' },
        'wrk_cr_airlock': { name: 'Воздушный шлюз (монтаж)', unit: 'шт', price: 30000, category: 'cleanroom' },
        'wrk_cr_pass_through': { name: 'Перекладная камера (передаточное окно)', unit: 'шт', price: 5000, category: 'cleanroom' },
        // Серверные
        'wrk_cr_server_rack': { name: 'Монтаж серверной стойки', unit: 'шт', price: 5000, category: 'cleanroom' },
        'wrk_cr_server_ups': { name: 'Монтаж ИБП серверной', unit: 'шт', price: 10000, category: 'cleanroom' },
        'wrk_cr_server_cooling': { name: 'Прецизионный кондиционер (серверная)', unit: 'шт', price: 50000, category: 'cleanroom' },
        'wrk_cr_server_fire_gas': { name: 'Газовое пожаротушение (серверная)', unit: 'м³', price: 1000, category: 'cleanroom' },
        'wrk_cr_server_floor_raised': { name: 'Фальшпол серверной', unit: 'м²', price: 500, category: 'cleanroom' },
        'wrk_cr_server_grounding': { name: 'Заземление серверной', unit: 'объект', price: 5000, category: 'cleanroom' },
        'wrk_cr_server_access_ctrl': { name: 'СКУД серверной', unit: 'объект', price: 10000, category: 'cleanroom' },
        'wrk_cr_server_monitoring': { name: 'Система мониторинга (серверная)', unit: 'объект', price: 10000, category: 'cleanroom' }
    };

    // === АВТОМАТИЧЕСКИЕ ДВЕРИ / ТУРНИКЕТЫ ===
    window.AI_WRK_AUTO_DOOR = {
        'wrk_auto_door_slide_1': { name: 'Автоматическая дверь раздвижная (одна)', unit: 'шт', price: 30000, category: 'auto_door' },
        'wrk_auto_door_slide_2': { name: 'Автоматическая дверь раздвижная (двойная)', unit: 'шт', price: 50000, category: 'auto_door' },
        'wrk_auto_door_revolving': { name: 'Вращающаяся дверь (карусельная)', unit: 'шт', price: 100000, category: 'auto_door' },
        'wrk_auto_door_swing': { name: 'Автоматическая распашная дверь', unit: 'шт', price: 25000, category: 'auto_door' },
        'wrk_auto_door_speed': { name: 'Скоростные рольставни (промышл.)', unit: 'шт', price: 50000, category: 'auto_door' },
        'wrk_auto_door_strip': { name: 'ПВХ-завеса (полосовая)', unit: 'м²', price: 500, category: 'auto_door' },
        'wrk_auto_turnstile_tripod': { name: 'Турникет-трипод', unit: 'шт', price: 15000, category: 'auto_door' },
        'wrk_auto_turnstile_full': { name: 'Полноростовой турникет', unit: 'шт', price: 50000, category: 'auto_door' },
        'wrk_auto_turnstile_speed': { name: 'Скоростной проход', unit: 'шт', price: 80000, category: 'auto_door' }
    };
})();
