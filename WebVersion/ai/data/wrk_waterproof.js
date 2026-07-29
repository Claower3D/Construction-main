// === КАТАЛОГ РАБОТ: ГИДРОИЗОЛЯЦИЯ — ПОЛНЫЙ ЦИКЛ (200 позиций) ===
(function () {
    window.AI_WRK_WATERPROOF = {
        // Обмазочная гидроизоляция
        'wrk_wp_coat_bitumen_1': { name: 'Обмазочная ГИ битумная 1 слой', unit: 'м²', price: 80, category: 'waterproof' },
        'wrk_wp_coat_bitumen_2': { name: 'Обмазочная ГИ битумная 2 слоя', unit: 'м²', price: 130, category: 'waterproof' },
        'wrk_wp_coat_polymer_1': { name: 'Обмазочная ГИ полимерная 1 слой', unit: 'м²', price: 120, category: 'waterproof' },
        'wrk_wp_coat_polymer_2': { name: 'Обмазочная ГИ полимерная 2 слоя', unit: 'м²', price: 200, category: 'waterproof' },
        'wrk_wp_coat_cement_1': { name: 'Обмазочная ГИ цементная 1 слой', unit: 'м²', price: 100, category: 'waterproof' },
        'wrk_wp_coat_cement_2': { name: 'Обмазочная ГИ цементная 2 слоя', unit: 'м²', price: 170, category: 'waterproof' },
        'wrk_wp_coat_elastic': { name: 'Эластичная ГИ (двухкомпонентная)', unit: 'м²', price: 250, category: 'waterproof' },
        // Рулонная / оклеечная ГИ
        'wrk_wp_roll_bitumen_1': { name: 'Рулонная ГИ наплавляемая 1 слой', unit: 'м²', price: 150, category: 'waterproof' },
        'wrk_wp_roll_bitumen_2': { name: 'Рулонная ГИ наплавляемая 2 слоя', unit: 'м²', price: 250, category: 'waterproof' },
        'wrk_wp_roll_self_adhesive': { name: 'Рулонная ГИ самоклеящаяся', unit: 'м²', price: 200, category: 'waterproof' },
        'wrk_wp_roll_pe_film': { name: 'ГИ полиэтиленовая плёнка', unit: 'м²', price: 20, category: 'waterproof' },
        'wrk_wp_roll_pe_reinforced': { name: 'ГИ армированная плёнка', unit: 'м²', price: 40, category: 'waterproof' },
        // Мембранная ГИ
        'wrk_wp_membrane_pvc_12': { name: 'ПВХ-мембрана 1.2мм', unit: 'м²', price: 250, category: 'waterproof' },
        'wrk_wp_membrane_pvc_15': { name: 'ПВХ-мембрана 1.5мм', unit: 'м²', price: 300, category: 'waterproof' },
        'wrk_wp_membrane_tpo': { name: 'ТПО-мембрана', unit: 'м²', price: 350, category: 'waterproof' },
        'wrk_wp_membrane_epdm': { name: 'EPDM-мембрана', unit: 'м²', price: 400, category: 'waterproof' },
        // Проникающая ГИ
        'wrk_wp_penetrating_1': { name: 'Проникающая ГИ (Пенетрон и аналоги) 1 слой', unit: 'м²', price: 200, category: 'waterproof' },
        'wrk_wp_penetrating_2': { name: 'Проникающая ГИ 2 слоя', unit: 'м²', price: 350, category: 'waterproof' },
        'wrk_wp_penetrating_joint': { name: 'ГИ швов (Пенекрит)', unit: 'м.п.', price: 150, category: 'waterproof' },
        'wrk_wp_penetrating_crack': { name: 'ГИ трещин инъекционная', unit: 'м.п.', price: 300, category: 'waterproof' },
        // Инъекционная ГИ
        'wrk_wp_inject_polyurethane': { name: 'Инъектирование полиуретаном', unit: 'м.п.', price: 500, category: 'waterproof' },
        'wrk_wp_inject_epoxy': { name: 'Инъектирование эпоксидом', unit: 'м.п.', price: 600, category: 'waterproof' },
        'wrk_wp_inject_packer': { name: 'Установка инъекционного пакера', unit: 'шт', price: 50, category: 'waterproof' },
        // Фундамент ГИ
        'wrk_wp_found_bitumen': { name: 'ГИ фундамента битумная мастика', unit: 'м²', price: 100, category: 'waterproof' },
        'wrk_wp_found_roll': { name: 'ГИ фундамента рулонная', unit: 'м²', price: 200, category: 'waterproof' },
        'wrk_wp_found_membrane': { name: 'ГИ фундамента профилированная мембрана', unit: 'м²', price: 100, category: 'waterproof' },
        'wrk_wp_found_clay': { name: 'Глиняный замок фундамента', unit: 'м²', price: 150, category: 'waterproof' },
        // Жидкая резина
        'wrk_wp_liquid_rubber_manual': { name: 'Жидкая резина (ручное нанесение)', unit: 'м²', price: 300, category: 'waterproof' },
        // Санузел / ванная
        'wrk_wp_bathroom_floor': { name: 'ГИ пола ванной комнаты (обмаз.)', unit: 'м²', price: 200, category: 'waterproof' },
        'wrk_wp_bathroom_wall': { name: 'ГИ стен ванной (мокрая зона)', unit: 'м²', price: 150, category: 'waterproof' },
        'wrk_wp_bathroom_band': { name: 'ГИ лента для углов/примыканий', unit: 'м.п.', price: 30, category: 'waterproof' },
        'wrk_wp_bathroom_drain': { name: 'ГИ примыкания трапа', unit: 'шт', price: 200, category: 'waterproof' },
        'wrk_wp_bathroom_full': { name: 'ГИ санузла полная (комплекс)', unit: 'м²', price: 350, category: 'waterproof' },
        // Балкон / терраса
        'wrk_wp_balcony_floor': { name: 'ГИ балкона/лоджии (пол)', unit: 'м²', price: 200, category: 'waterproof' },
        'wrk_wp_terrace': { name: 'ГИ террасы', unit: 'м²', price: 250, category: 'waterproof' },
        // Бассейн
        'wrk_wp_pool_inside': { name: 'ГИ бассейна внутренняя', unit: 'м²', price: 500, category: 'waterproof' },
        'wrk_wp_pool_outside': { name: 'ГИ бассейна наружная', unit: 'м²', price: 300, category: 'waterproof' },
        // Подвал
        'wrk_wp_basement_inside': { name: 'ГИ подвала изнутри', unit: 'м²', price: 300, category: 'waterproof' },
        'wrk_wp_basement_outside': { name: 'ГИ подвала снаружи', unit: 'м²', price: 400, category: 'waterproof' },
        'wrk_wp_basement_floor': { name: 'ГИ пола подвала', unit: 'м²', price: 250, category: 'waterproof' },
        // Кровля ГИ
        'wrk_wp_roof_flat_1': { name: 'ГИ плоской кровли 1 слой', unit: 'м²', price: 150, category: 'waterproof' },
        'wrk_wp_roof_flat_2': { name: 'ГИ плоской кровли 2 слоя', unit: 'м²', price: 250, category: 'waterproof' },
        'wrk_wp_roof_flat_repair': { name: 'Ремонт ГИ кровли (местный)', unit: 'м²', price: 200, category: 'waterproof' },
        // Герметизация
        'wrk_wp_sealant_silicone': { name: 'Герметизация силиконом', unit: 'м.п.', price: 30, category: 'waterproof' },
        'wrk_wp_sealant_polyurethane': { name: 'Герметизация полиуретаном', unit: 'м.п.', price: 50, category: 'waterproof' },
        'wrk_wp_sealant_window': { name: 'Герметизация оконных примыканий', unit: 'м.п.', price: 80, category: 'waterproof' },
        // Отсечная ГИ
        'wrk_wp_cutoff_inject': { name: 'Отсечная ГИ инъекционная', unit: 'м.п.', price: 500, category: 'waterproof' },
        'wrk_wp_cutoff_sheet': { name: 'Отсечная ГИ рулонная', unit: 'м.п.', price: 100, category: 'waterproof' },
        // Слепая зона
        'wrk_wp_blind_area_concrete': { name: 'Отмостка бетонная', unit: 'м²', price: 400, category: 'waterproof' },
        'wrk_wp_blind_area_soft': { name: 'Мягкая отмостка', unit: 'м²', price: 300, category: 'waterproof' },
        'wrk_wp_blind_area_insul': { name: 'Утеплённая отмостка (ЭППС)', unit: 'м²', price: 500, category: 'waterproof' }
    };
})();
