// === ФАЗА 3: РАСШИРЕННЫЕ ДЕТАЛИЗИРОВАННЫЕ КАТАЛОГИ — ШТУКАТУРКА, ГИПСОКАРТОН, ПЛИТКА, САНТЕХНИКА (800+ поз.) ===
(function () {
    // === ДЕТАЛЬНАЯ ШТУКАТУРКА И ШПАКЛЁВКА ===
    window.AI_WRK_PLASTER_EXT = {
        // Штукатурка стен (детально)
        'wrk_plt_stuccoe_gips_15': { name: 'Штукатурка гипсовая 15мм', unit: 'м²', price: 130, category: 'plaster_ext' },
        'wrk_plt_stuccoe_gips_25': { name: 'Штукатурка гипсовая 25мм', unit: 'м²', price: 200, category: 'plaster_ext' },
        'wrk_plt_stuccoe_cps_15': { name: 'Штукатурка цементная 15мм', unit: 'м²', price: 150, category: 'plaster_ext' },
        'wrk_plt_stuccoe_cps_25': { name: 'Штукатурка цементная 25мм', unit: 'м²', price: 250, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_10': { name: 'Машинная штукатурка 10мм', unit: 'м²', price: 80, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_15': { name: 'Машинная штукатурка 15мм', unit: 'м²', price: 100, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_20': { name: 'Машинная штукатурка 20мм', unit: 'м²', price: 130, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_25': { name: 'Машинная штукатурка 25мм', unit: 'м²', price: 160, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_30': { name: 'Машинная штукатурка 30мм', unit: 'м²', price: 200, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_40': { name: 'Машинная штукатурка 40мм', unit: 'м²', price: 260, category: 'plaster_ext' },
        'wrk_plt_stuccoe_mach_50': { name: 'Машинная штукатурка 50мм', unit: 'м²', price: 320, category: 'plaster_ext' },
        // Шпаклёвка
        'wrk_plt_putty_finish_3x': { name: 'Шпаклёвка финишная 3 слоя', unit: 'м²', price: 100, category: 'plaster_ext' },
        'wrk_plt_putty_super_fin': { name: 'Шпаклёвка суперфиниш (под покраску)', unit: 'м²', price: 100, category: 'plaster_ext' },
        // Грунтовка
        'wrk_plt_primer_antic': { name: 'Грунтовка антигрибковая', unit: 'м²', price: 20, category: 'plaster_ext' },
        // Маяки и подготовка
        'wrk_plt_beacon_wall': { name: 'Установка маяков (стены)', unit: 'м²', price: 20, category: 'plaster_ext' },
        'wrk_plt_beacon_ceil': { name: 'Установка маяков (потолок)', unit: 'м²', price: 25, category: 'plaster_ext' },
        'wrk_plt_mesh_reinf': { name: 'Армирование штукатурки сеткой', unit: 'м²', price: 30, category: 'plaster_ext' },
        'wrk_plt_corner_pvc': { name: 'Уголок штукатурный ПВХ', unit: 'м.п.', price: 10, category: 'plaster_ext' },
        'wrk_plt_corner_metal': { name: 'Уголок штукатурный металл', unit: 'м.п.', price: 15, category: 'plaster_ext' },
        // Откосы
        'wrk_plt_slope_plaster': { name: 'Штукатурка откосов', unit: 'м.п.', price: 200, category: 'plaster_ext' },
        // Фасадная штукатурка
        'wrk_plt_facade_cem_15': { name: 'Фасадная штукатурка цемент 15мм', unit: 'м²', price: 200, category: 'plaster_ext' },
        'wrk_plt_facade_cem_20': { name: 'Фасадная штукатурка цемент 20мм', unit: 'м²', price: 250, category: 'plaster_ext' },
        'wrk_plt_facade_cem_30': { name: 'Фасадная штукатурка цемент 30мм', unit: 'м²', price: 350, category: 'plaster_ext' },
        'wrk_plt_facade_decor_koroed': { name: 'Декор. штукатурка «Короед» фасад', unit: 'м²', price: 200, category: 'plaster_ext' },
        'wrk_plt_facade_decor_shuba': { name: 'Декор. штукатурка «Шуба» фасад', unit: 'м²', price: 180, category: 'plaster_ext' },
        'wrk_plt_facade_mineral': { name: 'Минеральная декор. штукатурка', unit: 'м²', price: 200, category: 'plaster_ext' },
        'wrk_plt_facade_silicone': { name: 'Силиконовая декор. штукатурка', unit: 'м²', price: 300, category: 'plaster_ext' },
        'wrk_plt_facade_acrylic': { name: 'Акриловая декор. штукатурка', unit: 'м²', price: 250, category: 'plaster_ext' },
        // Внутренние декоративные
        'wrk_plt_decor_marmo': { name: 'Штукатурка под мрамор', unit: 'м²', price: 600, category: 'plaster_ext' },
        'wrk_plt_decor_travertino': { name: 'Штукатурка «Травертино»', unit: 'м²', price: 400, category: 'plaster_ext' },
        'wrk_plt_decor_silk': { name: 'Штукатурка «Мокрый шёлк»', unit: 'м²', price: 450, category: 'plaster_ext' },
        'wrk_plt_decor_concrete': { name: 'Штукатурка под бетон (лофт)', unit: 'м²', price: 350, category: 'plaster_ext' },
        'wrk_plt_decor_microcement': { name: 'Микроцемент', unit: 'м²', price: 500, category: 'plaster_ext' },
        'wrk_plt_decor_stucco': { name: 'Стукко (глянцевая штукатурка)', unit: 'м²', price: 600, category: 'plaster_ext' },
        'wrk_plt_decor_koroed_int': { name: 'Декор. штукатурка «Короед» внутр.', unit: 'м²', price: 180, category: 'plaster_ext' },
        'wrk_plt_decor_bark_int': { name: 'Декор. штукатурка «Кора дерева»', unit: 'м²', price: 200, category: 'plaster_ext' }
    };

    // === ДЕТАЛЬНАЯ САНТЕХНИКА — РАСШИРЕНИЕ ===
    window.AI_WRK_PLUMBING_EXT = {
        // Канализация — внутренняя (детально)
        'wrk_plb_sewer_50': { name: 'Канализация ПВХ Ø50мм (внутр.)', unit: 'м.п.', price: 60, category: 'plumbing_ext' },
        'wrk_plb_sewer_110': { name: 'Канализация ПВХ Ø110мм (внутр.)', unit: 'м.п.', price: 80, category: 'plumbing_ext' },
        'wrk_plb_sewer_fitting': { name: 'Фитинг канализационный (монтаж)', unit: 'шт', price: 30, category: 'plumbing_ext' },
        'wrk_plb_sewer_trap': { name: 'Трап душевой (пол)', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_sewer_trap_linear': { name: 'Линейный трап (щелевой)', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        // Водоснабжение внутреннее
        'wrk_plb_water_ppr_20': { name: 'Водопровод PPR Ø20мм', unit: 'м.п.', price: 50, category: 'plumbing_ext' },
        'wrk_plb_water_ppr_25': { name: 'Водопровод PPR Ø25мм', unit: 'м.п.', price: 60, category: 'plumbing_ext' },
        'wrk_plb_water_ppr_32': { name: 'Водопровод PPR Ø32мм', unit: 'м.п.', price: 75, category: 'plumbing_ext' },
        'wrk_plb_water_ppr_40': { name: 'Водопровод PPR Ø40мм', unit: 'м.п.', price: 90, category: 'plumbing_ext' },
        'wrk_plb_water_pex_16': { name: 'Водопровод PEX Ø16мм', unit: 'м.п.', price: 40, category: 'plumbing_ext' },
        'wrk_plb_water_pex_20': { name: 'Водопровод PEX Ø20мм', unit: 'м.п.', price: 50, category: 'plumbing_ext' },
        'wrk_plb_water_pex_25': { name: 'Водопровод PEX Ø25мм', unit: 'м.п.', price: 65, category: 'plumbing_ext' },
        'wrk_plb_water_pex_32': { name: 'Водопровод PEX Ø32мм', unit: 'м.п.', price: 80, category: 'plumbing_ext' },
        'wrk_plb_water_copper_15': { name: 'Водопровод медный Ø15мм', unit: 'м.п.', price: 120, category: 'plumbing_ext' },
        'wrk_plb_water_copper_22': { name: 'Водопровод медный Ø22мм', unit: 'м.п.', price: 160, category: 'plumbing_ext' },
        'wrk_plb_water_copper_28': { name: 'Водопровод медный Ø28мм', unit: 'м.п.', price: 200, category: 'plumbing_ext' },
        'wrk_plb_water_mppl_16': { name: 'Металлопластик Ø16мм', unit: 'м.п.', price: 35, category: 'plumbing_ext' },
        'wrk_plb_water_mppl_20': { name: 'Металлопластик Ø20мм', unit: 'м.п.', price: 45, category: 'plumbing_ext' },
        'wrk_plb_water_mppl_26': { name: 'Металлопластик Ø26мм', unit: 'м.п.', price: 60, category: 'plumbing_ext' },
        'wrk_plb_water_mppl_32': { name: 'Металлопластик Ø32мм', unit: 'м.п.', price: 80, category: 'plumbing_ext' },
        'wrk_plb_water_steel_15': { name: 'Трубы стальные водопровод Ø15мм', unit: 'м.п.', price: 80, category: 'plumbing_ext' },
        'wrk_plb_water_steel_20': { name: 'Трубы стальные водопровод Ø20мм', unit: 'м.п.', price: 100, category: 'plumbing_ext' },
        'wrk_plb_water_steel_25': { name: 'Трубы стальные водопровод Ø25мм', unit: 'м.п.', price: 120, category: 'plumbing_ext' },
        'wrk_plb_water_steel_32': { name: 'Трубы стальные водопровод Ø32мм', unit: 'м.п.', price: 150, category: 'plumbing_ext' },
        // Коллекторная разводка
        'wrk_plb_manifold_4': { name: 'Коллектор водоснабжения 4 отвода', unit: 'шт', price: 1000, category: 'plumbing_ext' },
        'wrk_plb_manifold_6': { name: 'Коллектор водоснабжения 6 отводов', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        'wrk_plb_manifold_8': { name: 'Коллектор водоснабжения 8 отводов', unit: 'шт', price: 2000, category: 'plumbing_ext' },
        'wrk_plb_manifold_cabinet': { name: 'Шкаф коллекторный', unit: 'шт', price: 500, category: 'plumbing_ext' },
        // Сантехприборы — расширенный
        'wrk_plb_toilet_floor': { name: 'Установка унитаза напольного', unit: 'шт', price: 800, category: 'plumbing_ext' },
        'wrk_plb_toilet_wall': { name: 'Установка унитаза подвесного', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        'wrk_plb_toilet_install_frame': { name: 'Монтаж инсталляции (рама)', unit: 'шт', price: 2000, category: 'plumbing_ext' },
        'wrk_plb_bidet_install': { name: 'Установка биде', unit: 'шт', price: 800, category: 'plumbing_ext' },
        'wrk_plb_bidet_spray': { name: 'Установка гигиен. душа', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_sink_install': { name: 'Установка раковины', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_sink_pedestal': { name: 'Установка раковины на пьедестале', unit: 'шт', price: 600, category: 'plumbing_ext' },
        'wrk_plb_sink_countertop': { name: 'Установка накладной раковины', unit: 'шт', price: 800, category: 'plumbing_ext' },
        'wrk_plb_sink_vanity': { name: 'Установка тумбы с раковиной', unit: 'шт', price: 1000, category: 'plumbing_ext' },
        'wrk_plb_bath_acrylic': { name: 'Установка ванны акриловой', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        'wrk_plb_bath_castiron': { name: 'Установка ванны чугунной', unit: 'шт', price: 2000, category: 'plumbing_ext' },
        'wrk_plb_bath_steel': { name: 'Установка ванны стальной', unit: 'шт', price: 1200, category: 'plumbing_ext' },
        'wrk_plb_bath_hydro': { name: 'Установка гидромассажной ванны', unit: 'шт', price: 3000, category: 'plumbing_ext' },
        'wrk_plb_shower_cabin': { name: 'Установка душевой кабины', unit: 'шт', price: 2000, category: 'plumbing_ext' },
        'wrk_plb_shower_tray': { name: 'Установка душевого поддона', unit: 'шт', price: 800, category: 'plumbing_ext' },
        'wrk_plb_shower_screen': { name: 'Установка стеклянной шторки', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        'wrk_plb_shower_walk_in': { name: 'Душевая зона walk-in (монтаж)', unit: 'шт', price: 3000, category: 'plumbing_ext' },
        'wrk_plb_faucet_bath': { name: 'Установка смесителя для ванны', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_faucet_sink': { name: 'Установка смесителя для раковины', unit: 'шт', price: 400, category: 'plumbing_ext' },
        'wrk_plb_faucet_shower': { name: 'Установка смесителя для душа', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_faucet_built_in': { name: 'Установка встроенного смесителя', unit: 'шт', price: 1000, category: 'plumbing_ext' },
        'wrk_plb_faucet_thermo': { name: 'Установка термостатического смесителя', unit: 'шт', price: 800, category: 'plumbing_ext' },
        // Водонагреватели
        'wrk_plb_boiler_30': { name: 'Установка бойлера 30л', unit: 'шт', price: 1000, category: 'plumbing_ext' },
        'wrk_plb_boiler_50': { name: 'Установка бойлера 50л', unit: 'шт', price: 1200, category: 'plumbing_ext' },
        'wrk_plb_boiler_80': { name: 'Установка бойлера 80л', unit: 'шт', price: 1500, category: 'plumbing_ext' },
        'wrk_plb_boiler_100': { name: 'Установка бойлера 100л', unit: 'шт', price: 1800, category: 'plumbing_ext' },
        'wrk_plb_boiler_150': { name: 'Установка бойлера 150л', unit: 'шт', price: 2200, category: 'plumbing_ext' },
        'wrk_plb_boiler_200': { name: 'Установка бойлера 200л', unit: 'шт', price: 2500, category: 'plumbing_ext' },
        'wrk_plb_heater_flow': { name: 'Установка проточного водонагревателя', unit: 'шт', price: 800, category: 'plumbing_ext' },
        // Фильтры
        'wrk_plb_filter_main': { name: 'Установка магистрального фильтра', unit: 'шт', price: 300, category: 'plumbing_ext' },
        'wrk_plb_filter_ro': { name: 'Установка обратного осмоса', unit: 'шт', price: 1000, category: 'plumbing_ext' },
        'wrk_plb_filter_softener': { name: 'Установка умягчителя воды', unit: 'шт', price: 2000, category: 'plumbing_ext' },
        'wrk_plb_filter_iron': { name: 'Установка обезжелезивателя', unit: 'шт', price: 2000, category: 'plumbing_ext' },
        // Счётчики
        'wrk_plb_meter_water_cold': { name: 'Установка счётчика ХВС', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_meter_water_hot': { name: 'Установка счётчика ГВС', unit: 'шт', price: 500, category: 'plumbing_ext' },
        'wrk_plb_meter_replace': { name: 'Замена счётчика воды', unit: 'шт', price: 500, category: 'plumbing_ext' },
        // Запорная арматура
        'wrk_plb_valve_ball_15': { name: 'Кран шаровый Ø15мм (водоснаб.)', unit: 'шт', price: 50, category: 'plumbing_ext' },
        'wrk_plb_valve_ball_20': { name: 'Кран шаровый Ø20мм (водоснаб.)', unit: 'шт', price: 60, category: 'plumbing_ext' },
        'wrk_plb_valve_ball_25': { name: 'Кран шаровый Ø25мм (водоснаб.)', unit: 'шт', price: 80, category: 'plumbing_ext' },
        'wrk_plb_valve_ball_32': { name: 'Кран шаровый Ø32мм (водоснаб.)', unit: 'шт', price: 100, category: 'plumbing_ext' },
        'wrk_plb_valve_safety': { name: 'Предохранит. клапан', unit: 'шт', price: 100, category: 'plumbing_ext' },
        // Демонтаж сантехники
        'wrk_plb_demo_pipe': { name: 'Демонтаж трубопровода водосн.', unit: 'м.п.', price: 30, category: 'plumbing_ext' },
        'wrk_plb_demo_boiler': { name: 'Демонтаж бойлера', unit: 'шт', price: 500, category: 'plumbing_ext' },
        // Опрессовка
        'wrk_plb_test_pressure': { name: 'Опрессовка водоснабжения', unit: 'точка', price: 100, category: 'plumbing_ext' },
        'wrk_plb_test_system': { name: 'Испытание системы водосн.', unit: 'объект', price: 2000, category: 'plumbing_ext' }
    };
})();
