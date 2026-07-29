// === ПРОЕКТИРОВАНИЕ, ОБСЛЕДОВАНИЯ, СОГЛАСОВАНИЯ, ТЕХПРИСОЕДИНЕНИЯ (200 поз.) ===
(function () {
    window.AI_WRK_DESIGN_EXT = {
        // === ПРОЕКТИРОВАНИЕ ===
        'wrk_ds_arch_concept': { name: 'Разработка концепции (эскизный проект)', unit: 'м²', price: 550, category: 'design_ext' },
        'wrk_ds_arch_project': { name: 'Архитектурный проект (АР)', unit: 'м²', price: 350, category: 'design_ext' },
        'wrk_ds_struct_project': { name: 'Конструктивный проект (КР)', unit: 'м²', price: 250, category: 'design_ext' },
        'wrk_ds_mep_project': { name: 'Проект инженерных систем (ИОС)', unit: 'м²', price: 250, category: 'design_ext' },
        'wrk_ds_hvac_project': { name: 'Проект ОВиК', unit: 'м²', price: 150, category: 'design_ext' },
        'wrk_ds_electro_project': { name: 'Проект электроснабжения (ЭС)', unit: 'м²', price: 150, category: 'design_ext' },
        'wrk_ds_water_project': { name: 'Проект водоснабжения/канализации (ВК)', unit: 'м²', price: 150, category: 'design_ext' },
        'wrk_ds_fire_project': { name: 'Проект пожарной безопасности', unit: 'м²', price: 120, category: 'design_ext' },
        'wrk_ds_landscape_project': { name: 'Проект благоустройства', unit: 'м²', price: 80, category: 'design_ext' },
        'wrk_ds_interior_project': { name: 'Дизайн-проект интерьера', unit: 'м²', price: 1500, category: 'design_ext' },
        'wrk_ds_interior_3d': { name: '3D-визуализация интерьера', unit: 'ракурс', price: 15000, category: 'design_ext' },
        'wrk_ds_exterior_3d': { name: '3D-визуализация экстерьера', unit: 'ракурс', price: 25000, category: 'design_ext' },
        'wrk_ds_bim_model': { name: 'BIM-моделирование', unit: 'м²', price: 250, category: 'design_ext' },
        // === ОБСЛЕДОВАНИЯ ===
        'wrk_ds_survey_topo_1ha': { name: 'Топографическая съёмка (до 1 га)', unit: 'га', price: 120000, category: 'design_ext' },
        'wrk_ds_survey_topo_5ha': { name: 'Топографическая съёмка (до 5 га)', unit: 'га', price: 85000, category: 'design_ext' },
        'wrk_ds_survey_geo_lite': { name: 'Геологические изыскания (облегчённые)', unit: 'скважина', price: 45000, category: 'design_ext' },
        'wrk_ds_survey_geo_full': { name: 'Геологические изыскания (полные)', unit: 'скважина', price: 85000, category: 'design_ext' },
        'wrk_ds_survey_struct': { name: 'Обследование здания (техническое)', unit: 'м²', price: 120, category: 'design_ext' },
        'wrk_ds_survey_energy': { name: 'Энергетическое обследование', unit: 'м²', price: 80, category: 'design_ext' },
        'wrk_ds_survey_thermal': { name: 'Тепловизионное обследование', unit: 'м²', price: 50, category: 'design_ext' },
        // === СОГЛАСОВАНИЯ ===
        'wrk_ds_approve_gpzu': { name: 'Получение ГПЗУ', unit: 'шт', price: 250000, category: 'design_ext' },
        'wrk_ds_approve_tu_water': { name: 'ТУ на водоснабжение/канализацию', unit: 'шт', price: 85000, category: 'design_ext' },
        'wrk_ds_approve_tu_gas': { name: 'ТУ на газоснабжение', unit: 'шт', price: 120000, category: 'design_ext' },
        'wrk_ds_approve_tu_electric': { name: 'ТУ на электроснабжение', unit: 'шт', price: 85000, category: 'design_ext' },
        'wrk_ds_approve_tu_heat': { name: 'ТУ на теплоснабжение', unit: 'шт', price: 85000, category: 'design_ext' },
        'wrk_ds_approve_permit': { name: 'Получение разрешения на строительство', unit: 'шт', price: 350000, category: 'design_ext' },
        'wrk_ds_approve_commission': { name: 'Ввод в эксплуатацию (приёмочная комиссия)', unit: 'шт', price: 550000, category: 'design_ext' },
        'wrk_ds_approve_expertise': { name: 'Экспертиза проектной документации', unit: 'шт', price: 450000, category: 'design_ext' },
        // === СТРОЙКОНТРОЛЬ И АВТОРСКИЙ НАДЗОР ===
        'wrk_ds_supervision_tech': { name: 'Технический надзор (стройконтроль)', unit: 'мес', price: 250000, category: 'design_ext' },
        'wrk_ds_supervision_author': { name: 'Авторский надзор', unit: 'мес', price: 180000, category: 'design_ext' },
        'wrk_ds_lab_concrete': { name: 'Лабораторные испытания бетона', unit: 'серия', price: 8500, category: 'design_ext' },
        'wrk_ds_lab_soil': { name: 'Лабораторные испытания грунта', unit: 'проба', price: 5500, category: 'design_ext' },
        'wrk_ds_lab_weld': { name: 'Контроль сварных соединений (УЗК)', unit: 'стык', price: 2500, category: 'design_ext' },
        'wrk_ds_lab_weld_xray': { name: 'Контроль сварных соединений (рентген)', unit: 'стык', price: 5500, category: 'design_ext' },
        // === ИСПОЛНИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ ===
        'wrk_ds_asbuilt_general': { name: 'Ведение исполнительной документации', unit: 'мес', price: 120000, category: 'design_ext' },
        'wrk_ds_passport_tech': { name: 'Изготовление технического паспорта', unit: 'шт', price: 85000, category: 'design_ext' }
    };
})();
