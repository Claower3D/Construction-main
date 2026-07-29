// === ФАЗА 3: ДЕРЕВЯННОЕ ДОМОСТРОЕНИЕ, КАРКАСНЫЕ ДОМА, КРОВЕЛЬНЫЕ СИСТЕМЫ, ОБРАБОТКА ДРЕВЕСИНЫ (160 поз.) ===
(function () {
    window.AI_WRK_WOOD_CONSTRUCTION = {
        // === ДЕРЕВЯННЫЕ ДОМА (БРУС) ===
        'wrk_wood_beam_prof_150': { name: 'Сруб из проф. бруса 150×150', unit: 'м²', price: 3000, category: 'wood_construction' },
        'wrk_wood_beam_prof_200': { name: 'Сруб из проф. бруса 200×200', unit: 'м²', price: 4000, category: 'wood_construction' },
        'wrk_wood_beam_glulam_180': { name: 'Сруб из клеёного бруса 180мм', unit: 'м²', price: 5000, category: 'wood_construction' },
        'wrk_wood_beam_glulam_220': { name: 'Сруб из клеёного бруса 220мм', unit: 'м²', price: 6000, category: 'wood_construction' },
        'wrk_wood_log_round_200': { name: 'Сруб из оцилиндр. бревна Ø200', unit: 'м²', price: 3500, category: 'wood_construction' },
        'wrk_wood_log_round_240': { name: 'Сруб из оцилиндр. бревна Ø240', unit: 'м²', price: 4500, category: 'wood_construction' },
        'wrk_wood_log_round_280': { name: 'Сруб из оцилиндр. бревна Ø280', unit: 'м²', price: 5500, category: 'wood_construction' },
        'wrk_wood_log_hand': { name: 'Сруб ручной рубки', unit: 'м²', price: 7000, category: 'wood_construction' },
        'wrk_wood_clt_panel': { name: 'Панель CLT (монтаж)', unit: 'м²', price: 4000, category: 'wood_construction' },
        'wrk_wood_post_beam': { name: 'Стоечно-балочный каркас (фахверк)', unit: 'м²', price: 4000, category: 'wood_construction' },
        // Конопатка / герметизация
        'wrk_wood_caulk_jute': { name: 'Конопатка (джут)', unit: 'м.п.', price: 30, category: 'wood_construction' },
        'wrk_wood_caulk_moss': { name: 'Конопатка (мох)', unit: 'м.п.', price: 40, category: 'wood_construction' },
        'wrk_wood_sealant_warm': { name: 'Тёплый шов (герметик)', unit: 'м.п.', price: 80, category: 'wood_construction' },
        'wrk_wood_sealant_acrylic': { name: 'Акриловый герметик (межвенцовый)', unit: 'м.п.', price: 50, category: 'wood_construction' },

        // === КАРКАСНОЕ ДОМОСТРОЕНИЕ ===
        'wrk_frame_wall_150': { name: 'Каркасная стена 150мм', unit: 'м²', price: 1500, category: 'wood_construction' },
        'wrk_frame_wall_200': { name: 'Каркасная стена 200мм', unit: 'м²', price: 2000, category: 'wood_construction' },
        'wrk_frame_wall_250': { name: 'Каркасная стена 250мм', unit: 'м²', price: 2500, category: 'wood_construction' },
        'wrk_frame_wall_double': { name: 'Двойной каркас (скандинавский)', unit: 'м²', price: 3000, category: 'wood_construction' },
        'wrk_frame_floor_200': { name: 'Перекрытие каркасное 200мм', unit: 'м²', price: 1000, category: 'wood_construction' },
        'wrk_frame_floor_250': { name: 'Перекрытие каркасное 250мм', unit: 'м²', price: 1200, category: 'wood_construction' },
        'wrk_frame_roof_simple': { name: 'Стропильная система (каркас)', unit: 'м²', price: 800, category: 'wood_construction' },
        'wrk_frame_sip_panel_174': { name: 'SIP-панель 174мм (монтаж)', unit: 'м²', price: 1800, category: 'wood_construction' },
        'wrk_frame_sip_panel_224': { name: 'SIP-панель 224мм (монтаж)', unit: 'м²', price: 2200, category: 'wood_construction' },
        'wrk_frame_osb_ext': { name: 'Обшивка OSB (наружная)', unit: 'м²', price: 100, category: 'wood_construction' },
        'wrk_frame_osb_int': { name: 'Обшивка OSB (внутренняя)', unit: 'м²', price: 80, category: 'wood_construction' },
        'wrk_frame_insul_mw_150': { name: 'Утепление каркаса 150мм (минвата)', unit: 'м²', price: 100, category: 'wood_construction' },
        'wrk_frame_insul_mw_200': { name: 'Утепление каркаса 200мм (минвата)', unit: 'м²', price: 130, category: 'wood_construction' },
        'wrk_frame_insul_mw_250': { name: 'Утепление каркаса 250мм (минвата)', unit: 'м²', price: 160, category: 'wood_construction' },
        'wrk_frame_insul_cellulose': { name: 'Эковата (задувка в каркас)', unit: 'м³', price: 1500, category: 'wood_construction' },

        // === ОБРАБОТКА ДРЕВЕСИНЫ ===
        'wrk_wood_treat_antiseptic': { name: 'Антисептирование древесины', unit: 'м²', price: 20, category: 'wood_construction' },
        'wrk_wood_treat_fire': { name: 'Огнебиозащита (1 группа)', unit: 'м²', price: 30, category: 'wood_construction' },
        'wrk_wood_treat_fire_2': { name: 'Огнебиозащита (2 группа)', unit: 'м²', price: 20, category: 'wood_construction' },
        'wrk_wood_treat_lacquer': { name: 'Покрытие лаком (дерево)', unit: 'м²', price: 40, category: 'wood_construction' },
        'wrk_wood_treat_oil': { name: 'Покрытие маслом (дерево)', unit: 'м²', price: 30, category: 'wood_construction' },
        'wrk_wood_treat_wax': { name: 'Покрытие воском', unit: 'м²', price: 40, category: 'wood_construction' },
        'wrk_wood_treat_stain': { name: 'Морилка (тонировка)', unit: 'м²', price: 20, category: 'wood_construction' },
        'wrk_wood_treat_bleach': { name: 'Отбеливание древесины', unit: 'м²', price: 30, category: 'wood_construction' },
        'wrk_wood_treat_sand': { name: 'Шлифовка древесины', unit: 'м²', price: 30, category: 'wood_construction' },
        'wrk_wood_treat_paint_ext': { name: 'Покраска фасада (дерево)', unit: 'м²', price: 50, category: 'wood_construction' },

        // === ВАГОНКА / ИМИТАЦИЯ БРУСА ===
        'wrk_wood_lining_pine': { name: 'Вагонка сосна (обшивка)', unit: 'м²', price: 100, category: 'wood_construction' },
        'wrk_wood_lining_lipa': { name: 'Вагонка липа (обшивка)', unit: 'м²', price: 150, category: 'wood_construction' },
        'wrk_wood_lining_cedar': { name: 'Вагонка кедр (обшивка)', unit: 'м²', price: 200, category: 'wood_construction' },
        'wrk_wood_lining_larch': { name: 'Вагонка лиственница (обшивка)', unit: 'м²', price: 180, category: 'wood_construction' },
        'wrk_wood_imit_brus_20': { name: 'Имитация бруса 20мм', unit: 'м²', price: 150, category: 'wood_construction' },
        'wrk_wood_imit_brus_28': { name: 'Имитация бруса 28мм', unit: 'м²', price: 200, category: 'wood_construction' },
        'wrk_wood_imit_brus_35': { name: 'Имитация бруса 35мм', unit: 'м²', price: 250, category: 'wood_construction' },
        'wrk_wood_block_house_28': { name: 'Блок-хаус 28мм (обшивка)', unit: 'м²', price: 200, category: 'wood_construction' },
        'wrk_wood_block_house_36': { name: 'Блок-хаус 36мм (обшивка)', unit: 'м²', price: 250, category: 'wood_construction' },
        'wrk_wood_block_house_45': { name: 'Блок-хаус 45мм (обшивка)', unit: 'м²', price: 300, category: 'wood_construction' },
        'wrk_wood_planken_20': { name: 'Планкен (обшивка) 20мм', unit: 'м²', price: 250, category: 'wood_construction' },
        'wrk_wood_planken_thermo': { name: 'Термопланкен', unit: 'м²', price: 350, category: 'wood_construction' },

        // === ПЕРЕКРЫТИЯ ДЕРЕВЯННЫЕ ===
        'wrk_wood_joist_50x150': { name: 'Балки перекрытия 50×150', unit: 'м.п.', price: 30, category: 'wood_construction' },
        'wrk_wood_joist_50x200': { name: 'Балки перекрытия 50×200', unit: 'м.п.', price: 40, category: 'wood_construction' },
        'wrk_wood_joist_50x250': { name: 'Балки перекрытия 50×250', unit: 'м.п.', price: 50, category: 'wood_construction' },
        'wrk_wood_joist_100x200': { name: 'Балки перекрытия 100×200', unit: 'м.п.', price: 60, category: 'wood_construction' },
        'wrk_wood_joist_lvl': { name: 'Балка LVL (клеёная)', unit: 'м.п.', price: 100, category: 'wood_construction' },
        'wrk_wood_joist_i_beam': { name: 'Двутавровая балка (дерево)', unit: 'м.п.', price: 80, category: 'wood_construction' },
        'wrk_wood_subfloor_board': { name: 'Черновой пол (доска)', unit: 'м²', price: 100, category: 'wood_construction' },
        'wrk_wood_subfloor_osb': { name: 'Черновой пол (OSB)', unit: 'м²', price: 80, category: 'wood_construction' },
        'wrk_wood_subfloor_plywood': { name: 'Черновой пол (фанера)', unit: 'м²', price: 100, category: 'wood_construction' }
    };
})();
