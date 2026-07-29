// === КАТАЛОГ РАБОТ: ЛЕСТНИЦЫ, ПЕРИЛА, ОГРАЖДЕНИЯ (Фаза 1-3: 80 поз.) ===
(function () {
    window.AI_WRK_STAIRS = {
        // Лестницы бетонные
        'wrk_stair_conc_straight': { name: 'Бетонная лестница прямая', unit: 'ступень', price: 3000, category: 'stairs' },
        'wrk_stair_conc_l_turn': { name: 'Бетонная лестница Г-образная', unit: 'ступень', price: 3500, category: 'stairs' },
        'wrk_stair_conc_u_turn': { name: 'Бетонная лестница П-образная', unit: 'ступень', price: 4000, category: 'stairs' },
        'wrk_stair_conc_spiral': { name: 'Бетонная лестница винтовая', unit: 'ступень', price: 5000, category: 'stairs' },
        'wrk_stair_conc_pour': { name: 'Бетонирование лестницы', unit: 'м³', price: 2000, category: 'stairs' },
        // Лестницы металлические
        'wrk_stair_metal_straight': { name: 'Металл. лестница прямая', unit: 'ступень', price: 2500, category: 'stairs' },
        'wrk_stair_metal_l_turn': { name: 'Металл. лестница Г-образная', unit: 'ступень', price: 3000, category: 'stairs' },
        'wrk_stair_metal_u_turn': { name: 'Металл. лестница П-образная', unit: 'ступень', price: 3500, category: 'stairs' },
        'wrk_stair_metal_spiral': { name: 'Металл. лестница винтовая', unit: 'ступень', price: 4000, category: 'stairs' },
        'wrk_stair_metal_weld': { name: 'Сварочные работы (лестница)', unit: 'м.п.', price: 150, category: 'stairs' },
        // Лестницы деревянные
        'wrk_stair_wood_straight': { name: 'Дерев. лестница прямая', unit: 'ступень', price: 2000, category: 'stairs' },
        'wrk_stair_wood_l_turn': { name: 'Дерев. лестница Г-образная', unit: 'ступень', price: 2500, category: 'stairs' },
        'wrk_stair_wood_u_turn': { name: 'Дерев. лестница П-образная', unit: 'ступень', price: 3000, category: 'stairs' },
        'wrk_stair_wood_spiral': { name: 'Дерев. лестница винтовая', unit: 'ступень', price: 3500, category: 'stairs' },
        'wrk_stair_wood_attic': { name: 'Чердачная складная лестница', unit: 'шт', price: 5000, category: 'stairs' },
        // Облицовка ступеней
        'wrk_stair_clad_wood_oak': { name: 'Облицовка ступеней дубом', unit: 'ступень', price: 2000, category: 'stairs' },
        'wrk_stair_clad_wood_ash': { name: 'Облицовка ступеней ясенем', unit: 'ступень', price: 1800, category: 'stairs' },
        'wrk_stair_clad_wood_larch': { name: 'Облицовка ступеней лиственницей', unit: 'ступень', price: 1500, category: 'stairs' },
        'wrk_stair_clad_tile': { name: 'Облицовка ступеней плиткой', unit: 'ступень', price: 800, category: 'stairs' },
        'wrk_stair_clad_marble': { name: 'Облицовка ступеней мрамором', unit: 'ступень', price: 3500, category: 'stairs' },
        'wrk_stair_clad_keramo': { name: 'Облицовка ступеней керамогранитом', unit: 'ступень', price: 1000, category: 'stairs' },
        // Перила / ограждения
        'wrk_stair_rail_combined': { name: 'Перила комбинированные (дерево+металл)', unit: 'м.п.', price: 2500, category: 'stairs' },
        'wrk_stair_baluster_wood': { name: 'Балясины деревянные (монтаж)', unit: 'шт', price: 200, category: 'stairs' },
        'wrk_stair_baluster_metal': { name: 'Балясины металлические (монтаж)', unit: 'шт', price: 300, category: 'stairs' },
        'wrk_stair_handrail_wall': { name: 'Пристенный поручень', unit: 'м.п.', price: 400, category: 'stairs' },
        // Крыльцо
        'wrk_stair_porch_conc': { name: 'Крыльцо бетонное', unit: 'ступень', price: 1500, category: 'stairs' },
        'wrk_stair_porch_metal': { name: 'Крыльцо металлическое', unit: 'ступень', price: 1200, category: 'stairs' },
        'wrk_stair_porch_clad': { name: 'Облицовка крыльца', unit: 'м²', price: 800, category: 'stairs' },
        'wrk_stair_porch_canopy': { name: 'Козырёк над крыльцом', unit: 'м²', price: 2000, category: 'stairs' },
        // Пандусы
        'wrk_stair_ramp_conc': { name: 'Пандус бетонный', unit: 'м²', price: 2000, category: 'stairs' },
        'wrk_stair_ramp_metal': { name: 'Пандус металлический', unit: 'м.п.', price: 3000, category: 'stairs' },
        // Демонтаж
    };
})();
