// === ПОЖАРНАЯ БЕЗОПАСНОСТЬ (30), СЛАБОТОЧНЫЕ (35), ГАЗ (20) ===
// Объединены в один файл для компактности, но регистрируются отдельно

// --- Пожарная безопасность ---
(function () {
    window.AI_MAT_FIRE = {
        'fire_detector_smoke': { name: 'Извещатель дымовой (ИП 212)', unit: 'шт', price: 800, category: 'fire' },
        'fire_detector_heat': { name: 'Извещатель тепловой (ИП 101)', unit: 'шт', price: 500, category: 'fire' },
        'fire_detector_combined': { name: 'Извещатель комбинированный (дым+тепло)', unit: 'шт', price: 1200, category: 'fire' },
        'fire_panel_4zone': { name: 'Панель пожарная 4 зоны', unit: 'шт', price: 8000, category: 'fire' },
        'fire_panel_8zone': { name: 'Панель пожарная 8 зон', unit: 'шт', price: 15000, category: 'fire' },
        'fire_siren_indoor': { name: 'Оповещатель свето-звуковой внутр.', unit: 'шт', price: 1500, category: 'fire' },
        'fire_siren_outdoor': { name: 'Оповещатель свето-звуковой наруж.', unit: 'шт', price: 2500, category: 'fire' },
        'fire_cable_1x2x0_8': { name: 'Кабель пожарный КПСнг 1×2×0.8', unit: 'м', price: 30, category: 'fire' },
        'fire_cable_2x2x0_8': { name: 'Кабель пожарный КПСнг 2×2×0.8', unit: 'м', price: 55, category: 'fire' },
        'fire_door_ei30_900': { name: 'Дверь противопожарная EI-30 (900мм)', unit: 'шт', price: 18000, category: 'fire' },
        'fire_door_ei60_900': { name: 'Дверь противопожарная EI-60 (900мм)', unit: 'шт', price: 25000, category: 'fire' },
        'fire_door_ei60_double': { name: 'Дверь противопожарная EI-60 двупольная', unit: 'шт', price: 40000, category: 'fire' },
        'fire_protection_wood_10l': { name: 'Огнезащита для дерева (10л)', unit: 'шт', price: 5000, category: 'fire' },
        'fire_protection_metal_20l': { name: 'Краска огнезащитная для металла (20кг)', unit: 'ведро', price: 12000, category: 'fire' },
        'fire_protection_cable': { name: 'Обмазка огнезащитная кабельная (25кг)', unit: 'ведро', price: 8000, category: 'fire' },
        'fire_extinguisher_op5': { name: 'Огнетушитель ОП-5', unit: 'шт', price: 3500, category: 'fire' },
        'fire_extinguisher_ou5': { name: 'Огнетушитель ОУ-5 (углекисл.)', unit: 'шт', price: 6000, category: 'fire' },
        'fire_hose_box': { name: 'Шкаф пожарный (ПК)', unit: 'шт', price: 8000, category: 'fire' },
        'fire_exit_sign': { name: 'Табло «Выход» (светодиодное)', unit: 'шт', price: 1200, category: 'fire' },
        'fire_smoke_hatch_600': { name: 'Люк дымоудаления 600×600мм', unit: 'шт', price: 15000, category: 'fire' },
        'fire_foam_pillow': { name: 'Подушка противопожарная (проход кабелей)', unit: 'шт', price: 300, category: 'fire' },
        'fire_sealant_310': { name: 'Герметик огнестойкий (310мл)', unit: 'шт', price: 600, category: 'fire' },
        'fire_mortar_25': { name: 'Раствор огнезащитный (25кг)', unit: 'мешок', price: 3000, category: 'fire' },
        'fire_wrap_50': { name: 'Муфта противопожарная Ø50мм', unit: 'шт', price: 1200, category: 'fire' },
        'fire_wrap_110': { name: 'Муфта противопожарная Ø110мм', unit: 'шт', price: 2500, category: 'fire' },
        'fire_sprinkler_57': { name: 'Спринклер водяной (57°С)', unit: 'шт', price: 250, category: 'fire' },
        'fire_sprinkler_68': { name: 'Спринклер водяной (68°С)', unit: 'шт', price: 250, category: 'fire' },
        'fire_pipe_dn25': { name: 'Труба ВГП оцинк. ДУ25 (для пожаротушения)', unit: 'п.м.', price: 200, category: 'fire' },
        'fire_pipe_dn50': { name: 'Труба ВГП оцинк. ДУ50 (для пожаротушения)', unit: 'п.м.', price: 450, category: 'fire' },
        'fire_button_manual': { name: 'Кнопка пожарной сигнализации (ручной извещатель)', unit: 'шт', price: 600, category: 'fire' }
    };
})();
