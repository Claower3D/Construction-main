// === РЕКОНСТРУКЦИЯ И КАПИТАЛЬНЫЙ РЕМОНТ — усиление, замена, надстройка ===
(function () {
    window.AI_WRK_RECONSTRUCTION2 = {
        // === УСИЛЕНИЕ КОНСТРУКЦИЙ ===
        'wrk_rc2_reinforce_slab_cfrp': { name: 'Усиление плиты углеволокном (CFRP)', unit: 'м.п.', price: 3500, category: 'reconstruction2' },
        'wrk_rc2_reinforce_beam_cfrp': { name: 'Усиление балки углеволокном (CFRP)', unit: 'м.п.', price: 5500, category: 'reconstruction2' },
        'wrk_rc2_reinforce_col_jacket': { name: 'Усиление колонны ж/б рубашкой', unit: 'м.п.', price: 12000, category: 'reconstruction2' },
        'wrk_rc2_reinforce_wall_shotcrete': { name: 'Усиление стены набрызг-бетоном', unit: 'м²', price: 3500, category: 'reconstruction2' },
        'wrk_rc2_reinforce_wall_inject': { name: 'Инъектирование трещин (эпоксид)', unit: 'м.п.', price: 2500, category: 'reconstruction2' },
        'wrk_rc2_reinforce_found_widen': { name: 'Расширение фундамента', unit: 'м.п.', price: 18000, category: 'reconstruction2' },
        'wrk_rc2_reinforce_found_micropile': { name: 'Усиление фундамента микросваями', unit: 'шт', price: 25000, category: 'reconstruction2' },
        // === ДЕМОНТАЖ ПРИ РЕКОНСТРУКЦИИ ===
        'wrk_rc2_demo_partition_brick': { name: 'Демонтаж перегородки (кирпич)', unit: 'м²', price: 450, category: 'reconstruction2' },
        'wrk_rc2_demo_partition_gkl': { name: 'Демонтаж перегородки (ГКЛ)', unit: 'м²', price: 200, category: 'reconstruction2' },
        'wrk_rc2_demo_slab_opening': { name: 'Вырезка проёма в ж/б плите', unit: 'м²', price: 12000, category: 'reconstruction2' },
        'wrk_rc2_demo_wall_opening': { name: 'Проём в несущей стене', unit: 'шт', price: 55000, category: 'reconstruction2' },
        'wrk_rc2_demo_floor': { name: 'Демонтаж стяжки/пола', unit: 'м²', price: 350, category: 'reconstruction2' },
        'wrk_rc2_demo_tile': { name: 'Демонтаж плитки', unit: 'м²', price: 350, category: 'reconstruction2' },
        'wrk_rc2_demo_ceiling': { name: 'Демонтаж подвесного потолка', unit: 'м²', price: 150, category: 'reconstruction2' },
        // === НАДСТРОЙКА ===
        'wrk_rc2_add_floor_steel': { name: 'Надстройка этажа (МК)', unit: 'м²', price: 18000, category: 'reconstruction2' },
        'wrk_rc2_add_floor_wood': { name: 'Надстройка этажа (дерево)', unit: 'м²', price: 12000, category: 'reconstruction2' },
        'wrk_rc2_extension_rc': { name: 'Пристройка (ж/б)', unit: 'м²', price: 25000, category: 'reconstruction2' },
        // === ЗАМЕНА СИСТЕМ ===
        'wrk_rc2_replace_roof': { name: 'Замена кровли', unit: 'м²', price: 1500, category: 'reconstruction2' },
        'wrk_rc2_replace_windows': { name: 'Замена оконных блоков', unit: 'шт', price: 5500, category: 'reconstruction2' },
        'wrk_rc2_replace_wiring': { name: 'Полная замена электропроводки', unit: 'м²', price: 1200, category: 'reconstruction2' },
        'wrk_rc2_replace_plumbing': { name: 'Полная замена трубопроводов', unit: 'м²', price: 1500, category: 'reconstruction2' },
        'wrk_rc2_replace_heating': { name: 'Полная замена отопления', unit: 'м²', price: 1800, category: 'reconstruction2' },
        // === ОБСЛЕДОВАНИЕ ===
        'wrk_rc2_survey_visual': { name: 'Визуальное обследование здания', unit: 'объект', price: 55000, category: 'reconstruction2' },
        'wrk_rc2_survey_instr': { name: 'Инструментальное обследование', unit: 'объект', price: 150000, category: 'reconstruction2' },
        'wrk_rc2_survey_rebar': { name: 'Сканирование арматуры', unit: 'точка', price: 1500, category: 'reconstruction2' },
        'wrk_rc2_survey_strength': { name: 'Определение прочности бетона', unit: 'точка', price: 1200, category: 'reconstruction2' }
    };
})();
