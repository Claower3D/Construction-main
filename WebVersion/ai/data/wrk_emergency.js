// === АВАРИЙНЫЕ И РЕМОНТНЫЕ РАБОТЫ — протечки, прорывы, обрушения, аварии (55 поз.) ===
(function () {
    window.AI_WRK_EMERGENCY = {
        // === ВОДОСНАБЖЕНИЕ АВАРИЯ === 1-8
        'wrk_em_water_leak_repair': { name: 'Устранение течи трубы (водоснабжение)', unit: 'шт', price: 3500, category: 'emergency' },
        'wrk_em_water_pipe_replace': { name: 'Замена аварийного участка трубы', unit: 'м.п.', price: 2500, category: 'emergency' },
        'wrk_em_water_valve_replace': { name: 'Замена аварийной задвижки', unit: 'шт', price: 5500, category: 'emergency' },
        'wrk_em_water_pipe_freeze': { name: 'Размораживание трубы', unit: 'м.п.', price: 1500, category: 'emergency' },
        'wrk_em_water_pump_dewater': { name: 'Откачка воды (затопление)', unit: 'час', price: 3500, category: 'emergency' },
        'wrk_em_water_hydrant_repair': { name: 'Ремонт пожарного гидранта', unit: 'шт', price: 12000, category: 'emergency' },
        'wrk_em_water_well_pump': { name: 'Замена скважинного насоса (аварийная)', unit: 'шт', price: 25000, category: 'emergency' },
        'wrk_em_water_faucet_repair': { name: 'Ремонт / замена смесителя (авария)', unit: 'шт', price: 2500, category: 'emergency' },
        // === КАНАЛИЗАЦИЯ АВАРИЯ === 9-14
        'wrk_em_sewer_clog': { name: 'Прочистка засора канализации', unit: 'шт', price: 3500, category: 'emergency' },
        'wrk_em_sewer_clog_hd': { name: 'Гидродинамическая прочистка', unit: 'м.п.', price: 550, category: 'emergency' },
        'wrk_em_sewer_camera': { name: 'Видеоинспекция канализации', unit: 'м.п.', price: 350, category: 'emergency' },
        'wrk_em_sewer_repair': { name: 'Ремонт канализационной трубы', unit: 'м.п.', price: 3500, category: 'emergency' },
        'wrk_em_sewer_relining': { name: 'Санация труб (реллайнинг)', unit: 'м.п.', price: 5500, category: 'emergency' },
        'wrk_em_sewer_pump_repair': { name: 'Ремонт КНС (аварийный)', unit: 'шт', price: 25000, category: 'emergency' },
        // === ОТОПЛЕНИЕ АВАРИЯ === 15-20
        'wrk_em_heat_leak': { name: 'Устранение течи отопления', unit: 'шт', price: 3500, category: 'emergency' },
        'wrk_em_heat_radiator': { name: 'Аварийная замена радиатора', unit: 'шт', price: 5500, category: 'emergency' },
        'wrk_em_heat_pipe_replace': { name: 'Аварийная замена трубы отопления', unit: 'м.п.', price: 2500, category: 'emergency' },
        'wrk_em_heat_boiler_repair': { name: 'Аварийный ремонт котла', unit: 'шт', price: 15000, category: 'emergency' },
        'wrk_em_heat_pump_replace': { name: 'Аварийная замена насоса', unit: 'шт', price: 8500, category: 'emergency' },
        'wrk_em_heat_frozen_pipe': { name: 'Размораживание трубы отопления', unit: 'м.п.', price: 1500, category: 'emergency' },
        // === ЭЛЕКТРИКА АВАРИЯ === 21-28
        'wrk_em_elec_short_find': { name: 'Поиск короткого замыкания', unit: 'шт', price: 3500, category: 'emergency' },
        'wrk_em_elec_cable_repair': { name: 'Ремонт повреждённого кабеля', unit: 'шт', price: 5500, category: 'emergency' },
        'wrk_em_elec_panel_repair': { name: 'Ремонт электрощита', unit: 'шт', price: 5500, category: 'emergency' },
        'wrk_em_elec_breaker_replace': { name: 'Замена автоматического выключателя', unit: 'шт', price: 1500, category: 'emergency' },
        'wrk_em_elec_outlet_replace': { name: 'Замена розетки/выключателя (авария)', unit: 'шт', price: 1200, category: 'emergency' },
        'wrk_em_elec_generator_connect': { name: 'Подключение аварийного генератора', unit: 'шт', price: 8500, category: 'emergency' },
        'wrk_em_elec_ground_repair': { name: 'Ремонт контура заземления', unit: 'компл.', price: 8500, category: 'emergency' },
        'wrk_em_elec_lightning_repair': { name: 'Ремонт молниезащиты', unit: 'компл.', price: 12000, category: 'emergency' },
        // === КРОВЛЯ АВАРИЯ === 29-34
        'wrk_em_roof_leak_find': { name: 'Поиск протечки кровли', unit: 'шт', price: 5500, category: 'emergency' },
        'wrk_em_roof_patch': { name: 'Аварийный ремонт кровли (латка)', unit: 'м²', price: 1500, category: 'emergency' },
        'wrk_em_roof_snow_removal': { name: 'Уборка снега с кровли', unit: 'м²', price: 150, category: 'emergency' },
        'wrk_em_roof_icicle': { name: 'Удаление сосулек/наледи', unit: 'м.п.', price: 550, category: 'emergency' },
        'wrk_em_roof_drain_clean': { name: 'Прочистка водостоков', unit: 'м.п.', price: 250, category: 'emergency' },
        'wrk_em_roof_temp_cover': { name: 'Временное укрытие (тент)', unit: 'м²', price: 250, category: 'emergency' },
        // === КОНСТРУКЦИИ АВАРИЯ === 35-42
        'wrk_em_struct_shore': { name: 'Аварийное подкрепление конструкций', unit: 'компл.', price: 55000, category: 'emergency' },
        'wrk_em_struct_beam_temp': { name: 'Временное усиление балки', unit: 'шт', price: 25000, category: 'emergency' },
        'wrk_em_struct_wall_crack': { name: 'Заделка трещин стены (аварийная)', unit: 'м.п.', price: 1500, category: 'emergency' },
        'wrk_em_struct_pillar_repair': { name: 'Аварийный ремонт колонны', unit: 'шт', price: 55000, category: 'emergency' },
        'wrk_em_struct_slab_shore': { name: 'Подпорка аварийного перекрытия', unit: 'м²', price: 1500, category: 'emergency' },
        'wrk_em_struct_fence_temp': { name: 'Временное ограждение аварийной зоны', unit: 'м.п.', price: 550, category: 'emergency' },
        'wrk_em_struct_debris_clean': { name: 'Уборка строительного мусора (авария)', unit: 'м³', price: 850, category: 'emergency' },
        'wrk_em_struct_building_assess': { name: 'Экспресс-оценка здания после аварии', unit: 'объект', price: 55000, category: 'emergency' },
        // === ГАЗОСНАБЖЕНИЕ АВАРИЯ === 43-46
        'wrk_em_gas_leak_detect': { name: 'Поиск утечки газа', unit: 'шт', price: 5500, category: 'emergency' },
        'wrk_em_gas_valve_close': { name: 'Аварийное отключение газа', unit: 'шт', price: 3500, category: 'emergency' },
        'wrk_em_gas_pipe_repair': { name: 'Ремонт аварийного газопровода', unit: 'м.п.', price: 8500, category: 'emergency' },
        'wrk_em_gas_detector_repair': { name: 'Ремонт газоанализатора', unit: 'шт', price: 5500, category: 'emergency' },
        // === ВЕНТИЛЯЦИЯ АВАРИЯ === 47-50
        'wrk_em_vent_fan_replace': { name: 'Аварийная замена вентилятора', unit: 'шт', price: 15000, category: 'emergency' },
        'wrk_em_vent_duct_repair': { name: 'Ремонт воздуховода', unit: 'м.п.', price: 1500, category: 'emergency' },
        'wrk_em_vent_fire_damper': { name: 'Ремонт/замена противопожарного клапана', unit: 'шт', price: 8500, category: 'emergency' },
        'wrk_em_vent_ac_repair': { name: 'Аварийный ремонт кондиционера', unit: 'шт', price: 8500, category: 'emergency' }
    };
})();
