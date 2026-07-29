// === ЭЛЕКТРОТЕХНИЧЕСКИЕ МАТЕРИАЛЫ (90 позиций) ===
(function () {
    window.AI_MAT_ELECTRICAL = {
        // Кабели ВВГнг-LS
        'cable_vvg_1_5x2': { name: 'Кабель ВВГнг-LS 2×1.5мм²', unit: 'м', price: 55, category: 'electrical' },
        'cable_vvg_1_5x3': { name: 'Кабель ВВГнг-LS 3×1.5мм²', unit: 'м', price: 70, category: 'electrical' },
        'cable_vvg_2_5x3': { name: 'Кабель ВВГнг-LS 3×2.5мм²', unit: 'м', price: 95, category: 'electrical' },
        'cable_vvg_2_5x5': { name: 'Кабель ВВГнг-LS 5×2.5мм²', unit: 'м', price: 150, category: 'electrical' },
        'cable_vvg_4x3': { name: 'Кабель ВВГнг-LS 3×4мм²', unit: 'м', price: 140, category: 'electrical' },
        'cable_vvg_4x5': { name: 'Кабель ВВГнг-LS 5×4мм²', unit: 'м', price: 220, category: 'electrical' },
        'cable_vvg_6x3': { name: 'Кабель ВВГнг-LS 3×6мм²', unit: 'м', price: 200, category: 'electrical' },
        'cable_vvg_10x3': { name: 'Кабель ВВГнг-LS 3×10мм²', unit: 'м', price: 320, category: 'electrical' },
        'cable_vvg_16x3': { name: 'Кабель ВВГнг-LS 3×16мм²', unit: 'м', price: 480, category: 'electrical' },

        // Кабели NYM
        'cable_nym_1_5x3': { name: 'Кабель NYM 3×1.5мм²', unit: 'м', price: 100, category: 'electrical' },
        'cable_nym_2_5x3': { name: 'Кабель NYM 3×2.5мм²', unit: 'м', price: 140, category: 'electrical' },
        'cable_nym_4x3': { name: 'Кабель NYM 3×4мм²', unit: 'м', price: 200, category: 'electrical' },
        'cable_nym_6x3': { name: 'Кабель NYM 3×6мм²', unit: 'м', price: 300, category: 'electrical' },

        // Кабели ПВС
        'cable_pvs_0_75x3': { name: 'Провод ПВС 3×0.75мм²', unit: 'м', price: 40, category: 'electrical' },
        'cable_pvs_1_5x3': { name: 'Провод ПВС 3×1.5мм²', unit: 'м', price: 60, category: 'electrical' },
        'cable_pvs_2_5x3': { name: 'Провод ПВС 3×2.5мм²', unit: 'м', price: 85, category: 'electrical' },
        'cable_pvs_4x3': { name: 'Провод ПВС 3×4мм²', unit: 'м', price: 130, category: 'electrical' },

        // Кабели СИП (для ввода)
        'cable_sip_2x16': { name: 'Кабель СИП 2×16мм²', unit: 'м', price: 120, category: 'electrical' },
        'cable_sip_4x16': { name: 'Кабель СИП 4×16мм²', unit: 'м', price: 200, category: 'electrical' },

        // Автоматические выключатели
        'mcb_1p_6a': { name: 'Автомат 1P 6A тип C', unit: 'шт', price: 350, category: 'electrical' },
        'mcb_1p_10a': { name: 'Автомат 1P 10A тип C', unit: 'шт', price: 350, category: 'electrical' },
        'mcb_1p_16a': { name: 'Автомат 1P 16A тип C', unit: 'шт', price: 350, category: 'electrical' },
        'mcb_1p_20a': { name: 'Автомат 1P 20A тип C', unit: 'шт', price: 380, category: 'electrical' },
        'mcb_1p_25a': { name: 'Автомат 1P 25A тип C', unit: 'шт', price: 400, category: 'electrical' },
        'mcb_1p_32a': { name: 'Автомат 1P 32A тип C', unit: 'шт', price: 420, category: 'electrical' },
        'mcb_2p_25a': { name: 'Автомат 2P 25A тип C', unit: 'шт', price: 800, category: 'electrical' },
        'mcb_2p_32a': { name: 'Автомат 2P 32A тип C', unit: 'шт', price: 850, category: 'electrical' },
        'mcb_3p_25a': { name: 'Автомат 3P 25A тип C', unit: 'шт', price: 1500, category: 'electrical' },
        'mcb_3p_40a': { name: 'Автомат 3P 40A тип C', unit: 'шт', price: 1800, category: 'electrical' },
        'mcb_3p_63a': { name: 'Автомат 3P 63A тип C', unit: 'шт', price: 2200, category: 'electrical' },

        // УЗО
        'rcd_2p_25a_30ma': { name: 'УЗО 2P 25A 30мА', unit: 'шт', price: 2500, category: 'electrical' },
        'rcd_2p_40a_30ma': { name: 'УЗО 2P 40A 30мА', unit: 'шт', price: 2800, category: 'electrical' },
        'rcd_2p_63a_30ma': { name: 'УЗО 2P 63A 30мА', unit: 'шт', price: 3200, category: 'electrical' },
        'rcd_4p_40a_30ma': { name: 'УЗО 4P 40A 30мА', unit: 'шт', price: 5000, category: 'electrical' },

        // Дифавтоматы
        'rcbo_1p_n_16a_30ma': { name: 'Дифавтомат 1P+N 16A 30мА', unit: 'шт', price: 3500, category: 'electrical' },
        'rcbo_1p_n_25a_30ma': { name: 'Дифавтомат 1P+N 25A 30мА', unit: 'шт', price: 3800, category: 'electrical' },
        'rcbo_1p_n_32a_30ma': { name: 'Дифавтомат 1P+N 32A 30мА', unit: 'шт', price: 4000, category: 'electrical' },

        // Щиты
        'panel_4mod': { name: 'Щит встраиваемый 4 модуля', unit: 'шт', price: 1200, category: 'electrical' },
        'panel_8mod': { name: 'Щит встраиваемый 8 модулей', unit: 'шт', price: 1800, category: 'electrical' },
        'panel_12mod': { name: 'Щит встраиваемый 12 модулей', unit: 'шт', price: 2500, category: 'electrical' },
        'panel_24mod': { name: 'Щит встраиваемый 24 модуля', unit: 'шт', price: 4000, category: 'electrical' },
        'panel_36mod': { name: 'Щит встраиваемый 36 модулей', unit: 'шт', price: 5500, category: 'electrical' },
        'panel_surface_12mod': { name: 'Щит навесной 12 модулей', unit: 'шт', price: 2000, category: 'electrical' },

        // Розетки
        'socket_single': { name: 'Розетка одинарная с заземлением', unit: 'шт', price: 250, category: 'electrical' },
        'socket_double': { name: 'Розетка двойная с заземлением', unit: 'шт', price: 450, category: 'electrical' },
        'socket_usb': { name: 'Розетка с USB-зарядкой', unit: 'шт', price: 800, category: 'electrical' },
        'socket_ip44': { name: 'Розетка влагозащищённая IP44', unit: 'шт', price: 400, category: 'electrical' },
        'socket_tv': { name: 'Розетка ТВ', unit: 'шт', price: 350, category: 'electrical' },
        'socket_rj45': { name: 'Розетка RJ-45 (интернет)', unit: 'шт', price: 450, category: 'electrical' },
        'socket_phone': { name: 'Розетка телефонная RJ-11', unit: 'шт', price: 300, category: 'electrical' },

        // Выключатели
        'switch_1gang': { name: 'Выключатель 1-клавишный', unit: 'шт', price: 200, category: 'electrical' },
        'switch_2gang': { name: 'Выключатель 2-клавишный', unit: 'шт', price: 280, category: 'electrical' },
        'switch_3gang': { name: 'Выключатель 3-клавишный', unit: 'шт', price: 350, category: 'electrical' },
        'switch_pass_1g': { name: 'Переключатель проходной 1-кл.', unit: 'шт', price: 350, category: 'electrical' },
        'switch_pass_2g': { name: 'Переключатель проходной 2-кл.', unit: 'шт', price: 500, category: 'electrical' },
        'switch_cross': { name: 'Переключатель перекрёстный', unit: 'шт', price: 600, category: 'electrical' },
        'dimmer_led': { name: 'Диммер для LED 250Вт', unit: 'шт', price: 1500, category: 'electrical' },

        // Подрозетники / рамки
        'box_flush_68': { name: 'Подрозетник скрытый Ø68мм', unit: 'шт', price: 25, category: 'electrical' },
        'box_flush_group': { name: 'Подрозетник скрытый блочный', unit: 'шт', price: 30, category: 'electrical' },
        'frame_1post': { name: 'Рамка 1-постовая', unit: 'шт', price: 80, category: 'electrical' },
        'frame_2post': { name: 'Рамка 2-постовая', unit: 'шт', price: 120, category: 'electrical' },
        'frame_3post': { name: 'Рамка 3-постовая', unit: 'шт', price: 160, category: 'electrical' },
        'frame_4post': { name: 'Рамка 4-постовая', unit: 'шт', price: 200, category: 'electrical' },

        // Гофра / кабель-каналы
        'conduit_pvc_16': { name: 'Гофра ПВХ Ø16мм (50м)', unit: 'бухта', price: 600, category: 'electrical' },
        'conduit_pvc_20': { name: 'Гофра ПВХ Ø20мм (50м)', unit: 'бухта', price: 750, category: 'electrical' },
        'conduit_pvc_25': { name: 'Гофра ПВХ Ø25мм (50м)', unit: 'бухта', price: 950, category: 'electrical' },
        'conduit_pvc_32': { name: 'Гофра ПВХ Ø32мм (25м)', unit: 'бухта', price: 700, category: 'electrical' },
        'conduit_halogen_free_20': { name: 'Гофра безгалогенная Ø20мм (50м)', unit: 'бухта', price: 1200, category: 'electrical' },
        'cable_channel_16x16': { name: 'Кабель-канал 16×16мм (2м)', unit: 'шт', price: 60, category: 'electrical' },
        'cable_channel_25x16': { name: 'Кабель-канал 25×16мм (2м)', unit: 'шт', price: 80, category: 'electrical' },
        'cable_channel_40x25': { name: 'Кабель-канал 40×25мм (2м)', unit: 'шт', price: 150, category: 'electrical' },
        'cable_channel_60x40': { name: 'Кабель-канал 60×40мм (2м)', unit: 'шт', price: 250, category: 'electrical' },

        // Светильники LED
        'led_panel_600x600': { name: 'LED панель 600×600мм 36Вт', unit: 'шт', price: 4500, category: 'electrical' },
        'led_downlight_12w': { name: 'LED даунлайт встраиваемый 12Вт', unit: 'шт', price: 1500, category: 'electrical' },
        'led_downlight_18w': { name: 'LED даунлайт встраиваемый 18Вт', unit: 'шт', price: 2000, category: 'electrical' },
        'led_spot_gu10_5w': { name: 'LED лампа GU10 5Вт', unit: 'шт', price: 500, category: 'electrical' },
        'led_bulb_e27_10w': { name: 'LED лампа E27 10Вт', unit: 'шт', price: 400, category: 'electrical' },
        'led_strip_14w': { name: 'LED лента 14.4Вт/м (5м)', unit: 'катушка', price: 2500, category: 'electrical' },
        'led_profile_2m': { name: 'Профиль алюминиевый для LED ленты (2м)', unit: 'шт', price: 800, category: 'electrical' },
        'led_driver_60w': { name: 'Блок питания LED 60Вт', unit: 'шт', price: 1200, category: 'electrical' },
        'led_driver_100w': { name: 'Блок питания LED 100Вт', unit: 'шт', price: 1800, category: 'electrical' },

        // Прожекторы
        'flood_led_30w': { name: 'Прожектор LED 30Вт', unit: 'шт', price: 2500, category: 'electrical' },
        'flood_led_50w': { name: 'Прожектор LED 50Вт', unit: 'шт', price: 3500, category: 'electrical' },
        'flood_led_100w': { name: 'Прожектор LED 100Вт', unit: 'шт', price: 5000, category: 'electrical' },

        // Клеммы / расходка
        'wago_221_2': { name: 'Клемма WAGO 221 (2 провода)', unit: 'шт', price: 50, category: 'electrical' },
        'wago_221_3': { name: 'Клемма WAGO 221 (3 провода)', unit: 'шт', price: 65, category: 'electrical' },
        'wago_221_5': { name: 'Клемма WAGO 221 (5 проводов)', unit: 'шт', price: 100, category: 'electrical' },
        'tape_electric_19mm': { name: 'Изолента ПВХ 19мм×20м', unit: 'шт', price: 100, category: 'electrical' },
        'heat_shrink_set': { name: 'Термоусадка набор (100шт)', unit: 'уп.', price: 500, category: 'electrical' }
    };
})();
