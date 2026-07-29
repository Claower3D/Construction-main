// === САУНЫ И БАНИ — парные, обшивка, освещение, оборудование, хаммам (48 поз.) ===
(function () {
    window.AI_WRK_SAUNA = {
        // === ПАРНАЯ (КАРКАС) === 1-8
        'wrk_sau_frame_wall': { name: 'Каркас стен парной', unit: 'м²', price: 850, category: 'sauna' },
        'wrk_sau_frame_ceil': { name: 'Каркас потолка парной', unit: 'м²', price: 850, category: 'sauna' },
        'wrk_sau_insul_mw_50': { name: 'Утепление парной (минвата 50мм)', unit: 'м²', price: 250, category: 'sauna' },
        'wrk_sau_insul_mw_100': { name: 'Утепление парной (минвата 100мм)', unit: 'м²', price: 450, category: 'sauna' },
        'wrk_sau_door': { name: 'Установка двери парной (стекло)', unit: 'шт', price: 12000, category: 'sauna' },
        'wrk_sau_door_wood': { name: 'Установка двери парной (дерево)', unit: 'шт', price: 8500, category: 'sauna' },
        'wrk_sau_vent_system': { name: 'Вентиляция парной (приток+вытяжка)', unit: 'компл.', price: 8500, category: 'sauna' },
        // === ОБШИВКА === 9-16
        'wrk_sau_lining_olha': { name: 'Обшивка вагонкой (ольха)', unit: 'м²', price: 950, category: 'sauna' },
        'wrk_sau_lining_abashi': { name: 'Обшивка вагонкой (абаши)', unit: 'м²', price: 1200, category: 'sauna' },
        'wrk_sau_lining_thermo': { name: 'Обшивка термодерево', unit: 'м²', price: 1500, category: 'sauna' },
        'wrk_sau_ceiling_lining': { name: 'Обшивка потолка парной', unit: 'м²', price: 850, category: 'sauna' },
        'wrk_sau_corner_trim': { name: 'Монтаж уголков/наличников', unit: 'м.п.', price: 250, category: 'sauna' },
        'wrk_sau_floor_tile': { name: 'Плитка пола парной', unit: 'м²', price: 2500, category: 'sauna' },
        // === ПОЛКИ === 17-22
        'wrk_sau_bench_lipa_l': { name: 'Полок (липа), L-образный', unit: 'м.п.', price: 3500, category: 'sauna' },
        'wrk_sau_bench_lipa_p': { name: 'Полок (липа), П-образный', unit: 'м.п.', price: 4500, category: 'sauna' },
        'wrk_sau_bench_cedar': { name: 'Полок (кедр)', unit: 'м.п.', price: 5500, category: 'sauna' },
        'wrk_sau_bench_abashi': { name: 'Полок (абаши)', unit: 'м.п.', price: 5500, category: 'sauna' },
        'wrk_sau_bench_thermo': { name: 'Полок (термодерево)', unit: 'м.п.', price: 5500, category: 'sauna' },
        'wrk_sau_bench_backrest': { name: 'Спинка полока', unit: 'м.п.', price: 1500, category: 'sauna' },
        // === ОБОРУДОВАНИЕ === 23-30
        'wrk_sau_heater_elec_6': { name: 'Электрокаменка 6кВт', unit: 'шт', price: 12000, category: 'sauna' },
        'wrk_sau_heater_elec_9': { name: 'Электрокаменка 9кВт', unit: 'шт', price: 15000, category: 'sauna' },
        'wrk_sau_heater_elec_15': { name: 'Электрокаменка 15кВт', unit: 'шт', price: 18000, category: 'sauna' },
        'wrk_sau_heater_gas': { name: 'Газовая банная печь', unit: 'шт', price: 25000, category: 'sauna' },
        'wrk_sau_chimney_ss': { name: 'Дымоход банный (сэндвич)', unit: 'м.п.', price: 2500, category: 'sauna' },
        'wrk_sau_stones': { name: 'Засыпка камней (жадеит)', unit: 'кг', price: 120, category: 'sauna' },
        'wrk_sau_bucket_set': { name: 'Набор аксессуаров (ведро/ковш/и т.д.)', unit: 'компл.', price: 5500, category: 'sauna' },
        // === ОСВЕЩЕНИЕ ПАРНОЙ === 31-34
        'wrk_sau_light_fiber': { name: 'Оптоволоконное освещение (звёздное небо)', unit: 'компл.', price: 35000, category: 'sauna' },
        'wrk_sau_light_led_strip': { name: 'LED подсветка (за полоком)', unit: 'м.п.', price: 850, category: 'sauna' },
        'wrk_sau_light_himalayan': { name: 'Панель из гималайской соли (подсветка)', unit: 'м²', price: 8500, category: 'sauna' },
        'wrk_sau_light_sauna_lamp': { name: 'Светильник банный (влагозащищённый)', unit: 'шт', price: 1500, category: 'sauna' },
        // === ХАММАМ === 35-42
        'wrk_sau_hammam_steam': { name: 'Парогенератор хаммама', unit: 'шт', price: 55000, category: 'sauna' },
        'wrk_sau_hammam_bench_rc': { name: 'Устройство лежака (бетон)', unit: 'шт', price: 25000, category: 'sauna' },
        'wrk_sau_hammam_heat_bench': { name: 'Подогрев лежака', unit: 'шт', price: 8500, category: 'sauna' },
        'wrk_sau_hammam_mosaic': { name: 'Облицовка хаммама мозаикой', unit: 'м²', price: 5500, category: 'sauna' },
        'wrk_sau_hammam_dome': { name: 'Устройство купола хаммама', unit: 'шт', price: 85000, category: 'sauna' },
        'wrk_sau_hammam_kurna': { name: 'Установка курны (чаша)', unit: 'шт', price: 25000, category: 'sauna' },
        'wrk_sau_hammam_starsky': { name: 'Звёздное небо хаммама', unit: 'компл.', price: 55000, category: 'sauna' },
        'wrk_sau_hammam_vent': { name: 'Вентиляция хаммама', unit: 'компл.', price: 25000, category: 'sauna' },
        // === ДОПЫ === 43-48
        'wrk_sau_cold_plunge': { name: 'Купель (дерево)', unit: 'шт', price: 55000, category: 'sauna' },
        'wrk_sau_cold_plunge_ss': { name: 'Купель (нержавейка)', unit: 'шт', price: 85000, category: 'sauna' },
        'wrk_sau_shower_tropical': { name: 'Обливное устройство', unit: 'шт', price: 8500, category: 'sauna' },
        'wrk_sau_ice_fountain': { name: 'Ледяной фонтан', unit: 'шт', price: 55000, category: 'sauna' },
        'wrk_sau_rest_room': { name: 'Отделка комнаты отдыха', unit: 'м²', price: 2500, category: 'sauna' },
    };
})();
