// === МЕДИЦИНСКИЕ УЧРЕЖДЕНИЯ — операционные, палаты, лаборатории (50 поз.) ===
(function () {
    window.AI_WRK_MEDICAL = {
        // === ОПЕРАЦИОННЫЕ === 1-10
        'wrk_med_or_panel_wall': { name: 'Панели операционной (антибакт.)', unit: 'м²', price: 5500, category: 'medical' },
        'wrk_med_or_panel_ceil': { name: 'Потолок операционной (гермет.)', unit: 'м²', price: 5500, category: 'medical' },
        'wrk_med_or_floor_conduct': { name: 'Пол операционной (токопроводящий)', unit: 'м²', price: 3500, category: 'medical' },
        'wrk_med_or_door_hermetic': { name: 'Дверь герметичная операционной', unit: 'шт', price: 120000, category: 'medical' },
        'wrk_med_or_laf_ceiling': { name: 'Ламинарный потолок операционной', unit: 'м²', price: 25000, category: 'medical' },
        'wrk_med_or_lamp_surgical': { name: 'Монтаж операционного светильника', unit: 'шт', price: 55000, category: 'medical' },
        'wrk_med_or_pendant': { name: 'Консоль потолочная (медгазы)', unit: 'шт', price: 250000, category: 'medical' },
        'wrk_med_or_scrub_station': { name: 'Станция предоперационного мытья', unit: 'шт', price: 55000, category: 'medical' },
        'wrk_med_or_pass_through': { name: 'Передаточное окно (стерильное)', unit: 'шт', price: 85000, category: 'medical' },
        'wrk_med_or_interlock': { name: 'Система блокировки дверей', unit: 'компл.', price: 35000, category: 'medical' },
        // === МЕДГАЗЫ === 11-18
        'wrk_med_gas_o2_outlet': { name: 'Точка раздачи кислорода', unit: 'шт', price: 8500, category: 'medical' },
        'wrk_med_gas_n2o_outlet': { name: 'Точка раздачи закиси азота', unit: 'шт', price: 8500, category: 'medical' },
        'wrk_med_gas_air_outlet': { name: 'Точка раздачи мед. воздуха', unit: 'шт', price: 8500, category: 'medical' },
        'wrk_med_gas_vacuum_outlet': { name: 'Точка мед. вакуума', unit: 'шт', price: 8500, category: 'medical' },
        'wrk_med_gas_pipe_cu': { name: 'Медный трубопровод (медгазы)', unit: 'м.п.', price: 1500, category: 'medical' },
        'wrk_med_gas_manifold': { name: 'Рампа (коллектор) медгазов', unit: 'компл.', price: 120000, category: 'medical' },
        'wrk_med_gas_alarm_panel': { name: 'Панель тревожной сигнализации', unit: 'шт', price: 35000, category: 'medical' },
        'wrk_med_gas_o2_station': { name: 'Кислородная станция (PSA)', unit: 'компл.', price: 2500000, category: 'medical' },
        // === ПАЛАТЫ === 19-26
        'wrk_med_ward_headwall': { name: 'Консоль прикроватная (палатная)', unit: 'шт', price: 55000, category: 'medical' },
        'wrk_med_ward_nurse_call': { name: 'Палатная связь (вызов медсестры)', unit: 'шт', price: 5500, category: 'medical' },
        'wrk_med_ward_curtain': { name: 'Штора разделительная (палата)', unit: 'шт', price: 5500, category: 'medical' },
        'wrk_med_ward_rail_handrail': { name: 'Поручень медицинский (стена)', unit: 'м.п.', price: 1500, category: 'medical' },
        'wrk_med_ward_rail_corner': { name: 'Угловой отбойник (защита стен)', unit: 'м.п.', price: 850, category: 'medical' },
        'wrk_med_ward_floor_vinyl': { name: 'Здравоохранительный ПВХ-пол', unit: 'м²', price: 1800, category: 'medical' },
        'wrk_med_ward_sink_sensor': { name: 'Раковина с сенсорным смесителем', unit: 'шт', price: 15000, category: 'medical' },
        'wrk_med_ward_window_blind': { name: 'Жалюзи (между стёклами)', unit: 'шт', price: 15000, category: 'medical' },
        // === ЛАБОРАТОРИИ === 27-34
        'wrk_med_lab_bench': { name: 'Лабораторный стол', unit: 'м.п.', price: 15000, category: 'medical' },
        'wrk_med_lab_bench_island': { name: 'Лабораторный остров', unit: 'м.п.', price: 25000, category: 'medical' },
        'wrk_med_lab_fume_hood': { name: 'Вытяжной шкаф (лаборатория)', unit: 'шт', price: 120000, category: 'medical' },
        'wrk_med_lab_bio_cabinet': { name: 'Ламинарный шкаф (биосафети)', unit: 'шт', price: 350000, category: 'medical' },
        'wrk_med_lab_storage': { name: 'Шкаф для реактивов', unit: 'шт', price: 25000, category: 'medical' },
        'wrk_med_lab_sink_epoxy': { name: 'Раковина эпоксидная (лаб.)', unit: 'шт', price: 25000, category: 'medical' },
        'wrk_med_lab_gas_outlet': { name: 'Газовая точка (лаб.)', unit: 'шт', price: 5500, category: 'medical' },
        'wrk_med_lab_eyewash': { name: 'Аварийный душ / глазомойка', unit: 'шт', price: 25000, category: 'medical' },
        // === СТЕРИЛИЗАЦИЯ === 35-38
        'wrk_med_steril_room': { name: 'Устройство ЦСО (стерилизационная)', unit: 'м²', price: 15000, category: 'medical' },
        'wrk_med_steril_autoclave': { name: 'Монтаж автоклава', unit: 'шт', price: 55000, category: 'medical' },
        'wrk_med_steril_washer': { name: 'Мойка-дезинфектор (монтаж)', unit: 'шт', price: 35000, category: 'medical' },
        'wrk_med_steril_pass': { name: 'Проходной автоклав (монтаж)', unit: 'шт', price: 120000, category: 'medical' },
        // === РЕНТГЕН / ДИАГНОСТИКА === 39-42
        'wrk_med_xray_room': { name: 'Подготовка рентгенкабинета', unit: 'м²', price: 12000, category: 'medical' },
        'wrk_med_xray_shielding': { name: 'Рентгенозащита стен (баритовая)', unit: 'м²', price: 3500, category: 'medical' },
        'wrk_med_xray_door': { name: 'Рентгенозащитная дверь', unit: 'шт', price: 120000, category: 'medical' },
        'wrk_med_xray_window': { name: 'Рентгенозащитное окно (свинц.)', unit: 'шт', price: 55000, category: 'medical' },
        // === РЕАНИМАЦИЯ / ИВЛ === 43-46
        'wrk_med_icu_pendant': { name: 'Консоль реанимационная', unit: 'шт', price: 350000, category: 'medical' },
        'wrk_med_icu_rail': { name: 'Функциональная рейка (ИВЛ/мониторы)', unit: 'м.п.', price: 5500, category: 'medical' },
        'wrk_med_icu_isolation': { name: 'Изоляционная палата (подпор/разрежение)', unit: 'компл.', price: 550000, category: 'medical' },
        'wrk_med_icu_monitoring': { name: 'Центральная станция мониторинга', unit: 'компл.', price: 550000, category: 'medical' },
        // === ДОПЫ === 47-50
        'wrk_med_reception': { name: 'Стойка рецепшн (медицинская)', unit: 'шт', price: 55000, category: 'medical' },
        'wrk_med_wayfinding': { name: 'Система навигации (таблички/стенды)', unit: 'компл.', price: 120000, category: 'medical' },
        'wrk_med_waste_system': { name: 'Система сбора мед. отходов', unit: 'компл.', price: 55000, category: 'medical' },
        'wrk_med_commissioning': { name: 'ПНР медицинского объекта', unit: 'компл.', price: 250000, category: 'medical' }
    };
})();
