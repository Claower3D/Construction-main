// === ФАЗА 3: СОЛНЕЧНАЯ ЭНЕРГЕТИКА, ВЕТРОГЕНЕРАЦИЯ, ТЕПЛОВЫЕ НАСОСЫ, АККУМУЛЯЦИЯ (90 поз.) ===
(function () {
    window.AI_WRK_RENEWABLE_ENERGY = {
        // === СОЛНЕЧНЫЕ ПАНЕЛИ ===
        'wrk_re_solar_mono_400': { name: 'Солнечная панель моно 400Вт', unit: 'шт', price: 500, category: 'renewable_energy' },
        'wrk_re_solar_mono_500': { name: 'Солнечная панель моно 500Вт', unit: 'шт', price: 600, category: 'renewable_energy' },
        'wrk_re_solar_mono_550': { name: 'Солнечная панель моно 550Вт', unit: 'шт', price: 700, category: 'renewable_energy' },
        'wrk_re_solar_bifacial_400': { name: 'Двусторонняя панель 400Вт', unit: 'шт', price: 600, category: 'renewable_energy' },
        'wrk_re_solar_bifacial_550': { name: 'Двусторонняя панель 550Вт', unit: 'шт', price: 800, category: 'renewable_energy' },
        'wrk_re_solar_thin_film': { name: 'Тонкоплёночная панель', unit: 'шт', price: 400, category: 'renewable_energy' },
        'wrk_re_solar_flexible': { name: 'Гибкая солнечная панель', unit: 'шт', price: 300, category: 'renewable_energy' },
        'wrk_re_solar_roof_tile': { name: 'Солнечная черепица', unit: 'м²', price: 500, category: 'renewable_energy' },

        // === СИСТЕМЫ КРЕПЛЕНИЯ ===
        'wrk_re_mount_roof_flat': { name: 'Крепление на плоскую кровлю', unit: 'панель', price: 50, category: 'renewable_energy' },
        'wrk_re_mount_roof_tilt': { name: 'Крепление на скатную кровлю', unit: 'панель', price: 40, category: 'renewable_energy' },
        'wrk_re_mount_ground': { name: 'Наземное крепление', unit: 'панель', price: 60, category: 'renewable_energy' },
        'wrk_re_mount_tracker_1': { name: 'Трекер одноосевой', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_mount_tracker_2': { name: 'Трекер двухосевой', unit: 'шт', price: 10000, category: 'renewable_energy' },
        'wrk_re_mount_carport': { name: 'Солнечный навес (карпорт)', unit: 'м²', price: 300, category: 'renewable_energy' },

        // === ИНВЕРТОРЫ ===
        'wrk_re_inv_string_3': { name: 'Сетевой инвертор 3кВт', unit: 'шт', price: 2000, category: 'renewable_energy' },
        'wrk_re_inv_string_5': { name: 'Сетевой инвертор 5кВт', unit: 'шт', price: 3000, category: 'renewable_energy' },
        'wrk_re_inv_string_8': { name: 'Сетевой инвертор 8кВт', unit: 'шт', price: 4000, category: 'renewable_energy' },
        'wrk_re_inv_string_10': { name: 'Сетевой инвертор 10кВт', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_inv_string_15': { name: 'Сетевой инвертор 15кВт', unit: 'шт', price: 7000, category: 'renewable_energy' },
        'wrk_re_inv_string_20': { name: 'Сетевой инвертор 20кВт', unit: 'шт', price: 9000, category: 'renewable_energy' },
        'wrk_re_inv_string_30': { name: 'Сетевой инвертор 30кВт', unit: 'шт', price: 12000, category: 'renewable_energy' },
        'wrk_re_inv_string_50': { name: 'Сетевой инвертор 50кВт', unit: 'шт', price: 18000, category: 'renewable_energy' },
        'wrk_re_inv_micro': { name: 'Микроинвертор', unit: 'шт', price: 500, category: 'renewable_energy' },
        'wrk_re_inv_hybrid_5': { name: 'Гибридный инвертор 5кВт', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_inv_hybrid_8': { name: 'Гибридный инвертор 8кВт', unit: 'шт', price: 7000, category: 'renewable_energy' },
        'wrk_re_inv_hybrid_10': { name: 'Гибридный инвертор 10кВт', unit: 'шт', price: 9000, category: 'renewable_energy' },
        'wrk_re_inv_hybrid_15': { name: 'Гибридный инвертор 15кВт', unit: 'шт', price: 12000, category: 'renewable_energy' },

        // === АККУМУЛЯЦИЯ ===
        'wrk_re_battery_lifepo4_5': { name: 'АКБ LiFePO4 5кВт·ч', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_battery_lifepo4_10': { name: 'АКБ LiFePO4 10кВт·ч', unit: 'шт', price: 9000, category: 'renewable_energy' },
        'wrk_re_battery_lifepo4_15': { name: 'АКБ LiFePO4 15кВт·ч', unit: 'шт', price: 13000, category: 'renewable_energy' },
        'wrk_re_battery_lifepo4_20': { name: 'АКБ LiFePO4 20кВт·ч', unit: 'шт', price: 17000, category: 'renewable_energy' },
        'wrk_re_battery_gel_100': { name: 'АКБ гелевый 100Ач', unit: 'шт', price: 1000, category: 'renewable_energy' },
        'wrk_re_battery_gel_200': { name: 'АКБ гелевый 200Ач', unit: 'шт', price: 1800, category: 'renewable_energy' },
        'wrk_re_battery_rack': { name: 'Стеллаж аккумуляторный', unit: 'шт', price: 1000, category: 'renewable_energy' },
        'wrk_re_bms': { name: 'BMS (система управл. батареей)', unit: 'шт', price: 1000, category: 'renewable_energy' },

        // === КАБЕЛЬНАЯ ИНФРАСТРУКТУРА ===
        'wrk_re_cable_dc_6': { name: 'Кабель DC 6мм² (солнечный)', unit: 'м.п.', price: 5, category: 'renewable_energy' },
        'wrk_re_cable_dc_10': { name: 'Кабель DC 10мм² (солнечный)', unit: 'м.п.', price: 8, category: 'renewable_energy' },
        'wrk_re_mc4': { name: 'Коннектор MC4', unit: 'пара', price: 5, category: 'renewable_energy' },
        'wrk_re_combiner_box': { name: 'Комбайнер-бокс (соед. коробка)', unit: 'шт', price: 500, category: 'renewable_energy' },
        'wrk_re_dc_switch': { name: 'Рубильник DC', unit: 'шт', price: 100, category: 'renewable_energy' },
        'wrk_re_ac_breaker': { name: 'Автомат AC (солнечная)', unit: 'шт', price: 50, category: 'renewable_energy' },
        'wrk_re_surge_dc': { name: 'УЗИП DC (солнечная)', unit: 'шт', price: 200, category: 'renewable_energy' },
        'wrk_re_meter_bi': { name: 'Двунаправленный счётчик', unit: 'шт', price: 500, category: 'renewable_energy' },
        'wrk_re_monitoring': { name: 'Мониторинг солнечной системы', unit: 'комплект', price: 500, category: 'renewable_energy' },

        // === ВЕТРОГЕНЕРАЦИЯ ===
        'wrk_re_wind_1kw': { name: 'Ветрогенератор 1кВт', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_wind_3kw': { name: 'Ветрогенератор 3кВт', unit: 'шт', price: 10000, category: 'renewable_energy' },
        'wrk_re_wind_5kw': { name: 'Ветрогенератор 5кВт', unit: 'шт', price: 18000, category: 'renewable_energy' },
        'wrk_re_wind_10kw': { name: 'Ветрогенератор 10кВт', unit: 'шт', price: 35000, category: 'renewable_energy' },
        'wrk_re_wind_mast_6': { name: 'Мачта ветрогенератора 6м', unit: 'шт', price: 2000, category: 'renewable_energy' },
        'wrk_re_wind_mast_12': { name: 'Мачта ветрогенератора 12м', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_wind_mast_18': { name: 'Мачта ветрогенератора 18м', unit: 'шт', price: 10000, category: 'renewable_energy' },

        // === СОЛНЕЧНЫЕ КОЛЛЕКТОРЫ (вода) ===
        'wrk_re_collector_flat': { name: 'Солнечный коллектор (плоский)', unit: 'шт', price: 3000, category: 'renewable_energy' },
        'wrk_re_collector_vacuum': { name: 'Солнечный коллектор (вакуумный)', unit: 'шт', price: 5000, category: 'renewable_energy' },
        'wrk_re_collector_tank_200': { name: 'Бак-аккумулятор 200л (солн.)', unit: 'шт', price: 3000, category: 'renewable_energy' },
        'wrk_re_collector_tank_300': { name: 'Бак-аккумулятор 300л (солн.)', unit: 'шт', price: 4000, category: 'renewable_energy' },
        'wrk_re_collector_pump': { name: 'Насосная группа (коллектор)', unit: 'шт', price: 1000, category: 'renewable_energy' },
        'wrk_re_collector_ctrl': { name: 'Контроллер солнечного коллектора', unit: 'шт', price: 500, category: 'renewable_energy' }
    };
})();
