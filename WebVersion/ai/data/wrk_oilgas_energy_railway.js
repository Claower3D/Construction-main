// === ФАЗА 3: НЕФТЕГАЗ, ЭНЕРГЕТИКА, ЖЕЛЕЗНАЯ ДОРОГА, ГИДРОТЕХНИКА (300 поз.) ===
(function () {
    // === НЕФТЕГАЗОВОЕ СТРОИТЕЛЬСТВО ===
    window.AI_WRK_OILGAS = {
        // Трубопроводы нефтегаз
        'wrk_og_pipe_steel_159': { name: 'Трубопровод стальной Ø159мм (нефтегаз)', unit: 'м.п.', price: 1500, category: 'oilgas' },
        'wrk_og_pipe_steel_219': { name: 'Трубопровод Ø219мм', unit: 'м.п.', price: 2000, category: 'oilgas' },
        'wrk_og_pipe_steel_273': { name: 'Трубопровод Ø273мм', unit: 'м.п.', price: 2500, category: 'oilgas' },
        'wrk_og_pipe_steel_325': { name: 'Трубопровод Ø325мм', unit: 'м.п.', price: 3000, category: 'oilgas' },
        'wrk_og_pipe_steel_426': { name: 'Трубопровод Ø426мм', unit: 'м.п.', price: 4000, category: 'oilgas' },
        'wrk_og_pipe_steel_530': { name: 'Трубопровод Ø530мм', unit: 'м.п.', price: 5000, category: 'oilgas' },
        'wrk_og_pipe_steel_720': { name: 'Трубопровод Ø720мм', unit: 'м.п.', price: 7000, category: 'oilgas' },
        'wrk_og_pipe_steel_1020': { name: 'Трубопровод Ø1020мм', unit: 'м.п.', price: 10000, category: 'oilgas' },
        'wrk_og_pipe_steel_1220': { name: 'Трубопровод Ø1220мм', unit: 'м.п.', price: 15000, category: 'oilgas' },
        'wrk_og_pipe_steel_1420': { name: 'Трубопровод Ø1420мм', unit: 'м.п.', price: 20000, category: 'oilgas' },
        'wrk_og_pipe_insul_pu': { name: 'Изоляция труб ПУ (нефтегаз)', unit: 'м.п.', price: 300, category: 'oilgas' },
        'wrk_og_pipe_insul_bitum': { name: 'Изоляция труб битумная', unit: 'м.п.', price: 200, category: 'oilgas' },
        'wrk_og_pipe_insul_pe_shell': { name: 'Изоляция ПЭ-оболочка', unit: 'м.п.', price: 250, category: 'oilgas' },
        'wrk_og_pipe_weld_ndt': { name: 'НК сварных соединений (100%)', unit: 'стык', price: 1000, category: 'oilgas' },
        'wrk_og_pipe_test_hydro': { name: 'Гидростатическое испытание', unit: 'участок', price: 10000, category: 'oilgas' },
        'wrk_og_pipe_test_pneum': { name: 'Пневматическое испытание', unit: 'участок', price: 8000, category: 'oilgas' },
        // Резервуары
        'wrk_og_tank_rvs_100': { name: 'РВС-100 (монтаж)', unit: 'шт', price: 300000, category: 'oilgas' },
        'wrk_og_tank_rvs_400': { name: 'РВС-400 (монтаж)', unit: 'шт', price: 500000, category: 'oilgas' },
        'wrk_og_tank_rvs_1000': { name: 'РВС-1000 (монтаж)', unit: 'шт', price: 800000, category: 'oilgas' },
        'wrk_og_tank_rvs_2000': { name: 'РВС-2000 (монтаж)', unit: 'шт', price: 1200000, category: 'oilgas' },
        'wrk_og_tank_rvs_5000': { name: 'РВС-5000 (монтаж)', unit: 'шт', price: 2000000, category: 'oilgas' },
        'wrk_og_tank_foundation': { name: 'Фундамент под РВС', unit: 'шт', price: 200000, category: 'oilgas' },
        'wrk_og_tank_anticor': { name: 'Антикор. окраска РВС', unit: 'м²', price: 300, category: 'oilgas' },
        // Площадки
        'wrk_og_wellpad_prep': { name: 'Подготовка кустовой площадки', unit: 'м²', price: 200, category: 'oilgas' },
        'wrk_og_wellpad_road': { name: 'Подъездная дорога (нефтегаз)', unit: 'м²', price: 300, category: 'oilgas' },
        'wrk_og_separator_install': { name: 'Монтаж сепаратора', unit: 'шт', price: 100000, category: 'oilgas' },
        'wrk_og_pump_station': { name: 'Насосная станция (монтаж)', unit: 'шт', price: 300000, category: 'oilgas' },
        'wrk_og_compressor_install': { name: 'Компрессорная (монтаж)', unit: 'шт', price: 500000, category: 'oilgas' },
        // Газораспределение
        'wrk_og_grp_box': { name: 'Монтаж ГРПШ (шкафной)', unit: 'шт', price: 50000, category: 'oilgas' }
    };

    // === ЭНЕРГЕТИЧЕСКОЕ СТРОИТЕЛЬСТВО ===
    window.AI_WRK_ENERGY = {
        // Подстанции
        'wrk_eng_tp_6kv': { name: 'Монтаж ТП 6кВ', unit: 'шт', price: 200000, category: 'energy' },
        'wrk_eng_tp_10kv': { name: 'Монтаж ТП 10кВ', unit: 'шт', price: 300000, category: 'energy' },
        'wrk_eng_tp_35kv': { name: 'Монтаж ТП 35кВ', unit: 'шт', price: 500000, category: 'energy' },
        'wrk_eng_tp_110kv': { name: 'Монтаж ПС 110кВ', unit: 'шт', price: 2000000, category: 'energy' },
        'wrk_eng_transformer_100': { name: 'Монтаж трансформатора 100кВА', unit: 'шт', price: 20000, category: 'energy' },
        'wrk_eng_transformer_1600': { name: 'Монтаж трансформатора 1600кВА', unit: 'шт', price: 100000, category: 'energy' },
        // Высоковольтное оборудование
        'wrk_eng_switchgear_6kv': { name: 'Монтаж КРУ 6кВ', unit: 'ячейка', price: 50000, category: 'energy' },
        'wrk_eng_switchgear_10kv': { name: 'Монтаж КРУ 10кВ', unit: 'ячейка', price: 60000, category: 'energy' },
        'wrk_eng_breaker_6kv': { name: 'Монтаж выключателя 6кВ', unit: 'шт', price: 15000, category: 'energy' },
        'wrk_eng_breaker_10kv': { name: 'Монтаж выключателя 10кВ', unit: 'шт', price: 20000, category: 'energy' },
        'wrk_eng_breaker_35kv': { name: 'Монтаж выключателя 35кВ', unit: 'шт', price: 50000, category: 'energy' },
        'wrk_eng_breaker_110kv': { name: 'Монтаж выключателя 110кВ', unit: 'шт', price: 150000, category: 'energy' },
        // Линии электропередач
        'wrk_eng_lep_vl_10kv': { name: 'ВЛ 10кВ (монтаж)', unit: 'км', price: 500000, category: 'energy' },
        'wrk_eng_lep_vl_35kv': { name: 'ВЛ 35кВ (монтаж)', unit: 'км', price: 1000000, category: 'energy' },
        'wrk_eng_lep_vl_110kv': { name: 'ВЛ 110кВ (монтаж)', unit: 'км', price: 3000000, category: 'energy' },
        'wrk_eng_lep_kl_6kv': { name: 'КЛ 6кВ (кабельная линия)', unit: 'м.п.', price: 300, category: 'energy' },
        'wrk_eng_lep_kl_10kv': { name: 'КЛ 10кВ (кабельная линия)', unit: 'м.п.', price: 400, category: 'energy' },
        'wrk_eng_lep_kl_35kv': { name: 'КЛ 35кВ (кабельная линия)', unit: 'м.п.', price: 1000, category: 'energy' },
        'wrk_eng_pole_concrete_vl': { name: 'Установка ж/б опоры ВЛ', unit: 'шт', price: 8000, category: 'energy' },
        'wrk_eng_pole_metal_vl': { name: 'Установка металлической опоры ВЛ', unit: 'шт', price: 20000, category: 'energy' },
        // Солнечная энергетика
        'wrk_eng_solar_panel_mount': { name: 'Монтаж солнечной панели', unit: 'шт', price: 500, category: 'energy' },
        'wrk_eng_solar_frame_ground': { name: 'Каркас наземный (солнечная)', unit: 'кВт', price: 5000, category: 'energy' },
        'wrk_eng_solar_frame_roof': { name: 'Каркас кровельный (солнечная)', unit: 'кВт', price: 3000, category: 'energy' },
        'wrk_eng_solar_inverter': { name: 'Монтаж инвертора', unit: 'шт', price: 5000, category: 'energy' },
        'wrk_eng_solar_battery': { name: 'Монтаж АКБ (солнечная)', unit: 'шт', price: 3000, category: 'energy' },
        'wrk_eng_solar_cable': { name: 'Кабельная продукция (солнечная)', unit: 'кВт', price: 2000, category: 'energy' },
        // Ветроэнергетика
        'wrk_eng_wind_foundation': { name: 'Фундамент ветрогенератора', unit: 'шт', price: 1000000, category: 'energy' },
        'wrk_eng_wind_tower': { name: 'Монтаж башни ВЭУ', unit: 'шт', price: 500000, category: 'energy' },
        'wrk_eng_wind_nacelle': { name: 'Монтаж гондолы ВЭУ', unit: 'шт', price: 300000, category: 'energy' },
        'wrk_eng_wind_blade': { name: 'Монтаж лопастей ВЭУ', unit: 'компл.', price: 200000, category: 'energy' },
        // ДЭС
        'wrk_eng_dgs_install_100': { name: 'Монтаж ДГУ до 100кВА', unit: 'шт', price: 20000, category: 'energy' },
        'wrk_eng_dgs_install_200': { name: 'Монтаж ДГУ 100-200кВА', unit: 'шт', price: 30000, category: 'energy' },
        'wrk_eng_dgs_install_500': { name: 'Монтаж ДГУ 200-500кВА', unit: 'шт', price: 50000, category: 'energy' },
        'wrk_eng_dgs_install_1000': { name: 'Монтаж ДГУ 500-1000кВА', unit: 'шт', price: 80000, category: 'energy' }
    };

    // === ЖЕЛЕЗНОДОРОЖНОЕ СТРОИТЕЛЬСТВО ===
    window.AI_WRK_RAILWAY = {
        'wrk_rw_subgrade_fill': { name: 'Насыпь земляного полотна', unit: 'м³', price: 100, category: 'railway' },
        'wrk_rw_subgrade_cut': { name: 'Выемка земляного полотна', unit: 'м³', price: 80, category: 'railway' },
        'wrk_rw_ballast_crushed': { name: 'Балластная призма (щебень)', unit: 'м³', price: 300, category: 'railway' },
        'wrk_rw_ballast_sand': { name: 'Подбалластный слой (песок)', unit: 'м³', price: 150, category: 'railway' },
        'wrk_rw_rail_r65': { name: 'Укладка рельса Р65', unit: 'м.п.', price: 500, category: 'railway' },
        'wrk_rw_rail_r50': { name: 'Укладка рельса Р50', unit: 'м.п.', price: 400, category: 'railway' },
        'wrk_rw_sleeper_conc': { name: 'Укладка ж/б шпалы', unit: 'шт', price: 300, category: 'railway' },
        'wrk_rw_sleeper_wood': { name: 'Укладка деревянной шпалы', unit: 'шт', price: 200, category: 'railway' },
        'wrk_rw_track_panel': { name: 'Укладка звеньев путевой решётки', unit: 'звено', price: 10000, category: 'railway' },
        'wrk_rw_welding_rail_thermo': { name: 'Термитная сварка рельсов', unit: 'стык', price: 3000, category: 'railway' },
        'wrk_rw_welding_rail_elec': { name: 'Электроконтактная сварка рельсов', unit: 'стык', price: 5000, category: 'railway' },
        'wrk_rw_alignment': { name: 'Выправка пути', unit: 'км', price: 50000, category: 'railway' },
        'wrk_rw_crane_rail_inst': { name: 'Укладка подкранового рельса', unit: 'м.п.', price: 1000, category: 'railway' },
        'wrk_rw_platform': { name: 'Платформа пассажирская', unit: 'м.п.', price: 5000, category: 'railway' },
        'wrk_rw_crossing': { name: 'Устройство переезда', unit: 'шт', price: 100000, category: 'railway' },
        'wrk_rw_signal_install': { name: 'Монтаж светофора ж/д', unit: 'шт', price: 10000, category: 'railway' },
        'wrk_rw_contact_wire': { name: 'Монтаж контактной сети', unit: 'км', price: 500000, category: 'railway' }
    };

    // === ГИДРОТЕХНИЧЕСКИЕ СООРУЖЕНИЯ ===
    window.AI_WRK_HYDRO = {
        'wrk_hy_dam_earth': { name: 'Грунтовая плотина (отсыпка)', unit: 'м³', price: 100, category: 'hydro' },
        'wrk_hy_dam_concrete': { name: 'Бетонная плотина', unit: 'м³', price: 5000, category: 'hydro' },
        'wrk_hy_canal_excav': { name: 'Выемка канала', unit: 'м³', price: 80, category: 'hydro' },
        'wrk_hy_canal_lining': { name: 'Облицовка канала бетоном', unit: 'м²', price: 500, category: 'hydro' },
        'wrk_hy_channel_drain': { name: 'Осушительный канал', unit: 'м.п.', price: 200, category: 'hydro' },
        'wrk_hy_weir': { name: 'Водосливная плотина', unit: 'м.п.', price: 20000, category: 'hydro' },
        'wrk_hy_sluice': { name: 'Шлюз-регулятор', unit: 'шт', price: 100000, category: 'hydro' },
        'wrk_hy_pump_station_irrig': { name: 'Насосная станция (ирригация)', unit: 'шт', price: 200000, category: 'hydro' },
        'wrk_hy_retaining_wall_conc': { name: 'Подпорная стена бетонная', unit: 'м³', price: 3000, category: 'hydro' },
        'wrk_hy_retaining_wall_gabion': { name: 'Подпорная стена из габионов', unit: 'м³', price: 2000, category: 'hydro' },
        'wrk_hy_gabion_box': { name: 'Коробчатый габион', unit: 'м³', price: 1500, category: 'hydro' },
        'wrk_hy_gabion_mattress': { name: 'Матрац Рено', unit: 'м²', price: 500, category: 'hydro' },
        'wrk_hy_bank_protection': { name: 'Берегоукрепление (каменная наброска)', unit: 'м³', price: 500, category: 'hydro' },
        'wrk_hy_bank_sheet_pile': { name: 'Берегоукрепление (шпунт)', unit: 'м.п.', price: 5000, category: 'hydro' },
        'wrk_hy_pipe_culvert_500': { name: 'Водопропускная труба Ø500мм', unit: 'м.п.', price: 3000, category: 'hydro' },
        'wrk_hy_pipe_culvert_800': { name: 'Водопропускная труба Ø800мм', unit: 'м.п.', price: 5000, category: 'hydro' },
        'wrk_hy_pipe_culvert_1000': { name: 'Водопропускная труба Ø1000мм', unit: 'м.п.', price: 8000, category: 'hydro' },
        'wrk_hy_pipe_culvert_1500': { name: 'Водопропускная труба Ø1500мм', unit: 'м.п.', price: 12000, category: 'hydro' },
        'wrk_hy_well_drilling_50': { name: 'Бурение скважины (до 50м)', unit: 'м.п.', price: 2000, category: 'hydro' },
        'wrk_hy_well_drilling_100': { name: 'Бурение скважины (50-100м)', unit: 'м.п.', price: 2500, category: 'hydro' },
        'wrk_hy_well_drilling_200': { name: 'Бурение скважины (100-200м)', unit: 'м.п.', price: 3000, category: 'hydro' },
        'wrk_hy_well_pump_install': { name: 'Монтаж скважинного насоса', unit: 'шт', price: 10000, category: 'hydro' },
        'wrk_hy_well_casing': { name: 'Обсадная труба (монтаж)', unit: 'м.п.', price: 500, category: 'hydro' },
        'wrk_hy_well_screen': { name: 'Фильтровая колонна', unit: 'м.п.', price: 1000, category: 'hydro' }
    };
})();
