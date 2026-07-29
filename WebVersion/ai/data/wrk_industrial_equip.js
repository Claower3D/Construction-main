// === ПРОМЫШЛЕННОЕ ОБОРУДОВАНИЕ — конвейеры, компрессоры, насосные, электроприводы (50 поз.) ===
(function () {
    window.AI_WRK_INDUSTRIAL_EQUIP = {
        // === КОНВЕЙЕРНОЕ ОБОРУДОВАНИЕ === 1-8
        'wrk_ie_belt_conv_500': { name: 'Монтаж ленточного конвейера (L до 20м)', unit: 'м.п.', price: 8500, category: 'industrialequip' },
        'wrk_ie_belt_conv_1000': { name: 'Монтаж ленточного конвейера (L до 50м)', unit: 'м.п.', price: 12000, category: 'industrialequip' },
        'wrk_ie_chain_conv': { name: 'Монтаж цепного конвейера', unit: 'м.п.', price: 8500, category: 'industrialequip' },
        'wrk_ie_bucket_elev': { name: 'Монтаж нории (ковшовый элеватор)', unit: 'шт', price: 120000, category: 'industrialequip' },
        'wrk_ie_pneumo_conv': { name: 'Пневмотранспортная система', unit: 'компл.', price: 350000, category: 'industrialequip' },
        'wrk_ie_vibro_feeder': { name: 'Монтаж вибропитателя', unit: 'шт', price: 35000, category: 'industrialequip' },
        // === КОМПРЕССОРНОЕ === 9-16
        'wrk_ie_compr_piston_5': { name: 'Компрессор поршневой 5м³/мин', unit: 'шт', price: 35000, category: 'industrialequip' },
        'wrk_ie_compr_piston_10': { name: 'Компрессор поршневой 10м³/мин', unit: 'шт', price: 55000, category: 'industrialequip' },
        'wrk_ie_compr_screw_10': { name: 'Компрессор винтовой 10м³/мин', unit: 'шт', price: 85000, category: 'industrialequip' },
        'wrk_ie_compr_screw_20': { name: 'Компрессор винтовой 20м³/мин', unit: 'шт', price: 120000, category: 'industrialequip' },
        'wrk_ie_compr_screw_50': { name: 'Компрессор винтовой 50м³/мин', unit: 'шт', price: 250000, category: 'industrialequip' },
        'wrk_ie_air_dryer': { name: 'Осушитель сжатого воздуха', unit: 'шт', price: 55000, category: 'industrialequip' },
        'wrk_ie_air_receiver': { name: 'Ресивер сжатого воздуха', unit: 'шт', price: 25000, category: 'industrialequip' },
        'wrk_ie_air_pipe': { name: 'Трубопровод сжатого воздуха (алюм.)', unit: 'м.п.', price: 1500, category: 'industrialequip' },
        // === НАСОСНЫЕ СТАНЦИИ === 17-24
        'wrk_ie_pump_centrifugal_5': { name: 'Насос центробежный 5м³/ч', unit: 'шт', price: 12000, category: 'industrialequip' },
        'wrk_ie_pump_centrifugal_25': { name: 'Насос центробежный 25м³/ч', unit: 'шт', price: 25000, category: 'industrialequip' },
        'wrk_ie_pump_centrifugal_100': { name: 'Насос центробежный 100м³/ч', unit: 'шт', price: 85000, category: 'industrialequip' },
        'wrk_ie_pump_submersible': { name: 'Насос погружной', unit: 'шт', price: 25000, category: 'industrialequip' },
        'wrk_ie_pump_dosing': { name: 'Насос дозирующий', unit: 'шт', price: 35000, category: 'industrialequip' },
        'wrk_ie_pump_vacuum': { name: 'Вакуумный насос', unit: 'шт', price: 55000, category: 'industrialequip' },
        'wrk_ie_pump_station': { name: 'Монтаж насосной станции (компл.)', unit: 'компл.', price: 250000, category: 'industrialequip' },
        'wrk_ie_pump_foundation': { name: 'Фундамент под насос (виброопора)', unit: 'шт', price: 15000, category: 'industrialequip' },
        // === ЭЛЕКТРОПРИВОДЫ / ЧАСТОТНИКИ === 25-30
        'wrk_ie_motor_0_5': { name: 'Монтаж эл. двигателя 0.5кВт', unit: 'шт', price: 3500, category: 'industrialequip' },
        'wrk_ie_motor_5': { name: 'Монтаж эл. двигателя 5кВт', unit: 'шт', price: 8500, category: 'industrialequip' },
        'wrk_ie_motor_30': { name: 'Монтаж эл. двигателя 30кВт', unit: 'шт', price: 25000, category: 'industrialequip' },
        'wrk_ie_motor_100': { name: 'Монтаж эл. двигателя 100кВт', unit: 'шт', price: 55000, category: 'industrialequip' },
        'wrk_ie_vfd_5': { name: 'Частотный преобразователь 5кВт', unit: 'шт', price: 15000, category: 'industrialequip' },
        'wrk_ie_vfd_30': { name: 'Частотный преобразователь 30кВт', unit: 'шт', price: 35000, category: 'industrialequip' },
        // === ДРОБИЛЬНО-СОРТИРОВОЧНОЕ === 31-36
        'wrk_ie_crusher_jaw': { name: 'Монтаж щековой дробилки', unit: 'шт', price: 250000, category: 'industrialequip' },
        'wrk_ie_crusher_cone': { name: 'Монтаж конусной дробилки', unit: 'шт', price: 350000, category: 'industrialequip' },
        'wrk_ie_screen_vibro': { name: 'Монтаж виброгрохота', unit: 'шт', price: 120000, category: 'industrialequip' },
        'wrk_ie_mixer_concrete': { name: 'Монтаж бетоносмесителя', unit: 'шт', price: 85000, category: 'industrialequip' },
        'wrk_ie_mill_ball': { name: 'Монтаж шаровой мельницы', unit: 'шт', price: 550000, category: 'industrialequip' },
        'wrk_ie_separator': { name: 'Монтаж классификатора/сепаратора', unit: 'шт', price: 120000, category: 'industrialequip' },
        // === ГРУЗОПОДЪЁМНЫЕ (СТАЦИОНАРНЫЕ) === 37-42
        'wrk_ie_hoist_elec_1': { name: 'Таль электрическая 1т', unit: 'шт', price: 15000, category: 'industrialequip' },
        'wrk_ie_hoist_elec_5': { name: 'Таль электрическая 5т', unit: 'шт', price: 25000, category: 'industrialequip' },
        'wrk_ie_crane_beam_5': { name: 'Кран-балка подвесная 5т', unit: 'шт', price: 120000, category: 'industrialequip' },
        'wrk_ie_crane_beam_10': { name: 'Кран-балка подвесная 10т', unit: 'шт', price: 250000, category: 'industrialequip' },
        'wrk_ie_crane_rail': { name: 'Монтаж подкрановых путей', unit: 'м.п.', price: 5500, category: 'industrialequip' },
        'wrk_ie_crane_commissioning': { name: 'ПНР и испытания ГПМ', unit: 'шт', price: 55000, category: 'industrialequip' },
        // === ТЕХНОЛОГИЧЕСКИЕ ЛИНИИ === 43-48
        'wrk_ie_line_align': { name: 'Выверка/центровка оборудования', unit: 'шт', price: 15000, category: 'industrialequip' },
        'wrk_ie_line_piping': { name: 'Обвязка технологическая', unit: 'компл.', price: 85000, category: 'industrialequip' },
        'wrk_ie_line_electric': { name: 'Электрообвязка оборудования', unit: 'компл.', price: 55000, category: 'industrialequip' },
        'wrk_ie_line_grout': { name: 'Подливка фундамента оборудования', unit: 'шт', price: 8500, category: 'industrialequip' },
        'wrk_ie_line_test': { name: 'Испытания под нагрузкой', unit: 'шт', price: 25000, category: 'industrialequip' },
        'wrk_ie_line_commissioning': { name: 'Комплексное опробование линии', unit: 'компл.', price: 250000, category: 'industrialequip' }
    };
})();
