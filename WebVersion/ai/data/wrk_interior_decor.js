// === ФАЗА 3: ВНУТРЕННЯЯ ОТДЕЛКА (СПЕЦ.) — РЕЙКИ, ПАНЕЛИ 3D, БАРРИССОЛЬ, МОЛДИНГИ, ЛЕПНИНА (140 поз.) ===
(function () {
    window.AI_WRK_INTERIOR_DECOR = {
        // === РЕЕЧНЫЕ СИСТЕМЫ ===
        'wrk_id_slat_wall_mdf': { name: 'Рейки МДФ (стена)', unit: 'м²', price: 200, category: 'interior_decor' },
        'wrk_id_slat_wall_alu': { name: 'Рейки алюминиевые (стена)', unit: 'м²', price: 400, category: 'interior_decor' },
        'wrk_id_slat_ceil_mdf': { name: 'Рейки МДФ (потолок)', unit: 'м²', price: 250, category: 'interior_decor' },
        'wrk_id_slat_ceil_alu': { name: 'Реечный потолок алюминиевый', unit: 'м²', price: 300, category: 'interior_decor' },
        'wrk_id_slat_partition': { name: 'Реечная перегородка (зонирование)', unit: 'м²', price: 400, category: 'interior_decor' },

        // === 3D ПАНЕЛИ ===
        'wrk_id_3d_gypsum': { name: '3D панели гипсовые (стена)', unit: 'м²', price: 250, category: 'interior_decor' },
        'wrk_id_3d_mdf': { name: '3D панели МДФ', unit: 'м²', price: 200, category: 'interior_decor' },
        'wrk_id_3d_pvc': { name: '3D панели ПВХ', unit: 'м²', price: 100, category: 'interior_decor' },
        'wrk_id_3d_pe_foam': { name: '3D панели пенополиэтилен', unit: 'м²', price: 50, category: 'interior_decor' },
        'wrk_id_3d_cork': { name: '3D панели пробковые', unit: 'м²', price: 300, category: 'interior_decor' },
        'wrk_id_3d_paint': { name: 'Покраска 3D панелей', unit: 'м²', price: 50, category: 'interior_decor' },

        // === СТЕНОВЫЕ ПАНЕЛИ ===
        'wrk_id_panel_mdf_sheet': { name: 'Панели МДФ листовые', unit: 'м²', price: 100, category: 'interior_decor' },
        'wrk_id_panel_mdf_frame': { name: 'Панели МДФ филёнчатые', unit: 'м²', price: 200, category: 'interior_decor' },
        'wrk_id_panel_pvc': { name: 'Панели ПВХ', unit: 'м²', price: 50, category: 'interior_decor' },
        'wrk_id_panel_wood': { name: 'Деревянные панели (буазери)', unit: 'м²', price: 500, category: 'interior_decor' },
        'wrk_id_panel_leather': { name: 'Кожаные стеновые панели', unit: 'м²', price: 1000, category: 'interior_decor' },
        'wrk_id_panel_fabric': { name: 'Тканевые стеновые панели', unit: 'м²', price: 400, category: 'interior_decor' },
        'wrk_id_panel_acoustic_art': { name: 'Акустические панели (арт-принт)', unit: 'м²', price: 500, category: 'interior_decor' },
        'wrk_id_panel_hpl_int': { name: 'HPL панели (интерьер)', unit: 'м²', price: 300, category: 'interior_decor' },

        // === МОЛДИНГИ / ПЛИНТУС / КАРНИЗЫ ===
        'wrk_id_molding_eps': { name: 'Молдинг из пенополистирола', unit: 'м.п.', price: 20, category: 'interior_decor' },
        'wrk_id_molding_pu': { name: 'Молдинг из полиуретана', unit: 'м.п.', price: 40, category: 'interior_decor' },
        'wrk_id_molding_wood': { name: 'Молдинг деревянный', unit: 'м.п.', price: 50, category: 'interior_decor' },
        'wrk_id_cornice_pu': { name: 'Карниз потолочный (полиуретан)', unit: 'м.п.', price: 50, category: 'interior_decor' },
        'wrk_id_cornice_gypsum': { name: 'Карниз потолочный (гипс)', unit: 'м.п.', price: 80, category: 'interior_decor' },
        'wrk_id_cornice_led': { name: 'Карниз для LED-подсветки', unit: 'м.п.', price: 60, category: 'interior_decor' },
        'wrk_id_baseboard_mdf_60': { name: 'Плинтус МДФ 60мм', unit: 'м.п.', price: 15, category: 'interior_decor' },
        'wrk_id_baseboard_mdf_80': { name: 'Плинтус МДФ 80мм', unit: 'м.п.', price: 20, category: 'interior_decor' },
        'wrk_id_baseboard_mdf_100': { name: 'Плинтус МДФ 100мм', unit: 'м.п.', price: 25, category: 'interior_decor' },
        'wrk_id_baseboard_wood': { name: 'Плинтус деревянный', unit: 'м.п.', price: 30, category: 'interior_decor' },
        'wrk_id_baseboard_pvc': { name: 'Плинтус ПВХ с кабель-каналом', unit: 'м.п.', price: 10, category: 'interior_decor' },
        'wrk_id_baseboard_hidden': { name: 'Скрытый плинтус (теневой)', unit: 'м.п.', price: 60, category: 'interior_decor' },

        // === ЛЕПНИНА ===
        'wrk_id_rosette_gypsum': { name: 'Розетка потолочная (гипс)', unit: 'шт', price: 300, category: 'interior_decor' },
        'wrk_id_rosette_pu': { name: 'Розетка потолочная (ПУ)', unit: 'шт', price: 150, category: 'interior_decor' },
        'wrk_id_column_pu': { name: 'Колонна полиуретановая', unit: 'шт', price: 500, category: 'interior_decor' },
        'wrk_id_capital_pu': { name: 'Капитель (ПУ)', unit: 'шт', price: 200, category: 'interior_decor' },
        'wrk_id_pilaster_pu': { name: 'Пилястра полиуретановая', unit: 'м.п.', price: 100, category: 'interior_decor' },
        'wrk_id_arch_pu': { name: 'Арка (полиуретан)', unit: 'шт', price: 500, category: 'interior_decor' },
        'wrk_id_arch_gypsum': { name: 'Арка из гипса', unit: 'шт', price: 1000, category: 'interior_decor' },

        // === ЗЕРКАЛА / СТЕКЛО ===
        'wrk_id_mirror_wall': { name: 'Зеркало настенное (монтаж)', unit: 'м²', price: 200, category: 'interior_decor' },
        'wrk_id_mirror_full': { name: 'Зеркало в полный рост', unit: 'шт', price: 500, category: 'interior_decor' },
        'wrk_id_mirror_led': { name: 'Зеркало с LED-подсветкой', unit: 'шт', price: 800, category: 'interior_decor' },
        'wrk_id_mirror_heated': { name: 'Зеркало с обогревом', unit: 'шт', price: 600, category: 'interior_decor' },
        'wrk_id_glass_partition': { name: 'Стеклянная перегородка', unit: 'м²', price: 800, category: 'interior_decor' },
        'wrk_id_glass_partition_fr': { name: 'Стеклянная перегородка (в раме)', unit: 'м²', price: 600, category: 'interior_decor' },
        'wrk_id_glass_door': { name: 'Стеклянная дверь (маятниковая)', unit: 'шт', price: 3000, category: 'interior_decor' },
        'wrk_id_glass_railing': { name: 'Стеклянное ограждение', unit: 'м.п.', price: 1500, category: 'interior_decor' },

        // === ПОДСВЕТКА ===
        'wrk_id_led_strip_ip20': { name: 'LED-лента IP20 (монтаж)', unit: 'м.п.', price: 20, category: 'interior_decor' },
        'wrk_id_led_strip_ip65': { name: 'LED-лента IP65 (монтаж)', unit: 'м.п.', price: 30, category: 'interior_decor' },
        'wrk_id_led_profile': { name: 'LED-профиль алюминиевый', unit: 'м.п.', price: 30, category: 'interior_decor' },
        'wrk_id_led_neon_flex': { name: 'Неон-Flex (монтаж)', unit: 'м.п.', price: 50, category: 'interior_decor' },
        'wrk_id_led_dimmer_ctrl': { name: 'Контроллер LED (диммер/RGB)', unit: 'шт', price: 100, category: 'interior_decor' },
        'wrk_id_led_recessed': { name: 'Светильник точечный встраиваемый', unit: 'шт', price: 50, category: 'interior_decor' },
        'wrk_id_led_track_rail': { name: 'Трек (шинопровод)', unit: 'м.п.', price: 50, category: 'interior_decor' },
        'wrk_id_led_panel_600': { name: 'Светодиодная панель 600×600', unit: 'шт', price: 100, category: 'interior_decor' },
        'wrk_id_led_pendant': { name: 'Подвесной светильник (монтаж)', unit: 'шт', price: 200, category: 'interior_decor' },
    };
})();
