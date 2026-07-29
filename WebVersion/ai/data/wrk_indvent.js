// === ПРОМЫШЛЕННАЯ ВЕНТИЛЯЦИЯ, АСПИРАЦИЯ, ДЫМОУДАЛЕНИЕ (300 поз.) ===
(function () {
    window.AI_WRK_INDVENT = {
        // === ПРОМЫШЛЕННАЯ АСПИРАЦИЯ ===
        'wrk_iv_aspir_hood_sm': { name: 'Монтаж аспирационного укрытия (малое)', unit: 'шт', price: 8500, category: 'indvent' },
        'wrk_iv_aspir_hood_lg': { name: 'Монтаж аспирационного укрытия (большое)', unit: 'шт', price: 25000, category: 'indvent' },
        'wrk_iv_aspir_duct_160': { name: 'Монтаж аспирационного воздуховода Ø160', unit: 'м.п.', price: 550, category: 'indvent' },
        'wrk_iv_aspir_duct_200': { name: 'Монтаж аспирационного воздуховода Ø200', unit: 'м.п.', price: 750, category: 'indvent' },
        'wrk_iv_aspir_duct_250': { name: 'Монтаж аспирационного воздуховода Ø250', unit: 'м.п.', price: 950, category: 'indvent' },
        'wrk_iv_aspir_duct_315': { name: 'Монтаж аспирационного воздуховода Ø315', unit: 'м.п.', price: 1200, category: 'indvent' },
        'wrk_iv_aspir_duct_400': { name: 'Монтаж аспирационного воздуховода Ø400', unit: 'м.п.', price: 1500, category: 'indvent' },
        'wrk_iv_aspir_cyclone': { name: 'Монтаж циклона', unit: 'шт', price: 55000, category: 'indvent' },
        'wrk_iv_aspir_bag_filter': { name: 'Монтаж рукавного фильтра', unit: 'шт', price: 120000, category: 'indvent' },
        'wrk_iv_aspir_cartridge_filter': { name: 'Монтаж картриджного фильтра', unit: 'шт', price: 180000, category: 'indvent' },
        'wrk_iv_aspir_fan_radial': { name: 'Монтаж пылевого вентилятора (радиальный)', unit: 'шт', price: 35000, category: 'indvent' },
        'wrk_iv_aspir_shutter': { name: 'Монтаж шибера аспирационного', unit: 'шт', price: 3500, category: 'indvent' },
        // === ДЫМОУДАЛЕНИЕ ===
        'wrk_iv_smoke_fan_roof': { name: 'Монтаж крышного вент. дымоудаления', unit: 'шт', price: 85000, category: 'indvent' },
        'wrk_iv_smoke_fan_channel': { name: 'Монтаж канального вент. дымоудаления', unit: 'шт', price: 55000, category: 'indvent' },
        'wrk_iv_smoke_damper': { name: 'Монтаж клапана дымоудаления', unit: 'шт', price: 12000, category: 'indvent' },
        'wrk_iv_smoke_duct_round_300': { name: 'Воздуховод дымоудаления Ø300 (огнест.)', unit: 'м.п.', price: 1500, category: 'indvent' },
        'wrk_iv_smoke_duct_round_500': { name: 'Воздуховод дымоудаления Ø500 (огнест.)', unit: 'м.п.', price: 2500, category: 'indvent' },
        'wrk_iv_smoke_duct_rect_400x300': { name: 'Воздуховод дымоудаления 400×300', unit: 'м.п.', price: 2500, category: 'indvent' },
        'wrk_iv_smoke_duct_rect_600x400': { name: 'Воздуховод дымоудаления 600×400', unit: 'м.п.', price: 3500, category: 'indvent' },
        'wrk_iv_smoke_shaft': { name: 'Устройство шахты дымоудаления', unit: 'эт.', price: 55000, category: 'indvent' },
        'wrk_iv_supply_comp': { name: 'Монтаж вент. подпора воздуха', unit: 'шт', price: 55000, category: 'indvent' },
        'wrk_iv_supply_damper': { name: 'Монтаж клапана подпора воздуха', unit: 'шт', price: 8500, category: 'indvent' },
        // === ПРОМАВТОМАТИКА ВЕНТИЛЯЦИИ ===
        'wrk_iv_auto_controller': { name: 'Монтаж контроллера вентсистемы', unit: 'шт', price: 25000, category: 'indvent' },
        'wrk_iv_auto_pressure_sensor': { name: 'Монтаж датчика давления (воздуховод)', unit: 'шт', price: 3500, category: 'indvent' },
        'wrk_iv_auto_freq_drive': { name: 'Монтаж частотного преобразователя', unit: 'шт', price: 15000, category: 'indvent' },
        'wrk_iv_auto_actuator': { name: 'Монтаж электропривода клапана', unit: 'шт', price: 5500, category: 'indvent' },
        'wrk_iv_auto_panel': { name: 'Монтаж щита автоматики вентиляции', unit: 'шт', price: 35000, category: 'indvent' },
        // === МЕСТНАЯ ВЫТЯЖНАЯ ВЕНТИЛЯЦИЯ ===
        'wrk_iv_local_kitchen_hood': { name: 'Монтаж зонта вытяжного (промкухня)', unit: 'шт', price: 15000, category: 'indvent' },
        'wrk_iv_local_welding_arm': { name: 'Монтаж вытяжного рукава (сварочный)', unit: 'шт', price: 25000, category: 'indvent' },
        'wrk_iv_local_lab_hood': { name: 'Монтаж вытяжного шкафа (лаборатория)', unit: 'шт', price: 85000, category: 'indvent' },
        'wrk_iv_local_spray_booth': { name: 'Монтаж окрасочной камеры (вытяжка)', unit: 'шт', price: 250000, category: 'indvent' },
        // === ВОЗДУШНОЕ ОТОПЛЕНИЕ ===
        'wrk_iv_air_heat_curtain_6': { name: 'Монтаж воздушной завесы (длина 0.6м)', unit: 'шт', price: 5500, category: 'indvent' },
        'wrk_iv_air_heat_curtain_10': { name: 'Монтаж воздушной завесы (длина 1.0м)', unit: 'шт', price: 8500, category: 'indvent' },
        'wrk_iv_air_heat_curtain_15': { name: 'Монтаж воздушной завесы (длина 1.5м)', unit: 'шт', price: 12000, category: 'indvent' },
        'wrk_iv_air_heat_curtain_20': { name: 'Монтаж воздушной завесы (длина 2.0м)', unit: 'шт', price: 18000, category: 'indvent' },
        'wrk_iv_air_heat_gun_3': { name: 'Монтаж тепловой пушки 3кВт', unit: 'шт', price: 3500, category: 'indvent' },
        'wrk_iv_air_heat_gun_9': { name: 'Монтаж тепловой пушки 9кВт', unit: 'шт', price: 5500, category: 'indvent' },
        'wrk_iv_air_heater_volcano': { name: 'Монтаж тепловентилятора (типа Volcano)', unit: 'шт', price: 15000, category: 'indvent' },
        // === ОТОПИТЕЛЬНЫЕ КОТЕЛЬНЫЕ (РАСШИРЕННЫЕ) ===
        'wrk_iv_boiler_gas_24': { name: 'Монтаж газового котла 24кВт', unit: 'шт', price: 25000, category: 'indvent' },
        'wrk_iv_boiler_gas_50': { name: 'Монтаж газового котла 50кВт', unit: 'шт', price: 35000, category: 'indvent' },
        'wrk_iv_boiler_gas_100': { name: 'Монтаж газового котла 100кВт', unit: 'шт', price: 55000, category: 'indvent' },
        'wrk_iv_boiler_gas_250': { name: 'Монтаж газового котла 250кВт', unit: 'шт', price: 120000, category: 'indvent' },
        'wrk_iv_boiler_chimney_130': { name: 'Монтаж дымохода Ø130 (коаксиальный)', unit: 'компл.', price: 8500, category: 'indvent' },
        'wrk_iv_boiler_chimney_200': { name: 'Монтаж дымохода Ø200 (нержавейка)', unit: 'м.п.', price: 5500, category: 'indvent' },
        'wrk_iv_boiler_chimney_300': { name: 'Монтаж дымохода Ø300', unit: 'м.п.', price: 8500, category: 'indvent' },
        'wrk_iv_boiler_expansion_tank': { name: 'Монтаж расширительного бака', unit: 'шт', price: 3500, category: 'indvent' },
        'wrk_iv_boiler_bkn_100': { name: 'Монтаж бойлера косвенного нагрева 100л', unit: 'шт', price: 8500, category: 'indvent' },
        'wrk_iv_boiler_bkn_200': { name: 'Монтаж бойлера косвенного нагрева 200л', unit: 'шт', price: 12000, category: 'indvent' },
        'wrk_iv_boiler_bkn_500': { name: 'Монтаж бойлера косвенного нагрева 500л', unit: 'шт', price: 25000, category: 'indvent' }
    };
})();
