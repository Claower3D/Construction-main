// === ЧИСТЫЕ ПОМЕЩЕНИЯ — фарма, электроника, пищевое пр-во, лаборатории (50 поз.) ===
(function () {
    window.AI_WRK_CLEANROOM = {
        // === ПАНЕЛИ/СТЕНЫ === 1-8
        'wrk_cr_panel_wall_50': { name: 'Монтаж сэндвич-панели стеновой 50мм (чист.)', unit: 'м²', price: 3500, category: 'cleanroom' },
        'wrk_cr_panel_wall_80': { name: 'Монтаж сэндвич-панели стеновой 80мм (чист.)', unit: 'м²', price: 4500, category: 'cleanroom' },
        'wrk_cr_panel_wall_100': { name: 'Монтаж сэндвич-панели стеновой 100мм (чист.)', unit: 'м²', price: 5500, category: 'cleanroom' },
        'wrk_cr_panel_ceil_50': { name: 'Монтаж потолочной панели 50мм', unit: 'м²', price: 4500, category: 'cleanroom' },
        'wrk_cr_panel_ceil_80': { name: 'Монтаж потолочной панели 80мм', unit: 'м²', price: 5500, category: 'cleanroom' },
        'wrk_cr_corner_int': { name: 'Монтаж внутреннего угла (радиусный)', unit: 'м.п.', price: 1200, category: 'cleanroom' },
        'wrk_cr_corner_ext': { name: 'Монтаж наружного угла', unit: 'м.п.', price: 1200, category: 'cleanroom' },
        'wrk_cr_coving': { name: 'Монтаж плинтуса (радиусный скос)', unit: 'м.п.', price: 850, category: 'cleanroom' },
        // === ПОЛЫ === 9-14
        'wrk_cr_floor_epoxy_2': { name: 'Наливной эпоксидный пол (2мм)', unit: 'м²', price: 1500, category: 'cleanroom' },
        'wrk_cr_floor_epoxy_4': { name: 'Наливной эпоксидный пол (4мм)', unit: 'м²', price: 2500, category: 'cleanroom' },
        'wrk_cr_floor_pu': { name: 'Полиуретановый пол', unit: 'м²', price: 2500, category: 'cleanroom' },
        'wrk_cr_floor_vinyl': { name: 'Антистатический виниловый пол', unit: 'м²', price: 1800, category: 'cleanroom' },
        'wrk_cr_floor_esd': { name: 'ESD пол (антистатический)', unit: 'м²', price: 3500, category: 'cleanroom' },
        'wrk_cr_floor_coving': { name: 'Устройство галтели пол-стена', unit: 'м.п.', price: 550, category: 'cleanroom' },
        // === ДВЕРИ / ОКНА === 15-20
        'wrk_cr_door_single': { name: 'Дверь одностворчатая герметичная', unit: 'шт', price: 55000, category: 'cleanroom' },
        'wrk_cr_door_double': { name: 'Дверь двустворчатая герметичная', unit: 'шт', price: 85000, category: 'cleanroom' },
        'wrk_cr_door_sliding': { name: 'Дверь автоматическая сдвижная', unit: 'шт', price: 120000, category: 'cleanroom' },
        'wrk_cr_door_roll_up': { name: 'Дверь рулонная (быстросъёмная)', unit: 'шт', price: 85000, category: 'cleanroom' },
        'wrk_cr_window_flush': { name: 'Окно заподлицо (для чист. пом.)', unit: 'шт', price: 25000, category: 'cleanroom' },
        'wrk_cr_pass_box': { name: 'Передаточное окно (пасс-бокс)', unit: 'шт', price: 55000, category: 'cleanroom' },
        // === ВЕНТИЛЯЦИЯ ЧИСТЫХ ПОМЕЩЕНИЙ === 21-32
        'wrk_cr_ahu_small': { name: 'Приточная установка с HEPA (до 3000м³/ч)', unit: 'шт', price: 550000, category: 'cleanroom' },
        'wrk_cr_ahu_medium': { name: 'Приточная установка с HEPA (до 10000м³/ч)', unit: 'шт', price: 1200000, category: 'cleanroom' },
        'wrk_cr_ahu_large': { name: 'Приточная установка с HEPA (до 30000м³/ч)', unit: 'шт', price: 2500000, category: 'cleanroom' },
        'wrk_cr_ffu': { name: 'Fan Filter Unit (FFU)', unit: 'шт', price: 55000, category: 'cleanroom' },
        'wrk_cr_hepa_terminal': { name: 'HEPA фильтр терминальный', unit: 'шт', price: 25000, category: 'cleanroom' },
        'wrk_cr_ulpa_terminal': { name: 'ULPA фильтр терминальный', unit: 'шт', price: 55000, category: 'cleanroom' },
        'wrk_cr_laf_bench': { name: 'Ламинарный бокс (верстак)', unit: 'шт', price: 250000, category: 'cleanroom' },
        'wrk_cr_laf_cabinet': { name: 'Ламинарный шкаф', unit: 'шт', price: 350000, category: 'cleanroom' },
        'wrk_cr_damper_pressure': { name: 'Клапан поддержания давления', unit: 'шт', price: 12000, category: 'cleanroom' },
        'wrk_cr_duct_ss': { name: 'Воздуховод из нержавеющей стали', unit: 'м²', price: 3500, category: 'cleanroom' },
        'wrk_cr_diffuser_hepa': { name: 'Диффузор с HEPA фильтром', unit: 'шт', price: 35000, category: 'cleanroom' },
        'wrk_cr_return_grille': { name: 'Вытяжная решётка с фильтром', unit: 'шт', price: 5500, category: 'cleanroom' },
        // === ШЛЮЗЫ / СПЕЦПОМЕЩЕНИЯ === 33-38
        'wrk_cr_airlock_personnel': { name: 'Устройство воздушного шлюза (персонал)', unit: 'шт', price: 250000, category: 'cleanroom' },
        'wrk_cr_airlock_material': { name: 'Устройство мат. шлюза', unit: 'шт', price: 150000, category: 'cleanroom' },
        'wrk_cr_air_shower': { name: 'Монтаж воздушного душа', unit: 'шт', price: 350000, category: 'cleanroom' },
        'wrk_cr_gowning_room': { name: 'Оборудование гардеробной', unit: 'компл.', price: 120000, category: 'cleanroom' },
        'wrk_cr_shoe_cleaner': { name: 'Липкие коврики / очиститель обуви', unit: 'компл.', price: 15000, category: 'cleanroom' },
        'wrk_cr_hand_dryer': { name: 'Сушилка для рук (бесконтактная)', unit: 'шт', price: 15000, category: 'cleanroom' },
        // === МОНИТОРИНГ === 39-44
        'wrk_cr_particle_counter': { name: 'Установка счётчика частиц', unit: 'шт', price: 120000, category: 'cleanroom' },
        'wrk_cr_dp_display': { name: 'Индикатор перепада давления', unit: 'шт', price: 5500, category: 'cleanroom' },
        'wrk_cr_temp_hum_sensor': { name: 'Датчик температуры/влажности', unit: 'шт', price: 5500, category: 'cleanroom' },
        'wrk_cr_monitoring_system': { name: 'Система мониторинга (ПО + контроллер)', unit: 'компл.', price: 250000, category: 'cleanroom' },
        'wrk_cr_data_logger': { name: 'Автономный регистратор параметров', unit: 'шт', price: 25000, category: 'cleanroom' },
        // === ПНР / ВАЛИДАЦИЯ === 45-50
        'wrk_cr_classification_test': { name: 'Классификация чистого помещения', unit: 'помещение', price: 55000, category: 'cleanroom' },
        'wrk_cr_hepa_leak_test': { name: 'Тест целостности HEPA (DOP/PAO)', unit: 'фильтр', price: 5500, category: 'cleanroom' },
        'wrk_cr_air_velocity_test': { name: 'Измерение скорости воздушного потока', unit: 'точка', price: 1500, category: 'cleanroom' },
        'wrk_cr_recovery_test': { name: 'Тест восстановления чистоты', unit: 'помещение', price: 15000, category: 'cleanroom' },
        'wrk_cr_iq_oq': { name: 'Квалификация IQ/OQ', unit: 'компл.', price: 120000, category: 'cleanroom' },
        'wrk_cr_pq': { name: 'Квалификация PQ', unit: 'компл.', price: 85000, category: 'cleanroom' }
    };
})();
