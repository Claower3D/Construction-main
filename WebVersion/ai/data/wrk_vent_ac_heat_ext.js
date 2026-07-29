// === ФАЗА 3: РАСШИРЕННАЯ ВЕНТИЛЯЦИЯ/КОНДИЦИОНИРОВАНИЕ, ОТОПЛЕНИЕ, ТЕПЛЫЙ ПОЛ (250 поз.) ===
(function () {
    // === РАСШИРЕННАЯ ВЕНТИЛЯЦИЯ ===
    window.AI_WRK_VENT_EXT = {
        // Воздуховоды по размерам
        'wrk_vnt_duct_round_160': { name: 'Воздуховод круглый Ø160мм', unit: 'м.п.', price: 80, category: 'vent_ext' },
        'wrk_vnt_duct_round_500': { name: 'Воздуховод круглый Ø500мм', unit: 'м.п.', price: 260, category: 'vent_ext' },
        'wrk_vnt_duct_round_630': { name: 'Воздуховод круглый Ø630мм', unit: 'м.п.', price: 350, category: 'vent_ext' },
        'wrk_vnt_duct_round_800': { name: 'Воздуховод круглый Ø800мм', unit: 'м.п.', price: 500, category: 'vent_ext' },
        'wrk_vnt_duct_round_1000': { name: 'Воздуховод круглый Ø1000мм', unit: 'м.п.', price: 700, category: 'vent_ext' },
        'wrk_vnt_duct_rect_250x150': { name: 'Воздуховод прямоуг. 250×150мм', unit: 'м.п.', price: 80, category: 'vent_ext' },
        'wrk_vnt_duct_rect_800x400': { name: 'Воздуховод прямоуг. 800×400мм', unit: 'м.п.', price: 300, category: 'vent_ext' },
        'wrk_vnt_duct_rect_1000x500': { name: 'Воздуховод прямоуг. 1000×500мм', unit: 'м.п.', price: 400, category: 'vent_ext' },
        'wrk_vnt_duct_flex_160': { name: 'Гибкий воздуховод Ø160мм', unit: 'м.п.', price: 40, category: 'vent_ext' },
        'wrk_vnt_duct_flex_250': { name: 'Гибкий воздуховод Ø250мм', unit: 'м.п.', price: 60, category: 'vent_ext' },
        // Решётки / диффузоры
        'wrk_vnt_grille_200x200': { name: 'Решётка вент. 200×200', unit: 'шт', price: 100, category: 'vent_ext' },
        'wrk_vnt_grille_300x150': { name: 'Решётка вент. 300×150', unit: 'шт', price: 120, category: 'vent_ext' },
        'wrk_vnt_grille_400x200': { name: 'Решётка вент. 400×200', unit: 'шт', price: 150, category: 'vent_ext' },
        'wrk_vnt_grille_500x200': { name: 'Решётка вент. 500×200', unit: 'шт', price: 180, category: 'vent_ext' },
        'wrk_vnt_grille_600x300': { name: 'Решётка вент. 600×300', unit: 'шт', price: 250, category: 'vent_ext' },
        'wrk_vnt_diffuser_round_100': { name: 'Диффузор круглый Ø100мм', unit: 'шт', price: 80, category: 'vent_ext' },
        'wrk_vnt_diffuser_round_125': { name: 'Диффузор круглый Ø125мм', unit: 'шт', price: 100, category: 'vent_ext' },
        'wrk_vnt_diffuser_round_160': { name: 'Диффузор круглый Ø160мм', unit: 'шт', price: 120, category: 'vent_ext' },
        'wrk_vnt_diffuser_round_200': { name: 'Диффузор круглый Ø200мм', unit: 'шт', price: 150, category: 'vent_ext' },
        'wrk_vnt_diffuser_4way': { name: 'Диффузор 4-сторонний', unit: 'шт', price: 200, category: 'vent_ext' },
        // Оборудование вентиляции
        'wrk_vnt_fan_axial_100': { name: 'Осевой вентилятор Ø100мм', unit: 'шт', price: 200, category: 'vent_ext' },
        'wrk_vnt_fan_axial_125': { name: 'Осевой вентилятор Ø125мм', unit: 'шт', price: 250, category: 'vent_ext' },
        'wrk_vnt_fan_axial_150': { name: 'Осевой вентилятор Ø150мм', unit: 'шт', price: 300, category: 'vent_ext' },
        'wrk_vnt_fan_channel_100': { name: 'Канальный вентилятор Ø100мм', unit: 'шт', price: 400, category: 'vent_ext' },
        'wrk_vnt_fan_channel_125': { name: 'Канальный вентилятор Ø125мм', unit: 'шт', price: 500, category: 'vent_ext' },
        'wrk_vnt_fan_channel_160': { name: 'Канальный вентилятор Ø160мм', unit: 'шт', price: 600, category: 'vent_ext' },
        'wrk_vnt_fan_channel_200': { name: 'Канальный вентилятор Ø200мм', unit: 'шт', price: 800, category: 'vent_ext' },
        'wrk_vnt_fan_channel_250': { name: 'Канальный вентилятор Ø250мм', unit: 'шт', price: 1000, category: 'vent_ext' },
        'wrk_vnt_fan_channel_315': { name: 'Канальный вентилятор Ø315мм', unit: 'шт', price: 1500, category: 'vent_ext' },
        'wrk_vnt_fan_smoke': { name: 'Дымоудаление вентилятор', unit: 'шт', price: 10000, category: 'vent_ext' },
        // Рекуператоры / ПВУ
        'wrk_vnt_recup_wall_150': { name: 'Рекуператор приточный Ø150мм', unit: 'шт', price: 3000, category: 'vent_ext' },
        'wrk_vnt_recup_wall_200': { name: 'Рекуператор приточный Ø200мм', unit: 'шт', price: 5000, category: 'vent_ext' },
        'wrk_vnt_ahu_500': { name: 'ПВУ 500 м³/ч (монтаж)', unit: 'шт', price: 10000, category: 'vent_ext' },
        'wrk_vnt_ahu_1000': { name: 'ПВУ 1000 м³/ч (монтаж)', unit: 'шт', price: 15000, category: 'vent_ext' },
        'wrk_vnt_ahu_2000': { name: 'ПВУ 2000 м³/ч (монтаж)', unit: 'шт', price: 25000, category: 'vent_ext' },
        'wrk_vnt_ahu_5000': { name: 'ПВУ 5000 м³/ч (монтаж)', unit: 'шт', price: 50000, category: 'vent_ext' },
        'wrk_vnt_ahu_10000': { name: 'ПВУ 10000 м³/ч (монтаж)', unit: 'шт', price: 80000, category: 'vent_ext' },
        // Клапаны
        'wrk_vnt_damper_fire_100': { name: 'Огнезадерживающий клапан Ø100мм', unit: 'шт', price: 500, category: 'vent_ext' },
        'wrk_vnt_damper_fire_200': { name: 'Огнезадерживающий клапан Ø200мм', unit: 'шт', price: 800, category: 'vent_ext' },
        'wrk_vnt_damper_fire_315': { name: 'Огнезадерживающий клапан Ø315мм', unit: 'шт', price: 1200, category: 'vent_ext' },
        'wrk_vnt_damper_reg_100': { name: 'Клапан регулирующий Ø100мм', unit: 'шт', price: 200, category: 'vent_ext' },
        'wrk_vnt_damper_reg_200': { name: 'Клапан регулирующий Ø200мм', unit: 'шт', price: 400, category: 'vent_ext' },
        'wrk_vnt_damper_feedback': { name: 'Клапан с электроприводом', unit: 'шт', price: 1000, category: 'vent_ext' },
        'wrk_vnt_check_valve_100': { name: 'Обратный клапан вент. Ø100мм', unit: 'шт', price: 100, category: 'vent_ext' },
        'wrk_vnt_check_valve_200': { name: 'Обратный клапан вент. Ø200мм', unit: 'шт', price: 200, category: 'vent_ext' }
    };

    // === РАСШИРЕННОЕ КОНДИЦИОНИРОВАНИЕ ===
    window.AI_WRK_AC_EXT = {
        // Сплит-системы (детально)
        'wrk_ac_split_07': { name: 'Сплит-система 2.0кВт (7BTU)', unit: 'шт', price: 3000, category: 'ac_ext' },
        'wrk_ac_split_09': { name: 'Сплит-система 2.5кВт (9BTU)', unit: 'шт', price: 3500, category: 'ac_ext' },
        'wrk_ac_split_12': { name: 'Сплит-система 3.5кВт (12BTU)', unit: 'шт', price: 4000, category: 'ac_ext' },
        'wrk_ac_split_18': { name: 'Сплит-система 5.0кВт (18BTU)', unit: 'шт', price: 5000, category: 'ac_ext' },
        'wrk_ac_split_24': { name: 'Сплит-система 7.0кВт (24BTU)', unit: 'шт', price: 6000, category: 'ac_ext' },
        'wrk_ac_split_36': { name: 'Сплит-система 10.0кВт (36BTU)', unit: 'шт', price: 8000, category: 'ac_ext' },
        // Канальные
        'wrk_ac_duct_25': { name: 'Канальный кондиционер 2.5кВт', unit: 'шт', price: 8000, category: 'ac_ext' },
        'wrk_ac_duct_50': { name: 'Канальный кондиционер 5.0кВт', unit: 'шт', price: 10000, category: 'ac_ext' },
        'wrk_ac_duct_100': { name: 'Канальный кондиционер 10.0кВт', unit: 'шт', price: 15000, category: 'ac_ext' },
        'wrk_ac_duct_140': { name: 'Канальный кондиционер 14.0кВт', unit: 'шт', price: 20000, category: 'ac_ext' },
        // Кассетные
        'wrk_ac_cassette_25': { name: 'Кассетный кондиционер 2.5кВт', unit: 'шт', price: 8000, category: 'ac_ext' },
        'wrk_ac_cassette_50': { name: 'Кассетный кондиционер 5.0кВт', unit: 'шт', price: 10000, category: 'ac_ext' },
        'wrk_ac_cassette_100': { name: 'Кассетный кондиционер 10.0кВт', unit: 'шт', price: 15000, category: 'ac_ext' },
        'wrk_ac_cassette_140': { name: 'Кассетный кондиционер 14.0кВт', unit: 'шт', price: 18000, category: 'ac_ext' },
        // Напольно-потолочные
        'wrk_ac_floor_ceil_35': { name: 'Напольно-потолочный 3.5кВт', unit: 'шт', price: 7000, category: 'ac_ext' },
        'wrk_ac_floor_ceil_50': { name: 'Напольно-потолочный 5.0кВт', unit: 'шт', price: 9000, category: 'ac_ext' },
        'wrk_ac_floor_ceil_100': { name: 'Напольно-потолочный 10.0кВт', unit: 'шт', price: 13000, category: 'ac_ext' },
        'wrk_ac_floor_ceil_140': { name: 'Напольно-потолочный 14.0кВт', unit: 'шт', price: 16000, category: 'ac_ext' },
        // Мульти-сплит
        'wrk_ac_multi_2out': { name: 'Мульти-сплит наружн. блок 2 выхода', unit: 'шт', price: 6000, category: 'ac_ext' },
        'wrk_ac_multi_3out': { name: 'Мульти-сплит наружн. блок 3 выхода', unit: 'шт', price: 8000, category: 'ac_ext' },
        'wrk_ac_multi_4out': { name: 'Мульти-сплит наружн. блок 4 выхода', unit: 'шт', price: 10000, category: 'ac_ext' },
        'wrk_ac_multi_5out': { name: 'Мульти-сплит наружн. блок 5 выходов', unit: 'шт', price: 12000, category: 'ac_ext' },
        // VRV/VRF
        'wrk_ac_vrv_outdoor_14': { name: 'VRV наружн. блок 14кВт', unit: 'шт', price: 20000, category: 'ac_ext' },
        'wrk_ac_vrv_outdoor_28': { name: 'VRV наружн. блок 28кВт', unit: 'шт', price: 30000, category: 'ac_ext' },
        'wrk_ac_vrv_outdoor_45': { name: 'VRV наружн. блок 45кВт', unit: 'шт', price: 50000, category: 'ac_ext' },
        'wrk_ac_vrv_outdoor_56': { name: 'VRV наружн. блок 56кВт', unit: 'шт', price: 60000, category: 'ac_ext' },
        'wrk_ac_vrv_indoor': { name: 'VRV внутренний блок (монтаж)', unit: 'шт', price: 5000, category: 'ac_ext' },
        // Доп. работы кондиц.
        'wrk_ac_pipe_ext_3m': { name: 'Доп. трасса 3м (медь)', unit: 'м.п.', price: 500, category: 'ac_ext' },
        'wrk_ac_pipe_ext_5m': { name: 'Доп. трасса 5м (медь)', unit: 'м.п.', price: 500, category: 'ac_ext' },
        'wrk_ac_drain_pump': { name: 'Дренажная помпа', unit: 'шт', price: 2000, category: 'ac_ext' },
        'wrk_ac_bracket': { name: 'Кронштейн наружного блока', unit: 'компл.', price: 500, category: 'ac_ext' },
        'wrk_ac_rooftop': { name: 'Установка на крышу (альпинизм)', unit: 'шт', price: 3000, category: 'ac_ext' },
        'wrk_ac_service': { name: 'Сервисное обслуживание', unit: 'шт', price: 1500, category: 'ac_ext' },
    };

    // === РАСШИРЕННОЕ ОТОПЛЕНИЕ / ТЁПЛЫЙ ПОЛ ===
    window.AI_WRK_HEAT_EXT = {
        // Радиаторы (детально)
        'wrk_ht_radiator_steel_11_500': { name: 'Радиатор сталь. тип 11 h=500мм', unit: 'секция', price: 200, category: 'heat_ext' },
        'wrk_ht_radiator_steel_22_500': { name: 'Радиатор сталь. тип 22 h=500мм', unit: 'секция', price: 300, category: 'heat_ext' },
        'wrk_ht_radiator_steel_33_500': { name: 'Радиатор сталь. тип 33 h=500мм', unit: 'секция', price: 400, category: 'heat_ext' },
        'wrk_ht_radiator_bimetal_500': { name: 'Биметаллический радиатор h=500мм', unit: 'секция', price: 100, category: 'heat_ext' },
        'wrk_ht_radiator_alum_500': { name: 'Алюминиевый радиатор h=500мм', unit: 'секция', price: 80, category: 'heat_ext' },
        'wrk_ht_radiator_floor': { name: 'Конвектор внутрипольный', unit: 'шт', price: 5000, category: 'heat_ext' },
        'wrk_ht_radiator_towel': { name: 'Полотенцесушитель (монтаж)', unit: 'шт', price: 1000, category: 'heat_ext' },
        'wrk_ht_radiator_design': { name: 'Дизайн-радиатор (монтаж)', unit: 'шт', price: 2000, category: 'heat_ext' },
        // Тёплый пол (детально)
        'wrk_ht_floor_water_pe': { name: 'Тёплый пол водяной PEX', unit: 'м²', price: 200, category: 'heat_ext' },
        'wrk_ht_floor_water_pert': { name: 'Тёплый пол водяной PE-RT', unit: 'м²', price: 180, category: 'heat_ext' },
        'wrk_ht_floor_manifold_2': { name: 'Коллектор тёплого пола 2 контура', unit: 'шт', price: 2000, category: 'heat_ext' },
        'wrk_ht_floor_manifold_4': { name: 'Коллектор тёплого пола 4 контура', unit: 'шт', price: 3000, category: 'heat_ext' },
        'wrk_ht_floor_manifold_6': { name: 'Коллектор тёплого пола 6 контуров', unit: 'шт', price: 4000, category: 'heat_ext' },
        'wrk_ht_floor_manifold_8': { name: 'Коллектор тёплого пола 8 контуров', unit: 'шт', price: 5000, category: 'heat_ext' },
        'wrk_ht_floor_manifold_10': { name: 'Коллектор тёплого пола 10 контуров', unit: 'шт', price: 6000, category: 'heat_ext' },
        'wrk_ht_floor_manifold_12': { name: 'Коллектор тёплого пола 12 контуров', unit: 'шт', price: 7000, category: 'heat_ext' },
        'wrk_ht_floor_elec_cable': { name: 'Тёплый пол электрический (кабель)', unit: 'м²', price: 150, category: 'heat_ext' },
        'wrk_ht_floor_elec_mat': { name: 'Тёплый пол электрический (мат)', unit: 'м²', price: 180, category: 'heat_ext' },
        'wrk_ht_floor_elec_film': { name: 'Тёплый пол плёночный (ИК)', unit: 'м²', price: 120, category: 'heat_ext' },
        'wrk_ht_floor_thermostat_prog': { name: 'Терморегулятор программируемый', unit: 'шт', price: 1000, category: 'heat_ext' },
        // Котлы (расширение)
        'wrk_ht_boiler_gas_24': { name: 'Котёл газовый 24кВт (монтаж)', unit: 'шт', price: 5000, category: 'heat_ext' },
        'wrk_ht_boiler_gas_32': { name: 'Котёл газовый 32кВт (монтаж)', unit: 'шт', price: 6000, category: 'heat_ext' },
        'wrk_ht_boiler_gas_50': { name: 'Котёл газовый 50кВт (монтаж)', unit: 'шт', price: 8000, category: 'heat_ext' },
        'wrk_ht_boiler_gas_100': { name: 'Котёл газовый 100кВт (монтаж)', unit: 'шт', price: 15000, category: 'heat_ext' },
        'wrk_ht_boiler_cond_24': { name: 'Конденсационный котёл 24кВт', unit: 'шт', price: 8000, category: 'heat_ext' },
        'wrk_ht_boiler_cond_35': { name: 'Конденсационный котёл 35кВт', unit: 'шт', price: 10000, category: 'heat_ext' },
        'wrk_ht_boiler_elec_6': { name: 'Котёл электрич. 6кВт', unit: 'шт', price: 3000, category: 'heat_ext' },
        'wrk_ht_boiler_elec_12': { name: 'Котёл электрич. 12кВт', unit: 'шт', price: 4000, category: 'heat_ext' },
        'wrk_ht_boiler_elec_24': { name: 'Котёл электрич. 24кВт', unit: 'шт', price: 5000, category: 'heat_ext' },
        'wrk_ht_boiler_solid_20': { name: 'Котёл твёрдотопл. 20кВт', unit: 'шт', price: 5000, category: 'heat_ext' },
        'wrk_ht_boiler_solid_40': { name: 'Котёл твёрдотопл. 40кВт', unit: 'шт', price: 8000, category: 'heat_ext' },
        'wrk_ht_boiler_pellet_20': { name: 'Котёл пеллетный 20кВт', unit: 'шт', price: 10000, category: 'heat_ext' },
        // Тепловые насосы
        'wrk_ht_heat_pump_air_8': { name: 'Тепловой насос возд. 8кВт', unit: 'шт', price: 20000, category: 'heat_ext' },
        'wrk_ht_heat_pump_air_14': { name: 'Тепловой насос возд. 14кВт', unit: 'шт', price: 30000, category: 'heat_ext' },
        'wrk_ht_heat_pump_geo_10': { name: 'Тепловой насос грунт. 10кВт', unit: 'шт', price: 40000, category: 'heat_ext' },
        'wrk_ht_heat_pump_geo_20': { name: 'Тепловой насос грунт. 20кВт', unit: 'шт', price: 60000, category: 'heat_ext' },
        // Дымоходы
        'wrk_ht_chimney_coax_60_100': { name: 'Коаксиальный дымоход 60/100', unit: 'м.п.', price: 500, category: 'heat_ext' },
        'wrk_ht_chimney_coax_80_125': { name: 'Коаксиальный дымоход 80/125', unit: 'м.п.', price: 700, category: 'heat_ext' }
    };
})();
