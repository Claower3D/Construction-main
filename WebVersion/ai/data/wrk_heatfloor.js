// === ТЁПЛЫЕ ПОЛЫ — водяные, электрические, инфракрасные (50 поз.) ===
(function () {
    window.AI_WRK_HEATFLOOR = {
        // === ВОДЯНОЙ ТЁПЛЫЙ ПОЛ === 1-14
        'wrk_hf_water_pe_16': { name: 'Монтаж труб тёплого пола PE-RT 16мм', unit: 'м²', price: 550, category: 'heatfloor' },
        'wrk_hf_water_pe_20': { name: 'Монтаж труб тёплого пола PE-RT 20мм', unit: 'м²', price: 650, category: 'heatfloor' },
        'wrk_hf_water_pex_16': { name: 'Монтаж труб тёплого пола PEX-a 16мм', unit: 'м²', price: 650, category: 'heatfloor' },
        'wrk_hf_water_pex_20': { name: 'Монтаж труб тёплого пола PEX-a 20мм', unit: 'м²', price: 750, category: 'heatfloor' },
        'wrk_hf_water_insul_30': { name: 'Теплоизоляция основания 30мм (ППС)', unit: 'м²', price: 200, category: 'heatfloor' },
        'wrk_hf_water_insul_50': { name: 'Теплоизоляция основания 50мм (ППС)', unit: 'м²', price: 300, category: 'heatfloor' },
        'wrk_hf_water_mat_eis': { name: 'Маты с бобышками (укладка)', unit: 'м²', price: 250, category: 'heatfloor' },
        'wrk_hf_water_reflector': { name: 'Отражающая плёнка', unit: 'м²', price: 50, category: 'heatfloor' },
        'wrk_hf_water_screed': { name: 'Стяжка над тёплым полом (50мм)', unit: 'м²', price: 550, category: 'heatfloor' },
        'wrk_hf_water_collector_4': { name: 'Монтаж гребёнки на 4 контура', unit: 'шт', price: 5500, category: 'heatfloor' },
        'wrk_hf_water_collector_8': { name: 'Монтаж гребёнки на 8 контуров', unit: 'шт', price: 8500, category: 'heatfloor' },
        'wrk_hf_water_collector_12': { name: 'Монтаж гребёнки на 12 контуров', unit: 'шт', price: 12000, category: 'heatfloor' },
        'wrk_hf_water_box': { name: 'Монтаж коллекторного шкафа', unit: 'шт', price: 3500, category: 'heatfloor' },
        // === НАСОСНО-СМЕСИТЕЛЬНЫЙ УЗЕЛ === 15-18
        'wrk_hf_water_pump_unit': { name: 'Монтаж насосно-смесительного узла', unit: 'шт', price: 8500, category: 'heatfloor' },
        'wrk_hf_water_actuator': { name: 'Монтаж сервопривода', unit: 'шт', price: 1500, category: 'heatfloor' },
        'wrk_hf_water_thermostat': { name: 'Монтаж комнатного термостата', unit: 'шт', price: 1500, category: 'heatfloor' },
        'wrk_hf_water_controller': { name: 'Монтаж контроллера (погодозависимый)', unit: 'шт', price: 5500, category: 'heatfloor' },
        // === ЭЛЕКТРИЧЕСКИЙ КАБЕЛЬНЫЙ === 19-28
        'wrk_hf_cable_100': { name: 'Монтаж нагревательного кабеля 100Вт/м²', unit: 'м²', price: 550, category: 'heatfloor' },
        'wrk_hf_cable_150': { name: 'Монтаж нагревательного кабеля 150Вт/м²', unit: 'м²', price: 650, category: 'heatfloor' },
        'wrk_hf_cable_200': { name: 'Монтаж нагревательного кабеля 200Вт/м²', unit: 'м²', price: 750, category: 'heatfloor' },
        'wrk_hf_mat_150': { name: 'Монтаж нагревательного мата 150Вт/м²', unit: 'м²', price: 550, category: 'heatfloor' },
        'wrk_hf_mat_200': { name: 'Монтаж нагревательного мата 200Вт/м²', unit: 'м²', price: 650, category: 'heatfloor' },
        'wrk_hf_cable_thermostat': { name: 'Монтаж терморегулятора (кабельный)', unit: 'шт', price: 1500, category: 'heatfloor' },
        'wrk_hf_cable_thermostat_prog': { name: 'Монтаж программируемого терморегулятора', unit: 'шт', price: 2500, category: 'heatfloor' },
        'wrk_hf_cable_thermostat_wifi': { name: 'Монтаж Wi-Fi терморегулятора', unit: 'шт', price: 3500, category: 'heatfloor' },
        'wrk_hf_cable_gfci': { name: 'Установка УЗО для тёплого пола', unit: 'шт', price: 1500, category: 'heatfloor' },
        // === ИНФРАКРАСНЫЙ ПЛЁНОЧНЫЙ === 29-34
        'wrk_hf_film_150': { name: 'Укладка плёночного тёплого пола 150Вт/м²', unit: 'м²', price: 350, category: 'heatfloor' },
        'wrk_hf_film_220': { name: 'Укладка плёночного тёплого пола 220Вт/м²', unit: 'м²', price: 450, category: 'heatfloor' },
        'wrk_hf_film_substrate': { name: 'Теплоотражающая подложка', unit: 'м²', price: 80, category: 'heatfloor' },
        'wrk_hf_film_thermostat': { name: 'Терморегулятор для плёночного пола', unit: 'шт', price: 1500, category: 'heatfloor' },
        'wrk_hf_film_connect': { name: 'Подключение полосы плёнки', unit: 'шт', price: 350, category: 'heatfloor' },
        'wrk_hf_film_bitumen_tape': { name: 'Изоляция соединений (битумная лента)', unit: 'шт', price: 50, category: 'heatfloor' },
        // === СТЕРЖНЕВОЙ === 35-38
        'wrk_hf_carbon_rod_130': { name: 'Монтаж стержневого тёплого пола 130Вт/м²', unit: 'м²', price: 650, category: 'heatfloor' },
        'wrk_hf_carbon_rod_160': { name: 'Монтаж стержневого тёплого пола 160Вт/м²', unit: 'м²', price: 750, category: 'heatfloor' },
        'wrk_hf_carbon_rod_thermostat': { name: 'Терморегулятор для стержневого пола', unit: 'шт', price: 2500, category: 'heatfloor' },
        'wrk_hf_carbon_rod_screed': { name: 'Стяжка над стержневым полом', unit: 'м²', price: 550, category: 'heatfloor' },
        // === АНТИОБЛЕДИНЕНИЕ === 39-44
        'wrk_hf_deice_cable_roof': { name: 'Кабель обогрева кровли', unit: 'м.п.', price: 550, category: 'heatfloor' },
        'wrk_hf_deice_cable_gutter': { name: 'Кабель обогрева водостоков', unit: 'м.п.', price: 450, category: 'heatfloor' },
        'wrk_hf_deice_cable_steps': { name: 'Обогрев ступеней', unit: 'м²', price: 1200, category: 'heatfloor' },
        'wrk_hf_deice_cable_ramp': { name: 'Обогрев пандуса', unit: 'м²', price: 1200, category: 'heatfloor' },
        'wrk_hf_deice_cable_ground': { name: 'Обогрев площадки/тротуара', unit: 'м²', price: 1500, category: 'heatfloor' },
        'wrk_hf_deice_controller': { name: 'Монтаж контроллера антиобледенения', unit: 'шт', price: 15000, category: 'heatfloor' },
        // === ОПРЕССОВКА / ПНР === 45-48
        'wrk_hf_water_presstest': { name: 'Опрессовка водяного тёплого пола', unit: 'контур', price: 1500, category: 'heatfloor' },
        'wrk_hf_water_balance': { name: 'Балансировка контуров', unit: 'контур', price: 550, category: 'heatfloor' },
        'wrk_hf_elec_test': { name: 'Проверка электрического тёплого пола', unit: 'контур', price: 550, category: 'heatfloor' },
        'wrk_hf_thermal_imaging': { name: 'Тепловизионный контроль тёплого пола', unit: 'м²', price: 120, category: 'heatfloor' }
    };
})();
