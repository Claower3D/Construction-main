// === ЗАБОРЫ И ОГРАЖДЕНИЯ ПОЛНЫЕ — профлист, сетка, штакетник, кованые, габионы (50 поз.) ===
(function () {
    window.AI_WRK_FENCES = {
        // === ПРОФНАСТИЛ === 1-8
        'wrk_fnc_prof_c8_15': { name: 'Забор из профнастила С8 h=1.5м', unit: 'м.п.', price: 1500, category: 'fences' },
        'wrk_fnc_prof_c8_18': { name: 'Забор из профнастила С8 h=1.8м', unit: 'м.п.', price: 1800, category: 'fences' },
        'wrk_fnc_prof_c8_20': { name: 'Забор из профнастила С8 h=2.0м', unit: 'м.п.', price: 2000, category: 'fences' },
        'wrk_fnc_prof_c20_20': { name: 'Забор из профнастила С20 h=2.0м', unit: 'м.п.', price: 2500, category: 'fences' },
        'wrk_fnc_prof_c21_25': { name: 'Забор из профнастила С21 h=2.5м', unit: 'м.п.', price: 3500, category: 'fences' },
        'wrk_fnc_prof_pillar_round': { name: 'Столб круглый Ø57 h=2.5м', unit: 'шт', price: 850, category: 'fences' },
        'wrk_fnc_prof_pillar_square': { name: 'Столб профильный 60×60 h=2.5м', unit: 'шт', price: 1200, category: 'fences' },
        'wrk_fnc_prof_lag': { name: 'Лага (профтруба 40×20)', unit: 'м.п.', price: 250, category: 'fences' },
        // === СЕТКА === 9-14
        'wrk_fnc_mesh_chain_15': { name: 'Забор из сетки-рабицы h=1.5м', unit: 'м.п.', price: 550, category: 'fences' },
        'wrk_fnc_mesh_chain_18': { name: 'Забор из сетки-рабицы h=1.8м', unit: 'м.п.', price: 650, category: 'fences' },
        'wrk_fnc_mesh_3d_15': { name: 'Забор из 3D сетки h=1.5м', unit: 'м.п.', price: 1200, category: 'fences' },
        'wrk_fnc_mesh_3d_20': { name: 'Забор из 3D сетки h=2.0м', unit: 'м.п.', price: 1500, category: 'fences' },
        'wrk_fnc_mesh_3d_25': { name: 'Забор из 3D сетки h=2.5м', unit: 'м.п.', price: 1800, category: 'fences' },
        'wrk_fnc_mesh_gitter_20': { name: 'Забор из сварной сетки h=2.0м', unit: 'м.п.', price: 1500, category: 'fences' },
        // === ШТАКЕТНИК === 15-19
        'wrk_fnc_picket_wood_15': { name: 'Штакетник деревянный h=1.5м', unit: 'м.п.', price: 1200, category: 'fences' },
        'wrk_fnc_picket_metal_15': { name: 'Евроштакетник металл h=1.5м', unit: 'м.п.', price: 1500, category: 'fences' },
        'wrk_fnc_picket_metal_18': { name: 'Евроштакетник металл h=1.8м', unit: 'м.п.', price: 1800, category: 'fences' },
        'wrk_fnc_picket_metal_20': { name: 'Евроштакетник металл h=2.0м', unit: 'м.п.', price: 2200, category: 'fences' },
        'wrk_fnc_picket_2side': { name: 'Штакетник двусторонний (шахматка)', unit: 'м.п.', price: 2500, category: 'fences' },
        // === КИРПИЧНЫЕ / КАМЕННЫЕ === 20-25
        'wrk_fnc_brick_pillar': { name: 'Кирпичный столб 380×380', unit: 'шт', price: 12000, category: 'fences' },
        'wrk_fnc_brick_wall': { name: 'Забор кирпичный (сплошной)', unit: 'м.п.', price: 12000, category: 'fences' },
        'wrk_fnc_stone_pillar': { name: 'Столб из натурального камня', unit: 'шт', price: 18000, category: 'fences' },
        'wrk_fnc_stone_wall': { name: 'Забор из натурального камня', unit: 'м.п.', price: 15000, category: 'fences' },
        'wrk_fnc_cap_pillar': { name: 'Колпак на столб (бетон)', unit: 'шт', price: 550, category: 'fences' },
        // === КОВАНЫЕ / СВАРНЫЕ === 26-31
        'wrk_fnc_forge_simple': { name: 'Кованый забор (простой)', unit: 'м.п.', price: 5500, category: 'fences' },
        'wrk_fnc_forge_complex': { name: 'Кованый забор (сложный)', unit: 'м.п.', price: 12000, category: 'fences' },
        'wrk_fnc_weld_section': { name: 'Сварная секция (из прутка)', unit: 'м.п.', price: 3500, category: 'fences' },
        'wrk_fnc_weld_panel': { name: 'Панельный забор (серия)', unit: 'м.п.', price: 2500, category: 'fences' },
        'wrk_fnc_forge_insert': { name: 'Кованые вставки в забор', unit: 'элемент', price: 2500, category: 'fences' },
        'wrk_fnc_paint': { name: 'Покраска металлического забора', unit: 'м²', price: 350, category: 'fences' },
        // === ГАБИОНЫ === 32-35
        'wrk_fnc_gabion_100': { name: 'Габионный забор (h=1.0м)', unit: 'м.п.', price: 5500, category: 'fences' },
        'wrk_fnc_gabion_150': { name: 'Габионный забор (h=1.5м)', unit: 'м.п.', price: 8500, category: 'fences' },
        'wrk_fnc_gabion_200': { name: 'Габионный забор (h=2.0м)', unit: 'м.п.', price: 12000, category: 'fences' },
        'wrk_fnc_gabion_combo': { name: 'Габион + дерево/металл (комбинир.)', unit: 'м.п.', price: 8500, category: 'fences' },
        // === ВОРОТА / КАЛИТКИ === 36-44
        'wrk_fnc_gate_auto_swing': { name: 'Автоматика распашных ворот', unit: 'компл.', price: 25000, category: 'fences' },
        'wrk_fnc_gate_auto_slide': { name: 'Автоматика откатных ворот', unit: 'компл.', price: 25000, category: 'fences' },
        'wrk_fnc_wicket_prof': { name: 'Калитка из профнастила', unit: 'шт', price: 5500, category: 'fences' },
        'wrk_fnc_wicket_forge': { name: 'Калитка кованая', unit: 'шт', price: 12000, category: 'fences' },
        'wrk_fnc_wicket_auto': { name: 'Электрозамок калитки', unit: 'шт', price: 5500, category: 'fences' },
        // === ДОПЫ === 45-50
        'wrk_fnc_demolish_old': { name: 'Демонтаж старого забора', unit: 'м.п.', price: 350, category: 'fences' },
        'wrk_fnc_level_ground': { name: 'Планировка грунта вдоль забора', unit: 'м.п.', price: 150, category: 'fences' },
        'wrk_fnc_drainage': { name: 'Водоотвод вдоль забора', unit: 'м.п.', price: 550, category: 'fences' },
        'wrk_fnc_lighting_post': { name: 'Освещение забора (столбик)', unit: 'шт', price: 2500, category: 'fences' },
        'wrk_fnc_mailbox': { name: 'Установка почтового ящика', unit: 'шт', price: 1200, category: 'fences' },
        'wrk_fnc_house_number': { name: 'Установка номера дома (адресная табличка)', unit: 'шт', price: 850, category: 'fences' }
    };
})();
