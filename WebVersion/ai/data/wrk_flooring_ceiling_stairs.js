// === ФАЗА 3: НАПОЛЬНЫЕ ПОКРЫТИЯ (ВСЕ ВИДЫ), ПОТОЛКИ ПОДВЕСНЫЕ, ЛЕСТНИЦЫ (250 поз.) ===
(function () {
    // === НАПОЛЬНЫЕ ПОКРЫТИЯ ===
    window.AI_WRK_FLOORING_EXT = {
        // Ламинат (детально)
        'wrk_flr_lam_31_7': { name: 'Ламинат 31 класс 7мм', unit: 'м²', price: 100, category: 'flooring_ext' },
        'wrk_flr_lam_31_8': { name: 'Ламинат 31 класс 8мм', unit: 'м²', price: 120, category: 'flooring_ext' },
        'wrk_flr_lam_32_8': { name: 'Ламинат 32 класс 8мм', unit: 'м²', price: 130, category: 'flooring_ext' },
        'wrk_flr_lam_32_10': { name: 'Ламинат 32 класс 10мм', unit: 'м²', price: 150, category: 'flooring_ext' },
        'wrk_flr_lam_32_12': { name: 'Ламинат 32 класс 12мм', unit: 'м²', price: 180, category: 'flooring_ext' },
        'wrk_flr_lam_33_8': { name: 'Ламинат 33 класс 8мм', unit: 'м²', price: 150, category: 'flooring_ext' },
        'wrk_flr_lam_33_10': { name: 'Ламинат 33 класс 10мм', unit: 'м²', price: 180, category: 'flooring_ext' },
        'wrk_flr_lam_33_12': { name: 'Ламинат 33 класс 12мм', unit: 'м²', price: 200, category: 'flooring_ext' },
        'wrk_flr_lam_34_12': { name: 'Ламинат 34 класс 12мм', unit: 'м²', price: 250, category: 'flooring_ext' },
        'wrk_flr_lam_vfboard': { name: 'Ламинат с фаской', unit: 'м²', price: 160, category: 'flooring_ext' },
        // Паркет / инженерная доска
        'wrk_flr_parquet_strip': { name: 'Штучный паркет', unit: 'м²', price: 300, category: 'flooring_ext' },
        'wrk_flr_parquet_versai': { name: 'Паркет «Версаль»', unit: 'м²', price: 600, category: 'flooring_ext' },
        'wrk_flr_eng_board': { name: 'Инженерная доска', unit: 'м²', price: 250, category: 'flooring_ext' },
        'wrk_flr_eng_board_xl': { name: 'Инженерная доска (широкая)', unit: 'м²', price: 300, category: 'flooring_ext' },
        'wrk_flr_mass_board': { name: 'Массивная доска', unit: 'м²', price: 400, category: 'flooring_ext' },
        'wrk_flr_parquet_oil': { name: 'Масло для паркета', unit: 'м²', price: 80, category: 'flooring_ext' },
        'wrk_flr_parquet_tint': { name: 'Тонировка паркета', unit: 'м²', price: 50, category: 'flooring_ext' },
        // Линолеум
        'wrk_flr_lino_comm': { name: 'Линолеум коммерческий', unit: 'м²', price: 80, category: 'flooring_ext' },
        'wrk_flr_lino_semi': { name: 'Линолеум полукоммерческий', unit: 'м²', price: 60, category: 'flooring_ext' },
        'wrk_flr_lino_household': { name: 'Линолеум бытовой', unit: 'м²', price: 40, category: 'flooring_ext' },
        'wrk_flr_lino_nat': { name: 'Мармолеум (натуральный линолеум)', unit: 'м²', price: 150, category: 'flooring_ext' },
        'wrk_flr_lino_weld': { name: 'Сварка стыков линолеума', unit: 'м.п.', price: 30, category: 'flooring_ext' },
        // Кварцвинил / LVT
        'wrk_flr_lvt_click_4': { name: 'Кварцвинил замковый 4мм', unit: 'м²', price: 150, category: 'flooring_ext' },
        'wrk_flr_lvt_click_5': { name: 'Кварцвинил замковый 5мм', unit: 'м²', price: 180, category: 'flooring_ext' },
        'wrk_flr_lvt_click_6': { name: 'Кварцвинил замковый 6мм', unit: 'м²', price: 200, category: 'flooring_ext' },
        'wrk_flr_lvt_glue_2': { name: 'Кварцвинил клеевой 2мм', unit: 'м²', price: 120, category: 'flooring_ext' },
        'wrk_flr_lvt_glue_3': { name: 'Кварцвинил клеевой 3мм', unit: 'м²', price: 150, category: 'flooring_ext' },
        'wrk_flr_lvt_herring': { name: 'Кварцвинил «ёлочка»', unit: 'м²', price: 200, category: 'flooring_ext' },
        'wrk_flr_lvt_spc': { name: 'SPC-плитка (каменный полимер)', unit: 'м²', price: 180, category: 'flooring_ext' },
        // Ковролин
        'wrk_flr_carpet_roll': { name: 'Ковролин рулонный', unit: 'м²', price: 60, category: 'flooring_ext' },
        'wrk_flr_carpet_tile': { name: 'Ковровая плитка 50×50', unit: 'м²', price: 100, category: 'flooring_ext' },
        'wrk_flr_carpet_tile_prem': { name: 'Ковровая плитка (премиум)', unit: 'м²', price: 150, category: 'flooring_ext' },
        'wrk_flr_carpet_demo': { name: 'Демонтаж ковролина', unit: 'м²', price: 15, category: 'flooring_ext' },
        // Пробка
        // Подложка
        'wrk_flr_underlay_pe_2': { name: 'Подложка ПЭ 2мм', unit: 'м²', price: 5, category: 'flooring_ext' },
        'wrk_flr_underlay_pe_3': { name: 'Подложка ПЭ 3мм', unit: 'м²', price: 8, category: 'flooring_ext' },
        'wrk_flr_underlay_cork_2': { name: 'Подложка пробковая 2мм', unit: 'м²', price: 30, category: 'flooring_ext' },
        'wrk_flr_underlay_cork_3': { name: 'Подложка пробковая 3мм', unit: 'м²', price: 40, category: 'flooring_ext' },
        'wrk_flr_underlay_xps_3': { name: 'Подложка XPS 3мм', unit: 'м²', price: 15, category: 'flooring_ext' },
        'wrk_flr_underlay_xps_5': { name: 'Подложка XPS 5мм', unit: 'м²', price: 20, category: 'flooring_ext' },
        'wrk_flr_underlay_tuplex': { name: 'Подложка Tuplex', unit: 'м²', price: 20, category: 'flooring_ext' },
        'wrk_flr_underlay_quiet': { name: 'Подложка шумоизолирующая', unit: 'м²', price: 25, category: 'flooring_ext' },
        // Порожки
        'wrk_flr_threshold_alu': { name: 'Порожек алюминиевый', unit: 'шт', price: 50, category: 'flooring_ext' },
        'wrk_flr_threshold_hidden': { name: 'Скрытый порожек', unit: 'м.п.', price: 100, category: 'flooring_ext' }
    };

    // === ПОДВЕСНЫЕ/НАТЯЖНЫЕ ПОТОЛКИ (расширение) ===
    window.AI_WRK_CEILING_EXT = {
        // Натяжные потолки
        'wrk_cl_stretch_pvc_white': { name: 'Натяжной ПВХ белый матовый', unit: 'м²', price: 150, category: 'ceiling_ext' },
        'wrk_cl_stretch_pvc_gloss': { name: 'Натяжной ПВХ глянцевый', unit: 'м²', price: 180, category: 'ceiling_ext' },
        'wrk_cl_stretch_pvc_color': { name: 'Натяжной ПВХ цветной', unit: 'м²', price: 200, category: 'ceiling_ext' },
        'wrk_cl_stretch_pvc_photo': { name: 'Натяжной фотопечать', unit: 'м²', price: 500, category: 'ceiling_ext' },
        'wrk_cl_stretch_pvc_star': { name: 'Натяжной «звёздное небо»', unit: 'м²', price: 800, category: 'ceiling_ext' },
        'wrk_cl_stretch_fabric': { name: 'Натяжной тканевый', unit: 'м²', price: 300, category: 'ceiling_ext' },
        'wrk_cl_stretch_2level': { name: 'Натяжной двухуровневый', unit: 'м²', price: 400, category: 'ceiling_ext' },
        'wrk_cl_stretch_3level': { name: 'Натяжной трёхуровневый', unit: 'м²', price: 600, category: 'ceiling_ext' },
        'wrk_cl_stretch_light_line': { name: 'Световая линия (натяжной)', unit: 'м.п.', price: 300, category: 'ceiling_ext' },
        'wrk_cl_stretch_light_box': { name: 'Светящийся потолок (полностью)', unit: 'м²', price: 500, category: 'ceiling_ext' },
        'wrk_cl_stretch_spot_hole': { name: 'Отверстие под светильник', unit: 'шт', price: 50, category: 'ceiling_ext' },
        // Подвесные потолки (ГКЛ)
        'wrk_cl_gkl_1level': { name: 'Потолок ГКЛ (1 уровень)', unit: 'м²', price: 300, category: 'ceiling_ext' },
        'wrk_cl_gkl_2level': { name: 'Потолок ГКЛ (2 уровня)', unit: 'м²', price: 500, category: 'ceiling_ext' },
        'wrk_cl_gkl_3level': { name: 'Потолок ГКЛ (3 уровня)', unit: 'м²', price: 700, category: 'ceiling_ext' },
        'wrk_cl_gkl_curve': { name: 'Потолок ГКЛ (криволинейный)', unit: 'м²', price: 600, category: 'ceiling_ext' },
        'wrk_cl_gkl_light_niche': { name: 'Световой карниз ГКЛ', unit: 'м.п.', price: 150, category: 'ceiling_ext' },
        'wrk_cl_gkl_gklv': { name: 'Потолок ГКЛВ (влагостойкий)', unit: 'м²', price: 350, category: 'ceiling_ext' },
        // Подвесные потолки (другие)
        'wrk_cl_armstrong_basic': { name: 'Потолок Armstrong (базовый)', unit: 'м²', price: 150, category: 'ceiling_ext' },
        'wrk_cl_armstrong_acoustic': { name: 'Потолок Armstrong (акустический)', unit: 'м²', price: 250, category: 'ceiling_ext' },
        'wrk_cl_armstrong_hygiene': { name: 'Потолок Armstrong (гигиенический)', unit: 'м²', price: 300, category: 'ceiling_ext' },
        'wrk_cl_metal_panel': { name: 'Металлический реечный', unit: 'м²', price: 200, category: 'ceiling_ext' },
        'wrk_cl_wood_panel': { name: 'Деревянный реечный', unit: 'м²', price: 300, category: 'ceiling_ext' },
        'wrk_cl_baffle_wood': { name: 'Баффл деревянный', unit: 'м.п.', price: 200, category: 'ceiling_ext' },
        'wrk_cl_baffle_metal': { name: 'Баффл металлический', unit: 'м.п.', price: 150, category: 'ceiling_ext' }
    };

    // === ЛЕСТНИЦЫ (ВСЕ ВИДЫ) ===
    window.AI_WRK_STAIRS = {
        'wrk_str_concrete_mono': { name: 'Лестница монолитная (бетон)', unit: 'марш', price: 15000, category: 'stairs' },
        'wrk_str_concrete_prefab': { name: 'Лестница сборная ж/б', unit: 'марш', price: 10000, category: 'stairs' },
        'wrk_str_metal_frame': { name: 'Каркас лестницы (металл)', unit: 'марш', price: 8000, category: 'stairs' },
        'wrk_str_metal_spiral': { name: 'Лестница винтовая (металл)', unit: 'шт', price: 20000, category: 'stairs' },
        'wrk_str_wood_straight': { name: 'Лестница деревянная (прямая)', unit: 'марш', price: 15000, category: 'stairs' },
        'wrk_str_wood_turn': { name: 'Лестница деревянная (с поворотом)', unit: 'марш', price: 20000, category: 'stairs' },
        'wrk_str_wood_spiral': { name: 'Лестница деревянная (винтовая)', unit: 'шт', price: 30000, category: 'stairs' },
        'wrk_str_clad_wood': { name: 'Облицовка бетонной лестницы деревом', unit: 'ступень', price: 1000, category: 'stairs' },
        'wrk_str_clad_granite': { name: 'Облицовка лестницы гранитом', unit: 'ступень', price: 2000, category: 'stairs' },
        'wrk_str_railing_metal': { name: 'Перила металлические', unit: 'м.п.', price: 500, category: 'stairs' },
        'wrk_str_railing_ss': { name: 'Перила нержавейка', unit: 'м.п.', price: 800, category: 'stairs' },
        'wrk_str_railing_glass': { name: 'Перила стеклянные', unit: 'м.п.', price: 1500, category: 'stairs' },
        'wrk_str_railing_wood': { name: 'Перила деревянные', unit: 'м.п.', price: 400, category: 'stairs' },
        'wrk_str_railing_forged': { name: 'Перила кованые', unit: 'м.п.', price: 2000, category: 'stairs' },
        'wrk_str_railing_combo': { name: 'Перила комбинированные', unit: 'м.п.', price: 1200, category: 'stairs' },
        'wrk_str_baluster_wood': { name: 'Балясина деревянная', unit: 'шт', price: 100, category: 'stairs' },
        'wrk_str_baluster_metal': { name: 'Балясина металлическая', unit: 'шт', price: 200, category: 'stairs' },
        'wrk_str_nosing': { name: 'Противоскользящий профиль', unit: 'м.п.', price: 50, category: 'stairs' },
        'wrk_str_led_step': { name: 'LED подсветка ступеней', unit: 'ступень', price: 200, category: 'stairs' }
    };
})();
