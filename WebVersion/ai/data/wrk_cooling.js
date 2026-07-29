// === ХОЛОДОСНАБЖЕНИЕ — холодильные камеры, чиллеры, ледовые арены (50 поз.) ===
(function () {
    window.AI_WRK_COOLING = {
        // === ХОЛОДИЛЬНЫЕ КАМЕРЫ === 1-12
        'wrk_cl_chamber_panel_80': { name: 'Монтаж сэндвич-панели холодильной камеры 80мм', unit: 'м²', price: 1500, category: 'cooling' },
        'wrk_cl_chamber_panel_100': { name: 'Монтаж сэндвич-панели холодильной камеры 100мм', unit: 'м²', price: 1800, category: 'cooling' },
        'wrk_cl_chamber_panel_120': { name: 'Монтаж сэндвич-панели холодильной камеры 120мм', unit: 'м²', price: 2200, category: 'cooling' },
        'wrk_cl_chamber_panel_150': { name: 'Монтаж сэндвич-панели холодильной камеры 150мм', unit: 'м²', price: 2800, category: 'cooling' },
        'wrk_cl_chamber_panel_200': { name: 'Монтаж сэндвич-панели холодильной камеры 200мм', unit: 'м²', price: 3500, category: 'cooling' },
        'wrk_cl_chamber_door_pivot': { name: 'Монтаж двери холодильной камеры (распашная)', unit: 'шт', price: 25000, category: 'cooling' },
        'wrk_cl_chamber_door_slide': { name: 'Монтаж двери холодильной камеры (откатная)', unit: 'шт', price: 55000, category: 'cooling' },
        'wrk_cl_chamber_floor_insul': { name: 'Устройство пола холодильной камеры', unit: 'м²', price: 2500, category: 'cooling' },
        'wrk_cl_chamber_floor_heat': { name: 'Обогрев пола холодильной камеры (-)', unit: 'м²', price: 1500, category: 'cooling' },
        'wrk_cl_chamber_curtain_pvc': { name: 'Монтаж ПВХ-завесы', unit: 'м²', price: 550, category: 'cooling' },
        'wrk_cl_chamber_shelving': { name: 'Монтаж стеллажей холодильной камеры', unit: 'секция', price: 5500, category: 'cooling' },
        'wrk_cl_chamber_ramp': { name: 'Устройство погрузочной рампы', unit: 'м.п.', price: 8500, category: 'cooling' },
        // === ХОЛОДИЛЬНЫЕ МАШИНЫ === 13-22
        'wrk_cl_unit_mono_5': { name: 'Монтаж моноблока 5кВт', unit: 'шт', price: 15000, category: 'cooling' },
        'wrk_cl_unit_mono_10': { name: 'Монтаж моноблока 10кВт', unit: 'шт', price: 25000, category: 'cooling' },
        'wrk_cl_unit_split_5': { name: 'Монтаж сплит-системы промышл. 5кВт', unit: 'шт', price: 25000, category: 'cooling' },
        'wrk_cl_unit_split_15': { name: 'Монтаж сплит-системы промышл. 15кВт', unit: 'шт', price: 55000, category: 'cooling' },
        'wrk_cl_unit_split_30': { name: 'Монтаж сплит-системы промышл. 30кВт', unit: 'шт', price: 85000, category: 'cooling' },
        'wrk_cl_compressor_rack': { name: 'Монтаж компрессорной стойки', unit: 'шт', price: 250000, category: 'cooling' },
        'wrk_cl_condenser_air': { name: 'Монтаж конденсатора воздушного', unit: 'шт', price: 55000, category: 'cooling' },
        'wrk_cl_evaporator': { name: 'Монтаж воздухоохладителя', unit: 'шт', price: 35000, category: 'cooling' },
        'wrk_cl_defrost_electric': { name: 'Подключение электрооттайки', unit: 'шт', price: 8500, category: 'cooling' },
        'wrk_cl_defrost_hotgas': { name: 'Подключение оттайки горячим газом', unit: 'шт', price: 15000, category: 'cooling' },
        // === ТРУБОПРОВОДЫ ХЛАДАГЕНТА === 23-28
        'wrk_cl_pipe_copper_12': { name: 'Монтаж медного трубопровода Ø12', unit: 'м.п.', price: 350, category: 'cooling' },
        'wrk_cl_pipe_copper_18': { name: 'Монтаж медного трубопровода Ø18', unit: 'м.п.', price: 450, category: 'cooling' },
        'wrk_cl_pipe_copper_22': { name: 'Монтаж медного трубопровода Ø22', unit: 'м.п.', price: 550, category: 'cooling' },
        'wrk_cl_pipe_copper_35': { name: 'Монтаж медного трубопровода Ø35', unit: 'м.п.', price: 850, category: 'cooling' },
        'wrk_cl_pipe_copper_54': { name: 'Монтаж медного трубопровода Ø54', unit: 'м.п.', price: 1500, category: 'cooling' },
        'wrk_cl_pipe_insul': { name: 'Теплоизоляция медных труб', unit: 'м.п.', price: 200, category: 'cooling' },
        // === ЧИЛЛЕРЫ === 29-35
        'wrk_cl_chiller_air_50': { name: 'Монтаж чиллера воздушного 50кВт', unit: 'шт', price: 120000, category: 'cooling' },
        'wrk_cl_chiller_air_100': { name: 'Монтаж чиллера воздушного 100кВт', unit: 'шт', price: 250000, category: 'cooling' },
        'wrk_cl_chiller_air_200': { name: 'Монтаж чиллера воздушного 200кВт', unit: 'шт', price: 450000, category: 'cooling' },
        'wrk_cl_chiller_air_500': { name: 'Монтаж чиллера воздушного 500кВт', unit: 'шт', price: 850000, category: 'cooling' },
        'wrk_cl_chiller_water_200': { name: 'Монтаж чиллера водяного 200кВт', unit: 'шт', price: 550000, category: 'cooling' },
        'wrk_cl_chiller_water_500': { name: 'Монтаж чиллера водяного 500кВт', unit: 'шт', price: 1200000, category: 'cooling' },
        'wrk_cl_chiller_water_1000': { name: 'Монтаж чиллера водяного 1000кВт', unit: 'шт', price: 2500000, category: 'cooling' },
        // === ГРАДИРНИ === 36-38
        'wrk_cl_tower_open_100': { name: 'Монтаж градирни открытой 100кВт', unit: 'шт', price: 120000, category: 'cooling' },
        'wrk_cl_tower_open_300': { name: 'Монтаж градирни открытой 300кВт', unit: 'шт', price: 250000, category: 'cooling' },
        'wrk_cl_tower_closed_200': { name: 'Монтаж драйкулера 200кВт', unit: 'шт', price: 250000, category: 'cooling' },
        // === ЛЕДОВЫЕ АРЕНЫ === 39-44
        'wrk_cl_ice_pipe_grid': { name: 'Монтаж трубной решётки ледовой арены', unit: 'м²', price: 3500, category: 'cooling' },
        'wrk_cl_ice_slab': { name: 'Устройство ж/б плиты ледовой арены', unit: 'м²', price: 5500, category: 'cooling' },
        'wrk_cl_ice_chiller': { name: 'Монтаж холодильной машины (арена)', unit: 'компл.', price: 5500000, category: 'cooling' },
        'wrk_cl_ice_pump_station': { name: 'Монтаж насосной станции хладоносителя', unit: 'компл.', price: 350000, category: 'cooling' },
        'wrk_cl_ice_dehumidifier': { name: 'Монтаж осушителя воздуха', unit: 'шт', price: 250000, category: 'cooling' },
        'wrk_cl_ice_resurfacer_garage': { name: 'Устройство гаража для ледозаливочной машины', unit: 'компл.', price: 350000, category: 'cooling' },
        // === ПНР === 45-48
        'wrk_cl_commissioning_chamber': { name: 'ПНР холодильной камеры', unit: 'шт', price: 15000, category: 'cooling' },
        'wrk_cl_commissioning_chiller': { name: 'ПНР чиллерной системы', unit: 'компл.', price: 85000, category: 'cooling' },
        'wrk_cl_refrigerant_charge': { name: 'Заправка хладагентом', unit: 'кг', price: 1500, category: 'cooling' },
        'wrk_cl_vacuum_test': { name: 'Вакуумирование и опрессовка', unit: 'компл.', price: 8500, category: 'cooling' }
    };
})();
