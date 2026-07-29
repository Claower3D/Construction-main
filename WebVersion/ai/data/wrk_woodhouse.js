// === ДЕРЕВЯННОЕ ДОМОСТРОЕНИЕ — каркас, брус, бревно, CLT, SIP (60 поз.) ===
(function () {
    window.AI_WRK_WOODHOUSE = {
        // === КАРКАСНЫЙ ДОМ === (1-10)
        'wrk_wh_frame_floor': { name: 'Каркасное перекрытие', unit: 'м²', price: 1500, category: 'woodhouse' },
        'wrk_wh_frame_roof': { name: 'Каркасная кровля', unit: 'м²', price: 1800, category: 'woodhouse' },
        'wrk_wh_frame_insul_150': { name: 'Утепление каркаса 150мм', unit: 'м²', price: 350, category: 'woodhouse' },
        'wrk_wh_frame_insul_200': { name: 'Утепление каркаса 200мм', unit: 'м²', price: 500, category: 'woodhouse' },
        // === БРУС === (11-22)
        'wrk_wh_timber_150x150': { name: 'Сборка стен из бруса 150×150', unit: 'м²', price: 2500, category: 'woodhouse' },
        'wrk_wh_timber_150x200': { name: 'Сборка стен из бруса 150×200', unit: 'м²', price: 3000, category: 'woodhouse' },
        'wrk_wh_timber_200x200': { name: 'Сборка стен из бруса 200×200', unit: 'м²', price: 3500, category: 'woodhouse' },
        'wrk_wh_timber_glulam_150': { name: 'Сборка стен из клеёного бруса 150мм', unit: 'м²', price: 3500, category: 'woodhouse' },
        'wrk_wh_timber_glulam_200': { name: 'Сборка стен из клеёного бруса 200мм', unit: 'м²', price: 4500, category: 'woodhouse' },
        'wrk_wh_timber_profiled_150': { name: 'Сборка стен из профилированного бруса 150мм', unit: 'м²', price: 2800, category: 'woodhouse' },
        'wrk_wh_timber_profiled_200': { name: 'Сборка стен из профилированного бруса 200мм', unit: 'м²', price: 3200, category: 'woodhouse' },
        'wrk_wh_timber_caulk': { name: 'Конопатка (утепление межвенцового шва)', unit: 'м.п.', price: 80, category: 'woodhouse' },
        'wrk_wh_timber_sealant': { name: 'Герметизация межвенцовых швов', unit: 'м.п.', price: 120, category: 'woodhouse' },
        'wrk_wh_timber_nagel': { name: 'Установка нагелей', unit: 'шт', price: 50, category: 'woodhouse' },
        'wrk_wh_timber_shrinkage_comp': { name: 'Компенсаторы усадки', unit: 'шт', price: 550, category: 'woodhouse' },
        'wrk_wh_timber_antiseptic': { name: 'Обработка антисептиком', unit: 'м²', price: 120, category: 'woodhouse' },
        // === БРЕВНО === (23-29)
        'wrk_wh_log_natural_220': { name: 'Сборка сруба из бревна Ø220', unit: 'м²', price: 3500, category: 'woodhouse' },
        'wrk_wh_log_natural_260': { name: 'Сборка сруба из бревна Ø260', unit: 'м²', price: 4200, category: 'woodhouse' },
        'wrk_wh_log_natural_300': { name: 'Сборка сруба из бревна Ø300', unit: 'м²', price: 5000, category: 'woodhouse' },
        'wrk_wh_log_rounded_200': { name: 'Сборка из оцилиндрованного бревна Ø200', unit: 'м²', price: 2800, category: 'woodhouse' },
        'wrk_wh_log_rounded_240': { name: 'Сборка из оцилиндрованного бревна Ø240', unit: 'м²', price: 3500, category: 'woodhouse' },
        'wrk_wh_log_rounded_280': { name: 'Сборка из оцилиндрованного бревна Ø280', unit: 'м²', price: 4200, category: 'woodhouse' },
        'wrk_wh_log_chinking': { name: 'Шлифовка и покраска сруба', unit: 'м²', price: 550, category: 'woodhouse' },
        // === SIP === (30-35)
        'wrk_wh_sip_wall_124': { name: 'Монтаж SIP панели стеновой 124мм', unit: 'м²', price: 1500, category: 'woodhouse' },
        'wrk_wh_sip_wall_174': { name: 'Монтаж SIP панели стеновой 174мм', unit: 'м²', price: 1800, category: 'woodhouse' },
        'wrk_wh_sip_wall_224': { name: 'Монтаж SIP панели стеновой 224мм', unit: 'м²', price: 2200, category: 'woodhouse' },
        'wrk_wh_sip_floor': { name: 'Монтаж SIP панели перекрытия', unit: 'м²', price: 1500, category: 'woodhouse' },
        'wrk_wh_sip_roof': { name: 'Монтаж SIP панели кровельной', unit: 'м²', price: 1800, category: 'woodhouse' },
        'wrk_wh_sip_spline': { name: 'Монтаж соединительного бруса SIP', unit: 'м.п.', price: 250, category: 'woodhouse' },
        // === CLT === (36-40)
        'wrk_wh_clt_wall_100': { name: 'Монтаж CLT панели стеновой 100мм', unit: 'м²', price: 3500, category: 'woodhouse' },
        'wrk_wh_clt_wall_150': { name: 'Монтаж CLT панели стеновой 150мм', unit: 'м²', price: 4500, category: 'woodhouse' },
        'wrk_wh_clt_wall_200': { name: 'Монтаж CLT панели стеновой 200мм', unit: 'м²', price: 5500, category: 'woodhouse' },
        'wrk_wh_clt_floor_140': { name: 'Монтаж CLT панели перекрытия 140мм', unit: 'м²', price: 4500, category: 'woodhouse' },
        'wrk_wh_clt_floor_200': { name: 'Монтаж CLT панели перекрытия 200мм', unit: 'м²', price: 5500, category: 'woodhouse' },
        // === ДЕРЕВЯННЫЕ КОНСТРУКЦИИ === (41-50)
        'wrk_wh_glulam_beam': { name: 'Монтаж клеёной балки', unit: 'м.п.', price: 1200, category: 'woodhouse' },
        'wrk_wh_glulam_column': { name: 'Монтаж клеёной стойки', unit: 'шт', price: 5500, category: 'woodhouse' },
        'wrk_wh_glulam_arch': { name: 'Монтаж клеёной арки', unit: 'шт', price: 55000, category: 'woodhouse' },
        'wrk_wh_deck_board': { name: 'Монтаж террасной доски (дерево)', unit: 'м²', price: 850, category: 'woodhouse' },
        'wrk_wh_deck_wpc': { name: 'Монтаж террасной доски (ДПК)', unit: 'м²', price: 1200, category: 'woodhouse' },
        'wrk_wh_deck_subframe': { name: 'Монтаж лаг террасы', unit: 'м²', price: 450, category: 'woodhouse' },
        'wrk_wh_fireretardant': { name: 'Огнезащитная обработка дерева', unit: 'м²', price: 180, category: 'woodhouse' },
        'wrk_wh_stain_exterior': { name: 'Покраска/пропитка фасада (дерево)', unit: 'м²', price: 350, category: 'woodhouse' },
        'wrk_wh_stain_interior': { name: 'Покраска/лакировка (дерево, интерьер)', unit: 'м²', price: 280, category: 'woodhouse' },
        'wrk_wh_wood_ceiling': { name: 'Монтаж деревянного потолка (вагонка)', unit: 'м²', price: 550, category: 'woodhouse' }
    };
})();
