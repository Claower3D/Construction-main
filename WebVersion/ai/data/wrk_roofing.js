// === КАТАЛОГ РАБОТ: КРОВЕЛЬНЫЕ РАБОТЫ — ПОЛНЫЙ ЦИКЛ (200 позиций) ===
(function () {
    window.AI_WRK_ROOFING = {
        // Стропильная система
        'wrk_roof_mauerlat_100x150': { name: 'Монтаж мауэрлата 100×150мм', unit: 'м.п.', price: 150, category: 'roofing' },
        'wrk_roof_mauerlat_150x150': { name: 'Монтаж мауэрлата 150×150мм', unit: 'м.п.', price: 180, category: 'roofing' },
        'wrk_roof_mauerlat_150x200': { name: 'Монтаж мауэрлата 150×200мм', unit: 'м.п.', price: 200, category: 'roofing' },
        'wrk_roof_rafter_50x150': { name: 'Монтаж стропил 50×150мм', unit: 'м.п.', price: 120, category: 'roofing' },
        'wrk_roof_rafter_50x200': { name: 'Монтаж стропил 50×200мм', unit: 'м.п.', price: 150, category: 'roofing' },
        'wrk_roof_rafter_50x250': { name: 'Монтаж стропил 50×250мм', unit: 'м.п.', price: 180, category: 'roofing' },
        'wrk_roof_rafter_100x200': { name: 'Монтаж стропил 100×200мм (двойные)', unit: 'м.п.', price: 200, category: 'roofing' },
        'wrk_roof_rafter_steel': { name: 'Монтаж стропил стальных', unit: 'м.п.', price: 350, category: 'roofing' },
        'wrk_roof_rafter_truss': { name: 'Монтаж стропильных ферм', unit: 'шт', price: 2000, category: 'roofing' },
        'wrk_roof_ridge_beam': { name: 'Монтаж конькового бруса', unit: 'м.п.', price: 200, category: 'roofing' },
        'wrk_roof_strut': { name: 'Монтаж подкосов/стоек', unit: 'шт', price: 200, category: 'roofing' },
        'wrk_roof_collar_tie': { name: 'Монтаж затяжек', unit: 'м.п.', price: 100, category: 'roofing' },
        // Обрешётка
        'wrk_roof_battens_25x100_350': { name: 'Обрешётка 25×100 шаг 350мм', unit: 'м²', price: 80, category: 'roofing' },
        'wrk_roof_battens_25x100_400': { name: 'Обрешётка 25×100 шаг 400мм', unit: 'м²', price: 70, category: 'roofing' },
        'wrk_roof_battens_32x100_350': { name: 'Обрешётка 32×100 шаг 350мм', unit: 'м²', price: 90, category: 'roofing' },
        'wrk_roof_counter_battens': { name: 'Контробрешётка 30×50', unit: 'м²', price: 60, category: 'roofing' },
        'wrk_roof_osb_9': { name: 'Сплошной настил OSB-3 9мм', unit: 'м²', price: 120, category: 'roofing' },
        'wrk_roof_osb_12': { name: 'Сплошной настил OSB-3 12мм', unit: 'м²', price: 140, category: 'roofing' },
        'wrk_roof_plywood_12': { name: 'Сплошной настил фанера 12мм', unit: 'м²', price: 150, category: 'roofing' },
        'wrk_roof_sheathing_board': { name: 'Сплошной настил из доски', unit: 'м²', price: 130, category: 'roofing' },
        // Металлочерепица
        'wrk_roof_mt_monterrey': { name: 'Монтаж металлочерепицы Монтеррей', unit: 'м²', price: 250, category: 'roofing' },
        'wrk_roof_mt_supermonterrey': { name: 'Монтаж металлочерепицы Суперм.', unit: 'м²', price: 270, category: 'roofing' },
        'wrk_roof_mt_kaskad': { name: 'Монтаж металлочерепицы Каскад', unit: 'м²', price: 280, category: 'roofing' },
        'wrk_roof_mt_kvinta': { name: 'Монтаж металлочерепицы Квинта', unit: 'м²', price: 300, category: 'roofing' },
        // Профнастил
        'wrk_roof_prof_c8': { name: 'Монтаж профнастила С-8', unit: 'м²', price: 180, category: 'roofing' },
        'wrk_roof_prof_c20': { name: 'Монтаж профнастила С-20', unit: 'м²', price: 200, category: 'roofing' },
        'wrk_roof_prof_c21': { name: 'Монтаж профнастила С-21', unit: 'м²', price: 200, category: 'roofing' },
        'wrk_roof_prof_hc35': { name: 'Монтаж профнастила НС-35', unit: 'м²', price: 220, category: 'roofing' },
        'wrk_roof_prof_h60': { name: 'Монтаж профнастила Н-60', unit: 'м²', price: 250, category: 'roofing' },
        'wrk_roof_prof_h75': { name: 'Монтаж профнастила Н-75', unit: 'м²', price: 280, category: 'roofing' },
        // Гибкая черепица
        'wrk_roof_shingle_single': { name: 'Монтаж гибкой черепицы (однослойная)', unit: 'м²', price: 300, category: 'roofing' },
        'wrk_roof_shingle_multi': { name: 'Монтаж гибкой черепицы (многослойная)', unit: 'м²', price: 350, category: 'roofing' },
        'wrk_roof_shingle_premium': { name: 'Монтаж гибкой черепицы (премиум)', unit: 'м²', price: 400, category: 'roofing' },
        // Натуральная черепица
        'wrk_roof_clay_tile': { name: 'Монтаж керамической черепицы', unit: 'м²', price: 450, category: 'roofing' },
        'wrk_roof_cement_tile': { name: 'Монтаж цементно-песчаной черепицы', unit: 'м²', price: 400, category: 'roofing' },
        // Композитная черепица
        'wrk_roof_composite_tile': { name: 'Монтаж композитной черепицы', unit: 'м²', price: 380, category: 'roofing' },
        // Фальцевая кровля
        'wrk_roof_falc_steel': { name: 'Монтаж фальцевой кровли (сталь)', unit: 'м²', price: 500, category: 'roofing' },
        'wrk_roof_falc_copper': { name: 'Монтаж фальцевой кровли (медь)', unit: 'м²', price: 1000, category: 'roofing' },
        'wrk_roof_falc_zinc': { name: 'Монтаж фальцевой кровли (цинк-титан)', unit: 'м²', price: 800, category: 'roofing' },
        'wrk_roof_falc_aluminum': { name: 'Монтаж фальцевой кровли (алюминий)', unit: 'м²', price: 700, category: 'roofing' },
        // Плоская кровля
        'wrk_roof_flat_pvc_1': { name: 'ПВХ мембрана 1.2мм', unit: 'м²', price: 250, category: 'roofing' },
        'wrk_roof_flat_pvc_15': { name: 'ПВХ мембрана 1.5мм', unit: 'м²', price: 280, category: 'roofing' },
        'wrk_roof_flat_bitumen_1': { name: 'Наплавляемая кровля 1 слой', unit: 'м²', price: 150, category: 'roofing' },
        'wrk_roof_flat_liquid': { name: 'Жидкая резина (напыление)', unit: 'м²', price: 400, category: 'roofing' },
        'wrk_roof_flat_mastic': { name: 'Мастичная кровля', unit: 'м²', price: 300, category: 'roofing' },
        // Прочие покрытия
        'wrk_roof_slate': { name: 'Монтаж шифера', unit: 'м²', price: 150, category: 'roofing' },
        'wrk_roof_onduline': { name: 'Монтаж ондулина', unit: 'м²', price: 180, category: 'roofing' },
        'wrk_roof_polycarbonate': { name: 'Монтаж поликарбоната', unit: 'м²', price: 250, category: 'roofing' },
        // Изоляция
        'wrk_roof_vapor_pe': { name: 'Пароизоляция плёнка ПЭ', unit: 'м²', price: 30, category: 'roofing' },
        'wrk_roof_vapor_special': { name: 'Пароизоляция спец.мембрана', unit: 'м²', price: 50, category: 'roofing' },
        'wrk_roof_wind_a': { name: 'Ветрозащита тип А', unit: 'м²', price: 30, category: 'roofing' },
        'wrk_roof_wind_am': { name: 'Гидроветрозащита тип АМ', unit: 'м²', price: 50, category: 'roofing' },
        'wrk_roof_wind_as': { name: 'Супердиффузионная мембрана АС', unit: 'м²', price: 70, category: 'roofing' },
        // Утепление кровли
        'wrk_roof_insul_mw_100': { name: 'Утепление кровли минватой 100мм', unit: 'м²', price: 150, category: 'roofing' },
        'wrk_roof_insul_mw_150': { name: 'Утепление кровли минватой 150мм', unit: 'м²', price: 200, category: 'roofing' },
        'wrk_roof_insul_mw_200': { name: 'Утепление кровли минватой 200мм', unit: 'м²', price: 250, category: 'roofing' },
        'wrk_roof_insul_mw_250': { name: 'Утепление кровли минватой 250мм', unit: 'м²', price: 300, category: 'roofing' },
        'wrk_roof_insul_mw_300': { name: 'Утепление кровли минватой 300мм', unit: 'м²', price: 350, category: 'roofing' },
        'wrk_roof_insul_pir_50': { name: 'Утепление кровли PIR 50мм', unit: 'м²', price: 250, category: 'roofing' },
        'wrk_roof_insul_pir_80': { name: 'Утепление кровли PIR 80мм', unit: 'м²', price: 350, category: 'roofing' },
        'wrk_roof_insul_pir_100': { name: 'Утепление кровли PIR 100мм', unit: 'м²', price: 400, category: 'roofing' },
        'wrk_roof_insul_flat_100': { name: 'Утепление плоской кровли 100мм', unit: 'м²', price: 200, category: 'roofing' },
        'wrk_roof_insul_flat_150': { name: 'Утепление плоской кровли 150мм', unit: 'м²', price: 280, category: 'roofing' },
        'wrk_roof_insul_flat_200': { name: 'Утепление плоской кровли 200мм', unit: 'м²', price: 350, category: 'roofing' },
        'wrk_roof_insul_flat_slope': { name: 'Устройство разуклонки', unit: 'м²', price: 200, category: 'roofing' },
        // Доборные элементы
        'wrk_roof_ridge_install': { name: 'Монтаж конька', unit: 'м.п.', price: 180, category: 'roofing' },
        'wrk_roof_ridge_round': { name: 'Монтаж полукруглого конька', unit: 'м.п.', price: 250, category: 'roofing' },
        'wrk_roof_endova_lower': { name: 'Монтаж ендовы нижней', unit: 'м.п.', price: 200, category: 'roofing' },
        'wrk_roof_endova_upper': { name: 'Монтаж ендовы верхней', unit: 'м.п.', price: 150, category: 'roofing' },
        'wrk_roof_drip_cornice': { name: 'Монтаж карнизной планки', unit: 'м.п.', price: 80, category: 'roofing' },
        'wrk_roof_drip_wind': { name: 'Монтаж ветровой (торцевой) планки', unit: 'м.п.', price: 80, category: 'roofing' },
        'wrk_roof_drip_wall': { name: 'Монтаж примыкания к стене', unit: 'м.п.', price: 150, category: 'roofing' },
        'wrk_roof_flashing': { name: 'Устройство обхода трубы (фартук)', unit: 'шт', price: 1500, category: 'roofing' },
        // Подшивка свесов
        'wrk_roof_soffit_pvc': { name: 'Подшивка свесов ПВХ софитами', unit: 'м.п.', price: 250, category: 'roofing' },
        'wrk_roof_soffit_metal': { name: 'Подшивка свесов металл. софитами', unit: 'м.п.', price: 280, category: 'roofing' },
        'wrk_roof_soffit_wood': { name: 'Подшивка свесов деревом', unit: 'м.п.', price: 300, category: 'roofing' },
        'wrk_roof_fascia_board': { name: 'Обшивка лобовой доски', unit: 'м.п.', price: 150, category: 'roofing' },
        // Водосточная система
        'wrk_roof_gutter_pvc_125': { name: 'Монтаж жёлоба ПВХ Ø125мм', unit: 'м.п.', price: 150, category: 'roofing' },
        'wrk_roof_gutter_metal_125': { name: 'Монтаж жёлоба металл Ø125мм', unit: 'м.п.', price: 180, category: 'roofing' },
        'wrk_roof_gutter_metal_150': { name: 'Монтаж жёлоба металл Ø150мм', unit: 'м.п.', price: 200, category: 'roofing' },
        'wrk_roof_gutter_copper': { name: 'Монтаж жёлоба медного', unit: 'м.п.', price: 400, category: 'roofing' },
        'wrk_roof_downpipe_pvc_87': { name: 'Монтаж водосточной трубы ПВХ Ø87мм', unit: 'м.п.', price: 150, category: 'roofing' },
        'wrk_roof_downpipe_metal_90': { name: 'Монтаж водосточной трубы металл Ø90мм', unit: 'м.п.', price: 180, category: 'roofing' },
        'wrk_roof_downpipe_metal_100': { name: 'Монтаж водосточной трубы металл Ø100мм', unit: 'м.п.', price: 200, category: 'roofing' },
        'wrk_roof_funnel': { name: 'Установка водосточной воронки', unit: 'шт', price: 200, category: 'roofing' },
        'wrk_roof_drain_internal': { name: 'Устройство внутреннего водостока', unit: 'шт', price: 3000, category: 'roofing' },
        // Снегозадержание
        'wrk_roof_snow_tube': { name: 'Монтаж трубчатого снегозадержателя', unit: 'м.п.', price: 250, category: 'roofing' },
        'wrk_roof_snow_grid': { name: 'Монтаж решётчатого снегозадержателя', unit: 'м.п.', price: 300, category: 'roofing' },
        'wrk_roof_snow_bracket': { name: 'Монтаж снегостопоров (точечных)', unit: 'шт', price: 30, category: 'roofing' },
        'wrk_roof_snow_log': { name: 'Монтаж бревенчатого снегозадержателя', unit: 'м.п.', price: 350, category: 'roofing' },
        // Безопасность
        'wrk_roof_ladder_wall': { name: 'Монтаж стеновой лестницы', unit: 'шт', price: 1500, category: 'roofing' },
        'wrk_roof_ladder_roof': { name: 'Монтаж кровельной лестницы', unit: 'шт', price: 2000, category: 'roofing' },
        'wrk_roof_walkway': { name: 'Монтаж переходного мостика', unit: 'м.п.', price: 400, category: 'roofing' },
        'wrk_roof_anchor_point': { name: 'Установка точки страховки', unit: 'шт', price: 500, category: 'roofing' },
        // Мансардные окна
        'wrk_roof_window_66x118': { name: 'Мансардное окно 66×118см', unit: 'шт', price: 2500, category: 'roofing' },
        'wrk_roof_window_frame': { name: 'Утепление оклада манс. окна', unit: 'шт', price: 500, category: 'roofing' },
        'wrk_roof_light_tunnel': { name: 'Установка светового тоннеля', unit: 'шт', price: 5000, category: 'roofing' },
        // Люки / выходы
        'wrk_roof_hatch_small': { name: 'Установка кровельного люка (малый)', unit: 'шт', price: 1500, category: 'roofing' },
        'wrk_roof_hatch_insulated': { name: 'Установка утеплённого кровельного люка', unit: 'шт', price: 3000, category: 'roofing' },
        // Проходки
        'wrk_roof_vent_pass_110': { name: 'Вентиляционная проходка Ø110мм', unit: 'шт', price: 600, category: 'roofing' },
        'wrk_roof_vent_pass_150': { name: 'Вентиляционная проходка Ø150мм', unit: 'шт', price: 800, category: 'roofing' },
        'wrk_roof_vent_pass_200': { name: 'Вентиляционная проходка Ø200мм', unit: 'шт', price: 1000, category: 'roofing' },
        'wrk_roof_chimney_pass_brick': { name: 'Проход дымохода кирпич через кровлю', unit: 'шт', price: 3000, category: 'roofing' },
        'wrk_roof_chimney_pass_sand': { name: 'Проход сэндвич-дымохода через кровлю', unit: 'шт', price: 2000, category: 'roofing' },
        'wrk_roof_antenna_pass': { name: 'Проход антенны/кабеля через кровлю', unit: 'шт', price: 300, category: 'roofing' },
        // Дымоходы
        'wrk_roof_chimney_sand_install': { name: 'Монтаж сэндвич-дымохода', unit: 'м.п.', price: 800, category: 'roofing' },
        // Обогрев кровли
        'wrk_roof_heating_gutter': { name: 'Кабельный обогрев жёлоба', unit: 'м.п.', price: 250, category: 'roofing' },
        'wrk_roof_heating_pipe': { name: 'Кабельный обогрев водосточной трубы', unit: 'м.п.', price: 250, category: 'roofing' },
        'wrk_roof_heating_edge': { name: 'Кабельный обогрев кромки кровли', unit: 'м.п.', price: 300, category: 'roofing' },
        'wrk_roof_heating_valley': { name: 'Кабельный обогрев ендовы', unit: 'м.п.', price: 300, category: 'roofing' },
        // Зелёная кровля
        // Демонтаж
        'wrk_roof_demo_bitumen': { name: 'Демонтаж наплавляемой кровли', unit: 'м²', price: 100, category: 'roofing' },
        'wrk_roof_demo_insulation': { name: 'Демонтаж утеплителя кровли', unit: 'м²', price: 30, category: 'roofing' },
        // Ремонт
        'wrk_roof_repair_leak_find': { name: 'Поиск протечки', unit: 'шт', price: 1000, category: 'roofing' },
        'wrk_roof_repair_leak_fix': { name: 'Устранение протечки', unit: 'шт', price: 1000, category: 'roofing' },
        'wrk_roof_repair_local': { name: 'Локальный ремонт (замена листов)', unit: 'м²', price: 400, category: 'roofing' },
        'wrk_roof_repair_flat_patch': { name: 'Ремонт плоской кровли (заплатка)', unit: 'м²', price: 300, category: 'roofing' },
        'wrk_roof_repair_rafter': { name: 'Замена стропила', unit: 'шт', price: 2000, category: 'roofing' },
        // Молниезащита
        // Проектирование
        'wrk_roof_project_simple': { name: 'Проект кровли (простая)', unit: 'шт', price: 5000, category: 'roofing' },
        'wrk_roof_project_complex': { name: 'Проект кровли (сложная)', unit: 'шт', price: 15000, category: 'roofing' }
    };
})();
