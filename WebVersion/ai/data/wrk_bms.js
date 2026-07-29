// === СИСТЕМЫ АВТОМАТИЗАЦИИ И ДИСПЕТЧЕРИЗАЦИИ ЗДАНИЙ (BMS/SCADA) ===
(function () {
    window.AI_WRK_BMS = {
        // === КОНТРОЛЛЕРЫ BMS ===
        'wrk_bms_controller_small': { name: 'Монтаж контроллера BMS (малый)', unit: 'шт', price: 25000, category: 'bms' },
        'wrk_bms_controller_medium': { name: 'Монтаж контроллера BMS (средний)', unit: 'шт', price: 55000, category: 'bms' },
        'wrk_bms_controller_large': { name: 'Монтаж контроллера BMS (большой)', unit: 'шт', price: 120000, category: 'bms' },
        // === ДАТЧИКИ ===
        'wrk_bms_sensor_temp_duct': { name: 'Датчик температуры (канальный)', unit: 'шт', price: 2500, category: 'bms' },
        'wrk_bms_sensor_temp_room': { name: 'Датчик температуры (комнатный)', unit: 'шт', price: 1200, category: 'bms' },
        'wrk_bms_sensor_temp_outdoor': { name: 'Датчик температуры (наружный)', unit: 'шт', price: 1500, category: 'bms' },
        'wrk_bms_sensor_temp_pipe': { name: 'Датчик температуры (накладной на трубу)', unit: 'шт', price: 1500, category: 'bms' },
        'wrk_bms_sensor_humidity': { name: 'Датчик влажности (комнатный)', unit: 'шт', price: 3500, category: 'bms' },
        'wrk_bms_sensor_co2': { name: 'Датчик CO₂ (комнатный)', unit: 'шт', price: 8500, category: 'bms' },
        'wrk_bms_sensor_pressure_air': { name: 'Датчик давления воздуха', unit: 'шт', price: 3500, category: 'bms' },
        'wrk_bms_sensor_pressure_water': { name: 'Датчик давления воды', unit: 'шт', price: 3500, category: 'bms' },
        'wrk_bms_sensor_flow_water': { name: 'Датчик расхода воды', unit: 'шт', price: 8500, category: 'bms' },
        'wrk_bms_sensor_level': { name: 'Датчик уровня', unit: 'шт', price: 5500, category: 'bms' },
        'wrk_bms_sensor_occupancy': { name: 'Датчик присутствия', unit: 'шт', price: 2500, category: 'bms' },
        'wrk_bms_sensor_lux': { name: 'Датчик освещённости', unit: 'шт', price: 2500, category: 'bms' },
        'wrk_bms_sensor_leak': { name: 'Датчик протечки', unit: 'шт', price: 1500, category: 'bms' },
        // === ИСПОЛНИТЕЛЬНЫЕ МЕХАНИЗМЫ ===
        'wrk_bms_actuator_valve_2w': { name: 'Привод клапана (двухходовой)', unit: 'шт', price: 5500, category: 'bms' },
        'wrk_bms_actuator_valve_3w': { name: 'Привод клапана (трёхходовой)', unit: 'шт', price: 8500, category: 'bms' },
        'wrk_bms_actuator_damper': { name: 'Привод воздушного клапана', unit: 'шт', price: 5500, category: 'bms' },
        'wrk_bms_vfd': { name: 'Частотный преобразователь', unit: 'шт', price: 15000, category: 'bms' },
        // === ЩИТЫ АВТОМАТИКИ ===
        'wrk_bms_panel_ahu': { name: 'Щит автоматики ПВУ', unit: 'шт', price: 55000, category: 'bms' },
        'wrk_bms_panel_heat': { name: 'Щит автоматики ИТП', unit: 'шт', price: 85000, category: 'bms' },
        'wrk_bms_panel_pump': { name: 'Щит управления насосами', unit: 'шт', price: 35000, category: 'bms' },
        // === СЕРВЕРНАЯ / РАБОЧАЯ СТАНЦИЯ ===
        'wrk_bms_server': { name: 'Монтаж сервера BMS', unit: 'шт', price: 120000, category: 'bms' },
        'wrk_bms_workstation': { name: 'Рабочая станция диспетчера', unit: 'шт', price: 55000, category: 'bms' },
        'wrk_bms_scada_license': { name: 'Лицензия SCADA ПО', unit: 'шт', price: 250000, category: 'bms' },
        // === СЕТИ BMS ===
        'wrk_bms_cable_bus': { name: 'Прокладка шины BACnet/Modbus', unit: 'м.п.', price: 80, category: 'bms' },
        'wrk_bms_cable_eth': { name: 'Прокладка Ethernet (BMS сеть)', unit: 'м.п.', price: 60, category: 'bms' },
        'wrk_bms_gateway': { name: 'Монтаж шлюза BACnet/Modbus', unit: 'шт', price: 25000, category: 'bms' },
        // === УМНЫЙ ДОМ ===
        'wrk_bms_smarthome_hub': { name: 'Монтаж контроллера умного дома', unit: 'шт', price: 25000, category: 'bms' },
        'wrk_bms_smarthome_switch': { name: 'Монтаж умного выключателя', unit: 'шт', price: 3500, category: 'bms' },
        'wrk_bms_smarthome_dimmer': { name: 'Монтаж умного диммера', unit: 'шт', price: 5500, category: 'bms' },
        'wrk_bms_smarthome_thermostat': { name: 'Монтаж умного термостата', unit: 'шт', price: 8500, category: 'bms' },
        'wrk_bms_smarthome_curtain': { name: 'Монтаж привода шторы', unit: 'шт', price: 8500, category: 'bms' },
        'wrk_bms_smarthome_knx_bus': { name: 'Прокладка шины KNX', unit: 'м.п.', price: 100, category: 'bms' },
        'wrk_bms_smarthome_knx_actuator': { name: 'Монтаж KNX актуатора', unit: 'шт', price: 12000, category: 'bms' },
        // === ПНР ===
        'wrk_bms_commissioning': { name: 'Пусконаладка BMS (за точку)', unit: 'точка', price: 2500, category: 'bms' },
        'wrk_bms_programming': { name: 'Программирование контроллера BMS', unit: 'час', price: 5500, category: 'bms' },
        'wrk_bms_training': { name: 'Обучение персонала BMS', unit: 'день', price: 25000, category: 'bms' }
    };
})();
