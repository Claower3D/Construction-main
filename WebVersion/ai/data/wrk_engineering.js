// === ГЕОДЕЗИЯ, ПРОЕКТИРОВАНИЕ, ЭКСПЕРТИЗА, ЛАБОРАТОРИЯ, ПИР (300 поз.) ===
(function () {
    window.AI_WRK_ENGINEERING = {
        // === ГЕОДЕЗИЯ ===
        'wrk_eng_geo_topo_5ha': { name: 'Топографическая съёмка (1-5 га)', unit: 'га', price: 45000, category: 'engineering' },
        'wrk_eng_geo_topo_10ha': { name: 'Топографическая съёмка (5-10 га)', unit: 'га', price: 35000, category: 'engineering' },
        'wrk_eng_geo_stakeout': { name: 'Выноска осей здания', unit: 'ось', price: 2500, category: 'engineering' },
        'wrk_eng_geo_stakeout_piles': { name: 'Выноска свайного поля', unit: 'свая', price: 250, category: 'engineering' },
        'wrk_eng_geo_monitoring': { name: 'Мониторинг деформаций (1 цикл)', unit: 'точка', price: 1500, category: 'engineering' },
        'wrk_eng_geo_drone_survey': { name: 'Аэросъёмка БПЛА', unit: 'га', price: 15000, category: 'engineering' },
        'wrk_eng_geo_3d_scan': { name: '3D лазерное сканирование', unit: 'точка', price: 25000, category: 'engineering' },
        // === ИНЖЕНЕРНО-ГЕОЛОГИЧЕСКИЕ ИЗЫСКАНИЯ ===
        'wrk_eng_geotech_borehole_5': { name: 'Бурение скважины 5м', unit: 'скв.', price: 15000, category: 'engineering' },
        'wrk_eng_geotech_borehole_10': { name: 'Бурение скважины 10м', unit: 'скв.', price: 25000, category: 'engineering' },
        'wrk_eng_geotech_borehole_15': { name: 'Бурение скважины 15м', unit: 'скв.', price: 35000, category: 'engineering' },
        'wrk_eng_geotech_borehole_20': { name: 'Бурение скважины 20м', unit: 'скв.', price: 45000, category: 'engineering' },
        'wrk_eng_geotech_cpt': { name: 'Статическое зондирование CPT', unit: 'точка', price: 15000, category: 'engineering' },
        'wrk_eng_geotech_spt': { name: 'Динамическое зондирование SPT', unit: 'точка', price: 8500, category: 'engineering' },
        'wrk_eng_geotech_lab': { name: 'Лабораторные испытания грунта (компл.)', unit: 'проба', price: 5500, category: 'engineering' },
        // === СТРОИТЕЛЬНАЯ ЛАБОРАТОРИЯ ===
        'wrk_eng_lab_concrete_cube': { name: 'Испытание бетона (кубики, 1 серия)', unit: 'серия', price: 3500, category: 'engineering' },
        'wrk_eng_lab_concrete_core': { name: 'Отбор и испытание керна бетона', unit: 'шт', price: 5500, category: 'engineering' },
        'wrk_eng_lab_rebar_test': { name: 'Испытание арматуры на растяжение', unit: 'проба', price: 2500, category: 'engineering' },
        'wrk_eng_lab_weld_test': { name: 'Испытание сварных образцов', unit: 'проба', price: 3500, category: 'engineering' },
        'wrk_eng_lab_soil_compact': { name: 'Контроль уплотнения грунта', unit: 'точка', price: 2500, category: 'engineering' },
        'wrk_eng_lab_asphalt_core': { name: 'Отбор и испытание керна асфальта', unit: 'шт', price: 5500, category: 'engineering' },
        'wrk_eng_lab_pile_test_static': { name: 'Статические испытания сваи', unit: 'шт', price: 120000, category: 'engineering' },
        'wrk_eng_lab_pile_test_dyn': { name: 'Динамические испытания сваи', unit: 'шт', price: 25000, category: 'engineering' },
        // === ПРОЕКТИРОВАНИЕ ===
        'wrk_eng_design_ar': { name: 'Раздел АР (архитектурные решения)', unit: 'м²', price: 350, category: 'engineering' },
        'wrk_eng_design_kr': { name: 'Раздел КР (конструкции)', unit: 'м²', price: 450, category: 'engineering' },
        'wrk_eng_design_ovk': { name: 'Раздел ОВК (отопление/вентиляция)', unit: 'м²', price: 250, category: 'engineering' },
        'wrk_eng_design_vk': { name: 'Раздел ВК (водоснабжение/канализация)', unit: 'м²', price: 200, category: 'engineering' },
        'wrk_eng_design_eo': { name: 'Раздел ЭО (электрооборудование)', unit: 'м²', price: 250, category: 'engineering' },
        'wrk_eng_design_ss': { name: 'Раздел СС (слаботочные системы)', unit: 'м²', price: 150, category: 'engineering' },
        'wrk_eng_design_po': { name: 'Раздел ПОС/ППР', unit: 'объект', price: 250000, category: 'engineering' },
        'wrk_eng_design_gp': { name: 'Раздел ГП (генплан)', unit: 'объект', price: 150000, category: 'engineering' },
        // === ЭКСПЕРТИЗА ===
        'wrk_eng_expert_state': { name: 'Государственная экспертиза проекта', unit: 'объект', price: 350000, category: 'engineering' },
        'wrk_eng_expert_private': { name: 'Негосударственная экспертиза проекта', unit: 'объект', price: 250000, category: 'engineering' },
        'wrk_eng_expert_building': { name: 'Экспертиза здания (техническое обследование)', unit: 'объект', price: 250000, category: 'engineering' },
        // === ТЕСТИРОВАНИЯ ===
        'wrk_eng_test_airtight': { name: 'Испытание на воздухопроницаемость (blower door)', unit: 'объект', price: 25000, category: 'engineering' },
        'wrk_eng_test_pressure': { name: 'Опрессовка трубопроводов', unit: 'система', price: 8500, category: 'engineering' },
        'wrk_eng_test_smoke': { name: 'Аэродинамические испытания вентиляции', unit: 'система', price: 15000, category: 'engineering' },
        'wrk_eng_test_electric': { name: 'Электроизмерения (полный протокол)', unit: 'объект', price: 35000, category: 'engineering' }
    };
})();
