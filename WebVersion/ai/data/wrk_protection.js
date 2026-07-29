// === СПЕЦРАБОТЫ: АНТИКОРРОЗИЯ, ОГНЕЗАЩИТА, СПЕЦПОКРЫТИЯ, ХИМЗАЩИТА, ПРОМБЕЗОПАСНОСТЬ (300 поз.) ===
(function () {
    window.AI_WRK_PROTECTION = {
        // === АНТИКОРРОЗИЙНАЯ ЗАЩИТА ===
        'wrk_pr_anticorr_primer_1': { name: 'Грунтовка металла антикоррозийная (1 слой)', unit: 'м²', price: 250, category: 'protection' },
        'wrk_pr_anticorr_primer_2': { name: 'Грунтовка металла антикоррозийная (2 слоя)', unit: 'м²', price: 450, category: 'protection' },
        'wrk_pr_anticorr_paint_epoxy': { name: 'Эпоксидная окраска МК (2 слоя)', unit: 'м²', price: 650, category: 'protection' },
        'wrk_pr_anticorr_paint_poly': { name: 'Полиуретановая окраска МК (2 слоя)', unit: 'м²', price: 750, category: 'protection' },
        'wrk_pr_anticorr_galvanize_cold': { name: 'Холодное цинкование (покрытие)', unit: 'м²', price: 550, category: 'protection' },
        'wrk_pr_anticorr_metalspray_zinc': { name: 'Металлизация цинком (газотермич.)', unit: 'м²', price: 1500, category: 'protection' },
        'wrk_pr_anticorr_metalspray_alum': { name: 'Металлизация алюминием', unit: 'м²', price: 1800, category: 'protection' },
        'wrk_pr_anticorr_sandblast': { name: 'Пескоструйная очистка Sa 2.5', unit: 'м²', price: 650, category: 'protection' },
        'wrk_pr_anticorr_sandblast_sa3': { name: 'Пескоструйная очистка Sa 3', unit: 'м²', price: 850, category: 'protection' },
        'wrk_pr_anticorr_wire_brush': { name: 'Механическая очистка (щётка/шлифовка)', unit: 'м²', price: 350, category: 'protection' },
        // === ОГНЕЗАЩИТА ===
        'wrk_pr_fire_steel_paint_r45': { name: 'Огнезащита металлоконструкций (краска R45)', unit: 'м²', price: 650, category: 'protection' },
        'wrk_pr_fire_steel_paint_r60': { name: 'Огнезащита металлоконструкций (краска R60)', unit: 'м²', price: 850, category: 'protection' },
        'wrk_pr_fire_steel_paint_r90': { name: 'Огнезащита металлоконструкций (краска R90)', unit: 'м²', price: 1200, category: 'protection' },
        'wrk_pr_fire_steel_paint_r120': { name: 'Огнезащита металлоконструкций (краска R120)', unit: 'м²', price: 1500, category: 'protection' },
        'wrk_pr_fire_steel_plaster_r60': { name: 'Огнезащита МК штукатуркой R60', unit: 'м²', price: 1500, category: 'protection' },
        'wrk_pr_fire_steel_plaster_r90': { name: 'Огнезащита МК штукатуркой R90', unit: 'м²', price: 2200, category: 'protection' },
        'wrk_pr_fire_steel_board_r60': { name: 'Огнезащита МК плитами R60', unit: 'м²', price: 1800, category: 'protection' },
        'wrk_pr_fire_steel_board_r90': { name: 'Огнезащита МК плитами R90', unit: 'м²', price: 2500, category: 'protection' },
        'wrk_pr_fire_wood_impreg': { name: 'Огнезащитная пропитка древесины', unit: 'м²', price: 250, category: 'protection' },
        'wrk_pr_fire_wood_paint': { name: 'Огнезащитная краска по дереву', unit: 'м²', price: 350, category: 'protection' },
        'wrk_pr_fire_cable_paint': { name: 'Огнезащита кабельных линий (краска)', unit: 'м.п.', price: 250, category: 'protection' },
        'wrk_pr_fire_cable_wrap': { name: 'Огнезащита кабелей (мат/обмотка)', unit: 'м.п.', price: 550, category: 'protection' },
        'wrk_pr_fire_duct_coating': { name: 'Огнезащита воздуховодов (мастика)', unit: 'м²', price: 550, category: 'protection' },
        'wrk_pr_fire_duct_wrap': { name: 'Огнезащита воздуховодов (мат EI60)', unit: 'м²', price: 1200, category: 'protection' },
        'wrk_pr_fire_penetration_seal': { name: 'Заделка кабельных проходок (EI)', unit: 'шт', price: 3500, category: 'protection' },
        'wrk_pr_fire_joint_seal': { name: 'Огнезащита строительных швов', unit: 'м.п.', price: 850, category: 'protection' },
        // === ХИМЗАЩИТА ===
        'wrk_pr_chem_lining_acid': { name: 'Кислотоупорная футеровка', unit: 'м²', price: 5500, category: 'protection' },
        'wrk_pr_chem_coating_epoxy': { name: 'Эпоксидное химстойкое покрытие', unit: 'м²', price: 2500, category: 'protection' },
        'wrk_pr_chem_coating_vinyl': { name: 'Винилэстерное покрытие', unit: 'м²', price: 3500, category: 'protection' },
        'wrk_pr_chem_lining_rubber': { name: 'Гуммирование (резиновое покрытие)', unit: 'м²', price: 5500, category: 'protection' },
        'wrk_pr_chem_lining_pe': { name: 'Полиэтиленовая футеровка', unit: 'м²', price: 3500, category: 'protection' },
        // === ПРОМЫШЛЕННАЯ БЕЗОПАСНОСТЬ ===
        'wrk_pr_safety_railing': { name: 'Монтаж ограждения площадок/лестниц', unit: 'м.п.', price: 3500, category: 'protection' },
        'wrk_pr_safety_ladder_vertical': { name: 'Монтаж вертикальной лестницы с ограждением', unit: 'м.п.', price: 5500, category: 'protection' },
        'wrk_pr_safety_platform': { name: 'Монтаж обслуживающей площадки', unit: 'м²', price: 8500, category: 'protection' },
        'wrk_pr_safety_anchor_point': { name: 'Установка анкерного устройства', unit: 'шт', price: 8500, category: 'protection' },
        'wrk_pr_safety_lifeline': { name: 'Монтаж горизонтальной страховочной линии', unit: 'м.п.', price: 3500, category: 'protection' },
        'wrk_pr_safety_eyewash': { name: 'Установка аварийного душа/фонтанчика', unit: 'шт', price: 25000, category: 'protection' },
        // === СПЕЦПОКРЫТИЯ ПОЛОВ ===
        'wrk_pr_floor_antistatic': { name: 'Антистатическое покрытие пола', unit: 'м²', price: 3500, category: 'protection' },
        'wrk_pr_floor_abrasion': { name: 'Покрытие пола износостойким топпингом', unit: 'м²', price: 1500, category: 'protection' },
        'wrk_pr_floor_chemical': { name: 'Химстойкое покрытие пола', unit: 'м²', price: 4500, category: 'protection' },
        'wrk_pr_floor_electro': { name: 'Токопроводящее покрытие пола', unit: 'м²', price: 3500, category: 'protection' }
    };
})();
