// === КАТАЛОГ РАБОТ: ВЕНТИЛЯЦИЯ, КОНДИЦИОНИРОВАНИЕ, ДЫМОУДАЛЕНИЕ (200 позиций) ===
(function () {
    window.AI_WRK_HVAC = {
        // Приточно-вытяжная вентиляция
        'wrk_hvac_supply_100': { name: 'Монтаж приточной вентиляции Ø100мм', unit: 'м.п.', price: 200, category: 'hvac' },
        'wrk_hvac_supply_125': { name: 'Монтаж приточной вентиляции Ø125мм', unit: 'м.п.', price: 250, category: 'hvac' },
        'wrk_hvac_supply_150': { name: 'Монтаж приточной вентиляции Ø150мм', unit: 'м.п.', price: 300, category: 'hvac' },
        'wrk_hvac_supply_200': { name: 'Монтаж приточной вентиляции Ø200мм', unit: 'м.п.', price: 400, category: 'hvac' },
        'wrk_hvac_supply_250': { name: 'Монтаж приточной вентиляции Ø250мм', unit: 'м.п.', price: 500, category: 'hvac' },
        'wrk_hvac_supply_315': { name: 'Монтаж приточной вентиляции Ø315мм', unit: 'м.п.', price: 600, category: 'hvac' },
        // Воздуховоды прямоугольные
        'wrk_hvac_rect_200x100': { name: 'Воздуховод 200×100мм', unit: 'м.п.', price: 250, category: 'hvac' },
        'wrk_hvac_rect_300x150': { name: 'Воздуховод 300×150мм', unit: 'м.п.', price: 350, category: 'hvac' },
        'wrk_hvac_rect_400x200': { name: 'Воздуховод 400×200мм', unit: 'м.п.', price: 500, category: 'hvac' },
        'wrk_hvac_rect_500x250': { name: 'Воздуховод 500×250мм', unit: 'м.п.', price: 650, category: 'hvac' },
        'wrk_hvac_rect_600x300': { name: 'Воздуховод 600×300мм', unit: 'м.п.', price: 800, category: 'hvac' },
        // Гибкие воздуховоды
        'wrk_hvac_flex_100': { name: 'Гибкий воздуховод Ø100мм', unit: 'м.п.', price: 100, category: 'hvac' },
        'wrk_hvac_flex_125': { name: 'Гибкий воздуховод Ø125мм', unit: 'м.п.', price: 120, category: 'hvac' },
        'wrk_hvac_flex_150': { name: 'Гибкий воздуховод Ø150мм', unit: 'м.п.', price: 150, category: 'hvac' },
        'wrk_hvac_flex_200': { name: 'Гибкий воздуховод Ø200мм', unit: 'м.п.', price: 200, category: 'hvac' },
        'wrk_hvac_flex_insul': { name: 'Гибкий утеплённый воздуховод', unit: 'м.п.', price: 250, category: 'hvac' },
        // Решётки / диффузоры
        'wrk_hvac_grille_supply': { name: 'Установка приточной решётки', unit: 'шт', price: 200, category: 'hvac' },
        'wrk_hvac_grille_exhaust': { name: 'Установка вытяжной решётки', unit: 'шт', price: 150, category: 'hvac' },
        'wrk_hvac_grille_transfer': { name: 'Установка переточной решётки', unit: 'шт', price: 100, category: 'hvac' },
        'wrk_hvac_diffuser_round': { name: 'Установка круглого диффузора', unit: 'шт', price: 200, category: 'hvac' },
        'wrk_hvac_diffuser_square': { name: 'Установка квадратного диффузора', unit: 'шт', price: 250, category: 'hvac' },
        'wrk_hvac_diffuser_linear': { name: 'Установка линейного диффузора', unit: 'м.п.', price: 300, category: 'hvac' },
        'wrk_hvac_diffuser_slot': { name: 'Установка щелевого диффузора', unit: 'м.п.', price: 350, category: 'hvac' },
        'wrk_hvac_anemostat': { name: 'Установка анемостата', unit: 'шт', price: 150, category: 'hvac' },
        // Вентиляторы
        'wrk_hvac_fan_exhaust': { name: 'Установка вытяжного вентилятора', unit: 'шт', price: 300, category: 'hvac' },
        'wrk_hvac_fan_kitchen': { name: 'Установка кухонной вытяжки', unit: 'шт', price: 500, category: 'hvac' },
        'wrk_hvac_fan_kitchen_embedded': { name: 'Установка встроенной вытяжки', unit: 'шт', price: 800, category: 'hvac' },
        'wrk_hvac_fan_channel_100': { name: 'Установка канального вентилятора Ø100мм', unit: 'шт', price: 500, category: 'hvac' },
        'wrk_hvac_fan_channel_125': { name: 'Установка канального вентилятора Ø125мм', unit: 'шт', price: 600, category: 'hvac' },
        'wrk_hvac_fan_channel_150': { name: 'Установка канального вентилятора Ø150мм', unit: 'шт', price: 700, category: 'hvac' },
        'wrk_hvac_fan_channel_200': { name: 'Установка канального вентилятора Ø200мм', unit: 'шт', price: 900, category: 'hvac' },
        'wrk_hvac_fan_channel_250': { name: 'Установка канального вентилятора Ø250мм', unit: 'шт', price: 1100, category: 'hvac' },
        'wrk_hvac_fan_roof': { name: 'Установка крышного вентилятора', unit: 'шт', price: 2000, category: 'hvac' },
        // ПВУ (приточно-вытяжная установка)
        'wrk_hvac_ahu_small': { name: 'Монтаж ПВУ (до 300 м³/ч)', unit: 'шт', price: 5000, category: 'hvac' },
        'wrk_hvac_ahu_medium': { name: 'Монтаж ПВУ (до 1000 м³/ч)', unit: 'шт', price: 10000, category: 'hvac' },
        'wrk_hvac_ahu_large': { name: 'Монтаж ПВУ (до 3000 м³/ч)', unit: 'шт', price: 20000, category: 'hvac' },
        'wrk_hvac_ahu_xl': { name: 'Монтаж ПВУ (до 10000 м³/ч)', unit: 'шт', price: 50000, category: 'hvac' },
        'wrk_hvac_recuperator_wall': { name: 'Установка стенового рекуператора', unit: 'шт', price: 3000, category: 'hvac' },
        'wrk_hvac_recuperator_dec': { name: 'Установка децентрализованного рекуператора', unit: 'шт', price: 5000, category: 'hvac' },
        // Бризер
        'wrk_hvac_breezer_install': { name: 'Установка бризера', unit: 'шт', price: 3000, category: 'hvac' },
        'wrk_hvac_breezer_wall_hole': { name: 'Бурение отверстия в стене (бризер)', unit: 'шт', price: 1500, category: 'hvac' },
        // Клапаны
        'wrk_hvac_valve_check': { name: 'Установка обратного клапана', unit: 'шт', price: 100, category: 'hvac' },
        'wrk_hvac_valve_fire': { name: 'Установка огнезадерживающего клапана', unit: 'шт', price: 1000, category: 'hvac' },
        'wrk_hvac_valve_throttle': { name: 'Установка дроссельного клапана', unit: 'шт', price: 200, category: 'hvac' },
        'wrk_hvac_valve_air': { name: 'Установка воздушного клапана', unit: 'шт', price: 300, category: 'hvac' },
        // Шумоглушители
        'wrk_hvac_silencer_100': { name: 'Установка шумоглушителя Ø100мм', unit: 'шт', price: 200, category: 'hvac' },
        'wrk_hvac_silencer_125': { name: 'Установка шумоглушителя Ø125мм', unit: 'шт', price: 250, category: 'hvac' },
        'wrk_hvac_silencer_150': { name: 'Установка шумоглушителя Ø150мм', unit: 'шт', price: 300, category: 'hvac' },
        'wrk_hvac_silencer_200': { name: 'Установка шумоглушителя Ø200мм', unit: 'шт', price: 400, category: 'hvac' },
        // Фильтры
        'wrk_hvac_filter_g4': { name: 'Установка фильтра G4', unit: 'шт', price: 100, category: 'hvac' },
        'wrk_hvac_filter_f7': { name: 'Установка фильтра F7', unit: 'шт', price: 150, category: 'hvac' },
        'wrk_hvac_filter_hepa': { name: 'Установка HEPA-фильтра', unit: 'шт', price: 300, category: 'hvac' },
        // Утепление воздуховодов
        'wrk_hvac_insul_50': { name: 'Утепление воздуховодов 50мм', unit: 'м²', price: 100, category: 'hvac' },
        'wrk_hvac_insul_100': { name: 'Утепление воздуховодов 100мм', unit: 'м²', price: 150, category: 'hvac' },
        // Настенные перемещения
        'wrk_hvac_wall_hole_core_100': { name: 'Алмазное бурение стены Ø100мм', unit: 'шт', price: 800, category: 'hvac' },
        'wrk_hvac_wall_hole_core_125': { name: 'Алмазное бурение стены Ø125мм', unit: 'шт', price: 1000, category: 'hvac' },
        'wrk_hvac_wall_hole_core_150': { name: 'Алмазное бурение стены Ø150мм', unit: 'шт', price: 1200, category: 'hvac' },
        'wrk_hvac_wall_hole_core_200': { name: 'Алмазное бурение стены Ø200мм', unit: 'шт', price: 1500, category: 'hvac' },
        'wrk_hvac_wall_hole_core_250': { name: 'Алмазное бурение стены Ø250мм', unit: 'шт', price: 2000, category: 'hvac' },
        'wrk_hvac_wall_hole_core_300': { name: 'Алмазное бурение стены Ø300мм', unit: 'шт', price: 2500, category: 'hvac' },
        // === КОНДИЦИОНИРОВАНИЕ ===
        'wrk_hvac_split_7': { name: 'Монтаж сплит-системы 7 (до 20м²)', unit: 'шт', price: 3000, category: 'hvac' },
        'wrk_hvac_split_9': { name: 'Монтаж сплит-системы 9 (до 25м²)', unit: 'шт', price: 3500, category: 'hvac' },
        'wrk_hvac_split_12': { name: 'Монтаж сплит-системы 12 (до 35м²)', unit: 'шт', price: 4000, category: 'hvac' },
        'wrk_hvac_split_18': { name: 'Монтаж сплит-системы 18 (до 50м²)', unit: 'шт', price: 5000, category: 'hvac' },
        'wrk_hvac_split_24': { name: 'Монтаж сплит-системы 24 (до 70м²)', unit: 'шт', price: 6000, category: 'hvac' },
        'wrk_hvac_split_30': { name: 'Монтаж сплит-системы 30 (до 90м²)', unit: 'шт', price: 7000, category: 'hvac' },
        'wrk_hvac_split_36': { name: 'Монтаж сплит-системы 36 (до 110м²)', unit: 'шт', price: 8000, category: 'hvac' },
        'wrk_hvac_multi_2': { name: 'Монтаж мульти-сплит (2 внутр. блока)', unit: 'шт', price: 8000, category: 'hvac' },
        'wrk_hvac_multi_3': { name: 'Монтаж мульти-сплит (3 внутр. блока)', unit: 'шт', price: 12000, category: 'hvac' },
        'wrk_hvac_multi_4': { name: 'Монтаж мульти-сплит (4 внутр. блока)', unit: 'шт', price: 16000, category: 'hvac' },
        'wrk_hvac_cassette': { name: 'Монтаж кассетного кондиционера', unit: 'шт', price: 8000, category: 'hvac' },
        'wrk_hvac_channel_cond': { name: 'Монтаж канального кондиционера', unit: 'шт', price: 10000, category: 'hvac' },
        'wrk_hvac_floor_ceil_cond': { name: 'Монтаж напольно-потолочного конд.', unit: 'шт', price: 6000, category: 'hvac' },
        'wrk_hvac_column_cond': { name: 'Монтаж колонного кондиционера', unit: 'шт', price: 8000, category: 'hvac' },
        'wrk_hvac_vrv_outdoor': { name: 'Монтаж VRV наружного блока', unit: 'шт', price: 20000, category: 'hvac' },
        'wrk_hvac_vrv_indoor': { name: 'Монтаж VRV внутреннего блока', unit: 'шт', price: 5000, category: 'hvac' },
        // Трасса кондиционера
        'wrk_hvac_cond_pipe_6x12': { name: 'Трасса кондиц. (6×12мм)', unit: 'м.п.', price: 250, category: 'hvac' },
        'wrk_hvac_cond_pipe_6x16': { name: 'Трасса кондиц. (6×16мм)', unit: 'м.п.', price: 300, category: 'hvac' },
        'wrk_hvac_cond_pipe_9x16': { name: 'Трасса кондиц. (9×16мм)', unit: 'м.п.', price: 350, category: 'hvac' },
        'wrk_hvac_cond_pipe_12x22': { name: 'Трасса кондиц. (12×22мм)', unit: 'м.п.', price: 400, category: 'hvac' },
        'wrk_hvac_cond_drain': { name: 'Дренаж кондиционера', unit: 'м.п.', price: 50, category: 'hvac' },
        'wrk_hvac_cond_bracket': { name: 'Установка кронштейнов наруж. блока', unit: 'компл.', price: 1000, category: 'hvac' },
        'wrk_hvac_cond_visor': { name: 'Установка козырька наруж. блока', unit: 'шт', price: 500, category: 'hvac' },
        'wrk_hvac_cond_pump': { name: 'Монтаж дренажной помпы', unit: 'шт', price: 1000, category: 'hvac' },
        // Дымоудаление
        'wrk_hvac_smoke_damper': { name: 'Установка противодымного клапана', unit: 'шт', price: 2000, category: 'hvac' },
        // Автоматика
        'wrk_hvac_control_panel': { name: 'Монтаж щита автоматики ОВиК', unit: 'шт', price: 10000, category: 'hvac' },
        'wrk_hvac_thermostat': { name: 'Установка термостата', unit: 'шт', price: 500, category: 'hvac' },
        'wrk_hvac_co2_sensor': { name: 'Установка датчика CO2', unit: 'шт', price: 500, category: 'hvac' },
        'wrk_hvac_humidity_sensor': { name: 'Установка датчика влажности', unit: 'шт', price: 300, category: 'hvac' },
        // Проектирование
        'wrk_hvac_project_vent': { name: 'Проектирование вентиляции (кв.)', unit: 'шт', price: 5000, category: 'hvac' },
        'wrk_hvac_project_vent_house': { name: 'Проектирование вентиляции (дом)', unit: 'шт', price: 10000, category: 'hvac' },
        'wrk_hvac_project_cond': { name: 'Проектирование кондиционирования', unit: 'шт', price: 8000, category: 'hvac' },
        // Пуско-наладка
        'wrk_hvac_commissioning_small': { name: 'Пуско-наладка вентиляции (малая)', unit: 'шт', price: 3000, category: 'hvac' },
        'wrk_hvac_commissioning_large': { name: 'Пуско-наладка вентиляции (большая)', unit: 'шт', price: 10000, category: 'hvac' }
    };
})();
