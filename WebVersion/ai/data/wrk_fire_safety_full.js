// === ФАЗА 3: ПОЖАРНАЯ БЕЗОПАСНОСТЬ — АУПТ, ДЫМОУДАЛЕНИЕ, СИГНАЛИЗАЦИЯ ДЕТАЛЬНО (130 поз.) ===
(function () {
    window.AI_WRK_FIRE_SAFETY_FULL = {
        // === ПОЖАРНАЯ СИГНАЛИЗАЦИЯ (детально) ===
        'wrk_fs_panel_1': { name: 'ППКП 1 шлейф', unit: 'шт', price: 1000, category: 'fire_safety_full' },
        'wrk_fs_panel_2': { name: 'ППКП 2 шлейфа', unit: 'шт', price: 1500, category: 'fire_safety_full' },
        'wrk_fs_panel_4': { name: 'ППКП 4 шлейфа', unit: 'шт', price: 2500, category: 'fire_safety_full' },
        'wrk_fs_panel_8': { name: 'ППКП 8 шлейфов', unit: 'шт', price: 4000, category: 'fire_safety_full' },
        'wrk_fs_panel_16': { name: 'ППКП 16 шлейфов', unit: 'шт', price: 6000, category: 'fire_safety_full' },
        'wrk_fs_panel_addr': { name: 'ППКП адресный (до 127 Устр.)', unit: 'шт', price: 10000, category: 'fire_safety_full' },
        'wrk_fs_panel_addr_ext': { name: 'ППКП адресный расширенный', unit: 'шт', price: 20000, category: 'fire_safety_full' },
        'wrk_fs_detect_smoke': { name: 'Дымовой извещатель (порог.)', unit: 'шт', price: 30, category: 'fire_safety_full' },
        'wrk_fs_detect_smoke_addr': { name: 'Дымовой извещатель (адресный)', unit: 'шт', price: 100, category: 'fire_safety_full' },
        'wrk_fs_detect_heat': { name: 'Тепловой извещатель (порог.)', unit: 'шт', price: 20, category: 'fire_safety_full' },
        'wrk_fs_detect_heat_addr': { name: 'Тепловой извещатель (адресный)', unit: 'шт', price: 80, category: 'fire_safety_full' },
        'wrk_fs_detect_combo': { name: 'Комбинированный извещатель', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_detect_flame': { name: 'Извещатель пламени', unit: 'шт', price: 500, category: 'fire_safety_full' },
        'wrk_fs_detect_linear': { name: 'Линейный дымовой извещатель', unit: 'комплект', price: 3000, category: 'fire_safety_full' },
        'wrk_fs_detect_aspir': { name: 'Аспирационный извещатель', unit: 'шт', price: 5000, category: 'fire_safety_full' },
        'wrk_fs_detect_gas_co': { name: 'Газовый извещатель (CO)', unit: 'шт', price: 200, category: 'fire_safety_full' },
        'wrk_fs_manual_red': { name: 'Ручной извещатель (кнопка)', unit: 'шт', price: 30, category: 'fire_safety_full' },
        'wrk_fs_manual_addr': { name: 'Ручной извещатель (адресный)', unit: 'шт', price: 80, category: 'fire_safety_full' },
        'wrk_fs_siren_light': { name: 'Оповещатель светозвуковой', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_siren_voice': { name: 'Оповещатель речевой', unit: 'шт', price: 200, category: 'fire_safety_full' },
        'wrk_fs_siren_horn': { name: 'Оповещатель звуковой (рупор)', unit: 'шт', price: 100, category: 'fire_safety_full' },
        'wrk_fs_indicator_exit': { name: 'Табло «ВЫХОД»', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_indicator_arrow': { name: 'Напр. указатель движения', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_cable_kpsvv': { name: 'Кабель КПСВВ 2×2×0.5', unit: 'м.п.', price: 5, category: 'fire_safety_full' },
        'wrk_fs_cable_kpsvev': { name: 'Кабель КПСВЭВнг 2×2×0.75', unit: 'м.п.', price: 8, category: 'fire_safety_full' },
        'wrk_fs_cable_frls': { name: 'Кабель FRLS огнестойкий', unit: 'м.п.', price: 10, category: 'fire_safety_full' },

        // === СОУЭ (оповещение и управл. эвакуацией) ===
        'wrk_fs_soue_1': { name: 'СОУЭ 1-2 типа', unit: 'объект', price: 5000, category: 'fire_safety_full' },
        'wrk_fs_soue_3': { name: 'СОУЭ 3 типа (речевое)', unit: 'объект', price: 15000, category: 'fire_safety_full' },
        'wrk_fs_soue_4': { name: 'СОУЭ 4 типа (зонное)', unit: 'объект', price: 30000, category: 'fire_safety_full' },
        'wrk_fs_soue_5': { name: 'СОУЭ 5 типа (полное)', unit: 'объект', price: 50000, category: 'fire_safety_full' },

        // === АУПТ (автоматическое пожаротушение) ===
        // Спринклерное
        'wrk_fs_sprinkler_57': { name: 'Спринклер 57°C', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_68': { name: 'Спринклер 68°C', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_79': { name: 'Спринклер 79°C', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_hidden': { name: 'Спринклер скрытый (потолочный)', unit: 'шт', price: 100, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_side': { name: 'Спринклер боковой', unit: 'шт', price: 100, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_pipe_25': { name: 'Труба спринклерная Ø25мм', unit: 'м.п.', price: 30, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_pipe_32': { name: 'Труба спринклерная Ø32мм', unit: 'м.п.', price: 40, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_pipe_50': { name: 'Труба спринклерная Ø50мм', unit: 'м.п.', price: 60, category: 'fire_safety_full' },
        'wrk_fs_sprinkler_pipe_80': { name: 'Труба спринклерная Ø80мм', unit: 'м.п.', price: 100, category: 'fire_safety_full' },
        'wrk_fs_alarm_valve': { name: 'Узел управления спринкл.', unit: 'шт', price: 5000, category: 'fire_safety_full' },
        // Дренчерное
        'wrk_fs_drench_head': { name: 'Дренчер', unit: 'шт', price: 50, category: 'fire_safety_full' },
        'wrk_fs_drench_valve': { name: 'Узел управления дренчерный', unit: 'шт', price: 8000, category: 'fire_safety_full' },
        // Газовое
        'wrk_fs_gas_fm200': { name: 'Газовое ПТ FM-200 (модуль)', unit: 'шт', price: 20000, category: 'fire_safety_full' },
        'wrk_fs_gas_novec': { name: 'Газовое ПТ Novec 1230', unit: 'шт', price: 25000, category: 'fire_safety_full' },
        'wrk_fs_gas_co2': { name: 'Газовое ПТ CO₂', unit: 'шт', price: 15000, category: 'fire_safety_full' },
        'wrk_fs_gas_inert': { name: 'Газовое ПТ инертный газ (IG)', unit: 'шт', price: 18000, category: 'fire_safety_full' },
        'wrk_fs_gas_nozzle': { name: 'Насадок газового ПТ', unit: 'шт', price: 500, category: 'fire_safety_full' },
        'wrk_fs_gas_pipe': { name: 'Трубопровод газового ПТ', unit: 'м.п.', price: 100, category: 'fire_safety_full' },
        // Порошковое
        'wrk_fs_powder_module_2': { name: 'Модуль порошковый 2кг', unit: 'шт', price: 500, category: 'fire_safety_full' },
        'wrk_fs_powder_module_6': { name: 'Модуль порошковый 6кг', unit: 'шт', price: 1000, category: 'fire_safety_full' },
        'wrk_fs_powder_module_12': { name: 'Модуль порошковый 12кг', unit: 'шт', price: 1500, category: 'fire_safety_full' },
        // Аэрозольное
        'wrk_fs_aerosol_5': { name: 'Аэрозольный генератор 5м³', unit: 'шт', price: 500, category: 'fire_safety_full' },
        'wrk_fs_aerosol_20': { name: 'Аэрозольный генератор 20м³', unit: 'шт', price: 1000, category: 'fire_safety_full' },
        'wrk_fs_aerosol_50': { name: 'Аэрозольный генератор 50м³', unit: 'шт', price: 2000, category: 'fire_safety_full' },
        // Тонкораспылённая вода
        'wrk_fs_mist_nozzle': { name: 'Насадок тонкораспылённой воды', unit: 'шт', price: 200, category: 'fire_safety_full' },
        'wrk_fs_mist_pump': { name: 'Насосная станция ТРВ', unit: 'шт', price: 30000, category: 'fire_safety_full' },

        // === ДЫМОУДАЛЕНИЕ ===
        'wrk_fs_smoke_fan_axial': { name: 'Вентилятор дымоудаления (осевой)', unit: 'шт', price: 10000, category: 'fire_safety_full' },
        'wrk_fs_smoke_fan_radial': { name: 'Вентилятор дымоудаления (радиальный)', unit: 'шт', price: 15000, category: 'fire_safety_full' },
        'wrk_fs_smoke_fan_roof': { name: 'Крышный вентилятор дымоудаления', unit: 'шт', price: 12000, category: 'fire_safety_full' },
        'wrk_fs_smoke_duct': { name: 'Воздуховод дымоудаления (огнест.)', unit: 'м²', price: 200, category: 'fire_safety_full' },
        'wrk_fs_smoke_damper_norm_open': { name: 'Клапан дымоудаления (НО)', unit: 'шт', price: 3000, category: 'fire_safety_full' },
        'wrk_fs_smoke_damper_norm_close': { name: 'Противопожарный клапан (НЗ)', unit: 'шт', price: 2000, category: 'fire_safety_full' },
        'wrk_fs_smoke_hatch': { name: 'Люк дымоудаления (кровля)', unit: 'шт', price: 5000, category: 'fire_safety_full' },
        'wrk_fs_smoke_curtain': { name: 'Противодымная штора', unit: 'м²', price: 500, category: 'fire_safety_full' },
        'wrk_fs_makeup_duct': { name: 'Воздуховод подпора', unit: 'м²', price: 150, category: 'fire_safety_full' },

        // === ОГНЕЗАЩИТА ===
        'wrk_fs_protect_cable_coat': { name: 'Огнезащита кабелей (покрытие)', unit: 'м.п.', price: 10, category: 'fire_safety_full' },
        'wrk_fs_protect_cable_box': { name: 'Огнезащита кабелей (короб)', unit: 'м.п.', price: 30, category: 'fire_safety_full' },
        'wrk_fs_protect_beam': { name: 'Огнезащита ж/б конструкций', unit: 'м²', price: 50, category: 'fire_safety_full' },
        'wrk_fs_seal_pipe': { name: 'Противопожарная манжета', unit: 'шт', price: 100, category: 'fire_safety_full' },
        'wrk_fs_seal_wall': { name: 'Огнестойкая проходка (стена)', unit: 'шт', price: 200, category: 'fire_safety_full' },
        'wrk_fs_seal_floor': { name: 'Огнестойкая проходка (перекрытие)', unit: 'шт', price: 300, category: 'fire_safety_full' },
        'wrk_fs_door_ei30': { name: 'Противопожарная дверь EI30', unit: 'шт', price: 3000, category: 'fire_safety_full' },
        'wrk_fs_door_ei90': { name: 'Противопожарная дверь EI90', unit: 'шт', price: 8000, category: 'fire_safety_full' }
    };
})();
