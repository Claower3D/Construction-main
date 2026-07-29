// === ФАЗА 3: НАПОЛЬНЫЕ ПОКРЫТИЯ ДЕТАЛЬНО — ВСЕ ВИДЫ ПО КЛАССАМ/ТОЛЩИНАМ (110 поз.) ===
(function () {
    window.AI_WRK_FLOORING_FULL = {
        // === ЛАМИНАТ ===
        'wrk_fl_lam_spc_4': { name: 'SPC-ламинат 4мм', unit: 'м²', price: 40, category: 'flooring_full' },
        'wrk_fl_lam_spc_5': { name: 'SPC-ламинат 5мм', unit: 'м²', price: 50, category: 'flooring_full' },
        'wrk_fl_lam_spc_6': { name: 'SPC-ламинат 6мм', unit: 'м²', price: 60, category: 'flooring_full' },

        // === ПАРКЕТ ===
        'wrk_fl_park_board_14': { name: 'Паркетная доска 14мм', unit: 'м²', price: 50, category: 'flooring_full' },
        'wrk_fl_park_board_15': { name: 'Паркетная доска 15мм', unit: 'м²', price: 60, category: 'flooring_full' },
        'wrk_fl_park_board_20': { name: 'Паркетная доска 20мм', unit: 'м²', price: 80, category: 'flooring_full' },
        'wrk_fl_park_massiv_oak': { name: 'Массивная доска (дуб)', unit: 'м²', price: 100, category: 'flooring_full' },
        'wrk_fl_park_massiv_ash': { name: 'Массивная доска (ясень)', unit: 'м²', price: 90, category: 'flooring_full' },
        'wrk_fl_park_massiv_teak': { name: 'Массивная доска (тик)', unit: 'м²', price: 150, category: 'flooring_full' },
        'wrk_fl_park_massiv_walnut': { name: 'Массивная доска (орех)', unit: 'м²', price: 130, category: 'flooring_full' },
        'wrk_fl_park_border': { name: 'Фриз/бордюр паркетный', unit: 'м.п.', price: 50, category: 'flooring_full' },
        'wrk_fl_park_putty': { name: 'Шпатлёвка паркета', unit: 'м²', price: 10, category: 'flooring_full' },
        'wrk_fl_park_varnish_3': { name: 'Лакирование паркета (3 слоя)', unit: 'м²', price: 30, category: 'flooring_full' },

        // === LVT / КВАРЦВИНИЛ ===
        'wrk_fl_lvt_click_2': { name: 'Кварцвиниловая плитка (замок) 2мм', unit: 'м²', price: 25, category: 'flooring_full' },
        'wrk_fl_lvt_click_3': { name: 'Кварцвиниловая плитка (замок) 3мм', unit: 'м²', price: 30, category: 'flooring_full' },
        'wrk_fl_lvt_click_4': { name: 'Кварцвиниловая плитка (замок) 4мм', unit: 'м²', price: 35, category: 'flooring_full' },
        'wrk_fl_lvt_click_5': { name: 'Кварцвиниловая плитка (замок) 5мм', unit: 'м²', price: 40, category: 'flooring_full' },

        // === ЛИНОЛЕУМ ===
        'wrk_fl_lino_nat': { name: 'Линолеум натуральный (мармолеум)', unit: 'м²', price: 30, category: 'flooring_full' },
        'wrk_fl_lino_sport': { name: 'Спортивный линолеум', unit: 'м²', price: 25, category: 'flooring_full' },

        // === КОВРОЛИН ===
        'wrk_fl_carpet_iglopunch': { name: 'Ковролин иглопробивной', unit: 'м²', price: 10, category: 'flooring_full' },
        'wrk_fl_carpet_tufted': { name: 'Ковролин тафтинговый', unit: 'м²', price: 15, category: 'flooring_full' },
        'wrk_fl_carpet_tile': { name: 'Ковровая плитка', unit: 'м²', price: 20, category: 'flooring_full' },

        // === НАЛИВНЫЕ ПОЛЫ (ДЕКОРАТИВНЫЕ) ===
        'wrk_fl_pour_epoxy_1': { name: 'Эпоксидный наливной 1мм', unit: 'м²', price: 50, category: 'flooring_full' },
        'wrk_fl_pour_epoxy_2': { name: 'Эпоксидный наливной 2мм', unit: 'м²', price: 80, category: 'flooring_full' },
        'wrk_fl_pour_epoxy_3': { name: 'Эпоксидный наливной 3мм', unit: 'м²', price: 110, category: 'flooring_full' },
        'wrk_fl_pour_pu_1': { name: 'Полиуретановый наливной 1мм', unit: 'м²', price: 60, category: 'flooring_full' },
        'wrk_fl_pour_pu_2': { name: 'Полиуретановый наливной 2мм', unit: 'м²', price: 90, category: 'flooring_full' },
        'wrk_fl_pour_3d': { name: 'Наливной пол 3D', unit: 'м²', price: 200, category: 'flooring_full' },
        'wrk_fl_pour_quartz': { name: 'Кварцнаполненный пол', unit: 'м²', price: 100, category: 'flooring_full' },
        'wrk_fl_pour_flake': { name: 'Декоративный (чипсы/флоки)', unit: 'м²', price: 120, category: 'flooring_full' },
        'wrk_fl_pour_metallic': { name: 'Металлик-эпоксид (дизайн)', unit: 'м²', price: 150, category: 'flooring_full' },

        // === ТЕРРАСНАЯ ДОСКА ===
        'wrk_fl_terrace_dpc_prem': { name: 'Террасная доска ДПК (премиум)', unit: 'м²', price: 80, category: 'flooring_full' },
        'wrk_fl_terrace_wood': { name: 'Террасная доска (лиственница)', unit: 'м²', price: 70, category: 'flooring_full' },
        'wrk_fl_terrace_ipe': { name: 'Террасная доска (тик/ипе)', unit: 'м²', price: 150, category: 'flooring_full' },
        'wrk_fl_terrace_adjust': { name: 'Регулируемые опоры (терраса)', unit: 'шт', price: 10, category: 'flooring_full' },

        // === ПОДЛОЖКИ ===
        'wrk_fl_sub_cork_4': { name: 'Подложка пробковая 4мм', unit: 'м²', price: 15, category: 'flooring_full' },
        'wrk_fl_sub_tuple': { name: 'Подложка Tuplex 3мм', unit: 'м²', price: 8, category: 'flooring_full' },
        'wrk_fl_sub_quartz': { name: 'Подложка кварцевая', unit: 'м²', price: 12, category: 'flooring_full' },

        // === ПОРОГИ / ПРОФИЛИ ===
        'wrk_fl_threshold_multi': { name: 'Разноуровневый профиль', unit: 'м.п.', price: 15, category: 'flooring_full' },
    };
})();
