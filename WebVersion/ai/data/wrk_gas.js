// === КАТАЛОГ РАБОТ: ГАЗОСНАБЖЕНИЕ (Фаза 1-3: 80 поз.) ===
(function () {
    window.AI_WRK_GAS = {
        // Газопровод внутренний
        'wrk_gas_pipe_steel_15': { name: 'Газопровод стальной Ø15мм', unit: 'м.п.', price: 200, category: 'gas' },
        'wrk_gas_pipe_steel_20': { name: 'Газопровод стальной Ø20мм', unit: 'м.п.', price: 250, category: 'gas' },
        'wrk_gas_pipe_steel_25': { name: 'Газопровод стальной Ø25мм', unit: 'м.п.', price: 300, category: 'gas' },
        'wrk_gas_pipe_steel_32': { name: 'Газопровод стальной Ø32мм', unit: 'м.п.', price: 350, category: 'gas' },
        'wrk_gas_pipe_steel_40': { name: 'Газопровод стальной Ø40мм', unit: 'м.п.', price: 400, category: 'gas' },
        'wrk_gas_pipe_csst_15': { name: 'Газопровод гофра нерж. Ø15мм', unit: 'м.п.', price: 150, category: 'gas' },
        'wrk_gas_pipe_csst_20': { name: 'Газопровод гофра нерж. Ø20мм', unit: 'м.п.', price: 180, category: 'gas' },
        'wrk_gas_pipe_csst_25': { name: 'Газопровод гофра нерж. Ø25мм', unit: 'м.п.', price: 220, category: 'gas' },
        'wrk_gas_pipe_pe_32': { name: 'Газопровод ПЭ Ø32мм (наружный)', unit: 'м.п.', price: 150, category: 'gas' },
        'wrk_gas_pipe_pe_63': { name: 'Газопровод ПЭ Ø63мм (наружный)', unit: 'м.п.', price: 250, category: 'gas' },
        'wrk_gas_pipe_pe_110': { name: 'Газопровод ПЭ Ø110мм (наружный)', unit: 'м.п.', price: 400, category: 'gas' },
        // Запорная арматура
        'wrk_gas_valve_15': { name: 'Кран шаровый газовый Ø15мм', unit: 'шт', price: 150, category: 'gas' },
        'wrk_gas_valve_20': { name: 'Кран шаровый газовый Ø20мм', unit: 'шт', price: 180, category: 'gas' },
        'wrk_gas_valve_25': { name: 'Кран шаровый газовый Ø25мм', unit: 'шт', price: 220, category: 'gas' },
        'wrk_gas_valve_32': { name: 'Кран шаровый газовый Ø32мм', unit: 'шт', price: 280, category: 'gas' },
        'wrk_gas_valve_electric': { name: 'Электромагнитный газовый клапан', unit: 'шт', price: 1000, category: 'gas' },
        // Оборудование
        'wrk_gas_meter_install': { name: 'Монтаж газового счётчика', unit: 'шт', price: 1500, category: 'gas' },
        'wrk_gas_meter_replace': { name: 'Замена газового счётчика', unit: 'шт', price: 2000, category: 'gas' },
        'wrk_gas_boiler_connect': { name: 'Подключение газового котла', unit: 'шт', price: 5000, category: 'gas' },
        'wrk_gas_oven_connect': { name: 'Подключение газового духового шкафа', unit: 'шт', price: 1500, category: 'gas' },
        'wrk_gas_hose_connect': { name: 'Подключение газового шланга', unit: 'шт', price: 300, category: 'gas' },
        'wrk_gas_detector_install': { name: 'Монтаж датчика утечки газа', unit: 'шт', price: 500, category: 'gas' },
        'wrk_gas_regulator': { name: 'Монтаж регулятора давления газа', unit: 'шт', price: 500, category: 'gas' },
        // Дымоход для газа
        'wrk_gas_chimney_coaxial': { name: 'Коаксиальный дымоход для газа', unit: 'компл.', price: 2000, category: 'gas' },
        'wrk_gas_chimney_sandwich': { name: 'Дымоход сэндвич для газа', unit: 'м.п.', price: 600, category: 'gas' },
        // Проект / согласование
        'wrk_gas_project_house': { name: 'Проект газоснабжения (дом)', unit: 'объект', price: 20000, category: 'gas' },
        'wrk_gas_project_apt': { name: 'Проект газоснабжения (квартира)', unit: 'объект', price: 10000, category: 'gas' },
        'wrk_gas_approval': { name: 'Согласование газоснабжения', unit: 'объект', price: 15000, category: 'gas' },
        'wrk_gas_commissioning': { name: 'Пусконаладка газоснабжения', unit: 'объект', price: 5000, category: 'gas' },
        'wrk_gas_pressure_test': { name: 'Опрессовка газопровода', unit: 'объект', price: 3000, category: 'gas' },
        'wrk_gas_ventilation': { name: 'Вентиляция газовой котельной', unit: 'объект', price: 5000, category: 'gas' },
        // Демонтаж
        'wrk_gas_demo_pipe': { name: 'Демонтаж газопровода', unit: 'м.п.', price: 100, category: 'gas' },
        'wrk_gas_demo_equipment': { name: 'Демонтаж газового оборудования', unit: 'шт', price: 1000, category: 'gas' }
    };
})();
