// === КАТАЛОГ ПОЖАРНОЙ БЕЗОПАСНОСТИ (40 позиций) ===
(function () {
    window.AI_MAT_FIRESAFETY_CATALOG = {
        // Огнетушители
        'extinguisher_op_4': { name: 'Огнетушитель порошковый ОП-4', unit: 'шт', price: 500, category: 'firesafety' },
        'extinguisher_op_8': { name: 'Огнетушитель порошковый ОП-8', unit: 'шт', price: 800, category: 'firesafety' },
        'extinguisher_ou_3': { name: 'Огнетушитель углекисл. ОУ-3', unit: 'шт', price: 1500, category: 'firesafety' },
        'extinguisher_ou_5': { name: 'Огнетушитель углекисл. ОУ-5', unit: 'шт', price: 2000, category: 'firesafety' },
        // Пожарные шкафы / щиты
        'fire_cabinet_310': { name: 'Шкаф пожарный ШП-310', unit: 'шт', price: 3000, category: 'firesafety' },
        'fire_shield_open': { name: 'Щит пожарный открытый (комплект)', unit: 'компл.', price: 5000, category: 'firesafety' },
        'fire_hose_reel_20m': { name: 'Кран-комплект пожарный с рукавом 20м', unit: 'компл.', price: 5000, category: 'firesafety' },
        // Пожарная сигнализация
        'smoke_detector_opt': { name: 'Извещатель дымовой оптический', unit: 'шт', price: 200, category: 'firesafety' },
        'heat_detector': { name: 'Извещатель тепловой', unit: 'шт', price: 150, category: 'firesafety' },
        'smoke_detector_combined': { name: 'Извещатель комбинированный (дым+тепло)', unit: 'шт', price: 400, category: 'firesafety' },
        'fire_alarm_panel_4z': { name: 'Прибор ОПС 4 зоны', unit: 'шт', price: 3000, category: 'firesafety' },
        'fire_alarm_panel_8z': { name: 'Прибор ОПС 8 зон', unit: 'шт', price: 5000, category: 'firesafety' },
        'fire_alarm_panel_addr': { name: 'Прибор ОПС адресный', unit: 'шт', price: 10000, category: 'firesafety' },
        'manual_call_point': { name: 'Извещатель пожарный ручной (ИПР)', unit: 'шт', price: 200, category: 'firesafety' },
        'fire_siren_indoor': { name: 'Оповещатель звуковой внутренний', unit: 'шт', price: 300, category: 'firesafety' },
        'fire_siren_outdoor': { name: 'Оповещатель звуковой наружный', unit: 'шт', price: 500, category: 'firesafety' },
        'fire_strobe_light': { name: 'Оповещатель световой «Выход»', unit: 'шт', price: 300, category: 'firesafety' },
        // Кабель огнестойкий
        'cable_fire_1x2x0_8': { name: 'Кабель огнестойкий КПСнг 1×2×0.8мм²', unit: 'м.п.', price: 15, category: 'firesafety' },
        'cable_fire_2x2x0_8': { name: 'Кабель огнестойкий КПСнг 2×2×0.8мм²', unit: 'м.п.', price: 25, category: 'firesafety' },
        // Огнезащитные составы
        'firecoat_intumescent_25kg': { name: 'Краска огнезащитная вспучив. (25кг)', unit: 'ведро', price: 5000, category: 'firesafety' },
        'firecoat_wood_10l': { name: 'Пропитка огнезащитная дерево (10л)', unit: 'канистра', price: 1000, category: 'firesafety' },
        'firecoat_steel_25kg': { name: 'Состав огнезащитный для металла (25кг)', unit: 'ведро', price: 5000, category: 'firesafety' },
        // Противопожарная муфта / манжета
        'firestop_collar_50': { name: 'Противопожарная муфта Ø50мм', unit: 'шт', price: 500, category: 'firesafety' },
        'firestop_collar_110': { name: 'Противопожарная муфта Ø110мм', unit: 'шт', price: 800, category: 'firesafety' },
        'firestop_sealant_310ml': { name: 'Герметик огнезащитный (310мл)', unit: 'шт', price: 300, category: 'firesafety' },
        'firestop_foam_750ml': { name: 'Пена монтажная огнестойкая (750мл)', unit: 'шт', price: 400, category: 'firesafety' },
        'firestop_board_1200x600': { name: 'Плита огнезащитная 1200×600мм', unit: 'шт', price: 1000, category: 'firesafety' },
        'firestop_putty_1kg': { name: 'Мастика огнезащитная (1кг)', unit: 'шт', price: 300, category: 'firesafety' },
        // Пожарная лестница / верёвка
        'fire_escape_ladder_5m': { name: 'Лестница спасательная 5м', unit: 'шт', price: 2000, category: 'firesafety' },
        'fire_rope_15m': { name: 'Канат спасательный 15м', unit: 'шт', price: 1500, category: 'firesafety' },
        // Аварийное освещение
        'emergency_exit_led_ip65': { name: 'Табло «Выход» LED IP65', unit: 'шт', price: 500, category: 'firesafety' },
        'emergency_light_3h': { name: 'Светильник аварийный 3 часа', unit: 'шт', price: 800, category: 'firesafety' },
        // Двери / клапаны
        'fire_damper_200x200': { name: 'Клапан противопожарный 200×200мм', unit: 'шт', price: 3000, category: 'firesafety' },
        'fire_damper_300x300': { name: 'Клапан противопожарный 300×300мм', unit: 'шт', price: 4000, category: 'firesafety' },
        // Автономные извещатели
        'smoke_detector_standalone': { name: 'Извещатель дымовой автономный', unit: 'шт', price: 300, category: 'firesafety' },
        'smoke_detector_standalone_10y': { name: 'Извещатель дымовой автон. (батарея 10 лет)', unit: 'шт', price: 500, category: 'firesafety' },
        // Знаки пожарной безопасности
        'fire_sign_exit_photo': { name: 'Знак «Выход» фотолюминесцентный', unit: 'шт', price: 100, category: 'firesafety' },
        'fire_sign_extinguisher': { name: 'Знак «Огнетушитель»', unit: 'шт', price: 50, category: 'firesafety' },
        'fire_sign_plan': { name: 'План эвакуации фотолюм.', unit: 'шт', price: 500, category: 'firesafety' }
    };
})();
