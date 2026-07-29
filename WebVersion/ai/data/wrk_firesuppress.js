// === ПОЖАРОТУШЕНИЕ ПОЛНАЯ — водяное, газовое, порошковое, пенное, модульное (55 поз.) ===
(function () {
    window.AI_WRK_FIRESUPPRESS = {
        // === ВОДЯНОЕ ПОЖАРОТУШЕНИЕ (СПРИНКЛЕРНОЕ) === 1-12
        'wrk_fs_sprinkler_pipe_25': { name: 'Монтаж трубопровода АУПТ Ø25', unit: 'м.п.', price: 350, category: 'firesuppress' },
        'wrk_fs_sprinkler_pipe_32': { name: 'Монтаж трубопровода АУПТ Ø32', unit: 'м.п.', price: 450, category: 'firesuppress' },
        'wrk_fs_sprinkler_pipe_50': { name: 'Монтаж трубопровода АУПТ Ø50', unit: 'м.п.', price: 650, category: 'firesuppress' },
        'wrk_fs_sprinkler_pipe_65': { name: 'Монтаж трубопровода АУПТ Ø65', unit: 'м.п.', price: 850, category: 'firesuppress' },
        'wrk_fs_sprinkler_pipe_80': { name: 'Монтаж трубопровода АУПТ Ø80', unit: 'м.п.', price: 1050, category: 'firesuppress' },
        'wrk_fs_sprinkler_pipe_100': { name: 'Монтаж трубопровода АУПТ Ø100', unit: 'м.п.', price: 1350, category: 'firesuppress' },
        'wrk_fs_sprinkler_head': { name: 'Монтаж спринклера', unit: 'шт', price: 550, category: 'firesuppress' },
        'wrk_fs_sprinkler_head_conc': { name: 'Монтаж спринклера скрытого', unit: 'шт', price: 850, category: 'firesuppress' },
        'wrk_fs_sprinkler_node': { name: 'Монтаж узла управления спринклерного', unit: 'шт', price: 55000, category: 'firesuppress' },
        'wrk_fs_sprinkler_pump': { name: 'Монтаж насосной станции АУПТ', unit: 'компл.', price: 350000, category: 'firesuppress' },
        'wrk_fs_sprinkler_jockey': { name: 'Монтаж жокей-насоса', unit: 'шт', price: 35000, category: 'firesuppress' },
        'wrk_fs_sprinkler_tank': { name: 'Монтаж пожарного резервуара', unit: 'м³', price: 8500, category: 'firesuppress' },
        // === ДРЕНЧЕРНОЕ === 13-16
        'wrk_fs_deluge_head': { name: 'Монтаж дренчера', unit: 'шт', price: 450, category: 'firesuppress' },
        'wrk_fs_deluge_node': { name: 'Монтаж узла управления дренчерного', unit: 'шт', price: 65000, category: 'firesuppress' },
        'wrk_fs_deluge_curtain': { name: 'Водяная завеса (дренчерная)', unit: 'м.п.', price: 2500, category: 'firesuppress' },
        'wrk_fs_hydrant_int': { name: 'Монтаж пожарного крана (ПК)', unit: 'шт', price: 5500, category: 'firesuppress' },
        // === ГАЗОВОЕ ПОЖАРОТУШЕНИЕ === 17-25
        'wrk_fs_gas_novec_module': { name: 'Монтаж модуля газового ПТ (Novec)', unit: 'шт', price: 250000, category: 'firesuppress' },
        'wrk_fs_gas_fm200_module': { name: 'Монтаж модуля газового ПТ (FM-200)', unit: 'шт', price: 200000, category: 'firesuppress' },
        'wrk_fs_gas_co2_module': { name: 'Монтаж модуля газового ПТ (CO₂)', unit: 'шт', price: 120000, category: 'firesuppress' },
        'wrk_fs_gas_inert_module': { name: 'Монтаж модуля газового ПТ (инертный газ)', unit: 'шт', price: 150000, category: 'firesuppress' },
        'wrk_fs_gas_pipe': { name: 'Монтаж трубопровода газового ПТ', unit: 'м.п.', price: 550, category: 'firesuppress' },
        'wrk_fs_gas_nozzle': { name: 'Монтаж насадка-распылителя (газовый)', unit: 'шт', price: 3500, category: 'firesuppress' },
        'wrk_fs_gas_panel': { name: 'Монтаж ППКП газового ПТ', unit: 'шт', price: 85000, category: 'firesuppress' },
        'wrk_fs_gas_seal_room': { name: 'Герметизация защищаемого помещения', unit: 'м²', price: 550, category: 'firesuppress' },
        'wrk_fs_gas_vent_relief': { name: 'Монтаж клапана избыточного давления', unit: 'шт', price: 12000, category: 'firesuppress' },
        // === ПОРОШКОВОЕ === 26-30
        'wrk_fs_powder_module_2': { name: 'Монтаж модуля порошкового ПТ (2кг)', unit: 'шт', price: 3500, category: 'firesuppress' },
        'wrk_fs_powder_module_6': { name: 'Монтаж модуля порошкового ПТ (6кг)', unit: 'шт', price: 5500, category: 'firesuppress' },
        'wrk_fs_powder_module_12': { name: 'Монтаж модуля порошкового ПТ (12кг)', unit: 'шт', price: 8500, category: 'firesuppress' },
        'wrk_fs_powder_module_50': { name: 'Монтаж модуля порошкового ПТ (50кг)', unit: 'шт', price: 25000, category: 'firesuppress' },
        'wrk_fs_powder_panel': { name: 'Монтаж ППКП порошкового ПТ', unit: 'шт', price: 35000, category: 'firesuppress' },
        // === АЭРОЗОЛЬНОЕ === 31-34
        'wrk_fs_aerosol_module_sm': { name: 'Монтаж генератора аэрозольного ПТ (до 15м³)', unit: 'шт', price: 5500, category: 'firesuppress' },
        'wrk_fs_aerosol_module_md': { name: 'Монтаж генератора аэрозольного ПТ (до 30м³)', unit: 'шт', price: 8500, category: 'firesuppress' },
        'wrk_fs_aerosol_module_lg': { name: 'Монтаж генератора аэрозольного ПТ (до 60м³)', unit: 'шт', price: 15000, category: 'firesuppress' },
        'wrk_fs_aerosol_panel': { name: 'Монтаж ППКП аэрозольного ПТ', unit: 'шт', price: 25000, category: 'firesuppress' },
        // === ПЕННОЕ === 35-39
        'wrk_fs_foam_tank': { name: 'Монтаж бака-дозатора пенообразователя', unit: 'шт', price: 85000, category: 'firesuppress' },
        'wrk_fs_foam_generator': { name: 'Монтаж генератора пены', unit: 'шт', price: 12000, category: 'firesuppress' },
        'wrk_fs_foam_pipe': { name: 'Монтаж трубопровода пенного ПТ', unit: 'м.п.', price: 650, category: 'firesuppress' },
        'wrk_fs_foam_chamber': { name: 'Монтаж камеры пенной (резервуар)', unit: 'шт', price: 25000, category: 'firesuppress' },
        'wrk_fs_foam_node': { name: 'Монтаж узла управления пенного ПТ', unit: 'шт', price: 65000, category: 'firesuppress' },
        // === ВОДЯНОЙ ТУМАН === 40-43
        'wrk_fs_mist_pipe': { name: 'Монтаж трубопровода ТРВ', unit: 'м.п.', price: 850, category: 'firesuppress' },
        'wrk_fs_mist_nozzle': { name: 'Монтаж распылителя ТРВ', unit: 'шт', price: 1500, category: 'firesuppress' },
        'wrk_fs_mist_pump': { name: 'Монтаж насосной секции ТРВ', unit: 'компл.', price: 450000, category: 'firesuppress' },
        'wrk_fs_mist_cylinder': { name: 'Монтаж баллонной секции ТРВ', unit: 'компл.', price: 250000, category: 'firesuppress' },
        // === НАРУЖНОЕ === 44-48
        'wrk_fs_hydrant_ext': { name: 'Установка пожарного гидранта', unit: 'шт', price: 35000, category: 'firesuppress' },
        'wrk_fs_hydrant_pipe_100': { name: 'Монтаж пожарного водопровода Ø100', unit: 'м.п.', price: 2500, category: 'firesuppress' },
        'wrk_fs_hydrant_pipe_150': { name: 'Монтаж пожарного водопровода Ø150', unit: 'м.п.', price: 3500, category: 'firesuppress' },
        'wrk_fs_hydrant_pipe_200': { name: 'Монтаж пожарного водопровода Ø200', unit: 'м.п.', price: 5500, category: 'firesuppress' },
        'wrk_fs_reservoir': { name: 'Устройство пожарного водоёма', unit: 'м³', price: 5500, category: 'firesuppress' },
        // === ПНР === 49-52
        'wrk_fs_commission_water': { name: 'ПНР системы водяного ПТ', unit: 'компл.', price: 55000, category: 'firesuppress' },
        'wrk_fs_commission_gas': { name: 'ПНР системы газового ПТ', unit: 'компл.', price: 85000, category: 'firesuppress' },
        'wrk_fs_commission_powder': { name: 'ПНР системы порошкового ПТ', unit: 'компл.', price: 25000, category: 'firesuppress' },
        'wrk_fs_test_hydro': { name: 'Гидравлические испытания АУПТ', unit: 'компл.', price: 25000, category: 'firesuppress' }
    };
})();
