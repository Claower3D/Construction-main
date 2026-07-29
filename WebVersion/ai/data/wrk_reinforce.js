// === РЕКОНСТРУКЦИЯ И УСИЛЕНИЕ КОНСТРУКЦИЙ (200 поз.) ===
(function () {
    window.AI_WRK_REINFORCE = {
        // === ОБСЛЕДОВАНИЕ ===
        'wrk_rf_survey_visual': { name: 'Визуальное обследование конструкций', unit: 'м²', price: 250, category: 'reinforce' },
        'wrk_rf_test_concrete_core': { name: 'Испытание бетона выбуриванием керна', unit: 'точка', price: 5500, category: 'reinforce' },
        'wrk_rf_test_concrete_rebound': { name: 'Испытание бетона склерометром', unit: 'точка', price: 1500, category: 'reinforce' },
        'wrk_rf_test_rebar_scan': { name: 'Определение армирования (сканер)', unit: 'м²', price: 2500, category: 'reinforce' },
        'wrk_rf_test_steel_thickness': { name: 'Замер толщины металлоконструкций (УЗД)', unit: 'точка', price: 850, category: 'reinforce' },
        'wrk_rf_survey_report': { name: 'Заключение по обследованию', unit: 'объект', price: 350000, category: 'reinforce' },
        // === УСИЛЕНИЕ Ж/Б КОНСТРУКЦИЙ ===
        'wrk_rf_rc_jacket_beam': { name: 'Усиление балки ж/б наращиванием', unit: 'м.п.', price: 18000, category: 'reinforce' },
        'wrk_rf_rc_slab_overlay': { name: 'Усиление плиты набетонкой h=50мм', unit: 'м²', price: 5500, category: 'reinforce' },
        'wrk_rf_rc_slab_overlay_100': { name: 'Усиление плиты набетонкой h=100мм', unit: 'м²', price: 8500, category: 'reinforce' },
        'wrk_rf_carbon_strip': { name: 'Усиление карбоновыми лентами (CFRP)', unit: 'м.п.', price: 12000, category: 'reinforce' },
        'wrk_rf_carbon_sheet': { name: 'Усиление карбоновым холстом (CFRP)', unit: 'м²', price: 15000, category: 'reinforce' },
        'wrk_rf_frp_wrap': { name: 'Обёртывание стеклопластиком (FRP)', unit: 'м²', price: 8500, category: 'reinforce' },
        'wrk_rf_injection_crack': { name: 'Инъектирование трещин эпоксидным составом', unit: 'м.п.', price: 5500, category: 'reinforce' },
        'wrk_rf_injection_crack_pu': { name: 'Инъектирование трещин полиуретаном', unit: 'м.п.', price: 4500, category: 'reinforce' },
        'wrk_rf_injection_contact': { name: 'Контактное инъектирование (обойма/грунт)', unit: 'м²', price: 3500, category: 'reinforce' },
        'wrk_rf_anchor_chem_install': { name: 'Установка хим. анкеров в бетон', unit: 'шт', price: 2500, category: 'reinforce' },
        'wrk_rf_anchor_drill_d20': { name: 'Сверление отверстий в бетоне Ø20', unit: 'шт', price: 350, category: 'reinforce' },
        'wrk_rf_anchor_drill_d32': { name: 'Сверление отверстий в бетоне Ø32', unit: 'шт', price: 550, category: 'reinforce' },
        // === УСИЛЕНИЕ МЕТАЛЛОКОНСТРУКЦИЙ ===
        'wrk_rf_steel_plate_weld': { name: 'Усиление приваркой дополнит. пластин', unit: 'кг', price: 250, category: 'reinforce' },
        'wrk_rf_steel_plate_bolt': { name: 'Усиление на болтовых соединениях', unit: 'кг', price: 280, category: 'reinforce' },
        'wrk_rf_steel_brace_add': { name: 'Установка дополнительных связей', unit: 'шт', price: 15000, category: 'reinforce' },
        'wrk_rf_steel_stiffener': { name: 'Установка рёбер жёсткости', unit: 'шт', price: 5500, category: 'reinforce' },
        'wrk_rf_steel_replace_section': { name: 'Замена повреждённого элемента', unit: 'кг', price: 350, category: 'reinforce' },
        'wrk_rf_steel_weld_repair': { name: 'Ремонт сварных швов', unit: 'м.п.', price: 2500, category: 'reinforce' },
        'wrk_rf_steel_sandblast': { name: 'Пескоструйная обработка металла', unit: 'м²', price: 1200, category: 'reinforce' },
        'wrk_rf_steel_anticorr': { name: 'Антикоррозийная обработка после усиления', unit: 'м²', price: 850, category: 'reinforce' },
        // === УСИЛЕНИЕ КИРПИЧНОЙ КЛАДКИ ===
        'wrk_rf_masonry_injection': { name: 'Инъектирование кладки раствором', unit: 'м²', price: 5500, category: 'reinforce' },
        'wrk_rf_masonry_cage': { name: 'Усиление кладки стальной обоймой', unit: 'м.п.', price: 12000, category: 'reinforce' },
        'wrk_rf_masonry_mesh_plaster': { name: 'Торкретирование кладки по сетке', unit: 'м²', price: 3500, category: 'reinforce' },
        'wrk_rf_masonry_repoint': { name: 'Расшивка и заделка трещин в кладке', unit: 'м.п.', price: 1500, category: 'reinforce' },
        'wrk_rf_masonry_rebrick': { name: 'Перекладка аварийных участков', unit: 'м³', price: 18000, category: 'reinforce' },
        'wrk_rf_masonry_helibar': { name: 'Армирование кладки спиральными стержнями (Helibar)', unit: 'м.п.', price: 3500, category: 'reinforce' },
        // === УСИЛЕНИЕ ФУНДАМЕНТОВ ===
        'wrk_rf_fnd_underpin_pit': { name: 'Усиление фундамента подводкой (захватками)', unit: 'м.п.', price: 35000, category: 'reinforce' },
        'wrk_rf_fnd_micropile': { name: 'Устройство микросвай Ø100-150', unit: 'м.п.', price: 8500, category: 'reinforce' },
        'wrk_rf_fnd_jet_grouting': { name: 'Струйная цементация (jet grouting)', unit: 'м.п.', price: 15000, category: 'reinforce' },
        'wrk_rf_fnd_injection_grout': { name: 'Цементация грунта под фундаментом', unit: 'м.п.', price: 12000, category: 'reinforce' },
        // === РЕМОНТ БЕТОННЫХ ПОВЕРХНОСТЕЙ ===
        'wrk_rf_repair_patch_small': { name: 'Ремонт сколов бетона до 20мм', unit: 'м²', price: 3500, category: 'reinforce' },
        'wrk_rf_repair_patch_deep': { name: 'Ремонт бетона глубиной 20-50мм', unit: 'м²', price: 5500, category: 'reinforce' },
        'wrk_rf_repair_patch_structural': { name: 'Конструкционный ремонт бетона', unit: 'м²', price: 8500, category: 'reinforce' },
        'wrk_rf_repair_rebar_expose': { name: 'Вскрытие и очистка арматуры', unit: 'м.п.', price: 1200, category: 'reinforce' },
        'wrk_rf_repair_rebar_treat': { name: 'Антикоррозийная обработка арматуры', unit: 'м.п.', price: 550, category: 'reinforce' },
        'wrk_rf_repair_rebar_supplement': { name: 'Дополнительное армирование', unit: 'кг', price: 180, category: 'reinforce' },
        'wrk_rf_repair_shotcrete_50': { name: 'Торкретирование h=50мм', unit: 'м²', price: 4500, category: 'reinforce' },
        'wrk_rf_repair_shotcrete_100': { name: 'Торкретирование h=100мм', unit: 'м²', price: 7500, category: 'reinforce' },
        // === ДЕМОНТАЖ (РЕКОНСТРУКЦИЯ) ===
        'wrk_rf_demo_opening_wall_120': { name: 'Устройство проёма в кирп. стене 120мм', unit: 'м²', price: 3500, category: 'reinforce' },
        'wrk_rf_demo_opening_wall_250': { name: 'Устройство проёма в кирп. стене 250мм', unit: 'м²', price: 5500, category: 'reinforce' },
        'wrk_rf_demo_opening_rc_150': { name: 'Устройство проёма в ж/б стене 150мм', unit: 'м²', price: 12000, category: 'reinforce' },
        'wrk_rf_demo_opening_rc_200': { name: 'Устройство проёма в ж/б стене 200мм', unit: 'м²', price: 18000, category: 'reinforce' },
        'wrk_rf_demo_opening_lintel': { name: 'Установка перемычки в проём', unit: 'шт', price: 8500, category: 'reinforce' },
        'wrk_rf_demo_diamond_core_d100': { name: 'Алмазное бурение Ø100', unit: 'см', price: 250, category: 'reinforce' },
        'wrk_rf_demo_diamond_core_d200': { name: 'Алмазное бурение Ø200', unit: 'см', price: 550, category: 'reinforce' },
        'wrk_rf_demo_diamond_core_d300': { name: 'Алмазное бурение Ø300', unit: 'см', price: 850, category: 'reinforce' },
        // === АНТИКОРРОЗИЙНАЯ ЗАЩИТА ===
        'wrk_rf_anticorr_primer': { name: 'Нанесение грунтовочного слоя', unit: 'м²', price: 450, category: 'reinforce' },
        'wrk_rf_anticorr_paint_2coat': { name: 'Антикоррозийная окраска (2 слоя)', unit: 'м²', price: 850, category: 'reinforce' },
        'wrk_rf_anticorr_paint_3coat': { name: 'Антикоррозийная окраска (3 слоя)', unit: 'м²', price: 1200, category: 'reinforce' },
        'wrk_rf_anticorr_cathodic': { name: 'Катодная защита (монтаж)', unit: 'м²', price: 3500, category: 'reinforce' },
        'wrk_rf_fire_protect_plaster': { name: 'Огнезащита конструкций (штукатурка)', unit: 'м²', price: 2500, category: 'reinforce' },
        'wrk_rf_fire_protect_paint': { name: 'Огнезащита конструкций (краска)', unit: 'м²', price: 1500, category: 'reinforce' },
        'wrk_rf_fire_protect_board': { name: 'Огнезащита конструкций (плитами)', unit: 'м²', price: 3500, category: 'reinforce' }
    };
})();
