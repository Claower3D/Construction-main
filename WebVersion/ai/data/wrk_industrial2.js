// === ПРОМЫШЛЕННЫЕ ПЛОЩАДКИ — резервуары, силосы, эстакады, КОС, водоподготовка (50 поз.) ===
(function () {
    window.AI_WRK_INDUSTRIAL2 = {
        // === РЕЗЕРВУАРЫ === 1-10
        'wrk_ind2_tank_steel_50': { name: 'Монтаж стального резервуара 50м³', unit: 'шт', price: 350000, category: 'industrial2' },
        'wrk_ind2_tank_steel_100': { name: 'Монтаж стального резервуара 100м³', unit: 'шт', price: 550000, category: 'industrial2' },
        'wrk_ind2_tank_steel_200': { name: 'Монтаж стального резервуара 200м³', unit: 'шт', price: 850000, category: 'industrial2' },
        'wrk_ind2_tank_steel_500': { name: 'Монтаж стального резервуара 500м³', unit: 'шт', price: 1500000, category: 'industrial2' },
        'wrk_ind2_tank_steel_1000': { name: 'Монтаж стального резервуара 1000м³', unit: 'шт', price: 2500000, category: 'industrial2' },
        'wrk_ind2_tank_steel_3000': { name: 'Монтаж стального резервуара 3000м³', unit: 'шт', price: 5500000, category: 'industrial2' },
        'wrk_ind2_tank_rc_100': { name: 'Устройство ж/б резервуара 100м³', unit: 'шт', price: 850000, category: 'industrial2' },
        'wrk_ind2_tank_rc_500': { name: 'Устройство ж/б резервуара 500м³', unit: 'шт', price: 2500000, category: 'industrial2' },
        'wrk_ind2_tank_pe_10': { name: 'Монтаж ёмкости ПЭ 10м³', unit: 'шт', price: 35000, category: 'industrial2' },
        'wrk_ind2_tank_pe_25': { name: 'Монтаж ёмкости ПЭ 25м³', unit: 'шт', price: 85000, category: 'industrial2' },
        // === СИЛОСЫ / БУНКЕРЫ === 11-18
        'wrk_ind2_silo_50': { name: 'Монтаж стального силоса 50т', unit: 'шт', price: 550000, category: 'industrial2' },
        'wrk_ind2_silo_100': { name: 'Монтаж стального силоса 100т', unit: 'шт', price: 850000, category: 'industrial2' },
        'wrk_ind2_silo_200': { name: 'Монтаж стального силоса 200т', unit: 'шт', price: 1500000, category: 'industrial2' },
        'wrk_ind2_silo_500': { name: 'Монтаж стального силоса 500т', unit: 'шт', price: 2500000, category: 'industrial2' },
        'wrk_ind2_bunker_5': { name: 'Монтаж стального бункера 5м³', unit: 'шт', price: 85000, category: 'industrial2' },
        'wrk_ind2_bunker_10': { name: 'Монтаж стального бункера 10м³', unit: 'шт', price: 150000, category: 'industrial2' },
        'wrk_ind2_bunker_25': { name: 'Монтаж стального бункера 25м³', unit: 'шт', price: 350000, category: 'industrial2' },
        'wrk_ind2_bunker_rc': { name: 'Устройство ж/б бункера', unit: 'м³', price: 25000, category: 'industrial2' },
        // === ЭСТАКАДЫ / ПЛОЩАДКИ === 19-24
        'wrk_ind2_trestle_pipe': { name: 'Трубная эстакада', unit: 'м.п.', price: 35000, category: 'industrial2' },
        'wrk_ind2_trestle_cable': { name: 'Кабельная эстакада', unit: 'м.п.', price: 18000, category: 'industrial2' },
        'wrk_ind2_platform': { name: 'Площадка обслуживания', unit: 'м²', price: 8500, category: 'industrial2' },
        'wrk_ind2_ladder_cage': { name: 'Лестница с ограждением', unit: 'м.п.', price: 12000, category: 'industrial2' },
        'wrk_ind2_handrail': { name: 'Ограждение (перила)', unit: 'м.п.', price: 3500, category: 'industrial2' },
        'wrk_ind2_grating': { name: 'Монтаж решётчатого настила', unit: 'м²', price: 3500, category: 'industrial2' },
        // === ТЕХНОЛОГИЧЕСКИЕ ТРУБОПРОВОДЫ === 25-35
        'wrk_ind2_pipe_st_50': { name: 'Технол. трубопровод Ø50 (сталь)', unit: 'м.п.', price: 850, category: 'industrial2' },
        'wrk_ind2_pipe_st_100': { name: 'Технол. трубопровод Ø100 (сталь)', unit: 'м.п.', price: 1500, category: 'industrial2' },
        'wrk_ind2_pipe_st_150': { name: 'Технол. трубопровод Ø150 (сталь)', unit: 'м.п.', price: 2500, category: 'industrial2' },
        'wrk_ind2_pipe_st_200': { name: 'Технол. трубопровод Ø200 (сталь)', unit: 'м.п.', price: 3500, category: 'industrial2' },
        'wrk_ind2_pipe_st_300': { name: 'Технол. трубопровод Ø300 (сталь)', unit: 'м.п.', price: 5500, category: 'industrial2' },
        'wrk_ind2_pipe_ss_50': { name: 'Трубопровод Ø50 (нержавейка)', unit: 'м.п.', price: 2500, category: 'industrial2' },
        'wrk_ind2_pipe_ss_100': { name: 'Трубопровод Ø100 (нержавейка)', unit: 'м.п.', price: 5500, category: 'industrial2' },
        'wrk_ind2_pipe_support': { name: 'Опора трубопровода', unit: 'шт', price: 1200, category: 'industrial2' },
        // === КОС === 36-44
        'wrk_ind2_ww_bio_5': { name: 'Биоочистка 5м³/сут', unit: 'шт', price: 250000, category: 'industrial2' },
        'wrk_ind2_ww_bio_20': { name: 'Биоочистка 20м³/сут', unit: 'шт', price: 850000, category: 'industrial2' },
        'wrk_ind2_ww_bio_100': { name: 'Биоочистка 100м³/сут', unit: 'шт', price: 2500000, category: 'industrial2' },
        'wrk_ind2_ww_grease': { name: 'Жироуловитель', unit: 'шт', price: 35000, category: 'industrial2' },
        'wrk_ind2_ww_oil_sep': { name: 'Маслоотделитель', unit: 'шт', price: 85000, category: 'industrial2' },
        'wrk_ind2_ww_pump_kns': { name: 'КНС', unit: 'шт', price: 250000, category: 'industrial2' },
        'wrk_ind2_ww_sand_trap': { name: 'Песколовка', unit: 'шт', price: 85000, category: 'industrial2' },
        'wrk_ind2_ww_uv': { name: 'УФ-обеззараживатель', unit: 'шт', price: 120000, category: 'industrial2' },
        // === ВОДОПОДГОТОВКА === 45-50
        'wrk_ind2_wp_filter': { name: 'Механический фильтр', unit: 'шт', price: 25000, category: 'industrial2' },
        'wrk_ind2_wp_softener': { name: 'Умягчитель', unit: 'шт', price: 55000, category: 'industrial2' },
        'wrk_ind2_wp_ro': { name: 'Обратный осмос', unit: 'шт', price: 250000, category: 'industrial2' },
        'wrk_ind2_wp_deaerator': { name: 'Деаэратор', unit: 'шт', price: 350000, category: 'industrial2' },
        'wrk_ind2_wp_dosing': { name: 'Дозирование', unit: 'шт', price: 55000, category: 'industrial2' },
        'wrk_ind2_wp_tank': { name: 'Бак подготовленной воды', unit: 'шт', price: 85000, category: 'industrial2' }
    };
})();
