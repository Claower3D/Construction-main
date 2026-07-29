// === РЕСТАВРАЦИЯ ПОЛНАЯ — кладка, лепнина, фрески, позолота, дерево, металл (48 поз.) ===
(function () {
    window.AI_WRK_RESTORATION2 = {
        // === КЛАДКА === 1-8
        'wrk_rst2_brick_replace': { name: 'Замена кирпича (историч.)', unit: 'шт', price: 550, category: 'restoration2' },
        'wrk_rst2_brick_clean_sand': { name: 'Пескоструйная очистка кирпича', unit: 'м²', price: 550, category: 'restoration2' },
        'wrk_rst2_brick_clean_chem': { name: 'Химическая очистка кирпича', unit: 'м²', price: 350, category: 'restoration2' },
        'wrk_rst2_brick_pointing': { name: 'Расшивка швов (историч.)', unit: 'м²', price: 850, category: 'restoration2' },
        'wrk_rst2_brick_consol': { name: 'Консолидация кладки', unit: 'м²', price: 1200, category: 'restoration2' },
        'wrk_rst2_stone_replace': { name: 'Замена элемента камня', unit: 'шт', price: 8500, category: 'restoration2' },
        'wrk_rst2_stone_clean': { name: 'Лазерная очистка камня', unit: 'м²', price: 1500, category: 'restoration2' },
        // === ШТУКАТУРКА / ФРЕСКИ === 9-18
        'wrk_rst2_plaster_lime': { name: 'Реставрация известковой штукатурки', unit: 'м²', price: 2500, category: 'restoration2' },
        'wrk_rst2_plaster_stucco': { name: 'Реставрация стукко', unit: 'м²', price: 3500, category: 'restoration2' },
        'wrk_rst2_plaster_venetian': { name: 'Реставрация венецианской', unit: 'м²', price: 5500, category: 'restoration2' },
        'wrk_rst2_fresco_clean': { name: 'Расчистка фрески', unit: 'м²', price: 15000, category: 'restoration2' },
        'wrk_rst2_fresco_inject': { name: 'Укрепление фрески', unit: 'м²', price: 8500, category: 'restoration2' },
        'wrk_rst2_fresco_retouch': { name: 'Ретушь фрески', unit: 'м²', price: 25000, category: 'restoration2' },
        'wrk_rst2_mural_restore': { name: 'Восстановление росписи', unit: 'м²', price: 55000, category: 'restoration2' },
        'wrk_rst2_sgraffito': { name: 'Реставрация сграффито', unit: 'м²', price: 25000, category: 'restoration2' },
        'wrk_rst2_mosaic': { name: 'Реставрация мозаики', unit: 'м²', price: 35000, category: 'restoration2' },
        'wrk_rst2_icon': { name: 'Реставрация иконы', unit: 'шт', price: 120000, category: 'restoration2' },
        // === ЛЕПНИНА === 19-26
        'wrk_rst2_mold_simple': { name: 'Лепнина простой профиль', unit: 'м.п.', price: 3500, category: 'restoration2' },
        'wrk_rst2_mold_complex': { name: 'Лепнина сложный профиль', unit: 'м.п.', price: 8500, category: 'restoration2' },
        'wrk_rst2_mold_cast': { name: 'Изготовление формы и отливка', unit: 'элемент', price: 15000, category: 'restoration2' },
        'wrk_rst2_carving_wood': { name: 'Резьба по дереву (восстановление)', unit: 'дм²', price: 5500, category: 'restoration2' },
        'wrk_rst2_carving_stone': { name: 'Резьба по камню (восстановление)', unit: 'дм²', price: 8500, category: 'restoration2' },
        'wrk_rst2_capital': { name: 'Реставрация капители', unit: 'шт', price: 85000, category: 'restoration2' },
        'wrk_rst2_rosette': { name: 'Реставрация розетки потолочной', unit: 'шт', price: 25000, category: 'restoration2' },
        'wrk_rst2_cornice': { name: 'Реставрация карниза', unit: 'м.п.', price: 5500, category: 'restoration2' },
        // === ПОЗОЛОТА === 27-30
        'wrk_rst2_gold_leaf': { name: 'Золочение сусальным золотом', unit: 'дм²', price: 3500, category: 'restoration2' },
        'wrk_rst2_gold_restore': { name: 'Восстановление позолоты', unit: 'дм²', price: 2500, category: 'restoration2' },
        'wrk_rst2_silver_leaf': { name: 'Серебрение', unit: 'дм²', price: 2500, category: 'restoration2' },
        // === ДЕРЕВО === 31-36
        'wrk_rst2_wood_beam': { name: 'Реставрация балки', unit: 'м.п.', price: 8500, category: 'restoration2' },
        'wrk_rst2_wood_protesis': { name: 'Протезирование балки', unit: 'шт', price: 35000, category: 'restoration2' },
        'wrk_rst2_wood_parquet': { name: 'Реставрация исторического паркета', unit: 'м²', price: 5500, category: 'restoration2' },
        'wrk_rst2_wood_stair': { name: 'Реставрация лестницы', unit: 'м.п.', price: 8500, category: 'restoration2' },
        // === МЕТАЛЛ === 37-42
        'wrk_rst2_metal_gate': { name: 'Реставрация кованых ворот', unit: 'м²', price: 12000, category: 'restoration2' },
        'wrk_rst2_metal_railing': { name: 'Реставрация кованых перил', unit: 'м.п.', price: 8500, category: 'restoration2' },
        'wrk_rst2_metal_balcony': { name: 'Реставрация балконных решёток', unit: 'м.п.', price: 8500, category: 'restoration2' },
        'wrk_rst2_metal_lamp': { name: 'Реставрация светильника', unit: 'шт', price: 25000, category: 'restoration2' },
        'wrk_rst2_metal_vane': { name: 'Реставрация флюгера', unit: 'шт', price: 35000, category: 'restoration2' },
        'wrk_rst2_metal_roof_dec': { name: 'Реставрация кровельного декора', unit: 'шт', price: 55000, category: 'restoration2' },
        // === КРОВЛЯ / ДОПЫ === 43-48
        'wrk_rst2_roof_copper': { name: 'Реставрация медной кровли', unit: 'м²', price: 8500, category: 'restoration2' },
        'wrk_rst2_roof_tile': { name: 'Замена исторической черепицы', unit: 'м²', price: 5500, category: 'restoration2' },
        'wrk_rst2_roof_slate': { name: 'Реставрация сланцевой кровли', unit: 'м²', price: 8500, category: 'restoration2' },
        'wrk_rst2_waterproof': { name: 'Гидроизоляция подвала (историч.)', unit: 'м²', price: 3500, category: 'restoration2' },
        'wrk_rst2_documentation': { name: 'Реставрационная документация', unit: 'компл.', price: 250000, category: 'restoration2' },
    };
})();
