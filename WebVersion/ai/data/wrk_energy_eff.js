// === ЭНЕРГОЭФФЕКТИВНОСТЬ — аудит, энергоменеджмент, ВИЭ, тепловые контуры (50 поз.) ===
(function () {
    window.AI_WRK_ENERGY = {
        // === ЭНЕРГОАУДИТ === 1-6
        'wrk_en_audit_visual': { name: 'Визуальный энергоаудит', unit: 'объект', price: 55000, category: 'energy' },
        'wrk_en_audit_instrument': { name: 'Инструментальный энергоаудит', unit: 'объект', price: 250000, category: 'energy' },
        'wrk_en_energy_model': { name: 'Энергетическое моделирование (BIM)', unit: 'объект', price: 120000, category: 'energy' },
        // === СОЛНЕЧНАЯ ЭНЕРГИЯ (ФОТОЭЛЕКТРИКА) === 7-16
        'wrk_en_pv_panel_mono_400': { name: 'Монтаж солнечной панели 400Вт (моно)', unit: 'шт', price: 3500, category: 'energy' },
        'wrk_en_pv_panel_mono_550': { name: 'Монтаж солнечной панели 550Вт (моно)', unit: 'шт', price: 4500, category: 'energy' },
        'wrk_en_pv_mount_roof_flat': { name: 'Крепление на плоской кровле', unit: 'панель', price: 1500, category: 'energy' },
        'wrk_en_pv_mount_roof_tilt': { name: 'Крепление на скатной кровле', unit: 'панель', price: 1200, category: 'energy' },
        'wrk_en_pv_mount_ground': { name: 'Крепление наземное', unit: 'панель', price: 2500, category: 'energy' },
        'wrk_en_pv_inverter_5': { name: 'Инвертор сетевой 5кВт', unit: 'шт', price: 55000, category: 'energy' },
        'wrk_en_pv_inverter_10': { name: 'Инвертор сетевой 10кВт', unit: 'шт', price: 85000, category: 'energy' },
        'wrk_en_pv_inverter_30': { name: 'Инвертор сетевой 30кВт', unit: 'шт', price: 250000, category: 'energy' },
        'wrk_en_pv_battery_5': { name: 'Аккумулятор 5кВт·ч (LiFePO4)', unit: 'шт', price: 150000, category: 'energy' },
        'wrk_en_pv_battery_10': { name: 'Аккумулятор 10кВт·ч (LiFePO4)', unit: 'шт', price: 250000, category: 'energy' },
        // === СОЛНЕЧНЫЕ КОЛЛЕКТОРЫ (ТЕПЛОВЫЕ) === 17-22
        'wrk_en_solar_flat': { name: 'Монтаж плоского солнечного коллектора', unit: 'шт', price: 12000, category: 'energy' },
        'wrk_en_solar_vacuum': { name: 'Монтаж вакуумного коллектора', unit: 'шт', price: 15000, category: 'energy' },
        'wrk_en_solar_pump': { name: 'Насосная группа солнечной системы', unit: 'компл.', price: 25000, category: 'energy' },
        'wrk_en_solar_controller': { name: 'Контроллер солнечной системы', unit: 'шт', price: 15000, category: 'energy' },
        'wrk_en_solar_tank_200': { name: 'Бак-аккумулятор 200л', unit: 'шт', price: 35000, category: 'energy' },
        'wrk_en_solar_tank_500': { name: 'Бак-аккумулятор 500л', unit: 'шт', price: 85000, category: 'energy' },
        // === ТЕПЛОВЫЕ КОНТУРЫ / РЕКУПЕРАЦИЯ === 23-30
        'wrk_en_heat_recovery_ahu': { name: 'Рекуператор тепла (приточная)', unit: 'шт', price: 85000, category: 'energy' },
        'wrk_en_heat_recovery_drain': { name: 'Утилизатор тепла сточных вод', unit: 'шт', price: 55000, category: 'energy' },
        'wrk_en_economizer': { name: 'Экономайзер котла', unit: 'шт', price: 55000, category: 'energy' },
        'wrk_en_freq_drive_pump': { name: 'Частотный привод насоса (энергоэффект.)', unit: 'шт', price: 15000, category: 'energy' },
        'wrk_en_freq_drive_fan': { name: 'Частотный привод вентилятора', unit: 'шт', price: 15000, category: 'energy' },
        'wrk_en_weather_control': { name: 'Погодозависимая автоматика', unit: 'компл.', price: 55000, category: 'energy' },
        'wrk_en_itp_auto': { name: 'Автоматика ИТП (энергосберегающая)', unit: 'компл.', price: 250000, category: 'energy' },
        'wrk_en_zone_valve': { name: 'Зонное регулирование (клапаны)', unit: 'зона', price: 8500, category: 'energy' },
        // === УТЕПЛЕНИЕ (ЭНЕРГОЭФФЕКТ.) === 31-36
        'wrk_en_window_triple': { name: 'Замена на тройной стеклопакет', unit: 'м²', price: 8500, category: 'energy' },
        'wrk_en_window_film': { name: 'Энергосберегающая плёнка на стекло', unit: 'м²', price: 850, category: 'energy' },
        'wrk_en_door_seal': { name: 'Утепление/уплотнение дверей', unit: 'шт', price: 2500, category: 'energy' },
        'wrk_en_roof_add_insul': { name: 'Доутепление кровли', unit: 'м²', price: 550, category: 'energy' },
        'wrk_en_wall_add_insul': { name: 'Доутепление стен (изнутри)', unit: 'м²', price: 850, category: 'energy' },
        'wrk_en_basement_insul': { name: 'Утепление цоколя', unit: 'м²', price: 1200, category: 'energy' },
        // === LED / ОСВЕЩЕНИЕ === 37-42
        'wrk_en_led_replacement': { name: 'Замена на LED освещение', unit: 'светильник', price: 550, category: 'energy' },
        'wrk_en_led_panel': { name: 'Установка LED панели 600×600', unit: 'шт', price: 850, category: 'energy' },
        'wrk_en_motion_sensor': { name: 'Датчик движения (энергосбережение)', unit: 'шт', price: 850, category: 'energy' },
        'wrk_en_dimmer': { name: 'Диммер светодиодный', unit: 'шт', price: 1200, category: 'energy' },
        'wrk_en_lighting_control': { name: 'Система управления освещением (DALI)', unit: 'компл.', price: 55000, category: 'energy' },
        // === МОНИТОРИНГ === 43-48
        'wrk_en_smart_meter_elec': { name: 'Умный счётчик электроэнергии', unit: 'шт', price: 5500, category: 'energy' },
        'wrk_en_smart_meter_heat': { name: 'Умный теплосчётчик', unit: 'шт', price: 12000, category: 'energy' },
        'wrk_en_energy_monitor': { name: 'Система мониторинга энергопотребления', unit: 'компл.', price: 120000, category: 'energy' },
        'wrk_en_power_analyzer': { name: 'Анализатор качества электроэнергии', unit: 'шт', price: 25000, category: 'energy' },
        'wrk_en_compensation_unit': { name: 'Установка компенсации реактивной мощности', unit: 'шт', price: 120000, category: 'energy' },
        'wrk_en_green_cert': { name: 'Сертификация BREEAM/LEED (сопровождение)', unit: 'объект', price: 550000, category: 'energy' }
    };
})();
