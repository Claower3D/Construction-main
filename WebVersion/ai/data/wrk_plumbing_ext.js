// === САНТЕХНИЧЕСКИЕ РАБОТЫ — водоснабжение, канализация, радиаторы, полотенцесушители (300 поз.) ===
(function () {
    window.AI_WRK_PLUMBING_EXT = {
        // === ВОДОСНАБЖЕНИЕ ===
        'wrk_plb_pipe_pp_20': { name: 'Монтаж водопровода ПП Ø20', unit: 'м.п.', price: 350, category: 'plumbing_ext' },
        'wrk_plb_pipe_pp_25': { name: 'Монтаж водопровода ПП Ø25', unit: 'м.п.', price: 450, category: 'plumbing_ext' },
        'wrk_plb_pipe_pp_32': { name: 'Монтаж водопровода ПП Ø32', unit: 'м.п.', price: 550, category: 'plumbing_ext' },
        'wrk_plb_pipe_pp_40': { name: 'Монтаж водопровода ПП Ø40', unit: 'м.п.', price: 750, category: 'plumbing_ext' },
        'wrk_plb_pipe_pp_50': { name: 'Монтаж водопровода ПП Ø50', unit: 'м.п.', price: 950, category: 'plumbing_ext' },
        'wrk_plb_pipe_pex_16': { name: 'Монтаж водопровода PEX Ø16', unit: 'м.п.', price: 300, category: 'plumbing_ext' },
        'wrk_plb_pipe_pex_20': { name: 'Монтаж водопровода PEX Ø20', unit: 'м.п.', price: 380, category: 'plumbing_ext' },
        'wrk_plb_pipe_pex_25': { name: 'Монтаж водопровода PEX Ø25', unit: 'м.п.', price: 480, category: 'plumbing_ext' },
        'wrk_plb_pipe_copper_15': { name: 'Монтаж водопровода медь Ø15', unit: 'м.п.', price: 850, category: 'plumbing_ext' },
        'wrk_plb_pipe_copper_22': { name: 'Монтаж водопровода медь Ø22', unit: 'м.п.', price: 1200, category: 'plumbing_ext' },
        'wrk_plb_pipe_steel_20': { name: 'Монтаж водопровода стальн. Ø20', unit: 'м.п.', price: 650, category: 'plumbing_ext' },
        'wrk_plb_pipe_steel_25': { name: 'Монтаж водопровода стальн. Ø25', unit: 'м.п.', price: 850, category: 'plumbing_ext' },
        'wrk_plb_pipe_steel_32': { name: 'Монтаж водопровода стальн. Ø32', unit: 'м.п.', price: 1100, category: 'plumbing_ext' },
        'wrk_plb_pipe_chase_wall': { name: 'Штробление стен под трубы', unit: 'м.п.', price: 350, category: 'plumbing_ext' },
        'wrk_plb_pipe_chase_floor': { name: 'Штробление пола под трубы', unit: 'м.п.', price: 450, category: 'plumbing_ext' },
        // === КАНАЛИЗАЦИЯ ВНУТРЕННЯЯ ===
        'wrk_plb_sewer_50': { name: 'Монтаж канализации Ø50', unit: 'м.п.', price: 450, category: 'plumbing_ext' },
        'wrk_plb_sewer_110': { name: 'Монтаж канализации Ø110', unit: 'м.п.', price: 650, category: 'plumbing_ext' },
        'wrk_plb_sewer_stack': { name: 'Монтаж канализационного стояка', unit: 'м.п.', price: 850, category: 'plumbing_ext' },
        'wrk_plb_sewer_vent': { name: 'Монтаж вентиляции канализации', unit: 'м.п.', price: 550, category: 'plumbing_ext' },
        // === САНТЕХПРИБОРЫ ===
        'wrk_plb_toilet_install': { name: 'Монтаж инсталляции для унитаза', unit: 'шт', price: 8500, category: 'plumbing_ext' },
        'wrk_plb_sink_kitchen': { name: 'Установка мойки кухонной', unit: 'шт', price: 3500, category: 'plumbing_ext' },
        'wrk_plb_sink_bath': { name: 'Установка умывальника на тумбе', unit: 'шт', price: 4500, category: 'plumbing_ext' },
        'wrk_plb_sink_wall': { name: 'Установка умывальника настенного', unit: 'шт', price: 3500, category: 'plumbing_ext' },
        'wrk_plb_sink_pedestal': { name: 'Установка умывальника на пьедестале', unit: 'шт', price: 4000, category: 'plumbing_ext' },
        'wrk_plb_bath_screen': { name: 'Установка экрана ванны', unit: 'шт', price: 3500, category: 'plumbing_ext' },
        'wrk_plb_shower_glass': { name: 'Монтаж стеклянной душевой перегородки', unit: 'шт', price: 15000, category: 'plumbing_ext' },
        'wrk_plb_shower_linear_drain': { name: 'Установка линейного трапа', unit: 'шт', price: 5500, category: 'plumbing_ext' },
        'wrk_plb_shower_point_drain': { name: 'Установка точечного трапа', unit: 'шт', price: 3500, category: 'plumbing_ext' },
        // === ЗАПОРНАЯ АРМАТУРА ===
        'wrk_plb_valve_ball_20': { name: 'Установка шарового крана Ø20', unit: 'шт', price: 850, category: 'plumbing_ext' },
        'wrk_plb_valve_ball_25': { name: 'Установка шарового крана Ø25', unit: 'шт', price: 1000, category: 'plumbing_ext' },
        'wrk_plb_valve_ball_32': { name: 'Установка шарового крана Ø32', unit: 'шт', price: 1200, category: 'plumbing_ext' },
        'wrk_plb_meter_water': { name: 'Установка счётчика воды', unit: 'шт', price: 2500, category: 'plumbing_ext' },
        // === ОТОПЛЕНИЕ ===
        'wrk_plb_radiator_steel_panel': { name: 'Установка радиатора стального панельного', unit: 'шт', price: 5500, category: 'plumbing_ext' },
        'wrk_plb_radiator_bimetal': { name: 'Установка радиатора биметаллического', unit: 'секция', price: 550, category: 'plumbing_ext' },
        'wrk_plb_radiator_alum': { name: 'Установка радиатора алюминиевого', unit: 'секция', price: 450, category: 'plumbing_ext' },
        'wrk_plb_radiator_cast': { name: 'Установка радиатора чугунного', unit: 'секция', price: 650, category: 'plumbing_ext' },
        'wrk_plb_radiator_designer': { name: 'Установка дизайн-радиатора', unit: 'шт', price: 8500, category: 'plumbing_ext' },
        'wrk_plb_towel_rail': { name: 'Установка полотенцесушителя водяного', unit: 'шт', price: 5500, category: 'plumbing_ext' },
        'wrk_plb_towel_rail_elec': { name: 'Установка полотенцесушителя электрического', unit: 'шт', price: 4500, category: 'plumbing_ext' },
        'wrk_plb_thermostat_valve': { name: 'Установка термостатического клапана', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        // === ТЁПЛЫЙ ПОЛ ===
        'wrk_plb_underfloor_water': { name: 'Монтаж водяного тёплого пола', unit: 'м²', price: 850, category: 'plumbing_ext' },
        'wrk_plb_underfloor_electric': { name: 'Монтаж электрического тёплого пола (мат)', unit: 'м²', price: 650, category: 'plumbing_ext' },
        'wrk_plb_underfloor_cable': { name: 'Монтаж электрического тёплого пола (кабель)', unit: 'м²', price: 750, category: 'plumbing_ext' },
        'wrk_plb_underfloor_ir': { name: 'Монтаж инфракрасного тёплого пола', unit: 'м²', price: 550, category: 'plumbing_ext' },
        // === ВОДОНАГРЕВАТЕЛИ ===
        'wrk_plb_boiler_gas': { name: 'Монтаж газового котла', unit: 'шт', price: 25000, category: 'plumbing_ext' },
        // === НАСОСЫ ===
    };
})();
