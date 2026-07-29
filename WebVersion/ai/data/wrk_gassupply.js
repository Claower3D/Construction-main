// === ГАЗОСНАБЖЕНИЕ — внутренние и наружные сети, ГРП, котельные газ, ВДГО (55 поз.) ===
(function () {
    window.AI_WRK_GASSUPPLY = {
        // === НАРУЖНЫЕ ГАЗОПРОВОДЫ === 1-12
        'wrk_gas_pe_63': { name: 'Монтаж газопровода ПЭ Ø63', unit: 'м.п.', price: 850, category: 'gassupply' },
        'wrk_gas_pe_90': { name: 'Монтаж газопровода ПЭ Ø90', unit: 'м.п.', price: 1200, category: 'gassupply' },
        'wrk_gas_pe_110': { name: 'Монтаж газопровода ПЭ Ø110', unit: 'м.п.', price: 1500, category: 'gassupply' },
        'wrk_gas_pe_160': { name: 'Монтаж газопровода ПЭ Ø160', unit: 'м.п.', price: 2500, category: 'gassupply' },
        'wrk_gas_pe_225': { name: 'Монтаж газопровода ПЭ Ø225', unit: 'м.п.', price: 3500, category: 'gassupply' },
        'wrk_gas_pe_315': { name: 'Монтаж газопровода ПЭ Ø315', unit: 'м.п.', price: 5500, category: 'gassupply' },
        'wrk_gas_steel_57': { name: 'Монтаж газопровода стальн. Ø57', unit: 'м.п.', price: 1200, category: 'gassupply' },
        'wrk_gas_steel_89': { name: 'Монтаж газопровода стальн. Ø89', unit: 'м.п.', price: 1800, category: 'gassupply' },
        'wrk_gas_steel_108': { name: 'Монтаж газопровода стальн. Ø108', unit: 'м.п.', price: 2500, category: 'gassupply' },
        'wrk_gas_steel_159': { name: 'Монтаж газопровода стальн. Ø159', unit: 'м.п.', price: 3500, category: 'gassupply' },
        'wrk_gas_steel_219': { name: 'Монтаж газопровода стальн. Ø219', unit: 'м.п.', price: 5500, category: 'gassupply' },
        'wrk_gas_weld_joint': { name: 'Сварка стыков газопровода', unit: 'стык', price: 850, category: 'gassupply' },
        // === АРМАТУРА === 13-18
        'wrk_gas_valve_50': { name: 'Монтаж запорной арматуры Ø50', unit: 'шт', price: 3500, category: 'gassupply' },
        'wrk_gas_valve_100': { name: 'Монтаж запорной арматуры Ø100', unit: 'шт', price: 8500, category: 'gassupply' },
        'wrk_gas_valve_150': { name: 'Монтаж запорной арматуры Ø150', unit: 'шт', price: 15000, category: 'gassupply' },
        'wrk_gas_valve_200': { name: 'Монтаж запорной арматуры Ø200', unit: 'шт', price: 25000, category: 'gassupply' },
        'wrk_gas_compensator': { name: 'Монтаж компенсатора', unit: 'шт', price: 5500, category: 'gassupply' },
        'wrk_gas_insulation_joint': { name: 'Монтаж изолирующего соединения', unit: 'шт', price: 3500, category: 'gassupply' },
        // === ГРП/ГРШ === 19-24
        'wrk_gas_grp_sm': { name: 'Монтаж ГРШ (до 100 нм³/ч)', unit: 'шт', price: 120000, category: 'gassupply' },
        'wrk_gas_grp_md': { name: 'Монтаж ГРП (до 500 нм³/ч)', unit: 'шт', price: 350000, category: 'gassupply' },
        'wrk_gas_grp_lg': { name: 'Монтаж ГРП (до 2000 нм³/ч)', unit: 'шт', price: 850000, category: 'gassupply' },
        'wrk_gas_regulator': { name: 'Монтаж регулятора давления', unit: 'шт', price: 35000, category: 'gassupply' },
        'wrk_gas_filter_grp': { name: 'Монтаж фильтра ГРП', unit: 'шт', price: 15000, category: 'gassupply' },
        'wrk_gas_safety_valve': { name: 'Монтаж предохранительного клапана', unit: 'шт', price: 8500, category: 'gassupply' },
        // === ВНУТРЕННЕЕ (ВДГО) === 25-34
        'wrk_gas_int_pipe_15': { name: 'Газопровод внутренний Ø15', unit: 'м.п.', price: 550, category: 'gassupply' },
        'wrk_gas_int_pipe_20': { name: 'Газопровод внутренний Ø20', unit: 'м.п.', price: 650, category: 'gassupply' },
        'wrk_gas_int_pipe_25': { name: 'Газопровод внутренний Ø25', unit: 'м.п.', price: 850, category: 'gassupply' },
        'wrk_gas_int_pipe_32': { name: 'Газопровод внутренний Ø32', unit: 'м.п.', price: 1050, category: 'gassupply' },
        'wrk_gas_int_pipe_50': { name: 'Газопровод внутренний Ø50', unit: 'м.п.', price: 1500, category: 'gassupply' },
        'wrk_gas_int_valve': { name: 'Кран шаровый газовый (внутренний)', unit: 'шт', price: 1500, category: 'gassupply' },
        'wrk_gas_int_flex_hose': { name: 'Подключение гибкой подводкой', unit: 'шт', price: 550, category: 'gassupply' },
        'wrk_gas_int_detector': { name: 'Установка газоанализатора', unit: 'шт', price: 3500, category: 'gassupply' },
        'wrk_gas_int_solenoid': { name: 'Установка электромагнитного клапана', unit: 'шт', price: 5500, category: 'gassupply' },
        // === ГАЗОВОЕ ОБОРУДОВАНИЕ === 35-42
        'wrk_gas_boiler_wall_24': { name: 'Монтаж настенного котла 24кВт', unit: 'шт', price: 8500, category: 'gassupply' },
        'wrk_gas_boiler_wall_32': { name: 'Монтаж настенного котла 32кВт', unit: 'шт', price: 12000, category: 'gassupply' },
        'wrk_gas_boiler_floor_50': { name: 'Монтаж напольного котла 50кВт', unit: 'шт', price: 25000, category: 'gassupply' },
        'wrk_gas_boiler_floor_100': { name: 'Монтаж напольного котла 100кВт', unit: 'шт', price: 55000, category: 'gassupply' },
        'wrk_gas_boiler_floor_250': { name: 'Монтаж напольного котла 250кВт', unit: 'шт', price: 120000, category: 'gassupply' },
        'wrk_gas_water_heater': { name: 'Монтаж газовой колонки', unit: 'шт', price: 5500, category: 'gassupply' },
        // === ИСПЫТАНИЯ === 43-48
        'wrk_gas_test_pressure': { name: 'Испытания газопровода на прочность', unit: 'компл.', price: 15000, category: 'gassupply' },
        'wrk_gas_test_leak': { name: 'Испытания газопровода на герметичность', unit: 'компл.', price: 8500, category: 'gassupply' },
        'wrk_gas_xray': { name: 'Рентген сварных швов газопровода', unit: 'стык', price: 3500, category: 'gassupply' },
        'wrk_gas_commissioning': { name: 'ПНР газового оборудования', unit: 'компл.', price: 15000, category: 'gassupply' },
        'wrk_gas_documentation': { name: 'Исполнительная документация (газ)', unit: 'компл.', price: 25000, category: 'gassupply' },
        'wrk_gas_registration': { name: 'Регистрация в Ростехнадзоре', unit: 'компл.', price: 35000, category: 'gassupply' }
    };
})();
