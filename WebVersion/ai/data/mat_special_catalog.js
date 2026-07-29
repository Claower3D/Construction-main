// === КАТАЛОГ СПЕЦИАЛЬНЫХ СТРОИТЕЛЬНЫХ МАТЕРИАЛОВ (100 позиций) ===
(function () {
    window.AI_MAT_SPECIAL_CATALOG = {
        // SIP-панели
        'sip_2500x1250x124': { name: 'SIP-панель 2500×1250×124мм (ППС)', unit: 'шт', price: 3000, category: 'special_catalog' },
        'sip_2500x1250x174': { name: 'SIP-панель 2500×1250×174мм (ППС)', unit: 'шт', price: 3500, category: 'special_catalog' },
        'sip_2500x1250x224': { name: 'SIP-панель 2500×1250×224мм (ППС)', unit: 'шт', price: 4200, category: 'special_catalog' },
        'sip_2800x1250x174': { name: 'SIP-панель 2800×1250×174мм (ППС)', unit: 'шт', price: 4000, category: 'special_catalog' },
        'sip_connector_bar_40x150': { name: 'Брус закладной для SIP 40×150мм (3м)', unit: 'шт', price: 200, category: 'special_catalog' },
        'sip_foam_750ml': { name: 'Пена монтажная для SIP (750мл)', unit: 'шт', price: 300, category: 'special_catalog' },
        // CLT (кросс-ламинированный брус)
        'clt_panel_100mm_m2': { name: 'CLT-панель 100мм (м²)', unit: 'м²', price: 8000, category: 'special_catalog' },
        'clt_panel_140mm_m2': { name: 'CLT-панель 140мм (м²)', unit: 'м²', price: 10000, category: 'special_catalog' },
        'clt_panel_200mm_m2': { name: 'CLT-панель 200мм (м²)', unit: 'м²', price: 14000, category: 'special_catalog' },
        // Композитные панели
        'composite_alum_4mm_1220x2440': { name: 'Композитная панель алюминий 4мм (1220×2440)', unit: 'лист', price: 3000, category: 'special_catalog' },
        'composite_alum_4mm_1500x4000': { name: 'Композитная панель алюминий 4мм (1500×4000)', unit: 'лист', price: 6000, category: 'special_catalog' },
        'composite_hpl_6mm_1300x3050': { name: 'HPL-панель 6мм (1300×3050)', unit: 'лист', price: 5000, category: 'special_catalog' },
        'composite_hpl_8mm_1300x3050': { name: 'HPL-панель 8мм (1300×3050)', unit: 'лист', price: 7000, category: 'special_catalog' },
        // Фиброцементные плиты
        'fibercement_8mm_1200x2400': { name: 'Фиброцемент. плита 8мм (1200×2400)', unit: 'лист', price: 1500, category: 'special_catalog' },
        'fibercement_10mm_1200x2400': { name: 'Фиброцемент. плита 10мм (1200×2400)', unit: 'лист', price: 2000, category: 'special_catalog' },
        'fibercement_12mm_1200x2400': { name: 'Фиброцемент. плита 12мм (1200×2400)', unit: 'лист', price: 2500, category: 'special_catalog' },
        'fibercement_cladding_m2': { name: 'Сайдинг фиброцементный (м²)', unit: 'м²', price: 1200, category: 'special_catalog' },
        // Геосинтетика
        'geomembrane_hdpe_1mm': { name: 'Геомембрана HDPE 1мм (м²)', unit: 'м²', price: 100, category: 'special_catalog' },
        'geomembrane_hdpe_1_5mm': { name: 'Геомембрана HDPE 1.5мм (м²)', unit: 'м²', price: 150, category: 'special_catalog' },
        'geomembrane_hdpe_2mm': { name: 'Геомембрана HDPE 2мм (м²)', unit: 'м²', price: 200, category: 'special_catalog' },
        'geotextile_100_m2': { name: 'Геотекстиль 100г/м² (м²)', unit: 'м²', price: 15, category: 'special_catalog' },
        'geotextile_150_m2': { name: 'Геотекстиль 150г/м² (м²)', unit: 'м²', price: 25, category: 'special_catalog' },
        'geotextile_200_m2': { name: 'Геотекстиль 200г/м² (м²)', unit: 'м²', price: 35, category: 'special_catalog' },
        'geotextile_300_m2': { name: 'Геотекстиль 300г/м² (м²)', unit: 'м²', price: 50, category: 'special_catalog' },
        'geotextile_400_m2': { name: 'Геотекстиль 400г/м² (м²)', unit: 'м²', price: 70, category: 'special_catalog' },
        'geodrain_8mm_m2': { name: 'Геодренаж мат 8мм (м²)', unit: 'м²', price: 200, category: 'special_catalog' },
        'geodrain_20mm_m2': { name: 'Геодренаж мат 20мм (м²)', unit: 'м²', price: 350, category: 'special_catalog' },
        'geomat_erosion_m2': { name: 'Геомат противоэрозионный (м²)', unit: 'м²', price: 100, category: 'special_catalog' },
        // Пенополистирол / экструдированный
        'xps_20mm_1200x600': { name: 'XPS 20мм (1200×600)', unit: 'лист', price: 100, category: 'special_catalog' },
        'xps_30mm_1200x600': { name: 'XPS 30мм (1200×600)', unit: 'лист', price: 150, category: 'special_catalog' },
        'xps_50mm_1200x600': { name: 'XPS 50мм (1200×600)', unit: 'лист', price: 250, category: 'special_catalog' },
        'xps_80mm_1200x600': { name: 'XPS 80мм (1200×600)', unit: 'лист', price: 400, category: 'special_catalog' },
        'xps_100mm_1200x600': { name: 'XPS 100мм (1200×600)', unit: 'лист', price: 500, category: 'special_catalog' },
        'eps_25_50mm_1000x500': { name: 'ПСБ-С-25 50мм (1000×500)', unit: 'лист', price: 50, category: 'special_catalog' },
        'eps_25_100mm_1000x500': { name: 'ПСБ-С-25 100мм (1000×500)', unit: 'лист', price: 100, category: 'special_catalog' },
        'eps_35_50mm_1000x500': { name: 'ПСБ-С-35 50мм (1000×500)', unit: 'лист', price: 80, category: 'special_catalog' },
        'eps_35_100mm_1000x500': { name: 'ПСБ-С-35 100мм (1000×500)', unit: 'лист', price: 150, category: 'special_catalog' },
        // PIR-плиты
        'pir_30mm_1200x600': { name: 'PIR-плита 30мм (1200×600)', unit: 'лист', price: 300, category: 'special_catalog' },
        'pir_50mm_1200x600': { name: 'PIR-плита 50мм (1200×600)', unit: 'лист', price: 450, category: 'special_catalog' },
        'pir_80mm_1200x600': { name: 'PIR-плита 80мм (1200×600)', unit: 'лист', price: 650, category: 'special_catalog' },
        'pir_100mm_1200x600': { name: 'PIR-плита 100мм (1200×600)', unit: 'лист', price: 800, category: 'special_catalog' },
        // Стеклопластиковая арматура
        'gfrp_rebar_4mm': { name: 'Арматура стеклопластиковая Ø4мм', unit: 'м.п.', price: 10, category: 'special_catalog' },
        'gfrp_rebar_6mm': { name: 'Арматура стеклопластиковая Ø6мм', unit: 'м.п.', price: 15, category: 'special_catalog' },
        'gfrp_rebar_8mm': { name: 'Арматура стеклопластиковая Ø8мм', unit: 'м.п.', price: 22, category: 'special_catalog' },
        'gfrp_rebar_10mm': { name: 'Арматура стеклопластиковая Ø10мм', unit: 'м.п.', price: 30, category: 'special_catalog' },
        'gfrp_rebar_12mm': { name: 'Арматура стеклопластиковая Ø12мм', unit: 'м.п.', price: 45, category: 'special_catalog' },
        'gfrp_mesh_100x100_3mm': { name: 'Сетка стекловолоконная 100×100мм', unit: 'м²', price: 100, category: 'special_catalog' },
        // Стеклохолст / стеклосетка
        'fiberglass_mesh_5x5_160': { name: 'Сетка стеклотканевая 5×5мм 160г/м²', unit: 'м²', price: 20, category: 'special_catalog' },
        'fiberglass_mesh_5x5_145': { name: 'Сетка стеклотканевая 5×5мм 145г/м²', unit: 'м²', price: 15, category: 'special_catalog' },
        'fiberglass_mesh_10x10_115': { name: 'Сетка стеклотканевая 10×10мм 115г/м²', unit: 'м²', price: 10, category: 'special_catalog' },
        'glass_veil_40_m2': { name: 'Стеклохолст «паутинка» 40г/м²', unit: 'м²', price: 25, category: 'special_catalog' },
        'glass_veil_50_m2': { name: 'Стеклохолст «паутинка» 50г/м²', unit: 'м²', price: 30, category: 'special_catalog' },
        // Фасадный крепёж
        'facade_anchor_10x120': { name: 'Тарельчатый дюбель 10×120мм', unit: 'шт', price: 5, category: 'special_catalog' },
        'facade_anchor_10x140': { name: 'Тарельчатый дюбель 10×140мм', unit: 'шт', price: 6, category: 'special_catalog' },
        'facade_anchor_10x160': { name: 'Тарельчатый дюбель 10×160мм', unit: 'шт', price: 7, category: 'special_catalog' },
        'facade_anchor_10x200': { name: 'Тарельчатый дюбель 10×200мм', unit: 'шт', price: 10, category: 'special_catalog' },
        'facade_bracket_l_150': { name: 'Кронштейн фасадный L 150мм', unit: 'шт', price: 50, category: 'special_catalog' },
        'facade_bracket_l_200': { name: 'Кронштейн фасадный L 200мм', unit: 'шт', price: 60, category: 'special_catalog' },
        'facade_bracket_l_250': { name: 'Кронштейн фасадный L 250мм', unit: 'шт', price: 80, category: 'special_catalog' },
        // Полимерные мембраны кровельные
        'pvc_membrane_1_2mm_m2': { name: 'ПВХ-мембрана кровельная 1.2мм (м²)', unit: 'м²', price: 200, category: 'special_catalog' },
        'pvc_membrane_1_5mm_m2': { name: 'ПВХ-мембрана кровельная 1.5мм (м²)', unit: 'м²', price: 260, category: 'special_catalog' },
        'tpo_membrane_1_2mm_m2': { name: 'ТПО-мембрана кровельная 1.2мм (м²)', unit: 'м²', price: 250, category: 'special_catalog' },
        'tpo_membrane_1_5mm_m2': { name: 'ТПО-мембрана кровельная 1.5мм (м²)', unit: 'м²', price: 320, category: 'special_catalog' },
        'epdm_membrane_1_2mm_m2': { name: 'ЭПДМ-мембрана кровельная 1.2мм (м²)', unit: 'м²', price: 300, category: 'special_catalog' },
        // Теплоизоляция труб
        'pipe_insul_18x13_2m': { name: 'Изоляция трубная Ø18×13мм (2м)', unit: 'шт', price: 20, category: 'special_catalog' },
        'pipe_insul_22x13_2m': { name: 'Изоляция трубная Ø22×13мм (2м)', unit: 'шт', price: 25, category: 'special_catalog' },
        'pipe_insul_28x13_2m': { name: 'Изоляция трубная Ø28×13мм (2м)', unit: 'шт', price: 30, category: 'special_catalog' },
        'pipe_insul_35x13_2m': { name: 'Изоляция трубная Ø35×13мм (2м)', unit: 'шт', price: 35, category: 'special_catalog' },
        'pipe_insul_42x13_2m': { name: 'Изоляция трубная Ø42×13мм (2м)', unit: 'шт', price: 40, category: 'special_catalog' },
        'pipe_insul_54x13_2m': { name: 'Изоляция трубная Ø54×13мм (2м)', unit: 'шт', price: 50, category: 'special_catalog' },
        'pipe_insul_76x13_2m': { name: 'Изоляция трубная Ø76×13мм (2м)', unit: 'шт', price: 70, category: 'special_catalog' },
        'pipe_insul_110x13_2m': { name: 'Изоляция трубная Ø110×13мм (2м)', unit: 'шт', price: 100, category: 'special_catalog' },
        // Добавки для бетона
        'concrete_plasticizer_10l': { name: 'Пластификатор бетона (10л)', unit: 'шт', price: 500, category: 'special_catalog' },
        'concrete_antifreeze_10l': { name: 'Противоморозная добавка (10л)', unit: 'шт', price: 600, category: 'special_catalog' },
        'concrete_accelerator_10l': { name: 'Ускоритель набора прочности (10л)', unit: 'шт', price: 700, category: 'special_catalog' },
        'concrete_fiber_pp_1kg': { name: 'Фибра полипропиленовая (1кг)', unit: 'шт', price: 100, category: 'special_catalog' },
        'concrete_fiber_steel_25kg': { name: 'Фибра стальная (25кг)', unit: 'шт', price: 2000, category: 'special_catalog' },
        'concrete_pigment_1kg': { name: 'Пигмент для бетона (1кг)', unit: 'шт', price: 200, category: 'special_catalog' }
    };
})();
