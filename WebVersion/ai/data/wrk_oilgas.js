// === НЕФТЕГАЗОВОЕ СТРОИТЕЛЬСТВО — трубопроводы, резервуары, эстакады, факелы (50 поз.) ===
(function () {
    window.AI_WRK_OILGAS = {
        // === ТРУБОПРОВОДЫ === 1-12
        'wrk_og_pipe_steel_89': { name: 'Трубопровод стальной Ø89', unit: 'м.п.', price: 2500, category: 'oilgas' },
        'wrk_og_pipe_steel_159': { name: 'Трубопровод стальной Ø159', unit: 'м.п.', price: 3500, category: 'oilgas' },
        'wrk_og_pipe_steel_219': { name: 'Трубопровод стальной Ø219', unit: 'м.п.', price: 5500, category: 'oilgas' },
        'wrk_og_pipe_steel_325': { name: 'Трубопровод стальной Ø325', unit: 'м.п.', price: 8500, category: 'oilgas' },
        'wrk_og_pipe_steel_530': { name: 'Трубопровод стальной Ø530', unit: 'м.п.', price: 15000, category: 'oilgas' },
        'wrk_og_pipe_steel_720': { name: 'Трубопровод стальной Ø720', unit: 'м.п.', price: 25000, category: 'oilgas' },
        'wrk_og_pipe_steel_1020': { name: 'Трубопровод стальной Ø1020', unit: 'м.п.', price: 55000, category: 'oilgas' },
        'wrk_og_weld_manual': { name: 'Ручная дуговая сварка стыка', unit: 'стык', price: 3500, category: 'oilgas' },
        'wrk_og_weld_auto': { name: 'Автоматическая сварка стыка', unit: 'стык', price: 8500, category: 'oilgas' },
        'wrk_og_xray': { name: 'Рентгенконтроль стыка', unit: 'стык', price: 2500, category: 'oilgas' },
        'wrk_og_insulation_pipe': { name: 'Изоляция трубопровода (ППУ)', unit: 'м.п.', price: 1500, category: 'oilgas' },
        // === РЕЗЕРВУАРЫ === 13-20
        'wrk_og_tank_rvs_100': { name: 'Монтаж РВС-100', unit: 'шт', price: 2500000, category: 'oilgas' },
        'wrk_og_tank_rvs_200': { name: 'Монтаж РВС-200', unit: 'шт', price: 3500000, category: 'oilgas' },
        'wrk_og_tank_rvs_1000': { name: 'Монтаж РВС-1000', unit: 'шт', price: 5500000, category: 'oilgas' },
        'wrk_og_tank_rvs_5000': { name: 'Монтаж РВС-5000', unit: 'шт', price: 12000000, category: 'oilgas' },
        'wrk_og_tank_rvs_20000': { name: 'Монтаж РВС-20000', unit: 'шт', price: 25000000, category: 'oilgas' },
        'wrk_og_tank_foundation': { name: 'Фундамент под резервуар', unit: 'м²', price: 5500, category: 'oilgas' },
        'wrk_og_tank_hydrotest': { name: 'Гидроиспытание резервуара', unit: 'шт', price: 250000, category: 'oilgas' },
        'wrk_og_tank_anticorr': { name: 'Антикоррозийная защита РВС', unit: 'м²', price: 1500, category: 'oilgas' },
        // === ЭСТАКАДЫ / ПЛОЩАДКИ === 21-26
        'wrk_og_pipe_rack': { name: 'Трубная эстакада (сталь)', unit: 'м.п.', price: 55000, category: 'oilgas' },
        'wrk_og_pipe_rack_rc': { name: 'Трубная эстакада (ж/б)', unit: 'м.п.', price: 85000, category: 'oilgas' },
        // === ФАКЕЛЬНЫЕ СИСТЕМЫ === 27-30
        'wrk_og_flare_ground': { name: 'Факельная установка наземная', unit: 'шт', price: 5500000, category: 'oilgas' },
        'wrk_og_flare_elevated': { name: 'Факельная установка высотная', unit: 'шт', price: 8500000, category: 'oilgas' },
        'wrk_og_flare_header': { name: 'Факельный коллектор', unit: 'м.п.', price: 8500, category: 'oilgas' },
        'wrk_og_flare_knockout': { name: 'Дренажная ёмкость факельная', unit: 'шт', price: 550000, category: 'oilgas' },
        // === НАСОСНЫЕ === 31-36
        'wrk_og_pump_centrifugal': { name: 'Насос центробежный (нефть)', unit: 'шт', price: 250000, category: 'oilgas' },
        'wrk_og_pump_plunger': { name: 'Насос плунжерный', unit: 'шт', price: 550000, category: 'oilgas' },
        'wrk_og_pump_station': { name: 'Насосная станция (компл.)', unit: 'компл.', price: 5500000, category: 'oilgas' },
        'wrk_og_compressor_gas': { name: 'Газовый компрессор', unit: 'шт', price: 2500000, category: 'oilgas' },
        'wrk_og_separator': { name: 'Сепаратор нефтегазовый', unit: 'шт', price: 1500000, category: 'oilgas' },
        'wrk_og_heat_exchanger': { name: 'Теплообменник', unit: 'шт', price: 850000, category: 'oilgas' },
        // === ЗАЩИТА / БЕЗОПАСНОСТЬ === 37-42
        'wrk_og_cathodic_protection': { name: 'Катодная защита трубопровода', unit: 'км', price: 550000, category: 'oilgas' },
        'wrk_og_gas_detector': { name: 'Газоанализатор стационарный', unit: 'шт', price: 55000, category: 'oilgas' },
        'wrk_og_fire_foam_system': { name: 'Пенная система пожаротушения', unit: 'компл.', price: 2500000, category: 'oilgas' },
        'wrk_og_berm_earth': { name: 'Обвалование резервуара (грунт)', unit: 'м³', price: 550, category: 'oilgas' },
        'wrk_og_berm_rc': { name: 'Обвалование резервуара (ж/б)', unit: 'м.п.', price: 8500, category: 'oilgas' },
        'wrk_og_sump_oily': { name: 'Дренажная ёмкость нефтесод.', unit: 'шт', price: 250000, category: 'oilgas' },
        // === АВТОМАТИЗАЦИЯ === 43-48
        'wrk_og_scada': { name: 'SCADA нефтегазового объекта', unit: 'компл.', price: 5500000, category: 'oilgas' },
        'wrk_og_level_gauge': { name: 'Уровнемер резервуарный', unit: 'шт', price: 85000, category: 'oilgas' },
        'wrk_og_pressure_gauge': { name: 'Манометр/датчик давления', unit: 'шт', price: 8500, category: 'oilgas' },
        'wrk_og_temp_sensor': { name: 'Датчик температуры', unit: 'шт', price: 5500, category: 'oilgas' },
        'wrk_og_control_valve': { name: 'Регулирующий клапан', unit: 'шт', price: 55000, category: 'oilgas' }
    };
})();
