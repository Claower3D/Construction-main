// === ЭЛЕКТРОЩИТЫ, РАСПРЕДЕЛИТЕЛЬНЫЕ УСТРОЙСТВА (35 позиций) ===
(function () {
    window.AI_MAT_ELEC_PANELS = {
        // Щиты навесные / встраиваемые
        'panel_dist_4mod_n': { name: 'Щиток распределительный 4 модуля (навесной)', unit: 'шт', price: 600, category: 'elec_panels' },
        'panel_dist_8mod_n': { name: 'Щиток распределительный 8 модулей (навесной)', unit: 'шт', price: 900, category: 'elec_panels' },
        'panel_dist_12mod_n': { name: 'Щиток распределительный 12 модулей (навесной)', unit: 'шт', price: 1200, category: 'elec_panels' },
        'panel_dist_18mod_n': { name: 'Щиток распределительный 18 модулей (навесной)', unit: 'шт', price: 1800, category: 'elec_panels' },
        'panel_dist_24mod_n': { name: 'Щиток распределительный 24 модуля (навесной)', unit: 'шт', price: 2500, category: 'elec_panels' },
        'panel_dist_36mod_n': { name: 'Щиток распределительный 36 модулей (навесной)', unit: 'шт', price: 3500, category: 'elec_panels' },
        'panel_dist_12mod_e': { name: 'Щиток 12 модулей (встраиваемый)', unit: 'шт', price: 1500, category: 'elec_panels' },
        'panel_dist_24mod_e': { name: 'Щиток 24 модуля (встраиваемый)', unit: 'шт', price: 3000, category: 'elec_panels' },
        'panel_dist_36mod_e': { name: 'Щиток 36 модулей (встраиваемый)', unit: 'шт', price: 4200, category: 'elec_panels' },
        'panel_dist_54mod_e': { name: 'Щиток 54 модуля (встраиваемый)', unit: 'шт', price: 6000, category: 'elec_panels' },
        'panel_dist_72mod_e': { name: 'Щиток 72 модуля (встраиваемый)', unit: 'шт', price: 8000, category: 'elec_panels' },

        // Щиты учёта
        'panel_meter_1ph': { name: 'Щит учёта 1-фазный (с окном)', unit: 'шт', price: 2000, category: 'elec_panels' },
        'panel_meter_3ph': { name: 'Щит учёта 3-фазный (с окном)', unit: 'шт', price: 3500, category: 'elec_panels' },
        'panel_meter_outdoor': { name: 'Щит учёта уличный IP54', unit: 'шт', price: 5000, category: 'elec_panels' },

        // Шкафы ВРУ
        'vru_100a': { name: 'ВРУ (вводно-распределительное устройство) 100А', unit: 'шт', price: 25000, category: 'elec_panels' },
        'vru_250a': { name: 'ВРУ 250А', unit: 'шт', price: 60000, category: 'elec_panels' },
        'vru_400a': { name: 'ВРУ 400А', unit: 'шт', price: 100000, category: 'elec_panels' },

        // Автоматические выключатели (трёхфазные)
        'mcb_3p_16a_c': { name: 'Автомат 3P 16A хар.C', unit: 'шт', price: 350, category: 'elec_panels' },
        'mcb_3p_25a_c': { name: 'Автомат 3P 25A хар.C', unit: 'шт', price: 400, category: 'elec_panels' },
        'mcb_3p_32a_c': { name: 'Автомат 3P 32A хар.C', unit: 'шт', price: 450, category: 'elec_panels' },
        'mcb_3p_40a_c': { name: 'Автомат 3P 40A хар.C', unit: 'шт', price: 550, category: 'elec_panels' },
        'mcb_3p_63a_c': { name: 'Автомат 3P 63A хар.C', unit: 'шт', price: 800, category: 'elec_panels' },

        // Рубильники
        'switch_disconnect_63a': { name: 'Рубильник модульный 63А (3P)', unit: 'шт', price: 1500, category: 'elec_panels' },
        'switch_disconnect_100a': { name: 'Рубильник модульный 100А (3P)', unit: 'шт', price: 2500, category: 'elec_panels' },
        'switch_disconnect_160a': { name: 'Рубильник модульный 160А (3P)', unit: 'шт', price: 4000, category: 'elec_panels' },

        // АВР (автоматический ввод резерва)
        'ats_63a': { name: 'АВР на 63А (автоматический ввод резерва)', unit: 'шт', price: 15000, category: 'elec_panels' },
        'ats_100a': { name: 'АВР на 100А', unit: 'шт', price: 25000, category: 'elec_panels' },

        // Счётчики электроэнергии
        'meter_1ph_smart': { name: 'Счётчик электроэнергии 1-фазный (двутарифный)', unit: 'шт', price: 3000, category: 'elec_panels' },
        'meter_3ph_smart': { name: 'Счётчик электроэнергии 3-фазный (двутарифный)', unit: 'шт', price: 6000, category: 'elec_panels' },

        // Стабилизаторы напряжения
        'stabilizer_5kva': { name: 'Стабилизатор напряжения 5кВА', unit: 'шт', price: 15000, category: 'elec_panels' },
        'stabilizer_10kva': { name: 'Стабилизатор напряжения 10кВА', unit: 'шт', price: 30000, category: 'elec_panels' },
        'stabilizer_15kva': { name: 'Стабилизатор напряжения 15кВА', unit: 'шт', price: 45000, category: 'elec_panels' },

        // Генератор резервный
        'generator_3kw_petrol': { name: 'Генератор бензиновый 3кВт', unit: 'шт', price: 80000, category: 'elec_panels' },
        'generator_5kw_diesel': { name: 'Генератор дизельный 5кВт', unit: 'шт', price: 200000, category: 'elec_panels' },
        'generator_10kw_diesel': { name: 'Генератор дизельный 10кВт', unit: 'шт', price: 400000, category: 'elec_panels' }
    };
})();
