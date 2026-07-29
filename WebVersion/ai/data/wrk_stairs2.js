// === ЛЕСТНИЦЫ ПОЛНЫЕ — ж/б, металл, дерево, стекло, ограждения (50 поз.) ===
(function () {
    window.AI_WRK_STAIRS2 = {
        // === Ж/Б === 1-8
        'wrk_strs2_rc_straight': { name: 'Монтаж ж/б марша (прямой)', unit: 'шт', price: 25000, category: 'stairs2' },
        'wrk_strs2_rc_turn_90': { name: 'Монтаж ж/б марша (поворот 90°)', unit: 'шт', price: 35000, category: 'stairs2' },
        'wrk_strs2_rc_turn_180': { name: 'Монтаж ж/б марша (поворот 180°)', unit: 'шт', price: 35000, category: 'stairs2' },
        'wrk_strs2_rc_landing': { name: 'Ж/б площадка', unit: 'шт', price: 15000, category: 'stairs2' },
        'wrk_strs2_rc_mono': { name: 'Монолитная лестница (прямая)', unit: 'м.п.', price: 25000, category: 'stairs2' },
        'wrk_strs2_rc_mono_spiral': { name: 'Монолитная лестница (винтовая)', unit: 'м.п.', price: 55000, category: 'stairs2' },
        'wrk_strs2_rc_tile': { name: 'Облицовка керамогранитом', unit: 'м.п.', price: 3500, category: 'stairs2' },
        // === МЕТАЛЛ === 9-16
        'wrk_strs2_steel_straight': { name: 'Стальная лестница (прямая)', unit: 'марш', price: 55000, category: 'stairs2' },
        'wrk_strs2_steel_turn': { name: 'Стальная лестница (с поворотом)', unit: 'марш', price: 85000, category: 'stairs2' },
        'wrk_strs2_steel_spiral': { name: 'Стальная лестница (винтовая)', unit: 'шт', price: 120000, category: 'stairs2' },
        'wrk_strs2_steel_cosour': { name: 'Лестница на косоурах', unit: 'марш', price: 85000, category: 'stairs2' },
        'wrk_strs2_steel_service': { name: 'Служебная стальная лестница', unit: 'м.п.', price: 12000, category: 'stairs2' },
        // === ДЕРЕВО === 17-24
        'wrk_strs2_wood_turn_90': { name: 'Деревянная (поворот 90°)', unit: 'марш', price: 120000, category: 'stairs2' },
        'wrk_strs2_wood_turn_180': { name: 'Деревянная (поворот 180°)', unit: 'марш', price: 150000, category: 'stairs2' },
        'wrk_strs2_wood_spiral': { name: 'Деревянная (винтовая)', unit: 'шт', price: 250000, category: 'stairs2' },
        'wrk_strs2_wood_clad': { name: 'Облицовка ступеней деревом', unit: 'ступень', price: 5500, category: 'stairs2' },
        'wrk_strs2_wood_stain': { name: 'Покраска/лак лестницы', unit: 'марш', price: 12000, category: 'stairs2' },
        'wrk_strs2_wood_attic': { name: 'Чердачная лестница (складная)', unit: 'шт', price: 8500, category: 'stairs2' },
        'wrk_strs2_glass_step': { name: 'Стеклянная ступень (триплекс)', unit: 'шт', price: 15000, category: 'stairs2' },
        // === ОГРАЖДЕНИЯ === 25-36
        'wrk_strs2_rail_steel': { name: 'Ограждение стальное', unit: 'м.п.', price: 3500, category: 'stairs2' },
        'wrk_strs2_rail_forged': { name: 'Ограждение кованое', unit: 'м.п.', price: 8500, category: 'stairs2' },
        'wrk_strs2_rail_wood': { name: 'Ограждение деревянное', unit: 'м.п.', price: 5500, category: 'stairs2' },
        'wrk_strs2_rail_glass_post': { name: 'Стеклянное на стойках', unit: 'м.п.', price: 8500, category: 'stairs2' },
        'wrk_strs2_rail_glass_mini': { name: 'Стеклянное на мини-стойках', unit: 'м.п.', price: 12000, category: 'stairs2' },
        'wrk_strs2_rail_glass_chan': { name: 'Стеклянное на зажимном профиле', unit: 'м.п.', price: 15000, category: 'stairs2' },
        'wrk_strs2_handrail_ss': { name: 'Поручень нержавеющий', unit: 'м.п.', price: 2500, category: 'stairs2' },
        'wrk_strs2_handrail_wood': { name: 'Поручень деревянный', unit: 'м.п.', price: 1500, category: 'stairs2' },
        'wrk_strs2_handrail_pvc': { name: 'Поручень ПВХ', unit: 'м.п.', price: 850, category: 'stairs2' },
        // === НАРУЖНЫЕ === 37-42
        'wrk_strs2_ext_concrete': { name: 'Бетонное крыльцо', unit: 'м²', price: 5500, category: 'stairs2' },
        'wrk_strs2_ext_granite': { name: 'Гранитные ступени', unit: 'м.п.', price: 8500, category: 'stairs2' },
        'wrk_strs2_ext_metal_entry': { name: 'Металлическая входная группа', unit: 'компл.', price: 85000, category: 'stairs2' },
        'wrk_strs2_ext_ramp_rc': { name: 'Пандус (бетон)', unit: 'м.п.', price: 8500, category: 'stairs2' },
        'wrk_strs2_ext_ramp_metal': { name: 'Пандус (металл, откидной)', unit: 'шт', price: 25000, category: 'stairs2' },
        'wrk_strs2_ext_anti_slip': { name: 'Антискользящее покрытие', unit: 'м.п.', price: 550, category: 'stairs2' },
        // === ПОДСВЕТКА / ДОПЫ === 43-48
        'wrk_strs2_floating': { name: 'Консольная лестница (парящая)', unit: 'ступень', price: 12000, category: 'stairs2' },
        'wrk_strs2_esc_cladding': { name: 'Облицовка зоны эскалатора', unit: 'м²', price: 3500, category: 'stairs2' },
        'wrk_strs2_esc_glass': { name: 'Стеклянная балюстрада эскалатора', unit: 'м.п.', price: 12000, category: 'stairs2' },
        'wrk_strs2_esc_pit_wp': { name: 'Гидроизоляция приямка', unit: 'шт', price: 25000, category: 'stairs2' },
        'wrk_strs2_esc_lighting': { name: 'Освещение зоны эскалатора', unit: 'компл.', price: 35000, category: 'stairs2' }
    };
})();
