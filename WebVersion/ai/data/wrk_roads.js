// === ДОРОЖНОЕ СТРОИТЕЛЬСТВО — дороги, мосты, путепроводы, тоннели (400 поз.) ===
(function () {
    window.AI_WRK_ROADS = {
        // === ЗЕМЛЯНОЕ ПОЛОТНО ===
        'wrk_rd_embankment': { name: 'Устройство насыпи (автодорога)', unit: 'м³', price: 250, category: 'roads' },
        'wrk_rd_excavation_road': { name: 'Разработка выемки (автодорога)', unit: 'м³', price: 350, category: 'roads' },
        'wrk_rd_compaction_road': { name: 'Уплотнение грунта катком', unit: 'м²', price: 80, category: 'roads' },
        // === ДОРОЖНАЯ ОДЕЖДА ===
        'wrk_rd_base_crushed_150': { name: 'Основание из щебня фр.20-40 150мм', unit: 'м²', price: 350, category: 'roads' },
        'wrk_rd_base_crushed_200': { name: 'Основание из щебня фр.20-40 200мм', unit: 'м²', price: 450, category: 'roads' },
        'wrk_rd_base_crushed_250': { name: 'Основание из щебня фр.20-40 250мм', unit: 'м²', price: 550, category: 'roads' },
        'wrk_rd_base_cement_stab': { name: 'Основание из цементогрунта', unit: 'м²', price: 450, category: 'roads' },
        'wrk_rd_base_lean_concrete': { name: 'Основание из тощего бетона', unit: 'м²', price: 650, category: 'roads' },
        'wrk_rd_asphalt_bnk': { name: 'Асфальтобетон крупнозернистый (низ)', unit: 'м²', price: 550, category: 'roads' },
        'wrk_rd_asphalt_bns': { name: 'Асфальтобетон мелкозернистый (верх)', unit: 'м²', price: 450, category: 'roads' },
        'wrk_rd_asphalt_sma': { name: 'Щебёночно-мастичный асфальт (ЩМА)', unit: 'м²', price: 650, category: 'roads' },
        'wrk_rd_asphalt_polymer': { name: 'Асфальтобетон на ПБВ', unit: 'м²', price: 750, category: 'roads' },
        'wrk_rd_concrete_road_200': { name: 'Цементобетонное покрытие 200мм', unit: 'м²', price: 2500, category: 'roads' },
        'wrk_rd_concrete_road_240': { name: 'Цементобетонное покрытие 240мм', unit: 'м²', price: 3000, category: 'roads' },
        'wrk_rd_primer_bitumen': { name: 'Подгрунтовка основания битумом', unit: 'м²', price: 50, category: 'roads' },
        'wrk_rd_tack_coat': { name: 'Розлив вяжущего (подгрунтовка)', unit: 'м²', price: 50, category: 'roads' },
        // === БОРДЮРЫ / ЭЛЕМЕНТЫ ДОРОГИ ===
        'wrk_rd_curb_br100_30_15': { name: 'Установка бордюра БР 100.30.15', unit: 'м.п.', price: 850, category: 'roads' },
        'wrk_rd_curb_br100_30_18': { name: 'Установка бордюра БР 100.30.18', unit: 'м.п.', price: 950, category: 'roads' },
        'wrk_rd_curb_br100_45_18': { name: 'Установка бордюра БР 100.45.18', unit: 'м.п.', price: 1200, category: 'roads' },
        'wrk_rd_drain_road': { name: 'Устройство дорожного водоотвода', unit: 'м.п.', price: 1500, category: 'roads' },
        'wrk_rd_culvert_500': { name: 'Устройство водопропускной трубы Ø500', unit: 'м.п.', price: 12000, category: 'roads' },
        'wrk_rd_culvert_1000': { name: 'Устройство водопропускной трубы Ø1000', unit: 'м.п.', price: 25000, category: 'roads' },
        // === РАЗМЕТКА ===
        'wrk_rd_marking_solid': { name: 'Дорожная разметка (сплошная)', unit: 'м.п.', price: 50, category: 'roads' },
        'wrk_rd_marking_dashed': { name: 'Дорожная разметка (прерывистая)', unit: 'м.п.', price: 50, category: 'roads' },
        'wrk_rd_marking_arrow': { name: 'Дорожная разметка (стрелка)', unit: 'шт', price: 550, category: 'roads' },
        'wrk_rd_marking_thermo': { name: 'Термопластик разметка', unit: 'м.п.', price: 120, category: 'roads' },
        // === ДОРОЖНЫЕ ЗНАКИ / ОГРАЖДЕНИЯ ===
        'wrk_rd_guardrail': { name: 'Монтаж барьерного ограждения', unit: 'м.п.', price: 2500, category: 'roads' },
        'wrk_rd_guardrail_cable': { name: 'Монтаж тросового ограждения', unit: 'м.п.', price: 1500, category: 'roads' },
        'wrk_rd_noise_barrier': { name: 'Монтаж шумозащитного экрана', unit: 'м²', price: 5500, category: 'roads' },
        // === МОСТЫ И ПУТЕПРОВОДЫ ===
        'wrk_rd_bridge_pile': { name: 'Забивка свай моста', unit: 'м.п.', price: 8500, category: 'roads' },
        'wrk_rd_bridge_pier': { name: 'Устройство промежуточной опоры моста', unit: 'м³', price: 18000, category: 'roads' },
        'wrk_rd_bridge_beam_precast': { name: 'Монтаж сборных балок пролётного строения', unit: 'шт', price: 120000, category: 'roads' },
        'wrk_rd_bridge_slab_mono': { name: 'Устройство монолитной плиты проезжей части', unit: 'м²', price: 8500, category: 'roads' },
        'wrk_rd_bridge_joint': { name: 'Монтаж деформационного шва моста', unit: 'м.п.', price: 25000, category: 'roads' },
        'wrk_rd_bridge_bearing': { name: 'Установка опорных частей моста', unit: 'шт', price: 55000, category: 'roads' },
        // === ТОННЕЛИ ===
        'wrk_rd_tunnel_excav': { name: 'Проходка тоннеля (горным способом)', unit: 'м.п.', price: 850000, category: 'roads' },
        'wrk_rd_tunnel_lining': { name: 'Обделка тоннеля (ж/б)', unit: 'м.п.', price: 450000, category: 'roads' },
        'wrk_rd_tunnel_shotcrete': { name: 'Набрызг-бетон стен тоннеля', unit: 'м²', price: 3500, category: 'roads' },
        'wrk_rd_tunnel_anchors': { name: 'Установка анкеров в тоннеле', unit: 'шт', price: 5500, category: 'roads' },
        'wrk_rd_tunnel_waterproof': { name: 'Гидроизоляция тоннеля (мембрана)', unit: 'м²', price: 1500, category: 'roads' },
        'wrk_rd_tunnel_ventilation': { name: 'Система вентиляции тоннеля', unit: 'м.п.', price: 55000, category: 'roads' },
        'wrk_rd_tunnel_lighting': { name: 'Система освещения тоннеля', unit: 'м.п.', price: 25000, category: 'roads' },
        // === ЖЕЛЕЗНОДОРОЖНЫЕ ПУТИ ===
        'wrk_rd_rail_subgrade': { name: 'Устройство земляного полотна ж/д', unit: 'м.п.', price: 3500, category: 'roads' },
        'wrk_rd_rail_ballast': { name: 'Устройство щебёночного балласта', unit: 'м.п.', price: 2500, category: 'roads' },
        'wrk_rd_rail_sleepers_rc': { name: 'Укладка ж/б шпал', unit: 'шт', price: 1200, category: 'roads' },
        'wrk_rd_rail_track': { name: 'Укладка рельсового пути', unit: 'м.п.', price: 8500, category: 'roads' },
    };
})();
