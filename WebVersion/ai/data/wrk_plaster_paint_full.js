// === ФАЗА 3: ШТУКАТУРНЫЕ И МАЛЯРНЫЕ РАБОТЫ (РАСШИРЕННЫЕ), ВСЕ ВИДЫ ДЕКОРАТИВНЫХ ШТУКАТУРОК (180 поз.) ===
(function () {
    window.AI_WRK_PLASTER_PAINT_FULL = {
        // === ШТУКАТУРНЫЕ РАБОТЫ (по типу, толщине, основанию) ===
        // Штукатурка стен
        'wrk_pst_wall_gypsum_10': { name: 'Штукатурка гипсовая стен 10мм', unit: 'м²', price: 60, category: 'plaster_paint_full' },
        'wrk_pst_wall_gypsum_20': { name: 'Штукатурка гипсовая стен 20мм', unit: 'м²', price: 80, category: 'plaster_paint_full' },
        'wrk_pst_wall_gypsum_30': { name: 'Штукатурка гипсовая стен 30мм', unit: 'м²', price: 100, category: 'plaster_paint_full' },
        'wrk_pst_wall_gypsum_40': { name: 'Штукатурка гипсовая стен 40мм', unit: 'м²', price: 120, category: 'plaster_paint_full' },
        'wrk_pst_wall_gypsum_50': { name: 'Штукатурка гипсовая стен 50мм', unit: 'м²', price: 150, category: 'plaster_paint_full' },
        'wrk_pst_wall_cement_10': { name: 'Штукатурка ЦПС стен 10мм', unit: 'м²', price: 50, category: 'plaster_paint_full' },
        'wrk_pst_wall_cement_20': { name: 'Штукатурка ЦПС стен 20мм', unit: 'м²', price: 70, category: 'plaster_paint_full' },
        'wrk_pst_wall_cement_30': { name: 'Штукатурка ЦПС стен 30мм', unit: 'м²', price: 90, category: 'plaster_paint_full' },
        'wrk_pst_wall_cement_40': { name: 'Штукатурка ЦПС стен 40мм', unit: 'м²', price: 110, category: 'plaster_paint_full' },
        'wrk_pst_wall_cement_50': { name: 'Штукатурка ЦПС стен 50мм', unit: 'м²', price: 130, category: 'plaster_paint_full' },
        'wrk_pst_wall_machine_10': { name: 'Машинная штукатурка стен 10мм', unit: 'м²', price: 40, category: 'plaster_paint_full' },
        'wrk_pst_wall_machine_20': { name: 'Машинная штукатурка стен 20мм', unit: 'м²', price: 55, category: 'plaster_paint_full' },
        'wrk_pst_wall_machine_30': { name: 'Машинная штукатурка стен 30мм', unit: 'м²', price: 70, category: 'plaster_paint_full' },
        'wrk_pst_wall_machine_40': { name: 'Машинная штукатурка стен 40мм', unit: 'м²', price: 90, category: 'plaster_paint_full' },
        'wrk_pst_wall_machine_50': { name: 'Машинная штукатурка стен 50мм', unit: 'м²', price: 110, category: 'plaster_paint_full' },
        // Штукатурка потолка
        'wrk_pst_ceil_gypsum_10': { name: 'Штукатурка гипс. потолка 10мм', unit: 'м²', price: 100, category: 'plaster_paint_full' },
        'wrk_pst_ceil_gypsum_20': { name: 'Штукатурка гипс. потолка 20мм', unit: 'м²', price: 130, category: 'plaster_paint_full' },
        'wrk_pst_ceil_gypsum_30': { name: 'Штукатурка гипс. потолка 30мм', unit: 'м²', price: 160, category: 'plaster_paint_full' },
        // Откосы
        'wrk_pst_slope_simple': { name: 'Штукатурка откосов (простая)', unit: 'м.п.', price: 50, category: 'plaster_paint_full' },
        'wrk_pst_slope_arched': { name: 'Штукатурка откосов (арочная)', unit: 'м.п.', price: 100, category: 'plaster_paint_full' },
        // Маяки/грунтовка
        'wrk_pst_primer_deep': { name: 'Грунтовка глубокого проник.', unit: 'м²', price: 8, category: 'plaster_paint_full' },
        'wrk_pst_mesh_glass': { name: 'Армирование сеткой (стекловолокно)', unit: 'м²', price: 15, category: 'plaster_paint_full' },
        'wrk_pst_mesh_metal': { name: 'Армирование сеткой (металл)', unit: 'м²', price: 20, category: 'plaster_paint_full' },
        'wrk_pst_corner_pvc': { name: 'Углозащитный профиль (ПВХ)', unit: 'м.п.', price: 5, category: 'plaster_paint_full' },
        'wrk_pst_corner_metal': { name: 'Углозащитный профиль (металл)', unit: 'м.п.', price: 8, category: 'plaster_paint_full' },

        // === ДЕКОРАТИВНЫЕ ШТУКАТУРКИ ===
        'wrk_deco_venetian_wax': { name: 'Вощение венецианки', unit: 'м²', price: 50, category: 'plaster_paint_full' },
        'wrk_deco_travertine': { name: 'Штукатурка «Травертин»', unit: 'м²', price: 300, category: 'plaster_paint_full' },
        'wrk_deco_marmorino': { name: 'Штукатурка «Марморино»', unit: 'м²', price: 400, category: 'plaster_paint_full' },
        'wrk_deco_tadelakt': { name: 'Штукатурка «Таделакт»', unit: 'м²', price: 500, category: 'plaster_paint_full' },
        'wrk_deco_bark_beetle': { name: 'Декоративная «короед» 2мм', unit: 'м²', price: 80, category: 'plaster_paint_full' },
        'wrk_deco_bark_beetle_3': { name: 'Декоративная «короед» 3мм', unit: 'м²', price: 100, category: 'plaster_paint_full' },
        'wrk_deco_lamb': { name: 'Декоративная «барашек» 1.5мм', unit: 'м²', price: 80, category: 'plaster_paint_full' },
        'wrk_deco_lamb_2': { name: 'Декоративная «барашек» 2мм', unit: 'м²', price: 100, category: 'plaster_paint_full' },
        'wrk_deco_silk': { name: 'Декоративная «шёлк»', unit: 'м²', price: 200, category: 'plaster_paint_full' },
        'wrk_deco_sand': { name: 'Декоративная «песок»', unit: 'м²', price: 150, category: 'plaster_paint_full' },
        'wrk_deco_concrete_effect': { name: 'Декоративная «бетон»', unit: 'м²', price: 200, category: 'plaster_paint_full' },
        'wrk_deco_rust_effect': { name: 'Декоративная «ржавчина»', unit: 'м²', price: 250, category: 'plaster_paint_full' },
        'wrk_deco_stone_effect': { name: 'Декоративная «камень»', unit: 'м²', price: 200, category: 'plaster_paint_full' },
        'wrk_deco_stucco_lustro': { name: 'Стукко Люстро', unit: 'м²', price: 400, category: 'plaster_paint_full' },
        'wrk_deco_micro_cement_bathroom': { name: 'Микроцемент (ванная)', unit: 'м²', price: 500, category: 'plaster_paint_full' },

        // === ШПАТЛЁВКА ===
        'wrk_ptty_wall_start': { name: 'Шпатлёвка стен стартовая', unit: 'м²', price: 30, category: 'plaster_paint_full' },
        'wrk_ptty_wall_finish': { name: 'Шпатлёвка стен финишная', unit: 'м²', price: 30, category: 'plaster_paint_full' },
        'wrk_ptty_wall_super': { name: 'Шпатлёвка стен (суперфиниш)', unit: 'м²', price: 40, category: 'plaster_paint_full' },
        'wrk_ptty_ceil_start': { name: 'Шпатлёвка потолка стартовая', unit: 'м²', price: 40, category: 'plaster_paint_full' },
        'wrk_ptty_ceil_finish': { name: 'Шпатлёвка потолка финишная', unit: 'м²', price: 40, category: 'plaster_paint_full' },
        'wrk_ptty_ceil_super': { name: 'Шпатлёвка потолка (суперфиниш)', unit: 'м²', price: 50, category: 'plaster_paint_full' },
        'wrk_ptty_gkl_joint': { name: 'Шпатлёвка стыков ГКЛ', unit: 'м.п.', price: 10, category: 'plaster_paint_full' },
        'wrk_ptty_gkl_screw': { name: 'Шпатлёвка саморезов ГКЛ', unit: 'шт', price: 1, category: 'plaster_paint_full' },
        'wrk_ptty_sand': { name: 'Шлифовка шпатлёвки (ручн.)', unit: 'м²', price: 15, category: 'plaster_paint_full' },
        'wrk_ptty_sand_machine': { name: 'Шлифовка шпатлёвки (машинн.)', unit: 'м²', price: 20, category: 'plaster_paint_full' },

        // === МАЛЯРНЫЕ РАБОТЫ ===
        'wrk_pnt_color_accent': { name: 'Покраска акцентной стены', unit: 'м²', price: 40, category: 'plaster_paint_full' },
        'wrk_pnt_stripe': { name: 'Покраска (геометрия/полосы)', unit: 'м²', price: 80, category: 'plaster_paint_full' },
        'wrk_pnt_ombre': { name: 'Покраска «омбре» (градиент)', unit: 'м²', price: 100, category: 'plaster_paint_full' },
        'wrk_pnt_stencil': { name: 'Покраска по трафарету', unit: 'м²', price: 80, category: 'plaster_paint_full' },
        'wrk_pnt_mural': { name: 'Художественная роспись', unit: 'м²', price: 1000, category: 'plaster_paint_full' },
        'wrk_pnt_radiator': { name: 'Покраска радиатора', unit: 'секция', price: 20, category: 'plaster_paint_full' },
        'wrk_pnt_pipe': { name: 'Покраска трубы', unit: 'м.п.', price: 15, category: 'plaster_paint_full' },
        'wrk_pnt_door': { name: 'Покраска двери', unit: 'шт', price: 300, category: 'plaster_paint_full' },
        'wrk_pnt_window_frame': { name: 'Покраска оконной рамы', unit: 'шт', price: 200, category: 'plaster_paint_full' },

        // === ОБОИ ===
        'wrk_wp_vinyl': { name: 'Обои виниловые', unit: 'м²', price: 30, category: 'plaster_paint_full' },
        'wrk_wp_flizelin': { name: 'Обои флизелиновые', unit: 'м²', price: 30, category: 'plaster_paint_full' },
        'wrk_wp_flizelin_paint': { name: 'Обои под покраску', unit: 'м²', price: 25, category: 'plaster_paint_full' },
        'wrk_wp_paper': { name: 'Обои бумажные', unit: 'м²', price: 20, category: 'plaster_paint_full' },
        'wrk_wp_silk_plaster': { name: 'Шёлковая штукатурка (обои)', unit: 'м²', price: 60, category: 'plaster_paint_full' },
    };
})();
